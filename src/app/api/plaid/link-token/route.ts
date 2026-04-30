import { NextResponse } from "next/server";
import { PlaidClient } from "@/providers/plaid-client";

export async function POST() {
  try {
    const client = new PlaidClient();
    const token = await client.createLinkToken();

    return NextResponse.json(token);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create Plaid link token" },
      { status: 500 },
    );
  }
}
