import { createFileRoute, Link, notFound, useParams } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  ShieldCheck,
  Loader2,
  Calendar as CalendarIcon,
  Clock,
} from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const PROPERTY_LABELS: Record<string, { title: string; tagline: string }> = {
  house: { title: "House move", tagline: "Townhouse · Terrace · Detached" },
  apartment: { title: "Apartment move", tagline: "Studio · Flat · Maisonette" },
  office: { title: "Office move", tagline: "Studios · Suites · Floors" },
};

const nameRegex = /^[A-Za-zÀ-ÿ' -]+$/;
const phoneRegex = /^[+0-9 ()-]{5,30}$/;
const postcodeRegex = /^[A-Za-z0-9 -]{3,12}$/;
const numberRegex = /^[A-Za-z0-9/\- ]{1,20}$/;
const streetRegex = /^[A-Za-zÀ-ÿ0-9.,' -]{2,200}$/;

const formSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(100)
    .regex(nameRegex, "Letters only"),
  last_name: z
    .string()
    .trim()
    .min(1, "Surname is required")
    .max(100)
    .regex(nameRegex, "Letters only"),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().regex(phoneRegex, "Digits only, e.g. +44 7700 900000"),

  from_street: z.string().trim().regex(streetRegex, "Enter a valid street name"),
  from_number: z.string().trim().regex(numberRegex, "Enter a valid number"),
  from_postcode: z.string().trim().regex(postcodeRegex, "Enter a valid postcode"),

  to_street: z.string().trim().regex(streetRegex, "Enter a valid street name"),
  to_number: z.string().trim().regex(numberRegex, "Enter a valid number"),
  to_postcode: z.string().trim().regex(postcodeRegex, "Enter a valid postcode"),

  packaging_required: z.boolean(),
  end_of_tenancy_cleaning: z.boolean(),
  handyman_services: z.boolean(),
  move_date: z.string().min(1, "Pick a date"),
  preferred_time: z.string().min(1, "Pick a preferred time"),
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

const TIME_OPTIONS = [
  "Early morning (7–9am)",
  "Morning (9am–12pm)",
  "Afternoon (12–5pm)",
  "Evening (5–8pm)",
  "Flexible / any time",
];

function QuotePage() {
  const { type } = useParams({ from: "/quote/$type" });
  const meta = PROPERTY_LABELS[type];

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [fromStreet, setFromStreet] = useState("");
  const [fromNumber, setFromNumber] = useState("");
  const [fromPostcode, setFromPostcode] = useState("");
  const [toStreet, setToStreet] = useState("");
  const [toNumber, setToNumber] = useState("");
  const [toPostcode, setToPostcode] = useState("");

  const [packaging, setPackaging] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [handyman, setHandyman] = useState(false);
  const [moveDate, setMoveDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
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
      email,
      phone,
      from_street: fromStreet,
      from_number: fromNumber,
      from_postcode: fromPostcode,
      to_street: toStreet,
      to_number: toNumber,
      to_postcode: toPostcode,
      packaging_required: packaging,
      end_of_tenancy_cleaning: cleaning,
      handyman_services: handyman,
      move_date: moveDate,
      preferred_time: preferredTime,
      notes: notes || undefined,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }

    const d = parsed.data;
    const fromCombined = `${d.from_number} ${d.from_street}, ${d.from_postcode}`;
    const toCombined = `${d.to_number} ${d.to_street}, ${d.to_postcode}`;

    setSubmitting(true);
    const { error: insertError } = await supabase.from("quote_requests").insert({
      property_type: type as "house" | "apartment" | "office",
      first_name: d.first_name,
      last_name: d.last_name,
      email: d.email,
      phone: d.phone,
      moving_from_address: fromCombined,
      moving_to_address: toCombined,
      moving_from_street: d.from_street,
      moving_from_number: d.from_number,
      moving_from_postcode: d.from_postcode,
      moving_to_street: d.to_street,
      moving_to_number: d.to_number,
      moving_to_postcode: d.to_postcode,
      packaging_required: d.packaging_required,
      end_of_tenancy_cleaning: d.end_of_tenancy_cleaning,
      handyman_services: d.handyman_services,
      move_date: d.move_date,
      preferred_time: d.preferred_time,
      notes: d.notes,
    });
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
            <ArrowLeft className="size-3.5" /> Back
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
          <div className="bg-card border-2 border-primary p-8 text-center shadow-[var(--shadow-hero)]">
            <div className="mx-auto mb-4 grid size-12 place-items-center bg-accent text-accent-foreground">
              <Check className="size-6" />
            </div>
            <h1 className="font-display text-3xl uppercase leading-none mb-2">Request sent</h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              The Boys have your details. We'll be in touch shortly with a tailored quote.
            </p>
            <Link
              to="/"
              className="mt-6 inline-block text-xs font-bold uppercase tracking-widest text-accent underline"
            >
              Back to home
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-accent mb-1">
                Step 02 · Your details
              </div>
              <h1 className="font-display text-3xl md:text-4xl uppercase leading-none">
                Request your <span className="text-primary">quote</span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                Fill in the basics and we'll come back with a price.
              </p>
            </div>

            <form
              onSubmit={onSubmit}
              className="bg-card border-2 border-border p-6 md:p-8 space-y-6 shadow-[var(--shadow-pop)]"
            >
              <SectionHeader>Who you are</SectionHeader>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="First name">
                  <input
                    required
                    maxLength={100}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    pattern="[A-Za-zÀ-ÿ' \-]+"
                    title="Letters only"
                    className="qinput"
                  />
                </Field>
                <Field label="Surname">
                  <input
                    required
                    maxLength={100}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    pattern="[A-Za-zÀ-ÿ' \-]+"
                    title="Letters only"
                    className="qinput"
                  />
                </Field>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Email address">
                  <input
                    required
                    type="email"
                    maxLength={255}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="qinput"
                  />
                </Field>
                <Field label="Phone number">
                  <input
                    required
                    type="tel"
                    inputMode="tel"
                    maxLength={30}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^+0-9 ()-]/g, ""))}
                    pattern="[+0-9 ()-]{5,30}"
                    title="Digits, spaces, +, (), - only"
                    placeholder="+44 7700 900000"
                    className="qinput"
                  />
                </Field>
              </div>

              <div className="pt-2">
                <SectionHeader accent="primary">Moving from</SectionHeader>
                <div className="grid sm:grid-cols-[1fr_120px_140px] gap-4">
                  <Field label="Street name">
                    <input
                      required
                      maxLength={200}
                      value={fromStreet}
                      onChange={(e) => setFromStreet(e.target.value)}
                      placeholder="Baker Street"
                      className="qinput"
                    />
                  </Field>
                  <Field label="Number">
                    <input
                      required
                      maxLength={20}
                      value={fromNumber}
                      onChange={(e) => setFromNumber(e.target.value)}
                      placeholder="221B"
                      className="qinput"
                    />
                  </Field>
                  <Field label="Postcode">
                    <input
                      required
                      maxLength={12}
                      value={fromPostcode}
                      onChange={(e) => setFromPostcode(e.target.value.toUpperCase())}
                      pattern="[A-Za-z0-9 \-]{3,12}"
                      placeholder="NW1 6XE"
                      className="qinput"
                    />
                  </Field>
                </div>
              </div>

              <div>
                <SectionHeader accent="accent">Moving to</SectionHeader>
                <div className="grid sm:grid-cols-[1fr_120px_140px] gap-4">
                  <Field label="Street name">
                    <input
                      required
                      maxLength={200}
                      value={toStreet}
                      onChange={(e) => setToStreet(e.target.value)}
                      placeholder="Abbey Road"
                      className="qinput"
                    />
                  </Field>
                  <Field label="Number">
                    <input
                      required
                      maxLength={20}
                      value={toNumber}
                      onChange={(e) => setToNumber(e.target.value)}
                      placeholder="3"
                      className="qinput"
                    />
                  </Field>
                  <Field label="Postcode">
                    <input
                      required
                      maxLength={12}
                      value={toPostcode}
                      onChange={(e) => setToPostcode(e.target.value.toUpperCase())}
                      pattern="[A-Za-z0-9 \-]{3,12}"
                      placeholder="NW8 9AY"
                      className="qinput"
                    />
                  </Field>
                </div>
              </div>

              <div className="pt-2">
                <SectionHeader>When</SectionHeader>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Preferred move date">
                    <div className="relative">
                      <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-5 text-accent" />
                      <input
                        required
                        type="date"
                        value={moveDate}
                        onChange={(e) => setMoveDate(e.target.value)}
                        className="qinput pl-10 qdate"
                      />
                    </div>
                  </Field>
                  <Field label="Preferred time">
                    <div className="relative">
                      <Clock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-5 text-accent" />
                      <select
                        required
                        value={preferredTime}
                        onChange={(e) => setPreferredTime(e.target.value)}
                        className="qinput qselect pl-10"
                      >
                        <option value="">Pick a time…</option>
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </Field>
                </div>
              </div>

              <div>
                <SectionHeader>Add-on services</SectionHeader>
                <div className="space-y-2">
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
              </div>

              <Field label="Anything else? (optional)">
                <textarea
                  rows={4}
                  maxLength={2000}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Access, parking, extra stops, fragile items…"
                  className="qinput resize-none"
                />
              </Field>

              {error && (
                <div className="text-xs font-mono uppercase tracking-widest text-destructive border border-destructive/40 bg-destructive/10 p-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-xs hover:bg-blood hover:shadow-[var(--shadow-hero)] cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed skew-tag inline-flex items-center justify-center gap-2 border-2 border-accent"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Sending…
                  </>
                ) : (
                  <>Send to The Boys →</>
                )}
              </button>

              <p className="inline-flex items-start gap-2 text-[10px] text-muted-foreground leading-relaxed">
                <ShieldCheck className="size-3.5 shrink-0 mt-0.5 text-accent" />
                <span>Your details stay private and are only used to send you a quote.</span>
              </p>
            </form>
          </>
        )}
      </main>

      <style>{`
        .qinput {
          width: 100%;
          background: oklch(0.10 0.012 25 / 0.85);
          border: 1.5px solid var(--color-border);
          padding: 0.7rem 0.9rem;
          color: var(--color-foreground);
          font-size: 0.95rem;
          outline: none;
          transition: all 0.15s;
          border-radius: 2px;
        }
        .qinput::placeholder { color: oklch(0.55 0.02 70); }
        .qinput:hover { border-color: oklch(0.85 0.18 90 / 0.5); }
        .qinput:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px oklch(0.58 0.22 27 / 0.25);
          background: oklch(0.12 0.012 25);
        }
        .qinput:invalid:not(:placeholder-shown) {
          border-color: var(--color-destructive);
        }
        .qselect {
          appearance: none;
          background-image: linear-gradient(45deg, transparent 50%, oklch(0.85 0.18 90) 50%), linear-gradient(135deg, oklch(0.85 0.18 90) 50%, transparent 50%);
          background-position: calc(100% - 18px) center, calc(100% - 13px) center;
          background-size: 5px 5px, 5px 5px;
          background-repeat: no-repeat;
          padding-right: 2rem;
          cursor: pointer;
        }
        .qselect option {
          background: oklch(0.17 0.014 25);
          color: var(--color-foreground);
          padding: 8px;
          font-weight: 600;
        }
        .qselect option:checked {
          background: var(--color-primary);
          color: var(--color-primary-foreground);
        }
        .qdate::-webkit-calendar-picker-indicator {
          opacity: 0;
          position: absolute;
          right: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

function SectionHeader({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent?: "primary" | "accent";
}) {
  const color =
    accent === "primary" ? "text-primary" : accent === "accent" ? "text-accent" : "text-foreground";
  return (
    <div
      className={`mb-3 font-display text-lg uppercase tracking-wide ${color} flex items-center gap-2`}
    >
      <span className="inline-block w-6 h-[3px] bg-current" />
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-mono uppercase tracking-[0.25em] text-accent mb-1.5">
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
    <label
      className={`flex items-start gap-3 p-4 border-2 cursor-pointer transition-all ${checked ? "border-primary bg-primary/10" : "border-border bg-background/40 hover:border-accent/60"}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 accent-primary cursor-pointer"
      />
      <span>
        <span className="block text-sm font-bold uppercase tracking-wider">{title}</span>
        <span className="block text-xs text-muted-foreground mt-1">{description}</span>
      </span>
    </label>
  );
}
