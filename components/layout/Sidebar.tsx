"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  FileText,
  Home,
  Landmark,
  LayoutDashboard,
  LogOut,
  TrendingUp,
} from "lucide-react";
import { APP_NAME, NAV_ITEMS } from "@/lib/utils/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-navy-700 bg-navy-900">
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
    </aside>
  );
}
