"use client";

import { InputField, SelectField, Button } from "@/components/forms/FormFields";
import { TRANSACTION_TYPES } from "@/lib/banking/constants";
import type { BankAccount, TransactionCategory } from "@/lib/types";

export interface TransactionFormData {
  account_id: string;
  description: string;
  amount: string;
  transaction_type: string;
  category_id: string;
  transaction_date: string;
  exchange_rate_to_usd: string;
  notes: string;
}

export const defaultTransactionForm: TransactionFormData = {
  account_id: "",
  description: "",
  amount: "",
  transaction_type: "expense",
  category_id: "",
  transaction_date: new Date().toISOString().split("T")[0],
  exchange_rate_to_usd: "",
  notes: "",
};

interface TransactionFormProps {
  form: TransactionFormData;
  onChange: (form: TransactionFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  accounts: BankAccount[];
  categories: TransactionCategory[];
  isLoading?: boolean;
  isEdit?: boolean;
}

export function TransactionForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  accounts,
  categories,
  isLoading,
  isEdit,
}: TransactionFormProps) {
  const selected = accounts.find((a) => a.id === form.account_id);
  const filteredCategories = categories.filter(
    (c) => c.transaction_type === form.transaction_type
  );

  const set = (key: keyof TransactionFormData, value: string) => {
    onChange({ ...form, [key]: value });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <SelectField
        label="Account"
        value={form.account_id}
        onChange={(e) => set("account_id", e.target.value)}
        required
        options={[
          { value: "", label: "Select account" },
          ...accounts.map((a) => ({
            value: a.id,
            label: `${a.name} (${a.currency})`,
          })),
        ]}
      />
      <InputField
        label="Description"
        value={form.description}
        onChange={(e) => set("description", e.target.value)}
        required
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label="Amount"
          type="number"
          step="0.01"
          value={form.amount}
          onChange={(e) => set("amount", e.target.value)}
          required
        />
        <InputField
          label="Date"
          type="date"
          value={form.transaction_date}
          onChange={(e) => set("transaction_date", e.target.value)}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Transaction Type"
          value={form.transaction_type}
          onChange={(e) => {
            set("transaction_type", e.target.value);
            set("category_id", "");
          }}
          options={TRANSACTION_TYPES}
        />
        <SelectField
          label="Category"
          value={form.category_id}
          onChange={(e) => set("category_id", e.target.value)}
          options={[
            { value: "", label: "Uncategorized" },
            ...filteredCategories.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
      </div>
      {selected?.currency === "JPY" && (
        <InputField
          label="Exchange Rate (JPY per 1 USD)"
          type="number"
          step="0.01"
          value={form.exchange_rate_to_usd}
          onChange={(e) => set("exchange_rate_to_usd", e.target.value)}
          placeholder={selected.exchange_rate_to_usd?.toString() ?? "150.00"}
        />
      )}
      <InputField
        label="Notes"
        value={form.notes}
        onChange={(e) => set("notes", e.target.value)}
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {isEdit ? "Update Transaction" : "Add Transaction"}
        </Button>
      </div>
    </form>
  );
}
