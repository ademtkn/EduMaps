"use client";

import type { User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

export type Member = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: "user" | "moderator" | "admin";
};

type FavoriteKind = "school" | "article";

type AuthState = {
  member: Member | null;
  ready: boolean;
  isSaved: (kind: FavoriteKind, id: string) => boolean;
  /** Returns false when the visitor is not signed in (caller decides how to react). */
  toggleSaved: (kind: FavoriteKind, id: string) => Promise<boolean>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [member, setMember] = useState<Member | null>(null);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState<{ school: Set<string>; article: Set<string> }>({
    school: new Set(),
    article: new Set(),
  });

  const load = useCallback(
    async (user: User | null) => {
      if (!user) {
        setMember(null);
        setSaved({ school: new Set(), article: new Set() });
        setReady(true);
        return;
      }
      const [profile, account, favorites] = await Promise.all([
        supabase.from("profiles").select("display_name,avatar_url").eq("user_id", user.id).maybeSingle(),
        supabase.from("users").select("role").eq("id", user.id).maybeSingle(),
        supabase.from("favorites").select("school_id,article_id").eq("user_id", user.id),
      ]);
      setMember({
        id: user.id,
        email: user.email ?? "",
        displayName: profile.data?.display_name ?? user.email?.split("@")[0] ?? "",
        avatarUrl: profile.data?.avatar_url ?? null,
        role: account.data?.role ?? "user",
      });
      const rows = favorites.data ?? [];
      setSaved({
        school: new Set(rows.flatMap((r) => (r.school_id ? [r.school_id] : []))),
        article: new Set(rows.flatMap((r) => (r.article_id ? [r.article_id] : []))),
      });
      setReady(true);
    },
    [supabase]
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => load(data.session?.user ?? null));
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;
      // Defer to avoid awaiting Supabase calls inside the auth callback.
      setTimeout(() => load(session?.user ?? null), 0);
    });
    return () => subscription.subscription.unsubscribe();
  }, [supabase, load]);

  const isSaved = useCallback((kind: FavoriteKind, id: string) => saved[kind].has(id), [saved]);

  const toggleSaved = useCallback(
    async (kind: FavoriteKind, id: string) => {
      if (!member) return false;
      const currentlySaved = saved[kind].has(id);
      const apply = (on: boolean) =>
        setSaved((prev) => {
          const next = new Set(prev[kind]);
          if (on) next.add(id);
          else next.delete(id);
          return { ...prev, [kind]: next };
        });

      apply(!currentlySaved);
      const column = kind === "school" ? "school_id" : "article_id";
      const { error } = currentlySaved
        ? await supabase.from("favorites").delete().eq("user_id", member.id).eq(column, id)
        : await supabase
            .from("favorites")
            .insert(kind === "school" ? { user_id: member.id, school_id: id } : { user_id: member.id, article_id: id });
      if (error && error.code !== "23505") apply(currentlySaved);
      return true;
    },
    [member, saved, supabase]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    window.location.assign(window.location.pathname);
  }, [supabase]);

  const value = useMemo(
    () => ({ member, ready, isSaved, toggleSaved, signOut }),
    [member, ready, isSaved, toggleSaved, signOut]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthProvider is missing");
  return ctx;
}
