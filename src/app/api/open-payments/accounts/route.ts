import { NextResponse } from "next/server";
import { OpenPaymentsClient } from "@/providers/open-payments-client";
import { readOpenPaymentsConsent } from "@/server/open-payments-store";

export async function POST() {
  try {
    const consent = readOpenPaymentsConsent();

    if (!consent) {
      return NextResponse.json({ error: "Create and complete consent first" }, { status: 400 });
    }

    const client = new OpenPaymentsClient({
      consentId: consent.consentId,
      bicFi: consent.bicFi,
    });
    const accounts = await client.listAccounts();
    const balances = await client.syncBalances();

    return NextResponse.json({
      accounts: accounts.map((account) => ({
        id: account.resourceId,
        iban: account.iban,
        currency: account.currency,
        name: account.name ?? account.product ?? "ABN account",
      })),
      balances,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load Open Payments accounts" },
      { status: 500 },
    );
  }
}
