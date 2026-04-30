import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL);

if (!databaseUrl) {
  throw new Error("DATABASE_URL or POSTGRES_PRISMA_URL must be configured");
}

const ssl = databaseUrl.includes("supabase.com") ? { rejectUnauthorized: false } : undefined;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: databaseUrl,
      ssl,
    }),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

function normalizeDatabaseUrl(url: string | undefined) {
  if (!url || !url.includes("supabase.com")) {
    return url;
  }

  return url.replace("sslmode=require", "sslmode=no-verify");
}
