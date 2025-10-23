import { Request, Response, NextFunction } from 'express';
import kpiService from '../services/kpi.service';
import { AppError } from '../middlewares/error.middleware';

class KPIController {
  // GET /api/kpis/dashboard
  async dashboardGeral(req: Request, res: Response, next: NextFunction) {
    try {
      const { dataInicio, dataFim } = req.query;

      if (!dataInicio || !dataFim) {
        throw new AppError('dataInicio e dataFim são obrigatórios', 400);
      }

      const periodo = {
        dataInicio: new Date(dataInicio as string),
        dataFim: new Date(dataFim as string)
      };

      const dashboard = await kpiService.dashboardGeral(periodo);

      res.json({
        status: 'success',
        data: dashboard
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/kpis/entregas
  async metricasEntregas(req: Request, res: Response, next: NextFunction) {
    try {
      const { dataInicio, dataFim } = req.query;

      if (!dataInicio || !dataFim) {
        throw new AppError('dataInicio e dataFim são obrigatórios', 400);
      }

      const periodo = {
        dataInicio: new Date(dataInicio as string),
        dataFim: new Date(dataFim as string)
      };

      const metricas = await kpiService.metricasEntregas(periodo);

      res.json({
        status: 'success',
        data: metricas
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/kpis/otd
  async metricasOTD(req: Request, res: Response, next: NextFunction) {
    try {
      const { dataInicio, dataFim } = req.query;

      if (!dataInicio || !dataFim) {
        throw new AppError('dataInicio e dataFim são obrigatórios', 400);
      }

      const periodo = {
        dataInicio: new Date(dataInicio as string),
        dataFim: new Date(dataFim as string)
      };

      const otd = await kpiService.metricasOTD(periodo);

      res.json({
        status: 'success',
        data: otd
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/kpis/faturamento
  async faturamentoGeral(req: Request, res: Response, next: NextFunction) {
    try {
      const { dataInicio, dataFim } = req.query;

      if (!dataInicio || !dataFim) {
        throw new AppError('dataInicio e dataFim são obrigatórios', 400);
      }

      const periodo = {
        dataInicio: new Date(dataInicio as string),
        dataFim: new Date(dataFim as string)
      };

      const faturamento = await kpiService.faturamentoGeral(periodo);

      res.json({
        status: 'success',
        data: faturamento
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/kpis/faturamento/motorista/:motoristaId
  async faturamentoPorMotorista(req: Request, res: Response, next: NextFunction) {
    try {
      const { motoristaId } = req.params;
      const { dataInicio, dataFim } = req.query;

      if (!dataInicio || !dataFim) {
        throw new AppError('dataInicio e dataFim são obrigatórios', 400);
      }

      const periodo = {
        dataInicio: new Date(dataInicio as string),
        dataFim: new Date(dataFim as string)
      };

      const faturamento = await kpiService.faturamentoPorMotorista(periodo, motoristaId);

      res.json({
        status: 'success',
        data: {
          faturamentos: faturamento,
          total: faturamento.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/kpis/rotas
  async estatisticasRotas(req: Request, res: Response, next: NextFunction) {
    try {
      const { dataInicio, dataFim } = req.query;

      if (!dataInicio || !dataFim) {
        throw new AppError('dataInicio e dataFim são obrigatórios', 400);
      }

      const periodo = {
        dataInicio: new Date(dataInicio as string),
        dataFim: new Date(dataFim as string)
      };

      const estatisticas = await kpiService.estatisticasRotas(periodo);

      res.json({
        status: 'success',
        data: estatisticas
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/kpis/ofertas
  async taxaAceiteOfertas(req: Request, res: Response, next: NextFunction) {
    try {
      const { dataInicio, dataFim } = req.query;

      if (!dataInicio || !dataFim) {
        throw new AppError('dataInicio e dataFim são obrigatórios', 400);
      }

      const periodo = {
        dataInicio: new Date(dataInicio as string),
        dataFim: new Date(dataFim as string)
      };

      const ofertas = await kpiService.taxaAceiteOfertas(periodo);

      res.json({
        status: 'success',
        data: ofertas
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/kpis/motorista/:motoristaId
  async performanceMotorista(req: Request, res: Response, next: NextFunction) {
    try {
      const { motoristaId } = req.params;
      const { dataInicio, dataFim } = req.query;

      if (!dataInicio || !dataFim) {
        throw new AppError('dataInicio e dataFim são obrigatórios', 400);
      }

      const periodo = {
        dataInicio: new Date(dataInicio as string),
        dataFim: new Date(dataFim as string)
      };

      const performance = await kpiService.performanceMotorista(motoristaId, periodo);

      res.json({
        status: 'success',
        data: performance
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/kpis/top-motoristas
  async topMotoristas(req: Request, res: Response, next: NextFunction) {
    try {
      const { dataInicio, dataFim, limite } = req.query;

      if (!dataInicio || !dataFim) {
        throw new AppError('dataInicio e dataFim são obrigatórios', 400);
      }

      const periodo = {
        dataInicio: new Date(dataInicio as string),
        dataFim: new Date(dataFim as string)
      };

      const limiteNum = limite ? Number(limite) : 10;

      const topMotoristas = await kpiService.topMotoristas(periodo, limiteNum);

      res.json({
        status: 'success',
        data: {
          motoristas: topMotoristas,
          total: topMotoristas.length
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new KPIController();