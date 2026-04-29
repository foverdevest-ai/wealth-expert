import { accounts, investmentSnapshots, transactions } from "@/server/demo-data";
import { BaseProviderAdapter } from "@/providers/base-adapter";
import { BitvavoClient } from "@/providers/bitvavo-client";

export class BitvavoAdapter extends BaseProviderAdapter {
  provider = "BITVAVO" as const;
  private readonly client = new BitvavoClient();

  async listAccounts() {
    const demoAccount = accounts.find((account) => account.id === "acc-bitvavo");

    if (!this.client.isConfigured || !demoAccount) {
      return accounts.filter((account) => account.source === this.provider);
    }

    const portfolio = await this.client.getPortfolioSummary();

    return [
      {
        ...demoAccount,
        balance: portfolio.totalValueEur,
        lastUpdated: new Date().toISOString(),
        syncStatus: "HEALTHY" as const,
      },
    ];
  }

  async syncTransactions() {
    return transactions.filter((transaction) => transaction.accountId === "acc-bitvavo");
  }

  async syncPositions() {
    if (this.client.isConfigured) {
      const portfolio = await this.client.getPortfolioSummary();
      const month = new Date().toISOString().slice(0, 7);

      return [
        {
          id: `investment-bitvavo-live-${month}`,
          month,
          accountId: "acc-bitvavo",
          provider: "BITVAVO" as const,
          assetType: "CRYPTO" as const,
          contributed: investmentSnapshots.find((snapshot) => snapshot.provider === "BITVAVO")?.contributed ?? 0,
          currentValue: portfolio.totalValueEur,
          realizedGainLoss: 0,
        },
      ];
    }

    return investmentSnapshots.filter((snapshot) => snapshot.provider === "BITVAVO");
  }

  async syncPerformanceData() {
    return this.syncPositions();
  }
}
