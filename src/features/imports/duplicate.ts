import type { ParsedImportRow } from "@/features/imports/types";
import { normalizeDescription } from "@/features/imports/parse-utils";

export type DuplicateCandidate = {
  description: string;
};

export function hasFallbackDuplicate(row: ParsedImportRow, candidates: DuplicateCandidate[]) {
  const normalizedDescription = normalizeDescription(row.description);
  return candidates.some((transaction) => normalizeDescription(transaction.description) === normalizedDescription);
}
