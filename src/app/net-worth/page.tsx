import { TrendLineChart } from "@/components/charts/wealth-charts";
import { ActionButton } from "@/components/ui/action-button";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/formatters";
import { assetSnapshots, getAccountName, liabilitySnapshots } from "@/server/demo-data";
import { calculateNetWorthTrend, groupNetWorthByAssetClass } from "@/server/services/net-worth";

export default function NetWorthPage() {
  const trend = calculateNetWorthTrend(assetSnapshots, liabilitySnapshots);
  const current = trend.at(-1);
  const breakdown = groupNetWorthByAssetClass(assetSnapshots, current?.month ?? "2026-04");

  return (
    <>
      <PageHeader
        title="Net Worth"
        description="Analytics. Actual market-value net worth with liquid, illiquid and all-value views. Property is manually valued."
        action={
          <div className="flex flex-wrap gap-3">
            <ActionButton>Apr 2026</ActionButton>
            <ActionButton tone="primary">+ Manual valuation</ActionButton>
          </div>
        }
      />
      <Panel className="mb-5 border-dashed shadow-none" title="">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold uppercase text-[var(--muted)]">Show:</span>
            <StatusBadge tone="positive">All</StatusBadge>
            <StatusBadge>Liquid only</StatusBadge>
            <StatusBadge>Illiquid only</StatusBadge>
          </div>
          <span className="text-sm font-semibold text-[var(--muted)]">Last snapshot: today 03:14 (auto)</span>
        </div>
      </Panel>
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Total net worth" value={formatCurrency(current?.total ?? 0)} detail="+ EUR 18.420 vs Mar" tone="positive" />
        <KpiCard label="Liquid net worth" value={formatCurrency(current?.liquid ?? 0)} />
        <KpiCard label="Illiquid net worth" value={formatCurrency(current?.illiquid ?? 0)} />
      </div>
      <Panel title="Monthly net worth line chart" className="mt-4">
        <TrendLineChart
          data={trend}
          lines={[
            { key: "total", name: "All", color: "#236b4a" },
            { key: "liquid", name: "Liquid", color: "#2563eb" },
            { key: "illiquid", name: "Illiquid", color: "#b7791f" },
          ]}
        />
      </Panel>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Asset class breakdown">
          <div className="space-y-3">
            {breakdown.map((row) => (
              <div key={row.key} className="flex justify-between border-b border-[var(--border)] pb-3 text-sm last:border-0 last:pb-0">
                <span>{row.key}</span>
                <span className="font-semibold tabular">{formatCurrency(row.value)}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Current snapshot detail">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase text-[var(--muted)]">
                <tr>
                  <th className="pb-3">Account</th>
                  <th className="pb-3">Liquidity</th>
                  <th className="pb-3 text-right">Value</th>
                </tr>
              </thead>
              <tbody>
                {assetSnapshots
                  .filter((snapshot) => snapshot.month === current?.month)
                  .map((snapshot) => (
                    <tr key={snapshot.id} className="border-t border-[var(--border)]">
                      <td className="py-3">{getAccountName(snapshot.accountId)}</td>
                      <td className="py-3"><StatusBadge>{snapshot.liquidity}</StatusBadge></td>
                      <td className="py-3 text-right font-semibold tabular">{formatCurrency(snapshot.value)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}
