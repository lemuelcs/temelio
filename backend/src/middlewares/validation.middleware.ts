// backend/src/middlewares/validation.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from './error.middleware'; // ✅ Usar o AppError existente

/**
 * Middleware para validar erros do express-validator
 * Deve ser usado APÓS as regras de validação
 * 
 * @example
 * router.post('/rota',
 *   validarBatchDisponibilidade, // Regras de validação
 *   validarErros,                 // Verificar erros
 *   controller                    // Controller
 * );
 */
export const validarErros = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Pegar primeira mensagem de erro
    const primeiroErro = errors.array()[0];
    
    // Lançar AppError (seu sistema já usa isso)
    return next(new AppError(primeiroErro.msg, 400));
  }

  // Sem erros, continuar
  next();
};