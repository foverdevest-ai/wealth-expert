import { accounts, transactions } from "@/server/demo-data";
import { BaseProviderAdapter } from "@/providers/base-adapter";
import { RevolutBusinessClient } from "@/providers/revolut-client";

export class RevolutBusinessAdapter extends BaseProviderAdapter {
  provider = "REVOLUT" as const;
  private readonly client = new RevolutBusinessClient();

  async listAccounts() {
    const demoAccount = accounts.find((account) => account.id === "acc-revolut-uk");

    if (!this.client.isConfigured || !demoAccount) {
      return accounts.filter((account) => account.source === this.provider);
    }

    const revolutAccounts = await this.client.getAccounts();

    return revolutAccounts.map((account, index) => ({
      ...demoAccount,
      id: index === 0 ? demoAccount.id : `acc-revolut-${account.id}`,
      name: account.name,
      balance: account.balance,
      lastUpdated: account.updated_at ?? new Date().toISOString(),
      syncStatus: account.state === "active" ? ("HEALTHY" as const) : ("STALE" as const),
    }));
  }

  async syncBalances() {
    if (!this.client.isConfigured) {
      return [];
    }

    const revolutAccounts = await this.client.getAccounts();

    return revolutAccounts.map((account) => ({
      externalAccountId: account.id,
      balance: account.balance,
      currency: account.currency,
      capturedAt: account.updated_at ?? new Date().toISOString(),
    }));
  }

  async syncTransactions() {
    return transactions.filter((transaction) => transaction.accountId === "acc-revolut-uk");
  }
}
