import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "default" | "positive" | "warning" | "critical";
}) {
  return (
    <div className={cn("glass-panel p-5", tone === "positive" && "bg-[var(--accent)] text-white")}>
      <div className={cn("text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]", tone === "positive" && "text-white")}>{label}</div>
      <div
        className={cn(
          "mt-2 font-heading text-3xl font-extrabold tabular",
          tone === "positive" && "text-white",
          tone === "warning" && "text-[#b7791f]",
          tone === "critical" && "text-[var(--critical)]",
        )}
      >
        {value}
      </div>
      {detail ? <div className={cn("mt-3 text-sm font-semibold text-[#333]", tone === "positive" && "text-white")}>{detail}</div> : null}
    </div>
  );
}
