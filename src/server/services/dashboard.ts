import {
  accounts,
  assetSnapshots,
  categories,
  getAccountName,
  getCategoryName,
  investmentSnapshots,
  liabilitySnapshots,
  transactions,
} from "@/server/demo-data";
import { calculateBurn } from "@/server/services/burn";
import { calculateCashflow, groupCashflowByDimension } from "@/server/services/cashflow";
import { calculateNetWorthTrend } from "@/server/services/net-worth";
import { calculatePerformance } from "@/server/services/performance";

export function getDashboardMetrics() {
  const netWorthTrend = calculateNetWorthTrend(assetSnapshots, liabilitySnapshots);
  const currentNetWorth = netWorthTrend.at(-1);
  const burn = calculateBurn(transactions, { currentMonth: "2026-04" });
  const cashflow = calculateCashflow(
    transactions.filter((transaction) => transaction.date.startsWith("2026-04")),
    { includeInternalTransfers: false },
  );
  const performance = calculatePerformance(investmentSnapshots);
  const topSpendCategories = groupCashflowByDimension(
    transactions.filter((transaction) => transaction.date.startsWith("2026-04") && transaction.amount < 0),
    (transaction) => getCategoryName(transaction.categoryId),
  ).slice(0, 5);
  const spendByAccount = groupCashflowByDimension(
    transactions.filter((transaction) => transaction.date.startsWith("2026-04") && transaction.amount < 0),
    (transaction) => getAccountName(transaction.accountId),
  ).slice(0, 5);

  return {
    currentNetWorth: currentNetWorth?.total ?? 0,
    liquidNetWorth: currentNetWorth?.liquid ?? 0,
    illiquidNetWorth: currentNetWorth?.illiquid ?? 0,
    cashPosition: accounts
      .filter((account) => account.class === "BANK" && account.balance > 0)
      .reduce((total, account) => total + account.balance, 0),
    monthlyBurn: burn.totalBurn,
    monthIncome: cashflow.inflow,
    monthSpend: cashflow.outflow,
    investmentValue: performance.currentValue,
    propertyEquityEstimate: (currentNetWorth?.illiquid ?? 0),
    uncategorisedCount: transactions.filter((transaction) => transaction.categoryId === "cat-uncategorised").length,
    topSpendCategories,
    spendByAccount,
    netWorthTrend,
    burnTrend: burn.monthlyTrend,
    categoryCount: categories.length,
  };
}
