import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

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

/** Registry details of the company stay out of the repository; when the private file is present the exact values are checked too. */
const HIDDEN: string[] = (() => {
  try {
    return (JSON.parse(readFileSync("private/registry.json", "utf8")) as { hidden?: string[] }).hidden ?? [];
  } catch {
    return [];
  }
})();
// A 14-digit tax number, or the labels that would introduce company registry details.
const REGISTRY_PATTERNS = [/\b\d{14}\b/, /ИНН|ОКПО|\bTIN\b|\bOKPO\b/];

test.describe("public site", () => {
  test("unprefixed URLs redirect to the Kyrgyz default", async ({ page }) => {
    await page.goto("/schools");
    await expect(page).toHaveURL(/\/kg\/schools/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ky");
  });

  test("language switcher keeps the current page", async ({ page }) => {
    await page.goto("/kg/about");
    await page.getByRole("button", { name: /Тил/ }).click();
    await page.getByRole("menuitem", { name: "English" }).click();
    await expect(page).toHaveURL(/\/en\/about/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("About EduMaps.kg");
  });

  test("footer and about page carry the Line.kg attribution", async ({ page }) => {
    for (const [lang, text] of [["en", "EduMaps.kg is a project developed and operated by Line.kg"], ["ru", "EduMaps.kg — проект, разработанный и управляемый Line.kg"], ["kg", "EduMaps.kg — Line.kg тарабынан иштелип чыккан жана жүргүзүлгөн долбоор"]]) {
      await page.goto(`/${lang}`);
      await expect(page.locator("footer")).toContainText(text);
    }
    await page.goto("/en/about");
    await expect(page.getByText("Line.kg is an educational systems and technology company focused on improving educational access, transparency and quality across Central Asia.")).toBeVisible();
  });

  test("directory filters and sorts", async ({ page }) => {
    await page.goto("/en/schools?city=bishkek&system=ib");
    await expect(page.getByRole("heading", { name: "Ala-Too International School" })).toBeVisible();
    await expect(page.getByText("1 school found")).toBeVisible();
    await page.goto("/en/schools?tmax=0");
    for (const card of await page.locator("article").all()) await expect(card).toContainText(/Free|0 – /);
  });

  test("school page exposes structured data and all sections", async ({ page }) => {
    await page.goto("/en/schools/ala-too-international-school");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ala-Too International School");
    for (const id of ["overview", "languages", "tuition", "transportation", "reviews"]) await expect(page.locator(`#${id}`)).toBeVisible();
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(ld.join("")).toContain('"@type":"School"');
    expect(ld.join("")).toContain('"aggregateRating"');
  });

  test("compare up to four schools", async ({ page }) => {
    await page.goto("/en/schools");
    const buttons = page.getByRole("button", { name: "Compare", exact: true });
    for (let i = 0; i < 4; i++) await buttons.nth(i).click();
    await buttons.nth(4).click();
    await expect(page.getByText("You can compare up to 4 schools.")).toBeVisible();
    await page.getByRole("link", { name: "Compare now" }).click();
    await expect(page.locator("thead th[scope=col]")).toHaveCount(4);
  });

  test("sample schools are noindex while real profiles stay indexable", async ({ page }) => {
    await page.goto("/en/schools/ala-too-international-school");
    await expect(page.locator("meta[name=robots]")).toHaveAttribute("content", /noindex/);
    await page.goto("/en/schools/asylkech-girls-school");
    await expect(page.locator("meta[name=robots]")).toHaveAttribute("content", /^index/);
  });

  test("unconfirmed profiles say information is pending instead of 'no'", async ({ page }) => {
    await page.goto("/en/schools/asylkech-girls-school");
    await expect(page.getByText("No school transport")).toHaveCount(0);
    await expect(page.getByText("No boarding", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Information pending").first()).toBeVisible();
  });

  test("unrated schools get no rank badge on the home page or in the directory", async ({ page }) => {
    await page.goto("/en");
    const home = page.locator("article").filter({ hasText: "Not graded yet" });
    await expect(home.getByText(/^#\d+$/)).toHaveCount(0);
    await page.goto("/en/schools?page=2");
    for (const card of await page.locator("article").filter({ hasText: "Not graded yet" }).all()) {
      await expect(card.getByText(/^#\d+$/)).toHaveCount(0);
    }
  });

  test("a shared comparison link replaces an earlier saved selection", async ({ page }) => {
    await page.goto("/en/compare?s=ala-too-international-school,tengri-stem-gymnasium");
    await expect(page.locator("thead th[scope=col]")).toHaveCount(2);
    await page.goto("/en/compare?s=asylkech-girls-school,indigo-sapat");
    await expect(page.locator("thead th[scope=col]")).toHaveCount(2);
    await page.goto("/en/schools");
    await expect(page.getByText("2 of 4 schools")).toBeVisible();
    await page.getByRole("link", { name: "Compare now" }).click();
    await expect(page).toHaveURL(/asylkech-girls-school,indigo-sapat/);
  });

  for (const [lang, privacy, terms, guidelines, contact] of [
    ["en", "Privacy Policy", "Terms of Use", "Community Guidelines", "Contact us"],
    ["ru", "Политика конфиденциальности", "Условия использования", "Правила сообщества", "Связаться с нами"],
    ["kg", "Купуялуулук саясаты", "Пайдалануу шарттары", "Коомчулуктун эрежелери", "Биз менен байланышуу"],
  ] as const) {
    test(`legal and contact pages exist in ${lang}`, async ({ page }) => {
      for (const [path, title] of [["privacy", privacy], ["terms", terms], ["guidelines", guidelines], ["contact", contact]] as const) {
        const response = await page.goto(`/${lang}/${path}`);
        expect(response?.status()).toBe(200);
        await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
      }
    });
  }

  test("footer carries the legal links and the company details", async ({ page }) => {
    await page.goto("/en");
    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/en/privacy");
    await expect(footer.getByRole("link", { name: "Terms of Use" })).toHaveAttribute("href", "/en/terms");
    await expect(footer.getByRole("link", { name: "Community Guidelines" })).toHaveAttribute("href", "/en/guidelines");
    await expect(footer).toContainText("Line LLC · Bishkek, Kyrgyzstan");
    expect(await footer.innerText()).not.toMatch(REGISTRY_PATTERNS[0]!);
    await expect(footer.getByRole("link", { name: "linekginfo@gmail.com" })).toBeVisible();
    await expect(footer).toContainText("EduMaps.kg is a project developed and operated by Line.kg");
  });

  test("no tax number, registry number or street address of the company is shown anywhere", async ({ request }) => {
    const pages = ["/en", "/ru", "/kg", "/en/about", "/ru/about", "/en/contact", "/kg/contact", "/en/privacy", "/ru/privacy", "/kg/privacy", "/en/terms", "/ru/terms", "/kg/terms"];
    for (const path of pages) {
      const html = await (await request.get(path)).text();
      for (const secret of HIDDEN) expect(html, `${secret} on ${path}`).not.toContain(secret);
      for (const pattern of REGISTRY_PATTERNS) expect(html, `${pattern} on ${path}`).not.toMatch(pattern);
      expect(html).toContain("Line LLC");
    }
    expect(await (await request.get("/en/about")).text()).not.toContain("Company details");
  });

  test("the contact form sends a message", async ({ page }) => {
    await page.goto("/en/contact");
    await page.getByLabel("Your name").fill("E2E Visitor");
    const stamp = Date.now();
    const sender = `e2e-contact-${stamp}@example.com`;
    await page.getByLabel("Email", { exact: true }).fill(sender);
    await page.getByLabel("Topic").selectOption("add_school");
    await page.getByLabel("Message", { exact: true }).fill(`Please add our school to the directory. Reference ${stamp}.`);
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("Please accept the Terms of Use and the Privacy Policy to continue.")).toBeVisible();
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("Thank you, your message was sent")).toBeVisible();
    const mail = await teamMail(`Reference ${stamp}`);
    expect(mail.subject).toBe("[EduMaps.kg] New message: Add or claim a school");
    expect(mail.replyTo).toBe(sender);
    expect(mail.text).toContain("/admin/messages");
  });

  test("school pages link to Google Maps and 2GIS", async ({ page }) => {
    await page.goto("/en/schools/ala-too-international-school");
    await expect(page.getByRole("link", { name: "Open in Google Maps" })).toHaveAttribute("href", /google\.com\/maps\/search/);
    await expect(page.getByRole("link", { name: "Open in 2GIS" })).toHaveAttribute("href", /2gis\.kg\/\?m=/);
  });

  test("the school's Google map opens by itself, with no button to press", async ({ page }) => {
    await page.goto("/en/schools/ala-too-international-school");
    await expect(page.getByRole("button", { name: "Show map" })).toHaveCount(0);
    await page.locator("#location").scrollIntoViewIfNeeded();
    const frame = page.locator("iframe[src*='google.com/maps']");
    await expect(frame).toHaveCount(1);
    const src = (await frame.getAttribute("src"))!;
    expect(src).toMatch(/q=42\.\d+,74\.\d+&z=17/);
  });

  test("'Get directions' lets the visitor choose Google Maps or 2GIS", async ({ page }) => {
    await page.goto("/en/schools/ala-too-international-school");
    await page.getByRole("button", { name: "Get directions" }).click();
    await expect(page.getByText("Get directions with")).toBeVisible();
    const google = page.getByRole("menuitem", { name: "Google Maps" });
    const twoGis = page.getByRole("menuitem", { name: "2GIS" });
    await expect(google).toHaveAttribute("href", /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=42\.\d+,74\.\d+$/);
    await expect(twoGis).toHaveAttribute("href", /^https:\/\/2gis\.kg\/routeSearch\/rsType\/car\/to\/74\.\d+,42\.\d+$/);
    await expect(google).toHaveAttribute("target", "_blank");
    await expect(twoGis).toHaveAttribute("rel", /noopener/);
    // the choice is counted as one "directions" press
    const beacon = page.waitForRequest((r) => r.url().endsWith("/api/track") && (r.postData() ?? "").includes('"meta":"directions"'));
    await page.context().route("https://2gis.kg/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "ok" }));
    await twoGis.click();
    await beacon;
  });

  test("with a Google Maps key the map is the full Google map with a school-shaped pin", async ({ page }) => {
    test.skip(!process.env.E2E_GOOGLE_MAPS_KEY, "needs a build with GOOGLE_MAPS_KEY set (see docs); the Google script is replaced by a stub here");
    await page.route("https://maps.googleapis.com/maps/api/js**", (route) => route.fulfill({
      status: 200,
      contentType: "text/javascript",
      body: `window.__calls = [];
        window.google = { maps: { importLibrary: async (name) => {
          if (name === "maps") return { Map: class { constructor(el, o) { window.__calls.push({ map: o }); el.dataset.stubMap = "true"; } } };
          return { AdvancedMarkerElement: class { constructor(o) { window.__calls.push({ marker: { title: o.title, position: o.position, svg: o.content.innerHTML.includes("<svg"), school: o.content.dataset.schoolMarker } }); o.map && document.querySelector("[data-stub-map]").appendChild(o.content); } } };
        } } };`,
    }));
    await page.goto("/en/schools/ala-too-international-school");
    await page.locator("#location").scrollIntoViewIfNeeded();
    await expect(page.locator("[data-stub-map] [data-school-marker] svg")).toBeVisible();
    const calls = await page.evaluate(() => (window as unknown as { __calls: Record<string, unknown>[] }).__calls);
    const map = calls.find((c) => c.map)!.map as { center: { lat: number; lng: number }; zoom: number };
    expect(map.zoom).toBe(17);
    expect(map.center.lat).toBeGreaterThan(42);
    const marker = calls.find((c) => c.marker)!.marker as { title: string; school: string };
    expect(marker.title).toBe("Ala-Too International School");
    expect(marker.school).toBe("true");
    await expect(page.locator("iframe[src*='google.com/maps']")).toHaveCount(0);
  });

  test("brand assets and manifest are served", async ({ request }) => {
    for (const path of ["/brand/logo.png", "/brand/logo-white.png", "/icon.png", "/apple-icon.png", "/favicon.ico", "/manifest.webmanifest"]) {
      expect((await request.get(path)).ok(), path).toBeTruthy();
    }
  });

  test("yearly fees show the school's own price, the monthly equivalent and what is covered", async ({ page }) => {
    await page.goto("/en/schools/ala-too-international-school#tuition");
    const tuition = page.locator("#tuition");
    await expect(tuition).toContainText("380,000 – 520,000 KGS / year");
    await expect(tuition).toContainText("≈ 38,000 – 52,000 KGS / month");
    await expect(tuition).toContainText("Calculated from the school's own fee over a 10-month school year.");
    await expect(tuition.getByText("Included in the fee")).toBeVisible();
    await expect(tuition.getByText("Paid separately")).toBeVisible();
    await expect(tuition).toContainText("6,500 KGS one-time");
    // a school that bills monthly shows no conversion, and lists what it has not stated
    await page.goto("/en/schools/silk-road-lyceum#tuition");
    await expect(page.locator("#tuition")).toContainText("KGS / month");
    await expect(page.locator("#tuition")).not.toContainText("Monthly equivalent");
    await expect(page.locator("#tuition")).toContainText("Estimated per school year");
    await expect(page.locator("#tuition")).toContainText("Not stated by the school, please ask");
  });

  test("the directory card and the comparison use the same fee figures", async ({ page }) => {
    await page.goto("/en/schools?q=Ala-Too");
    await expect(page.locator("article").first()).toContainText("/ year");
    await expect(page.locator("article").first()).toContainText("≈ 38,000 – 52,000 KGS / month");
    await page.goto("/en/compare?s=ala-too-international-school,tengri-stem-gymnasium,talas-valley-gymnasium");
    const table = page.locator("table");
    await expect(table.getByRole("row", { name: /Fee set by the school/ })).toContainText("/ year");
    await expect(table.getByRole("row", { name: /Fee set by the school/ })).toContainText("/ quarter");
    await expect(table.getByRole("row", { name: /Per month \(equivalent\)/ })).toContainText("≈ 14,000 – 20,000 KGS / month");
    await expect(table.getByRole("row", { name: /Per school year/ })).toContainText("≈ 380,000 – 520,000 KGS / year");
    await expect(table.getByRole("row", { name: /^Included in the fee/ })).toContainText("Meals");
  });

  test("the school day appears on cards, school pages and in comparisons", async ({ page }) => {
    await page.goto("/en/schools?q=Bilim");
    await expect(page.locator("article").first()).toContainText("08:00–13:30 · Mon–Sat");
    await page.goto("/en/schools/ala-too-international-school");
    await expect(page.locator("#overview")).toContainText("School day");
    await expect(page.locator("#overview")).toContainText("08:15–15:45 · Mon–Fri");
    await page.goto("/en/compare?s=ala-too-international-school,bilim-secondary-school");
    await expect(page.getByRole("row", { name: /^School day/ })).toContainText("08:00–13:30 · Mon–Sat");
  });

  test("a school's WhatsApp button opens a chat with a polite message in the visitor's language", async ({ page, context }) => {
    await context.route("https://wa.me/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "ok" }));
    const slug = "capital-turkish-kyrgyz-lyceum";
    await page.goto(`/en/schools/${slug}`);
    const button = page.getByRole("link", { name: "WhatsApp", exact: true });
    const href = (await button.getAttribute("href"))!;
    expect(href).toMatch(/^https:\/\/wa\.me\/996312000106\?text=/);
    const text = decodeURIComponent(href.split("?text=")[1]!);
    expect(text).toMatch(/^Hello! I found .+ on EduMaps\.kg and would like to get some information about the school\. Could you please help me\? /);
    expect(text).toContain(`/en/schools/${slug}`);
    const beacon = page.waitForRequest((r) => r.url().endsWith("/api/track") && (r.postData() ?? "").includes('"meta":"whatsapp"'));
    await button.click();
    await beacon;
    // the message follows the visitor's language
    await page.goto(`/ru/schools/${slug}`);
    const ru = decodeURIComponent((await page.getByRole("link", { name: "WhatsApp", exact: true }).getAttribute("href"))!.split("?text=")[1]!);
    expect(ru).toMatch(/^Здравствуйте! Я нашёл\(-ла\) школу «.+» на EduMaps\.kg и хотел\(а\) бы получить информацию о ней\. Не могли бы вы мне помочь\? /);
    await page.goto(`/kg/schools/${slug}`);
    const kg = decodeURIComponent((await page.getByRole("link", { name: "WhatsApp", exact: true }).getAttribute("href"))!.split("?text=")[1]!);
    expect(kg).toMatch(/^Саламатсызбы! Мен «.+» мектебин EduMaps\.kg сайтынан таптым жана мектеп тууралуу маалымат алгым келет\. Сураныч, жардам бере аласызбы\? /);
    // there is no "share on WhatsApp" link any more
    await page.goto(`/en/schools/${slug}`);
    await expect(page.getByRole("link", { name: /Share on WhatsApp/ })).toHaveCount(0);
    await expect(page.locator('a[href^="https://wa.me/?text="]')).toHaveCount(0);
  });

  test("a school without a WhatsApp number shows no WhatsApp button", async ({ page }) => {
    await page.goto("/en/schools/tengri-stem-gymnasium");
    await expect(page.getByRole("link", { name: "WhatsApp", exact: true })).toHaveCount(0);
  });

  test("school pages report which sections were reached and how long they stayed open", async ({ page }) => {
    const events: string[] = [];
    page.on("request", (r) => { if (r.url().endsWith("/api/track") && r.method() === "POST") events.push(r.postData() ?? ""); });
    await page.goto("/en/schools/chu-valley-lyceum");
    await page.locator("#reviews").scrollIntoViewIfNeeded();
    await expect.poll(() => events.some((e) => e.includes('"type":"section_view"') && e.includes('"meta":"reviews"'))).toBeTruthy();
    await page.waitForTimeout(1300);
    // switching to another tab reports the time the page was visible
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect.poll(() => events.some((e) => e.includes('"type":"time_on_page"') && /"meta":"(lt10|s10_30)"/.test(e))).toBeTruthy();
    // free text is never accepted as a statistic
    const res = await page.request.post("/api/track", { data: { type: "contact_click", id: "00000000-0000-0000-0000-000000000000", lang: "en", meta: "<script>" }, headers: { origin: new URL(page.url()).origin } });
    expect(res.status()).toBe(400);
  });

  test("the home page explains how reviews and information are chosen and checked", async ({ page }) => {
    await page.goto("/en");
    const trust = page.locator("#trust");
    await expect(trust.getByRole("heading", { level: 2, name: "How we keep reviews and information honest" })).toBeVisible();
    await expect(trust.getByRole("heading", { name: "Reviews we publish" })).toBeVisible();
    await expect(trust.getByRole("heading", { name: "Reviews we do not publish" })).toBeVisible();
    await expect(trust.getByText("Insults, hate speech, threats or personal attacks")).toBeVisible();
    await expect(trust.getByText(/Copied or repeated texts and organised campaigns/)).toBeVisible();
    await expect(trust.getByText(/Only the EduMaps.kg team enters and changes school details/)).toBeVisible();
    await expect(trust.getByRole("link", { name: /Read the full community guidelines/ })).toHaveAttribute("href", "/en/guidelines");
    for (const [lang, heading] of [["ru", "Как мы следим за честностью отзывов и данных"], ["kg", "Пикирлер менен маалыматтын чынчылдыгын кантип камсыз кылабыз"]] as const) {
      await page.goto(`/${lang}`);
      await expect(page.locator("#trust").getByRole("heading", { level: 2, name: heading })).toBeVisible();
    }
  });

  test("ads are always labelled", async ({ page }) => {
    await page.goto("/en");
    const ads = page.locator("aside[aria-label='Advertisement']");
    expect(await ads.count()).toBeGreaterThan(0);
    for (const ad of await ads.all()) await expect(ad).toContainText("Advertisement");
  });

  test("sitemap, robots and OG image", async ({ request }) => {
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBeTruthy();
    const xml = await sitemap.text();
    expect(xml).toContain("/kg/schools/asylkech-girls-school");
    expect(xml).not.toContain("/schools/ala-too-international-school");
    expect((await request.get("/robots.txt")).ok()).toBeTruthy();
    const og = await request.get("/api/og?title=Test");
    expect(og.headers()["content-type"]).toContain("image/png");
  });

  test("pages hydrate cleanly in every language (numbers and dates read the same on the server and in the browser)", async ({ browser }) => {
    const paths = ["", "/schools", "/schools/silk-road-lyceum", "/schools/ala-too-international-school", "/map", "/compare?s=silk-road-lyceum,ala-too-international-school", "/education", "/community"];
    for (const lang of ["kg", "ru", "en"]) {
      for (const path of paths) {
        const page = await (await browser.newContext()).newPage();
        const errors: string[] = [];
        page.on("pageerror", (e) => errors.push(e.message.split("\n")[0]!));
        page.on("console", (m) => { if (m.type() === "error" && /hydrat/i.test(m.text())) errors.push(m.text().split("\n")[0]!); });
        await page.goto(`/${lang}${path}`, { waitUntil: "networkidle" });
        expect(errors, `${lang}${path}`).toEqual([]);
        await page.close();
      }
    }
  });

  test("health probe and security.txt are served", async ({ request }) => {
    const health = await request.get("/api/health");
    expect(health.status()).toBe(200);
    expect(await health.json()).toEqual({ status: "ok" });
    expect(health.headers()["cache-control"]).toContain("no-store");
    const txt = await request.get("/.well-known/security.txt");
    expect(txt.ok()).toBeTruthy();
    const body = await txt.text();
    expect(body).toContain("Contact: mailto:");
    expect(body).toMatch(/^Expires: /m);
  });

  test("Bishkek schools can be filtered by district, and the district follows the city", async ({ page }) => {
    await page.goto("/en/schools?city=bishkek&district=oktyabrsky");
    await expect(page.getByText("4 schools found")).toBeVisible();
    await expect(page.locator("article").filter({ hasText: "Asylkech Girls School" })).toHaveCount(1);
    await expect(page.locator("article").filter({ hasText: "Ala-Too" })).toHaveCount(0);
    await expect(page.getByLabel("District").first()).toHaveValue("oktyabrsky");
    // another city: the leftover district is ignored, the filter disappears
    await page.goto("/en/schools?city=osh&district=oktyabrsky");
    await expect(page.getByLabel("District")).toHaveCount(0);
    await expect(page.locator("article").first()).toBeVisible();
    await expect(page.locator("article").filter({ hasText: "Asylkech Girls School" })).toHaveCount(0);
    // the school page names the district (a demo school: real schools are edited by the team and change)
    await page.goto("/en/schools/silk-road-lyceum");
    await expect(page.getByText("District: Oktyabrsky")).toBeVisible();
  });

  test("security headers are present", async ({ request }) => {
    const res = await request.get("/en");
    const h = res.headers();
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["referrer-policy"]).toBeTruthy();
  });
});
