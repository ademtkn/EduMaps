import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/auth-forms";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { LLink } from "@/components/ui/localized-link";
import { isLang } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { buildMetadata } from "@/lib/seo/metadata";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ lang: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const dict = await getDictionary(lang);
  return buildMetadata({ lang, path: "/auth/reset-password", title: dict.auth.resetTitle, description: dict.auth.resetSubtitle, noindex: true });
}

export default async function Page({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const dict = await getDictionary(lang);
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <div className="container-page flex justify-center py-12 sm:py-16">
      <div className="w-full max-w-md">
        <h1 className="text-h1 font-bold">{dict.auth.resetTitle}</h1>
        {data.user ? (
          <>
            <p className="mb-8 mt-2 text-body text-ink-600">{dict.auth.resetSubtitle}</p>
            <Card><CardBody><ResetPasswordForm /></CardBody></Card>
          </>
        ) : (
          <div className="mt-6 space-y-5">
            <Alert tone="warning">{dict.auth.resetInvalid}</Alert>
            <Button asChild><LLink href="/auth/forgot-password">{dict.auth.resetRequestNew}</LLink></Button>
          </div>
        )}
      </div>
    </div>
  );
}
