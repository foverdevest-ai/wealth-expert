import fs from "node:fs";
import path from "node:path";
import { BitvavoClient } from "../src/providers/bitvavo-client";

loadDotEnv();

async function main() {
  const client = new BitvavoClient();

  if (!client.isConfigured) {
    throw new Error("BITVAVO_API_KEY and BITVAVO_API_SECRET are missing in .env");
  }

  const portfolio = await client.getPortfolioSummary();

  console.log("Bitvavo connection: OK");
  console.log(`Assets with balance: ${portfolio.lines.length}`);
  console.log(`Estimated value: EUR ${portfolio.totalValueEur.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}`);
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
