import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { hasFallbackDuplicate } from "@/features/imports/duplicate";
import { parseImportFile } from "@/features/imports/parsers";

describe("manual import parsers", () => {
  it("parses Revolut CSV exports", () => {
    const csv = [
      "Date started (UTC),Date completed (UTC),ID,Type,State,Description,Reference,Payer,Orig currency,Orig amount,Payment currency,Amount,Balance,Account",
      "2026-04-30,2026-04-30,rev-1,TOPUP,COMPLETED,Money added from OVERDEVEST HOLDING BV,REVOGB21,,EUR,1000.00,EUR,1000.00,1000.00,EUR Main",
    ].join("\n");

    const result = parseImportFile({
      source: "REVOLUT",
      filename: "revolut.csv",
      buffer: Buffer.from(csv),
    });

    expect(result.errors).toHaveLength(0);
    expect(result.rows[0]).toMatchObject({
      externalTransactionId: "rev-1",
      date: "2026-04-30",
      amount: 1000,
      direction: "INFLOW",
      isInvestmentRelated: false,
    });
  });

  it("parses Revolut XLSX exports", () => {
    const buffer = workbookBuffer([
      {
        "Date completed": "2026-04-30",
        ID: "rev-xlsx-1",
        Type: "CARD_PAYMENT",
        Description: "Notion Labs Inc",
        Amount: "-18.00",
        "Payment currency": "EUR",
        Balance: "982.00",
        Account: "EUR Main",
      },
    ]);

    const result = parseImportFile({
      source: "REVOLUT",
      filename: "revolut.xlsx",
      buffer,
    });

    expect(result.errors).toHaveLength(0);
    expect(result.rows[0]).toMatchObject({
      externalTransactionId: "rev-xlsx-1",
      date: "2026-04-30",
      amount: -18,
      direction: "OUTFLOW",
      isInvestmentRelated: false,
    });
  });

  it("parses ABN XLS exports", () => {
    const buffer = workbookBuffer([
      {
        accountNumber: "121640892",
        mutationcode: "EUR",
        transactiondate: "20260111",
        valuedate: "20260111",
        startsaldo: "36443,64",
        endsaldo: "34943,64",
        amount: "-1500,00",
        description: "SEPA Overboeking Naam: F.N. Overdevest Kenmerk: NOTPROVIDED",
      },
    ]);

    const result = parseImportFile({
      source: "ABN_AMRO",
      filename: "abn.xls",
      buffer,
    });

    expect(result.errors).toHaveLength(0);
    expect(result.rows[0]).toMatchObject({
      date: "2026-01-11",
      amount: -1500,
      direction: "OUTFLOW",
      currency: "EUR",
    });
  });

  it("parses DEGIRO workbooks as investment transactions", () => {
    const buffer = workbookBuffer([
      {
        Date: "24-03-2026",
        Time: "13:16",
        Product: "VANGUARD FTSE ALL-WORLD UCITS ETF USD DIS",
        ISIN: "IE00B3RBWM25",
        Quantity: "15",
        Price: "139.2",
        "Total EUR": "-2089",
        "Order ID": "order-1",
      },
    ]);

    const result = parseImportFile({
      source: "DEGIRO",
      filename: "Transactions.xlsx",
      buffer,
    });

    expect(result.errors).toHaveLength(0);
    expect(result.rows[0]).toMatchObject({
      externalTransactionId: "order-1",
      date: "2026-03-24",
      amount: -2089,
      direction: "OUTFLOW",
      isInvestmentRelated: true,
    });
  });
});

describe("manual import duplicate detection", () => {
  it("matches fallback duplicates by normalized description", () => {
    const duplicate = hasFallbackDuplicate(
      {
        rowIndex: 2,
        raw: {},
        date: "2026-04-30",
        description: "  Money   added from OVERDEVEST HOLDING BV ",
        amount: 1000,
        currency: "EUR",
        direction: "INFLOW",
        isInvestmentRelated: false,
        isInternalTransfer: false,
        liquidityImpact: "LIQUID",
        tags: [],
      },
      [{ description: "money added from overdevest holding bv" }],
    );

    expect(duplicate).toBe(true);
  });
});

function workbookBuffer(rows: Array<Record<string, unknown>>) {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, "Sheet0");
  return Buffer.from(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));
}
