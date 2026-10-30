import { Bus, CalendarDays, Clock, ExternalLink, FileText, Globe, MessageCircle, GraduationCap, Mail, MapPin, Phone, School as SchoolIcon, Users } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AdSlot } from "@/components/ads/ad-slot";
import { CompareButton } from "@/components/compare/compare-button";
import { SchoolLocationMap } from "@/components/map/school-location-map";
import { DirectionsMenu } from "@/components/schools/directions-menu";
import { googleMapsUrl, googleSearchUrl, twoGisUrl } from "@/lib/maps";
import { MyReviewPanel } from "@/components/reviews/review-section";
import { ReviewCard } from "@/components/reviews/review-card";
import { ReviewsMore } from "@/components/reviews/reviews-more";
import { FacilityIcon } from "@/components/schools/facility-icons";
import { CorrectionDialog } from "@/components/schools/correction-dialog";
import { FeeCoverage } from "@/components/schools/fee-coverage";
import { FavoriteButton } from "@/components/schools/favorite-button";
import { SchoolCard, gradeRange } from "@/components/schools/school-card";
import { ReportCard } from "@/components/schools/report-card";
import { SchoolGallery } from "@/components/schools/school-gallery";
import { GradeBadge } from "@/components/ui/grade-badge";
import { SectionNav } from "@/components/schools/section-nav";
import { VideoEmbed } from "@/components/schools/video-embed";
import { JsonLd } from "@/components/seo/json-ld";
import { SchoolTracker } from "@/components/seo/school-tracker";
import { TrackedLink } from "@/components/seo/tracked-link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { LLink } from "@/components/ui/localized-link";
import { MediaImage } from "@/components/ui/media-image";
import { Stars } from "@/components/ui/rating";
import { getAllSchoolSlugs, getCategoryScores, getRelatedSchools, getSchoolBySlug, getSchoolReviews } from "@/lib/data/schools";
import { LANGS, isLang, localizedPath } from "@/lib/i18n/config";
import { fmt } from "@/lib/i18n/fmt";
import { documentHost } from "@/lib/documents";
import { formatSchedule } from "@/lib/schedule";
import { whatsappUrl } from "@/lib/whatsapp";
import { feeLabels, formatFee, formatMonthlyEquivalent, formatYearlyEstimate } from "@/lib/fees";
import { formatDate, formatNumber } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { districtKey } from "@/lib/constants";
import { tr } from "@/lib/i18n/localized";
import { sanitizeUrl } from "@/lib/security/sanitize";
import { breadcrumbLd, faqLd, schoolLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";
import { absoluteUrl, youtubeEmbedUrl } from "@/lib/utils";

export const revalidate = 300;

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateStaticParams() {
  try {
    const slugs = await getAllSchoolSlugs({ includeDemo: true });
    return LANGS.flatMap((lang) => slugs.map((s) => ({ lang, slug: s.slug })));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLang(lang)) return {};
  const school = await getSchoolBySlug(slug);
  if (!school) return {};
  const dict = await getDictionary(lang);
  const name = tr(school.name, lang);
  const city = tr(school.cities.name, lang);
  const summary = tr(school.tagline, lang) || tr(school.about, lang);
  const rating = school.rating_count > 0 ? ` ★ ${school.rating_avg.toFixed(1)} (${school.rating_count})` : "";
  return buildMetadata({
    lang,
    path: `/schools/${slug}`,
    title: `${name} — ${city}`,
    description: `${name}, ${city}.${rating} ${summary}`.trim() || dict.meta.defaultDescription,
    image: school.cover_url,
    noindex: school.data_status === "demo",
  });
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-32">
      <h2 className="mb-5 text-h2 font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-card border border-ink-200 bg-white p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 [&_svg]:size-5">{icon}</span>
      <div className="min-w-0">
        <dt className="text-caption text-ink-500">{label}</dt>
        <dd className="mt-0.5 text-small font-semibold text-ink-900">{value}</dd>
      </div>
    </div>
  );
}

export default async function SchoolPage({ params }: Props) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  const school = await getSchoolBySlug(slug);
  if (!school) notFound();

  const [dict, related, reviews, categoryScores] = await Promise.all([getDictionary(lang), getRelatedSchools(school), getSchoolReviews(school.id, 1, 8), getCategoryScores(school.id)]);

  const name = tr(school.name, lang);
  const city = tr(school.cities.name, lang);
  const province = school.cities.provinces!;
  const loc = school.school_locations;
  const address = loc ? tr(loc.address, lang) : "";
  // Show the district only when the address text does not already name it.
  const dKey = districtKey(loc?.district);
  const districtName = dKey ? dict.schools.districts[dKey] : (loc?.district ?? "");
  const showDistrict = Boolean(districtName) && !address.toLowerCase().includes(districtName.toLowerCase().slice(0, 5));
  const types = dict.schools.types as Record<string, string>;
  const systems = dict.schools.systems as Record<string, string>;
  const langNames = dict.schools.languageNames as Record<string, string>;
  const facilityNames = dict.school.facilityNames as Record<string, string>;

  const programs = school.school_programs.filter((p) => p.kind === "academic");
  const clubs = school.school_programs.filter((p) => p.kind === "club");
  const sports = school.school_programs.filter((p) => p.kind === "sport");
  const photos = school.school_media.filter((m) => m.kind === "image").map((m) => ({ id: m.id, url: m.url, caption: tr(m.caption, lang) }));
  const videos = school.school_media
    .filter((m) => m.kind === "video")
    .map((m) => ({ id: m.id, embed: youtubeEmbedUrl(m.url), title: tr(m.caption, lang) || name }))
    .filter((v): v is { id: string; embed: string; title: string } => Boolean(v.embed));
  const languages = [...school.school_languages].sort((a, b) => Number(b.is_primary) - Number(a.is_primary));
  const faqs = school.school_faqs.map((f) => ({ id: f.id, question: tr(f.question, lang), answer: tr(f.answer, lang) })).filter((f) => f.question && f.answer);
  const social = Object.entries(school.social ?? {}).flatMap(([key, value]) => {
    const url = typeof value === "string" ? sanitizeUrl(value) : null;
    return url ? [{ key, url }] : [];
  });
  const about = tr(school.about, lang);
  const labels = feeLabels(dict);
  const tuitionLabel = formatFee(school, lang, labels);
  const monthlyEquivalent = formatMonthlyEquivalent(school, lang, labels);
  const yearlyLabel = formatYearlyEstimate(school, lang, labels);

  const nav = [
    { id: "overview", label: dict.school.overview },
    about ? { id: "about", label: dict.school.about } : null,
    programs.length ? { id: "programs", label: dict.school.programs } : null,
    { id: "languages", label: dict.school.languages },
    school.school_facilities.length ? { id: "facilities", label: dict.school.facilities } : null,
    sports.length || clubs.length ? { id: "activities", label: `${dict.school.sports} & ${dict.school.clubs}` } : null,
    { id: "tuition", label: dict.school.tuition },
    { id: "transportation", label: dict.school.transportation },
    school.school_documents.length ? { id: "documents", label: dict.school.documents } : null,
    photos.length ? { id: "gallery", label: dict.school.gallery } : null,
    videos.length ? { id: "videos", label: dict.school.videos } : null,
    loc ? { id: "location", label: dict.school.location } : null,
    { id: "reviews", label: `${dict.school.reviews} (${school.rating_count})` },
    faqs.length ? { id: "faq", label: dict.school.faq } : null,
  ].filter((n): n is { id: string; label: string } => Boolean(n));

  const schoolUrl = absoluteUrl(localizedPath(lang, `/schools/${school.slug}`));
  const whatsappHref = school.whatsapp ? whatsappUrl(school.whatsapp, fmt(dict.school.whatsappMessage, { name, url: schoolUrl })) : null;
  const coords = loc && loc.lat != null && loc.lng != null ? { lat: Number(loc.lat), lng: Number(loc.lng) } : null;
  // The links an administrator pasted from the apps are used as they are; otherwise they are built from the coordinates, or the address.
  const googleHref = loc?.google_maps_url ?? (coords ? googleMapsUrl(coords.lat, coords.lng) : address ? googleSearchUrl(`${address}, ${city}`) : null);
  const twogisHref = loc?.twogis_url ?? (coords ? twoGisUrl(coords.lat, coords.lng) : null);

  return (
    <>
      <SchoolTracker schoolId={school.id} />

      <header className="relative bg-brand-900 text-white">
        <div className="absolute inset-0 overflow-hidden">
          {school.cover_url ? <MediaImage src={school.cover_url} alt="" fill priority sizes="100vw" className="object-cover opacity-40" /> : null}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/60 to-brand-900/30" />
        </div>
        <div className="container-page relative pb-8 pt-8 sm:pb-10 sm:pt-12">
          <Breadcrumbs
            tone="light"
            items={[
              { label: dict.nav.schools, href: "/schools" },
              { label: tr(province.name, lang), href: `/provinces/${province.slug}` },
              { label: city, href: `/cities/${school.cities.slug}` },
              { label: name },
            ]}
          />
          <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="size-20 shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-lift sm:size-24">
                {school.logo_url ? (
                  <MediaImage src={school.logo_url} alt="" width={96} height={96} priority className="size-full object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center bg-brand-700 text-display font-bold text-white">{name.charAt(0)}</span>
                )}
              </div>
              <div>
                <div className="mb-2 flex flex-wrap gap-2">
                  <Badge tone="outline" className="border-white/0 bg-white/95">{types[school.school_type]}</Badge>
                  {school.education_systems.map((s) => <Badge key={s} tone="leaf" className="bg-leaf-50/95">{systems[s]}</Badge>)}
                </div>
                <h1 className="text-h1 font-bold text-white sm:text-[2.5rem]">{name}</h1>
                {tr(school.tagline, lang) ? <p className="mt-2 max-w-2xl text-body text-brand-100">{tr(school.tagline, lang)}</p> : null}
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-small text-brand-100">
                  <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{city}</span>
                  {school.rating_count > 0 ? (
                    <a href="#reviews" className="inline-flex items-center gap-2 hover:text-white">
                      <Stars value={school.rating_avg} />
                      <strong className="text-white">{school.rating_avg.toFixed(1)}</strong>
                      <span>({fmt(dict.common.reviewsCount, { count: school.rating_count })})</span>
                    </a>
                  ) : <span>{dict.common.notRatedYet}</span>}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <GradeBadge score={school.rating_avg} count={school.rating_count} size="lg" className="mr-2 hidden sm:inline-flex" />
              <FavoriteButton kind="school" id={school.id} variant="button" className="bg-white" />
              <CompareButton slug={school.slug} schoolId={school.id} size="md" className="bg-white" />
              <Button asChild variant="secondary"><a href="#reviews">{dict.school.writeReview}</a></Button>
            </div>
          </div>
        </div>
      </header>

      {school.data_status !== "verified" ? (
        <div className="border-b border-warning-500/30 bg-warning-50">
          <p className="container-page py-3 text-small text-ink-800">{dict.school.dataStatus[school.data_status]}</p>
        </div>
      ) : null}

      <SectionNav items={nav} label={dict.school.jumpTo} />

      <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-14">
          <Section id="overview" title={dict.school.overview}>
            <div className="mb-6"><ReportCard dict={dict} score={school.rating_avg} count={school.rating_count} categories={categoryScores} /></div>
            <dl className="grid gap-3 sm:grid-cols-2">
              {school.data_status !== "unverified" ? <Fact icon={<GraduationCap />} label={dict.school.grades} value={gradeRange(dict, school.grade_from, school.grade_to)} /> : null}
              <Fact icon={<SchoolIcon />} label={dict.schools.type} value={types[school.school_type]} />
              {formatSchedule(school, lang) ? <Fact icon={<Clock />} label={dict.school.schoolDay} value={formatSchedule(school, lang)!} /> : null}
              {school.founded_year ? <Fact icon={<CalendarDays />} label={dict.school.founded} value={school.founded_year} /> : null}
              {school.student_count ? <Fact icon={<Users />} label={dict.school.students} value={formatNumber(school.student_count, lang)} /> : null}
              {school.teacher_count ? <Fact icon={<Users />} label={dict.school.teachers} value={formatNumber(school.teacher_count, lang)} /> : null}
              {school.avg_class_size ? <Fact icon={<Users />} label={dict.school.classSize} value={school.avg_class_size} /> : null}
            </dl>
            {tr(school.schedule_notes, lang) ? <p className="mt-3 whitespace-pre-line text-small text-ink-600">{tr(school.schedule_notes, lang)}</p> : null}
          </Section>

          {about ? (
            <Section id="about" title={dict.school.about}>
              <div className="prose-edu whitespace-pre-line">{about}</div>
            </Section>
          ) : null}

          {programs.length ? (
            <Section id="programs" title={dict.school.programs}>
              <ul className="grid gap-3 sm:grid-cols-2">
                {programs.map((p) => (
                  <li key={p.id} className="rounded-card border border-ink-200 bg-white p-4">
                    <p className="font-semibold text-ink-900">{tr(p.name, lang)}</p>
                    {tr(p.description, lang) ? <p className="mt-1 text-small text-ink-600">{tr(p.description, lang)}</p> : null}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          <Section id="languages" title={dict.school.languages}>
            <div className="flex flex-wrap gap-2">
              {languages.map((l) => (
                <Badge key={l.language_code} tone={l.is_primary ? "brand" : "neutral"} className="px-3 py-1 text-small">
                  {langNames[l.language_code] ?? l.language_code}{l.is_primary ? ` · ${dict.school.primaryLanguage}` : ""}
                </Badge>
              ))}
            </div>
          </Section>

          {school.school_facilities.length ? (
            <Section id="facilities" title={dict.school.facilities}>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {school.school_facilities.map((f) => (
                  <li key={f.id} className="flex items-start gap-3 rounded-card border border-ink-200 bg-white p-4">
                    <FacilityIcon name={dict.catalog.facilityIcons[f.facility_key] ?? f.facility_key} className="mt-0.5 size-5 shrink-0 text-leaf-600" />
                    <div>
                      <p className="text-small font-semibold text-ink-900">{facilityNames[f.facility_key] ?? f.facility_key}</p>
                      {tr(f.note, lang) ? <p className="mt-0.5 text-caption text-ink-600">{tr(f.note, lang)}</p> : null}
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {sports.length || clubs.length ? (
            <Section id="activities" title={`${dict.school.sports} & ${dict.school.clubs}`}>
              <div className="grid gap-8 sm:grid-cols-2">
                {[[dict.school.sports, sports], [dict.school.clubs, clubs]].map(([title, list]) =>
                  (list as typeof sports).length ? (
                    <div key={title as string}>
                      <h3 className="mb-3 text-h3 font-semibold">{title as string}</h3>
                      <ul className="space-y-2">
                        {(list as typeof sports).map((p) => (
                          <li key={p.id} className="flex items-start gap-2 text-small text-ink-700">
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-leaf-500" />
                            <span><strong className="font-semibold text-ink-900">{tr(p.name, lang)}</strong>{tr(p.description, lang) ? ` — ${tr(p.description, lang)}` : ""}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null
                )}
              </div>
            </Section>
          ) : null}

          <Section id="tuition" title={dict.school.tuition}>
            <Card>
              <CardBody>
                <p className="text-caption font-medium uppercase tracking-wide text-ink-500">{dict.school.feeSetBySchool}</p>
                <p className="mt-1 text-h1 font-bold text-brand-800">{tuitionLabel}</p>
                {monthlyEquivalent || yearlyLabel ? (
                  <dl className="mt-3 space-y-1 text-small text-ink-700">
                    {monthlyEquivalent ? <div className="flex flex-wrap gap-x-2"><dt className="text-ink-500">{dict.school.feeMonthlyEquivalent}:</dt><dd className="font-semibold">{monthlyEquivalent}</dd></div> : null}
                    {yearlyLabel && school.fee_period !== "year" ? <div className="flex flex-wrap gap-x-2"><dt className="text-ink-500">{dict.school.feeYearlyEstimate}:</dt><dd className="font-semibold">{yearlyLabel}</dd></div> : null}
                  </dl>
                ) : null}
                {monthlyEquivalent || yearlyLabel ? <p className="mt-2 text-caption text-ink-500">{fmt(dict.school.feeConversionNote, { months: school.fee_billing_months })}</p> : null}
                <FeeCoverage dict={dict} lang={lang} items={school.school_fee_items} />
                {tr(school.tuition_notes, lang) ? (
                  <div className="mt-4 border-t border-ink-200 pt-4">
                    <p className="text-small font-semibold text-ink-900">{dict.school.tuitionNotes}</p>
                    <p className="mt-1 whitespace-pre-line text-small text-ink-700">{tr(school.tuition_notes, lang)}</p>
                  </div>
                ) : null}
                <div className="mt-5 border-t border-ink-200 pt-4">
                  <h3 className="text-h3 font-semibold">{dict.school.scholarships}</h3>
                  {school.has_scholarships ? (
                    <>
                      <Badge tone="success" className="mt-2">{dict.school.scholarshipsAvailable}</Badge>
                      {tr(school.scholarships, lang) ? <p className="mt-2 whitespace-pre-line text-small text-ink-700">{tr(school.scholarships, lang)}</p> : null}
                    </>
                  ) : <p className="mt-2 text-small text-ink-600">{school.data_status === "unverified" ? dict.school.infoPending : dict.school.noScholarships}</p>}
                </div>
              </CardBody>
            </Card>
          </Section>

          <Section id="transportation" title={dict.school.transportation}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Card><CardBody className="p-5">
                <p className="flex items-center gap-2 font-semibold text-ink-900"><Bus className="size-5 text-brand-700" />{school.has_transportation ? dict.school.transportAvailable : school.data_status === "unverified" ? dict.school.infoPending : dict.school.transportNone}</p>
                {tr(school.transportation_info, lang) ? <p className="mt-2 whitespace-pre-line text-small text-ink-700">{tr(school.transportation_info, lang)}</p> : null}
              </CardBody></Card>
              <Card><CardBody className="p-5">
                <p className="flex items-center gap-2 font-semibold text-ink-900"><SchoolIcon className="size-5 text-brand-700" />{school.has_boarding ? dict.school.boardingAvailable : school.data_status === "unverified" ? dict.school.infoPending : dict.school.boardingNone}</p>
                {tr(school.boarding_info, lang) ? <p className="mt-2 whitespace-pre-line text-small text-ink-700">{tr(school.boarding_info, lang)}</p> : null}
              </CardBody></Card>
            </div>
          </Section>

          {school.school_documents.length ? (
            <Section id="documents" title={dict.school.documents}>
              <ul className="divide-y divide-ink-200 rounded-card border border-ink-200 bg-white shadow-card">
                {school.school_documents.map((d) => (
                  <li key={d.id}>
                    <TrackedLink schoolId={school.id} kind="document" href={d.url} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-ink-50">
                      <span className="flex min-w-0 items-center gap-3">
                        <FileText className="size-5 shrink-0 text-brand-700" aria-hidden="true" />
                        <span className="truncate font-semibold text-ink-900">{d.title}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5 text-caption text-ink-500">{fmt(dict.school.documentOpens, { host: documentHost(d.url) })}<ExternalLink className="size-3.5" aria-hidden="true" /></span>
                    </TrackedLink>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-caption text-ink-500">{dict.school.documentNote}</p>
            </Section>
          ) : null}

          {photos.length ? <Section id="gallery" title={dict.school.gallery}><SchoolGallery photos={photos} /></Section> : null}

          {videos.length ? (
            <Section id="videos" title={dict.school.videos}>
              <div className="grid gap-4 sm:grid-cols-2">
                {videos.map((v) => <VideoEmbed key={v.id} embedUrl={v.embed} title={v.title} />)}
              </div>
            </Section>
          ) : null}

          {loc ? (
            <Section id="location" title={dict.school.location}>
              {coords ? <SchoolLocationMap lat={coords.lat} lng={coords.lng} name={name} googleKey={process.env.GOOGLE_MAPS_KEY ?? ""} mapId={process.env.GOOGLE_MAP_ID || undefined} /> : null}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-start gap-2 text-small text-ink-700"><MapPin className="mt-0.5 size-4 shrink-0 text-ink-500" />{address}</p>
                <div className="flex flex-wrap gap-2">
                  {coords ? <Button asChild variant="outline" size="sm"><LLink href="/map"><MapPin />{dict.school.openMap}</LLink></Button> : null}
                  {googleHref ? (
                    <Button asChild variant="outline" size="sm"><TrackedLink schoolId={school.id} kind="google_maps" href={googleHref} target="_blank" rel="noopener noreferrer">{coords || loc?.google_maps_url ? dict.school.openGoogle : dict.school.findOnGoogle}</TrackedLink></Button>
                  ) : null}
                  {twogisHref ? (
                    <Button asChild variant="outline" size="sm"><TrackedLink schoolId={school.id} kind="gis2" href={twogisHref} target="_blank" rel="noopener noreferrer">{dict.school.open2gis}</TrackedLink></Button>
                  ) : null}
                  {coords ? <DirectionsMenu schoolId={school.id} lat={coords.lat} lng={coords.lng} /> : null}
                </div>
              </div>
            </Section>
          ) : null}

          <Section id="reviews" title={dict.school.reviews}>
            <div className="mb-6 flex flex-wrap items-center gap-5 rounded-card border border-ink-200 bg-white p-5 shadow-card">
              <p className="text-display font-bold leading-none text-brand-800">{school.rating_count > 0 ? school.rating_avg.toFixed(1) : "—"}</p>
              <div>
                <Stars value={school.rating_avg} size="lg" />
                <p className="mt-1 text-small text-ink-600">{school.rating_count > 0 ? fmt(dict.reviews.summary, { count: school.rating_count }) : dict.reviews.none}</p>
              </div>
            </div>
            <div className="space-y-4">
              <MyReviewPanel schoolId={school.id} />
              {reviews.items.map((review) => <ReviewCard key={review.id} review={review} />)}
              <ReviewsMore schoolId={school.id} offset={reviews.items.length} total={reviews.total} />
              {reviews.total === 0 ? <p className="text-center text-small text-ink-600">{dict.reviews.beFirst}</p> : null}
            </div>
          </Section>

          {faqs.length ? (
            <Section id="faq" title={dict.school.faq}>
              <Accordion type="single" collapsible className="rounded-card border border-ink-200 bg-white px-5">
                {faqs.map((f) => (
                  <AccordionItem key={f.id} value={f.id}>
                    <AccordionTrigger>{f.question}</AccordionTrigger>
                    <AccordionContent><p className="whitespace-pre-line">{f.answer}</p></AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Section>
          ) : null}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-36 lg:self-start">
          <Card>
            <CardBody className="space-y-4 p-5">
              <h2 className="text-h3 font-semibold">{dict.school.contact}</h2>
              <ul className="space-y-3 text-small">
                {address ? <li className="flex gap-2.5"><MapPin className="mt-0.5 size-4 shrink-0 text-ink-500" /><span>{address}{showDistrict ? <span className="block text-caption text-ink-500">{dict.schools.district}: {districtName}</span> : null}</span></li> : null}
                {school.phone ? <li className="flex gap-2.5"><Phone className="mt-0.5 size-4 shrink-0 text-ink-500" /><TrackedLink schoolId={school.id} kind="phone" className="font-medium text-brand-700 hover:underline" href={`tel:${school.phone.replace(/[^+\d]/g, "")}`}>{school.phone}</TrackedLink></li> : null}
                {school.email ? <li className="flex gap-2.5"><Mail className="mt-0.5 size-4 shrink-0 text-ink-500" /><TrackedLink schoolId={school.id} kind="email" className="break-all font-medium text-brand-700 hover:underline" href={`mailto:${school.email}`}>{school.email}</TrackedLink></li> : null}
                {school.website && sanitizeUrl(school.website) ? (
                  <li className="flex gap-2.5"><Globe className="mt-0.5 size-4 shrink-0 text-ink-500" />
                    <TrackedLink schoolId={school.id} kind="website" className="break-all font-medium text-brand-700 hover:underline" href={sanitizeUrl(school.website)!} target="_blank" rel="noopener noreferrer nofollow">{new URL(sanitizeUrl(school.website)!).hostname.replace(/^www\./, "")}</TrackedLink>
                  </li>
                ) : null}
              </ul>
              {whatsappHref ? (
                <Button asChild className="w-full bg-[#1f9d55] text-white hover:bg-[#188046]">
                  <TrackedLink schoolId={school.id} kind="whatsapp" href={whatsappHref} target="_blank" rel="noopener noreferrer"><MessageCircle />{dict.school.whatsapp}</TrackedLink>
                </Button>
              ) : null}
              {social.length ? (
                <div className="flex flex-wrap gap-2 border-t border-ink-200 pt-4">
                  {social.map((s) => (
                    <a key={s.key} href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="rounded-full border border-ink-200 px-3 py-1 text-caption font-semibold capitalize text-ink-700 hover:border-brand-300 hover:text-brand-700">{s.key}</a>
                  ))}
                </div>
              ) : null}
              <div className="flex flex-col gap-2 border-t border-ink-200 pt-4">
                <CorrectionDialog schoolId={school.id} />
              </div>
              <p className="border-t border-ink-200 pt-4 text-caption text-ink-500">
                {fmt(dict.school.lastUpdated, { date: formatDate(school.updated_at, lang) })} · {fmt(dict.school.viewsCount, { count: formatNumber(school.view_count, lang) })}
              </p>
            </CardBody>
          </Card>
          <AdSlot placement="sidebar" lang={lang} dict={dict} />
        </aside>
      </div>

      {related.length ? (
        <section id="related" className="container-page pb-6">
          <h2 className="mb-6 text-h2 font-semibold">{dict.school.related}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((s) => <SchoolCard key={s.id} school={s} lang={lang} dict={dict} />)}
          </div>
        </section>
      ) : null}

      <JsonLd
        data={[
          breadcrumbLd(
            [
              { name: dict.nav.schools, path: "/schools" },
              { name: tr(province.name, lang), path: `/provinces/${province.slug}` },
              { name: city, path: `/cities/${school.cities.slug}` },
              { name, path: `/schools/${slug}` },
            ],
            lang
          ),
          schoolLd({
            lang, slug, name,
            description: tr(school.tagline, lang) || about.slice(0, 300),
            image: school.cover_url, logo: school.logo_url, phone: school.phone, email: school.email, website: school.website,
            address, city, lat: coords?.lat ?? null, lng: coords?.lng ?? null,
            ratingAvg: school.rating_avg, ratingCount: school.rating_count,
            reviews: reviews.items.slice(0, 5).map((r) => ({
              author: r.profiles?.display_name ?? "Parent", rating: r.rating, title: r.title, body: r.body, date: r.created_at,
            })),
            languages: languages.map((l) => langNames[l.language_code] ?? l.language_code),
          }),
          ...(faqs.length ? [faqLd(faqs)] : []),
        ]}
      />
    </>
  );
}
