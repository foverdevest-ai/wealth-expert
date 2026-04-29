import { accounts, investmentSnapshots, transactions } from "@/server/demo-data";
import { BaseProviderAdapter } from "@/providers/base-adapter";

export class BitvavoAdapter extends BaseProviderAdapter {
  provider = "BITVAVO" as const;

  async listAccounts() {
    return accounts.filter((account) => account.source === this.provider);
  }

  async syncTransactions() {
    return transactions.filter((transaction) => transaction.accountId === "acc-bitvavo");
  }

  async syncPositions() {
    return investmentSnapshots.filter((snapshot) => snapshot.provider === "BITVAVO");
  }

  async syncPerformanceData() {
    return this.syncPositions();
  }
}
