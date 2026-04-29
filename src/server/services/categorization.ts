import type { Category, Transaction } from "@/domain/types";

export function getUncategorisedTransactions(transactions: Transaction[]) {
  return transactions.filter((transaction) => transaction.categoryId === "cat-uncategorised");
}

export function assignCategory(transaction: Transaction, category: Category): Transaction {
  return {
    ...transaction,
    categoryId: category.id,
    notes: transaction.notes ? `${transaction.notes} | Category reviewed` : "Category reviewed",
  };
}

export function bulkAssignCategory(transactions: Transaction[], ids: string[], category: Category) {
  const idSet = new Set(ids);
  return transactions.map((transaction) => (idSet.has(transaction.id) ? assignCategory(transaction, category) : transaction));
}
