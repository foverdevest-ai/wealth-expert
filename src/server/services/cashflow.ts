import { format, parseISO, startOfMonth, startOfWeek } from "date-fns";
import type { Transaction } from "@/domain/types";

export type CashflowGranularity = "day" | "week" | "month";

export type CashflowBucket = {
  period: string;
  inflow: number;
  outflow: number;
  net: number;
};

export type CashflowSummary = {
  inflow: number;
  outflow: number;
  net: number;
  buckets: CashflowBucket[];
};

export function getCashflowPeriod(date: string, granularity: CashflowGranularity) {
  const parsed = parseISO(date);
  if (granularity === "day") return format(parsed, "yyyy-MM-dd");
  if (granularity === "week") return format(startOfWeek(parsed, { weekStartsOn: 1 }), "yyyy-MM-dd");
  return format(startOfMonth(parsed), "yyyy-MM");
}

export function calculateCashflow(
  transactions: Transaction[],
  options: {
    granularity?: CashflowGranularity;
    includeInternalTransfers?: boolean;
    accountIds?: string[];
    entityIds?: string[];
    categoryIds?: string[];
  } = {},
): CashflowSummary {
  const granularity = options.granularity ?? "month";
  const filtered = transactions.filter((transaction) => {
    if (!options.includeInternalTransfers && transaction.isInternalTransfer) return false;
    if (options.accountIds?.length && !options.accountIds.includes(transaction.accountId)) return false;
    if (options.entityIds?.length && !options.entityIds.includes(transaction.entityId)) return false;
    if (options.categoryIds?.length && !options.categoryIds.includes(transaction.categoryId)) return false;
    return true;
  });

  const buckets = new Map<string, CashflowBucket>();

  for (const transaction of filtered) {
    const period = getCashflowPeriod(transaction.date, granularity);
    const bucket = buckets.get(period) ?? { period, inflow: 0, outflow: 0, net: 0 };

    if (transaction.amount >= 0) {
      bucket.inflow += transaction.amount;
    } else {
      bucket.outflow += Math.abs(transaction.amount);
    }

    bucket.net += transaction.amount;
    buckets.set(period, bucket);
  }

  const orderedBuckets = Array.from(buckets.values()).sort((a, b) => a.period.localeCompare(b.period));

  return {
    inflow: orderedBuckets.reduce((sum, bucket) => sum + bucket.inflow, 0),
    outflow: orderedBuckets.reduce((sum, bucket) => sum + bucket.outflow, 0),
    net: orderedBuckets.reduce((sum, bucket) => sum + bucket.net, 0),
    buckets: orderedBuckets,
  };
}

export function groupCashflowByDimension<T extends string>(
  transactions: Transaction[],
  getKey: (transaction: Transaction) => T,
  includeInternalTransfers = false,
) {
  const grouped = new Map<T, { key: T; inflow: number; outflow: number; net: number }>();

  for (const transaction of transactions) {
    if (!includeInternalTransfers && transaction.isInternalTransfer) continue;
    const key = getKey(transaction);
    const current = grouped.get(key) ?? { key, inflow: 0, outflow: 0, net: 0 };
    if (transaction.amount >= 0) current.inflow += transaction.amount;
    else current.outflow += Math.abs(transaction.amount);
    current.net += transaction.amount;
    grouped.set(key, current);
  }

  return Array.from(grouped.values()).sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
}
