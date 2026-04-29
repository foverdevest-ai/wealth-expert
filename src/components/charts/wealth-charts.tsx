"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/formatters";

const tooltipFormatter = (value: unknown) => formatCurrency(Number(value ?? 0));

function ChartShell({ children, className = "h-80 w-full" }: { children: ReactNode; className?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (!mounted) return <div className={className} aria-hidden="true" />;

  return <div className={className}>{children}</div>;
}

export function TrendLineChart({
  data,
  lines,
}: {
  data: Record<string, string | number>[];
  lines: { key: string; name: string; color: string }[];
}) {
  return (
    <ChartShell>
      <ResponsiveContainer minWidth={1} minHeight={1}>
        <LineChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="#dfe5dc" strokeDasharray="3 3" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${formatCurrency(Number(value) / 1000)}k`} />
          <Tooltip formatter={tooltipFormatter} />
          <Legend />
          {lines.map((line) => (
            <Line key={line.key} type="monotone" dataKey={line.key} name={line.name} stroke={line.color} strokeWidth={2} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function CashflowBarChart({ data }: { data: Record<string, string | number>[] }) {
  return (
    <ChartShell>
      <ResponsiveContainer minWidth={1} minHeight={1}>
        <BarChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="#dfe5dc" strokeDasharray="3 3" />
          <XAxis dataKey="period" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${formatCurrency(Number(value) / 1000)}k`} />
          <Tooltip formatter={tooltipFormatter} />
          <Legend />
          <Bar dataKey="inflow" name="Inflow" fill="#236b4a" radius={[4, 4, 0, 0]} />
          <Bar dataKey="outflow" name="Outflow" fill="#b42318" radius={[4, 4, 0, 0]} />
          <Bar dataKey="net" name="Net" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function ComparisonBarChart({
  data,
  xKey,
  bars,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  bars: { key: string; name: string; color: string }[];
}) {
  return (
    <ChartShell>
      <ResponsiveContainer minWidth={1} minHeight={1}>
        <BarChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="#dfe5dc" strokeDasharray="3 3" />
          <XAxis dataKey={xKey} tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${formatCurrency(Number(value) / 1000)}k`} />
          <Tooltip formatter={tooltipFormatter} />
          <Legend />
          {bars.map((bar) => (
            <Bar key={bar.key} dataKey={bar.key} name={bar.name} fill={bar.color} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function MiniAreaChart({
  data,
  dataKey,
}: {
  data: Record<string, string | number>[];
  dataKey: string;
}) {
  return (
    <ChartShell className="h-28 w-full">
      <ResponsiveContainer minWidth={1} minHeight={1}>
        <AreaChart data={data}>
          <Area type="monotone" dataKey={dataKey} stroke="#236b4a" fill="#e6f2ec" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}
