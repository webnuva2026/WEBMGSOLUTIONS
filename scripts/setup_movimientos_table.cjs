const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: 'MG2026',
    database: 'mg_solutions_db',
  });

  console.log('Conectado a MySQL...');

  await conn.query(`
    INSERT IGNORE INTO estados_movimiento (id, codigo, nombre, color_hex, estado_id, created_at)
    VALUES (6, 'DEVUELTO', 'Devuelto a Origen', '#059669', 1, NOW())
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS movimientos_inventario (
      id INT AUTO_INCREMENT PRIMARY KEY,
      codigo VARCHAR(30) NOT NULL UNIQUE,
      tipo ENUM('TRASLADO', 'PRESTAMO') NOT NULL DEFAULT 'TRASLADO',
      producto_id INT NOT NULL,
      sede_origen_id INT NOT NULL,
      sede_destino_id INT NOT NULL,
      cantidad INT NOT NULL DEFAULT 1,
      series TEXT NULL COMMENT 'Lista o JSON de series físicas',
      solicitado_por VARCHAR(150) NOT NULL,
      aprobado_por VARCHAR(150) NULL,
      recibido_por VARCHAR(150) NULL,
      estado_movimiento_id INT NOT NULL DEFAULT 1,
      motivo TEXT NULL,
      observaciones TEXT NULL,
      fecha_solicitud DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      fecha_aprobacion DATETIME NULL,
      fecha_envio DATETIME NULL,
      fecha_recepcion DATETIME NULL,
      fecha_devolucion DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_mov_producto FOREIGN KEY (producto_id) REFERENCES productos (id),
      CONSTRAINT fk_mov_origen FOREIGN KEY (sede_origen_id) REFERENCES sucursales (id),
      CONSTRAINT fk_mov_destino FOREIGN KEY (sede_destino_id) REFERENCES sucursales (id),
      CONSTRAINT fk_mov_estado FOREIGN KEY (estado_movimiento_id) REFERENCES estados_movimiento (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('Tabla movimientos_inventario y estado DEVUELTO creados correctamente!');
  await conn.end();
}

main().catch(console.error);
