interface BrevoSendInput {
  to: string;
  subject: string;
  htmlBody: string;
}

interface BrevoSendResult {
  error: string | null;
}

export async function sendBrevoEmail(input: BrevoSendInput): Promise<BrevoSendResult> {
  const apiKey = process.env.BREVO_API_KEY;
  const fromAddress = process.env.BREVO_FROM_EMAIL;

  if (!apiKey || !fromAddress) {
    return { error: "Missing BREVO_API_KEY or BREVO_FROM_EMAIL in .env" };
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { name: "The Boys", email: fromAddress },
      to: [{ email: input.to }],
      subject: input.subject,
      htmlContent: input.htmlBody,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { error: `Brevo send failed (${res.status}): ${text}` };
  }

  return { error: null };
}
