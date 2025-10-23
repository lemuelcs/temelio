import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import { AppError } from '../middlewares/error.middleware';

class AuthController {
  // POST /api/auth/register
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, senha, nome, perfil } = req.body;

      // Validações básicas
      if (!email || !senha || !nome || !perfil) {
        throw new AppError('Todos os campos são obrigatórios', 400);
      }

      if (senha.length < 6) {
        throw new AppError('A senha deve ter no mínimo 6 caracteres', 400);
      }

      // Registrar usuário
      const result = await authService.register({
        email,
        senha,
        nome,
        perfil
      });

      res.status(201).json({
        status: 'success',
        message: 'Usuário registrado com sucesso',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/login
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, senha } = req.body;

      // Validações básicas
      if (!email || !senha) {
        throw new AppError('Email e senha são obrigatórios', 400);
      }

      // Fazer login
      const result = await authService.login({ email, senha });

      res.json({
        status: 'success',
        message: 'Login realizado com sucesso',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/auth/me
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      // O usuário já está disponível em req.user (pelo middleware authenticate)
      if (!req.user) {
        throw new AppError('Usuário não autenticado', 401);
      }

      res.json({
        status: 'success',
        data: {
          user: req.user
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/verify
  async verifyToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;

      if (!token) {
        throw new AppError('Token não fornecido', 400);
      }

      const usuario = await authService.verifyToken(token);

      res.json({
        status: 'success',
        message: 'Token válido',
        data: { user: usuario }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();