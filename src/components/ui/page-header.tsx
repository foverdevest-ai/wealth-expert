export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-sm font-semibold text-[var(--muted)]">{description.split(".")[0]}</p>
        <h1 className="mt-1 font-heading text-4xl font-extrabold tracking-normal text-[var(--foreground)]">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">{description}</p>
      </div>
      {action}
    </div>
  );
}
