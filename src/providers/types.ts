import type { Account, AccountSourceType, InvestmentSnapshot, Transaction } from "@/domain/types";

export type ProviderConnectionState = {
  provider: AccountSourceType;
  connected: boolean;
  externalConnectionId?: string;
  expiresAt?: string;
};

export type NormalizedBalance = {
  externalAccountId: string;
  balance: number;
  currency: "EUR" | "GBP" | "USD";
  capturedAt: string;
};

export interface WealthProviderAdapter {
  provider: AccountSourceType;
  connect(): Promise<ProviderConnectionState>;
  refreshConnection(connection: ProviderConnectionState): Promise<ProviderConnectionState>;
  listAccounts(connection: ProviderConnectionState): Promise<Account[]>;
  syncBalances(connection: ProviderConnectionState): Promise<NormalizedBalance[]>;
  syncTransactions(connection: ProviderConnectionState, from: Date, to: Date): Promise<Transaction[]>;
  syncPositions?(connection: ProviderConnectionState): Promise<InvestmentSnapshot[]>;
  syncPerformanceData?(connection: ProviderConnectionState): Promise<InvestmentSnapshot[]>;
}
