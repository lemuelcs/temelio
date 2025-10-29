// backend/src/controllers/usuario.controller.ts
import { Request, Response, NextFunction } from 'express';
import { TipoPerfil } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import usuarioService from '../services/usuario.service';
import logger from '../lib/logger';

class UsuarioController {
  /**
   * Listar usuários com filtros e ordenação
   */
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const { perfil, ativo, busca, page = '1', limit = '50' } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      const where: any = {};

      if (perfil) where.perfil = perfil;
      if (ativo !== undefined) where.ativo = ativo === 'true';

      if (busca) {
        where.OR = [
          { nome: { contains: busca as string, mode: 'insensitive' } },
          { email: { contains: busca as string, mode: 'insensitive' } }
        ];
      }

      const [usuarios, total] = await Promise.all([
        prisma.usuario.findMany({
          where,
          skip,
          take,
          select: {
            id: true,
            email: true,
            nome: true,
            perfil: true,
            ativo: true,
            deveAlterarSenha: true,
            createdAt: true,
            updatedAt: true,
            motorista: {
              select: {
                id: true,
                nomeCompleto: true,
                status: true
              }
            }
          },
          orderBy: { createdAt: 'desc' } // Últimos cadastrados primeiro
        }),
        prisma.usuario.count({ where })
      ]);

      // Agrupar por tipo de perfil
      const usuariosAgrupados = usuarios.reduce((acc, usuario) => {
        const perfil = usuario.perfil;
        if (!acc[perfil]) {
          acc[perfil] = [];
        }
        acc[perfil].push(usuario);
        return acc;
      }, {} as Record<TipoPerfil, typeof usuarios>);

      res.json({
        success: true,
        data: {
          usuarios,
          usuariosAgrupados,
          total
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar usuário por ID
   */
  async buscarPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const usuario = await prisma.usuario.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          nome: true,
          perfil: true,
          ativo: true,
          deveAlterarSenha: true,
          createdAt: true,
          updatedAt: true,
          motorista: {
            select: {
              id: true,
              nomeCompleto: true,
              cpf: true,
              celular: true,
              status: true
            }
          }
        }
      });

      if (!usuario) {
        throw new AppError('Usuário não encontrado', 404);
      }

      res.json({
        success: true,
        data: usuario
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Criar novo usuário
   */
  async criar(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, nome, perfil, senha, deveAlterarSenha = true } = req.body;

      if (!email || !nome || !perfil || !senha) {
        throw new AppError('Email, nome, perfil e senha são obrigatórios', 400);
      }

      // Validar perfil
      if (!Object.values(TipoPerfil).includes(perfil)) {
        throw new AppError('Perfil inválido', 400);
      }

      // Dados de auditoria do usuário logado
      const usuarioLogado = (req as any).user;
      const auditData = {
        ip: req.ip || 'unknown',
        dispositivo: req.headers['user-agent'] || 'unknown',
        usuarioId: usuarioLogado?.id
      };

      const usuario = await usuarioService.criar(
        { email, nome, perfil, senha, deveAlterarSenha },
        auditData
      );

      res.status(201).json({
        success: true,
        data: usuario,
        message: 'Usuário criado com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualizar usuário
   */
  async atualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { email, nome, perfil, ativo } = req.body;

      // Dados de auditoria do usuário logado
      const usuarioLogado = (req as any).user;
      const auditData = {
        ip: req.ip || 'unknown',
        dispositivo: req.headers['user-agent'] || 'unknown',
        usuarioId: usuarioLogado?.id
      };

      const usuario = await usuarioService.atualizar(
        id,
        { email, nome, perfil, ativo },
        auditData
      );

      res.json({
        success: true,
        data: usuario,
        message: 'Usuário atualizado com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Alterar senha do usuário
   */
  async alterarSenha(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { novaSenha, senhaTemporaria = true } = req.body;

      if (!novaSenha) {
        throw new AppError('Nova senha é obrigatória', 400);
      }

      // Dados de auditoria do usuário logado
      const usuarioLogado = (req as any).user;
      const auditData = {
        ip: req.ip || 'unknown',
        dispositivo: req.headers['user-agent'] || 'unknown',
        usuarioId: usuarioLogado?.id
      };

      await usuarioService.alterarSenha(
        id,
        novaSenha,
        senhaTemporaria,
        auditData
      );

      res.json({
        success: true,
        message: senhaTemporaria
          ? 'Senha alterada com sucesso. Usuário deverá alterar a senha no próximo login.'
          : 'Senha alterada com sucesso.'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Excluir usuário
   */
  async excluir(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Dados de auditoria do usuário logado
      const usuarioLogado = (req as any).user;
      const auditData = {
        ip: req.ip || 'unknown',
        dispositivo: req.headers['user-agent'] || 'unknown',
        usuarioId: usuarioLogado?.id
      };

      await usuarioService.excluir(id, auditData);

      res.json({
        success: true,
        message: 'Usuário excluído com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Ativar/Desativar usuário
   */
  async toggleAtivo(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { ativo } = req.body;

      if (typeof ativo !== 'boolean') {
        throw new AppError('Campo ativo deve ser booleano', 400);
      }

      // Dados de auditoria do usuário logado
      const usuarioLogado = (req as any).user;
      const auditData = {
        ip: req.ip || 'unknown',
        dispositivo: req.headers['user-agent'] || 'unknown',
        usuarioId: usuarioLogado?.id
      };

      const usuario = await usuarioService.toggleAtivo(id, ativo, auditData);

      res.json({
        success: true,
        data: usuario,
        message: `Usuário ${ativo ? 'ativado' : 'desativado'} com sucesso`
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UsuarioController();
