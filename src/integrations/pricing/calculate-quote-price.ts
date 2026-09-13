import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { calculatePricing } from "@/lib/pricing";
import { syncQuoteToAirtable } from "@/integrations/airtable/sync-quote";
import { sendAdminNotificationEmail } from "@/integrations/brevo/send-admin-notification-email";
import type { Json } from "@/integrations/supabase/types";

const floorNumberSchema = z.enum(["1", "2", "3", "4", "5", "6+"]).nullable();

const calculateQuotePriceInput = z.object({
  quoteRequestId: z.string().uuid(),
  propertyType: z.enum(["house", "apartment", "office"]),
  bedrooms: z.string().nullable(),
  officeAreaBand: z.string().nullable(),
  fromLift: z.boolean(),
  fromFloorLevel: z.enum(["ground", "upper"]),
  fromFloorNumber: floorNumberSchema,
  fromParking: z.boolean(),
  toLift: z.boolean(),
  toFloorLevel: z.enum(["ground", "upper"]),
  toFloorNumber: floorNumberSchema,
  toParking: z.boolean(),
  packagingRequired: z.boolean(),
  unpackingRequired: z.boolean(),
  endOfTenancyCleaning: z.boolean(),
  handymanServices: z.boolean(),
  assemblyRequired: z.boolean(),
  fragileItems: z.boolean(),
  furnitureItemCount: z.number().int().min(0),
  furnitureDescribedInNotes: z.boolean(),
  moveDate: z.string(),
});

export const calculateQuotePrice = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => calculateQuotePriceInput.parse(data))
  .handler(async ({ data }) => {
    const breakdown = calculatePricing({
      ...data,
      requestedAt: new Date(),
      vatRegistered: process.env.VAT_REGISTERED === "true",
    });

    const { data: updatedRow, error } = await supabaseAdmin
      .from("quote_requests")
      .update({
        calculated_hours: breakdown.totalHours,
        calculated_total: breakdown.total,
        needs_manual_review: breakdown.needsManualReview,
        pricing_breakdown: breakdown as unknown as Json,
        pricing_calculated_at: new Date().toISOString(),
      })
      .eq("id", data.quoteRequestId)
      .select()
      .single();

    if (error) {
      console.error("Failed to store calculated price:", error);
      return { stored: false };
    }

    await syncQuoteToAirtable(updatedRow).catch((err) =>
      console.error("Failed to sync quote to Airtable:", err),
    );

    await sendAdminNotificationEmail({
      firstName: updatedRow.first_name,
      lastName: updatedRow.last_name,
      propertyType: updatedRow.property_type,
      moveDate: updatedRow.move_date,
      calculatedTotal: updatedRow.calculated_total,
      needsManualReview: updatedRow.needs_manual_review,
    }).catch((err) => console.error("Failed to send admin notification email:", err));

    return { stored: true };
  });
