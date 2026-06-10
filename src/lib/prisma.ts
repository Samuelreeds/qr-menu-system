import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const createPrismaClient = () => {
  // The adapter MUST be inside this function so it is only created once
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  } as any); 

  return new PrismaClient({
    adapter,
  });
};

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}