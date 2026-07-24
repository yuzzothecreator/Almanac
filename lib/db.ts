import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/prisma/generated/client/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

function createPrismaClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required. Add it to your .env file.");
  }

  const pool =
    globalForPrisma.pgPool ??
    new Pool({
      connectionString: process.env.DATABASE_URL,
    });

  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pgPool = pool;
  }

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
