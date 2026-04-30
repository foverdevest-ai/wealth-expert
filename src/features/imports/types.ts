import type { AccountSourceType, LiquidityClass, TransactionDirection } from "@/domain/types";

export type ImportSource = Extract<AccountSourceType, "ABN_AMRO" | "REVOLUT" | "DEGIRO">;

export type ParsedImportRow = {
  rowIndex: number;
  raw: Record<string, unknown>;
  externalTransactionId?: string;
  date: string;
  description: string;
  counterparty?: string;
  amount: number;
  currency: string;
  direction: TransactionDirection;
  isInvestmentRelated: boolean;
  isInternalTransfer: boolean;
  liquidityImpact: LiquidityClass;
  tags: string[];
};

export type ImportParseError = {
  rowIndex: number;
  raw: Record<string, unknown>;
  message: string;
};

export type ImportParseResult = {
  rows: ParsedImportRow[];
  errors: ImportParseError[];
};

export type ImportPreviewRow = {
  rowIndex: number;
  status: "NEW" | "DUPLICATE" | "ERROR";
  duplicateReason?: string;
  errorMessage?: string;
  raw: Record<string, unknown>;
  normalized?: ParsedImportRow;
};
