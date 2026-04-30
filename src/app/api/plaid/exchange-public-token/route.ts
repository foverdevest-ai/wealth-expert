import { NextResponse } from "next/server";
import { PlaidClient } from "@/providers/plaid-client";
import { writePlaidConnection } from "@/server/plaid-store";

type ExchangeBody = {
  public_token?: string;
  metadata?: {
    institution?: {
      name?: string;
      institution_id?: string;
    };
  };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ExchangeBody;

    if (!body.public_token) {
      return NextResponse.json({ error: "public_token is required" }, { status: 400 });
    }

    const client = new PlaidClient();
    const exchange = await client.exchangePublicToken(body.public_token);

    writePlaidConnection({
      accessToken: exchange.access_token,
      itemId: exchange.item_id,
      institutionName: body.metadata?.institution?.name,
      institutionId: body.metadata?.institution?.institution_id,
      connectedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      connected: true,
      item_id: exchange.item_id,
      institution: body.metadata?.institution?.name ?? "Plaid institution",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to exchange Plaid public token" },
      { status: 500 },
    );
  }
}
