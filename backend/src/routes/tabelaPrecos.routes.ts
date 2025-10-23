import { Router } from 'express';
import tabelaPrecosController from '../controllers/tabelaPrecos.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Middleware de erro async (helper inline)
const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Todas as rotas requerem autenticação
router.use(authenticate);

// GET - Listar todas as tabelas
router.get('/', asyncHandler(tabelaPrecosController.listar));

// GET - Buscar tabela vigente
router.get('/vigente', asyncHandler(tabelaPrecosController.buscarVigente));

// GET - Listar histórico de versões
router.get('/historico', asyncHandler(tabelaPrecosController.listarHistorico));

// GET - Buscar por ID
router.get('/:id', asyncHandler(tabelaPrecosController.buscarPorId));

// POST - Criar nova tabela
router.post('/', asyncHandler(tabelaPrecosController.criar));

// PUT - Atualizar tabela
router.put('/:id', asyncHandler(tabelaPrecosController.atualizar));

// PATCH - Desativar tabela
router.patch('/:id/desativar', asyncHandler(tabelaPrecosController.desativar));

// DELETE - Deletar tabela
router.delete('/:id', asyncHandler(tabelaPrecosController.deletar));

export default router;