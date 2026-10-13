import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

// One client per process; reused across dev hot reloads.
const globalForDb = globalThis as unknown as { db?: PrismaClient };

function createClient() {
  // No connection is opened until the first query, so `next build` works without a database.
  if (!process.env.DATABASE_URL) console.warn("DATABASE_URL is not set: add your PostgreSQL connection string to .env.");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
}

export const db = globalForDb.db ?? createClient();
if (process.env.NODE_ENV !== "production") globalForDb.db = db;
