import { Request, Response } from 'express';
import { pool } from '../config/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { sendWorkshopTicketEmail } from '../utils/mailer';

/**
 * Mapeo de estados de la UI a los IDs de la base de datos
 */
const ESTADO_MAP: Record<string, number> = {
  RECEPCIONADO: 1,
  EN_DIAGNOSTICO: 2,
  PRESUPUESTADO: 3,
  APROBADO_EN_REPARACION: 4,
  ESPERA_REPUESTOS: 5,
  REPARADO_PROBADO: 6,
  LISTO_ENTREGA: 7,
  ENTREGADO_COBRADO: 8,
  RECHAZADO_DEVUELTO: 9,
};

const ESTADO_INV_MAP: Record<number, string> = {
  1: 'RECEPCIONADO',
  2: 'EN_DIAGNOSTICO',
  3: 'PRESUPUESTADO',
  4: 'APROBADO_EN_REPARACION',
  5: 'ESPERA_REPUESTOS',
  6: 'REPARADO_PROBADO',
  7: 'LISTO_ENTREGA',
  8: 'ENTREGADO_COBRADO',
  9: 'RECHAZADO_DEVUELTO',
};

const PRIORIDAD_MAP: Record<string, number> = {
  NORMAL: 1,
  ALTA: 2,
  URGENTE: 3,
};

const PRIORIDAD_INV_MAP: Record<number, 'NORMAL' | 'ALTA' | 'URGENTE'> = {
  1: 'NORMAL',
  2: 'ALTA',
  3: 'URGENTE',
};

// Crear tabla de bitácora si no existe para almacenar el historial completo de avances y presupuestos
async function initWorkshopBitacoraTable(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orden_bitacora (
        id INT AUTO_INCREMENT PRIMARY KEY,
        orden_id INT NOT NULL,
        usuario_id INT NULL,
        autor_nombre VARCHAR(150) NOT NULL,
        autor_rol VARCHAR(50) NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT NULL,
        estado_nuevo VARCHAR(50) NOT NULL,
        fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_orden_bitacora_orden (orden_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  } catch (err) {
    console.warn('initWorkshopBitacoraTable fallback:', err);
  }
}
initWorkshopBitacoraTable();

/**
 * GET /api/taller/ordenes
 * Listado completo de órdenes de trabajo en taller con cliente, equipo, técnico y estado
 */
export async function getOrdenes(req: Request, res: Response): Promise<void> {
  try {
    const { estado, search, sucursal_id } = req.query;

    let query = `
      SELECT 
        os.id,
        os.codigo,
        os.sucursal_id AS sucursalId,
        COALESCE(suc.nombre, 'Principal - Chiclayo Centro') AS sucursalNombre,
        os.cliente_id AS clienteId,
        COALESCE(NULLIF(TRIM(c.razon_social), ''), CONCAT(COALESCE(p.nombres, ''), ' ', COALESCE(p.apellidos, ''))) AS clienteNombre,
        COALESCE(c.ruc, p.dni, '') AS clienteDocumento,
        p.telefono AS clienteTelefono,
        p.correo AS clienteEmail,
        os.equipo_id AS equipoId,
        eq.marca,
        eq.modelo,
        eq.numero_serie AS numeroSerie,
        eq.accesorios,
        COALESCE(te.nombre, 'Equipo / Dispositivo') AS tipoEquipo,
        os.usuario_recibe_id AS recepcionadoPorId,
        rec.nombre_completo AS recepcionadoPorNombre,
        os.usuario_tecnico_id AS tecnicoId,
        tec.nombre_completo AS tecnicoNombre,
        os.descripcion_falla AS fallaReportada,
        os.diagnostico,
        os.solucion,
        os.costo_servicio AS costoTotal,
        os.estado_orden_id AS estadoOrdenId,
        eos.codigo AS estadoCodigo,
        eos.nombre AS estadoNombre,
        os.prioridad_id AS prioridadId,
        prio.codigo AS prioridadCodigo,
        os.fecha_ingreso AS fechaIngreso,
        os.fecha_promesa AS fechaEstimadaEntrega,
        os.fecha_entrega AS fechaEntrega,
        os.observaciones
      FROM ordenes_servicio os
      INNER JOIN clientes c ON os.cliente_id = c.id_cliente
      LEFT JOIN sucursales suc ON os.sucursal_id = suc.id
      LEFT JOIN personas p ON c.id_persona = p.id_persona
      LEFT JOIN equipos eq ON os.equipo_id = eq.id
      LEFT JOIN tipos_equipo te ON eq.tipo_equipo_id = te.id
      LEFT JOIN usuarios rec ON os.usuario_recibe_id = rec.id
      LEFT JOIN usuarios tec ON os.usuario_tecnico_id = tec.id
      INNER JOIN estados_orden_servicio eos ON os.estado_orden_id = eos.id
      LEFT JOIN prioridades_orden prio ON os.prioridad_id = prio.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (sucursal_id && String(sucursal_id) !== 'TODOS' && !isNaN(Number(sucursal_id))) {
      query += ' AND os.sucursal_id = ?';
      params.push(Number(sucursal_id));
    }

    if (estado && String(estado) !== 'TODOS') {
      const estadoId = ESTADO_MAP[String(estado).toUpperCase()];
      if (estadoId) {
        query += ' AND os.estado_orden_id = ?';
        params.push(estadoId);
      }
    }

    if (search && String(search).trim()) {
      const term = `%${String(search).trim()}%`;
      query += ` AND (os.codigo LIKE ? OR c.razon_social LIKE ? OR eq.marca LIKE ? OR eq.modelo LIKE ? OR eq.numero_serie LIKE ?)`;
      params.push(term, term, term, term, term);
    }

    query += ' ORDER BY os.id DESC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    // Cargar repuestos y mano de obra asociados a las órdenes
    const [repuestosRows] = await pool.query<RowDataPacket[]>(
      'SELECT id, orden_id, producto_id AS productoId, codigo, descripcion, cantidad, precio_unitario AS precioUnitario, total, descontado_stock AS descontadoStock FROM orden_repuestos'
    );
    const [serviciosRows] = await pool.query<RowDataPacket[]>(
      'SELECT id, orden_id, descripcion, precio FROM orden_servicios_mano_obra'
    );

    const repuestosMap = new Map<number, any[]>();
    for (const rep of repuestosRows) {
      if (!repuestosMap.has(rep.orden_id)) repuestosMap.set(rep.orden_id, []);
      repuestosMap.get(rep.orden_id)!.push({
        id: `rep-${rep.id}`,
        dbId: rep.id,
        productoId: rep.productoId,
        codigo: rep.codigo || '',
        descripcion: rep.descripcion,
        cantidad: Number(rep.cantidad) || 1,
        precioUnitario: Number(rep.precioUnitario) || 0,
        total: Number(rep.total) || 0,
        descontadoStock: Boolean(rep.descontadoStock),
      });
    }

    const serviciosMap = new Map<number, any[]>();
    for (const s of serviciosRows) {
      if (!serviciosMap.has(s.orden_id)) serviciosMap.set(s.orden_id, []);
      serviciosMap.get(s.orden_id)!.push({
        id: `mo-${s.id}`,
        dbId: s.id,
        descripcion: s.descripcion,
        precio: Number(s.precio) || 0,
      });
    }

    // Consultar bitácora e historial de todas las órdenes cargadas
    const orderIds = rows.map((r) => r.id);
    const bitacorasMap = new Map<number, any[]>();
    if (orderIds.length > 0) {
      try {
        const [bitacoraRows] = await pool.query<RowDataPacket[]>(
          `SELECT id, orden_id, autor_nombre AS autorNombre, autor_rol AS autorRol,
                  titulo, descripcion, estado_nuevo AS estadoNuevo, fecha
           FROM orden_bitacora
           WHERE orden_id IN (?)
           ORDER BY fecha DESC, id DESC`,
          [orderIds]
        );
        for (const b of bitacoraRows) {
          if (!bitacorasMap.has(b.orden_id)) bitacorasMap.set(b.orden_id, []);
          bitacorasMap.get(b.orden_id)!.push({
            id: `b-${b.id}`,
            fecha: new Date(b.fecha).toLocaleString('es-PE', { hour12: false }),
            autorNombre: b.autorNombre || 'Taller',
            autorRol: b.autorRol || 'TECNICO',
            titulo: b.titulo || 'Avance',
            descripcion: b.descripcion || '',
            estadoNuevo: b.estadoNuevo,
          });
        }
      } catch (err) {
        console.warn('Bitacora table query error or not created yet:', err);
      }
    }

    const ordenes = rows.map((r) => {
      const accesoriosArr = r.accesorios
        ? (typeof r.accesorios === 'string' && r.accesorios.includes(',')
            ? r.accesorios.split(',').map((a: string) => a.trim())
            : [r.accesorios])
        : ['Solo equipo'];

      const repuestos = repuestosMap.get(r.id) || [];
      const serviciosManoObra = serviciosMap.get(r.id) || [];
      const costoTotalRepuestos = repuestos.reduce((sum: number, x: any) => sum + (Number(x.total) || 0), 0);
      const costoTotalManoObra = serviciosManoObra.reduce((sum: number, x: any) => sum + (Number(x.precio) || 0), 0);
      const costoTotal = Number(r.costoTotal) || (costoTotalRepuestos + costoTotalManoObra);

      const dbBitacora = bitacorasMap.get(r.id) || [];
      const bitacoraFinal = dbBitacora.length > 0 ? dbBitacora : [
        {
          id: `b-${r.id}-init`,
          fecha: new Date(r.fechaIngreso).toLocaleString('es-PE', { hour12: false }),
          autorNombre: r.recepcionadoPorNombre || 'Recepción',
          autorRol: 'RECEPCION',
          titulo: 'Ingreso al Taller',
          descripcion: `Equipo ingresado con falla: "${r.fallaReportada}". Asignado a: ${r.tecnicoNombre || 'Laboratorio'}.`,
          estadoNuevo: (ESTADO_INV_MAP[r.estadoOrdenId] || 'RECEPCIONADO') as any,
        },
      ];

      return {
        id: r.id,
        codigo: r.codigo,
        clienteId: r.clienteId,
        clienteNombre: r.clienteNombre ? String(r.clienteNombre).trim() : 'Cliente General',
        clienteDocumento: r.clienteDocumento || '',
        clienteTelefono: r.clienteTelefono || '',
        clienteEmail: r.clienteEmail || '',
        tipoEquipo: r.tipoEquipo,
        marca: r.marca || 'GENÉRICO',
        modelo: r.modelo || 'Estándar',
        numeroSerie: r.numeroSerie || 'S/N',
        passwordEquipo: 'No aplica',
        accesoriosDejados: accesoriosArr,
        fallaReportada: r.fallaReportada || 'Revisión preventiva',
        estadoEstetico: 'Buen estado general',
        sucursalId: r.sucursalId || 1,
        sucursalNombre: r.sucursalNombre || 'Principal - Chiclayo Centro',
        prioridad: (PRIORIDAD_INV_MAP[r.prioridadId] || 'NORMAL') as 'NORMAL' | 'ALTA' | 'URGENTE',
        tecnicoId: r.tecnicoId || 1,
        tecnicoNombre: r.tecnicoNombre || 'Especialista Asignado',
        recepcionadoPorId: r.recepcionadoPorId || 1,
        recepcionadoPorNombre: r.recepcionadoPorNombre || 'Recepción',
        fechaIngreso: new Date(r.fechaIngreso).toLocaleString('es-PE', { hour12: false }),
        fechaEstimadaEntrega: r.fechaEstimadaEntrega
          ? new Date(r.fechaEstimadaEntrega).toLocaleDateString('es-PE')
          : 'En 24 a 48 horas hábiles',
        estado: (ESTADO_INV_MAP[r.estadoOrdenId] || 'RECEPCIONADO') as any,
        repuestos,
        serviciosManoObra,
        costoTotalRepuestos,
        costoTotalManoObra,
        costoTotal,
        adelantoPagado: 0,
        saldoPendiente: costoTotal,
        bitacora: bitacoraFinal,
        comunicaciones: [],
        garantiaDias: r.codigo.startsWith('GAR') ? 180 : 90,
      };
    });

    res.json({ success: true, ordenes });
  } catch (error: any) {
    console.error('Error al obtener órdenes de servicio:', error);
    res.status(500).json({ success: false, message: 'Error interno al consultar órdenes de taller.' });
  }
}

/**
 * POST /api/taller/ordenes
 * Registra una nueva Orden de Trabajo (OT) o RMA con persistencia en MySQL
 */
export async function createOrden(req: AuthenticatedRequest, res: Response): Promise<void> {
  const connection = await pool.getConnection();
  try {
    const {
      clienteId,
      tipoEquipo = 'Laptop / Notebook',
      marca,
      modelo,
      numeroSerie,
      accesorios = 'Cargador original',
      fallaReportada,
      prioridad = 'NORMAL',
      tecnicoId,
      esGarantia = false,
      costoServicio = 0,
      observaciones = '',
    } = req.body;

    const recepcionadoPorId = req.user?.userId || 1;

    let finalClienteId = Number(clienteId);
    if (!finalClienteId || isNaN(finalClienteId)) {
      const [firstCli] = await connection.query<RowDataPacket[]>(
        'SELECT id_cliente FROM clientes ORDER BY id_cliente ASC LIMIT 1'
      );
      finalClienteId = firstCli[0]?.id_cliente || 1;
    }

    if (!marca || !modelo) {
      res.status(400).json({ success: false, message: 'Marca y modelo del equipo son requeridos.' });
      return;
    }

    await connection.beginTransaction();

    // 1. Resolver tipo_equipo_id
    const tipoUpper = String(tipoEquipo).toUpperCase();
    let tipoEquipoId = 1; // Default Laptop
    if (tipoUpper.includes('PC') || tipoUpper.includes('TORRE') || tipoUpper.includes('ESCRITORIO')) tipoEquipoId = 2;
    else if (tipoUpper.includes('IMPRESORA') || tipoUpper.includes('MULTIFUNCIONAL')) tipoEquipoId = 3;
    else if (tipoUpper.includes('MONITOR') || tipoUpper.includes('PANTALLA')) tipoEquipoId = 4;
    else if (tipoUpper.includes('COMPONENTE') || tipoUpper.includes('PLACA')) tipoEquipoId = 5;

    // 2. Registrar equipo en la tabla `equipos`
    const accesoriosStr = Array.isArray(accesorios) ? accesorios.join(', ') : String(accesorios || 'Solo equipo');
    const serieLimpia = String(numeroSerie || 'S/N-SINDATO').trim().toUpperCase();

    const [equipoRes] = await connection.query<ResultSetHeader>(
      `INSERT INTO equipos (cliente_id, tipo_equipo_id, marca, modelo, numero_serie, accesorios, estado_id, fecha_registro)
       VALUES (?, ?, ?, ?, ?, ?, 1, NOW())`,
      [finalClienteId, tipoEquipoId, String(marca).trim().toUpperCase(), String(modelo).trim(), serieLimpia, accesoriosStr]
    );

    const equipoId = equipoRes.insertId;

    // 3. Generar correlativo automático OT-2026-XXXX o GAR-2026-XXXX
    const prefix = esGarantia ? 'GAR' : 'OT';
    const currentYear = new Date().getFullYear();
    const pattern = `${prefix}-${currentYear}-%`;

    const [lastRows] = await connection.query<RowDataPacket[]>(
      'SELECT codigo FROM ordenes_servicio WHERE codigo LIKE ? ORDER BY id DESC LIMIT 1',
      [pattern]
    );

    let nextNumber = 1;
    if (lastRows.length > 0) {
      const match = lastRows[0].codigo.match(/-(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    const codigoOrden = `${prefix}-${currentYear}-${String(nextNumber).padStart(4, '0')}`;

    // 4. Asignar técnico válido
    let finalTecnicoId = Number(tecnicoId);
    if (!finalTecnicoId || isNaN(finalTecnicoId)) {
      const [firstTec] = await connection.query<RowDataPacket[]>(
        `SELECT u.id FROM usuarios u 
         JOIN roles r ON u.rol_id = r.id 
         WHERE r.codigo = 'TECNICO' AND u.estado_id = 1 
         ORDER BY u.id ASC LIMIT 1`
      );
      finalTecnicoId = firstTec[0]?.id || recepcionadoPorId;
    }

    const prioridadId = PRIORIDAD_MAP[String(prioridad).toUpperCase()] || 1;
    const targetSucursalId = req.body.sucursalId && !isNaN(Number(req.body.sucursalId))
      ? Number(req.body.sucursalId)
      : (req.user?.sucursalId || 1);

    // 5. Insertar en `ordenes_servicio`
    const [ordenRes] = await connection.query<ResultSetHeader>(
      `INSERT INTO ordenes_servicio (
        codigo, cliente_id, sucursal_id, equipo_id, usuario_recibe_id, usuario_tecnico_id,
        descripcion_falla, costo_servicio, estado_orden_id, prioridad_id,
        fecha_ingreso, fecha_promesa, observaciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, NOW(), DATE_ADD(NOW(), INTERVAL 2 DAY), ?)`,
      [
        codigoOrden,
        finalClienteId,
        targetSucursalId,
        equipoId,
        recepcionadoPorId,
        finalTecnicoId,
        fallaReportada ? String(fallaReportada).trim() : 'Revisión general del equipo',
        Number(costoServicio) || 0,
        prioridadId,
        observaciones ? String(observaciones).trim() : null,
      ]
    );

    // 6. Registrar entrada inicial en `orden_bitacora`
    try {
      const autorInit = req.user?.nombreCompleto || 'Recepción';
      await connection.query(
        `INSERT INTO orden_bitacora (orden_id, usuario_id, autor_nombre, autor_rol, titulo, descripcion, estado_nuevo, fecha)
         VALUES (?, ?, ?, 'RECEPCION', 'Ingreso al Taller', ?, 'RECEPCIONADO', NOW())`,
        [
          ordenRes.insertId,
          recepcionadoPorId,
          autorInit,
          `Equipo ingresado con motivo / falla: "${fallaReportada ? String(fallaReportada).trim() : 'Revisión general'}".`,
        ]
      );
    } catch (bitErr) {
      console.warn('No se pudo insertar bitácora inicial (continuando):', bitErr);
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: `Orden de servicio ${codigoOrden} registrada exitosamente en MySQL.`,
      ordenId: ordenRes.insertId,
      codigo: codigoOrden,
      equipoId,
    });
  } catch (error: any) {
    await connection.rollback();
    console.error('Error al registrar orden de servicio:', error);
    res.status(500).json({ success: false, message: 'Error interno al registrar la orden de servicio.' });
  } finally {
    connection.release();
  }
}

/**
 * Descuenta del stock de la sede los repuestos utilizados en una orden aprobada
 * y genera los registros en movimientos_inventario (Kárdex).
 */
async function descontarStockRepuestos(connection: any, ordenId: number, codigoOrden: string, sucursalId?: number) {
  try {
    let finalSucursalId = sucursalId;
    if (!finalSucursalId) {
      const [osRows] = await connection.query('SELECT sucursal_id FROM ordenes_servicio WHERE id = ?', [ordenId]);
      finalSucursalId = osRows[0]?.sucursal_id || 1;
    }

    const [repuestos] = await connection.query(
      'SELECT id, producto_id, cantidad, descripcion FROM orden_repuestos WHERE orden_id = ? AND descontado_stock = 0 AND producto_id IS NOT NULL',
      [ordenId]
    );

    for (const rep of repuestos) {
      const cant = Number(rep.cantidad) || 1;
      // 1. Descontar en producto_stock_sede
      await connection.query(
        'UPDATE producto_stock_sede SET stock = GREATEST(0, stock - ?), updated_at = NOW() WHERE producto_id = ? AND sucursal_id = ?',
        [cant, rep.producto_id, finalSucursalId]
      );

      // 2. Registrar en movimientos_inventario (Kárdex)
      const movCode = `MOV-SAL-${Date.now()}-${rep.producto_id}`;
      await connection.query(
        `INSERT INTO movimientos_inventario 
         (codigo, tipo, producto_id, sede_origen_id, cantidad, motivo, solicitado_por, estado_movimiento_id, fecha_solicitud, fecha_aprobacion, created_at)
         VALUES (?, 'CONSUMO_TALLER', ?, ?, ?, ?, 1, 4, NOW(), NOW(), NOW())`,
        [movCode, rep.producto_id, finalSucursalId, cant, `Consumo en taller - Orden ${codigoOrden}`]
      );

      // 3. Marcar como descontado
      await connection.query('UPDATE orden_repuestos SET descontado_stock = 1 WHERE id = ?', [rep.id]);
    }
  } catch (err) {
    console.error('Error al descontar stock de repuestos:', err);
  }
}

/**
 * Restaura al stock de la sede los repuestos de una orden si el cliente declina o cancela.
 */
async function restaurarStockRepuestos(connection: any, ordenId: number, codigoOrden: string, sucursalId?: number) {
  try {
    let finalSucursalId = sucursalId;
    if (!finalSucursalId) {
      const [osRows] = await connection.query('SELECT sucursal_id FROM ordenes_servicio WHERE id = ?', [ordenId]);
      finalSucursalId = osRows[0]?.sucursal_id || 1;
    }

    const [repuestos] = await connection.query(
      'SELECT id, producto_id, cantidad, descripcion FROM orden_repuestos WHERE orden_id = ? AND descontado_stock = 1 AND producto_id IS NOT NULL',
      [ordenId]
    );

    for (const rep of repuestos) {
      const cant = Number(rep.cantidad) || 1;
      // 1. Re-sumar stock
      await connection.query(
        'UPDATE producto_stock_sede SET stock = stock + ?, updated_at = NOW() WHERE producto_id = ? AND sucursal_id = ?',
        [cant, rep.producto_id, finalSucursalId]
      );

      // 2. Registrar movimiento de retorno
      const movCode = `MOV-DEV-${Date.now()}-${rep.producto_id}`;
      await connection.query(
        `INSERT INTO movimientos_inventario 
         (codigo, tipo, producto_id, sede_destino_id, cantidad, motivo, solicitado_por, estado_movimiento_id, fecha_solicitud, fecha_aprobacion, created_at)
         VALUES (?, 'DEVOLUCION_TALLER', ?, ?, ?, ?, 1, 4, NOW(), NOW(), NOW())`,
        [movCode, rep.producto_id, finalSucursalId, cant, `Devolución a almacén por cancelación/rechazo de orden ${codigoOrden}`]
      );

      // 3. Marcar como no descontado
      await connection.query('UPDATE orden_repuestos SET descontado_stock = 0 WHERE id = ?', [rep.id]);
    }
  } catch (err) {
    console.error('Error al restaurar stock de repuestos:', err);
  }
}

/**
 * PUT /api/taller/ordenes/:id/presupuesto
 * Guarda o actualiza los repuestos y conceptos de mano de obra en MySQL (Punto 1)
 */
export async function savePresupuestoOrden(req: AuthenticatedRequest, res: Response): Promise<void> {
  const connection = await pool.getConnection();
  try {
    const ordenId = Number(req.params.id);
    const {
      repuestos = [],
      serviciosManoObra = [],
      costoTotal,
      titulo,
      comentario,
      observaciones,
      pasarAPresupuestado,
      nuevoEstado,
    } = req.body;

    if (!ordenId || isNaN(ordenId)) {
      res.status(400).json({ success: false, message: 'ID de orden inválido.' });
      return;
    }

    await connection.beginTransaction();

    const [ordenRows] = await connection.query<RowDataPacket[]>(
      'SELECT id, codigo, estado_orden_id FROM ordenes_servicio WHERE id = ?',
      [ordenId]
    );
    if (ordenRows.length === 0) {
      await connection.rollback();
      res.status(404).json({ success: false, message: 'Orden no encontrada.' });
      return;
    }
    const orden = ordenRows[0];

    // Obtener repuestos previos para verificar si alguno ya tenía stock descontado
    const [prevRep] = await connection.query<RowDataPacket[]>(
      'SELECT id, producto_id, cantidad, descontado_stock FROM orden_repuestos WHERE orden_id = ?',
      [ordenId]
    );

    // Si la orden ya estaba aprobada y tenía stock descontado, devolver temporalmente para recalcular limpio
    for (const r of prevRep) {
      if (r.descontado_stock && r.producto_id) {
        await connection.query(
          'UPDATE producto_stock_sede SET stock = stock + ? WHERE producto_id = ? AND sucursal_id = 1',
          [r.cantidad, r.producto_id]
        );
      }
    }

    // Reemplazar repuestos
    await connection.query('DELETE FROM orden_repuestos WHERE orden_id = ?', [ordenId]);
    for (const r of repuestos) {
      const cant = Number(r.cantidad) || 1;
      const pu = Number(r.precioUnitario) || 0;
      const tot = Number(r.total) || (cant * pu);
      await connection.query(
        `INSERT INTO orden_repuestos (orden_id, producto_id, codigo, descripcion, cantidad, precio_unitario, total, descontado_stock)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        [ordenId, r.productoId || null, r.codigo || null, r.descripcion, cant, pu, tot]
      );
    }

    // Reemplazar mano de obra
    await connection.query('DELETE FROM orden_servicios_mano_obra WHERE orden_id = ?', [ordenId]);
    for (const s of serviciosManoObra) {
      const p = Number(s.precio) || 0;
      await connection.query(
        'INSERT INTO orden_servicios_mano_obra (orden_id, descripcion, precio) VALUES (?, ?, ?)',
        [ordenId, s.descripcion, p]
      );
    }

    // Calcular costo total
    const totRep = repuestos.reduce((sum: number, r: any) => sum + (Number(r.total) || (Number(r.cantidad || 1) * Number(r.precioUnitario || 0))), 0);
    const totMo = serviciosManoObra.reduce((sum: number, s: any) => sum + (Number(s.precio) || 0), 0);
    const finalCosto = costoTotal !== undefined ? Number(costoTotal) : (totRep + totMo);

    const shouldPresupuestar = pasarAPresupuestado === true || nuevoEstado === 'PRESUPUESTADO';

    if (shouldPresupuestar) {
      await connection.query(
        'UPDATE ordenes_servicio SET costo_servicio = ?, estado_orden_id = 3, updated_at = NOW() WHERE id = ?',
        [finalCosto, ordenId]
      );
    } else {
      await connection.query(
        'UPDATE ordenes_servicio SET costo_servicio = ?, updated_at = NOW() WHERE id = ?',
        [finalCosto, ordenId]
      );
    }

    // Insertar entrada de bitácora con el título y comentario del técnico
    try {
      const autorNombre = req.user?.nombreCompleto || 'Técnico Especialista';
      const autorRol = req.user?.rol || 'TECNICO';
      const descRep = repuestos.map((r: any) => `${r.descripcion} (S/ ${Number(r.total || 0).toFixed(2)})`).join(', ') || 'Sin repuestos de almacén';
      const descServ = serviciosManoObra.map((s: any) => `${s.descripcion} (S/ ${Number(s.precio || 0).toFixed(2)})`).join(', ') || 'Revisión técnica';
      const defaultDesc = `Costos calculados: Total S/ ${finalCosto.toFixed(2)} (Repuestos: ${descRep} | Servicios: ${descServ}). Esperando confirmación del cliente.`;
      
      const bitacoraTitulo = String(titulo || '📋 Presupuesto Elaborado para Aprobación').trim();
      const bitacoraDesc = String(comentario || observaciones || defaultDesc).trim();

      await connection.query(
        `INSERT INTO orden_bitacora (orden_id, usuario_id, autor_nombre, autor_rol, titulo, descripcion, estado_nuevo, fecha)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          ordenId,
          req.user?.userId || null,
          autorNombre,
          autorRol,
          bitacoraTitulo,
          bitacoraDesc,
          shouldPresupuestar ? 'PRESUPUESTADO' : (ESTADO_INV_MAP[orden.estado_orden_id] || 'EN_DIAGNOSTICO'),
        ]
      );
    } catch (bitErr) {
      console.warn('Error al guardar bitácora en presupuesto (continuando):', bitErr);
    }

    // Si la orden ya está en APROBADO_EN_REPARACION (4) o ESPERA_REPUESTOS (5), descontar stock de los repuestos (Punto 2)
    if (orden.estado_orden_id === 4 || orden.estado_orden_id === 5) {
      await descontarStockRepuestos(connection, ordenId, orden.codigo);
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Presupuesto, repuestos y mano de obra guardados exitosamente en la base de datos.',
      costoTotal: finalCosto,
    });
  } catch (error: any) {
    await connection.rollback();
    console.error('Error al guardar presupuesto en base de datos:', error);
    res.status(500).json({ success: false, message: 'Error interno al guardar presupuesto.' });
  } finally {
    connection.release();
  }
}

/**
 * PUT /api/taller/ordenes/:id/estado
 * Actualiza el estado técnico de una orden (Diagnóstico, Reparación, Listo, Entregado)
 */
export async function updateEstadoOrden(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const ordenId = Number(req.params.id);
    const { nuevoEstado, diagnostico, solucion, costoServicio, observaciones, titulo, descripcion } = req.body;

    if (!ordenId || isNaN(ordenId)) {
      res.status(400).json({ success: false, message: 'ID de orden inválido.' });
      return;
    }

    const estadoId = ESTADO_MAP[String(nuevoEstado).toUpperCase()];
    if (!estadoId) {
      res.status(400).json({ success: false, message: 'Estado técnico no reconocido.' });
      return;
    }

    const [ordenRows] = await pool.query<RowDataPacket[]>(
      'SELECT id, codigo, estado_orden_id FROM ordenes_servicio WHERE id = ?',
      [ordenId]
    );
    if (ordenRows.length === 0) {
      res.status(404).json({ success: false, message: 'Orden de servicio no encontrada.' });
      return;
    }
    const orden = ordenRows[0];

    const updates: string[] = ['estado_orden_id = ?', 'updated_at = NOW()'];
    const params: any[] = [estadoId];

    if (diagnostico !== undefined) {
      updates.push('diagnostico = ?');
      params.push(String(diagnostico).trim());
    }
    if (solucion !== undefined) {
      updates.push('solucion = ?');
      params.push(String(solucion).trim());
    }
    if (costoServicio !== undefined) {
      updates.push('costo_servicio = ?');
      params.push(Number(costoServicio) || 0);
    }
    if (observaciones !== undefined) {
      updates.push('observaciones = ?');
      params.push(String(observaciones).trim());
    }
    if (estadoId === 8) {
      // ENTREGADO_COBRADO
      updates.push('fecha_entrega = NOW()');
    }

    params.push(ordenId);

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE ordenes_servicio SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ success: false, message: 'Orden de servicio no encontrada.' });
      return;
    }

    // PUNTO 2: Descuento / Restauración automática de Stock en Almacén según estado
    if (estadoId === 4 || estadoId === 5) {
      // APROBADO_EN_REPARACION o ESPERA_REPUESTOS -> Descontar stock
      await descontarStockRepuestos(pool, ordenId, orden.codigo);
    } else if (estadoId === 9) {
      // RECHAZADO_DEVUELTO -> Devolver stock a la sede
      await restaurarStockRepuestos(pool, ordenId, orden.codigo);
    }

    // Registrar en `orden_bitacora` para persistir título y comentarios de avances
    try {
      const autorNombre = req.user?.nombreCompleto || 'Usuario';
      const autorRol = req.user?.rol || 'TECNICO';
      const bitacoraTitulo = String(titulo || (nuevoEstado === 'PRESUPUESTADO' ? '📋 Presupuesto Elaborado para Aprobación' : `Avance: ${nuevoEstado}`)).trim();
      const bitacoraDesc = String(descripcion || observaciones || diagnostico || solucion || `Avance técnico registrado con estado ${nuevoEstado}.`).trim();

      await pool.query(
        `INSERT INTO orden_bitacora (orden_id, usuario_id, autor_nombre, autor_rol, titulo, descripcion, estado_nuevo, fecha)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [ordenId, req.user?.userId || null, autorNombre, autorRol, bitacoraTitulo, bitacoraDesc, nuevoEstado]
      );
    } catch (bitErr) {
      console.warn('Error al insertar orden_bitacora en updateEstadoOrden (continuando):', bitErr);
    }

    res.json({
      success: true,
      message: `Orden #${ordenId} actualizada al estado ${nuevoEstado}.`,
      nuevoEstado,
    });
  } catch (error: any) {
    console.error('Error al actualizar estado de orden:', error);
    res.status(500).json({ success: false, message: 'Error interno al actualizar estado de la orden.' });
  }
}

/**
 * POST /api/taller/ordenes/enviar-ticket-email
 * Envía el ticket de servicio por correo electrónico al cliente
 */
export async function sendTicketEmail(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      toEmail,
      clienteNombre,
      clienteDocumento,
      clienteTelefono,
      codigoOrden,
      fechaIngreso,
      tipoEquipo,
      marca,
      modelo,
      numeroSerie,
      accesorios,
      fallaReportada,
      presupuestoTotal,
      adelantoPagado,
      saldoPendiente,
      garantiaDias,
      tecnicoNombre,
    } = req.body;

    if (!toEmail || !toEmail.includes('@')) {
      res.status(400).json({ success: false, message: 'Dirección de correo electrónico inválida.' });
      return;
    }
    if (!codigoOrden) {
      res.status(400).json({ success: false, message: 'Código de orden de servicio requerido.' });
      return;
    }

    const result = await sendWorkshopTicketEmail({
      toEmail: String(toEmail).trim(),
      clienteNombre: clienteNombre || 'Estimado(a) Cliente',
      clienteDocumento,
      clienteTelefono,
      codigoOrden,
      fechaIngreso: fechaIngreso || new Date().toLocaleString('es-PE'),
      tipoEquipo: tipoEquipo || 'Dispositivo / Equipo',
      marca: marca || 'EQUIPO',
      modelo: modelo || 'Estándar',
      numeroSerie: numeroSerie || 'S/N',
      accesorios,
      fallaReportada: fallaReportada || 'Revisión técnica',
      presupuestoTotal: Number(presupuestoTotal) || 0,
      adelantoPagado: Number(adelantoPagado) || 0,
      saldoPendiente: Number(saldoPendiente) || 0,
      garantiaDias: Number(garantiaDias) || 90,
      tecnicoNombre,
    });

    if (result.success) {
      res.json({
        success: true,
        simulated: !!result.simulated,
        message: result.simulated
          ? `Ticket simulado en consola (sin SMTP activo). Destino: ${toEmail}`
          : `Ticket de servicio enviado exitosamente al correo ${toEmail}`,
      });
    } else {
      res.status(500).json({
        success: false,
        message: `No se pudo enviar el correo: ${result.error || 'Error del servidor de correo.'}`,
      });
    }
  } catch (error: any) {
    console.error('Error enviando ticket por correo:', error);
    res.status(500).json({ success: false, message: 'Error interno al procesar el envío del ticket por correo.' });
  }
}

/**
 * GET /api/taller/tracking/:codigo
 * Permite consultar el estado de una orden por su código públicamente sin autenticación de trabajador
 */
export async function getTrackingPublico(req: Request, res: Response): Promise<void> {
  try {
    const { codigo } = req.params;
    if (!codigo) {
      res.status(400).json({ success: false, message: 'Código requerido.' });
      return;
    }

    const query = `
      SELECT 
        os.id,
        os.codigo,
        os.cliente_id AS clienteId,
        COALESCE(NULLIF(TRIM(c.razon_social), ''), CONCAT(COALESCE(p.nombres, ''), ' ', COALESCE(p.apellidos, ''))) AS clienteNombre,
        COALESCE(c.ruc, p.dni, '') AS clienteDocumento,
        p.telefono AS clienteTelefono,
        p.correo AS clienteEmail,
        os.equipo_id AS equipoId,
        eq.marca,
        eq.modelo,
        eq.numero_serie AS numeroSerie,
        eq.accesorios,
        COALESCE(te.nombre, 'Equipo / Dispositivo') AS tipoEquipo,
        os.usuario_recibe_id AS recepcionadoPorId,
        rec.nombre_completo AS recepcionadoPorNombre,
        os.usuario_tecnico_id AS tecnicoId,
        tec.nombre_completo AS tecnicoNombre,
        os.descripcion_falla AS fallaReportada,
        os.diagnostico,
        os.solucion,
        os.costo_servicio AS costoTotal,
        os.estado_orden_id AS estadoOrdenId,
        eos.codigo AS estadoCodigo,
        eos.nombre AS estadoNombre,
        os.prioridad_id AS prioridadId,
        prio.codigo AS prioridadCodigo,
        os.fecha_ingreso AS fechaIngreso,
        os.fecha_promesa AS fechaEstimadaEntrega,
        os.fecha_entrega AS fechaEntrega,
        os.observaciones
      FROM ordenes_servicio os
      INNER JOIN clientes c ON os.cliente_id = c.id_cliente
      LEFT JOIN personas p ON c.id_persona = p.id_persona
      LEFT JOIN equipos eq ON os.equipo_id = eq.id
      LEFT JOIN tipos_equipo te ON eq.tipo_equipo_id = te.id
      LEFT JOIN usuarios rec ON os.usuario_recibe_id = rec.id
      LEFT JOIN usuarios tec ON os.usuario_tecnico_id = tec.id
      INNER JOIN estados_orden_servicio eos ON os.estado_orden_id = eos.id
      LEFT JOIN prioridades_orden prio ON os.prioridad_id = prio.id
      WHERE os.codigo = ?
      LIMIT 1
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [codigo.trim().toUpperCase()]);
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Orden de servicio no encontrada.' });
      return;
    }

    const r = rows[0];

    // Cargar repuestos y mano de obra asociados a esta orden
    const [repuestosRows] = await pool.query<RowDataPacket[]>(
      'SELECT id, producto_id AS productoId, codigo, descripcion, cantidad, precio_unitario AS precioUnitario, total, descontado_stock AS descontadoStock FROM orden_repuestos WHERE orden_id = ?',
      [r.id]
    );
    const [serviciosRows] = await pool.query<RowDataPacket[]>(
      'SELECT id, descripcion, precio FROM orden_servicios_mano_obra WHERE orden_id = ?',
      [r.id]
    );

    const repuestos = repuestosRows.map((rep) => ({
      id: `rep-${rep.id}`,
      dbId: rep.id,
      productoId: rep.productoId,
      codigo: rep.codigo || '',
      descripcion: rep.descripcion,
      cantidad: Number(rep.cantidad) || 1,
      precioUnitario: Number(rep.precioUnitario) || 0,
      total: Number(rep.total) || 0,
      descontadoStock: Boolean(rep.descontadoStock),
    }));

    const serviciosManoObra = serviciosRows.map((s) => ({
      id: `mo-${s.id}`,
      dbId: s.id,
      descripcion: s.descripcion,
      precio: Number(s.precio) || 0,
    }));

    const costoTotalRepuestos = repuestos.reduce((sum: number, x: any) => sum + (Number(x.total) || 0), 0);
    const costoTotalManoObra = serviciosManoObra.reduce((sum: number, x: any) => sum + (Number(x.precio) || 0), 0);
    const costoTotal = Number(r.costoTotal) || (costoTotalRepuestos + costoTotalManoObra);

    const accesoriosArr = r.accesorios
      ? (typeof r.accesorios === 'string' && r.accesorios.includes(',')
          ? r.accesorios.split(',').map((a: string) => a.trim())
          : [r.accesorios])
      : ['Solo equipo'];

    const estadoKey = (ESTADO_INV_MAP[r.estadoOrdenId] || 'RECEPCIONADO') as any;

    let bitacoraFinal: any[] = [];
    try {
      const [bitacoraRows] = await pool.query<RowDataPacket[]>(
        `SELECT id, autor_nombre AS autorNombre, autor_rol AS autorRol,
                titulo, descripcion, estado_nuevo AS estadoNuevo, fecha
         FROM orden_bitacora
         WHERE orden_id = ?
         ORDER BY fecha DESC, id DESC`,
        [r.id]
      );
      bitacoraFinal = bitacoraRows.map((b) => ({
        id: `b-${b.id}`,
        fecha: new Date(b.fecha).toLocaleString('es-PE', { hour12: false }),
        autorNombre: b.autorNombre || 'Taller',
        autorRol: b.autorRol || 'TECNICO',
        titulo: b.titulo || 'Avance',
        descripcion: b.descripcion || '',
        estadoNuevo: b.estadoNuevo,
      }));
    } catch (err) {
      console.warn('Bitacora query error in getOrdenById:', err);
    }

    if (bitacoraFinal.length === 0) {
      bitacoraFinal = [
        {
          id: `b-${r.id}-curr`,
          fecha: new Date(r.fechaIngreso).toLocaleString('es-PE', { hour12: false }),
          autorNombre: r.recepcionadoPorNombre || 'Soporte Técnico',
          autorRol: 'SISTEMA',
          titulo: estadoKey === 'PRESUPUESTADO' ? '📋 Presupuesto Elaborado para Aprobación' : `Estado: ${r.estadoNombre}`,
          descripcion: r.observaciones || `Equipo en estado actual: ${r.estadoNombre}`,
          estadoNuevo: estadoKey,
        },
      ];
    }

    const orden = {
      id: r.id,
      codigo: r.codigo,
      clienteId: r.clienteId,
      clienteNombre: r.clienteNombre ? String(r.clienteNombre).trim() : 'Cliente General',
      clienteDocumento: r.clienteDocumento || '',
      clienteTelefono: r.clienteTelefono || '',
      clienteEmail: r.clienteEmail || '',
      tipoEquipo: r.tipoEquipo,
      marca: r.marca || 'GENÉRICO',
      modelo: r.modelo || 'Estándar',
      numeroSerie: r.numeroSerie || 'S/N',
      passwordEquipo: 'No aplica',
      accesoriosDejados: accesoriosArr,
      fallaReportada: r.fallaReportada || 'Revisión preventiva',
      estadoEstetico: 'Buen estado general',
      prioridad: (PRIORIDAD_INV_MAP[r.prioridadId] || 'NORMAL') as any,
      tecnicoId: r.tecnicoId || 1,
      tecnicoNombre: r.tecnicoNombre || 'Especialista Asignado',
      recepcionadoPorId: r.recepcionadoPorId || 1,
      recepcionadoPorNombre: r.recepcionadoPorNombre || 'Recepción',
      fechaIngreso: new Date(r.fechaIngreso).toLocaleString('es-PE', { hour12: false }),
      fechaEstimadaEntrega: r.fechaEstimadaEntrega
        ? new Date(r.fechaEstimadaEntrega).toLocaleDateString('es-PE')
        : 'En 24 a 48 horas hábiles',
      estado: estadoKey,
      repuestos,
      serviciosManoObra,
      costoTotalRepuestos,
      costoTotalManoObra,
      costoTotal,
      adelantoPagado: 0,
      saldoPendiente: costoTotal,
      bitacora: bitacoraFinal,
      comunicaciones: [],
      garantiaDias: r.codigo.startsWith('GAR') ? 180 : 90,
    };

    res.json({ success: true, orden });
  } catch (error: any) {
    console.error('Error al consultar tracking público:', error);
    res.status(500).json({ success: false, message: 'Error interno al consultar tracking.' });
  }
}

/**
 * POST /api/taller/ordenes/responder-presupuesto
 * Permite al cliente final Aceptar o Rechazar el presupuesto desde la web de seguimiento sin autenticación de trabajador
 */
export async function responderPresupuestoCliente(req: Request, res: Response): Promise<void> {
  try {
    const { codigo, accion, observacion } = req.body;

    if (!codigo || !accion) {
      res.status(400).json({ success: false, message: 'Código de orden y acción (APROBAR o RECHAZAR) son requeridos.' });
      return;
    }

    const accionUpper = String(accion).toUpperCase();
    if (accionUpper !== 'APROBAR' && accionUpper !== 'RECHAZAR') {
      res.status(400).json({ success: false, message: 'Acción no válida. Debe ser APROBAR o RECHAZAR.' });
      return;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, codigo, estado_orden_id, costo_servicio FROM ordenes_servicio WHERE codigo = ? LIMIT 1',
      [codigo.trim()]
    );

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Orden de servicio no encontrada.' });
      return;
    }

    const orden = rows[0];
    const nuevoEstadoId = accionUpper === 'APROBAR' ? 4 : 9; // 4 = APROBADO_EN_REPARACION, 9 = RECHAZADO_DEVUELTO
    const nuevoEstadoStr = accionUpper === 'APROBAR' ? 'APROBADO_EN_REPARACION' : 'RECHAZADO_DEVUELTO';

    const detalle = accionUpper === 'APROBAR'
      ? `El cliente aceptó y autorizó el presupuesto desde la web de seguimiento.${observacion ? ` Comentario: ${observacion}` : ''}`
      : `El cliente rechazó el presupuesto desde la web de seguimiento.${observacion ? ` Motivo: ${observacion}` : ''}`;

    await pool.query<ResultSetHeader>(
      'UPDATE ordenes_servicio SET estado_orden_id = ?, observaciones = CONCAT(COALESCE(observaciones, ""), " | ", ?), updated_at = NOW() WHERE id = ?',
      [nuevoEstadoId, detalle, orden.id]
    );

    // PUNTO 2: Actualización de stock en almacén e historial en movimientos_inventario
    if (accionUpper === 'APROBAR') {
      await descontarStockRepuestos(pool, orden.id, orden.codigo);
    } else {
      await restaurarStockRepuestos(pool, orden.id, orden.codigo);
    }

    res.json({
      success: true,
      message: accionUpper === 'APROBAR'
        ? '¡Presupuesto aprobado con éxito! El taller comenzará los trabajos en tu equipo.'
        : 'Presupuesto declinado. Tu equipo quedará preparado para entrega en mostrador.',
      nuevoEstado: nuevoEstadoStr,
    });
  } catch (error: any) {
    console.error('Error al responder presupuesto del cliente:', error);
    res.status(500).json({ success: false, message: 'Error interno al procesar la respuesta del cliente.' });
  }
}


