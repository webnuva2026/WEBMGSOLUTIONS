const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'MG2026',
    database: process.env.DB_NAME || 'mg_solutions_db',
  });

  try {
    console.log('Verificando columnas de ámbitos en la tabla categorias...');
    const [cols] = await connection.query(`SHOW COLUMNS FROM categorias`);
    const colNames = cols.map(c => c.Field);

    if (!colNames.includes('es_equipo_taller')) {
      console.log('Agregando columna es_equipo_taller...');
      await connection.query(`ALTER TABLE categorias ADD COLUMN es_equipo_taller TINYINT(1) NOT NULL DEFAULT 0 AFTER descripcion`);
    }

    if (!colNames.includes('es_venta')) {
      console.log('Agregando columna es_venta...');
      await connection.query(`ALTER TABLE categorias ADD COLUMN es_venta TINYINT(1) NOT NULL DEFAULT 1 AFTER es_equipo_taller`);
    }

    if (!colNames.includes('es_repuesto_taller')) {
      console.log('Agregando columna es_repuesto_taller...');
      await connection.query(`ALTER TABLE categorias ADD COLUMN es_repuesto_taller TINYINT(1) NOT NULL DEFAULT 0 AFTER es_venta`);
    }

    console.log('Columnas de ámbitos verificadas/agregadas con éxito.');

    // Eliminar categoría basura de prueba si existe
    await connection.query(`DELETE FROM categorias WHERE nombre LIKE '%FAIL-%'`);

    // Actualizar ámbitos de categorías estándar
    const updates = [
      {
        nombre: 'LAPTOPS & NOTEBOOKS',
        es_equipo_taller: 1,
        es_venta: 1,
        es_repuesto_taller: 0,
      },
      {
        nombre: 'IMPRESORAS & MULTIFUNCIONALES',
        es_equipo_taller: 1,
        es_venta: 1,
        es_repuesto_taller: 0,
      },
      {
        nombre: 'MONITORES & PANTALLAS',
        es_equipo_taller: 1,
        es_venta: 1,
        es_repuesto_taller: 0,
      },
      {
        nombre: 'PERIFÉRICOS & ACCESORIOS',
        es_equipo_taller: 0,
        es_venta: 1,
        es_repuesto_taller: 0,
      },
      {
        nombre: 'SUMINISTROS & TINTAS',
        es_equipo_taller: 0,
        es_venta: 1,
        es_repuesto_taller: 0,
      },
      {
        nombre: 'COMPONENTES & HARDWARE',
        es_equipo_taller: 0,
        es_venta: 1,
        es_repuesto_taller: 1,
      },
      {
        nombre: 'REPUESTOS DE TALLER',
        es_equipo_taller: 0,
        es_venta: 0,
        es_repuesto_taller: 1,
      },
    ];

    for (const u of updates) {
      await connection.query(
        `UPDATE categorias 
         SET es_equipo_taller = ?, es_venta = ?, es_repuesto_taller = ? 
         WHERE UPPER(nombre) = ?`,
        [u.es_equipo_taller, u.es_venta, u.es_repuesto_taller, u.nombre]
      );
    }

    console.log('✅ Ámbitos asignados correctamente a las categorías.');

    const [rows] = await connection.query(`SELECT id, nombre, es_equipo_taller, es_venta, es_repuesto_taller FROM categorias`);
    console.log('Categorías actualizadas:', rows);

  } catch (error) {
    console.error('Error durante la migración:', error);
  } finally {
    await connection.end();
  }
}

runMigration();
