import { getResendClient } from "./client.server";

export interface QuoteDecisionInput {
  firstName: string;
  email: string;
  calculatedTotal: number | null;
}

// Called from the decision-polling route (a plain server route handler),
// so this is a plain function rather than a createServerFn.
export async function sendAcceptedQuoteEmail(input: QuoteDecisionInput): Promise<boolean> {
  const fromAddress = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const priceLine = input.calculatedTotal != null ? `£${input.calculatedTotal}` : "your quote";

  const { error } = await getResendClient().emails.send({
    from: `The Boys <${fromAddress}>`,
    to: input.email,
    subject: "Your quote from The Boys",
    html: `
      <p>Hi ${input.firstName},</p>
      <p>Good news — we've worked out your move, and it comes to <strong>${priceLine}</strong>.</p>
      <p>Reply to this email or give us a call if you'd like to lock in your date, or if you
      have any questions about what's included.</p>
      <p>&mdash; The Boys</p>
    `,
  });

  if (error) {
    console.error("Failed to send accepted-quote email:", error);
    return false;
  }
  return true;
}

export async function sendRejectedQuoteEmail(input: QuoteDecisionInput): Promise<boolean> {
  const fromAddress = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  const { error } = await getResendClient().emails.send({
    from: `The Boys <${fromAddress}>`,
    to: input.email,
    subject: "Your quote request with The Boys",
    html: `
      <p>Hi ${input.firstName},</p>
      <p>Thanks for thinking of The Boys for your move. Unfortunately we're not able to take
      this one on — sorry we couldn't be more help this time.</p>
      <p>&mdash; The Boys</p>
    `,
  });

  if (error) {
    console.error("Failed to send rejected-quote email:", error);
    return false;
  }
  return true;
}
