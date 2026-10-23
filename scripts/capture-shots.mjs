/**
 * Captures README screenshots from the live production alias and renders the
 * 1280x640 social preview card. Run: node scripts/capture-shots.mjs
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
  colorScheme: "light",
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

// project overview with findings + SLA cards
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

// social preview card: 1280x640, dark slate, flat product crop
const card = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin: 0; box-sizing: border-box; }
  html, body { width: 1280px; height: 640px; }
  body {
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    background: linear-gradient(135deg, #0b1220 0%, #101c33 60%, #0d2a4d 100%);
    color: #e3e9f2; display: flex; align-items: center; padding: 0 88px;
  }
  .mark { display: flex; align-items: center; gap: 20px; }
  .shield { width: 76px; height: 76px; border-radius: 18px; background: #2563eb;
    display: grid; place-items: center; }
  .shield svg { width: 44px; height: 44px; }
  h1 { font-size: 74px; letter-spacing: -2px; }
  .tag { margin-top: 26px; font-size: 30px; line-height: 1.45; color: #b6c2d6; max-width: 900px; }
  .tag b { color: #e3e9f2; font-weight: 600; }
  ul { margin-top: 40px; list-style: none; display: flex; gap: 18px; }
  li { font-size: 21px; color: #9fb0c8; border: 1px solid #22304a; border-radius: 999px;
    padding: 10px 24px; background: #121b2d; }
  .foot { position: absolute; right: 88px; bottom: 56px; font-size: 19px; color: #64748b;
    font-family: ui-monospace, monospace; }
</style></head><body>
  <div>
    <div class="mark">
      <div class="shield"><svg viewBox="0 0 32 32" fill="none">
        <path d="M16 3l9 3.4v8c0 5.6-3.8 9.6-9 11.2-5.2-1.6-9-5.6-9-11.2v-8L16 3z" fill="#fff"/>
        <path d="M12 16.2l2.8 2.8L20.5 13" stroke="#2563eb" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg></div>
      <h1>PatchLedger</h1>
    </div>
    <p class="tag">Prove your security maintenance, not just promise it.<br/>
      Scanner output in, <b>evidence-backed client reports</b> out.</p>
    <ul><li>npm audit + osv-scanner</li><li>fix + verification evidence</li><li>SLA tracking</li><li>branded reports</li></ul>
    <div class="foot">patchledger.vercel.app</div>
  </div>
</body></html>`;

const b2 = await chromium.launch();
const p2 = await b2.newPage({ viewport: { width: 1280, height: 640 }, deviceScaleFactor: 1 });
await p2.setContent(card, { waitUntil: "networkidle" });
await p2.screenshot({ path: `${OUT}/social-preview.png` });
await b2.close();
console.log("captured social-preview");
writeFileSync(`${OUT}/README.md`, "# Product screenshots\n\nCaptured from the live production deploy; regenerate with `node scripts/capture-shots.mjs`.\n");
console.log("done");
