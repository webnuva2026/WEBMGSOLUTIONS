import { Router } from 'express';
import { authenticateToken, requirePermission } from '../middlewares/auth';
import {
  getMarcas,
  createMarca,
  updateMarca,
  toggleMarcaEstado,
  getModelos,
  createModelo,
  updateModelo,
  toggleModeloEstado,
} from '../controllers/brandModel.controller';

const router = Router();

// ─── MARCAS (NIVEL 1) ───
// Lectura pública/autenticada para catálogo, inventario, pos y taller
router.get('/marcas', authenticateToken, getMarcas);
router.post('/marcas', authenticateToken, requirePermission('marcas', 'ALMACEN'), createMarca);
router.put('/marcas/:id', authenticateToken, requirePermission('marcas', 'ALMACEN'), updateMarca);
router.patch('/marcas/:id/estado', authenticateToken, requirePermission('marcas', 'ALMACEN'), toggleMarcaEstado);

// ─── MODELOS Y CARACTERÍSTICAS (NIVELES 2 Y 3) ───
router.get('/modelos', authenticateToken, getModelos);
router.post('/modelos', authenticateToken, requirePermission('marcas', 'ALMACEN', 'TECNICO'), createModelo);
router.put('/modelos/:id', authenticateToken, requirePermission('marcas', 'ALMACEN', 'TECNICO'), updateModelo);
router.patch('/modelos/:id/estado', authenticateToken, requirePermission('marcas', 'ALMACEN', 'TECNICO'), toggleModeloEstado);

export default router;

