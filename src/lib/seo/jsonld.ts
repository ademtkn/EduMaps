import { COMPANY } from "@/lib/company";
import { LANG_META, localizedPath, type Lang } from "@/lib/i18n/config";
import { absoluteUrl } from "@/lib/utils";

type Json = Record<string, unknown>;

export function organizationLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "EduMaps.kg",
    url: absoluteUrl("/"),
    logo: absoluteUrl("/brand/icon-512.png"),
    sameAs: COMPANY.social.length ? [...COMPANY.social] : undefined,
    parentOrganization: {
      "@type": "Organization",
      name: COMPANY.brand,
      legalName: COMPANY.legalName.en,
      url: COMPANY.website,
      email: COMPANY.email,
      telephone: COMPANY.phone,
      address: { "@type": "PostalAddress", addressLocality: "Bishkek", addressCountry: "KG" },
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: COMPANY.email,
      telephone: COMPANY.phone,
      availableLanguage: ["Kyrgyz", "Russian", "English"],
      url: absoluteUrl(localizedPath("kg", "/contact")),
    },
    description:
      "EduMaps.kg is an independent school discovery platform for Kyrgyzstan, developed and operated by Line.kg.",
  };
}

export function contactPageLd(lang: Lang): Json {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    url: absoluteUrl(localizedPath(lang, "/contact")),
    inLanguage: LANG_META[lang].htmlLang,
    about: { "@type": "Organization", name: COMPANY.brand, email: COMPANY.email, telephone: COMPANY.phone },
  };
}

export function websiteLd(lang: Lang): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "EduMaps.kg",
    url: absoluteUrl(localizedPath(lang)),
    inLanguage: LANG_META[lang].htmlLang,
    publisher: { "@type": "Organization", name: "Line.kg" },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: absoluteUrl(`${localizedPath(lang, "/schools")}?q={search_term_string}`) },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbLd(items: { name: string; path: string }[], lang: Lang): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(localizedPath(lang, item.path)),
    })),
  };
}

export function schoolLd(input: {
  lang: Lang;
  slug: string;
  name: string;
  description: string;
  image?: string | null;
  logo?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  city: string;
  lat?: number | null;
  lng?: number | null;
  ratingAvg: number;
  ratingCount: number;
  reviews: { author: string; rating: number; title: string; body: string; date: string }[];
  languages: string[];
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "School",
    "@id": absoluteUrl(localizedPath(input.lang, `/schools/${input.slug}`)),
    name: input.name,
    description: input.description,
    url: absoluteUrl(localizedPath(input.lang, `/schools/${input.slug}`)),
    image: input.image ?? undefined,
    logo: input.logo ?? undefined,
    telephone: input.phone ?? undefined,
    email: input.email ?? undefined,
    sameAs: input.website ? [input.website] : undefined,
    knowsLanguage: input.languages,
    address: {
      "@type": "PostalAddress",
      streetAddress: input.address ?? undefined,
      addressLocality: input.city,
      addressCountry: "KG",
    },
    geo:
      input.lat != null && input.lng != null
        ? { "@type": "GeoCoordinates", latitude: input.lat, longitude: input.lng }
        : undefined,
    aggregateRating:
      input.ratingCount > 0
        ? { "@type": "AggregateRating", ratingValue: input.ratingAvg, reviewCount: input.ratingCount, bestRating: 5, worstRating: 1 }
        : undefined,
    review: input.reviews.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.author },
      datePublished: r.date,
      name: r.title,
      reviewBody: r.body,
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
    })),
  };
}

export function faqLd(items: { question: string; answer: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: { "@type": "Answer", text: i.answer },
    })),
  };
}

export function articleLd(input: {
  lang: Lang;
  path: string;
  title: string;
  description: string;
  image?: string | null;
  author: string;
  published?: string | null;
  modified: string;
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    image: input.image ?? undefined,
    inLanguage: LANG_META[input.lang].htmlLang,
    datePublished: input.published ?? undefined,
    dateModified: input.modified,
    mainEntityOfPage: absoluteUrl(localizedPath(input.lang, input.path)),
    author: { "@type": "Person", name: input.author },
    publisher: { "@type": "Organization", name: "EduMaps.kg", parentOrganization: { "@type": "Organization", name: "Line.kg" } },
  };
}

export function itemListLd(items: { name: string; path: string }[], lang: Lang): Json {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(localizedPath(lang, item.path)),
    })),
  };
}
