/**
 * Casey Financial OS — Supabase Database Types
 * Generated to match database/schema.sql
 * Regenerate with: supabase gen types typescript --local > database/types/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type CountryCode = 'US' | 'JP';
export type CurrencyCode = 'USD' | 'JPY';
export type AccountType =
  | 'checking'
  | 'savings'
  | 'brokerage'
  | 'retirement'
  | 'credit'
  | 'loan'
  | 'other';
export type AssetType =
  | 'cash'
  | 'real_estate'
  | 'investment'
  | 'precious_metal'
  | 'vehicle'
  | 'other';
export type LiabilityType =
  | 'mortgage'
  | 'credit_card'
  | 'student_loan'
  | 'auto_loan'
  | 'personal_loan'
  | 'other';
export type IncomeFrequency =
  | 'one_time'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'annually';
export type ExpenseFrequency = IncomeFrequency;
export type PropertyType =
  | 'single_family'
  | 'multi_family'
  | 'condo'
  | 'commercial'
  | 'land'
  | 'other';
export type InvestmentType =
  | 'stock'
  | 'bond'
  | 'etf'
  | 'mutual_fund'
  | 'private_equity'
  | 'real_estate_fund'
  | 'hedge_fund'
  | 'crypto'
  | 'other';
export type InvestmentTransactionType =
  | 'buy'
  | 'sell'
  | 'dividend'
  | 'interest'
  | 'split'
  | 'transfer_in'
  | 'transfer_out'
  | 'other';
export type MetalType = 'gold' | 'silver' | 'platinum' | 'palladium' | 'other';
export type FilingStatus =
  | 'single'
  | 'married_filing_jointly'
  | 'married_filing_separately'
  | 'head_of_household'
  | 'qualifying_widow';
export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ExportStatus = ImportStatus;
export type CapitalCallStatus = 'pending' | 'partial' | 'paid' | 'overdue';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          preferred_currency: CurrencyCode;
          preferred_country: CountryCode;
          avatar_url: string | null;
          timezone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          preferred_currency?: CurrencyCode;
          preferred_country?: CountryCode;
          avatar_url?: string | null;
          timezone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          preferred_currency?: CurrencyCode;
          preferred_country?: CountryCode;
          avatar_url?: string | null;
          timezone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      currencies: {
        Row: {
          code: CurrencyCode;
          name: string;
          symbol: string;
          decimal_places: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          code: CurrencyCode;
          name: string;
          symbol: string;
          decimal_places?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          code?: CurrencyCode;
          name?: string;
          symbol?: string;
          decimal_places?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      exchange_rates: {
        Row: {
          id: string;
          user_id: string;
          base_currency: CurrencyCode;
          quote_currency: CurrencyCode;
          rate: number;
          effective_date: string;
          source: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          base_currency: CurrencyCode;
          quote_currency: CurrencyCode;
          rate: number;
          effective_date: string;
          source?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          base_currency?: CurrencyCode;
          quote_currency?: CurrencyCode;
          rate?: number;
          effective_date?: string;
          source?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          file_path: string;
          file_type: string | null;
          file_size_bytes: number | null;
          document_category: string | null;
          related_table: string | null;
          related_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          file_path: string;
          file_type?: string | null;
          file_size_bytes?: number | null;
          document_category?: string | null;
          related_table?: string | null;
          related_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          file_path?: string;
          file_type?: string | null;
          file_size_bytes?: number | null;
          document_category?: string | null;
          related_table?: string | null;
          related_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          table_name: string;
          record_id: string | null;
          old_data: Json | null;
          new_data: Json | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          table_name: string;
          record_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          table_name?: string;
          record_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          account_type: AccountType;
          currency_code: CurrencyCode;
          country: CountryCode;
          balance: number;
          institution: string | null;
          notes: string | null;
          is_active: boolean;
          plaid_account_id: string | null;
          plaid_item_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          account_type?: AccountType;
          currency_code?: CurrencyCode;
          country?: CountryCode;
          balance?: number;
          institution?: string | null;
          notes?: string | null;
          is_active?: boolean;
          plaid_account_id?: string | null;
          plaid_item_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          account_type?: AccountType;
          currency_code?: CurrencyCode;
          country?: CountryCode;
          balance?: number;
          institution?: string | null;
          notes?: string | null;
          is_active?: boolean;
          plaid_account_id?: string | null;
          plaid_item_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      assets: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          asset_type: AssetType;
          category: string | null;
          currency_code: CurrencyCode;
          country: CountryCode;
          current_value: number;
          acquisition_date: string | null;
          acquisition_cost: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          asset_type?: AssetType;
          category?: string | null;
          currency_code?: CurrencyCode;
          country?: CountryCode;
          current_value?: number;
          acquisition_date?: string | null;
          acquisition_cost?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          asset_type?: AssetType;
          category?: string | null;
          currency_code?: CurrencyCode;
          country?: CountryCode;
          current_value?: number;
          acquisition_date?: string | null;
          acquisition_cost?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      liabilities: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          liability_type: LiabilityType;
          category: string | null;
          currency_code: CurrencyCode;
          country: CountryCode;
          current_balance: number;
          interest_rate: number | null;
          maturity_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          liability_type?: LiabilityType;
          category?: string | null;
          currency_code?: CurrencyCode;
          country?: CountryCode;
          current_balance?: number;
          interest_rate?: number | null;
          maturity_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          liability_type?: LiabilityType;
          category?: string | null;
          currency_code?: CurrencyCode;
          country?: CountryCode;
          current_balance?: number;
          interest_rate?: number | null;
          maturity_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      income_sources: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          income_type: string;
          category: string | null;
          currency_code: CurrencyCode;
          country: CountryCode;
          amount: number;
          frequency: IncomeFrequency;
          is_passive: boolean;
          is_active: boolean;
          start_date: string | null;
          end_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          income_type: string;
          category?: string | null;
          currency_code?: CurrencyCode;
          country?: CountryCode;
          amount?: number;
          frequency?: IncomeFrequency;
          is_passive?: boolean;
          is_active?: boolean;
          start_date?: string | null;
          end_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          income_type?: string;
          category?: string | null;
          currency_code?: CurrencyCode;
          country?: CountryCode;
          amount?: number;
          frequency?: IncomeFrequency;
          is_passive?: boolean;
          is_active?: boolean;
          start_date?: string | null;
          end_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          expense_type: string;
          category: string | null;
          currency_code: CurrencyCode;
          country: CountryCode;
          amount: number;
          frequency: ExpenseFrequency;
          is_fixed: boolean;
          is_active: boolean;
          start_date: string | null;
          end_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          expense_type: string;
          category?: string | null;
          currency_code?: CurrencyCode;
          country?: CountryCode;
          amount?: number;
          frequency?: ExpenseFrequency;
          is_fixed?: boolean;
          is_active?: boolean;
          start_date?: string | null;
          end_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          expense_type?: string;
          category?: string | null;
          currency_code?: CurrencyCode;
          country?: CountryCode;
          amount?: number;
          frequency?: ExpenseFrequency;
          is_fixed?: boolean;
          is_active?: boolean;
          start_date?: string | null;
          end_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      monthly_snapshots: {
        Row: {
          id: string;
          user_id: string;
          snapshot_month: string;
          currency_code: CurrencyCode;
          total_assets: number;
          total_liabilities: number;
          net_worth: number;
          total_income: number;
          total_expenses: number;
          cash_flow: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          snapshot_month: string;
          currency_code?: CurrencyCode;
          total_assets?: number;
          total_liabilities?: number;
          net_worth?: number;
          total_income?: number;
          total_expenses?: number;
          cash_flow?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          snapshot_month?: string;
          currency_code?: CurrencyCode;
          total_assets?: number;
          total_liabilities?: number;
          net_worth?: number;
          total_income?: number;
          total_expenses?: number;
          cash_flow?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bank_accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          bank_name: string | null;
          account_type: AccountType;
          account_number_last4: string | null;
          currency_code: CurrencyCode;
          country: CountryCode;
          is_active: boolean;
          plaid_account_id: string | null;
          plaid_item_id: string | null;
          plaid_access_token_ref: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          bank_name?: string | null;
          account_type?: AccountType;
          account_number_last4?: string | null;
          currency_code?: CurrencyCode;
          country?: CountryCode;
          is_active?: boolean;
          plaid_account_id?: string | null;
          plaid_item_id?: string | null;
          plaid_access_token_ref?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          bank_name?: string | null;
          account_type?: AccountType;
          account_number_last4?: string | null;
          currency_code?: CurrencyCode;
          country?: CountryCode;
          is_active?: boolean;
          plaid_account_id?: string | null;
          plaid_item_id?: string | null;
          plaid_access_token_ref?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bank_balances: {
        Row: {
          id: string;
          user_id: string;
          bank_account_id: string;
          balance: number;
          balance_date: string;
          currency_code: CurrencyCode;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bank_account_id: string;
          balance?: number;
          balance_date: string;
          currency_code?: CurrencyCode;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          bank_account_id?: string;
          balance?: number;
          balance_date?: string;
          currency_code?: CurrencyCode;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bank_transactions: {
        Row: {
          id: string;
          user_id: string;
          bank_account_id: string;
          transaction_date: string;
          posted_date: string | null;
          description: string;
          amount: number;
          currency_code: CurrencyCode;
          category_id: string | null;
          transaction_type: string | null;
          is_pending: boolean;
          plaid_transaction_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bank_account_id: string;
          transaction_date: string;
          posted_date?: string | null;
          description: string;
          amount: number;
          currency_code?: CurrencyCode;
          category_id?: string | null;
          transaction_type?: string | null;
          is_pending?: boolean;
          plaid_transaction_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          bank_account_id?: string;
          transaction_date?: string;
          posted_date?: string | null;
          description?: string;
          amount?: number;
          currency_code?: CurrencyCode;
          category_id?: string | null;
          transaction_type?: string | null;
          is_pending?: boolean;
          plaid_transaction_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      transaction_categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          parent_category_id: string | null;
          color: string | null;
          icon: string | null;
          is_system: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          parent_category_id?: string | null;
          color?: string | null;
          icon?: string | null;
          is_system?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          parent_category_id?: string | null;
          color?: string | null;
          icon?: string | null;
          is_system?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      recurring_transactions: {
        Row: {
          id: string;
          user_id: string;
          bank_account_id: string | null;
          category_id: string | null;
          description: string;
          amount: number;
          currency_code: CurrencyCode;
          frequency: IncomeFrequency;
          next_date: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bank_account_id?: string | null;
          category_id?: string | null;
          description: string;
          amount: number;
          currency_code?: CurrencyCode;
          frequency?: IncomeFrequency;
          next_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          bank_account_id?: string | null;
          category_id?: string | null;
          description?: string;
          amount?: number;
          currency_code?: CurrencyCode;
          frequency?: IncomeFrequency;
          next_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      import_files: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          file_path: string;
          file_type: string | null;
          import_status: ImportStatus;
          records_imported: number;
          bank_account_id: string | null;
          error_message: string | null;
          imported_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          file_name: string;
          file_path: string;
          file_type?: string | null;
          import_status?: ImportStatus;
          records_imported?: number;
          bank_account_id?: string | null;
          error_message?: string | null;
          imported_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          file_name?: string;
          file_path?: string;
          file_type?: string | null;
          import_status?: ImportStatus;
          records_imported?: number;
          bank_account_id?: string | null;
          error_message?: string | null;
          imported_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      properties: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          property_type: PropertyType;
          address_line1: string | null;
          address_line2: string | null;
          city: string | null;
          state_province: string | null;
          postal_code: string | null;
          country: CountryCode;
          currency_code: CurrencyCode;
          purchase_date: string | null;
          purchase_price: number | null;
          current_value: number | null;
          is_rental: boolean;
          is_active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          property_type?: PropertyType;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          state_province?: string | null;
          postal_code?: string | null;
          country?: CountryCode;
          currency_code?: CurrencyCode;
          purchase_date?: string | null;
          purchase_price?: number | null;
          current_value?: number | null;
          is_rental?: boolean;
          is_active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          property_type?: PropertyType;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          state_province?: string | null;
          postal_code?: string | null;
          country?: CountryCode;
          currency_code?: CurrencyCode;
          purchase_date?: string | null;
          purchase_price?: number | null;
          current_value?: number | null;
          is_rental?: boolean;
          is_active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      property_mortgages: {
        Row: {
          id: string;
          user_id: string;
          property_id: string;
          lender_name: string | null;
          loan_amount: number;
          current_balance: number;
          interest_rate: number | null;
          monthly_payment: number | null;
          start_date: string | null;
          maturity_date: string | null;
          currency_code: CurrencyCode;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          property_id: string;
          lender_name?: string | null;
          loan_amount?: number;
          current_balance?: number;
          interest_rate?: number | null;
          monthly_payment?: number | null;
          start_date?: string | null;
          maturity_date?: string | null;
          currency_code?: CurrencyCode;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          property_id?: string;
          lender_name?: string | null;
          loan_amount?: number;
          current_balance?: number;
          interest_rate?: number | null;
          monthly_payment?: number | null;
          start_date?: string | null;
          maturity_date?: string | null;
          currency_code?: CurrencyCode;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      property_income: {
        Row: {
          id: string;
          user_id: string;
          property_id: string;
          income_type: string;
          amount: number;
          currency_code: CurrencyCode;
          income_date: string;
          tenant_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          property_id: string;
          income_type: string;
          amount: number;
          currency_code?: CurrencyCode;
          income_date: string;
          tenant_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          property_id?: string;
          income_type?: string;
          amount?: number;
          currency_code?: CurrencyCode;
          income_date?: string;
          tenant_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      property_expenses: {
        Row: {
          id: string;
          user_id: string;
          property_id: string;
          expense_type: string;
          category: string | null;
          amount: number;
          currency_code: CurrencyCode;
          expense_date: string;
          is_tax_deductible: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          property_id: string;
          expense_type: string;
          category?: string | null;
          amount: number;
          currency_code?: CurrencyCode;
          expense_date: string;
          is_tax_deductible?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          property_id?: string;
          expense_type?: string;
          category?: string | null;
          amount?: number;
          currency_code?: CurrencyCode;
          expense_date?: string;
          is_tax_deductible?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      property_tenants: {
        Row: {
          id: string;
          user_id: string;
          property_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          lease_start: string | null;
          lease_end: string | null;
          monthly_rent: number | null;
          currency_code: CurrencyCode;
          is_active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          property_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          lease_start?: string | null;
          lease_end?: string | null;
          monthly_rent?: number | null;
          currency_code?: CurrencyCode;
          is_active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          property_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          lease_start?: string | null;
          lease_end?: string | null;
          monthly_rent?: number | null;
          currency_code?: CurrencyCode;
          is_active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      property_valuations: {
        Row: {
          id: string;
          user_id: string;
          property_id: string;
          valuation_date: string;
          estimated_value: number;
          currency_code: CurrencyCode;
          valuation_method: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          property_id: string;
          valuation_date: string;
          estimated_value: number;
          currency_code?: CurrencyCode;
          valuation_method?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          property_id?: string;
          valuation_date?: string;
          estimated_value?: number;
          currency_code?: CurrencyCode;
          valuation_method?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      property_depreciation: {
        Row: {
          id: string;
          user_id: string;
          property_id: string;
          tax_year: number;
          depreciation_amount: number;
          accumulated_depreciation: number;
          method: string | null;
          currency_code: CurrencyCode;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          property_id: string;
          tax_year: number;
          depreciation_amount?: number;
          accumulated_depreciation?: number;
          method?: string | null;
          currency_code?: CurrencyCode;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          property_id?: string;
          tax_year?: number;
          depreciation_amount?: number;
          accumulated_depreciation?: number;
          method?: string | null;
          currency_code?: CurrencyCode;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      property_documents: {
        Row: {
          id: string;
          user_id: string;
          property_id: string;
          document_id: string;
          document_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          property_id: string;
          document_id: string;
          document_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          property_id?: string;
          document_id?: string;
          document_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      investment_entities: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          entity_type: string;
          tax_id: string | null;
          country: CountryCode;
          currency_code: CurrencyCode;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          entity_type: string;
          tax_id?: string | null;
          country?: CountryCode;
          currency_code?: CurrencyCode;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          entity_type?: string;
          tax_id?: string | null;
          country?: CountryCode;
          currency_code?: CurrencyCode;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      investments: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          investment_type: InvestmentType;
          symbol: string | null;
          entity_id: string | null;
          currency_code: CurrencyCode;
          country: CountryCode;
          shares: number | null;
          cost_basis: number | null;
          current_value: number | null;
          acquisition_date: string | null;
          is_active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          investment_type?: InvestmentType;
          symbol?: string | null;
          entity_id?: string | null;
          currency_code?: CurrencyCode;
          country?: CountryCode;
          shares?: number | null;
          cost_basis?: number | null;
          current_value?: number | null;
          acquisition_date?: string | null;
          is_active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          investment_type?: InvestmentType;
          symbol?: string | null;
          entity_id?: string | null;
          currency_code?: CurrencyCode;
          country?: CountryCode;
          shares?: number | null;
          cost_basis?: number | null;
          current_value?: number | null;
          acquisition_date?: string | null;
          is_active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      investment_transactions: {
        Row: {
          id: string;
          user_id: string;
          investment_id: string;
          transaction_type: InvestmentTransactionType;
          transaction_date: string;
          shares: number | null;
          price_per_share: number | null;
          amount: number;
          currency_code: CurrencyCode;
          fees: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          investment_id: string;
          transaction_type: InvestmentTransactionType;
          transaction_date: string;
          shares?: number | null;
          price_per_share?: number | null;
          amount: number;
          currency_code?: CurrencyCode;
          fees?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          investment_id?: string;
          transaction_type?: InvestmentTransactionType;
          transaction_date?: string;
          shares?: number | null;
          price_per_share?: number | null;
          amount?: number;
          currency_code?: CurrencyCode;
          fees?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      investment_distributions: {
        Row: {
          id: string;
          user_id: string;
          investment_id: string;
          entity_id: string | null;
          distribution_type: string;
          amount: number;
          currency_code: CurrencyCode;
          distribution_date: string;
          is_reinvested: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          investment_id: string;
          entity_id?: string | null;
          distribution_type: string;
          amount: number;
          currency_code?: CurrencyCode;
          distribution_date: string;
          is_reinvested?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          investment_id?: string;
          entity_id?: string | null;
          distribution_type?: string;
          amount?: number;
          currency_code?: CurrencyCode;
          distribution_date?: string;
          is_reinvested?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      investment_capital_calls: {
        Row: {
          id: string;
          user_id: string;
          investment_id: string;
          entity_id: string | null;
          call_date: string;
          due_date: string | null;
          amount: number;
          amount_paid: number;
          currency_code: CurrencyCode;
          status: CapitalCallStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          investment_id: string;
          entity_id?: string | null;
          call_date: string;
          due_date?: string | null;
          amount: number;
          amount_paid?: number;
          currency_code?: CurrencyCode;
          status?: CapitalCallStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          investment_id?: string;
          entity_id?: string | null;
          call_date?: string;
          due_date?: string | null;
          amount?: number;
          amount_paid?: number;
          currency_code?: CurrencyCode;
          status?: CapitalCallStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      investment_valuations: {
        Row: {
          id: string;
          user_id: string;
          investment_id: string;
          valuation_date: string;
          value: number;
          currency_code: CurrencyCode;
          valuation_method: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          investment_id: string;
          valuation_date: string;
          value: number;
          currency_code?: CurrencyCode;
          valuation_method?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          investment_id?: string;
          valuation_date?: string;
          value?: number;
          currency_code?: CurrencyCode;
          valuation_method?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      investment_tax_items: {
        Row: {
          id: string;
          user_id: string;
          investment_id: string;
          tax_year: number;
          item_type: string;
          amount: number;
          currency_code: CurrencyCode;
          description: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          investment_id: string;
          tax_year: number;
          item_type: string;
          amount: number;
          currency_code?: CurrencyCode;
          description?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          investment_id?: string;
          tax_year?: number;
          item_type?: string;
          amount?: number;
          currency_code?: CurrencyCode;
          description?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      precious_metals: {
        Row: {
          id: string;
          user_id: string;
          metal_type: MetalType;
          weight_oz: number;
          purity: number | null;
          acquisition_date: string | null;
          acquisition_cost: number | null;
          current_value: number | null;
          currency_code: CurrencyCode;
          storage_location: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          metal_type?: MetalType;
          weight_oz: number;
          purity?: number | null;
          acquisition_date?: string | null;
          acquisition_cost?: number | null;
          current_value?: number | null;
          currency_code?: CurrencyCode;
          storage_location?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          metal_type?: MetalType;
          weight_oz?: number;
          purity?: number | null;
          acquisition_date?: string | null;
          acquisition_cost?: number | null;
          current_value?: number | null;
          currency_code?: CurrencyCode;
          storage_location?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      investment_documents: {
        Row: {
          id: string;
          user_id: string;
          investment_id: string;
          document_id: string;
          document_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          investment_id: string;
          document_id: string;
          document_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          investment_id?: string;
          document_id?: string;
          document_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tax_years: {
        Row: {
          id: string;
          user_id: string;
          tax_year: number;
          country: CountryCode;
          filing_status: FilingStatus | null;
          is_filed: boolean;
          filed_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tax_year: number;
          country?: CountryCode;
          filing_status?: FilingStatus | null;
          is_filed?: boolean;
          filed_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tax_year?: number;
          country?: CountryCode;
          filing_status?: FilingStatus | null;
          is_filed?: boolean;
          filed_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tax_documents: {
        Row: {
          id: string;
          user_id: string;
          tax_year_id: string;
          document_id: string;
          form_type: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tax_year_id: string;
          document_id: string;
          form_type?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tax_year_id?: string;
          document_id?: string;
          form_type?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tax_accounts: {
        Row: {
          id: string;
          user_id: string;
          tax_year_id: string;
          account_name: string;
          account_type: string | null;
          institution: string | null;
          account_number: string | null;
          currency_code: CurrencyCode;
          country: CountryCode;
          opening_balance: number | null;
          closing_balance: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tax_year_id: string;
          account_name: string;
          account_type?: string | null;
          institution?: string | null;
          account_number?: string | null;
          currency_code?: CurrencyCode;
          country?: CountryCode;
          opening_balance?: number | null;
          closing_balance?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tax_year_id?: string;
          account_name?: string;
          account_type?: string | null;
          institution?: string | null;
          account_number?: string | null;
          currency_code?: CurrencyCode;
          country?: CountryCode;
          opening_balance?: number | null;
          closing_balance?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tax_income_items: {
        Row: {
          id: string;
          user_id: string;
          tax_year_id: string;
          income_type: string;
          source: string | null;
          amount: number;
          currency_code: CurrencyCode;
          country: CountryCode;
          is_foreign: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tax_year_id: string;
          income_type: string;
          source?: string | null;
          amount: number;
          currency_code?: CurrencyCode;
          country?: CountryCode;
          is_foreign?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tax_year_id?: string;
          income_type?: string;
          source?: string | null;
          amount?: number;
          currency_code?: CurrencyCode;
          country?: CountryCode;
          is_foreign?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tax_expense_items: {
        Row: {
          id: string;
          user_id: string;
          tax_year_id: string;
          expense_type: string;
          category: string | null;
          amount: number;
          currency_code: CurrencyCode;
          is_deductible: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tax_year_id: string;
          expense_type: string;
          category?: string | null;
          amount: number;
          currency_code?: CurrencyCode;
          is_deductible?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tax_year_id?: string;
          expense_type?: string;
          category?: string | null;
          amount?: number;
          currency_code?: CurrencyCode;
          is_deductible?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tax_deductions: {
        Row: {
          id: string;
          user_id: string;
          tax_year_id: string;
          deduction_type: string;
          category: string | null;
          amount: number;
          currency_code: CurrencyCode;
          description: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tax_year_id: string;
          deduction_type: string;
          category?: string | null;
          amount: number;
          currency_code?: CurrencyCode;
          description?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tax_year_id?: string;
          deduction_type?: string;
          category?: string | null;
          amount?: number;
          currency_code?: CurrencyCode;
          description?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tax_foreign_accounts: {
        Row: {
          id: string;
          user_id: string;
          tax_year_id: string;
          account_name: string;
          institution: string | null;
          country: CountryCode;
          account_number: string | null;
          max_value: number;
          currency_code: CurrencyCode;
          account_type: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tax_year_id: string;
          account_name: string;
          institution?: string | null;
          country: CountryCode;
          account_number?: string | null;
          max_value: number;
          currency_code?: CurrencyCode;
          account_type?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tax_year_id?: string;
          account_name?: string;
          institution?: string | null;
          country?: CountryCode;
          account_number?: string | null;
          max_value?: number;
          currency_code?: CurrencyCode;
          account_type?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tax_fbar_items: {
        Row: {
          id: string;
          user_id: string;
          tax_year_id: string;
          foreign_account_id: string | null;
          max_value_usd: number;
          currency_code: CurrencyCode;
          country: CountryCode;
          institution_name: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tax_year_id: string;
          foreign_account_id?: string | null;
          max_value_usd: number;
          currency_code?: CurrencyCode;
          country: CountryCode;
          institution_name?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tax_year_id?: string;
          foreign_account_id?: string | null;
          max_value_usd?: number;
          currency_code?: CurrencyCode;
          country?: CountryCode;
          institution_name?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tax_form_8938_items: {
        Row: {
          id: string;
          user_id: string;
          tax_year_id: string;
          asset_description: string;
          asset_type: string | null;
          max_value: number;
          currency_code: CurrencyCode;
          country: CountryCode;
          institution: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tax_year_id: string;
          asset_description: string;
          asset_type?: string | null;
          max_value: number;
          currency_code?: CurrencyCode;
          country: CountryCode;
          institution?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tax_year_id?: string;
          asset_description?: string;
          asset_type?: string | null;
          max_value?: number;
          currency_code?: CurrencyCode;
          country?: CountryCode;
          institution?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tax_schedule_e_items: {
        Row: {
          id: string;
          user_id: string;
          tax_year_id: string;
          property_id: string | null;
          rental_income: number;
          expenses: number;
          depreciation: number;
          net_income: number;
          currency_code: CurrencyCode;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tax_year_id: string;
          property_id?: string | null;
          rental_income?: number;
          expenses?: number;
          depreciation?: number;
          net_income?: number;
          currency_code?: CurrencyCode;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tax_year_id?: string;
          property_id?: string | null;
          rental_income?: number;
          expenses?: number;
          depreciation?: number;
          net_income?: number;
          currency_code?: CurrencyCode;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tax_k1_items: {
        Row: {
          id: string;
          user_id: string;
          tax_year_id: string;
          entity_id: string | null;
          k1_type: string | null;
          ordinary_income: number | null;
          capital_gains: number | null;
          dividends: number | null;
          interest: number | null;
          other_income: number | null;
          currency_code: CurrencyCode;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tax_year_id: string;
          entity_id?: string | null;
          k1_type?: string | null;
          ordinary_income?: number | null;
          capital_gains?: number | null;
          dividends?: number | null;
          interest?: number | null;
          other_income?: number | null;
          currency_code?: CurrencyCode;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tax_year_id?: string;
          entity_id?: string | null;
          k1_type?: string | null;
          ordinary_income?: number | null;
          capital_gains?: number | null;
          dividends?: number | null;
          interest?: number | null;
          other_income?: number | null;
          currency_code?: CurrencyCode;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tax_depreciation_items: {
        Row: {
          id: string;
          user_id: string;
          tax_year_id: string;
          property_id: string | null;
          asset_description: string | null;
          depreciation_amount: number;
          method: string | null;
          currency_code: CurrencyCode;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tax_year_id: string;
          property_id?: string | null;
          asset_description?: string | null;
          depreciation_amount?: number;
          method?: string | null;
          currency_code?: CurrencyCode;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tax_year_id?: string;
          property_id?: string | null;
          asset_description?: string | null;
          depreciation_amount?: number;
          method?: string | null;
          currency_code?: CurrencyCode;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tax_exports: {
        Row: {
          id: string;
          user_id: string;
          tax_year_id: string;
          export_type: string;
          file_path: string | null;
          export_status: ExportStatus;
          exported_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tax_year_id: string;
          export_type: string;
          file_path?: string | null;
          export_status?: ExportStatus;
          exported_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tax_year_id?: string;
          export_type?: string;
          file_path?: string | null;
          export_status?: ExportStatus;
          exported_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      executive_net_worth_summary: {
        Row: {
          user_id: string | null;
          currency_code: CurrencyCode | null;
          total_assets: number | null;
          total_liabilities: number | null;
          net_worth: number | null;
          investment_value: number | null;
          real_estate_value: number | null;
          precious_metals_value: number | null;
        };
        Relationships: [];
      };
      executive_cash_flow_summary: {
        Row: {
          user_id: string | null;
          currency_code: CurrencyCode | null;
          snapshot_month: string | null;
          total_income: number | null;
          total_expenses: number | null;
          cash_flow: number | null;
          monthly_recurring_income: number | null;
          monthly_recurring_expenses: number | null;
        };
        Relationships: [];
      };
      executive_asset_allocation: {
        Row: {
          user_id: string | null;
          currency_code: CurrencyCode | null;
          allocation_category: string | null;
          total_value: number | null;
          percentage: number | null;
        };
        Relationships: [];
      };
      executive_liquidity_summary: {
        Row: {
          user_id: string | null;
          currency_code: CurrencyCode | null;
          bank_account_count: number | null;
          total_cash_balance: number | null;
          hub_cash_balance: number | null;
        };
        Relationships: [];
      };
      executive_passive_income_summary: {
        Row: {
          user_id: string | null;
          currency_code: CurrencyCode | null;
          total_passive_income: number | null;
          total_active_income: number | null;
          total_income: number | null;
          passive_source_count: number | null;
          rental_income_ytd: number | null;
          investment_distributions_ytd: number | null;
        };
        Relationships: [];
      };
      executive_tax_summary: {
        Row: {
          user_id: string | null;
          tax_year: number | null;
          country: CountryCode | null;
          filing_status: FilingStatus | null;
          is_filed: boolean | null;
          total_taxable_income: number | null;
          total_deductions: number | null;
          total_deductible_expenses: number | null;
          foreign_account_count: number | null;
          total_fbar_value_usd: number | null;
        };
        Relationships: [];
      };
      executive_real_estate_summary: {
        Row: {
          user_id: string | null;
          currency_code: CurrencyCode | null;
          property_count: number | null;
          total_property_value: number | null;
          total_mortgage_balance: number | null;
          rental_income_ytd: number | null;
          property_expenses_ytd: number | null;
          rental_property_count: number | null;
        };
        Relationships: [];
      };
      executive_investment_summary: {
        Row: {
          user_id: string | null;
          currency_code: CurrencyCode | null;
          investment_count: number | null;
          total_current_value: number | null;
          total_cost_basis: number | null;
          total_unrealized_gain: number | null;
          distributions_ytd: number | null;
          pending_capital_calls: number | null;
        };
        Relationships: [];
      };
      executive_financial_independence_summary: {
        Row: {
          user_id: string | null;
          currency_code: CurrencyCode | null;
          monthly_passive_income: number | null;
          monthly_expenses: number | null;
          net_worth: number | null;
          passive_income_coverage_pct: number | null;
          years_to_fi_multiple_25x: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      set_updated_at: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      handle_new_user: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
    };
    Enums: {
      country_code: CountryCode;
      currency_code: CurrencyCode;
      account_type: AccountType;
      asset_type: AssetType;
      liability_type: LiabilityType;
      income_frequency: IncomeFrequency;
      expense_frequency: ExpenseFrequency;
      property_type: PropertyType;
      investment_type: InvestmentType;
      investment_transaction_type: InvestmentTransactionType;
      metal_type: MetalType;
      filing_status: FilingStatus;
      import_status: ImportStatus;
      export_status: ExportStatus;
      capital_call_status: CapitalCallStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

// Convenience type helpers
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
export type Views<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];
