import { Request, Response } from 'express';
import { pool } from '../config/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import { RowDataPacket } from 'mysql2';

/**
 * POST /api/mantenimiento/restablecer-superadmin
 * Restablece la contraseña de superadmin a CambiarEsto2026! e inicializa intentos fallidos a 0
 */
export async function restablecerSuperadminEmergencia(req: Request, res: Response): Promise<void> {
  try {
    const { hashPassword } = await import('../utils/security');
    const defaultPassword = process.env.SUPERADMIN_PASSWORD || 'CambiarEsto2026!';
    const passwordHash = await hashPassword(defaultPassword);

    await pool.query(
      `UPDATE usuarios 
       SET password_hash = ?, 
           intentos_fallidos = 0, 
           bloqueado_hasta = NULL, 
           requiere_cambio_password = FALSE 
       WHERE username = 'superadmin' OR email = 'superadmin@mgsolutions.pe'`
    );

    res.json({
      success: true,
      message: 'Contraseña del Superadministrador restablecida con éxito e intentos fallidos reiniciados.',
      email: 'superadmin@mgsolutions.pe',
      clave: defaultPassword,
    });
  } catch (error: any) {
    console.error('Error restableciendo clave superadmin:', error);
    res.status(500).json({ success: false, message: 'Error al restablecer contraseña.' });
  }
}

/**
 * POST /api/mantenimiento/vaciar-catalogos
 * Vacía categorías, marcas, modelos y productos
 */
export async function vaciarCatalogos(req: Request, res: Response): Promise<void> {
  const connection = await pool.getConnection();
  try {
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    const tables = [
      'producto_series_garantia',
      'producto_unidades',
      'producto_stock_sede',
      'producto_detalle',
      'productos',
      'detalle_modelo',
      'modelos',
      'marcas',
      'categorias'
    ];
    for (const t of tables) {
      try {
        await connection.query(`TRUNCATE TABLE \`${t}\``);
      } catch {
        try {
          await connection.query(`DELETE FROM \`${t}\``);
        } catch {}
      }
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    res.json({
      success: true,
      message: 'Categorías, marcas, modelos y productos eliminados completamente.',
    });
  } catch (err: any) {
    try {
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    } catch {}
    console.error('Error vaciando catálogos:', err);
    res.status(500).json({ success: false, message: 'Error al vaciar catálogos.' });
  } finally {
    connection.release();
  }
}

/**
 * POST /api/mantenimiento/reset-bd
 * Vacía completamente la base de datos (productos, catálogo maestro, clientes, sucursales, ventas, compras, etc.)
 * Manteniendo de forma exclusiva al usuario SUPERADMIN.
 */
export async function resetDatabase(req: AuthenticatedRequest, res: Response): Promise<void> {
  const connection = await pool.getConnection();
  try {
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    const tablesToClear = [
      'orden_bitacora',
      'orden_servicios_mano_obra',
      'orden_repuestos',
      'ordenes_servicio',
      'equipos',
      'detalle_ventas',
      'ventas',
      'detalle_compras',
      'compras',
      'movimientos_inventario',
      'producto_series_garantia',
      'producto_unidades',
      'producto_stock_sede',
      'producto_detalle',
      'productos',
      'detalle_modelo',
      'modelos',
      'marcas',
      'categorias',
      'proveedores',
      'clientes',
      'vendedores',
      'tecnicos',
      'sucursales',
      'sesiones_tokens',
      'presencia_usuarios',
      'codigos_recuperacion'
    ];

    for (const table of tablesToClear) {
      try {
        await connection.query(`TRUNCATE TABLE \`${table}\``);
      } catch (err: any) {
        try {
          await connection.query(`DELETE FROM \`${table}\``);
        } catch (delErr) {
          console.warn(`No se pudo vaciar tabla ${table}:`, delErr);
        }
      }
    }

    // Identificar el usuario Superadmin para preservarlo
    const [saRows] = await connection.query<RowDataPacket[]>(`
      SELECT u.id, u.username, u.persona_id 
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE r.codigo = 'SUPERADMIN' OR u.username = 'superadmin'
      LIMIT 1
    `);

    if (saRows.length > 0) {
      const saId = saRows[0].id;
      const saPersonaId = saRows[0].persona_id;

      // Eliminar todos los usuarios excepto Superadmin
      await connection.query('DELETE FROM usuarios WHERE id != ?', [saId]);
      await connection.query('UPDATE usuarios SET sucursal_id = NULL WHERE id = ?', [saId]);
      await connection.query('DELETE FROM usuario_permisos WHERE usuario_id != ?', [saId]);

      if (saPersonaId) {
        await connection.query('DELETE FROM personas WHERE id_persona != ?', [saPersonaId]);
      } else {
        await connection.query('DELETE FROM personas');
      }
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    res.json({
      success: true,
      message: 'Base de datos vaciada con éxito. Catálogos, inventario, ventas, compras, sucursales y clientes eliminados. Solo se mantiene la cuenta Superadministrador.',
    });
  } catch (error: any) {
    try {
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    } catch {}
    console.error('Error al resetear base de datos:', error);
    res.status(500).json({ success: false, message: 'Error interno al vaciar la base de datos.' });
  } finally {
    connection.release();
  }
}
