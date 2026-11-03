/**
 * Escenario de garantías: 6 productos (uno por modelo del catálogo) y 15 equipos vendidos
 * con su venta, número de serie y garantía: 5 vigentes, 5 por vencer, 5 vencidas.
 * Usa los 8 clientes ya registrados. Es idempotente (omite series ya existentes).
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

// codigo, nombre, categoria, marca, modelo, venta, costo
const PRODUCTOS = [
  ['LAP-LNV-X1C', 'LENOVO ThinkPad X1 Carbon Gen 14 Aura Edition 14"', 1, 1, 1, 7899, 6700],
  ['LAP-LNV-GB15', 'LENOVO Googlebook 15',                               1, 1, 2, 1899, 1550],
  ['LAP-LNV-T14', 'LENOVO ThinkPad T14 Gen 7 14" Intel',                1, 1, 3, 4599, 3900],
  ['LAP-HP-PAV15', 'HP Pavilion 15-eg0021la',                           1, 2, 4, 2799, 2300],
  ['LAP-ACR-HEL18', 'ACER Predator Helios 18 AI',                       1, 7, 5, 9499, 8100],
  ['IMP-EPS-L3250', 'EPSON EcoTank L3250 WiFi Multifuncional',          2, 6, 6,  899,  720],
];

// [indice producto, serie, dias restantes de garantia (negativo = vencida)]
const EQUIPOS = [
  // VIGENTES
  [0, 'PF-4XK29M7',  320], [2, 'PF-3TN81Q2', 250], [3, '5CD2218KLP', 190],
  [5, 'X4CE012874',  120], [1, 'GB15-27741A', 95],
  // POR VENCER (<= 30 días)
  [4, 'NHQ3KSA00G',    4], [5, 'X4CE013391',   9], [2, 'PF-3TN70R5',  15],
  [3, '5CD2219MNB',   21], [1, 'GB15-27802B', 27],
  // VENCIDAS
  [0, 'PF-4XK11D8',  -12], [4, 'NHQ3KSA01H', -38], [5, 'X4CE009126', -64],
  [2, 'PF-3TN52W9', -105], [3, '5CD2104ZXC', -190],
];
const MESES = 12;
const METODOS = [1, 2, 4, 3, 5]; // efectivo, yape, tarjeta, plin, transferencia

const fmt = (d) => d.toISOString().slice(0, 19).replace('T', ' ');

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST, port: +process.env.DB_PORT,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  });

  const [clientes] = await c.query('SELECT id_cliente FROM clientes ORDER BY id_cliente');
  if (clientes.length < 8) throw new Error('Se esperaban 8 clientes, hay ' + clientes.length);
  const [[u]] = await c.query('SELECT id FROM usuarios ORDER BY id LIMIT 1');
  if (!u) throw new Error('No hay usuario (ejecuta el seed del superadmin).');

  await c.beginTransaction();
  try {
    // ---- Productos ----
    const prodIds = [];
    for (const [cod, nombre, cat, marca, modelo, pv, pc] of PRODUCTOS) {
      const [ex] = await c.query('SELECT id FROM productos WHERE codigo=?', [cod]);
      if (ex.length) { prodIds.push(ex[0].id); continue; }
      const [r] = await c.query(
        `INSERT INTO productos (codigo, nombre, descripcion, categoria_id, marca_id, modelo_id, requiere_serie,
           disponible_venta, tipo_destino, precio_venta, precio_costo, stock_minimo, estado_id)
         VALUES (?,?,?,?,?,?,1,1,'VENTA',?,?,1,1)`,
        [cod, nombre, nombre, cat, marca, modelo, pv, pc]);
      prodIds.push(r.insertId);
      await c.query('INSERT INTO producto_stock_sede (producto_id, sucursal_id, stock) VALUES (?,1,0)', [r.insertId]);
    }

    // ---- Correlativo de boleta ----
    const [[last]] = await c.query(
      "SELECT codigo_comprobante cc FROM ventas WHERE codigo_comprobante LIKE 'B001-%' ORDER BY id DESC LIMIT 1");
    let correlativo = last ? parseInt(last.cc.split('-')[1], 10) : 0;

    // ---- Equipos vendidos con garantía ----
    let i = 0;
    for (const [pi, serie, dias] of EQUIPOS) {
      i++;
      const [dup] = await c.query('SELECT id FROM producto_series_garantia WHERE numero_serie=?', [serie]);
      if (dup.length) { console.log('Ya existe', serie); continue; }

      const pid = prodIds[pi];
      const [pv, pc] = [PRODUCTOS[pi][5], PRODUCTOS[pi][6]];
      const clienteId = clientes[(i - 1) % clientes.length].id_cliente;

      // fecha de venta = (hoy + días restantes - 1h) - 12 meses  -> estado exacto al día de hoy
      const expira = new Date(Date.now() + dias * 86400000 - 3600000);
      const fVenta = new Date(expira); fVenta.setMonth(fVenta.getMonth() - MESES);
      const fIngreso = new Date(fVenta.getTime() - 20 * 86400000);

      const subtotal = Math.round((pv / 1.18) * 100) / 100;
      const igv = Math.round((pv - subtotal) * 100) / 100;
      correlativo++;
      const codigo = `B001-${String(correlativo).padStart(6, '0')}`;

      const [v] = await c.query(
        `INSERT INTO ventas (codigo_comprobante, tipo_comprobante_id, cliente_id, usuario_id, sucursal_id,
           subtotal, igv, total, metodo_pago_id, estado_id, fecha_venta, observaciones)
         VALUES (?,1,?,?,1,?,?,?,?,1,?,'Venta de equipo - datos de demostración')`,
        [codigo, clienteId, u.id, subtotal, igv, pv, METODOS[i % METODOS.length], fmt(fVenta)]);
      await c.query(
        'INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, descuento, subtotal) VALUES (?,?,1,?,0,?)',
        [v.insertId, pid, pv, pv]);
      await c.query(
        `INSERT INTO producto_unidades (producto_id, sucursal_id, numero_serie, estado_unidad_id, tipo_destino,
           disponible_venta, condicion, costo_adquisicion, fecha_ingreso)
         VALUES (?,1,?,2,'VENTA',0,'NUEVO',?,?)`,
        [pid, serie, pc, fmt(fIngreso)]);
      await c.query(
        `INSERT INTO producto_series_garantia (venta_id, producto_id, numero_serie, cliente_id, meses_garantia,
           fecha_venta, estado_garantia)
         VALUES (?,?,?,?,?,?,'ACTIVA')`,
        [v.insertId, pid, serie, clienteId, MESES, fmt(fVenta)]);
    }
    await c.commit();
  } catch (e) { await c.rollback(); throw e; }

  const [res] = await c.query(
    `SELECT psg.numero_serie serie, p.nombre producto, c.razon_social cliente, v.codigo_comprobante comprobante,
            DATE(psg.fecha_venta) venta,
            DATEDIFF(DATE_ADD(psg.fecha_venta, INTERVAL psg.meses_garantia MONTH), NOW()) dias
     FROM producto_series_garantia psg
     JOIN productos p ON p.id=psg.producto_id
     JOIN clientes c ON c.id_cliente=psg.cliente_id
     JOIN ventas v ON v.id=psg.venta_id
     ORDER BY dias DESC`);
  console.table(res.map(r => ({
    ...r, venta: String(r.venta).slice(0, 10),
    estado: r.dias <= 0 ? 'VENCIDA' : r.dias <= 30 ? 'POR VENCER' : 'VIGENTE',
  })));
  const [[n]] = await c.query('SELECT COUNT(*) n FROM clientes');
  console.log('Clientes en BD:', n.n);
  await c.end();
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
