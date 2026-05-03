import { PrismaClient } from "@prisma/client";

export type DbClient = PrismaClient;

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const createDbClient = (): DbClient => {
  const db =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: ["error"],
    });

  globalForPrisma.prisma = db;

  return db;
};
