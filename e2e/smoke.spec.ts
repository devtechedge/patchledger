import { expect, test } from "@playwright/test";

test("landing states what the product is and links the sample report", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Prove your security maintenance"
  );
  await expect(
    page.getByRole("link", { name: /sample client report/i })
  ).toBeVisible();
});

test("login page renders the form and the demo hint", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByText("demo@patchledger.test")).toBeVisible();
});

test("dashboard requires a session", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});

test("health endpoint reports database connectivity", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body).toEqual({ ok: true, db: "up" });
});

test("unknown share links 404 without leaking anything", async ({ page }) => {
  const res = await page.request.get("/r/0000000000000000000000000000dead");
  expect(res.status()).toBe(404);
});

test("no horizontal overflow on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const path of ["/", "/login", "/pricing"]) {
    await page.goto(path, { waitUntil: "networkidle" });
    const over = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(over, `overflow on ${path}`).toBeLessThanOrEqual(2);
  }
  // authenticated surfaces
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill("demo@patchledger.test");
  await page.getByLabel("Password").fill("demo-password-1");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard");
  const overDash = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overDash, "overflow on /dashboard").toBeLessThanOrEqual(2);
  await page.getByRole("link", { name: /Northwind Portal/ }).click();
  await page.waitForURL("**/p/**");
  await page.waitForTimeout(500);
  const overProject = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overProject, "overflow on /p/[id]").toBeLessThanOrEqual(2);
});
