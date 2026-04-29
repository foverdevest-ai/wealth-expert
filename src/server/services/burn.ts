import { format, parseISO } from "date-fns";
import type { Transaction } from "@/domain/types";

export type BurnAnalysis = {
  totalBurn: number;
  previousMonthBurn: number;
  monthOverMonthChange: number;
  monthlyTrend: { month: string; burn: number }[];
  byCategory: { key: string; burn: number; count: number }[];
  byAccount: { key: string; burn: number; count: number }[];
  byEntity: { key: string; burn: number; count: number }[];
  recurring: Transaction[];
};

export function calculateBurn(
  transactions: Transaction[],
  options: {
    currentMonth?: string;
    excludeCategories?: string[];
  } = {},
): BurnAnalysis {
  const currentMonth = options.currentMonth ?? "2026-04";
  const burnTransactions = transactions.filter(
    (transaction) =>
      transaction.amount < 0 &&
      !transaction.isInternalTransfer &&
      !transaction.isInvestmentRelated &&
      !(options.excludeCategories ?? []).includes(transaction.categoryId),
  );

  const monthly = new Map<string, number>();
  const byCategory = new Map<string, { key: string; burn: number; count: number }>();
  const byAccount = new Map<string, { key: string; burn: number; count: number }>();
  const byEntity = new Map<string, { key: string; burn: number; count: number }>();

  for (const transaction of burnTransactions) {
    const month = format(parseISO(transaction.date), "yyyy-MM");
    const amount = Math.abs(transaction.amount);
    monthly.set(month, (monthly.get(month) ?? 0) + amount);
    addBurn(byCategory, transaction.categoryId, amount);
    addBurn(byAccount, transaction.accountId, amount);
    addBurn(byEntity, transaction.entityId, amount);
  }

  const current = monthly.get(currentMonth) ?? 0;
  const previousMonth = previousMonthKey(currentMonth);
  const previous = monthly.get(previousMonth) ?? 0;

  return {
    totalBurn: current,
    previousMonthBurn: previous,
    monthOverMonthChange: previous === 0 ? 0 : ((current - previous) / previous) * 100,
    monthlyTrend: Array.from(monthly.entries())
      .map(([month, burn]) => ({ month, burn }))
      .sort((a, b) => a.month.localeCompare(b.month)),
    byCategory: Array.from(byCategory.values()).sort((a, b) => b.burn - a.burn),
    byAccount: Array.from(byAccount.values()).sort((a, b) => b.burn - a.burn),
    byEntity: Array.from(byEntity.values()).sort((a, b) => b.burn - a.burn),
    recurring: burnTransactions.filter((transaction) => transaction.tags.includes("recurring")),
  };
}

function addBurn(map: Map<string, { key: string; burn: number; count: number }>, key: string, amount: number) {
  const current = map.get(key) ?? { key, burn: 0, count: 0 };
  current.burn += amount;
  current.count += 1;
  map.set(key, current);
}

function previousMonthKey(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const previous = new Date(year, monthNumber - 2, 1);
  return format(previous, "yyyy-MM");
}
