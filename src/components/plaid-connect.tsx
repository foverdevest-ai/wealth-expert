"use client";

import { useEffect, useState } from "react";

type PlaidStatus = {
  configured: boolean;
  environment: string;
  connected: boolean;
  institutionName?: string;
  institutionId?: string;
  connectedAt?: string;
  lastSyncedAt?: string;
};

type PlaidHandler = {
  open: () => void;
  exit: (options?: { force?: boolean }) => void;
};

type PlaidMetadata = {
  institution?: {
    name?: string;
    institution_id?: string;
  };
};

declare global {
  interface Window {
    Plaid?: {
      create: (options: {
        token: string;
        onSuccess: (publicToken: string, metadata: PlaidMetadata) => void;
        onExit?: (error: unknown, metadata: unknown) => void;
      }) => PlaidHandler;
    };
  }
}

export function PlaidConnect() {
  const [status, setStatus] = useState<PlaidStatus | null>(null);
  const [message, setMessage] = useState("Ready to connect ABN AMRO via Plaid.");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    void loadStatus();
  }, []);

  async function loadStatus() {
    const response = await fetch("/api/plaid/status");
    setStatus((await response.json()) as PlaidStatus);
  }

  async function ensurePlaidScript() {
    if (window.Plaid) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Unable to load Plaid Link"));
      document.body.appendChild(script);
    });
  }

  async function connect() {
    setIsBusy(true);
    setMessage("Creating Plaid Link session...");

    try {
      await ensurePlaidScript();
      const tokenResponse = await fetch("/api/plaid/link-token", { method: "POST" });
      const tokenPayload = (await tokenResponse.json()) as { link_token?: string; error?: string };

      if (!tokenResponse.ok || !tokenPayload.link_token) {
        throw new Error(tokenPayload.error ?? "No Plaid link token returned");
      }

      const handler = window.Plaid?.create({
        token: tokenPayload.link_token,
        onSuccess: async (publicToken, metadata) => {
          try {
            setMessage("Exchanging Plaid token...");
            const exchangeResponse = await fetch("/api/plaid/exchange-public-token", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ public_token: publicToken, metadata }),
            });
            const exchangePayload = (await exchangeResponse.json()) as { error?: string; institution?: string };

            if (!exchangeResponse.ok) {
              throw new Error(exchangePayload.error ?? "Unable to connect Plaid account");
            }

            setMessage(`Connected ${exchangePayload.institution ?? "Plaid account"}.`);
            await loadStatus();
          } catch (error) {
            setMessage(error instanceof Error ? error.message : "Plaid connection failed");
          } finally {
            setIsBusy(false);
          }
        },
        onExit: () => {
          setMessage("Plaid Link was closed.");
          setIsBusy(false);
        },
      });

      handler?.open();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Plaid connection failed");
      setIsBusy(false);
    }
  }

  async function sync() {
    setIsBusy(true);
    setMessage("Syncing Plaid transactions...");

    try {
      const response = await fetch("/api/plaid/sync", { method: "POST" });
      const payload = (await response.json()) as { addedCount?: number; modifiedCount?: number; removedCount?: number; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Plaid sync failed");
      }

      setMessage(
        `Synced ${payload.addedCount ?? 0} new, ${payload.modifiedCount ?? 0} modified, ${payload.removedCount ?? 0} removed transactions.`,
      );
      await loadStatus();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Plaid sync failed");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-white/80 bg-white/45 p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-sm font-bold">ABN AMRO via Plaid</div>
          <div className="mt-1 text-xs uppercase text-[var(--muted)]">
            {status?.environment ?? "sandbox"} · personal read-only
          </div>
        </div>
        <div className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold">
          {status?.connected ? "CONNECTED" : status?.configured ? "READY" : "MISSING ENV"}
        </div>
      </div>
      <div className="mt-3 space-y-1 text-xs leading-5 text-[var(--muted)]">
        <div>{status?.institutionName ?? "ABN AMRO NL supports transactions and OAuth in Plaid."}</div>
        <div>{status?.connectedAt ? `Connected ${new Date(status.connectedAt).toLocaleString("nl-NL")}` : "No local Plaid item connected yet."}</div>
        {status?.lastSyncedAt ? <div>Last sync {new Date(status.lastSyncedAt).toLocaleString("nl-NL")}</div> : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="pill-control px-4 py-2 text-sm font-bold text-white" disabled={isBusy} onClick={connect} style={{ background: "var(--accent)" }} type="button">
          Connect ABN AMRO
        </button>
        <button className="pill-control px-4 py-2 text-sm font-bold" disabled={isBusy || !status?.connected} onClick={sync} type="button">
          Sync transactions
        </button>
      </div>
      <div className="mt-3 text-xs text-[var(--muted)]">{message}</div>
    </div>
  );
}
