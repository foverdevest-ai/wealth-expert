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
    <div
      className={cn(
        "glass-panel relative overflow-hidden p-5",
        tone === "positive" && "text-white",
      )}
      style={tone === "positive" ? { background: "var(--accent)" } : undefined}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[var(--accent)]/10 blur-2xl" />
      <div className={cn("relative text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]", tone === "positive" && "text-white")}>{label}</div>
      <div
        className={cn(
          "relative mt-2 font-heading text-3xl font-extrabold tabular",
          tone === "positive" && "text-white",
          tone === "warning" && "text-[#b7791f]",
          tone === "critical" && "text-[var(--critical)]",
        )}
      >
        {value}
      </div>
      {detail ? <div className={cn("relative mt-3 text-sm font-semibold text-[#333]", tone === "positive" && "text-white")}>{detail}</div> : null}
    </div>
  );
}
