import { Router } from 'express';
import alertaController from '../controllers/alerta.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   POST /api/alertas/gerar
 * @desc    Gerar alertas de compliance para todos os motoristas
 * @access  Private (DESPACHANTE_PLANEJADOR, ADMINISTRADOR)
 */
router.post(
  '/gerar',
  authenticate,
  authorize('DESPACHANTE_PLANEJADOR', 'ADMINISTRADOR'),
  alertaController.gerarAlertas
);

/**
 * @route   POST /api/alertas/motorista/:motoristaId
 * @desc    Gerar/Verificar alertas para um motorista específico
 * @access  Private (DESPACHANTE_PLANEJADOR, ADMINISTRADOR)
 */
router.post(
  '/motorista/:motoristaId',
  authenticate,
  authorize('DESPACHANTE_PLANEJADOR', 'ADMINISTRADOR'),
  alertaController.gerarAlertasMotorista
);

/**
 * @route   GET /api/alertas
 * @desc    Listar alertas com filtros
 * @access  Private (DESPACHANTE_PLANEJADOR, ADMINISTRADOR)
 */
router.get(
  '/',
  authenticate,
  authorize('DESPACHANTE_PLANEJADOR', 'ADMINISTRADOR'),
  alertaController.listar
);

/**
 * @route   GET /api/alertas/dashboard/compliance
 * @desc    Dashboard de compliance com estatísticas
 * @access  Private (DESPACHANTE_PLANEJADOR, ADMINISTRADOR)
 */
router.get(
  '/dashboard/compliance',
  authenticate,
  authorize('DESPACHANTE_PLANEJADOR', 'ADMINISTRADOR'),
  alertaController.dashboardCompliance
);

/**
 * @route   GET /api/alertas/:id
 * @desc    Buscar alerta por ID
 * @access  Private (DESPACHANTE_PLANEJADOR, ADMINISTRADOR)
 */
router.get(
  '/:id',
  authenticate,
  authorize('DESPACHANTE_PLANEJADOR', 'ADMINISTRADOR'),
  alertaController.buscarPorId
);

/**
 * @route   PATCH /api/alertas/:id/resolver
 * @desc    Resolver alerta
 * @access  Private (DESPACHANTE_PLANEJADOR, ADMINISTRADOR)
 */
router.patch(
  '/:id/resolver',
  authenticate,
  authorize('DESPACHANTE_PLANEJADOR', 'ADMINISTRADOR'),
  alertaController.resolver
);

/**
 * @route   PATCH /api/alertas/:id/reabrir
 * @desc    Reabrir alerta
 * @access  Private (DESPACHANTE_PLANEJADOR, ADMINISTRADOR)
 */
router.patch(
  '/:id/reabrir',
  authenticate,
  authorize('DESPACHANTE_PLANEJADOR', 'ADMINISTRADOR'),
  alertaController.reabrir
);

/**
 * @route   DELETE /api/alertas/limpar
 * @desc    Limpar alertas resolvidos antigos
 * @access  Private (ADMINISTRADOR)
 */
router.delete(
  '/limpar',
  authenticate,
  authorize('ADMINISTRADOR'),
  alertaController.limparResolvidos
);

export default router;
