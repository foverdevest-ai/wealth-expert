import { ComparisonBarChart, TrendLineChart } from "@/components/charts/wealth-charts";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { investmentSnapshots } from "@/server/demo-data";
import { calculatePerformance } from "@/server/services/performance";

export default function RendementPage() {
  const performance = calculatePerformance(investmentSnapshots);

  return (
    <>
      <PageHeader
        title="Rendement"
        description="Investment value, contribution base and gain/loss comparison across Bitvavo and DEGIRO."
      />
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Current value" value={formatCurrency(performance.currentValue)} />
        <KpiCard label="Contributed" value={formatCurrency(performance.contributed)} />
        <KpiCard label="Gain / loss" value={formatCurrency(performance.gainLoss)} tone={performance.gainLoss >= 0 ? "positive" : "critical"} />
        <KpiCard label="Return" value={formatPercent(performance.returnPercentage)} tone={performance.returnPercentage >= 0 ? "positive" : "critical"} />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Contribution vs market value">
          <ComparisonBarChart
            data={performance.byProvider}
            xKey="provider"
            bars={[
              { key: "contributed", name: "Contributed", color: "#68736b" },
              { key: "currentValue", name: "Current value", color: "#236b4a" },
            ]}
          />
        </Panel>
        <Panel title="Performance over time">
          <TrendLineChart
            data={performance.trend}
            lines={[
              { key: "currentValue", name: "Current value", color: "#236b4a" },
              { key: "contributed", name: "Contributed", color: "#68736b" },
              { key: "gainLoss", name: "Gain / loss", color: "#2563eb" },
            ]}
          />
        </Panel>
      </div>
      <Panel title="Provider comparison" className="mt-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase text-[var(--muted)]">
              <tr>
                <th className="pb-3">Provider</th>
                <th className="pb-3 text-right">Contributed</th>
                <th className="pb-3 text-right">Current value</th>
                <th className="pb-3 text-right">Gain / loss</th>
                <th className="pb-3 text-right">Return</th>
              </tr>
            </thead>
            <tbody>
              {performance.byProvider.map((row) => (
                <tr key={row.provider} className="border-t border-[var(--border)]">
                  <td className="py-3 font-medium">{row.provider}</td>
                  <td className="py-3 text-right tabular">{formatCurrency(row.contributed)}</td>
                  <td className="py-3 text-right tabular">{formatCurrency(row.currentValue)}</td>
                  <td className="py-3 text-right font-semibold tabular">{formatCurrency(row.gainLoss)}</td>
                  <td className="py-3 text-right font-semibold tabular">{formatPercent(row.returnPercentage)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
