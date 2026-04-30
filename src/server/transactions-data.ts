import type { AccountSourceType, Transaction } from "@/domain/types";
import { prisma } from "@/server/prisma";
import {
  accounts as demoAccounts,
  getAccountName,
  getCategoryName,
  getEntityName,
  transactions as demoTransactions,
} from "@/server/demo-data";

export type TransactionAccountOption = {
  id: string;
  name: string;
  entityName: string;
  source: AccountSourceType;
};

export type TransactionDisplayRow = Transaction & {
  accountName: string;
  entityName: string;
  categoryName: string;
};

export async function getTransactionsPageData() {
  try {
    const [transactions, accounts] = await Promise.all([
      prisma.transaction.findMany({
        orderBy: { date: "desc" },
        take: 250,
        include: {
          account: true,
          entity: true,
          category: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      }),
      prisma.connectedAccount.findMany({
        orderBy: { name: "asc" },
        include: { entity: true },
      }),
    ]);

    if (transactions.length || accounts.length) {
      return {
        transactions: transactions.map((transaction): TransactionDisplayRow => ({
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
          accountName: transaction.account.name,
          entityName: transaction.entity.name,
          categoryName: transaction.category.name,
        })),
        accounts: accounts.map((account): TransactionAccountOption => ({
          id: account.id,
          name: account.name,
          entityName: account.entity.name,
          source: account.source,
        })),
        source: "database" as const,
      };
    }
  } catch {
    // Local development can run without Postgres; the UI keeps working with seeded demo data.
  }

  return {
    transactions: demoTransactions.map((transaction): TransactionDisplayRow => ({
      ...transaction,
      accountName: getAccountName(transaction.accountId),
      entityName: getEntityName(transaction.entityId),
      categoryName: getCategoryName(transaction.categoryId),
    })),
    accounts: demoAccounts.map((account): TransactionAccountOption => ({
      id: account.id,
      name: account.name,
      entityName: getEntityName(account.entityId),
      source: account.source,
    })),
    source: "demo" as const,
  };
}

export async function getImportHistoryForTransactionsPage() {
  try {
    return await prisma.importBatch.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { account: true },
    });
  } catch {
    return [];
  }
}
