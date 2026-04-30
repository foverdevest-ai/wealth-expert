import type { Account, AccountSourceType, Transaction } from "@/domain/types";
import type { NormalizedBalance, ProviderConnectionState, WealthProviderAdapter } from "@/providers/types";

export abstract class BaseProviderAdapter implements WealthProviderAdapter {
  abstract provider: AccountSourceType;

  async connect(): Promise<ProviderConnectionState> {
    return {
      provider: this.provider,
      connected: true,
      externalConnectionId: `${this.provider.toLowerCase()}-demo-connection`,
    };
  }

  async refreshConnection(connection: ProviderConnectionState): Promise<ProviderConnectionState> {
    return { ...connection, connected: true };
  }

  async syncBalances(): Promise<NormalizedBalance[]> {
    return [];
  }

  async syncTransactions(_connection?: ProviderConnectionState, _from?: Date, _to?: Date): Promise<Transaction[]> {
    void _connection;
    void _from;
    void _to;
    return [];
  }

  async listAccounts(): Promise<Account[]> {
    return [];
  }
}
