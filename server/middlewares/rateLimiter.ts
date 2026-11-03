import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

// Limitador para inicio de sesión: en producción 10 fallos cada 15 min, en desarrollo más tolerante
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: isDev ? 100 : 10, // En desarrollo permite hasta 100 peticiones para testing
  skipSuccessfulRequests: true, // No cuenta peticiones exitosas (2xx)
  message: {
    success: false,
    message: 'Demasiados intentos fallidos de inicio de sesión desde esta IP. Por seguridad, intente nuevamente en 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

