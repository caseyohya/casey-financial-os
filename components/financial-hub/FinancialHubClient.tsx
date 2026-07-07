"use client";

import { useMemo, useState, useTransition } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button, InputField, SelectField } from "@/components/forms/FormFields";
import { Modal } from "@/components/banking/Modal";
import { calculateFinancialHubMetrics } from "@/lib/calculations/financial-hub";
import type { FinancialHubData } from "@/lib/types/financial-hub";
import { formatCurrency, cn } from "@/lib/utils";
import {
  createAccount,
  updateAccount,
  deleteAccount,
  createAsset,
  updateAsset,
  deleteAsset,
  createLiability,
  updateLiability,
  deleteLiability,
  createIncomeSource,
  updateIncomeSource,
  deleteIncomeSource,
  createExpense,
  updateExpense,
  deleteExpense,
} from "@/app/(dashboard)/financial-hub/actions";
import { Pencil, Plus, Trash2, Wallet } from "lucide-react";

type HubTab = "accounts" | "assets" | "liabilities" | "income" | "expenses";

const TABS: { id: HubTab; label: string }[] = [
  { id: "accounts", label: "Accounts" },
  { id: "assets", label: "Assets" },
  { id: "liabilities", label: "Liabilities" },
  { id: "income", label: "Income" },
  { id: "expenses", label: "Expenses" },
];

interface FinancialHubClientProps {
  initialData: FinancialHubData;
}

export function FinancialHubClient({ initialData }: FinancialHubClientProps) {
  const [tab, setTab] = useState<HubTab>("accounts");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const metrics = useMemo(() => calculateFinancialHubMetrics(initialData), [initialData]);

  const openCreate = () => {
    setEditingId(null);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (id: string) => {
    setEditingId(id);
    setError(null);
    setModalOpen(true);
  };

  const handleDelete = (id: string, action: (id: string) => Promise<void>) => {
    if (!confirm("Delete this record?")) return;
    startTransition(async () => {
      try {
        await action(id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Delete failed");
      }
    });
  };

  const handleSubmit = (formData: FormData, createFn: (fd: FormData) => Promise<void>, updateFn: (id: string, fd: FormData) => Promise<void>) => {
    startTransition(async () => {
      try {
        if (editingId) {
          await updateFn(editingId, formData);
        } else {
          await createFn(formData);
        }
        setModalOpen(false);
        setEditingId(null);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  };

  const editingAccount = initialData.accounts.find((a) => a.id === editingId);
  const editingAsset = initialData.assets.find((a) => a.id === editingId);
  const editingLiability = initialData.liabilities.find((l) => l.id === editingId);
  const editingIncome = initialData.incomeSources.find((i) => i.id === editingId);
  const editingExpense = initialData.expenses.find((e) => e.id === editingId);

  return (
    <div>
      <PageHeader
        title="Financial Hub"
        description="Central command for net worth tracking and cash flow analysis"
      >
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add {TABS.find((t) => t.id === tab)?.label.slice(0, -1) ?? "Item"}
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Net Worth" value={formatCurrency(metrics.netWorth)} />
        <MetricCard label="Total Assets" value={formatCurrency(metrics.totalAssets)} />
        <MetricCard label="Monthly Income" value={formatCurrency(metrics.monthlyIncome)} />
        <MetricCard label="Monthly Cash Flow" value={formatCurrency(metrics.monthlyCashFlow)} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "bg-gold-500 text-navy-950"
                : "bg-navy-800 text-slate-300 hover:bg-navy-700"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="mt-6">
        <DashboardCard title={TABS.find((t) => t.id === tab)?.label ?? ""} description="Manual data entry">
          {tab === "accounts" && (
            <EntityTable
              empty={initialData.accounts.length === 0}
              rows={initialData.accounts.map((a) => ({
                id: a.id,
                primary: a.name,
                secondary: `${a.account_type} · ${a.institution ?? "—"}`,
                value: formatCurrency(a.balance),
              }))}
              onEdit={openEdit}
              onDelete={(id) => handleDelete(id, deleteAccount)}
            />
          )}
          {tab === "assets" && (
            <EntityTable
              empty={initialData.assets.length === 0}
              rows={initialData.assets.map((a) => ({
                id: a.id,
                primary: a.name,
                secondary: a.asset_type,
                value: formatCurrency(a.current_value),
              }))}
              onEdit={openEdit}
              onDelete={(id) => handleDelete(id, deleteAsset)}
            />
          )}
          {tab === "liabilities" && (
            <EntityTable
              empty={initialData.liabilities.length === 0}
              rows={initialData.liabilities.map((l) => ({
                id: l.id,
                primary: l.name,
                secondary: l.liability_type,
                value: formatCurrency(l.current_balance),
              }))}
              onEdit={openEdit}
              onDelete={(id) => handleDelete(id, deleteLiability)}
            />
          )}
          {tab === "income" && (
            <EntityTable
              empty={initialData.incomeSources.length === 0}
              rows={initialData.incomeSources.map((i) => ({
                id: i.id,
                primary: i.name,
                secondary: `${i.frequency}${i.is_passive ? " · passive" : ""}`,
                value: formatCurrency(i.amount),
              }))}
              onEdit={openEdit}
              onDelete={(id) => handleDelete(id, deleteIncomeSource)}
            />
          )}
          {tab === "expenses" && (
            <EntityTable
              empty={initialData.expenses.length === 0}
              rows={initialData.expenses.map((e) => ({
                id: e.id,
                primary: e.name,
                secondary: `${e.frequency}${e.is_fixed ? " · fixed" : ""}`,
                value: formatCurrency(e.amount),
              }))}
              onEdit={openEdit}
              onDelete={(id) => handleDelete(id, deleteExpense)}
            />
          )}
        </DashboardCard>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit record" : "Add record"}
      >
        {tab === "accounts" && (
          <form action={(fd) => handleSubmit(fd, createAccount, updateAccount)} className="space-y-4">
            <InputField label="Name" name="name" defaultValue={editingAccount?.name} required />
            <SelectField label="Type" name="account_type" defaultValue={editingAccount?.account_type ?? "checking"} options={[
              { value: "checking", label: "Checking" },
              { value: "savings", label: "Savings" },
              { value: "brokerage", label: "Brokerage" },
              { value: "retirement", label: "Retirement" },
              { value: "credit", label: "Credit" },
              { value: "loan", label: "Loan" },
              { value: "other", label: "Other" },
            ]} />
            <InputField label="Balance" name="balance" type="number" step="0.01" defaultValue={editingAccount?.balance} required />
            <InputField label="Institution" name="institution" defaultValue={editingAccount?.institution ?? ""} />
            <InputField label="Notes" name="notes" defaultValue={editingAccount?.notes ?? ""} />
            <Button type="submit" isLoading={isPending} className="w-full">Save</Button>
          </form>
        )}
        {tab === "assets" && (
          <form action={(fd) => handleSubmit(fd, createAsset, updateAsset)} className="space-y-4">
            <InputField label="Name" name="name" defaultValue={editingAsset?.name} required />
            <SelectField label="Type" name="asset_type" defaultValue={editingAsset?.asset_type ?? "other"} options={[
              { value: "cash", label: "Cash" },
              { value: "real_estate", label: "Real Estate" },
              { value: "investment", label: "Investment" },
              { value: "precious_metal", label: "Precious Metal" },
              { value: "vehicle", label: "Vehicle" },
              { value: "other", label: "Other" },
            ]} />
            <InputField label="Current Value" name="current_value" type="number" step="0.01" defaultValue={editingAsset?.current_value} required />
            <InputField label="Category" name="category" defaultValue={editingAsset?.category ?? ""} />
            <InputField label="Notes" name="notes" defaultValue={editingAsset?.notes ?? ""} />
            <Button type="submit" isLoading={isPending} className="w-full">Save</Button>
          </form>
        )}
        {tab === "liabilities" && (
          <form action={(fd) => handleSubmit(fd, createLiability, updateLiability)} className="space-y-4">
            <InputField label="Name" name="name" defaultValue={editingLiability?.name} required />
            <SelectField label="Type" name="liability_type" defaultValue={editingLiability?.liability_type ?? "other"} options={[
              { value: "mortgage", label: "Mortgage" },
              { value: "credit_card", label: "Credit Card" },
              { value: "student_loan", label: "Student Loan" },
              { value: "auto_loan", label: "Auto Loan" },
              { value: "personal_loan", label: "Personal Loan" },
              { value: "other", label: "Other" },
            ]} />
            <InputField label="Balance" name="current_balance" type="number" step="0.01" defaultValue={editingLiability?.current_balance} required />
            <InputField label="Interest Rate (%)" name="interest_rate" type="number" step="0.01" defaultValue={editingLiability?.interest_rate ?? ""} />
            <InputField label="Notes" name="notes" defaultValue={editingLiability?.notes ?? ""} />
            <Button type="submit" isLoading={isPending} className="w-full">Save</Button>
          </form>
        )}
        {tab === "income" && (
          <form action={(fd) => handleSubmit(fd, createIncomeSource, updateIncomeSource)} className="space-y-4">
            <InputField label="Name" name="name" defaultValue={editingIncome?.name} required />
            <InputField label="Income Type" name="income_type" defaultValue={editingIncome?.income_type ?? "salary"} required />
            <InputField label="Amount" name="amount" type="number" step="0.01" defaultValue={editingIncome?.amount} required />
            <SelectField label="Frequency" name="frequency" defaultValue={editingIncome?.frequency ?? "monthly"} options={[
              { value: "monthly", label: "Monthly" },
              { value: "weekly", label: "Weekly" },
              { value: "biweekly", label: "Biweekly" },
              { value: "quarterly", label: "Quarterly" },
              { value: "annually", label: "Annually" },
            ]} />
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" name="is_passive" defaultChecked={editingIncome?.is_passive} className="rounded" />
              Passive income
            </label>
            <Button type="submit" isLoading={isPending} className="w-full">Save</Button>
          </form>
        )}
        {tab === "expenses" && (
          <form action={(fd) => handleSubmit(fd, createExpense, updateExpense)} className="space-y-4">
            <InputField label="Name" name="name" defaultValue={editingExpense?.name} required />
            <InputField label="Expense Type" name="expense_type" defaultValue={editingExpense?.expense_type ?? "living"} required />
            <InputField label="Amount" name="amount" type="number" step="0.01" defaultValue={editingExpense?.amount} required />
            <SelectField label="Frequency" name="frequency" defaultValue={editingExpense?.frequency ?? "monthly"} options={[
              { value: "monthly", label: "Monthly" },
              { value: "weekly", label: "Weekly" },
              { value: "biweekly", label: "Biweekly" },
              { value: "quarterly", label: "Quarterly" },
              { value: "annually", label: "Annually" },
            ]} />
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" name="is_fixed" defaultChecked={editingExpense?.is_fixed} className="rounded" />
              Fixed expense
            </label>
            <Button type="submit" isLoading={isPending} className="w-full">Save</Button>
          </form>
        )}
      </Modal>
    </div>
  );
}

function EntityTable({
  empty,
  rows,
  onEdit,
  onDelete,
}: {
  empty: boolean;
  rows: { id: string; primary: string; secondary: string; value: string }[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (empty) {
    return (
      <EmptyState
        title="No records yet"
        description="Add your first entry using the button above."
        icon={<Wallet className="h-8 w-8" />}
      />
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div
          key={row.id}
          className="flex items-center justify-between rounded-lg border border-navy-700 bg-navy-800 px-4 py-3"
        >
          <div>
            <p className="text-sm font-medium text-white">{row.primary}</p>
            <p className="text-xs text-slate-400">{row.secondary}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-white">{row.value}</span>
            <button type="button" onClick={() => onEdit(row.id)} className="text-slate-400 hover:text-white">
              <Pencil className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => onDelete(row.id)} className="text-slate-400 hover:text-red-400">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
