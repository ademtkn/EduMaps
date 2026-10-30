import { expect, test } from "@playwright/test";

test.describe("mobile layout", () => {
  for (const path of ["/kg", "/en/schools", "/en/schools/ala-too-international-school", "/en/map", "/en/education", "/en/community", "/en/about", "/en/auth/login"]) {
    test(`no horizontal scroll on ${path}`, async ({ page }) => {
      await page.goto(path);
      const { scroll, client } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
      expect(scroll).toBeLessThanOrEqual(client);
    });
  }

  test("menu opens and navigates", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("link", { name: "Schools" }).last().click();
    await expect(page).toHaveURL(/\/en\/schools/);
  });
  test("filter sheet stays open while choosing and applies the price limit", async ({ page }) => {
    await page.goto("/en/schools");
    await page.getByRole("button", { name: /^Filters/ }).click();
    const sheet = page.getByRole("dialog");
    await sheet.getByRole("checkbox").first().check();
    await expect(sheet).toBeVisible();
    await sheet.getByRole("checkbox").nth(1).check();
    await expect(sheet).toBeVisible();
    await sheet.getByPlaceholder("To", { exact: true }).fill("9000");
    await sheet.getByRole("button", { name: "Show results" }).click();
    await expect(sheet).toBeHidden();
    await expect(page).toHaveURL(/tmax=9000/);
  });

  test("mobile and desktop filter fields do not share ids", async ({ page }) => {
    await page.goto("/en/schools");
    const duplicates = await page.evaluate(() => {
      const seen = new Map<string, number>();
      for (const el of document.querySelectorAll("[id]")) seen.set(el.id, (seen.get(el.id) ?? 0) + 1);
      return [...seen].filter(([, n]) => n > 1).map(([id]) => id);
    });
    expect(duplicates).toEqual([]);
  });
});
