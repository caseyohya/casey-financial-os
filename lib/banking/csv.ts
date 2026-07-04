import type { ColumnMapping } from "@/lib/types";
import { inferTransactionType } from "./calculations";

export interface ParsedCsvRow {
  date: string;
  description: string;
  amount: number;
  category?: string;
  type?: string;
}

export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map(parseCsvLine);

  return { headers, rows };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function mapCsvRows(
  headers: string[],
  rows: string[][],
  mapping: ColumnMapping
): ParsedCsvRow[] {
  const colIndex = (field: string) => headers.indexOf(field);

  const dateIdx = colIndex(mapping.date);
  const descIdx = colIndex(mapping.description);
  const amountIdx = colIndex(mapping.amount);
  const categoryIdx = mapping.category ? colIndex(mapping.category) : -1;
  const typeIdx = mapping.type ? colIndex(mapping.type) : -1;

  if (dateIdx < 0 || descIdx < 0 || amountIdx < 0) {
    throw new Error("Required columns (date, description, amount) must be mapped.");
  }

  return rows
    .filter((row) => row.length > Math.max(dateIdx, descIdx, amountIdx))
    .map((row) => {
      const rawAmount = row[amountIdx].replace(/[$,¥]/g, "").trim();
      const amount = parseFloat(rawAmount) || 0;
      const description = row[descIdx].trim();
      const type = typeIdx >= 0 ? row[typeIdx]?.trim() : undefined;

      return {
        date: normalizeDate(row[dateIdx].trim()),
        description,
        amount,
        category: categoryIdx >= 0 ? row[categoryIdx]?.trim() : undefined,
        type: inferTransactionType(amount, description, type),
      };
    })
    .filter((r) => r.description && !isNaN(r.amount));
}

function normalizeDate(raw: string): string {
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  const parts = raw.split(/[\/\-]/);
  if (parts.length === 3) {
    const [a, b, c] = parts.map((p) => parseInt(p, 10));
    if (c > 31) return `${c}-${String(b).padStart(2, "0")}-${String(a).padStart(2, "0")}`;
    if (a > 31) return `${a}-${String(b).padStart(2, "0")}-${String(c).padStart(2, "0")}`;
    return `20${c}-${String(a).padStart(2, "0")}-${String(b).padStart(2, "0")}`;
  }

  return new Date().toISOString().split("T")[0];
}

export function exportToCsv(
  rows: Record<string, string | number | null | undefined>[],
  filename: string
): void {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          const str = val == null ? "" : String(val);
          return str.includes(",") ? `"${str}"` : str;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function buildBankingSummaryExport(
  accounts: { name: string; institution: string; balance: number; currency: string; country: string }[],
  transactions: {
    date: string;
    description: string;
    amount: number;
    currency: string;
    type: string;
    category: string;
    account: string;
  }[]
): void {
  const accountRows = accounts.map((a) => ({
    section: "Account",
    name: a.name,
    institution: a.institution,
    balance: a.balance,
    currency: a.currency,
    country: a.country,
    date: "",
    description: "",
    amount: "",
    type: "",
    category: "",
    account: "",
  }));

  const txRows = transactions.map((t) => ({
    section: "Transaction",
    name: "",
    institution: "",
    balance: "",
    currency: t.currency,
    country: "",
    date: t.date,
    description: t.description,
    amount: t.amount,
    type: t.type,
    category: t.category,
    account: t.account,
  }));

  exportToCsv([...accountRows, ...txRows], `banking-summary-${new Date().toISOString().split("T")[0]}.csv`);
}
