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
  { href: "/accounts", label: "Accounts", icon: WalletCards },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-b border-white/10 bg-[#1a1a1a] text-white shadow-[0_4px_6px_rgba(0,0,0,0.1)] lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:w-28 lg:border-b-0">
      <div className="flex h-full flex-col items-center">
        <nav className="flex w-full gap-2 overflow-x-auto px-2 py-4 lg:flex-1 lg:flex-col lg:items-center lg:overflow-visible">
          {navItems.slice(0, 2).map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
          <Divider tone="orange" />
          {navItems.slice(2, 6).map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
          <Divider tone="blue" />
          {navItems.slice(6).map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>

        <div className="hidden w-full border-t border-white/10 p-3 text-center text-[10px] leading-5 text-white/60 lg:block">
          <div className="flex items-center justify-center gap-1.5 font-semibold text-white/80">
            <span className="h-2 w-2 rounded-full bg-[var(--success)]" />
            Synced
          </div>
          <div>Mark · V1</div>
        </div>
      </div>
    </aside>
  );
}

function Divider({ tone }: { tone: "orange" | "blue" }) {
  return (
    <div className="my-2 hidden w-14 items-center justify-center lg:flex">
      <div className={`h-1 w-9 rounded-full ${tone === "orange" ? "bg-[var(--accent)]" : "bg-[#2d4d85]"}`} />
    </div>
  );
}

function NavLink({
  item,
  pathname,
}: {
  item: (typeof navItems)[number];
  pathname: string;
}) {
  const isActive = pathname === item.href;

  return (
    <Link
      href={item.href}
      className={`relative flex min-w-[76px] flex-col items-center justify-center gap-1 rounded-[14px] px-2 py-2 text-center text-[11px] font-bold transition lg:min-h-[76px] ${
        isActive ? "bg-[#f2824b] text-white" : "text-white/60 hover:bg-white/8 hover:text-white"
      }`}
    >
      {isActive ? <span className="absolute left-[-8px] top-3 hidden h-12 w-1.5 rounded-r-lg bg-white lg:block" /> : null}
      <span className={`flex h-11 w-11 items-center justify-center rounded-[12px] ${isActive ? "bg-[#f59e73]" : ""}`}>
        <item.icon size={22} aria-hidden="true" />
      </span>
      <span className="leading-3">{item.label}</span>
      {item.href === "/transactions" ? (
        <span className="absolute right-1 top-1 rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[9px] text-white shadow">
          47
        </span>
      ) : null}
    </Link>
  );
}
