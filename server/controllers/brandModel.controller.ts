import { Request, Response } from 'express';
import { pool } from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * Interfaz para características técnicas de un modelo
 */
export interface CaracteristicaInput {
  atributo: string;
  valor: string;
}

// Semilla automática si la tabla de marcas está vacía
async function ensureSeedMarcasYModelos() {
  try {
    const [countRows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM marcas');
    if (countRows[0].total === 0) {
      console.log('🌱 Sembrando marcas y modelos iniciales en MySQL...');

      // 1. Insertar Marcas
      const marcasIniciales = [
        ['LENOVO', 'Equipos portátiles, desktops y servidores', 1],
        ['HP', 'Laptops, impresoras y workstations empresariales', 1],
        ['DELL', 'Portátiles Inspiron, Latitude y Alienware', 1],
        ['ASUS', 'Laptops para productividad y serie gamer ROG / TUF', 1],
        ['APPLE', 'MacBook, Mac Mini, iMac y dispositivos Apple', 1],
        ['EPSON', 'Impresoras EcoTank, matriciales y proyectores', 1],
        ['ACER', 'Laptops Aspire, Nitro y Predator', 1],
        ['SAMSUNG', 'Monitores, almacenamiento y tablets', 1],
      ];

      for (const m of marcasIniciales) {
        await pool.query('INSERT INTO marcas (nombre, descripcion, estado_id) VALUES (?, ?, ?)', m);
      }

      // Obtener el ID de LENOVO y HP
      const [lenovoRows] = await pool.query<RowDataPacket[]>('SELECT id FROM marcas WHERE nombre = "LENOVO"');
      const [hpRows] = await pool.query<RowDataPacket[]>('SELECT id FROM marcas WHERE nombre = "HP"');

      if (lenovoRows.length > 0) {
        const lenovoId = lenovoRows[0].id;

        // Modelos de Lenovo con características
        // Modelo 1: ThinkPad X1 Carbon Gen 14 Aura Edition
        const [m1] = await pool.query<ResultSetHeader>(
          'INSERT INTO modelos (marca_id, nombre, descripcion, estado_id) VALUES (?, ?, ?, 1)',
          [lenovoId, 'ThinkPad X1 Carbon Gen 14 Aura Edition (14" Intel)', 'Ultrabook corporativo de gama ultra premium con IA integrada']
        );
        const m1Id = m1.insertId;
        const caracsM1 = [
          ['Procesador', 'Intel Core Ultra 7 258V con NPU IA'],
          ['Memoria RAM', '32 GB LPDDR5x 8533MHz'],
          ['Almacenamiento', '1 TB SSD M.2 PCIe Gen4 NVMe'],
          ['Pantalla', '14" 2.8K (2880 x 1800) OLED, 120Hz, HDR500 True Black'],
          ['Tarjeta Gráfica', 'Intel Arc Graphics integrada'],
          ['Peso', '0.98 kg'],
        ];
        for (const [attr, val] of caracsM1) {
          await pool.query('INSERT INTO detalle_modelo (modelo_id, atributo, valor) VALUES (?, ?, ?)', [m1Id, attr, val]);
        }

        // Modelo 2: Lenovo Googlebook 15
        const [m2] = await pool.query<ResultSetHeader>(
          'INSERT INTO modelos (marca_id, nombre, descripcion, estado_id) VALUES (?, ?, ?, 1)',
          [lenovoId, 'Lenovo Googlebook 15', 'Portátil versátil para trabajo en la nube y productividad educativa']
        );
        const m2Id = m2.insertId;
        const caracsM2 = [
          ['Procesador', 'Intel Core i5-1335U 10 núcleos'],
          ['Memoria RAM', '16 GB DDR5 5200MHz'],
          ['Almacenamiento', '512 GB SSD NVMe M.2'],
          ['Pantalla', '15.6" FHD (1920 x 1080) Antirreflejo IPS'],
          ['Batería', 'Hasta 11 horas de autonomía'],
        ];
        for (const [attr, val] of caracsM2) {
          await pool.query('INSERT INTO detalle_modelo (modelo_id, atributo, valor) VALUES (?, ?, ?)', [m2Id, attr, val]);
        }

        // Modelo 3: ThinkPad T14 Gen 7 (14" Intel)
        const [m3] = await pool.query<ResultSetHeader>(
          'INSERT INTO modelos (marca_id, nombre, descripcion, estado_id) VALUES (?, ?, ?, 1)',
          [lenovoId, 'ThinkPad T14 Gen 7 (14" Intel)', 'Caballo de batalla corporativo con resistencia militar MIL-STD-810H']
        );
        const m3Id = m3.insertId;
        const caracsM3 = [
          ['Procesador', 'Intel Core Ultra 5 125U'],
          ['Memoria RAM', '16 GB DDR5 expandible a 64GB'],
          ['Almacenamiento', '512 GB SSD M.2 PCIe Gen4'],
          ['Pantalla', '14" WUXGA (1920 x 1200) IPS 400 nits Low Power'],
          ['Puertos', '2x Thunderbolt 4 / USB-C, 2x USB-A, HDMI 2.1, RJ-45 Ethernet'],
        ];
        for (const [attr, val] of caracsM3) {
          await pool.query('INSERT INTO detalle_modelo (modelo_id, atributo, valor) VALUES (?, ?, ?)', [m3Id, attr, val]);
        }
      }

      if (hpRows.length > 0) {
        const hpId = hpRows[0].id;
        const [mHp] = await pool.query<ResultSetHeader>(
          'INSERT INTO modelos (marca_id, nombre, descripcion, estado_id) VALUES (?, ?, ?, 1)',
          [hpId, 'HP Pavilion 15-eg0021la', 'Portátil balanceado para oficina y estudiantes avanzados']
        );
        const mHpId = mHp.insertId;
        const caracsHp = [
          ['Procesador', 'Intel Core i5-1235U'],
          ['Memoria RAM', '16 GB DDR4 3200MHz'],
          ['Almacenamiento', '512 GB SSD PCIe NVMe'],
          ['Pantalla', '15.6" Full HD Micro-Edge'],
          ['Audio', 'B&O con doble altavoz'],
        ];
        for (const [attr, val] of caracsHp) {
          await pool.query('INSERT INTO detalle_modelo (modelo_id, atributo, valor) VALUES (?, ?, ?)', [mHpId, attr, val]);
        }
      }

      console.log('✅ Semilla de Marcas, Modelos y Características completada con éxito.');
    }
  } catch (error) {
    console.error('Error al asegurar semilla de marcas y modelos:', error);
  }
}

// Ejecutar chequeo de semilla
ensureSeedMarcasYModelos();

// ─────────────────────────────────────────────────────────────
// CONTROLADORES DE MARCAS (NIVEL 1)
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/marcas
 * Lista todas las marcas con la cantidad de modelos vinculados
 */
export async function getMarcas(_req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT m.id, m.nombre, m.descripcion, m.categoria_id AS categoriaId,
              c.nombre AS categoriaNombre,
              e.nombre AS estado, m.estado_id AS estadoId,
              m.created_at AS createdAt,
              COUNT(mo.id) AS totalModelos
       FROM marcas m
       LEFT JOIN categorias c ON m.categoria_id = c.id
       INNER JOIN estados e ON m.estado_id = e.id
       LEFT JOIN modelos mo ON mo.marca_id = m.id
       GROUP BY m.id, m.nombre, m.descripcion, m.categoria_id, c.nombre, e.nombre, m.estado_id, m.created_at
       ORDER BY m.nombre ASC`
    );

    res.json({
      success: true,
      marcas: rows.map((r) => ({
        id: r.id,
        nombre: r.nombre,
        descripcion: r.descripcion || '',
        categoriaId: r.categoriaId ? Number(r.categoriaId) : null,
        categoriaNombre: r.categoriaNombre || null,
        estado: r.estado,
        estadoId: r.estadoId,
        totalModelos: Number(r.totalModelos) || 0,
        createdAt: r.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Error al listar marcas:', error);
    res.status(500).json({ success: false, message: 'Error interno al consultar marcas.' });
  }
}

/**
 * POST /api/marcas
 * Crea una nueva marca con categoría opcional/requerida
 */
export async function createMarca(req: Request, res: Response): Promise<void> {
  try {
    const { nombre, descripcion, categoriaId } = req.body;

    if (!nombre || !nombre.trim()) {
      res.status(400).json({ success: false, message: 'El nombre de la marca es obligatorio.' });
      return;
    }

    const cleanNombre = nombre.trim().toUpperCase();
    const cleanCatId = categoriaId ? Number(categoriaId) : null;

    // Validar duplicado dentro de la misma categoría o global
    const [existing] = await pool.query<RowDataPacket[]>(
      cleanCatId
        ? 'SELECT id FROM marcas WHERE UPPER(nombre) = ? AND categoria_id = ? LIMIT 1'
        : 'SELECT id FROM marcas WHERE UPPER(nombre) = ? LIMIT 1',
      cleanCatId ? [cleanNombre, cleanCatId] : [cleanNombre]
    );

    if (existing.length > 0) {
      res.status(409).json({ success: false, message: `La marca '${cleanNombre}' ya está registrada.` });
      return;
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO marcas (nombre, descripcion, categoria_id, estado_id) VALUES (?, ?, ?, 1)',
      [cleanNombre, descripcion?.trim() || null, cleanCatId]
    );

    // Obtener el nombre de la categoría si existe
    let catNombre: string | null = null;
    if (cleanCatId) {
      const [catRow] = await pool.query<RowDataPacket[]>('SELECT nombre FROM categorias WHERE id = ?', [cleanCatId]);
      if (catRow.length > 0) catNombre = catRow[0].nombre;
    }

    res.status(201).json({
      success: true,
      message: 'Marca registrada exitosamente.',
      marca: {
        id: result.insertId,
        nombre: cleanNombre,
        descripcion: descripcion?.trim() || '',
        categoriaId: cleanCatId,
        categoriaNombre: catNombre,
        estado: 'ACTIVO',
        estadoId: 1,
        totalModelos: 0,
      },
    });
  } catch (error: any) {
    console.error('Error al registrar marca:', error);
    res.status(500).json({ success: false, message: 'Error interno al guardar marca.' });
  }
}

/**
 * PUT /api/marcas/:id
 * Actualiza nombre, descripción o categoría de una marca
 */
export async function updateMarca(req: Request, res: Response): Promise<void> {
  try {
    const marcaId = Number(req.params.id);
    const { nombre, descripcion, categoriaId } = req.body;

    if (isNaN(marcaId)) {
      res.status(400).json({ success: false, message: 'ID de marca inválido.' });
      return;
    }

    if (!nombre || !nombre.trim()) {
      res.status(400).json({ success: false, message: 'El nombre de la marca es obligatorio.' });
      return;
    }

    const cleanNombre = nombre.trim().toUpperCase();
    const cleanCatId = categoriaId !== undefined ? (categoriaId ? Number(categoriaId) : null) : undefined;

    // Validar duplicado excluyendo a sí misma
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM marcas WHERE UPPER(nombre) = ? AND id != ? LIMIT 1',
      [cleanNombre, marcaId]
    );

    if (existing.length > 0) {
      res.status(409).json({ success: false, message: `La marca '${cleanNombre}' ya existe.` });
      return;
    }

    if (cleanCatId !== undefined) {
      await pool.query(
        'UPDATE marcas SET nombre = ?, descripcion = ?, categoria_id = ? WHERE id = ?',
        [cleanNombre, descripcion?.trim() || null, cleanCatId, marcaId]
      );
    } else {
      await pool.query(
        'UPDATE marcas SET nombre = ?, descripcion = ? WHERE id = ?',
        [cleanNombre, descripcion?.trim() || null, marcaId]
      );
    }

    res.json({
      success: true,
      message: 'Marca actualizada exitosamente.',
      marca: {
        id: marcaId,
        nombre: cleanNombre,
        descripcion: descripcion?.trim() || '',
        categoriaId: cleanCatId,
      },
    });
  } catch (error: any) {
    console.error('Error al actualizar marca:', error);
    res.status(500).json({ success: false, message: 'Error interno al actualizar marca.' });
  }
}

/**
 * PATCH /api/marcas/:id/toggle
 * Alterna el estado ACTIVO / INACTIVO de una marca
 */
export async function toggleMarcaEstado(req: Request, res: Response): Promise<void> {
  try {
    const marcaId = Number(req.params.id);
    if (isNaN(marcaId)) {
      res.status(400).json({ success: false, message: 'ID de marca inválido.' });
      return;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, estado_id FROM marcas WHERE id = ?',
      [marcaId]
    );

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Marca no encontrada.' });
      return;
    }

    const nuevoEstadoId = rows[0].estado_id === 1 ? 2 : 1;
    await pool.query('UPDATE marcas SET estado_id = ? WHERE id = ?', [nuevoEstadoId, marcaId]);

    res.json({
      success: true,
      message: `Marca ${nuevoEstadoId === 1 ? 'activada' : 'desactivada'} correctamente.`,
      nuevoEstado: nuevoEstadoId === 1 ? 'ACTIVO' : 'INACTIVO',
      nuevoEstadoId,
    });
  } catch (error: any) {
    console.error('Error al alternar estado de marca:', error);
    res.status(500).json({ success: false, message: 'Error interno al alternar estado.' });
  }
}

// ─────────────────────────────────────────────────────────────
// CONTROLADORES DE MODELOS Y CARACTERÍSTICAS (NIVELES 2 Y 3)
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/modelos
 * Lista todos los modelos, opcionalmente filtrados por ?marca_id=X
 * Incluye sus características técnicas asociadas (detalle_modelo)
 */
export async function getModelos(req: Request, res: Response): Promise<void> {
  try {
    const marcaIdParam = req.query.marca_id ? Number(req.query.marca_id) : null;
    const searchParam = req.query.search ? String(req.query.search).trim() : null;

    let query = `
      SELECT mo.id, mo.marca_id AS marcaId, m.nombre AS marcaNombre,
             mo.nombre, mo.descripcion, e.nombre AS estado, mo.estado_id AS estadoId,
             mo.created_at AS createdAt
      FROM modelos mo
      INNER JOIN marcas m ON mo.marca_id = m.id
      INNER JOIN estados e ON mo.estado_id = e.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (marcaIdParam && !isNaN(marcaIdParam)) {
      query += ' AND mo.marca_id = ?';
      params.push(marcaIdParam);
    }

    if (searchParam) {
      query += ' AND (mo.nombre LIKE ? OR m.nombre LIKE ?)';
      params.push(`%${searchParam}%`, `%${searchParam}%`);
    }

    query += ' ORDER BY m.nombre ASC, mo.nombre ASC';

    const [modelosRows] = await pool.query<RowDataPacket[]>(query, params);

    if (modelosRows.length === 0) {
      res.json({ success: true, modelos: [] });
      return;
    }

    // Obtener características para todos los modelos listados
    const modeloIds = modelosRows.map((m) => m.id);
    const [detallesRows] = await pool.query<RowDataPacket[]>(
      'SELECT id, modelo_id AS modeloId, atributo, valor FROM detalle_modelo WHERE modelo_id IN (?) ORDER BY id ASC',
      [modeloIds]
    );

    // Mapear características por modeloId
    const detallesPorModelo = new Map<number, { id: number; atributo: string; valor: string }[]>();
    for (const d of detallesRows) {
      if (!detallesPorModelo.has(d.modeloId)) {
        detallesPorModelo.set(d.modeloId, []);
      }
      detallesPorModelo.get(d.modeloId)!.push({
        id: d.id,
        atributo: d.atributo,
        valor: d.valor || '',
      });
    }

    const modelos = modelosRows.map((m) => ({
      id: m.id,
      marcaId: m.marcaId,
      marcaNombre: m.marcaNombre,
      nombre: m.nombre,
      descripcion: m.descripcion || '',
      estado: m.estado,
      estadoId: m.estadoId,
      createdAt: m.createdAt,
      caracteristicas: detallesPorModelo.get(m.id) || [],
    }));

    res.json({ success: true, modelos });
  } catch (error: any) {
    console.error('Error al obtener modelos:', error);
    res.status(500).json({ success: false, message: 'Error interno al consultar modelos.' });
  }
}

/**
 * POST /api/modelos
 * Crea un nuevo modelo vinculado a una marca y con sus características técnicas
 */
export async function createModelo(req: Request, res: Response): Promise<void> {
  const connection = await pool.getConnection();
  try {
    const { marcaId, nombre, descripcion, caracteristicas } = req.body;

    if (!marcaId || isNaN(Number(marcaId))) {
      res.status(400).json({ success: false, message: 'La marca es obligatoria.' });
      return;
    }

    if (!nombre || !nombre.trim()) {
      res.status(400).json({ success: false, message: 'El nombre del modelo es obligatorio.' });
      return;
    }

    const cleanNombre = nombre.trim();
    const cleanMarcaId = Number(marcaId);

    // Validar existencia de la marca
    const [marcaRows] = await connection.query<RowDataPacket[]>(
      'SELECT id, nombre FROM marcas WHERE id = ?',
      [cleanMarcaId]
    );

    if (marcaRows.length === 0) {
      res.status(404).json({ success: false, message: 'La marca seleccionada no existe.' });
      return;
    }

    const marcaNombre = marcaRows[0].nombre;

    // Iniciar transacción
    await connection.beginTransaction();

    const [modeloResult] = await connection.query<ResultSetHeader>(
      'INSERT INTO modelos (marca_id, nombre, descripcion, estado_id) VALUES (?, ?, ?, 1)',
      [cleanMarcaId, cleanNombre, descripcion?.trim() || null]
    );

    const modeloId = modeloResult.insertId;
    const insertedCaracteristicas: { id: number; atributo: string; valor: string }[] = [];

    // Insertar características técnicas si fueron provistas
    if (Array.isArray(caracteristicas) && caracteristicas.length > 0) {
      for (const c of caracteristicas) {
        if (c.atributo && c.atributo.trim()) {
          const attr = c.atributo.trim();
          const val = c.valor ? c.valor.trim() : '';
          const [cRes] = await connection.query<ResultSetHeader>(
            'INSERT INTO detalle_modelo (modelo_id, atributo, valor) VALUES (?, ?, ?)',
            [modeloId, attr, val]
          );
          insertedCaracteristicas.push({
            id: cRes.insertId,
            atributo: attr,
            valor: val,
          });
        }
      }
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Modelo y características técnicas registradas exitosamente.',
      modelo: {
        id: modeloId,
        marcaId: cleanMarcaId,
        marcaNombre,
        nombre: cleanNombre,
        descripcion: descripcion?.trim() || '',
        estado: 'ACTIVO',
        estadoId: 1,
        caracteristicas: insertedCaracteristicas,
      },
    });
  } catch (error: any) {
    await connection.rollback();
    console.error('Error al registrar modelo:', error);
    res.status(500).json({ success: false, message: 'Error interno al registrar modelo.' });
  } finally {
    connection.release();
  }
}

/**
 * PUT /api/modelos/:id
 * Actualiza un modelo y sincroniza sus características técnicas
 */
export async function updateModelo(req: Request, res: Response): Promise<void> {
  const connection = await pool.getConnection();
  try {
    const modeloId = Number(req.params.id);
    const { marcaId, nombre, descripcion, caracteristicas } = req.body;

    if (isNaN(modeloId)) {
      res.status(400).json({ success: false, message: 'ID de modelo inválido.' });
      return;
    }

    if (!marcaId || isNaN(Number(marcaId))) {
      res.status(400).json({ success: false, message: 'La marca es obligatoria.' });
      return;
    }

    if (!nombre || !nombre.trim()) {
      res.status(400).json({ success: false, message: 'El nombre del modelo es obligatorio.' });
      return;
    }

    const cleanNombre = nombre.trim();
    const cleanMarcaId = Number(marcaId);

    // Iniciar transacción
    await connection.beginTransaction();

    await connection.query(
      'UPDATE modelos SET marca_id = ?, nombre = ?, descripcion = ? WHERE id = ?',
      [cleanMarcaId, cleanNombre, descripcion?.trim() || null, modeloId]
    );

    // Obtener nombre de la marca
    const [marcaRows] = await connection.query<RowDataPacket[]>(
      'SELECT nombre FROM marcas WHERE id = ?',
      [cleanMarcaId]
    );
    const marcaNombre = marcaRows.length > 0 ? marcaRows[0].nombre : '';

    // Sincronizar características: eliminamos las previas y volvemos a insertar
    await connection.query('DELETE FROM detalle_modelo WHERE modelo_id = ?', [modeloId]);

    const insertedCaracteristicas: { id: number; atributo: string; valor: string }[] = [];
    if (Array.isArray(caracteristicas) && caracteristicas.length > 0) {
      for (const c of caracteristicas) {
        if (c.atributo && c.atributo.trim()) {
          const attr = c.atributo.trim();
          const val = c.valor ? c.valor.trim() : '';
          const [cRes] = await connection.query<ResultSetHeader>(
            'INSERT INTO detalle_modelo (modelo_id, atributo, valor) VALUES (?, ?, ?)',
            [modeloId, attr, val]
          );
          insertedCaracteristicas.push({
            id: cRes.insertId,
            atributo: attr,
            valor: val,
          });
        }
      }
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Modelo y especificaciones actualizadas exitosamente.',
      modelo: {
        id: modeloId,
        marcaId: cleanMarcaId,
        marcaNombre,
        nombre: cleanNombre,
        descripcion: descripcion?.trim() || '',
        caracteristicas: insertedCaracteristicas,
      },
    });
  } catch (error: any) {
    await connection.rollback();
    console.error('Error al actualizar modelo:', error);
    res.status(500).json({ success: false, message: 'Error interno al actualizar modelo.' });
  } finally {
    connection.release();
  }
}

/**
 * PATCH /api/modelos/:id/toggle
 * Alterna el estado ACTIVO / INACTIVO de un modelo
 */
export async function toggleModeloEstado(req: Request, res: Response): Promise<void> {
  try {
    const modeloId = Number(req.params.id);
    if (isNaN(modeloId)) {
      res.status(400).json({ success: false, message: 'ID de modelo inválido.' });
      return;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, estado_id FROM modelos WHERE id = ?',
      [modeloId]
    );

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Modelo no encontrado.' });
      return;
    }

    const nuevoEstadoId = rows[0].estado_id === 1 ? 2 : 1;
    await pool.query('UPDATE modelos SET estado_id = ? WHERE id = ?', [nuevoEstadoId, modeloId]);

    res.json({
      success: true,
      message: `Modelo ${nuevoEstadoId === 1 ? 'activado' : 'desactivado'} correctamente.`,
      nuevoEstado: nuevoEstadoId === 1 ? 'ACTIVO' : 'INACTIVO',
      nuevoEstadoId,
    });
  } catch (error: any) {
    console.error('Error al alternar estado de modelo:', error);
    res.status(500).json({ success: false, message: 'Error interno al alternar estado.' });
  }
}
