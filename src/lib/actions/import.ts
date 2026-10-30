"use server";

import { rateLimit } from "@/lib/security/rate-limit";
import { analyze, type ImportMode, type RowAction } from "@/lib/import/server";
import type { ImportDefaults } from "@/lib/import/schools";
import { requireRole } from "./admin-auth";
import { saveSchoolAction } from "./admin";

export type PreviewRow = { line: number; name: string; slug: string; action: RowAction; errors: string[]; warnings: string[]; changes: string[] };
export type ImportPreview =
  | { ok: true; rows: PreviewRow[]; ignored: string[]; counts: Record<RowAction, number> }
  | { ok: false; error: string };
export type ImportRunRow = { line: number; name: string; slug: string; result: "created" | "updated" | "failed"; id?: string; error?: string };
export type ImportRun = { ok: true; results: ImportRunRow[]; skipped: number } | { ok: false; error: string };

function options(formData: FormData): { mode: ImportMode; defaults: ImportDefaults } {
  const status = formData.get("status") === "published" ? "published" : "draft";
  const ds = formData.get("data_status");
  return {
    mode: formData.get("mode") === "update" ? "update" : "create",
    defaults: { status, dataStatus: ds === "verified" || ds === "demo" ? ds : "unverified" },
  };
}

/** Reads and checks the file without saving anything. */
export async function previewSchoolImportAction(formData: FormData): Promise<ImportPreview> {
  const ctx = await requireRole(["admin"]);
  if (!ctx) return { ok: false, error: "Not authorized." };
  const { mode, defaults } = options(formData);
  const analysis = await analyze(ctx.supabase, formData.get("file"), mode, defaults);
  if (!analysis.ok) return analysis;
  const counts: Record<RowAction, number> = { create: 0, update: 0, unchanged: 0, skip: 0, error: 0 };
  for (const row of analysis.rows) counts[row.action] += 1;
  return {
    ok: true, ignored: analysis.ignored, counts,
    rows: analysis.rows.map((row) => {
      const { payload, ...rest } = row;
      void payload;
      return rest;
    }),
  };
}

/** Reads the same file again, re-checks every row and saves the valid ones. Rows with errors are never saved. */
export async function runSchoolImportAction(formData: FormData): Promise<ImportRun> {
  const ctx = await requireRole(["admin"]);
  if (!ctx) return { ok: false, error: "Not authorized." };
  if (!rateLimit(`school-import:${ctx.user.id}`, 12, 60 * 60_000).ok) return { ok: false, error: "Too many imports in the last hour. Please wait a little." };
  const { mode, defaults } = options(formData);
  const analysis = await analyze(ctx.supabase, formData.get("file"), mode, defaults);
  if (!analysis.ok) return analysis;

  const todo = analysis.rows.filter((r) => (r.action === "create" || r.action === "update") && r.payload);
  const results: ImportRunRow[] = [];
  for (let i = 0; i < todo.length; i += 5) {
    const batch = todo.slice(i, i + 5);
    const done = await Promise.all(
      batch.map(async (row): Promise<ImportRunRow> => {
        const saved = await saveSchoolAction(row.payload);
        const base = { line: row.line, name: row.name, slug: row.slug };
        return saved.ok
          ? { ...base, result: row.action === "create" ? "created" : "updated", id: saved.data?.id }
          : { ...base, result: "failed", error: saved.error };
      })
    );
    results.push(...done);
  }
  return { ok: true, results, skipped: analysis.rows.length - todo.length };
}
