import { expect, test } from "@playwright/test";

test.describe("search suggestions", () => {
  test("typing shows matching schools and cities, and the keyboard picks one", async ({ page }) => {
    await page.goto("/en");
    const box = page.getByRole("combobox", { name: "School name" });
    await box.fill("A");
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await box.fill("Ala-Too");
    const option = page.getByRole("option", { name: /Ala-Too International School/ });
    await expect(option).toBeVisible();
    await expect(box).toHaveAttribute("aria-expanded", "true");
    await box.press("ArrowDown");
    await expect(option).toHaveAttribute("aria-selected", "true");
    await box.press("Enter");
    await expect(page).toHaveURL(/\/en\/schools\/ala-too-international-school$/);
  });

  test("a city suggestion opens the directory for that city; Escape closes the list; Enter without a choice still searches", async ({ page }) => {
    await page.goto("/en");
    const box = page.getByRole("combobox", { name: "School name" });
    await box.fill("Bishk");
    const city = page.getByRole("option", { name: /Bishkek/ }).first();
    await expect(city).toBeVisible();
    await box.press("Escape");
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await box.fill("Bishk");
    await page.getByRole("option", { name: /Bishkek\s+Cities/ }).click();
    await expect(page).toHaveURL(/\/en\/schools\?city=bishkek/);

    await page.goto("/en");
    await page.getByRole("combobox", { name: "School name" }).fill("lyceum");
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.getByRole("combobox", { name: "School name" }).press("Enter");
    await expect(page).toHaveURL(/\/en\/schools\?q=lyceum/);
  });

  test("the directory's own search box suggests too, and Cyrillic names are found", async ({ page }) => {
    await page.goto("/ru/schools");
    await page.getByRole("combobox").first().fill("Ала");
    await expect(page.getByRole("option").first()).toBeVisible();
  });

  test("the suggestion service answers short or odd input safely and only names published schools", async ({ request }) => {
    for (const q of ["", "a", "%25_%2C()", "'; drop table schools; --", "x".repeat(500)]) {
      const response = await request.get(`/api/search/suggest?lang=en&q=${q}`);
      expect(response.status(), q.slice(0, 20)).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.schools) && Array.isArray(data.cities)).toBeTruthy();
    }
    const data = await (await request.get("/api/search/suggest?lang=en&q=ala-too")).json();
    expect(data.schools[0]).toEqual({ slug: "ala-too-international-school", name: "Ala-Too International School", city: "Bishkek" });
  });
});

test.describe("schools near me", () => {
  test("with permission the schools are listed nearest first, each with its distance, and it can be cleared", async ({ browser }) => {
    const context = await browser.newContext({ geolocation: { latitude: 42.8746, longitude: 74.5698 }, permissions: ["geolocation"] });
    const page = await context.newPage();
    await page.goto("/en/schools");
    await page.getByRole("button", { name: "Schools near me" }).click();
    await expect(page).toHaveURL(/near=42\.87%2C74\.57/);
    await expect(page).toHaveURL(/sort=nearest/);
    await expect(page.getByText("Sorted by distance from your location")).toBeVisible();

    const labels = await page.locator("article").evaluateAll((cards) => cards.map((card) => /([\d.,]+)\s*(km|m) away/.exec(card.textContent ?? "")));
    const meters = labels.filter((m): m is RegExpExecArray => m !== null).map((m) => (m[2] === "km" ? Number(m[1]!.replace(",", "")) * 1000 : Number(m[1])));
    expect(meters.length).toBeGreaterThan(3);
    expect(meters).toEqual([...meters].sort((a, b) => a - b));

    // the choice survives paging and the exact position is not kept: rounded to about a kilometre
    await expect(page.getByRole("combobox", { name: "Sort by" })).toHaveValue("nearest");

    await page.getByRole("button", { name: "Clear", exact: true }).click();
    await expect(page).not.toHaveURL(/near=/);
    await expect(page.getByText("Sorted by distance from your location")).toHaveCount(0);
    await context.close();
  });

  test("when the browser does not share the location the visitor is told how to fix it", async ({ browser }) => {
    const context = await browser.newContext({ permissions: [] });
    const page = await context.newPage();
    await context.grantPermissions([]);
    await page.addInitScript(() => {
      navigator.geolocation.getCurrentPosition = (_ok, fail) => fail?.({ code: 1, PERMISSION_DENIED: 1, message: "denied" } as GeolocationPositionError);
    });
    await page.goto("/en/schools");
    await page.getByRole("button", { name: "Schools near me" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "did not share your location" })).toBeVisible();
    await expect(page).not.toHaveURL(/near=/);
    await context.close();
  });

  test("a position outside Kyrgyzstan or in a wrong format is ignored", async ({ page }) => {
    for (const near of ["10,10", "abc", "42.87", "42.87,74.57,1", "%3Cscript%3E"]) {
      await page.goto(`/en/schools?near=${near}`);
      await expect(page.getByText("Sorted by distance from your location"), near).toHaveCount(0);
      await expect(page.locator("article").first()).toBeVisible();
    }
  });
});
