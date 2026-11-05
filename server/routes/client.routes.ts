import { Router } from 'express';
import { authenticateToken, requireRoles, requirePermission } from '../middlewares/auth';
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  toggleClientStatus,
  searchClientByDoc,
} from '../controllers/client.controller';

const router = Router();

// ─── CLIENTES (protegidas con validación de permiso dinámico) ───
// Listar clientes: ADMIN, SUPERADMIN, y cualquier rol con permiso 'clientes' (o roles operativos autorizados)
router.get('/', authenticateToken, requirePermission('clientes', 'FACTURADOR', 'SECRETARIA', 'RECEPCION'), getClients);
router.get('/:id', authenticateToken, requirePermission('clientes', 'FACTURADOR', 'SECRETARIA', 'RECEPCION'), getClientById);

// Registrar cliente: ADMIN, SUPERADMIN, o cualquier rol con permiso 'clientes' (ej: Vendedor / FACTURADOR)
router.post('/', authenticateToken, requirePermission('clientes', 'FACTURADOR', 'SECRETARIA', 'RECEPCION'), createClient);

// Modificar cliente: ADMIN, SUPERADMIN, o cualquier rol con permiso 'clientes'
router.put('/:id', authenticateToken, requirePermission('clientes', 'FACTURADOR', 'SECRETARIA', 'RECEPCION'), updateClient);

// Activar/Desactivar cliente: ADMIN, SUPERADMIN o con permiso de gestión
router.patch('/:id/estado', authenticateToken, requirePermission('clientes', 'SECRETARIA', 'RECEPCION'), toggleClientStatus);

// Búsqueda rápida por documento: disponible para todos con permiso o roles comerciales
router.get('/buscar/:documento', authenticateToken, requirePermission('clientes', 'SECRETARIA', 'FACTURADOR', 'RECEPCION'), searchClientByDoc);

export default router;

