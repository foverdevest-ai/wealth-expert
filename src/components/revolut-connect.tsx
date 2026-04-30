"use client";

import { useCallback, useEffect, useState } from "react";

type RevolutStatus = {
  configured: boolean;
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  hasClientAssertion: boolean;
  hasPrivateKeyPath: boolean;
};

export function RevolutConnect() {
  const [status, setStatus] = useState<RevolutStatus | null>(null);
  const [message, setMessage] = useState("Ready for Revolut Business credentials.");
  const [isBusy, setIsBusy] = useState(false);

  const loadStatus = useCallback(async () => {
    const response = await fetch("/api/revolut/status");
    setStatus((await response.json()) as RevolutStatus);
  }, []);

  useEffect(() => {
    // Status is an external provider snapshot; loading it on mount is intentional for this connection card.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadStatus();
  }, [loadStatus]);

  async function loadAccounts() {
    setIsBusy(true);
    setMessage("Loading Revolut Business accounts...");

    try {
      const response = await fetch("/api/revolut/accounts", { method: "POST" });
      const payload = (await response.json()) as { accounts?: unknown[]; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load Revolut accounts");
      }

      setMessage(`Loaded ${payload.accounts?.length ?? 0} Revolut account(s).`);
      await loadStatus();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load Revolut accounts");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-white/80 bg-white/45 p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-sm font-bold">Revolut Business</div>
          <div className="mt-1 text-xs uppercase text-[var(--muted)]">UK LTD - business api</div>
        </div>
        <div className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold">
          {status?.configured ? "READY" : "MISSING ENV"}
        </div>
      </div>
      <div className="mt-3 space-y-1 text-xs leading-5 text-[var(--muted)]">
        <div>Access token: {status?.hasAccessToken ? "present" : "missing"}</div>
        <div>Refresh token: {status?.hasRefreshToken ? "present" : "missing"}</div>
        <div>Client assertion/private key: {status?.hasClientAssertion || status?.hasPrivateKeyPath ? "present" : "missing"}</div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="pill-control px-4 py-2 text-sm font-bold text-white" disabled={isBusy || !status?.configured} onClick={loadAccounts} style={{ background: "var(--accent)" }} type="button">
          Test accounts
        </button>
      </div>
      <div className="mt-3 text-xs text-[var(--muted)]">{message}</div>
    </div>
  );
}
