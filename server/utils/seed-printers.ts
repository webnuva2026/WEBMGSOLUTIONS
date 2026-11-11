import { pool } from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface PrinterSeedSpec {
  marca: 'EPSON' | 'HP';
  marcaDescripcion: string;
  modelo: string;
  descripcion: string;
  caracteristicas: { atributo: string; valor: string }[];
}

const PRINTER_SEED_KEY = 'impresoras_catalog_v1';

const PRINTER_SPECS: PrinterSeedSpec[] = [
  {
    marca: 'EPSON',
    marcaDescripcion: 'Fabricante líder en impresoras multifuncionales y sistema EcoTank',
    modelo: 'EcoTank L3210',
    descripcion:
      'Impresora multifuncional de sistema de tinta continua EcoTank con conexión USB 2.0, impresión sin bordes y alto rendimiento de hasta 7,500 páginas en negro y 4,500 páginas a color.',
    caracteristicas: [
      { atributo: 'Tipo', valor: 'Multifuncional de tinta continua (EcoTank)' },
      { atributo: 'Funciones', valor: 'Impresión, copia y escaneo' },
      { atributo: 'Conectividad', valor: 'USB 2.0' },
      { atributo: 'Rendimiento Negro', valor: '7,500 páginas' },
      { atributo: 'Rendimiento Color', valor: '4,500 páginas' },
      { atributo: 'Impresión sin Bordes', valor: 'Sí' },
    ],
  },
  {
    marca: 'EPSON',
    marcaDescripcion: 'Fabricante líder en impresoras multifuncionales y sistema EcoTank',
    modelo: 'EcoTank L3250',
    descripcion:
      'Impresora multifuncional inalámbrica EcoTank para impresión, copia y escaneo con conectividad Wi-Fi y USB 2.0, con rendimiento de hasta 7,500 páginas en negro y 4,500 páginas a color.',
    caracteristicas: [
      { atributo: 'Tipo', valor: 'Multifuncional de tinta continua (EcoTank)' },
      { atributo: 'Funciones', valor: 'Impresión, copia y escaneo' },
      { atributo: 'Conectividad', valor: 'Wi-Fi, USB 2.0' },
      { atributo: 'Rendimiento Negro', valor: '7,500 páginas' },
      { atributo: 'Rendimiento Color', valor: '4,500 páginas' },
    ],
  },
  {
    marca: 'EPSON',
    marcaDescripcion: 'Fabricante líder en impresoras multifuncionales y sistema EcoTank',
    modelo: 'L4360',
    descripcion:
      'Impresora multifuncional con Wi-Fi Dual Band e impresión dúplex automática, funciones de impresión, copia y escaneo, compatibilidad con Epson Smart Panel y rendimiento de 6,600 páginas en negro y 5,500 a color.',
    caracteristicas: [
      { atributo: 'Tipo', valor: 'Multifuncional de tinta continua' },
      { atributo: 'Funciones', valor: 'Impresión, copia y escaneo' },
      { atributo: 'Conectividad', valor: 'Wi-Fi Dual Band' },
      { atributo: 'Impresión Dúplex', valor: 'Automática (doble cara)' },
      { atributo: 'App / Software', valor: 'Epson Smart Panel' },
      { atributo: 'Rendimiento Negro', valor: '6,600 páginas' },
      { atributo: 'Rendimiento Color', valor: '5,500 páginas' },
    ],
  },
  {
    marca: 'EPSON',
    marcaDescripcion: 'Fabricante líder en impresoras multifuncionales y sistema EcoTank',
    modelo: 'EcoTank L5590',
    descripcion:
      'Impresora multifuncional empresarial con sistema EcoTank de alto rendimiento, conectividad Wi-Fi empresarial y Ethernet, alimentador automático (ADF) de 30 hojas y soporte Epson Smart Panel.',
    caracteristicas: [
      { atributo: 'Tipo', valor: 'Multifuncional empresarial EcoTank de alto rendimiento' },
      { atributo: 'Funciones', valor: 'Impresión, copia y escaneo' },
      { atributo: 'Conectividad', valor: 'Wi-Fi empresarial, Ethernet' },
      { atributo: 'Alimentador ADF', valor: '30 hojas' },
      { atributo: 'App / Software', valor: 'Epson Smart Panel' },
    ],
  },
  {
    marca: 'EPSON',
    marcaDescripcion: 'Fabricante líder en impresoras multifuncionales y sistema EcoTank',
    modelo: 'EcoTank L6370',
    descripcion:
      'Impresora multifuncional avanzada EcoTank con Wi-Fi Direct, Ethernet, impresión dúplex automática, ADF de 30 hojas, Epson Smart Panel y rendimiento de 8,500 páginas en negro y 6,500 páginas a color.',
    caracteristicas: [
      { atributo: 'Tipo', valor: 'Multifuncional corporativa EcoTank' },
      { atributo: 'Funciones', valor: 'Impresión, copia y escaneo' },
      { atributo: 'Conectividad', valor: 'Wi-Fi Direct, Ethernet' },
      { atributo: 'Impresión Dúplex', valor: 'Automática (doble cara)' },
      { atributo: 'Alimentador ADF', valor: '30 hojas' },
      { atributo: 'App / Software', valor: 'Epson Smart Panel' },
      { atributo: 'Rendimiento Negro', valor: '8,500 páginas' },
      { atributo: 'Rendimiento Color', valor: '6,500 páginas' },
    ],
  },
  {
    marca: 'HP',
    marcaDescripcion: 'Fabricante de impresoras Smart Tank, equipos de impresión y cómputo',
    modelo: 'Smart Tank 585',
    descripcion:
      'Impresora multifuncional de sistema de tinta continua HP Smart Tank con Wi-Fi y Bluetooth, impresión móvil mediante HP Smart App, impresión, copia y escaneo, y rendimiento de 6,000 páginas en negro y 6,000 a color.',
    caracteristicas: [
      { atributo: 'Tipo', valor: 'Multifuncional de tinta continua (Smart Tank)' },
      { atributo: 'Funciones', valor: 'Impresión, copia y escaneo' },
      { atributo: 'Conectividad', valor: 'Wi-Fi, Bluetooth' },
      { atributo: 'Impresión Móvil', valor: 'Compatible' },
      { atributo: 'App / Software', valor: 'HP Smart App' },
      { atributo: 'Rendimiento Negro', valor: '6,000 páginas' },
      { atributo: 'Rendimiento Color', valor: '6,000 páginas' },
    ],
  },
];

/**
 * Permite que una misma marca (ej. HP) exista en distintas categorías (Laptops e Impresoras)
 * migrando el índice único global uq_marcas_nombre hacia (nombre, categoria_id).
 */
async function ensureBrandUniquePerCategory(): Promise<void> {
  const [idxRows] = await pool.query<RowDataPacket[]>(
    `SHOW INDEX FROM marcas WHERE Key_name = 'uq_marcas_nombre'`
  );
  if (idxRows.length > 0) {
    await pool.query('ALTER TABLE marcas DROP INDEX `uq_marcas_nombre`');
    const [compositeIdx] = await pool.query<RowDataPacket[]>(
      `SHOW INDEX FROM marcas WHERE Key_name = 'uq_marcas_nombre_categoria'`
    );
    if (compositeIdx.length === 0) {
      await pool.query(
        'ALTER TABLE marcas ADD UNIQUE KEY `uq_marcas_nombre_categoria` (`nombre`, `categoria_id`)'
      );
    }
  }
}

/**
 * Siembra una sola vez la categoría IMPRESORAS, las marcas EPSON y HP y los 6 modelos detallados
 * en el Catálogo Maestro (sin precios). Respeta futuros vaciados manuales de catálogo.
 */
export async function seedPrintersCatalog(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _catalog_seeds (
        seed_key VARCHAR(100) PRIMARY KEY,
        executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [alreadySeeded] = await pool.query<RowDataPacket[]>(
      'SELECT seed_key FROM _catalog_seeds WHERE seed_key = ? LIMIT 1',
      [PRINTER_SEED_KEY]
    );
    if (alreadySeeded.length > 0) {
      return;
    }

    await ensureBrandUniquePerCategory();

    // 1. Obtener o crear categoría IMPRESORAS
    let categoriaId: number;
    const [catRows] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM categorias WHERE UPPER(nombre) = ? LIMIT 1',
      ['IMPRESORAS']
    );

    if (catRows.length > 0) {
      categoriaId = Number(catRows[0].id);
    } else {
      const [catInsert] = await pool.query<ResultSetHeader>(
        `INSERT INTO categorias (nombre, descripcion, es_equipo_taller, es_venta, es_repuesto_taller, estado_id)
         VALUES (?, ?, 1, 1, 0, 1)`,
        [
          'IMPRESORAS',
          'Impresoras multifuncionales y de sistema de tinta continua para hogar y oficina',
        ]
      );
      categoriaId = catInsert.insertId;
    }

    // 2. Obtener o crear marcas EPSON y HP asociadas a IMPRESORAS
    const brandIds = new Map<string, number>();
    for (const spec of PRINTER_SPECS) {
      if (brandIds.has(spec.marca)) continue;

      const [marcaRows] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM marcas WHERE UPPER(nombre) = ? AND categoria_id = ? LIMIT 1',
        [spec.marca, categoriaId]
      );

      if (marcaRows.length > 0) {
        brandIds.set(spec.marca, Number(marcaRows[0].id));
      } else {
        const [marcaInsert] = await pool.query<ResultSetHeader>(
          'INSERT INTO marcas (nombre, descripcion, categoria_id, estado_id) VALUES (?, ?, ?, 1)',
          [spec.marca, spec.marcaDescripcion, categoriaId]
        );
        brandIds.set(spec.marca, marcaInsert.insertId);
      }
    }

    // 3. Registrar cada impresora con su descripción y ficha técnica detallada (sin precio)
    for (const spec of PRINTER_SPECS) {
      const marcaId = brandIds.get(spec.marca)!;
      const [modRows] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM modelos WHERE marca_id = ? AND UPPER(nombre) = ? LIMIT 1',
        [marcaId, spec.modelo.toUpperCase()]
      );

      let modeloId: number;
      if (modRows.length > 0) {
        modeloId = Number(modRows[0].id);
        await pool.query(
          'UPDATE modelos SET descripcion = ?, estado_id = 1 WHERE id = ?',
          [spec.descripcion, modeloId]
        );
        await pool.query('DELETE FROM detalle_modelo WHERE modelo_id = ?', [modeloId]);
      } else {
        const [modInsert] = await pool.query<ResultSetHeader>(
          'INSERT INTO modelos (marca_id, nombre, descripcion, estado_id) VALUES (?, ?, ?, 1)',
          [marcaId, spec.modelo, spec.descripcion]
        );
        modeloId = modInsert.insertId;
      }

      for (const det of spec.caracteristicas) {
        await pool.query(
          'INSERT INTO detalle_modelo (modelo_id, atributo, valor) VALUES (?, ?, ?)',
          [modeloId, det.atributo, det.valor]
        );
      }
    }

    await pool.query('INSERT IGNORE INTO _catalog_seeds (seed_key) VALUES (?)', [
      PRINTER_SEED_KEY,
    ]);
    console.log('✅ Catálogo Maestro de Impresoras (Epson y HP) registrado con detalle técnico.');
  } catch (error) {
    console.error('⚠️ Error sembrando catálogo de impresoras:', error);
  }
}

