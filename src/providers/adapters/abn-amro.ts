import { accounts, transactions } from "@/server/demo-data";
import { BaseProviderAdapter } from "@/providers/base-adapter";

export class AbnAmroAdapter extends BaseProviderAdapter {
  provider = "ABN_AMRO" as const;

  async listAccounts() {
    return accounts.filter((account) => account.source === this.provider);
  }

  async syncTransactions() {
    return transactions.filter((transaction) => transaction.accountId.includes("abn"));
  }
}
