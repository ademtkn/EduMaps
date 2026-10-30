"use client";

import { Pencil } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ReviewData } from "@/lib/data/types";
import { useAuth } from "@/components/auth/auth-provider";
import { useDict } from "@/components/i18n-provider";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { LLink } from "@/components/ui/localized-link";
import { useToast } from "@/components/ui/toast";
import { ReviewCard } from "./review-card";
import { ReviewForm } from "./review-form";

const SELECT = "*, profiles(display_name,avatar_url)";

/** The signed-in member's own review of this school (any moderation status) or the form to write one. */
export function MyReviewPanel({ schoolId, banned = false }: { schoolId: string; banned?: boolean }) {
  const { member, ready } = useAuth();
  const dict = useDict();
  const { toast } = useToast();
  const [own, setOwn] = useState<ReviewData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    if (!member) return setLoaded(true);
    const { data } = await createClient().from("reviews").select(SELECT).eq("school_id", schoolId).eq("user_id", member.id).maybeSingle();
    setOwn((data as unknown as ReviewData) ?? null);
    setLoaded(true);
  }, [member, schoolId]);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  if (!ready || !loaded) return <div className="h-40 animate-pulse rounded-card bg-ink-100" aria-hidden="true" />;

  if (!member) {
    return (
      <Card>
        <CardBody className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-h3 font-semibold">{dict.reviews.writeTitle}</h3>
            <p className="mt-1 text-small text-ink-600">{dict.reviews.writeDescription}</p>
          </div>
          <Button asChild>
            <LLink href={`/auth/login?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/")}`}>{dict.reviews.loginPrompt}</LLink>
          </Button>
        </CardBody>
      </Card>
    );
  }

  if (banned) return <Alert tone="warning">{dict.reviews.banned}</Alert>;

  if (own && !editing) {
    return (
      <div className="space-y-3">
        <h3 className="text-h3 font-semibold">{dict.reviews.yourReview}</h3>
        <ReviewCard
          review={own}
          showStatus
          actions={
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil /> {dict.common.edit}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <Card>
      <CardBody>
        <h3 className="text-h3 font-semibold">{dict.reviews.writeTitle}</h3>
        <p className="mb-6 mt-1 text-small text-ink-600">{dict.reviews.writeDescription}</p>
        <ReviewForm
          schoolId={schoolId}
          existing={own}
          onSaved={() => {
            toast("success", dict.reviews.submitted);
            setEditing(false);
            void load();
          }}
        />
      </CardBody>
    </Card>
  );
}
