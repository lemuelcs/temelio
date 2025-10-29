import prisma from '../config/database';
import { AppError } from '../middlewares/error.middleware';

interface CriarLocalData {
  codigo: string;
  nome: string;
  endereco: string;
  cep: string; // ← ADICIONAR
  latitude: number;
  longitude: number;
  cidade: string;
  uf: string;
}

class LocalService {
  // Criar local
  async criar(data: CriarLocalData) {
    const { codigo, nome, endereco, cep, latitude, longitude, cidade, uf } = data;

    // Verificar se o código já existe
    const codigoExiste = await prisma.local.findUnique({
      where: { codigo }
    });

    if (codigoExiste) {
      throw new AppError('Código de local já cadastrado', 400);
    }

    const local = await prisma.local.create({
      data: {
        codigo,
        nome,
        endereco,
        cep, 
        latitude,
        longitude,
        cidade,
        uf: uf.toUpperCase(),
        ativo: true
      }
    });

    return local;
  }

  // Listar locais
  async listar(filtros: { ativo?: boolean; cidade?: string; uf?: string } = {}) {
    const where: any = {};

    if (filtros.ativo !== undefined) {
      where.ativo = filtros.ativo;
    }

    if (filtros.cidade) {
      where.cidade = filtros.cidade;
    }

    if (filtros.uf) {
      where.uf = filtros.uf.toUpperCase();
    }

    const locais = await prisma.local.findMany({
      where,
      orderBy: {
        nome: 'asc'
      }
    });

    return locais;
  }

  // Buscar por ID
  async buscarPorId(id: string) {
    const local = await prisma.local.findUnique({
      where: { id }
    });

    if (!local) {
      throw new AppError('Local não encontrado', 404);
    }

    return local;
  }

  // Atualizar local
  async atualizar(id: string, data: Partial<CriarLocalData>) {
    await this.buscarPorId(id);

    // Preparar dados para atualização, evitando undefined explícito
    const dadosAtualizacao: any = { ...data };

    // Converter uf para maiúsculas se presente
    if (dadosAtualizacao.uf) {
      dadosAtualizacao.uf = dadosAtualizacao.uf.toUpperCase();
    }

    const localAtualizado = await prisma.local.update({
      where: { id },
      data: dadosAtualizacao
    });

    return localAtualizado;
  }

  // Ativar/Desativar local
  async mudarStatus(id: string, ativo: boolean) {
    await this.buscarPorId(id);

    const local = await prisma.local.update({
      where: { id },
      data: { ativo }
    });

    return local;
  }
}

export default new LocalService();