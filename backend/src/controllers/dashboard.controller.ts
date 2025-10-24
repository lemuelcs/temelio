// backend/src/controllers/dashboard.controller.ts
import { Request, Response } from 'express';
import prisma from '../config/database';
import logger from '../lib/logger';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Estatísticas de Motoristas
    const [
      totalMotoristas,
      motoristasAtivos,
      motoristasInativos,
      motoristasOnboarding
    ] = await Promise.all([
      prisma.motorista.count(),
      prisma.motorista.count({ where: { status: 'ATIVO' } }),
      prisma.motorista.count({ where: { status: 'INATIVO' } }),
      prisma.motorista.count({ where: { status: 'ONBOARDING' } })
    ]);

    // Estatísticas de Rotas
    const [
      totalRotas,
      rotasCriadas,
      rotasOfertadas,
      rotasAceitas,
      rotasRecusadas,
      rotasConfirmadas,
      rotasValidadas
    ] = await Promise.all([
      prisma.rota.count(),
      prisma.rota.count({ where: { status: 'DISPONIVEL' } }), // Rotas criadas mas não alocadas
      prisma.rota.count({ where: { status: 'OFERTADA' } }),
      prisma.rota.count({ where: { status: 'ACEITA' } }),
      prisma.rota.count({ where: { status: 'RECUSADA' } }),
      prisma.rota.count({ where: { status: 'CONFIRMADA' } }),
      prisma.rota.count({ where: { status: 'VALIDADA' } })
    ]);

    // Rotas Pendentes (DISPONIVEL + RECUSADA)
    const rotasPendentes = rotasCriadas + rotasRecusadas;

    // Rotas de Hoje
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const [
      rotasHoje,
      rotasHojeAlocadas,
      rotasHojeAceitas
    ] = await Promise.all([
      prisma.rota.count({
        where: {
          dataRota: {
            gte: hoje,
            lt: amanha
          }
        }
      }),
      prisma.rota.count({
        where: {
          dataRota: {
            gte: hoje,
            lt: amanha
          },
          motoristaId: { not: null }
        }
      }),
      prisma.rota.count({
        where: {
          dataRota: {
            gte: hoje,
            lt: amanha
          },
          status: 'ACEITA'
        }
      })
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        motoristas: {
          total: totalMotoristas,
          ativos: motoristasAtivos,
          inativos: motoristasInativos,
          onboarding: motoristasOnboarding
        },
        rotas: {
          total: totalRotas,
          criadas: rotasCriadas,
          ofertadas: rotasOfertadas,
          aceitas: rotasAceitas,
          recusadas: rotasRecusadas,
          confirmadas: rotasConfirmadas,
          validadas: rotasValidadas,
          pendentes: rotasPendentes
        },
        rotasHoje: {
          total: rotasHoje,
          alocadas: rotasHojeAlocadas,
          aceitas: rotasHojeAceitas
        }
      }
    });
  } catch (error) {
    logger.error(
      {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Erro ao buscar estatísticas do dashboard'
    );
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar estatísticas do dashboard',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};
