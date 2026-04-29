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
        "pill-control inline-flex items-center justify-center px-4 py-2 text-sm font-bold transition hover:-translate-y-0.5",
        tone === "primary" && "bg-[var(--accent)] text-white",
        tone === "dark" && "bg-[var(--ink)] text-white",
      )}
      type="button"
    >
      {children}
    </button>
  );
}
