// Pricing engine — pure functions, no I/O.

export const HOURLY_RATE = 85;
const MIN_HOURS = 4;
// Exceptions down to 3 hours happen sometimes, but that's a manual call —
// deliberately not modeled here.

const BASE_HOURS: Record<string, number> = {
  studio: 3.0,
  "1": 3.5,
  "2": 4.5,
  "3": 6.0,
  "4+": 8.0,
};

// Office base hours now scale with the declared floor area band instead of a
// single flat number. Still a placeholder scale — office quotes are always
// flagged for manual review regardless (see reviewReasons below), so getting
// this exactly right matters less than for residential.
const OFFICE_BASE_HOURS: Record<string, number> = {
  under_500: 3.0,
  "500_1000": 5.0,
  "1000_2500": 8.0,
  "2500_plus": 12.0,
};

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

// Per-address access adder, applied when the floor is an upper level.
// Replaces the old stairs+flights-only adder — floor level/number is now a
// mandatory field, so it's the single source of "how high up" for pricing.
// Stairs stays on the form as context but no longer feeds the calculation.
const NO_LIFT_HOURS_PER_FLOOR = 0.25;
const WITH_LIFT_HOURS_PER_FLOOR = 0.1; // wait time / multiple trips, even with a lift

// Extra hours per big furniture item selected beyond the required minimum of 3
// (items below that minimum are assumed to already be covered by base hours).
const EXTRA_ITEM_HOURS = 0.25;
const FURNITURE_BASELINE_ITEMS = 3;

const FRAGILE_ITEMS_HOURS = 0.5;

const NO_PARKING_HOURS_PER_ADDRESS = 0.25;

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

function levelToNumber(level: string | null): number {
  if (!level) return 0;
  if (level === "6+") return 6;
  return Number(level);
}

function floorAccessAdderHours(
  lift: boolean,
  floorLevel: string,
  floorNumber: string | null,
): number {
  if (floorLevel !== "upper") return 0;
  const floors = levelToNumber(floorNumber);
  return floors * (lift ? WITH_LIFT_HOURS_PER_FLOOR : NO_LIFT_HOURS_PER_FLOOR);
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
  fromFloorLevel: string;
  fromFloorNumber: string | null;
  fromParking: boolean;
  toLift: boolean;
  toFloorLevel: string;
  toFloorNumber: string | null;
  toParking: boolean;
  packagingRequired: boolean;
  unpackingRequired: boolean;
  endOfTenancyCleaning: boolean;
  handymanServices: boolean;
  assemblyRequired: boolean;
  fragileItems: boolean;
  furnitureItemCount: number;
  furnitureDescribedInNotes: boolean;
  moveDate: string;
  requestedAt: Date;
  vatRegistered: boolean;
}

export interface PricingBreakdown {
  baseHours: number;
  accessAdderHours: number;
  furnitureAdderHours: number;
  fragileAdderHours: number;
  parkingAdderHours: number;
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
  const officeAreaKey = input.officeAreaBand ?? "";

  const baseHours = isOffice
    ? (OFFICE_BASE_HOURS[officeAreaKey] ?? OFFICE_BASE_HOURS["500_1000"])
    : (BASE_HOURS[sizeKey] ?? BASE_HOURS["1"]);

  const accessHours =
    floorAccessAdderHours(input.fromLift, input.fromFloorLevel, input.fromFloorNumber) +
    floorAccessAdderHours(input.toLift, input.toFloorLevel, input.toFloorNumber);

  const extraItems = Math.max(0, input.furnitureItemCount - FURNITURE_BASELINE_ITEMS);
  const furnitureAdderHours = extraItems * EXTRA_ITEM_HOURS;

  const fragileAdderHours = input.fragileItems ? FRAGILE_ITEMS_HOURS : 0;

  const parkingAdderHours =
    (input.fromParking ? 0 : NO_PARKING_HOURS_PER_ADDRESS) +
    (input.toParking ? 0 : NO_PARKING_HOURS_PER_ADDRESS);

  const packagingHoursTable = isOffice
    ? OFFICE_PACKAGING_HOURS
    : (PACKAGING_HOURS[sizeKey] ?? PACKAGING_HOURS["1"]);
  const packagingAdderHours = input.packagingRequired ? packagingHoursTable : 0;
  const unpackingAdderHours = input.unpackingRequired ? packagingHoursTable : 0;

  const totalHours = roundToHalfHour(
    baseHours +
      accessHours +
      furnitureAdderHours +
      fragileAdderHours +
      parkingAdderHours +
      packagingAdderHours +
      unpackingAdderHours,
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
  if (input.furnitureDescribedInNotes)
    reviewReasons.push(
      "Furniture load was described in free text rather than the checklist — item count and hours may need manual adjustment.",
    );

  return {
    baseHours,
    accessAdderHours: accessHours,
    furnitureAdderHours,
    fragileAdderHours,
    parkingAdderHours,
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
