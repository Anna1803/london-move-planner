import { sendPostmarkEmail } from "./client.server";

export interface QuoteDecisionInput {
  firstName: string;
  email: string;
  calculatedTotal: number | null;
}

// Called from the decision-polling route (a plain server route handler),
// so these are plain functions rather than createServerFn.
export async function sendAcceptedQuoteEmail(input: QuoteDecisionInput): Promise<boolean> {
  const priceLine = input.calculatedTotal != null ? `£${input.calculatedTotal}` : "your quote";

  const { error } = await sendPostmarkEmail({
    to: input.email,
    subject: `Your quote's in — ${priceLine}`,
    htmlBody: `
      <p>Hi ${input.firstName},</p>
      <p>Mission briefed, numbers crunched — your move comes to <strong>${priceLine}</strong>.</p>
      <p>That covers the crew, the van, and turning your moving day into someone else's problem
      (ours). Reply here or give us a ring to lock in your date — we fill up fast across London.</p>
      <p>Ready when you are,<br>The Boys</p>
    `,
  });

  if (error) {
    console.error("Failed to send accepted-quote email:", error);
    return false;
  }
  return true;
}

export async function sendRejectedQuoteEmail(input: QuoteDecisionInput): Promise<boolean> {
  const { error } = await sendPostmarkEmail({
    to: input.email,
    subject: "About your move request",
    htmlBody: `
      <p>Hi ${input.firstName},</p>
      <p>Thanks for thinking of The Boys for your move — we mean that.</p>
      <p>This particular one isn't a fit for us right now, but London's full of good crews,
      and we hope you find the right one for moving day.</p>
      <p>All the best,<br>The Boys</p>
    `,
  });

  if (error) {
    console.error("Failed to send rejected-quote email:", error);
    return false;
  }
  return true;
}
