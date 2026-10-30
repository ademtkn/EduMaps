import { NextResponse } from "next/server";
import { requireRole } from "@/lib/actions/admin-auth";
import { toCsv } from "@/lib/import/csv";
import { exampleRows, headerRow } from "@/lib/import/schools";

export const dynamic = "force-dynamic";

/** An empty spreadsheet with every column and two example rows (marked as demo so they cannot be mistaken for real schools). */
export async function GET() {
  if (!(await requireRole(["admin"]))) return new NextResponse("Forbidden", { status: 403 });
  return new NextResponse(toCsv([headerRow(), ...exampleRows()]), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="edumaps-schools-template.csv"', "Cache-Control": "no-store" },
  });
}
