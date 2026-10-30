import { ArticleList } from "@/components/admin/article-list";

export const metadata = { title: "Articles" };
export const dynamic = "force-dynamic";

export default async function AdminArticles({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <ArticleList searchParams={await searchParams} />;
}
