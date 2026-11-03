import { Request, Response } from 'express';
import { pool } from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * GET /api/garantias/verificar?serie=XYZ
 * Busca un número de serie en la base de datos de ventas de MG Solutions
 * y calcula con precisión su estado de garantía, días restantes y comprobante.
 */
export async function verificarGarantia(req: Request, res: Response): Promise<void> {
  try {
    const serie = req.query.serie ? String(req.query.serie).trim().toUpperCase() : '';

    if (!serie) {
      res.status(400).json({ success: false, message: 'Debe ingresar un número de serie.' });
      return;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT psg.id, psg.numero_serie, psg.meses_garantia, psg.fecha_venta,
              psg.estado_garantia, psg.observaciones,
              p.id AS producto_id, p.nombre AS producto_nombre, p.codigo AS producto_codigo,
              p.modelo_id, mo.nombre AS modelo_nombre,
              m.nombre AS marca_nombre,
              v.id AS venta_id, v.codigo_comprobante,
              c.id_cliente AS cliente_id,
              COALESCE(NULLIF(TRIM(c.razon_social), ''), CONCAT(COALESCE(per.nombres, ''), ' ', COALESCE(per.apellidos, ''))) AS cliente_nombre,
              COALESCE(c.ruc, per.dni, '') AS cliente_documento,
              per.telefono AS cliente_telefono
       FROM producto_series_garantia psg
       LEFT JOIN productos p ON psg.producto_id = p.id
       LEFT JOIN marcas m ON p.marca_id = m.id
       LEFT JOIN modelos mo ON p.modelo_id = mo.id
       LEFT JOIN ventas v ON psg.venta_id = v.id
       LEFT JOIN clientes c ON psg.cliente_id = c.id_cliente
       LEFT JOIN personas per ON c.id_persona = per.id_persona
       WHERE UPPER(psg.numero_serie) = ?
       LIMIT 1`,
      [serie]
    );

    if (rows.length === 0) {
      res.json({
        success: true,
        encontrado: false,
        estado: 'NO_REGISTRADO',
        serie,
        message: 'El número de serie no figura en el registro de ventas de MG Solutions.',
      });
      return;
    }

    const r = rows[0];
    const fechaVenta = new Date(r.fecha_venta);
    const meses = Number(r.meses_garantia) || 12;

    // Obtener características técnicas del modelo si existe
    let caracteristicas: { atributo: string; valor: string }[] = [];
    if (r.modelo_id) {
      const [detalles] = await pool.query<RowDataPacket[]>(
        'SELECT atributo, valor FROM detalle_modelo WHERE modelo_id = ? ORDER BY id ASC',
        [r.modelo_id]
      );
      caracteristicas = detalles.map((d) => ({ atributo: d.atributo, valor: d.valor }));
    }

    // Calcular fecha límite
    const fechaExpiracion = new Date(fechaVenta);
    fechaExpiracion.setMonth(fechaExpiracion.getMonth() + meses);

    const hoy = new Date();
    const diferenciaMs = fechaExpiracion.getTime() - hoy.getTime();
    const diasRestantes = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));

    let estadoCalculado: 'VIGENTE' | 'VENCIDA' | 'ANULADA_DANO_FISICO' = 'VIGENTE';
    if (r.estado_garantia === 'ANULADA_DANO_FISICO') {
      estadoCalculado = 'ANULADA_DANO_FISICO';
    } else if (diasRestantes <= 0) {
      estadoCalculado = 'VENCIDA';
    }

    res.json({
      success: true,
      encontrado: true,
      serie: r.numero_serie,
      estado: estadoCalculado,
      diasRestantes: Math.max(0, diasRestantes),
      diasVencida: diasRestantes < 0 ? Math.abs(diasRestantes) : 0,
      fechaVenta: fechaVenta.toISOString().split('T')[0],
      fechaExpiracion: fechaExpiracion.toISOString().split('T')[0],
      mesesGarantia: meses,
      producto: {
        id: r.producto_id,
        nombre: r.producto_nombre || 'Equipo Computacional',
        codigo: r.producto_codigo || '',
        marca: r.marca_nombre || 'GENÉRICO',
        modelo: r.modelo_nombre || null,
        caracteristicas,
      },
      comprobante: r.codigo_comprobante || 'VENTA EN TIENDA',
      cliente: {
        id: r.cliente_id,
        nombre: r.cliente_nombre ? String(r.cliente_nombre).trim() : 'Cliente Particular',
        documento: r.cliente_documento || '',
        telefono: r.cliente_telefono || '',
      },
      observaciones: r.observaciones || '',
    });
  } catch (error: any) {
    console.error('Error al verificar garantía:', error);
    res.status(500).json({ success: false, message: 'Error interno al consultar garantía.' });
  }
}

/**
 * POST /api/garantias/ingreso
 * Registra formalmente el ingreso de un equipo en mostrador bajo cobertura de garantía
 */
export async function registrarIngresoGarantia(req: Request, res: Response): Promise<void> {
  const connection = await pool.getConnection();
  try {
    const {
      numeroSerie,
      clienteNombre,
      clienteTelefono,
      clienteDocumento,
      marca,
      modelo,
      fallaReclamada,
      observacionesEsteticas,
      checklistFisico, // { pantallaRota: false, liquidos: false, golpes: false, sellosViolados: false }
      usuarioRecibeId,
    } = req.body;

    if (!numeroSerie || !fallaReclamada) {
      res.status(400).json({
        success: false,
        message: 'El número de serie y la falla reclamada son obligatorios.',
      });
      return;
    }

    // Si tiene daño físico marcado, no califica para costo 0 de garantía de fábrica
    const tieneDanoFisico =
      checklistFisico?.pantallaRota ||
      checklistFisico?.liquidos ||
      checklistFisico?.golpes ||
      checklistFisico?.sellosViolados;

    if (tieneDanoFisico) {
      res.status(400).json({
        success: false,
        message: 'No procede garantía de fábrica: el equipo presenta daños físicos, caídas o humedad.',
      });
      return;
    }

    await connection.beginTransaction();

    // 1. Obtener datos de la garantía y cliente real de la venta
    const [garantiaRows] = await connection.query<RowDataPacket[]>(
      `SELECT psg.id, psg.venta_id, v.cliente_id,
              COALESCE(NULLIF(TRIM(c.razon_social), ''), CONCAT(COALESCE(p.nombres, ''), ' ', COALESCE(p.apellidos, ''))) AS cliente_nombre,
              COALESCE(c.ruc, p.dni, '') AS cliente_documento,
              p.telefono AS cliente_telefono
       FROM producto_series_garantia psg
       JOIN ventas v ON psg.venta_id = v.id
       JOIN clientes c ON v.cliente_id = c.id_cliente
       JOIN personas p ON c.id_persona = p.id_persona
       WHERE UPPER(psg.numero_serie) = ? LIMIT 1`,
      [String(numeroSerie).trim().toUpperCase()]
    );

    const clienteRealId = garantiaRows[0]?.cliente_id || 1;
    const titularNombre = garantiaRows[0]?.cliente_nombre || clienteNombre || 'Titular';
    const titularDoc = garantiaRows[0]?.cliente_documento || '';
    const titularTel = clienteTelefono || garantiaRows[0]?.cliente_telefono || 'N/A';

    // 2. Generar código correlativo de orden de garantía
    const [maxRows] = await connection.query<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM ordenes_servicio'
    );
    const correlativo = String(Number(maxRows[0].total) + 1).padStart(5, '0');
    const codigoOrden = `GAR-${correlativo}`;

    // 3. Registrar equipo en tabla 'equipos' si no existe
    const [eqRows] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM equipos WHERE UPPER(numero_serie) = ? LIMIT 1',
      [String(numeroSerie).trim().toUpperCase()]
    );

    let equipoId: number;
    if (eqRows.length > 0) {
      equipoId = eqRows[0].id;
    } else {
      const [eqInsert] = await connection.query<ResultSetHeader>(
        `INSERT INTO equipos (cliente_id, tipo_equipo_id, marca, modelo, numero_serie, accesorios, estado_id)
         VALUES (?, 1, ?, ?, ?, 'Cargador Original', 1)`,
        [clienteRealId, marca || 'DESCONOCIDA', modelo || 'MODELO NO ESPECIFICADO', numeroSerie]
      );
      equipoId = eqInsert.insertId;
    }

    // 4. Insertar orden de servicio como GARANTÍA (Costo Servicio = 0.00)
    const fechaPromesa = new Date();
    fechaPromesa.setDate(fechaPromesa.getDate() + 3); // 3 días para evaluación de garantía

    const obsTexto = `[INGRESO POR GARANTÍA OFICIAL]\nEstado Estético: ${observacionesEsteticas || 'Normal'}\nCliente: ${titularNombre} (Doc: ${titularDoc} | Tel: ${titularTel})\nChecklist: Sin caídas, sin humedad, sellos íntegros.`;

    const [ordenInsert] = await connection.query<ResultSetHeader>(
      `INSERT INTO ordenes_servicio (
         codigo, cliente_id, equipo_id, usuario_recibe_id,
         descripcion_falla, costo_servicio, estado_orden_id, prioridad_id,
         fecha_ingreso, fecha_promesa, observaciones
       ) VALUES (?, ?, ?, ?, ?, 0.00, 1, 2, NOW(), ?, ?)`,
      [codigoOrden, clienteRealId, equipoId, usuarioRecibeId || 1, fallaReclamada, fechaPromesa, obsTexto]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: `Orden de Garantía #${codigoOrden} generada exitosamente a costo S/ 0.00.`,
      orden: {
        id: ordenInsert.insertId,
        codigo: codigoOrden,
        numeroSerie,
        marca,
        modelo,
        falla: fallaReclamada,
        costo: 0.0,
        fechaIngreso: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    await connection.rollback();
    console.error('Error al registrar ingreso de garantía:', error);
    res.status(500).json({ success: false, message: 'Error interno al registrar garantía.' });
  } finally {
    connection.release();
  }
}
