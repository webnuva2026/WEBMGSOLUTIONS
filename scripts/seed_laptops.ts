import { pool } from '../server/config/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

async function seedLaptops() {
  console.log('--- Iniciando inserción y reactivación de Laptops en MySQL ---');

  // 1. Reactivar stock para los 5 productos existentes en la sede principal (id: 1) y sede 2
  const existingProds = [
    { id: 1, stockSede1: 6, stockSede2: 2, prefix: 'LNV-X1C' },
    { id: 2, stockSede1: 8, stockSede2: 3, prefix: 'LNV-GB15' },
    { id: 3, stockSede1: 7, stockSede2: 3, prefix: 'LNV-T14' },
    { id: 4, stockSede1: 9, stockSede2: 4, prefix: 'HP-PAV15' },
    { id: 5, stockSede1: 5, stockSede2: 2, prefix: 'ACR-HEL18' },
  ];

  for (const ep of existingProds) {
    // Actualizar producto disponible_venta = 1 y estado_id = 1
    await pool.query('UPDATE productos SET disponible_venta = 1, estado_id = 1 WHERE id = ?', [ep.id]);

    // Actualizar o insertar stock en producto_stock_sede para Sede 1
    await pool.query(
      `INSERT INTO producto_stock_sede (producto_id, sucursal_id, stock)
       VALUES (?, 1, ?)
       ON DUPLICATE KEY UPDATE stock = VALUES(stock)`,
      [ep.id, ep.stockSede1]
    );

    // Actualizar o insertar stock en producto_stock_sede para Sede 2
    await pool.query(
      `INSERT INTO producto_stock_sede (producto_id, sucursal_id, stock)
       VALUES (?, 2, ?)
       ON DUPLICATE KEY UPDATE stock = VALUES(stock)`,
      [ep.id, ep.stockSede2]
    );

    // Generar unidades disponibles con serie física en producto_unidades
    for (let i = 1; i <= ep.stockSede1; i++) {
      const serial = `${ep.prefix}-S1-${String(i).padStart(4, '0')}`;
      await pool.query(
        `INSERT IGNORE INTO producto_unidades (
          producto_id, sucursal_id, numero_serie, estado_unidad_id,
          tipo_destino, disponible_venta, condicion, observaciones, costo_adquisicion, fecha_ingreso
        ) VALUES (?, 1, ?, 1, 'VENTA', 1, 'NUEVO', 'Unidad en vitrina disponible para venta', 2000.00, NOW())`,
        [ep.id, serial]
      );
    }
  }

  console.log('✓ Stock de los 5 productos existentes restaurado con éxito.');

  // 2. Definición de 9 nuevas laptops completas
  const newLaptops = [
    {
      marcaId: 4, // ASUS
      codigo: 'LAP-ASU-ZEPH16',
      nombre: 'ASUS ROG Zephyrus G16 OLED Intel Ultra 9',
      descripcion: 'Laptop Gamer y de Creación Ultra Premium con chasis de aluminio CNC y pantalla OLED 2.5K.',
      modeloNombre: 'ROG Zephyrus G16 GU605',
      modeloDesc: 'Laptop gamer ultraportátil con Intel Core Ultra 9 y GeForce RTX 4070',
      precioVenta: 8499.00,
      precioCosto: 7100.00,
      stockMinimo: 2,
      stockSede1: 6,
      stockSede2: 2,
      detalles: [
        { atributo: 'Procesador', valor: 'Intel Core Ultra 9 185H (16 núcleos, hasta 5.1 GHz)' },
        { atributo: 'Memoria RAM', valor: '32GB LPDDR5X 7467 MHz' },
        { atributo: 'Almacenamiento', valor: '1TB SSD M.2 PCIe 4.0 NVMe' },
        { atributo: 'Tarjeta Gráfica', valor: 'NVIDIA GeForce RTX 4070 8GB GDDR6' },
        { atributo: 'Pantalla', valor: '16" 2.5K OLED 240Hz 0.2ms 500 nits ROG Nebula' },
        { atributo: 'Sistema Operativo', valor: 'Windows 11 Home 64-bit' },
      ],
      seriePrefix: 'ASU-ZEPH16',
    },
    {
      marcaId: 4, // ASUS
      codigo: 'LAP-ASU-TUF15',
      nombre: 'ASUS TUF Gaming A15 Ryzen 7 RTX 4060',
      descripcion: 'Resistencia militar MIL-STD-810H y rendimiento de alto impacto para gaming competitivo.',
      modeloNombre: 'TUF Gaming A15 FA507',
      modeloDesc: 'Portátil gamer resistente con AMD Ryzen 7 y GeForce RTX 4060',
      precioVenta: 4199.00,
      precioCosto: 3550.00,
      stockMinimo: 3,
      stockSede1: 8,
      stockSede2: 3,
      detalles: [
        { atributo: 'Procesador', valor: 'AMD Ryzen 7 7735HS (8 núcleos, 16 hilos)' },
        { atributo: 'Memoria RAM', valor: '16GB DDR5 4800 MHz (Expandible a 32GB)' },
        { atributo: 'Almacenamiento', valor: '512GB SSD M.2 NVMe PCIe 4.0' },
        { atributo: 'Tarjeta Gráfica', valor: 'NVIDIA GeForce RTX 4060 8GB GDDR6' },
        { atributo: 'Pantalla', valor: '15.6" Full HD IPS 144Hz Adaptive-Sync' },
        { atributo: 'Refrigeración', valor: 'Ventiladores Arc Flow con 4 salidas de aire' },
      ],
      seriePrefix: 'ASU-TUF15',
    },
    {
      marcaId: 3, // DELL
      codigo: 'LAP-DEL-LAT54',
      nombre: 'DELL Latitude 5440 14" Core i5 Corporativa',
      descripcion: 'Equipo empresarial ultra seguro, liviano y con gestión remota vPro para entornos exigentes.',
      modeloNombre: 'Latitude 5440 Business',
      modeloDesc: 'Línea corporativa Dell con seguridad avanzada y chasis reforzado',
      precioVenta: 3899.00,
      precioCosto: 3200.00,
      stockMinimo: 3,
      stockSede1: 10,
      stockSede2: 4,
      detalles: [
        { atributo: 'Procesador', valor: 'Intel Core i5-1335U vPro (10 núcleos, hasta 4.6 GHz)' },
        { atributo: 'Memoria RAM', valor: '16GB DDR4 3200 MHz' },
        { atributo: 'Almacenamiento', valor: '512GB SSD PCIe NVMe M.2 Class 35' },
        { atributo: 'Pantalla', valor: '14.0" FHD (1920x1080) Antirreflejo 250 nits' },
        { atributo: 'Seguridad', valor: 'Chip TPM 2.0, lector de huella dactilar, cámara IR' },
        { atributo: 'Conectividad', valor: 'Thunderbolt 4, RJ-45, Wi-Fi 6E' },
      ],
      seriePrefix: 'DEL-LAT54',
    },
    {
      marcaId: 3, // DELL
      codigo: 'LAP-DEL-INS15',
      nombre: 'DELL Inspiron 15 3520 Core i5 16GB',
      descripcion: 'Laptop versátil para productividad de oficina, estudios universitarios y navegación fluida.',
      modeloNombre: 'Inspiron 15 3520',
      modeloDesc: 'Portátil para uso diario con pantalla de 120Hz',
      precioVenta: 2450.00,
      precioCosto: 2050.00,
      stockMinimo: 2,
      stockSede1: 7,
      stockSede2: 3,
      detalles: [
        { atributo: 'Procesador', valor: 'Intel Core i5-1235U (10 núcleos, hasta 4.4 GHz)' },
        { atributo: 'Memoria RAM', valor: '16GB DDR4 2666 MHz' },
        { atributo: 'Almacenamiento', valor: '512GB SSD M.2 PCIe NVMe' },
        { atributo: 'Pantalla', valor: '15.6" FHD WVA 120Hz con bordes delgados' },
        { atributo: 'Teclado', valor: 'Español con teclado numérico integrado' },
      ],
      seriePrefix: 'DEL-INS15',
    },
    {
      marcaId: 2, // HP
      codigo: 'LAP-HP-VIC16',
      nombre: 'HP Victus 16 Core i7 RTX 4060 Gaming',
      descripcion: 'Gran pantalla de 16.1", refrigeración optimizada OMEN Gaming Hub y alto desempeño.',
      modeloNombre: 'Victus Gaming 16-r0000la',
      modeloDesc: 'Portátil gaming HP con pantalla de 16.1" y tarjeta gráfica RTX 4060',
      precioVenta: 4899.00,
      precioCosto: 4150.00,
      stockMinimo: 2,
      stockSede1: 6,
      stockSede2: 2,
      detalles: [
        { atributo: 'Procesador', valor: 'Intel Core i7-13700H (14 núcleos, hasta 5.0 GHz)' },
        { atributo: 'Memoria RAM', valor: '16GB DDR5 5200 MHz' },
        { atributo: 'Almacenamiento', valor: '1TB SSD PCIe Gen4 NVMe TLC M.2' },
        { atributo: 'Tarjeta Gráfica', valor: 'NVIDIA GeForce RTX 4060 8GB GDDR6' },
        { atributo: 'Pantalla', valor: '16.1" FHD IPS 144Hz antirreflejo' },
        { atributo: 'Audio', valor: 'Audio por B&O con altavoces dobles' },
      ],
      seriePrefix: 'HP-VIC16',
    },
    {
      marcaId: 2, // HP
      codigo: 'LAP-HP-PB450',
      nombre: 'HP ProBook 450 G10 Core i7 15.6" Pro',
      descripcion: 'Laptop para profesionales y ejecutivos con herramientas de colaboración HP Presence.',
      modeloNombre: 'ProBook 450 G10',
      modeloDesc: 'Laptop profesional con Intel Core i7 y diseño premium duradero',
      precioVenta: 3750.00,
      precioCosto: 3100.00,
      stockMinimo: 3,
      stockSede1: 8,
      stockSede2: 3,
      detalles: [
        { atributo: 'Procesador', valor: 'Intel Core i7-1355U (10 núcleos, hasta 5.0 GHz)' },
        { atributo: 'Memoria RAM', valor: '16GB DDR4 3200 MHz' },
        { atributo: 'Almacenamiento', valor: '512GB SSD PCIe NVMe Value M.2' },
        { atributo: 'Pantalla', valor: '15.6" FHD IPS antirreflejo 250 nits' },
        { atributo: 'Batería', valor: 'HP Long Life de 3 celdas, 51 Wh' },
      ],
      seriePrefix: 'HP-PB450',
    },
    {
      marcaId: 1, // LENOVO
      codigo: 'LAP-LNV-LEG5',
      nombre: 'LENOVO Legion Pro 5 16" Core i7 RTX 4070',
      descripcion: 'Potencia pura con Lenovo AI Engine+ y chip LA1 AI para FPS al máximo nivel.',
      modeloNombre: 'Legion Pro 5 16IRX9',
      modeloDesc: 'Gamer competitiva con pantalla 240Hz 500 nits y RTX 4070',
      precioVenta: 6999.00,
      precioCosto: 5850.00,
      stockMinimo: 2,
      stockSede1: 6,
      stockSede2: 2,
      detalles: [
        { atributo: 'Procesador', valor: 'Intel Core i7-14700HX (20 núcleos, 28 hilos, hasta 5.5 GHz)' },
        { atributo: 'Memoria RAM', valor: '32GB DDR5 5600 MHz' },
        { atributo: 'Almacenamiento', valor: '1TB SSD M.2 2280 PCIe 4.0 NVMe' },
        { atributo: 'Tarjeta Gráfica', valor: 'NVIDIA GeForce RTX 4070 8GB GDDR6 140W' },
        { atributo: 'Pantalla', valor: '16" WQXGA (2560x1600) IPS 240Hz 500nits 100% sRGB' },
        { atributo: 'Teclado', valor: 'Legion TrueStrike con retroiluminación RGB de 4 zonas' },
      ],
      seriePrefix: 'LNV-LEG5',
    },
    {
      marcaId: 5, // APPLE
      codigo: 'LAP-APP-MBA13',
      nombre: 'APPLE MacBook Air 13.6" Chip M2 256GB Midnight',
      descripcion: 'Increíblemente delgada y rápida con chip M2, pantalla Liquid Retina y hasta 18h de batería.',
      modeloNombre: 'MacBook Air 13.6" M2 Midnight',
      modeloDesc: 'Ultrabook Apple con Chip M2, diseño unibody silencioso sin ventilador',
      precioVenta: 4999.00,
      precioCosto: 4300.00,
      stockMinimo: 2,
      stockSede1: 5,
      stockSede2: 2,
      detalles: [
        { atributo: 'Procesador', valor: 'Apple M2 (CPU de 8 núcleos, GPU de 8 núcleos, Neural Engine 16 núcleos)' },
        { atributo: 'Memoria Unificada', valor: '8GB Memoria Unificada de alto ancho de banda' },
        { atributo: 'Almacenamiento', valor: '256GB SSD ultrarrápido' },
        { atributo: 'Pantalla', valor: '13.6" Liquid Retina con True Tone (2560x1664) 500 nits' },
        { atributo: 'Puertos', valor: 'Carga MagSafe 3, dos puertos Thunderbolt/USB 4, jack 3.5mm' },
        { atributo: 'Cámara y Audio', valor: 'FaceTime HD 1080p, sistema de 4 altavoces con Audio Espacial' },
      ],
      seriePrefix: 'APP-MBA13',
    },
    {
      marcaId: 7, // ACER
      codigo: 'LAP-ACR-ASP5',
      nombre: 'ACER Aspire 5 15.6" Core i5 16GB RAM',
      descripcion: 'Rendimiento versátil con procesador Intel de 13va generación y conectividad Thunderbolt 4.',
      modeloNombre: 'Aspire 5 A515-58M',
      modeloDesc: 'Portátil práctico y eficiente para trabajo multitarea continuo',
      precioVenta: 2399.00,
      precioCosto: 1980.00,
      stockMinimo: 3,
      stockSede1: 12,
      stockSede2: 4,
      detalles: [
        { atributo: 'Procesador', valor: 'Intel Core i5-1335U (10 núcleos, hasta 4.6 GHz)' },
        { atributo: 'Memoria RAM', valor: '16GB LPDDR5 Dual Channel' },
        { atributo: 'Almacenamiento', valor: '512GB SSD PCIe NVMe Gen4' },
        { atributo: 'Pantalla', valor: '15.6" Full HD (1920x1080) IPS Acer ComfyView' },
        { atributo: 'Conectividad', valor: 'Wi-Fi 6E, Thunderbolt 4 Tipo-C, HDMI 2.1' },
      ],
      seriePrefix: 'ACR-ASP5',
    },
  ];

  for (const item of newLaptops) {
    // A. Verificar o insertar Modelo
    const [existingMod] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM modelos WHERE marca_id = ? AND nombre = ?',
      [item.marcaId, item.modeloNombre]
    );

    let modeloId: number;
    if (existingMod.length > 0) {
      modeloId = existingMod[0].id;
    } else {
      const [modRes] = await pool.query<ResultSetHeader>(
        'INSERT INTO modelos (marca_id, nombre, descripcion, estado_id) VALUES (?, ?, ?, 1)',
        [item.marcaId, item.modeloNombre, item.modeloDesc]
      );
      modeloId = modRes.insertId;

      // Insertar atributos de detalle_modelo
      for (const d of item.detalles) {
        await pool.query(
          'INSERT INTO detalle_modelo (modelo_id, atributo, valor) VALUES (?, ?, ?)',
          [modeloId, d.atributo, d.valor]
        );
      }
    }

    // B. Verificar o insertar Producto
    const [existingProd] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM productos WHERE codigo = ?',
      [item.codigo]
    );

    let productoId: number;
    if (existingProd.length > 0) {
      productoId = existingProd[0].id;
      await pool.query(
        `UPDATE productos SET 
          nombre = ?, descripcion = ?, categoria_id = 1, marca_id = ?, modelo_id = ?,
          precio_venta = ?, precio_costo = ?, stock_minimo = ?, requiere_serie = 1,
          disponible_venta = 1, tipo_destino = 'VENTA', estado_id = 1
        WHERE id = ?`,
        [
          item.nombre, item.descripcion, item.marcaId, modeloId,
          item.precioVenta, item.precioCosto, item.stockMinimo,
          productoId,
        ]
      );
    } else {
      const [prodRes] = await pool.query<ResultSetHeader>(
        `INSERT INTO productos (
          codigo, nombre, descripcion, categoria_id, marca_id, modelo_id,
          requiere_serie, disponible_venta, tipo_destino, precio_venta, precio_costo,
          stock_minimo, estado_id
        ) VALUES (?, ?, ?, 1, ?, ?, 1, 1, 'VENTA', ?, ?, ?, 1)`,
        [
          item.codigo, item.nombre, item.descripcion, item.marcaId, modeloId,
          item.precioVenta, item.precioCosto, item.stockMinimo,
        ]
      );
      productoId = prodRes.insertId;
    }

    // C. Insertar Stock por Sede (Sede 1 y Sede 2)
    await pool.query(
      `INSERT INTO producto_stock_sede (producto_id, sucursal_id, stock)
       VALUES (?, 1, ?)
       ON DUPLICATE KEY UPDATE stock = VALUES(stock)`,
      [productoId, item.stockSede1]
    );

    await pool.query(
      `INSERT INTO producto_stock_sede (producto_id, sucursal_id, stock)
       VALUES (?, 2, ?)
       ON DUPLICATE KEY UPDATE stock = VALUES(stock)`,
      [productoId, item.stockSede2]
    );

    // D. Insertar unidades físicas con seriales en producto_unidades para Sede 1
    for (let s = 1; s <= item.stockSede1; s++) {
      const serial = `${item.seriePrefix}-CHIC-${String(s).padStart(4, '0')}`;
      await pool.query(
        `INSERT IGNORE INTO producto_unidades (
          producto_id, sucursal_id, numero_serie, estado_unidad_id,
          tipo_destino, disponible_venta, condicion, observaciones, costo_adquisicion, fecha_ingreso
        ) VALUES (?, 1, ?, 1, 'VENTA', 1, 'NUEVO', 'Unidad verificada en almacén Chiclayo', ?, NOW())`,
        [productoId, serial, item.precioCosto]
      );
    }

    console.log(`✓ Insertada/Actualizada: ${item.nombre} (Stock Chiclayo: ${item.stockSede1})`);
  }

  console.log('--- Inserción de Laptops completada con total éxito ---');
  process.exit(0);
}

seedLaptops().catch((err) => {
  console.error('Error durante la inserción:', err);
  process.exit(1);
});
