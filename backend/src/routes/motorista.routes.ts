// backend/src/routes/motorista.routes.ts
// Rotas para motoristas acessarem suas próprias informações

import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { getDashboardMotorista } from '../controllers/motorista.dashboard.controller';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// GET /api/motoristas/dashboard - Dashboard do motorista logado
router.get('/dashboard', getDashboardMotorista);

export default router;
