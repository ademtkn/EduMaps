import { Bus, Clock, GraduationCap, MapPin, Trophy } from "lucide-react";
import Link from "next/link";
import { localizedPath, type Lang } from "@/lib/i18n/config";
import { fmt } from "@/lib/i18n/fmt";
import { feeLabels, formatFee, formatMonthlyEquivalent } from "@/lib/fees";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { tr } from "@/lib/i18n/localized";
import { formatSchedule } from "@/lib/schedule";
import type { SchoolCardData } from "@/lib/data/types";
import { CompareButton } from "@/components/compare/compare-button";
import { Badge } from "@/components/ui/badge";
import { MediaImage } from "@/components/ui/media-image";
import { GradeBadge } from "@/components/ui/grade-badge";
import { FavoriteButton } from "./favorite-button";

export function gradeRange(dict: Dictionary, from: number, to: number) {
  return fmt(dict.common.grades, { from, to });
}

/** Grade range, or a "pending" label for profiles whose details have not been confirmed with the school. */
export function gradeRangeFor(dict: Dictionary, school: { data_status: string; grade_from: number; grade_to: number }) {
  return school.data_status === "unverified" ? dict.school.infoPending : gradeRange(dict, school.grade_from, school.grade_to);
}

export function SchoolCard({ school, lang, dict, priority = false, rank }: { school: SchoolCardData; lang: Lang; dict: Dictionary; priority?: boolean; rank?: number }) {
  const name = tr(school.name, lang);
  const types = dict.schools.types as Record<string, string>;
  const langNames = dict.schools.languageNames as Record<string, string>;
  const systems = dict.schools.systems as Record<string, string>;
  const languages = [...school.school_languages].sort((a, b) => Number(b.is_primary) - Number(a.is_primary));

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-card border border-ink-200 bg-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-brand-100 to-leaf-100">
        {school.cover_url ? (
          <MediaImage
            src={school.cover_url}
            alt=""
            fill
            sizes="(min-width: 1280px) 384px, (min-width: 768px) 33vw, 100vw"
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : null}
        <div className="absolute left-3 top-3 flex items-center gap-2">
          {rank && school.rating_count > 0 ? <span className="rounded-lg bg-brand-900/90 px-2.5 py-1 text-small font-extrabold text-white shadow-sm backdrop-blur">{fmt(dict.rankings.rank, { n: rank })}</span> : null}
          <Badge tone="outline" className="border-white/0 bg-white/95 shadow-sm">{types[school.school_type]}</Badge>
        </div>
        {school.data_status !== "verified" ? (
          <span className="absolute bottom-3 left-3 rounded-md bg-warning-50/95 px-2 py-0.5 text-caption font-semibold text-warning-700 shadow-sm">
            {school.data_status === "demo" ? dict.schools.badgeDemo : dict.schools.badgeUnverified}
          </span>
        ) : null}
        <div className="absolute right-3 top-3">
          <FavoriteButton kind="school" id={school.id} />
        </div>
      </div>

      <div className="relative flex flex-1 flex-col px-5 pb-5 pt-9">
        <div className="absolute -top-7 left-5 size-14 overflow-hidden rounded-xl border-2 border-white bg-white shadow-card">
          {school.logo_url ? (
            <MediaImage src={school.logo_url} alt="" width={56} height={56} className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center bg-brand-700 text-h3 font-bold text-white">{name.charAt(0)}</span>
          )}
        </div>

        <div className="absolute right-4 top-3 text-right">
          <GradeBadge score={school.rating_avg} count={school.rating_count} size="md" />
        </div>

        <h3 className="pr-16 text-h3 font-semibold leading-snug">
          <Link
            href={localizedPath(lang, `/schools/${school.slug}`)}
            className="after:absolute after:inset-0 after:content-[''] hover:text-brand-700"
          >
            {name}
          </Link>
        </h3>

        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-ink-600">
          <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{tr(school.cities.name, lang)}</span>
          <span className="inline-flex items-center gap-1"><GraduationCap className="size-3.5" />{gradeRangeFor(dict, school)}</span>
        </p>

        {formatSchedule(school, lang) ? (
          <p className="mt-1.5 flex items-center gap-1 text-small text-ink-600" title={dict.school.schoolDay}>
            <Clock className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="sr-only">{dict.school.schoolDay}: </span>{formatSchedule(school, lang)}
          </p>
        ) : null}

        <p className="mt-3 text-caption font-medium text-ink-600">
          {school.rating_count > 0
            ? `${fmt(dict.grades.outOf, { score: school.rating_avg.toFixed(1) })} · ${fmt(dict.common.reviewsCount, { count: school.rating_count })}`
            : dict.grades.notGraded}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {languages.slice(0, 3).map((l) => (
            <Badge key={l.language_code} tone="brand">{langNames[l.language_code] ?? l.language_code}</Badge>
          ))}
          {school.education_systems.slice(0, 2).map((s) => (
            <Badge key={s} tone="leaf">{systems[s] ?? s}</Badge>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3 text-ink-500">
          {school.has_transportation ? <Bus className="size-4" aria-label={dict.school.transportAvailable} /> : null}
          {school.has_sports ? <Trophy className="size-4" aria-label={dict.schools.sports} /> : null}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <p className="text-small font-semibold text-ink-900">{formatFee(school, lang, feeLabels(dict))}</p>
            {formatMonthlyEquivalent(school, lang, feeLabels(dict)) ? (
              <p className="text-caption text-ink-500">{formatMonthlyEquivalent(school, lang, feeLabels(dict))}</p>
            ) : null}
          </div>
          <CompareButton slug={school.slug} schoolId={school.id} />
        </div>
      </div>
    </article>
  );
}
