import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { connections } from "@/server/demo-data";

export default function ConnectionsPage() {
  return (
    <>
      <PageHeader
        title="Connections"
        description="Live-sync first provider layer with reconnect, health and mapping affordances ready for production integrations."
      />
      <div className="grid gap-4 xl:grid-cols-2">
        {connections.map((connection) => (
          <Panel key={connection.id} title={connection.displayName}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-[var(--muted)]">Provider</div>
                <div className="mt-1 font-medium">{connection.provider}</div>
              </div>
              <StatusBadge
                tone={
                  connection.status === "CONNECTED"
                    ? "positive"
                    : connection.status === "ERROR"
                      ? "critical"
                      : "warning"
                }
              >
                {connection.status}
              </StatusBadge>
            </div>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <div>
                <div className="text-xs uppercase text-[var(--muted)]">Last sync</div>
                <div className="mt-1 tabular">{new Date(connection.lastSync).toLocaleString("nl-NL")}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-[var(--muted)]">Health</div>
                <div className="mt-1">{connection.syncHealth}</div>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}
