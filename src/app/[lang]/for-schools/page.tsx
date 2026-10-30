import { Camera, Check, CircleCheck, ClipboardCheck, Scale, Trash2 } from "lucide-react";
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
  return buildMetadata({ lang, path: "/for-schools", title: dict.forSchools.title, description: dict.forSchools.intro });
}

export default async function ForSchoolsPage({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const dict = await getDictionary(lang);
  const f = dict.forSchools;
  const bullet = "flex gap-3 text-body text-ink-700";
  const dot = "mt-2.5 size-2 shrink-0 rounded-full bg-leaf-500";

  return (
    <>
      <PageHeader title={f.title} description={f.intro}>
        <Breadcrumbs items={[{ label: f.title }]} />
      </PageHeader>
      <div className="container-page max-w-4xl space-y-12 py-12">
        <section>
          <h2 className="mb-4 text-h2 font-semibold">{f.includesTitle}</h2>
          <ul className="space-y-3">
            {f.includes.map((item) => <li key={item} className={bullet}><span className={dot} />{item}</li>)}
          </ul>
        </section>

        <section className="rounded-card bg-brand-900 p-8 text-white shadow-lift sm:p-10">
          <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-white/10"><CircleCheck className="size-6" /></span>
          <h2 className="text-h2 font-semibold text-white">{f.freeTitle}</h2>
          <p className="mt-3 text-body text-brand-100">{f.freeText}</p>
        </section>

        <section>
          <h2 className="mb-2 text-h2 font-semibold">{f.plansTitle}</h2>
          <p className="mb-5 text-body text-ink-700">{f.plansIntro}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {([[f.basicName, f.basicPrice, f.basicItems], [f.proName, f.proPrice, f.proItems]] as const).map(([name, price, items]) => (
              <Card key={name} className="h-full">
                <CardBody>
                  <h3 className="text-h3 font-semibold">{name}</h3>
                  <p className="mt-1 text-small font-medium text-leaf-700">{price}</p>
                  <ul className="mt-4 space-y-2.5">
                    {items.map((item) => <li key={item} className="flex gap-2.5 text-small text-ink-700"><Check className="mt-0.5 size-4 shrink-0 text-leaf-600" aria-hidden />{item}</li>)}
                  </ul>
                </CardBody>
              </Card>
            ))}
          </div>
          <p className="mt-4 text-small text-ink-600">{f.plansFair}</p>
          <Button asChild variant="outline" className="mt-4"><LLink href="/contact?topic=other">{f.plansCta}</LLink></Button>
        </section>

        <section>
          <h2 className="mb-4 flex items-center gap-2.5 text-h2 font-semibold"><Scale className="size-6 text-leaf-700" aria-hidden />{f.fairTitle}</h2>
          <ul className="space-y-3">
            {f.fair.map((item) => <li key={item} className={bullet}><span className={dot} />{item}</li>)}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 flex items-center gap-2.5 text-h2 font-semibold"><ClipboardCheck className="size-6 text-leaf-700" aria-hidden />{f.fixTitle}</h2>
          <p className="mb-5 text-body text-ink-700">{f.fixText}</p>
          <ol className="grid gap-4 sm:grid-cols-3">
            {f.fixSteps.map((step, i) => (
              <li key={step}>
                <Card className="h-full">
                  <CardBody>
                    <span className="mb-3 flex size-9 items-center justify-center rounded-full bg-brand-50 font-bold text-brand-800">{i + 1}</span>
                    <p className="text-small text-ink-700">{step}</p>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2.5 text-h2 font-semibold"><Camera className="size-6 text-leaf-700" aria-hidden />{f.photosTitle}</h2>
          <p className="text-body text-ink-700">{f.photosText}</p>
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2.5 text-h2 font-semibold"><Trash2 className="size-6 text-leaf-700" aria-hidden />{f.removeTitle}</h2>
          <p className="text-body text-ink-700">{f.removeText}</p>
        </section>

        <section>
          <h2 className="mb-3 text-h2 font-semibold">{f.contactTitle}</h2>
          <p className="text-body text-ink-700">{f.contactText}</p>
          <ul className="mt-4 space-y-1.5 text-body text-ink-700">
            <li><a className="font-medium text-brand-700 hover:underline" href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></li>
            <li><a className="font-medium text-brand-700 hover:underline" href={COMPANY.phoneHref}>{COMPANY.phone}</a> · <a className="font-medium text-brand-700 hover:underline" href={COMPANY.whatsappHref} target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
          </ul>
          <Button asChild className="mt-5"><LLink href="/contact?topic=add_school">{f.contactCta}</LLink></Button>
        </section>
      </div>
      <JsonLd data={breadcrumbLd([{ name: f.title, path: "/for-schools" }], lang)} />
    </>
  );
}
