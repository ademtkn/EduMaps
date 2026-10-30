import { expect, test, type Page } from "@playwright/test";

const ADMIN = { email: process.env.SEED_ADMIN_EMAIL ?? "admin@edumap.kg", password: process.env.SEED_ADMIN_PASSWORD ?? "EduMap-Admin-2026!" };

async function login(page: Page, next: string) {
  await page.goto(`/en/auth/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email").fill(ADMIN.email);
  await page.getByLabel("Password", { exact: true }).fill(ADMIN.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL((u) => !u.pathname.includes("/auth/login"));
}

// What the apps really give: the pin of a place, and a 2GIS firm page (2GIS writes longitude first).
const GOOGLE = "https://www.google.com/maps/place/Test+School/@42.8628,74.6155,17z/data=!3m1!4b1!8m2!3d42.862851!4d74.6173213!16s%2Fg%2F11abc?entry=ttu";
const TWOGIS_SAME = "https://2gis.kg/bishkek/firm/70000001012345678?m=74.617321%2C42.862851%2F17";
const TWOGIS_FAR = "https://2gis.kg/bishkek/firm/70000001012345678?m=74.650000%2C42.900000%2F17";

test.describe.serial("map links in the school form", () => {
  test("pasted links fill in the coordinates and point out anything that does not agree", async ({ page }) => {
    await login(page, "/admin/schools/new");
    await page.goto("/admin/schools/new");
    await page.getByLabel("School name").first().fill("E2E Map Links Academy");
    await page.getByLabel("City").selectOption({ label: "Bishkek" });
    await page.getByLabel("Status", { exact: true }).selectOption("published");
    await page.getByRole("tab", { name: /EN/ }).last().click();
    await page.getByLabel("Street address").fill("1 Link Street");

    // a Google link: the exact pin fills the empty latitude and longitude
    await page.getByLabel("Google Maps link (optional)").fill(GOOGLE);
    await page.getByLabel("Google Maps link (optional)").blur();
    await expect(page.getByText("Coordinates filled in from this link: 42.862851, 74.617321")).toBeVisible();
    await expect(page.getByLabel("Latitude")).toHaveValue("42.862851");
    await expect(page.getByLabel("Longitude")).toHaveValue("74.617321");

    // a 2GIS link for the same place agrees
    await page.getByLabel("2GIS link (optional)").fill(TWOGIS_SAME);
    await page.getByLabel("2GIS link (optional)").blur();
    await expect(page.getByText("Both links show the same place.")).toBeVisible();

    // a 2GIS link a few kilometres away is called out, and the numbers are not changed behind the back
    await page.getByLabel("2GIS link (optional)").fill(TWOGIS_FAR);
    await page.getByLabel("2GIS link (optional)").blur();
    await expect(page.getByText(/The two links are .* apart\. Check that both show the school\./)).toBeVisible();
    await expect(page.getByText(/This link is .* from the coordinates above/)).toBeVisible();
    await expect(page.getByLabel("Latitude")).toHaveValue("42.862851");

    // the wrong service in a box, and something that is not a map link at all
    await page.getByLabel("2GIS link (optional)").fill(GOOGLE);
    await page.getByLabel("2GIS link (optional)").blur();
    await expect(page.getByText("This is a Google Maps link. Paste it in the Google Maps field.")).toBeVisible();
    await page.getByLabel("2GIS link (optional)").fill("https://example.com/maps");
    await page.getByLabel("2GIS link (optional)").blur();
    await expect(page.getByText("This is not a 2GIS link.")).toBeVisible();

    // saving with a bad link is refused rather than saved
    await page.getByRole("button", { name: "Save school" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "This is not a 2GIS link." }).first()).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/schools\/new/);

    // a good 2GIS link: saved, and visitors open exactly these links
    await page.getByLabel("2GIS link (optional)").fill(TWOGIS_SAME);
    await page.getByLabel("2GIS link (optional)").blur();
    await expect(page.getByText("Both links show the same place.")).toBeVisible();
    await page.getByRole("button", { name: "Save school" }).click();
    await expect(page).toHaveURL(/\/admin\/schools\/[0-9a-f-]{36}/);

    await page.goto("/en/schools/e2e-map-links-academy");
    await expect(page.getByRole("link", { name: "Open in Google Maps" })).toHaveAttribute("href", GOOGLE);
    await expect(page.getByRole("link", { name: "Open in 2GIS" })).toHaveAttribute("href", TWOGIS_SAME);
  });

  test("a school with links but no coordinates shows both links, and removing them restores the plain search link", async ({ page }) => {
    await login(page, "/admin/schools");
    await page.goto("/admin/schools");
    await page.getByRole("link", { name: "E2E Map Links Academy" }).first().click();
    await page.getByLabel("Latitude").fill("");
    await page.getByLabel("Longitude").fill("");
    await page.getByRole("button", { name: "Save school" }).click();
    await expect(page.getByText("School saved")).toBeVisible();

    await page.goto("/en/schools/e2e-map-links-academy");
    await expect(page.getByRole("link", { name: "Open in Google Maps" })).toHaveAttribute("href", GOOGLE);
    await expect(page.getByRole("link", { name: "Open in 2GIS" })).toHaveAttribute("href", TWOGIS_SAME);
    await expect(page.getByRole("link", { name: "Open in full map" })).toHaveCount(0);

    // clean up: links removed, then the school itself
    await page.goto("/admin/schools");
    await page.getByRole("link", { name: "E2E Map Links Academy" }).first().click();
    await page.getByLabel("Google Maps link (optional)").fill("");
    await page.getByLabel("2GIS link (optional)").fill("");
    await page.getByRole("button", { name: "Save school" }).click();
    await expect(page.getByText("School saved")).toBeVisible();
    await page.goto("/en/schools/e2e-map-links-academy");
    await expect(page.getByRole("link", { name: "Open in 2GIS" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Find on Google Maps" })).toBeVisible();

    await page.goto("/admin/schools");
    await page.getByRole("link", { name: "E2E Map Links Academy" }).first().click();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Delete school" }).click();
    await expect(page).toHaveURL(/\/admin\/schools$/);
  });

  test("when both links are pasted at once the exact Google pin is used, not the middle of the 2GIS map", async ({ page }) => {
    await login(page, "/admin/schools/new");
    await page.goto("/admin/schools/new");
    await page.getByLabel("2GIS link (optional)").fill(TWOGIS_FAR);
    await page.getByLabel("Google Maps link (optional)").fill(GOOGLE);
    await page.getByLabel("Google Maps link (optional)").blur();
    await expect(page.getByLabel("Latitude")).toHaveValue("42.862851");
    await expect(page.getByLabel("Longitude")).toHaveValue("74.617321");
    await expect(page.getByText(/The two links are .* apart/)).toBeVisible();
    // both links are still in their boxes
    await expect(page.getByLabel("2GIS link (optional)")).toHaveValue(TWOGIS_FAR);
    await expect(page.getByLabel("Google Maps link (optional)")).toHaveValue(GOOGLE);
  });
});
