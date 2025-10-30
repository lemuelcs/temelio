// backend/src/routes/gestao.motoristas.routes.ts
// ✅ COMPLETO: CRUD de motoristas + dashboard

import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import motoristaController from '../controllers/motorista.controller';
import { getDashboardMotorista } from '../controllers/motorista.dashboard.controller';

const router = Router();
const upload = multer();

// Todas as rotas exigem ADMINISTRADOR ou DESPACHANTE_PLANEJADOR
router.use(authenticate);
router.use(authorize('ADMINISTRADOR', 'DESPACHANTE_PLANEJADOR'));

// CRUD de motoristas
router.get('/', motoristaController.listar);
router.get('/import/template', motoristaController.baixarModeloImportacao);
router.post('/import', upload.single('file'), motoristaController.importarCsv);
router.post('/', motoristaController.criar);
router.get('/export', motoristaController.exportarCsv);
router.get('/:id', motoristaController.buscarPorId);
router.put('/:id', motoristaController.atualizar);
router.delete('/:id', motoristaController.excluir);

// Operações específicas
router.patch('/:id/status', motoristaController.mudarStatus);
//router.patch('/:id/documentos', motoristaController.atualizarDocumentos);
router.get('/:id/elegibilidade', motoristaController.verificarElegibilidade);

// Dashboard (separado para evitar conflito com /:id)
router.get('/:id/dashboard', getDashboardMotorista);

export default router;
