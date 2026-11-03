/**
 * Script de Respaldo y Limpieza para Despliegue en Producción
 * MG Solutions ERP
 * 
 * 1. Respalda la base de datos completa con datos de prueba (JSON y SQL).
 * 2. Limpia tablas operativas y transaccionales (ventas, compras, ordenes, productos ficticios, clientes de prueba, usuarios secundarios).
 * 3. Conserva: @superadmin (ID: 1), Roles, Permisos, Catálogo Maestro (Categorías, Marcas, Modelos), Sucursales y Empresa.
 * 4. Exporta database_clean_production.sql listo para importar a la nube (Aiven / TiDB / Render).
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const DB = process.env.DB_NAME || 'mg_solutions_db';

const TABLES_TO_WIPE = [
  'orden_repuestos',
  'orden_servicios_mano_obra',
  'ordenes_servicio',
  'equipos',
  'producto_series_garantia',
  'detalle_ventas',
  'ventas',
  'detalle_compras',
  'compras',
  'producto_stock_sede',
  'producto_unidades',
  'movimientos_inventario',
  'producto_detalle',
  'productos',
  'clientes',
  'sesiones_tokens',
  'codigos_recuperacion',
];

async function main() {
  console.log('====================================================');
  console.log('🚀 MG SOLUTIONS - LIMPIEZA Y PREPARACIÓN DE PRODUCCIÓN');
  console.log('====================================================\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'MG2026',
    database: DB,
    multipleStatements: true,
  });

  // 1. OBTENER TODAS LAS TABLAS EXISTENTES
  const [tableRows] = await connection.query(
    'SELECT TABLE_NAME as name FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_TYPE="BASE TABLE"',
    [DB]
  );
  const existingTables = tableRows.map((r) => r.name);
  console.log(`📋 Total tablas detectadas: ${existingTables.length}`);

  // 2. CREAR BACKUP COMPLETO (JSON) ANTES DE LIMPIAR
  const backupDir = path.join(__dirname, 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupJsonPath = path.join(backupDir, `backup_completo_con_datos_prueba_${timestamp}.json`);

  console.log('\n📦 Generando copia de seguridad de todos los datos actuales...');
  const fullBackup = {};
  for (const table of existingTables) {
    const [rows] = await connection.query(`SELECT * FROM \`${table}\``);
    fullBackup[table] = rows;
  }
  fs.writeFileSync(backupJsonPath, JSON.stringify(fullBackup, null, 2), 'utf8');
  console.log(`✅ Copia de seguridad guardada exitosamente en:\n   ${backupJsonPath}`);

  // 3. EJECUTAR LIMPIEZA DE TABLAS OPERATIVAS
  console.log('\n🧹 Limpiando tablas de datos operativos ficticios...');
  await connection.query('SET FOREIGN_KEY_CHECKS=0');

  for (const table of TABLES_TO_WIPE) {
    if (existingTables.includes(table)) {
      await connection.query(`DELETE FROM \`${table}\``);
      await connection.query(`ALTER TABLE \`${table}\` AUTO_INCREMENT = 1`);
      console.log(`  ✓ Vaciada tabla: ${table}`);
    }
  }

  // Limpiar usuarios de prueba secundarios conservando ÚNICAMENTE al Super Administrador (id: 1)
  if (existingTables.includes('usuarios')) {
    const [delUsers] = await connection.query('DELETE FROM usuarios WHERE id > 1');
    console.log(`  ✓ Usuarios secundarios eliminados: ${delUsers.affectedRows} (Se preservó @superadmin)`);
  }

  // Limpiar personas secundarias conservando la persona del superadmin
  if (existingTables.includes('personas')) {
    const [delPersonas] = await connection.query(
      'DELETE FROM personas WHERE id_persona NOT IN (SELECT persona_id FROM usuarios WHERE id = 1 AND persona_id IS NOT NULL)'
    );
    console.log(`  ✓ Personas secundarias eliminadas: ${delPersonas.affectedRows}`);
  }

  await connection.query('SET FOREIGN_KEY_CHECKS=1');

  // 4. VERIFICACIÓN DE ESTADO
  console.log('\n🔍 VERIFICACIÓN DE DATOS PRESERVADOS:');
  const [[superAdminRow]] = await connection.query(
    'SELECT u.id, u.username, u.email, r.codigo as rol FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.id = 1'
  );
  console.log(`  👤 Super Administrador: @${superAdminRow?.username} (${superAdminRow?.email}) - Rol: ${superAdminRow?.rol}`);

  const [[catCount]] = await connection.query('SELECT COUNT(*) as count FROM categorias');
  console.log(`  📁 Categorías en Catálogo Maestro: ${catCount.count}`);

  const [[marcaCount]] = await connection.query('SELECT COUNT(*) as count FROM marcas');
  console.log(`  🏷️  Marcas en Catálogo Maestro: ${marcaCount.count}`);

  const [[modeloCount]] = await connection.query('SELECT COUNT(*) as count FROM modelos');
  console.log(`  💻 Modelos en Catálogo Maestro: ${modeloCount.count}`);

  const [[sucursalCount]] = await connection.query('SELECT COUNT(*) as count FROM sucursales');
  console.log(`  🏢 Sedes / Sucursales activas: ${sucursalCount.count}`);

  const [[rolCount]] = await connection.query('SELECT COUNT(*) as count FROM roles');
  console.log(`  🛡️  Roles de Sistema activos: ${rolCount.count}`);

  // 5. EXPORTAR DUMP SQL LIMPIO PARA PRODUCCIÓN
  console.log('\n📄 Exportando database_clean_production.sql para importar en el servidor en la nube...');
  let sqlDump = `-- ========================================================\n`;
  sqlDump += `-- MG SOLUTIONS GROUP S.A.C. - BASE DE DATOS DE PRODUCCIÓN\n`;
  sqlDump += `-- Generado: ${new Date().toISOString()}\n`;
  sqlDump += `-- Contiene: Superadmin, Roles, Permisos, Catálogo Maestro y Sedes.\n`;
  sqlDump += `-- Tablas operativas limpias listas para uso en vivo.\n`;
  sqlDump += `-- ========================================================\n\n`;
  sqlDump += `SET FOREIGN_KEY_CHECKS=0;\nSET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";\n\n`;

  for (const table of existingTables) {
    const [[createTable]] = await connection.query(`SHOW CREATE TABLE \`${table}\``);
    sqlDump += `-- Estructura de tabla \`${table}\`\n`;
    sqlDump += `DROP TABLE IF EXISTS \`${table}\`;\n`;
    sqlDump += `${createTable['Create Table']};\n\n`;

    const [rows] = await connection.query(`SELECT * FROM \`${table}\``);
    if (rows.length > 0) {
      sqlDump += `-- Datos de tabla \`${table}\` (${rows.length} registros)\n`;
      const cols = Object.keys(rows[0]).map((c) => `\`${c}\``).join(', ');
      const valuesArr = rows.map((row) => {
        const valStrings = Object.values(row).map((val) => {
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'number' || typeof val === 'boolean') return val;
          if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
          if (Buffer.isBuffer(val)) return `X'${val.toString('hex')}'`;
          return `'${String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
        });
        return `(${valStrings.join(', ')})`;
      });

      sqlDump += `INSERT INTO \`${table}\` (${cols}) VALUES\n${valuesArr.join(',\n')};\n\n`;
    }
  }

  sqlDump += `SET FOREIGN_KEY_CHECKS=1;\n`;

  const cleanSqlPath = path.join(__dirname, '..', 'database_clean_production.sql');
  fs.writeFileSync(cleanSqlPath, sqlDump, 'utf8');
  console.log(`✅ Archivo exportado exitosamente:\n   ${cleanSqlPath}`);
  console.log('\n====================================================');
  console.log('🎉 BASE DE DATOS LISTA PARA SUBIR A LA NUBE');
  console.log('====================================================\n');

  await connection.end();
}

main().catch((err) => {
  console.error('❌ Error ejecutando limpieza de BD:', err);
  process.exit(1);
});
