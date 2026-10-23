/**
 * One-time local bootstrap:
 * 1. reads careproof/.env (same Neon host, existing credentials),
 * 2. creates patchledger + patchledger_test databases,
 * 3. writes patchledger/.env with transformed URLs and a fresh SESSION_PEPPER.
 * Never prints connection strings.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";
import pg from "pg";

const careproofEnvPath = path.resolve(
  import.meta.dirname,
  "../..//careproof/.env"
);
const outEnvPath = path.resolve(import.meta.dirname, "../.env");

function parseEnv(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/.exec(line);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function swapDb(url, from, to) {
  // replace only the path database segment, keep host/query intact
  return url.replace(new RegExp(`/${from}(\\?|$)`), `/${to}$1`);
}

const env = parseEnv(readFileSync(careproofEnvPath, "utf8"));
const unpooled = env.DATABASE_URL_UNPOOLED;
const pooled = env.DATABASE_URL;
if (!unpooled || !pooled) throw new Error("careproof/.env is missing DATABASE_URL(_UNPOOLED)");

const client = new pg.Client({ connectionString: unpooled });
await client.connect();
for (const db of ["patchledger", "patchledger_test"]) {
  try {
    await client.query(`CREATE DATABASE "${db}"`);
    console.log(`created database: ${db}`);
  } catch (e) {
    if (e.code === "42P04") console.log(`database already exists: ${db}`);
    else throw e;
  }
}
await client.end();

const pepper = randomBytes(32).toString("hex");
const dotEnv = [
  `DATABASE_URL="${swapDb(pooled, "careproof", "patchledger")}"`,
  `DATABASE_URL_UNPOOLED="${swapDb(unpooled, "careproof", "patchledger")}"`,
  `DATABASE_URL_TEST="${swapDb(pooled, "careproof_test", "patchledger_test")}"`,
  `DATABASE_URL_TEST_UNPOOLED="${swapDb(unpooled, "careproof_test", "patchledger_test")}"`,
  `SESSION_PEPPER="${pepper}"`,
  `NEXT_PUBLIC_SITE_URL="http://localhost:3000"`,
  "",
].join("\n");
writeFileSync(outEnvPath, dotEnv, "utf8");
console.log("wrote patchledger/.env (fresh SESSION_PEPPER generated)");
