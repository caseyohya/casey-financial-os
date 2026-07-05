"use client";

import { toggleDocumentReceived, uploadTaxDocument } from "@/app/(dashboard)/tax/actions";
import type { TaxDocument } from "@/lib/types/tax";
import { DOCUMENT_TYPE_LABELS } from "@/lib/types/tax";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Check, Upload, FileText } from "lucide-react";
import { useState } from "react";

interface DocumentChecklistProps {
  documents: TaxDocument[];
  taxYearId: string;
  year: number;
}

export function DocumentChecklist({ documents, taxYearId, year }: DocumentChecklistProps) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  async function handleToggle(id: string, current: boolean) {
    await toggleDocumentReceived(id, year, !current);
  }

  async function handleUpload(documentId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(documentId);
    const formData = new FormData();
    formData.append("file", file);
    await uploadTaxDocument(taxYearId, year, documentId, formData);
    setUploadingId(null);
  }

  const received = documents.filter((d) => d.is_received).length;
  const required = documents.filter((d) => d.is_required).length;

  return (
    <DashboardCard
      title="CPA Document Checklist"
      description={`${received} of ${required} required documents received`}
    >
      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between rounded-lg border border-navy-700 bg-navy-800/50 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleToggle(doc.id, doc.is_received)}
                className={`flex h-6 w-6 items-center justify-center rounded border transition-colors ${
                  doc.is_received
                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                    : "border-navy-600 text-slate-500 hover:border-gold-500"
                }`}
              >
                {doc.is_received && <Check className="h-3.5 w-3.5" />}
              </button>
              <div>
                <p className="text-sm font-medium text-white">{doc.name}</p>
                <p className="text-xs text-slate-500">
                  {DOCUMENT_TYPE_LABELS[doc.document_type]}
                  {doc.file_path && (
                    <span className="ml-2 inline-flex items-center gap-1 text-emerald-400">
                      <FileText className="h-3 w-3" /> Uploaded
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {doc.is_required && !doc.is_received && (
                <StatusBadge status="warning" label="Required" />
              )}
              <label className="cursor-pointer rounded-lg border border-navy-600 px-2 py-1 text-xs text-slate-400 hover:border-gold-500 hover:text-gold-500">
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.csv,.xlsx,.xls,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => handleUpload(doc.id, e)}
                  disabled={uploadingId === doc.id}
                />
                <span className="flex items-center gap-1">
                  <Upload className="h-3 w-3" />
                  {uploadingId === doc.id ? "Uploading..." : "Upload"}
                </span>
              </label>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
