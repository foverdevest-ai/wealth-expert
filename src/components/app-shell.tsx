import { Sidebar } from "@/components/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Sidebar />
      <main className="lg:pl-72">
        <div className="mx-auto w-full max-w-[1720px] px-4 py-7 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
