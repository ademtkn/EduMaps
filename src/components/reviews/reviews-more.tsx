"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ReviewData } from "@/lib/data/types";
import { useDict } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { ReviewCard } from "./review-card";

/** Loads the remaining published reviews on demand so the school page itself stays statically cacheable. */
export function ReviewsMore({ schoolId, offset, total, pageSize = 8 }: { schoolId: string; offset: number; total: number; pageSize?: number }) {
  const dict = useDict();
  const [items, setItems] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(false);
  const loaded = offset + items.length;

  async function loadMore() {
    setLoading(true);
    const { data } = await createClient()
      .from("reviews")
      .select("*, profiles(display_name,avatar_url)")
      .eq("school_id", schoolId)
      .eq("status", "published")
      .order("helpful_count", { ascending: false })
      .order("created_at", { ascending: false })
      .range(loaded, loaded + pageSize - 1);
    setItems((prev) => [...prev, ...((data ?? []) as unknown as ReviewData[])]);
    setLoading(false);
  }

  return (
    <>
      {items.map((review) => <ReviewCard key={review.id} review={review} />)}
      {loaded < total ? (
        <div className="text-center">
          <Button variant="outline" onClick={loadMore} disabled={loading}>{loading ? dict.common.loading : dict.reviews.loadMore}</Button>
        </div>
      ) : null}
    </>
  );
}
