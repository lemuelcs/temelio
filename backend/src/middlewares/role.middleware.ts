// backend/src/middlewares/role.middleware.ts

import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de autorização por perfil
 * Verifica se o usuário tem permissão para acessar a rota
 */
export const autorizar = (perfisPermitidos: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Verificar se usuário está autenticado
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    // Verificar se o perfil do usuário está na lista de permitidos
    const perfilUsuario = req.user.perfil;

    if (!perfisPermitidos.includes(perfilUsuario)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Você não tem permissão para acessar este recurso.',
        detalhes: {
          perfilUsuario,
          perfisPermitidos
        }
      });
    }

    // Usuário autorizado, continuar
    next();
  };
};

/**
 * Atalhos para perfis comuns
 */
export const apenasMotorista = autorizar(['MOTORISTA']);
export const apenasAdmin = autorizar(['ADMINISTRADOR']);
export const apenasGestao = autorizar(['ADMINISTRADOR', 'DESPACHANTE_PLANEJADOR']);