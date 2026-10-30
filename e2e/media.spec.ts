import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";

const ADMIN = { email: process.env.SEED_ADMIN_EMAIL ?? "admin@edumap.kg", password: process.env.SEED_ADMIN_PASSWORD ?? "EduMap-Admin-2026!" };
const STORAGE = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:56321"}/storage/v1/object/public/media`;

async function login(page: Page) {
  await page.goto(`/en/auth/login?next=${encodeURIComponent("/admin")}`);
  await page.getByLabel("Email").fill(ADMIN.email);
  await page.getByLabel("Password", { exact: true }).fill(ADMIN.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL((u) => !u.pathname.includes("/auth/login"));
}

async function openSilkRoad(page: Page) {
  await page.goto("/admin/schools?q=silk+road");
  await page.getByRole("link", { name: "Edit" }).first().click();
  await page.waitForURL(/\/admin\/schools\/[0-9a-f-]{36}/);
}

test.describe.serial("media: small files, links instead of uploads", () => {
  test("an uploaded photo is shrunk, converted to WebP and stripped of hidden data", async ({ page }) => {
    const raw = Buffer.alloc(3200 * 2100 * 3);
    for (let i = 0; i < raw.length; i++) raw[i] = (i * 31 + ((i >> 7) ^ (i >> 3)) * 17) & 255;
    const photo = await sharp(raw, { raw: { width: 3200, height: 2100, channels: 3 } }).withExif({ IFD0: { Copyright: "Hidden Owner", Make: "Hidden Camera" } }).jpeg({ quality: 95 }).toBuffer();
    expect(photo.length).toBeGreaterThan(2_000_000);

    await login(page);
    await page.goto("/admin/media");
    await page.getByLabel("Choose images to upload").setInputFiles({ name: "holiday-photo.jpg", mimeType: "image/jpeg", buffer: photo });
    await expect(page.getByText(/uploaded and optimised: [\d.]+ MB → \d+ KB/)).toBeVisible();

    const card = page.locator("figure").first();
    await expect(card).toContainText("WEBP");
    const path = await card.locator("figcaption p").first().getAttribute("title");
    const stored = await (await page.request.get(`${STORAGE}/${path}`)).body();
    const meta = await sharp(stored).metadata();
    expect(meta.format).toBe("webp");
    expect(Math.max(meta.width!, meta.height!)).toBeLessThanOrEqual(1600);
    expect(meta.exif).toBeUndefined();
    expect(stored.length).toBeLessThan(photo.length / 3);

    page.once("dialog", (d) => d.accept());
    await card.getByRole("button", { name: "Delete file" }).click();
    await expect(page.getByText("holiday-photo")).toHaveCount(0);
  });

  test("files that are not pictures are refused", async ({ page }) => {
    await login(page);
    await page.goto("/admin/media");
    await page.getByLabel("Choose images to upload").setInputFiles({ name: "notes.jpg", mimeType: "image/jpeg", buffer: Buffer.from("this is only text pretending to be a picture") });
    await expect(page.getByText(/notes\.jpg: Only JPEG, PNG, WebP and AVIF images are accepted/)).toBeVisible();
    await page.getByLabel("Choose images to upload").setInputFiles({ name: "drawing.png", mimeType: "image/png", buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>') });
    await expect(page.getByText(/drawing\.png: Only JPEG, PNG, WebP and AVIF images are accepted/)).toBeVisible();
  });

  test("a Free school can show 2 photos, a Pro school 10 (only administrators see the plan)", async ({ page }) => {
    await login(page);
    await page.goto("/admin/schools/new");
    const add = page.getByRole("button", { name: "Add photo" });
    await add.click();
    await add.click();
    await expect(page.getByText("2 of 2 photos")).toBeVisible();
    await expect(page.getByText("(Free plan)")).toBeVisible();
    await expect(add).toBeDisabled();
    await page.getByLabel("Listing plan (only administrators see this)").selectOption("pro");
    await expect(page.getByText("2 of 10 photos")).toBeVisible();
    await expect(add).toBeEnabled();
    const video = page.getByRole("button", { name: "Add video" });
    await video.click();
    await expect(page.getByText("1 of 5 videos")).toBeVisible();
    await expect(video).toBeEnabled();
  });

  test("document links show where they lead and are counted when opened", async ({ page, context }) => {
    await context.route("https://drive.google.com/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "ok" }));
    await login(page);
    await openSilkRoad(page);
    await page.getByRole("button", { name: "Add document link" }).click();
    await page.locator("#doc-title-0").fill("Admission rules 2026/27");
    await page.locator("#doc-url-0").fill("http://example.com/rules.pdf");
    await page.getByRole("button", { name: "Save school" }).click();
    await expect(page.getByText("Use a full link that starts with https://").first()).toBeVisible();
    await page.locator("#doc-url-0").fill("https://drive.google.com/file/d/e2e-demo/view");
    await page.getByRole("button", { name: "Save school" }).click();
    await expect(page.getByText("School saved")).toBeVisible();

    await page.goto("/en/schools/silk-road-lyceum");
    const docs = page.locator("#documents");
    await expect(docs.getByRole("heading", { name: "Documents" })).toBeVisible();
    const link = docs.getByRole("link", { name: /Admission rules 2026\/27/ });
    await expect(link).toHaveAttribute("href", "https://drive.google.com/file/d/e2e-demo/view");
    await expect(link).toHaveAttribute("rel", /noopener/);
    await expect(link).toContainText("Opens Google Drive");
    const counted = page.waitForRequest((r) => r.url().endsWith("/api/track") && (r.postData() ?? "").includes('"meta":"document"'));
    await link.click();
    await counted;

  });

  test("a video loads nothing from YouTube until the visitor presses play", async ({ page }) => {
    await login(page);
    await openSilkRoad(page);
    await page.getByRole("button", { name: "Add video" }).click();
    await page.getByLabel("YouTube URL").fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    await page.getByRole("button", { name: "Save school" }).click();
    await expect(page.getByText("School saved")).toBeVisible();

    const requests: string[] = [];
    page.on("request", (r) => requests.push(r.url()));
    await page.goto("/en/schools/silk-road-lyceum");
    const videos = page.locator("#videos");
    await videos.scrollIntoViewIfNeeded();
    const play = videos.getByRole("button", { name: /Play video/ });
    await expect(play).toBeVisible();
    await expect(videos.getByText("Plays from YouTube when you press play")).toBeVisible();
    await expect(videos.locator("iframe")).toHaveCount(0);
    // (the school's Google map does load by itself, so only YouTube hosts are checked here)
    expect(requests.filter((u) => /youtube|ytimg/.test(new URL(u).hostname))).toEqual([]);
    await page.route("https://www.youtube-nocookie.com/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<p>video</p>" }));
    await play.click();
    await expect(videos.locator("iframe")).toHaveAttribute("src", /^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
  });

  test("restore the school used by these tests", async ({ page }) => {
    await login(page);
    await openSilkRoad(page);
    const rows = (field: string) => page.locator("div.rounded-card.bg-ink-50").filter({ has: page.locator(field) });
    while (await rows('[id^="doc-title-"]').count()) await rows('[id^="doc-title-"]').first().getByRole("button", { name: "Remove" }).click();
    while (await rows('[id^="vid-"]').count()) await rows('[id^="vid-"]').first().getByRole("button", { name: "Remove" }).click();
    await page.getByRole("button", { name: "Save school" }).click();
    await expect(page.getByText("School saved")).toBeVisible();
    await page.goto("/en/schools/silk-road-lyceum");
    await expect(page.locator("#documents")).toHaveCount(0);
    await expect(page.locator("#videos")).toHaveCount(0);
  });
});
