import { createFileRoute, Link, notFound, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, ShieldCheck, Trash2 } from "lucide-react";
import { BLUEPRINTS } from "@/lib/furniture";
import { FloorPlan } from "@/components/FloorPlan";

export const Route = createFileRoute("/quote/$type")({
  beforeLoad: ({ params }) => {
    if (!["house", "apartment", "office"].includes(params.type)) {
      throw notFound();
    }
  },
  head: ({ params }) => ({
    meta: [
      {
        title: `Build your ${params.type} quote — The Boys`,
      },
      {
        name: "description",
        content: `Tap furniture on a top-down floor plan to build a live ${params.type} moving quote with The Boys.`,
      },
    ],
  }),
  component: QuotePage,
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="font-display text-4xl uppercase">Wrong floor</h1>
        <Link to="/" className="mt-4 inline-block text-primary underline">
          Back to base
        </Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen grid place-items-center bg-background text-foreground p-6">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl uppercase mb-2">Something broke</h1>
        <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
        <Link to="/" className="text-primary underline">
          Back to base
        </Link>
      </div>
    </div>
  ),
});

const BASE_FEE = 95;

function QuotePage() {
  const { type } = useParams({ from: "/quote/$type" });
  const blueprint = BLUEPRINTS[type];
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sqm, setSqm] = useState<number>(blueprint.defaultSqm);
  const [extras, setExtras] = useState<{ cleaning: boolean; handyman: boolean }>({
    cleaning: false,
    handyman: false,
  });

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const { volume, itemPrice, items } = useMemo(() => {
    let vol = 0;
    let price = 0;
    const list: { id: string; label: string; price: number }[] = [];
    for (const room of blueprint.rooms) {
      for (const it of room.items) {
        if (selected.has(it.id)) {
          vol += it.volume;
          price += it.price;
          list.push({ id: it.id, label: it.label, price: it.price });
        }
      }
    }
    return { volume: vol, itemPrice: price, items: list };
  }, [selected, blueprint]);

  const sqmFee = Math.round(sqm * 1.4);
  const cleaningFee = extras.cleaning ? Math.round(sqm * 3.2) + 80 : 0;
  const handymanFee = extras.handyman ? 220 : 0;
  const total = BASE_FEE + sqmFee + itemPrice + cleaningFee + handymanFee;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Back
          </Link>
          <div className="text-center">
            <div className="font-display text-lg leading-none uppercase">
              {blueprint.title}
            </div>
            <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
              {blueprint.tagline}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
              Live total
            </div>
            <div className="font-display text-lg text-primary leading-none">
              £{total.toLocaleString()}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 grid lg:grid-cols-12 gap-6">
        {/* Floor plan */}
        <section className="lg:col-span-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary mb-1">
                Step 02 · Tap items to include
              </div>
              <h1 className="font-display text-2xl md:text-3xl uppercase leading-none">
                The floor plan
              </h1>
            </div>
            <div className="text-right">
              <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
                Estimated volume
              </div>
              <div className="font-display text-xl">{volume.toFixed(1)} m³</div>
            </div>
          </div>

          <div className="relative aspect-[4/3] md:aspect-[3/2] w-full bg-card/30 border border-border rounded-md p-2">
            <FloorPlan
              blueprint={blueprint}
              selected={selected}
              onToggle={toggle}
            />
          </div>

          <p className="mt-3 text-[11px] text-muted-foreground font-mono uppercase tracking-wider">
            Tap a piece of furniture to add it · tap again to remove
          </p>

          {/* Size slider */}
          <div className="mt-6 bg-card border border-border p-5">
            <div className="flex items-end justify-between mb-3">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Property size
                </div>
                <div className="font-display text-2xl uppercase leading-none">
                  {sqm} m²
                </div>
              </div>
              <div className="text-[10px] font-mono text-muted-foreground">
                {blueprint.minSqm}–{blueprint.maxSqm} m²
              </div>
            </div>
            <input
              type="range"
              min={blueprint.minSqm}
              max={blueprint.maxSqm}
              value={sqm}
              onChange={(e) => setSqm(Number(e.target.value))}
              className="w-full accent-primary"
              aria-label="Property size in square meters"
            />
          </div>
        </section>

        {/* Sidebar: quote */}
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-20 space-y-4">
            <div className="bg-card border border-border p-5">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                <div className="font-display text-xl uppercase leading-none">
                  Your Quote
                </div>
                <button
                  onClick={() => setSelected(new Set())}
                  disabled={selected.size === 0}
                  className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 className="size-3" />
                  Clear
                </button>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <Row label={`Base fee · ${blueprint.title}`} value={`£${BASE_FEE}`} />
                <Row label={`Size · ${sqm} m²`} value={`£${sqmFee}`} />
                <Row
                  label={`Inventory · ${selected.size} item${selected.size === 1 ? "" : "s"}`}
                  value={`£${itemPrice}`}
                />
                {extras.cleaning && (
                  <Row label="End-of-tenancy clean" value={`£${cleaningFee}`} />
                )}
                {extras.handyman && (
                  <Row label="Handyman & touch-ups" value={`£${handymanFee}`} />
                )}
              </div>

              <div className="pt-4 border-t border-border flex items-baseline justify-between">
                <span className="text-xs font-bold uppercase tracking-widest">
                  Estimated total
                </span>
                <span className="font-display text-3xl text-primary">
                  £{total.toLocaleString()}
                </span>
              </div>

              {/* Extras */}
              <div className="mt-5 space-y-2">
                <ExtraToggle
                  label="Add end-of-tenancy clean"
                  enabled={extras.cleaning}
                  onToggle={() =>
                    setExtras((e) => ({ ...e, cleaning: !e.cleaning }))
                  }
                />
                <ExtraToggle
                  label="Add handyman & painting"
                  enabled={extras.handyman}
                  onToggle={() =>
                    setExtras((e) => ({ ...e, handyman: !e.handyman }))
                  }
                />
              </div>

              <button
                disabled={selected.size === 0}
                className="mt-6 w-full h-12 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-xs hover:bg-blood transition-colors disabled:opacity-40 disabled:cursor-not-allowed skew-tag"
                style={selected.size > 0 ? { boxShadow: "var(--shadow-hero)" } : undefined}
              >
                <span>Send to The Boys</span>
              </button>

              <p className="mt-3 inline-flex items-start gap-2 text-[10px] text-muted-foreground leading-relaxed">
                <ShieldCheck className="size-3.5 shrink-0 mt-0.5 text-accent" />
                <span>
                  Your inventory and address details are encrypted in transit. We'll
                  confirm by call before any booking is locked in.
                </span>
              </p>
            </div>

            {items.length > 0 && (
              <div className="bg-card border border-border p-5">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
                  Items selected
                </div>
                <ul className="space-y-1.5 text-xs max-h-60 overflow-y-auto">
                  {items.map((it) => (
                    <li
                      key={it.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="truncate">{it.label}</span>
                      <span className="font-mono text-muted-foreground">
                        £{it.price}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function ExtraToggle({
  label,
  enabled,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      className={`w-full flex items-center justify-between gap-3 p-3 border text-xs font-bold uppercase tracking-wider text-left transition-colors ${
        enabled
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/40"
      }`}
    >
      <span>{label}</span>
      <span
        className={`inline-block w-8 h-4 relative rounded-full transition-colors ${
          enabled ? "bg-primary" : "bg-border"
        }`}
      >
        <span
          className={`absolute top-0.5 size-3 bg-bone rounded-full transition-all ${
            enabled ? "left-[18px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}
