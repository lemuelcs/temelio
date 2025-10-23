import prisma from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { TipoVeiculo, PropriedadeVeiculo } from '@prisma/client';

interface CriarTabelaPrecoData {
  tipoVeiculo: TipoVeiculo;
  propriedadeVeiculo: PropriedadeVeiculo;
  valorHora: number;
  valorCancelamentoHora: number;
  valorKm: number;
  dataInicioVigencia: Date;
  dataFimVigencia?: Date;
}

class PrecoService {
  // Criar tabela de preços
  async criar(data: CriarTabelaPrecoData) {
    const {
      tipoVeiculo,
      propriedadeVeiculo,
      valorHora,
      valorCancelamentoHora,
      valorKm,
      dataInicioVigencia,
      dataFimVigencia
    } = data;

    // Desativar tabelas anteriores para o mesmo tipo de veículo e propriedade
    await prisma.tabelaPreco.updateMany({
      where: {
        tipoVeiculo,
        propriedadeVeiculo,
        ativo: true
      },
      data: {
        ativo: false,
        dataFimVigencia: new Date()
      }
    });

    // Criar nova tabela
    const tabela = await prisma.tabelaPreco.create({
      data: {
        tipoVeiculo,
        propriedadeVeiculo,
        valorHora,
        valorCancelamento: valorCancelamentoHora,
        valorKm,
        dataInicioVigencia,
        dataFimVigencia,
        ativo: true
      }
    });

    return tabela;
  }

  // Listar tabelas de preços
  async listar(filtros: {
    tipoVeiculo?: TipoVeiculo;
    propriedadeVeiculo?: PropriedadeVeiculo;
    ativo?: boolean;
  } = {}) {
    const where: any = {};

    if (filtros.tipoVeiculo) {
      where.tipoVeiculo = filtros.tipoVeiculo;
    }

    if (filtros.propriedadeVeiculo) {
      where.propriedadeVeiculo = filtros.propriedadeVeiculo;
    }

    if (filtros.ativo !== undefined) {
      where.ativo = filtros.ativo;
    }

    const tabelas = await prisma.tabelaPreco.findMany({
      where,
      orderBy: [
        { tipoVeiculo: 'asc' },
        { propriedadeVeiculo: 'asc' },
        { dataInicioVigencia: 'desc' }
      ]
    });

    return tabelas;
  }

  // Buscar tabela de preços ativa para um tipo de veículo
  async buscarAtiva(tipoVeiculo: TipoVeiculo, propriedadeVeiculo: PropriedadeVeiculo) {
    const tabela = await prisma.tabelaPreco.findFirst({
      where: {
        tipoVeiculo,
        propriedadeVeiculo,
        ativo: true,
        dataInicioVigencia: {
          lte: new Date()
        },
        OR: [
          { dataFimVigencia: null },
          { dataFimVigencia: { gte: new Date() } }
        ]
      }
    });

    if (!tabela) {
      throw new AppError(
        `Tabela de preços não encontrada para ${tipoVeiculo} - ${propriedadeVeiculo}`,
        404
      );
    }

    return tabela;
  }

  // Buscar por ID
  async buscarPorId(id: string) {
    const tabela = await prisma.tabelaPreco.findUnique({
      where: { id }
    });

    if (!tabela) {
      throw new AppError('Tabela de preços não encontrada', 404);
    }

    return tabela;
  }

  // Atualizar tabela de preços
  async atualizar(id: string, data: Partial<CriarTabelaPrecoData>) {
    await this.buscarPorId(id);

    const tabelaAtualizada = await prisma.tabelaPreco.update({
      where: { id },
      data
    });

    return tabelaAtualizada;
  }

  // Desativar tabela
  async desativar(id: string) {
    await this.buscarPorId(id);

    const tabela = await prisma.tabelaPreco.update({
      where: { id },
      data: {
        ativo: false,
        dataFimVigencia: new Date()
      }
    });

    return tabela;
  }

  // Criar tabelas padrão (seed inicial)
  async criarTabelasPadrao() {
    const dataInicio = new Date();

    const tabelasPadrao = [
      // Veículos Próprios
      {
        tipoVeiculo: TipoVeiculo.MOTOCICLETA,
        propriedadeVeiculo: PropriedadeVeiculo.PROPRIO,
        valorHora: 27.00,
        valorCancelamentoHora: 6.75,
        valorKm: 0.64
      },
      {
        tipoVeiculo: TipoVeiculo.CARRO_PASSEIO,
        propriedadeVeiculo: PropriedadeVeiculo.PROPRIO,
        valorHora: 37.00,
        valorCancelamentoHora: 9.25,
        valorKm: 0.64
      },
      {
        tipoVeiculo: TipoVeiculo.CARGO_VAN,
        propriedadeVeiculo: PropriedadeVeiculo.PROPRIO,
        valorHora: 40.00,
        valorCancelamentoHora: 10.00,
        valorKm: 0.64
      },
      {
        tipoVeiculo: TipoVeiculo.LARGE_VAN,
        propriedadeVeiculo: PropriedadeVeiculo.PROPRIO,
        valorHora: 52.50,
        valorCancelamentoHora: 13.25,
        valorKm: 0.64
      },
      // Veículos da Transportadora
      {
        tipoVeiculo: TipoVeiculo.CARGO_VAN,
        propriedadeVeiculo: PropriedadeVeiculo.TRANSPORTADORA,
        valorHora: 25.00,
        valorCancelamentoHora: 6.25,
        valorKm: 0.64
      },
      {
        tipoVeiculo: TipoVeiculo.LARGE_VAN,
        propriedadeVeiculo: PropriedadeVeiculo.TRANSPORTADORA,
        valorHora: 25.00,
        valorCancelamentoHora: 6.25,
        valorKm: 0.64
      }
    ];

    const resultados = [];

    for (const tabela of tabelasPadrao) {
      const criada = await this.criar({
        ...tabela,
        dataInicioVigencia: dataInicio
      });
      resultados.push(criada);
    }

    return resultados;
  }
}

export default new PrecoService();
