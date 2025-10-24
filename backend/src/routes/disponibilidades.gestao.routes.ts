// backend/src/routes/disponibilidades.gestao.routes.ts
// Rotas de disponibilidade da GESTÃO (consultas operacionais)

import { Router } from 'express';
import disponibilidadeController from '../controllers/disponibilidade.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Todas as rotas requerem autenticação como DESPACHANTE ou ADMINISTRADOR
router.use(authenticate);
router.use(authorize('DESPACHANTE_PLANEJADOR', 'ADMINISTRADOR'));

/**
 * @route   GET /api/gestao/disponibilidades/resumo
 * @desc    Buscar resumo consolidado por tipo de veículo (hoje + próximos dias)
 * @access  Private (DESPACHANTE_PLANEJADOR, ADMINISTRADOR)
 * @query   dataInicio, dataFim
 */
router.get('/resumo', disponibilidadeController.buscarResumo);

/**
 * @route   GET /api/gestao/disponibilidades/hoje-amanha
 * @desc    Buscar disponibilidades de hoje e amanhã (visão operacional)
 * @access  Private (DESPACHANTE_PLANEJADOR, ADMINISTRADOR)
 */
// Rota hoje-amanha removida - método não existe no controller

/**
 * @route   POST /api/gestao/disponibilidades/buscar-motoristas
 * @desc    Buscar motoristas disponíveis para data/turno específico
 * @access  Private (DESPACHANTE_PLANEJADOR, ADMINISTRADOR)
 */
router.post('/buscar-motoristas', disponibilidadeController.buscarMotoristasDisponiveis);

/**
 * @route   GET /api/gestao/disponibilidades/motorista/:motoristaId
 * @desc    Buscar disponibilidades de um motorista específico
 * @access  Private (DESPACHANTE_PLANEJADOR, ADMINISTRADOR)
 * @query   dataInicio, dataFim
 */
router.get('/motorista/:motoristaId', disponibilidadeController.buscarPorMotorista);

/**
 * @route   GET /api/gestao/disponibilidades/intervalo
 * @desc    Listar disponibilidades no intervalo informado
 * @access  Private (DESPACHANTE_PLANEJADOR, ADMINISTRADOR)
 * @query   dataInicio, dataFim, disponivel
 */
router.get('/intervalo', disponibilidadeController.listarIntervalo);

/**
 * @route   GET /api/gestao/disponibilidades
 * @desc    Listar TODAS as disponibilidades com filtros (visão geral)
 * @access  Private (DESPACHANTE_PLANEJADOR, ADMINISTRADOR)
 * @query   dataInicio, dataFim, motoristaId, turno, disponivel
 */
router.get('/', disponibilidadeController.listarTodas);

export default router;
