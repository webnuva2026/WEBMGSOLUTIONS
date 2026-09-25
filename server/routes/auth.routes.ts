import { Router } from 'express';
import {
  login,
  getProfile,
  logout,
  changePassword,
  solicitarRecuperacionPassword,
  verificarCodigoRecuperacion,
  restablecerPasswordConCodigo,
} from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth';
import { loginRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// ─── Rutas públicas de Autenticación ───
router.post('/login', loginRateLimiter, login);
router.post('/recuperar-password/solicitar', loginRateLimiter, solicitarRecuperacionPassword);
router.post('/recuperar-password/verificar-codigo', loginRateLimiter, verificarCodigoRecuperacion);
router.post('/recuperar-password/restablecer', loginRateLimiter, restablecerPasswordConCodigo);

// ─── Rutas protegidas (requieren JWT) ───
router.get('/me', authenticateToken, getProfile);
router.post('/logout', authenticateToken, logout);
router.patch('/cambiar-password', authenticateToken, changePassword);

export default router;


