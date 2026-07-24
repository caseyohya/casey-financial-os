"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Building2,
  FileText,
  Home,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  TrendingUp,
  X,
} from "lucide-react";
import { APP_NAME, NAV_ITEMS } from "@/lib/utils/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const iconMap = {
  LayoutDashboard,
  Landmark,
  Building2,
  Home,
  TrendingUp,
  FileText,
};

interface SidebarProps {
  userEmail?: string;
}

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const nav = (
    <>
      <div className="border-b border-navy-700 px-6 py-5">
        <Link href="/executive-dashboard" className="block">
          <h1 className="text-lg font-semibold tracking-tight text-white">
            {APP_NAME}
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">Executive Suite</p>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-navy-700 text-gold-400"
                  : "text-slate-400 hover:bg-navy-800 hover:text-slate-200"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-navy-700 p-4">
        {userEmail && (
          <p className="mb-3 truncate text-xs text-slate-500">{userEmail}</p>
        )}
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-navy-800 hover:text-slate-200"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-navy-700 bg-navy-900 px-4 py-3 lg:hidden">
        <Link href="/executive-dashboard" className="text-sm font-semibold text-white">
          {APP_NAME}
        </Link>
        <button
          type="button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          onClick={() => setOpen((value) => !value)}
          className="rounded-lg p-2 text-slate-300 hover:bg-navy-800"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-navy-700 bg-navy-900 transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {nav}
      </aside>
    </>
  );
}
