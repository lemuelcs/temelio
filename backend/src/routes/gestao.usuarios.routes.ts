// backend/src/routes/gestao.usuarios.routes.ts
// Rotas para gestão de usuários

import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import usuarioController from '../controllers/usuario.controller';

const router = Router();

// Todas as rotas exigem autenticação e perfil ADMINISTRADOR
router.use(authenticate);
router.use(authorize('ADMINISTRADOR'));

// CRUD de usuários
router.get('/', usuarioController.listar);
router.post('/', usuarioController.criar);
router.get('/:id', usuarioController.buscarPorId);
router.put('/:id', usuarioController.atualizar);
router.delete('/:id', usuarioController.excluir);

// Operações específicas
router.patch('/:id/senha', usuarioController.alterarSenha);
router.patch('/:id/ativo', usuarioController.toggleAtivo);

export default router;
