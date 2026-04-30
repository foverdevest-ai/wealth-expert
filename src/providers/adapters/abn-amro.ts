import { accounts, transactions } from "@/server/demo-data";
import { BaseProviderAdapter } from "@/providers/base-adapter";
import { GoCardlessBankDataClient } from "@/providers/gocardless-client";

export class AbnAmroAdapter extends BaseProviderAdapter {
  provider = "ABN_AMRO" as const;
  private readonly bankDataClient = new GoCardlessBankDataClient();

  async listAccounts() {
    if (!this.bankDataClient.isConfigured || !this.bankDataClient.hasLinkedBank) {
      return accounts.filter((account) => account.source === this.provider);
    }

    const linkedAccounts = await this.bankDataClient.getAccountSummaries();
    const demoAccounts = accounts.filter((account) => account.source === this.provider);

    return linkedAccounts.map((linkedAccount, index) => ({
      ...(demoAccounts[index] ?? demoAccounts[0]),
      id: index === 0 ? "acc-private-abn" : `acc-abn-${linkedAccount.id}`,
      name: linkedAccount.name,
      balance: linkedAccount.balance,
      lastUpdated: linkedAccount.capturedAt,
      syncStatus: "HEALTHY" as const,
    }));
  }

  async syncBalances() {
    if (!this.bankDataClient.isConfigured || !this.bankDataClient.hasLinkedBank) {
      return [];
    }

    const linkedAccounts = await this.bankDataClient.getAccountSummaries();

    return linkedAccounts.map((account) => ({
      externalAccountId: account.id,
      balance: account.balance,
      currency: account.currency,
      capturedAt: account.capturedAt,
    }));
  }

  async syncTransactions(_connection?: unknown, from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), to = new Date()) {
    if (this.bankDataClient.isConfigured && this.bankDataClient.hasLinkedBank) {
      const accountIds = await this.bankDataClient.getLinkedAccountIds();
      const transactionGroups = await Promise.all(
        accountIds.map((accountId) => this.bankDataClient.getTransactions(accountId, from, to)),
      );

      return transactionGroups.flat();
    }

    return transactions.filter((transaction) => transaction.accountId.includes("abn"));
  }
}
