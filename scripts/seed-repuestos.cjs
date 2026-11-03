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

  console.log('Conectado a MySQL para poblar repuestos iniciales...');

  const repuestos = [
    { codigo: 'REP-PAN-156', nombre: 'Pantalla LED 15.6 Slim 30 Pines FHD IPS', cat: 6, precio: 220.0, costo: 150.0, stock: 12 },
    { codigo: 'REP-PAN-140', nombre: 'Pantalla LED 14.0 Slim 30 Pines HD/FHD', cat: 6, precio: 195.0, costo: 130.0, stock: 8 },
    { codigo: 'REP-TEC-LNV', nombre: 'Teclado Español Lenovo ThinkPad / IdeaPad', cat: 6, precio: 85.0, costo: 45.0, stock: 15 },
    { codigo: 'REP-TEC-HP', nombre: 'Teclado Español HP Pavilion 15 / 250 G7', cat: 6, precio: 80.0, costo: 42.0, stock: 10 },
    { codigo: 'REP-RAM-8GB', nombre: 'Memoria RAM DDR4 8GB 3200MHz Kingston Laptop', cat: 5, precio: 95.0, costo: 65.0, stock: 25 },
    { codigo: 'REP-RAM-16GB', nombre: 'Memoria RAM DDR5 16GB 4800MHz Crucial Laptop', cat: 5, precio: 185.0, costo: 130.0, stock: 14 },
    { codigo: 'REP-SSD-500', nombre: 'Disco Solido SSD NVMe M.2 500GB Kingston NV2', cat: 5, precio: 145.0, costo: 105.0, stock: 20 },
    { codigo: 'REP-SSD-1TB', nombre: 'Disco Solido SSD NVMe M.2 1TB Crucial P3', cat: 5, precio: 240.0, costo: 180.0, stock: 10 },
    { codigo: 'INS-PAS-MX4', nombre: 'Pasta Térmica Arctic MX-4 4g Alto Rendimiento', cat: 6, precio: 35.0, costo: 18.0, stock: 30 },
    { codigo: 'REP-BAT-HP', nombre: 'Batería Original HP HT03XL Pavilion 14/15', cat: 6, precio: 135.0, costo: 90.0, stock: 6 },
    { codigo: 'REP-PIN-LNV', nombre: 'Pin de Carga Jack DC Lenovo Ideapad 330/S145', cat: 6, precio: 40.0, costo: 15.0, stock: 18 },
  ];

  for (const r of repuestos) {
    const [exist] = await connection.query('SELECT id FROM productos WHERE codigo = ?', [r.codigo]);
    if (exist.length === 0) {
      const [insRes] = await connection.query(
        `INSERT INTO productos (
          codigo, nombre, descripcion, categoria_id, marca_id, modelo_id,
          requiere_serie, disponible_venta, tipo_destino, precio_venta, precio_costo,
          stock_minimo, estado_id, created_at
        ) VALUES (?, ?, ?, ?, 1, NULL, 0, 0, 'SERVICIO_TALLER', ?, ?, 2, 1, NOW())`,
        [r.codigo, r.nombre, r.nombre, r.cat, r.precio, r.costo]
      );
      const prodId = insRes.insertId;

      // Registrar stock en stock_sucursales si existe la tabla
      try {
        await connection.query(
          'INSERT INTO stock_sucursales (producto_id, sucursal_id, stock_actual) VALUES (?, 1, ?) ON DUPLICATE KEY UPDATE stock_actual = ?',
          [prodId, r.stock, r.stock]
        );
      } catch (e) {
        // Ignorar si no existe tabla stock_sucursales
      }

      console.log(`✓ Repuesto insertado: [${r.codigo}] ${r.nombre}`);
    } else {
      console.log(`ℹ️ Repuesto ya existe: [${r.codigo}]`);
    }
  }

  await connection.end();
  console.log('Finalizado registro de repuestos.');
}

main().catch(console.error);
