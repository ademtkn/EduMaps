import { MessageCircle, Pin } from "lucide-react";
import Link from "next/link";
import { localizedPath, type Lang } from "@/lib/i18n/config";
import { fmt } from "@/lib/i18n/fmt";
import { formatDate } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { tr } from "@/lib/i18n/localized";
import type { PostData } from "@/lib/data/types";
import { Badge } from "@/components/ui/badge";

export function PostCard({ post, lang, dict }: { post: PostData; lang: Lang; dict: Dictionary }) {
  const excerpt = post.body.length > 200 ? `${post.body.slice(0, 197).trimEnd()}…` : post.body;
  return (
    <article className="relative rounded-card border border-ink-200 bg-white p-5 shadow-card transition duration-200 hover:shadow-lift sm:p-6">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge tone="brand">{tr(post.community_categories.name, lang)}</Badge>
        {post.is_pinned ? <Badge tone="warning"><Pin className="size-3" />{dict.community.pinned}</Badge> : null}
      </div>
      <h3 className="text-h3 font-semibold leading-snug">
        <Link href={localizedPath(lang, `/community/post/${post.id}`)} className="after:absolute after:inset-0 after:content-[''] hover:text-brand-700">
          {post.title}
        </Link>
      </h3>
      <p className="mt-2 line-clamp-2 whitespace-pre-line text-small text-ink-600">{excerpt}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-ink-500">
        <span className="font-medium text-ink-700">{post.profiles?.display_name}</span>
        <span>{formatDate(post.created_at, lang, "short")}</span>
        <span className="inline-flex items-center gap-1"><MessageCircle className="size-3.5" />{fmt(dict.community.replies, { count: post.comment_count })}</span>
      </div>
    </article>
  );
}
