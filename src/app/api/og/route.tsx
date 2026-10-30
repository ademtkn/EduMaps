import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

const FONT_DIR = path.join(process.cwd(), "node_modules/@fontsource/inter/files");
let fontsPromise: Promise<{ name: string; data: Buffer; weight: 700; style: "normal" }[]> | undefined;

function loadFonts() {
  fontsPromise ??= Promise.all(
    ["latin", "cyrillic", "cyrillic-ext"].map(async (subset) => ({
      name: "Inter",
      data: await readFile(path.join(FONT_DIR, `inter-${subset}-700-normal.woff`)),
      weight: 700 as const,
      style: "normal" as const,
    }))
  );
  return fontsPromise;
}

/** Dynamic Open Graph card: /api/og?title=...&lang=kg */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("title") ?? "EduMaps.kg";
  const title = raw.replace(/\s+/g, " ").trim().slice(0, 110) || "EduMaps.kg";
  const fonts = await loadFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #0b2133 0%, #185078 60%, #1f7450 140%)",
          color: "white",
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 40, fontWeight: 700 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "white", marginRight: 20, display: "flex" }} />
          EduMaps<span style={{ color: "#74c59e" }}>.kg</span>
        </div>
        <div style={{ fontSize: title.length > 60 ? 56 : 72, fontWeight: 700, lineHeight: 1.1, letterSpacing: -2 }}>{title}</div>
        <div style={{ fontSize: 28, opacity: 0.8, fontWeight: 700 }}>A project developed and operated by Line.kg</div>
      </div>
    ),
    { width: 1200, height: 630, fonts, headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" } }
  );
}
