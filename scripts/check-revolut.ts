import fs from "node:fs";
import path from "node:path";
import { RevolutBusinessClient } from "../src/providers/revolut-client";

loadDotEnv();

async function main() {
  const client = new RevolutBusinessClient();

  if (!client.isConfigured) {
    throw new Error(
      "Revolut is not configured. Add REVOLUT_BUSINESS_ACCESS_TOKEN, or REFRESH_TOKEN plus client assertion settings.",
    );
  }

  const accounts = await client.getAccounts();
  const activeAccounts = accounts.filter((account) => account.state === "active");
  const totalByCurrency = activeAccounts.reduce<Record<string, number>>((totals, account) => {
    totals[account.currency] = (totals[account.currency] ?? 0) + account.balance;
    return totals;
  }, {});

  console.log("Revolut Business connection: OK");
  console.log(`Active accounts: ${activeAccounts.length}`);

  for (const [currency, total] of Object.entries(totalByCurrency)) {
    console.log(`${currency} balance: ${total.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}`);
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
