import type { Transaction } from "@/domain/types";

type GoCardlessClientOptions = {
  baseUrl?: string;
  secretId?: string;
  secretKey?: string;
  accessToken?: string;
  refreshToken?: string;
  requisitionId?: string;
};

type TokenResponse = {
  access?: string;
  access_expires?: number;
  refresh?: string;
  refresh_expires?: number;
};

export type GoCardlessInstitution = {
  id: string;
  name: string;
  bic?: string;
  transaction_total_days?: string;
  countries: string[];
  logo?: string;
  max_access_valid_for_days?: string;
};

type Requisition = {
  id: string;
  status: string;
  accounts: string[];
  link?: string;
};

type AccountDetailsResponse = {
  account?: {
    iban?: string;
    currency?: "EUR" | "GBP" | "USD";
    name?: string;
    ownerName?: string;
  };
};

type BalancesResponse = {
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
    booked?: GoCardlessTransaction[];
    pending?: GoCardlessTransaction[];
  };
};

type GoCardlessTransaction = {
  transactionId?: string;
  bookingDate?: string;
  valueDate?: string;
  debtorName?: string;
  creditorName?: string;
  remittanceInformationUnstructured?: string;
  transactionAmount: {
    amount: string;
    currency: string;
  };
};

export type BankAccountSummary = {
  id: string;
  name: string;
  iban?: string;
  currency: "EUR" | "GBP" | "USD";
  balance: number;
  capturedAt: string;
};

const DEFAULT_BASE_URL = "https://bankaccountdata.gocardless.com/api/v2";

export class GoCardlessBankDataClient {
  private readonly baseUrl: string;
  private readonly secretId: string;
  private readonly secretKey: string;
  private accessToken: string;
  private refreshToken: string;
  private readonly requisitionId: string;

  constructor(options: GoCardlessClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? process.env.GOCARDLESS_BANK_DATA_BASE_URL ?? DEFAULT_BASE_URL;
    this.secretId = options.secretId ?? process.env.GOCARDLESS_SECRET_ID ?? "";
    this.secretKey = options.secretKey ?? process.env.GOCARDLESS_SECRET_KEY ?? "";
    this.accessToken = options.accessToken ?? process.env.GOCARDLESS_ACCESS_TOKEN ?? "";
    this.refreshToken = options.refreshToken ?? process.env.GOCARDLESS_REFRESH_TOKEN ?? "";
    this.requisitionId = options.requisitionId ?? process.env.GOCARDLESS_REQUISITION_ID ?? "";
  }

  get isConfigured() {
    return Boolean((this.secretId && this.secretKey) || this.accessToken || this.refreshToken);
  }

  get hasLinkedBank() {
    return Boolean(this.requisitionId);
  }

  async createToken() {
    const token = await this.request<TokenResponse>("/token/new/", {
      method: "POST",
      body: JSON.stringify({
        secret_id: this.secretId,
        secret_key: this.secretKey,
      }),
      authenticated: false,
    });

    this.refreshToken = token.refresh ?? this.refreshToken;
    return token;
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      const token = await this.createToken();
      this.accessToken = token.access ?? this.accessToken;
      return token;
    }

    const token = await this.request<TokenResponse>("/token/refresh/", {
      method: "POST",
      body: JSON.stringify({ refresh: this.refreshToken }),
      authenticated: false,
    });

    this.accessToken = token.access ?? this.accessToken;
    return token;
  }

  async listInstitutions(country = "NL") {
    return this.request<GoCardlessInstitution[]>(`/institutions/?country=${country}`);
  }

  async createRequisitionLink(input: {
    institutionId: string;
    redirectUrl: string;
    reference: string;
    userLanguage?: string;
    maxHistoricalDays?: number;
    accessValidForDays?: number;
  }) {
    const agreement = await this.request<{ id: string }>("/agreements/enduser/", {
      method: "POST",
      body: JSON.stringify({
        institution_id: input.institutionId,
        max_historical_days: input.maxHistoricalDays ?? 730,
        access_valid_for_days: input.accessValidForDays ?? 90,
        access_scope: ["balances", "details", "transactions"],
      }),
    });

    return this.request<Requisition>("/requisitions/", {
      method: "POST",
      body: JSON.stringify({
        redirect: input.redirectUrl,
        institution_id: input.institutionId,
        reference: input.reference,
        agreement: agreement.id,
        user_language: input.userLanguage ?? "NL",
      }),
    });
  }

  async getLinkedAccountIds() {
    if (!this.requisitionId) {
      return [];
    }

    const requisition = await this.request<Requisition>(`/requisitions/${this.requisitionId}/`);
    return requisition.accounts;
  }

  async getAccountSummaries() {
    const accountIds = await this.getLinkedAccountIds();
    return Promise.all(accountIds.map((accountId) => this.getAccountSummary(accountId)));
  }

  async getTransactions(accountId: string, from: Date, to: Date): Promise<Transaction[]> {
    const params = new URLSearchParams({
      date_from: toIsoDate(from),
      date_to: toIsoDate(to),
    });
    const payload = await this.request<TransactionsResponse>(`/accounts/${accountId}/transactions/?${params}`);
    const booked = payload.transactions?.booked ?? [];
    const pending = payload.transactions?.pending ?? [];

    return [...booked, ...pending].map((transaction, index) => normalizeTransaction(accountId, transaction, index));
  }

  private async getAccountSummary(accountId: string): Promise<BankAccountSummary> {
    const [details, balances] = await Promise.all([
      this.request<AccountDetailsResponse>(`/accounts/${accountId}/details/`),
      this.request<BalancesResponse>(`/accounts/${accountId}/balances/`),
    ]);
    const preferredBalance =
      balances.balances?.find((balance) => balance.balanceType === "interimAvailable") ?? balances.balances?.[0];

    return {
      id: accountId,
      name: details.account?.name ?? details.account?.ownerName ?? "Linked bank account",
      iban: details.account?.iban,
      currency: preferredBalance?.balanceAmount.currency ?? details.account?.currency ?? "EUR",
      balance: Number(preferredBalance?.balanceAmount.amount ?? 0),
      capturedAt: preferredBalance?.lastChangeDateTime ?? new Date().toISOString(),
    };
  }

  private async request<T>(
    path: string,
    options: { method?: string; body?: string; authenticated?: boolean } = {},
  ): Promise<T> {
    const authenticated = options.authenticated ?? true;

    if (authenticated && !this.accessToken) {
      await this.refreshAccessToken();
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: options.method ?? "GET",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        ...(authenticated ? { Authorization: `Bearer ${this.accessToken}` } : {}),
      },
      body: options.body,
    });

    return parseGoCardlessResponse<T>(response);
  }
}

async function parseGoCardlessResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const payload = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    const detail = payload?.detail ?? payload?.summary ?? payload?.message ?? response.statusText;
    throw new Error(`GoCardless Bank Data API error ${response.status}: ${detail}`);
  }

  return payload as T;
}

function normalizeTransaction(accountId: string, transaction: GoCardlessTransaction, index: number): Transaction {
  const amount = Number(transaction.transactionAmount.amount);
  const date = transaction.bookingDate ?? transaction.valueDate ?? toIsoDate(new Date());
  const description =
    transaction.remittanceInformationUnstructured ?? transaction.creditorName ?? transaction.debtorName ?? "Bank transaction";

  return {
    id: transaction.transactionId ?? `gocardless-${accountId}-${date}-${index}`,
    date,
    description,
    accountId: "acc-private-abn",
    entityId: "entity-private",
    categoryId: "cat-uncategorised",
    amount,
    direction: amount >= 0 ? "INFLOW" : "OUTFLOW",
    isInternalTransfer: false,
    isInvestmentRelated: false,
    liquidityImpact: "LIQUID",
    counterparty: transaction.creditorName ?? transaction.debtorName,
    tags: ["open-banking", accountId],
  };
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
