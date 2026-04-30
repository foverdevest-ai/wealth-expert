import { ActionButton } from "@/components/ui/action-button";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { TransactionImporter } from "@/components/transaction-importer";
import { formatCurrency } from "@/lib/formatters";
import { getImportHistoryForTransactionsPage, getTransactionsPageData } from "@/server/transactions-data";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const [{ transactions, accounts, source }, importHistory] = await Promise.all([
    getTransactionsPageData(),
    getImportHistoryForTransactionsPage(),
  ]);
  const uncategorisedCount = transactions.filter((transaction) => transaction.categoryName === "Uncategorised").length;
  const serializedImportHistory = importHistory.map((item) => ({
    id: item.id,
    filename: item.filename,
    source: item.source,
    status: item.status,
    importedRows: item.importedRows,
    duplicateRows: item.duplicateRows,
    errorRows: item.errorRows,
    createdAt: item.createdAt.toISOString(),
  }));

  return (
    <>
      <PageHeader
        title="Transactions"
        description={`Data. ${source === "database" ? "Database-backed" : "Demo fallback"} transaction review with categorisation, internal transfer flags, investment flags and liquidity context.`}
        action={
          <div className="flex flex-wrap gap-3">
            <TransactionImporter accounts={accounts} history={serializedImportHistory} />
            <ActionButton>Export CSV</ActionButton>
            <ActionButton>+ Manual transaction</ActionButton>
            <ActionButton tone="primary">Review uncategorised ({uncategorisedCount})</ActionButton>
          </div>
        }
      />

      <Panel className="sticky top-0 z-10 mb-4" title="">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="min-w-[320px] flex-1 rounded-[var(--radius-md)] border border-[var(--color-gray-200)] bg-white/80 px-4 py-3 text-[var(--muted)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">
            Search description, counterparty, IBAN...
          </div>
          <FilterPill value="Apr 2026" />
          <FilterPill value="All accounts" />
          <FilterPill value="All entities" />
          <FilterPill value="All categories" />
          <FilterPill value="Uncategorised x" active />
          <FilterPill value="Outflow only x" />
          <FilterPill value="Internal" />
          <FilterPill value="Liquidity" />
        </div>
      </Panel>

      <div className="glass-panel mb-4 flex flex-wrap items-center gap-4 bg-[var(--navy)]/95 px-4 py-3 text-white">
        <span className="font-bold">3 selected</span>
        <ActionButton>Assign category</ActionButton>
        <ActionButton>Mark internal transfer</ActionButton>
        <ActionButton>Add tag</ActionButton>
        <ActionButton>Mark investment</ActionButton>
        <span className="ml-auto text-xs font-semibold">Tip: Ctrl K to assign</span>
      </div>

      <Panel title="">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-gray-200)] bg-white/60 text-xs uppercase text-[var(--muted)]">
                <th className="py-3 pl-4 pr-4"><input type="checkbox" aria-label="Select all transactions" /></th>
                <th className="py-3 pr-4">Date</th>
                <th className="py-3 pr-4">Account</th>
                <th className="py-3 pr-4">Description</th>
                <th className="py-3 pr-4">Category</th>
                <th className="py-3 pr-4">Flags</th>
                <th className="py-3 pr-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction, index) => (
                <tr key={transaction.id} className={`border-b border-[var(--color-gray-200)] transition hover:bg-white/70 ${transaction.categoryName === "Uncategorised" ? "border-l-4 border-l-[var(--accent)]" : ""}`}>
                  <td className="py-3 pl-4 pr-4">
                    <input type="checkbox" defaultChecked={index < 3} aria-label={`Select ${transaction.description}`} />
                  </td>
                  <td className="py-3 pr-4 font-semibold tabular">{transaction.date.slice(5)}</td>
                  <td className="py-3 pr-4"><StatusBadge>{transaction.accountName.split(" ")[0]}</StatusBadge></td>
                  <td className="py-3 pr-4">
                    <div className="font-heading font-bold uppercase">{transaction.description}</div>
                    <div className="text-xs text-[var(--muted)]">{transaction.counterparty ?? "SEPA"} - {transaction.entityName}</div>
                  </td>
                  <td className="py-3 pr-4">
                    <StatusBadge tone={transaction.categoryName === "Uncategorised" ? "critical" : "neutral"}>
                      {transaction.categoryName}
                    </StatusBadge>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-wrap gap-1">
                      {transaction.isInternalTransfer ? <StatusBadge tone="info">Internal</StatusBadge> : null}
                      {transaction.isInvestmentRelated ? <StatusBadge tone="warning">Investment</StatusBadge> : null}
                      {!transaction.isInternalTransfer && !transaction.isInvestmentRelated ? <StatusBadge>--</StatusBadge> : null}
                    </div>
                  </td>
                  <td className={`py-3 pr-4 text-right font-heading font-extrabold tabular ${transaction.amount < 0 ? "text-[var(--critical)]" : "text-[var(--success)]"}`}>
                    {formatCurrency(transaction.amount, 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

function FilterPill({ value, active = false }: { value: string; active?: boolean }) {
  return <span className={`pill-control px-4 py-2 font-bold ${active ? "bg-[var(--accent)] text-white" : ""}`}>{value}</span>;
}
