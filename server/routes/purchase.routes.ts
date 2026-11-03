import { Router } from 'express';
import {
  getProveedores,
  createProveedor,
  toggleProveedorEstado,
  getCompras,
  createCompra,
  anularCompra,
} from '../controllers/purchase.controller';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// Proteger rutas especificas
router.use('/proveedores', authenticateToken);
router.use('/compras', authenticateToken);

// Proveedores
router.get('/proveedores', getProveedores);
router.post('/proveedores', createProveedor);
router.patch('/proveedores/:id/estado', toggleProveedorEstado);

// Compras & Reabastecimiento
router.get('/compras', getCompras);
router.post('/compras', createCompra);
router.put('/compras/:id/anular', anularCompra);

export default router;
