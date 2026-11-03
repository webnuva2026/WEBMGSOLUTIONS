import { Router } from 'express';
import { authenticateToken, requirePermission } from '../middlewares/auth';
import {
  getCategorias,
  createCategoria,
  updateCategoria,
  toggleCategoriaEstado,
} from '../controllers/category.controller';

const router = Router();

// Lectura: Cualquier usuario autenticado
router.get('/categorias', authenticateToken, getCategorias);

// Modificación: SUPERADMIN, ADMIN, o cualquier rol que tenga asignado el módulo 'categorias' (ej: ALMACEN, Vendedor con permiso)
router.post('/categorias', authenticateToken, requirePermission('categorias', 'ALMACEN'), createCategoria);
router.put('/categorias/:id', authenticateToken, requirePermission('categorias', 'ALMACEN'), updateCategoria);
router.patch('/categorias/:id/estado', authenticateToken, requirePermission('categorias', 'ALMACEN'), toggleCategoriaEstado);

export default router;

