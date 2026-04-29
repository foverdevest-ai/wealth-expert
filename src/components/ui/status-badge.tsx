import { cn } from "@/lib/utils";

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "positive" | "warning" | "critical" | "info";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border-2 border-[var(--ink)] px-3 py-1 text-xs font-bold",
        tone === "neutral" && "bg-white text-[#334139]",
        tone === "positive" && "bg-[var(--accent-soft)] text-[var(--accent)]",
        tone === "warning" && "bg-[#fff7ed] text-[#b7791f]",
        tone === "critical" && "bg-[#fef2f2] text-[var(--critical)]",
        tone === "info" && "bg-[#eff6ff] text-[#2563eb]",
      )}
    >
      {children}
    </span>
  );
}
