"use client";

import { useState } from "react";
import type { TaxYearWithRelations } from "@/lib/types/tax";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { InputField, SelectField, Button } from "@/components/forms/FormFields";
import {
  addTaxAccount,
  deleteTaxAccount,
  addTaxIncomeItem,
  deleteTaxIncomeItem,
  addTaxExpenseItem,
  deleteTaxExpenseItem,
  addTaxDeduction,
  deleteTaxDeduction,
  addForeignAccount,
  deleteForeignAccount,
  addFbarItem,
  deleteFbarItem,
  addForm8938Item,
  deleteForm8938Item,
  addScheduleEItem,
  deleteScheduleEItem,
  addK1Item,
  deleteK1Item,
  addDepreciationItem,
  deleteDepreciationItem,
} from "@/app/(dashboard)/tax/actions";
import { Trash2 } from "lucide-react";

type Section =
  | "accounts"
  | "income"
  | "expenses"
  | "deductions"
  | "foreign"
  | "fbar"
  | "form8938"
  | "schedule_e"
  | "k1"
  | "depreciation";

interface TaxSectionFormsProps<T extends { id: string }> {
  section: Section;
  data: TaxYearWithRelations;
  items: T[];
  columns: string[];
  renderItem: (item: T) => React.ReactNode;
}

export function TaxSectionForms<T extends { id: string }>({
  section,
  data,
  items,
  columns,
  renderItem,
}: TaxSectionFormsProps<T>) {
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    const year = data.year;
    const taxYearId = data.id;

    let result: { error?: string; success?: boolean } | void;

    switch (section) {
      case "accounts":
        result = await addTaxAccount(taxYearId, year, {
          account_name: formData.get("account_name") as string,
          institution: formData.get("institution") as string,
          country: formData.get("country") as string,
          currency: formData.get("currency") as "USD" | "JPY",
          account_type: formData.get("account_type") as string,
          is_foreign: formData.get("is_foreign") === "true",
          year_end_balance: formData.get("year_end_balance") ? parseFloat(formData.get("year_end_balance") as string) : null,
          max_annual_balance: formData.get("max_annual_balance") ? parseFloat(formData.get("max_annual_balance") as string) : null,
        });
        break;
      case "income":
        result = await addTaxIncomeItem(taxYearId, year, {
          income_type: formData.get("income_type") as "wages",
          description: formData.get("description") as string,
          amount: parseFloat(formData.get("amount") as string),
          currency: formData.get("currency") as "USD" | "JPY",
          source: formData.get("source") as string,
          is_foreign: formData.get("is_foreign") === "true",
          country: formData.get("country") as string,
        });
        break;
      case "expenses":
        result = await addTaxExpenseItem(taxYearId, year, {
          expense_type: formData.get("expense_type") as "mortgage_interest",
          description: formData.get("description") as string,
          amount: parseFloat(formData.get("amount") as string),
          currency: formData.get("currency") as "USD" | "JPY",
          property_name: formData.get("property_name") as string,
        });
        break;
      case "deductions":
        result = await addTaxDeduction(taxYearId, year, {
          deduction_type: formData.get("deduction_type") as "idc",
          description: formData.get("description") as string,
          amount: parseFloat(formData.get("amount") as string),
          currency: formData.get("currency") as "USD" | "JPY",
          investment_name: formData.get("investment_name") as string,
        });
        break;
      case "foreign":
        result = await addForeignAccount(taxYearId, year, {
          account_name: formData.get("account_name") as string,
          institution: formData.get("institution") as string,
          country: formData.get("country") as string,
          currency: formData.get("currency") as "USD" | "JPY",
          interest_earned: parseFloat(formData.get("interest_earned") as string) || 0,
          year_end_value_usd: formData.get("year_end_value_usd") ? parseFloat(formData.get("year_end_value_usd") as string) : null,
          max_value_usd: formData.get("max_value_usd") ? parseFloat(formData.get("max_value_usd") as string) : null,
        });
        break;
      case "fbar":
        result = await addFbarItem(taxYearId, year, {
          account_name: formData.get("account_name") as string,
          institution_name: formData.get("institution_name") as string,
          country: formData.get("country") as string,
          account_number: formData.get("account_number") as string,
          max_value_usd: formData.get("max_value_usd") ? parseFloat(formData.get("max_value_usd") as string) : null,
          year_end_value_usd: formData.get("year_end_value_usd") ? parseFloat(formData.get("year_end_value_usd") as string) : null,
          account_type: formData.get("account_type") as string,
          jointly_owned: formData.get("jointly_owned") === "true",
        });
        break;
      case "form8938":
        result = await addForm8938Item(taxYearId, year, {
          asset_description: formData.get("asset_description") as string,
          institution: formData.get("institution") as string,
          country: formData.get("country") as string,
          asset_type: formData.get("asset_type") as string,
          currency: formData.get("currency") as "USD" | "JPY",
          max_value_during_year: formData.get("max_value_during_year") ? parseFloat(formData.get("max_value_during_year") as string) : null,
          year_end_value: formData.get("year_end_value") ? parseFloat(formData.get("year_end_value") as string) : null,
        });
        break;
      case "schedule_e":
        result = await addScheduleEItem(taxYearId, year, {
          property_name: formData.get("property_name") as string,
          property_address: formData.get("property_address") as string,
          days_rented: parseInt(formData.get("days_rented") as string, 10) || 0,
          gross_rents: parseFloat(formData.get("gross_rents") as string) || 0,
          mortgage_interest: parseFloat(formData.get("mortgage_interest") as string) || 0,
          repairs: parseFloat(formData.get("repairs") as string) || 0,
          insurance: parseFloat(formData.get("insurance") as string) || 0,
          taxes: parseFloat(formData.get("taxes") as string) || 0,
          depreciation: parseFloat(formData.get("depreciation") as string) || 0,
          currency: formData.get("currency") as "USD" | "JPY",
        });
        break;
      case "k1":
        result = await addK1Item(taxYearId, year, {
          entity_name: formData.get("entity_name") as string,
          entity_ein: formData.get("entity_ein") as string,
          box_1_ordinary_income: parseFloat(formData.get("box_1_ordinary_income") as string) || 0,
          idc_deduction: parseFloat(formData.get("idc_deduction") as string) || 0,
          depletion: parseFloat(formData.get("depletion") as string) || 0,
          currency: formData.get("currency") as "USD" | "JPY",
        });
        break;
      case "depreciation":
        result = await addDepreciationItem(taxYearId, year, {
          property_name: formData.get("property_name") as string,
          asset_description: formData.get("asset_description") as string,
          cost_basis: parseFloat(formData.get("cost_basis") as string) || 0,
          current_year_depreciation: parseFloat(formData.get("current_year_depreciation") as string) || 0,
          accumulated_depreciation: parseFloat(formData.get("accumulated_depreciation") as string) || 0,
          remaining_basis: parseFloat(formData.get("remaining_basis") as string) || 0,
          currency: formData.get("currency") as "USD" | "JPY",
        });
        break;
    }

    setIsLoading(false);
    if (result && "error" in result && result.error) {
      alert(result.error);
    } else {
      setShowForm(false);
    }
  }

  async function handleDelete(id: string) {
    const year = data.year;
    switch (section) {
      case "accounts": await deleteTaxAccount(id, year); break;
      case "income": await deleteTaxIncomeItem(id, year); break;
      case "expenses": await deleteTaxExpenseItem(id, year); break;
      case "deductions": await deleteTaxDeduction(id, year); break;
      case "foreign": await deleteForeignAccount(id, year); break;
      case "fbar": await deleteFbarItem(id, year); break;
      case "form8938": await deleteForm8938Item(id, year); break;
      case "schedule_e": await deleteScheduleEItem(id, year); break;
      case "k1": await deleteK1Item(id, year); break;
      case "depreciation": await deleteDepreciationItem(id, year); break;
    }
  }

  const currencyOptions = [
    { value: "USD", label: "USD" },
    { value: "JPY", label: "JPY" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)} variant="secondary">
          {showForm ? "Cancel" : "+ Add Item"}
        </Button>
      </div>

      {showForm && (
        <form action={handleSubmit} className="rounded-xl border border-navy-700 bg-navy-900 p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {section === "accounts" && (
              <>
                <InputField label="Account Name" name="account_name" required />
                <InputField label="Institution" name="institution" />
                <SelectField label="Country" name="country" options={[
                  { value: "US", label: "United States" },
                  { value: "JP", label: "Japan" },
                  { value: "OTHER", label: "Other" },
                ]} />
                <SelectField label="Currency" name="currency" options={currencyOptions} />
                <SelectField label="Account Type" name="account_type" options={[
                  { value: "checking", label: "Checking" },
                  { value: "savings", label: "Savings" },
                  { value: "brokerage", label: "Brokerage" },
                  { value: "retirement", label: "Retirement" },
                  { value: "other", label: "Other" },
                ]} />
                <SelectField label="Foreign Account" name="is_foreign" options={[
                  { value: "false", label: "No" },
                  { value: "true", label: "Yes" },
                ]} />
                <InputField label="Year-End Balance" name="year_end_balance" type="number" step="0.01" />
                <InputField label="Max Annual Balance" name="max_annual_balance" type="number" step="0.01" />
              </>
            )}
            {section === "income" && (
              <>
                <SelectField label="Income Type" name="income_type" options={[
                  { value: "wages", label: "Wages" },
                  { value: "interest", label: "Interest" },
                  { value: "dividends", label: "Dividends" },
                  { value: "rental", label: "Rental" },
                  { value: "foreign_interest", label: "Foreign Interest" },
                  { value: "capital_gain", label: "Capital Gain" },
                  { value: "k1_ordinary", label: "K-1 Ordinary" },
                  { value: "royalties", label: "Royalties" },
                  { value: "other", label: "Other" },
                ]} />
                <InputField label="Description" name="description" required />
                <InputField label="Amount" name="amount" type="number" step="0.01" required />
                <SelectField label="Currency" name="currency" options={currencyOptions} />
                <InputField label="Source" name="source" />
                <SelectField label="Foreign" name="is_foreign" options={[
                  { value: "false", label: "No" },
                  { value: "true", label: "Yes" },
                ]} />
                <InputField label="Country" name="country" />
              </>
            )}
            {section === "expenses" && (
              <>
                <SelectField label="Expense Type" name="expense_type" options={[
                  { value: "mortgage_interest", label: "Mortgage Interest" },
                  { value: "property_tax", label: "Property Tax" },
                  { value: "repairs", label: "Repairs" },
                  { value: "insurance", label: "Insurance" },
                  { value: "management", label: "Management" },
                  { value: "utilities", label: "Utilities" },
                  { value: "depreciation", label: "Depreciation" },
                  { value: "other", label: "Other" },
                ]} />
                <InputField label="Description" name="description" required />
                <InputField label="Amount" name="amount" type="number" step="0.01" required />
                <SelectField label="Currency" name="currency" options={currencyOptions} />
                <InputField label="Property Name" name="property_name" />
              </>
            )}
            {section === "deductions" && (
              <>
                <SelectField label="Deduction Type" name="deduction_type" options={[
                  { value: "idc", label: "IDC (Oil & Gas)" },
                  { value: "charitable", label: "Charitable" },
                  { value: "medical", label: "Medical" },
                  { value: "state_tax", label: "State Tax" },
                  { value: "mortgage_interest", label: "Mortgage Interest" },
                  { value: "depletion", label: "Depletion" },
                  { value: "section_179", label: "Section 179" },
                  { value: "other", label: "Other" },
                ]} />
                <InputField label="Description" name="description" required />
                <InputField label="Amount" name="amount" type="number" step="0.01" required />
                <SelectField label="Currency" name="currency" options={currencyOptions} />
                <InputField label="Investment Name" name="investment_name" />
              </>
            )}
            {section === "foreign" && (
              <>
                <InputField label="Account Name" name="account_name" required />
                <InputField label="Institution" name="institution" />
                <InputField label="Country" name="country" defaultValue="JP" />
                <SelectField label="Currency" name="currency" options={currencyOptions} defaultValue="JPY" />
                <InputField label="Interest Earned" name="interest_earned" type="number" step="0.01" />
                <InputField label="Year-End Value (USD)" name="year_end_value_usd" type="number" step="0.01" />
                <InputField label="Max Value (USD)" name="max_value_usd" type="number" step="0.01" />
              </>
            )}
            {section === "fbar" && (
              <>
                <InputField label="Account Name" name="account_name" required />
                <InputField label="Institution" name="institution_name" />
                <InputField label="Country" name="country" defaultValue="JP" />
                <InputField label="Account Number" name="account_number" />
                <SelectField label="Account Type" name="account_type" options={[
                  { value: "bank", label: "Bank" },
                  { value: "securities", label: "Securities" },
                  { value: "other", label: "Other" },
                ]} />
                <InputField label="Max Value (USD)" name="max_value_usd" type="number" step="0.01" />
                <InputField label="Year-End Value (USD)" name="year_end_value_usd" type="number" step="0.01" />
                <SelectField label="Jointly Owned" name="jointly_owned" options={[
                  { value: "false", label: "No" },
                  { value: "true", label: "Yes" },
                ]} />
              </>
            )}
            {section === "form8938" && (
              <>
                <InputField label="Asset Description" name="asset_description" required />
                <InputField label="Institution" name="institution" />
                <InputField label="Country" name="country" defaultValue="JP" />
                <SelectField label="Asset Type" name="asset_type" options={[
                  { value: "deposit", label: "Deposit" },
                  { value: "custodial", label: "Custodial" },
                  { value: "other", label: "Other" },
                ]} />
                <SelectField label="Currency" name="currency" options={currencyOptions} defaultValue="JPY" />
                <InputField label="Max Value During Year" name="max_value_during_year" type="number" step="0.01" />
                <InputField label="Year-End Value" name="year_end_value" type="number" step="0.01" />
              </>
            )}
            {section === "schedule_e" && (
              <>
                <InputField label="Property Name" name="property_name" required />
                <InputField label="Address" name="property_address" />
                <InputField label="Days Rented" name="days_rented" type="number" />
                <InputField label="Gross Rents" name="gross_rents" type="number" step="0.01" />
                <InputField label="Mortgage Interest" name="mortgage_interest" type="number" step="0.01" />
                <InputField label="Repairs" name="repairs" type="number" step="0.01" />
                <InputField label="Insurance" name="insurance" type="number" step="0.01" />
                <InputField label="Property Taxes" name="taxes" type="number" step="0.01" />
                <InputField label="Depreciation" name="depreciation" type="number" step="0.01" />
                <SelectField label="Currency" name="currency" options={currencyOptions} />
              </>
            )}
            {section === "k1" && (
              <>
                <InputField label="Entity Name" name="entity_name" required />
                <InputField label="EIN" name="entity_ein" />
                <InputField label="Box 1 — Ordinary Income" name="box_1_ordinary_income" type="number" step="0.01" />
                <InputField label="IDC Deduction" name="idc_deduction" type="number" step="0.01" />
                <InputField label="Depletion" name="depletion" type="number" step="0.01" />
                <SelectField label="Currency" name="currency" options={currencyOptions} />
              </>
            )}
            {section === "depreciation" && (
              <>
                <InputField label="Property Name" name="property_name" required />
                <InputField label="Asset Description" name="asset_description" />
                <InputField label="Cost Basis" name="cost_basis" type="number" step="0.01" />
                <InputField label="Current Year Depreciation" name="current_year_depreciation" type="number" step="0.01" />
                <InputField label="Accumulated Depreciation" name="accumulated_depreciation" type="number" step="0.01" />
                <InputField label="Remaining Basis" name="remaining_basis" type="number" step="0.01" />
                <SelectField label="Currency" name="currency" options={currencyOptions} />
              </>
            )}
          </div>
          <div className="mt-4">
            <Button type="submit" isLoading={isLoading}>Save</Button>
          </div>
        </form>
      )}

      <DashboardCard title={`${items.length} item${items.length === 1 ? "" : "s"}`}>
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">No items yet. Click &quot;Add Item&quot; to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-700 text-left text-xs text-slate-500">
                  {columns.map((col) => (
                    <th key={col} className="pb-2 pr-4">{col}</th>
                  ))}
                  <th className="pb-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="group border-b border-navy-800">
                    {renderItem(item)}
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
