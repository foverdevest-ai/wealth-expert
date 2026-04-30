import fs from "node:fs";
import path from "node:path";
import { GoCardlessBankDataClient } from "../src/providers/gocardless-client";

loadDotEnv();

async function main() {
  const institutionId = process.env.GOCARDLESS_INSTITUTION_ID;
  const redirectUrl = process.env.GOCARDLESS_REDIRECT_URI ?? "http://localhost:3000/settings";

  if (!institutionId) {
    throw new Error("Set GOCARDLESS_INSTITUTION_ID in .env first. Use npm run gocardless:check to find bank IDs.");
  }

  const client = new GoCardlessBankDataClient();
  const requisition = await client.createRequisitionLink({
    institutionId,
    redirectUrl,
    reference: `wealth-expert-${Date.now()}`,
  });

  console.log("Consent link created:");
  console.log(requisition.link);
  console.log(`After completing it, add this to .env: GOCARDLESS_REQUISITION_ID=${requisition.id}`);
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
