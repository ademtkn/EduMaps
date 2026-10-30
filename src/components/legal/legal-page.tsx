import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader } from "@/components/ui/section";
import { COMPANY, LEGAL_VERSION, MIN_AGE } from "@/lib/company";
import { isLang, type Lang } from "@/lib/i18n/config";
import { fmt } from "@/lib/i18n/fmt";
import { formatDate } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLegalDoc, type LegalKind } from "@/lib/legal";
import { breadcrumbLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";
import { RichText, type RichLinks } from "./rich-text";

type Props = { params: Promise<{ lang: string }> };

const titleKey = { privacy: "privacyTitle", terms: "termsTitle", guidelines: "guidelinesTitle" } as const;
const descKey = { privacy: "privacyDescription", terms: "termsDescription", guidelines: "guidelinesDescription" } as const;

export function legalMetadata(kind: LegalKind) {
  return async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { lang } = await params;
    if (!isLang(lang)) return {};
    const dict = await getDictionary(lang);
    return buildMetadata({ lang, path: `/${kind}`, title: dict.legal[titleKey[kind]], description: dict.legal[descKey[kind]] });
  };
}

export function legalVars(lang: Lang) {
  return {
    company: COMPANY.legalName[lang],
    city: COMPANY.location[lang],
    email: COMPANY.email,
    phone: COMPANY.phone,
    age: MIN_AGE,
  };
}

export function legalPage(kind: LegalKind) {
  return async function LegalPage({ params }: Props) {
    const { lang } = await params;
    if (!isLang(lang)) notFound();
    const dict = await getDictionary(lang);
    const doc = getLegalDoc(kind, lang);
    const title = dict.legal[titleKey[kind]];
    const vars = legalVars(lang);
    const links: RichLinks = {
      guidelines: { href: "/guidelines", label: dict.auth.guidelinesLink },
      terms: { href: "/terms", label: dict.auth.termsLink },
      privacy: { href: "/privacy", label: dict.auth.privacyLink },
    };
    return (
      <>
        <PageHeader title={title} description={dict.legal[descKey[kind]]}>
          <Breadcrumbs items={[{ label: title }]} />
          <p className="mt-4 text-small text-ink-500">{fmt(dict.legal.updated, { date: formatDate(LEGAL_VERSION, lang) })}</p>
        </PageHeader>
        <div className="container-page grid max-w-5xl gap-10 py-10 lg:grid-cols-[220px_minmax(0,1fr)]">
          <nav aria-label={dict.legal.onThisPage} className="lg:sticky lg:top-24 lg:self-start">
            <p className="mb-3 text-small font-semibold text-ink-900">{dict.legal.onThisPage}</p>
            <ol className="space-y-2 text-small">
              {doc.sections.map((s) => (
                <li key={s.id}><a href={`#${s.id}`} className="text-ink-600 hover:text-brand-700">{s.title}</a></li>
              ))}
            </ol>
          </nav>
          <article className="min-w-0 space-y-10">
            {doc.sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-28">
                <h2 className="mb-3 text-h3 font-semibold">{s.title}</h2>
                <div className="space-y-3 text-body text-ink-700">
                  {s.paragraphs?.map((p) => <p key={p}><RichText text={p} vars={vars} links={links} /></p>)}
                  {s.items ? (
                    <ul className="list-disc space-y-2 pl-5 marker:text-leaf-500">
                      {s.items.map((item) => <li key={item}><RichText text={item} vars={vars} links={links} /></li>)}
                    </ul>
                  ) : null}
                  {s.after?.map((p) => <p key={p}><RichText text={p} vars={vars} links={links} /></p>)}
                </div>
              </section>
            ))}
            <p className="border-t border-ink-200 pt-6 text-small text-ink-600">
              <RichText text={dict.legal.questions} vars={vars} />
            </p>
          </article>
        </div>
        <JsonLd data={breadcrumbLd([{ name: title, path: `/${kind}` }], lang)} />
      </>
    );
  };
}
