import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error.middleware';
import { TipoPerfil } from '@prisma/client';
import logger from '../lib/logger';

// Estender o tipo Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        perfil: TipoPerfil;
        deveAlterarSenha: boolean;
      };
    }
  }
}

interface JwtPayload {
  id: string;
  email: string;
  perfil: TipoPerfil;
  deveAlterarSenha: boolean;
}

// Middleware para verificar se o usuário está autenticado
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Pegar o token do header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError('Token não fornecido', 401);
    }

    // Bearer token
    const [, token] = authHeader.split(' ');

    if (!token) {
      throw new AppError('Token malformatado', 401);
    }

    // Verificar o token
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new AppError('Configuração de autenticação inválida', 500);
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;

    // Adicionar as informações do usuário na requisição
    req.user = {
      id: decoded.id,
      email: decoded.email,
      perfil: decoded.perfil,
      deveAlterarSenha: decoded.deveAlterarSenha
    };
    logger.debug(
      { userId: req.user.id, perfil: req.user.perfil, path: req.path },
      'Usuário autenticado'
    );

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Token inválido', 401));
    }

    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Token expirado', 401));
    }

    next(error);
  }
};

// Middleware para verificar se o usuário tem permissão (perfil específico)
export const authorize = (...perfisPermitidos: TipoPerfil[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Usuário não autenticado', 401));
    }

    if (!perfisPermitidos.includes(req.user.perfil)) {
      return next(
        new AppError('Você não tem permissão para acessar este recurso', 403)
      );
    }

    next();
  };
};
