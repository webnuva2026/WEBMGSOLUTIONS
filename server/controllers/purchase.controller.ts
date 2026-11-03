import { Request, Response } from 'express';
import { pool } from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * GET /api/proveedores
 * Obtiene el directorio de proveedores activos e inactivos
 */
export async function getProveedores(_req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        p.id,
        p.ruc,
        p.razon_social AS razonSocial,
        p.nombre_contacto AS contacto,
        p.telefono,
        p.email,
        p.direccion,
        e.nombre AS estado,
        p.estado_id AS estadoId,
        DATE_FORMAT(p.created_at, '%Y-%m-%d') AS fechaRegistro
      FROM proveedores p
      INNER JOIN estados e ON p.estado_id = e.id
      ORDER BY p.id ASC
    `);

    res.json({
      success: true,
      total: rows.length,
      proveedores: rows.map((r) => ({
        id: r.id,
        ruc: r.ruc,
        razonSocial: r.razonSocial,
        contacto: r.contacto || '',
        telefono: r.telefono || '',
        email: r.email || '',
        direccion: r.direccion || '',
        estado: r.estado === 'ACTIVO' ? 'ACTIVO' : 'INACTIVO',
        fechaRegistro: r.fechaRegistro || '',
      })),
    });
  } catch (error: any) {
    console.error('Error al listar proveedores:', error);
    res.status(500).json({ success: false, message: 'Error interno al consultar proveedores.' });
  }
}

/**
 * POST /api/proveedores
 * Crea un nuevo proveedor
 */
export async function createProveedor(req: Request, res: Response): Promise<void> {
  try {
    const { ruc, razonSocial, contacto = '', telefono = '', email = '', direccion = '' } = req.body;

    if (!ruc || !ruc.trim() || ruc.trim().length !== 11) {
      res.status(400).json({ success: false, message: 'El RUC debe tener 11 dígitos numéricos.' });
      return;
    }

    if (!razonSocial || !razonSocial.trim()) {
      res.status(400).json({ success: false, message: 'La razón social es obligatoria.' });
      return;
    }

    // Verificar RUC duplicado
    const [exists] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM proveedores WHERE ruc = ?',
      [ruc.trim()]
    );

    if (exists.length > 0) {
      res.status(409).json({ success: false, message: 'Ya existe un proveedor registrado con ese RUC.' });
      return;
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO proveedores (ruc, razon_social, nombre_contacto, telefono, email, direccion, estado_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [ruc.trim(), razonSocial.trim(), contacto.trim(), telefono.trim(), email.trim(), direccion.trim()]
    );

    res.status(201).json({
      success: true,
      message: 'Proveedor registrado exitosamente.',
      proveedor: {
        id: result.insertId,
        ruc: ruc.trim(),
        razonSocial: razonSocial.trim(),
        contacto: contacto.trim(),
        telefono: telefono.trim(),
        email: email.trim(),
        direccion: direccion.trim(),
        estado: 'ACTIVO',
        fechaRegistro: new Date().toISOString().slice(0, 10),
      },
    });
  } catch (error: any) {
    console.error('Error al crear proveedor:', error);
    res.status(500).json({ success: false, message: 'Error interno al guardar proveedor.' });
  }
}

/**
 * PATCH /api/proveedores/:id/estado
 * Alterna el estado ACTIVO / INACTIVO de un proveedor
 */
export async function toggleProveedorEstado(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'ID de proveedor inválido.' });
      return;
    }

    const [current] = await pool.query<RowDataPacket[]>(
      'SELECT estado_id FROM proveedores WHERE id = ?',
      [id]
    );

    if (current.length === 0) {
      res.status(404).json({ success: false, message: 'Proveedor no encontrado.' });
      return;
    }

    const nuevoEstadoId = current[0].estado_id === 1 ? 2 : 1;
    await pool.query('UPDATE proveedores SET estado_id = ?, updated_at = NOW() WHERE id = ?', [nuevoEstadoId, id]);

    res.json({
      success: true,
      message: `Proveedor ${nuevoEstadoId === 1 ? 'activado' : 'desactivado'} exitosamente.`,
      nuevoEstado: nuevoEstadoId === 1 ? 'ACTIVO' : 'INACTIVO',
    });
  } catch (error: any) {
    console.error('Error al cambiar estado de proveedor:', error);
    res.status(500).json({ success: false, message: 'Error interno al actualizar estado del proveedor.' });
  }
}

/**
 * GET /api/compras
 * Obtiene el historial completo de compras con sus items detallados
 */
export async function getCompras(_req: Request, res: Response): Promise<void> {
  try {
    const [comprasRows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        c.id,
        c.codigo AS codigoComprobante,
        c.proveedor_id AS proveedorId,
        p.ruc AS proveedorRuc,
        p.razon_social AS proveedorRazonSocial,
        c.sucursal_id AS sucursalId,
        COALESCE(s.nombre, 'Principal - Chiclayo Centro') AS sucursalDestino,
        c.usuario_id AS compradorId,
        COALESCE(u.nombre_completo, 'Administrador') AS compradorNombre,
        c.total,
        e.nombre AS estado,
        c.fecha_compra AS fecha,
        c.observaciones
      FROM compras c
      INNER JOIN proveedores p ON c.proveedor_id = p.id
      LEFT JOIN sucursales s ON c.sucursal_id = s.id
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      INNER JOIN estados e ON c.estado_id = e.id
      ORDER BY c.id DESC
    `);

    if (comprasRows.length === 0) {
      res.json({ success: true, total: 0, compras: [] });
      return;
    }

    const compraIds = comprasRows.map((c) => c.id);

    // Obtener items de todas las compras
    const [itemsRows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        dc.id,
        dc.compra_id AS compraId,
        dc.producto_id AS productoId,
        pr.codigo,
        pr.nombre,
        cat.nombre AS categoria,
        m.nombre AS marca,
        dc.cantidad,
        dc.precio_costo_unit AS precioCostoUnitario,
        dc.subtotal
      FROM detalle_compras dc
      INNER JOIN productos pr ON dc.producto_id = pr.id
      INNER JOIN categorias cat ON pr.categoria_id = cat.id
      INNER JOIN marcas m ON pr.marca_id = m.id
      WHERE dc.compra_id IN (?)
      ORDER BY dc.id ASC
    `, [compraIds]);

    // Mapear items por compra
    const itemsMap = new Map<number, any[]>();
    for (const it of itemsRows) {
      if (!itemsMap.has(it.compraId)) {
        itemsMap.set(it.compraId, []);
      }
      itemsMap.get(it.compraId)!.push({
        productoId: it.productoId,
        codigo: it.codigo,
        nombre: it.nombre,
        categoria: it.categoria,
        marca: it.marca,
        cantidad: Number(it.cantidad),
        precioCostoUnitario: Number(it.precioCostoUnitario),
        subtotal: Number(it.subtotal),
      });
    }

    const compras = comprasRows.map((c) => {
      const tot = Number(c.total);
      const sub = Math.round((tot / 1.18) * 100) / 100;
      const igv = Math.round((tot - sub) * 100) / 100;

      return {
        id: c.id,
        codigoComprobante: c.codigoComprobante,
        tipoComprobante: (c.codigoComprobante.startsWith('F') ? 'FACTURA' : c.codigoComprobante.startsWith('B') ? 'BOLETA' : 'GUIA_REMISION') as any,
        proveedorId: c.proveedorId,
        proveedorRuc: c.proveedorRuc,
        proveedorRazonSocial: c.proveedorRazonSocial,
        sucursalDestino: c.sucursalDestino,
        compradorId: c.compradorId || 1,
        compradorNombre: c.compradorNombre,
        fecha: new Date(c.fecha).toLocaleString('es-PE'),
        items: itemsMap.get(c.id) || [],
        subtotal: sub,
        igv: igv,
        total: tot,
        estado: (c.estado === 'ACTIVO' ? 'REGISTRADA' : 'ANULADA') as any,
        observaciones: c.observaciones || '',
      };
    });

    res.json({
      success: true,
      total: compras.length,
      compras,
    });
  } catch (error: any) {
    console.error('Error al listar compras:', error);
    res.status(500).json({ success: false, message: 'Error interno al consultar compras.' });
  }
}

/**
 * POST /api/compras
 * Registra una nueva compra:
 * - Inserta cabecera y detalle en MySQL
 * - Incrementa el stock en producto_stock_sede para la sucursal receptora
 * - Actualiza el precio de costo del producto
 * - Si vienen series físicas de laptops, las inserta en producto_unidades
 */
export async function createCompra(req: Request, res: Response): Promise<void> {
  const connection = await pool.getConnection();
  try {
    const {
      codigoComprobante,
      proveedorId,
      sucursalDestino, // puede ser nombre o ID
      compradorId = 1,
      items = [],
      total,
      observaciones = '',
    } = req.body;

    if (!proveedorId) {
      res.status(400).json({ success: false, message: 'Debe seleccionar un proveedor válido.' });
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'La compra debe contener al menos un producto.' });
      return;
    }

    // Resolver sucursalId numérico
    let targetSucursalId = 1;
    if (typeof sucursalDestino === 'number') {
      targetSucursalId = sucursalDestino;
    } else if (typeof sucursalDestino === 'string') {
      const [sucRows] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM sucursales WHERE nombre LIKE ? LIMIT 1',
        [`%${sucursalDestino.trim()}%`]
      );
      if (sucRows.length > 0) {
        targetSucursalId = sucRows[0].id;
      }
    }

    const cleanCodigo = codigoComprobante && codigoComprobante.trim()
      ? codigoComprobante.trim()
      : `CMP-${Date.now().toString().slice(-6)}`;

    // Calcular total si no viene dado
    const totalCalculado = items.reduce(
      (sum: number, it: any) => sum + (Number(it.cantidad) * Number(it.precioCostoUnitario || it.precioUnitario || 0)),
      0
    );
    const finalTotal = total ? Number(total) : totalCalculado;

    await connection.beginTransaction();

    // 1. Insertar compra cabecera
    const [compraResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO compras (codigo, proveedor_id, sucursal_id, total, estado_id, usuario_id, fecha_compra, observaciones, updated_at)
       VALUES (?, ?, ?, ?, 1, ?, NOW(), ?, NOW())`,
      [cleanCodigo, Number(proveedorId), targetSucursalId, finalTotal, Number(compradorId) || 1, observaciones.trim() || null]
    );

    const newCompraId = compraResult.insertId;

    // 2. Insertar cada item en detalle_compras y actualizar inventario
    for (const item of items) {
      const prodId = Number(item.productoId);
      const cant = Number(item.cantidad) || 1;
      const costoUnit = Number(item.precioCostoUnitario || item.precioUnitario || 0);
      const itemSubtotal = cant * costoUnit;

      await connection.query(
        `INSERT INTO detalle_compras (compra_id, producto_id, cantidad, precio_costo_unit, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [newCompraId, prodId, cant, costoUnit, itemSubtotal]
      );

      // Incrementar stock en producto_stock_sede
      const [stockExists] = await connection.query<RowDataPacket[]>(
        'SELECT stock FROM producto_stock_sede WHERE producto_id = ? AND sucursal_id = ?',
        [prodId, targetSucursalId]
      );

      if (stockExists.length > 0) {
        await connection.query(
          'UPDATE producto_stock_sede SET stock = stock + ?, updated_at = NOW() WHERE producto_id = ? AND sucursal_id = ?',
          [cant, prodId, targetSucursalId]
        );
      } else {
        await connection.query(
          'INSERT INTO producto_stock_sede (producto_id, sucursal_id, stock, updated_at) VALUES (?, ?, ?, NOW())',
          [prodId, targetSucursalId, cant]
        );
      }

      // Actualizar precio de costo referencial del producto
      if (costoUnit > 0) {
        await connection.query(
          'UPDATE productos SET precio_costo = ?, updated_at = NOW() WHERE id = ?',
          [costoUnit, prodId]
        );
      }

      // Si el item viene con series físicas (ej: laptops recién adquiridas)
      if (Array.isArray(item.series) && item.series.length > 0) {
        for (const s of item.series) {
          if (s && String(s).trim()) {
            await connection.query(
              `INSERT INTO producto_unidades 
               (producto_id, sucursal_id, numero_serie, estado_unidad_id, tipo_destino, disponible_venta, condicion, costo_adquisicion, fecha_ingreso)
               VALUES (?, ?, ?, 1, 'VENTA', 1, 'NUEVO', ?, NOW())`,
              [prodId, targetSucursalId, String(s).trim(), costoUnit]
            );
          }
        }
      }
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: `Compra ${cleanCodigo} registrada exitosamente. Inventario actualizado.`,
      compraId: newCompraId,
      codigoComprobante: cleanCodigo,
    });
  } catch (error: any) {
    await connection.rollback();
    console.error('Error al registrar compra:', error);
    res.status(500).json({ success: false, message: 'Error interno al registrar la compra.' });
  } finally {
    connection.release();
  }
}

/**
 * PUT /api/compras/:id/anular
 * Anula una compra y revierte el stock ingresado a la sede
 */
export async function anularCompra(req: Request, res: Response): Promise<void> {
  const connection = await pool.getConnection();
  try {
    const compraId = Number(req.params.id);
    if (isNaN(compraId)) {
      res.status(400).json({ success: false, message: 'ID de compra inválido.' });
      return;
    }

    const [compraRows] = await connection.query<RowDataPacket[]>(
      'SELECT id, codigo, sucursal_id, estado_id FROM compras WHERE id = ?',
      [compraId]
    );

    if (compraRows.length === 0) {
      res.status(404).json({ success: false, message: 'Compra no encontrada.' });
      return;
    }

    const cmp = compraRows[0];
    if (cmp.estado_id !== 1) {
      res.status(400).json({ success: false, message: 'La compra ya se encuentra anulada.' });
      return;
    }

    await connection.beginTransaction();

    // Obtener items para revertir stock
    const [items] = await connection.query<RowDataPacket[]>(
      'SELECT producto_id, cantidad FROM detalle_compras WHERE compra_id = ?',
      [compraId]
    );

    for (const it of items) {
      await connection.query(
        'UPDATE producto_stock_sede SET stock = GREATEST(0, stock - ?), updated_at = NOW() WHERE producto_id = ? AND sucursal_id = ?',
        [Number(it.cantidad), it.producto_id, cmp.sucursal_id]
      );
    }

    // Marcar compra como inactiva / anulada (estado_id = 2)
    await connection.query('UPDATE compras SET estado_id = 2, updated_at = NOW() WHERE id = ?', [compraId]);

    await connection.commit();

    res.json({
      success: true,
      message: `Compra ${cmp.codigo} anulada exitosamente y stock revertido.`,
    });
  } catch (error: any) {
    await connection.rollback();
    console.error('Error al anular compra:', error);
    res.status(500).json({ success: false, message: 'Error interno al anular la compra.' });
  } finally {
    connection.release();
  }
}
