import type { AssetSnapshot, LiabilitySnapshot, LiquidityClass } from "@/domain/types";

export type NetWorthSnapshotResult = {
  month: string;
  assets: number;
  liabilities: number;
  total: number;
  liquid: number;
  illiquid: number;
};

export function calculateNetWorthTrend(
  assetSnapshots: AssetSnapshot[],
  liabilitySnapshots: LiabilitySnapshot[],
): NetWorthSnapshotResult[] {
  const months = Array.from(
    new Set([...assetSnapshots.map((snapshot) => snapshot.month), ...liabilitySnapshots.map((snapshot) => snapshot.month)]),
  ).sort();

  return months.map((month) => {
    const assets = assetSnapshots.filter((snapshot) => snapshot.month === month);
    const liabilities = liabilitySnapshots.filter((snapshot) => snapshot.month === month);
    const assetTotal = sum(assets.map((snapshot) => snapshot.value));
    const liabilityTotal = sum(liabilities.map((snapshot) => snapshot.value));
    const liquidAssets = sum(assets.filter((snapshot) => snapshot.liquidity === "LIQUID").map((snapshot) => snapshot.value));
    const liquidLiabilities = sum(
      liabilities.filter((snapshot) => snapshot.liquidity === "LIQUID").map((snapshot) => snapshot.value),
    );
    const illiquidAssets = sum(
      assets.filter((snapshot) => snapshot.liquidity === "ILLIQUID").map((snapshot) => snapshot.value),
    );
    const illiquidLiabilities = sum(
      liabilities.filter((snapshot) => snapshot.liquidity === "ILLIQUID").map((snapshot) => snapshot.value),
    );

    return {
      month,
      assets: assetTotal,
      liabilities: liabilityTotal,
      total: assetTotal - liabilityTotal,
      liquid: liquidAssets - liquidLiabilities,
      illiquid: illiquidAssets - illiquidLiabilities,
    };
  });
}

export function getCurrentNetWorth(
  assetSnapshots: AssetSnapshot[],
  liabilitySnapshots: LiabilitySnapshot[],
  liquidity: LiquidityClass | "ALL" = "ALL",
) {
  const trend = calculateNetWorthTrend(assetSnapshots, liabilitySnapshots);
  const current = trend.at(-1) ?? { month: "", assets: 0, liabilities: 0, total: 0, liquid: 0, illiquid: 0 };
  if (liquidity === "LIQUID") return current.liquid;
  if (liquidity === "ILLIQUID") return current.illiquid;
  return current.total;
}

export function groupNetWorthByAssetClass(assetSnapshots: AssetSnapshot[], month: string) {
  const grouped = new Map<string, number>();
  for (const snapshot of assetSnapshots.filter((item) => item.month === month)) {
    grouped.set(snapshot.assetClass, (grouped.get(snapshot.assetClass) ?? 0) + snapshot.value);
  }
  return Array.from(grouped.entries()).map(([key, value]) => ({ key, value }));
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
