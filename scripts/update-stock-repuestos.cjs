const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3307', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'MG2026',
    database: process.env.DB_NAME || 'mg_solutions_db',
  });

  console.log('Conectado a MySQL para actualizar stock de repuestos en producto_stock_sede...');

  const [prods] = await connection.query(
    "SELECT p.id, p.codigo, p.nombre FROM productos p WHERE p.codigo LIKE 'REP-%' OR p.codigo LIKE 'INS-%'"
  );

  console.log(`Encontrados ${prods.length} repuestos para actualizar stock.`);

  for (const p of prods) {
    let cant = 15;
    if (p.codigo.includes('PAN')) cant = 10;
    if (p.codigo.includes('RAM')) cant = 20;
    if (p.codigo.includes('SSD')) cant = 15;
    if (p.codigo.includes('PAS')) cant = 30;
    if (p.codigo.includes('BAT')) cant = 8;
    if (p.codigo.includes('PIN')) cant = 12;

    // Asignar stock en Sucursal 1 (Principal)
    await connection.query(
      'INSERT INTO producto_stock_sede (producto_id, sucursal_id, stock) VALUES (?, 1, ?) ON DUPLICATE KEY UPDATE stock = ?',
      [p.id, cant, cant]
    );

    console.log(`✓ Stock asignado: [${p.codigo}] ${p.nombre} -> Stock: ${cant} unidades en Sede Principal`);
  }

  // Verificar resultado
  const [res] = await connection.query(`
    SELECT p.id, p.codigo, p.nombre, pss.stock
    FROM productos p
    JOIN producto_stock_sede pss ON p.id = pss.producto_id AND pss.sucursal_id = 1
    WHERE p.codigo LIKE 'REP-%' OR p.codigo LIKE 'INS-%'
  `);
  console.log('Resultado en producto_stock_sede:', res);

  await connection.end();
  console.log('Actualización de stock completada.');
}

main().catch(console.error);
