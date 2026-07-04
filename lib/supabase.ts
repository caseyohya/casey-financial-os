import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export type Account = {
  id: string
  profile_id: string
  name: string
  account_type: string
  balance: number
  created_at: string
}

export type Asset = {
  id: string
  profile_id: string
  name: string
  asset_type: string
  value: number
  created_at: string
}

export type Liability = {
  id: string
  profile_id: string
  name: string
  liability_type: string
  balance: number
  interest_rate: number | null
  created_at: string
}

export type IncomeSource = {
  id: string
  profile_id: string
  name: string
  amount: number
  frequency: string
  created_at: string
}

export type Expense = {
  id: string
  profile_id: string
  name: string
  category: string
  amount: number
  frequency: string
  created_at: string
}
