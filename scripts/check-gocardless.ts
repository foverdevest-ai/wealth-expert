import fs from "node:fs";
import path from "node:path";
import { GoCardlessBankDataClient } from "../src/providers/gocardless-client";

loadDotEnv();

async function main() {
  const client = new GoCardlessBankDataClient();
  const country = process.env.GOCARDLESS_COUNTRY ?? "NL";

  if (!client.isConfigured) {
    throw new Error("GoCardless is not configured. Add GOCARDLESS_SECRET_ID and GOCARDLESS_SECRET_KEY to .env.");
  }

  const institutions = await client.listInstitutions(country);
  const relevantBanks = institutions.filter((institution) =>
    /(abn|bunq|ing|rabobank|asn|sns|knab|triodos)/i.test(institution.name),
  );

  console.log("GoCardless Bank Data connection: OK");
  console.log(`Institutions in ${country}: ${institutions.length}`);

  for (const institution of relevantBanks.slice(0, 12)) {
    console.log(`${institution.name}: ${institution.id}`);
  }

  if (!client.hasLinkedBank) {
    console.log("No linked bank yet. Add GOCARDLESS_REQUISITION_ID after creating and completing a consent link.");
    return;
  }

  const accounts = await client.getAccountSummaries();
  console.log(`Linked accounts: ${accounts.length}`);

  for (const account of accounts) {
    console.log(
      `${account.name}: ${account.currency} ${account.balance.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}`,
    );
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
