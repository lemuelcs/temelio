// backend/src/routes/dashboard.routes.ts
import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// GET /api/dashboard/stats - Buscar estatísticas do dashboard
router.get('/stats', getDashboardStats);

export default router;