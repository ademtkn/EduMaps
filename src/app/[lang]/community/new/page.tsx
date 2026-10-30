import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostForm } from "@/components/community/post-form";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/section";
import { listCommunityCategories } from "@/lib/data/community";
import { isLang } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { buildMetadata } from "@/lib/seo/metadata";
import { firstParam } from "@/lib/utils";

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const dict = await getDictionary(lang);
  return buildMetadata({ lang, path: "/community/new", title: dict.community.composeTitle, description: dict.community.composeDescription, noindex: true });
}

export default async function NewPostPage({ params, searchParams }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const [dict, categories, sp] = await Promise.all([getDictionary(lang), listCommunityCategories(), searchParams]);
  return (
    <>
      <PageHeader title={dict.community.composeTitle} description={dict.community.composeDescription}>
        <Breadcrumbs items={[{ label: dict.nav.community, href: "/community" }, { label: dict.community.newPost }]} />
      </PageHeader>
      <div className="container-page max-w-3xl py-8">
        <Card><CardBody><PostForm categories={categories} defaultCategory={firstParam(sp.category)} /></CardBody></Card>
      </div>
    </>
  );
}
