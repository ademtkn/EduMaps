import { NextResponse } from "next/server";
import { requireRole } from "@/lib/actions/admin-auth";
import { SCHOOL_WITH_CHILDREN, toFormValues } from "@/lib/admin-school-values";
import { toCsv } from "@/lib/import/csv";
import { formToRecord, headerRow, recordToRow } from "@/lib/import/schools";
import { loadLookups } from "@/lib/import/server";

export const dynamic = "force-dynamic";

/** Every school in the same columns the importer reads, so a file can be edited in a spreadsheet and imported back. */
export async function GET() {
  const ctx = await requireRole(["admin"]);
  if (!ctx) return new NextResponse("Forbidden", { status: 403 });
  const [{ data }, lookups] = await Promise.all([ctx.supabase.from("schools").select(SCHOOL_WITH_CHILDREN).order("created_at"), loadLookups(ctx.supabase)]);
  const rows = ((data ?? []) as unknown as Parameters<typeof toFormValues>[0][]).map((s) => recordToRow(formToRecord(toFormValues(s), lookups)));
  return new NextResponse(toCsv([headerRow(), ...rows]), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="edumaps-schools-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" },
  });
}
