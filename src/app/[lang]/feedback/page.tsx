import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FeedbackForm } from "@/components/home/feedback-form";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { LLink } from "@/components/ui/localized-link";
import { PageHeader } from "@/components/ui/section";
import { isLang, localizedPath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { tr } from "@/lib/i18n/localized";
import { buildMetadata } from "@/lib/seo/metadata";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ lang: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const dict = await getDictionary(lang);
  return buildMetadata({ lang, path: "/feedback", title: dict.feedback.title, description: dict.feedback.intro, noindex: true });
}

export default async function FeedbackPage({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const dict = await getDictionary(lang);
  const f = dict.feedback;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { data: mine } = auth.user
    ? await supabase.from("site_testimonials").select("quote,status,admin_note").eq("user_id", auth.user.id).maybeSingle()
    : { data: null };
  const next = encodeURIComponent(localizedPath(lang, "/feedback"));
  const tone = { pending: "warning", published: "success", rejected: "danger" } as const;

  return (
    <>
      <PageHeader title={f.title} description={f.intro}>
        <Breadcrumbs items={[{ label: f.title }]} />
      </PageHeader>
      <div className="container-page max-w-2xl space-y-6 py-10">
        {!auth.user ? (
          <div className="space-y-5">
            <Alert tone="info">{f.signInFirst}</Alert>
            <div className="flex gap-3">
              <Button asChild><LLink href={`/auth/login?next=${next}`}>{dict.nav.signIn}</LLink></Button>
              <Button asChild variant="outline"><LLink href={`/auth/register?next=${next}`}>{dict.nav.signUp}</LLink></Button>
            </div>
          </div>
        ) : (
          <>
            {mine ? (
              <Card><CardBody className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-h3 font-semibold">{f.current}</h2>
                  <Badge tone={tone[mine.status as keyof typeof tone]}>{f.status[mine.status as keyof typeof f.status]}</Badge>
                </div>
                <p className="text-small text-ink-800">“{tr(mine.quote as never, lang)}”</p>
                {mine.admin_note ? <p className="rounded-control bg-ink-50 p-3 text-small text-ink-700"><span className="font-semibold">{f.teamNote}:</span> {mine.admin_note}</p> : null}
              </CardBody></Card>
            ) : null}
            <Card><CardBody className="p-6 sm:p-8">
              <FeedbackForm initialQuote={mine ? tr(mine.quote as never, lang) : ""} hasExisting={Boolean(mine)} />
            </CardBody></Card>
          </>
        )}
      </div>
    </>
  );
}
