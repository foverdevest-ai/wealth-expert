import crypto from "node:crypto";
import fs from "node:fs";

type RevolutClientOptions = {
  baseUrl?: string;
  authUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  clientAssertion?: string;
  clientId?: string;
  issuer?: string;
  privateKeyPath?: string;
};

type RevolutTokenResponse = {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  refresh_token?: string;
};

export type RevolutAccount = {
  id: string;
  name: string;
  balance: number;
  currency: "EUR" | "GBP" | "USD";
  state: string;
  public: boolean;
  created_at?: string;
  updated_at?: string;
};

const DEFAULT_BASE_URL = "https://b2b.revolut.com/api/1.0";
const CLIENT_ASSERTION_TYPE = "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";

export class RevolutBusinessClient {
  private readonly baseUrl: string;
  private readonly authUrl: string;
  private accessToken: string;
  private readonly refreshToken: string;
  private readonly clientAssertion: string;
  private readonly clientId: string;
  private readonly issuer: string;
  private readonly privateKeyPath: string;

  constructor(options: RevolutClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? process.env.REVOLUT_BUSINESS_BASE_URL ?? DEFAULT_BASE_URL;
    this.authUrl = options.authUrl ?? process.env.REVOLUT_BUSINESS_AUTH_URL ?? `${this.baseUrl}/auth/token`;
    this.accessToken = options.accessToken ?? process.env.REVOLUT_BUSINESS_ACCESS_TOKEN ?? "";
    this.refreshToken = options.refreshToken ?? process.env.REVOLUT_BUSINESS_REFRESH_TOKEN ?? "";
    this.clientAssertion = options.clientAssertion ?? process.env.REVOLUT_BUSINESS_CLIENT_ASSERTION ?? "";
    this.clientId = options.clientId ?? process.env.REVOLUT_BUSINESS_CLIENT_ID ?? "";
    this.issuer = options.issuer ?? process.env.REVOLUT_BUSINESS_ISSUER ?? "";
    this.privateKeyPath = options.privateKeyPath ?? process.env.REVOLUT_BUSINESS_PRIVATE_KEY_PATH ?? "";
  }

  get isConfigured() {
    return Boolean(this.accessToken || (this.refreshToken && this.getClientAssertion()));
  }

  async getAccounts() {
    return this.request<RevolutAccount[]>("/accounts");
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error("REVOLUT_BUSINESS_REFRESH_TOKEN is required to refresh the access token");
    }

    const clientAssertion = this.getClientAssertion();

    if (!clientAssertion) {
      throw new Error("REVOLUT_BUSINESS_CLIENT_ASSERTION or JWT settings are required");
    }

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: this.refreshToken,
      client_assertion_type: CLIENT_ASSERTION_TYPE,
      client_assertion: clientAssertion,
    });

    const response = await fetch(this.authUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const token = await parseRevolutResponse<RevolutTokenResponse>(response);
    this.accessToken = token.access_token;
    return token;
  }

  private async request<T>(path: string, retryAfterRefresh = true): Promise<T> {
    if (!this.accessToken) {
      await this.refreshAccessToken();
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (response.status === 401 && retryAfterRefresh && this.refreshToken) {
      await this.refreshAccessToken();
      return this.request<T>(path, false);
    }

    return parseRevolutResponse<T>(response);
  }

  private getClientAssertion() {
    if (this.clientAssertion) {
      return this.clientAssertion;
    }

    if (!this.clientId || !this.issuer || !this.privateKeyPath) {
      return "";
    }

    const privateKey = fs.readFileSync(this.privateKeyPath, "utf8");
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "RS256", typ: "JWT" };
    const payload = {
      iss: this.issuer,
      sub: this.clientId,
      aud: "https://revolut.com",
      exp: now + 15 * 60,
    };
    const unsignedToken = `${base64UrlJson(header)}.${base64UrlJson(payload)}`;
    const signature = crypto.createSign("RSA-SHA256").update(unsignedToken).sign(privateKey, "base64url");

    return `${unsignedToken}.${signature}`;
  }
}

async function parseRevolutResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const payload = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    const message = payload?.message ?? payload?.error_description ?? payload?.error ?? response.statusText;
    throw new Error(`Revolut Business API error ${response.status}: ${message}`);
  }

  return payload as T;
}

function base64UrlJson(value: Record<string, unknown>) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}
