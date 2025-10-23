import { prisma } from '../lib/prisma';
import { Router } from 'express';
import precoController from '../controllers/preco.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   POST /api/precos
 * @desc    Criar nova tabela de preços
 * @access  Private (ADMINISTRADOR)
 */
router.post(
  '/',
  authenticate,
  authorize('ADMINISTRADOR'),
  precoController.criar
);

/**
 * @route   POST /api/precos/seed
 * @desc    Criar tabelas de preços padrão
 * @access  Private (ADMINISTRADOR)
 */
router.post(
  '/seed',
  authenticate,
  authorize('ADMINISTRADOR'),
  precoController.criarTabelasPadrao
);

/**
 * @route   GET /api/precos
 * @desc    Listar tabelas de preços com filtros
 * @access  Private (DESPACHANTE_PLANEJADOR, ADMINISTRADOR)
 */
router.get(
  '/',
  authenticate,
  authorize('DESPACHANTE_PLANEJADOR', 'ADMINISTRADOR'),
  precoController.listar
);

/**
 * @route   GET /api/precos/ativo/:tipoVeiculo/:propriedadeVeiculo
 * @desc    Buscar tabela de preços ativa para tipo de veículo
 * @access  Private
 */
router.get(
  '/ativo/:tipoVeiculo/:propriedadeVeiculo',
  authenticate,
  precoController.buscarAtiva
);

/**
 * @route   GET /api/precos/:id
 * @desc    Buscar tabela de preços por ID
 * @access  Private (DESPACHANTE_PLANEJADOR, ADMINISTRADOR)
 */
router.get(
  '/:id',
  authenticate,
  authorize('DESPACHANTE_PLANEJADOR', 'ADMINISTRADOR'),
  precoController.buscarPorId
);

/**
 * @route   PUT /api/precos/:id
 * @desc    Atualizar tabela de preços
 * @access  Private (ADMINISTRADOR)
 */
router.put(
  '/:id',
  authenticate,
  authorize('ADMINISTRADOR'),
  precoController.atualizar
);

/**
 * @route   PATCH /api/precos/:id/desativar
 * @desc    Desativar tabela de preços
 * @access  Private (ADMINISTRADOR)
 */
router.patch(
  '/:id/desativar',
  authenticate,
  authorize('ADMINISTRADOR'),
  precoController.desativar
);

export default router;