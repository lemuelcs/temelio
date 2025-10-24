import { PrismaClient } from '@prisma/client';

const isProduction = process.env.NODE_ENV === 'production';
const logLevels = isProduction ? ['error'] : ['query', 'warn', 'error'];

declare global {
  // eslint-disable-next-line no-var
  var __PRISMA_CLIENT__: PrismaClient | undefined;
}

const prismaClient =
  globalThis.__PRISMA_CLIENT__ ??
  new PrismaClient({
    log: logLevels,
  });

if (!isProduction) {
  globalThis.__PRISMA_CLIENT__ = prismaClient;
}

export default prismaClient;
