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
import { sendThankYouEmail } from "@/integrations/resend/send-thank-you-email";
import { calculateQuotePrice } from "@/integrations/pricing/calculate-quote-price";

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

const FLIGHTS_OPTIONS = ["1", "2", "3", "4", "5", "6+"] as const;

const FURNITURE_OPTIONS = [
  { value: "sofa", label: "Sofa" },
  { value: "armchair", label: "Armchair" },
  { value: "chest_of_drawers", label: "Chest of drawers" },
  { value: "bed", label: "Bed" },
  { value: "other_big_pieces", label: "Other big pieces (piano, marble table…)" },
] as const;
const FURNITURE_VALUES = FURNITURE_OPTIONS.map((o) => o.value) as [string, ...string[]];

const BEDROOM_OPTIONS = [
  { value: "studio", label: "Studio" },
  { value: "1", label: "1 bedroom" },
  { value: "2", label: "2 bedrooms" },
  { value: "3", label: "3 bedrooms" },
  { value: "4+", label: "4+ bedrooms" },
] as const;

const OFFICE_AREA_OPTIONS = [
  { value: "under_500", label: "Under 500 sq ft" },
  { value: "500_1000", label: "500–1,000 sq ft" },
  { value: "1000_2500", label: "1,000–2,500 sq ft" },
  { value: "2500_plus", label: "2,500+ sq ft" },
] as const;

function generateId(): string {
  // crypto.randomUUID() only exists in secure contexts (HTTPS, or the
  // localhost exemption) - it's undefined on a plain http:// LAN address.
  // This id is just a unique row key, not a secret, so a Math.random()
  // fallback in the same UUID v4 shape is fine.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function buildFormSchema(propertyType: string) {
  return z
    .object({
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

      bedrooms: z.enum(BEDROOM_OPTIONS.map((o) => o.value) as [string, ...string[]]).optional(),
      office_area_band: z
        .enum(OFFICE_AREA_OPTIONS.map((o) => o.value) as [string, ...string[]])
        .optional(),

      from_street: z.string().trim().regex(streetRegex, "Enter a valid street name"),
      from_number: z.string().trim().regex(numberRegex, "Enter a valid number"),
      from_postcode: z.string().trim().regex(postcodeRegex, "Enter a valid postcode"),
      from_parking: z.boolean(),
      from_lift: z.boolean(),
      from_stairs: z.boolean(),
      from_stairs_flights: z.enum(FLIGHTS_OPTIONS).optional(),

      to_street: z.string().trim().regex(streetRegex, "Enter a valid street name"),
      to_number: z.string().trim().regex(numberRegex, "Enter a valid number"),
      to_postcode: z.string().trim().regex(postcodeRegex, "Enter a valid postcode"),
      to_parking: z.boolean(),
      to_lift: z.boolean(),
      to_stairs: z.boolean(),
      to_stairs_flights: z.enum(FLIGHTS_OPTIONS).optional(),

      packaging_required: z.boolean(),
      unpacking_required: z.boolean(),
      end_of_tenancy_cleaning: z.boolean(),
      handyman_services: z.boolean(),
      assembly_required: z.boolean(),
      fragile_items: z.boolean(),
      furniture_items: z.array(z.enum(FURNITURE_VALUES)),
      furniture_other_description: z.string().trim().max(500).optional(),

      move_date: z.string().min(1, "Pick a date"),
      preferred_time: z.string().min(1, "Pick a preferred time"),
      notes: z.string().trim().max(2000).optional(),
    })
    .superRefine((data, ctx) => {
      if (data.from_stairs && !data.from_stairs_flights) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["from_stairs_flights"],
          message: "How many flights of stairs at the pickup address?",
        });
      }
      if (data.to_stairs && !data.to_stairs_flights) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["to_stairs_flights"],
          message: "How many flights of stairs at the drop-off address?",
        });
      }
      if (
        data.furniture_items.length < 3 &&
        (!data.furniture_other_description || data.furniture_other_description.length < 3)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["furniture_other_description"],
          message: "Select at least 3 items, or tell us what needs moving",
        });
      }
      if ((propertyType === "house" || propertyType === "apartment") && !data.bedrooms) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["bedrooms"],
          message: "Select the number of bedrooms",
        });
      }
      if (propertyType === "office" && !data.office_area_band) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["office_area_band"],
          message: "Select the approximate office area",
        });
      }
    });
}

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
  const [fromParking, setFromParking] = useState(false);
  const [fromLift, setFromLift] = useState(false);
  const [fromStairs, setFromStairs] = useState(false);
  const [fromStairsFlights, setFromStairsFlights] = useState("");

  const [toStreet, setToStreet] = useState("");
  const [toNumber, setToNumber] = useState("");
  const [toPostcode, setToPostcode] = useState("");
  const [toParking, setToParking] = useState(false);
  const [toLift, setToLift] = useState(false);
  const [toStairs, setToStairs] = useState(false);
  const [toStairsFlights, setToStairsFlights] = useState("");

  const [packaging, setPackaging] = useState(false);
  const [unpacking, setUnpacking] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [handyman, setHandyman] = useState(false);
  const [assembly, setAssembly] = useState(false);
  const [fragileItems, setFragileItems] = useState(false);
  const [furniture, setFurniture] = useState<string[]>([]);
  const [furnitureOtherDescription, setFurnitureOtherDescription] = useState("");

  const [bedrooms, setBedrooms] = useState("");
  const [officeAreaBand, setOfficeAreaBand] = useState("");

  const [moveDate, setMoveDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function toggleFurniture(value: string) {
    setFurniture((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = buildFormSchema(type).safeParse({
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      bedrooms: bedrooms || undefined,
      office_area_band: officeAreaBand || undefined,
      from_street: fromStreet,
      from_number: fromNumber,
      from_postcode: fromPostcode,
      from_parking: fromParking,
      from_lift: fromLift,
      from_stairs: fromStairs,
      from_stairs_flights: fromStairs ? fromStairsFlights || undefined : undefined,
      to_street: toStreet,
      to_number: toNumber,
      to_postcode: toPostcode,
      to_parking: toParking,
      to_lift: toLift,
      to_stairs: toStairs,
      to_stairs_flights: toStairs ? toStairsFlights || undefined : undefined,
      packaging_required: packaging,
      unpacking_required: unpacking,
      end_of_tenancy_cleaning: cleaning,
      handyman_services: handyman,
      assembly_required: assembly,
      fragile_items: fragileItems,
      furniture_items: furniture,
      furniture_other_description: furnitureOtherDescription || undefined,
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
    const quoteRequestId = generateId();

    setSubmitting(true);
    const { error: insertError } = await supabase.from("quote_requests").insert({
      id: quoteRequestId,
      property_type: type as "house" | "apartment" | "office",
      first_name: d.first_name,
      last_name: d.last_name,
      email: d.email,
      phone: d.phone,
      bedrooms: d.bedrooms ?? null,
      office_area_band: d.office_area_band ?? null,
      moving_from_address: fromCombined,
      moving_to_address: toCombined,
      moving_from_street: d.from_street,
      moving_from_number: d.from_number,
      moving_from_postcode: d.from_postcode,
      moving_from_parking: d.from_parking,
      moving_from_lift: d.from_lift,
      moving_from_stairs: d.from_stairs,
      moving_from_stairs_flights: d.from_stairs ? d.from_stairs_flights : null,
      moving_to_street: d.to_street,
      moving_to_number: d.to_number,
      moving_to_postcode: d.to_postcode,
      moving_to_parking: d.to_parking,
      moving_to_lift: d.to_lift,
      moving_to_stairs: d.to_stairs,
      moving_to_stairs_flights: d.to_stairs ? d.to_stairs_flights : null,
      packaging_required: d.packaging_required,
      unpacking_required: d.unpacking_required,
      end_of_tenancy_cleaning: d.end_of_tenancy_cleaning,
      handyman_services: d.handyman_services,
      assembly_required: d.assembly_required,
      fragile_items: d.fragile_items,
      furniture_items: d.furniture_items,
      furniture_other_description: d.furniture_other_description || null,
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

    sendThankYouEmail({
      data: { firstName: d.first_name, email: d.email, propertyType: type },
    }).catch((err) => console.error("Failed to send thank-you email:", err));

    calculateQuotePrice({
      data: {
        quoteRequestId,
        propertyType: type as "house" | "apartment" | "office",
        bedrooms: d.bedrooms ?? null,
        officeAreaBand: d.office_area_band ?? null,
        fromLift: d.from_lift,
        fromStairs: d.from_stairs,
        fromStairsFlights: d.from_stairs ? (d.from_stairs_flights ?? null) : null,
        toLift: d.to_lift,
        toStairs: d.to_stairs,
        toStairsFlights: d.to_stairs ? (d.to_stairs_flights ?? null) : null,
        packagingRequired: d.packaging_required,
        unpackingRequired: d.unpacking_required,
        endOfTenancyCleaning: d.end_of_tenancy_cleaning,
        handymanServices: d.handyman_services,
        assemblyRequired: d.assembly_required,
        moveDate: d.move_date,
      },
    }).catch((err) => console.error("Failed to calculate quote price:", err));
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
                    pattern="[+0-9 \(\)\-]{5,30}"
                    title="Digits, spaces, +, (), - only"
                    placeholder="+44 7700 900000"
                    className="qinput"
                  />
                </Field>
              </div>

              <div>
                <SectionHeader>Property size</SectionHeader>
                {type === "office" ? (
                  <Field label="Approximate office area">
                    <select
                      required
                      value={officeAreaBand}
                      onChange={(e) => setOfficeAreaBand(e.target.value)}
                      className="qinput qselect"
                    >
                      <option value="">Select…</option>
                      {OFFICE_AREA_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : (
                  <Field label="Number of bedrooms">
                    <select
                      required
                      value={bedrooms}
                      onChange={(e) => setBedrooms(e.target.value)}
                      className="qinput qselect"
                    >
                      <option value="">Select…</option>
                      {BEDROOM_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
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
                <div className="grid sm:grid-cols-3 gap-3 mt-3">
                  <BoolToggle checked={fromParking} onChange={setFromParking} label="Parking" />
                  <BoolToggle checked={fromLift} onChange={setFromLift} label="Lift" />
                  <BoolToggle checked={fromStairs} onChange={setFromStairs} label="Stairs" />
                </div>
                {fromStairs && (
                  <div className="mt-3 max-w-[220px]">
                    <Field label="Flights of stairs">
                      <select
                        required
                        value={fromStairsFlights}
                        onChange={(e) => setFromStairsFlights(e.target.value)}
                        className="qinput qselect"
                      >
                        <option value="">Select…</option>
                        {FLIGHTS_OPTIONS.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                )}
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
                <div className="grid sm:grid-cols-3 gap-3 mt-3">
                  <BoolToggle checked={toParking} onChange={setToParking} label="Parking" />
                  <BoolToggle checked={toLift} onChange={setToLift} label="Lift" />
                  <BoolToggle checked={toStairs} onChange={setToStairs} label="Stairs" />
                </div>
                {toStairs && (
                  <div className="mt-3 max-w-[220px]">
                    <Field label="Flights of stairs">
                      <select
                        required
                        value={toStairsFlights}
                        onChange={(e) => setToStairsFlights(e.target.value)}
                        className="qinput qselect"
                      >
                        <option value="">Select…</option>
                        {FLIGHTS_OPTIONS.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                )}
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
                <SectionHeader accent="primary">Furniture</SectionHeader>
                <p className="text-xs text-muted-foreground mb-3">
                  Select at least 3 big items — or tell us what you're moving below.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {FURNITURE_OPTIONS.map((opt) => (
                    <FurnitureToggle
                      key={opt.value}
                      selected={furniture.includes(opt.value)}
                      onClick={() => toggleFurniture(opt.value)}
                      label={opt.label}
                    />
                  ))}
                </div>
                {furniture.length < 3 && (
                  <div className="mt-3">
                    <Field label="What's there to be moved?">
                      <textarea
                        required
                        rows={3}
                        maxLength={500}
                        value={furnitureOtherDescription}
                        onChange={(e) => setFurnitureOtherDescription(e.target.value)}
                        placeholder="In case there aren't 3 big items — e.g. 1 sofa, 1 bed, or just a few bags of books/clothes"
                        className="qinput resize-none"
                      />
                    </Field>
                  </div>
                )}
                <div className="mt-3">
                  <BoolToggle
                    checked={fragileItems}
                    onChange={setFragileItems}
                    label="Fragile items needing special packing (art, mirrors, glass…)"
                  />
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
                    checked={unpacking}
                    onChange={setUnpacking}
                    title="I need unpacking too"
                    description="We'll unbox everything and clear the packaging away at the new place."
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
                  <AddonCheckbox
                    checked={assembly}
                    onChange={setAssembly}
                    title="Furniture assembly / disassembly"
                    description="Flat-pack beds, wardrobes and tables taken apart and rebuilt for you."
                  />
                </div>
              </div>

              <Field label="Anything else? (optional)">
                <textarea
                  rows={4}
                  maxLength={2000}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything you think slipped through — e.g. big plants"
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

function BoolToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between gap-2 px-3 py-2.5 border-2 text-left transition-all cursor-pointer ${checked ? "border-primary bg-primary/10" : "border-border bg-background/40 hover:border-accent/60"}`}
    >
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      <span
        className={`shrink-0 text-[10px] font-mono uppercase tracking-widest ${checked ? "text-primary" : "text-muted-foreground"}`}
      >
        {checked ? "Yes" : "No"}
      </span>
    </button>
  );
}

function FurnitureToggle({
  selected,
  onClick,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2.5 border-2 text-left transition-all cursor-pointer ${selected ? "border-primary bg-primary/10" : "border-border bg-background/40 hover:border-accent/60"}`}
    >
      <span
        className={`grid place-items-center size-4 border-2 shrink-0 ${selected ? "border-primary bg-primary" : "border-border"}`}
      >
        {selected && <Check className="size-3 text-primary-foreground" />}
      </span>
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
    </button>
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
