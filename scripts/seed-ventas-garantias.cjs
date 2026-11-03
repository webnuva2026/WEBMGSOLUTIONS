const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedVentasYGarantias() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3307'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mg_solutions_db'
  });

  console.log('--- Iniciando Sembrado de Ventas y Garantías de Prueba ---');

  // 1. Obtener IDs de productos clave
  const [prods] = await conn.query('SELECT id, codigo, nombre, precio_venta FROM productos');
  console.log('Productos disponibles:', prods.map(p => `${p.id}: ${p.codigo} - ${p.nombre}`));

  const laptopX1 = prods.find(p => p.codigo.includes('X1')) || prods[0];
  const laptopGB = prods.find(p => p.codigo.includes('GB15')) || prods[1];
  const epsonImp = prods.find(p => p.codigo.includes('L3250')) || prods[2];

  // 2. Limpiar ventas de prueba anteriores si existen con estos códigos
  await conn.query(`
    DELETE FROM producto_series_garantia 
    WHERE numero_serie IN ('LNV-X1C-2026-001', 'EPS-L3250-X58821', 'LNV-GB15-994101')
  `);
  await conn.query(`
    DELETE FROM ventas 
    WHERE codigo_comprobante IN ('B001-000101', 'F001-000042', 'B001-000088')
  `);

  // 3. Crear Casos de Venta

  // CASO 1: VIGENTE (Laptop Lenovo ThinkPad X1 - vendida hace 45 días)
  const [v1] = await conn.query(`
    INSERT INTO ventas (
      codigo_comprobante, tipo_comprobante_id, cliente_id, usuario_id, sucursal_id,
      subtotal, igv, total, metodo_pago_id, estado_id, fecha_venta, observaciones
    ) VALUES (
      'B001-000101', 1, 1, 1, 1,
      6694.07, 1204.93, 7899.00, 1, 1,
      DATE_SUB(NOW(), INTERVAL 45 DAY),
      'Venta mostrador de Laptop Corporativa con Garantía Oficial 12 Meses'
    )
  `);
  const venta1Id = v1.insertId;

  await conn.query(`
    INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, descuento, subtotal)
    VALUES (${venta1Id}, ${laptopX1.id}, 1, 7899.00, 0, 7899.00)
  `);

  await conn.query(`
    INSERT INTO producto_series_garantia (
      venta_id, producto_id, numero_serie, cliente_id, meses_garantia, fecha_venta, estado_garantia, observaciones
    ) VALUES (
      ${venta1Id}, ${laptopX1.id}, 'LNV-X1C-2026-001', 1, 12, DATE_SUB(NOW(), INTERVAL 45 DAY), 'VIGENTE',
      'Equipo nuevo en empaque sellado. Cobertura completa de fábrica.'
    )
  `);

  // Actualizar estado en producto_unidades a VENDIDO (2)
  await conn.query(`
    UPDATE producto_unidades 
    SET estado_unidad_id = 2, disponible_venta = 0 
    WHERE numero_serie = 'LNV-X1C-2026-001'
  `);
  console.log('✓ Caso 1 (Garantía VIGENTE): Boleta B001-000101 - Serie LNV-X1C-2026-001 generada');

  // CASO 2: POR VENCER (Impresora Epson L3250 - vendida hace 350 días, quedan ~15 días)
  const [v2] = await conn.query(`
    INSERT INTO ventas (
      codigo_comprobante, tipo_comprobante_id, cliente_id, usuario_id, sucursal_id,
      subtotal, igv, total, metodo_pago_id, estado_id, fecha_venta, observaciones
    ) VALUES (
      'F001-000042', 2, 2, 1, 1,
      720.34, 129.66, 850.00, 4, 1,
      DATE_SUB(NOW(), INTERVAL 350 DAY),
      'Factura corporativa con sistema continuo original. Vence pronto.'
    )
  `);
  const venta2Id = v2.insertId;

  await conn.query(`
    INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, descuento, subtotal)
    VALUES (${venta2Id}, ${epsonImp.id}, 1, 850.00, 0, 850.00)
  `);

  await conn.query(`
    INSERT INTO producto_series_garantia (
      venta_id, producto_id, numero_serie, cliente_id, meses_garantia, fecha_venta, estado_garantia, observaciones
    ) VALUES (
      ${venta2Id}, ${epsonImp.id}, 'EPS-L3250-X58821', 2, 12, DATE_SUB(NOW(), INTERVAL 350 DAY), 'VIGENTE',
      'Facturado a cliente empresa. Próximo a vencer periodo anual.'
    )
  `);

  await conn.query(`
    UPDATE producto_unidades 
    SET estado_unidad_id = 2, disponible_venta = 0 
    WHERE numero_serie = 'EPS-L3250-X58821'
  `);
  console.log('✓ Caso 2 (Garantía POR VENCER): Factura F001-000042 - Serie EPS-L3250-X58821 generada');

  // CASO 3: VENCIDA (Laptop Lenovo Googlebook 15 - vendida hace 420 días)
  const [v3] = await conn.query(`
    INSERT INTO ventas (
      codigo_comprobante, tipo_comprobante_id, cliente_id, usuario_id, sucursal_id,
      subtotal, igv, total, metodo_pago_id, estado_id, fecha_venta, observaciones
    ) VALUES (
      'B001-000088', 1, 1, 1, 1,
      2415.25, 434.75, 2850.00, 2, 1,
      DATE_SUB(NOW(), INTERVAL 420 DAY),
      'Garantía comercial vencida. Para probar cobro de servicio técnico fuera de plazo.'
    )
  `);
  const venta3Id = v3.insertId;

  await conn.query(`
    INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, descuento, subtotal)
    VALUES (${venta3Id}, ${laptopGB.id}, 1, 2850.00, 0, 2850.00)
  `);

  await conn.query(`
    INSERT INTO producto_series_garantia (
      venta_id, producto_id, numero_serie, cliente_id, meses_garantia, fecha_venta, estado_garantia, observaciones
    ) VALUES (
      ${venta3Id}, ${laptopGB.id}, 'LNV-GB15-994101', 1, 12, DATE_SUB(NOW(), INTERVAL 420 DAY), 'VENCIDA',
      'Periodo de 12 meses concluido. Aplicar tarifa de diagnóstico o cotización.'
    )
  `);

  await conn.query(`
    UPDATE producto_unidades 
    SET estado_unidad_id = 2, disponible_venta = 0 
    WHERE numero_serie = 'LNV-GB15-994101'
  `);
  console.log('✓ Caso 3 (Garantía VENCIDA): Boleta B001-000088 - Serie LNV-GB15-994101 generada');

  await conn.end();
  console.log('--- Sembrado de Ventas y Garantías completado con ÉXITO ---');
}

seedVentasYGarantias().catch(err => {
  console.error('Error sembrando ventas y garantías:', err);
  process.exit(1);
});
