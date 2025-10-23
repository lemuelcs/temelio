import prisma from '../config/database';
import { TipoServico, TipoPropriedade } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';

interface CriarTabelaPrecoDTO {
  tipoServico: TipoServico;
  propriedade: TipoPropriedade;
  estacao: string;
  valorHora: number;
  valorCancelamento: number;
  valorKm: number;
  bonusWeekend: number;
  valorHoraDSP?: number;
  valorCancelamentoDSP?: number;
  bonusWeekendDSP?: number;
  valorPorPacote?: number;
  dataInicioVigencia?: Date;
  usuarioId: string;
}

interface AtualizarTabelaPrecoDTO {
  valorHora?: number;
  valorCancelamento?: number;
  valorKm?: number;
  bonusWeekend?: number;
  valorHoraDSP?: number;
  valorCancelamentoDSP?: number;
  bonusWeekendDSP?: number;
  valorPorPacote?: number;
  dataFimVigencia?: Date;
}

class TabelaPrecosService {
  // Listar todas as tabelas de preços
  async listar(filtros?: {
    estacao?: string;
    tipoServico?: TipoServico;
    propriedade?: TipoPropriedade;
    ativo?: boolean;
  }) {
    const where: any = {};

    if (filtros?.estacao) {
      where.estacao = filtros.estacao;
    }

    if (filtros?.tipoServico) {
      where.tipoServico = filtros.tipoServico;
    }

    if (filtros?.propriedade) {
      where.propriedade = filtros.propriedade;
    }

    if (filtros?.ativo !== undefined) {
      where.ativo = filtros.ativo;
    }

    const tabelas = await prisma.tabelaPreco.findMany({
      where,
      orderBy: [
        { estacao: 'asc' },
        { tipoServico: 'asc' },
        { versao: 'desc' }
      ]
    });

    return tabelas;
  }

  // Buscar tabela vigente (ativa) para um tipo específico
  async buscarVigente(
    estacao: string,
    tipoServico: TipoServico,
    propriedade: TipoPropriedade
  ) {
    const tabela = await prisma.tabelaPreco.findFirst({
      where: {
        estacao,
        tipoServico,
        propriedade,
        ativo: true,
        dataInicioVigencia: {
          lte: new Date()
        },
        OR: [
          { dataFimVigencia: null },
          { dataFimVigencia: { gte: new Date() } }
        ]
      },
      orderBy: { versao: 'desc' }
    });

    if (!tabela) {
      throw new AppError(
        `Tabela de preços não encontrada para ${estacao} - ${tipoServico} - ${propriedade}`,
        404
      );
    }

    return tabela;
  }

  // Buscar por ID
  async buscarPorId(id: string) {
    const tabela = await prisma.tabelaPreco.findUnique({
      where: { id },
      include: {
        rotas: {
          select: {
            id: true,
            codigoRota: true,
            dataRota: true,
            status: true
          },
          take: 5,
          orderBy: { dataRota: 'desc' }
        }
      }
    });

    if (!tabela) {
      throw new AppError('Tabela de preços não encontrada', 404);
    }

    return tabela;
  }

  // Criar nova tabela de preços
  async criar(dados: CriarTabelaPrecoDTO) {
    // Verificar se já existe tabela ativa para este tipo
    const tabelaExistente = await prisma.tabelaPreco.findFirst({
      where: {
        estacao: dados.estacao,
        tipoServico: dados.tipoServico,
        propriedade: dados.propriedade,
        ativo: true
      }
    });

    let novaVersao = 1;

    // Se existe tabela ativa, desativar e incrementar versão
    if (tabelaExistente) {
      await prisma.tabelaPreco.update({
        where: { id: tabelaExistente.id },
        data: {
          ativo: false,
          dataFimVigencia: dados.dataInicioVigencia || new Date()
        }
      });

      novaVersao = tabelaExistente.versao + 1;
    }

    // Criar nova tabela
    const novaTabela = await prisma.tabelaPreco.create({
      data: {
        versao: novaVersao,
        estacao: dados.estacao,
        tipoServico: dados.tipoServico,
        propriedade: dados.propriedade,
        valorHora: dados.valorHora,
        valorCancelamento: dados.valorCancelamento,
        valorKm: dados.valorKm,
        bonusWeekend: dados.bonusWeekend,
        valorHoraDSP: dados.valorHoraDSP,
        valorCancelamentoDSP: dados.valorCancelamentoDSP,
        bonusWeekendDSP: dados.bonusWeekendDSP,
        valorPorPacote: dados.valorPorPacote,
        dataInicioVigencia: dados.dataInicioVigencia || new Date(),
        ativo: true,
        criadoPor: dados.usuarioId
      }
    });

    return novaTabela;
  }

  // Atualizar tabela de preços (cria nova versão)
  async atualizar(id: string, dados: AtualizarTabelaPrecoDTO, usuarioId: string) {
    const tabelaAtual = await this.buscarPorId(id);

    if (!tabelaAtual.ativo) {
      throw new AppError('Não é possível atualizar uma tabela de preços inativa', 400);
    }

    // Verificar se há rotas usando esta tabela
    const rotasVinculadas = await prisma.rota.count({
      where: {
        tabelaPrecosId: id,
        status: {
          in: ['DISPONIVEL', 'OFERTADA', 'ACEITA', 'CONFIRMADA', 'EM_ANDAMENTO']
        }
      }
    });

    if (rotasVinculadas > 0) {
      throw new AppError(
        `Não é possível atualizar esta tabela pois existem ${rotasVinculadas} rotas ativas vinculadas a ela. Crie uma nova versão.`,
        400
      );
    }

    // Atualizar tabela
    const tabelaAtualizada = await prisma.tabelaPreco.update({
      where: { id },
      data: {
        ...dados,
        updatedAt: new Date()
      }
    });

    return tabelaAtualizada;
  }

  // Desativar tabela de preços
  async desativar(id: string) {
    const tabela = await this.buscarPorId(id);

    if (!tabela.ativo) {
      throw new AppError('Esta tabela de preços já está inativa', 400);
    }

    // Verificar rotas ativas
    const rotasAtivas = await prisma.rota.count({
      where: {
        tabelaPrecosId: id,
        status: {
          in: ['DISPONIVEL', 'OFERTADA', 'ACEITA', 'CONFIRMADA', 'EM_ANDAMENTO']
        }
      }
    });

    if (rotasAtivas > 0) {
      throw new AppError(
        `Não é possível desativar esta tabela pois existem ${rotasAtivas} rotas ativas vinculadas`,
        400
      );
    }

    const tabelaDesativada = await prisma.tabelaPreco.update({
      where: { id },
      data: {
        ativo: false,
        dataFimVigencia: new Date()
      }
    });

    return tabelaDesativada;
  }

  // Deletar tabela de preços (soft delete - apenas se não tiver rotas)
  async deletar(id: string) {
    const tabela = await this.buscarPorId(id);

    // Verificar se tem rotas vinculadas
    const rotasVinculadas = await prisma.rota.count({
      where: { tabelaPrecosId: id }
    });

    if (rotasVinculadas > 0) {
      throw new AppError(
        `Não é possível deletar esta tabela pois existem ${rotasVinculadas} rotas vinculadas. Use desativar ao invés de deletar.`,
        400
      );
    }

    // Deletar permanentemente apenas se não houver rotas
    await prisma.tabelaPreco.delete({
      where: { id }
    });

    return { message: 'Tabela de preços deletada com sucesso' };
  }

  // Listar histórico de versões
  async listarHistorico(
    estacao: string,
    tipoServico: TipoServico,
    propriedade: TipoPropriedade
  ) {
    const historico = await prisma.tabelaPreco.findMany({
      where: {
        estacao,
        tipoServico,
        propriedade
      },
      orderBy: { versao: 'desc' }
    });

    return historico;
  }
}

export default new TabelaPrecosService();