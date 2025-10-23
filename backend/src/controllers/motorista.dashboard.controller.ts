// backend/src/controllers/motorista.dashboard.controller.ts
// ✅ VERSÃO CORRIGIDA E COMPATÍVEL COM PRISMA

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, addWeeks, format } from 'date-fns';

const prisma = new PrismaClient();

// Definir tipo de nível manualmente (já que não existe enum no Prisma)
type NivelMotorista = 'INICIANTE' | 'BRONZE' | 'PRATA' | 'OURO' | 'ELITE';

/**
 * GET /api/motoristas/dashboard
 * Retorna dados consolidados para o dashboard do motorista
 */
export async function getDashboardMotorista(req: Request, res: Response) {
  try {
    const userId = req.user!.id;

    // ========================================================================
    // 1. BUSCAR MOTORISTA PELO USUÁRIO ID
    // ========================================================================

    const motorista = await prisma.motorista.findFirst({
      where: { usuarioId: userId },
      include: {
        usuario: true
      }
    });

    if (!motorista) {
      return res.status(404).json({
        success: false,
        message: 'Motorista não encontrado para este usuário'
      });
    }

    const motoristaId = motorista.id;

    // ========================================================================
    // 2. CALCULAR PRÓXIMO NÍVEL E PONTOS NECESSÁRIOS
    // ========================================================================

    interface NivelConfig {
      min: number;
      max: number;
      proximo: NivelMotorista;
      pontosProximo: number;
    }

    const niveisConfig: Record<NivelMotorista, NivelConfig> = {
      INICIANTE: { min: 0, max: 49, proximo: 'BRONZE', pontosProximo: 50 },
      BRONZE: { min: 50, max: 69, proximo: 'PRATA', pontosProximo: 70 },
      PRATA: { min: 70, max: 84, proximo: 'OURO', pontosProximo: 85 },
      OURO: { min: 85, max: 94, proximo: 'ELITE', pontosProximo: 95 },
      ELITE: { min: 95, max: 100, proximo: 'ELITE', pontosProximo: 100 }
    };

    const nivelAtual = (motorista.nivel || 'INICIANTE') as NivelMotorista;
    const config = niveisConfig[nivelAtual];

    // ========================================================================
    // 3. DISPONIBILIDADE (SEMANA ATUAL E PRÓXIMA)
    // ========================================================================

    const hoje = new Date();
    const inicioSemanaAtual = startOfWeek(hoje, { weekStartsOn: 0 }); // Domingo
    const fimSemanaAtual = endOfWeek(hoje, { weekStartsOn: 0 }); // Sábado
    const inicioProximaSemana = addWeeks(inicioSemanaAtual, 1);
    const fimProximaSemana = addWeeks(fimSemanaAtual, 1);

    // Disponibilidades da semana atual (somente dias futuros ou hoje)
    const dispSemanaAtual = await prisma.disponibilidade.findMany({
      where: {
        motoristaId,
        data: {
          gte: hoje,
          lte: fimSemanaAtual
        },
        disponivel: true
      }
    });

    // Disponibilidades da próxima semana
    const dispProximaSemana = await prisma.disponibilidade.findMany({
      where: {
        motoristaId,
        data: {
          gte: inicioProximaSemana,
          lte: fimProximaSemana
        },
        disponivel: true
      }
    });

    // Calcular dias restantes na semana atual
    const diasRestantesSemanaAtual = Math.ceil(
      (fimSemanaAtual.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    const semanaAtualPreenchida = dispSemanaAtual.length >= diasRestantesSemanaAtual;
    const proximaSemanaPreenchida = dispProximaSemana.length >= 7;
    const totalDiasDisponiveis = dispSemanaAtual.length + dispProximaSemana.length;
    const totalDiasSemana = diasRestantesSemanaAtual + 7;

    // ========================================================================
    // 4. FATURAMENTO
    // ========================================================================

    const inicioMesAtual = startOfMonth(hoje);
    const fimMesAtual = endOfMonth(hoje);
    const inicioMesAnterior = startOfMonth(new Date(hoje.getFullYear(), hoje.getMonth() - 1));
    const fimMesAnterior = endOfMonth(new Date(hoje.getFullYear(), hoje.getMonth() - 1));

    // ✅ CORRIGIDO: Usar modelo "Rota" (não "rotaAtribuicao")
    // Rotas concluídas mês atual
    const rotasMesAtual = await prisma.rota.findMany({
      where: {
        motoristaId,
        status: 'CONCLUIDA',
        dataRota: {
          gte: inicioMesAtual,
          lte: fimMesAtual
        }
      }
    });

    // Rotas concluídas mês anterior
    const rotasMesAnterior = await prisma.rota.findMany({
      where: {
        motoristaId,
        status: 'CONCLUIDA',
        dataRota: {
          gte: inicioMesAnterior,
          lte: fimMesAnterior
        }
      }
    });

    // ✅ CORRIGIDO: Tipos explícitos
    const faturamentoMesAtual = rotasMesAtual.reduce(
      (sum: number, rota: any) => sum + Number(rota.valorRota || 0),
      0
    );

    const faturamentoMesAnterior = rotasMesAnterior.reduce(
      (sum: number, rota: any) => sum + Number(rota.valorRota || 0),
      0
    );

    // Projeção (baseado na média diária * dias restantes)
    const diasDecorridos = hoje.getDate();
    const diasNoMes = fimMesAtual.getDate();
    const mediaDiaria = faturamentoMesAtual / diasDecorridos;
    const projecaoMes = mediaDiaria * diasNoMes;

    // ========================================================================
    // 5. ROTAS PENDENTES
    // ========================================================================

    const rotasPendentes = await prisma.rota.findMany({
      where: {
        motoristaId,
        status: {
          in: ['ACEITA', 'CONFIRMADA', 'EM_ANDAMENTO']
        },
        dataRota: {
          gte: hoje
        }
      },
      orderBy: [
        { dataRota: 'asc' },
        { horaInicio: 'asc' }
      ],
      take: 1
    });

    const proximaRota = rotasPendentes[0] || null;

    // ========================================================================
    // 6. PERFORMANCE
    // ========================================================================

    // Total de rotas atribuídas (não canceladas)
    const totalRotasAtribuidas = await prisma.rota.count({
      where: {
        motoristaId,
        status: {
          in: ['ACEITA', 'CONFIRMADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'VALIDADA']
        }
      }
    });

    // Total de rotas concluídas
    const totalRotasConcluidas = await prisma.rota.count({
      where: {
        motoristaId,
        status: 'CONCLUIDA'
      }
    });

    const taxaConclusao = totalRotasAtribuidas > 0
      ? Math.round((totalRotasConcluidas / totalRotasAtribuidas) * 100)
      : 0;

    const taxaPontuacao = Math.round(motorista.pontuacao || 0);

    // Avaliação média (simulado - você pode implementar sistema real)
    const avaliacaoMedia = 4.5; // TODO: calcular de avaliações reais

    // ========================================================================
    // 7. MONTAR RESPOSTA
    // ========================================================================

    const dashboardData = {
      motorista: {
        nomeCompleto: motorista.nomeCompleto,
        nivel: nivelAtual,
        pontuacao: Math.round(motorista.pontuacao || 0),
        proximoNivel: config.proximo,
        pontosProximoNivel: config.pontosProximo,
        badge: nivelAtual
      },
      disponibilidade: {
        semanaAtualPreenchida,
        proximaSemanaPreenchida,
        diasDisponiveis: totalDiasDisponiveis,
        totalDiasSemana
      },
      faturamento: {
        mesAtual: faturamentoMesAtual,
        mesAnterior: faturamentoMesAnterior,
        projecaoMes: Math.round(projecaoMes),
        rotasRealizadas: rotasMesAtual.length
      },
      rotasPendentes: {
        quantidade: rotasPendentes.length,
        proximaData: proximaRota ? format(new Date(proximaRota.dataRota), 'dd/MM/yyyy') : null,
        turno: proximaRota?.cicloRota || null
      },
      performance: {
        taxaConclusao,
        taxaPontuacao,
        avaliacaoMedia
      }
    };

    return res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Erro ao buscar dashboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao carregar dados do dashboard',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}
