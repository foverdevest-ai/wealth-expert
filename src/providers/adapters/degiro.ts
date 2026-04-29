import { accounts, investmentSnapshots, transactions } from "@/server/demo-data";
import { BaseProviderAdapter } from "@/providers/base-adapter";

export class DegiroAdapter extends BaseProviderAdapter {
  provider = "DEGIRO" as const;

  async listAccounts() {
    return accounts.filter((account) => account.source === this.provider);
  }

  async syncTransactions() {
    return transactions.filter((transaction) => transaction.accountId === "acc-degiro");
  }

  async syncPositions() {
    return investmentSnapshots.filter((snapshot) => snapshot.provider === "DEGIRO");
  }

  async syncPerformanceData() {
    return this.syncPositions();
  }
}
