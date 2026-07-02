import { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | null = null;
let isDbConnected = false;

export function getPrisma(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: ['error'],
    });
  }
  return prismaInstance;
}

export async function checkDbConnection(): Promise<boolean> {
  if (isDbConnected) return true;
  try {
    const prisma = getPrisma();
    // Lightweight check query
    await prisma.$queryRaw`SELECT 1`;
    isDbConnected = true;
    console.log('✅ PostgreSQL database is connected and active via Prisma.');
    return true;
  } catch (error) {
    console.warn('⚠️ PostgreSQL is not reachable (Gracefully falling back to file-based db.json):');
    isDbConnected = false;
    return false;
  }
}
