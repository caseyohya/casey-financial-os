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
  const parts = [error.message || "Signup failed."];
  if (error.status) parts.push(`(status ${error.status})`);
  if (error.code) parts.push(`[${error.code}]`);
  return parts.join(" ");
}

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    if (!isSupabaseConfigured()) {
      const configError =
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart the dev server.";
      if (process.env.NODE_ENV === "development") {
        console.error("[signup]", configError);
      }
      setError(configError);
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const emailRedirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined;

      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo,
        },
      });

      if (authError) {
        if (process.env.NODE_ENV === "development") {
          console.error("[signup] supabase.auth.signUp error:", authError);
        }
        setError(formatAuthError(authError));
        setIsLoading(false);
        return;
      }

      if (process.env.NODE_ENV === "development") {
        console.info("[signup] success", {
          userId: data.user?.id,
          hasSession: Boolean(data.session),
          identities: data.user?.identities?.length ?? 0,
        });
      }

      // Supabase may return a user with empty identities when the email is already registered
      // and "Confirm email" is enabled (anti-enumeration). Surface a clear message.
      if (data.user && (data.user.identities?.length ?? 0) === 0 && !data.session) {
        setError(
          "An account with this email may already exist. Try signing in, or use a different email."
        );
        setIsLoading(false);
        return;
      }

      if (data.session) {
        setMessage("Account created successfully. Redirecting to your dashboard…");
        setIsLoading(false);
        router.push("/executive-dashboard");
        router.refresh();
        return;
      }

      if (data.user) {
        setMessage(
          "Account created. Check your email to confirm your address, then sign in. (If you do not receive an email, confirm Email provider settings in the Supabase dashboard.)"
        );
        setIsLoading(false);
        return;
      }

      setError("Signup completed without a user or session. Please try again or check Supabase Auth logs.");
      setIsLoading(false);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("[signup] unexpected error:", err);
      }
      setError(err instanceof Error ? err.message : "Unexpected signup error.");
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-white">{APP_NAME}</h1>
          <p className="mt-2 text-sm text-slate-400">Create your account</p>
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
          {message && (
            <div
              role="status"
              className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-400"
            >
              {message}
            </div>
          )}

          <InputField
            label="Full Name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Casey Ohya"
            required
          />

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
            minLength={8}
            required
          />

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-gold-400 hover:text-gold-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
