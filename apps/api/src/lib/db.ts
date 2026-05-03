import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

export type DbClient = PrismaClient;

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const createDbClient = (): DbClient => {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  const db =
    globalForPrisma.prisma ??
    new PrismaClient({ adapter, log: ["error"] });

  globalForPrisma.prisma = db;

  return db;
};
