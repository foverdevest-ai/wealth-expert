import { NextResponse } from "next/server";
import { confirmImport } from "@/features/imports/service";

type ConfirmBody = {
  batchId?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ConfirmBody;

    if (!body.batchId) {
      return NextResponse.json({ error: "batchId is required" }, { status: 400 });
    }

    return NextResponse.json(await confirmImport(body.batchId));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to confirm import" },
      { status: 500 },
    );
  }
}
