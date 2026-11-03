import { Router } from 'express';
import {
  getAlmacenResumen,
  getInventarioJerarquico,
  getUnidadesProducto,
  registrarUnidadesProducto,
  updateEstadoUnidad,
  toggleVisibilidadVentaProducto,
  createProductoAlmacen,
} from '../controllers/warehouse.controller';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// Todas las rutas de almacén requieren sesión válida (JWT)
router.use('/almacen', authenticateToken);

// Resumen del almacén
router.get('/almacen/resumen', getAlmacenResumen);

// Inventario jerárquico (Categoría -> Marca -> Modelo + Especificaciones + Stock)
router.get('/almacen/inventario', getInventarioJerarquico);

// Crear nuevo producto en almacén
router.post('/almacen/productos', createProductoAlmacen);

// Alternar visibilidad de venta en POS (Disponible / Oculto para vendedores)
router.patch('/almacen/productos/:id/visibilidad-venta', toggleVisibilidadVentaProducto);

// Números de serie físicos por producto
router.get('/almacen/productos/:id/unidades', getUnidadesProducto);
router.post('/almacen/productos/:id/unidades', registrarUnidadesProducto);

// Actualizar condición / estado de una unidad física (ej. marcar Dañado / Cuarentena)
router.patch('/almacen/unidades/:id/estado', updateEstadoUnidad);

export default router;
