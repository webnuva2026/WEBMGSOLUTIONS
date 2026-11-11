import { Request, Response } from 'express';
import { pool } from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * GET /api/almacen/movimientos
 * Obtiene el historial de movimientos y préstamos de inventario entre sedes
 */
export async function getMovimientos(req: Request, res: Response): Promise<void> {
  try {
    const { tipo, estado, sedeId } = req.query;

    let query = `
      SELECT 
        m.id,
        m.codigo,
        m.tipo,
        m.producto_id AS productoId,
        p.nombre AS productoNombre,
        p.codigo AS productoCodigo,
        p.requiere_serie AS requiereSerie,
        m.sede_origen_id AS sedeOrigenId,
        so.nombre AS sedeOrigenNombre,
        m.sede_destino_id AS sedeDestinoId,
        sd.nombre AS sedeDestinoNombre,
        m.cantidad,
        m.series,
        m.solicitado_por AS solicitadoPor,
        m.aprobado_por AS aprobadoPor,
        m.recibido_por AS recibidoPor,
        m.estado_movimiento_id AS estadoMovimientoId,
        em.codigo AS estadoCodigo,
        em.nombre AS estadoNombre,
        em.color_hex AS estadoColor,
        m.motivo,
        m.observaciones,
        m.fecha_solicitud AS fechaSolicitud,
        m.fecha_aprobacion AS fechaAprobacion,
        m.fecha_envio AS fechaEnvio,
        m.fecha_recepcion AS fechaRecepcion,
        m.fecha_devolucion AS fechaDevolucion,
        m.created_at AS createdAt
      FROM movimientos_inventario m
      INNER JOIN productos p ON m.producto_id = p.id
      INNER JOIN sucursales so ON m.sede_origen_id = so.id
      INNER JOIN sucursales sd ON m.sede_destino_id = sd.id
      INNER JOIN estados_movimiento em ON m.estado_movimiento_id = em.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (tipo && (tipo === 'TRASLADO' || tipo === 'PRESTAMO')) {
      query += ' AND m.tipo = ?';
      params.push(tipo);
    }

    if (estado) {
      query += ' AND em.codigo = ?';
      params.push(estado);
    }

    if (sedeId && !isNaN(Number(sedeId))) {
      query += ' AND (m.sede_origen_id = ? OR m.sede_destino_id = ?)';
      params.push(Number(sedeId), Number(sedeId));
    }

    query += ' ORDER BY m.id DESC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    const movimientos = rows.map((r) => {
      let parsedSeries: string[] = [];
      if (r.series) {
        try {
          parsedSeries = JSON.parse(r.series);
        } catch {
          parsedSeries = String(r.series).split(',').map((s) => s.trim()).filter(Boolean);
        }
      }

      return {
        id: r.id,
        codigo: r.codigo,
        tipo: r.tipo,
        productoId: r.productoId,
        productoNombre: r.productoNombre,
        productoCodigo: r.productoCodigo,
        requiereSerie: Boolean(r.requiereSerie),
        sedeOrigenId: r.sedeOrigenId,
        sedeOrigen: r.sedeOrigenNombre,
        sedeDestinoId: r.sedeDestinoId,
        sedeDestino: r.sedeDestinoNombre,
        cantidad: Number(r.cantidad),
        series: parsedSeries,
        solicitadoPor: r.solicitadoPor,
        aprobadoPor: r.aprobadoPor,
        recibidoPor: r.recibidoPor,
        estado: r.estadoCodigo,
        estadoNombre: r.estadoNombre,
        estadoColor: r.estadoColor,
        motivo: r.motivo || '',
        observaciones: r.observaciones || '',
        fecha: r.fechaSolicitud ? new Date(r.fechaSolicitud).toLocaleDateString('es-PE') : '',
        fechaSolicitud: r.fechaSolicitud,
        fechaAprobacion: r.fechaAprobacion,
        fechaEnvio: r.fechaEnvio,
        fechaRecepcion: r.fechaRecepcion,
        fechaDevolucion: r.fechaDevolucion,
      };
    });

    res.json({
      success: true,
      total: movimientos.length,
      movimientos,
    });
  } catch (error: any) {
    console.error('Error al listar movimientos de inventario:', error);
    res.status(500).json({ success: false, message: 'Error interno al consultar movimientos de inventario.' });
  }
}

/**
 * GET /api/almacen/series-disponibles
 * Obtiene las series físicas disponibles de un producto en una sucursal específica
 */
export async function getSeriesDisponiblesSede(req: Request, res: Response): Promise<void> {
  try {
    const productoId = Number(req.query.productoId);
    const sucursalId = Number(req.query.sucursalId);

    if (isNaN(productoId) || isNaN(sucursalId)) {
      res.status(400).json({ success: false, message: 'Parámetros productoId y sucursalId requeridos.' });
      return;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, numero_serie, condicion, observaciones
       FROM producto_unidades
       WHERE producto_id = ? AND sucursal_id = ? AND estado_unidad_id = 1 AND disponible_venta = 1
       ORDER BY numero_serie ASC`,
      [productoId, sucursalId]
    );

    res.json({
      success: true,
      total: rows.length,
      series: rows.map((r) => ({
        id: r.id,
        numeroSerie: r.numero_serie,
        condicion: r.condicion,
        observaciones: r.observaciones,
      })),
    });
  } catch (error: any) {
    console.error('Error al obtener series disponibles en sede:', error);
    res.status(500).json({ success: false, message: 'Error interno al consultar series disponibles.' });
  }
}

/**
 * POST /api/almacen/movimientos
 * Registra una nueva solicitud de traslado definitivo o préstamo temporal entre sedes
 */
export async function createMovimiento(req: Request, res: Response): Promise<void> {
  const connection = await pool.getConnection();
  try {
    const {
      tipo = 'TRASLADO', // 'TRASLADO' | 'PRESTAMO'
      productoId,
      sedeOrigenId,
      sedeDestinoId,
      cantidad = 1,
      series = [],
      solicitadoPor,
      motivo = '',
      observaciones = '',
    } = req.body;

    if (!productoId || !sedeOrigenId || !sedeDestinoId) {
      res.status(400).json({ success: false, message: 'Producto, sede de origen y sede de destino son requeridos.' });
      return;
    }

    if (Number(sedeOrigenId) === Number(sedeDestinoId)) {
      res.status(400).json({ success: false, message: 'La sede de origen no puede ser igual a la sede de destino.' });
      return;
    }

    const numCantidad = Number(cantidad);
    if (isNaN(numCantidad) || numCantidad < 1) {
      res.status(400).json({ success: false, message: 'La cantidad a trasladar debe ser mayor a cero.' });
      return;
    }

    // Verificar producto
    const [prods] = await connection.query<RowDataPacket[]>(
      'SELECT id, nombre, requiere_serie FROM productos WHERE id = ?',
      [productoId]
    );

    if (prods.length === 0) {
      res.status(404).json({ success: false, message: 'Producto no encontrado.' });
      return;
    }

    const prod = prods[0];

    // Verificar stock disponible en la sede origen
    const [stockOrigenRows] = await connection.query<RowDataPacket[]>(
      'SELECT stock FROM producto_stock_sede WHERE producto_id = ? AND sucursal_id = ?',
      [productoId, sedeOrigenId]
    );

    const stockDisponible = stockOrigenRows.length > 0 ? Number(stockOrigenRows[0].stock) : 0;
    if (stockDisponible < numCantidad) {
      res.status(400).json({
        success: false,
        message: `Stock insuficiente en la sede origen. Disponible: ${stockDisponible}, Solicitado: ${numCantidad}.`,
      });
      return;
    }

    // Validar series si fueron provistas
    let seriesList: string[] = [];
    if (Array.isArray(series) && series.length > 0) {
      seriesList = series.map((s: any) => String(s).trim()).filter(Boolean);
      if (seriesList.length !== numCantidad) {
        res.status(400).json({
          success: false,
          message: `Debe seleccionar exactamente ${numCantidad} número(s) de serie. (Seleccionados: ${seriesList.length}).`,
        });
        return;
      }

      // Comprobar que las series existan en sede origen y estén disponibles
      const [seriesEnOrigen] = await connection.query<RowDataPacket[]>(
        `SELECT numero_serie FROM producto_unidades 
         WHERE producto_id = ? AND sucursal_id = ? AND estado_unidad_id = 1 AND numero_serie IN (?)`,
        [productoId, sedeOrigenId, seriesList]
      );

      if (seriesEnOrigen.length !== seriesList.length) {
        res.status(400).json({
          success: false,
          message: 'Una o más series seleccionadas no se encuentran disponibles en la sede origen.',
        });
        return;
      }
    }

    // Generar código único para el movimiento
    const prefix = tipo === 'PRESTAMO' ? 'PREST' : 'TRASL';
    const codigo = `${prefix}-${Date.now().toString().slice(-6)}`;

    const [insertResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO movimientos_inventario 
       (codigo, tipo, producto_id, sede_origen_id, sede_destino_id, cantidad, series, solicitado_por, estado_movimiento_id, motivo, observaciones, fecha_solicitud)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NOW())`,
      [
        codigo,
        tipo,
        productoId,
        sedeOrigenId,
        sedeDestinoId,
        numCantidad,
        seriesList.length > 0 ? JSON.stringify(seriesList) : null,
        solicitadoPor || 'Usuario',
        motivo.trim() || null,
        observaciones.trim() || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: `${tipo === 'PRESTAMO' ? 'Préstamo' : 'Traslado'} registrado exitosamente con código ${codigo}.`,
      movimientoId: insertResult.insertId,
      codigo,
    });
  } catch (error: any) {
    console.error('Error al registrar movimiento entre sedes:', error);
    res.status(500).json({ success: false, message: 'Error interno al registrar el movimiento.' });
  } finally {
    connection.release();
  }
}

/**
 * PUT /api/almacen/movimientos/:id/estado
 * Actualiza el estado de un movimiento/préstamo en el ciclo de vida:
 * SOLICITADO -> APROBADO -> EN_TRANSITO -> RECIBIDO -> (DEVUELTO si es préstamo) | CANCELADO
 */
export async function updateEstadoMovimiento(req: Request, res: Response): Promise<void> {
  const connection = await pool.getConnection();
  try {
    const movimientoId = Number(req.params.id);
    const { estadoCodigo, usuarioNombre = 'Administrador' } = req.body;

    if (isNaN(movimientoId) || !estadoCodigo) {
      res.status(400).json({ success: false, message: 'ID de movimiento y estadoCodigo son requeridos.' });
      return;
    }

    // Obtener movimiento actual
    const [movRows] = await connection.query<RowDataPacket[]>(
      `SELECT m.*, em.codigo AS estadoActualCodigo 
       FROM movimientos_inventario m
       INNER JOIN estados_movimiento em ON m.estado_movimiento_id = em.id
       WHERE m.id = ?`,
      [movimientoId]
    );

    if (movRows.length === 0) {
      res.status(404).json({ success: false, message: 'Movimiento no encontrado.' });
      return;
    }

    const mov = movRows[0];
    const estadoActual = mov.estadoActualCodigo;

    // Obtener ID del nuevo estado
    const [estadoRows] = await connection.query<RowDataPacket[]>(
      'SELECT id, codigo, nombre FROM estados_movimiento WHERE codigo = ?',
      [estadoCodigo]
    );

    if (estadoRows.length === 0) {
      res.status(400).json({ success: false, message: `Estado '${estadoCodigo}' no reconocido.` });
      return;
    }

    const nuevoEstadoId = estadoRows[0].id;
    let seriesList: string[] = [];
    if (mov.series) {
      try {
        seriesList = JSON.parse(mov.series);
      } catch {
        seriesList = String(mov.series).split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    await connection.beginTransaction();

    // ── Transición: RECIBIDO ──
    if (estadoCodigo === 'RECIBIDO' && estadoActual !== 'RECIBIDO') {
      // 1. Verificar y bloquear stock en sede origen
      const [stockOrigenRows] = await connection.query<RowDataPacket[]>(
        'SELECT stock FROM producto_stock_sede WHERE producto_id = ? AND sucursal_id = ? FOR UPDATE',
        [mov.producto_id, mov.sede_origen_id]
      );
      const stockOrigen = stockOrigenRows.length > 0 ? Number(stockOrigenRows[0].stock) : 0;
      if (stockOrigen < mov.cantidad) {
        await connection.rollback();
        res.status(400).json({
          success: false,
          message: `Stock insuficiente en sede origen para concretar la recepción. (Disponible: ${stockOrigen}, Necesario: ${mov.cantidad})`,
        });
        return;
      }

      // 1.5 Verificar si el producto requiere series y asegurar trazabilidad de unidades
      const [prodInfoRows] = await connection.query<RowDataPacket[]>(
        'SELECT requiere_serie FROM productos WHERE id = ?',
        [mov.producto_id]
      );
      const requiereSerie = Boolean(prodInfoRows[0]?.requiere_serie);

      if (seriesList.length > 0) {
        const [seriesCheck] = await connection.query<RowDataPacket[]>(
          `SELECT numero_serie FROM producto_unidades
           WHERE producto_id = ? AND sucursal_id = ? AND estado_unidad_id = 1 AND numero_serie IN (?)
           FOR UPDATE`,
          [mov.producto_id, mov.sede_origen_id, seriesList]
        );
        if (seriesCheck.length !== seriesList.length) {
          await connection.rollback();
          res.status(400).json({
            success: false,
            message: 'Una o más series seleccionadas ya fueron vendidas o ya no están disponibles en la sede origen.',
          });
          return;
        }
      } else if (requiereSerie) {
        const [autoSeries] = await connection.query<RowDataPacket[]>(
          `SELECT numero_serie FROM producto_unidades
           WHERE producto_id = ? AND sucursal_id = ? AND estado_unidad_id = 1 AND disponible_venta = 1
           ORDER BY id ASC LIMIT ? FOR UPDATE`,
          [mov.producto_id, mov.sede_origen_id, Number(mov.cantidad)]
        );
        if (autoSeries.length < Number(mov.cantidad)) {
          await connection.rollback();
          res.status(400).json({
            success: false,
            message: `No hay suficientes unidades disponibles con N° de serie en la sede origen. (Disponibles: ${autoSeries.length}, Necesarias: ${mov.cantidad})`,
          });
          return;
        }
        seriesList = autoSeries.map((r) => String(r.numero_serie));
      }

      await connection.query(
        'UPDATE producto_stock_sede SET stock = stock - ?, updated_at = NOW() WHERE producto_id = ? AND sucursal_id = ?',
        [mov.cantidad, mov.producto_id, mov.sede_origen_id]
      );

      // 2. Incrementar stock en sede destino
      const [stockDestinoRows] = await connection.query<RowDataPacket[]>(
        'SELECT stock FROM producto_stock_sede WHERE producto_id = ? AND sucursal_id = ?',
        [mov.producto_id, mov.sede_destino_id]
      );

      if (stockDestinoRows.length > 0) {
        await connection.query(
          'UPDATE producto_stock_sede SET stock = stock + ?, updated_at = NOW() WHERE producto_id = ? AND sucursal_id = ?',
          [mov.cantidad, mov.producto_id, mov.sede_destino_id]
        );
      } else {
        await connection.query(
          'INSERT INTO producto_stock_sede (producto_id, sucursal_id, stock, updated_at) VALUES (?, ?, ?, NOW())',
          [mov.producto_id, mov.sede_destino_id, mov.cantidad]
        );
      }

      // 3. Trasladar series físicas a la nueva sucursal si aplican
      if (seriesList.length > 0) {
        await connection.query(
          'UPDATE producto_unidades SET sucursal_id = ?, updated_at = NOW() WHERE producto_id = ? AND sucursal_id = ? AND estado_unidad_id = 1 AND numero_serie IN (?)',
          [mov.sede_destino_id, mov.producto_id, mov.sede_origen_id, seriesList]
        );
      }

      // Actualizar registro de movimiento (y persistir series asignadas si hubo auto-asignación)
      await connection.query(
        `UPDATE movimientos_inventario 
         SET estado_movimiento_id = ?, recibido_por = ?, series = COALESCE(series, ?), fecha_recepcion = NOW(), updated_at = NOW()
         WHERE id = ?`,
        [nuevoEstadoId, usuarioNombre, seriesList.length > 0 ? JSON.stringify(seriesList) : null, movimientoId]
      );
    }
    // ── Transición: DEVUELTO (Solo para Préstamos que ya fueron RECIBIDOS) ──
    else if (estadoCodigo === 'DEVUELTO' && estadoActual === 'RECIBIDO' && mov.tipo === 'PRESTAMO') {
      const [stockDestinoRows] = await connection.query<RowDataPacket[]>(
        'SELECT stock FROM producto_stock_sede WHERE producto_id = ? AND sucursal_id = ? FOR UPDATE',
        [mov.producto_id, mov.sede_destino_id]
      );
      const stockDestino = stockDestinoRows.length > 0 ? Number(stockDestinoRows[0].stock) : 0;
      if (stockDestino < mov.cantidad) {
        await connection.rollback();
        res.status(400).json({
          success: false,
          message: `No se puede devolver el préstamo: la sede destino solo cuenta con ${stockDestino} unidad(es) en stock (posiblemente ya se vendió).`,
        });
        return;
      }

      // Verificar si las series siguen disponibles en destino cuando aplica
      if (seriesList.length > 0) {
        const [seriesCheckDest] = await connection.query<RowDataPacket[]>(
          `SELECT numero_serie FROM producto_unidades
           WHERE producto_id = ? AND sucursal_id = ? AND estado_unidad_id = 1 AND numero_serie IN (?)
           FOR UPDATE`,
          [mov.producto_id, mov.sede_destino_id, seriesList]
        );
        if (seriesCheckDest.length !== seriesList.length) {
          await connection.rollback();
          res.status(400).json({
            success: false,
            message: 'No se puede devolver el préstamo porque una o más series ya fueron vendidas o movidas de la sede destino.',
          });
          return;
        }
      }

      // 1. Revertir stock: Descontar de destino (quien lo tomó prestado)
      await connection.query(
        'UPDATE producto_stock_sede SET stock = stock - ?, updated_at = NOW() WHERE producto_id = ? AND sucursal_id = ?',
        [mov.cantidad, mov.producto_id, mov.sede_destino_id]
      );

      // 2. Reponer en origen (dueño original)
      await connection.query(
        'UPDATE producto_stock_sede SET stock = stock + ?, updated_at = NOW() WHERE producto_id = ? AND sucursal_id = ?',
        [mov.cantidad, mov.producto_id, mov.sede_origen_id]
      );

      // 3. Retornar series físicas a la sede origen
      if (seriesList.length > 0) {
        await connection.query(
          'UPDATE producto_unidades SET sucursal_id = ?, updated_at = NOW() WHERE producto_id = ? AND sucursal_id = ? AND estado_unidad_id = 1 AND numero_serie IN (?)',
          [mov.sede_origen_id, mov.producto_id, mov.sede_destino_id, seriesList]
        );
      }

      await connection.query(
        `UPDATE movimientos_inventario 
         SET estado_movimiento_id = ?, fecha_devolucion = NOW(), updated_at = NOW()
         WHERE id = ?`,
        [nuevoEstadoId, movimientoId]
      );
    }
    // ── Otras transiciones (APROBADO, EN_TRANSITO, CANCELADO) ──
    else {
      let extraUpdate = '';
      const updateParams: any[] = [nuevoEstadoId];

      if (estadoCodigo === 'APROBADO') {
        extraUpdate = ', aprobado_por = ?, fecha_aprobacion = NOW()';
        updateParams.push(usuarioNombre);
      } else if (estadoCodigo === 'EN_TRANSITO') {
        extraUpdate = ', fecha_envio = NOW()';
      }

      updateParams.push(movimientoId);

      await connection.query(
        `UPDATE movimientos_inventario 
         SET estado_movimiento_id = ?${extraUpdate}, updated_at = NOW()
         WHERE id = ?`,
        updateParams
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: `El movimiento ahora se encuentra en estado: ${estadoRows[0].nombre}.`,
      nuevoEstado: estadoCodigo,
    });
  } catch (error: any) {
    await connection.rollback();
    console.error('Error al actualizar estado del movimiento:', error);
    res.status(500).json({ success: false, message: 'Error interno al actualizar estado del movimiento.' });
  } finally {
    connection.release();
  }
}
