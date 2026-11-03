import { Request, Response } from 'express';
import { pool } from '../config/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { sendSaleReceiptEmail } from '../utils/mailer';

/**
 * GET /api/ventas
 * Listado histórico de ventas con datos de cliente, comprobante y totales
 */
export async function getVentas(req: Request, res: Response): Promise<void> {
  try {
    const { search, limit = '50', page = '1' } = req.query;
    const limitNum = Math.min(Number(limit) || 50, 100);
    const offset = ((Number(page) || 1) - 1) * limitNum;

    let query = `
      SELECT v.id, v.codigo_comprobante AS codigoComprobante,
             tc.codigo AS tipoComprobanteCodigo, tc.nombre AS tipoComprobanteNombre,
             v.cliente_id AS clienteId,
             COALESCE(NULLIF(TRIM(c.razon_social), ''), CONCAT(COALESCE(per.nombres, ''), ' ', COALESCE(per.apellidos, ''))) AS clienteNombre,
             COALESCE(c.ruc, per.dni, '') AS clienteDocumento,
             per.telefono AS clienteTelefono,
             per.correo AS clienteEmail,
             v.subtotal, v.igv, v.total,
             mp.codigo AS metodoPagoCodigo, mp.nombre AS metodoPagoNombre,
             e.nombre AS estado, v.estado_id AS estadoId,
             v.fecha_venta AS fechaVenta,
             v.observaciones,
             s.nombre AS sucursalNombre,
             u.nombre_completo AS vendedorNombre,
             COUNT(dv.id) AS totalItems
      FROM ventas v
      INNER JOIN tipos_comprobante tc ON v.tipo_comprobante_id = tc.id
      INNER JOIN estados e ON v.estado_id = e.id
      INNER JOIN metodos_pago mp ON v.metodo_pago_id = mp.id
      LEFT JOIN clientes c ON v.cliente_id = c.id_cliente
      LEFT JOIN personas per ON c.id_persona = per.id_persona
      LEFT JOIN sucursales s ON v.sucursal_id = s.id
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      LEFT JOIN detalle_ventas dv ON dv.venta_id = v.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search && String(search).trim()) {
      const term = `%${String(search).trim()}%`;
      query += ` AND (v.codigo_comprobante LIKE ? OR c.razon_social LIKE ? OR per.nombres LIKE ? OR per.apellidos LIKE ? OR per.dni LIKE ? OR c.ruc LIKE ?)`;
      params.push(term, term, term, term, term, term);
    }

    query += `
      GROUP BY v.id, v.codigo_comprobante, tc.codigo, tc.nombre, v.cliente_id,
               c.razon_social, per.nombres, per.apellidos, c.ruc, per.dni, per.telefono, per.correo,
               v.subtotal, v.igv, v.total, mp.codigo, mp.nombre, e.nombre, v.estado_id,
               v.fecha_venta, v.observaciones, s.nombre, u.nombre_completo
      ORDER BY v.fecha_venta DESC, v.id DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limitNum, offset);

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    res.json({
      success: true,
      total: rows.length,
      ventas: rows.map((r) => ({
        id: r.id,
        codigoComprobante: r.codigoComprobante,
        tipoComprobante: r.tipoComprobanteCodigo,
        tipoComprobanteNombre: r.tipoComprobanteNombre,
        cliente: {
          id: r.clienteId,
          nombre: r.clienteNombre ? String(r.clienteNombre).trim() : 'Cliente General',
          documento: r.clienteDocumento || '',
          telefono: r.clienteTelefono || '',
          email: r.clienteEmail || '',
        },
        subtotal: Number(r.subtotal) || 0,
        igv: Number(r.igv) || 0,
        total: Number(r.total) || 0,
        metodoPago: r.metodoPagoNombre,
        estado: r.estado,
        estadoId: r.estadoId,
        fechaVenta: r.fechaVenta,
        sucursal: r.sucursalNombre || 'Principal',
        vendedor: r.vendedorNombre || 'Vendedor',
        totalItems: Number(r.totalItems) || 0,
        observaciones: r.observaciones || '',
      })),
    });
  } catch (error: any) {
    console.error('Error al listar ventas:', error);
    res.status(500).json({ success: false, message: 'Error interno al consultar historial de ventas.' });
  }
}

/**
 * GET /api/ventas/:id
 * Detalle completo de una venta con sus líneas de producto y números de serie asignados
 */
export async function getVentaById(req: Request, res: Response): Promise<void> {
  try {
    const ventaId = Number(req.params.id);
    if (isNaN(ventaId)) {
      res.status(400).json({ success: false, message: 'ID de venta inválido.' });
      return;
    }

    const [ventaRows] = await pool.query<RowDataPacket[]>(
      `SELECT v.id, v.codigo_comprobante AS codigoComprobante,
              tc.codigo AS tipoComprobanteCodigo, tc.nombre AS tipoComprobanteNombre,
              v.cliente_id AS clienteId,
              COALESCE(NULLIF(TRIM(c.razon_social), ''), CONCAT(COALESCE(per.nombres, ''), ' ', COALESCE(per.apellidos, ''))) AS clienteNombre,
              COALESCE(c.ruc, per.dni, '') AS clienteDocumento,
              per.telefono AS clienteTelefono, per.direccion AS clienteDireccion, per.correo AS clienteEmail,
              v.subtotal, v.igv, v.total,
              mp.codigo AS metodoPagoCodigo, mp.nombre AS metodoPagoNombre,
              e.nombre AS estado, v.fecha_venta AS fechaVenta,
              v.observaciones, s.nombre AS sucursalNombre, u.nombre_completo AS vendedorNombre
       FROM ventas v
       INNER JOIN tipos_comprobante tc ON v.tipo_comprobante_id = tc.id
       INNER JOIN estados e ON v.estado_id = e.id
       INNER JOIN metodos_pago mp ON v.metodo_pago_id = mp.id
       LEFT JOIN clientes c ON v.cliente_id = c.id_cliente
       LEFT JOIN personas per ON c.id_persona = per.id_persona
       LEFT JOIN sucursales s ON v.sucursal_id = s.id
       LEFT JOIN usuarios u ON v.usuario_id = u.id
       WHERE v.id = ?
       LIMIT 1`,
      [ventaId]
    );

    if (ventaRows.length === 0) {
      res.status(404).json({ success: false, message: 'Venta no encontrada.' });
      return;
    }

    const v = ventaRows[0];

    // Obtener líneas de detalle
    const [itemsRows] = await pool.query<RowDataPacket[]>(
      `SELECT dv.id, dv.producto_id AS productoId,
              p.codigo AS productoCodigo, p.nombre AS productoNombre,
              m.nombre AS marcaNombre, mo.nombre AS modeloNombre,
              dv.cantidad, dv.precio_unitario AS precioUnitario,
              dv.descuento, dv.subtotal
       FROM detalle_ventas dv
       INNER JOIN productos p ON dv.producto_id = p.id
       LEFT JOIN marcas m ON p.marca_id = m.id
       LEFT JOIN modelos mo ON p.modelo_id = mo.id
       WHERE dv.venta_id = ?`,
      [ventaId]
    );

    // Obtener números de serie de garantía asociados a esta venta
    const [seriesRows] = await pool.query<RowDataPacket[]>(
      `SELECT psg.id, psg.producto_id AS productoId, psg.numero_serie AS numeroSerie,
              psg.meses_garantia AS mesesGarantia, psg.estado_garantia AS estadoGarantia
       FROM producto_series_garantia psg
       WHERE psg.venta_id = ?`,
      [ventaId]
    );

    const seriesPorProducto = new Map<number, { numeroSerie: string; mesesGarantia: number; estadoGarantia: string }[]>();
    for (const s of seriesRows) {
      if (!seriesPorProducto.has(s.productoId)) {
        seriesPorProducto.set(s.productoId, []);
      }
      seriesPorProducto.get(s.productoId)!.push({
        numeroSerie: s.numeroSerie,
        mesesGarantia: Number(s.mesesGarantia) || 12,
        estadoGarantia: s.estadoGarantia,
      });
    }

    res.json({
      success: true,
      venta: {
        id: v.id,
        codigoComprobante: v.codigoComprobante,
        tipoComprobante: v.tipoComprobanteCodigo,
        tipoComprobanteNombre: v.tipoComprobanteNombre,
        cliente: {
          id: v.clienteId,
          nombre: v.clienteNombre ? String(rClienteNombre(v.clienteNombre)) : 'Cliente General',
          documento: v.clienteDocumento || '',
          telefono: v.clienteTelefono || '',
          direccion: v.clienteDireccion || '',
          email: v.clienteEmail || '',
        },
        subtotal: Number(v.subtotal) || 0,
        igv: Number(v.igv) || 0,
        total: Number(v.total) || 0,
        metodoPago: v.metodoPagoNombre,
        estado: v.estado,
        fechaVenta: v.fechaVenta,
        sucursal: v.sucursalNombre || 'Principal',
        vendedor: v.vendedorNombre || 'Vendedor',
        observaciones: v.observaciones || '',
        items: itemsRows.map((it) => ({
          id: it.id,
          productoId: it.productoId,
          codigo: it.productoCodigo,
          nombre: it.productoNombre,
          marca: it.marcaNombre || '',
          modelo: it.modeloNombre || '',
          cantidad: Number(it.cantidad) || 0,
          precioUnitario: Number(it.precioUnitario) || 0,
          descuento: Number(it.descuento) || 0,
          subtotal: Number(it.subtotal) || 0,
          series: seriesPorProducto.get(it.productoId) || [],
        })),
      },
    });
  } catch (error: any) {
    console.error('Error al obtener detalle de venta:', error);
    res.status(500).json({ success: false, message: 'Error interno al consultar detalle de venta.' });
  }
}

function rClienteNombre(val: any): string {
  return val ? String(val).trim() : 'Cliente General';
}

/**
 * POST /api/ventas
 * Registra una venta completa en transacción atómica
 */
export async function createVenta(req: AuthenticatedRequest, res: Response): Promise<void> {
  const connection = await pool.getConnection();
  try {
    const {
      clienteId,
      tipoComprobanteId = 1, // 1: BOLETA, 2: FACTURA, 3: NOTA_VENTA
      metodoPagoId = 1,      // 1: EFECTIVO, 2: YAPE, 3: PLIN, 4: TARJETA, 5: TRANSFERENCIA
      sucursalId = 1,
      items = [],
      observaciones = '',
    } = req.body;

    const usuarioId = req.user?.userId || 1;

    let finalClienteId = Number(clienteId);
    if (!finalClienteId || isNaN(finalClienteId)) {
      const [defaultCli] = await pool.query<RowDataPacket[]>(
        "SELECT id_cliente FROM clientes WHERE razon_social LIKE '%CONSUMIDOR FINAL%' OR razon_social LIKE '%VARIOS%' LIMIT 1"
      );
      if (defaultCli.length > 0) {
        finalClienteId = defaultCli[0].id_cliente;
      } else {
        const [firstCli] = await pool.query<RowDataPacket[]>(
          "SELECT id_cliente FROM clientes ORDER BY id_cliente ASC LIMIT 1"
        );
        finalClienteId = firstCli[0]?.id_cliente || 1;
      }
    }

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'La venta debe contener al menos un producto.' });
      return;
    }

    await connection.beginTransaction();

    // 1. Obtener correlativo para el comprobante
    const [tipoCompRows] = await connection.query<RowDataPacket[]>(
      'SELECT id, codigo, serie_defecto FROM tipos_comprobante WHERE id = ?',
      [tipoComprobanteId]
    );

    const seriePrefijo = tipoCompRows[0]?.serie_defecto || 'B001';

    const [lastCompRows] = await connection.query<RowDataPacket[]>(
      'SELECT codigo_comprobante FROM ventas WHERE codigo_comprobante LIKE ? ORDER BY id DESC LIMIT 1',
      [`${seriePrefijo}-%`]
    );

    let nextNumero = 1;
    if (lastCompRows.length > 0) {
      const match = lastCompRows[0].codigo_comprobante.match(/-(\d+)$/);
      if (match) {
        nextNumero = parseInt(match[1], 10) + 1;
      }
    }
    const codigoComprobante = `${seriePrefijo}-${nextNumero.toString().padStart(6, '0')}`;

    // 2. Calcular totales
    let totalGeneral = 0;
    for (const it of items) {
      const precio = Number(it.precioUnitario) || 0;
      const cant = Number(it.cantidad) || 1;
      const desc = Number(it.descuento) || 0;
      totalGeneral += (precio * cant) - desc;
    }

    const subtotal = Math.round((totalGeneral / 1.18) * 100) / 100;
    const igv = Math.round((totalGeneral - subtotal) * 100) / 100;

    // 2.5. Validar que todos los productos existan en la tabla 'productos'
    for (const it of items) {
      const prodId = Number(it.productoId);
      if (!prodId || isNaN(prodId)) {
        await connection.rollback();
        res.status(400).json({
          success: false,
          error: `ID de producto inválido en el carrito (${it.productoId}).`,
        });
        return;
      }
      const [prodRows] = await connection.query<RowDataPacket[]>(
        'SELECT id, nombre FROM productos WHERE id = ?',
        [prodId]
      );
      if (prodRows.length === 0) {
        await connection.rollback();
        res.status(400).json({
          success: false,
          error: `El producto '${it.nombre || ('ID ' + prodId)}' no existe en la base de datos de almacén. Asegúrese de registrar el producto en 'Almacén & Inventario' antes de venderlo.`,
        });
        return;
      }
    }

    // 3. Insertar venta
    const [ventaResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO ventas 
       (codigo_comprobante, tipo_comprobante_id, cliente_id, usuario_id, sucursal_id,
        subtotal, igv, total, metodo_pago_id, estado_id, fecha_venta, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), ?)`,
      [
        codigoComprobante,
        tipoComprobanteId,
        finalClienteId,
        usuarioId,
        sucursalId,
        subtotal,
        igv,
        totalGeneral,
        metodoPagoId,
        observaciones ? String(observaciones).trim() : null,
      ]
    );

    const newVentaId = ventaResult.insertId;

    // 4. Procesar cada ítem del detalle
    for (const it of items) {
      const prodId = Number(it.productoId);
      const cantidad = Number(it.cantidad) || 1;
      const precioUnit = Number(it.precioUnitario) || 0;
      const desc = Number(it.descuento) || 0;
      const subtotalItem = (precioUnit * cantidad) - desc;

      await connection.query(
        `INSERT INTO detalle_ventas 
         (venta_id, producto_id, cantidad, precio_unitario, descuento, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [newVentaId, prodId, cantidad, precioUnit, desc, subtotalItem]
      );

      // Si el producto requiere series y se enviaron series
      const seriesList: string[] = Array.isArray(it.series) ? it.series : [];
      if (seriesList.length > 0) {
        for (const serie of seriesList) {
          const cleanSerie = String(serie).trim();
          if (!cleanSerie) continue;

          // Actualizar estado en producto_unidades a VENDIDO (2)
          await connection.query(
            `UPDATE producto_unidades 
             SET estado_unidad_id = 2, disponible_venta = 0, updated_at = NOW()
             WHERE producto_id = ? AND numero_serie = ?`,
            [prodId, cleanSerie]
          );

          // Registrar en producto_series_garantia (12 meses por defecto)
          await connection.query(
            `INSERT INTO producto_series_garantia 
             (venta_id, producto_id, numero_serie, cliente_id, meses_garantia, fecha_venta, estado_garantia, observaciones)
             VALUES (?, ?, ?, ?, 12, NOW(), 'ACTIVA', ?)`,
            [
              newVentaId,
              prodId,
              cleanSerie,
              finalClienteId,
              `Emitido en comprobante ${codigoComprobante}. Cobertura activa.`,
            ]
          );
        }
      }

      // Descontar stock en producto_stock_sede (primero en la sucursal activa; si no tiene fila con stock allí, en la sede con stock disponible)
      const [updSedeRes] = await connection.query<ResultSetHeader>(
        `UPDATE producto_stock_sede 
         SET stock = GREATEST(0, stock - ?), updated_at = NOW()
         WHERE producto_id = ? AND sucursal_id = ? AND stock > 0`,
        [cantidad, prodId, sucursalId]
      );
      if (updSedeRes.affectedRows === 0) {
        await connection.query(
          `UPDATE producto_stock_sede 
           SET stock = GREATEST(0, stock - ?), updated_at = NOW()
           WHERE producto_id = ? AND stock > 0
           ORDER BY stock DESC LIMIT 1`,
          [cantidad, prodId]
        );
      }
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: `Venta registrada con éxito. Comprobante ${codigoComprobante} emitido.`,
      ventaId: newVentaId,
      codigoComprobante,
      total: totalGeneral,
      venta: {
        id: newVentaId,
        codigoComprobante,
        fechaVenta: new Date().toISOString(),
        subtotal,
        igv,
        total: totalGeneral,
      },
    });
  } catch (error: any) {
    await connection.rollback();
    console.error('Error al registrar venta:', error);
    res.status(500).json({ success: false, error: error.message || 'Error interno al registrar la venta.', message: error.message || 'Error interno al registrar la venta.' });
  } finally {
    connection.release();
  }
}

/**
 * POST /api/ventas/:id/enviar-email
 * Envía el comprobante digital por correo electrónico al cliente
 */
export async function enviarComprobanteEmail(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const ventaId = Number(req.params.id || req.body.ventaId);
    const { toEmail: customEmail, saleData } = req.body;

    if (!ventaId || isNaN(ventaId)) {
      res.status(400).json({ success: false, message: 'ID de venta no válido.' });
      return;
    }

    // 1. Consultar venta en base de datos
    const [ventaRows] = await pool.query<RowDataPacket[]>(
      `SELECT v.id, v.codigo_comprobante AS codigoComprobante,
              tc.codigo AS tipoComprobanteCodigo, tc.nombre AS tipoComprobanteNombre,
              v.cliente_id AS clienteId,
              COALESCE(NULLIF(TRIM(c.razon_social), ''), CONCAT(COALESCE(per.nombres, ''), ' ', COALESCE(per.apellidos, ''))) AS clienteNombre,
              COALESCE(c.ruc, per.dni, '') AS clienteDocumento,
              per.direccion AS clienteDireccion, per.correo AS clienteEmail,
              v.subtotal, v.igv, v.total,
              mp.nombre AS metodoPagoNombre,
              v.fecha_venta AS fechaVenta,
              s.nombre AS sucursalNombre, u.nombre_completo AS vendedorNombre
       FROM ventas v
       INNER JOIN tipos_comprobante tc ON v.tipo_comprobante_id = tc.id
       INNER JOIN metodos_pago mp ON v.metodo_pago_id = mp.id
       LEFT JOIN clientes c ON v.cliente_id = c.id_cliente
       LEFT JOIN personas per ON c.id_persona = per.id_persona
       LEFT JOIN sucursales s ON v.sucursal_id = s.id
       LEFT JOIN usuarios u ON v.usuario_id = u.id
       WHERE v.id = ?
       LIMIT 1`,
      [ventaId]
    );

    if (ventaRows.length === 0) {
      res.status(404).json({ success: false, message: 'Venta no encontrada en la base de datos.' });
      return;
    }

    const v = ventaRows[0];
    const destinationEmail = String(customEmail || v.clienteEmail || saleData?.clienteEmail || '').trim();

    if (!destinationEmail || !destinationEmail.includes('@')) {
      res.status(400).json({
        success: false,
        message: 'No se especificó un correo electrónico válido para enviar el comprobante.',
      });
      return;
    }

    // 2. Obtener productos de la venta
    const [itemsRows] = await pool.query<RowDataPacket[]>(
      `SELECT dv.producto_id AS productoId, p.nombre AS productoNombre,
              dv.cantidad, dv.precio_unitario AS precioUnitario, dv.subtotal
       FROM detalle_ventas dv
       INNER JOIN productos p ON dv.producto_id = p.id
       WHERE dv.venta_id = ?`,
      [ventaId]
    );

    // 3. Obtener series de garantía
    const [seriesRows] = await pool.query<RowDataPacket[]>(
      `SELECT producto_id AS productoId, numero_serie AS numeroSerie
       FROM producto_series_garantia
       WHERE venta_id = ?`,
      [ventaId]
    );

    const seriesMap = new Map<number, string[]>();
    for (const s of seriesRows) {
      if (!seriesMap.has(s.productoId)) seriesMap.set(s.productoId, []);
      seriesMap.get(s.productoId)!.push(s.numeroSerie);
    }

    const emailItems = itemsRows.map((it) => ({
      nombre: it.productoNombre,
      cantidad: Number(it.cantidad) || 1,
      precioUnitario: Number(it.precioUnitario) || 0,
      subtotal: Number(it.subtotal) || 0,
      series: seriesMap.get(it.productoId) || [],
    }));

    // 4. Enviar email
    const emailResult = await sendSaleReceiptEmail({
      toEmail: destinationEmail,
      clienteNombre: v.clienteNombre || saleData?.clienteNombre || 'Estimado(a) Cliente',
      clienteDocumento: v.clienteDocumento || saleData?.clienteDocumento || '',
      clienteDireccion: v.clienteDireccion || saleData?.clienteDireccion || 'Chiclayo, Perú',
      codigoComprobante: v.codigoComprobante,
      tipoComprobante: v.tipoComprobanteNombre || 'BOLETA DE VENTA ELECTRÓNICA',
      fechaVenta: v.fechaVenta ? new Date(v.fechaVenta).toLocaleString('es-PE', { hour12: false }) : new Date().toLocaleString('es-PE', { hour12: false }),
      vendedorNombre: v.vendedorNombre || 'Cajero MG Solutions',
      sucursalNombre: v.sucursalNombre || 'Principal - Chiclayo Centro',
      metodoPago: v.metodoPagoNombre || 'EFECTIVO',
      subtotal: Number(v.subtotal) || 0,
      igv: Number(v.igv) || 0,
      total: Number(v.total) || 0,
      items: emailItems,
    });

    if (!emailResult.success) {
      res.status(500).json({
        success: false,
        message: emailResult.error || 'No se pudo enviar el correo electrónico con el comprobante.',
      });
      return;
    }

    res.json({
      success: true,
      message: `Comprobante ${v.codigoComprobante} enviado con éxito a ${destinationEmail}`,
      simulated: emailResult.simulated,
    });
  } catch (error: any) {
    console.error('Error al enviar comprobante por correo:', error);
    res.status(500).json({ success: false, message: 'Error interno al procesar el envío de correo.' });
  }
}
