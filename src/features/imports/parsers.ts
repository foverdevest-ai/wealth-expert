import * as XLSX from "xlsx";
import type { ImportParseError, ImportParseResult, ImportSource, ParsedImportRow } from "@/features/imports/types";
import { compactObject, parseCsv, parseEuroNumber, parseIsoDate, rowsToObjects } from "@/features/imports/parse-utils";

type ParserInput = {
  source: ImportSource;
  filename: string;
  buffer: Buffer;
};

export function parseImportFile(input: ParserInput): ImportParseResult {
  if (input.source === "REVOLUT") {
    return parseRevolutCsv(input.buffer);
  }

  if (input.source === "ABN_AMRO") {
    return parseAbnWorkbook(input.buffer);
  }

  return parseDegiroWorkbook(input.buffer);
}

function parseRevolutCsv(buffer: Buffer): ImportParseResult {
  const text = buffer.toString("utf8");
  const objects = rowsToObjects(parseCsv(text));
  const rows: ParsedImportRow[] = [];
  const errors: ImportParseError[] = [];

  objects.forEach((raw, index) => {
    try {
      const amount = parseEuroNumber(raw.Amount);
      if (!Number.isFinite(amount)) {
        throw new Error("Amount is missing or invalid");
      }

      const date = parseIsoDate(raw["Date completed (UTC)"] || raw["Date started (UTC)"]);
      const description = String(raw.Description || raw.Type || "Revolut transaction").trim();
      rows.push({
        rowIndex: index + 2,
        raw,
        externalTransactionId: String(raw.ID || "").trim() || undefined,
        date,
        description,
        counterparty: String(raw.Payer || raw.Reference || "").trim() || undefined,
        amount,
        currency: String(raw["Payment currency"] || raw["Orig currency"] || "EUR"),
        direction: amount >= 0 ? "INFLOW" : "OUTFLOW",
        isInvestmentRelated: false,
        isInternalTransfer: false,
        liquidityImpact: "LIQUID",
        tags: ["manual-import", "revolut"],
      });
    } catch (error) {
      errors.push({
        rowIndex: index + 2,
        raw,
        message: error instanceof Error ? error.message : "Unable to parse Revolut row",
      });
    }
  });

  return { rows, errors };
}

function parseAbnWorkbook(buffer: Buffer): ImportParseResult {
  const objects = readFirstSheet(buffer);
  const rows: ParsedImportRow[] = [];
  const errors: ImportParseError[] = [];

  objects.forEach((raw, index) => {
    try {
      const amount = parseEuroNumber(raw.amount);
      if (!Number.isFinite(amount)) {
        throw new Error("Amount is missing or invalid");
      }

      const date = parseIsoDate(raw.transactiondate || raw.valuedate);
      const description = String(raw.description || "ABN AMRO transaction").trim().replace(/\s+/g, " ");
      const accountNumber = String(raw.accountNumber || "").trim();
      rows.push({
        rowIndex: index + 2,
        raw: compactObject(raw),
        externalTransactionId: accountNumber ? `${accountNumber}-${date}-${amount}-${index}` : undefined,
        date,
        description,
        counterparty: extractDutchDescriptionValue(description, "Naam"),
        amount,
        currency: String(raw.mutationcode || "EUR"),
        direction: amount >= 0 ? "INFLOW" : "OUTFLOW",
        isInvestmentRelated: false,
        isInternalTransfer: false,
        liquidityImpact: "LIQUID",
        tags: ["manual-import", "abn-amro"],
      });
    } catch (error) {
      errors.push({
        rowIndex: index + 2,
        raw: compactObject(raw),
        message: error instanceof Error ? error.message : "Unable to parse ABN row",
      });
    }
  });

  return { rows, errors };
}

function parseDegiroWorkbook(buffer: Buffer): ImportParseResult {
  const objects = readFirstSheet(buffer);
  const rows: ParsedImportRow[] = [];
  const errors: ImportParseError[] = [];

  objects.forEach((raw, index) => {
    try {
      const total = parseEuroNumber(raw["Total EUR"]);
      if (!Number.isFinite(total)) {
        throw new Error("Total EUR is missing or invalid");
      }

      const date = parseIsoDate(raw.Date);
      const product = String(raw.Product || "DEGIRO transaction").trim();
      const isin = String(raw.ISIN || "").trim();
      const quantity = String(raw.Quantity || "").trim();
      const orderId = String(raw["Order ID"] || "").trim();
      const description = `${quantity.startsWith("-") ? "SELL" : "BUY"} ${quantity} ${product}`.replace(/\s+/g, " ");

      rows.push({
        rowIndex: index + 2,
        raw: compactObject(raw),
        externalTransactionId: orderId || `${date}-${isin}-${quantity}-${total}`,
        date,
        description,
        counterparty: isin || undefined,
        amount: total,
        currency: "EUR",
        direction: total >= 0 ? "INFLOW" : "OUTFLOW",
        isInvestmentRelated: true,
        isInternalTransfer: false,
        liquidityImpact: "LIQUID",
        tags: ["manual-import", "degiro", "investment"],
      });
    } catch (error) {
      errors.push({
        rowIndex: index + 2,
        raw: compactObject(raw),
        message: error instanceof Error ? error.message : "Unable to parse DEGIRO row",
      });
    }
  });

  return { rows, errors };
}

function readFirstSheet(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("Workbook has no sheets");
  }

  return XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[firstSheetName], {
    defval: "",
    raw: false,
  });
}

function extractDutchDescriptionValue(description: string, label: string) {
  const match = new RegExp(`${label}:\\s*([^:]+?)(?:\\s{2,}|$)`).exec(description);
  return match?.[1]?.trim();
}
