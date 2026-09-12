import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sendPostmarkEmail } from "./client.server";

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
    const label = PROPERTY_LABELS[data.propertyType];

    const { error } = await sendPostmarkEmail({
      to: data.email,
      subject: "Got it — The Boys are on the case",
      htmlBody: `
        <p>Hi ${data.firstName},</p>
        <p>Got it — your ${label} details just landed with the crew, and we're already on the case.</p>
        <p>No capes required on your end. We'll crunch the numbers properly and get back to you
        shortly with a price that actually makes sense.</p>
        <p>Hang tight,<br>The Boys</p>
      `,
    });

    if (error) {
      console.error("Failed to send thank-you email:", error);
    }

    return { sent: !error };
  });
