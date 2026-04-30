import fs from "node:fs";
import path from "node:path";
import { OpenPaymentsClient } from "../src/providers/open-payments-client";

loadDotEnv();

async function main() {
  const client = new OpenPaymentsClient();

  if (!client.isConfigured) {
    throw new Error("Open Payments is not configured. Add OPENPAYMENTS_CLIENT_ID and OPENPAYMENTS_CLIENT_SECRET.");
  }

  const token = await client.getAccessToken();
  console.log("Open Payments token: OK");
  console.log(`Scope: ${token.scope ?? process.env.OPENPAYMENTS_SCOPE ?? "accountinformation corporate"}`);

  if (!process.env.OPENPAYMENTS_CONSENT_ID || !process.env.OPENPAYMENTS_BICFI) {
    console.log("AIS account check skipped: OPENPAYMENTS_CONSENT_ID and OPENPAYMENTS_BICFI are required after consent.");
    return;
  }

  const accounts = await client.listAccounts();
  console.log(`Accounts: ${accounts.length}`);

  for (const account of accounts) {
    console.log(`${account.name ?? account.product ?? "ABN account"}: ${account.currency ?? "EUR"} ${account.resourceId}`);
  }
}

function loadDotEnv() {
  const envPath = path.resolve(process.cwd(), ".env");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
