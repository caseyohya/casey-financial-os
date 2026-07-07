import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BankingPlatform } from "@/components/banking/BankingPlatform";

export const dynamic = "force-dynamic";

export default async function BankingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <BankingPlatform userId={user.id} />;
}
