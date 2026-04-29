import crypto from "node:crypto";

type BitvavoBalance = {
  symbol: string;
  available: string;
  inOrder: string;
};

type BitvavoPrice = {
  market: string;
  price: string;
};

export type BitvavoPortfolioLine = {
  symbol: string;
  amount: number;
  valueEur: number;
};

export type BitvavoPortfolioSummary = {
  totalValueEur: number;
  lines: BitvavoPortfolioLine[];
};

type BitvavoClientOptions = {
  apiKey?: string;
  apiSecret?: string;
  baseUrl?: string;
};

const DEFAULT_BASE_URL = "https://api.bitvavo.com/v2";

export class BitvavoClient {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly baseUrl: string;

  constructor(options: BitvavoClientOptions = {}) {
    this.apiKey = options.apiKey ?? process.env.BITVAVO_API_KEY ?? "";
    this.apiSecret = options.apiSecret ?? process.env.BITVAVO_API_SECRET ?? "";
    this.baseUrl = options.baseUrl ?? process.env.BITVAVO_API_BASE_URL ?? DEFAULT_BASE_URL;
  }

  get isConfigured() {
    return Boolean(this.apiKey && this.apiSecret);
  }

  async getBalances() {
    return this.privateRequest<BitvavoBalance[]>("/balance");
  }

  async getPortfolioSummary(): Promise<BitvavoPortfolioSummary> {
    const balances = await this.getBalances();
    const nonZeroBalances = balances
      .map((balance) => ({
        symbol: balance.symbol,
        amount: Number(balance.available) + Number(balance.inOrder),
      }))
      .filter((balance) => balance.amount > 0);

    const lines = await Promise.all(
      nonZeroBalances.map(async (balance) => ({
        symbol: balance.symbol,
        amount: balance.amount,
        valueEur: await this.resolveValueEur(balance.symbol, balance.amount),
      })),
    );

    return {
      totalValueEur: roundMoney(lines.reduce((sum, line) => sum + line.valueEur, 0)),
      lines,
    };
  }

  private async resolveValueEur(symbol: string, amount: number) {
    if (symbol === "EUR") {
      return roundMoney(amount);
    }

    const market = `${symbol}-EUR`;
    const price = await this.publicRequest<BitvavoPrice>(`/ticker/price?market=${market}`);
    return roundMoney(amount * Number(price.price));
  }

  private async publicRequest<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return parseBitvavoResponse<T>(response);
  }

  private async privateRequest<T>(path: string, method = "GET", body = ""): Promise<T> {
    if (!this.isConfigured) {
      throw new Error("BITVAVO_API_KEY and BITVAVO_API_SECRET are required");
    }

    const timestamp = Date.now().toString();
    const signaturePath = `/v2${path}`;
    const signature = crypto
      .createHmac("sha256", this.apiSecret)
      .update(`${timestamp}${method}${signaturePath}${body}`)
      .digest("hex");

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Bitvavo-Access-Key": this.apiKey,
        "Bitvavo-Access-Signature": signature,
        "Bitvavo-Access-Timestamp": timestamp,
        "Bitvavo-Access-Window": "10000",
      },
      body: body || undefined,
    });

    return parseBitvavoResponse<T>(response);
  }
}

async function parseBitvavoResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const payload = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    const message = payload?.error ?? payload?.message ?? response.statusText;
    throw new Error(`Bitvavo API error ${response.status}: ${message}`);
  }

  return payload as T;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
