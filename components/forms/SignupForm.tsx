"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { InputField, Button } from "@/components/forms/FormFields";
import { APP_NAME } from "@/lib/utils/navigation";

function logAuthError(context: string, error: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.error(`[auth:${context}]`, error);
  }
}

function formatSignupError(error: { message: string; status?: number; name?: string }) {
  if (
    error.message === "fetch failed" ||
    error.name === "AuthRetryableFetchError" ||
    error.status === 0
  ) {
    return "Unable to reach Supabase. Check that NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local point to a real project, then restart the dev server.";
  }
  return error.message;
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
        "Supabase is not configured. Copy .env.local.example to .env.local, set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart the dev server.";
      logAuthError("signUp", configError);
      setError(configError);
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        logAuthError("signUp", authError);
        setError(formatSignupError(authError));
        setIsLoading(false);
        return;
      }

      // Supabase may return a user with empty identities when the email is already registered.
      const identities = data.user?.identities ?? null;
      if (data.user && identities && identities.length === 0) {
        const duplicateMessage =
          "An account with this email already exists. Sign in instead, or reset your password.";
        logAuthError("signUp", duplicateMessage);
        setError(duplicateMessage);
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

      // Email confirmation is enabled — null session is expected, not an error.
      setMessage(
        "Account created. Check your email for a confirmation link before signing in."
      );
      setIsLoading(false);
    } catch (err) {
      logAuthError("signUp", err);
      const fallback =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during signup.";
      setError(formatSignupError({ message: fallback }));
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
