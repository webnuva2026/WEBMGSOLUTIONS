import { Request, Response } from 'express';
import { pool } from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * GET /api/almacen/resumen
 * Resumen de indicadores clave para el panel de almacén
 */
export async function getAlmacenResumen(req: Request, res: Response): Promise<void> {
  try {
    const sucursalIdQuery = req.query.sucursal_id && String(req.query.sucursal_id) !== 'TODOS' && !isNaN(Number(req.query.sucursal_id))
      ? Number(req.query.sucursal_id)
      : null;

    let statsQuery = '';
    const params: any[] = [];

    if (sucursalIdQuery) {
      statsQuery = `
        SELECT 
          (SELECT COUNT(*) FROM productos WHERE estado_id = 1) AS totalProductos,
          (SELECT COALESCE(SUM(stock), 0) FROM producto_stock_sede WHERE sucursal_id = ?) AS totalUnidadesStock,
          (SELECT COUNT(*) FROM producto_unidades WHERE estado_unidad_id = 1 AND disponible_venta = 1 AND sucursal_id = ?) AS seriesDisponiblesVenta,
          (SELECT COUNT(*) FROM producto_unidades WHERE estado_unidad_id = 5 AND sucursal_id = ?) AS seriesCuarentenaDanadas,
          (SELECT COUNT(*) FROM producto_unidades WHERE (estado_unidad_id = 3 OR tipo_destino = 'SERVICIO_TALLER') AND sucursal_id = ?) AS seriesUsoTaller,
          (SELECT COUNT(*) FROM productos WHERE disponible_venta = 1 AND estado_id = 1) AS productosVisiblesPOS,
          (SELECT COUNT(*) FROM productos WHERE disponible_venta = 0 AND estado_id = 1) AS productosOcultosPOS
      `;
      params.push(sucursalIdQuery, sucursalIdQuery, sucursalIdQuery, sucursalIdQuery);
    } else {
      statsQuery = `
        SELECT 
          (SELECT COUNT(*) FROM productos WHERE estado_id = 1) AS totalProductos,
          (SELECT COALESCE(SUM(stock), 0) FROM producto_stock_sede) AS totalUnidadesStock,
          (SELECT COUNT(*) FROM producto_unidades WHERE estado_unidad_id = 1 AND disponible_venta = 1) AS seriesDisponiblesVenta,
          (SELECT COUNT(*) FROM producto_unidades WHERE estado_unidad_id = 5) AS seriesCuarentenaDanadas,
          (SELECT COUNT(*) FROM producto_unidades WHERE estado_unidad_id = 3 OR tipo_destino = 'SERVICIO_TALLER') AS seriesUsoTaller,
          (SELECT COUNT(*) FROM productos WHERE disponible_venta = 1 AND estado_id = 1) AS productosVisiblesPOS,
          (SELECT COUNT(*) FROM productos WHERE disponible_venta = 0 AND estado_id = 1) AS productosOcultosPOS
      `;
    }

    const [stats] = await pool.query<RowDataPacket[]>(statsQuery, params);

    res.json({
      success: true,
      data: stats[0] || {},
    });
  } catch (error: any) {
    console.error('Error al obtener resumen de almacén:', error);
    res.status(500).json({ success: false, message: 'Error al consultar resumen de almacén.' });
  }
}

/**
 * GET /api/almacen/inventario
 * Lista el inventario completo organizado con jerarquía: Categoría -> Marca -> Modelo (con detalle técnico) y Stock
 */
export async function getInventarioJerarquico(req: Request, res: Response): Promise<void> {
  try {
    const categoriaId = req.query.categoria_id ? Number(req.query.categoria_id) : null;
    const marcaId = req.query.marca_id ? Number(req.query.marca_id) : null;
    const tipoDestino = req.query.tipo_destino ? String(req.query.tipo_destino) : null;
    const search = req.query.search ? String(req.query.search).trim() : null;
    const sucursalIdQuery = req.query.sucursal_id && String(req.query.sucursal_id) !== 'TODOS' && !isNaN(Number(req.query.sucursal_id))
      ? Number(req.query.sucursal_id)
      : null;

    let query = `
      SELECT 
        p.id AS productoId,
        p.codigo,
        p.nombre AS productoNombre,
        p.descripcion AS productoDescripcion,
        p.categoria_id AS categoriaId,
        c.nombre AS categoriaNombre,
        c.requiere_serie AS categoriaRequiereSerie,
        p.marca_id AS marcaId,
        m.nombre AS marcaNombre,
        p.modelo_id AS modeloId,
        mo.nombre AS modeloNombre,
        mo.descripcion AS modeloDescripcion,
        p.precio_venta AS precioVenta,
        p.precio_costo AS precioCosto,
        p.stock_minimo AS stockMinimo,
        p.requiere_serie AS requiereSerie,
        p.disponible_venta AS disponibleVenta,
        p.tipo_destino AS tipoDestino,
        e.nombre AS estado,
        p.estado_id AS estadoId,
        COALESCE(stk.stockTotal, 0) AS stockTotal,
        COALESCE(uni.totalSeries, 0) AS totalSeries,
        COALESCE(uni.seriesDisponibles, 0) AS seriesDisponibles,
        COALESCE(uni.seriesCuarentena, 0) AS seriesCuarentena,
        COALESCE(uni.seriesTaller, 0) AS seriesTaller,
        COALESCE(uni.seriesVendidas, 0) AS seriesVendidas
      FROM productos p
      INNER JOIN categorias c ON p.categoria_id = c.id
      INNER JOIN marcas m ON p.marca_id = m.id
      LEFT JOIN modelos mo ON p.modelo_id = mo.id
      INNER JOIN estados e ON p.estado_id = e.id
      LEFT JOIN (
        SELECT producto_id, SUM(stock) AS stockTotal 
        FROM producto_stock_sede 
        GROUP BY producto_id
      ) stk ON stk.producto_id = p.id
      LEFT JOIN (
        SELECT 
          producto_id,
          COUNT(id) AS totalSeries,
          SUM(CASE WHEN estado_unidad_id = 1 AND disponible_venta = 1 THEN 1 ELSE 0 END) AS seriesDisponibles,
          SUM(CASE WHEN estado_unidad_id = 5 THEN 1 ELSE 0 END) AS seriesCuarentena,
          SUM(CASE WHEN estado_unidad_id = 3 OR tipo_destino = 'SERVICIO_TALLER' THEN 1 ELSE 0 END) AS seriesTaller,
          SUM(CASE WHEN estado_unidad_id = 2 THEN 1 ELSE 0 END) AS seriesVendidas
        FROM producto_unidades
        GROUP BY producto_id
      ) uni ON uni.producto_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (categoriaId && !isNaN(categoriaId)) {
      query += ' AND p.categoria_id = ?';
      params.push(categoriaId);
    }

    if (marcaId && !isNaN(marcaId)) {
      query += ' AND p.marca_id = ?';
      params.push(marcaId);
    }

    if (tipoDestino && ['VENTA', 'SERVICIO_TALLER', 'MIXTO'].includes(tipoDestino)) {
      query += ' AND p.tipo_destino = ?';
      params.push(tipoDestino);
    }

    if (search) {
      query += ' AND (p.nombre LIKE ? OR p.codigo LIKE ? OR m.nombre LIKE ? OR mo.nombre LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY c.nombre ASC, m.nombre ASC, mo.nombre ASC, p.nombre ASC';

    const [productosRows] = await pool.query<RowDataPacket[]>(query, params);

    // Obtener detalles de modelo (características) para los modelos que aplican
    const modeloIds = Array.from(new Set(productosRows.map(r => r.modeloId).filter(Boolean)));
    const detallesPorModelo = new Map<number, { atributo: string; valor: string }[]>();

    if (modeloIds.length > 0) {
      const [detalles] = await pool.query<RowDataPacket[]>(
        'SELECT modelo_id AS modeloId, atributo, valor FROM detalle_modelo WHERE modelo_id IN (?) ORDER BY id ASC',
        [modeloIds]
      );
      for (const d of detalles) {
        if (!detallesPorModelo.has(d.modeloId)) {
          detallesPorModelo.set(d.modeloId, []);
        }
        detallesPorModelo.get(d.modeloId)!.push({
          atributo: d.atributo,
          valor: d.valor || '',
        });
      }
    }

    // Obtener stock por sede
    const prodIds = productosRows.map(r => r.productoId);
    const stockPorSedeMap = new Map<number, { sucursalId: number; sucursalNombre: string; stock: number }[]>();

    if (prodIds.length > 0) {
      const [sedeStockRows] = await pool.query<RowDataPacket[]>(`
        SELECT pss.producto_id AS productoId, pss.sucursal_id AS sucursalId, s.nombre AS sucursalNombre, pss.stock
        FROM producto_stock_sede pss
        INNER JOIN sucursales s ON pss.sucursal_id = s.id
        WHERE pss.producto_id IN (?)
      `, [prodIds]);

      for (const r of sedeStockRows) {
        if (!stockPorSedeMap.has(r.productoId)) {
          stockPorSedeMap.set(r.productoId, []);
        }
        stockPorSedeMap.get(r.productoId)!.push({
          sucursalId: r.sucursalId,
          sucursalNombre: r.sucursalNombre,
          stock: Number(r.stock) || 0,
        });
      }
    }

    const items = productosRows.map((p) => {
      const modeloId = p.modeloId ? Number(p.modeloId) : null;
      return {
        id: p.productoId,
        codigo: p.codigo,
        nombre: p.productoNombre,
        descripcion: p.productoDescripcion || '',
        categoria: {
          id: p.categoriaId,
          nombre: p.categoriaNombre,
          requiereSerie: Boolean(p.categoriaRequiereSerie),
        },
        marca: {
          id: p.marcaId,
          nombre: p.marcaNombre,
        },
        modelo: modeloId
          ? {
              id: modeloId,
              nombre: p.modeloNombre,
              descripcion: p.modeloDescripcion || '',
              caracteristicas: detallesPorModelo.get(modeloId) || [],
            }
          : null,
        precioVenta: Number(p.precioVenta) || 0,
        precioCosto: Number(p.precioCosto) || 0,
        stockMinimo: Number(p.stockMinimo) || 0,
        requiereSerie: Boolean(p.requiereSerie || p.categoriaRequiereSerie),
        disponibleVenta: Boolean(p.disponibleVenta),
        tipoDestino: p.tipoDestino,
        estado: p.estado,
        estadoId: p.estadoId,
        stockTotal: Math.max(Number(p.stockTotal) || 0, Number(p.seriesDisponibles) || 0),
        stockSede: sucursalIdQuery
          ? (stockPorSedeMap.get(p.productoId)?.find(s => s.sucursalId === sucursalIdQuery)?.stock ?? 0)
          : Math.max(Number(p.stockTotal) || 0, Number(p.seriesDisponibles) || 0),
        stockPorSede: stockPorSedeMap.get(p.productoId) || [],
        seriesMetricas: {
          total: Number(p.totalSeries) || 0,
          disponibles: Number(p.seriesDisponibles) || 0,
          cuarentenaDanadas: Number(p.seriesCuarentena) || 0,
          taller: Number(p.seriesTaller) || 0,
          vendidas: Number(p.seriesVendidas) || 0,
        },
      };
    });

    res.json({
      success: true,
      total: items.length,
      inventario: items,
    });
  } catch (error: any) {
    console.error('Error al obtener inventario jerárquico:', error);
    res.status(500).json({ success: false, message: 'Error interno al consultar inventario.' });
  }
}

/**
 * GET /api/almacen/productos/:id/unidades
 * Lista todas las unidades físicas con N° de Serie de un producto específico
 */
export async function getUnidadesProducto(req: Request, res: Response): Promise<void> {
  try {
    const productoId = Number(req.params.id);
    if (isNaN(productoId)) {
      res.status(400).json({ success: false, message: 'ID de producto inválido.' });
      return;
    }

    const sucursalIdQuery = req.query.sucursal_id && String(req.query.sucursal_id) !== 'TODOS' && !isNaN(Number(req.query.sucursal_id))
      ? Number(req.query.sucursal_id)
      : null;

    let query = `
      SELECT 
        u.id,
        u.producto_id AS productoId,
        p.nombre AS productoNombre,
        p.codigo AS productoCodigo,
        u.sucursal_id AS sucursalId,
        s.nombre AS sucursalNombre,
        u.numero_serie AS numeroSerie,
        u.estado_unidad_id AS estadoUnidadId,
        eu.codigo AS estadoCodigo,
        eu.nombre AS estadoNombre,
        u.tipo_destino AS tipoDestino,
        u.disponible_venta AS disponibleVenta,
        u.condicion,
        u.observaciones,
        u.costo_adquisicion AS costoAdquisicion,
        u.fecha_ingreso AS fechaIngreso,
        u.created_at AS createdAt
      FROM producto_unidades u
      INNER JOIN productos p ON u.producto_id = p.id
      INNER JOIN sucursales s ON u.sucursal_id = s.id
      INNER JOIN estados_unidad eu ON u.estado_unidad_id = eu.id
      WHERE u.producto_id = ?
    `;
    const params: any[] = [productoId];

    if (sucursalIdQuery) {
      query += ' AND u.sucursal_id = ?';
      params.push(sucursalIdQuery);
    }

    query += ' ORDER BY u.id DESC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    res.json({
      success: true,
      total: rows.length,
      unidades: rows.map(r => ({
        id: r.id,
        productoId: r.productoId,
        productoNombre: r.productoNombre,
        productoCodigo: r.productoCodigo,
        sucursalId: r.sucursalId,
        sucursalNombre: r.sucursalNombre,
        numeroSerie: r.numeroSerie,
        estadoUnidadId: r.estadoUnidadId,
        estadoCodigo: r.estadoCodigo,
        estadoNombre: r.estadoNombre,
        tipoDestino: r.tipoDestino,
        disponibleVenta: Boolean(r.disponibleVenta),
        condicion: r.condicion,
        observaciones: r.observaciones || '',
        costoAdquisicion: r.costoAdquisicion ? Number(r.costoAdquisicion) : null,
        fechaIngreso: r.fechaIngreso,
      })),
    });
  } catch (error: any) {
    console.error('Error al obtener unidades del producto:', error);
    res.status(500).json({ success: false, message: 'Error interno al consultar números de serie.' });
  }
}

/**
 * POST /api/almacen/productos/:id/unidades
 * Registra una o múltiples unidades físicas con N° de Serie para un producto
 */
export async function registrarUnidadesProducto(req: Request, res: Response): Promise<void> {
  const connection = await pool.getConnection();
  try {
    const productoId = Number(req.params.id);
    if (isNaN(productoId)) {
      res.status(400).json({ success: false, message: 'ID de producto inválido.' });
      return;
    }

    const {
      sucursalId = 1,
      series = [],
      tipoDestino = 'VENTA',
      disponibleVenta = true,
      condicion = 'NUEVO',
      observaciones = '',
      costoAdquisicion = null,
    } = req.body;

    if (!Array.isArray(series) || series.length === 0) {
      res.status(400).json({ success: false, message: 'Debe ingresar al menos un número de serie.' });
      return;
    }

    // Limpiar series y eliminar vacíos o duplicados en el envío
    const cleanSeries = Array.from(new Set(series.map((s: any) => String(s).trim()).filter(Boolean)));
    if (cleanSeries.length === 0) {
      res.status(400).json({ success: false, message: 'Los números de serie ingresados no son válidos.' });
      return;
    }

    // Verificar si alguna serie ya existe para este producto
    const [existentes] = await connection.query<RowDataPacket[]>(
      'SELECT numero_serie FROM producto_unidades WHERE producto_id = ? AND numero_serie IN (?)',
      [productoId, cleanSeries]
    );

    if (existentes.length > 0) {
      const duplicados = existentes.map((e) => e.numero_serie).join(', ');
      res.status(409).json({
        success: false,
        message: `Los siguientes números de serie ya están registrados: ${duplicados}`,
      });
      return;
    }

    // Determinar estado de la unidad según condición y visibilidad
    // Si viene como DANADO_RECEPCION o DEFECTUOSO => estado 5 (DANADO_CUARENTENA) y disponible_venta = 0
    const esDanado = ['DANADO_RECEPCION', 'DEFECTUOSO'].includes(condicion);
    const estadoUnidadId = esDanado ? 5 : 1; // 5: DANADO_CUARENTENA, 1: DISPONIBLE
    const realDisponibleVenta = esDanado ? 0 : (disponibleVenta ? 1 : 0);

    await connection.beginTransaction();

    for (const serie of cleanSeries) {
      await connection.query(
        `INSERT INTO producto_unidades 
         (producto_id, sucursal_id, numero_serie, estado_unidad_id, tipo_destino, disponible_venta, condicion, observaciones, costo_adquisicion, fecha_ingreso)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          productoId,
          sucursalId,
          serie,
          estadoUnidadId,
          tipoDestino,
          realDisponibleVenta,
          condicion,
          observaciones.trim() || null,
          costoAdquisicion,
        ]
      );
    }

    // Actualizar o insertar stock en producto_stock_sede
    const [stockActual] = await connection.query<RowDataPacket[]>(
      'SELECT stock FROM producto_stock_sede WHERE producto_id = ? AND sucursal_id = ?',
      [productoId, sucursalId]
    );

    if (stockActual.length > 0) {
      await connection.query(
        'UPDATE producto_stock_sede SET stock = stock + ?, updated_at = NOW() WHERE producto_id = ? AND sucursal_id = ?',
        [cleanSeries.length, productoId, sucursalId]
      );
    } else {
      await connection.query(
        'INSERT INTO producto_stock_sede (producto_id, sucursal_id, stock, updated_at) VALUES (?, ?, ?, NOW())',
        [productoId, sucursalId, cleanSeries.length]
      );
    }

    // Asegurar que el producto tenga requiere_serie = 1
    await connection.query(
      'UPDATE productos SET requiere_serie = 1, updated_at = NOW() WHERE id = ?',
      [productoId]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: `Se registraron exitosamente ${cleanSeries.length} unidades con N° de serie.`,
      unidadesRegistradas: cleanSeries.length,
      estadoAsignado: esDanado ? 'En Cuarentena / Dañado (Bloqueado de venta)' : 'Disponible',
    });
  } catch (error: any) {
    await connection.rollback();
    console.error('Error al registrar unidades con serie:', error);
    res.status(500).json({ success: false, message: 'Error interno al registrar unidades con serie.' });
  } finally {
    connection.release();
  }
}

/**
 * PATCH /api/almacen/unidades/:id/estado
 * Cambia la condición, estado físico o disponibilidad de venta de una unidad física
 */
export async function updateEstadoUnidad(req: Request, res: Response): Promise<void> {
  try {
    const unidadId = Number(req.params.id);
    if (isNaN(unidadId)) {
      res.status(400).json({ success: false, message: 'ID de unidad inválido.' });
      return;
    }

    const { estadoUnidadId, disponibleVenta, condicion, observaciones, tipoDestino } = req.body;

    // Verificar si la unidad existe
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, numero_serie, estado_unidad_id FROM producto_unidades WHERE id = ?',
      [unidadId]
    );

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Unidad no encontrada.' });
      return;
    }

    // Si se pasa a estado 5 (DANADO_CUARENTENA) o 6 (BAJA_MERMA), forzar disponible_venta = 0
    let finalDisponibleVenta = disponibleVenta !== undefined ? (disponibleVenta ? 1 : 0) : undefined;
    if (estadoUnidadId === 5 || estadoUnidadId === 6 || condicion === 'DANADO_RECEPCION' || condicion === 'DEFECTUOSO') {
      finalDisponibleVenta = 0;
    }

    const fields: string[] = [];
    const params: any[] = [];

    if (estadoUnidadId !== undefined) {
      fields.push('estado_unidad_id = ?');
      params.push(Number(estadoUnidadId));
    }

    if (finalDisponibleVenta !== undefined) {
      fields.push('disponible_venta = ?');
      params.push(finalDisponibleVenta);
    }

    if (condicion !== undefined) {
      fields.push('condicion = ?');
      params.push(condicion);
    }

    if (tipoDestino !== undefined) {
      fields.push('tipo_destino = ?');
      params.push(tipoDestino);
    }

    if (observaciones !== undefined) {
      fields.push('observaciones = ?');
      params.push(observaciones ? String(observaciones).trim() : null);
    }

    if (fields.length === 0) {
      res.status(400).json({ success: false, message: 'No se enviaron campos para actualizar.' });
      return;
    }

    params.push(unidadId);
    await pool.query(`UPDATE producto_unidades SET ${fields.join(', ')} WHERE id = ?`, params);

    res.json({
      success: true,
      message: 'Estado de la unidad actualizado exitosamente.',
    });
  } catch (error: any) {
    console.error('Error al actualizar estado de la unidad:', error);
    res.status(500).json({ success: false, message: 'Error interno al actualizar estado de la unidad.' });
  }
}

/**
 * PATCH /api/almacen/productos/:id/visibilidad-venta
 * Activa o desactiva la visibilidad del producto en el módulo de ventas (POS)
 */
export async function toggleVisibilidadVentaProducto(req: Request, res: Response): Promise<void> {
  try {
    const productoId = Number(req.params.id);
    if (isNaN(productoId)) {
      res.status(400).json({ success: false, message: 'ID de producto inválido.' });
      return;
    }

    const { disponibleVenta } = req.body;
    const valor = disponibleVenta !== undefined ? (disponibleVenta ? 1 : 0) : null;

    if (valor === null) {
      // Toggle automático si no se especifica
      await pool.query(
        'UPDATE productos SET disponible_venta = CASE WHEN disponible_venta = 1 THEN 0 ELSE 1 END WHERE id = ?',
        [productoId]
      );
    } else {
      await pool.query(
        'UPDATE productos SET disponible_venta = ? WHERE id = ?',
        [valor, productoId]
      );
    }

    const [updated] = await pool.query<RowDataPacket[]>(
      'SELECT disponible_venta FROM productos WHERE id = ?',
      [productoId]
    );

    const isVisible = Boolean(updated[0]?.disponible_venta);

    res.json({
      success: true,
      message: isVisible
        ? 'El producto ahora es VISIBLE para los vendedores en Punto de Venta.'
        : 'El producto ha sido OCULTADO del Punto de Venta (exclusivo para Almacén / Taller).',
      disponibleVenta: isVisible,
    });
  } catch (error: any) {
    console.error('Error al alternar visibilidad de venta:', error);
    res.status(500).json({ success: false, message: 'Error interno al cambiar visibilidad de venta.' });
  }
}

/**
 * POST /api/almacen/productos
 * Crea un nuevo producto en almacén vinculado a Categoría, Marca y Modelo opcional
 */
export async function createProductoAlmacen(req: Request, res: Response): Promise<void> {
  const connection = await pool.getConnection();
  try {
    const {
      codigo,
      nombre,
      descripcion = '',
      categoriaId,
      marcaId,
      modeloId = null,
      precioVenta = 0,
      precioCosto = 0,
      stockMinimo = 5,
      requiereSerie = false,
      disponibleVenta = true,
      tipoDestino = 'VENTA',
      stockInicial = 0,
      sucursalId = 1,
      seriesIniciales = [],
    } = req.body;

    if (!nombre || !nombre.trim()) {
      res.status(400).json({ success: false, message: 'El nombre del producto es obligatorio.' });
      return;
    }

    if (!categoriaId || !marcaId) {
      res.status(400).json({ success: false, message: 'La categoría y marca son obligatorias.' });
      return;
    }

    // Generar código automático si no se provee
    const cleanCodigo = codigo && codigo.trim() ? codigo.trim() : `PRD-${Date.now().toString().slice(-6)}`;

    await connection.beginTransaction();

    const [insertResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO productos 
       (codigo, nombre, descripcion, categoria_id, marca_id, modelo_id, precio_venta, precio_costo, stock_minimo, requiere_serie, disponible_venta, tipo_destino, estado_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [
        cleanCodigo,
        nombre.trim(),
        descripcion.trim(),
        Number(categoriaId),
        Number(marcaId),
        modeloId ? Number(modeloId) : null,
        Number(precioVenta),
        Number(precioCosto),
        Number(stockMinimo),
        requiereSerie ? 1 : 0,
        disponibleVenta ? 1 : 0,
        tipoDestino,
      ]
    );

    const newProdId = insertResult.insertId;

    // Si viene con series físicas
    if (requiereSerie && Array.isArray(seriesIniciales) && seriesIniciales.length > 0) {
      for (const s of seriesIniciales) {
        if (s && String(s).trim()) {
          await connection.query(
            `INSERT INTO producto_unidades 
             (producto_id, sucursal_id, numero_serie, estado_unidad_id, tipo_destino, disponible_venta, condicion, fecha_ingreso)
             VALUES (?, ?, ?, 1, ?, ?, 'NUEVO', NOW())`,
            [newProdId, sucursalId, String(s).trim(), tipoDestino, disponibleVenta ? 1 : 0]
          );
        }
      }

      await connection.query(
        'INSERT INTO producto_stock_sede (producto_id, sucursal_id, stock, updated_at) VALUES (?, ?, ?, NOW())',
        [newProdId, sucursalId, seriesIniciales.length]
      );
    } else if (Number(stockInicial) > 0) {
      // Stock regular sin serie
      await connection.query(
        'INSERT INTO producto_stock_sede (producto_id, sucursal_id, stock, updated_at) VALUES (?, ?, ?, NOW())',
        [newProdId, sucursalId, Number(stockInicial)]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Producto registrado en almacén exitosamente.',
      productoId: newProdId,
    });
  } catch (error: any) {
    await connection.rollback();
    console.error('Error al crear producto en almacén:', error);
    res.status(500).json({ success: false, message: 'Error interno al registrar producto.' });
  } finally {
    connection.release();
  }
}
