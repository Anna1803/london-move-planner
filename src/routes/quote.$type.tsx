import { createFileRoute, Link, notFound, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, ShieldCheck, Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const PROPERTY_LABELS: Record<string, { title: string; tagline: string }> = {
  house: { title: "House move", tagline: "Townhouse · Terrace · Detached" },
  apartment: { title: "Apartment move", tagline: "Studio · Flat · Maisonette" },
  office: { title: "Office move", tagline: "Studios · Suites · Floors" },
};

const formSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(100),
  last_name: z.string().trim().min(1, "Surname is required").max(100),
  address: z.string().trim().min(3, "Address is required").max(500),
  packaging_required: z.boolean(),
  end_of_tenancy_cleaning: z.boolean(),
  handyman_services: z.boolean(),
  move_date: z.string().min(1, "Pick a date"),
  notes: z.string().trim().max(2000).optional(),
});

export const Route = createFileRoute("/quote/$type")({
  beforeLoad: ({ params }) => {
    if (!["house", "apartment", "office"].includes(params.type)) {
      throw notFound();
    }
  },
  head: ({ params }) => ({
    meta: [
      { title: `Request a ${params.type} move quote — The Boys` },
      {
        name: "description",
        content: `Tell us a few details and The Boys will come back with a tailored ${params.type} moving quote.`,
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
  const meta = PROPERTY_LABELS[type];

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [packaging, setPackaging] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [handyman, setHandyman] = useState(false);
  const [moveDate, setMoveDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = formSchema.safeParse({
      first_name: firstName,
      last_name: lastName,
      address,
      packaging_required: packaging,
      end_of_tenancy_cleaning: cleaning,
      handyman_services: handyman,
      move_date: moveDate,
      notes: notes || undefined,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }

    setSubmitting(true);
    const { error: insertError } = await supabase
      .from("quote_requests")
      .insert({ ...parsed.data, property_type: type as "house" | "apartment" | "office" });
    setSubmitting(false);

    if (insertError) {
      setError("Couldn't send your request. Please try again.");
      return;
    }
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Back
          </Link>
          <div className="text-center">
            <div className="font-display text-lg leading-none uppercase">{meta.title}</div>
            <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
              {meta.tagline}
            </div>
          </div>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-8 py-10">
        {submitted ? (
          <div className="bg-card border border-border p-8 text-center">
            <div className="mx-auto mb-4 grid size-12 place-items-center bg-primary text-primary-foreground">
              <Check className="size-6" />
            </div>
            <h1 className="font-display text-3xl uppercase leading-none mb-2">Request sent</h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              The Boys have your details. We'll be in touch shortly with a tailored quote.
            </p>
            <Link
              to="/"
              className="mt-6 inline-block text-xs font-bold uppercase tracking-widest text-primary underline"
            >
              Back to home
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary mb-1">
                Step 02 · Your details
              </div>
              <h1 className="font-display text-3xl md:text-4xl uppercase leading-none">
                Request your quote
              </h1>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                Fill in the basics and we'll come back with a price.
              </p>
            </div>

            <form onSubmit={onSubmit} className="bg-card border border-border p-6 md:p-8 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="First name">
                  <input
                    required
                    maxLength={100}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="input"
                  />
                </Field>
                <Field label="Surname">
                  <input
                    required
                    maxLength={100}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="input"
                  />
                </Field>
              </div>

              <Field label="Address">
                <input
                  required
                  maxLength={500}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, city, postcode"
                  className="input"
                />
              </Field>

              <Field label="Preferred move date">
                <input
                  required
                  type="date"
                  value={moveDate}
                  onChange={(e) => setMoveDate(e.target.value)}
                  className="input"
                />
              </Field>

              <div className="space-y-2">
                <span className="block text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground mb-1.5">
                  Add-on services
                </span>
                <AddonCheckbox
                  checked={packaging}
                  onChange={setPackaging}
                  title="I need packaging for everything"
                  description="Boxes, bubble wrap, tape and the crew packing it for you."
                />
                <AddonCheckbox
                  checked={cleaning}
                  onChange={setCleaning}
                  title="End-of-tenancy cleaning"
                  description="Deep clean after the move so you get your deposit back."
                />
                <AddonCheckbox
                  checked={handyman}
                  onChange={setHandyman}
                  title="Handyman services"
                  description="Furniture assembly, mounting, small repairs at the new place."
                />
              </div>

              <Field label="Anything else? (optional)">
                <textarea
                  rows={4}
                  maxLength={2000}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Access, parking, extra stops, fragile items…"
                  className="input resize-none"
                />
              </Field>

              {error && (
                <div className="text-xs font-mono uppercase tracking-widest text-destructive">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-xs hover:bg-blood transition-colors disabled:opacity-40 disabled:cursor-not-allowed skew-tag inline-flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Sending…
                  </>
                ) : (
                  <>Send to The Boys</>
                )}
              </button>

              <p className="inline-flex items-start gap-2 text-[10px] text-muted-foreground leading-relaxed">
                <ShieldCheck className="size-3.5 shrink-0 mt-0.5 text-accent" />
                <span>
                  Your details stay private and are only used to send you a quote.
                </span>
              </p>
            </form>
          </>
        )}
      </main>

      <style>{`
        .input {
          width: 100%;
          background: hsl(var(--background) / 0.5);
          border: 1px solid hsl(var(--border));
          padding: 0.65rem 0.85rem;
          color: hsl(var(--foreground));
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s;
        }
        .input:focus { border-color: hsl(var(--primary)); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function AddonCheckbox({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <label className="flex items-start gap-3 p-4 border border-border bg-background/40 cursor-pointer hover:border-foreground/40 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 accent-primary"
      />
      <span>
        <span className="block text-sm font-bold uppercase tracking-wider">{title}</span>
        <span className="block text-xs text-muted-foreground mt-1">{description}</span>
      </span>
    </label>
  );
}
