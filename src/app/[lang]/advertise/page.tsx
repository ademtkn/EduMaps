import { BadgeCheck, BarChart3, LayoutPanelTop, Megaphone, Scale } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
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
  return buildMetadata({ lang, path: "/advertise", title: dict.advertise.advTitle, description: dict.advertise.advIntro });
}

export default async function AdvertisePage({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const dict = await getDictionary(lang);
  const a = dict.advertise;
  const bullet = "flex gap-3 text-body text-ink-700";
  const dot = "mt-2.5 size-2 shrink-0 rounded-full bg-leaf-500";
  const heading = "mb-4 flex items-center gap-2.5 text-h2 font-semibold";
  const icon = "size-6 text-leaf-700";

  return (
    <>
      <PageHeader title={a.advTitle} description={a.advIntro}>
        <Breadcrumbs items={[{ label: a.advCrumb }]} />
      </PageHeader>
      <div className="container-page max-w-4xl space-y-12 py-12">
        <section>
          <h2 className={heading}><Megaphone className={icon} aria-hidden />{a.advWhoTitle}</h2>
          <ul className="space-y-3">
            {a.advWho.map((item) => <li key={item} className={bullet}><span className={dot} />{item}</li>)}
          </ul>
        </section>

        <section>
          <h2 className={heading}><LayoutPanelTop className={icon} aria-hidden />{a.advFormatsTitle}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {a.advFormats.map((format) => (
              <Card key={format.name}>
                <CardBody>
                  <h3 className="text-h3 font-semibold">{format.name}</h3>
                  <p className="mt-2 text-small text-ink-600">{format.text}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>

        <section className="rounded-card bg-brand-900 p-8 text-white shadow-lift sm:p-10">
          <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-white/10"><Scale className="size-6" aria-hidden /></span>
          <h2 className="text-h2 font-semibold text-white">{a.advRulesTitle}</h2>
          <ul className="mt-4 space-y-3">
            {a.advRules.map((item) => <li key={item} className="flex gap-3 text-body text-brand-100"><span className="mt-2.5 size-2 shrink-0 rounded-full bg-leaf-400" />{item}</li>)}
          </ul>
        </section>

        <section>
          <h2 className={heading}><BadgeCheck className={icon} aria-hidden />{a.advSendTitle}</h2>
          <ul className="space-y-3">
            {a.advSend.map((item) => <li key={item} className={bullet}><span className={dot} />{item}</li>)}
          </ul>
        </section>

        <section className="grid gap-8 sm:grid-cols-2">
          <div>
            <h2 className={heading}><BarChart3 className={icon} aria-hidden />{a.advReportTitle}</h2>
            <p className="text-body text-ink-700">{a.advReport}</p>
          </div>
          <div>
            <h2 className="mb-4 text-h2 font-semibold">{a.advPriceTitle}</h2>
            <p className="text-body text-ink-700">{a.advPrice}</p>
          </div>
        </section>

        <section>
          <ul className="space-y-1.5 text-body text-ink-700">
            <li><a className="font-medium text-brand-700 hover:underline" href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></li>
            <li><a className="font-medium text-brand-700 hover:underline" href={COMPANY.phoneHref}>{COMPANY.phone}</a> · <a className="font-medium text-brand-700 hover:underline" href={COMPANY.whatsappHref} target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
          </ul>
          <Button asChild className="mt-5"><LLink href="/contact?topic=advertising">{a.advCta}</LLink></Button>
        </section>
      </div>
      <JsonLd data={breadcrumbLd([{ name: a.advCrumb, path: "/advertise" }], lang)} />
    </>
  );
}
