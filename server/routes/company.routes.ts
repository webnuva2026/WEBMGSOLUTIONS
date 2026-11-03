import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middlewares/auth';
import {
  getEmpresa,
  updateEmpresa,
  getSucursales,
  createSucursal,
  updateSucursal,
  toggleSucursalEstado,
} from '../controllers/company.controller';

const router = Router();

// ─── EMPRESA ───
// Lectura de datos de empresa: cualquier usuario autenticado
router.get('/empresa', authenticateToken, getEmpresa);
// Modificación de datos de empresa: solo SUPERADMIN o ADMIN
router.put('/empresa', authenticateToken, requireRoles('SUPERADMIN', 'ADMIN'), updateEmpresa);

// ─── SUCURSALES ───
// Lectura de sucursales: cualquier usuario autenticado (para selectores de sucursal, etc.)
router.get('/sucursales', authenticateToken, getSucursales);
// Creación, edición y cambio de estado: solo SUPERADMIN o ADMIN
router.post('/sucursales', authenticateToken, requireRoles('SUPERADMIN', 'ADMIN'), createSucursal);
router.put('/sucursales/:id', authenticateToken, requireRoles('SUPERADMIN', 'ADMIN'), updateSucursal);
router.patch('/sucursales/:id/estado', authenticateToken, requireRoles('SUPERADMIN', 'ADMIN'), toggleSucursalEstado);

export default router;
