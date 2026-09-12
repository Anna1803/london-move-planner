interface PostmarkSendInput {
  to: string;
  subject: string;
  htmlBody: string;
}

interface PostmarkSendResult {
  error: string | null;
}

export async function sendPostmarkEmail(input: PostmarkSendInput): Promise<PostmarkSendResult> {
  const token = process.env.POSTMARK_API_SERVER_TOKEN;
  const fromAddress = process.env.POSTMARK_FROM_EMAIL;

  if (!token || !fromAddress) {
    return { error: "Missing POSTMARK_API_SERVER_TOKEN or POSTMARK_FROM_EMAIL in .env" };
  }

  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": token,
    },
    body: JSON.stringify({
      From: `The Boys <${fromAddress}>`,
      To: input.to,
      Subject: input.subject,
      HtmlBody: input.htmlBody,
      MessageStream: "outbound",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { error: `Postmark send failed (${res.status}): ${text}` };
  }

  return { error: null };
}
