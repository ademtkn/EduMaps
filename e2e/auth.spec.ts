import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { config } from "dotenv";
import { execFileSync } from "node:child_process";
import en from "../src/lib/i18n/dictionaries/en.json";

config({ path: ".env.local", quiet: true });
const PASSWORD = "Passw0rd-auth-e2e!";
const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const username = `auth_${stamp}`;
const changedUsername = `renamed_${stamp}`;
const takenUsername = `taken_${stamp}`;
const email = `auth-${stamp}@example.com`;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const service = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
const users: string[] = [];

async function login(page: Page, identifier: string) {
  await page.goto("/en/auth/login");
  await page.getByLabel("Username or email").fill(identifier);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(/\/en\/dashboard/);
}

async function emailForm(page: Page) {
  await page.goto("/en/auth/register");
  await page.getByRole("button", { name: "Continue with email" }).click();
}

test.describe.serial("usernames and social sign-in", () => {
  test.beforeAll(async () => {
    for (const [handle, address] of [[username, email], [takenUsername, `taken-${stamp}@example.com`]]) {
      const { data, error } = await service.auth.admin.createUser({
        email: address, password: PASSWORD, email_confirm: true,
        user_metadata: { username: handle, display_name: handle, preferred_lang: "en" },
      });
      if (error || !data.user) throw new Error(`Auth fixture could not be created: ${error?.message}`);
      users.push(data.user.id);
    }
  });

  test.afterAll(async () => {
    for (const id of users) {
      const { error } = await service.auth.admin.deleteUser(id);
      if (error) throw new Error(`Auth fixture cleanup failed: ${error.message}`);
    }
  });

  test("username email lookup is inaccessible to visitors and members", async () => {
    const anon = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const visitorLookup = await anon.rpc("email_for_username", { p_username: username });
    expect(visitorLookup.error).toBeTruthy();
    expect(visitorLookup.data).toBeNull();
    const signedIn = await anon.auth.signInWithPassword({ email, password: PASSWORD });
    expect(signedIn.error).toBeNull();
    const memberLookup = await anon.rpc("email_for_username", { p_username: username });
    expect(memberLookup.error).toBeTruthy();
    expect(memberLookup.data).toBeNull();
    const privateLookup = await service.rpc("email_for_username", { p_username: username.toUpperCase() });
    expect(privateLookup.error).toBeNull();
    expect(privateLookup.data).toBe(email);
    for (const handle of ["admin", "bad name", "ab", username.toUpperCase()]) {
      const available = await anon.rpc("username_available", { p_username: handle });
      expect(available.error).toBeNull();
      expect(available.data, handle).toBe(false);
    }
  });

  test("registration offers social providers and reveals the email fields on request", async ({ page }) => {
    await page.goto("/en/auth/register");
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue with Apple" })).toBeVisible();
    await expect(page.getByLabel("Username", { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Continue with email" }).click();
    await expect(page.getByLabel("Username", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  });

  test("a duplicate username is rejected without creating another account", async ({ page }) => {
    await emailForm(page);
    await page.getByLabel("Username", { exact: true }).fill(username.toUpperCase());
    await page.getByLabel("Email", { exact: true }).fill(`duplicate-${stamp}@example.com`);
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("checkbox", { name: /at least 16/ }).check();
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await expect(page.getByText(en.errors.username_taken)).toBeVisible();
    await expect(page).toHaveURL(/\/en\/auth\/register/);
  });

  test("username sign-in ignores letter case and profile changes persist", async ({ page, browser }) => {
    await login(page, username.toUpperCase());
    await page.goto("/en/dashboard?tab=profile");
    await expect(page.getByLabel("Username", { exact: true })).toHaveValue(username);
    await page.getByLabel("Username", { exact: true }).fill("admin");
    await page.getByRole("button", { name: en.dashboard.saveProfile }).click();
    await expect(page.getByText(en.errors.username_reserved)).toBeVisible();
    await page.getByLabel("Username", { exact: true }).fill(takenUsername);
    await page.getByRole("button", { name: en.dashboard.saveProfile }).click();
    await expect(page.getByText(en.errors.username_taken)).toBeVisible();
    await page.getByLabel("Username", { exact: true }).fill(changedUsername);
    await page.getByRole("button", { name: en.dashboard.saveProfile }).click();
    await expect(page.getByText(en.dashboard.profileSaved)).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("Username", { exact: true })).toHaveValue(changedUsername);

    const context = await browser.newContext();
    const fresh = await context.newPage();
    await login(fresh, changedUsername);
    await context.close();
  });

  test("social sign-in requires consent and disabled providers show a friendly message", async ({ page, request }) => {
    const settings = await request.get(`${url}/auth/v1/settings`, { headers: { apikey: anonKey } });
    const external = (await settings.json()).external ?? {};
    const provider = !external.google ? "Google" : !external.apple ? "Apple" : undefined;
    test.skip(!provider, "Both providers are enabled; external credentials are tested separately.");
    await page.goto("/en/auth/login");
    await page.getByRole("button", { name: `Continue with ${provider}` }).click();
    await expect(page.getByText(en.errors.consent_required)).toBeVisible();
    await page.getByRole("checkbox", { name: /at least 16/ }).check();
    await page.getByRole("button", { name: `Continue with ${provider}` }).click();
    await expect(page.getByText(en.auth.oauthUnavailable)).toBeVisible();
    await expect(page).toHaveURL(/\/en\/auth\/login/);
  });

  test("a passwordless account cannot delete itself with an email-link session", async ({ page, baseURL }) => {
    const socialEmail = `passwordless-${stamp}@example.com`;
    // The local Auth fixture starts via an email link; its stored password is then cleared to model an OAuth-only account.
    const link = await service.auth.admin.generateLink({
      type: "invite", email: socialEmail,
      options: { data: { username: `passwordless_${stamp}`, preferred_lang: "en" } },
    });
    expect(link.error).toBeNull();
    const fixtureId = link.data.user!.id;
    users.push(fixtureId);
    const jar = new Map<string, string>();
    const session = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => [...jar].map(([name, value]) => ({ name, value })),
        setAll: (values) => { for (const { name, value } of values) jar.set(name, value); },
      },
    });
    const verified = await session.auth.verifyOtp({ type: "invite", token_hash: link.data.properties!.hashed_token });
    expect(verified.error).toBeNull();
    expect(["localhost", "127.0.0.1"]).toContain(new URL(url).hostname);
    expect(fixtureId).toMatch(/^[a-f0-9-]{36}$/);
    // Only this test-created UUID is changed. No production credential or existing account is modified.
    const changed = execFileSync("docker", ["exec", "supabase_db_edumap", "psql", "-U", "postgres", "-d", "postgres", "-At", "-c",
      `update auth.users set encrypted_password = '' where id = '${fixtureId}';`], { encoding: "utf8" });
    expect(changed.trim()).toBe("UPDATE 1");
    const hasPassword = await session.rpc("user_has_password");
    expect(hasPassword.error).toBeNull();
    expect(hasPassword.data).toBe(false);
    await page.context().addCookies([...jar].map(([name, value]) => ({ name, value, url: baseURL! })));
    await page.goto("/en/dashboard?tab=account");
    await expect(page.getByText(en.account.socialAccountTitle)).toBeVisible();
    await expect(page.getByLabel("Current password")).toHaveCount(0);
    await page.getByLabel(en.account.deleteUnderstand).check();
    await page.getByRole("button", { name: en.account.deleteButton }).click();
    await expect(page.getByText(en.errors.reauthentication_required)).toBeVisible();
    // The database also rejects a direct API call, independently of the server action and UI.
    const removed = await session.rpc("delete_my_account");
    expect(removed.error).toBeTruthy();
    expect((await service.auth.admin.getUserById(fixtureId)).data.user?.id).toBe(fixtureId);
  });

  test("unbound OAuth cancellation and forged callbacks stay on the site", async ({ page, baseURL }) => {
    await page.goto("/api/auth/callback?lang=en&error=access_denied&next=https://evil.example");
    await expect(page).toHaveURL(/\/en\/auth\/login\?.*error=oauth_consent/);
    expect(new URL(page.url()).origin).toBe(new URL(baseURL!).origin);
    await page.goto("/api/auth/callback?lang=en&code=forged&next=%2F%2Fevil.example");
    await expect(page).toHaveURL(/\/en\/auth\/login\?.*error=oauth_consent/);
    expect(new URL(page.url()).origin).toBe(new URL(baseURL!).origin);
    await page.goto("/api/auth/callback?lang=en&next=%2F%5Cevil.example");
    await expect(page).toHaveURL(/\/en\/auth\/login\?.*error=link/);
  });
});
