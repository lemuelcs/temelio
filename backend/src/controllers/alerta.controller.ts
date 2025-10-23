import { Request, Response, NextFunction } from 'express';
import alertaService from '../services/alerta.service';
import { AppError } from '../middlewares/error.middleware';

class AlertaController {
  // POST /api/alertas/gerar
  async gerarAlertas(req: Request, res: Response, next: NextFunction) {
    try {
      const resultado = await alertaService.gerarAlertasCompliance();

      res.json({
        status: 'success',
        message: `${resultado.alertasGerados} alertas gerados`,
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/alertas/motorista/:motoristaId
  async gerarAlertasMotorista(req: Request, res: Response, next: NextFunction) {
    try {
      const { motoristaId } = req.params;

      const alertas = await alertaService.verificarComplianceMotorista(motoristaId);

      res.json({
        status: 'success',
        message: `${alertas.length} alertas verificados`,
        data: {
          alertas,
          total: alertas.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/alertas
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const { motoristaId, tipo, severidade, resolvido } = req.query;

      const filtros = {
        motoristaId: motoristaId as string,
        tipo: tipo as string,
        severidade: severidade as string,
        resolvido: resolvido !== undefined ? resolvido === 'true' : undefined
      };

      const alertas = await alertaService.listar(filtros);

      res.json({
        status: 'success',
        data: {
          alertas,
          total: alertas.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/alertas/:id
  async buscarPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const alerta = await alertaService.buscarPorId(id);

      res.json({
        status: 'success',
        data: { alerta }
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/alertas/:id/resolver
  async resolver(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const alerta = await alertaService.resolver(id);

      res.json({
        status: 'success',
        message: 'Alerta resolvido com sucesso',
        data: { alerta }
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/alertas/:id/reabrir
  async reabrir(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const alerta = await alertaService.reabrir(id);

      res.json({
        status: 'success',
        message: 'Alerta reaberto com sucesso',
        data: { alerta }
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/alertas/dashboard/compliance
  async dashboardCompliance(req: Request, res: Response, next: NextFunction) {
    try {
      const dashboard = await alertaService.dashboardCompliance();

      res.json({
        status: 'success',
        data: dashboard
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/alertas/limpar
  async limparResolvidos(req: Request, res: Response, next: NextFunction) {
    try {
      const { dias } = req.query;

      const diasAntigos = dias ? Number(dias) : 90;

      const resultado = await alertaService.limparAlertasResolvidos(diasAntigos);

      res.json({
        status: 'success',
        message: `${resultado.alertasExcluidos} alertas antigos excluídos`,
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AlertaController();