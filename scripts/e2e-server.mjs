// Starts an isolated AssignAI server for the Playwright acceptance test:
// fresh SQLite DB + storage under .e2e/, seeded faculty account, optional mock Claude API (E2E_AI=mock).
import { execSync, spawn } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const dir = path.join(root, ".e2e");
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });

const port = process.env.E2E_PORT ?? "3100";
const env = {
  ...process.env,
  DATABASE_URL: `file:${path.join(dir, "test.db")}`,
  STORAGE_DIR: path.join(dir, "storage"),
  SEED_FACULTY_EMAIL: "faculty@college.edu",
  SEED_FACULTY_NAME: "Dr. Test Faculty",
  SEED_FACULTY_PASSWORD: "ChangeMe-2026",
  COOKIE_SECURE: "false",
  ANTHROPIC_API_KEY: "",
  NEXT_TELEMETRY_DISABLED: "1",
};

if (process.env.E2E_AI === "mock") {
  const { startMock } = await import("../tests/mock-anthropic.mjs");
  await startMock(4010);
  env.ANTHROPIC_API_KEY = "test-key";
  env.ANTHROPIC_BASE_URL = "http://127.0.0.1:4010";
  console.log("[e2e] mock Anthropic API on :4010");
}

execSync("npx prisma migrate deploy", { cwd: root, env, stdio: "inherit" });
execSync("npx tsx prisma/seed.ts", { cwd: root, env, stdio: "inherit" });

const child = spawn("npx", ["next", "dev", "-p", port], { cwd: root, env, stdio: "inherit" });
const stop = () => child.kill("SIGTERM");
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
child.on("exit", (code) => process.exit(code ?? 0));
