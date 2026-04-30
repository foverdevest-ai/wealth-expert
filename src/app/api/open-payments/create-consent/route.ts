import { NextResponse } from "next/server";
import { OpenPaymentsClient } from "@/providers/open-payments-client";
import { writeOpenPaymentsConsent } from "@/server/open-payments-store";

type CreateConsentBody = {
  iban?: string;
  currency?: string;
  bicFi?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateConsentBody;
    const iban = body.iban?.replace(/\s/g, "");
    const bicFi = body.bicFi ?? process.env.OPENPAYMENTS_BICFI ?? "ABNANL2A";

    if (!iban) {
      return NextResponse.json({ error: "IBAN is required" }, { status: 400 });
    }

    const client = new OpenPaymentsClient({ bicFi });
    const consent = await client.createConsent({
      iban,
      currency: body.currency ?? "EUR",
    });
    const authorisation = await client.startConsentAuthorisation(consent.consentId);
    const method = authorisation.scaMethods?.[0];

    if (!method?.authenticationMethodId) {
      return NextResponse.json({ error: "No SCA method returned by Open Payments" }, { status: 400 });
    }

    const selected = await client.selectConsentAuthenticationMethod({
      consentId: consent.consentId,
      authorisationId: authorisation.authorisationId,
      authenticationMethodId: method.authenticationMethodId,
    });

    writeOpenPaymentsConsent({
      consentId: consent.consentId,
      authorisationId: authorisation.authorisationId,
      bicFi,
      iban,
      currency: body.currency ?? "EUR",
      oauthUrl: selected.oauthUrl,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      consentId: consent.consentId,
      authorisationId: authorisation.authorisationId,
      oauthUrl: selected.oauthUrl,
      scaStatus: selected.scaStatus,
      psuMessage: selected.psuMessage,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create Open Payments consent" },
      { status: 500 },
    );
  }
}
