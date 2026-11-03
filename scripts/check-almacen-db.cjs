const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3307'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mg_solutions_db'
  });

  const [tables] = await conn.query("SHOW TABLES LIKE '%serie%'");
  console.log('Tables like serie:', tables);
  const [stockSede] = await conn.query('SELECT * FROM producto_stock_sede LIMIT 5');
  console.log('producto_stock_sede:', stockSede);
  const [prods] = await conn.query('SELECT * FROM productos LIMIT 5');
  console.log('productos sample:', prods);
  const [mods] = await conn.query('SELECT * FROM modelos LIMIT 5');
  console.log('modelos sample:', mods);
  const [detMods] = await conn.query('SELECT * FROM detalle_modelo LIMIT 10');
  console.log('detalle_modelo sample:', detMods);

  await conn.end();
}

check().catch(console.error);
