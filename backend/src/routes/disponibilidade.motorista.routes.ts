// backend/src/routes/disponibilidade.motorista.routes.ts
// Rotas de disponibilidade do MOTORISTA (CRUD próprio)

import { Router } from 'express';
import disponibilidadeController from '../controllers/disponibilidade.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Todas as rotas requerem autenticação como MOTORISTA
router.use(authenticate);
router.use(authorize('MOTORISTA'));

/**
 * @route   GET /api/motorista/disponibilidades/semanas
 * @desc    Buscar semana corrente + próxima semana estruturado
 * @access  Private (MOTORISTA)
 */
router.get('/semanas', disponibilidadeController.buscarSemanas);

/**
 * @route   GET /api/motorista/disponibilidades/historico
 * @desc    Buscar histórico de alterações das próprias disponibilidades
 * @access  Private (MOTORISTA)
 */
router.get('/historico', disponibilidadeController.buscarHistorico);

/**
 * @route   GET /api/motorista/disponibilidades
 * @desc    Buscar todas as disponibilidades do motorista logado
 * @access  Private (MOTORISTA)
 */
router.get('/', disponibilidadeController.minhasDisponibilidades);

/**
 * @route   POST /api/motorista/disponibilidades/batch
 * @desc    Cadastrar/atualizar disponibilidades em lote (2 semanas = até 42 turnos)
 * @access  Private (MOTORISTA)
 */
router.post('/batch', disponibilidadeController.cadastrarBatch);

/**
 * @route   POST /api/motorista/disponibilidades
 * @desc    Cadastrar disponibilidade individual
 * @access  Private (MOTORISTA)
 */
router.post('/', disponibilidadeController.cadastrar);

/**
 * @route   PUT /api/motorista/disponibilidades/:id
 * @desc    Atualizar uma disponibilidade específica
 * @access  Private (MOTORISTA)
 */
router.put('/:id', disponibilidadeController.atualizar);

/**
 * @route   DELETE /api/motorista/disponibilidades/:id
 * @desc    Excluir uma disponibilidade
 * @access  Private (MOTORISTA)
 */
router.delete('/:id', disponibilidadeController.excluir);

export default router;