export function normalizeDescription(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function parseEuroNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  const text = String(value ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(/[€£$]/g, "");

  if (!text) {
    return Number.NaN;
  }

  const normalized = text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text;
  return Number(normalized);
}

export function parseIsoDate(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  const text = String(value ?? "").trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return text.slice(0, 10);
  }

  if (/^\d{8}$/.test(text)) {
    return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
  }

  const dutchDate = /^(\d{2})-(\d{2})-(\d{4})$/.exec(text);
  if (dutchDate) {
    return `${dutchDate[3]}-${dutchDate[2]}-${dutchDate[1]}`;
  }

  throw new Error(`Invalid date: ${text}`);
}

export function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(field);
      if (row.some((cell) => cell.trim())) {
        rows.push(row);
      }
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((cell) => cell.trim())) {
    rows.push(row);
  }

  return rows;
}

export function rowsToObjects(rows: string[][]) {
  const [headers, ...dataRows] = rows;

  if (!headers) {
    return [];
  }

  return dataRows.map((row) =>
    Object.fromEntries(headers.map((header, index) => [header.trim(), row[index]?.trim() ?? ""])),
  );
}

export function compactObject(input: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined && value !== ""));
}
