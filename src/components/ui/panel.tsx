import { cn } from "@/lib/utils";

export function Panel({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("glass-panel p-5", className)}>
      {title ? <h2 className="mb-4 font-heading text-lg font-bold">{title}</h2> : null}
      {children}
    </section>
  );
}
