import { NextResponse } from "next/server";
import { RevolutBusinessClient } from "@/providers/revolut-client";

export async function GET() {
  const client = new RevolutBusinessClient();

  return NextResponse.json({
    configured: client.isConfigured,
    baseUrl: process.env.REVOLUT_BUSINESS_BASE_URL ?? "https://b2b.revolut.com/api/1.0",
    hasAccessToken: Boolean(process.env.REVOLUT_BUSINESS_ACCESS_TOKEN),
    hasRefreshToken: Boolean(process.env.REVOLUT_BUSINESS_REFRESH_TOKEN),
    hasClientAssertion: Boolean(process.env.REVOLUT_BUSINESS_CLIENT_ASSERTION),
    hasPrivateKeyPath: Boolean(process.env.REVOLUT_BUSINESS_PRIVATE_KEY_PATH),
  });
}
