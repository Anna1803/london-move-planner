import { sendBrevoEmail } from "./client.server";
import type { Database } from "@/integrations/supabase/types";

type QuoteRequestRow = Database["public"]["Tables"]["quote_requests"]["Row"];

export interface QuoteDecisionInput {
  firstName: string;
  email: string;
  calculatedTotal: number | null;
}

const BEDROOM_LABELS: Record<string, string> = {
  studio: "Studio",
  "1": "1 bedroom",
  "2": "2 bedrooms",
  "3": "3 bedrooms",
  "4+": "4+ bedrooms",
};

const OFFICE_AREA_LABELS: Record<string, string> = {
  under_500: "Under 500 sq ft",
  "500_1000": "500–1,000 sq ft",
  "1000_2500": "1,000–2,500 sq ft",
  "2500_plus": "2,500+ sq ft",
};

const FURNITURE_LABELS: Record<string, string> = {
  sofa: "Sofa",
  armchair: "Armchair",
  bed: "Bed",
  wardrobe: "Wardrobe",
  chest_of_drawers: "Chest of drawers",
  dining_table: "Dining table",
  bookshelf: "Bookshelf",
  fridge_freezer: "Fridge / freezer",
  washing_machine: "Washing machine",
  other_big_pieces: "Other big pieces",
  desks: "Desks",
  office_chairs: "Office chairs",
  filing_cabinets: "Filing cabinets",
  it_equipment: "IT equipment",
  printers: "Printers",
  big_tables: "Big tables",
  shelving_units: "Shelving units",
  reception_seating: "Sofas / reception seating",
  server_racks: "Server racks",
  other_big_items: "Other big items",
};

function joinNatural(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function describePropertyAndSize(row: QuoteRequestRow): string {
  const propertyLabel =
    row.property_type === "house"
      ? "House"
      : row.property_type === "apartment"
        ? "Apartment"
        : "Office";
  const size =
    row.property_type === "office"
      ? (row.office_area_band && OFFICE_AREA_LABELS[row.office_area_band]) || row.office_area_band
      : (row.bedrooms && BEDROOM_LABELS[row.bedrooms]) || row.bedrooms;
  return size ? `${propertyLabel} move (${size})` : `${propertyLabel} move`;
}

function describeAccess(
  label: string,
  parking: boolean,
  lift: boolean,
  floorLevel: string | null,
  floorNumber: string | null,
): string {
  const parts = [
    parking ? "parking available" : "no parking",
    lift ? "lift available" : "no lift",
    floorLevel === "ground" ? "ground floor" : floorNumber ? `floor ${floorNumber}` : null,
  ].filter((p): p is string => Boolean(p));
  return `${label}: ${parts.join(", ")}`;
}

// Builds the "here's what went into your estimate" bullet list for the
// accepted-quote email, skipping anything the client didn't actually add.
function buildEstimateBullets(row: QuoteRequestRow): string[] {
  const bullets: string[] = [describePropertyAndSize(row)];

  bullets.push(
    describeAccess(
      "Pickup",
      row.moving_from_parking,
      row.moving_from_lift,
      row.moving_from_floor_level,
      row.moving_from_floor_number,
    ),
  );
  bullets.push(
    describeAccess(
      "Drop-off",
      row.moving_to_parking,
      row.moving_to_lift,
      row.moving_to_floor_level,
      row.moving_to_floor_number,
    ),
  );

  if (row.furniture_items.length > 0) {
    const labels = row.furniture_items.map((v) => FURNITURE_LABELS[v] || v);
    bullets.push(`Furniture: ${labels.join(", ")}`);
  }
  if (row.furniture_other_description) {
    bullets.push(`Also flagged: ${row.furniture_other_description}`);
  }

  if (row.fragile_items) {
    bullets.push("Fragile items needing extra care in transit");
  }

  const services = [
    row.packaging_required && "packaging",
    row.unpacking_required && "unpacking",
    row.end_of_tenancy_cleaning && "end-of-tenancy cleaning",
    row.handyman_services && "handyman services",
    row.assembly_required && "furniture assembly/disassembly",
  ].filter((s): s is string => Boolean(s));
  if (services.length > 0) {
    bullets.push(`${capitalize(joinNatural(services))} included`);
  }

  return bullets;
}

// Called from the decision-polling route (a plain server route handler),
// so these are plain functions rather than createServerFn.
export async function sendAcceptedQuoteEmail(
  input: QuoteDecisionInput & { details: QuoteRequestRow | null },
): Promise<boolean> {
  const priceLine = input.calculatedTotal != null ? `£${input.calculatedTotal}` : "your estimate";

  const breakdownHtml = input.details
    ? `
      <p>Here's what went into your estimate:</p>
      <ul>
        ${buildEstimateBullets(input.details)
          .map((b) => `<li>${b}</li>`)
          .join("\n        ")}
      </ul>
    `
    : "";

  const { error } = await sendBrevoEmail({
    to: input.email,
    subject: "Your estimate's in — The Boys are on the case",
    htmlBody: `
      <p>Hi ${input.firstName},</p>
      <p>Cape on, math done — here's how The Boys are stepping in to save your moving day.</p>
      ${breakdownHtml}
      <p>Your move comes to <strong>${priceLine}</strong> — built around exactly what you told us:
      size, access at both ends, what's actually being moved, and any extra help you asked for.</p>
      <p>Heads up: this is our best estimate based on what you've shared, not a locked-in final
      price — real moves can turn out bigger or trickier once we see them in person. The easiest
      fix? Send a few photos or a quick video to enquiries@theboysremovals.co.uk or give us a
      ring — the clearer picture we get, the fewer surprises for either of us on the day.</p>
      <p>London doesn't get saved from moving day by itself. Reply here or call to lock in your
      date — we fill up fast.</p>
      <p>Suited up and ready,<br>The Boys</p>
    `,
  });

  if (error) {
    console.error("Failed to send accepted-quote email:", error);
    return false;
  }
  return true;
}

export async function sendRejectedQuoteEmail(input: QuoteDecisionInput): Promise<boolean> {
  const { error } = await sendBrevoEmail({
    to: input.email,
    subject: "About your move request",
    htmlBody: `
      <p>Hi ${input.firstName},</p>
      <p>Thanks for thinking of The Boys for your move — we mean that.</p>
      <p>After looking over the details, this particular one isn't a fit for our crew right now.
      It's nothing about you or the job — just a matter of capacity, distance, or timing on our
      end.</p>
      <p>London's full of good crews, and we hope you find the right one for moving day.</p>
      <p>All the best,<br>The Boys</p>
    `,
  });

  if (error) {
    console.error("Failed to send rejected-quote email:", error);
    return false;
  }
  return true;
}
