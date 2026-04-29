import type { InvestmentSnapshot } from "@/domain/types";

export type PerformanceResult = {
  contributed: number;
  currentValue: number;
  gainLoss: number;
  returnPercentage: number;
  realizedGainLoss: number;
  byProvider: {
    provider: string;
    contributed: number;
    currentValue: number;
    gainLoss: number;
    returnPercentage: number;
  }[];
  trend: {
    month: string;
    contributed: number;
    currentValue: number;
    gainLoss: number;
  }[];
};

export function calculatePerformance(snapshots: InvestmentSnapshot[]): PerformanceResult {
  const latestMonth = Array.from(new Set(snapshots.map((snapshot) => snapshot.month))).sort().at(-1);
  const latest = snapshots.filter((snapshot) => snapshot.month === latestMonth);
  const contributed = sum(latest.map((snapshot) => snapshot.contributed));
  const currentValue = sum(latest.map((snapshot) => snapshot.currentValue));
  const realizedGainLoss = sum(latest.map((snapshot) => snapshot.realizedGainLoss));
  const gainLoss = currentValue - contributed + realizedGainLoss;

  return {
    contributed,
    currentValue,
    gainLoss,
    returnPercentage: contributed === 0 ? 0 : (gainLoss / contributed) * 100,
    realizedGainLoss,
    byProvider: groupByProvider(latest),
    trend: groupTrend(snapshots),
  };
}

function groupByProvider(snapshots: InvestmentSnapshot[]) {
  const grouped = new Map<string, { provider: string; contributed: number; currentValue: number; realized: number }>();
  for (const snapshot of snapshots) {
    const current = grouped.get(snapshot.provider) ?? {
      provider: snapshot.provider,
      contributed: 0,
      currentValue: 0,
      realized: 0,
    };
    current.contributed += snapshot.contributed;
    current.currentValue += snapshot.currentValue;
    current.realized += snapshot.realizedGainLoss;
    grouped.set(snapshot.provider, current);
  }

  return Array.from(grouped.values()).map((item) => {
    const gainLoss = item.currentValue - item.contributed + item.realized;
    return {
      provider: item.provider,
      contributed: item.contributed,
      currentValue: item.currentValue,
      gainLoss,
      returnPercentage: item.contributed === 0 ? 0 : (gainLoss / item.contributed) * 100,
    };
  });
}

function groupTrend(snapshots: InvestmentSnapshot[]) {
  const grouped = new Map<string, { month: string; contributed: number; currentValue: number; realized: number }>();
  for (const snapshot of snapshots) {
    const current = grouped.get(snapshot.month) ?? {
      month: snapshot.month,
      contributed: 0,
      currentValue: 0,
      realized: 0,
    };
    current.contributed += snapshot.contributed;
    current.currentValue += snapshot.currentValue;
    current.realized += snapshot.realizedGainLoss;
    grouped.set(snapshot.month, current);
  }

  return Array.from(grouped.values())
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((item) => ({
      month: item.month,
      contributed: item.contributed,
      currentValue: item.currentValue,
      gainLoss: item.currentValue - item.contributed + item.realized,
    }));
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
