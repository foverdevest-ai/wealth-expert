import { ComparisonBarChart, TrendLineChart } from "@/components/charts/wealth-charts";
import { ActionButton } from "@/components/ui/action-button";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { getAccountName, getCategoryName, getEntityName, transactions } from "@/server/demo-data";
import { calculateBurn } from "@/server/services/burn";

export default function BurnPage() {
  const burn = calculateBurn(transactions, { currentMonth: "2026-04" });

  return (
    <>
      <PageHeader
        title="Burn - where is the money going?"
        description="Analytics. Monthly burn analysis across category, account and entity, excluding internal transfers and investment deposits."
        action={
          <div className="flex flex-wrap gap-3">
            <ActionButton>Last 12 mo</ActionButton>
            <ActionButton>All accounts</ActionButton>
            <ActionButton>Exclude investments x</ActionButton>
          </div>
        }
      />
      <div className="mb-5 flex gap-4 border-b border-white/70">
        {["Trend", "By category", "By account", "By entity", "Recurring"].map((tab, index) => (
          <span key={tab} className={`px-5 py-3 font-bold ${index === 0 ? "rounded-t-[var(--radius-md)] bg-white/80 text-[var(--accent)] shadow-[0_1px_2px_rgba(0,0,0,0.05)]" : "text-[var(--muted)]"}`}>
            {tab}
          </span>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Current monthly burn" value={formatCurrency(burn.totalBurn)} tone="warning" />
        <KpiCard label="Previous month" value={formatCurrency(burn.previousMonthBurn)} />
        <KpiCard label="Month over month" value={formatPercent(burn.monthOverMonthChange)} tone={burn.monthOverMonthChange > 0 ? "critical" : "positive"} />
      </div>
      <Panel title="Burn trend" className="mt-4">
        <TrendLineChart data={burn.monthlyTrend} lines={[{ key: "burn", name: "Burn", color: "#b42318" }]} />
      </Panel>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <BurnBreakdown title="Burn by category" rows={burn.byCategory.map((row) => ({ label: getCategoryName(row.key), burn: row.burn }))} />
        <BurnBreakdown title="Burn by account" rows={burn.byAccount.map((row) => ({ label: getAccountName(row.key), burn: row.burn }))} />
        <BurnBreakdown title="Burn by entity" rows={burn.byEntity.map((row) => ({ label: getEntityName(row.key), burn: row.burn }))} />
      </div>
      <Panel title="Savings concentration" className="mt-4">
        <ComparisonBarChart
          data={burn.byCategory.map((row) => ({ category: getCategoryName(row.key), burn: row.burn }))}
          xKey="category"
          bars={[{ key: "burn", name: "Burn", color: "#b42318" }]}
        />
      </Panel>
    </>
  );
}

function BurnBreakdown({ title, rows }: { title: string; rows: { label: string; burn: number }[] }) {
  return (
    <Panel title={title}>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between border-b border-[var(--border)] pb-3 text-sm last:border-0 last:pb-0">
            <span>{row.label}</span>
            <span className="font-semibold tabular">{formatCurrency(row.burn)}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}
