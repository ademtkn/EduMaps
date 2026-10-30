import { expect, test, type Page } from "@playwright/test";

const MAIL = process.env.E2E_MAIL_URL ?? "http://127.0.0.1:56324";
const PASSWORD = "Passw0rd-e2e!";

/** Waits for a message to the address in the local mail catcher and returns its HTML body. */
async function mailTo(address: string, subjectPart?: string): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt++) {
    const list = await (await fetch(`${MAIL}/api/v1/search?query=${encodeURIComponent(`to:${address}`)}`)).json();
    const hit = (list.messages ?? []).find((m: { Subject: string }) => !subjectPart || m.Subject.includes(subjectPart));
    if (hit) return (await (await fetch(`${MAIL}/api/v1/message/${hit.ID}`)).json()).HTML as string;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`no email for ${address}`);
}
const callbackLink = (html: string) => (/href="([^"]*\/api\/auth\/callback[^"]*)"/.exec(html)?.[1] ?? "").replaceAll("&amp;", "&");

async function register(page: Page, email: string, name = "E2E Account") {
  await page.goto("/en/auth/register");
  await page.getByLabel("Display name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("checkbox", { name: /at least 16/ }).check();
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await page.waitForURL(/\/en\/dashboard/);
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/en/auth/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(/\/en\/dashboard/);
}

async function signOut(page: Page) {
  await page.getByRole("button", { name: "Account" }).first().click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible();
}

test.describe.serial("account", () => {
  const email = `e2e-reset-${Date.now()}@example.com`;
  const newPassword = "NewPassw0rd-e2e!";

  test("a forgotten password can be reset from the emailed link", async ({ page }) => {
    await register(page, email);
    await signOut(page);

    await page.goto("/en/auth/login");
    await page.getByRole("link", { name: "Forgot your password?" }).click();
    await expect(page).toHaveURL(/forgot-password/);
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText(/reset link is on its way/)).toBeVisible();

    const link = callbackLink(await mailTo(email, "Reset your password"));
    expect(link).toContain("type=recovery");
    await page.goto(link);
    await expect(page).toHaveURL(/\/en\/auth\/reset-password/);
    await page.getByLabel("New password", { exact: true }).fill("short");
    await page.getByLabel("Repeat the new password").fill("short");
    await page.getByRole("button", { name: "Save new password" }).click();
    await expect(page.getByText("Use at least 8 characters with a letter and a number.")).toBeVisible();
    await page.getByLabel("New password", { exact: true }).fill(newPassword);
    await page.getByLabel("Repeat the new password").fill("something-else1");
    await page.getByRole("button", { name: "Save new password" }).click();
    await expect(page.getByText("The passwords do not match.")).toBeVisible();
    await page.getByLabel("Repeat the new password").fill(newPassword);
    await page.getByRole("button", { name: "Save new password" }).click();
    await page.waitForURL(/\/en\/dashboard/);
    await expect(page.getByText("Your password was updated.")).toBeVisible();
    await expect(await mailTo(email, "Password changed")).toContain("EduMaps");
  });

  test("the old password stops working and the new one signs in", async ({ page }) => {
    await page.goto("/en/auth/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByText("Incorrect email or password.")).toBeVisible();
    await page.getByLabel("Password", { exact: true }).fill(newPassword);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL(/\/en\/dashboard/);
  });

  test("a used or invalid reset link is refused", async ({ page }) => {
    await page.goto("/api/auth/callback?token_hash=not-a-real-token&type=recovery&lang=en");
    await expect(page).toHaveURL(/\/en\/auth\/forgot-password\?error=link/);
    await expect(page.getByText("This reset link is invalid or has expired.")).toBeVisible();
    await page.goto("/en/auth/reset-password");
    await expect(page.getByText("This reset link is invalid or has expired.")).toBeVisible();
  });

  test("the password field can be shown and hidden", async ({ page }) => {
    await page.goto("/en/auth/login");
    const field = page.getByLabel("Password", { exact: true });
    await expect(field).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Show password" }).click();
    await expect(field).toHaveAttribute("type", "text");
  });
});

test.describe.serial("account settings", () => {
  const email = `e2e-acct-${Date.now()}@example.com`;
  const changed = "ChangedPassw0rd-e2e!";

  test("password change checks the current password", async ({ page }) => {
    await register(page, email, "E2E Settings");
    await page.goto("/en/dashboard?tab=account");
    await page.getByLabel("Current password").first().fill("wrong-password1");
    await page.getByLabel("New password", { exact: true }).fill(changed);
    await page.getByLabel("Repeat the new password").fill(changed);
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(page.getByText("The current password is incorrect.")).toBeVisible();
    await page.getByLabel("Current password").first().fill(PASSWORD);
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(page.getByText(/Your password was changed/)).toBeVisible();
  });

  test("email change sends confirmation to the new address", async ({ page }) => {
    const next = `e2e-new-${Date.now()}@example.com`;
    await signIn(page, email, changed);
    await page.goto("/en/dashboard?tab=account");
    await page.getByLabel("New email address").fill(next);
    await page.getByLabel("Current password").nth(1).fill(changed);
    await page.getByRole("button", { name: "Change email" }).click();
    await expect(page.getByText(/We sent confirmation links/)).toBeVisible();
    const link = callbackLink(await mailTo(next, "Confirm your new email"));
    expect(link).toContain("type=email_change");
  });

  test("a member can download their data", async ({ page }) => {
    await signIn(page, email, changed);
    await page.goto("/en/dashboard?tab=account");
    const response = await page.request.get("/api/account/export");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-disposition"]).toContain("attachment");
    const data = await response.json();
    expect(data.account.email).toBe(email);
    expect(data.service).toBe("EduMaps.kg");
  });

  test("deleting the account needs the password and removes the account", async ({ page }) => {
    await signIn(page, email, changed);
    await page.goto("/en/dashboard?tab=account");
    await page.getByRole("button", { name: "Delete my account" }).click();
    await expect(page.getByText("This field is required.").first()).toBeVisible();
    await page.getByLabel("Current password").nth(2).fill("wrong-password1");
    await page.getByLabel("I understand that this cannot be undone.").check();
    await page.getByRole("button", { name: "Delete my account" }).click();
    await expect(page.getByText("The current password is incorrect.")).toBeVisible();
    await page.getByLabel("Current password").nth(2).fill(changed);
    await page.getByRole("button", { name: "Delete my account" }).click();
    await page.waitForURL(/\/en(\?|$)/);
    await expect(page.getByText(/Your account was deleted/)).toBeVisible();

    await page.goto("/en/auth/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(changed);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByText("Incorrect email or password.")).toBeVisible();
  });

  test("anonymous visitors cannot download data", async ({ request }) => {
    expect((await request.get("/api/account/export")).status()).toBe(401);
  });
});
