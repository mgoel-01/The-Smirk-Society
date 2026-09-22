import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env";

/**
 * Prisma 7 connects through a driver adapter rather than a URL in the schema.
 *
 * Next.js hot-reloads modules in development; without the global cache below,
 * every reload would open a fresh connection pool and quickly exhaust the
 * database's connection limit.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/** A quoted or malformed value must not become NaN and break the pool. */
function poolMax(): number {
  const raw = process.env.DB_POOL_MAX?.trim().replace(/^["']|["']$/g, "");
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
}

function createClient(): PrismaClient {
  // Read through `env` rather than process.env directly: it asserts the
  // variable is present and strips the surrounding quotes a value picks up
  // when it is copied out of .env into a hosting dashboard. A quoted
  // connection string fails to parse, and the resulting error says nothing
  // about quotes.
  const connectionString = env.databaseUrl;

  const adapter = new PrismaPg({
    connectionString,
    // Serverless functions are short-lived and numerous, so keep each
    // instance's pool small. Neon's pooled endpoint handles the fan-in.
    max: poolMax(),
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
