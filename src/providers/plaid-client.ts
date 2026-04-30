type PlaidEnvironment = "sandbox" | "development" | "production";

type PlaidClientOptions = {
  clientId?: string;
  secret?: string;
  environment?: PlaidEnvironment;
};

export type PlaidInstitution = {
  institution_id: string;
  name: string;
  products: string[];
  country_codes: string[];
  oauth: boolean;
};

type PlaidLinkTokenResponse = {
  link_token: string;
  expiration: string;
  request_id: string;
};

type PlaidPublicTokenExchangeResponse = {
  access_token: string;
  item_id: string;
  request_id: string;
};

export type PlaidTransaction = {
  transaction_id: string;
  account_id: string;
  name: string;
  merchant_name?: string | null;
  amount: number;
  iso_currency_code?: string | null;
  date: string;
  authorized_date?: string | null;
  pending: boolean;
  payment_channel: string;
};

type PlaidTransactionsSyncResponse = {
  added: PlaidTransaction[];
  modified: PlaidTransaction[];
  removed: Array<{ transaction_id: string }>;
  next_cursor: string;
  has_more: boolean;
  request_id: string;
};

const PLAID_BASE_URLS: Record<PlaidEnvironment, string> = {
  sandbox: "https://sandbox.plaid.com",
  development: "https://development.plaid.com",
  production: "https://production.plaid.com",
};

export class PlaidClient {
  private readonly clientId: string;
  private readonly secret: string;
  private readonly environment: PlaidEnvironment;
  private readonly baseUrl: string;

  constructor(options: PlaidClientOptions = {}) {
    this.clientId = options.clientId ?? process.env.PLAID_CLIENT_ID ?? "";
    this.secret = options.secret ?? process.env.PLAID_SECRET ?? "";
    this.environment = options.environment ?? parsePlaidEnvironment(process.env.PLAID_ENV);
    this.baseUrl = PLAID_BASE_URLS[this.environment];
  }

  get isConfigured() {
    return Boolean(this.clientId && this.secret);
  }

  async searchInstitutions(query: string, countryCodes = ["NL"], products = ["transactions"]) {
    return this.request<{ institutions: PlaidInstitution[] }>("/institutions/search", {
      query,
      country_codes: countryCodes,
      products,
    });
  }

  async getInstitutionById(institutionId: string, countryCodes = ["NL"]) {
    return this.request<{ institution: PlaidInstitution }>("/institutions/get_by_id", {
      institution_id: institutionId,
      country_codes: countryCodes,
    });
  }

  async createLinkToken() {
    return this.request<PlaidLinkTokenResponse>("/link/token/create", {
      user: {
        client_user_id: process.env.PLAID_CLIENT_USER_ID ?? "wealth-expert-single-user",
      },
      client_name: "Wealth Expert",
      products: parseList(process.env.PLAID_PRODUCTS, ["transactions"]),
      country_codes: parseList(process.env.PLAID_COUNTRY_CODES, ["NL"]),
      language: process.env.PLAID_LANGUAGE ?? "en",
      webhook: process.env.PLAID_WEBHOOK_URL || undefined,
    });
  }

  async exchangePublicToken(publicToken: string) {
    return this.request<PlaidPublicTokenExchangeResponse>("/item/public_token/exchange", {
      public_token: publicToken,
    });
  }

  async syncTransactions(accessToken: string, cursor?: string) {
    return this.request<PlaidTransactionsSyncResponse>("/transactions/sync", {
      access_token: accessToken,
      cursor,
    });
  }

  private async request<T>(path: string, body: Record<string, unknown>): Promise<T> {
    if (!this.isConfigured) {
      throw new Error("PLAID_CLIENT_ID and PLAID_SECRET are required");
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "PLAID-CLIENT-ID": this.clientId,
        "PLAID-SECRET": this.secret,
      },
      body: JSON.stringify(body),
    });

    return parsePlaidResponse<T>(response);
  }
}

async function parsePlaidResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const payload = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    const message = payload?.error_message ?? payload?.display_message ?? response.statusText;
    throw new Error(`Plaid API error ${response.status}: ${message}`);
  }

  return payload as T;
}

function parsePlaidEnvironment(value?: string): PlaidEnvironment {
  if (value === "development" || value === "production") {
    return value;
  }

  return "sandbox";
}

function parseList(value: string | undefined, fallback: string[]) {
  return value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : fallback;
}
