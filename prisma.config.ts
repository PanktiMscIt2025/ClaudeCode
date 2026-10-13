import { defineConfig } from "prisma/config";

try {
  process.loadEnvFile?.(".env");
} catch {
  // .env is optional; variables may come from the environment.
}

// Migrations need a direct (non-pooled) connection. Neon pooled URLs have "-pooler" in the host name; derive the
// direct one so a single copied connection string works. DIRECT_URL overrides this.
const databaseUrl = process.env.DATABASE_URL?.replace(/-pooler(\.[^/@]*neon\.tech)/, "$1");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  // The placeholder only lets `npm install` (prisma generate) run before .env exists.
  datasource: { url: process.env.DIRECT_URL || databaseUrl || "postgresql://localhost:5432/assignai" },
});
