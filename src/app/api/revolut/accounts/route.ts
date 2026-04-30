import { NextResponse } from "next/server";
import { RevolutBusinessClient } from "@/providers/revolut-client";

export async function POST() {
  try {
    const client = new RevolutBusinessClient();
    const accounts = await client.getAccounts();

    return NextResponse.json({
      accounts: accounts.map((account) => ({
        id: account.id,
        name: account.name,
        currency: account.currency,
        balance: account.balance,
        state: account.state,
        updatedAt: account.updated_at,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load Revolut Business accounts" },
      { status: 500 },
    );
  }
}
