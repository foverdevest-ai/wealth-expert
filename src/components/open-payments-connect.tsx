"use client";

import { useCallback, useEffect, useState } from "react";

type OpenPaymentsStatus = {
  configured: boolean;
  environment: string;
  hasConsent: boolean;
  consentId?: string;
  authorisationId?: string;
  bicFi?: string;
  iban?: string;
  createdAt?: string;
  completedAt?: string;
};

export function OpenPaymentsConnect() {
  const [status, setStatus] = useState<OpenPaymentsStatus | null>(null);
  const [iban, setIban] = useState("");
  const [bicFi, setBicFi] = useState("ABNANL2A");
  const [message, setMessage] = useState("Ready to create ABN Business consent.");
  const [isBusy, setIsBusy] = useState(false);

  const loadStatus = useCallback(async () => {
    const response = await fetch("/api/open-payments/status");
    const payload = (await response.json()) as OpenPaymentsStatus;
    setStatus(payload);
    setBicFi(payload.bicFi ?? "ABNANL2A");
  }, []);

  useEffect(() => {
    // Status is an external provider snapshot; loading it on mount is intentional for this connection card.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadStatus();
  }, [loadStatus]);

  async function createConsent() {
    setIsBusy(true);
    setMessage("Creating Open Payments consent...");

    try {
      const response = await fetch("/api/open-payments/create-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iban, bicFi, currency: "EUR" }),
      });
      const payload = (await response.json()) as { oauthUrl?: string; error?: string };

      if (!response.ok || !payload.oauthUrl) {
        throw new Error(payload.error ?? "No Open Payments OAuth URL returned");
      }

      window.location.href = payload.oauthUrl;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Open Payments consent failed");
      setIsBusy(false);
    }
  }

  async function loadAccounts() {
    setIsBusy(true);
    setMessage("Loading ABN Business accounts...");

    try {
      const response = await fetch("/api/open-payments/accounts", { method: "POST" });
      const payload = (await response.json()) as { accounts?: unknown[]; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load accounts");
      }

      setMessage(`Loaded ${payload.accounts?.length ?? 0} Open Payments account(s).`);
      await loadStatus();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load Open Payments accounts");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-white/80 bg-white/45 p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-sm font-bold">ABN Holding via Open Payments</div>
          <div className="mt-1 text-xs uppercase text-[var(--muted)]">
            {status?.environment ?? "sandbox"} - accountinformation corporate
          </div>
        </div>
        <div className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold">
          {status?.completedAt ? "CONNECTED" : status?.configured ? "READY" : "MISSING ENV"}
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <input
          className="w-full rounded-md border border-[var(--border)] bg-white/70 px-3 py-2 text-sm outline-none"
          onChange={(event) => setIban(event.target.value)}
          placeholder="ABN Holding IBAN"
          value={iban}
        />
        <input
          className="w-full rounded-md border border-[var(--border)] bg-white/70 px-3 py-2 text-sm outline-none"
          onChange={(event) => setBicFi(event.target.value)}
          placeholder="BICFI"
          value={bicFi}
        />
      </div>
      <div className="mt-3 space-y-1 text-xs leading-5 text-[var(--muted)]">
        <div>{status?.consentId ? `Consent ${status.consentId}` : "No consent created yet."}</div>
        {status?.createdAt ? <div>Created {new Date(status.createdAt).toLocaleString("nl-NL")}</div> : null}
        {status?.completedAt ? <div>Completed {new Date(status.completedAt).toLocaleString("nl-NL")}</div> : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="pill-control px-4 py-2 text-sm font-bold text-white"
          disabled={isBusy || !status?.configured}
          onClick={createConsent}
          style={{ background: "var(--accent)" }}
          type="button"
        >
          Create consent
        </button>
        <button className="pill-control px-4 py-2 text-sm font-bold" disabled={isBusy || !status?.hasConsent} onClick={loadAccounts} type="button">
          Test accounts
        </button>
      </div>
      <div className="mt-3 text-xs text-[var(--muted)]">{message}</div>
    </div>
  );
}
