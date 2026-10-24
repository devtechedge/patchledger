/**
 * Captures README screenshots from the live production alias and renders the
 * 1280x640 social preview card (dark "ledger" identity). Run: node scripts/capture-shots.mjs
 * Requires chromium: npx playwright install chromium
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "https://patchledger.vercel.app";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });

const DEMO = { email: "demo@patchledger.test", password: "demo-password-1" };

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: "dark",
});
const page = await ctx.newPage();

async function shot(name, fullPage = false) {
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage });
  console.log(`captured ${name}`);
}

// 1. landing
await page.goto(BASE, { waitUntil: "networkidle" });
await shot("01-landing");

// sign in to the demo workspace
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.getByLabel("Email").fill(DEMO.email);
await page.getByLabel("Password").fill(DEMO.password);
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL("**/dashboard");
await shot("02-dashboard");

// project overview with findings table + SLA stats
await page.getByRole("link", { name: /Northwind Portal/ }).click();
await page.waitForURL("**/p/**");
await shot("03-project-findings");

// finding detail with evidence history and actions
await page.getByRole("link", { name: /underscore/ }).click();
await page.waitForURL("**/f/**");
await shot("04-finding-evidence");

// import page
await page.goBack();
await page.getByRole("link", { name: "Import scan" }).click();
await shot("05-import");

// public client report (fresh context: no session)
const pub = await ctx.newPage();
await pub.goto(`${BASE}/r/ffcbff31732032a6c1e5830c42ad4d9c`, { waitUntil: "networkidle" });
await pub.waitForTimeout(700);
await pub.screenshot({ path: `${OUT}/06-client-report.png`, fullPage: true });
console.log("captured 06-client-report");

await browser.close();

// social preview card: 1280x640, ink + amber ledger identity
const card = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin: 0; box-sizing: border-box; }
  html, body { width: 1280px; height: 640px; }
  body {
    font-family: ui-sans-serif, system-ui, "Segoe UI", sans-serif;
    background: #0c0f14; color: #e8ecf2; position: relative; overflow: hidden;
  }
  .grid-bg {
    position: absolute; inset: 0; opacity: 0.5;
    background-image:
      linear-gradient(rgba(148,163,184,0.07) 1px, transparent 1px),
      linear-gradient(90deg, rgba(148,163,184,0.07) 1px, transparent 1px);
    background-size: 36px 36px;
  }
  .wrap { position: relative; padding: 88px 96px; }
  .mark { display: flex; align-items: center; gap: 18px; }
  .box { width: 44px; height: 44px; border: 3px solid #f59e0b; display: grid; place-items: center; }
  .box span { width: 16px; height: 16px; background: #f59e0b; display: block; }
  h1 { font-family: ui-monospace, monospace; font-size: 30px; letter-spacing: 0.22em; }
  .line { margin-top: 48px; height: 2px; width: 120px; background: #f59e0b; }
  .tag { margin-top: 36px; font-size: 46px; line-height: 1.15; font-weight: 700;
    letter-spacing: -0.5px; max-width: 1000px; }
  .tag em { color: #f59e0b; font-style: normal; }
  .sub { margin-top: 26px; font-size: 24px; color: #9aa6b6; }
  ul { margin: 0; padding: 0; list-style: none; position: absolute; left: 96px; bottom: 84px;
    display: flex; gap: 14px; }
  li { font-family: ui-monospace, monospace; font-size: 15px; letter-spacing: 0.14em;
    color: #9aa6b6; border: 1px solid #232b37; padding: 8px 18px; background: #12161d;
    text-transform: uppercase; }
  .foot { position: absolute; right: 96px; bottom: 92px; font-family: ui-monospace, monospace;
    font-size: 16px; color: #64707f; letter-spacing: 0.18em; }
</style></head><body>
  <div class="grid-bg"></div>
  <div class="wrap">
    <div class="mark"><div class="box"><span></span></div><h1>PATCHLEDGER</h1></div>
    <div class="line"></div>
    <p class="tag">Prove your security maintenance.<br/><em>Evidence, not promises.</em></p>
    <p class="sub">Scanner output in. An evidence-backed record out.</p>
    <ul><li>npm audit</li><li>osv-scanner</li><li>fix + verify evidence</li><li>sla tracking</li></ul>
    <div class="foot">patchledger.vercel.app</div>
  </div>
</body></html>`;

const b2 = await chromium.launch();
const p2 = await b2.newPage({ viewport: { width: 1280, height: 640 }, deviceScaleFactor: 1 });
await p2.setContent(card, { waitUntil: "networkidle" });
await p2.screenshot({ path: `${OUT}/social-preview.png` });
await b2.close();
console.log("captured social-preview");
writeFileSync(`${OUT}/README.md`, "# Product screenshots\n\nCaptured from the live production deploy (dark ledger identity); regenerate with `node scripts/capture-shots.mjs`.\n");
console.log("done");
