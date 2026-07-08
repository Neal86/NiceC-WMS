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
    await prisma.$queryRaw`SELECT 1`;
    isDbConnected = true;
    console.log('✅ PostgreSQL database is connected and active via Prisma.');
    return true;
  } catch (error) {
    isDbConnected = false;
    const enableJsonFallback = process.env.ENABLE_JSON_FALLBACK !== 'false';
    const nodeEnv = process.env.NODE_ENV || 'development';
    const isProduction = nodeEnv === 'production';
    if (isProduction && !enableJsonFallback) {
      console.error('❌ FATAL: PostgreSQL is not reachable in production mode and ENABLE_JSON_FALLBACK is disabled.');
      console.error('   Set ENABLE_JSON_FALLBACK=true in .env for demo/dev mode, or fix DATABASE_URL.');
      process.exit(1);
    }
    console.warn('⚠️ PostgreSQL is not reachable (falling back to file-based JSON data if ENABLE_JSON_FALLBACK=true):');
    return false;
  }
}

export function isJsonFallbackEnabled(): boolean {
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv === 'production') {
    return process.env.ENABLE_JSON_FALLBACK === 'true';
  }
  return true;
}
