import { expect, test, type Page } from "@playwright/test";

const ADMIN = { email: process.env.SEED_ADMIN_EMAIL ?? "admin@edumap.kg", password: process.env.SEED_ADMIN_PASSWORD ?? "EduMap-Admin-2026!" };
const RUN = Date.now();
const A = `e2e-import-a-${RUN}`;
const B = `e2e-import-b-${RUN}`;

async function login(page: Page) {
  await page.goto(`/en/auth/login?next=${encodeURIComponent("/admin")}`);
  await page.getByLabel("Email").fill(ADMIN.email);
  await page.getByLabel("Password", { exact: true }).fill(ADMIN.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL((u) => !u.pathname.includes("/auth/login"));
}

const header = "slug,name_en,name_ru,city,school_type,education_systems,languages,grade_from,grade_to,fee_min,fee_max,fee_period,fee_billing_months,fee_items,opening_time,closing_time,working_days,whatsapp,phone,lat,lng,address_en,facilities,status,data_status";
const csv = (rows: string[]) => Buffer.from(`﻿${[header, ...rows].join("\r\n")}\r\n`, "utf8");

async function upload(page: Page, content: Buffer, name = "schools.csv") {
  await page.locator("#import-file").setInputFiles({ name, mimeType: "text/csv", buffer: content });
}

test.describe.serial("importing schools from a spreadsheet", () => {
  test("the template and the export are admin-only CSV files", async ({ page, request }) => {
    const anonymous = await request.get("/admin/schools/export", { maxRedirects: 0 });
    expect(anonymous.status()).toBeGreaterThanOrEqual(300);
    expect(anonymous.headers()["content-type"] ?? "").not.toContain("text/csv");

    await login(page);
    const template = await page.request.get("/admin/schools/import/template");
    expect(template.status()).toBe(200);
    expect(template.headers()["content-type"]).toContain("text/csv");
    const text = await template.text();
    expect(text).toContain("name_en");
    expect(text).toContain("fee_items");
    expect(text).toContain("delete this row");

    const exported = await (await page.request.get("/admin/schools/export")).text();
    expect(exported.split("\r\n")[0]).toContain("slug,name_en");
    expect(exported).toContain("ala-too-international-school");
  });

  test("a file is checked first: good rows, wrong rows and existing schools are told apart", async ({ page }) => {
    await login(page);
    await page.goto("/admin/schools/import");
    await expect(page.getByRole("heading", { level: 1, name: "Import schools" })).toBeVisible();
    await upload(page, csv([
      `${A},E2E Import School A,Тест импорт А,Bishkek,private,national; cambridge,kg; ru; en,1,11,380000,420000,year,10,meals:included; uniform:6500/one_time,08:30,15:30,Mon-Fri,0700 000 111,+996 312 000 777,42.87,74.59,1 Import Street,library; gym,published,demo`,
      `${B},E2E Import School B,,Osh,public,national,ru,1,11,0,,month,9,,08:00,13:30,Mon-Sat,,,,,,,draft,demo`,
      `e2e-import-bad-${RUN},E2E Bad Row,,Atlantis,boarding,,,x,11,,,weekly,,unknown:included,25:00,,Funday,123,,north,,,,,`,
      `chu-valley-lyceum,Chu Valley Lyceum,,Tokmok,private,,,,,,,,,,,,,,,,,,,,`,
    ]));
    await page.getByRole("button", { name: "Check the file" }).click();
    const result = page.getByRole("heading", { name: "2. Check the result" });
    await expect(result).toBeVisible();
    await expect(page.getByText("2 new school", { exact: true })).toBeVisible();
    await expect(page.getByText("1 has errors")).toBeVisible();
    await expect(page.getByText("1 skipped")).toBeVisible();
    await expect(page.getByText("city: “Atlantis” is not a known city")).toBeVisible();
    await expect(page.getByText(/school_type: “boarding”/)).toBeVisible();
    await expect(page.getByText(/grade_from: “x” is not a whole number/)).toBeVisible();
    await expect(page.getByText(/opening_time: “25:00”/)).toBeVisible();
    await expect(page.getByText(/working_days: “Funday”/)).toBeVisible();
    await expect(page.getByText(/already exists/)).toBeVisible();
    await expect(page.getByText("no coordinates: the school will not appear on the map").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Import 2 schools" })).toBeEnabled();
    // nothing was saved by checking
    await page.goto(`/en/schools/${A}`);
    expect((await page.request.get(`/en/schools/${A}`)).status()).toBe(404);
  });

  test("importing saves only the valid rows", async ({ page }) => {
    await login(page);
    await page.goto("/admin/schools/import");
    await upload(page, csv([
      `${A},E2E Import School A,Тест импорт А,Bishkek,private,national; cambridge,kg; ru; en,1,11,380000,420000,year,10,meals:included; uniform:6500/one_time,08:30,15:30,Mon-Fri,0700 000 111,+996 312 000 777,42.87,74.59,1 Import Street,library; gym,published,demo`,
      `${B},E2E Import School B,,Osh,public,national,ru,1,11,0,,month,9,,08:00,13:30,Mon-Sat,,,,,,,draft,demo`,
      `e2e-import-bad-${RUN},E2E Bad Row,,Atlantis,boarding,,,x,11,,,weekly,,unknown:included,25:00,,Funday,123,,north,,,,,`,
    ]));
    await page.getByRole("button", { name: "Check the file" }).click();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Import 2 schools" }).click();
    await expect(page.getByText("2 saved, 0 failed, 1 skipped")).toBeVisible();
    await expect(page.getByText("Created", { exact: true })).toHaveCount(2);

    // the published row is public with everything that was in the file
    await page.goto(`/en/schools/${A}`);
    await expect(page.getByRole("heading", { level: 1, name: "E2E Import School A" })).toBeVisible();
    await expect(page.locator("#tuition")).toContainText("380,000 – 420,000 KGS / year");
    await expect(page.locator("#tuition")).toContainText("≈ 38,000 – 42,000 KGS / month");
    await expect(page.locator("#tuition")).toContainText("6,500 KGS one-time");
    await expect(page.locator("#overview")).toContainText("08:30–15:30 · Mon–Fri");
    await expect(page.getByRole("link", { name: "WhatsApp", exact: true })).toHaveAttribute("href", /wa\.me\/996700000111\?text=/);
    await page.goto(`/ru/schools/${A}`);
    await expect(page.getByRole("heading", { level: 1, name: "Тест импорт А" })).toBeVisible();
    // the draft row is not public, and the wrong row was not saved
    expect((await page.request.get(`/en/schools/${B}`)).status()).toBe(404);
    expect((await page.request.get(`/en/schools/e2e-import-bad-${RUN}`)).status()).toBe(404);
  });

  test("a semicolon file updates only the cells that are filled in, and leaves the rest alone", async ({ page }) => {
    await login(page);
    await page.goto("/admin/schools/import");
    await upload(page, Buffer.from(`﻿slug;phone;name_kg\r\n${A};+996 312 000 888;Тест импорт А (кг)\r\n${B};;\r\n`, "utf8"));
    await page.getByLabel("Schools that already exist").selectOption("update");
    await page.getByRole("button", { name: "Check the file" }).click();
    await expect(page.getByText("1 update", { exact: true })).toBeVisible();
    await expect(page.getByText("1 no change")).toBeVisible();
    await expect(page.getByText("Will change: name, phone")).toBeVisible();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Import 1 school", exact: true }).click();
    await expect(page.getByText("1 saved, 0 failed")).toBeVisible();

    await page.goto(`/en/schools/${A}`);
    await expect(page.getByText("+996 312 000 888")).toBeVisible();
    await expect(page.locator("#tuition")).toContainText("380,000 – 420,000 KGS / year");
    await page.goto(`/ru/schools/${A}`);
    await expect(page.getByRole("heading", { level: 1, name: "Тест импорт А" })).toBeVisible();
    await page.goto(`/kg/schools/${A}`);
    await expect(page.getByRole("heading", { level: 1, name: "Тест импорт А (кг)" })).toBeVisible();
  });

  test("files that cannot be used are explained", async ({ page }) => {
    await login(page);
    await page.goto("/admin/schools/import");
    await upload(page, Buffer.from("foo,bar\r\n1,2\r\n"), "wrong.csv");
    await page.getByRole("button", { name: "Check the file" }).click();
    await expect(page.getByText("The first row must contain column names such as name_en and city.")).toBeVisible();
    await upload(page, Buffer.from(`${header}\r\n`), "empty.csv");
    await page.getByRole("button", { name: "Check the file" }).click();
    await expect(page.getByText("0 new school")).toBeVisible();
    await expect(page.getByRole("button", { name: "Import 0 schools" })).toBeDisabled();
  });

  test("clean up the schools created by this test", async ({ page }) => {
    await login(page);
    for (const name of ["E2E Import School A", "E2E Import School B"]) {
      await page.goto(`/admin/schools?q=${encodeURIComponent(name)}`);
      const row = page.getByRole("row").filter({ hasText: name });
      if (await row.count()) {
        await row.getByRole("link", { name: "Edit" }).click();
        await page.waitForURL(/\/admin\/schools\/[0-9a-f-]{36}/);
        page.once("dialog", (d) => d.accept());
        await page.getByRole("button", { name: "Delete school" }).click();
        await page.waitForURL(/\/admin\/schools$/);
      }
    }
    await page.goto("/admin/schools?q=E2E+Import");
    await expect(page.getByText("No schools found.")).toBeVisible();
  });
});
