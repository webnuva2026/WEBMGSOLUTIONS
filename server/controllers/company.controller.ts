import { Request, Response } from 'express';
import { pool } from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * GET /api/empresa
 * Obtiene los datos fiscales y generales de la empresa
 */
export async function getEmpresa(_req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, ruc, razon_social, nombre_comercial, direccion_fiscal, email, telefono,
              departamento, provincia, distrito, ubigeo, logo_url
       FROM empresas
       LIMIT 1`
    );

    if (rows.length === 0) {
      // Si no existe registro de empresa, retornar valores por defecto
      res.json({
        success: true,
        empresa: {
          ruc: '20609737524',
          razonSocial: 'MG SOLUTIONS GROUP S.A.C.',
          nombreComercial: 'MG SOLUTIONS GROUP',
          direccionFiscal: 'AV. PEDRO RUIZ NRO. 349 INT. 09C (MERCADO MODELO) - LAMBAYEQUE - CHICLAYO - CHICLAYO',
          email: 'mgsolutions.group@gmail.com',
          telefono: '+51 974 812 390',
          departamento: 'Lambayeque',
          provincia: 'Chiclayo',
          distrito: 'Chiclayo',
          ubigeo: '140101',
        },
      });
      return;
    }

    const row = rows[0];
    res.json({
      success: true,
      empresa: {
        id: row.id,
        ruc: row.ruc,
        razonSocial: row.razon_social,
        nombreComercial: row.nombre_comercial || '',
        direccionFiscal: row.direccion_fiscal,
        email: row.email || '',
        telefono: row.telefono || '',
        departamento: row.departamento || 'Lambayeque',
        provincia: row.provincia || 'Chiclayo',
        distrito: row.distrito || 'Chiclayo',
        ubigeo: row.ubigeo || '140101',
      },
    });
  } catch (error: any) {
    console.error('Error al obtener datos de la empresa:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al consultar datos de la empresa.',
    });
  }
}

/**
 * PUT /api/empresa
 * Actualiza los datos fiscales y comerciales de la empresa
 */
export async function updateEmpresa(req: Request, res: Response): Promise<void> {
  try {
    const {
      ruc,
      razonSocial,
      nombreComercial,
      direccionFiscal,
      email,
      telefono,
      departamento,
      provincia,
      distrito,
      ubigeo,
    } = req.body;

    if (!ruc || !razonSocial || !direccionFiscal) {
      res.status(400).json({
        success: false,
        message: 'RUC, Razón Social y Dirección Fiscal son campos obligatorios.',
      });
      return;
    }

    const cleanRuc = String(ruc).trim();
    if (cleanRuc.length !== 11) {
      res.status(400).json({
        success: false,
        message: 'El RUC debe tener exactamente 11 dígitos numéricos.',
      });
      return;
    }

    // Verificar si ya existe una fila en empresas
    const [existing] = await pool.query<RowDataPacket[]>('SELECT id FROM empresas LIMIT 1');

    if (existing.length === 0) {
      await pool.query<ResultSetHeader>(
        `INSERT INTO empresas (ruc, razon_social, nombre_comercial, direccion_fiscal, email, telefono, departamento, provincia, distrito, ubigeo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cleanRuc,
          String(razonSocial).trim(),
          nombreComercial ? String(nombreComercial).trim() : null,
          String(direccionFiscal).trim(),
          email ? String(email).trim() : null,
          telefono ? String(telefono).trim() : null,
          departamento ? String(departamento).trim() : 'Lambayeque',
          provincia ? String(provincia).trim() : 'Chiclayo',
          distrito ? String(distrito).trim() : 'Chiclayo',
          ubigeo ? String(ubigeo).trim() : '140101',
        ]
      );
    } else {
      const empresaId = existing[0].id;
      await pool.query<ResultSetHeader>(
        `UPDATE empresas
         SET ruc = ?,
             razon_social = ?,
             nombre_comercial = ?,
             direccion_fiscal = ?,
             email = ?,
             telefono = ?,
             departamento = ?,
             provincia = ?,
             distrito = ?,
             ubigeo = ?
         WHERE id = ?`,
        [
          cleanRuc,
          String(razonSocial).trim(),
          nombreComercial ? String(nombreComercial).trim() : null,
          String(direccionFiscal).trim(),
          email ? String(email).trim() : null,
          telefono ? String(telefono).trim() : null,
          departamento ? String(departamento).trim() : 'Lambayeque',
          provincia ? String(provincia).trim() : 'Chiclayo',
          distrito ? String(distrito).trim() : 'Chiclayo',
          ubigeo ? String(ubigeo).trim() : '140101',
          empresaId,
        ]
      );
    }

    res.json({
      success: true,
      message: 'Datos de la empresa actualizados correctamente.',
      empresa: {
        ruc: cleanRuc,
        razonSocial: String(razonSocial).trim(),
        nombreComercial: nombreComercial ? String(nombreComercial).trim() : '',
        direccionFiscal: String(direccionFiscal).trim(),
        email: email ? String(email).trim() : '',
        telefono: telefono ? String(telefono).trim() : '',
        departamento: departamento ? String(departamento).trim() : 'Lambayeque',
        provincia: provincia ? String(provincia).trim() : 'Chiclayo',
        distrito: distrito ? String(distrito).trim() : 'Chiclayo',
        ubigeo: ubigeo ? String(ubigeo).trim() : '140101',
      },
    });
  } catch (error: any) {
    console.error('Error al actualizar datos de la empresa:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar los datos de la empresa en la base de datos.',
    });
  }
}

/**
 * GET /api/sucursales
 * Lista todas las sucursales de la empresa
 */
export async function getSucursales(_req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT s.id, s.codigo, s.nombre, s.direccion, s.telefono, s.es_principal, s.estado_id,
              COALESCE(e.nombre, 'ACTIVO') AS estado
       FROM sucursales s
       LEFT JOIN estados e ON s.estado_id = e.id
       ORDER BY s.es_principal DESC, s.codigo ASC`
    );

    const sucursales = rows.map((r) => ({
      id: r.id,
      codigo: r.codigo,
      nombre: r.nombre,
      direccion: r.direccion,
      telefono: r.telefono || '',
      esPrincipal: Boolean(r.es_principal),
      estado:
        Number(r.estado_id) === 2 || String(r.estado).toUpperCase() === 'INACTIVO'
          ? 'INACTIVO'
          : 'ACTIVO',
    }));

    res.json({
      success: true,
      sucursales,
    });
  } catch (error: any) {
    console.error('Error al listar sucursales:', error);
    res.status(500).json({
      success: false,
      message: 'Error al consultar sucursales.',
    });
  }
}

/**
 * POST /api/sucursales
 * Registra una nueva sucursal
 */
export async function createSucursal(req: Request, res: Response): Promise<void> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { codigo, nombre, direccion, telefono, esPrincipal } = req.body;

    if (!nombre || !String(nombre).trim()) {
      res.status(400).json({
        success: false,
        message: 'El nombre de la sucursal es obligatorio.',
      });
      return;
    }

    const cleanNombre = String(nombre).trim();
    const cleanDireccion = direccion ? String(direccion).trim() : 'Dirección pendiente';
    const cleanTelefono = telefono ? String(telefono).trim() : null;

    // Obtener empresa_id
    const [empresaRows] = await connection.query<RowDataPacket[]>('SELECT id FROM empresas LIMIT 1');
    const empresaId = empresaRows.length > 0 ? empresaRows[0].id : 1;

    // Determinar código internamente de forma automática si no se proporciona
    let cleanCodigo = codigo ? String(codigo).trim() : '';
    if (!cleanCodigo) {
      const [allRows] = await connection.query<RowDataPacket[]>('SELECT codigo FROM sucursales');
      const usedCodes = new Set(allRows.map((r: any) => String(r.codigo)));
      let nextNum = 0;
      while (usedCodes.has(String(nextNum).padStart(4, '0'))) {
        nextNum++;
      }
      cleanCodigo = String(nextNum).padStart(4, '0');
    }

    // Verificar si es la primera sucursal para asignarla internamente como principal
    const [existingCountRows] = await connection.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM sucursales');
    const isFirst = (existingCountRows[0]?.total || 0) === 0;
    const esPrinc = isFirst || Boolean(esPrincipal);

    // Verificar si el código ya existe
    const [existingCode] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM sucursales WHERE codigo = ? LIMIT 1',
      [cleanCodigo]
    );

    if (existingCode.length > 0) {
      res.status(400).json({
        success: false,
        message: `El código de sucursal "${cleanCodigo}" ya se encuentra registrado.`,
      });
      return;
    }

    // Si es principal, desmarcar las demás como principal
    if (esPrinc) {
      await connection.query('UPDATE sucursales SET es_principal = 0');
    }

    // Insertar nueva sucursal con estado ACTIVO (id: 1)
    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO sucursales (empresa_id, codigo, nombre, direccion, telefono, es_principal, estado_id)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [empresaId, cleanCodigo, cleanNombre, cleanDireccion, cleanTelefono, esPrinc ? 1 : 0]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Sucursal registrada exitosamente.',
      sucursal: {
        id: result.insertId,
        codigo: cleanCodigo,
        nombre: cleanNombre,
        direccion: cleanDireccion,
        telefono: cleanTelefono || '',
        esPrincipal: esPrinc,
        estado: 'ACTIVO',
      },
    });
  } catch (error: any) {
    await connection.rollback();
    console.error('Error al crear sucursal:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar la sucursal.',
    });
  } finally {
    connection.release();
  }
}

/**
 * PUT /api/sucursales/:id
 * Actualiza los datos de una sucursal existente
 */
export async function updateSucursal(req: Request, res: Response): Promise<void> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const sucursalId = parseInt(req.params.id, 10);
    const { codigo, nombre, direccion, telefono, esPrincipal } = req.body;

    if (isNaN(sucursalId)) {
      res.status(400).json({ success: false, message: 'ID de sucursal inválido.' });
      return;
    }

    if (!nombre || !String(nombre).trim()) {
      res.status(400).json({ success: false, message: 'El nombre de la sucursal es obligatorio.' });
      return;
    }

    // Verificar existencia
    const [existing] = await connection.query<RowDataPacket[]>(
      'SELECT id, es_principal FROM sucursales WHERE id = ? LIMIT 1',
      [sucursalId]
    );

    if (existing.length === 0) {
      res.status(404).json({ success: false, message: 'Sucursal no encontrada.' });
      return;
    }

    const cleanNombre = String(nombre).trim();
    const cleanDireccion = direccion ? String(direccion).trim() : '';
    const cleanTelefono = telefono ? String(telefono).trim() : null;
    const esPrinc = Boolean(esPrincipal);

    // Verificar código duplicado en otra sucursal
    if (codigo) {
      const cleanCodigo = String(codigo).trim();
      const [duplicate] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM sucursales WHERE codigo = ? AND id != ? LIMIT 1',
        [cleanCodigo, sucursalId]
      );
      if (duplicate.length > 0) {
        res.status(400).json({
          success: false,
          message: `El código "${cleanCodigo}" ya está asignado a otra sucursal.`,
        });
        return;
      }
    }

    // Si se establece como principal, desmarcar las otras
    if (esPrinc) {
      await connection.query('UPDATE sucursales SET es_principal = 0 WHERE id != ?', [sucursalId]);
    }

    await connection.query(
      `UPDATE sucursales
       SET codigo = COALESCE(?, codigo),
           nombre = ?,
           direccion = ?,
           telefono = ?,
           es_principal = ?
       WHERE id = ?`,
      [codigo ? String(codigo).trim() : null, cleanNombre, cleanDireccion, cleanTelefono, esPrinc ? 1 : 0, sucursalId]
    );

    await connection.commit();

    // Obtener sucursal actualizada
    const [updatedRows] = await pool.query<RowDataPacket[]>(
      `SELECT s.id, s.codigo, s.nombre, s.direccion, s.telefono, s.es_principal, s.estado_id,
              COALESCE(e.nombre, 'ACTIVO') AS estado
       FROM sucursales s
       LEFT JOIN estados e ON s.estado_id = e.id
       WHERE s.id = ?`,
      [sucursalId]
    );

    const r = updatedRows[0];
    res.json({
      success: true,
      message: 'Sucursal actualizada exitosamente.',
      sucursal: {
        id: r.id,
        codigo: r.codigo,
        nombre: r.nombre,
        direccion: r.direccion,
        telefono: r.telefono || '',
        esPrincipal: Boolean(r.es_principal),
        estado:
          Number(r.estado_id) === 2 || String(r.estado).toUpperCase() === 'INACTIVO'
            ? 'INACTIVO'
            : 'ACTIVO',
      },
    });
  } catch (error: any) {
    await connection.rollback();
    console.error('Error al actualizar sucursal:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la sucursal.',
    });
  } finally {
    connection.release();
  }
}

/**
 * PATCH /api/sucursales/:id/estado
 * Alterna el estado de la sucursal (ACTIVO / INACTIVO)
 */
export async function toggleSucursalEstado(req: Request, res: Response): Promise<void> {
  try {
    const sucursalId = parseInt(req.params.id, 10);
    if (isNaN(sucursalId)) {
      res.status(400).json({ success: false, message: 'ID de sucursal inválido.' });
      return;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, nombre, es_principal, estado_id FROM sucursales WHERE id = ? LIMIT 1',
      [sucursalId]
    );

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Sucursal no encontrada.' });
      return;
    }

    const suc = rows[0];

    // Impedir desactivar la sucursal principal
    if (Boolean(suc.es_principal) && suc.estado_id === 1) {
      res.status(400).json({
        success: false,
        message: 'No se puede desactivar la Sucursal Principal (Casa Matriz). Asigne otra sucursal como principal primero.',
      });
      return;
    }

    const nuevoEstadoId = suc.estado_id === 1 ? 2 : 1;
    const nuevoEstadoNombre = nuevoEstadoId === 1 ? 'ACTIVO' : 'INACTIVO';

    await pool.query('UPDATE sucursales SET estado_id = ? WHERE id = ?', [nuevoEstadoId, sucursalId]);

    res.json({
      success: true,
      message: `Sucursal "${suc.nombre}" ahora está ${nuevoEstadoNombre}.`,
      nuevoEstado: nuevoEstadoNombre,
    });
  } catch (error: any) {
    console.error('Error al cambiar estado de sucursal:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado de la sucursal.',
    });
  }
}
