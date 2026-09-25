import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { pool } from '../config/db';
import { RowDataPacket } from 'mysql2';

// Extender el tipo de Request de Express para incluir al usuario autenticado
export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

/**
 * Middleware para validar el Bearer Token en peticiones protegidas
 */
export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer <token>"

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'No autorizado: Se requiere token de autenticación.',
    });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(403).json({
      success: false,
      message: 'Token inválido o expirado. Inicie sesión nuevamente.',
    });
    return;
  }

  try {
    // Verificar que el usuario sigue activo en la base de datos
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT u.id, e.nombre AS estado FROM usuarios u JOIN estados e ON u.estado_id = e.id WHERE u.id = ? LIMIT 1',
      [decoded.userId]
    );

    if (rows.length === 0 || rows[0].estado !== 'ACTIVO') {
      res.status(403).json({
        success: false,
        message: 'Acceso denegado: El usuario no existe o se encuentra inactivo.',
      });
      return;
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error('Error verificando usuario en middleware auth:', err);
    res.status(500).json({ success: false, message: 'Error interno de autenticación.' });
  }
}

/**
 * Middleware para restringir por rol específico (ej: solo ADMIN)
 */
export function requireRoles(...rolesPermitidos: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'No autenticado.' });
      return;
    }

    if (req.user.rol === 'SUPERADMIN' || rolesPermitidos.includes(req.user.rol)) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: `Acceso restringido: Se requiere rol ${rolesPermitidos.join(' o ')}.`,
    });
  };
}
