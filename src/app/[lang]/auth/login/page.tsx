import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LoginForm } from "@/components/auth/auth-forms";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody } from "@/components/ui/card";
import { isLang } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { buildMetadata } from "@/lib/seo/metadata";
import { firstParam } from "@/lib/utils";

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const dict = await getDictionary(lang);
  return buildMetadata({ lang, path: "/auth/login", title: dict.auth.loginTitle, description: dict.auth.loginSubtitle, noindex: true });
}

export default async function Page({ params, searchParams }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const [dict, sp] = await Promise.all([getDictionary(lang), searchParams]);
  return (
    <div className="container-page flex justify-center py-12 sm:py-16">
      <div className="w-full max-w-md">
        <h1 className="text-h1 font-bold">{dict.auth.loginTitle}</h1>
        <p className="mb-8 mt-2 text-body text-ink-600">{dict.auth.loginSubtitle}</p>
        {firstParam(sp.error) ? <Alert tone="warning" className="mb-5">{dict.auth.linkInvalid}</Alert> : null}
        <Card><CardBody><LoginForm next={firstParam(sp.next)} /></CardBody></Card>
      </div>
    </div>
  );
}
