import { describe, expect, it } from "vitest";
import { assetSnapshots, investmentSnapshots, liabilitySnapshots, transactions } from "@/server/demo-data";
import { calculateBurn } from "@/server/services/burn";
import { calculateCashflow } from "@/server/services/cashflow";
import { calculateNetWorthTrend, getCurrentNetWorth } from "@/server/services/net-worth";
import { calculatePerformance } from "@/server/services/performance";

describe("cashflow aggregation", () => {
  it("excludes internal transfers from consolidated cashflow by default", () => {
    const excluded = calculateCashflow(transactions, { includeInternalTransfers: false });
    const included = calculateCashflow(transactions, { includeInternalTransfers: true });

    expect(included.inflow).toBeGreaterThan(excluded.inflow);
    expect(included.outflow).toBeGreaterThan(excluded.outflow);
    expect(excluded.buckets.length).toBeGreaterThan(0);
  });

  it("groups monthly inflow, outflow and net", () => {
    const cashflow = calculateCashflow(transactions, { granularity: "month", includeInternalTransfers: false });
    const april = cashflow.buckets.find((bucket) => bucket.period === "2026-04");

    expect(april?.inflow).toBe(18500);
    expect(april?.outflow).toBeCloseTo(4268.17);
    expect(april?.net).toBeCloseTo(14231.83);
  });
});

describe("burn calculations", () => {
  it("calculates burn without internal transfers and investment deposits", () => {
    const burn = calculateBurn(transactions, { currentMonth: "2026-04" });

    expect(burn.totalBurn).toBeCloseTo(4268.17);
    expect(burn.byCategory.find((row) => row.key === "cat-beleggen")).toBeUndefined();
    expect(burn.recurring.length).toBeGreaterThan(0);
  });
});

describe("net worth calculations", () => {
  it("calculates total, liquid and illiquid net worth trends", () => {
    const trend = calculateNetWorthTrend(assetSnapshots, liabilitySnapshots);
    const current = trend.at(-1);

    expect(current?.month).toBe("2026-04");
    expect(current?.total).toBeGreaterThan(800000);
    expect(current?.liquid).toBeGreaterThan(500000);
    expect(getCurrentNetWorth(assetSnapshots, liabilitySnapshots, "ILLIQUID")).toBe(current?.illiquid);
  });
});

describe("performance calculations", () => {
  it("distinguishes contribution base from current market value", () => {
    const performance = calculatePerformance(investmentSnapshots);

    expect(performance.currentValue).toBeGreaterThan(performance.contributed);
    expect(performance.gainLoss).toBeGreaterThan(0);
    expect(performance.byProvider.map((row) => row.provider).sort()).toEqual(["BITVAVO", "DEGIRO"]);
  });
});
