import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
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
  getPresencia,
  setPresencia,
} from '../controllers/user.controller';
import { authenticateToken, requireRoles } from '../middlewares/auth';

const router = Router();

// ─── USUARIOS (protegidas, solo ADMIN y SUPERADMIN pueden crear/editar/eliminar) ───
router.get('/usuarios', authenticateToken, getUsers);
router.get('/usuarios/:id', authenticateToken, getUserById);
router.post('/usuarios', authenticateToken, requireRoles('ADMIN', 'SUPERADMIN'), createUser);
router.put('/usuarios/:id', authenticateToken, requireRoles('ADMIN', 'SUPERADMIN'), updateUser);
router.delete('/usuarios/:id', authenticateToken, requireRoles('ADMIN', 'SUPERADMIN'), deleteUser);
router.patch('/usuarios/:id/estado', authenticateToken, requireRoles('ADMIN', 'SUPERADMIN'), toggleUserStatus);
router.patch('/usuarios/:id/reset-password', authenticateToken, requireRoles('ADMIN', 'SUPERADMIN'), resetUserPassword);
router.patch('/usuarios/:id/desbloquear', authenticateToken, requireRoles('ADMIN', 'SUPERADMIN'), unlockUser);

// â”€â”€â”€ EMPRESA (protegidas, lectura para todos, escritura solo ADMIN y SUPERADMIN) â”€â”€â”€
router.get('/empresa', authenticateToken, getCompany);

// â”€â”€â”€ SUCURSALES (protegidas, lectura para todos) â”€â”€â”€
router.get('/sucursales', authenticateToken, getBranches);

// â”€â”€â”€ ROLES Y PERMISOS â”€â”€â”€
router.get('/roles', authenticateToken, getRoles);
router.post('/roles', authenticateToken, requireRoles('ADMIN', 'SUPERADMIN'), createRole);
router.put('/roles/:id', authenticateToken, requireRoles('ADMIN', 'SUPERADMIN'), updateRole);
router.delete('/roles/:id', authenticateToken, requireRoles('ADMIN', 'SUPERADMIN'), deleteRole);
router.get('/permisos', authenticateToken, getPermisos);
router.get('/presencia', authenticateToken, getPresencia);
router.put('/presencia', authenticateToken, setPresencia);

export default router;
