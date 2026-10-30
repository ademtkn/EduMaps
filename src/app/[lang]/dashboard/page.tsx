import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArticleCard } from "@/components/education/article-card";
import { DeleteContentButton } from "@/components/dashboard/delete-button";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { ReviewCard } from "@/components/reviews/review-card";
import { SchoolCard } from "@/components/schools/school-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/section";
import { listCities } from "@/lib/data/geo";
import type { ArticleCardData, PostData, ReviewData, SchoolCardData } from "@/lib/data/types";
import { cn, firstParam } from "@/lib/utils";
import { isLang, localizedPath } from "@/lib/i18n/config";
import { fmt } from "@/lib/i18n/fmt";
import { formatDate } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { tr } from "@/lib/i18n/localized";
import { buildMetadata } from "@/lib/seo/metadata";
import { createClient } from "@/lib/supabase/server";
import { Bookmark, FileText, KeyRound, MessageSquare, Star, UserRound } from "lucide-react";
import { AccountSettings } from "@/components/dashboard/account-settings";
import { Alert } from "@/components/ui/alert";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

const TABS = ["schools", "articles", "reviews", "posts", "profile", "account"] as const;
type Tab = (typeof TABS)[number];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const dict = await getDictionary(lang);
  return buildMetadata({ lang, path: "/dashboard", title: dict.dashboard.title, description: dict.dashboard.title, noindex: true });
}

const SCHOOL_CARD =
  "id,slug,name,tagline,logo_url,cover_url,rating_avg,rating_count,school_type,education_systems,has_transportation,has_boarding,has_sports,tuition_min,tuition_max,fee_min,fee_max,fee_period,fee_billing_months,opening_time,closing_time,working_days,grade_from,grade_to,updated_at,data_status,cities!inner(slug,name,provinces!inner(slug,name)),school_languages(language_code,is_primary)";
const ARTICLE_CARD = "id,slug,kind,title,excerpt,cover_url,reading_minutes,published_at,is_featured,article_categories!inner(slug,name),profiles(display_name)";

export default async function DashboardPage({ params, searchParams }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const sp = await searchParams;
  const tabParam = firstParam(sp.tab);
  const tab: Tab = (TABS as readonly string[]).includes(tabParam ?? "") ? (tabParam as Tab) : "schools";

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(`${localizedPath(lang, "/auth/login")}?next=${encodeURIComponent(localizedPath(lang, "/dashboard"))}`);
  const userId = auth.user.id;

  const [dict, profile, favorites] = await Promise.all([
    getDictionary(lang),
    supabase.from("profiles").select("display_name,bio,city_id,preferred_lang").eq("user_id", userId).single(),
    supabase.from("favorites").select("school_id,article_id").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);
  const favRows = favorites.data ?? [];
  const schoolIds = favRows.flatMap((f) => (f.school_id ? [f.school_id] : []));
  const articleIds = favRows.flatMap((f) => (f.article_id ? [f.article_id] : []));

  const tabs: { key: Tab; label: string; icon: typeof Bookmark; count?: number }[] = [
    { key: "schools", label: dict.dashboard.savedSchools, icon: Bookmark, count: schoolIds.length },
    { key: "articles", label: dict.dashboard.savedArticles, icon: FileText, count: articleIds.length },
    { key: "reviews", label: dict.dashboard.myReviews, icon: Star },
    { key: "posts", label: dict.dashboard.myPosts, icon: MessageSquare },
    { key: "profile", label: dict.dashboard.profile, icon: UserRound },
    { key: "account", label: dict.dashboard.account, icon: KeyRound },
  ];

  const noticeText: Record<string, string> = { password_updated: dict.auth.passwordUpdated, email_confirmed: dict.auth.emailConfirmed, email_changed: dict.account.emailChangeSent };
  const notice = noticeText[firstParam(sp.notice) ?? ""];

  let body;
  if (tab === "schools") {
    const { data } = schoolIds.length ? await supabase.from("schools").select(SCHOOL_CARD).in("id", schoolIds).eq("status", "published") : { data: [] };
    const items = (data ?? []) as unknown as SchoolCardData[];
    body = items.length ? (
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{items.map((s) => <SchoolCard key={s.id} school={s} lang={lang} dict={dict} />)}</div>
    ) : <EmptyState icon={<Bookmark className="size-6" />} title={dict.dashboard.noSavedSchools} action={<Button asChild><Link href={localizedPath(lang, "/schools")}>{dict.nav.schools}</Link></Button>} />;
  } else if (tab === "articles") {
    const { data } = articleIds.length ? await supabase.from("articles").select(ARTICLE_CARD).in("id", articleIds).eq("status", "published") : { data: [] };
    const items = (data ?? []) as unknown as ArticleCardData[];
    body = items.length ? (
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{items.map((a) => <ArticleCard key={a.id} article={a} lang={lang} dict={dict} />)}</div>
    ) : <EmptyState icon={<FileText className="size-6" />} title={dict.dashboard.noSavedArticles} action={<Button asChild><Link href={localizedPath(lang, "/education")}>{dict.nav.education}</Link></Button>} />;
  } else if (tab === "reviews") {
    const { data } = await supabase.from("reviews").select("*, profiles(display_name,avatar_url), schools(slug,name)").eq("user_id", userId).order("created_at", { ascending: false });
    const items = (data ?? []) as unknown as ReviewData[];
    body = items.length ? (
      <div className="space-y-4">
        {items.map((r) => (
          <div key={r.id}>
            <p className="mb-2 text-small text-ink-600">
              {dict.dashboard.forSchool}:{" "}
              <Link className="font-semibold text-brand-700 hover:underline" href={localizedPath(lang, `/schools/${r.schools?.slug}`)}>{tr(r.schools?.name, lang)}</Link>
            </p>
            <ReviewCard review={r} showStatus actions={<DeleteContentButton kind="review" id={r.id} />} />
          </div>
        ))}
      </div>
    ) : <EmptyState icon={<Star className="size-6" />} title={dict.dashboard.noReviews} action={<Button asChild><Link href={localizedPath(lang, "/schools")}>{dict.nav.schools}</Link></Button>} />;
  } else if (tab === "posts") {
    const { data } = await supabase
      .from("community_posts")
      .select("id,title,body,status,is_pinned,comment_count,view_count,created_at,moderation_note,community_categories!inner(slug,name),profiles(display_name,avatar_url)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    const items = (data ?? []) as unknown as PostData[];
    const tone = { pending: "warning", published: "success", rejected: "danger", hidden: "neutral" } as const;
    const label = { pending: dict.reviews.statusPending, published: dict.reviews.statusPublished, rejected: dict.reviews.statusRejected, hidden: dict.reviews.statusHidden };
    body = items.length ? (
      <ul className="space-y-4">
        {items.map((p) => (
          <li key={p.id} className="rounded-card border border-ink-200 bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={tone[p.status]}>{label[p.status]}</Badge>
              <Badge tone="brand">{tr(p.community_categories.name, lang)}</Badge>
              <span className="text-caption text-ink-500">{formatDate(p.created_at, lang, "short")}</span>
            </div>
            <h3 className="mt-2 text-h3 font-semibold">
              {p.status === "published" ? <Link className="hover:text-brand-700" href={localizedPath(lang, `/community/post/${p.id}`)}>{p.title}</Link> : p.title}
            </h3>
            <p className="mt-1 line-clamp-2 whitespace-pre-line text-small text-ink-600">{p.body}</p>
            {p.moderation_note ? <p className="mt-3 rounded-control bg-warning-50 p-3 text-small"><strong>{dict.reviews.moderatorNote}: </strong>{p.moderation_note}</p> : null}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-caption text-ink-500">{fmt(dict.community.replies, { count: p.comment_count })}</span>
              <DeleteContentButton kind="post" id={p.id} />
            </div>
          </li>
        ))}
      </ul>
    ) : <EmptyState icon={<MessageSquare className="size-6" />} title={dict.dashboard.noPosts} action={<Button asChild><Link href={localizedPath(lang, "/community/new")}>{dict.community.newPost}</Link></Button>} />;
  } else if (tab === "account") {
    body = <AccountSettings email={auth.user.email ?? ""} />;
  } else {
    const cities = await listCities();
    body = (
      <ProfileForm
        cities={cities}
        initial={{
          displayName: profile.data?.display_name ?? "",
          bio: profile.data?.bio ?? "",
          cityId: profile.data?.city_id ?? "",
          preferredLang: (profile.data?.preferred_lang as "kg" | "ru" | "en") ?? lang,
        }}
      />
    );
  }

  return (
    <>
      <PageHeader title={fmt(dict.dashboard.welcome, { name: profile.data?.display_name ?? "" })} description={auth.user.email} />
      <div className="container-page py-8">
        {notice ? <Alert tone="success" className="mb-6">{notice}</Alert> : null}
        <nav aria-label={dict.dashboard.title} className="scrollbar-none -mx-1 mb-8 flex gap-1 overflow-x-auto rounded-card bg-white p-1.5 shadow-card">
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <Link
              key={key}
              href={`${localizedPath(lang, "/dashboard")}?tab=${key}`}
              aria-current={tab === key ? "page" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-control px-4 py-2.5 text-small font-semibold transition-colors",
                tab === key ? "bg-brand-700 text-white" : "text-ink-700 hover:bg-ink-100"
              )}
            >
              <Icon className="size-4" /> {label}
              {count ? <span className={cn("rounded-full px-1.5 text-caption", tab === key ? "bg-white/20" : "bg-ink-100")}>{count}</span> : null}
            </Link>
          ))}
        </nav>
        {body}
      </div>
    </>
  );
}
