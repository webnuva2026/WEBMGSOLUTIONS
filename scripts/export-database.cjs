const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function dumpDatabase() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: 'MG2026',
    database: 'mg_solutions_db',
  });

  console.log('Conectado a MySQL para volcado de esquema y datos...');

  let sql = `-- =====================================================================\n`;
  sql += `-- MG SOLUTIONS ERP - ESQUEMA Y DATOS COMPLETOS DE LA BASE DE DATOS\n`;
  sql += `-- Base de Datos: mg_solutions_db\n`;
  sql += `-- Fecha de generación: ${new Date().toISOString()}\n`;
  sql += `-- =====================================================================\n\n`;

  sql += `CREATE DATABASE IF NOT EXISTS \`mg_solutions_db\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n`;
  sql += `USE \`mg_solutions_db\`;\n\n`;
  sql += `SET FOREIGN_KEY_CHECKS = 0;\n`;
  sql += `SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";\n`;
  sql += `SET NAMES utf8mb4;\n\n`;

  const [tables] = await conn.query('SHOW TABLES');
  const tableNames = tables.map((t) => Object.values(t)[0]);
  console.log(`Encontradas ${tableNames.length} tablas para exportar...`);

  for (const table of tableNames) {
    const [[createRes]] = await conn.query(`SHOW CREATE TABLE \`${table}\``);
    sql += `-- -------------------------------------------------------------------\n`;
    sql += `-- Estructura de tabla para: \`${table}\`\n`;
    sql += `-- -------------------------------------------------------------------\n`;
    sql += `DROP TABLE IF EXISTS \`${table}\`;\n`;
    sql += `${createRes['Create Table']};\n\n`;

    const [rows] = await conn.query(`SELECT * FROM \`${table}\``);
    if (rows.length > 0) {
      sql += `-- Datos volcados para: \`${table}\` (${rows.length} registros)\n`;
      const cols = Object.keys(rows[0]).map((c) => `\`${c}\``).join(', ');

      for (const row of rows) {
        const vals = Object.keys(row)
          .map((colName) => {
            const v = row[colName];
            if (v === null || v === undefined) return 'NULL';
            if (typeof v === 'number') return v;
            if (typeof v === 'boolean') return v ? 1 : 0;
            if (v instanceof Date) {
              return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`;
            }
            if (Buffer.isBuffer(v)) {
              return `0x${v.toString('hex')}`;
            }

            // Tratamiento especial para campos tipo JSON (ej: modulos_predeterminados)
            if (colName === 'modulos_predeterminados') {
              let jsonStr = '';
              if (typeof v === 'string') {
                if (v.startsWith('[') || v.startsWith('{')) {
                  jsonStr = v;
                } else {
                  // Si viene como lista separada por comas: 'ventas,caja' -> convertimos a JSON válido
                  jsonStr = JSON.stringify(v.split(',').map((s) => s.trim()).filter(Boolean));
                }
              } else {
                jsonStr = JSON.stringify(v);
              }
              return `'${jsonStr.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
            }

            if (typeof v === 'object') {
              return `'${JSON.stringify(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
            }

            const cleanStr = String(v)
              .replace(/\\/g, '\\\\')
              .replace(/'/g, "\\'")
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r');
            return `'${cleanStr}'`;
          })
          .join(', ');

        sql += `INSERT INTO \`${table}\` (${cols}) VALUES (${vals});\n`;
      }
      sql += `\n`;
    }
  }

  sql += `SET FOREIGN_KEY_CHECKS = 1;\n`;
  sql += `-- =====================================================================\n`;
  sql += `-- FIN DEL VOLCADO DE BASE DE DATOS\n`;
  sql += `-- =====================================================================\n`;

  const rootSqlPath = path.resolve(__dirname, '../database_mg_solutions.sql');
  const scriptsSqlPath = path.resolve(__dirname, 'recrear-tablas.sql');

  fs.writeFileSync(rootSqlPath, sql, 'utf8');
  fs.writeFileSync(scriptsSqlPath, sql, 'utf8');

  console.log(`✅ Archivo exportado con éxito a:`);
  console.log(`   1. ${rootSqlPath} (${(sql.length / 1024).toFixed(1)} KB)`);
  console.log(`   2. ${scriptsSqlPath} (${(sql.length / 1024).toFixed(1)} KB)`);

  await conn.end();
}

dumpDatabase().catch((err) => {
  console.error('Error durante el volcado:', err);
  process.exit(1);
});
