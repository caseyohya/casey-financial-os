"use client";

import { useState } from "react";
import { InputField, SelectField, Button } from "@/components/forms/FormFields";
import { addPropertyIncome, addPropertyExpense } from "@/app/(dashboard)/real-estate/actions";
import type { ExpenseCategory, IncomeType, PropertyCurrency } from "@/lib/types/real-estate";

const INCOME_TYPES = [
  { value: "rent", label: "Rent" },
  { value: "late_fee", label: "Late Fee" },
  { value: "parking", label: "Parking" },
  { value: "laundry", label: "Laundry" },
  { value: "other", label: "Other" },
];

const EXPENSE_CATEGORIES = [
  { value: "hoa", label: "HOA" },
  { value: "taxes", label: "Property Taxes" },
  { value: "insurance", label: "Insurance" },
  { value: "maintenance", label: "Maintenance" },
  { value: "repairs", label: "Repairs" },
  { value: "management", label: "Management" },
  { value: "utilities", label: "Utilities" },
  { value: "mortgage_principal", label: "Mortgage — Principal" },
  { value: "mortgage_interest", label: "Mortgage — Interest" },
  { value: "other", label: "Other" },
];

interface IncomeExpenseFormsProps {
  propertyId: string;
  currency: PropertyCurrency;
}

export function IncomeExpenseForms({ propertyId, currency }: IncomeExpenseFormsProps) {
  const [incomeForm, setIncomeForm] = useState({
    income_date: new Date().toISOString().split("T")[0],
    amount: 0,
    income_type: "rent" as IncomeType,
    is_vacancy_period: false,
    notes: "",
  });
  const [expenseForm, setExpenseForm] = useState({
    expense_date: new Date().toISOString().split("T")[0],
    amount: 0,
    category: "maintenance" as ExpenseCategory,
    description: "",
    notes: "",
  });
  const [incomeLoading, setIncomeLoading] = useState(false);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleAddIncome(e: React.FormEvent) {
    e.preventDefault();
    setIncomeLoading(true);
    setMessage(null);
    const result = await addPropertyIncome(propertyId, { ...incomeForm, currency });
    if (result?.error) setMessage(result.error);
    else setIncomeForm((f) => ({ ...f, amount: 0, notes: "" }));
    setIncomeLoading(false);
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    setExpenseLoading(true);
    setMessage(null);
    const result = await addPropertyExpense(propertyId, { ...expenseForm, currency });
    if (result?.error) setMessage(result.error);
    else setExpenseForm((f) => ({ ...f, amount: 0, description: "", notes: "" }));
    setExpenseLoading(false);
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {message}
        </div>
      )}

      <form onSubmit={handleAddIncome} className="space-y-3 rounded-lg border border-navy-700 bg-navy-800/50 p-4">
        <h4 className="text-sm font-semibold text-white">Add Income</h4>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InputField
            label="Date"
            type="date"
            value={incomeForm.income_date}
            onChange={(e) => setIncomeForm((f) => ({ ...f, income_date: e.target.value }))}
          />
          <InputField
            label="Amount"
            type="number"
            min="0"
            step="0.01"
            value={incomeForm.amount || ""}
            onChange={(e) => setIncomeForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
          />
          <SelectField
            label="Type"
            options={INCOME_TYPES}
            value={incomeForm.income_type}
            onChange={(e) => setIncomeForm((f) => ({ ...f, income_type: e.target.value as IncomeType }))}
          />
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={incomeForm.is_vacancy_period}
                onChange={(e) => setIncomeForm((f) => ({ ...f, is_vacancy_period: e.target.checked }))}
                className="rounded border-navy-600"
              />
              Vacancy period
            </label>
          </div>
        </div>
        <Button type="submit" isLoading={incomeLoading} className="w-full sm:w-auto">
          Add Income
        </Button>
      </form>

      <form onSubmit={handleAddExpense} className="space-y-3 rounded-lg border border-navy-700 bg-navy-800/50 p-4">
        <h4 className="text-sm font-semibold text-white">Add Expense</h4>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InputField
            label="Date"
            type="date"
            value={expenseForm.expense_date}
            onChange={(e) => setExpenseForm((f) => ({ ...f, expense_date: e.target.value }))}
          />
          <InputField
            label="Amount"
            type="number"
            min="0"
            step="0.01"
            value={expenseForm.amount || ""}
            onChange={(e) => setExpenseForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
          />
          <SelectField
            label="Category"
            options={EXPENSE_CATEGORIES}
            value={expenseForm.category}
            onChange={(e) => setExpenseForm((f) => ({ ...f, category: e.target.value as ExpenseCategory }))}
          />
          <InputField
            label="Description"
            value={expenseForm.description}
            onChange={(e) => setExpenseForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
        <Button type="submit" isLoading={expenseLoading} className="w-full sm:w-auto">
          Add Expense
        </Button>
      </form>
    </div>
  );
}
