// Pricing engine — pure functions, no I/O.

export const HOURLY_RATE = 85;
const MIN_HOURS = 3;

const BASE_HOURS: Record<string, number> = {
  studio: 3.0,
  "1": 3.5,
  "2": 4.5,
  "3": 6.0,
  "4+": 8.0,
};
const OFFICE_BASE_HOURS = 5.0;

const PACKAGING_HOURS: Record<string, number> = {
  studio: 1.5,
  "1": 1.5,
  "2": 2.0,
  "3": 2.5,
  "4+": 3.0,
};
// Office isn't in the source table (packaging scope varies too much to size by desk count);
// used only as a rough placeholder — office quotes are always flagged for manual review anyway.
const OFFICE_PACKAGING_HOURS = 2.0;

const CLEANING_FEE: Record<string, number> = {
  studio: 180,
  "1": 180,
  "2": 260,
  "3": 340,
  "4+": 420,
};
// Same placeholder rationale as OFFICE_PACKAGING_HOURS.
const OFFICE_CLEANING_FEE = 340;

const HANDYMAN_PLACEHOLDER_HOURS = 2;
const HANDYMAN_PLACEHOLDER_FEE = HANDYMAN_PLACEHOLDER_HOURS * 55;
const ASSEMBLY_PLACEHOLDER_FEE = 110;

// England & Wales bank holidays, sourced from https://www.gov.uk/bank-holidays.json.
// Only covers 2026–2027 — extend this list before it runs out.
const UK_BANK_HOLIDAYS = new Set([
  "2026-01-01",
  "2026-04-03",
  "2026-04-06",
  "2026-05-04",
  "2026-05-25",
  "2026-08-31",
  "2026-12-25",
  "2026-12-28",
  "2027-01-01",
  "2027-03-26",
  "2027-03-29",
  "2027-05-03",
  "2027-05-31",
  "2027-08-30",
  "2027-12-27",
  "2027-12-28",
]);

function flightsToNumber(flights: string | null): number {
  if (!flights) return 0;
  if (flights === "6+") return 6;
  return Number(flights);
}

function accessAdderHours(lift: boolean, stairs: boolean, flights: string | null): number {
  if (lift || !stairs) return 0;
  return flightsToNumber(flights) * 0.25;
}

function dayOfWeekMultiplier(moveDate: string): number {
  if (UK_BANK_HOLIDAYS.has(moveDate)) return 1.25;
  const day = new Date(`${moveDate}T00:00:00Z`).getUTCDay();
  if (day === 0) return 1.25; // Sunday
  if (day === 6) return 1.15; // Saturday
  return 1.0;
}

function leadTimeMultiplier(moveDate: string, requestedAt: Date): number {
  const moveDateMs = new Date(`${moveDate}T00:00:00Z`).getTime();
  const hoursUntilMove = (moveDateMs - requestedAt.getTime()) / (1000 * 60 * 60);
  if (hoursUntilMove < 48) return 1.25;
  if (hoursUntilMove < 7 * 24) return 1.15;
  return 1.0;
}

function roundToHalfHour(hours: number): number {
  const rounded = Math.round(hours * 100) / 100;
  return Math.max(MIN_HOURS, Math.ceil(rounded / 0.5) * 0.5);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface PricingInput {
  propertyType: "house" | "apartment" | "office";
  bedrooms: string | null;
  officeAreaBand: string | null;
  fromLift: boolean;
  fromStairs: boolean;
  fromStairsFlights: string | null;
  toLift: boolean;
  toStairs: boolean;
  toStairsFlights: string | null;
  packagingRequired: boolean;
  unpackingRequired: boolean;
  endOfTenancyCleaning: boolean;
  handymanServices: boolean;
  assemblyRequired: boolean;
  moveDate: string;
  requestedAt: Date;
  vatRegistered: boolean;
}

export interface PricingBreakdown {
  baseHours: number;
  accessAdderHours: number;
  packagingAdderHours: number;
  unpackingAdderHours: number;
  totalHours: number;
  labourSubtotal: number;
  dayOfWeekMultiplier: number;
  leadTimeMultiplier: number;
  demandMultiplier: number;
  labourTotal: number;
  cleaningFee: number;
  handymanFee: number;
  assemblyFee: number;
  subtotal: number;
  vatAmount: number;
  total: number;
  needsManualReview: boolean;
  reviewReasons: string[];
}

export function calculatePricing(input: PricingInput): PricingBreakdown {
  const isOffice = input.propertyType === "office";
  const sizeKey = input.bedrooms ?? "";

  const baseHours = isOffice ? OFFICE_BASE_HOURS : (BASE_HOURS[sizeKey] ?? BASE_HOURS["1"]);

  const accessHours =
    accessAdderHours(input.fromLift, input.fromStairs, input.fromStairsFlights) +
    accessAdderHours(input.toLift, input.toStairs, input.toStairsFlights);

  const packagingHoursTable = isOffice
    ? OFFICE_PACKAGING_HOURS
    : (PACKAGING_HOURS[sizeKey] ?? PACKAGING_HOURS["1"]);
  const packagingAdderHours = input.packagingRequired ? packagingHoursTable : 0;
  const unpackingAdderHours = input.unpackingRequired ? packagingHoursTable : 0;

  const totalHours = roundToHalfHour(
    baseHours + accessHours + packagingAdderHours + unpackingAdderHours,
  );
  const labourSubtotal = round2(totalHours * HOURLY_RATE);

  const dowMultiplier = dayOfWeekMultiplier(input.moveDate);
  const leadMultiplier = leadTimeMultiplier(input.moveDate, input.requestedAt);
  const demandMultiplier = Math.max(dowMultiplier, leadMultiplier);
  const labourTotal = round2(labourSubtotal * demandMultiplier);

  const cleaningFee = input.endOfTenancyCleaning
    ? isOffice
      ? OFFICE_CLEANING_FEE
      : (CLEANING_FEE[sizeKey] ?? CLEANING_FEE["1"])
    : 0;
  const handymanFee = input.handymanServices ? HANDYMAN_PLACEHOLDER_FEE : 0;
  const assemblyFee = input.assemblyRequired ? ASSEMBLY_PLACEHOLDER_FEE : 0;

  const subtotal = round2(labourTotal + cleaningFee + handymanFee + assemblyFee);
  const vatAmount = input.vatRegistered ? round2(subtotal * 0.2) : 0;
  const total = Math.round(subtotal + vatAmount);

  const reviewReasons: string[] = [];
  if (isOffice)
    reviewReasons.push(
      "Office quotes are always manually reviewed (size/scope varies too much to auto-price reliably).",
    );
  if (input.handymanServices)
    reviewReasons.push(
      "Handyman fee is a placeholder estimate — confirm against the client's notes.",
    );
  if (input.assemblyRequired)
    reviewReasons.push(
      "Assembly/disassembly fee is a placeholder estimate — confirm against the client's notes.",
    );

  return {
    baseHours,
    accessAdderHours: accessHours,
    packagingAdderHours,
    unpackingAdderHours,
    totalHours,
    labourSubtotal,
    dayOfWeekMultiplier: dowMultiplier,
    leadTimeMultiplier: leadMultiplier,
    demandMultiplier,
    labourTotal,
    cleaningFee,
    handymanFee,
    assemblyFee,
    subtotal,
    vatAmount,
    total,
    needsManualReview: reviewReasons.length > 0,
    reviewReasons,
  };
}
