import type { Database } from "@/integrations/supabase/types";

type QuoteRequestRow = Database["public"]["Tables"]["quote_requests"]["Row"];

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

function describeSize(row: QuoteRequestRow): string {
  if (row.property_type === "office") {
    return (
      (row.office_area_band && OFFICE_AREA_LABELS[row.office_area_band]) ||
      (row.office_area_band ?? "")
    );
  }
  return (row.bedrooms && BEDROOM_LABELS[row.bedrooms]) || (row.bedrooms ?? "");
}

function describeAccess(
  label: string,
  parking: boolean,
  lift: boolean,
  floorLevel: string | null,
  floorNumber: string | null,
): string {
  const parts = [parking ? "parking" : "no parking", lift ? "lift" : "no lift"];
  if (floorLevel === "ground") {
    parts.push("ground floor");
  } else if (floorLevel === "upper" && floorNumber) {
    parts.push(`floor ${floorNumber}`);
  }
  return `${label}: ${parts.join(", ")}`;
}

function describeServices(row: QuoteRequestRow): string {
  const services = [
    row.packaging_required && "Packaging",
    row.unpacking_required && "Unpacking",
    row.end_of_tenancy_cleaning && "End-of-tenancy cleaning",
    row.handyman_services && "Handyman",
    row.assembly_required && "Assembly/disassembly",
    row.fragile_items && "Fragile items",
  ].filter(Boolean);
  return services.length > 0 ? services.join(", ") : "None";
}

function describeFurniture(row: QuoteRequestRow): string {
  const lines = [
    row.furniture_items.length > 0 ? `Items: ${row.furniture_items.join(", ")}` : null,
    row.furniture_other_description ? `Other: ${row.furniture_other_description}` : null,
  ].filter(Boolean);
  return lines.join("\n");
}

export async function syncQuoteToAirtable(row: QuoteRequestRow): Promise<void> {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME;

  if (!apiKey || !baseId || !tableName) {
    console.error(
      "Airtable sync skipped: missing AIRTABLE_API_KEY, AIRTABLE_BASE_ID, or AIRTABLE_TABLE_NAME in .env",
    );
    return;
  }

  const accessNotes = [
    describeAccess(
      "From",
      row.moving_from_parking,
      row.moving_from_lift,
      row.moving_from_floor_level,
      row.moving_from_floor_number,
    ),
    describeAccess(
      "To",
      row.moving_to_parking,
      row.moving_to_lift,
      row.moving_to_floor_level,
      row.moving_to_floor_number,
    ),
  ].join("\n");

  const propertyTypeLabel =
    row.property_type === "house"
      ? "House"
      : row.property_type === "apartment"
        ? "Apartment"
        : "Office";

  const res = await fetch(
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        performUpsert: { fieldsToMergeOn: ["Quote ID"] },
        records: [
          {
            fields: {
              "Quote ID": row.id,
              "Client Name": `${row.first_name} ${row.last_name}`,
              Email: row.email,
              Phone: row.phone,
              "Property Type": propertyTypeLabel,
              Size: describeSize(row),
              "Move Date": row.move_date,
              "Preferred Time": row.preferred_time,
              "From Address": row.moving_from_address,
              "To Address": row.moving_to_address,
              "Access Notes": accessNotes,
              Furniture: describeFurniture(row),
              Services: describeServices(row),
              "Calculated Hours": row.calculated_hours,
              "Calculated Total": row.calculated_total,
              "Needs Manual Review": row.needs_manual_review,
              "Client Notes": row.notes ?? "",
              "Submitted At": row.created_at,
            },
          },
        ],
      }),
    },
  );

  if (!res.ok) {
    console.error("Airtable sync failed:", res.status, await res.text());
  }
}
