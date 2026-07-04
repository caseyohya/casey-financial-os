"use client";

import { useState } from "react";
import { SelectField, Button } from "@/components/forms/FormFields";
import { uploadPropertyDocument } from "@/app/(dashboard)/real-estate/actions";
import type { DocumentType } from "@/lib/types/real-estate";
import { Upload } from "lucide-react";

const DOCUMENT_TYPES = [
  { value: "lease", label: "Lease Agreement" },
  { value: "mortgage_statement", label: "Mortgage Statement" },
  { value: "tax_bill", label: "Tax Bill" },
  { value: "insurance", label: "Insurance" },
  { value: "repair", label: "Repair Invoice" },
  { value: "other", label: "Other" },
];

interface DocumentUploadFormProps {
  propertyId: string;
}

export function DocumentUploadForm({ propertyId }: DocumentUploadFormProps) {
  const [documentType, setDocumentType] = useState<DocumentType>("lease");
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

    const result = await uploadPropertyDocument(propertyId, formData);
    if (result?.error) setError(result.error);
    else {
      setSuccess(true);
      e.currentTarget.reset();
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-xs text-red-400">{error}</p>}
      {success && <p className="text-xs text-emerald-400">Document uploaded successfully.</p>}

      <SelectField
        label="Document Type"
        options={DOCUMENT_TYPES}
        value={documentType}
        onChange={(e) => setDocumentType(e.target.value as DocumentType)}
      />

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-300">File</label>
        <input
          type="file"
          name="file"
          required
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
          className="w-full text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-navy-700 file:px-4 file:py-2 file:text-sm file:text-slate-200"
        />
      </div>

      <Button type="submit" isLoading={loading}>
        <Upload className="mr-2 h-4 w-4" />
        Upload Document
      </Button>
    </form>
  );
}
