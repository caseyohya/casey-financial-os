"use client";

import { InputField, SelectField, Button } from "@/components/forms/FormFields";
import type { BankAccount } from "@/lib/types";

export interface BalanceFormData {
  account_id: string;
  balance: string;
  balance_date: string;
  exchange_rate_to_usd: string;
  notes: string;
}

export const defaultBalanceForm: BalanceFormData = {
  account_id: "",
  balance: "",
  balance_date: new Date().toISOString().split("T")[0],
  exchange_rate_to_usd: "",
  notes: "",
};

interface BalanceFormProps {
  form: BalanceFormData;
  onChange: (form: BalanceFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  accounts: BankAccount[];
  isLoading?: boolean;
}

export function BalanceForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  accounts,
  isLoading,
}: BalanceFormProps) {
  const selected = accounts.find((a) => a.id === form.account_id);

  const set = (key: keyof BalanceFormData, value: string) => {
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
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label="Balance"
          type="number"
          step="0.01"
          value={form.balance}
          onChange={(e) => set("balance", e.target.value)}
          required
        />
        <InputField
          label="Balance Date"
          type="date"
          value={form.balance_date}
          onChange={(e) => set("balance_date", e.target.value)}
          required
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
          Record Balance
        </Button>
      </div>
    </form>
  );
}
