import { NextResponse } from "next/server";
import { listImports, type ImportHistoryRecord } from "@/features/imports/service";

export async function GET() {
  try {
    const imports = await listImports();

    return NextResponse.json({
      imports: imports.map((item: ImportHistoryRecord) => ({
        id: item.id,
        source: item.source,
        filename: item.filename,
        status: item.status,
        accountName: item.accountName,
        totalRows: item.totalRows,
        newRows: item.newRows,
        duplicateRows: item.duplicateRows,
        errorRows: item.errorRows,
        importedRows: item.importedRows,
        createdAt: item.createdAt,
        confirmedAt: item.confirmedAt,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load import history" },
      { status: 500 },
    );
  }
}
