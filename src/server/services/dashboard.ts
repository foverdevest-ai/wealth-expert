import {
  assetSnapshots,
  getAccountName,
  getCategoryName,
  investmentSnapshots,
  liabilitySnapshots,
} from "@/server/demo-data";
import { getFinancialAnalyticsData, getLatestTransactionMonth } from "@/server/financial-data";
import { calculateBurn } from "@/server/services/burn";
import { calculateCashflow, groupCashflowByDimension } from "@/server/services/cashflow";
import { calculateNetWorthTrend } from "@/server/services/net-worth";
import { calculatePerformance } from "@/server/services/performance";

export async function getDashboardMetrics() {
  const data = await getFinancialAnalyticsData();
  const analyticsTransactions = data.transactions;
  const analyticsAccounts = data.accounts;
  const analyticsCategories = data.categories;
  const currentMonthKey = getLatestTransactionMonth(analyticsTransactions);
  const netWorthTrend = calculateNetWorthTrend(assetSnapshots, liabilitySnapshots);
  const currentNetWorth = netWorthTrend.at(-1);
  const burn = calculateBurn(analyticsTransactions, { currentMonth: currentMonthKey });
  const cashflow = calculateCashflow(
    analyticsTransactions.filter((transaction) => transaction.date.startsWith(currentMonthKey)),
    { includeInternalTransfers: false },
  );
  const performance = calculatePerformance(investmentSnapshots);
  const topSpendCategories = groupCashflowByDimension(
    analyticsTransactions.filter((transaction) => transaction.date.startsWith(currentMonthKey) && transaction.amount < 0),
    (transaction) => data.categoryNameById.get(transaction.categoryId) ?? getCategoryName(transaction.categoryId),
  ).slice(0, 5);
  const spendByAccount = groupCashflowByDimension(
    analyticsTransactions.filter((transaction) => transaction.date.startsWith(currentMonthKey) && transaction.amount < 0),
    (transaction) => data.accountNameById.get(transaction.accountId) ?? getAccountName(transaction.accountId),
  ).slice(0, 5);
  const uncategorisedCategoryIds = analyticsCategories
    .filter((category) => category.name === "Uncategorised")
    .map((category) => category.id);

  return {
    currentNetWorth: currentNetWorth?.total ?? 0,
    liquidNetWorth: currentNetWorth?.liquid ?? 0,
    illiquidNetWorth: currentNetWorth?.illiquid ?? 0,
    cashPosition: analyticsAccounts
      .filter((account) => account.class === "BANK" && account.balance > 0)
      .reduce((total, account) => total + account.balance, 0),
    monthlyBurn: burn.totalBurn,
    monthIncome: cashflow.inflow,
    monthSpend: cashflow.outflow,
    investmentValue: performance.currentValue,
    propertyEquityEstimate: (currentNetWorth?.illiquid ?? 0),
    uncategorisedCount: analyticsTransactions.filter((transaction) => uncategorisedCategoryIds.includes(transaction.categoryId)).length,
    topSpendCategories,
    spendByAccount,
    netWorthTrend,
    burnTrend: burn.monthlyTrend,
    categoryCount: analyticsCategories.length,
    currentMonthKey,
    source: data.source,
  };
}
