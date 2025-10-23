import prisma from '../config/database';
import { AppError } from '../middlewares/error.middleware';

interface PeriodoFiltro {
  dataInicio: Date;
  dataFim: Date;
}

interface MetricasEntrega {
  totalPacotes: number;
  pacotesEntregues: number;
  pacotesRetornados: number;
  pacotesPNOV: number;
  pacotesDNR: number;
  taxaDRC: number;
  taxaRTS: number;
}

class KPIService {
  // Dashboard geral com todos os KPIs
  async dashboardGeral(periodo: PeriodoFiltro) {
    const [
      metricas,
      faturamento,
      rotas,
      ofertas,
      motoristas,
      alertas
    ] = await Promise.all([
      this.metricasEntregas(periodo),
      this.faturamentoGeral(periodo),
      this.estatisticasRotas(periodo),
      this.taxaAceiteOfertas(periodo),
      this.motoristasAtivos(),
      this.resumoAlertas()
    ]);

    return {
      periodo: {
        inicio: periodo.dataInicio,
        fim: periodo.dataFim
      },
      metricas,
      faturamento,
      rotas,
      ofertas,
      motoristas,
      alertas
    };
  }

  // Métricas de entregas (DRC, RTS, PNOV, DNR)
  async metricasEntregas(periodo: PeriodoFiltro): Promise<MetricasEntrega> {
    const metricas = await prisma.metricaEntrega.aggregate({
      where: {
        data: {
          gte: periodo.dataInicio,
          lte: periodo.dataFim
        }
      },
      _sum: {
        totalPacotes: true,
        pacotesEntregues: true,
        pacotesRetornados: true,
        pacotesPNOV: true,
        pacotesDNR: true
      }
    });

    const totalPacotes = metricas._sum.totalPacotes || 0;
    const pacotesEntregues = metricas._sum.pacotesEntregues || 0;
    const pacotesRetornados = metricas._sum.pacotesRetornados || 0;
    const pacotesPNOV = metricas._sum.pacotesPNOV || 0;
    const pacotesDNR = metricas._sum.pacotesDNR || 0;

    const taxaDRC = totalPacotes > 0 
      ? (pacotesEntregues / totalPacotes) * 100 
      : 0;

    const taxaRTS = totalPacotes > 0 
      ? (pacotesRetornados / totalPacotes) * 100 
      : 0;

    return {
      totalPacotes,
      pacotesEntregues,
      pacotesRetornados,
      pacotesPNOV,
      pacotesDNR,
      taxaDRC: Number(taxaDRC.toFixed(2)),
      taxaRTS: Number(taxaRTS.toFixed(2))
    };
  }

  // OTD - On Time Dispatch
  async metricasOTD(periodo: PeriodoFiltro) {
    const metricas = await prisma.metricaEntrega.findMany({
      where: {
        data: {
          gte: periodo.dataInicio,
          lte: periodo.dataFim
        }
      },
      select: {
        atrasouCarregamento: true,
        minutosAtraso: true
      }
    });

    const totalEntregas = metricas.length;
    const entregasAtrasadas = metricas.filter(m => m.atrasouCarregamento).length;
    const entregasPontuais = totalEntregas - entregasAtrasadas;

    const taxaOTD = totalEntregas > 0 
      ? (entregasPontuais / totalEntregas) * 100 
      : 100;

    const minutosAtrasoTotal = metricas.reduce((acc, m) => acc + (m.minutosAtraso || 0), 0);
    const mediaMinutosAtraso = entregasAtrasadas > 0 
      ? minutosAtrasoTotal / entregasAtrasadas 
      : 0;

    return {
      totalEntregas,
      entregasPontuais,
      entregasAtrasadas,
      taxaOTD: Number(taxaOTD.toFixed(2)),
      mediaMinutosAtraso: Number(mediaMinutosAtraso.toFixed(2))
    };
  }

  // Faturamento geral
  async faturamentoGeral(periodo: PeriodoFiltro) {
    // Filtrar por período baseado em mês/ano
    const mesFim = periodo.dataFim.getMonth() + 1;
    const anoFim = periodo.dataFim.getFullYear();

    const faturamentos = await prisma.faturamento.aggregate({
      where: {
        ano: {
          lte: anoFim
        }
      },
      _sum: {
        valorRotas: true,
        valorBonus: true,
        valorAjudaCombustivel: true,
        valorCancelamentos: true,
        valorTotal: true
      }
    });

    return {
      valorRotas: Number(faturamentos._sum.valorRotas || 0),
      valorBonus: Number(faturamentos._sum.valorBonus || 0),
      valorAjudaCombustivel: Number(faturamentos._sum.valorAjudaCombustivel || 0),
      valorCancelamentos: Number(faturamentos._sum.valorCancelamentos || 0),
      valorTotal: Number(faturamentos._sum.valorTotal || 0)
    };
  }

  // Faturamento por motorista
  async faturamentoPorMotorista(periodo: PeriodoFiltro, motoristaId?: string) {
    const where: any = {};

    if (motoristaId) {
      where.motoristaId = motoristaId;
    }

    const faturamentos = await prisma.faturamento.findMany({
      where,
      include: {
        motorista: {
          select: {
            id: true,
            transporterId: true,
            nomeCompleto: true,
            tipoVeiculo: true
          }
        }
      },
      orderBy: {
        valorTotal: 'desc'
      }
    });

    return faturamentos.map(f => ({
      motorista: f.motorista,
      periodo: `${f.quinzena}ª quinzena - ${f.mes}/${f.ano}`,
      valorRotas: Number(f.valorRotas),
      valorBonus: Number(f.valorBonus),
      valorAjudaCombustivel: Number(f.valorAjudaCombustivel),
      valorCancelamentos: Number(f.valorCancelamentos),
      valorTotal: Number(f.valorTotal),
      pago: f.pago
    }));
  }

  // Estatísticas de rotas
  async estatisticasRotas(periodo: PeriodoFiltro) {
    const rotas = await prisma.rota.findMany({
      where: {
        dataRota: {
          gte: periodo.dataInicio,
          lte: periodo.dataFim
        }
      }
    });

    const totalRotas = rotas.length;
    const rotasPorStatus = rotas.reduce((acc, rota) => {
      acc[rota.status] = (acc[rota.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const rotasPorTipo = rotas.reduce((acc, rota) => {
      acc[rota.tipoRota] = (acc[rota.tipoRota] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const valorTotalRotas = rotas.reduce((acc, rota) => acc + Number(rota.valorTotalRota), 0);

    return {
      totalRotas,
      rotasPorStatus,
      rotasPorTipo,
      valorTotalRotas: Number(valorTotalRotas.toFixed(2))
    };
  }

  // Taxa de aceite/recusa de ofertas
  async taxaAceiteOfertas(periodo: PeriodoFiltro) {
    const ofertas = await prisma.ofertaRota.findMany({
      where: {
        dataEnvio: {
          gte: periodo.dataInicio,
          lte: periodo.dataFim
        }
      }
    });

    const totalOfertas = ofertas.length;
    const ofertasAceitas = ofertas.filter(o => o.status === 'ACEITA').length;
    const ofertasRecusadas = ofertas.filter(o => o.status === 'RECUSADA').length;
    const ofertasPendentes = ofertas.filter(o => o.status === 'PENDENTE').length;
    const ofertasExpiradas = ofertas.filter(o => o.status === 'EXPIRADA').length;

    const taxaAceite = totalOfertas > 0 
      ? (ofertasAceitas / totalOfertas) * 100 
      : 0;

    const taxaRecusa = totalOfertas > 0 
      ? (ofertasRecusadas / totalOfertas) * 100 
      : 0;

    return {
      totalOfertas,
      ofertasAceitas,
      ofertasRecusadas,
      ofertasPendentes,
      ofertasExpiradas,
      taxaAceite: Number(taxaAceite.toFixed(2)),
      taxaRecusa: Number(taxaRecusa.toFixed(2))
    };
  }

  // Performance por motorista
  async performanceMotorista(motoristaId: string, periodo: PeriodoFiltro) {
    // Métricas de entregas
    const metricasEntregas = await prisma.metricaEntrega.aggregate({
      where: {
        motoristaId,
        data: {
          gte: periodo.dataInicio,
          lte: periodo.dataFim
        }
      },
      _sum: {
        totalPacotes: true,
        pacotesEntregues: true,
        pacotesRetornados: true,
        pacotesPNOV: true,
        pacotesDNR: true
      },
      _avg: {
        taxaDRC: true
      }
    });

    // Rotas concluídas
    const rotasConcluidas = await prisma.ofertaRota.count({
      where: {
        motoristaId,
        status: 'ACEITA',
        dataResposta: {
          gte: periodo.dataInicio,
          lte: periodo.dataFim
        }
      }
    });

    // Taxa de aceite
    const ofertas = await prisma.ofertaRota.findMany({
      where: {
        motoristaId,
        dataEnvio: {
          gte: periodo.dataInicio,
          lte: periodo.dataFim
        }
      }
    });

    const totalOfertas = ofertas.length;
    const aceitas = ofertas.filter(o => o.status === 'ACEITA').length;
    const taxaAceite = totalOfertas > 0 ? (aceitas / totalOfertas) * 100 : 0;

    // Faturamento
    const faturamento = await this.faturamentoPorMotorista(periodo, motoristaId);
    const totalFaturamento = faturamento.reduce((acc, f) => acc + f.valorTotal, 0);

    // OTD do motorista
    const otd = await prisma.metricaEntrega.findMany({
      where: {
        motoristaId,
        data: {
          gte: periodo.dataInicio,
          lte: periodo.dataFim
        }
      },
      select: {
        atrasouCarregamento: true
      }
    });

    const totalCarregamentos = otd.length;
    const atrasados = otd.filter(o => o.atrasouCarregamento).length;
    const taxaOTD = totalCarregamentos > 0 
      ? ((totalCarregamentos - atrasados) / totalCarregamentos) * 100 
      : 100;

    return {
      metricas: {
        totalPacotes: metricasEntregas._sum.totalPacotes || 0,
        pacotesEntregues: metricasEntregas._sum.pacotesEntregues || 0,
        pacotesRetornados: metricasEntregas._sum.pacotesRetornados || 0,
        pacotesPNOV: metricasEntregas._sum.pacotesPNOV || 0,
        pacotesDNR: metricasEntregas._sum.pacotesDNR || 0,
        taxaDRCMedia: Number((metricasEntregas._avg.taxaDRC || 0).toFixed(2))
      },
      rotas: {
        concluidas: rotasConcluidas,
        taxaAceite: Number(taxaAceite.toFixed(2))
      },
      faturamento: {
        total: Number(totalFaturamento.toFixed(2)),
        detalhes: faturamento
      },
      otd: {
        totalCarregamentos,
        pontual: totalCarregamentos - atrasados,
        atrasado: atrasados,
        taxaOTD: Number(taxaOTD.toFixed(2))
      }
    };
  }

  // Motoristas ativos
  async motoristasAtivos() {
    const total = await prisma.motorista.count({
      where: { status: 'ATIVO' }
    });

    const porTipoVeiculo = await prisma.motorista.groupBy({
      by: ['tipoVeiculo'],
      where: { status: 'ATIVO' },
      _count: true
    });

    const porPropriedade = await prisma.motorista.groupBy({
      by: ['propriedadeVeiculo'],
      where: { status: 'ATIVO' },
      _count: true
    });

    return {
      total,
      porTipoVeiculo: porTipoVeiculo.map(p => ({
        tipo: p.tipoVeiculo,
        total: p._count
      })),
      porPropriedade: porPropriedade.map(p => ({
        propriedade: p.propriedadeVeiculo,
        total: p._count
      }))
    };
  }

  // Resumo de alertas
  async resumoAlertas() {
    const total = await prisma.alerta.count({
      where: { resolvido: false }
    });

    const porSeveridade = await prisma.alerta.groupBy({
      by: ['severidade'],
      where: { resolvido: false },
      _count: true
    });

    return {
      total,
      porSeveridade: porSeveridade.map(p => ({
        severidade: p.severidade,
        total: p._count
      }))
    };
  }

  // Top motoristas (ranking)
  async topMotoristas(periodo: PeriodoFiltro, limite: number = 10) {
    const motoristas = await prisma.motorista.findMany({
      where: { status: 'ATIVO' },
      select: {
        id: true,
        transporterId: true,
        nomeCompleto: true,
        pontuacao: true,
        tipoVeiculo: true
      },
      orderBy: {
        pontuacao: 'desc'
      },
      take: limite
    });

    // Buscar performance de cada um
    const motoristaComPerformance = await Promise.all(
      motoristas.map(async (m) => {
        const performance = await this.performanceMotorista(m.id, periodo);
        return {
          ...m,
          performance
        };
      })
    );

    return motoristaComPerformance;
  }
}

export default new KPIService();