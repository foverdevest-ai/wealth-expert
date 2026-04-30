import fs from "node:fs";
import path from "node:path";

export type OpenPaymentsStoredConsent = {
  consentId: string;
  authorisationId: string;
  bicFi: string;
  iban: string;
  currency: string;
  oauthUrl?: string;
  createdAt: string;
  completedAt?: string;
};

const STORE_PATH = path.join(process.cwd(), ".local", "open-payments-consent.json");

export function readOpenPaymentsConsent(): OpenPaymentsStoredConsent | null {
  if (!fs.existsSync(STORE_PATH)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(STORE_PATH, "utf8")) as OpenPaymentsStoredConsent;
}

export function writeOpenPaymentsConsent(consent: OpenPaymentsStoredConsent) {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(consent, null, 2));
}

export function updateOpenPaymentsConsent(update: Partial<OpenPaymentsStoredConsent>) {
  const existing = readOpenPaymentsConsent();

  if (!existing) {
    throw new Error("No Open Payments consent found");
  }

  const next = { ...existing, ...update };
  writeOpenPaymentsConsent(next);
  return next;
}
