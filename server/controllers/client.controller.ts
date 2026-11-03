import { Request, Response } from 'express';
import { pool } from '../config/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import { validarRUC, validarDNI, validarDocumento } from '../utils/validation';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// =====================================================================
// INTERFACES
// =====================================================================

interface ClientePayload {
  tipoDocumento: 'RUC' | 'DNI' | 'CE';
  numeroDocumento: string;
  razonSocial?: string;
  nombres?: string;
  apellidos?: string;
  nombreEmpresa?: string;
  direccionFiscal: string;
  email?: string;
  telefono?: string;
  estado?: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';
}

interface ClienteResponse {
  id: number;
  idPersona: number;
  tipoDocumento: string;
  numeroDocumento: string;
  razonSocial: string;
  nombreEmpresa: string | null;
  direccionFiscal: string;
  email: string | null;
  telefono: string | null;
  estado: string;
  fechaRegistro: string;
  totalEquipos: number;
  totalServicios: number;
}

// =====================================================================
// HELPERS
// =====================================================================

function getEstadoId(estado: string): number {
  switch (estado) {
    case 'INACTIVO': return 2;
    case 'SUSPENDIDO': return 3;
    default: return 1; // ACTIVO
  }
}

function parsePersonaRow(row: RowDataPacket): ClienteResponse {
  const isRuc = Boolean(row.ruc);
  const tipoDoc = isRuc
    ? 'RUC'
    : (row.dni && String(row.dni).length === 8 ? 'DNI' : (row.dni ? 'CE' : 'DNI'));
  const numDoc = row.ruc || row.dni || row.numero_documento || '';
  const fullName = [row.nombres, row.apellidos].filter(Boolean).join(' ').trim();
  const razonSocial = isRuc
    ? (row.razon_social || '')
    : (row.razon_social || fullName || '');

  return {
    id: row.id_cliente,
    idPersona: row.id_persona,
    tipoDocumento: tipoDoc,
    numeroDocumento: numDoc,
    razonSocial: razonSocial,
    nombreEmpresa: row.nombre_empresa || null,
    direccionFiscal: row.direccion || row.direccion_fiscal || '',
    email: row.correo || row.email || null,
    telefono: row.telefono || null,
    estado: row.estado_nombre || 'ACTIVO',
    fechaRegistro: row.cliente_created_at || row.created_at || new Date().toISOString(),
    totalEquipos: Number(row.total_equipos || 0),
    totalServicios: Number(row.total_servicios || 0),
  };
}

// =====================================================================
// CONTROLADORES
// =====================================================================

/**
 * GET /api/clientes
 * Listar clientes con paginación y filtros
 */
export async function getClients(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { search, estado, page = '1', limit = '25' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const offset = (pageNum - 1) * limitNum;

    let whereClauses: string[] = [];
    let params: any[] = [];

    if (search) {
      whereClauses.push(
        `(c.razon_social LIKE ? OR c.nombre_empresa LIKE ? OR p.nombres LIKE ? OR p.apellidos LIKE ? OR p.dni LIKE ? OR c.ruc LIKE ? OR p.correo LIKE ?)`
      );
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam, searchParam, searchParam, searchParam);
    }

    if (estado && ['ACTIVO', 'INACTIVO', 'SUSPENDIDO'].includes(estado as string)) {
      whereClauses.push('e.nombre = ?');
      params.push(estado);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Consulta principal con paginación
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.id_cliente, c.id_persona, c.ruc, c.razon_social, c.nombre_empresa,
              c.estado_id, e.nombre AS estado_nombre, c.created_at AS cliente_created_at,
              p.dni, p.nombres, p.apellidos, p.telefono, p.correo, p.direccion,
              (SELECT COUNT(*) FROM equipos eq WHERE eq.cliente_id = c.id_cliente) AS total_equipos,
              (SELECT COUNT(*) FROM ordenes_servicio os WHERE os.cliente_id = c.id_cliente) AS total_servicios
       FROM clientes c
       JOIN personas p ON c.id_persona = p.id_persona
       JOIN estados e ON c.estado_id = e.id
       ${whereSQL}
       ORDER BY c.id_cliente DESC
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    // Conteo total para paginación
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM clientes c JOIN personas p ON c.id_persona = p.id_persona JOIN estados e ON c.estado_id = e.id ${whereSQL}`,
      params
    );

    const total = Number(countRows[0].total);
    const totalPages = Math.ceil(total / limitNum);

    // Conteo global para tarjetas de estadísticas
    const [statsRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        COUNT(*) AS total,
        COALESCE(SUM(CASE WHEN e.nombre = 'ACTIVO' THEN 1 ELSE 0 END), 0) AS activos,
        COALESCE(SUM(CASE WHEN e.nombre = 'INACTIVO' THEN 1 ELSE 0 END), 0) AS inactivos
       FROM clientes c
       JOIN estados e ON c.estado_id = e.id`
    );

    const stats = {
      total: Number(statsRows[0]?.total || 0),
      activos: Number(statsRows[0]?.activos || 0),
      inactivos: Number(statsRows[0]?.inactivos || 0),
    };

    const clientes: ClienteResponse[] = rows.map((row) => parsePersonaRow(row));

    res.json({
      success: true,
      data: clientes,
      pagination: { page: pageNum, limit: limitNum, total, totalPages },
      stats,
    });
  } catch (error) {
    console.error('Error en getClients:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo clientes.' });
  }
}

/**
 * GET /api/clientes/:id
 * Detalle de un cliente específico
 */
export async function getClientById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const clientId = Number(req.params.id);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.id_cliente, c.id_persona, c.ruc, c.razon_social, c.nombre_empresa,
              c.estado_id, e.nombre AS estado_nombre, c.created_at AS cliente_created_at,
              p.dni, p.nombres, p.apellidos, p.telefono, p.correo, p.direccion,
              (SELECT COUNT(*) FROM equipos eq WHERE eq.cliente_id = c.id_cliente) AS total_equipos,
              (SELECT COUNT(*) FROM ordenes_servicio os WHERE os.cliente_id = c.id_cliente) AS total_servicios
       FROM clientes c
       JOIN personas p ON c.id_persona = p.id_persona
       JOIN estados e ON c.estado_id = e.id
       WHERE c.id_cliente = ?
       LIMIT 1`,
      [clientId]
    );

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Cliente no encontrado.' });
      return;
    }

    const clienteResponse: ClienteResponse = parsePersonaRow(rows[0]);

    res.json({ success: true, data: clienteResponse });
  } catch (error) {
    console.error('Error en getClientById:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo cliente.' });
  }
}

/**
 * POST /api/clientes
 * Crear nuevo cliente (transacción: personas + clientes)
 */
export async function createClient(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      tipoDocumento,
      numeroDocumento,
      razonSocial,
      nombreEmpresa,
      direccionFiscal,
      email,
      telefono,
      estado = 'ACTIVO',
    } = req.body;

    // Validaciones básicas
    if (!tipoDocumento || !numeroDocumento || !direccionFiscal) {
      res.status(400).json({
        success: false,
        message: 'Campos obligatorios: tipoDocumento, numeroDocumento, direccionFiscal.',
      });
      return;
    }

    const docLimpio = String(numeroDocumento).trim().toUpperCase();
    const razonSocialLimpia = (razonSocial || '').trim().toUpperCase();
    const estadoId = getEstadoId(estado);

    // Validación específica según tipo de cliente
    if (tipoDocumento === 'RUC') {
      if (!razonSocialLimpia) {
        res.status(400).json({
          success: false,
          message: 'La Razón Social es obligatoria para clientes de tipo RUC (Empresa).',
        });
        return;
      }

      const validation = validarDocumento('RUC', docLimpio);
      if (!validation.valido) {
        res.status(400).json({ success: false, message: validation.mensaje });
        return;
      }

      // Verificar RUC duplicado
      const [existingRUC] = await pool.query<RowDataPacket[]>(
        'SELECT id_cliente FROM clientes WHERE ruc = ? LIMIT 1',
        [docLimpio]
      );
      if (existingRUC.length > 0) {
        res.status(409).json({ success: false, message: 'El RUC ya se encuentra registrado en el sistema.' });
        return;
      }
    } else {
      // DNI o CE (Persona natural)
      if (!razonSocialLimpia && !req.body.nombres) {
        res.status(400).json({
          success: false,
          message: 'El nombre completo es obligatorio para personas naturales.',
        });
        return;
      }

      const validation = validarDocumento(tipoDocumento, docLimpio);
      if (!validation.valido) {
        res.status(400).json({ success: false, message: validation.mensaje });
        return;
      }

      // Verificar DNI/CE duplicado
      const [existingDoc] = await pool.query<RowDataPacket[]>(
        'SELECT id_persona FROM personas WHERE dni = ? LIMIT 1',
        [docLimpio]
      );
      if (existingDoc.length > 0) {
        res.status(409).json({
          success: false,
          message: `${tipoDocumento} ya registrado en el sistema.`,
        });
        return;
      }
    }

    // Determinar nombres/apellidos para la tabla personas
    let nombres = '';
    let apellidos: string | null = null;
    let tipoDocId = 1;

    if (tipoDocumento === 'RUC') {
      nombres = razonSocialLimpia.slice(0, 100);
      apellidos = null;
      tipoDocId = 2; // RUC
    } else {
      tipoDocId = tipoDocumento === 'CE' ? 3 : 1;
      const partesNombre = razonSocialLimpia.split(/\s+/);
      if (partesNombre.length === 1) {
        nombres = partesNombre[0];
        apellidos = '';
      } else {
        const mitad = Math.ceil(partesNombre.length / 2);
        nombres = partesNombre.slice(0, mitad).join(' ');
        apellidos = partesNombre.slice(mitad).join(' ');
      }
    }

    // Transacción
    const connection = await pool.getConnection();
    try {
      await connection.query('START TRANSACTION');

      // Insertar persona
      const [personaResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO personas (tipo_documento_id, dni, nombres, apellidos, telefono, correo, direccion, estado_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tipoDocId,
          tipoDocumento === 'RUC' ? null : docLimpio,
          nombres,
          apellidos,
          telefono || null,
          email || null,
          direccionFiscal.trim(),
          estadoId,
        ]
      );

      const personaId = personaResult.insertId;

      // Insertar cliente
      const [clienteResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO clientes (id_persona, ruc, nombre_empresa, razon_social, estado_id)
         VALUES (?, ?, ?, ?, ?)`,
        [
          personaId,
          tipoDocumento === 'RUC' ? docLimpio : null,
          tipoDocumento === 'RUC' ? (nombreEmpresa?.trim() || null) : null,
          tipoDocumento === 'RUC' ? razonSocialLimpia : (razonSocialLimpia || `${nombres} ${apellidos || ''}`.trim()),
          estadoId,
        ]
      );

      const clienteId = clienteResult.insertId;

      await connection.query('COMMIT');

      // Response con el cliente creado (usando clienteId)
      const [newClient] = await pool.query<RowDataPacket[]>(
        `SELECT c.id_cliente, c.id_persona, c.ruc, c.razon_social, c.nombre_empresa,
                c.estado_id, e.nombre AS estado_nombre, c.created_at AS cliente_created_at,
                p.dni, p.nombres, p.apellidos, p.telefono, p.correo, p.direccion,
                0 AS total_equipos, 0 AS total_servicios
         FROM clientes c
         JOIN personas p ON c.id_persona = p.id_persona
         JOIN estados e ON c.estado_id = e.id
         WHERE c.id_cliente = ?
         LIMIT 1`,
        [clienteId]
      );

      const clienteCreado = parsePersonaRow(newClient[0]);

      res.status(201).json({
        success: true,
        message: `Cliente '${clienteCreado.razonSocial}' registrado con éxito.`,
        data: clienteCreado,
      });
    } catch (transError) {
      await connection.query('ROLLBACK');
      throw transError;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Error en createClient:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ success: false, message: 'Documento ya registrado.' });
    } else {
      res.status(500).json({ success: false, message: error.message || 'Error creando cliente.' });
    }
  }
}

/**
 * PUT /api/clientes/:id
 * Actualizar cliente existente
 */
export async function updateClient(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const clientId = Number(req.params.id);
    const {
      tipoDocumento,
      numeroDocumento,
      razonSocial,
      nombreEmpresa,
      direccionFiscal,
      email,
      telefono,
      estado,
    } = req.body;

    // Verificar que el cliente existe
    const [existingRows] = await pool.query<RowDataPacket[]>(
      'SELECT id_persona, ruc FROM clientes WHERE id_cliente = ? LIMIT 1',
      [clientId]
    );
    if (existingRows.length === 0) {
      res.status(404).json({ success: false, message: 'Cliente no encontrado.' });
      return;
    }

    const personaId = existingRows[0].id_persona;
    const isCurrentRuc = Boolean(existingRows[0].ruc);
    const targetIsRuc = tipoDocumento ? tipoDocumento === 'RUC' : isCurrentRuc;

    const updatesPersona: string[] = [];
    const updatesCliente: string[] = [];
    const paramsPersona: any[] = [];
    const paramsCliente: any[] = [];

    if (numeroDocumento !== undefined) {
      const docLimpio = String(numeroDocumento).trim().toUpperCase();
      if (targetIsRuc) {
        updatesCliente.push('ruc = ?');
        paramsCliente.push(docLimpio);
        updatesPersona.push('dni = NULL');
        updatesPersona.push('tipo_documento_id = 2');
      } else {
        updatesPersona.push('dni = ?');
        paramsPersona.push(docLimpio);
        updatesPersona.push('tipo_documento_id = ?');
        paramsPersona.push(tipoDocumento === 'CE' ? 3 : 1);
        updatesCliente.push('ruc = NULL');
      }
    }

    if (razonSocial !== undefined) {
      const razonLimpia = razonSocial.trim().toUpperCase();
      updatesCliente.push('razon_social = ?');
      paramsCliente.push(razonLimpia);

      if (targetIsRuc) {
        updatesPersona.push('nombres = ?');
        paramsPersona.push(razonLimpia.slice(0, 100));
        updatesPersona.push('apellidos = NULL');
      } else {
        const partes = razonLimpia.split(/\s+/);
        const mitad = Math.ceil(partes.length / 2);
        updatesPersona.push('nombres = ?, apellidos = ?');
        paramsPersona.push(partes.slice(0, mitad).join(' '));
        paramsPersona.push(partes.slice(mitad).join(' '));
      }
    }

    if (nombreEmpresa !== undefined) {
      updatesCliente.push('nombre_empresa = ?');
      paramsCliente.push(targetIsRuc ? (nombreEmpresa?.trim() || null) : null);
    }

    if (direccionFiscal !== undefined) {
      updatesPersona.push('direccion = ?');
      paramsPersona.push(direccionFiscal.trim());
    }

    if (telefono !== undefined) {
      updatesPersona.push('telefono = ?');
      paramsPersona.push(telefono || null);
    }

    if (email !== undefined) {
      updatesPersona.push('correo = ?');
      paramsPersona.push(email || null);
    }

    if (estado !== undefined) {
      const stId = getEstadoId(estado);
      updatesPersona.push('estado_id = ?');
      paramsPersona.push(stId);
      updatesCliente.push('estado_id = ?');
      paramsCliente.push(stId);
    }

    if (updatesPersona.length === 0 && updatesCliente.length === 0) {
      res.status(400).json({ success: false, message: 'No se enviaron campos para actualizar.' });
      return;
    }

    const connection = await pool.getConnection();
    try {
      await connection.query('START TRANSACTION');

      if (updatesPersona.length > 0) {
        await connection.query(
          `UPDATE personas SET ${updatesPersona.join(', ')} WHERE id_persona = ?`,
          [...paramsPersona, personaId]
        );
      }

      if (updatesCliente.length > 0) {
        await connection.query(
          `UPDATE clientes SET ${updatesCliente.join(', ')} WHERE id_cliente = ?`,
          [...paramsCliente, clientId]
        );
      }

      await connection.query('COMMIT');

      // Response con cliente actualizado
      const [updatedClient] = await pool.query<RowDataPacket[]>(
        `SELECT c.id_cliente, c.id_persona, c.ruc, c.razon_social, c.nombre_empresa,
                c.estado_id, e.nombre AS estado_nombre, c.created_at AS cliente_created_at,
                p.dni, p.nombres, p.apellidos, p.telefono, p.correo, p.direccion,
                (SELECT COUNT(*) FROM equipos eq WHERE eq.cliente_id = c.id_cliente) AS total_equipos,
                (SELECT COUNT(*) FROM ordenes_servicio os WHERE os.cliente_id = c.id_cliente) AS total_servicios
         FROM clientes c
         JOIN personas p ON c.id_persona = p.id_persona
         JOIN estados e ON c.estado_id = e.id
         WHERE c.id_cliente = ?
         LIMIT 1`,
        [clientId]
      );

      res.json({
        success: true,
        message: 'Cliente actualizado con éxito.',
        data: parsePersonaRow(updatedClient[0]),
      });
    } catch (transError) {
      await connection.query('ROLLBACK');
      throw transError;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Error en updateClient:', error);
    res.status(500).json({ success: false, message: error.message || 'Error actualizando cliente.' });
  }
}

/**
 * PATCH /api/clientes/:id/estado
 * Toggle de estado ACTIVO ↔ INACTIVO
 */
export async function toggleClientStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const clientId = Number(req.params.id);

    const [existingRows] = await pool.query<RowDataPacket[]>(
      'SELECT c.id_cliente, c.id_persona, e.nombre AS estado_actual FROM clientes c JOIN estados e ON c.estado_id = e.id WHERE c.id_cliente = ? LIMIT 1',
      [clientId]
    );

    if (existingRows.length === 0) {
      res.status(404).json({ success: false, message: 'Cliente no encontrado.' });
      return;
    }

    const estadoActual = existingRows[0].estado_actual;
    const personaId = existingRows[0].id_persona;
    const nuevoEstado = estadoActual === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const nuevoEstadoId = getEstadoId(nuevoEstado);

    await pool.query(
      'UPDATE clientes SET estado_id = ? WHERE id_cliente = ?',
      [nuevoEstadoId, clientId]
    );

    await pool.query(
      'UPDATE personas SET estado_id = ? WHERE id_persona = ?',
      [nuevoEstadoId, personaId]
    );

    res.json({
      success: true,
      message: `Cliente ${nuevoEstado === 'ACTIVO' ? 'activado' : 'desactivado'} con éxito.`,
      data: { id: clientId, estado: nuevoEstado },
    });
  } catch (error) {
    console.error('Error en toggleClientStatus:', error);
    res.status(500).json({ success: false, message: 'Error cambiando estado del cliente.' });
  }
}

/**
 * GET /api/clientes/buscar/:documento
 * Buscar cliente por RUC o DNI
 */
export async function searchClientByDoc(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const documento = req.params.documento.trim().toUpperCase();

    if (!documento) {
      res.status(400).json({ success: false, message: 'Documento requerido.' });
      return;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.id_cliente, c.id_persona, c.ruc, c.razon_social, c.nombre_empresa,
              c.estado_id, e.nombre AS estado_nombre, c.created_at AS cliente_created_at,
              p.dni, p.nombres, p.apellidos, p.telefono, p.correo, p.direccion,
              (SELECT COUNT(*) FROM equipos eq WHERE eq.cliente_id = c.id_cliente) AS total_equipos,
              (SELECT COUNT(*) FROM ordenes_servicio os WHERE os.cliente_id = c.id_cliente) AS total_servicios
       FROM clientes c
       JOIN personas p ON c.id_persona = p.id_persona
       JOIN estados e ON c.estado_id = e.id
       WHERE c.ruc = ? OR p.dni = ?
       LIMIT 1`,
      [documento, documento]
    );

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Cliente no encontrado con ese documento.' });
      return;
    }

    const clienteResponse: ClienteResponse = parsePersonaRow(rows[0]);

    res.json({ success: true, data: clienteResponse });
  } catch (error) {
    console.error('Error en searchClientByDoc:', error);
    res.status(500).json({ success: false, message: 'Error buscando cliente.' });
  }
}
