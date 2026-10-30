import { ArrowRight, Award, Building2, Bed, Globe2, Landmark, Trophy, MapPinned, MessagesSquare, ShieldCheck, Languages, Scale } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AdSlot } from "@/components/ads/ad-slot";
import { ArticleCard } from "@/components/education/article-card";
import { PostCard } from "@/components/community/post-card";
import { RotatingSchools } from "@/components/home/rotating-schools";
import { RotatingVoices } from "@/components/home/rotating-voices";
import { TrustSection } from "@/components/home/trust-section";
import { SearchBar } from "@/components/schools/search-bar";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section";
import { listArticles } from "@/lib/data/articles";
import { listPosts } from "@/lib/data/community";
import { listCities, schoolCountsByCity } from "@/lib/data/geo";
import { getRandomSchools, getSiteStats } from "@/lib/data/schools";
import { getPublicTestimonials } from "@/lib/data/testimonials";
import { getAds } from "@/lib/data/ads";
import { isLang, localizedPath } from "@/lib/i18n/config";
import { fmt } from "@/lib/i18n/fmt";
import { formatNumber } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { tr } from "@/lib/i18n/localized";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const dict = await getDictionary(lang);
  return buildMetadata({
    lang,
    path: "/",
    title: `${dict.meta.siteName} — ${dict.meta.tagline}`,
    description: dict.meta.defaultDescription,
  });
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const [dict, cities, counts, featured, [homeAd], voices, stats, articles, posts] = await Promise.all([
    getDictionary(lang),
    listCities(),
    schoolCountsByCity(),
    getRandomSchools(6, { fresh: false }),
    getAds("home_grid", lang, 1),
    getPublicTestimonials(),
    getSiteStats(),
    listArticles({ pageSize: 3, featuredFirst: true }),
    listPosts({ pageSize: 3 }),
  ]);

  const why = [
    { icon: ShieldCheck, title: dict.home.why1Title, text: dict.home.why1Text },
    { icon: MessagesSquare, title: dict.home.why2Title, text: dict.home.why2Text },
    { icon: Scale, title: dict.home.why3Title, text: dict.home.why3Text },
    { icon: Languages, title: dict.home.why4Title, text: dict.home.why4Text },
  ];

  return (
    <>
      <section className="relative overflow-hidden bg-brand-900 text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(60rem_30rem_at_85%_-10%,rgb(42_142_99/0.35),transparent),radial-gradient(40rem_25rem_at_0%_110%,rgb(86_134_204/0.35),transparent)]" />
        <div className="container-page relative py-16 sm:py-24">
          <h1 className="max-w-3xl text-[2.25rem] font-bold leading-[1.1] tracking-tight text-white sm:text-display">
            {dict.home.heroTitle}
          </h1>
          <p className="mt-5 max-w-2xl text-body text-brand-100 sm:text-lg">{dict.home.heroSubtitle}</p>
          <div className="mt-9 max-w-3xl">
            <SearchBar lang={lang} dict={dict} cities={cities} />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2 text-small">
            <span className="text-brand-200">{dict.home.popularSearches}</span>
            {cities.slice(0, 4).map((city) => (
              <Link
                key={city.slug}
                href={localizedPath(lang, `/cities/${city.slug}`)}
                className="rounded-full bg-white/10 px-3 py-1 font-medium text-white transition-colors hover:bg-white/20"
              >
                {tr(city.name, lang)}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="Statistics" className="border-b border-ink-200 bg-white">
        <dl className="container-page grid grid-cols-2 gap-y-6 py-8 md:grid-cols-4">
          {[
            [stats.schools, dict.home.statSchools],
            [stats.reviews, dict.home.statReviews],
            [stats.cities, dict.home.statCities],
            [stats.articles, dict.home.statArticles],
          ].map(([value, label]) => (
            <div key={label as string} className="text-center">
              <dd className="text-h1 font-bold text-brand-800">{formatNumber(value as number, lang)}</dd>
              <dt className="mt-1 text-small text-ink-600">{label}</dt>
            </div>
          ))}
        </dl>
      </section>

      <section className="container-page pt-16">
        <SectionHeading title={dict.rankings.title} description={dict.rankings.description} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {([
            [Award, dict.rankings.overall, "/schools"],
            [Building2, dict.rankings.private, "/schools?type=private"],
            [Globe2, dict.rankings.international, "/schools?type=international"],
            [Landmark, dict.rankings.public, "/schools?type=public"],
            [Bed, dict.rankings.boarding, "/schools?boarding=1"],
            [Trophy, dict.rankings.sports, "/schools?sports=1"],
          ] as const).map(([Icon, label, href]) => (
            <Link key={label} href={localizedPath(lang, href)} className="group flex flex-col gap-3 rounded-card border border-ink-200 bg-white p-4 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-leaf-300 hover:shadow-lift">
              <span className="flex size-11 items-center justify-center rounded-xl bg-leaf-50 text-leaf-700 transition-colors group-hover:bg-leaf-600 group-hover:text-white"><Icon className="size-5" /></span>
              <span className="text-small font-semibold leading-snug text-ink-900">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 ? (
      <section className="container-page pt-16">
        <SectionHeading
          title={dict.home.discover.title}
          description={dict.home.discover.description}
          href="/schools"
          linkLabel={dict.common.viewAll}
        />
        <RotatingSchools initial={{ schools: featured, ad: homeAd ?? null, adIndex: Math.floor(Math.random() * 6) }} />
      </section>
      ) : null}

      <TrustSection dict={dict} />

      {voices.length > 0 ? <RotatingVoices voices={voices} /> : null}

      <div className="container-page pt-16">
        <AdSlot placement="banner" lang={lang} dict={dict} />
      </div>

      <section className="container-page pt-16">
        <SectionHeading title={dict.home.citiesTitle} description={dict.home.citiesDescription} />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {cities.map((city) => (
            <Link
              key={city.slug}
              href={localizedPath(lang, `/cities/${city.slug}`)}
              className="group rounded-card border border-ink-200 bg-white p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift"
            >
              <p className="text-h3 font-semibold group-hover:text-brand-700">{tr(city.name, lang)}</p>
              <p className="mt-1 text-small text-ink-600">{fmt(dict.home.schoolsInCity, { count: counts[city.slug] ?? 0 })}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page pt-16">
        <div className="overflow-hidden rounded-card bg-gradient-to-br from-leaf-700 to-brand-800 p-8 text-white shadow-lift sm:p-12">
          <div className="grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 className="text-h1 font-bold text-white">{dict.home.mapTitle}</h2>
              <p className="mt-3 max-w-xl text-body text-brand-100">{dict.home.mapDescription}</p>
              <Button asChild size="lg" variant="outline" className="mt-7 border-0 hover:bg-brand-50">
                <Link href={localizedPath(lang, "/map")}><MapPinned />{dict.home.mapCta}<ArrowRight /></Link>
              </Button>
            </div>
            <div aria-hidden="true" className="hidden justify-self-end md:block">
              <MapPinned className="size-36 text-white/20" strokeWidth={1} />
            </div>
          </div>
        </div>
      </section>

      <section className="container-page pt-16">
        <SectionHeading title={dict.home.whyTitle} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {why.map((item, i) => (
            <Reveal key={item.title} delay={i * 0.06}>
              <div className="h-full rounded-card border border-ink-200 bg-white p-6 shadow-card">
                <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-leaf-50 text-leaf-700">
                  <item.icon className="size-5.5" />
                </span>
                <h3 className="text-h3 font-semibold">{item.title}</h3>
                <p className="mt-2 text-small text-ink-600">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {articles.items.length > 0 ? (
        <section className="container-page pt-16">
          <SectionHeading title={dict.home.latestTitle} description={dict.home.latestDescription} href="/education" linkLabel={dict.common.viewAll} />
          <div className="grid gap-6 md:grid-cols-3">
            {articles.items.map((article) => (
              <ArticleCard key={article.id} article={article} lang={lang} dict={dict} />
            ))}
          </div>
        </section>
      ) : null}

      {posts.items.length > 0 ? (
        <section className="container-page pt-16">
          <SectionHeading title={dict.home.communityTitle} description={dict.home.communityDescription} href="/community" linkLabel={dict.home.communityCta} />
          <div className="grid gap-4 md:grid-cols-3">
            {posts.items.map((post) => (
              <PostCard key={post.id} post={post} lang={lang} dict={dict} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
