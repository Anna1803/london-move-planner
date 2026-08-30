import { Resend } from "resend";

function createResendClient() {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY environment variable. Set it in your .env file.");
  }

  return new Resend(RESEND_API_KEY);
}

let _resend: Resend | undefined;

export function getResendClient(): Resend {
  if (!_resend) _resend = createResendClient();
  return _resend;
}
