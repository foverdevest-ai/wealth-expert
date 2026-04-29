"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowDownUp,
  BarChart3,
  CircleDollarSign,
  Gauge,
  Landmark,
  LineChart,
  Plug,
  Settings,
  Tags,
  WalletCards,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: Gauge },
  { href: "/transactions", label: "Transactions", icon: ArrowDownUp },
  { href: "/cashflow", label: "Cashflow", icon: BarChart3 },
  { href: "/burn", label: "Burn", icon: CircleDollarSign },
  { href: "/net-worth", label: "Net Worth", icon: Landmark },
  { href: "/rendement", label: "Rendement", icon: LineChart },
  { href: "/entity-flow", label: "Entity Flow", icon: ArrowDownUp },
  { href: "/accounts", label: "Accounts", icon: WalletCards },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/connections", label: "Connections", icon: Plug },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-b-2 border-[var(--ink)] bg-[#fbfaf7] lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 lg:border-b-0 lg:border-r-2">
      <div className="flex h-full flex-col">
        <div className="border-b-2 border-dashed border-[#989898] px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="h-3.5 w-3.5 rounded-full border-2 border-[var(--ink)] bg-[var(--accent)]" />
            <div>
              <div className="font-heading text-xl font-extrabold">Wealth Coach</div>
            </div>
            <span className="rounded-sm border-2 border-[var(--accent)] px-2 py-1 text-xs font-bold uppercase text-[var(--accent)]">
              Draft
            </span>
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-5 py-5 lg:flex-1 lg:flex-col lg:overflow-visible">
          <NavGroup label="Overview" />
          {navItems.slice(0, 2).map((item) => <NavLink key={item.href} item={item} pathname={pathname} />)}
          <NavGroup label="Analytics" />
          {navItems.slice(2, 7).map((item) => <NavLink key={item.href} item={item} pathname={pathname} />)}
          <NavGroup label="Setup" />
          {navItems.slice(7).map((item) => <NavLink key={item.href} item={item} pathname={pathname} />)}
        </nav>
        <div className="hidden border-t-2 border-dashed border-[#989898] p-5 text-xs leading-6 text-[var(--muted)] lg:block">
          <div className="flex items-center gap-2 font-semibold text-[#333]">
            <span className="h-2.5 w-2.5 rounded-full border border-[var(--ink)] bg-[var(--success)]" />
            All synced · 4 min ago
          </div>
          <div>Mark · Single user · V1</div>
        </div>
      </div>
    </aside>
  );
}

function NavGroup({ label }: { label: string }) {
  return <div className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#989898]">{label}</div>;
}

function NavLink({
  item,
  pathname,
}: {
  item: (typeof navItems)[number];
  pathname: string;
}) {
  return (
    <Link
      href={item.href}
      className={`flex min-w-fit items-center justify-between gap-3 rounded-[10px] border-2 px-3 py-2.5 text-sm font-bold transition ${
        pathname === item.href
          ? "border-[var(--ink)] bg-white shadow-[3px_4px_0_#171717]"
          : "border-transparent text-[#222] hover:border-[var(--ink)] hover:bg-white"
      }`}
    >
      <span className="flex items-center gap-3">
        <item.icon size={17} aria-hidden="true" />
        {item.label}
      </span>
      {item.href === "/transactions" ? (
        <span className="rounded-full border-2 border-[var(--ink)] bg-[var(--accent)] px-2 py-0.5 text-xs text-white">
          47
        </span>
      ) : null}
    </Link>
  );
}
