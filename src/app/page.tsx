import { MiniAreaChart } from "@/components/charts/wealth-charts";
import { ActionButton } from "@/components/ui/action-button";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { ProgressRow } from "@/components/ui/progress-row";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { getDashboardMetrics } from "@/server/services/dashboard";

export default function DashboardPage() {
  const metrics = getDashboardMetrics();

  return (
    <>
      <PageHeader
        title="Welcome back, Mark - here's where you stand"
        description="Overview. A consolidated founder finance cockpit across private, holding, UK LTD, crypto, broker and manually valued property layers."
        action={
          <div className="flex flex-wrap gap-3">
            <ActionButton>Live</ActionButton>
            <ActionButton>Apr 2026</ActionButton>
            <ActionButton tone="primary">+ Manual valuation</ActionButton>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Net worth" value={formatCurrency(metrics.currentNetWorth)} detail="+ EUR 18.420 vs last month" tone="positive" />
        <KpiCard label="Liquid net worth" value={formatCurrency(metrics.liquidNetWorth)} detail="cash + crypto + brokerage" />
        <KpiCard label="Illiquid net worth" value={formatCurrency(metrics.illiquidNetWorth)} detail="house - mortgage" />
        <KpiCard label="Monthly burn" value={formatCurrency(metrics.monthlyBurn)} detail="excl internal transfers" tone="critical" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Panel title="Net worth - last 12 months">
          <MiniAreaChart data={metrics.netWorthTrend} dataKey="total" />
          <p className="mt-4 text-sm font-bold text-[var(--accent)]">trend up - driven by property appreciation + Bitvavo gains</p>
        </Panel>
        <Panel title="Monthly burn">
          <MiniAreaChart data={metrics.burnTrend} dataKey="burn" />
          <p className="mt-4 text-sm font-bold text-[var(--accent)]">April spike - check Subscriptions + Eten & Horeca</p>
        </Panel>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Panel title="Top spend categories this month">
          <div className="space-y-4">
            {metrics.topSpendCategories.map((row, index) => (
              <ProgressRow
                key={row.key}
                label={row.key}
                value={row.outflow}
                max={metrics.topSpendCategories[0]?.outflow ?? row.outflow}
                color={index === 0 ? "#fd5e2d" : "#171717"}
              />
            ))}
          </div>
        </Panel>
        <Panel title="Spend by account this month">
          <div className="space-y-4">
            {metrics.spendByAccount.map((row, index) => (
              <ProgressRow
                key={row.key}
                label={row.key}
                value={row.outflow}
                max={metrics.spendByAccount[0]?.outflow ?? row.outflow}
                color={["#2f7ba8", "#1f9d63", "#7652b3", "#fd5e2d"][index] ?? "#171717"}
              />
            ))}
          </div>
          <p className="mt-4 text-sm font-bold text-[var(--accent)]">prive is doing most of the heavy lifting</p>
        </Panel>
        <Panel title="Needs attention">
          <div className="space-y-3">
            <AttentionRow tone="critical" label={`${formatNumber(47)} uncategorised transactions`} action="Review" />
            <AttentionRow tone="warning" label="Property valuation last set 3 mo ago" action="Update" />
            <AttentionRow tone="warning" label="DEGIRO sync stale (38h)" action="Re-sync" />
            <AttentionRow tone="neutral" label="5 likely internal transfers unflagged" action="Confirm" />
          </div>
        </Panel>
      </div>
    </>
  );
}

function AttentionRow({
  label,
  action,
  tone,
}: {
  label: string;
  action: string;
  tone: "critical" | "warning" | "neutral";
}) {
  return (
    <div className={`flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-white/90 p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)] ${
      tone === "critical" ? "bg-[#ffe7dc]/85" : tone === "warning" ? "bg-[#fff7ee]/90" : "bg-white/70"
    }`}>
      <span className="text-sm font-semibold">{label}</span>
      <StatusBadge>{action}</StatusBadge>
    </div>
  );
}
