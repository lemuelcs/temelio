import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import logger from '../lib/logger';

// Classe customizada de erro
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Middleware de tratamento de erros
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(
    {
      message: err.message,
      stack: err.stack,
      name: err.name,
      path: req.path,
    },
    'Erro tratado pelo middleware'
  );

  // Se for um AppError customizado
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Erros do Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Violação de constraint única (duplicate key)
    if (err.code === 'P2002') {
      const field = (err.meta?.target as string[])?.join(', ') || 'campo';
      return res.status(400).json({
        status: 'error',
        message: `Já existe um registro com esse ${field}`,
        code: err.code
      });
    }

    // Registro não encontrado
    if (err.code === 'P2025') {
      return res.status(404).json({
        status: 'error',
        message: 'Registro não encontrado',
        code: err.code
      });
    }

    // Foreign key constraint failed
    if (err.code === 'P2003') {
      return res.status(400).json({
        status: 'error',
        message: 'Violação de integridade referencial',
        code: err.code
      });
    }
  }

  // Erro de validação do Prisma
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      status: 'error',
      message: 'Dados inválidos fornecidos',
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
  }

  // Erro genérico (500)
  return res.status(500).json({
    status: 'error',
    message: 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { 
      error: err.message,
      stack: err.stack 
    })
  });
};
