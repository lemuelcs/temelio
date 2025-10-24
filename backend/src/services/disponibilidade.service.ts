// backend/src/services/disponibilidade.service.ts
// ✅ CORRIGIDO: Usa CicloRota em vez de TurnoDisponibilidade

import prisma from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { CicloRota, TipoVeiculo } from '@prisma/client';

interface DisponibilidadeInput {
  data: Date;
  ciclo: CicloRota;
  disponivel: boolean;
}

interface CadastrarDisponibilidadeInput {
  motoristaId: string;
  disponibilidades: DisponibilidadeInput[];
  alteradoPor?: string;
  motivoAlteracao?: string;
}

interface FiltrosDisponibilidade {
  dataInicio?: Date;
  dataFim?: Date;
  disponivel?: boolean;
}

interface FiltrosMotoristasDisponiveis {
  tipoVeiculo?: TipoVeiculo;
  cidade?: string;
}

class DisponibilidadeService {
  /**
   * Cadastrar ou atualizar disponibilidades em lote (batch)
   * Usado pelo motorista para informar semana corrente + próxima semana (21 ciclos)
   */
  async cadastrar(input: CadastrarDisponibilidadeInput) {
    const { motoristaId, disponibilidades, alteradoPor, motivoAlteracao } = input;

    // Verificar se motorista existe
    const motorista = await prisma.motorista.findUnique({
      where: { id: motoristaId }
    });

    if (!motorista) {
      throw new AppError('Motorista não encontrado', 404);
    }

    const resultados = [];

    // Processar cada disponibilidade
    for (const disp of disponibilidades) {
      // Verificar se já existe disponibilidade para esta data/ciclo
      const existente = await prisma.disponibilidade.findUnique({
        where: {
          motoristaId_data_ciclo: {
            motoristaId,
            data: disp.data,
            ciclo: disp.ciclo
          }
        }
      });

      if (existente) {
        // Se mudou o valor, registrar no histórico
        if (existente.disponivel !== disp.disponivel) {
          await prisma.historicoDisponibilidade.create({
            data: {
              motoristaId,
              data: disp.data,
              ciclo: disp.ciclo,
              disponivelAntigo: existente.disponivel,
              disponivelNovo: disp.disponivel,
              alteradoPor,
              motivoAlteracao
            }
          });
        }

        // Atualizar
        const atualizada = await prisma.disponibilidade.update({
          where: { id: existente.id },
          data: { disponivel: disp.disponivel }
        });

        resultados.push(atualizada);
      } else {
        // Criar nova
        const nova = await prisma.disponibilidade.create({
          data: {
            motoristaId,
            data: disp.data,
            ciclo: disp.ciclo,
            disponivel: disp.disponivel
          }
        });

        // Registrar criação no histórico
        await prisma.historicoDisponibilidade.create({
          data: {
            motoristaId,
            data: disp.data,
            ciclo: disp.ciclo,
            disponivelAntigo: false, // Não existia antes
            disponivelNovo: disp.disponivel,
            alteradoPor,
            motivoAlteracao: motivoAlteracao || 'Criação inicial'
          }
        });

        resultados.push(nova);
      }
    }

    return resultados;
  }

  /**
   * Buscar disponibilidades de um motorista
   */
  async buscarPorMotorista(motoristaId: string, filtros: FiltrosDisponibilidade = {}) {
    const where: any = { motoristaId };

    if (filtros.dataInicio || filtros.dataFim) {
      where.data = {};
      if (filtros.dataInicio) {
        where.data.gte = filtros.dataInicio;
      }
      if (filtros.dataFim) {
        where.data.lte = filtros.dataFim;
      }
    }

    if (filtros.disponivel !== undefined) {
      where.disponivel = filtros.disponivel;
    }

    const disponibilidades = await prisma.disponibilidade.findMany({
      where,
      orderBy: [
        { data: 'asc' },
        { ciclo: 'asc' }
      ]
    });

    return disponibilidades;
  }

  /**
   * Buscar disponibilidades da semana corrente e próxima semana
   * Retorna formato estruturado para o calendário
   */
  async buscarSemanasAtual(motoristaId: string) {
    // Calcular semana corrente (domingo a sábado)
    const hoje = new Date();
    const diaSemana = hoje.getDay(); // 0 = domingo
    
    const inicioSemanaCorrente = new Date(hoje);
    inicioSemanaCorrente.setDate(hoje.getDate() - diaSemana);
    inicioSemanaCorrente.setHours(0, 0, 0, 0);
    
    const fimSemanaCorrente = new Date(inicioSemanaCorrente);
    fimSemanaCorrente.setDate(inicioSemanaCorrente.getDate() + 6);
    fimSemanaCorrente.setHours(23, 59, 59, 999);
    
    const inicioProximaSemana = new Date(fimSemanaCorrente);
    inicioProximaSemana.setDate(fimSemanaCorrente.getDate() + 1);
    inicioProximaSemana.setHours(0, 0, 0, 0);
    
    const fimProximaSemana = new Date(inicioProximaSemana);
    fimProximaSemana.setDate(inicioProximaSemana.getDate() + 6);
    fimProximaSemana.setHours(23, 59, 59, 999);

    // Buscar disponibilidades das duas semanas
    const disponibilidades = await prisma.disponibilidade.findMany({
      where: {
        motoristaId,
        data: {
          gte: inicioSemanaCorrente,
          lte: fimProximaSemana
        }
      },
      orderBy: [
        { data: 'asc' },
        { ciclo: 'asc' }
      ]
    });

    // Agrupar por semana
    const semanaCorrente = disponibilidades.filter(d => 
      d.data >= inicioSemanaCorrente && d.data <= fimSemanaCorrente
    );

    const proximaSemana = disponibilidades.filter(d => 
      d.data >= inicioProximaSemana && d.data <= fimProximaSemana
    );

    return {
      semanaCorrente: {
        inicio: inicioSemanaCorrente,
        fim: fimSemanaCorrente,
        disponibilidades: semanaCorrente
      },
      proximaSemana: {
        inicio: inicioProximaSemana,
        fim: fimProximaSemana,
        disponibilidades: proximaSemana
      }
    };
  }

  /**
   * Buscar histórico de alterações de disponibilidade
   */
  async buscarHistorico(motoristaId: string, dataInicio?: Date, dataFim?: Date) {
    const where: any = { motoristaId };

    if (dataInicio || dataFim) {
      where.data = {};
      if (dataInicio) where.data.gte = dataInicio;
      if (dataFim) where.data.lte = dataFim;
    }

    const historico = await prisma.historicoDisponibilidade.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100 // Limitar a 100 registros
    });

    return historico;
  }

  /**
   * Atualizar uma disponibilidade específica
   */
  async atualizar(
    motoristaId: string,
    disponibilidadeId: string,
    dados: { disponivel: boolean },
    alteradoPor?: string
  ) {
    // Verificar se a disponibilidade existe e pertence ao motorista
    const existente = await prisma.disponibilidade.findFirst({
      where: {
        id: disponibilidadeId,
        motoristaId
      }
    });

    if (!existente) {
      throw new AppError('Disponibilidade não encontrada', 404);
    }

    // Registrar no histórico se mudou
    if (existente.disponivel !== dados.disponivel) {
      await prisma.historicoDisponibilidade.create({
        data: {
          motoristaId,
          data: existente.data,
          ciclo: existente.ciclo,
          disponivelAntigo: existente.disponivel,
          disponivelNovo: dados.disponivel,
          alteradoPor
        }
      });
    }

    // Atualizar
    const atualizada = await prisma.disponibilidade.update({
      where: { id: disponibilidadeId },
      data: { disponivel: dados.disponivel }
    });

    return atualizada;
  }

  /**
   * Excluir uma disponibilidade
   */
  async excluir(motoristaId: string, disponibilidadeId: string) {
    // Verificar se existe e pertence ao motorista
    const existente = await prisma.disponibilidade.findFirst({
      where: {
        id: disponibilidadeId,
        motoristaId
      }
    });

    if (!existente) {
      throw new AppError('Disponibilidade não encontrada', 404);
    }

    // Excluir
    await prisma.disponibilidade.delete({
      where: { id: disponibilidadeId }
    });

    return {
      message: 'Disponibilidade excluída com sucesso'
    };
  }

  /**
   * Buscar motoristas disponíveis para uma data/ciclo específico
   * Usado pela gestão para alocar rotas
   */
  async buscarMotoristasDisponiveis(
    data: Date,
    ciclo: CicloRota,
    filtros: FiltrosMotoristasDisponiveis = {}
  ) {
    const where: any = {
      disponibilidade: {
        some: {
          data,
          ciclo,
          disponivel: true
        }
      },
      status: 'ATIVO'
    };

    if (filtros.tipoVeiculo) {
      where.tipoVeiculo = filtros.tipoVeiculo;
    }

    if (filtros.cidade) {
      where.cidade = filtros.cidade;
    }

    const motoristas = await prisma.motorista.findMany({
      where,
      orderBy: { pontuacao: 'desc' }, // Ordenar por gamificação
      include: {
        usuario: {
          select: {
            email: true
          }
        }
      }
    });

    return motoristas;
  }

  /**
   * Buscar resumo de disponibilidades por tipo de veículo
   * Usado pela gestão para visualizar disponibilidade consolidada
   */
  async buscarResumo(dataInicio: Date, dataFim: Date) {
    // Buscar todas as disponibilidades do período
    const disponibilidades = await prisma.disponibilidade.findMany({
      where: {
        data: {
          gte: dataInicio,
          lte: dataFim
        },
        disponivel: true
      },
      include: {
        motorista: {
          select: {
            tipoVeiculo: true
          }
        }
      }
    });

    // Agrupar por data, ciclo e tipo de veículo
    const resumo: any = {};

    disponibilidades.forEach(disp => {
      const dataStr = disp.data.toISOString().split('T')[0];
      const tipoVeiculo = disp.motorista.tipoVeiculo;
      const ciclo = disp.ciclo;

      if (!resumo[dataStr]) {
        resumo[dataStr] = {};
      }

      if (!resumo[dataStr][tipoVeiculo]) {
        resumo[dataStr][tipoVeiculo] = {
          CICLO_1: 0,
          CICLO_2: 0,
          SAME_DAY: 0
        };
      }

      resumo[dataStr][tipoVeiculo][ciclo]++;
    });

    return resumo;
  }

  /**
   * Buscar disponibilidades no intervalo informado (gestão)
   */
  async buscarIntervalo(
    dataInicio: Date,
    dataFim: Date,
    apenasDisponiveis: boolean
  ) {
    const where: any = {
      data: {
        gte: dataInicio,
        lte: dataFim
      }
    };

    if (apenasDisponiveis) {
      where.disponivel = true;
    }

    const disponibilidades = await prisma.disponibilidade.findMany({
      where,
      select: {
        id: true,
        motoristaId: true,
        data: true,
        ciclo: true,
        disponivel: true
      },
      orderBy: [
        { data: 'asc' },
        { ciclo: 'asc' },
        { motoristaId: 'asc' }
      ]
    });

    return disponibilidades;
  }
}

export default new DisponibilidadeService();
