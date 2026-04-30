import fs from "node:fs";
import path from "node:path";

export type PlaidStoredConnection = {
  accessToken: string;
  itemId: string;
  cursor?: string;
  institutionName?: string;
  institutionId?: string;
  connectedAt: string;
  lastSyncedAt?: string;
};

const STORE_PATH = path.join(process.cwd(), ".local", "plaid-connection.json");

export function readPlaidConnection(): PlaidStoredConnection | null {
  if (!fs.existsSync(STORE_PATH)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(STORE_PATH, "utf8")) as PlaidStoredConnection;
}

export function writePlaidConnection(connection: PlaidStoredConnection) {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(connection, null, 2));
}

export function updatePlaidConnection(update: Partial<PlaidStoredConnection>) {
  const existing = readPlaidConnection();

  if (!existing) {
    throw new Error("No Plaid connection found");
  }

  const next = { ...existing, ...update };
  writePlaidConnection(next);
  return next;
}
