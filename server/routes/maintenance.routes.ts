import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middlewares/auth';
import { resetDatabase, restablecerSuperadminEmergencia, vaciarCatalogos } from '../controllers/maintenance.controller';

const router = Router();

// Endpoint de emergencia para restablecer acceso del superadministrador
router.post('/mantenimiento/restablecer-superadmin', restablecerSuperadminEmergencia);

// Endpoint para vaciar categorías, marcas, modelos y productos
router.post('/mantenimiento/vaciar-catalogos', vaciarCatalogos);

// Endpoint de mantenimiento restringido únicamente a SUPERADMIN
router.post('/mantenimiento/reset-bd', authenticateToken, requireRoles('SUPERADMIN'), resetDatabase);

export default router;
