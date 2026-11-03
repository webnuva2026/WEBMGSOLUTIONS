const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: 'MG2026',
    database: 'mg_solutions_db',
  });

  console.log('Conectado a MySQL. Creando tabla producto_series_garantia...');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS producto_series_garantia (
      id INT AUTO_INCREMENT PRIMARY KEY,
      venta_id INT NULL,
      producto_id INT NOT NULL,
      numero_serie VARCHAR(100) NOT NULL UNIQUE,
      cliente_id INT NULL,
      meses_garantia INT NOT NULL DEFAULT 12,
      fecha_venta DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      estado_garantia VARCHAR(50) NOT NULL DEFAULT 'ACTIVA',
      observaciones TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_psg_serie (numero_serie)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log('✅ Tabla producto_series_garantia creada con éxito.');

  // Sembrar 2 series de prueba si no existen
  const [rows] = await conn.query('SELECT COUNT(*) as total FROM producto_series_garantia');
  if (rows[0].total === 0) {
    console.log('🌱 Sembrando series de prueba para validación de garantías en mostrador...');
    
    // Obtener primer producto
    const [prods] = await conn.query('SELECT id FROM productos LIMIT 1');
    const prodId = prods.length > 0 ? prods[0].id : 1;

    // 1. Serie vigente (vendida hace 3 meses)
    const fechaVigente = new Date();
    fechaVigente.setMonth(fechaVigente.getMonth() - 3);

    await conn.query(
      `INSERT INTO producto_series_garantia (producto_id, numero_serie, meses_garantia, fecha_venta, estado_garantia, observaciones)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [prodId, 'SN-LEN-2026-VIG', 12, fechaVigente, 'ACTIVA', 'Laptop vendida con boleta B001-00452. Cliente: Juan Carlos Pérez.']
    );

    // 2. Serie vencida (vendida hace 14 meses)
    const fechaVencida = new Date();
    fechaVencida.setMonth(fechaVencida.getMonth() - 14);

    await conn.query(
      `INSERT INTO producto_series_garantia (producto_id, numero_serie, meses_garantia, fecha_venta, estado_garantia, observaciones)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [prodId, 'SN-HP-2025-EXP', 12, fechaVencida, 'EXPIRADA', 'Laptop vendida con factura F001-00120. Garantía expiró hace 2 meses.']
    );

    console.log('✅ Series de prueba sembradas:');
    console.log('   - SN-LEN-2026-VIG (Garantía VIGENTE)');
    console.log('   - SN-HP-2025-EXP (Garantía VENCIDA)');
  }

  await conn.end();
}

main().catch(console.error);
