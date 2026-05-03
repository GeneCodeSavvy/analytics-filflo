import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export type DbClient = PrismaClient;

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const createDbClient = (db_url: string): DbClient => {
  const adapter = new PrismaPg({
    connectionString: db_url,
  });
  const db =
    globalForPrisma.prisma ?? new PrismaClient({ adapter, log: ["error"] });

  globalForPrisma.prisma = db;

  return db;
};
