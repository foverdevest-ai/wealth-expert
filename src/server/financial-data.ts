import type { Account, Category, Entity, Transaction } from "@/domain/types";
import { prisma } from "@/server/prisma";
import {
  accounts as demoAccounts,
  categories as demoCategories,
  entities as demoEntities,
  transactions as demoTransactions,
} from "@/server/demo-data";

export type FinancialAnalyticsData = {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  entities: Entity[];
  source: "database" | "demo";
  accountNameById: Map<string, string>;
  categoryNameById: Map<string, string>;
  entityNameById: Map<string, string>;
};

export async function getFinancialAnalyticsData(): Promise<FinancialAnalyticsData> {
  try {
    const [transactions, accounts, categories, entities] = await Promise.all([
      prisma.transaction.findMany({
        orderBy: { date: "asc" },
        include: {
          tags: { include: { tag: true } },
        },
      }),
      prisma.connectedAccount.findMany({
        orderBy: { name: "asc" },
      }),
      prisma.transactionCategory.findMany({
        orderBy: { name: "asc" },
      }),
      prisma.entity.findMany({
        orderBy: { name: "asc" },
      }),
    ]);

    if (transactions.length || accounts.length) {
      const data = {
        transactions: transactions.map(
          (transaction): Transaction => ({
            id: transaction.id,
            date: transaction.date.toISOString().slice(0, 10),
            description: transaction.description,
            accountId: transaction.accountId,
            entityId: transaction.entityId,
            categoryId: transaction.categoryId,
            amount: Number(transaction.amount),
            direction: transaction.direction,
            isInternalTransfer: transaction.isInternalTransfer,
            isInvestmentRelated: transaction.isInvestmentRelated,
            liquidityImpact: transaction.liquidityImpact,
            counterparty: transaction.counterparty ?? undefined,
            notes: transaction.notes ?? undefined,
            tags: transaction.tags.map((item) => item.tag.name),
          }),
        ),
        accounts: accounts.map(
          (account): Account => ({
            id: account.id,
            name: account.name,
            entityId: account.entityId,
            source: account.source,
            class: account.accountClass,
            liquidity: account.liquidity,
            balance: Number(account.currentBalance),
            lastUpdated: account.lastSyncedAt?.toISOString() ?? account.updatedAt.toISOString(),
            syncStatus: account.syncStatus,
            includeInConsolidated: account.includeInConsolidated,
          }),
        ),
        categories: categories.map(
          (category): Category => ({
            id: category.id,
            name: category.name,
            parentId: category.parentId ?? undefined,
            color: category.color,
            isSystem: category.isSystem,
          }),
        ),
        entities: entities.map((entity): Entity => ({ id: entity.id, name: entity.name, type: entity.type })),
        source: "database" as const,
      };

      return withMaps(data);
    }
  } catch {
    // Keep local/demo mode resilient if the database is unavailable.
  }

  return withMaps({
    transactions: demoTransactions,
    accounts: demoAccounts,
    categories: demoCategories,
    entities: demoEntities,
    source: "demo" as const,
  });
}

export function getLatestTransactionMonth(transactions: Transaction[], fallback = "2026-04") {
  return transactions.at(-1)?.date.slice(0, 7) ?? fallback;
}

function withMaps(data: Omit<FinancialAnalyticsData, "accountNameById" | "categoryNameById" | "entityNameById">) {
  return {
    ...data,
    accountNameById: new Map(data.accounts.map((account) => [account.id, account.name])),
    categoryNameById: new Map(data.categories.map((category) => [category.id, category.name])),
    entityNameById: new Map(data.entities.map((entity) => [entity.id, entity.name])),
  };
}
