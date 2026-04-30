import fs from "node:fs";
import path from "node:path";
import { PlaidClient } from "../src/providers/plaid-client";

loadDotEnv();

async function main() {
  const client = new PlaidClient();

  if (!client.isConfigured) {
    throw new Error("Plaid is not configured. Add PLAID_CLIENT_ID and PLAID_SECRET to .env.");
  }

  const result = await client.searchInstitutions("ABN AMRO", ["NL"], ["transactions"]);

  console.log("Plaid connection: OK");
  console.log(`ABN AMRO matches with transactions in NL: ${result.institutions.length}`);

  for (const institution of result.institutions) {
    console.log(`${institution.name}: ${institution.institution_id}`);
    console.log(`Products: ${institution.products.join(", ")}`);
    console.log(`OAuth: ${institution.oauth ? "yes" : "no"}`);
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
