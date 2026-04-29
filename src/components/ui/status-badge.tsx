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
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
        tone === "neutral" && "border-[var(--color-gray-200)] bg-white/80 text-[#334139]",
        tone === "positive" && "border-transparent bg-[var(--accent)] text-white",
        tone === "warning" && "border-[#f2d0a8] bg-[#fff7ee] text-[#b7791f]",
        tone === "critical" && "border-transparent bg-[var(--accent)] text-white",
        tone === "info" && "border-transparent bg-[#d6e9ff] text-[#064e97]",
      )}
    >
      {children}
    </span>
  );
}
