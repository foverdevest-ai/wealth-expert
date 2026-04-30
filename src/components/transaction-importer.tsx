"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";
import type { AccountSourceType } from "@/domain/types";
import type { TransactionAccountOption } from "@/server/transactions-data";
import { ActionButton } from "@/components/ui/action-button";

type ImportSource = Extract<AccountSourceType, "ABN_AMRO" | "REVOLUT" | "DEGIRO">;

type ImportPreview = {
  batchId: string;
  counts: {
    total: number;
    newRows: number;
    duplicateRows: number;
    errorRows: number;
  };
  rows: Array<{
    id: string;
    rowIndex: number;
    status: "NEW" | "DUPLICATE" | "ERROR" | "IMPORTED";
    duplicateReason?: string;
    errorMessage?: string;
    normalized?: {
      date?: string;
      description?: string;
      amount?: number;
      currency?: string;
      isInvestmentRelated?: boolean;
    };
  }>;
};

type ImportHistoryItem = {
  id: string;
  filename: string;
  source: AccountSourceType;
  status: string;
  importedRows: number;
  duplicateRows: number;
  errorRows: number;
  createdAt: Date | string;
};

const SOURCE_OPTIONS: Array<{ value: ImportSource; label: string }> = [
  { value: "ABN_AMRO", label: "ABN AMRO" },
  { value: "REVOLUT", label: "Revolut Business" },
  { value: "DEGIRO", label: "DEGIRO" },
];

export function TransactionImporter({
  accounts,
  history,
}: {
  accounts: TransactionAccountOption[];
  history: ImportHistoryItem[];
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [source, setSource] = useState<ImportSource>("ABN_AMRO");
  const [accountId, setAccountId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [message, setMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const eligibleAccounts = useMemo(
    () => accounts.filter((account) => account.source === source),
    [accounts, source],
  );
  const selectedAccountId = accountId || eligibleAccounts[0]?.id || "";

  function changeSource(nextSource: ImportSource) {
    setSource(nextSource);
    setPreview(null);
    setMessage("");
    setAccountId(accounts.find((account) => account.source === nextSource)?.id ?? "");
  }

  async function previewImport() {
    if (!file || !selectedAccountId) {
      setMessage("Kies eerst een bestand en account.");
      return;
    }

    setIsBusy(true);
    setMessage("Bestand wordt gelezen...");
    setPreview(null);

    try {
      const formData = new FormData();
      formData.set("source", source);
      formData.set("accountId", selectedAccountId);
      formData.set("file", file);

      const response = await fetch("/api/imports/preview", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as ImportPreview & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Preview mislukt");
      }

      setPreview(payload);
      setMessage(
        `${payload.counts.newRows} nieuw, ${payload.counts.duplicateRows} dubbel, ${payload.counts.errorRows} fouten.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Preview mislukt");
    } finally {
      setIsBusy(false);
    }
  }

  async function confirmImport() {
    if (!preview) {
      return;
    }

    setIsBusy(true);
    setMessage("Import wordt opgeslagen...");

    try {
      const response = await fetch("/api/imports/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: preview.batchId }),
      });
      const payload = (await response.json()) as { importedRows?: number; skippedRows?: number; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Import opslaan mislukt");
      }

      setMessage(`${payload.importedRows ?? 0} transacties geimporteerd, ${payload.skippedRows ?? 0} overgeslagen.`);
      setPreview(null);
      setFile(null);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import opslaan mislukt");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <>
      <ActionButton onClick={() => setIsOpen(true)}>
        <Upload size={16} /> Import bestand
      </ActionButton>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(17,17,17,0.45)] px-4 py-8 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-5xl bg-white/90 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xl font-heading font-extrabold">Import bestand</div>
                <div className="mt-1 text-sm text-[var(--muted)]">
                  Upload ABN, Revolut of DEGIRO. Duplicaten worden herkend en overgeslagen.
                </div>
              </div>
              <button className="pill-control p-2" onClick={() => setIsOpen(false)} type="button">
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <label className="text-sm font-semibold">
                Bron
                <select
                  className="mt-2 w-full rounded-md border border-[var(--border)] bg-white px-3 py-2"
                  onChange={(event) => changeSource(event.target.value as ImportSource)}
                  value={source}
                >
                  {SOURCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold md:col-span-2">
                Account
                <select
                  className="mt-2 w-full rounded-md border border-[var(--border)] bg-white px-3 py-2"
                  onChange={(event) => setAccountId(event.target.value)}
                  value={selectedAccountId}
                >
                  {eligibleAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} - {account.entityName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold">
                Bestand
                <input
                  accept=".csv,.xls,.xlsx"
                  className="mt-2 w-full rounded-md border border-[var(--border)] bg-white px-3 py-2"
                  onChange={(event) => {
                    setFile(event.target.files?.[0] ?? null);
                    setPreview(null);
                  }}
                  type="file"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <ActionButton disabled={isBusy || !file || !selectedAccountId} onClick={previewImport} tone="primary">
                Preview import
              </ActionButton>
              <ActionButton disabled={isBusy || !preview || preview.counts.newRows === 0} onClick={confirmImport}>
                Bevestig import
              </ActionButton>
              {message ? <span className="text-sm font-semibold text-[var(--muted)]">{message}</span> : null}
            </div>

            {preview ? (
              <div className="mt-5">
                <div className="mb-3 grid gap-3 text-sm md:grid-cols-4">
                  <ImportCount label="Totaal" value={preview.counts.total} />
                  <ImportCount label="Nieuw" value={preview.counts.newRows} />
                  <ImportCount label="Dubbel overgeslagen" value={preview.counts.duplicateRows} />
                  <ImportCount label="Fouten" value={preview.counts.errorRows} />
                </div>
                <div className="max-h-[420px] overflow-auto rounded-md border border-[var(--border)] bg-white/80">
                  <table className="w-full min-w-[850px] text-left text-sm">
                    <thead className="sticky top-0 bg-white text-xs uppercase text-[var(--muted)]">
                      <tr>
                        <th className="px-3 py-2">Rij</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Datum</th>
                        <th className="px-3 py-2">Omschrijving</th>
                        <th className="px-3 py-2 text-right">Bedrag</th>
                        <th className="px-3 py-2">Opmerking</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.slice(0, 80).map((row) => (
                        <tr key={row.id} className="border-t border-[var(--border)]">
                          <td className="px-3 py-2 font-semibold">{row.rowIndex}</td>
                          <td className="px-3 py-2">
                            <span className={statusClass(row.status)}>{row.status}</span>
                          </td>
                          <td className="px-3 py-2">{row.normalized?.date ?? "-"}</td>
                          <td className="px-3 py-2">{row.normalized?.description ?? "-"}</td>
                          <td className="px-3 py-2 text-right font-bold tabular">
                            {row.normalized?.amount?.toLocaleString("nl-NL", {
                              style: "currency",
                              currency: row.normalized.currency ?? "EUR",
                            }) ?? "-"}
                          </td>
                          <td className="px-3 py-2 text-xs text-[var(--muted)]">
                            {row.duplicateReason ?? row.errorMessage ?? (row.normalized?.isInvestmentRelated ? "Investment" : "")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {history.length ? (
              <div className="mt-5 border-t border-[var(--border)] pt-4">
                <div className="text-sm font-bold">Laatste imports</div>
                <div className="mt-2 grid gap-2">
                  {history.map((item) => (
                    <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 text-sm">
                      <span className="font-semibold">{item.filename}</span>
                      <span className="text-[var(--muted)]">
                        {item.source} - {item.importedRows} geimporteerd - {item.duplicateRows} dubbel -{" "}
                        {item.errorRows} fouten
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

function ImportCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-white/70 px-3 py-2">
      <div className="text-xs uppercase text-[var(--muted)]">{label}</div>
      <div className="font-heading text-xl font-extrabold">{value}</div>
    </div>
  );
}

function statusClass(status: string) {
  const base = "rounded-full px-2 py-1 text-xs font-bold";

  if (status === "NEW") {
    return `${base} bg-[rgba(35,107,74,0.14)] text-[var(--success)]`;
  }

  if (status === "DUPLICATE") {
    return `${base} bg-[rgba(183,121,31,0.16)] text-[#8a5a13]`;
  }

  if (status === "ERROR") {
    return `${base} bg-[rgba(196,48,34,0.12)] text-[var(--critical)]`;
  }

  return `${base} bg-white`;
}
