import { prisma } from '../lib/prisma';
import { Router } from 'express';
import localController from '../controllers/local.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();


/**
 * @route   POST /api/locais
 * @desc    Criar novo local/estação
 * @access  Private (DESPACHANTE_PLANEJADOR, ADMINISTRADOR)
 */
router.post(
  '/',
  authenticate,
  authorize('DESPACHANTE_PLANEJADOR', 'ADMINISTRADOR'),
  localController.criar
);

/**
 * @route   GET /api/locais
 * @desc    Listar locais com filtros
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  localController.listar
);

/**
 * @route   GET /api/locais/:id
 * @desc    Buscar local por ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  localController.buscarPorId
);

/**
 * @route   PUT /api/locais/:id
 * @desc    Atualizar local
 * @access  Private (DESPACHANTE_PLANEJADOR, ADMINISTRADOR)
 */
router.put(
  '/:id',
  authenticate,
  authorize('DESPACHANTE_PLANEJADOR', 'ADMINISTRADOR'),
  localController.atualizar
);

/**
 * @route   PATCH /api/locais/:id/status
 * @desc    Ativar/Desativar local
 * @access  Private (ADMINISTRADOR)
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize('ADMINISTRADOR'),
  localController.mudarStatus
);

// DELETE - Excluir local
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.local.delete({
      where: { id }
    });

    res.json({ 
      status: 'success',
      message: 'Local excluído com sucesso' 
    });
  } catch (error: any) {
    console.error('Erro ao excluir local:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Erro ao excluir local',
      error: error.message 
    });
  }
}
);


export default router;