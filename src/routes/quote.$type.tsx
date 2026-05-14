import { createFileRoute, Link, notFound, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { BLUEPRINTS, type FurnitureItem } from "@/lib/furniture";
import { RoomScene } from "@/components/RoomScene";

export const Route = createFileRoute("/quote/$type")({
  beforeLoad: ({ params }) => {
    if (!["house", "apartment", "office"].includes(params.type)) {
      throw notFound();
    }
  },
  head: ({ params }) => ({
    meta: [
      { title: `Build your ${params.type} quote — The Boys` },
      {
        name: "description",
        content: `Walk through every room and tell us what's inside. We'll come back with a tailored quote.`,
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

function QuotePage() {
  const { type } = useParams({ from: "/quote/$type" });
  const blueprint = BLUEPRINTS[type];

  // Pre-select the items each room marks as required
  const [selected, setSelected] = useState<Set<string>>(() => {
    const init = new Set<string>();
    blueprint.rooms.forEach((r) =>
      r.catalog.forEach((it) => {
        if (it.required) init.add(`${r.id}:${it.id}`);
      }),
    );
    return init;
  });

  const [sqm, setSqm] = useState<number>(blueprint.defaultSqm);
  const [extras, setExtras] = useState<{ cleaning: boolean; handyman: boolean }>({
    cleaning: false,
    handyman: false,
  });

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const selectedCount = useMemo(() => {
    let count = 0;
    for (const room of blueprint.rooms) {
      for (const it of room.catalog) {
        if (selected.has(`${room.id}:${it.id}`)) count += 1;
      }
    }
    return count;
  }, [selected, blueprint]);

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
              Items picked
            </div>
            <div className="font-display text-lg text-primary leading-none">
              {selectedCount}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 grid lg:grid-cols-12 gap-6">
        {/* Rooms / catalog */}
        <section className="lg:col-span-8 space-y-6">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary mb-1">
              Step 02 · Walk through each room
            </div>
            <h1 className="font-display text-2xl md:text-3xl uppercase leading-none">
              Inventory
            </h1>
            <p className="mt-2 text-xs text-muted-foreground max-w-md">
              The scene shows the statement pieces we expect in each room. The
              checklist below catches anything else you've got — tick whatever
              applies.
            </p>
          </div>

          {/* Property size */}
          <div className="bg-card border border-border p-5">
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

          {/* Rooms */}
          {blueprint.rooms.map((room) => (
            <RoomCard
              key={room.id}
              roomId={room.id}
              name={room.name}
              catalog={room.catalog}
              selected={selected}
              onToggle={toggle}
            />
          ))}
        </section>

        {/* Sidebar: summary */}
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-20 space-y-4">
            <div className="bg-card border border-border p-5">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                <div className="font-display text-xl uppercase leading-none">
                  Your Brief
                </div>
                <button
                  onClick={() => setSelected(new Set())}
                  disabled={selectedCount === 0}
                  className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 className="size-3" />
                  Clear
                </button>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <Row label={blueprint.title} value={`${sqm} m²`} />
                <Row
                  label="Items selected"
                  value={`${selectedCount}`}
                />
                <Row
                  label="Rooms"
                  value={`${blueprint.rooms.length}`}
                />
              </div>

              {/* Extras */}
              <div className="pt-4 border-t border-border">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                  Add services
                </div>
                <div className="space-y-2">
                  <ExtraToggle
                    label="End-of-tenancy clean"
                    enabled={extras.cleaning}
                    onToggle={() =>
                      setExtras((e) => ({ ...e, cleaning: !e.cleaning }))
                    }
                  />
                  <ExtraToggle
                    label="Handyman & painting"
                    enabled={extras.handyman}
                    onToggle={() =>
                      setExtras((e) => ({ ...e, handyman: !e.handyman }))
                    }
                  />
                </div>
              </div>

              <button
                disabled={selectedCount === 0}
                className="mt-6 w-full h-12 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-xs hover:bg-blood transition-colors disabled:opacity-40 disabled:cursor-not-allowed skew-tag"
                style={selectedCount > 0 ? { boxShadow: "var(--shadow-hero)" } : undefined}
              >
                <span>Send to The Boys</span>
              </button>

              <p className="mt-3 inline-flex items-start gap-2 text-[10px] text-muted-foreground leading-relaxed">
                <ShieldCheck className="size-3.5 shrink-0 mt-0.5 text-accent" />
                <span>
                  We'll review your brief and call you back with a tailored
                  quote. No card needed at this step.
                </span>
              </p>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function RoomCard({
  roomId,
  name,
  catalog,
  selected,
  onToggle,
}: {
  roomId: string;
  name: string;
  catalog: FurnitureItem[];
  selected: Set<string>;
  onToggle: (key: string) => void;
}) {
  const count = catalog.filter((it) => selected.has(`${roomId}:${it.id}`)).length;
  return (
    <div className="bg-card border border-border p-5">
      <div className="flex items-end justify-between mb-4 pb-3 border-b border-border">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
            Room
          </div>
          <div className="font-display text-xl uppercase leading-none">
            {name}
          </div>
        </div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {count} selected
        </div>
      </div>

      {/* Statement scene */}
      <div className="mb-4">
        <RoomScene roomId={roomId} />
      </div>

      <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground mb-2">
        Anything else? Tick what applies
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {catalog.map((it) => {
          const key = `${roomId}:${it.id}`;
          const on = selected.has(key);
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => onToggle(key)}
              aria-pressed={on}
              className={`group flex items-center justify-between gap-3 px-3 py-2.5 border text-left text-xs transition-colors ${
                on
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background/50 text-muted-foreground hover:text-foreground hover:border-foreground/40"
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <span
                  className={`shrink-0 inline-flex size-4 items-center justify-center border ${
                    on
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border bg-background"
                  }`}
                >
                  {on ? <Check className="size-3" /> : <Plus className="size-3 opacity-60" />}
                </span>
                <span className="truncate font-medium">{it.label}</span>
              </span>
            </button>
          );
        })}
      </div>
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
