import { Sidebar } from "@/components/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden text-[var(--foreground)]">
      <Sidebar />
      <main className="relative z-10 lg:pl-28">
        <div className="mx-auto w-full max-w-[1720px] px-4 py-7 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
