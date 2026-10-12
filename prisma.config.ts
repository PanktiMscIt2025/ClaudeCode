import { defineConfig } from "prisma/config";

try {
  process.loadEnvFile?.(".env");
} catch {
  // .env is optional; variables may come from the environment.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  // Same default as lib/server/db.ts, so `npm install` (prisma generate) works before .env exists.
  datasource: { url: process.env.DATABASE_URL || "file:./prisma/dev.db" },
});
