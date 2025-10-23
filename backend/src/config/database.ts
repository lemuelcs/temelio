import { PrismaClient } from '@prisma/client';

// Criar instância única do Prisma Client (Singleton Pattern)
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error'] 
    : ['error'],
});

// Garantir que a conexão seja fechada quando a aplicação terminar
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;