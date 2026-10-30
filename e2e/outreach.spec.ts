import { expect, test, type Page } from "@playwright/test";

const ADMIN = { email: process.env.SEED_ADMIN_EMAIL ?? "admin@edumap.kg", password: process.env.SEED_ADMIN_PASSWORD ?? "EduMap-Admin-2026!" };
const MODERATOR = { email: "moderator@edumap.kg", password: ADMIN.password };

async function login(page: Page, who: { email: string; password: string }, next: string) {
  await page.goto(`/en/auth/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email").fill(who.email);
  await page.getByLabel("Password", { exact: true }).fill(who.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL((u) => !u.pathname.includes("/auth/login"));
}

test.describe("the page for schools", () => {
  for (const [lang, title, button] of [["en", "For schools", "Open the contact form"], ["ru", "Школам", "Открыть форму обратной связи"], ["kg", "Мектептер үчүн", "Байланыш формасын ачуу"]] as const) {
    test(`it exists in ${lang} and leads to the contact form`, async ({ page }) => {
      await page.goto(`/${lang}/for-schools`);
      await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
      await expect(page.locator("ol.grid > li")).toHaveCount(3);
      await page.getByRole("link", { name: button }).click();
      await expect(page).toHaveURL(new RegExp(`/${lang}/contact\\?topic=add_school`));
      await expect(page.locator("#contact-topic")).toHaveValue("add_school");
    });
  }

  test("the footer links to it and it names the real correction button", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("contentinfo").getByRole("link", { name: "For schools" }).click();
    await expect(page).toHaveURL(/\/en\/for-schools/);
    await expect(page.getByText("Report incorrect information").first()).toBeVisible();
    // the label must match the button that exists on a school page
    await page.goto("/en/schools/asylkech-girls-school");
    await expect(page.getByRole("button", { name: "Report incorrect information" })).toBeVisible();
    await page.goto("/ru/schools/asylkech-girls-school");
    await expect(page.getByRole("button", { name: "Сообщить об ошибке" })).toBeVisible();
    await page.goto("/kg/schools/asylkech-girls-school");
    await expect(page.getByRole("button", { name: "Туура эмес маалымат жөнүндө кабарлоо" })).toBeVisible();
  });
});

test.describe.serial("the school outreach list", () => {
  test("administrators get ready messages for real schools, never for sample ones", async ({ page }) => {
    await login(page, ADMIN, "/admin/outreach");
    await page.goto("/admin/outreach?status=all");
    await expect(page.getByRole("heading", { name: "School outreach" })).toBeVisible();
    await expect(page.getByText("Asylkech Girls School", { exact: true })).toBeVisible();
    await expect(page.getByText("Ala-Too International School")).toHaveCount(0);
    // the test site runs on localhost, so the warning about unusable links must show
    await expect(page.getByRole("alert").filter({ hasText: "Do not send them yet" })).toBeVisible();

    await page.getByLabel("Your name and role (the signature)").fill("Test Sender, EduMaps.kg team");
    const card = page.locator("details").filter({ hasText: "Asylkech Girls School" });
    await card.locator("summary").click();
    const whatsapp = card.getByLabel("WhatsApp message in Русский");
    await expect(whatsapp).toHaveValue(/Мы подготовили страницу «.+»: .*\/ru\/schools\/asylkech-girls-school/);
    await expect(whatsapp).toHaveValue(/Test Sender, EduMaps\.kg team, EduMaps\.kg/);
    await expect(card.getByLabel("Email in Русский")).toHaveValue(/«Сообщить об ошибке»/);

    await card.getByRole("button", { name: "Кыргызча" }).click();
    await expect(card.getByLabel("WhatsApp message in Кыргызча")).toHaveValue(/\/kg\/schools\/asylkech-girls-school/);
    await expect(card.getByLabel("Email in Кыргызча")).toHaveValue(/«Туура эмес маалымат жөнүндө кабарлоо»/);
    await card.getByRole("button", { name: "English" }).click();
    await expect(card.getByLabel("Email in English")).toHaveValue(/Dear Director of /);
    // a school with no saved number or email says so instead of offering a dead link
    await expect(card.getByText(/No WhatsApp or phone number saved|Open chat with/)).toBeVisible();
  });

  test("the result of a message is recorded and can be undone", async ({ page }) => {
    await login(page, ADMIN, "/admin/outreach");
    await page.goto("/admin/outreach?status=all");
    const card = page.locator("details").filter({ hasText: "Indigo Sapat" });
    await card.locator("summary").click();
    await card.getByLabel("Status").selectOption("sent");
    await card.getByLabel("Channel").selectOption("whatsapp");
    await card.getByLabel("Note").fill("Sent from the e2e test");
    await card.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("Saved.")).toBeVisible();

    await page.goto("/admin/outreach?status=sent");
    await expect(page.locator("details").filter({ hasText: "Indigo Sapat" }).locator("summary").getByText("Message sent")).toBeVisible();
    await page.goto("/admin/outreach?status=todo");
    await expect(page.getByText("Indigo Sapat", { exact: true })).toHaveCount(0);

    // back to not contacted
    await page.goto("/admin/outreach?status=sent");
    const sent = page.locator("details").filter({ hasText: "Indigo Sapat" });
    await sent.locator("summary").click();
    await sent.getByLabel("Status").selectOption("");
    await sent.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("Back to not contacted.")).toBeVisible();
    await page.goto("/admin/outreach?status=todo");
    await expect(page.getByText("Indigo Sapat", { exact: true })).toBeVisible();
  });

  test("moderators do not see the list", async ({ page }) => {
    await login(page, MODERATOR, "/admin");
    await expect(page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "School outreach" })).toHaveCount(0);
    await page.goto("/admin/outreach?status=all");
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: "School outreach" })).toHaveCount(0);
  });
});
