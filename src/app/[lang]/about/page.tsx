import { Building2, Languages, MapPinned, ShieldCheck, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LLink } from "@/components/ui/localized-link";
import { PageHeader } from "@/components/ui/section";
import { COMPANY } from "@/lib/company";
import { isLang } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { breadcrumbLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const dict = await getDictionary(lang);
  return buildMetadata({ lang, path: "/about", title: dict.about.title, description: dict.about.intro });
}

export default async function AboutPage({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const dict = await getDictionary(lang);
  const a = dict.about;
  const principles = [
    { icon: ShieldCheck, title: a.principle1Title, text: a.principle1Text },
    { icon: Sparkles, title: a.principle2Title, text: a.principle2Text },
    { icon: MapPinned, title: a.principle3Title, text: a.principle3Text },
    { icon: Languages, title: a.principle4Title, text: a.principle4Text },
  ];

  return (
    <>
      <PageHeader title={a.title} description={a.intro}>
        <Breadcrumbs items={[{ label: a.title }]} />
      </PageHeader>
      <div className="container-page max-w-4xl space-y-14 py-12">
        <section className="rounded-card bg-brand-900 p-8 text-white shadow-lift sm:p-10">
          <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-white/10"><Building2 className="size-6" /></span>
          <h2 className="text-h2 font-semibold text-white">{a.lineTitle}</h2>
          <p className="mt-3 text-body text-brand-100">{a.lineText}</p>
          <p className="mt-5 border-t border-white/15 pt-5 text-small font-semibold text-white">{a.operatedBy}</p>
        </section>

        <section>
          <h2 className="mb-5 text-h2 font-semibold">{a.missionTitle}</h2>
          <ul className="space-y-3">
            {[a.mission1, a.mission2, a.mission3, a.mission4].map((m) => (
              <li key={m} className="flex gap-3 text-body text-ink-700"><span className="mt-2.5 size-2 shrink-0 rounded-full bg-leaf-500" />{m}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-5 text-h2 font-semibold">{a.principlesTitle}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {principles.map((p) => (
              <Card key={p.title}>
                <CardBody>
                  <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-leaf-50 text-leaf-700"><p.icon className="size-5" /></span>
                  <h3 className="text-h3 font-semibold">{p.title}</h3>
                  <p className="mt-2 text-small text-ink-600">{p.text}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-h2 font-semibold">{a.adsTitle}</h2>
          <p className="text-body text-ink-700">{a.adsText}</p>
        </section>

        <section>
          <h2 className="mb-3 text-h2 font-semibold">{a.contactTitle}</h2>
          <p className="text-body text-ink-700">{a.contactText}</p>
          <ul className="mt-4 space-y-1.5 text-body text-ink-700">
            <li><a className="font-medium text-brand-700 hover:underline" href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></li>
            <li><a className="font-medium text-brand-700 hover:underline" href={COMPANY.phoneHref}>{COMPANY.phone}</a></li>
          </ul>
          <Button asChild className="mt-5"><LLink href="/contact">{a.contactCta}</LLink></Button>
        </section>

      </div>
      <JsonLd data={breadcrumbLd([{ name: a.title, path: "/about" }], lang)} />
    </>
  );
}
