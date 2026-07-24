"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { InputField, Button } from "@/components/forms/FormFields";
import { APP_NAME } from "@/lib/utils/navigation";

function formatAuthError(error: { message?: string; status?: number; code?: string } | null): string {
  if (!error) return "Unknown authentication error.";
  const parts = [error.message || "Login failed."];
  if (error.status) parts.push(`(status ${error.status})`);
  if (error.code) parts.push(`[${error.code}]`);
  return parts.join(" ");
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!isSupabaseConfigured()) {
      const configError =
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart the dev server.";
      if (process.env.NODE_ENV === "development") {
        console.error("[login]", configError);
      }
      setError(configError);
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (process.env.NODE_ENV === "development") {
          console.error("[login] supabase.auth.signInWithPassword error:", authError);
        }
        setError(formatAuthError(authError));
        setIsLoading(false);
        return;
      }

      if (!data.session) {
        const sessionError = "Login succeeded but no session was returned. Check Supabase Auth settings.";
        if (process.env.NODE_ENV === "development") {
          console.error("[login]", sessionError, data);
        }
        setError(sessionError);
        setIsLoading(false);
        return;
      }

      if (process.env.NODE_ENV === "development") {
        console.info("[login] success", { userId: data.user?.id });
      }

      router.push("/executive-dashboard");
      router.refresh();
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("[login] unexpected error:", err);
      }
      setError(err instanceof Error ? err.message : "Unexpected login error.");
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-white">{APP_NAME}</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in to your account</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-navy-700 bg-navy-900 p-6 space-y-4"
        >
          {error && (
            <div
              role="alert"
              className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400"
            >
              {error}
            </div>
          )}

          <InputField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />

          <InputField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-gold-400 hover:text-gold-500">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
