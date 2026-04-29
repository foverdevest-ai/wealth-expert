import { accounts, transactions } from "@/server/demo-data";
import { BaseProviderAdapter } from "@/providers/base-adapter";

export class RevolutBusinessAdapter extends BaseProviderAdapter {
  provider = "REVOLUT" as const;

  async listAccounts() {
    return accounts.filter((account) => account.source === this.provider);
  }

  async syncTransactions() {
    return transactions.filter((transaction) => transaction.accountId === "acc-revolut-uk");
  }
}
