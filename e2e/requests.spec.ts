import { expect, test, type Page } from "@playwright/test";

const ADMIN = { email: process.env.SEED_ADMIN_EMAIL ?? "admin@edumap.kg", password: process.env.SEED_ADMIN_PASSWORD ?? "EduMap-Admin-2026!" };
const SCHOOL = "chu-valley-lyceum";
const MAIL = process.env.E2E_MAIL_URL ?? "http://127.0.0.1:56324";

/** The team notification for a submission lands in the local mail catcher; returns its plain text body. */
async function teamMail(unique: string): Promise<{ subject: string; text: string; replyTo: string }> {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const list = await (await fetch(`${MAIL}/api/v1/search?query=${encodeURIComponent(`to:team@edumaps.local "${unique}"`)}`)).json();
    const hit = list.messages?.[0];
    if (hit) {
      const full = await (await fetch(`${MAIL}/api/v1/message/${hit.ID}`)).json();
      return { subject: full.Subject as string, text: full.Text as string, replyTo: (full.ReplyTo?.[0]?.Address ?? "") as string };
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`no team notification containing "${unique}"`);
}

const RUN = Date.now();

async function login(page: Page, who: { email: string; password: string }, next = "/en/dashboard") {
  await page.goto(`/en/auth/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email").fill(who.email);
  await page.getByLabel("Password", { exact: true }).fill(who.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL((u) => !u.pathname.includes("/auth/login"));
}

test.describe.serial("correction requests", () => {
  const message = `The phone number is out of date, please use 0312 000 ${RUN % 100000}.`;
  const reporter = `reporter-${RUN}@example.com`;

  test("a visitor reports wrong information without signing in", async ({ page }) => {
    await page.goto(`/en/schools/${SCHOOL}`);
    await page.getByRole("button", { name: "Report incorrect information" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Send report" }).click();
    await expect(dialog.getByText("This field is required.").first()).toBeVisible();
    await dialog.getByLabel("What is wrong?").selectOption("contact");
    await dialog.getByLabel("What should it say?").fill(message);
    await dialog.getByLabel("Where can we check this? (optional)").fill("https://example.com/school");
    await dialog.getByLabel("Your email (optional)").fill(reporter);
    await dialog.getByRole("button", { name: "Send report" }).click();
    await expect(dialog.getByText("Please accept the Terms of Use and the Privacy Policy to continue.")).toBeVisible();
    await dialog.getByRole("checkbox").check();
    await dialog.getByRole("button", { name: "Send report" }).click();
    await expect(dialog.getByText("Thank you, we will check it")).toBeVisible();
    const mail = await teamMail(message);
    expect(mail.subject).toMatch(/^\[EduMaps\.kg\] correction for /);
    expect(mail.replyTo).toBe(reporter);
    expect(mail.text).toContain("/admin/corrections");
  });

  test("an administrator sees it and marks it applied", async ({ page }) => {
    await login(page, ADMIN, "/admin/corrections");
    await page.goto("/admin/corrections");
    const card = page.locator("div.p-5").filter({ hasText: message });
    await expect(card.getByText(message)).toBeVisible();
    await expect(card.getByText(reporter)).toBeVisible();
    await card.getByRole("button", { name: "Mark applied" }).click();
    await expect(card).toHaveCount(0);
    await page.goto("/admin/corrections?status=applied");
    await expect(page.getByText(message)).toBeVisible();
  });
});

test.describe("moderators", () => {
  const MODERATOR = { email: "moderator@edumap.kg", password: ADMIN.password };

  test("a moderator handles messages and corrections but not the rest of the console", async ({ page }) => {
    await login(page, MODERATOR, "/admin");
    const nav = page.getByRole("navigation", { name: "Admin" });
    await expect(nav.getByRole("link", { name: /^Messages/ })).toBeVisible();
    await expect(nav.getByRole("link", { name: /^Corrections/ })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Analytics" })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Users" })).toHaveCount(0);
    await page.goto("/admin/messages?status=all");
    await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);
    await page.goto("/admin/corrections?status=all");
    await expect(page.getByRole("heading", { name: "Corrections" })).toBeVisible();
  });
});

test.describe.serial("school staff send information", () => {
  const message = `Our opening hours are 08:30 to 15:30 on weekdays. Reference ${RUN}.`;
  const staffEmail = `office-${RUN}@school.example`;

  test("school staff can send missing information, and must leave a way to verify it", async ({ page }) => {
    await page.goto(`/en/schools/${SCHOOL}`);
    await page.getByRole("button", { name: "Report incorrect information" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("What is wrong?").selectOption("missing");
    await dialog.getByLabel("I am…").selectOption("school_staff");
    await expect(dialog.getByText("Only the EduMaps.kg team edits school pages, so every school is treated the same.")).toBeVisible();
    await dialog.getByLabel("What should it say?").fill(message);
    await dialog.getByRole("button", { name: "Send report" }).click();
    await expect(dialog.getByText("School staff: please leave an email or a phone number.")).toBeVisible();
    await dialog.getByLabel("Your email (optional)").fill(staffEmail);
    await dialog.getByRole("checkbox").check();
    await dialog.getByRole("button", { name: "Send report" }).click();
    await expect(dialog.getByText("Thank you, we will check it")).toBeVisible();
  });

  test("the administrator sees where it came from", async ({ page }) => {
    await login(page, ADMIN, "/admin/corrections");
    await page.goto("/admin/corrections");
    const card = page.locator("div.p-5").filter({ hasText: message });
    await expect(card.getByText("From the school: verify before applying")).toBeVisible();
    await expect(card.getByText("Information missing")).toBeVisible();
    await expect(card.getByText(staffEmail)).toBeVisible();
    await card.getByRole("button", { name: "Mark applied" }).click();
    await expect(card).toHaveCount(0);
  });

  test("there is no school login or claim flow: pages are edited by the team only", async ({ page, request }) => {
    expect((await request.get(`/en/schools/${SCHOOL}/claim`)).status()).toBe(404);
    await page.goto(`/en/schools/${SCHOOL}`);
    await expect(page.getByRole("link", { name: "Claim this profile" })).toHaveCount(0);
  });
});
