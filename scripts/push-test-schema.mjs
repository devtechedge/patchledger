// Pushes the Prisma schema to the throwaway test database before vitest runs.
// This lives in the npm test script instead of vitest globalSetup because
// vitest 5.0.5 + vite 8.3.5's module-runner crashes evaluating globalSetup
// files in this dependency tree (careproof's older lockfile is unaffected).
import { execSync } from "node:child_process";

try {
  process.loadEnvFile();
} catch {
  // env must come from the environment in CI
}
const url = process.env.DATABASE_URL_TEST_UNPOOLED;
if (!url) {
  throw new Error("DATABASE_URL_TEST_UNPOOLED is required.");
}
execSync("npx prisma db push", {
  stdio: "pipe",
  cwd: process.cwd(),
  env: { ...process.env, DATABASE_URL: url },
});
console.log("test schema pushed");
