import { sendBrevoEmail } from "./client.server";

const PROPERTY_LABELS: Record<string, string> = {
  house: "House",
  apartment: "Apartment",
  office: "Office",
};

export interface AdminNotificationInput {
  firstName: string;
  lastName: string;
  propertyType: "house" | "apartment" | "office";
  moveDate: string;
  calculatedTotal: number | null;
  needsManualReview: boolean;
}

// Called directly from server-only code (calculate-quote-price.ts's handler),
// so this is a plain function rather than a createServerFn — no client ever
// invokes this.
export async function sendAdminNotificationEmail(input: AdminNotificationInput): Promise<void> {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;

  if (!adminEmail) {
    console.error("Admin notification skipped: missing ADMIN_NOTIFICATION_EMAIL in .env");
    return;
  }

  const priceLine = input.calculatedTotal != null ? `£${input.calculatedTotal}` : "not calculated";
  const reviewLine = input.needsManualReview ? " (flagged for manual review)" : "";

  const { error } = await sendBrevoEmail({
    to: adminEmail,
    subject: `New quote ready: ${input.firstName} ${input.lastName} — ${priceLine}`,
    htmlBody: `
      <p>A new quote request has been priced and is sitting in Airtable, ready for review.</p>
      <ul>
        <li><strong>Client:</strong> ${input.firstName} ${input.lastName}</li>
        <li><strong>Property type:</strong> ${PROPERTY_LABELS[input.propertyType]}</li>
        <li><strong>Move date:</strong> ${input.moveDate}</li>
        <li><strong>Calculated total:</strong> ${priceLine}${reviewLine}</li>
      </ul>
      <p>Open Airtable to review it, and mark it Accepted or Rejected when you've decided.</p>
    `,
  });

  if (error) {
    console.error("Failed to send admin notification email:", error);
  }
}
