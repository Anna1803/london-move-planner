interface BrevoSendInput {
  to: string;
  subject: string;
  htmlBody: string;
}

interface BrevoSendResult {
  error: string | null;
}

// Brevo sends via its own infrastructure, never through Gmail — so Gmail's
// signature and the Workspace-managed footer never apply to these emails.
// This is the equivalent footer, baked into every email we send ourselves.
const LOGO_URL =
  "https://oxgtpwubcilqdupgwebu.supabase.co/storage/v1/object/public/brand-assets/logo.jpg";

const EMAIL_FOOTER = `
  <hr style="border:none;border-top:1px solid #ddd;margin:24px 0 16px 0;">
  <table role="presentation" style="border-collapse:collapse;">
    <tr>
      <td style="padding-right:12px;vertical-align:middle;">
        <img src="${LOGO_URL}" alt="The Boys" width="88" style="display:block;">
      </td>
      <td style="vertical-align:middle;font-family:Arial,sans-serif;font-size:12px;color:#666;line-height:1.6;">
        <strong style="color:#111;">The Boys</strong> — London Removals &middot; Cleaning &middot; Handyman<br>
        &#128222; 020 3400 9905 &nbsp;&middot;&nbsp; &#9993; enquiries@theboysremovals.co.uk &nbsp;&middot;&nbsp; &#127760; theboysremovals.co.uk<br>
        <span style="font-style:italic;">Saving Londoners from moving day, one box at a time.</span>
      </td>
    </tr>
  </table>
`;

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
      htmlContent: `${input.htmlBody}${EMAIL_FOOTER}`,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { error: `Brevo send failed (${res.status}): ${text}` };
  }

  return { error: null };
}
