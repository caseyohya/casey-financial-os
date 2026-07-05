import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTaxYearByYear } from "@/lib/data/tax";
import {
  generateAnnualSummaryCsv,
  generateCpaPackageCsv,
  generateFbarCsv,
  generateForm8938Csv,
  generateScheduleECsv,
  generateK1SummaryCsv,
} from "@/lib/utils/tax-exports";

async function getTaxYearData(year: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" as const };

  const data = await getTaxYearByYear(year);
  if (!data) return { error: "Tax year not found" as const };

  return { data };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ year: string }> }
) {
  const { year: yearStr } = await params;
  const year = parseInt(yearStr, 10);
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "annual_summary";

  const result = await getTaxYearData(year);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.error === "Unauthorized" ? 401 : 404 });
  }

  let csv: string;
  let filename: string;

  switch (type) {
    case "cpa_package":
      csv = generateCpaPackageCsv(result.data);
      filename = `tax-cpa-package-${year}.csv`;
      break;
    case "fbar":
      csv = generateFbarCsv(result.data);
      filename = `tax-fbar-${year}.csv`;
      break;
    case "form_8938":
      csv = generateForm8938Csv(result.data);
      filename = `tax-form-8938-${year}.csv`;
      break;
    case "schedule_e":
      csv = generateScheduleECsv(result.data);
      filename = `tax-schedule-e-${year}.csv`;
      break;
    case "k1_summary":
      csv = generateK1SummaryCsv(result.data);
      filename = `tax-k1-summary-${year}.csv`;
      break;
    default:
      csv = generateAnnualSummaryCsv(result.data);
      filename = `tax-annual-summary-${year}.csv`;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("tax_exports").insert({
      user_id: user.id,
      tax_year_id: result.data.id,
      export_type: type === "annual_summary" ? "annual_summary" : type,
      file_name: filename,
      notes: `Generated ${new Date().toISOString()}`,
    });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
