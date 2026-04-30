import { cn } from "@/lib/utils";

export function ActionButton({
  children,
  tone = "default",
  disabled = false,
  onClick,
}: {
  children: React.ReactNode;
  tone?: "default" | "primary" | "dark";
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={cn(
        "pill-control inline-flex h-10 items-center justify-center gap-2 px-4 py-2 text-sm font-bold transition hover:bg-white/95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        tone === "primary" && "text-white",
        tone === "dark" && "text-white",
      )}
      disabled={disabled}
      onClick={onClick}
      style={tone === "primary" ? { background: "var(--accent)" } : tone === "dark" ? { background: "var(--navy)" } : undefined}
      type="button"
    >
      {children}
    </button>
  );
}
