import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/formatters";
import { accounts, getEntityName } from "@/server/demo-data";

export default function AccountsPage() {
  return (
    <>
      <PageHeader title="Accounts" description="Connected and manual accounts with entity mapping, liquidity classification and sync status." />
      <Panel title="Account registry">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="text-xs uppercase text-[var(--muted)]">
              <tr>
                <th className="pb-3">Account</th>
                <th className="pb-3">Entity</th>
                <th className="pb-3">Provider</th>
                <th className="pb-3">Class</th>
                <th className="pb-3">Liquidity</th>
                <th className="pb-3">Sync</th>
                <th className="pb-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-t border-[var(--border)]">
                  <td className="py-3 font-medium">{account.name}</td>
                  <td className="py-3">{getEntityName(account.entityId)}</td>
                  <td className="py-3">{account.source}</td>
                  <td className="py-3">{account.class}</td>
                  <td className="py-3"><StatusBadge>{account.liquidity}</StatusBadge></td>
                  <td className="py-3">
                    <StatusBadge tone={account.syncStatus === "HEALTHY" ? "positive" : account.syncStatus === "ERROR" ? "critical" : "warning"}>
                      {account.syncStatus}
                    </StatusBadge>
                  </td>
                  <td className="py-3 text-right font-semibold tabular">{formatCurrency(account.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
