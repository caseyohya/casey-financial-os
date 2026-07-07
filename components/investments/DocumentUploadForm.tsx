"use client";

import { useState } from "react";
import { SelectField, Button } from "@/components/forms/FormFields";
import { uploadInvestmentDocument } from "@/app/(dashboard)/investments/actions";
import type { DocumentType } from "@/lib/types/investments";
import { Upload } from "lucide-react";

const DOC_TYPES = [
  { value: "k1", label: "K-1" },
  { value: "subscription", label: "Subscription Agreement" },
  { value: "capital_call", label: "Capital Call Notice" },
  { value: "distribution", label: "Distribution Statement" },
  { value: "valuation", label: "Valuation Report" },
  { value: "other", label: "Other" },
];

interface DocumentUploadFormProps {
  investmentId: string;
}

export function DocumentUploadForm({ investmentId }: DocumentUploadFormProps) {
  const [documentType, setDocumentType] = useState<DocumentType>("k1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    formData.set("document_type", documentType);
    const result = await uploadInvestmentDocument(investmentId, formData);
    if (result?.error) setError(result.error);
    else { setSuccess(true); e.currentTarget.reset(); }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-xs text-red-400">{error}</p>}
      {success && <p className="text-xs text-emerald-400">Document uploaded.</p>}
      <SelectField label="Document Type" options={DOC_TYPES} value={documentType} onChange={(e) => setDocumentType(e.target.value as DocumentType)} />
      <InputField label="Tax Year (optional)" name="tax_year" type="number" placeholder="2024" />
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-300">File</label>
        <input type="file" name="file" required accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" className="w-full text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-navy-700 file:px-4 file:py-2 file:text-sm file:text-slate-200" />
      </div>
      <Button type="submit" isLoading={loading}><Upload className="mr-2 h-4 w-4" />Upload</Button>
    </form>
  );
}

function InputField({ label, name, type, placeholder }: { label: string; name: string; type?: string; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-300">{label}</label>
      <input name={name} type={type} placeholder={placeholder} className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-white" />
    </div>
  );
}
