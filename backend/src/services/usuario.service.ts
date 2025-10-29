// backend/src/services/usuario.service.ts
import bcrypt from 'bcrypt';
import { TipoPerfil } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import logger from '../lib/logger';

interface CriarUsuarioData {
  email: string;
  nome: string;
  perfil: TipoPerfil;
  senha: string;
  deveAlterarSenha?: boolean;
}

interface AtualizarUsuarioData {
  email?: string;
  nome?: string;
  perfil?: TipoPerfil;
  ativo?: boolean;
}

interface AuditData {
  ip: string;
  dispositivo: string;
  usuarioId?: string;
}

class UsuarioService {
  /**
   * Criar novo usuário
   */
  async criar(data: CriarUsuarioData, auditData: AuditData) {
    const { email, nome, perfil, senha, deveAlterarSenha = true } = data;

    try {
      // Verificar se o email já existe
      const usuarioExistente = await prisma.usuario.findUnique({
        where: { email }
      });

      if (usuarioExistente) {
        throw new AppError('Email já cadastrado', 400);
      }

      // Hash da senha
      const senhaHash = await bcrypt.hash(senha, 10);

      // Criar usuário
      const usuario = await prisma.usuario.create({
        data: {
          email,
          nome,
          perfil,
          senha: senhaHash,
          ativo: true,
          deveAlterarSenha
        },
        select: {
          id: true,
          email: true,
          nome: true,
          perfil: true,
          ativo: true,
          deveAlterarSenha: true,
          createdAt: true,
          updatedAt: true
        }
      });

      // Registrar auditoria
      await prisma.auditLog.create({
        data: {
          ...(auditData.usuarioId && { usuarioId: auditData.usuarioId }),
          acao: 'CRIAR_USUARIO',
          entidade: 'Usuario',
          entidadeId: usuario.id,
          descricao: `Usuário ${nome} (${email}) criado com perfil ${perfil}`,
          ip: auditData.ip,
          dispositivo: auditData.dispositivo
        }
      });

      logger.info(`Usuário criado: ${usuario.id} - ${email}`);

      return usuario;
    } catch (error) {
      logger.error(error, 'Erro ao criar usuário');
      throw error;
    }
  }

  /**
   * Atualizar usuário
   */
  async atualizar(id: string, data: AtualizarUsuarioData, auditData: AuditData) {
    try {
      // Verificar se o usuário existe
      const usuarioExistente = await prisma.usuario.findUnique({
        where: { id }
      });

      if (!usuarioExistente) {
        throw new AppError('Usuário não encontrado', 404);
      }

      // Se está alterando email, verificar se não existe outro usuário com o mesmo
      if (data.email && data.email !== usuarioExistente.email) {
        const emailEmUso = await prisma.usuario.findUnique({
          where: { email: data.email }
        });

        if (emailEmUso) {
          throw new AppError('Email já cadastrado', 400);
        }
      }

      // Atualizar usuário
      const usuario = await prisma.usuario.update({
        where: { id },
        data: {
          ...(data.email && { email: data.email }),
          ...(data.nome && { nome: data.nome }),
          ...(data.perfil && { perfil: data.perfil }),
          ...(data.ativo !== undefined && { ativo: data.ativo })
        },
        select: {
          id: true,
          email: true,
          nome: true,
          perfil: true,
          ativo: true,
          deveAlterarSenha: true,
          createdAt: true,
          updatedAt: true
        }
      });

      // Registrar auditoria
      const alteracoes = Object.keys(data)
        .filter((key) => data[key as keyof AtualizarUsuarioData] !== undefined)
        .join(', ');

      await prisma.auditLog.create({
        data: {
          ...(auditData.usuarioId && { usuarioId: auditData.usuarioId }),
          acao: 'ATUALIZAR_USUARIO',
          entidade: 'Usuario',
          entidadeId: id,
          descricao: `Usuário ${usuarioExistente.nome} atualizado. Campos: ${alteracoes}`,
          ip: auditData.ip,
          dispositivo: auditData.dispositivo
        }
      });

      logger.info(`Usuário atualizado: ${id}`);

      return usuario;
    } catch (error) {
      logger.error(error, 'Erro ao atualizar usuário');
      throw error;
    }
  }

  /**
   * Alterar senha do usuário
   */
  async alterarSenha(
    id: string,
    novaSenha: string,
    senhaTemporaria: boolean,
    auditData: AuditData
  ) {
    try {
      // Verificar se o usuário existe
      const usuario = await prisma.usuario.findUnique({
        where: { id }
      });

      if (!usuario) {
        throw new AppError('Usuário não encontrado', 404);
      }

      // Hash da nova senha
      const senhaHash = await bcrypt.hash(novaSenha, 10);

      // Atualizar senha
      await prisma.usuario.update({
        where: { id },
        data: {
          senha: senhaHash,
          deveAlterarSenha: senhaTemporaria
        }
      });

      // Registrar auditoria
      await prisma.auditLog.create({
        data: {
          ...(auditData.usuarioId && { usuarioId: auditData.usuarioId }),
          acao: 'ALTERAR_SENHA',
          entidade: 'Usuario',
          entidadeId: id,
          descricao: `Senha do usuário ${usuario.nome} alterada. Senha temporária: ${senhaTemporaria ? 'Sim' : 'Não'}`,
          ip: auditData.ip,
          dispositivo: auditData.dispositivo
        }
      });

      logger.info(`Senha alterada para usuário: ${id}`);
    } catch (error) {
      logger.error(error, 'Erro ao alterar senha');
      throw error;
    }
  }

  /**
   * Excluir usuário
   */
  async excluir(id: string, auditData: AuditData) {
    try {
      // Verificar se o usuário existe
      const usuario = await prisma.usuario.findUnique({
        where: { id },
        include: {
          motorista: true
        }
      });

      if (!usuario) {
        throw new AppError('Usuário não encontrado', 404);
      }

      // Se o usuário for motorista, excluir os dados relacionados
      if (usuario.motorista) {
        // Excluir documentos do motorista
        await prisma.documentoMotorista.deleteMany({
          where: { motoristaId: usuario.motorista.id }
        });

        // Excluir contratos do motorista
        await prisma.contratoMotorista.deleteMany({
          where: { motoristaId: usuario.motorista.id }
        });

        // Excluir histórico de status
        await prisma.historicoStatusMotorista.deleteMany({
          where: { motoristaId: usuario.motorista.id }
        });

        // Excluir disponibilidades
        await prisma.disponibilidade.deleteMany({
          where: { motoristaId: usuario.motorista.id }
        });

        // Excluir motorista
        await prisma.motorista.delete({
          where: { id: usuario.motorista.id }
        });
      }

      // Excluir audit logs do usuário
      await prisma.auditLog.deleteMany({
        where: { usuarioId: id }
      });

      // Excluir usuário
      await prisma.usuario.delete({
        where: { id }
      });

      // Registrar auditoria da exclusão (pelo usuário que executou)
      if (auditData.usuarioId) {
        await prisma.auditLog.create({
          data: {
            usuarioId: auditData.usuarioId,
            acao: 'EXCLUIR_USUARIO',
            entidade: 'Usuario',
            entidadeId: id,
            descricao: `Usuário ${usuario.nome} (${usuario.email}) excluído`,
            ip: auditData.ip,
            dispositivo: auditData.dispositivo
          }
        });
      }

      logger.info(`Usuário excluído: ${id}`);
    } catch (error) {
      logger.error(error, 'Erro ao excluir usuário');
      throw error;
    }
  }

  /**
   * Ativar/Desativar usuário
   */
  async toggleAtivo(id: string, ativo: boolean, auditData: AuditData) {
    try {
      // Verificar se o usuário existe
      const usuarioExistente = await prisma.usuario.findUnique({
        where: { id }
      });

      if (!usuarioExistente) {
        throw new AppError('Usuário não encontrado', 404);
      }

      // Atualizar status
      const usuario = await prisma.usuario.update({
        where: { id },
        data: { ativo },
        select: {
          id: true,
          email: true,
          nome: true,
          perfil: true,
          ativo: true,
          deveAlterarSenha: true,
          createdAt: true,
          updatedAt: true
        }
      });

      // Registrar auditoria
      await prisma.auditLog.create({
        data: {
          ...(auditData.usuarioId && { usuarioId: auditData.usuarioId }),
          acao: ativo ? 'ATIVAR_USUARIO' : 'DESATIVAR_USUARIO',
          entidade: 'Usuario',
          entidadeId: id,
          descricao: `Usuário ${usuarioExistente.nome} ${ativo ? 'ativado' : 'desativado'}`,
          ip: auditData.ip,
          dispositivo: auditData.dispositivo
        }
      });

      logger.info(`Usuário ${ativo ? 'ativado' : 'desativado'}: ${id}`);

      return usuario;
    } catch (error) {
      logger.error(error, 'Erro ao alterar status do usuário');
      throw error;
    }
  }
}

export default new UsuarioService();
