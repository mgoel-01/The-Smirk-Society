import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7 reads migration settings from here rather than from the schema.
 * `prisma db push` and `prisma studio` use this connection string; the
 * application itself connects through the driver adapter in src/lib/prisma.ts.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
