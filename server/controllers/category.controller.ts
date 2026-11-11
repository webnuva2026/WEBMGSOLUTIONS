import { Request, Response } from 'express';
import { pool } from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * GET /api/categorias
 * Lista todas las categorías con cantidad de productos registrados y sus ámbitos de uso
 */
export async function getCategorias(req: Request, res: Response): Promise<void> {
  try {
    const { ambito } = req.query;

    let query = `
      SELECT c.id, c.nombre, c.descripcion, e.nombre AS estado, c.estado_id AS estadoId,
             c.es_equipo_taller AS esEquipoTaller,
             c.es_venta AS esVenta,
             c.es_repuesto_taller AS esRepuestoTaller,
             c.created_at AS createdAt,
             COUNT(p.id) AS totalProductos
      FROM categorias c
      INNER JOIN estados e ON c.estado_id = e.id
      LEFT JOIN productos p ON p.categoria_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (ambito === 'taller' || ambito === 'equipo') {
      query += ' AND c.es_equipo_taller = 1';
    } else if (ambito === 'venta') {
      query += ' AND c.es_venta = 1';
    } else if (ambito === 'repuesto') {
      query += ' AND c.es_repuesto_taller = 1';
    }

    query += `
      GROUP BY c.id, c.nombre, c.descripcion, e.nombre, c.estado_id, 
               c.es_equipo_taller, c.es_venta, c.es_repuesto_taller, c.created_at
      ORDER BY c.nombre ASC
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    res.json({
      success: true,
      categorias: rows.map((r) => ({
        id: r.id,
        nombre: r.nombre,
        descripcion: r.descripcion || '',
        estado: r.estado,
        estadoId: r.estadoId,
        esEquipoTaller: Boolean(r.esEquipoTaller),
        esVenta: Boolean(r.esVenta),
        esRepuestoTaller: Boolean(r.esRepuestoTaller),
        totalProductos: Number(r.totalProductos) || 0,
        createdAt: r.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Error al listar categorías:', error);
    res.status(500).json({ success: false, message: 'Error interno al consultar categorías.' });
  }
}

/**
 * POST /api/categorias
 * Crea una nueva categoría con sus ámbitos de uso
 */
export async function createCategoria(req: Request, res: Response): Promise<void> {
  try {
    const {
      nombre,
      descripcion,
      esEquipoTaller = false,
      esVenta = true,
      esRepuestoTaller = false,
    } = req.body;

    if (!nombre || !nombre.trim()) {
      res.status(400).json({ success: false, message: 'El nombre de la categoría es obligatorio.' });
      return;
    }

    const cleanNombre = nombre.trim().toUpperCase();

    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM categorias WHERE UPPER(nombre) = ? LIMIT 1',
      [cleanNombre]
    );

    if (existing.length > 0) {
      res.status(409).json({ success: false, message: `La categoría '${cleanNombre}' ya existe.` });
      return;
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO categorias (nombre, descripcion, es_equipo_taller, es_venta, es_repuesto_taller, estado_id) 
       VALUES (?, ?, ?, ?, ?, 1)`,
      [
        cleanNombre,
        descripcion?.trim() || null,
        Boolean(esEquipoTaller) ? 1 : 0,
        Boolean(esVenta) ? 1 : 0,
        Boolean(esRepuestoTaller) ? 1 : 0,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Categoría registrada exitosamente.',
      categoria: {
        id: result.insertId,
        nombre: cleanNombre,
        descripcion: descripcion?.trim() || '',
        estado: 'ACTIVO',
        estadoId: 1,
        esEquipoTaller: Boolean(esEquipoTaller),
        esVenta: Boolean(esVenta),
        esRepuestoTaller: Boolean(esRepuestoTaller),
        totalProductos: 0,
      },
    });
  } catch (error: any) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({ success: false, message: 'Error interno al crear categoría.' });
  }
}

/**
 * PUT /api/categorias/:id
 * Actualiza una categoría y sus ámbitos de uso
 */
export async function updateCategoria(req: Request, res: Response): Promise<void> {
  try {
    const categoriaId = Number(req.params.id);
    const {
      nombre,
      descripcion,
      esEquipoTaller,
      esVenta,
      esRepuestoTaller,
    } = req.body;

    if (isNaN(categoriaId)) {
      res.status(400).json({ success: false, message: 'ID de categoría inválido.' });
      return;
    }

    if (!nombre || !nombre.trim()) {
      res.status(400).json({ success: false, message: 'El nombre de la categoría es obligatorio.' });
      return;
    }

    const cleanNombre = nombre.trim().toUpperCase();

    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM categorias WHERE UPPER(nombre) = ? AND id != ? LIMIT 1',
      [cleanNombre, categoriaId]
    );

    if (existing.length > 0) {
      res.status(409).json({ success: false, message: `La categoría '${cleanNombre}' ya está en uso.` });
      return;
    }

    await pool.query(
      `UPDATE categorias 
       SET nombre = ?, 
           descripcion = ?,
           es_equipo_taller = ?,
           es_venta = ?,
           es_repuesto_taller = ?
       WHERE id = ?`,
      [
        cleanNombre,
        descripcion?.trim() || null,
        Boolean(esEquipoTaller) ? 1 : 0,
        Boolean(esVenta) ? 1 : 0,
        Boolean(esRepuestoTaller) ? 1 : 0,
        categoriaId,
      ]
    );

    res.json({
      success: true,
      message: 'Categoría actualizada exitosamente.',
      categoria: {
        id: categoriaId,
        nombre: cleanNombre,
        descripcion: descripcion?.trim() || '',
        esEquipoTaller: Boolean(esEquipoTaller),
        esVenta: Boolean(esVenta),
        esRepuestoTaller: Boolean(esRepuestoTaller),
      },
    });
  } catch (error: any) {
    console.error('Error al actualizar categoría:', error);
    res.status(500).json({ success: false, message: 'Error interno al actualizar categoría.' });
  }
}

/**
 * PATCH /api/categorias/:id/estado
 * Alterna el estado ACTIVO / INACTIVO
 */
export async function toggleCategoriaEstado(req: Request, res: Response): Promise<void> {
  try {
    const categoriaId = Number(req.params.id);
    if (isNaN(categoriaId)) {
      res.status(400).json({ success: false, message: 'ID de categoría inválido.' });
      return;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, estado_id FROM categorias WHERE id = ?',
      [categoriaId]
    );

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Categoría no encontrada.' });
      return;
    }

    const nuevoEstadoId = rows[0].estado_id === 1 ? 2 : 1;
    await pool.query('UPDATE categorias SET estado_id = ? WHERE id = ?', [nuevoEstadoId, categoriaId]);

    res.json({
      success: true,
      message: `Categoría ${nuevoEstadoId === 1 ? 'activada' : 'desactivada'} correctamente.`,
      nuevoEstado: nuevoEstadoId === 1 ? 'ACTIVO' : 'INACTIVO',
      nuevoEstadoId,
    });
  } catch (error: any) {
    console.error('Error al alternar estado de categoría:', error);
    res.status(500).json({ success: false, message: 'Error interno al alternar estado.' });
  }
}
