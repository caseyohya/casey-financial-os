"use client";

import { InputField, SelectField, Button } from "@/components/forms/FormFields";
import { ACCOUNT_TYPES, COUNTRIES, CURRENCIES } from "@/lib/banking/constants";
import type { BankAccount } from "@/lib/types";

export interface AccountFormData {
  name: string;
  institution: string;
  account_type: BankAccount["account_type"];
  balance: string;
  currency: string;
  country: BankAccount["country"];
  exchange_rate_to_usd: string;
  notes: string;
}

export const defaultAccountForm: AccountFormData = {
  name: "",
  institution: "",
  account_type: "checking",
  balance: "",
  currency: "USD",
  country: "US",
  exchange_rate_to_usd: "",
  notes: "",
};

interface AccountFormProps {
  form: AccountFormData;
  onChange: (form: AccountFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isEdit?: boolean;
}

export function AccountForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  isLoading,
  isEdit,
}: AccountFormProps) {
  const set = (key: keyof AccountFormData, value: string) => {
    onChange({ ...form, [key]: value });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <InputField
        label="Account Name"
        value={form.name}
        onChange={(e) => set("name", e.target.value)}
        required
        placeholder="Primary Checking"
      />
      <InputField
        label="Institution"
        value={form.institution}
        onChange={(e) => set("institution", e.target.value)}
        placeholder="Chase, MUFG, etc."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Account Type"
          value={form.account_type}
          onChange={(e) => set("account_type", e.target.value)}
          options={ACCOUNT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
        />
        <SelectField
          label="Country"
          value={form.country}
          onChange={(e) => {
            const country = e.target.value as BankAccount["country"];
            set("country", country);
            if (country === "JP") set("currency", "JPY");
            else set("currency", "USD");
          }}
          options={COUNTRIES}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Currency"
          value={form.currency}
          onChange={(e) => set("currency", e.target.value)}
          options={CURRENCIES.map((c) => ({ value: c.value, label: c.label }))}
        />
        <InputField
          label="Current Balance"
          type="number"
          step="0.01"
          value={form.balance}
          onChange={(e) => set("balance", e.target.value)}
          required={!isEdit}
          placeholder="0.00"
        />
      </div>
      {form.currency === "JPY" && (
        <InputField
          label="Exchange Rate (JPY per 1 USD)"
          type="number"
          step="0.01"
          value={form.exchange_rate_to_usd}
          onChange={(e) => set("exchange_rate_to_usd", e.target.value)}
          placeholder="150.00"
          required
        />
      )}
      <InputField
        label="Notes"
        value={form.notes}
        onChange={(e) => set("notes", e.target.value)}
        placeholder="Optional notes"
      />
      <p className="text-xs text-slate-500">
        Read-only aggregation only. No transfers, bill pay, or ACH.
      </p>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {isEdit ? "Update Account" : "Add Account"}
        </Button>
      </div>
    </form>
  );
}
