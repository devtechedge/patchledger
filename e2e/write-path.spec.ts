import { expect, test } from "@playwright/test";

/**
 * Authenticated write-path coverage against the seeded demo workspace.
 * Transitions are reverted and the generated report is revoked, so the demo
 * state survives the run (npm run db:seed also fully reseeds it).
 */
test("demo write path: transition, report generate, revoke", async ({ page }) => {
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill("demo@patchledger.test");
  await page.getByLabel("Password").fill("demo-password-1");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard");

  // mobile overflow on authenticated surfaces (one login per run; the login
  // rate limit is per-email, so no second login in this suite)
  await page.setViewportSize({ width: 375, height: 812 });
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
  await page.setViewportSize({ width: 1280, height: 720 });

  // open the underscore finding (row link)
  await page.getByRole("link", { name: /underscore/ }).first().click();
  await page.waitForURL("**/f/**");
  await expect(page.getByText("Status history")).toBeVisible();

  // normalize state from any previous interrupted run: whatever the status,
  // land it on open, then do one full open -> in_progress -> open cycle
  const backToOpen = page.getByRole("button", { name: "Back to open" });
  const startWork = page.getByRole("button", { name: "Start work" });
  if (await backToOpen.isVisible()) {
    await backToOpen.click();
    await expect(page.getByText('Status updated to "open"')).toBeVisible();
  } else {
    await expect(startWork).toBeVisible();
  }
  await startWork.click();
  await expect(page.getByText('Status updated to "in_progress"')).toBeVisible();
  await page.getByRole("button", { name: "Back to open" }).click();
  await expect(page.getByText('Status updated to "open"')).toBeVisible();
  await expect(page.getByText("open → in_progress").first()).toBeVisible();

  // report generation from the reports page
  await page.getByRole("link", { name: "Reports", exact: true }).click();
  await page.waitForURL("**/reports");
  await page.getByRole("button", { name: "Generate client report" }).click();
  await expect(page.getByText("Report generated.")).toBeVisible();

  const reportLink = page.getByRole("link", { name: "Open report" });
  const href = await reportLink.getAttribute("href");
  expect(href).toBeTruthy();
  const status = await page.request.get(href!);
  expect(status.status()).toBe(200);

  // open the share page and check the limitations statement renders
  await reportLink.click();
  await page.waitForURL("**/r/**");
  await expect(page.getByText(/not a penetration test/)).toBeVisible();

  // revoke from the reports list; the link must then 404
  await page.goBack();
  await page.waitForURL("**/reports");
  await page.getByRole("button", { name: "Revoke" }).first().click();
  await expect(page.getByText("revoked").first()).toBeVisible();
  const revoked = await page.request.get(href!);
  expect(revoked.status()).toBe(404);
});
