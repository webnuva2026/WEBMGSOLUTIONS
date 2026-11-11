import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middlewares/auth';
import { resetDatabase, restablecerSuperadminEmergencia } from '../controllers/maintenance.controller';

const router = Router();

// Endpoint de emergencia para restablecer acceso del superadministrador
router.post('/mantenimiento/restablecer-superadmin', restablecerSuperadminEmergencia);

// Endpoint de mantenimiento restringido únicamente a SUPERADMIN
router.post('/mantenimiento/reset-bd', authenticateToken, requireRoles('SUPERADMIN'), resetDatabase);

export default router;
