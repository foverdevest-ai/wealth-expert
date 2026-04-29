import { cn } from "@/lib/utils";

export function ActionButton({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "primary" | "dark";
}) {
  return (
    <button
      className={cn(
        "pill-control inline-flex h-10 items-center justify-center px-4 py-2 text-sm font-bold transition hover:bg-white/95 active:scale-[0.98]",
        tone === "primary" && "text-white",
        tone === "dark" && "text-white",
      )}
      style={tone === "primary" ? { background: "var(--accent)" } : tone === "dark" ? { background: "var(--navy)" } : undefined}
      type="button"
    >
      {children}
    </button>
  );
}
