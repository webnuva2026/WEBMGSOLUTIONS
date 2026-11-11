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
    // Verificar que el usuario sigue activo y sincronizar su rol y sede vigentes desde BD
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT u.id, u.sucursal_id AS sucursalId, r.codigo AS rolCodigo, e.nombre AS estado
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       JOIN estados e ON u.estado_id = e.id
       WHERE u.id = ?
       LIMIT 1`,
      [decoded.userId]
    );

    if (rows.length === 0 || rows[0].estado !== 'ACTIVO') {
      res.status(403).json({
        success: false,
        message: 'Acceso denegado: El usuario no existe o se encuentra inactivo.',
      });
      return;
    }

    req.user = {
      ...decoded,
      rol: rows[0].rolCodigo || decoded.rol,
      sucursalId: rows[0].sucursalId !== undefined ? rows[0].sucursalId : decoded.sucursalId,
    };
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

const MODULE_PERMISSION_ALIASES: Record<string, string[]> = {
  marcas: ['catalogo'],
  categorias: ['catalogo'],
  catalogo: ['catalogo', 'marcas', 'categorias'],
  'config-empresa': ['sucursales', 'config-empresa'],
  sucursales: ['sucursales', 'config-empresa'],
  productos: ['panel-almacen', 'productos'],
  'panel-almacen': ['panel-almacen', 'productos'],
};

/**
 * Middleware para validar acceso dinámico por permiso/módulo del sistema
 * Permite acceso a:
 * 1. SUPERADMIN y ADMIN (siempre tienen acceso irrestricto)
 * 2. Roles indicados explícitamente en rolesFallback (si se especifican)
 * 3. Cualquier usuario cuyo rol tenga asignado el módulo en la base de datos (roles.modulos_predeterminados o rol_permisos)
 */
export function requirePermission(moduloCodigo: string, ...rolesFallback: string[]) {
  const acceptedCodes = Array.from(
    new Set([moduloCodigo, ...(MODULE_PERMISSION_ALIASES[moduloCodigo] || [])])
  );

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'No autenticado.' });
      return;
    }

    // 1. Acceso total para Superadmin y Admin
    if (req.user.rol === 'SUPERADMIN' || req.user.rol === 'ADMIN') {
      next();
      return;
    }

    // 2. Coincidencia directa con roles de respaldo autorizados
    if (rolesFallback.length > 0 && rolesFallback.includes(req.user.rol)) {
      next();
      return;
    }

    try {
      // 3. Verificar en roles.modulos_predeterminados del rol del usuario
      const [userRoleRows] = await pool.query<RowDataPacket[]>(
        `SELECT r.modulos_predeterminados
         FROM usuarios u
         JOIN roles r ON u.rol_id = r.id
         WHERE u.id = ? AND r.estado_id = 1
         LIMIT 1`,
        [req.user.userId]
      );

      if (userRoleRows.length > 0) {
        let modulos = userRoleRows[0].modulos_predeterminados;
        if (typeof modulos === 'string') {
          try {
            modulos = JSON.parse(modulos);
          } catch {
            modulos = [];
          }
        }
        if (Array.isArray(modulos) && modulos.some((m: string) => acceptedCodes.includes(m))) {
          next();
          return;
        }
      }

      // 4. Verificar en tabla relacional rol_permisos
      const placeholders = acceptedCodes.map(() => '?').join(', ');
      const [permRows] = await pool.query<RowDataPacket[]>(
        `SELECT 1 FROM rol_permisos rp
         JOIN permisos p ON rp.permiso_id = p.id
         JOIN usuarios u ON u.rol_id = rp.rol_id
         WHERE u.id = ? AND p.codigo IN (${placeholders})
         LIMIT 1`,
        [req.user.userId, ...acceptedCodes]
      );

      if (permRows.length > 0) {
        next();
        return;
      }

      res.status(403).json({
        success: false,
        message: `Acceso restringido: No cuenta con permisos para el módulo '${moduloCodigo}'.`,
      });
    } catch (err) {
      console.error('Error al verificar permisos dinámicos en auth middleware:', err);
      res.status(500).json({ success: false, message: 'Error interno de autorización.' });
    }
  };
}

