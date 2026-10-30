import type { MetadataRoute } from "next";
import { getAllArticleSlugs } from "@/lib/data/articles";
import { getAllPostIds, listCommunityCategories } from "@/lib/data/community";
import { listArticleCategories } from "@/lib/data/articles";
import { listCities, listEnabledLanguages, listProvinces } from "@/lib/data/geo";
import { getAllSchoolSlugs } from "@/lib/data/schools";
import { getCatalog } from "@/lib/data/catalog";
import { LANG_META, localizedPath, type Lang } from "@/lib/i18n/config";
import { absoluteUrl } from "@/lib/utils";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await getCatalog();
  const [langs, schools, articles, cities, provinces, articleCategories, communityCategories, posts] = await Promise.all([
    listEnabledLanguages(), getAllSchoolSlugs(), getAllArticleSlugs(), listCities(), listProvinces(),
    listArticleCategories(), listCommunityCategories(), getAllPostIds(),
  ]);

  const entry = (path: string, lastModified?: string | Date, priority = 0.6, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "weekly") => {
    const languages: Record<string, string> = {};
    for (const code of langs) languages[LANG_META[code as Lang].hreflang] = absoluteUrl(localizedPath(code as Lang, path));
    return langs.map((code) => ({
      url: absoluteUrl(localizedPath(code as Lang, path)),
      lastModified: lastModified ? new Date(lastModified) : undefined,
      changeFrequency,
      priority,
      alternates: { languages },
    }));
  };

  return [
    ...entry("/", undefined, 1, "daily"),
    ...entry("/schools", undefined, 0.9, "daily"),
    ...entry("/map", undefined, 0.8, "weekly"),
    ...entry("/education", undefined, 0.8, "daily"),
    ...entry("/community", undefined, 0.7, "daily"),
    ...entry("/about", undefined, 0.4, "yearly"),
    ...entry("/for-schools", undefined, 0.5, "yearly"),
    ...entry("/advertise", undefined, 0.4, "yearly"),
    ...entry("/contact", undefined, 0.4, "yearly"),
    ...entry("/privacy", undefined, 0.2, "yearly"),
    ...entry("/terms", undefined, 0.2, "yearly"),
    ...entry("/guidelines", undefined, 0.3, "yearly"),
    ...provinces.flatMap((p) => entry(`/provinces/${p.slug}`, undefined, 0.7)),
    ...cities.flatMap((c) => entry(`/cities/${c.slug}`, undefined, 0.8)),
    ...catalog.systems.filter((s) => s.is_active).flatMap((s) => entry(`/systems/${s.key}`, undefined, 0.6)),
    ...schools.flatMap((s) => entry(`/schools/${s.slug}`, s.updated_at, 0.9)),
    ...articleCategories.flatMap((c) => entry(`/education/${c.slug}`, undefined, 0.6)),
    ...articles.flatMap((a) => entry(`/education/${a.category}/${a.slug}`, a.updated_at, 0.7)),
    ...communityCategories.flatMap((c) => entry(`/community/${c.slug}`, undefined, 0.5)),
    ...posts.flatMap((p) => entry(`/community/post/${p.id}`, p.created_at, 0.4, "monthly")),
  ];
}
