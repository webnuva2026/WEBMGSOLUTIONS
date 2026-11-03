import { pool } from '../server/config/db';

async function main() {
  const [garantias] = await pool.query(`
    SELECT 
      psg.id,
      psg.numero_serie,
      p.nombre AS producto,
      c.razon_social AS cliente,
      DATE_FORMAT(psg.fecha_venta, '%Y-%m-%d') AS fecha_venta,
      psg.meses_garantia,
      DATE_FORMAT(DATE_ADD(psg.fecha_venta, INTERVAL psg.meses_garantia MONTH), '%Y-%m-%d') AS fecha_vencimiento,
      DATEDIFF(DATE_ADD(psg.fecha_venta, INTERVAL psg.meses_garantia MONTH), NOW()) AS dias_restantes,
      psg.estado_garantia,
      CASE 
        WHEN DATEDIFF(DATE_ADD(psg.fecha_venta, INTERVAL psg.meses_garantia MONTH), NOW()) < 0 THEN 'VENCIDA (Sin Garantía)'
        WHEN DATEDIFF(DATE_ADD(psg.fecha_venta, INTERVAL psg.meses_garantia MONTH), NOW()) BETWEEN 0 AND 30 THEN 'POR VENCER'
        ELSE 'VIGENTE (Con Garantía)'
      END AS estado_calculado
    FROM producto_series_garantia psg
    INNER JOIN productos p ON psg.producto_id = p.id
    LEFT JOIN clientes c ON psg.cliente_id = c.id
    ORDER BY dias_restantes ASC
  `);

  console.log('--- REPORTE DE EQUIPOS Y GARANTÍAS EN BD ---');
  console.table(garantias);

  const [ordenes] = await pool.query(`
    SELECT 
      id, codigo, tipo_equipo, marca, modelo, numero_serie,
      costo_total, estado, DATE_FORMAT(fecha_ingreso, '%Y-%m-%d') as fecha_ingreso
    FROM ordenes_servicio
  `);
  console.log('--- ÓRDENES DE SERVICIO EN BD ---');
  console.table(ordenes);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
