import { NextResponse } from "next/server";
import { previewImport } from "@/features/imports/service";
import type { ImportSource } from "@/features/imports/types";

const SOURCES = new Set<ImportSource>(["ABN_AMRO", "REVOLUT", "DEGIRO"]);
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const source = String(formData.get("source") ?? "") as ImportSource;
    const accountId = String(formData.get("accountId") ?? "");
    const file = formData.get("file");

    if (!SOURCES.has(source)) {
      return NextResponse.json({ error: "Unsupported import source" }, { status: 400 });
    }

    if (!accountId) {
      return NextResponse.json({ error: "Account is required" }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Import file is required" }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "Import file is too large. Maximum size is 5MB." }, { status: 400 });
    }

    if (!isAllowedFile(source, file.name)) {
      return NextResponse.json({ error: "File type does not match the selected import source" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const preview = await previewImport({
      source,
      accountId,
      filename: file.name,
      buffer,
    });

    return NextResponse.json(preview);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to preview import" },
      { status: 500 },
    );
  }
}

function isAllowedFile(source: ImportSource, filename: string) {
  const extension = filename.toLowerCase().split(".").pop();

  if (source === "REVOLUT") {
    return extension === "csv" || extension === "xls" || extension === "xlsx";
  }

  return extension === "xls" || extension === "xlsx";
}
