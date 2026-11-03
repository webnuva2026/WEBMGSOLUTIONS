const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: 'MG2026',
    database: 'mg_solutions_db',
  });

  const [existing] = await conn.query('SELECT COUNT(*) as count FROM movimientos_inventario');
  if (existing[0].count === 0) {
    // 1. Prestamo de Chiclayo a Lambayeque ya entregado / recibido
    await conn.query(`
      INSERT INTO movimientos_inventario 
      (codigo, tipo, producto_id, sede_origen_id, sede_destino_id, cantidad, series, solicitado_por, aprobado_por, recibido_por, estado_movimiento_id, motivo, observaciones, fecha_solicitud, fecha_aprobacion, fecha_envio, fecha_recepcion)
      VALUES 
      ('PREST-2026-0001', 'PRESTAMO', 1, 1, 2, 1, '["LNV-X1C-S1-0001"]', 'Carlos Mendoza', 'Super Admin', 'Milagros Torres', 4, 'Préstamo urgente para demostración ejecutiva a cliente corporativo', 'Retorno programado para fin de mes', NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY)
    `);

    // 2. Solicitud abierta pendiente de aprobacion
    await conn.query(`
      INSERT INTO movimientos_inventario 
      (codigo, tipo, producto_id, sede_origen_id, sede_destino_id, cantidad, series, solicitado_por, estado_movimiento_id, motivo, observaciones, fecha_solicitud)
      VALUES 
      ('TRASL-2026-0002', 'TRASLADO', 2, 1, 2, 2, '["LNV-GB15-S1-0001", "LNV-GB15-S1-0002"]', 'Milagros Torres', 1, 'Reposición de stock para mostrador de ventas', 'Solicitado por alta demanda', NOW() - INTERVAL 3 HOUR)
    `);

    // 3. Prestamo en transito
    await conn.query(`
      INSERT INTO movimientos_inventario 
      (codigo, tipo, producto_id, sede_origen_id, sede_destino_id, cantidad, series, solicitado_por, aprobado_por, estado_movimiento_id, motivo, observaciones, fecha_solicitud, fecha_aprobacion, fecha_envio)
      VALUES 
      ('PREST-2026-0003', 'PRESTAMO', 3, 1, 2, 1, '["LNV-T14-S1-0001"]', 'Carlos Mendoza', 'Super Admin', 3, 'Préstamo temporal de equipo para diagnóstico en taller Lambayeque', 'Enviado por motorizado de la empresa', NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 6 HOUR, NOW() - INTERVAL 2 HOUR)
    `);

    console.log('Movimientos y préstamos de demostración creados exitosamente!');
  } else {
    console.log('Ya existen movimientos registrados (' + existing[0].count + ').');
  }

  await conn.end();
}

main().catch(console.error);
