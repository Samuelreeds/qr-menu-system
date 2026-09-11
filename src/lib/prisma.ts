import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

// 1. Initialize and cache the raw pg Pool
if (!globalForPrisma.pool) {
  globalForPrisma.pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // CRITICAL FIX: Limit serverless instances to 1 connection.
    // The pg driver defaults to 10. In Vercel, multiple functions spawning 
    // 10 connections will instantly crash Supabase's pool limit of 15.
    max: 1, 
  });
}

// 2. Initialize and cache PrismaClient with the pg adapter
if (!globalForPrisma.prisma) {
  const adapter = new PrismaPg(globalForPrisma.pool);
  globalForPrisma.prisma = new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma;

// 3. Preserve during Next.js Hot Module Replacement (HMR)
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = globalForPrisma.pool; // Cache the pool directly
}