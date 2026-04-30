import { NextResponse } from "next/server";
import { OpenPaymentsClient } from "@/providers/open-payments-client";
import { readOpenPaymentsConsent, updateOpenPaymentsConsent } from "@/server/open-payments-store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const consent = readOpenPaymentsConsent();

  if (!code || !consent) {
    return NextResponse.redirect(new URL("/settings?openPayments=missing-code", request.url));
  }

  try {
    const client = new OpenPaymentsClient({ bicFi: consent.bicFi });
    await client.exchangeConsentCode({
      code,
      consentId: consent.consentId,
      authorisationId: consent.authorisationId,
    });
    updateOpenPaymentsConsent({ completedAt: new Date().toISOString() });

    return NextResponse.redirect(new URL("/settings?openPayments=connected", request.url));
  } catch {
    return NextResponse.redirect(new URL("/settings?openPayments=callback-error", request.url));
  }
}
