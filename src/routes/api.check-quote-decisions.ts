import { createFileRoute } from "@tanstack/react-router";
import {
  fetchPendingDecisions,
  markDecisionProcessed,
} from "@/integrations/airtable/check-decisions";
import {
  sendAcceptedQuoteEmail,
  sendRejectedQuoteEmail,
} from "@/integrations/brevo/send-quote-decision-email";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function handleCheck(request: Request): Promise<Response> {
  if (!isAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const decisions = await fetchPendingDecisions();
  const results: Array<{ quoteId: string; status: string; sent: boolean }> = [];

  for (const decision of decisions) {
    if (!decision.email) {
      console.error("Skipping decision with no email on file:", decision.airtableRecordId);
      continue;
    }

    const emailInput = {
      firstName: decision.clientFirstName,
      email: decision.email,
      calculatedTotal: decision.calculatedTotal,
    };

    const sent =
      decision.status === "Accepted"
        ? await sendAcceptedQuoteEmail(emailInput)
        : await sendRejectedQuoteEmail(emailInput);

    if (sent) {
      await markDecisionProcessed(decision.airtableRecordId);
    }

    results.push({ quoteId: decision.quoteId, status: decision.status, sent });
  }

  return Response.json({ processed: results.length, results });
}

export const Route = createFileRoute("/api/check-quote-decisions")({
  server: {
    handlers: {
      GET: ({ request }) => handleCheck(request),
      POST: ({ request }) => handleCheck(request),
    },
  },
});
