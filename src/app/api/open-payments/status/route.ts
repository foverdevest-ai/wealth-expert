import { NextResponse } from "next/server";
import { OpenPaymentsClient } from "@/providers/open-payments-client";
import { readOpenPaymentsConsent } from "@/server/open-payments-store";

export async function GET() {
  const client = new OpenPaymentsClient();
  const consent = readOpenPaymentsConsent();

  return NextResponse.json({
    configured: client.isConfigured,
    environment: process.env.OPENPAYMENTS_ENV ?? "sandbox",
    bicFi: process.env.OPENPAYMENTS_BICFI ?? consent?.bicFi,
    hasConsent: Boolean(consent),
    consentId: consent?.consentId,
    authorisationId: consent?.authorisationId,
    iban: consent?.iban,
    createdAt: consent?.createdAt,
    completedAt: consent?.completedAt,
  });
}
