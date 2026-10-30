import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { AuthProvider } from "@/components/auth/auth-provider";
import { CompareProvider } from "@/components/compare/compare-provider";
import { CompareTray } from "@/components/compare/compare-tray";
import { I18nProvider } from "@/components/i18n-provider";
import { NoticeToast } from "@/components/layout/notice-toast";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { JsonLd } from "@/components/seo/json-ld";
import { ToastProvider } from "@/components/ui/toast";
import { listCities, listEnabledLanguages } from "@/lib/data/geo";
import { LANGS, LANG_META, isLang } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { organizationLd, websiteLd } from "@/lib/seo/jsonld";
import { SITE_URL } from "@/lib/utils";
import "../globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#185078",
};

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${dict.meta.siteName} — ${dict.meta.tagline}`, template: "%s | EduMaps.kg" },
    description: dict.meta.defaultDescription,
    applicationName: "EduMaps.kg",
    publisher: "Line.kg",
    formatDetection: { telephone: false },
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const [dict, cities, enabledLangs] = await Promise.all([getDictionary(lang), listCities(), listEnabledLanguages()]);

  return (
    <html lang={LANG_META[lang].htmlLang} className={inter.variable}>
      <body className="flex min-h-dvh flex-col">
        <I18nProvider lang={lang} dict={dict}>
          <ToastProvider dismissLabel={dict.common.dismiss}>
            <AuthProvider>
              <CompareProvider>
                <a
                  href="#main"
                  className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-control focus:bg-white focus:px-4 focus:py-2 focus:shadow-lift"
                >
                  {dict.nav.skipToContent}
                </a>
                <Suspense fallback={null}><NoticeToast /></Suspense>
                <SiteHeader enabledLangs={enabledLangs} />
                <main id="main" className="flex-1">
                  {children}
                </main>
                <SiteFooter lang={lang} dict={dict} cities={cities} />
                <CompareTray />
              </CompareProvider>
            </AuthProvider>
          </ToastProvider>
        </I18nProvider>
        <JsonLd data={[organizationLd(), websiteLd(lang)]} />
      </body>
    </html>
  );
}
