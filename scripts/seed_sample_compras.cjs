const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: 'MG2026',
    database: 'mg_solutions_db',
  });

  const [existing] = await conn.query('SELECT COUNT(*) as count FROM compras');
  if (existing[0].count === 0) {
    // 1. Compra de laptops a Grupo Deltron para Chiclayo Centro
    const [c1] = await conn.query(`
      INSERT INTO compras 
      (codigo, proveedor_id, sucursal_id, total, estado_id, usuario_id, fecha_compra, observaciones, updated_at)
      VALUES 
      ('F001-002849', 1, 1, 14200.00, 1, 1, NOW() - INTERVAL 5 DAY, 'Abastecimiento de laptops Lenovo ThinkPad para stock central de ventas', NOW())
    `);
    const c1Id = c1.insertId;

    // Items de c1
    await conn.query(`
      INSERT INTO detalle_compras (compra_id, producto_id, cantidad, precio_costo_unit, subtotal)
      VALUES 
      (?, 1, 2, 4500.00, 9000.00),
      (?, 2, 2, 2600.00, 5200.00)
    `, [c1Id, c1Id]);

    // 2. Compra de repuestos y suministros a Intcomex para Lambayeque Norte
    const [c2] = await conn.query(`
      INSERT INTO compras 
      (codigo, proveedor_id, sucursal_id, total, estado_id, usuario_id, fecha_compra, observaciones, updated_at)
      VALUES 
      ('F002-001092', 2, 2, 4200.00, 1, 1, NOW() - INTERVAL 2 DAY, 'Lote de laptops ThinkPad T14 para exhibición en sede Lambayeque', NOW())
    `);
    const c2Id = c2.insertId;

    await conn.query(`
      INSERT INTO detalle_compras (compra_id, producto_id, cantidad, precio_costo_unit, subtotal)
      VALUES 
      (?, 3, 1, 4200.00, 4200.00)
    `, [c2Id]);

    console.log('Compras iniciales registradas en MySQL exitosamente!');
  } else {
    console.log('Ya existen compras registradas en la base de datos:', existing[0].count);
  }

  await conn.end();
}

main().catch(console.error);
