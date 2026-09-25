import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middlewares/auth';
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  toggleClientStatus,
  searchClientByDoc,
} from '../controllers/client.controller';

const router = Router();

// ─── CLIENTES (protegidas) ───
// CRUD completo: ADMIN y SUPERADMIN
router.get('/', authenticateToken, requireRoles('ADMIN', 'SUPERADMIN'), getClients);
router.get('/:id', authenticateToken, requireRoles('ADMIN', 'SUPERADMIN'), getClientById);
router.post('/', authenticateToken, requireRoles('ADMIN', 'SUPERADMIN'), createClient);
router.put('/:id', authenticateToken, requireRoles('ADMIN', 'SUPERADMIN'), updateClient);
router.patch('/:id/estado', authenticateToken, requireRoles('ADMIN', 'SUPERADMIN'), toggleClientStatus);

// Búsqueda: ADMIN + SUPERADMIN + SECRETARIA + FACTURADOR
router.get('/buscar/:documento', authenticateToken, requireRoles('ADMIN', 'SUPERADMIN', 'SECRETARIA', 'FACTURADOR'), searchClientByDoc);

export default router;
