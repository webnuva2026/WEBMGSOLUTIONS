import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  resetUserPassword,
  unlockUser,
  getCompany,
  getBranches,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getPermisos,
} from '../controllers/user.controller';
import { authenticateToken, requireRoles } from '../middlewares/auth';

const router = Router();

// ─── USUARIOS (protegidas, solo ADMIN y SUPERADMIN pueden crear/editar/eliminar) ───
router.get('/usuarios', authenticateToken, getUsers);
router.get('/usuarios/:id', authenticateToken, getUserById);
router.post('/usuarios', authenticateToken, requireRoles('ADMIN', 'SUPERADMIN'), createUser);
router.put('/usuarios/:id', authenticateToken, requireRoles('ADMIN', 'SUPERADMIN'), updateUser);
router.patch('/usuarios/:id/estado', authenticateToken, requireRoles('ADMIN', 'SUPERADMIN'), toggleUserStatus);
router.patch('/usuarios/:id/reset-password', authenticateToken, requireRoles('ADMIN', 'SUPERADMIN'), resetUserPassword);
router.patch('/usuarios/:id/desbloquear', authenticateToken, requireRoles('ADMIN', 'SUPERADMIN'), unlockUser);

// ─── EMPRESA (protegidas, lectura para todos, escritura solo ADMIN y SUPERADMIN) ───
router.get('/empresa', authenticateToken, getCompany);

// ─── SUCURSALES (protegidas, lectura para todos) ───
router.get('/sucursales', authenticateToken, getBranches);

// ─── ROLES Y PERMISOS ───
router.get('/roles', authenticateToken, getRoles);
router.post('/roles', authenticateToken, requireRoles('ADMIN', 'SUPERADMIN'), createRole);
router.put('/roles/:id', authenticateToken, requireRoles('ADMIN', 'SUPERADMIN'), updateRole);
router.delete('/roles/:id', authenticateToken, requireRoles('ADMIN', 'SUPERADMIN'), deleteRole);
router.get('/permisos', authenticateToken, getPermisos);

export default router;
