import type { Metadata } from "next";
import { LANGS, LANG_META, localizedPath, type Lang } from "@/lib/i18n/config";
import { absoluteUrl } from "@/lib/utils";

type MetaInput = {
  lang: Lang;
  /** Language-less path, e.g. "/schools/my-school" */
  path: string;
  title: string;
  description: string;
  image?: string | null;
  type?: "website" | "article";
  noindex?: boolean;
  publishedTime?: string | null;
  modifiedTime?: string | null;
};

export const SITE_NAME = "EduMaps.kg";

/** Canonical + hreflang alternates for every language version of a page. */
export function languageAlternates(lang: Lang, path: string) {
  const languages: Record<string, string> = {};
  for (const code of LANGS) languages[LANG_META[code].hreflang] = absoluteUrl(localizedPath(code, path));
  languages["x-default"] = absoluteUrl(localizedPath("kg", path));
  return { canonical: absoluteUrl(localizedPath(lang, path)), languages };
}

export function buildMetadata({
  lang, path, title, description, image, type = "website", noindex, publishedTime, modifiedTime,
}: MetaInput): Metadata {
  const url = absoluteUrl(localizedPath(lang, path));
  const ogImage = image ?? absoluteUrl(`/api/og?title=${encodeURIComponent(title)}&lang=${lang}`);
  const trimmed = description.length > 200 ? `${description.slice(0, 197).trimEnd()}…` : description;
  return {
    title,
    description: trimmed,
    alternates: languageAlternates(lang, path),
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type,
      url,
      siteName: SITE_NAME,
      title,
      description: trimmed,
      locale: LANG_META[lang].ogLocale,
      alternateLocale: LANGS.filter((l) => l !== lang).map((l) => LANG_META[l].ogLocale),
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      ...(type === "article" ? { publishedTime: publishedTime ?? undefined, modifiedTime: modifiedTime ?? undefined } : {}),
    },
    twitter: { card: "summary_large_image", title, description: trimmed, images: [ogImage] },
  };
}
