import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { TipoPerfil } from '@prisma/client';

interface RegisterData {
  email: string;
  senha: string;
  nome: string;
  perfil: TipoPerfil;
}

interface LoginData {
  email: string;
  senha: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    nome: string;
    perfil: TipoPerfil;
    deveAlterarSenha: boolean;
  };
  token: string;
}

class AuthService {
  // Registrar novo usuário
  async register(data: RegisterData): Promise<AuthResponse> {
    const { email, senha, nome, perfil } = data;

    // Verificar se o email já existe
    const usuarioExiste = await prisma.usuario.findUnique({
      where: { email }
    });

    if (usuarioExiste) {
      throw new AppError('Email já cadastrado', 400);
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Criar usuário
    const usuario = await prisma.usuario.create({
      data: {
        email,
        senha: senhaHash,
        nome,
        perfil,
        ativo: true,
        deveAlterarSenha: false
      },
      select: {
        id: true,
        email: true,
        nome: true,
        perfil: true,
        deveAlterarSenha: true
      }
    });

    // Gerar token JWT
    const token = this.generateToken(usuario.id, usuario.email, usuario.perfil, usuario.deveAlterarSenha);

    return {
      user: usuario,
      token
    };
  }

  // Login
  async login(data: LoginData): Promise<AuthResponse> {
    const { email, senha } = data;

    // Buscar usuário
    const usuario = await prisma.usuario.findUnique({
      where: { email }
    });

    if (!usuario) {
      throw new AppError('Email ou senha incorretos', 401);
    }

    // Verificar se o usuário está ativo
    if (!usuario.ativo) {
      throw new AppError('Usuário inativo', 401);
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      throw new AppError('Email ou senha incorretos', 401);
    }

    // Gerar token JWT
    const token = this.generateToken(usuario.id, usuario.email, usuario.perfil, usuario.deveAlterarSenha);

    return {
      user: {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        perfil: usuario.perfil,
        deveAlterarSenha: usuario.deveAlterarSenha
      },
      token
    };
  }

  // Gerar token JWT
  private generateToken(id: string, email: string, perfil: TipoPerfil, deveAlterarSenha: boolean): string {
    const secret = process.env.JWT_SECRET;

   if (!secret) {
     throw new AppError('Configuração de autenticação inválida', 500);
   } 

   // Token expira em 7 dias
   return jwt.sign(
     { id, email, perfil, deveAlterarSenha },
     secret,
     { expiresIn: '7d' }
   );
  }

  // Verificar token
  async verifyToken(token: string) {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new AppError('Configuração de autenticação inválida', 500);
    }

    try {
      const decoded = jwt.verify(token, secret) as {
        id: string;
        email: string;
        perfil: TipoPerfil;
        deveAlterarSenha: boolean;
      };

      // Buscar usuário atualizado
      const usuario = await prisma.usuario.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          nome: true,
          perfil: true,
          ativo: true,
          deveAlterarSenha: true
        }
      });

      if (!usuario || !usuario.ativo) {
        throw new AppError('Usuário não encontrado ou inativo', 401);
      }

      return usuario;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Token inválido', 401);
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Token expirado', 401);
      }
      throw error;
    }
  }

  async getUserProfile(id: string) {
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nome: true,
        perfil: true,
        ativo: true,
        deveAlterarSenha: true,
      },
    });

    if (!usuario) {
      throw new AppError('Usuário não encontrado', 404);
    }

    return usuario;
  }

  async changePassword(id: string, senhaAtual: string, novaSenha: string) {
    const usuario = await prisma.usuario.findUnique({ where: { id } });

    if (!usuario) {
      throw new AppError('Usuário não encontrado', 404);
    }

    const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);

    if (!senhaValida) {
      throw new AppError('Senha atual incorreta', 400);
    }

    const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

    await prisma.usuario.update({
      where: { id },
      data: {
        senha: novaSenhaHash,
        deveAlterarSenha: false,
      },
    });
  }
}

export default new AuthService();
