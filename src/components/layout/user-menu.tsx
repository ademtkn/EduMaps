"use client";

import { LayoutDashboard, LogOut, Shield } from "lucide-react";
import Link from "next/link";
import { localizedPath } from "@/lib/i18n/config";
import { initials } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { useDict, useLang } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";

export function UserMenu() {
  const { member, ready, signOut } = useAuth();
  const dict = useDict();
  const lang = useLang();

  if (!ready) return <div className="h-10 w-24 animate-pulse rounded-control bg-ink-100" aria-hidden="true" />;

  if (!member) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="sm:hidden">
          <Link href={localizedPath(lang, "/auth/login")}>{dict.nav.signIn}</Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
          <Link href={localizedPath(lang, "/auth/login")}>{dict.nav.signIn}</Link>
        </Button>
        <Button asChild size="sm" className="hidden sm:inline-flex">
          <Link href={localizedPath(lang, "/auth/register")}>{dict.nav.signUp}</Link>
        </Button>
      </div>
    );
  }

  return (
    <Dropdown>
      <DropdownTrigger
        aria-label={dict.nav.account}
        className="flex size-10 items-center justify-center rounded-full bg-brand-700 text-small font-bold text-white transition-colors hover:bg-brand-800"
      >
        {initials(member.displayName) || "U"}
      </DropdownTrigger>
      <DropdownContent>
        <DropdownLabel className="px-3 py-2">
          <p className="truncate text-small font-semibold text-ink-900">{member.displayName}</p>
          <p className="truncate text-caption text-ink-500">{member.email}</p>
        </DropdownLabel>
        <DropdownSeparator />
        <DropdownItem asChild>
          <Link href={localizedPath(lang, "/dashboard")}>
            <LayoutDashboard /> {dict.nav.dashboard}
          </Link>
        </DropdownItem>
        {member.role === "admin" || member.role === "moderator" ? (
          <DropdownItem asChild>
            <a href="/admin">
              <Shield /> {dict.nav.admin}
            </a>
          </DropdownItem>
        ) : null}
        <DropdownSeparator />
        <DropdownItem onSelect={() => void signOut()}>
          <LogOut /> {dict.nav.signOut}
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}
