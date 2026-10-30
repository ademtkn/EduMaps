"use client";

import type { ReactNode } from "react";
import { formatDate } from "@/lib/i18n/format";
import type { ReviewData } from "@/lib/data/types";
import { initials } from "@/lib/utils";
import { useDict, useLang } from "@/components/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { Stars } from "@/components/ui/rating";
import { HelpfulButton } from "./helpful-button";
import { ReportButton } from "./report-button";

export function ReviewCard({ review, actions, showStatus = false }: { review: ReviewData; actions?: ReactNode; showStatus?: boolean }) {
  const dict = useDict();
  const lang = useLang();
  const name = review.profiles?.display_name ?? "—";
  const relationships = dict.reviews.relationships as Record<string, string>;
  const statusTone = { pending: "warning", published: "success", rejected: "danger", hidden: "neutral" } as const;
  const statusLabel = {
    pending: dict.reviews.statusPending,
    published: dict.reviews.statusPublished,
    rejected: dict.reviews.statusRejected,
    hidden: dict.reviews.statusHidden,
  };
  const subRatings = [
    [dict.reviews.teaching, review.rating_teaching],
    [dict.reviews.facilities, review.rating_facilities],
    [dict.reviews.safety, review.rating_safety],
    [dict.reviews.communication, review.rating_communication],
  ] as const;

  return (
    <article className="rounded-card border border-ink-200 bg-white p-5 shadow-card sm:p-6">
      <header className="flex items-start gap-3">
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-small font-bold text-brand-800">
          {initials(name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-small font-semibold text-ink-900">{name}</p>
            <Badge tone="neutral">{relationships[review.relationship]}</Badge>
            {showStatus ? <Badge tone={statusTone[review.status]}>{statusLabel[review.status]}</Badge> : null}
          </div>
          <p className="text-caption text-ink-500">{formatDate(review.created_at, lang)}</p>
        </div>
        <Stars value={review.rating} />
      </header>

      <h4 className="mt-4 text-body font-semibold text-ink-900">{review.title}</h4>
      <p className="mt-1.5 whitespace-pre-line text-body text-ink-700">{review.body}</p>

      {subRatings.some(([, v]) => v) ? (
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 text-caption sm:grid-cols-4">
          {subRatings.filter(([, v]) => v).map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-2 sm:block">
              <dt className="text-ink-500">{label}</dt>
              <dd className="font-semibold text-ink-800">{value} / 5</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {showStatus && review.moderation_note ? (
        <p className="mt-4 rounded-control bg-warning-50 p-3 text-small text-ink-800">
          <span className="font-semibold">{dict.reviews.moderatorNote}: </span>{review.moderation_note}
        </p>
      ) : null}

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3">
        {review.status === "published" ? (
          <div className="flex items-center gap-4">
            <HelpfulButton reviewId={review.id} initialCount={review.helpful_count} ownerId={review.user_id} />
            <ReportButton entityType="review" entityId={review.id} />
          </div>
        ) : <span />}
        {actions}
      </footer>
    </article>
  );
}
