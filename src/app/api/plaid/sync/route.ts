import { NextResponse } from "next/server";
import { PlaidClient } from "@/providers/plaid-client";
import { readPlaidConnection, updatePlaidConnection } from "@/server/plaid-store";

export async function POST() {
  try {
    const connection = readPlaidConnection();

    if (!connection) {
      return NextResponse.json({ error: "Connect Plaid before syncing transactions" }, { status: 400 });
    }

    const client = new PlaidClient();
    let cursor = connection.cursor;
    const added = [];
    const modified = [];
    const removed = [];
    let hasMore = true;

    while (hasMore) {
      const response = await client.syncTransactions(connection.accessToken, cursor);
      added.push(...response.added);
      modified.push(...response.modified);
      removed.push(...response.removed);
      cursor = response.next_cursor;
      hasMore = response.has_more;
    }

    updatePlaidConnection({
      cursor,
      lastSyncedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      addedCount: added.length,
      modifiedCount: modified.length,
      removedCount: removed.length,
      sample: added.slice(0, 5).map((transaction) => ({
        id: transaction.transaction_id,
        date: transaction.date,
        name: transaction.name,
        amount: transaction.amount,
        currency: transaction.iso_currency_code,
        pending: transaction.pending,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to sync Plaid transactions" },
      { status: 500 },
    );
  }
}
