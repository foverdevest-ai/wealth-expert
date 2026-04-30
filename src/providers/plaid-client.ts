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
