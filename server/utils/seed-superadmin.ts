import dotenv from 'dotenv';
import { pool } from '../config/db';
import { hashPassword } from './security';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

dotenv.config();

export const ALL_MODULES = [
  'ventas',
  'clientes',
  'panel-recepcion',
  'taller',
  'panel-almacen',
  'compras',
  'movimientos',
  'catalogo',
  'repuestos-catalogo',
  'usuarios',
  'sucursales',
];

const ACTIVE_MODULES_SET = new Set(ALL_MODULES);
const LEGACY_MODULE_MAP: Record<string, string | null> = {
  productos: 'panel-almacen',
  categorias: 'catalogo',
  marcas: 'catalogo',
  'config-empresa': 'sucursales',
  caja: null,
  equipos: null,
};

function normalizeRoleModuleList(raw: unknown, rolCodigo: string): string[] {
  if (rolCodigo === 'SUPERADMIN' || rolCodigo === 'ADMIN') {
    return [...ALL_MODULES];
  }
  let parsed: string[] = [];
  if (Array.isArray(raw)) {
    parsed = raw.map(String);
  } else if (typeof raw === 'string') {
    try {
      const json = JSON.parse(raw);
      if (Array.isArray(json)) parsed = json.map(String);
    } catch {
      parsed = [];
    }
  }
  const normalized = new Set<string>();
  for (const item of parsed) {
    const mapped = item in LEGACY_MODULE_MAP ? LEGACY_MODULE_MAP[item] : item;
    if (mapped && ACTIVE_MODULES_SET.has(mapped)) {
      normalized.add(mapped);
    }
  }
  if (rolCodigo === 'TECNICO') {
    normalized.add('repuestos-catalogo');
  }
  return Array.from(normalized);
}

/**
 * Normaliza una sola vez los códigos de módulos en `roles.modulos_predeterminados`
 * para alinearlos con los 11 módulos activos del sistema.
 */
export async function normalizeRolesModules(): Promise<void> {
  const SEED_KEY = 'roles_modules_v2_2026_11';
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _catalog_seeds (
        seed_key VARCHAR(100) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const [doneRows] = await pool.query<RowDataPacket[]>(
      'SELECT seed_key FROM _catalog_seeds WHERE seed_key = ? LIMIT 1',
      [SEED_KEY]
    );
    if (doneRows.length > 0) return;

    const [roleRows] = await pool.query<RowDataPacket[]>(
      'SELECT id, codigo, modulos_predeterminados FROM roles'
    );
    for (const r of roleRows) {
      const normalized = normalizeRoleModuleList(r.modulos_predeterminados, String(r.codigo || ''));
      await pool.query(
        'UPDATE roles SET modulos_predeterminados = ? WHERE id = ?',
        [JSON.stringify(normalized), r.id]
      );
    }

    await pool.query('INSERT IGNORE INTO _catalog_seeds (seed_key) VALUES (?)', [SEED_KEY]);
    console.log(`✅ Módulos de ${roleRows.length} roles normalizados (seed ${SEED_KEY}).`);
  } catch (err) {
    console.error('⚠️ Error al normalizar módulos de roles:', err);
  }
}

export async function seedSuperAdmin(): Promise<void> {
  const superadminName = process.env.SUPERADMIN_NAME || 'Super Administrador';
  const superadminUsername = (process.env.SUPERADMIN_USERNAME || 'superadmin').trim().toLowerCase();
  const superadminEmail = (process.env.SUPERADMIN_EMAIL || 'superadmin@mgsolutions.pe').trim().toLowerCase();
  const superadminPassword = process.env.SUPERADMIN_PASSWORD || 'CambiarEsto2026!';

  try {
    // 1. Verificar o crear el Rol SUPERADMIN
    let superadminRoleId: number;

    const [existingRoles] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM roles WHERE codigo = ? LIMIT 1',
      ['SUPERADMIN']
    );

    if (existingRoles.length > 0) {
      superadminRoleId = existingRoles[0].id;
    } else {
      console.log('📌 Creando rol del sistema SUPERADMIN...');
      const [roleResult] = await pool.query<ResultSetHeader>(
        `INSERT INTO roles (codigo, nombre, descripcion, modulos_predeterminados, es_sistema, estado_id)
         VALUES (?, ?, ?, ?, 1, 1)`,
        [
          'SUPERADMIN',
          'Super Administrador',
          'Acceso total, irrestricto y de supervisión general sobre todos los módulos y gestión de roles.',
          JSON.stringify(ALL_MODULES),
        ]
      );
      superadminRoleId = roleResult.insertId;

      // Asignar todos los permisos existentes al rol SUPERADMIN
      const [allPermisos] = await pool.query<RowDataPacket[]>('SELECT id FROM permisos');
      for (const p of allPermisos) {
        await pool.query(
          'INSERT IGNORE INTO rol_permisos (rol_id, permiso_id) VALUES (?, ?)',
          [superadminRoleId, p.id]
        );
      }
      console.log(`✅ Rol SUPERADMIN creado con ID: ${superadminRoleId}`);
    }

    // 2. Verificar si ya existe un usuario con rol SUPERADMIN o con ese username/email
    const [existingUsers] = await pool.query<RowDataPacket[]>(
      `SELECT u.id, u.username, u.email, r.codigo AS rol_codigo
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE r.codigo = 'SUPERADMIN' OR u.username = ? OR u.email = ?
       LIMIT 1`,
      [superadminUsername, superadminEmail]
    );

    if (existingUsers.length > 0) {
      const u = existingUsers[0];
      const passwordHash = await hashPassword(superadminPassword);
      await pool.query(
        `UPDATE usuarios 
         SET password_hash = ?, 
             rol_id = ?,
             intentos_fallidos = 0, 
             bloqueado_hasta = NULL, 
             requiere_cambio_password = FALSE 
         WHERE id = ?`,
        [passwordHash, superadminRoleId, u.id]
      );
      console.log(`✅ Contraseña de Superadmin garantizada: '${superadminPassword}', rol SUPERADMIN restablecido e intentos fallidos a 0.`);
      return;
    }

    // 3. Crear el usuario SUPERADMIN
    console.log(`🌱 Sembrando cuenta SUPERADMIN inicial: ${superadminUsername} (${superadminEmail})...`);
    const passwordHash = await hashPassword(superadminPassword);

    // Obtener la sucursal principal si existe
    const [sucursales] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM sucursales WHERE es_principal = 1 OR estado_id = 1 ORDER BY id ASC LIMIT 1'
    );
    const sucursalId = sucursales.length > 0 ? sucursales[0].id : null;

    await pool.query(
      `INSERT INTO usuarios (
        username, password_hash, nombre_completo, email, rol_id, sucursal_id,
        estado_id, requiere_cambio_password, avatar_url
      ) VALUES (?, ?, ?, ?, ?, ?, 1, 1, ?)`,
      [
        superadminUsername,
        passwordHash,
        superadminName,
        superadminEmail,
        superadminRoleId,
        sucursalId,
        'SA',
      ]
    );

    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║   🎉 SUPERADMIN CREADO EXITOSAMENTE (SEEDING)            ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(`║   Usuario:   ${superadminUsername.padEnd(44)}║`);
    console.log(`║   Correo:    ${superadminEmail.padEnd(44)}║`);
    console.log('║   Seguridad: Forzar cambio de contraseña = SÍ (Modal)    ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
  } catch (error) {
    console.error('❌ Error en seedSuperAdmin:', error);
  }
}

// Ejecutar si se invoca directamente desde CLI
if (process.argv[1]?.includes('seed-superadmin')) {
  seedSuperAdmin().then(() => {
    pool.end();
  });
}
