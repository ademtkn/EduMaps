import { MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AdSlot } from "@/components/ads/ad-slot";
import { CommentForm, CommentItem } from "@/components/community/comments";
import { ReportButton } from "@/components/reviews/report-button";
import { JsonLd } from "@/components/seo/json-ld";
import { ViewTracker } from "@/components/seo/view-tracker";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { getPost, listComments } from "@/lib/data/community";
import { isLang } from "@/lib/i18n/config";
import { fmt } from "@/lib/i18n/fmt";
import { formatDate } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { tr } from "@/lib/i18n/localized";
import { absoluteUrl } from "@/lib/utils";
import { breadcrumbLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 60;

type Props = { params: Promise<{ lang: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, id } = await params;
  if (!isLang(lang) || !z.string().uuid().safeParse(id).success) return {};
  const post = await getPost(id);
  if (!post) return {};
  return buildMetadata({ lang, path: `/community/post/${id}`, title: post.title, description: post.body.replace(/\s+/g, " ").slice(0, 180) });
}

export default async function PostPage({ params }: Props) {
  const { lang, id } = await params;
  if (!isLang(lang) || !z.string().uuid().safeParse(id).success) notFound();
  const post = await getPost(id);
  if (!post) notFound();
  const [dict, comments] = await Promise.all([getDictionary(lang), listComments(id)]);
  const categoryName = tr(post.community_categories.name, lang);

  return (
    <>
      <ViewTracker type="post_view" id={post.id} />
      <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <Breadcrumbs items={[{ label: dict.nav.community, href: "/community" }, { label: categoryName, href: `/community/${post.community_categories.slug}` }, { label: post.title }]} />
          <article className="rounded-card border border-ink-200 bg-white p-6 shadow-card sm:p-8">
            <Badge tone="brand">{categoryName}</Badge>
            <h1 className="mt-3 text-h1 font-bold">{post.title}</h1>
            <p className="mt-3 text-small text-ink-600">
              {fmt(dict.community.askedBy, { name: post.profiles?.display_name ?? "—" })} · {formatDate(post.created_at, lang)}
            </p>
            <p className="mt-6 whitespace-pre-line break-words text-body text-ink-800">{post.body}</p>
            <div className="mt-6 border-t border-ink-200 pt-4"><ReportButton entityType="post" entityId={post.id} /></div>
          </article>

          <section aria-labelledby="comments-heading" className="mt-10">
            <h2 id="comments-heading" className="mb-5 flex items-center gap-2 text-h2 font-semibold">
              <MessageCircle className="size-6 text-brand-700" /> {dict.community.comments} ({comments.length})
            </h2>
            {comments.length === 0 ? <p className="mb-6 text-small text-ink-600">{dict.community.noComments}</p> : (
              <ul className="mb-8 space-y-3">{comments.map((c) => <CommentItem key={c.id} comment={c} />)}</ul>
            )}
            <CommentForm postId={post.id} />
          </section>
        </div>
        <aside className="space-y-6"><AdSlot placement="sidebar" lang={lang} dict={dict} /></aside>
      </div>
      <JsonLd
        data={[
          breadcrumbLd([{ name: dict.nav.community, path: "/community" }, { name: categoryName, path: `/community/${post.community_categories.slug}` }, { name: post.title, path: `/community/post/${id}` }], lang),
          {
            "@context": "https://schema.org",
            "@type": "DiscussionForumPosting",
            headline: post.title,
            text: post.body,
            datePublished: post.created_at,
            author: { "@type": "Person", name: post.profiles?.display_name ?? "Member" },
            url: absoluteUrl(`/${lang}/community/post/${id}`),
            commentCount: comments.length,
            interactionStatistic: { "@type": "InteractionCounter", interactionType: "https://schema.org/CommentAction", userInteractionCount: comments.length },
          },
        ]}
      />
    </>
  );
}
