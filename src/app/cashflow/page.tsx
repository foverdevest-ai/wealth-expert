import { CashflowBarChart } from "@/components/charts/wealth-charts";
import { ActionButton } from "@/components/ui/action-button";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { formatCurrency } from "@/lib/formatters";
import { getAccountName, getCategoryName, getEntityName, transactions } from "@/server/demo-data";
import { calculateCashflow, groupCashflowByDimension } from "@/server/services/cashflow";

export default function CashflowPage() {
  const cashflow = calculateCashflow(transactions, { granularity: "month", includeInternalTransfers: false });
  const byAccount = groupCashflowByDimension(transactions, (transaction) => getAccountName(transaction.accountId));
  const byEntity = groupCashflowByDimension(transactions, (transaction) => getEntityName(transaction.entityId));
  const byCategory = groupCashflowByDimension(transactions, (transaction) => getCategoryName(transaction.categoryId));

  return (
    <>
      <PageHeader
        title="Cashflow"
        description="Analytics. Inflow, outflow and net cashflow with internal transfers separated from operational reality."
        action={
          <div className="flex flex-wrap gap-3">
            <ActionButton>Apr 2025 to Apr 2026</ActionButton>
            <ActionButton>All accounts</ActionButton>
            <ActionButton>Exclude internal transfers x</ActionButton>
          </div>
        }
      />
      <div className="mb-5 flex gap-4 border-b border-white/70">
        {["Trend", "By account", "By entity", "By category"].map((tab, index) => (
          <span key={tab} className={`px-5 py-3 font-bold ${index === 0 ? "rounded-t-[var(--radius-md)] bg-white/80 text-[var(--accent)] shadow-[0_1px_2px_rgba(0,0,0,0.05)]" : "text-[var(--muted)]"}`}>
            {tab}
          </span>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Inflow · 12 mo" value={formatCurrency(cashflow.inflow)} />
        <KpiCard label="Outflow" value={formatCurrency(cashflow.outflow)} tone="critical" />
        <KpiCard label="Net cashflow" value={formatCurrency(cashflow.net)} tone="positive" />
      </div>
      <Panel title="Inflow vs Outflow vs Net" className="mt-4">
        <CashflowBarChart data={cashflow.buckets} />
      </Panel>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Breakdown title="By account" rows={byAccount} />
        <Breakdown title="By entity" rows={byEntity} />
        <Breakdown title="By category" rows={byCategory.slice(0, 8)} />
      </div>
    </>
  );
}

function Breakdown({ title, rows }: { title: string; rows: { key: string; inflow: number; outflow: number; net: number }[] }) {
  return (
    <Panel title={title}>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.key} className="flex justify-between gap-4 border-b border-[var(--border)] pb-3 text-sm last:border-0 last:pb-0">
            <span>{row.key}</span>
            <span className="font-semibold tabular">{formatCurrency(row.net)}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}
