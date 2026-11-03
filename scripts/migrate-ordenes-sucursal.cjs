const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'MG2026',
    database: process.env.DB_NAME || 'mg_solutions_db',
  });

  try {
    const [cols] = await conn.query("SHOW COLUMNS FROM ordenes_servicio LIKE 'sucursal_id'");
    if (cols.length === 0) {
      console.log('Agregando columna sucursal_id a ordenes_servicio...');
      await conn.query('ALTER TABLE ordenes_servicio ADD COLUMN sucursal_id INT NOT NULL DEFAULT 1 AFTER cliente_id');
      try {
        await conn.query('ALTER TABLE ordenes_servicio ADD CONSTRAINT fk_os_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales(id)');
      } catch (e) {
        console.warn('Constraint ya existia o advertencia:', e.message);
      }
      try {
        await conn.query('CREATE INDEX idx_os_sucursal ON ordenes_servicio(sucursal_id)');
      } catch (e) {
        console.warn('Indice ya existia:', e.message);
      }
      console.log('Columna sucursal_id agregada con éxito.');
    } else {
      console.log('La columna sucursal_id ya existe en ordenes_servicio.');
    }

    // Actualizar órdenes existentes
    await conn.query(`
      UPDATE ordenes_servicio os 
      LEFT JOIN usuarios u ON os.usuario_recibe_id = u.id 
      SET os.sucursal_id = COALESCE(u.sucursal_id, 1)
    `);
    console.log('Órdenes de servicio actualizadas con sucursal_id.');

    const [sample] = await conn.query(`
      SELECT os.id, os.codigo, os.sucursal_id, s.nombre as sucursalNombre 
      FROM ordenes_servicio os 
      JOIN sucursales s ON os.sucursal_id = s.id 
      LIMIT 5
    `);
    console.log('Muestra de órdenes:', sample);
  } finally {
    await conn.end();
  }
}

run().catch((err) => {
  console.error('Error en migración:', err);
  process.exit(1);
});

