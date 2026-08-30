import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getResendClient } from "./client.server";

const thankYouEmailInput = z.object({
  firstName: z.string().min(1).max(100),
  email: z.string().email(),
  propertyType: z.enum(["house", "apartment", "office"]),
});

const PROPERTY_LABELS: Record<string, string> = {
  house: "house move",
  apartment: "apartment move",
  office: "office move",
};

export const sendThankYouEmail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => thankYouEmailInput.parse(data))
  .handler(async ({ data }) => {
    const fromAddress = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    const label = PROPERTY_LABELS[data.propertyType];

    const { error } = await getResendClient().emails.send({
      from: `The Boys <${fromAddress}>`,
      to: data.email,
      subject: "We've got your quote request",
      html: `
        <p>Hi ${data.firstName},</p>
        <p>Thanks for requesting a ${label} quote with The Boys. We've received your details
        and one of the crew will be in touch shortly with your tailored quote.</p>
        <p>&mdash; The Boys</p>
      `,
    });

    if (error) {
      console.error("Failed to send thank-you email:", error);
    }

    return { sent: !error };
  });
