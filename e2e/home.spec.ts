import { expect, test, type Page } from "@playwright/test";

const ADMIN = { email: process.env.SEED_ADMIN_EMAIL ?? "admin@edumap.kg", password: process.env.SEED_ADMIN_PASSWORD ?? "EduMap-Admin-2026!" };
const PASSWORD = "Passw0rd-e2e!";

async function login(page: Page, who: { email: string; password: string }, next = "/en/dashboard") {
  await page.goto(`/en/auth/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email").fill(who.email);
  await page.getByLabel("Password", { exact: true }).fill(who.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL((u) => !u.pathname.includes("/auth/login"));
}

test.describe("home page: schools and sponsored card", () => {
  test("shows five schools and one labelled advertisement, with no ranking numbers", async ({ page }) => {
    await page.goto("/en");
    const grid = page.getByTestId("rotating-schools");
    await expect(grid.locator("article").filter({ hasNot: page.locator("aside") })).toHaveCount(5, { timeout: 15_000 });
    await expect(grid.locator("aside[aria-label='Advertisement']")).toHaveCount(1);
    await expect(grid.getByText("Advertisement")).toBeVisible();
    await expect(grid.getByText(/^#\d+$/)).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 2, name: "Discover schools" })).toBeVisible();
    await expect(page.getByText("Top-rated schools")).toHaveCount(0);
  });

  test("the advertisement moves to a different place and the schools change from one visit to the next", async ({ page }) => {
    const positions = new Set<number>();
    const selections = new Set<string>();
    for (let i = 0; i < 10; i++) {
      await page.goto("/en");
      const grid = page.getByTestId("rotating-schools");
      await expect(grid.locator("aside[aria-label='Advertisement']")).toHaveCount(1);
      await page.waitForTimeout(400); // the fresh selection is swapped in right after the page loads
      const cells = grid.locator("> div > *");
      const total = await cells.count();
      for (let c = 0; c < total; c++) if (await cells.nth(c).locator("aside[aria-label='Advertisement']").count()) positions.add(c);
      selections.add((await grid.locator("article h3").allInnerTexts()).join("|"));
    }
    expect(positions.size).toBeGreaterThan(1);
    expect(selections.size).toBeGreaterThan(3);
  });

  test("only the schools section refreshes itself every 15 seconds, and the visitor can pause it", async ({ page }) => {
    await page.clock.install();
    await page.goto("/en");
    const grid = page.getByTestId("rotating-schools");
    await grid.scrollIntoViewIfNeeded();
    let calls = 0;
    page.on("request", (r) => { if (r.url().includes("/api/home/schools")) calls += 1; });
    const reloads: string[] = [];
    page.on("framenavigated", (f) => { if (f === page.mainFrame()) reloads.push(f.url()); });
    const before = calls;
    await page.clock.fastForward(15_500);
    await expect.poll(() => calls).toBeGreaterThan(before);
    await expect(grid.getByText("New selection every 15 seconds")).toBeVisible();
    expect(reloads.length).toBeLessThanOrEqual(1); // the page itself was never reloaded

    await grid.getByRole("button", { name: "Pause" }).click();
    await expect(grid.getByText("Paused")).toBeVisible();
    const paused = calls;
    await page.clock.fastForward(46_000);
    expect(calls).toBe(paused);
    await grid.getByRole("button", { name: "Resume" }).click();
    // while the pointer is over the section it waits; once the visitor moves away it continues
    await page.mouse.move(0, 0);
    await page.clock.fastForward(15_500);
    await expect.poll(() => calls).toBeGreaterThan(paused);
  });

  test("the sponsored card is an advertisement link that never says it is a school", async ({ page }) => {
    await page.goto("/en");
    const ad = page.getByTestId("rotating-schools").locator("aside[aria-label='Advertisement']");
    await expect(ad).toBeVisible();
    await expect(ad.locator("a[rel~='sponsored']").first()).toHaveAttribute("href", /\/api\/ads\/[0-9a-f-]{36}\/click/);
  });
});

test.describe.serial("home page: what people say about the site", () => {
  const email = `e2e-voice-${Date.now()}@example.com`;
  const opinion = `EduMaps.kg helped us compare three schools in an evening. Reference ${Date.now()}.`;

  test("the section shows opinions marked as samples, and rotates every 15 seconds", async ({ page }) => {
    await page.clock.install();
    await page.goto("/en");
    const section = page.getByRole("region", { name: "What people say about EduMaps.kg" });
    await section.scrollIntoViewIfNeeded();
    await expect(section.getByText("Demo", { exact: true })).toBeVisible();
    const first = await section.locator("blockquote").innerText();
    await page.clock.fastForward(15_500);
    await expect.poll(async () => section.locator("blockquote").innerText()).not.toBe(first);
    await section.getByRole("button", { name: "Pause" }).click();
    const held = await section.locator("blockquote").innerText();
    await page.clock.fastForward(60_000);
    expect(await section.locator("blockquote").innerText()).toBe(held);
    await section.getByRole("button", { name: "Next opinion" }).click();
    await expect.poll(async () => section.locator("blockquote").innerText()).not.toBe(held);
  });

  test("a member sends an opinion, it waits for review, then it appears after approval", async ({ page }) => {
    await page.goto("/en/feedback");
    await expect(page.getByText("Please sign in to share your opinion")).toBeVisible();

    await page.goto("/en/auth/register");
    await page.getByLabel("Display name").fill("E2E Voice");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("checkbox", { name: /at least 16/ }).check();
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await page.waitForURL(/\/en\/dashboard/);

    await page.goto("/en/feedback");
    await page.getByRole("button", { name: "Send for review" }).click();
    await expect(page.getByText("This is too short.")).toBeVisible();
    await page.getByLabel("Your opinion").fill(opinion);
    await page.getByLabel("You are").selectOption("parent");
    await page.getByRole("button", { name: "Send for review" }).click();
    await expect(page.getByText("Please accept the Terms of Use and the Privacy Policy to continue.")).toBeVisible();
    await page.getByRole("checkbox", { name: /shown publicly/ }).check();
    await page.getByRole("button", { name: "Send for review" }).click();
    await expect(page.getByText("Our team will read it before it appears on the home page.")).toBeVisible();

    await page.goto("/en/feedback");
    await expect(page.getByText("Waiting for review")).toBeVisible();
    // not public yet
    const anon = await page.context().browser()!.newPage();
    await anon.goto("/en");
    await expect(anon.getByText(opinion)).toHaveCount(0);
    await anon.close();
  });

  test("the administrator approves it and it reaches the home page, then deletes it", async ({ page }) => {
    await login(page, ADMIN, "/admin/testimonials");
    await page.goto("/admin/testimonials");
    const card = page.locator("div.p-5").filter({ hasText: opinion });
    await expect(card.getByText("E2E Voice")).toBeVisible();
    await card.getByRole("button", { name: "Show on home page" }).click();
    await expect(card).toHaveCount(0);

    await page.goto("/en/feedback").catch(() => undefined);
    const visitor = await page.context().browser()!.newPage();
    let found = false;
    for (let i = 0; i < 40 && !found; i++) {
      await visitor.goto("/en");
      const section = visitor.getByRole("region", { name: "What people say about EduMaps.kg" });
      await section.scrollIntoViewIfNeeded();
      const dots = await section.getByRole("button", { name: /^Show opinion/ }).count();
      for (let d = 1; d <= dots && !found; d++) {
        await section.getByRole("button", { name: `Show opinion ${d}` }).click();
        found = (await section.locator("blockquote").innerText()).includes(opinion);
      }
    }
    expect(found).toBeTruthy();
    await visitor.close();

    await page.goto("/admin/testimonials?status=published");
    const published = page.locator("div.p-5").filter({ hasText: opinion });
    page.once("dialog", (d) => d.accept());
    await published.getByRole("button", { name: "Delete" }).click();
    await expect(published).toHaveCount(0);
  });

  test("an administrator can add a guest opinion only with a permission note", async ({ page }) => {
    await login(page, ADMIN, "/admin/testimonials");
    await page.goto("/admin/testimonials");
    await page.getByRole("button", { name: "Add a guest opinion" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Name").fill("Guest E2E");
    await dialog.getByLabel("Opinion (up to 400 characters)").fill("A short opinion written for an automated test.");
    await dialog.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Say how the person gave permission").first()).toBeVisible();
    await dialog.getByLabel("How did this person give permission?").fill("Test entry created by the automated suite");
    await dialog.getByLabel("Status").selectOption("pending");
    await dialog.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Saved")).toBeVisible();
    await page.goto("/admin/testimonials");
    const card = page.locator("div.p-5").filter({ hasText: "Guest E2E" });
    await expect(card.getByText("Test entry created by the automated suite")).toBeVisible();
    page.once("dialog", (d) => d.accept());
    await card.getByRole("button", { name: "Delete" }).click();
    await expect(card).toHaveCount(0);
  });
});
