import { fmt } from "@/lib/i18n/fmt";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { CategoryScores } from "@/lib/data/schools";
import { Card, CardBody } from "@/components/ui/card";
import { GradeBadge } from "@/components/ui/grade-badge";

/** Niche-style report card: one overall grade plus a grade per review category. */
export function ReportCard({ dict, score, count, categories }: { dict: Dictionary; score: number; count: number; categories: CategoryScores }) {
  const rows = [
    [dict.reviews.teaching, categories.teaching],
    [dict.reviews.facilities, categories.facilities],
    [dict.reviews.safety, categories.safety],
    [dict.reviews.communication, categories.communication],
  ] as const;

  return (
    <Card>
      <CardBody>
        <div className="flex flex-wrap items-center gap-6">
          <GradeBadge score={score} count={count} size="xl" />
          <div className="min-w-0 flex-1">
            <p className="text-caption font-semibold uppercase tracking-wide text-ink-500">{dict.grades.overall}</p>
            <p className="text-h2 font-bold text-ink-900">{count > 0 ? fmt(dict.grades.outOf, { score: score.toFixed(1) }) : dict.grades.notGraded}</p>
            <p className="mt-1 text-small text-ink-600">{count > 0 ? fmt(dict.grades.basedOn, { count }) : dict.grades.needReviews}</p>
          </div>
        </div>
        {count > 0 ? (
          <ul className="mt-6 grid gap-3 border-t border-ink-200 pt-5 sm:grid-cols-2">
            {rows.map(([label, value]) => (
              <li key={label} className="flex items-center justify-between gap-3 rounded-xl bg-ink-50 px-4 py-3">
                <span className="text-small font-medium text-ink-800">{label}</span>
                <span className="flex items-center gap-2 text-small text-ink-600">
                  {value !== null ? fmt(dict.grades.outOf, { score: value.toFixed(1) }) : "—"}
                  <GradeBadge score={value ?? 0} count={value !== null ? 1 : 0} size="sm" />
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="mt-5 text-caption text-ink-500">{dict.grades.explain}</p>
      </CardBody>
    </Card>
  );
}
