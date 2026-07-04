import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Building2,
  FileText,
  Home,
  Landmark,
  LayoutDashboard,
  Shield,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { APP_NAME, APP_TAGLINE, NAV_ITEMS } from "@/lib/utils/navigation";

const iconMap = {
  LayoutDashboard,
  Landmark,
  Building2,
  Home,
  TrendingUp,
  FileText,
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/executive-dashboard");
  }

  return (
    <div className="min-h-screen bg-navy-950">
      <header className="border-b border-navy-700">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold text-white">{APP_NAME}</span>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-navy-950 hover:bg-gold-400"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-6 py-20 text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {APP_TAGLINE}
            </h1>
            <p className="mt-6 text-lg text-slate-400">
              A secure, executive-grade platform to track net worth, banking,
              real estate, investments, and taxes — all in one place.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/signup"
                className="rounded-lg bg-gold-500 px-6 py-3 text-sm font-medium text-navy-950 hover:bg-gold-400"
              >
                Create your account
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-navy-600 px-6 py-3 text-sm text-slate-300 hover:bg-navy-800"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-navy-700 bg-navy-900/50">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <h2 className="text-center text-2xl font-semibold text-white">
              Six integrated modules
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-400">
              Navigate between dedicated platforms for every area of your financial life.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {NAV_ITEMS.map((item) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap];
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-navy-700 bg-navy-900 p-6"
                  >
                    <Icon className="h-8 w-8 text-gold-400" />
                    <h3 className="mt-4 text-lg font-semibold text-white">
                      {item.label}
                    </h3>
                    <p className="mt-2 text-sm text-slate-400">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-t border-navy-700">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <div className="flex flex-col items-center text-center">
              <Shield className="h-10 w-10 text-gold-400" />
              <h2 className="mt-4 text-2xl font-semibold text-white">
                Security first
              </h2>
              <p className="mt-2 max-w-lg text-sm text-slate-400">
                Built on Supabase Auth with row-level security. All integrations
                are read-only — no payments, transfers, or transaction execution.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-navy-700">
        <div className="mx-auto max-w-7xl px-6 py-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} {APP_NAME}. Manual data entry · Read-only integrations.
        </div>
      </footer>
    </div>
  );
}
