import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

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

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing required environment variable: DATABASE_URL.");
  }

  const adapter = new PrismaPg({
    connectionString,
    // Serverless functions are short-lived and numerous, so keep each
    // instance's pool small. Neon's pooled endpoint handles the fan-in.
    max: Number(process.env.DB_POOL_MAX ?? 5),
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
