import { Router } from 'express';
import rotaController from '../controllers/rota.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize('DESPACHANTE_PLANEJADOR', 'ADMINISTRADOR'),
  rotaController.criarOfertaParaMotorista
);

router.patch(
  '/:rotaId/editar',
  authenticate,
  authorize('DESPACHANTE_PLANEJADOR', 'ADMINISTRADOR'),
  rotaController.reofertarMotorista
);

router.delete(
  '/:rotaId',
  authenticate,
  authorize('DESPACHANTE_PLANEJADOR', 'ADMINISTRADOR'),
  rotaController.cancelarOfertas
);

router.get('/', authenticate, rotaController.listarOfertas);

router.patch(
  '/:id/aceitar',
  authenticate,
  authorize('MOTORISTA'),
  rotaController.aceitarOferta
);

router.patch(
  '/:id/recusar',
  authenticate,
  authorize('MOTORISTA'),
  rotaController.recusarOferta
);

export default router;
