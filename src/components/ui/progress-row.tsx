import { formatCurrency } from "@/lib/formatters";

export function ProgressRow({
  label,
  value,
  max,
  color = "#fd5e2d",
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
}) {
  const percentage = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 text-sm font-bold">
        <span>{label}</span>
        <span className="tabular">{formatCurrency(value)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/70 shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)]">
        <div className="h-full rounded-full" style={{ width: `${percentage}%`, background: color }} />
      </div>
    </div>
  );
}
