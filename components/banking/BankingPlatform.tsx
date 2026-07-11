"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/forms/FormFields";
import { AreaChartCard, BarChartCard, PieChartCard } from "@/components/charts/FinancialCharts";
import { Modal } from "@/components/banking/Modal";
import { BankingFilters } from "@/components/banking/BankingFilters";
import { AccountForm, defaultAccountForm, type AccountFormData } from "@/components/banking/AccountForm";
import { BalanceForm, defaultBalanceForm, type BalanceFormData } from "@/components/banking/BalanceForm";
import {
  TransactionForm,
  defaultTransactionForm,
  type TransactionFormData,
} from "@/components/banking/TransactionForm";
import { CsvImportWizard } from "@/components/banking/CsvImportWizard";
import {
  BANKING_TABS,
  DEFAULT_FILTERS,
  RECURRING_FREQUENCIES,
  type BankingTab,
} from "@/lib/banking/constants";
import {
  buildBalanceHistoryData,
  buildCashFlowChartData,
  buildCategorySpendingData,
  computeAccountTotals,
  computeMonthlyCashFlow,
  filterAccounts,
  filterTransactions,
} from "@/lib/banking/calculations";
import { buildBankingSummaryExport, type ParsedCsvRow } from "@/lib/banking/csv";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type {
  BankAccount,
  BankBalance,
  BankTransaction,
  BankingFilters as Filters,
  ColumnMapping,
  RecurringTransaction,
  TransactionCategory,
} from "@/lib/types";
import {
  Building2,
  Download,
  Plus,
  RefreshCw,
  Trash2,
  Pencil,
  TrendingUp,
  Repeat,
} from "lucide-react";

interface BankingPlatformProps {
  userId: string;
}

export function BankingPlatform({ userId }: BankingPlatformProps) {
  const supabase = createClient();
  const [tab, setTab] = useState<BankingTab>("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState<Filters>({ ...DEFAULT_FILTERS });

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [balances, setBalances] = useState<BankBalance[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);

  const [accountModal, setAccountModal] = useState(false);
  const [balanceModal, setBalanceModal] = useState(false);
  const [transactionModal, setTransactionModal] = useState(false);
  const [recurringModal, setRecurringModal] = useState(false);

  const [accountForm, setAccountForm] = useState<AccountFormData>(defaultAccountForm);
  const [balanceForm, setBalanceForm] = useState<BalanceFormData>(defaultBalanceForm);
  const [transactionForm, setTransactionForm] = useState<TransactionFormData>(defaultTransactionForm);
  const [recurringForm, setRecurringForm] = useState({
    account_id: "",
    description: "",
    amount: "",
    transaction_type: "expense",
    category_id: "",
    frequency: "monthly",
    next_occurrence: "",
    notes: "",
  });

  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [accRes, txRes, balRes, catRes, recRes] = await Promise.all([
        supabase.from("bank_accounts").select("*").eq("user_id", userId).order("name"),
        supabase.from("bank_transactions").select("*").eq("user_id", userId).order("transaction_date", { ascending: false }),
        supabase.from("bank_balances").select("*").eq("user_id", userId).order("balance_date", { ascending: false }),
        supabase.from("transaction_categories").select("*").eq("user_id", userId).order("name"),
        supabase.from("recurring_transactions").select("*").eq("user_id", userId).order("description"),
      ]);

      if (accRes.error) throw accRes.error;
      if (txRes.error) throw txRes.error;
      if (balRes.error) throw balRes.error;
      if (catRes.error) throw catRes.error;
      if (recRes.error) throw recRes.error;

      setAccounts(
        (accRes.data ?? []).map((row) => {
          const a = row as Record<string, unknown>;
          return {
            ...a,
            institution: String(a.institution ?? a.bank_name ?? ""),
            currency: String(a.currency ?? a.currency_code ?? "USD"),
            balance: Number(a.balance ?? 0),
          };
        }) as BankAccount[]
      );
      setTransactions(
        (txRes.data ?? []).map((row) => {
          const t = row as Record<string, unknown>;
          return {
            ...t,
            account_id: String(t.account_id ?? t.bank_account_id ?? ""),
            currency: String(t.currency ?? t.currency_code ?? "USD"),
            category_name: String(t.category_name ?? "uncategorized"),
          };
        }) as BankTransaction[]
      );
      setBalances(
        (balRes.data ?? []).map((row) => {
          const b = row as Record<string, unknown>;
          return {
            ...b,
            account_id: String(b.account_id ?? b.bank_account_id ?? ""),
            currency: String(b.currency ?? b.currency_code ?? "USD"),
          };
        }) as BankBalance[]
      );
      setCategories((catRes.data ?? []) as TransactionCategory[]);
      setRecurring(
        (recRes.data ?? []).map((row) => {
          const r = row as Record<string, unknown>;
          return {
            ...r,
            account_id: String(r.account_id ?? r.bank_account_id ?? ""),
            currency: String(r.currency ?? r.currency_code ?? "USD"),
            next_occurrence: String(r.next_occurrence ?? r.next_date ?? ""),
          };
        }) as RecurringTransaction[]
      );
    } catch (err) {
      console.error("Failed to load banking data:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredAccounts = useMemo(
    () => filterAccounts(accounts, filters),
    [accounts, filters]
  );

  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, filters, accounts),
    [transactions, filters, accounts]
  );

  const totals = useMemo(() => computeAccountTotals(filteredAccounts), [filteredAccounts]);

  const cashFlowData = useMemo(
    () => buildCashFlowChartData(filteredTransactions),
    [filteredTransactions]
  );

  const categoryData = useMemo(
    () => buildCategorySpendingData(filteredTransactions, categories),
    [filteredTransactions, categories]
  );

  const balanceHistory = useMemo(
    () => buildBalanceHistoryData(balances, accounts),
    [balances, accounts]
  );

  const currentMonthFlow = useMemo(() => {
    const now = new Date();
    return computeMonthlyCashFlow(
      filteredTransactions,
      now.getFullYear(),
      now.getMonth() + 1
    );
  }, [filteredTransactions]);

  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  const recalculateCashFlow = async () => {
    const now = new Date();
    const months = new Set<string>();
    for (const t of transactions) {
      const d = new Date(t.transaction_date);
      months.add(`${d.getFullYear()}-${d.getMonth() + 1}-${t.currency}`);
    }
    months.add(`${now.getFullYear()}-${now.getMonth() + 1}-USD`);

    const rows = Array.from(months).map((key) => {
      const [year, month, currency] = key.split("-");
      return {
        user_id: userId,
        ...computeMonthlyCashFlow(transactions, Number(year), Number(month), currency),
      };
    });

    if (rows.length > 0) {
      await supabase.from("cash_flow_monthly").upsert(rows, {
        onConflict: "user_id,year,month,currency",
      });
    }
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        user_id: userId,
        name: accountForm.name,
        institution: accountForm.institution,
        bank_name: accountForm.institution,
        account_type: accountForm.account_type,
        balance: parseFloat(accountForm.balance) || 0,
        currency: accountForm.currency,
        currency_code: accountForm.currency,
        country: accountForm.country,
        exchange_rate_to_usd:
          accountForm.currency === "JPY"
            ? parseFloat(accountForm.exchange_rate_to_usd) || null
            : null,
        notes: accountForm.notes || null,
        data_source: "manual" as const,
      };

      if (editingAccountId) {
        const { error } = await supabase
          .from("bank_accounts")
          .update(payload)
          .eq("id", editingAccountId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("bank_accounts").insert(payload);
        if (error) throw error;
      }

      setAccountModal(false);
      setEditingAccountId(null);
      setAccountForm(defaultAccountForm);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to save account");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const account = accounts.find((a) => a.id === balanceForm.account_id);
      if (!account) return;

      const balance = parseFloat(balanceForm.balance);
      const { error: balError } = await supabase.from("bank_balances").insert({
        user_id: userId,
        account_id: balanceForm.account_id,
        bank_account_id: balanceForm.account_id,
        balance,
        balance_date: balanceForm.balance_date,
        currency: account.currency,
        currency_code: account.currency,
        exchange_rate_to_usd:
          account.currency === "JPY"
            ? parseFloat(balanceForm.exchange_rate_to_usd) || account.exchange_rate_to_usd
            : null,
        notes: balanceForm.notes || null,
        data_source: "manual",
      });
      if (balError) throw balError;

      await supabase
        .from("bank_accounts")
        .update({ balance })
        .eq("id", balanceForm.account_id);

      setBalanceModal(false);
      setBalanceForm(defaultBalanceForm);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to save balance");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const account = accounts.find((a) => a.id === transactionForm.account_id);
      if (!account) return;

      const category = categories.find((c) => c.id === transactionForm.category_id);
      const payload = {
        user_id: userId,
        account_id: transactionForm.account_id,
        bank_account_id: transactionForm.account_id,
        description: transactionForm.description,
        amount: parseFloat(transactionForm.amount),
        currency: account.currency,
        currency_code: account.currency,
        exchange_rate_to_usd:
          account.currency === "JPY"
            ? parseFloat(transactionForm.exchange_rate_to_usd) || account.exchange_rate_to_usd
            : null,
        transaction_type: transactionForm.transaction_type,
        category_id: transactionForm.category_id || null,
        category_name: category?.name ?? "uncategorized",
        transaction_date: transactionForm.transaction_date,
        notes: transactionForm.notes || null,
        data_source: "manual" as const,
      };

      if (editingTransactionId) {
        const { error } = await supabase
          .from("bank_transactions")
          .update(payload)
          .eq("id", editingTransactionId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("bank_transactions").insert(payload);
        if (error) throw error;
      }

      await recalculateCashFlow();
      setTransactionModal(false);
      setEditingTransactionId(null);
      setTransactionForm(defaultTransactionForm);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to save transaction");
    } finally {
      setSaving(false);
    }
  };

  const handleCsvImport = async (
    accountId: string,
    rows: ParsedCsvRow[],
    filename: string,
    mapping: ColumnMapping
  ) => {
    setSaving(true);
    try {
      const account = accounts.find((a) => a.id === accountId);
      if (!account) throw new Error("Account not found");

      const { data: importFile, error: fileError } = await supabase
        .from("import_files")
        .insert({
          user_id: userId,
          account_id: accountId,
          filename,
          column_mapping: mapping,
          status: "mapped",
          row_count: rows.length,
        })
        .select()
        .single();
      if (fileError) throw fileError;

      const txRows = rows.map((row) => {
        const cat = categories.find(
          (c) => c.name.toLowerCase() === (row.category ?? "").toLowerCase()
        );
        return {
          user_id: userId,
          account_id: accountId,
          description: row.description,
          amount: row.amount,
          currency: account.currency,
          exchange_rate_to_usd: account.exchange_rate_to_usd,
          transaction_type: row.type ?? "expense",
          category_id: cat?.id ?? null,
          category_name: cat?.name ?? row.category ?? "uncategorized",
          transaction_date: row.date,
          import_file_id: importFile.id,
          data_source: "csv" as const,
        };
      });

      const { error: txError } = await supabase.from("bank_transactions").insert(txRows);
      if (txError) throw txError;

      await supabase
        .from("import_files")
        .update({ status: "imported", imported_count: rows.length })
        .eq("id", importFile.id);

      await recalculateCashFlow();
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const account = accounts.find((a) => a.id === recurringForm.account_id);
      if (!account) return;

      const { error } = await supabase.from("recurring_transactions").insert({
        user_id: userId,
        account_id: recurringForm.account_id,
        description: recurringForm.description,
        amount: parseFloat(recurringForm.amount),
        currency: account.currency,
        exchange_rate_to_usd: account.exchange_rate_to_usd,
        transaction_type: recurringForm.transaction_type,
        category_id: recurringForm.category_id || null,
        frequency: recurringForm.frequency,
        next_occurrence: recurringForm.next_occurrence || null,
        notes: recurringForm.notes || null,
        data_source: "manual",
      });
      if (error) throw error;

      setRecurringModal(false);
      setRecurringForm({
        account_id: "",
        description: "",
        amount: "",
        transaction_type: "expense",
        category_id: "",
        frequency: "monthly",
        next_occurrence: "",
        notes: "",
      });
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to save recurring transaction");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm("Delete this account and all related data?")) return;
    await supabase.from("bank_accounts").delete().eq("id", id);
    await loadData();
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Delete this transaction?")) return;
    await supabase.from("bank_transactions").delete().eq("id", id);
    await recalculateCashFlow();
    await loadData();
  };

  const handleExport = () => {
    buildBankingSummaryExport(
      filteredAccounts.map((a) => ({
        name: a.name,
        institution: a.institution,
        balance: Number(a.balance),
        currency: a.currency,
        country: a.country,
      })),
      filteredTransactions.map((t) => ({
        date: t.transaction_date,
        description: t.description,
        amount: Number(t.amount),
        currency: t.currency,
        type: t.transaction_type,
        category: t.category_name,
        account: accountMap.get(t.account_id)?.name ?? "",
      }))
    );
  };

  const openEditAccount = (account: BankAccount) => {
    setAccountForm({
      name: account.name,
      institution: account.institution,
      account_type: account.account_type,
      balance: account.balance.toString(),
      currency: account.currency,
      country: account.country,
      exchange_rate_to_usd: account.exchange_rate_to_usd?.toString() ?? "",
      notes: account.notes ?? "",
    });
    setEditingAccountId(account.id);
    setAccountModal(true);
  };

  const openEditTransaction = (tx: BankTransaction) => {
    setTransactionForm({
      account_id: tx.account_id,
      description: tx.description,
      amount: tx.amount.toString(),
      transaction_type: tx.transaction_type,
      category_id: tx.category_id ?? "",
      transaction_date: tx.transaction_date,
      exchange_rate_to_usd: tx.exchange_rate_to_usd?.toString() ?? "",
      notes: tx.notes ?? "",
    });
    setEditingTransactionId(tx.id);
    setTransactionModal(true);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Loading banking data...
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Banking Platform"
        description="Track U.S. and Japan accounts, balances, transactions, and cash flow — read-only aggregation"
      >
        <Button variant="secondary" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
        <Button variant="secondary" onClick={loadData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </PageHeader>

      <BankingFilters
        filters={filters}
        onChange={setFilters}
        accounts={accounts}
        categories={categories}
      />

      <div className="mt-6 flex flex-wrap gap-2 border-b border-navy-700 pb-4">
        {BANKING_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "bg-gold-500 text-navy-950"
                : "text-slate-400 hover:bg-navy-800 hover:text-white"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="mt-6 space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Total Balance (USD)"
              value={formatCurrency(totals.totalUsd)}
            />
            <MetricCard
              label="Monthly Income"
              value={formatCurrency(currentMonthFlow.total_income)}
              changeType="positive"
            />
            <MetricCard
              label="Monthly Expenses"
              value={formatCurrency(currentMonthFlow.total_expenses)}
              changeType="negative"
            />
            <MetricCard
              label="Net Cash Flow"
              value={formatCurrency(currentMonthFlow.net_cash_flow)}
              changeType={currentMonthFlow.net_cash_flow >= 0 ? "positive" : "negative"}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <DashboardCard title="Monthly Cash Flow" description="Last 6 months (USD equivalent)">
              {cashFlowData.length > 0 ? (
                <AreaChartCard data={cashFlowData} />
              ) : (
                <EmptyState title="No cash flow data" description="Add transactions to see trends" />
              )}
            </DashboardCard>
            <DashboardCard title="Spending by Category" description="Expense breakdown">
              {categoryData.length > 0 ? (
                <PieChartCard data={categoryData} />
              ) : (
                <EmptyState title="No spending data" description="Add expense transactions to see breakdown" />
              )}
            </DashboardCard>
          </div>

          <DashboardCard title="Balance History" description="Account balance over time">
            {balanceHistory.length > 0 ? (
              <BarChartCard data={balanceHistory} />
            ) : (
              <EmptyState
                title="No balance history"
                description="Record balance snapshots to track history"
                icon={<TrendingUp className="h-8 w-8" />}
              />
            )}
          </DashboardCard>
        </div>
      )}

      {tab === "accounts" && (
        <div className="mt-6 space-y-6">
          <div className="flex gap-3">
            <Button
              onClick={() => {
                setAccountForm(defaultAccountForm);
                setEditingAccountId(null);
                setAccountModal(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Account
            </Button>
            <Button variant="secondary" onClick={() => setBalanceModal(true)}>
              Record Balance
            </Button>
          </div>

          {filteredAccounts.length === 0 ? (
            <EmptyState
              title="No accounts yet"
              description="Add U.S. or Japan bank accounts manually"
              icon={<Building2 className="h-8 w-8" />}
            />
          ) : (
            <div className="space-y-3">
              {filteredAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded-lg border border-navy-700 bg-navy-800 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{account.name}</p>
                    <p className="text-xs text-slate-400">
                      {account.institution} · {account.country} · {account.currency}
                      {account.data_source === "plaid" && " · Plaid"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">
                        {formatCurrency(Number(account.balance), account.currency, account.country === "JP" ? "ja-JP" : "en-US")}
                      </p>
                      <StatusBadge status={account.is_active ? "active" : "inactive"} label={account.account_type} />
                    </div>
                    <button onClick={() => openEditAccount(account)} className="text-slate-400 hover:text-white">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeleteAccount(account.id)} className="text-slate-400 hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "transactions" && (
        <div className="mt-6 space-y-6">
          <Button
            onClick={() => {
              setTransactionForm(defaultTransactionForm);
              setEditingTransactionId(null);
              setTransactionModal(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>

          {filteredTransactions.length === 0 ? (
            <EmptyState title="No transactions" description="Add transactions manually or import from CSV" />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-navy-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-700 bg-navy-800 text-left text-slate-400">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Account</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => {
                    const acc = accountMap.get(tx.account_id);
                    return (
                      <tr key={tx.id} className="border-b border-navy-700/50 hover:bg-navy-800/50">
                        <td className="px-4 py-3 text-slate-300">{formatDate(tx.transaction_date)}</td>
                        <td className="px-4 py-3 text-white">{tx.description}</td>
                        <td className="px-4 py-3 text-slate-400">{acc?.name ?? "—"}</td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            status={
                              tx.transaction_type === "income"
                                ? "active"
                                : tx.transaction_type === "expense"
                                  ? "warning"
                                  : "neutral"
                            }
                            label={tx.transaction_type}
                          />
                        </td>
                        <td className="px-4 py-3 text-slate-400">{tx.category_name}</td>
                        <td className="px-4 py-3 text-right font-medium text-white">
                          {formatCurrency(Number(tx.amount), tx.currency, tx.currency === "JPY" ? "ja-JP" : "en-US")}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{tx.data_source}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => openEditTransaction(tx)} className="text-slate-400 hover:text-white">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDeleteTransaction(tx.id)} className="text-slate-400 hover:text-red-400">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "import" && (
        <div className="mt-6">
          <DashboardCard title="CSV Import" description="Upload and map bank CSV exports">
            <CsvImportWizard accounts={accounts} onImport={handleCsvImport} isLoading={saving} />
          </DashboardCard>
        </div>
      )}

      {tab === "recurring" && (
        <div className="mt-6 space-y-6">
          <Button onClick={() => setRecurringModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Recurring Expense
          </Button>

          {recurring.length === 0 ? (
            <EmptyState
              title="No recurring expenses"
              description="Track subscriptions and regular payments"
              icon={<Repeat className="h-8 w-8" />}
            />
          ) : (
            <div className="space-y-3">
              {recurring
                .filter((r) => !filters.accountId || r.account_id === filters.accountId)
                .map((r) => {
                  const acc = accountMap.get(r.account_id);
                  const cat = categories.find((c) => c.id === r.category_id);
                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-lg border border-navy-700 bg-navy-800 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{r.description}</p>
                        <p className="text-xs text-slate-400">
                          {acc?.name} · {r.frequency}
                          {cat && ` · ${cat.name}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">
                          {formatCurrency(Number(r.amount), r.currency, r.currency === "JPY" ? "ja-JP" : "en-US")}
                        </p>
                        <StatusBadge status={r.is_active ? "active" : "inactive"} label={r.transaction_type} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      <Modal
        title={editingAccountId ? "Edit Account" : "Add Bank Account"}
        isOpen={accountModal}
        onClose={() => {
          setAccountModal(false);
          setEditingAccountId(null);
        }}
      >
        <AccountForm
          form={accountForm}
          onChange={setAccountForm}
          onSubmit={handleSaveAccount}
          onCancel={() => setAccountModal(false)}
          isLoading={saving}
          isEdit={!!editingAccountId}
        />
      </Modal>

      <Modal title="Record Balance" isOpen={balanceModal} onClose={() => setBalanceModal(false)}>
        <BalanceForm
          form={balanceForm}
          onChange={setBalanceForm}
          onSubmit={handleSaveBalance}
          onCancel={() => setBalanceModal(false)}
          accounts={accounts}
          isLoading={saving}
        />
      </Modal>

      <Modal
        title={editingTransactionId ? "Edit Transaction" : "Add Transaction"}
        isOpen={transactionModal}
        onClose={() => {
          setTransactionModal(false);
          setEditingTransactionId(null);
        }}
      >
        <TransactionForm
          form={transactionForm}
          onChange={setTransactionForm}
          onSubmit={handleSaveTransaction}
          onCancel={() => setTransactionModal(false)}
          accounts={accounts}
          categories={categories}
          isLoading={saving}
          isEdit={!!editingTransactionId}
        />
      </Modal>

      <Modal title="Add Recurring Expense" isOpen={recurringModal} onClose={() => setRecurringModal(false)}>
        <form onSubmit={handleSaveRecurring} className="space-y-4">
          <select
            className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-white"
            value={recurringForm.account_id}
            onChange={(e) => setRecurringForm({ ...recurringForm, account_id: e.target.value })}
            required
          >
            <option value="">Select account</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <input
            className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-white"
            placeholder="Description"
            value={recurringForm.description}
            onChange={(e) => setRecurringForm({ ...recurringForm, description: e.target.value })}
            required
          />
          <input
            type="number"
            step="0.01"
            className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-white"
            placeholder="Amount"
            value={recurringForm.amount}
            onChange={(e) => setRecurringForm({ ...recurringForm, amount: e.target.value })}
            required
          />
          <select
            className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-white"
            value={recurringForm.frequency}
            onChange={(e) => setRecurringForm({ ...recurringForm, frequency: e.target.value })}
          >
            {RECURRING_FREQUENCIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-white"
            value={recurringForm.next_occurrence}
            onChange={(e) => setRecurringForm({ ...recurringForm, next_occurrence: e.target.value })}
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setRecurringModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving}>
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
