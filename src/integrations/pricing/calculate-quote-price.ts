import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { calculatePricing } from "@/lib/pricing";
import { syncQuoteToAirtable } from "@/integrations/airtable/sync-quote";
import type { Json } from "@/integrations/supabase/types";

const flightsSchema = z.enum(["1", "2", "3", "4", "5", "6+"]).nullable();

const calculateQuotePriceInput = z.object({
  quoteRequestId: z.string().uuid(),
  propertyType: z.enum(["house", "apartment", "office"]),
  bedrooms: z.string().nullable(),
  officeAreaBand: z.string().nullable(),
  fromLift: z.boolean(),
  fromStairs: z.boolean(),
  fromStairsFlights: flightsSchema,
  toLift: z.boolean(),
  toStairs: z.boolean(),
  toStairsFlights: flightsSchema,
  packagingRequired: z.boolean(),
  unpackingRequired: z.boolean(),
  endOfTenancyCleaning: z.boolean(),
  handymanServices: z.boolean(),
  assemblyRequired: z.boolean(),
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

    return { stored: true };
  });
