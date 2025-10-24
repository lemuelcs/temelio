import { Router } from 'express';
import kpiController from '../controllers/kpi.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Todas as rotas exigem autenticação de DESPACHANTE_PLANEJADOR ou ADMINISTRADOR

router.get(
  '/dashboard',
  authenticate,
  authorize('DESPACHANTE_PLANEJADOR', 'ADMINISTRADOR'),
  kpiController.dashboardGeral
);

router.get(
  '/entregas',
  authenticate,
  authorize('DESPACHANTE_PLANEJADOR', 'ADMINISTRADOR'),
  kpiController.metricasEntregas
);

router.get(
  '/otd',
  authenticate,
  authorize('DESPACHANTE_PLANEJADOR', 'ADMINISTRADOR'),
  kpiController.metricasOTD
);

router.get(
  '/faturamento',
  authenticate,
  authorize('DESPACHANTE_PLANEJADOR', 'ADMINISTRADOR'),
  kpiController.faturamentoGeral
);

router.get(
  '/faturamento/motorista/:motoristaId',
  authenticate,
  authorize('DESPACHANTE_PLANEJADOR', 'ADMINISTRADOR'),
  kpiController.faturamentoPorMotorista
);

router.get(
  '/rotas',
  authenticate,
  authorize('DESPACHANTE_PLANEJADOR', 'ADMINISTRADOR'),
  kpiController.estatisticasRotas
);

router.get(
  '/ofertas',
  authenticate,
  authorize('DESPACHANTE_PLANEJADOR', 'ADMINISTRADOR'),
  kpiController.taxaAceiteOfertas
);

router.get(
  '/motorista/:motoristaId',
  authenticate,
  authorize('DESPACHANTE_PLANEJADOR', 'ADMINISTRADOR'),
  kpiController.performanceMotorista
);

router.get(
  '/top-motoristas',
  authenticate,
  authorize('DESPACHANTE_PLANEJADOR', 'ADMINISTRADOR'),
  kpiController.topMotoristas
);

export default router;
