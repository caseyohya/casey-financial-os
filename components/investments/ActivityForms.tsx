"use client";

import { useState } from "react";
import { InputField, SelectField, Button } from "@/components/forms/FormFields";
import {
  addInvestmentTransaction,
  addDistribution,
  addCapitalCall,
  addTaxItem,
  addPreciousMetal,
} from "@/app/(dashboard)/investments/actions";
import type {
  InvestmentCurrency,
  InvestmentCategory,
  TransactionType,
  DistributionType,
  TaxItemType,
  MetalType,
} from "@/lib/types/investments";

const TX_TYPES = [
  { value: "capital_contribution", label: "Capital Contribution" },
  { value: "additional_contribution", label: "Additional Contribution" },
  { value: "realized_gain", label: "Realized Gain" },
  { value: "realized_loss", label: "Realized Loss" },
  { value: "return_of_capital", label: "Return of Capital" },
  { value: "fee", label: "Fee" },
];

const DIST_TYPES = [
  { value: "cash", label: "Cash" },
  { value: "return_of_capital", label: "Return of Capital" },
  { value: "income", label: "Income" },
  { value: "dividend", label: "Dividend" },
];

const TAX_TYPES = [
  { value: "ordinary_income", label: "Ordinary Income" },
  { value: "capital_gain", label: "Capital Gain" },
  { value: "capital_loss", label: "Capital Loss" },
  { value: "idc_deduction", label: "IDC Deduction" },
  { value: "depletion", label: "Depletion" },
  { value: "section_179", label: "Section 179" },
  { value: "other", label: "Other" },
];

interface ActivityFormsProps {
  investmentId: string;
  currency: InvestmentCurrency;
  category: InvestmentCategory;
}

export function ActivityForms({ investmentId, currency, category }: ActivityFormsProps) {
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().split("T")[0];

  const [tx, setTx] = useState({ transaction_date: today, amount: 0, transaction_type: "capital_contribution" as TransactionType, description: "" });
  const [dist, setDist] = useState({ distribution_date: today, amount: 0, distribution_type: "cash" as DistributionType });
  const [call, setCall] = useState({ call_date: today, amount: 0, due_date: "" });
  const [tax, setTax] = useState({ tax_year: new Date().getFullYear(), item_type: "ordinary_income" as TaxItemType, amount: 0, k1_line: "", description: "" });
  const [metal, setMetal] = useState({ metal_type: "gold" as MetalType, quantity: 0, unit: "oz", unit_cost: 0, spot_value: 0, storage_location: "" });

  async function submit(action: () => Promise<{ error?: string } | { success?: boolean }>) {
    setError(null);
    const result = await action();
    if (result && "error" in result && result.error) setError(result.error);
  }

  const isMetal = ["gold", "silver", "platinum"].includes(category);

  return (
    <div className="space-y-6">
      {error && <p className="text-xs text-red-400">{error}</p>}

      <form onSubmit={(e) => { e.preventDefault(); submit(() => addInvestmentTransaction(investmentId, { ...tx, currency })); }} className="space-y-3 rounded-lg border border-navy-700 bg-navy-800/50 p-4">
        <h4 className="text-sm font-semibold text-white">Capital Contribution / Transaction</h4>
        <div className="grid gap-3 sm:grid-cols-3">
          <InputField label="Date" type="date" value={tx.transaction_date} onChange={(e) => setTx((f) => ({ ...f, transaction_date: e.target.value }))} />
          <InputField label="Amount" type="number" min="0" value={tx.amount || ""} onChange={(e) => setTx((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} />
          <SelectField label="Type" options={TX_TYPES} value={tx.transaction_type} onChange={(e) => setTx((f) => ({ ...f, transaction_type: e.target.value as TransactionType }))} />
        </div>
        <Button type="submit">Add Transaction</Button>
      </form>

      <form onSubmit={(e) => { e.preventDefault(); submit(() => addDistribution(investmentId, { ...dist, currency })); }} className="space-y-3 rounded-lg border border-navy-700 bg-navy-800/50 p-4">
        <h4 className="text-sm font-semibold text-white">Distribution</h4>
        <div className="grid gap-3 sm:grid-cols-3">
          <InputField label="Date" type="date" value={dist.distribution_date} onChange={(e) => setDist((f) => ({ ...f, distribution_date: e.target.value }))} />
          <InputField label="Amount" type="number" min="0" value={dist.amount || ""} onChange={(e) => setDist((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} />
          <SelectField label="Type" options={DIST_TYPES} value={dist.distribution_type} onChange={(e) => setDist((f) => ({ ...f, distribution_type: e.target.value as DistributionType }))} />
        </div>
        <Button type="submit">Add Distribution</Button>
      </form>

      <form onSubmit={(e) => { e.preventDefault(); submit(() => addCapitalCall(investmentId, { ...call, currency })); }} className="space-y-3 rounded-lg border border-navy-700 bg-navy-800/50 p-4">
        <h4 className="text-sm font-semibold text-white">Capital Call</h4>
        <div className="grid gap-3 sm:grid-cols-3">
          <InputField label="Call Date" type="date" value={call.call_date} onChange={(e) => setCall((f) => ({ ...f, call_date: e.target.value }))} />
          <InputField label="Amount" type="number" min="0" value={call.amount || ""} onChange={(e) => setCall((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} />
          <InputField label="Due Date" type="date" value={call.due_date} onChange={(e) => setCall((f) => ({ ...f, due_date: e.target.value }))} />
        </div>
        <Button type="submit">Add Capital Call</Button>
      </form>

      <form onSubmit={(e) => { e.preventDefault(); submit(() => addTaxItem(investmentId, tax)); }} className="space-y-3 rounded-lg border border-navy-700 bg-navy-800/50 p-4">
        <h4 className="text-sm font-semibold text-white">K-1 Tax Item</h4>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InputField label="Tax Year" type="number" value={tax.tax_year} onChange={(e) => setTax((f) => ({ ...f, tax_year: parseInt(e.target.value, 10) }))} />
          <SelectField label="Item Type" options={TAX_TYPES} value={tax.item_type} onChange={(e) => setTax((f) => ({ ...f, item_type: e.target.value as TaxItemType }))} />
          <InputField label="Amount" type="number" value={tax.amount || ""} onChange={(e) => setTax((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} />
          <InputField label="K-1 Line" value={tax.k1_line} onChange={(e) => setTax((f) => ({ ...f, k1_line: e.target.value }))} />
        </div>
        <Button type="submit">Add Tax Item</Button>
      </form>

      {isMetal && (
        <form onSubmit={(e) => { e.preventDefault(); submit(() => addPreciousMetal(investmentId, { ...metal, currency })); }} className="space-y-3 rounded-lg border border-navy-700 bg-navy-800/50 p-4">
          <h4 className="text-sm font-semibold text-white">Precious Metals Holdings</h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <SelectField label="Metal" options={[{ value: "gold", label: "Gold" }, { value: "silver", label: "Silver" }, { value: "platinum", label: "Platinum" }]} value={metal.metal_type} onChange={(e) => setMetal((f) => ({ ...f, metal_type: e.target.value as MetalType }))} />
            <InputField label="Quantity" type="number" min="0" step="0.0001" value={metal.quantity || ""} onChange={(e) => setMetal((f) => ({ ...f, quantity: parseFloat(e.target.value) || 0 }))} />
            <InputField label="Unit Cost" type="number" min="0" value={metal.unit_cost || ""} onChange={(e) => setMetal((f) => ({ ...f, unit_cost: parseFloat(e.target.value) || 0 }))} />
            <InputField label="Spot Value (per unit)" type="number" min="0" value={metal.spot_value || ""} onChange={(e) => setMetal((f) => ({ ...f, spot_value: parseFloat(e.target.value) || 0 }))} />
            <InputField label="Storage Location" value={metal.storage_location} onChange={(e) => setMetal((f) => ({ ...f, storage_location: e.target.value }))} />
          </div>
          <Button type="submit">Add Metal Holding</Button>
        </form>
      )}
    </div>
  );
}
