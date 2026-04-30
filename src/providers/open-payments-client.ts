import type { Transaction } from "@/domain/types";
import type { NormalizedBalance } from "@/providers/types";
import crypto from "node:crypto";

type OpenPaymentsEnvironment = "sandbox" | "production";

type OpenPaymentsClientOptions = {
  clientId?: string;
  clientSecret?: string;
  scope?: string;
  authHost?: string;
  apiHost?: string;
  consentId?: string;
  bicFi?: string;
  psuIpAddress?: string;
  environment?: OpenPaymentsEnvironment;
};

type TokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: "Bearer";
  scope?: string;
};

type OpenPaymentsAccount = {
  resourceId: string;
  iban?: string;
  currency?: "EUR" | "GBP" | "USD";
  name?: string;
  product?: string;
  cashAccountType?: string;
};

type AccountsResponse = {
  accounts?: OpenPaymentsAccount[];
};

type BalanceResponse = {
  balances?: Array<{
    balanceAmount: {
      amount: string;
      currency: "EUR" | "GBP" | "USD";
    };
    balanceType: string;
    referenceDate?: string;
    lastChangeDateTime?: string;
  }>;
};

type TransactionsResponse = {
  transactions?: {
    booked?: OpenPaymentsTransaction[];
    pending?: OpenPaymentsTransaction[];
  };
};

type OpenPaymentsTransaction = {
  transactionId?: string;
  bookingDate?: string;
  valueDate?: string;
  creditorName?: string;
  debtorName?: string;
  remittanceInformationUnstructured?: string;
  transactionAmount: {
    amount: string;
    currency: string;
  };
};

const HOSTS = {
  sandbox: {
    auth: "https://auth.sandbox.openbankingplatform.com",
    api: "https://api.sandbox.openbankingplatform.com",
  },
  production: {
    auth: "https://auth.openbankingplatform.com",
    api: "https://api.openbankingplatform.com",
  },
} satisfies Record<OpenPaymentsEnvironment, { auth: string; api: string }>;

export class OpenPaymentsClient {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly scope: string;
  private readonly authHost: string;
  private readonly apiHost: string;
  private readonly consentId: string;
  private readonly bicFi: string;
  private readonly psuIpAddress: string;
  private accessToken = "";

  constructor(options: OpenPaymentsClientOptions = {}) {
    const environment = options.environment ?? parseEnvironment(process.env.OPENPAYMENTS_ENV);
    this.clientId = options.clientId ?? process.env.OPENPAYMENTS_CLIENT_ID ?? "";
    this.clientSecret = options.clientSecret ?? process.env.OPENPAYMENTS_CLIENT_SECRET ?? "";
    this.scope = options.scope ?? process.env.OPENPAYMENTS_SCOPE ?? "accountinformation corporate";
    this.authHost = options.authHost ?? process.env.OPENPAYMENTS_AUTH_HOST ?? HOSTS[environment].auth;
    this.apiHost = options.apiHost ?? process.env.OPENPAYMENTS_API_HOST ?? HOSTS[environment].api;
    this.consentId = options.consentId ?? process.env.OPENPAYMENTS_CONSENT_ID ?? "";
    this.bicFi = options.bicFi ?? process.env.OPENPAYMENTS_BICFI ?? "";
    this.psuIpAddress = options.psuIpAddress ?? process.env.OPENPAYMENTS_PSU_IP_ADDRESS ?? "127.0.0.1";
  }

  get isConfigured() {
    return Boolean(this.clientId && this.clientSecret);
  }

  async getAccessToken() {
    if (!this.isConfigured) {
      throw new Error("OPENPAYMENTS_CLIENT_ID and OPENPAYMENTS_CLIENT_SECRET are required");
    }

    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: "client_credentials",
      scope: this.scope,
    });
    const response = await fetch(`${this.authHost}/connect/token`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const token = await parseOpenPaymentsResponse<TokenResponse>(response);
    this.accessToken = token.access_token;
    return token;
  }

  async listAccounts() {
    const payload = await this.request<AccountsResponse>("/psd2/accountinformation/v1/accounts");
    return payload.accounts ?? [];
  }

  async syncBalances(): Promise<NormalizedBalance[]> {
    const accounts = await this.listAccounts();
    const balances = await Promise.all(
      accounts.map(async (account) => {
        const payload = await this.request<BalanceResponse>(
          `/psd2/accountinformation/v1/accounts/${account.resourceId}/balances`,
        );
        const balance =
          payload.balances?.find((entry) => entry.balanceType === "interimAvailable") ?? payload.balances?.[0];

        return {
          externalAccountId: account.resourceId,
          balance: Number(balance?.balanceAmount.amount ?? 0),
          currency: balance?.balanceAmount.currency ?? account.currency ?? "EUR",
          capturedAt: balance?.lastChangeDateTime ?? new Date().toISOString(),
        };
      }),
    );

    return balances;
  }

  async syncTransactions(from: Date, to: Date): Promise<Transaction[]> {
    const accounts = await this.listAccounts();
    const transactionGroups = await Promise.all(
      accounts.map(async (account) => {
        const params = new URLSearchParams({
          dateFrom: toIsoDate(from),
          dateTo: toIsoDate(to),
        });
        const payload = await this.request<TransactionsResponse>(
          `/psd2/accountinformation/v1/accounts/${account.resourceId}/transactions?${params}`,
        );
        const transactions = [...(payload.transactions?.booked ?? []), ...(payload.transactions?.pending ?? [])];

        return transactions.map((transaction, index) => normalizeTransaction(account.resourceId, transaction, index));
      }),
    );

    return transactionGroups.flat();
  }

  private async request<T>(path: string): Promise<T> {
    if (!this.accessToken) {
      await this.getAccessToken();
    }

    const response = await fetch(`${this.apiHost}${path}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        accept: "application/json",
        "Content-Type": "application/json",
        "PSU-IP-Address": this.psuIpAddress,
        "X-BicFi": this.bicFi,
        "X-Request-ID": crypto.randomUUID(),
        "Consent-ID": this.consentId,
      },
    });

    return parseOpenPaymentsResponse<T>(response);
  }
}

async function parseOpenPaymentsResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const payload = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    const detail = payload?.error_description ?? payload?.message ?? payload?.detail ?? response.statusText;
    throw new Error(`Open Payments API error ${response.status}: ${detail}`);
  }

  return payload as T;
}

function normalizeTransaction(accountId: string, transaction: OpenPaymentsTransaction, index: number): Transaction {
  const amount = Number(transaction.transactionAmount.amount);
  const date = transaction.bookingDate ?? transaction.valueDate ?? toIsoDate(new Date());

  return {
    id: transaction.transactionId ?? `openpayments-${accountId}-${date}-${index}`,
    date,
    description:
      transaction.remittanceInformationUnstructured ?? transaction.creditorName ?? transaction.debtorName ?? "ABN transaction",
    accountId: "acc-holding-abn",
    entityId: "entity-holding",
    categoryId: "cat-uncategorised",
    amount,
    direction: amount >= 0 ? "INFLOW" : "OUTFLOW",
    isInternalTransfer: false,
    isInvestmentRelated: false,
    liquidityImpact: "LIQUID",
    counterparty: transaction.creditorName ?? transaction.debtorName,
    tags: ["open-payments", accountId],
  };
}

function parseEnvironment(value?: string): OpenPaymentsEnvironment {
  return value === "production" ? "production" : "sandbox";
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
