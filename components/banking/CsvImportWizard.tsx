"use client";

import { useState } from "react";
import { SelectField, Button } from "@/components/forms/FormFields";
import { CSV_FIELD_OPTIONS } from "@/lib/banking/constants";
import { parseCsv, mapCsvRows, type ParsedCsvRow } from "@/lib/banking/csv";
import type { BankAccount, ColumnMapping } from "@/lib/types";
import { Upload, FileText, CheckCircle } from "lucide-react";

interface CsvImportWizardProps {
  accounts: BankAccount[];
  onImport: (
    accountId: string,
    rows: ParsedCsvRow[],
    filename: string,
    mapping: ColumnMapping
  ) => Promise<void>;
  isLoading?: boolean;
}

type Step = "upload" | "map" | "preview" | "done";

export function CsvImportWizard({ accounts, onImport, isLoading }: CsvImportWizardProps) {
  const [step, setStep] = useState<Step>("upload");
  const [filename, setFilename] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [accountId, setAccountId] = useState("");
  const [mapping, setMapping] = useState<ColumnMapping>({
    date: "",
    description: "",
    amount: "",
  });
  const [preview, setPreview] = useState<ParsedCsvRow[]>([]);
  const [importedCount, setImportedCount] = useState(0);
  const [error, setError] = useState("");

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers: h, rows } = parseCsv(text);
      if (h.length === 0) {
        setError("Could not parse CSV file.");
        return;
      }
      setHeaders(h);
      setRawRows(rows);
      const autoMap: ColumnMapping = {
        date: h.find((x) => /date/i.test(x)) ?? "",
        description: h.find((x) => /desc|memo|name|detail/i.test(x)) ?? "",
        amount: h.find((x) => /amount|debit|credit|value/i.test(x)) ?? "",
        category: h.find((x) => /categ|type/i.test(x)) ?? "",
      };
      setMapping(autoMap);
      setStep("map");
    };
    reader.readAsText(file);
  };

  const handlePreview = () => {
    try {
      setError("");
      const rows = mapCsvRows(headers, rawRows, mapping);
      setPreview(rows.slice(0, 10));
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mapping failed");
    }
  };

  const handleImport = async () => {
    try {
      setError("");
      const rows = mapCsvRows(headers, rawRows, mapping);
      await onImport(accountId, rows, filename, mapping);
      setImportedCount(rows.length);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    }
  };

  const reset = () => {
    setStep("upload");
    setFilename("");
    setHeaders([]);
    setRawRows([]);
    setAccountId("");
    setMapping({ date: "", description: "", amount: "" });
    setPreview([]);
    setImportedCount(0);
    setError("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 text-sm text-slate-400">
        {(["upload", "map", "preview", "done"] as Step[]).map((s, i) => (
          <span
            key={s}
            className={
              step === s ? "font-medium text-gold-400" : i <= ["upload", "map", "preview", "done"].indexOf(step) ? "text-slate-300" : ""
            }
          >
            {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
          </span>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {step === "upload" && (
        <div className="rounded-lg border-2 border-dashed border-navy-600 bg-navy-800/50 p-12 text-center">
          <Upload className="mx-auto h-10 w-10 text-slate-500" />
          <p className="mt-4 text-sm text-slate-300">Upload a CSV file from your bank</p>
          <p className="mt-1 text-xs text-slate-500">
            Supports U.S. and Japan bank exports. No Plaid connection required.
          </p>
          <label className="mt-6 inline-block cursor-pointer">
            <span className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-navy-950 hover:bg-gold-400">
              Choose CSV File
            </span>
            <input type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
          </label>
        </div>
      )}

      {step === "map" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <FileText className="h-4 w-4" />
            {filename} — {rawRows.length} rows, {headers.length} columns
          </div>
          <SelectField
            label="Target Account"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
            options={[
              { value: "", label: "Select account" },
              ...accounts.map((a) => ({ value: a.id, label: `${a.name} (${a.currency})` })),
            ]}
          />
          <p className="text-sm font-medium text-slate-300">Map CSV columns to transaction fields</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {(["date", "description", "amount", "category", "type"] as const).map((field) => (
              <SelectField
                key={field}
                label={field.charAt(0).toUpperCase() + field.slice(1)}
                value={mapping[field] ?? ""}
                onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                options={[
                  ...(field === "date" || field === "description" || field === "amount"
                    ? [{ value: "", label: "— Required —" }]
                    : CSV_FIELD_OPTIONS.slice(0, 1)),
                  ...headers.map((h) => ({ value: h, label: h })),
                ]}
              />
            ))}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={reset}>
              Cancel
            </Button>
            <Button onClick={handlePreview} disabled={!accountId || !mapping.date || !mapping.description || !mapping.amount}>
              Preview
            </Button>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Preview of first {preview.length} transactions (of {rawRows.length} total)
          </p>
          <div className="overflow-x-auto rounded-lg border border-navy-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-700 bg-navy-800 text-left text-slate-400">
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Category</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-b border-navy-700/50">
                    <td className="px-4 py-2 text-slate-300">{row.date}</td>
                    <td className="px-4 py-2 text-white">{row.description}</td>
                    <td className="px-4 py-2 text-slate-300">{row.amount}</td>
                    <td className="px-4 py-2 text-slate-300">{row.type}</td>
                    <td className="px-4 py-2 text-slate-300">{row.category ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setStep("map")}>
              Back
            </Button>
            <Button onClick={handleImport} isLoading={isLoading}>
              Import {rawRows.length} Transactions
            </Button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-8 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
          <p className="mt-4 text-lg font-medium text-white">
            Successfully imported {importedCount} transactions
          </p>
          <Button className="mt-6" onClick={reset}>
            Import Another File
          </Button>
        </div>
      )}
    </div>
  );
}
