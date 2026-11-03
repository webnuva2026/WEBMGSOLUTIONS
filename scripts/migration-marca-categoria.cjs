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
    console.log('Verificando columna categoria_id en tabla marcas...');
    const [cols] = await connection.query(`SHOW COLUMNS FROM marcas LIKE 'categoria_id'`);
    if (cols.length === 0) {
      console.log('Agregando columna categoria_id a tabla marcas...');
      await connection.query(`
        ALTER TABLE marcas 
        ADD COLUMN categoria_id INT NULL AFTER descripcion,
        ADD CONSTRAINT fk_marcas_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
      `);
      console.log('Columna categoria_id agregada con éxito.');
    } else {
      console.log('La columna categoria_id ya existe en marcas.');
    }

    // Listar categorías disponibles
    const [cats] = await connection.query(`SELECT id, nombre FROM categorias`);
    console.log('Categorías en BD:', cats);

    const laptopCat = cats.find(c => c.nombre.toUpperCase().includes('LAPTOP'));
    const printerCat = cats.find(c => c.nombre.toUpperCase().includes('IMPRESORA'));
    const monitorCat = cats.find(c => c.nombre.toUpperCase().includes('MONITOR'));
    const hardwareCat = cats.find(c => c.nombre.toUpperCase().includes('COMPONENTE') || c.nombre.toUpperCase().includes('HARDWARE'));

    // Asignar categorías lógicas por defecto a las marcas existentes si no tienen categoria_id
    if (laptopCat) {
      await connection.query(`
        UPDATE marcas 
        SET categoria_id = ? 
        WHERE (categoria_id IS NULL) AND nombre IN ('LENOVO', 'HP', 'DELL', 'ASUS', 'ACER', 'APPLE')
      `, [laptopCat.id]);
    }

    if (printerCat) {
      await connection.query(`
        UPDATE marcas 
        SET categoria_id = ? 
        WHERE (categoria_id IS NULL) AND nombre IN ('EPSON', 'CANON', 'BROTHER')
      `, [printerCat.id]);
    }

    if (monitorCat) {
      await connection.query(`
        UPDATE marcas 
        SET categoria_id = ? 
        WHERE (categoria_id IS NULL) AND nombre IN ('SAMSUNG', 'LG', 'VIEWSONIC', 'TEROS')
      `, [monitorCat.id]);
    }

    const [marcasRows] = await connection.query(`
      SELECT m.id, m.nombre, m.categoria_id, c.nombre as categoriaNombre 
      FROM marcas m 
      LEFT JOIN categorias c ON m.categoria_id = c.id
    `);
    console.log('Marcas actuales con categorías:', marcasRows);

    console.log('Migración completada con éxito.');
  } catch (err) {
    console.error('Error durante la migración:', err);
  } finally {
    await connection.end();
  }
}

runMigration();
