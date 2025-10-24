import { Router } from 'express';
import rotaController from '../controllers/rota.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   POST /api/rotas
 * @desc    Criar nova oferta de rota (D-1)
 * @access  Private (DESPACHANTE_PLANEJADOR)
 */
router.post(
  '/',
  authenticate,
  authorize('DESPACHANTE_PLANEJADOR', 'ADMINISTRADOR'),
  rotaController.criarOferta
);

/**
 * @route   GET /api/rotas
 * @desc    Listar rotas com filtros
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  rotaController.listar
);

/**
 * @route   GET /api/rotas/validacao
 * @desc    Listar rotas para validação (D+1)
 * @access  Private (DESPACHANTE_PLANEJADOR)
 */
router.get(
  '/validacao',
  authenticate,
  authorize('DESPACHANTE_PLANEJADOR', 'ADMINISTRADOR'),
  rotaController.listarRotasParaValidacao
);

/**
 * @route   GET /api/rotas/tabela-precos
 * @desc    Obter tabela de preços
 * @access  Private
 */
router.get(
  '/tabela-precos',
  authenticate,
  rotaController.obterTabelaPrecos
);

/**
 * @route   GET /api/rotas/:id
 * @desc    Buscar rota por ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  rotaController.buscarPorId
);

/**
 * @route   PUT /api/rotas/:id
 * @desc    Atualizar rota
 * @access  Private (DESPACHANTE_PLANEJADOR)
 */
router.put(
  '/:id',
  authenticate,
  authorize('DESPACHANTE_PLANEJADOR', 'ADMINISTRADOR'),
  rotaController.atualizar
);

/**
 * @route   DELETE /api/rotas/:id
 * @desc    Excluir rota
 * @access  Private (DESPACHANTE_PLANEJADOR)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('DESPACHANTE_PLANEJADOR', 'ADMINISTRADOR'),
  rotaController.excluir
);

/**
 * @route   PATCH /api/rotas/:id/confirmar
 * @desc    Confirmar rota (D+0 - Roteirização)
 * @access  Private (DESPACHANTE_PLANEJADOR)
 */
router.patch(
  '/:id/confirmar',
  authenticate,
  authorize('DESPACHANTE_PLANEJADOR', 'ADMINISTRADOR'),
  rotaController.confirmarRota
);

/**
 * @route   PATCH /api/rotas/:id/validar
 * @desc    Validar rota e informar KM real (D+1)
 * @access  Private (DESPACHANTE_PLANEJADOR)
 */
router.patch(
  '/:id/validar',
  authenticate,
  authorize('DESPACHANTE_PLANEJADOR', 'ADMINISTRADOR'),
  rotaController.validarRota
);

/**
 * @route   POST /api/rotas/validar-lote
 * @desc    Validar múltiplas rotas em lote (D+1)
 * @access  Private (DESPACHANTE_PLANEJADOR)
 */
router.post(
  '/validar-lote',
  authenticate,
  authorize('DESPACHANTE_PLANEJADOR', 'ADMINISTRADOR'),
  rotaController.validarRotasEmLote
);

/**
 * @route   PATCH /api/rotas/:id/cancelar
 * @desc    Cancelar rota
 * @access  Private (DESPACHANTE_PLANEJADOR)
 */
router.patch(
  '/:id/cancelar',
  authenticate,
  authorize('DESPACHANTE_PLANEJADOR', 'ADMINISTRADOR'),
  rotaController.cancelar
);

/**
 * @route   PATCH /api/rotas/:id/tracking
 * @desc    Atualizar status de tracking da rota
 * @access  Private (MOTORISTA)
 */
router.patch(
  '/:id/tracking',
  authenticate,
  authorize('MOTORISTA'),
  rotaController.atualizarTracking
);

export default router;
