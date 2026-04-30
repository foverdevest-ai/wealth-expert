import type { InputJsonValue } from "@prisma/client/runtime/client";
import { prisma } from "@/server/prisma";
import { hasFallbackDuplicate } from "@/features/imports/duplicate";
import { parseImportFile } from "@/features/imports/parsers";
import type { ImportPreviewRow, ImportSource, ParsedImportRow } from "@/features/imports/types";

type PreviewImportInput = {
  source: ImportSource;
  accountId: string;
  filename: string;
  buffer: Buffer;
};

type StoredImportRow = {
  id: string;
  rowIndex: number;
  status: string;
  duplicateReason: string | null;
  errorMessage: string | null;
  normalized: unknown;
  raw: unknown;
};

type ImportBatchWithRows = {
  id: string;
  source: string;
  filename: string;
  account: {
    id: string;
    name: string;
  };
  rows: StoredImportRow[];
};

type ConfirmImportBatch = {
  id: string;
  accountId: string;
  filename: string;
  duplicateRows: number;
  errorRows: number;
  account: {
    entityId: string;
  };
  rows: Array<{
    id: string;
    status: string;
    normalized: unknown;
  }>;
};

type ImportHistoryBatch = {
  id: string;
  source: ImportSource;
  filename: string;
  status: string;
  account: {
    name: string;
  };
  totalRows: number;
  newRows: number;
  duplicateRows: number;
  errorRows: number;
  importedRows: number;
  createdAt: Date;
  confirmedAt: Date | null;
};

export type ImportHistoryRecord = Omit<ImportHistoryBatch, "account"> & {
  accountName: string;
};

export async function previewImport(input: PreviewImportInput) {
  const account = await prisma.connectedAccount.findUnique({
    where: { id: input.accountId },
    include: { entity: true },
  });

  if (!account) {
    throw new Error("Selected account was not found");
  }

  const user = await getSingleUser();
  const parsed = parseImportFile(input);
  const duplicateCheckedRows: ImportPreviewRow[] = [];

  for (const row of parsed.rows) {
    const duplicateReason = await findDuplicateReason(input.accountId, row);
    duplicateCheckedRows.push({
      rowIndex: row.rowIndex,
      status: duplicateReason ? "DUPLICATE" : "NEW",
      duplicateReason,
      raw: row.raw,
      normalized: row,
    });
  }

  for (const error of parsed.errors) {
    duplicateCheckedRows.push({
      rowIndex: error.rowIndex,
      status: "ERROR",
      raw: error.raw,
      errorMessage: error.message,
    });
  }

  duplicateCheckedRows.sort((left, right) => left.rowIndex - right.rowIndex);

  const counts = countPreviewRows(duplicateCheckedRows);
  const batch = (await prisma.importBatch.create({
    data: {
      userId: user.id,
      accountId: account.id,
      source: input.source,
      filename: input.filename,
      status: "PREVIEW",
      totalRows: counts.total,
      newRows: counts.newRows,
      duplicateRows: counts.duplicateRows,
      errorRows: counts.errorRows,
      rows: {
        create: duplicateCheckedRows.map((row) => ({
          rowIndex: row.rowIndex,
          status: row.status,
          duplicateReason: row.duplicateReason,
          errorMessage: row.errorMessage,
          raw: row.raw as InputJsonValue,
          normalized: (row.normalized ?? undefined) as InputJsonValue | undefined,
        })),
      },
    },
    include: { rows: { orderBy: { rowIndex: "asc" } }, account: true },
  })) as ImportBatchWithRows;

  return {
    batchId: batch.id,
    source: batch.source,
    filename: batch.filename,
    account: {
      id: batch.account.id,
      name: batch.account.name,
    },
    counts,
    rows: batch.rows.map((row: StoredImportRow) => ({
      id: row.id,
      rowIndex: row.rowIndex,
      status: row.status,
      duplicateReason: row.duplicateReason,
      errorMessage: row.errorMessage,
      normalized: row.normalized,
      raw: row.raw,
    })),
  };
}

export async function confirmImport(batchId: string) {
  const batch = (await prisma.importBatch.findUnique({
    where: { id: batchId },
    include: { account: true, rows: { orderBy: { rowIndex: "asc" } } },
  })) as ConfirmImportBatch | null;

  if (!batch) {
    throw new Error("Import batch was not found");
  }

  const uncategorised = await getUncategorisedCategory();
  let importedRows = 0;

  for (const row of batch.rows) {
    if (row.status !== "NEW" || !row.normalized) {
      continue;
    }

    const normalized = row.normalized as unknown as ParsedImportRow;
    const transaction = await prisma.transaction.create({
      data: {
        accountId: batch.accountId,
        entityId: batch.account.entityId,
        categoryId: uncategorised.id,
        externalTransactionId: normalized.externalTransactionId,
        date: new Date(`${normalized.date}T00:00:00.000Z`),
        description: normalized.description,
        counterparty: normalized.counterparty,
        amount: normalized.amount,
        currency: normalized.currency,
        direction: normalized.direction,
        isInternalTransfer: normalized.isInternalTransfer,
        isInvestmentRelated: normalized.isInvestmentRelated,
        liquidityImpact: normalized.liquidityImpact,
        notes: `Imported from ${batch.filename}`,
      },
    });

    await prisma.importRow.update({
      where: { id: row.id },
      data: {
        status: "IMPORTED",
        transactionId: transaction.id,
      },
    });
    importedRows += 1;
  }

  const updated = await prisma.importBatch.update({
    where: { id: batch.id },
    data: {
      status: "IMPORTED",
      importedRows,
      confirmedAt: new Date(),
    },
  });

  return {
    batchId: updated.id,
    importedRows,
    skippedRows: batch.duplicateRows + batch.errorRows,
  };
}

export async function listImports(): Promise<ImportHistoryRecord[]> {
  const imports = (await prisma.importBatch.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      account: {
        select: {
          name: true,
        },
      },
    },
  })) as ImportHistoryBatch[];

  return imports.map((item: ImportHistoryBatch) => ({
    id: item.id,
    source: item.source,
    filename: item.filename,
    status: item.status,
    accountName: item.account.name,
    totalRows: item.totalRows,
    newRows: item.newRows,
    duplicateRows: item.duplicateRows,
    errorRows: item.errorRows,
    importedRows: item.importedRows,
    createdAt: item.createdAt,
    confirmedAt: item.confirmedAt,
  }));
}

async function findDuplicateReason(accountId: string, row: ParsedImportRow) {
  if (row.externalTransactionId) {
    const existingByExternalId = await prisma.transaction.findFirst({
      where: {
        accountId,
        externalTransactionId: row.externalTransactionId,
      },
      select: { id: true },
    });

    if (existingByExternalId) {
      return "Same external transaction ID already exists";
    }
  }

  const sameDayAndAmount = await prisma.transaction.findMany({
    where: {
      accountId,
      date: new Date(`${row.date}T00:00:00.000Z`),
      amount: row.amount,
    },
    select: {
      description: true,
    },
  });

  return hasFallbackDuplicate(row, sameDayAndAmount)
    ? "Same account, date, amount and description already exists"
    : undefined;
}

function countPreviewRows(rows: ImportPreviewRow[]) {
  return {
    total: rows.length,
    newRows: rows.filter((row) => row.status === "NEW").length,
    duplicateRows: rows.filter((row) => row.status === "DUPLICATE").length,
    errorRows: rows.filter((row) => row.status === "ERROR").length,
  };
}

async function getSingleUser() {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });

  if (!user) {
    throw new Error("No user found. Run the seed script before importing.");
  }

  return user;
}

async function getUncategorisedCategory() {
  const category = await prisma.transactionCategory.findFirst({
    where: { name: "Uncategorised" },
    orderBy: { createdAt: "asc" },
  });

  if (!category) {
    throw new Error("Uncategorised category was not found");
  }

  return category;
}
