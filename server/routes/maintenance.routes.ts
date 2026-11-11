import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middlewares/auth';
import { resetDatabase } from '../controllers/maintenance.controller';

const router = Router();

// Endpoint de mantenimiento restringido únicamente a SUPERADMIN
router.post('/mantenimiento/reset-bd', authenticateToken, requireRoles('SUPERADMIN'), resetDatabase);

export default router;
