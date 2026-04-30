import { NextResponse } from "next/server";
import { readPlaidConnection } from "@/server/plaid-store";

export async function GET() {
  const connection = readPlaidConnection();

  return NextResponse.json({
    configured: Boolean(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET),
    environment: process.env.PLAID_ENV ?? "sandbox",
    connected: Boolean(connection),
    institutionName: connection?.institutionName,
    institutionId: connection?.institutionId,
    connectedAt: connection?.connectedAt,
    lastSyncedAt: connection?.lastSyncedAt,
  });
}
