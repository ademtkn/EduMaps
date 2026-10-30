import { Globe, Mail, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactForm } from "@/components/contact/contact-form";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/section";
import { COMPANY } from "@/lib/company";
import { isLang } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { contactPageLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";
import { firstParam } from "@/lib/utils";

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const dict = await getDictionary(lang);
  return buildMetadata({ lang, path: "/contact", title: dict.contact.title, description: dict.contact.description });
}

export default async function ContactPage({ params, searchParams }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const sp = await searchParams;
  const dict = await getDictionary(lang);
  const c = dict.contact;
  const link = "font-medium text-brand-700 hover:underline";

  return (
    <>
      <PageHeader title={c.title} description={c.description}>
        <Breadcrumbs items={[{ label: c.title }]} />
      </PageHeader>
      <div className="container-page grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardBody className="p-6 sm:p-8">
            <h2 className="mb-6 text-h2 font-semibold">{c.formTitle}</h2>
            <ContactForm defaultTopic={firstParam(sp.topic)} defaultSchool={firstParam(sp.school)?.slice(0, 200)} />
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardBody>
              <h2 className="mb-4 text-h3 font-semibold">{c.directTitle}</h2>
              <ul className="space-y-4 text-small">
                <li className="flex gap-3"><Mail className="mt-0.5 size-4.5 shrink-0 text-ink-500" /><span><span className="block text-caption text-ink-500">{c.emailLabel}</span><a className={link} href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></span></li>
                <li className="flex gap-3"><Phone className="mt-0.5 size-4.5 shrink-0 text-ink-500" /><span><span className="block text-caption text-ink-500">{c.phoneLabel}</span><a className={link} href={COMPANY.phoneHref}>{COMPANY.phone}</a></span></li>
                <li className="flex gap-3"><MessageCircle className="mt-0.5 size-4.5 shrink-0 text-ink-500" /><a className={link} href={COMPANY.whatsappHref} target="_blank" rel="noopener noreferrer">{c.whatsapp}</a></li>
                <li className="flex gap-3"><Globe className="mt-0.5 size-4.5 shrink-0 text-ink-500" /><span><span className="block text-caption text-ink-500">{c.websiteLabel}</span><a className={link} href={COMPANY.website} target="_blank" rel="noopener noreferrer">{COMPANY.websiteLabel}</a></span></li>
              </ul>
            </CardBody>
          </Card>

        </div>
      </div>
      <JsonLd data={contactPageLd(lang)} />
    </>
  );
}
