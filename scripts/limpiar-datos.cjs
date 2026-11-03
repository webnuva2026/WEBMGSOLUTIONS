/**
 * Limpieza de datos transaccionales de MG Solutions.
 * 1) Respalda TODAS las tablas en scripts/backups/backup-<fecha>.json
 * 2) Vacía datos operativos conservando: catálogo maestro, empresa/sucursales,
 *    catálogos de estados/tipos, permisos y el rol SUPERADMIN.
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const DB = process.env.DB_NAME || 'mg_solutions_db';

// Tablas que se VACÍAN por completo (orden irrelevante: FK checks desactivados)
const WIPE = [
  'sesiones_tokens', 'codigos_recuperacion', 'usuario_permisos',
  'producto_series_garantia', 'detalle_ventas', 'ventas',
  'detalle_compras', 'compras', 'proveedores',
  'ordenes_servicio', 'equipos',
  'producto_unidades', 'producto_stock_sede', 'producto_detalle', 'productos',
  'clientes', 'vendedores', 'tecnicos', 'usuarios', 'personas',
];

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: DB,
  });

  // ---- 1. Respaldo ----
  const [tables] = await c.query(
    'SELECT TABLE_NAME n FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_TYPE="BASE TABLE"', [DB]);
  const existing = new Set(tables.map(t => t.n));
  const backup = {};
  for (const t of tables) {
    const [rows] = await c.query(`SELECT * FROM \`${t.n}\``);
    backup[t.n] = rows;
  }
  const dir = path.join(__dirname, 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(file, JSON.stringify(backup, null, 1), 'utf-8');
  console.log('Respaldo guardado:', file);

  // ---- 2. Limpieza ----
  await c.query('SET FOREIGN_KEY_CHECKS=0');
  for (const t of WIPE) {
    if (!existing.has(t)) { console.log('  (no existe)', t); continue; }
    await c.query(`DELETE FROM \`${t}\``);
    await c.query(`ALTER TABLE \`${t}\` AUTO_INCREMENT = 1`);
  }
  // Roles: conservar solo SUPERADMIN (y sus permisos)
  await c.query("DELETE FROM rol_permisos WHERE rol_id NOT IN (SELECT id FROM roles WHERE codigo='SUPERADMIN')");
  await c.query("DELETE FROM roles WHERE codigo <> 'SUPERADMIN'");
  await c.query('SET FOREIGN_KEY_CHECKS=1');

  // ---- 3. Verificación ----
  console.log('\nConteo final:');
  for (const t of [...WIPE, 'roles', 'rol_permisos', 'permisos', 'categorias', 'marcas', 'modelos', 'detalle_modelo', 'tipos_producto_detalle', 'empresas', 'sucursales']) {
    if (!existing.has(t)) continue;
    const [[r]] = await c.query(`SELECT COUNT(*) n FROM \`${t}\``);
    console.log(`  ${t.padEnd(26)} ${r.n}`);
  }
  await c.end();
})().catch(e => { console.error('ERROR:', e); process.exit(1); });
