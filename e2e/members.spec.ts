import { expect, test, type Page } from "@playwright/test";

const USER = { email: "nurlan@example.com", password: process.env.SEED_USER_PASSWORD ?? "EduMap-Parent-2026!" };
const ADMIN = { email: process.env.SEED_ADMIN_EMAIL ?? "admin@edumap.kg", password: process.env.SEED_ADMIN_PASSWORD ?? "EduMap-Admin-2026!" };

async function login(page: Page, who: { email: string; password: string }, next = "/en/dashboard") {
  await page.goto(`/en/auth/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email").fill(who.email);
  await page.getByLabel("Password", { exact: true }).fill(who.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL((u) => !u.pathname.includes("/auth/login"));
}

test.describe.serial("member journey", () => {
  test("protected pages require sign-in", async ({ page }) => {
    await page.goto("/en/dashboard");
    await expect(page).toHaveURL(/\/en\/auth\/login\?next=/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("wrong password shows an error", async ({ page }) => {
    await page.goto("/en/auth/login");
    await page.getByLabel("Email").fill(USER.email);
    await page.getByLabel("Password", { exact: true }).fill("not-the-password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByText("Incorrect email or password.")).toBeVisible();
  });

  test("registration requires accepting the terms and privacy policy", async ({ page }) => {
    await page.goto("/en/auth/register");
    await page.getByLabel("Display name").fill("No Consent");
    await page.getByLabel("Email").fill(`e2e-noconsent-${Date.now()}@example.com`);
    await page.getByLabel("Password", { exact: true }).fill("Passw0rd-e2e!");
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await expect(page.getByText("Please accept the Terms of Use and the Privacy Policy to continue.")).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/register/);
    await expect(page.getByRole("link", { name: "Terms of Use" }).first()).toHaveAttribute("href", "/en/terms");
  });

  test("register, save a school and see it in the dashboard", async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`;
    await page.goto("/en/auth/register");
    await page.getByLabel("Display name").fill("E2E Parent");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("Passw0rd-e2e!");
    await page.getByRole("checkbox", { name: /at least 16/ }).check();
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await page.waitForURL(/\/en\/dashboard/);
    await page.goto("/en/schools/silk-road-lyceum");
    // the member is loaded in the browser after the page; saving before that would count as signed out
    await expect(page.getByRole("button", { name: /Account|E2E Parent|^EP$/ }).first()).toBeVisible();
    await page.getByRole("button", { name: "Save", exact: true }).first().click();
    await expect(page.getByRole("button", { name: "Saved" }).first()).toBeVisible();
    await page.goto("/en/dashboard?tab=schools");
    await expect(page.getByRole("heading", { name: "Silk Road Lyceum" })).toBeVisible();
  });

  test("review goes through moderation to publication", async ({ page, browser }) => {
    const title = `E2E review ${Date.now()}`;
    const email = `e2e-review-${Date.now()}@example.com`;
    await page.goto("/en/auth/register");
    await page.getByLabel("Display name").fill("E2E Reviewer");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("Passw0rd-e2e!");
    await page.getByRole("checkbox", { name: /at least 16/ }).check();
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await page.waitForURL(/\/en\/dashboard/);
    await page.goto("/en/schools/neva-russian-school#reviews");
    await page.getByRole("radio", { name: "5 / 5" }).first().click();
    await page.getByLabel("Headline").fill(title);
    await page.getByLabel("Your review").fill(`Automated test review ${title}: the teachers were attentive and communication with parents was prompt and clear.`);
    await page.getByRole("button", { name: "Submit for moderation" }).click();
    await expect(page.getByText("Pending moderation")).toBeVisible();

    const anon = await browser.newPage();
    await anon.goto("/en/schools/neva-russian-school");
    await expect(anon.getByText(title)).toHaveCount(0);

    const adminPage = await browser.newPage();
    await login(adminPage, ADMIN, "/admin/reviews");
    await adminPage.goto("/admin/reviews?status=pending");
    const card = adminPage.locator("section", { hasText: title });
    await card.getByRole("button", { name: "Approve" }).click();
    await expect(adminPage.locator("section", { hasText: title })).toHaveCount(0);

    await anon.goto("/en/schools/neva-russian-school");
    await expect(anon.getByText(title).first()).toBeVisible({ timeout: 30_000 });
  });

  test("spam is rejected with a friendly message", async ({ page }) => {
    await login(page, USER, "/en/community/new");
    await page.goto("/en/community/new");
    await page.getByLabel("Topic").selectOption({ label: "Preschool" });
    await page.getByLabel("Title").fill("Amazing offer for parents");
    await page.getByLabel("Details").fill("Visit http://a.example and http://b.example and http://c.example for the best casino deals today!");
    await page.getByRole("button", { name: "Submit for review" }).click();
    await expect(page.getByText(/looks like spam/)).toBeVisible();
  });
});

test.describe.serial("admin", () => {
  test("members cannot open the admin panel", async ({ page }) => {
    await login(page, USER, "/en");
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/kg$/);
  });

  test("admin creates, publishes and deletes a school", async ({ page }) => {
    await login(page, ADMIN, "/admin");
    await page.goto("/admin/schools/new");
    await page.getByLabel("School name").first().fill("E2E Test Academy");
    await page.getByLabel("City").selectOption({ label: "Bishkek" });
    await page.getByLabel("Status", { exact: true }).selectOption("published");
    await page.getByLabel("Latitude").fill("42.87");
    await page.getByLabel("Longitude").fill("74.6");
    await page.getByRole("tab", { name: /EN/ }).last().click();
    await page.getByLabel("Street address").fill("1 Test Street");
    await page.getByRole("button", { name: "Save school" }).click();
    await expect(page).toHaveURL(/\/admin\/schools\/[0-9a-f-]{36}/);

    await page.goto("/en/schools/e2e-test-academy");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("E2E Test Academy");

    await page.goBack();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Delete school" }).click();
    await expect(page).toHaveURL(/\/admin\/schools$/);
    const gone = await page.request.get("/en/schools/e2e-test-academy");
    expect(gone.status()).toBe(404);
  });

  test("admin adds a facility option and it appears in the school editor", async ({ page }) => {
    const name = `E2E Observatory ${Date.now()}`;
    await login(page, ADMIN, "/admin");
    await page.goto("/admin/options");
    await page.getByRole("button", { name: "Add" }).nth(1).click();
    await page.getByLabel("Name", { exact: false }).first().fill(name);
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText(name)).toBeVisible();
    await page.goto("/admin/schools/new");
    await expect(page.getByText(name)).toBeVisible();
    // clean up
    await page.goto("/admin/options");
    page.once("dialog", (d) => d.accept());
    await page.getByRole("row", { name: new RegExp(name) }).getByRole("button", { name: "Edit" }).click();
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText(name)).toHaveCount(0);
  });

  test("admin sets a yearly fee and what it covers, and visitors see it", async ({ page }) => {
    await login(page, ADMIN, "/admin");
    await page.goto("/admin/schools?q=silk+road");
    await page.getByRole("link", { name: "Edit" }).first().click();
    await page.waitForURL(/\/admin\/schools\/[0-9a-f-]{36}/);
    const editor = page.url();

    await page.getByLabel("Fee from (KGS)").fill("150000");
    await page.getByLabel("Fee to (KGS)").fill("200000");
    await page.getByLabel("Paid", { exact: true }).selectOption("year");
    await page.getByLabel("School year length").selectOption("10");
    await page.getByLabel("Exam and certificate fees: coverage").selectOption("separate");
    await page.getByLabel("Exam and certificate fees: extra cost (KGS)").fill("9000");
    await page.getByLabel("Exam and certificate fees: how often").selectOption("year");
    await page.getByRole("button", { name: "Save school" }).click();
    await expect(page.getByText("School saved")).toBeVisible();

    await page.goto("/en/schools/silk-road-lyceum#tuition");
    await expect(page.locator("#tuition")).toContainText("150,000 – 200,000 KGS / year");
    await expect(page.locator("#tuition")).toContainText("≈ 15,000 – 20,000 KGS / month");
    await expect(page.locator("#tuition")).toContainText("9,000 KGS / year");

    // restore the original monthly fee
    await page.goto(editor);
    await page.getByLabel("Fee from (KGS)").fill("16000");
    await page.getByLabel("Fee to (KGS)").fill("24000");
    await page.getByLabel("Paid", { exact: true }).selectOption("month");
    await page.getByLabel("School year length").selectOption("9");
    await page.getByLabel("Exam and certificate fees: coverage").selectOption("unknown");
    await page.getByRole("button", { name: "Save school" }).click();
    await expect(page.getByText("School saved")).toBeVisible();
  });

  test("an incomplete extra cost is rejected", async ({ page }) => {
    await login(page, ADMIN, "/admin");
    await page.goto("/admin/schools?q=silk+road");
    await page.getByRole("link", { name: "Edit" }).first().click();
    await page.waitForURL(/\/admin\/schools\/[0-9a-f-]{36}/);
    await page.getByLabel("School year length").waitFor();
    await page.getByLabel("Stationery: coverage").selectOption("separate");
    await page.getByLabel("Stationery: extra cost (KGS)").fill("1500");
    await page.getByRole("button", { name: "Save school" }).click();
    await expect(page.getByText("Enter both the amount and how often it is paid, or neither", { exact: true })).toBeVisible();
  });

  test("admin saves a WhatsApp number in any common format and visitors get the right link", async ({ page }) => {
    await login(page, ADMIN, "/admin");
    await page.goto("/admin/schools?q=silk+road");
    await page.getByRole("link", { name: "Edit" }).first().click();
    await page.waitForURL(/\/admin\/schools\/[0-9a-f-]{36}/);
    await page.getByLabel("WhatsApp number").fill("not a number");
    await page.getByRole("button", { name: "Save school" }).click();
    await expect(page.getByText("Enter a valid phone number, e.g. +996 555 123 456").first()).toBeVisible();
    await page.getByLabel("WhatsApp number").fill("0555 123 456");
    await page.getByRole("button", { name: "Save school" }).click();
    await expect(page.getByText("School saved")).toBeVisible();
    await page.goto("/en/schools/silk-road-lyceum");
    await expect(page.getByRole("link", { name: "WhatsApp", exact: true })).toHaveAttribute("href", /wa\.me\/996555123456\?text=/);
    // remove it again
    await page.goBack();
    await page.getByLabel("WhatsApp number").fill("");
    await page.getByRole("button", { name: "Save school" }).click();
    await expect(page.getByText("School saved")).toBeVisible();
  });

  test("school statistics pages show the same figures for every school", async ({ page }) => {
    await login(page, ADMIN, "/admin/school-stats");
    await page.goto("/admin/school-stats");
    await expect(page.getByRole("heading", { level: 1, name: "School statistics" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "WhatsApp" })).toBeVisible();
    await expect(page.getByText("All schools").first()).toBeVisible();
    await page.getByRole("link", { name: "Ala-Too International School" }).first().click();
    await expect(page.getByText("WhatsApp opened")).toBeVisible();
    await expect(page.getByText("What visitors looked at")).toBeVisible();
    await expect(page.getByText("Where visits came from")).toBeVisible();
    await expect(page.getByText("How long the page stayed open")).toBeVisible();
    await expect(page.getByText("the site cannot see whether a message was sent")).toBeVisible();
  });

  test("all admin pages load for an admin", async ({ page }) => {
    await login(page, ADMIN, "/admin");
    for (const path of ["", "/analytics", "/school-stats", "/corrections", "/messages", "/schools", "/articles", "/videos", "/categories", "/media", "/options", "/reviews", "/community", "/ads", "/users", "/languages", "/audit"]) {
      const res = await page.goto(`/admin${path}`);
      expect(res?.status(), path).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
  });
});
