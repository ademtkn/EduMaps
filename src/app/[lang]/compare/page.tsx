import { Check, Minus, Scale } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AddToCompare, CompareSync, RemoveFromCompare } from "@/components/compare/compare-controls";
import { gradeRangeFor } from "@/components/schools/school-card";
import { ViewTracker } from "@/components/seo/view-tracker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LLink } from "@/components/ui/localized-link";
import { MediaImage } from "@/components/ui/media-image";
import { RatingBadge } from "@/components/ui/rating";
import { PageHeader } from "@/components/ui/section";
import { getSchoolsBySlugs, listSchoolOptions } from "@/lib/data/schools";
import type { SchoolDetail } from "@/lib/data/types";
import { MAX_COMPARE } from "@/lib/constants";
import { isLang, localizedPath } from "@/lib/i18n/config";
import { formatSchedule } from "@/lib/schedule";
import { feeLabels, formatExtra, formatFee, formatYearlyEstimate } from "@/lib/fees";
import { formatNumber } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { tr } from "@/lib/i18n/localized";
import { buildMetadata } from "@/lib/seo/metadata";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<{ s?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const dict = await getDictionary(lang);
  return buildMetadata({ lang, path: "/compare", title: dict.compare.title, description: dict.compare.description, noindex: true });
}

function parseSlugs(raw: string | undefined): string[] {
  return [...new Set((raw ?? "").split(",").map((s) => s.trim()).filter((s) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s)))].slice(0, MAX_COMPARE);
}

function Row({ label, children, cols }: { label: string; children: ReactNode[]; cols: number }) {
  return (
    <tr className="border-t border-ink-200 align-top">
      <th scope="row" className="sticky left-0 z-10 w-36 min-w-36 bg-ink-50 px-4 py-4 text-left text-small font-semibold text-ink-700 sm:w-44">{label}</th>
      {children.map((cell, i) => <td key={i} className="min-w-52 px-4 py-4 text-small text-ink-800" style={{ width: `${100 / cols}%` }}>{cell}</td>)}
    </tr>
  );
}

export default async function ComparePage({ params, searchParams }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const slugs = parseSlugs((await searchParams).s);
  const [dict, schools, options] = await Promise.all([getDictionary(lang), getSchoolsBySlugs(slugs), listSchoolOptions()]);
  const current = schools.map((s) => s.slug);
  const none = <span className="text-ink-400">{dict.compare.none}</span>;

  const types = dict.schools.types as Record<string, string>;
  const systems = dict.schools.systems as Record<string, string>;
  const langNames = dict.schools.languageNames as Record<string, string>;
  const facilityNames = dict.school.facilityNames as Record<string, string>;
  const labels = feeLabels(dict);

  const lowestTuition = Math.min(...schools.map((s) => s.tuition_min ?? Number.POSITIVE_INFINITY));
  const topRating = Math.max(...schools.map((s) => (s.rating_count > 0 ? s.rating_avg : 0)));
  const list = (items: string[]) => items.length ? <ul className="space-y-1">{items.map((i) => <li key={i}>{i}</li>)}</ul> : none;
  const yes = (v: boolean, pending = false, detail?: string) => pending ? (
    <span className="text-ink-500">{dict.school.infoPending}</span>
  ) : (
    <span className={cn("inline-flex items-start gap-1.5", v ? "text-leaf-700" : "text-ink-500")}>
      {v ? <Check className="mt-0.5 size-4 shrink-0" /> : <Minus className="mt-0.5 size-4 shrink-0" />}
      <span>{v ? (detail || dict.common.yes) : dict.common.no}</span>
    </span>
  );
  const byKind = (s: SchoolDetail, kind: "academic" | "club" | "sport") => s.school_programs.filter((p) => p.kind === kind).map((p) => tr(p.name, lang));
  const facilityKeys = [...new Set([...dict.catalog.facilities, ...schools.flatMap((s) => s.school_facilities.map((f) => f.facility_key))])].filter((k) => schools.some((s) => s.school_facilities.some((f) => f.facility_key === k)));

  return (
    <>
      <ViewTracker type="compare" dedupe={slugs.join(",")} />
      <CompareSync />
      <PageHeader title={dict.compare.title} description={dict.compare.description}>
        {schools.length > 0 ? <div className="mt-5"><AddToCompare current={current} options={options.map((o) => ({ slug: o.slug, label: `${tr(o.name, lang)} — ${tr(o.city, lang)}` }))} /></div> : null}
      </PageHeader>

      <div className="container-page py-8">
        {schools.length === 0 ? (
          <EmptyState
            icon={<Scale className="size-6" />}
            title={dict.compare.emptyTitle}
            description={dict.compare.emptyDescription}
            action={<Button asChild><LLink href="/schools">{dict.compare.browse}</LLink></Button>}
          />
        ) : (
          <>
            {schools.length < 2 ? <p className="mb-4 text-small text-ink-600">{dict.compare.needTwo}</p> : null}
            <div className="overflow-x-auto rounded-card border border-ink-200 bg-white shadow-card">
              <table className="w-full min-w-max border-collapse sm:min-w-0">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-ink-50 px-4 py-4 text-left text-small font-semibold text-ink-500">{dict.compare.feature}</th>
                    {schools.map((s) => (
                      <th key={s.id} scope="col" className="min-w-52 px-4 py-4 text-left align-top" style={{ width: `${100 / schools.length}%` }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="size-12 overflow-hidden rounded-xl border border-ink-200 bg-brand-700">
                            {s.logo_url ? <MediaImage src={s.logo_url} alt="" width={48} height={48} className="size-full object-cover" /> : null}
                          </div>
                          <RemoveFromCompare slug={s.slug} current={current} />
                        </div>
                        <Link href={localizedPath(lang, `/schools/${s.slug}`)} className="mt-3 block text-body font-semibold text-ink-900 hover:text-brand-700">{tr(s.name, lang)}</Link>
                        <p className="mt-0.5 text-small font-normal text-ink-600">{tr(s.cities.name, lang)}</p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <Row cols={schools.length} label={dict.compare.rating}>
                    {schools.map((s) => (
                      <div key={s.id} className="space-y-1">
                        <RatingBadge value={s.rating_avg} count={s.rating_count} emptyLabel={dict.common.notRatedYet} />
                        {s.rating_count > 0 && s.rating_avg === topRating && schools.length > 1 ? <Badge tone="success">{dict.compare.topRated}</Badge> : null}
                      </div>
                    ))}
                  </Row>
                  <Row cols={schools.length} label={dict.compare.type}>{schools.map((s) => <span key={s.id}>{types[s.school_type]}</span>)}</Row>
                  <Row cols={schools.length} label={dict.compare.system}>{schools.map((s) => <div key={s.id}>{list(s.education_systems.map((e) => systems[e] ?? e))}</div>)}</Row>
                  <Row cols={schools.length} label={dict.compare.schedule}>{schools.map((s) => <span key={s.id}>{formatSchedule(s, lang) ?? none}</span>)}</Row>
                  <Row cols={schools.length} label={dict.compare.grades}>{schools.map((s) => <span key={s.id}>{gradeRangeFor(dict, s)}</span>)}</Row>
                  <Row cols={schools.length} label={dict.compare.feeAdvertised}>
                    {schools.map((s) => <p key={s.id} className="font-semibold">{formatFee(s, lang, labels)}</p>)}
                  </Row>
                  <Row cols={schools.length} label={dict.compare.monthlyEquivalent}>
                    {schools.map((s) => (
                      <div key={s.id} className="space-y-1">
                        <p className="font-semibold">
                          {s.fee_period === "month" ? "" : "≈ "}
                          {formatFee({ fee_min: s.tuition_min, fee_max: s.tuition_max, fee_period: "month" }, lang, labels)}
                        </p>
                        {s.tuition_min === lowestTuition && schools.length > 1 && Number.isFinite(lowestTuition) ? <Badge tone="success">{dict.compare.bestValue}</Badge> : null}
                      </div>
                    ))}
                  </Row>
                  <Row cols={schools.length} label={dict.compare.yearlyEstimate}>
                    {schools.map((s) => <span key={s.id}>{formatYearlyEstimate(s, lang, labels) ?? none}</span>)}
                  </Row>
                  <Row cols={schools.length} label={dict.compare.included}>
                    {schools.map((s) => {
                      const keys = s.school_fee_items.filter((i) => i.included).map((i) => i.item_key);
                      return <div key={s.id}>{keys.length ? list(keys.map((k) => dict.school.feeItemNames[k] ?? k)) : none}</div>;
                    })}
                  </Row>
                  <Row cols={schools.length} label={dict.compare.paidSeparately}>
                    {schools.map((s) => {
                      const rows = s.school_fee_items.filter((i) => !i.included);
                      return <div key={s.id}>{rows.length ? list(rows.map((i) => `${dict.school.feeItemNames[i.item_key] ?? i.item_key}${formatExtra(i, lang, labels) ? ` · ${formatExtra(i, lang, labels)}` : ""}`)) : none}</div>;
                    })}
                  </Row>
                  <Row cols={schools.length} label={dict.compare.languages}>
                    {schools.map((s) => <div key={s.id}>{list(s.school_languages.map((l) => langNames[l.language_code] ?? l.language_code))}</div>)}
                  </Row>
                  <Row cols={schools.length} label={dict.compare.programs}>{schools.map((s) => <div key={s.id}>{list(byKind(s, "academic"))}</div>)}</Row>
                  <Row cols={schools.length} label={dict.compare.clubs}>{schools.map((s) => <div key={s.id}>{list(byKind(s, "club"))}</div>)}</Row>
                  <Row cols={schools.length} label={dict.compare.sports}>{schools.map((s) => <div key={s.id}>{list(byKind(s, "sport"))}</div>)}</Row>
                  {facilityKeys.length ? (
                    <Row cols={schools.length} label={dict.compare.facilities}>
                      {schools.map((s) => (
                        <ul key={s.id} className="space-y-1.5">
                          {facilityKeys.map((k) => {
                            const has = s.school_facilities.some((f) => f.facility_key === k);
                            return (
                              <li key={k} className={cn("flex items-center gap-1.5", has ? "text-ink-800" : "text-ink-400")}>
                                {has ? <Check className="size-4 text-leaf-600" /> : <Minus className="size-4" />}{facilityNames[k]}
                              </li>
                            );
                          })}
                        </ul>
                      ))}
                    </Row>
                  ) : null}
                  <Row cols={schools.length} label={dict.compare.transport}>{schools.map((s) => <div key={s.id}>{yes(s.has_transportation, s.data_status === "unverified")}</div>)}</Row>
                  <Row cols={schools.length} label={dict.compare.boarding}>{schools.map((s) => <div key={s.id}>{yes(s.has_boarding, s.data_status === "unverified")}</div>)}</Row>
                  <Row cols={schools.length} label={dict.compare.scholarships}>{schools.map((s) => <div key={s.id}>{yes(s.has_scholarships, s.data_status === "unverified")}</div>)}</Row>
                  <Row cols={schools.length} label={dict.compare.students}>{schools.map((s) => <span key={s.id}>{s.student_count ? formatNumber(s.student_count, lang) : none}</span>)}</Row>
                  <Row cols={schools.length} label={dict.compare.classSize}>{schools.map((s) => <span key={s.id}>{s.avg_class_size ?? none}</span>)}</Row>
                  <Row cols={schools.length} label={dict.compare.founded}>{schools.map((s) => <span key={s.id}>{s.founded_year ?? none}</span>)}</Row>
                  <Row cols={schools.length} label={dict.compare.location}>
                    {schools.map((s) => <span key={s.id}>{s.school_locations ? tr(s.school_locations.address, lang) : none}</span>)}
                  </Row>
                  <Row cols={schools.length} label={dict.compare.reviews}>
                    {schools.map((s) => (
                      <Button key={s.id} asChild variant="outline" size="sm"><LLink href={`/schools/${s.slug}#reviews`}>{dict.school.reviews}</LLink></Button>
                    ))}
                  </Row>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
