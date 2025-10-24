import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Registrar novo usuário
 * @access  Public
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login de usuário
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   GET /api/auth/me
 * @desc    Obter perfil do usuário autenticado
 * @access  Private
 */
router.get('/me', authenticate, authController.getProfile);

router.post('/change-password', authenticate, authController.changePassword);

/**
 * @route   POST /api/auth/verify
 * @desc    Verificar se o token é válido
 * @access  Public
 */
router.post('/verify', authController.verifyToken);

export default router;
