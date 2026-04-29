import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { entities } from "@/server/demo-data";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Entity settings, valuation assumptions, property manual valuation, liquidity rules and dev diagnostics."
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Entities">
          <div className="space-y-3">
            {entities.map((entity) => (
              <div key={entity.id} className="flex justify-between border-b border-[var(--border)] pb-3 text-sm last:border-0 last:pb-0">
                <span className="font-medium">{entity.name}</span>
                <StatusBadge>{entity.type}</StatusBadge>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Valuation assumptions">
          <div className="space-y-4 text-sm">
            <SettingRow label="Property valuation source" value="Manual input, April 2026" />
            <SettingRow label="Net worth methodology" value="Actual market value" />
            <SettingRow label="Internal transfers" value="Excluded from consolidated burn by default" />
            <SettingRow label="Data refresh" value="Daily provider sync, manual resync available" />
          </div>
        </Panel>
        <Panel title="Property manual valuation">
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <Field label="Property" value="Amsterdam House" />
            <Field label="Market value" value="EUR 925.000" />
            <Field label="Source date" value="2026-04-01" />
          </div>
        </Panel>
        <Panel title="Dev/debug panel">
          <div className="space-y-2 text-sm text-[var(--muted)]">
            <div>Prisma schema is scaffolded for PostgreSQL.</div>
            <div>Provider adapters return demo-normalized payloads until credentials are configured.</div>
            <div>Calculation services are covered by Vitest.</div>
          </div>
        </Panel>
      </div>
    </>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[var(--border)] pb-3 last:border-0 last:pb-0">
      <span className="text-[var(--muted)]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-white px-3 py-2">
      <div className="text-xs uppercase text-[var(--muted)]">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
