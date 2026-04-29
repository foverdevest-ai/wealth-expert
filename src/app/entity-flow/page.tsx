import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/formatters";
import { getAccountName, getEntityName, transactions } from "@/server/demo-data";

export default function EntityFlowPage() {
  const flows = transactions.filter((transaction) => transaction.isInternalTransfer);

  return (
    <>
      <PageHeader
        title="Entity Flow"
        description="Analytics. Internal money movement from operating company to holding to private, separated from consolidated burn."
      />
      <Panel title="Internal transfer ledger">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="text-xs uppercase text-[var(--muted)]">
              <tr className="border-b border-[var(--color-gray-200)] bg-white/60">
                <th className="p-3">Date</th>
                <th className="p-3">Entity</th>
                <th className="p-3">Account</th>
                <th className="p-3">Description</th>
                <th className="p-3">Flow</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {flows.map((transaction) => (
                <tr key={transaction.id} className="border-b border-[var(--color-gray-200)] transition hover:bg-white/70">
                  <td className="p-3 tabular">{transaction.date}</td>
                  <td className="p-3">{getEntityName(transaction.entityId)}</td>
                  <td className="p-3">{getAccountName(transaction.accountId)}</td>
                  <td className="p-3 font-heading font-bold uppercase">{transaction.description}</td>
                  <td className="p-3"><StatusBadge tone="info">Internal</StatusBadge></td>
                  <td className={`p-3 text-right font-heading font-extrabold tabular ${transaction.amount < 0 ? "text-[var(--critical)]" : "text-[var(--success)]"}`}>
                    {formatCurrency(transaction.amount)}
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
