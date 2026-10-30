import { ArticleList } from "@/components/admin/article-list";

export const metadata = { title: "Videos" };
export const dynamic = "force-dynamic";

export default async function AdminVideos({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <ArticleList kind="video" searchParams={await searchParams} />;
}
