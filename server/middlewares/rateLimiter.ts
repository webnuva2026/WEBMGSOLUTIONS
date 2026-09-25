import rateLimit from 'express-rate-limit';

// Limitador estricto para inicio de sesión: máximo 10 intentos por IP cada 15 minutos
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Máximo 10 peticiones
  message: {
    success: false,
    message: 'Demasiados intentos fallidos de inicio de sesión desde esta IP. Por seguridad, intente nuevamente en 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
