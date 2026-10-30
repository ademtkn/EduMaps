import Image from "next/image";
import { cn } from "@/lib/utils";

/** Square EduMaps mark (book and map pin). */
export function LogoMark({ className }: { className?: string }) {
  return <Image src="/brand/mark.png" alt="" width={256} height={208} className={cn("h-8 w-auto", className)} />;
}

/** Full EduMaps.kg logo. Use `tone="light"` on dark backgrounds. */
export function Logo({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <Image
      src={tone === "light" ? "/brand/logo-white.png" : "/brand/logo.png"}
      alt="EduMaps.kg"
      width={611}
      height={160}
      priority
      className={cn("h-10 w-auto sm:h-11", className)}
    />
  );
}
