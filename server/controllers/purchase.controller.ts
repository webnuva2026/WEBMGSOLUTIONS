import { Request, Response } from 'express';
import { pool } from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dispatchEmail } from '../utils/mailer';

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
 * PUT /api/proveedores/:id
 * Actualiza los datos de un proveedor existente
 */
export async function updateProveedor(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'ID de proveedor inválido.' });
      return;
    }

    const { ruc, razonSocial, contacto = '', telefono = '', email = '', direccion = '' } = req.body;

    if (!ruc || !ruc.trim() || ruc.trim().length !== 11) {
      res.status(400).json({ success: false, message: 'El RUC debe tener 11 dígitos numéricos.' });
      return;
    }

    if (!razonSocial || !razonSocial.trim()) {
      res.status(400).json({ success: false, message: 'La razón social es obligatoria.' });
      return;
    }

    await pool.query(
      `UPDATE proveedores 
       SET ruc = ?, razon_social = ?, nombre_contacto = ?, telefono = ?, email = ?, direccion = ?, updated_at = NOW()
       WHERE id = ?`,
      [ruc.trim(), razonSocial.trim(), contacto.trim(), telefono.trim(), email.trim(), direccion.trim(), id]
    );

    res.json({
      success: true,
      message: 'Proveedor actualizado exitosamente.',
      proveedor: {
        id,
        ruc: ruc.trim(),
        razonSocial: razonSocial.trim(),
        contacto: contacto.trim(),
        telefono: telefono.trim(),
        email: email.trim(),
        direccion: direccion.trim(),
        estado: 'ACTIVO',
      },
    });
  } catch (error: any) {
    console.error('Error al actualizar proveedor:', error);
    res.status(500).json({ success: false, message: 'Error interno al actualizar proveedor.' });
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
 * Obtiene el historial completo de órdenes de pedido y compras recepcionadas con sus items detallados
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
        p.email AS proveedorEmail,
        p.telefono AS proveedorTelefono,
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

    // Obtener items de todas las compras incluyendo requiere_serie
    const [itemsRows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        dc.id,
        dc.compra_id AS compraId,
        dc.producto_id AS productoId,
        pr.codigo,
        pr.nombre,
        pr.requiere_serie AS requiereSerie,
        pr.tipo_destino AS tipoDestino,
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
        requiereSerie: Boolean(it.requiereSerie) || Number(it.requiereSerie) === 1,
        tipoDestino: it.tipoDestino || 'VENTA',
      });
    }

    const compras = comprasRows.map((c) => {
      const tot = Number(c.total);
      const sub = Math.round((tot / 1.18) * 100) / 100;
      const igv = Math.round((tot - sub) * 100) / 100;
      const rawObs = String(c.observaciones || '');
      const isPendingOrder = rawObs.startsWith('[PEDIDO_SOLICITADO]');
      const cleanObs = rawObs
        .replace(/^\[PEDIDO_SOLICITADO\]\s*/i, '')
        .replace(/^\[RECIBIDO_ALMACEN\]\s*/i, '')
        .trim();

      const estadoResolved =
        c.estado !== 'ACTIVO'
          ? 'ANULADA'
          : isPendingOrder
          ? 'SOLICITADO'
          : 'REGISTRADA';

      const tipoCompResolved = c.codigoComprobante.startsWith('OC-')
        ? 'ORDEN_COMPRA'
        : c.codigoComprobante.startsWith('F')
        ? 'FACTURA'
        : c.codigoComprobante.startsWith('B')
        ? 'BOLETA'
        : 'GUIA_REMISION';

      return {
        id: c.id,
        codigoComprobante: c.codigoComprobante,
        tipoComprobante: tipoCompResolved as any,
        proveedorId: c.proveedorId,
        proveedorRuc: c.proveedorRuc,
        proveedorRazonSocial: c.proveedorRazonSocial,
        proveedorEmail: c.proveedorEmail || '',
        proveedorTelefono: c.proveedorTelefono || '',
        sucursalDestino: c.sucursalDestino,
        compradorId: c.compradorId || 1,
        compradorNombre: c.compradorNombre,
        fecha: new Date(c.fecha).toLocaleString('es-PE'),
        items: itemsMap.get(c.id) || [],
        subtotal: sub,
        igv: igv,
        total: tot,
        estado: estadoResolved as any,
        observaciones: cleanObs,
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
 * Registra una Orden de Pedido a Proveedor (SOLICITADO) o una Recepción Directa (REGISTRADA):
 * - Si modoIngreso === 'SOLICITADO': Crea el pedido al proveedor SIN incrementar stock hasta que Almacén confirme la recepción física.
 * - Si modoIngreso === 'RECEPCION_DIRECTA': Incrementa el stock e ingresa series inmediatamente.
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
      modoIngreso = 'SOLICITADO', // 'SOLICITADO' | 'RECEPCION_DIRECTA'
    } = req.body;

    if (!proveedorId) {
      res.status(400).json({ success: false, message: 'Debe seleccionar un proveedor válido.' });
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'El pedido debe contener al menos un producto.' });
      return;
    }

    const isPendingOrder = modoIngreso === 'SOLICITADO';

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

    const cleanCodigo =
      codigoComprobante && codigoComprobante.trim()
        ? codigoComprobante.trim()
        : isPendingOrder
        ? `OC-${Date.now().toString().slice(-6)}`
        : `CMP-${Date.now().toString().slice(-6)}`;

    // Calcular total si no viene dado
    const totalCalculado = items.reduce(
      (sum: number, it: any) => sum + Number(it.cantidad) * Number(it.precioCostoUnitario || it.precioUnitario || 0),
      0
    );
    const finalTotal = total ? Number(total) : totalCalculado;

    const storedObservaciones = isPendingOrder
      ? `[PEDIDO_SOLICITADO] ${(observaciones || 'Orden de pedido emitida a proveedor. Pendiente de recepción física en almacén.').trim()}`
      : `[RECIBIDO_ALMACEN] ${(observaciones || 'Ingreso recepcionado conforme en almacén.').trim()}`;

    await connection.beginTransaction();

    // 1. Insertar compra cabecera
    const [compraResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO compras (codigo, proveedor_id, sucursal_id, total, estado_id, usuario_id, fecha_compra, observaciones, updated_at)
       VALUES (?, ?, ?, ?, 1, ?, NOW(), ?, NOW())`,
      [cleanCodigo, Number(proveedorId), targetSucursalId, finalTotal, Number(compradorId) || 1, storedObservaciones]
    );

    const newCompraId = compraResult.insertId;

    // 2. Insertar cada item en detalle_compras (y actualizar inventario SOLO si no es un pedido pendiente)
    for (const item of items) {
      const prodId = Number(item.productoId);
      const cant = Number(item.cantidad) || 1;
      const costoUnit = Number(item.precioCostoUnitario || item.precioUnitario || 0);
      const itemSubtotal = cant * costoUnit;

      const [prodCheck] = await connection.query<RowDataPacket[]>(
        'SELECT id, nombre, requiere_serie, tipo_destino FROM productos WHERE id = ?',
        [prodId]
      );
      if (prodCheck.length === 0) {
        await connection.rollback();
        res.status(400).json({
          success: false,
          message: `El producto '${item.nombre || 'ID ' + prodId}' no existe en la base de datos de almacén.`,
        });
        return;
      }

      await connection.query(
        `INSERT INTO detalle_compras (compra_id, producto_id, cantidad, precio_costo_unit, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [newCompraId, prodId, cant, costoUnit, itemSubtotal]
      );

      // Si es RECEPCION_DIRECTA, ingresamos el stock y las series al almacén en este momento
      if (!isPendingOrder) {
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

        if (costoUnit > 0) {
          await connection.query(
            'UPDATE productos SET precio_costo = ?, updated_at = NOW() WHERE id = ?',
            [costoUnit, prodId]
          );
        }

        if (Array.isArray(item.series) && item.series.length > 0) {
          const destinoProd = prodCheck[0].tipo_destino || 'VENTA';
          for (const s of item.series) {
            const cleanSerie = String(s || '').trim().toUpperCase();
            if (!cleanSerie) continue;

            const [existingUnit] = await connection.query<RowDataPacket[]>(
              'SELECT id FROM producto_unidades WHERE producto_id = ? AND numero_serie = ?',
              [prodId, cleanSerie]
            );

            if (existingUnit.length > 0) {
              await connection.query(
                `UPDATE producto_unidades 
                 SET sucursal_id = ?, estado_unidad_id = 1, disponible_venta = 1, condicion = 'NUEVO', costo_adquisicion = ?, updated_at = NOW()
                 WHERE id = ?`,
                [targetSucursalId, costoUnit, existingUnit[0].id]
              );
            } else {
              await connection.query(
                `INSERT INTO producto_unidades 
                 (producto_id, sucursal_id, numero_serie, estado_unidad_id, tipo_destino, disponible_venta, condicion, costo_adquisicion, fecha_ingreso)
                 VALUES (?, ?, ?, 1, ?, 1, 'NUEVO', ?, NOW())`,
                [prodId, targetSucursalId, cleanSerie, destinoProd, costoUnit]
              );
            }
          }
        }
      }
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: isPendingOrder
        ? `Orden de Pedido ${cleanCodigo} emitida al proveedor. Pendiente de Recepción Física en Almacén.`
        : `Recepción ${cleanCodigo} registrada exitosamente. Stock actualizado en Almacén.`,
      compraId: newCompraId,
      codigoComprobante: cleanCodigo,
      estado: isPendingOrder ? 'SOLICITADO' : 'REGISTRADA',
    });
  } catch (error: any) {
    await connection.rollback();
    console.error('Error al registrar compra/pedido:', error);
    res.status(500).json({ success: false, message: 'Error interno al registrar el pedido/compra.' });
  } finally {
    connection.release();
  }
}

/**
 * POST /api/compras/:id/recepcionar
 * Confirma la Recepción Física en Almacén de un pedido que estaba en estado SOLICITADO:
 * - Valida que el pedido esté pendiente ([PEDIDO_SOLICITADO])
 * - Registra la Factura / Guía real del proveedor
 * - Registra los números de serie individuales en producto_unidades (si aplica)
 * - Incrementa el stock real en producto_stock_sede para Ventas POS y Taller Técnico
 */
export async function recepcionarCompra(req: Request, res: Response): Promise<void> {
  const connection = await pool.getConnection();
  try {
    const compraId = Number(req.params.id);
    if (isNaN(compraId)) {
      res.status(400).json({ success: false, message: 'ID de pedido inválido.' });
      return;
    }

    const {
      codigoComprobante,
      observacionesRecepcion = '',
      seriesPorProducto = {}, // Record<number, string[]>
    } = req.body;

    const [compraRows] = await connection.query<RowDataPacket[]>(
      'SELECT id, codigo, sucursal_id, estado_id, observaciones FROM compras WHERE id = ?',
      [compraId]
    );

    if (compraRows.length === 0) {
      res.status(404).json({ success: false, message: 'Orden de pedido no encontrada.' });
      return;
    }

    const cmp = compraRows[0];
    if (cmp.estado_id !== 1) {
      res.status(400).json({ success: false, message: 'No se puede recepcionar un pedido anulado.' });
      return;
    }

    const rawObs = String(cmp.observaciones || '');
    if (!rawObs.startsWith('[PEDIDO_SOLICITADO]')) {
      res.status(400).json({
        success: false,
        message: 'Este pedido ya fue recepcionado previamente en el almacén.',
      });
      return;
    }

    // Obtener items del pedido
    const [items] = await connection.query<RowDataPacket[]>(
      `SELECT dc.producto_id AS productoId, dc.cantidad, dc.precio_costo_unit AS costoUnit,
              pr.nombre, pr.requiere_serie AS requiereSerie, pr.tipo_destino AS tipoDestino
       FROM detalle_compras dc
       INNER JOIN productos pr ON dc.producto_id = pr.id
       WHERE dc.compra_id = ?`,
      [compraId]
    );

    // Validar series requeridas antes de alterar el stock
    for (const it of items) {
      const reqSerie = Boolean(it.requiereSerie) || Number(it.requiereSerie) === 1;
      if (reqSerie) {
        const providedSeries: string[] = Array.isArray(seriesPorProducto[it.productoId])
          ? seriesPorProducto[it.productoId].map((s: string) => String(s).trim()).filter(Boolean)
          : [];
        if (providedSeries.length < Number(it.cantidad)) {
          res.status(400).json({
            success: false,
            message: `Integridad de Almacén: El producto "${it.nombre}" requiere registrar ${it.cantidad} número(s) de serie físicos para poder ingresar al almacén (registrados: ${providedSeries.length}).`,
          });
          return;
        }
      }
    }

    await connection.beginTransaction();

    const targetSucursalId = Number(cmp.sucursal_id) || 1;

    for (const it of items) {
      const prodId = Number(it.productoId);
      const cant = Number(it.cantidad) || 1;
      const costoUnit = Number(it.costoUnit) || 0;
      const destinoProd = it.tipoDestino || 'VENTA';

      // 1. Incrementar stock en producto_stock_sede
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

      // 2. Actualizar precio costo del producto
      if (costoUnit > 0) {
        await connection.query(
          'UPDATE productos SET precio_costo = ?, updated_at = NOW() WHERE id = ?',
          [costoUnit, prodId]
        );
      }

      // 3. Insertar números de serie en producto_unidades si aplica
      const providedSeries: string[] = Array.isArray(seriesPorProducto[prodId])
        ? seriesPorProducto[prodId]
        : [];
      for (const s of providedSeries) {
        const cleanSerie = String(s || '').trim().toUpperCase();
        if (!cleanSerie) continue;

        const [existingUnit] = await connection.query<RowDataPacket[]>(
          'SELECT id FROM producto_unidades WHERE producto_id = ? AND numero_serie = ?',
          [prodId, cleanSerie]
        );

        if (existingUnit.length > 0) {
          await connection.query(
            `UPDATE producto_unidades 
             SET sucursal_id = ?, estado_unidad_id = 1, disponible_venta = 1, condicion = 'NUEVO', costo_adquisicion = ?, updated_at = NOW()
             WHERE id = ?`,
            [targetSucursalId, costoUnit, existingUnit[0].id]
          );
        } else {
          await connection.query(
            `INSERT INTO producto_unidades 
             (producto_id, sucursal_id, numero_serie, estado_unidad_id, tipo_destino, disponible_venta, condicion, costo_adquisicion, fecha_ingreso)
             VALUES (?, ?, ?, 1, ?, 1, 'NUEVO', ?, NOW())`,
            [prodId, targetSucursalId, cleanSerie, destinoProd, costoUnit]
          );
        }
      }
    }

    const prevCleanObs = rawObs.replace(/^\[PEDIDO_SOLICITADO\]\s*/i, '').trim();
    const finalObs = `[RECIBIDO_ALMACEN] ${prevCleanObs}${
      observacionesRecepcion.trim() ? ` | Recepción: ${observacionesRecepcion.trim()}` : ''
    }`;
    const finalCodigo =
      codigoComprobante && String(codigoComprobante).trim()
        ? String(codigoComprobante).trim().toUpperCase()
        : cmp.codigo;

    await connection.query(
      'UPDATE compras SET codigo = ?, observaciones = ?, updated_at = NOW() WHERE id = ?',
      [finalCodigo, finalObs, compraId]
    );

    await connection.commit();

    res.json({
      success: true,
      message: `Mercadería recepcionada conforme (${finalCodigo}). El stock ya está disponible para Ventas POS y Taller Técnico.`,
      codigoComprobante: finalCodigo,
      estado: 'REGISTRADA',
    });
  } catch (error: any) {
    await connection.rollback();
    console.error('Error al recepcionar pedido en almacén:', error);
    res.status(500).json({ success: false, message: 'Error interno al recepcionar el pedido en almacén.' });
  } finally {
    connection.release();
  }
}

/**
 * POST /api/compras/:id/enviar-email
 * Envía la Orden de Pedido / Compra oficial al correo registrado del Proveedor (bloqueado por integridad)
 */
export async function enviarOrdenCompraEmail(req: Request, res: Response): Promise<void> {
  try {
    const compraId = Number(req.params.id);
    if (isNaN(compraId)) {
      res.status(400).json({ success: false, message: 'ID de orden inválido.' });
      return;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.id, c.codigo, c.total, c.fecha_compra AS fecha, c.observaciones,
              p.ruc AS proveedorRuc, p.razon_social AS proveedorRazonSocial, p.email AS proveedorEmail, p.nombre_contacto AS contacto,
              COALESCE(s.nombre, 'Principal - Chiclayo Centro') AS sucursalDestino
       FROM compras c
       INNER JOIN proveedores p ON c.proveedor_id = p.id
       LEFT JOIN sucursales s ON c.sucursal_id = s.id
       WHERE c.id = ?`,
      [compraId]
    );

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Orden de pedido no encontrada.' });
      return;
    }

    const order = rows[0];
    const targetEmail = String(order.proveedorEmail || '').trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      res.status(400).json({
        success: false,
        message: 'El proveedor seleccionado no tiene un correo electrónico oficial registrado en el Directorio de Proveedores.',
      });
      return;
    }

    const [items] = await pool.query<RowDataPacket[]>(
      `SELECT pr.codigo, pr.nombre, dc.cantidad, dc.precio_costo_unit AS precioUnitario, dc.subtotal
       FROM detalle_compras dc
       INNER JOIN productos pr ON dc.producto_id = pr.id
       WHERE dc.compra_id = ?`,
      [compraId]
    );

    const rowsHtml = items
      .map(
        (it) => `
        <tr>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-family:monospace;font-size:12px;">${it.codigo}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;font-weight:600;">${it.nombre}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:12px;font-weight:700;">${it.cantidad}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:right;font-size:12px;">S/ ${Number(it.precioUnitario).toFixed(2)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:right;font-size:12px;font-weight:700;">S/ ${Number(it.subtotal).toFixed(2)}</td>
        </tr>`
      )
      .join('');

    const cleanObs = String(order.observaciones || '')
      .replace(/^\[PEDIDO_SOLICITADO\]\s*/i, '')
      .replace(/^\[RECIBIDO_ALMACEN\]\s*/i, '');

    const html = `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:640px;margin:0 auto;border:1px solid #cbd5e1;border-radius:12px;overflow:hidden;background:#ffffff;">
        <div style="background:#00346F;color:#ffffff;padding:20px 24px;">
          <h2 style="margin:0;font-size:18px;">ORDEN DE PEDIDO A PROVEEDOR • ${order.codigo}</h2>
          <p style="margin:4px 0 0;font-size:12px;color:#bfdbfe;">MG SOLUTIONS GROUP S.A.C. • Logística & Abastecimiento de Almacén</p>
        </div>
        <div style="padding:20px 24px;color:#1e293b;font-size:13px;">
          <p>Estimados <strong>${order.proveedorRazonSocial}</strong> (RUC: ${order.proveedorRuc}),</p>
          <p>Por medio de la presente les remitimos nuestra Orden de Pedido oficial para abastecimiento de nuestra sede <strong>${order.sucursalDestino}</strong>:</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f8fafc;border-radius:8px;">
            <thead>
              <tr style="background:#e2e8f0;color:#0f172a;font-size:11px;text-transform:uppercase;">
                <th style="padding:8px 10px;text-align:left;">Código</th>
                <th style="padding:8px 10px;text-align:left;">Descripción / Repuesto / Equipo</th>
                <th style="padding:8px 10px;text-align:center;">Cant.</th>
                <th style="padding:8px 10px;text-align:right;">Costo Unit.</th>
                <th style="padding:8px 10px;text-align:right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <div style="text-align:right;font-size:15px;font-weight:800;color:#00346F;margin-top:12px;">
            TOTAL ORDENADO: S/ ${Number(order.total).toFixed(2)}
          </div>
          ${cleanObs ? `<p style="margin-top:14px;padding:10px;background:#f1f5f9;border-left:4px solid #00346F;font-size:12px;"><strong>Observaciones de Almacén:</strong> ${cleanObs}</p>` : ''}
          <p style="margin-top:18px;font-size:11px;color:#64748b;">Favor de adjuntar Factura Electrónica y Guía de Remisión al momento de la entrega física en nuestro almacén.</p>
        </div>
      </div>
    `;

    await dispatchEmail({
      to: targetEmail,
      subject: `Orden de Pedido ${order.codigo} - MG Solutions Group S.A.C.`,
      text: `Orden de Pedido ${order.codigo} para ${order.proveedorRazonSocial} por S/ ${Number(order.total).toFixed(2)}`,
      html,
    });

    res.json({
      success: true,
      message: `Orden de Pedido ${order.codigo} enviada exitosamente al correo oficial del proveedor (${targetEmail}).`,
    });
  } catch (error: any) {
    console.error('Error al enviar orden de compra por correo:', error);
    res.status(500).json({ success: false, message: 'No se pudo enviar el correo al proveedor.' });
  }
}

/**
 * PUT /api/compras/:id/anular
 * Anula una orden de pedido o compra:
 * - Si estaba SOLICITADO (en tránsito), solo cambia el estado a ANULADA sin restar stock.
 * - Si ya estaba REGISTRADA (recibida en almacén), revierte el stock ingresado a la sede.
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
      'SELECT id, codigo, sucursal_id, estado_id, observaciones FROM compras WHERE id = ?',
      [compraId]
    );

    if (compraRows.length === 0) {
      res.status(404).json({ success: false, message: 'Orden o compra no encontrada.' });
      return;
    }

    const cmp = compraRows[0];
    if (cmp.estado_id !== 1) {
      res.status(400).json({ success: false, message: 'El registro ya se encuentra anulado.' });
      return;
    }

    const wasPendingOrder = String(cmp.observaciones || '').startsWith('[PEDIDO_SOLICITADO]');

    await connection.beginTransaction();

    // Solo revertir stock si la mercadería YA había sido recepcionada físicamente en almacén
    if (!wasPendingOrder) {
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
    }

    // Marcar compra como inactiva / anulada (estado_id = 2)
    await connection.query('UPDATE compras SET estado_id = 2, updated_at = NOW() WHERE id = ?', [compraId]);

    await connection.commit();

    res.json({
      success: true,
      message: wasPendingOrder
        ? `Orden de Pedido ${cmp.codigo} cancelada antes de recepción (sin alterar stock).`
        : `Recepción ${cmp.codigo} anulada exitosamente y stock revertido en almacén.`,
    });
  } catch (error: any) {
    await connection.rollback();
    console.error('Error al anular compra:', error);
    res.status(500).json({ success: false, message: 'Error interno al anular el registro.' });
  } finally {
    connection.release();
  }
}
