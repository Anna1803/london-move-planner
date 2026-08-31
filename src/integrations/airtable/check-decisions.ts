interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

interface AirtableListResponse {
  records: AirtableRecord[];
}

export interface PendingDecision {
  airtableRecordId: string;
  quoteId: string;
  status: "Accepted" | "Rejected";
  clientFirstName: string;
  email: string;
  calculatedTotal: number | null;
}

function airtableConfig() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME;
  if (!apiKey || !baseId || !tableName) return null;
  return { apiKey, baseId, tableName };
}

// Rows are only picked up once they've sat in Accepted/Rejected for at least
// this long, unprocessed — a grace period so an accidental status flip can be
// undone before any customer-facing email fires. Requires two fields on the
// Airtable table: "Processed" (checkbox) and "Status Last Modified" (a "Last
// modified time" field scoped to just the Status field).
export async function fetchPendingDecisions(): Promise<PendingDecision[]> {
  const config = airtableConfig();
  if (!config) {
    console.error(
      "Decision check skipped: missing AIRTABLE_API_KEY, AIRTABLE_BASE_ID, or AIRTABLE_TABLE_NAME",
    );
    return [];
  }

  const graceMinutes = Number(process.env.DECISION_GRACE_PERIOD_MINUTES ?? "15");
  const formula = `AND(OR({Status}='Accepted',{Status}='Rejected'),NOT({Processed}),DATETIME_DIFF(NOW(),{Status Last Modified},'minutes')>=${graceMinutes})`;

  const url = `https://api.airtable.com/v0/${config.baseId}/${encodeURIComponent(config.tableName)}?filterByFormula=${encodeURIComponent(formula)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${config.apiKey}` } });

  if (!res.ok) {
    console.error("Failed to fetch pending decisions from Airtable:", res.status, await res.text());
    return [];
  }

  const json = (await res.json()) as AirtableListResponse;
  return json.records
    .map((r): PendingDecision | null => {
      const status = r.fields["Status"];
      if (status !== "Accepted" && status !== "Rejected") return null;
      const clientName = typeof r.fields["Client Name"] === "string" ? r.fields["Client Name"] : "";
      return {
        airtableRecordId: r.id,
        quoteId: typeof r.fields["Quote ID"] === "string" ? r.fields["Quote ID"] : "",
        status,
        clientFirstName: clientName.split(" ")[0] || "there",
        email: typeof r.fields["Email"] === "string" ? r.fields["Email"] : "",
        calculatedTotal:
          typeof r.fields["Calculated Total"] === "number" ? r.fields["Calculated Total"] : null,
      };
    })
    .filter((d): d is PendingDecision => d !== null);
}

export async function markDecisionProcessed(recordId: string): Promise<void> {
  const config = airtableConfig();
  if (!config) return;

  const res = await fetch(
    `https://api.airtable.com/v0/${config.baseId}/${encodeURIComponent(config.tableName)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: [{ id: recordId, fields: { Processed: true } }],
      }),
    },
  );

  if (!res.ok) {
    console.error("Failed to mark decision processed:", res.status, await res.text());
  }
}
