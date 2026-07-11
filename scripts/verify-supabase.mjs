#!/usr/bin/env node

/**
 * Verifies Supabase connectivity and required schema for all six apps.
 * Usage: npm run db:verify
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const MODULE_TABLES = {
  "Financial Hub": ["accounts", "assets", "liabilities", "income_sources", "expenses"],
  Banking: ["bank_accounts", "bank_transactions", "bank_balances", "cash_flow_monthly"],
  "Real Estate": ["properties", "property_owners", "property_monthly_summary"],
  Investments: ["investments", "investment_entities", "investment_monthly_summary"],
  Tax: ["tax_years", "tax_documents", "tax_income_items"],
  Executive: [
    "executive_net_worth_summary",
    "executive_cash_flow_summary",
    "tax_records",
    "net_worth_snapshots",
  ],
};

function fail(message) {
  console.error(`\n✗ ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`✓ ${message}`);
}

if (!url || !anonKey) {
  fail(
    "Missing Supabase credentials. Copy .env.local.example to .env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

if (url.includes("your-project") || url.includes("placeholder")) {
  fail("NEXT_PUBLIC_SUPABASE_URL still contains placeholder values.");
}

const supabase = createClient(url, anonKey);

console.log("Casey Financial OS — Supabase Verification\n");
console.log(`Project: ${url}\n`);

const { error: authError } = await supabase.auth.getSession();
if (authError) {
  fail(`Auth check failed: ${authError.message}`);
}
ok("Supabase API reachable");

let allPassed = true;

for (const [module, tables] of Object.entries(MODULE_TABLES)) {
  console.log(`\n${module}:`);
  for (const table of tables) {
    const { error } = await supabase.from(table).select("*", { count: "exact", head: true });
    if (error) {
      console.log(`  ✗ ${table} — ${error.message}`);
      allPassed = false;
    } else {
      console.log(`  ✓ ${table}`);
    }
  }
}

console.log("\nStorage buckets:");
for (const bucket of ["property-documents", "investment-documents"]) {
  const { data, error } = await supabase.storage.from(bucket).list("", { limit: 1 });
  if (error) {
    console.log(`  ✗ ${bucket} — ${error.message}`);
    allPassed = false;
  } else {
    console.log(`  ✓ ${bucket} (accessible)`);
    void data;
  }
}

if (!allPassed) {
  console.error(
    "\nSome checks failed. Apply migrations with:\n  supabase db push\nOr run both files in the Supabase SQL Editor:\n  supabase/migrations/20250705000000_casey_financial_os_schema.sql\n  supabase/migrations/20250711000000_app_module_alignment.sql"
  );
  process.exit(1);
}

console.log("\nAll six apps are configured and ready to use Supabase.");
process.exit(0);
