const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateAlmacen() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3307'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mg_solutions_db'
  });

  console.log('--- Iniciando migración para Módulo Almacén ---');

  // 1. Agregar requiere_serie a categorias si no existe
  const [catCols] = await conn.query("SHOW COLUMNS FROM categorias LIKE 'requiere_serie'");
  if (catCols.length === 0) {
    await conn.query("ALTER TABLE categorias ADD COLUMN requiere_serie TINYINT(1) NOT NULL DEFAULT 0 AFTER descripcion");
    console.log('✓ Columna requiere_serie agregada a categorias');
  }

  // Marcar laptops e impresoras y monitores como requiere_serie = 1
  await conn.query("UPDATE categorias SET requiere_serie = 1 WHERE id IN (1, 2, 3)");
  console.log('✓ Categorías Laptops, Impresoras y Monitores configuradas con requiere_serie = 1');

  // 2. Agregar columnas a productos si no existen
  const [prodCols] = await conn.query("SHOW COLUMNS FROM productos");
  const prodColNames = prodCols.map(c => c.Field);

  if (!prodColNames.includes('modelo_id')) {
    await conn.query("ALTER TABLE productos ADD COLUMN modelo_id INT NULL AFTER marca_id, ADD CONSTRAINT fk_productos_modelo FOREIGN KEY (modelo_id) REFERENCES modelos(id) ON DELETE SET NULL");
    console.log('✓ Columna modelo_id agregada a productos con FK a modelos');
  }

  if (!prodColNames.includes('requiere_serie')) {
    await conn.query("ALTER TABLE productos ADD COLUMN requiere_serie TINYINT(1) NOT NULL DEFAULT 0 AFTER modelo_id");
    console.log('✓ Columna requiere_serie agregada a productos');
  }

  if (!prodColNames.includes('disponible_venta')) {
    await conn.query("ALTER TABLE productos ADD COLUMN disponible_venta TINYINT(1) NOT NULL DEFAULT 1 AFTER requiere_serie");
    console.log('✓ Columna disponible_venta agregada a productos');
  }

  if (!prodColNames.includes('tipo_destino')) {
    await conn.query("ALTER TABLE productos ADD COLUMN tipo_destino ENUM('VENTA', 'SERVICIO_TALLER', 'MIXTO') NOT NULL DEFAULT 'VENTA' AFTER disponible_venta");
    console.log('✓ Columna tipo_destino agregada a productos');
  }

  // 3. Agregar estados de unidad a estados_unidad
  const [estadosU] = await conn.query("SELECT codigo FROM estados_unidad");
  const codigos = estadosU.map(e => e.codigo);

  if (!codigos.includes('DANADO_CUARENTENA')) {
    await conn.query("INSERT INTO estados_unidad (id, codigo, nombre, estado_id, created_at) VALUES (5, 'DANADO_CUARENTENA', 'Dañado / Cuarentena (Oculto de Venta)', 1, NOW())");
    console.log('✓ Estado DANADO_CUARENTENA insertado');
  }

  if (!codigos.includes('BAJA_MERMA')) {
    await conn.query("INSERT INTO estados_unidad (id, codigo, nombre, estado_id, created_at) VALUES (6, 'BAJA_MERMA', 'Baja / Merma (Descarte)', 1, NOW())");
    console.log('✓ Estado BAJA_MERMA insertado');
  }

  // 4. Crear tabla producto_unidades_series si no existe
  await conn.query(`
    CREATE TABLE IF NOT EXISTS producto_unidades (
      id INT AUTO_INCREMENT PRIMARY KEY,
      producto_id INT NOT NULL,
      sucursal_id INT NOT NULL DEFAULT 1,
      numero_serie VARCHAR(100) NOT NULL,
      estado_unidad_id INT NOT NULL DEFAULT 1,
      tipo_destino ENUM('VENTA', 'SERVICIO_TALLER', 'MIXTO') NOT NULL DEFAULT 'VENTA',
      disponible_venta TINYINT(1) NOT NULL DEFAULT 1,
      condicion ENUM('NUEVO', 'USADO', 'OPEN_BOX', 'DANADO_RECEPCION', 'DEFECTUOSO') NOT NULL DEFAULT 'NUEVO',
      observaciones TEXT NULL,
      costo_adquisicion DECIMAL(10, 2) NULL,
      fecha_ingreso DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_pu_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
      CONSTRAINT fk_pu_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales(id),
      CONSTRAINT fk_pu_estado_unidad FOREIGN KEY (estado_unidad_id) REFERENCES estados_unidad(id),
      INDEX idx_pu_serie (numero_serie),
      INDEX idx_pu_prod_estado (producto_id, estado_unidad_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ Tabla producto_unidades verificada/creada con éxito');

  // 5. Insertar datos de prueba iniciales para modelos existentes si productos está vacío
  const [prodsCount] = await conn.query('SELECT COUNT(*) as cnt FROM productos');
  if (prodsCount[0].cnt === 0) {
    console.log('--- Creando productos de ejemplo vinculados a modelos ---');
    // Laptop ThinkPad X1 Carbon (modelo 1, marca 1 Lenovo, categoria 1)
    const [ins1] = await conn.query(`
      INSERT INTO productos (codigo, nombre, descripcion, categoria_id, marca_id, modelo_id, precio_venta, precio_costo, stock_minimo, requiere_serie, disponible_venta, tipo_destino, estado_id, created_at, updated_at)
      VALUES ('LAP-LEN-X1', 'Laptop Lenovo ThinkPad X1 Carbon Gen 14 Aura Edition', 'Ultrabook corporativo 14\" OLED Intel Core Ultra 7 32GB 1TB SSD', 1, 1, 1, 7899.00, 6200.00, 2, 1, 1, 'VENTA', 1, NOW(), NOW())
    `);
    const prod1Id = ins1.insertId;

    // Laptop Lenovo Googlebook 15 (modelo 2, marca 1 Lenovo, categoria 1)
    const [ins2] = await conn.query(`
      INSERT INTO productos (codigo, nombre, descripcion, categoria_id, marca_id, modelo_id, precio_venta, precio_costo, stock_minimo, requiere_serie, disponible_venta, tipo_destino, estado_id, created_at, updated_at)
      VALUES ('LAP-LEN-GB15', 'Laptop Lenovo Googlebook 15 Core i5', 'Portátil 15.6\" FHD Core i5-1335U 16GB 512GB SSD', 1, 1, 2, 2850.00, 2200.00, 3, 1, 1, 'VENTA', 1, NOW(), NOW())
    `);
    const prod2Id = ins2.insertId;

    // Impresora Epson EcoTank (marca 6 Epson, categoria 2)
    // Crear modelo de impresora si no existe
    let modeloImpId = 8;
    const [modImp] = await conn.query("SELECT id FROM modelos WHERE nombre LIKE '%L3250%' LIMIT 1");
    if (modImp.length > 0) {
      modeloImpId = modImp[0].id;
    } else {
      const [insModImp] = await conn.query(`
        INSERT INTO modelos (marca_id, nombre, descripcion, estado_id, created_at)
        VALUES (6, 'EcoTank L3250 WiFi', 'Multifuncional inalámbrica con sistema continuo original de tinta', 1, NOW())
      `);
      modeloImpId = insModImp.insertId;
      await conn.query(`
        INSERT INTO detalle_modelo (modelo_id, atributo, valor) VALUES
        (${modeloImpId}, 'Tecnología de Impresión', 'Inyección de tinta Heat-Free MicroPiezo'),
        (${modeloImpId}, 'Resolución Máxima', '5760 x 1440 dpi'),
        (${modeloImpId}, 'Velocidad de Impresión', 'Negro 33 ppm / Color 15 ppm'),
        (${modeloImpId}, 'Conectividad', 'WiFi Direct, USB 2.0 de alta velocidad')
      `);
    }

    const [ins3] = await conn.query(`
      INSERT INTO productos (codigo, nombre, descripcion, categoria_id, marca_id, modelo_id, precio_venta, precio_costo, stock_minimo, requiere_serie, disponible_venta, tipo_destino, estado_id, created_at, updated_at)
      VALUES ('IMP-EPS-L3250', 'Impresora Multifuncional Epson EcoTank L3250 WiFi', 'Sistema continuo original tintas T544', 2, 6, ${modeloImpId}, 850.00, 680.00, 2, 1, 1, 'VENTA', 1, NOW(), NOW())
    `);
    const prod3Id = ins3.insertId;

    // Repuesto de taller: Disco SSD Kingston NV2 1TB (categoria 5, marca Kingston o HP)
    const [ins4] = await conn.query(`
      INSERT INTO productos (codigo, nombre, descripcion, categoria_id, marca_id, modelo_id, precio_venta, precio_costo, stock_minimo, requiere_serie, disponible_venta, tipo_destino, estado_id, created_at, updated_at)
      VALUES ('REP-SSD-1TB', 'SSD Kingston NV2 1TB NVMe M.2 2280', 'Almacenamiento de alta velocidad PCIe 4.0', 5, 2, NULL, 280.00, 195.00, 5, 0, 1, 'MIXTO', 1, NOW(), NOW())
    `);
    const prod4Id = ins4.insertId;

    // Repuesto de uso interno de taller: Pasta térmica Arctic MX-4 (categoria 6)
    const [ins5] = await conn.query(`
      INSERT INTO productos (codigo, nombre, descripcion, categoria_id, marca_id, modelo_id, precio_venta, precio_costo, stock_minimo, requiere_serie, disponible_venta, tipo_destino, estado_id, created_at, updated_at)
      VALUES ('REP-PAS-MX4', 'Pasta Térmica Arctic MX-4 4g Taller', 'Insumo técnico para mantenimiento preventivo', 6, 2, NULL, 35.00, 20.00, 10, 0, 0, 'SERVICIO_TALLER', 1, NOW(), NOW())
    `);
    const prod5Id = ins5.insertId;

    // Registrar stock en sedes
    await conn.query(`
      INSERT INTO producto_stock_sede (producto_id, sucursal_id, stock, updated_at) VALUES
      (${prod1Id}, 1, 3, NOW()),
      (${prod2Id}, 1, 4, NOW()),
      (${prod3Id}, 1, 5, NOW()),
      (${prod4Id}, 1, 15, NOW()),
      (${prod5Id}, 1, 8, NOW())
    `);

    // Insertar series reales para las laptops e impresoras (incluyendo una en cuarentena y una para taller)
    await conn.query(`
      INSERT INTO producto_unidades (producto_id, sucursal_id, numero_serie, estado_unidad_id, tipo_destino, disponible_venta, condicion, observaciones) VALUES
      -- Laptop ThinkPad X1
      (${prod1Id}, 1, 'LNV-X1C-2026-001', 1, 'VENTA', 1, 'NUEVO', 'Unidad en vitrina principal'),
      (${prod1Id}, 1, 'LNV-X1C-2026-002', 1, 'VENTA', 1, 'NUEVO', 'Sellado en caja'),
      (${prod1Id}, 1, 'LNV-X1C-2026-003', 5, 'VENTA', 0, 'DANADO_RECEPCION', 'Caja llegó golpeada en esquina, bisagra desajustada. Separado para reclamo a proveedor'),

      -- Laptop Lenovo Googlebook 15
      (${prod2Id}, 1, 'LNV-GB15-994101', 1, 'VENTA', 1, 'NUEVO', 'Disponible para venta'),
      (${prod2Id}, 1, 'LNV-GB15-994102', 1, 'VENTA', 1, 'NUEVO', 'Disponible para venta'),
      (${prod2Id}, 1, 'LNV-GB15-994103', 1, 'VENTA', 1, 'NUEVO', 'Disponible para venta'),
      (${prod2Id}, 1, 'LNV-GB15-994104', 3, 'SERVICIO_TALLER', 0, 'USADO', 'Asignada a equipo de demostración y pruebas técnicas'),

      -- Impresora Epson L3250
      (${prod3Id}, 1, 'EPS-L3250-X58821', 1, 'VENTA', 1, 'NUEVO', 'Mostrador'),
      (${prod3Id}, 1, 'EPS-L3250-X58822', 1, 'VENTA', 1, 'NUEVO', 'Almacén central'),
      (${prod3Id}, 1, 'EPS-L3250-X58823', 1, 'VENTA', 1, 'NUEVO', 'Almacén central'),
      (${prod3Id}, 1, 'EPS-L3250-X58824', 5, 'VENTA', 0, 'DEFECTUOSO', 'Llegó con derrame interno de tinta en el empaque. Bloqueado de venta'),
      (${prod3Id}, 1, 'EPS-L3250-X58825', 1, 'VENTA', 1, 'NUEVO', 'Almacén central')
    `);

    console.log('✓ Productos, stock por sede y unidades con número de serie generados exitosamente');
  }

  await conn.end();
  console.log('--- Migración completada con éxito ---');
}

migrateAlmacen().catch(err => {
  console.error('Error en migración:', err);
  process.exit(1);
});
