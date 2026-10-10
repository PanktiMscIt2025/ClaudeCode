import { defineConfig, env } from "prisma/config";

try {
  process.loadEnvFile?.(".env");
} catch {
  // .env is optional; variables may come from the environment.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  datasource: { url: env("DATABASE_URL") },
});
