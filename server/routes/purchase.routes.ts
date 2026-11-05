import { Router } from 'express';
import {
  getProveedores,
  createProveedor,
  updateProveedor,
  toggleProveedorEstado,
  getCompras,
  createCompra,
  recepcionarCompra,
  enviarOrdenCompraEmail,
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
router.put('/proveedores/:id', updateProveedor);
router.patch('/proveedores/:id/estado', toggleProveedorEstado);

// Compras, Órdenes de Pedido & Recepción en Almacén
router.get('/compras', getCompras);
router.post('/compras', createCompra);
router.post('/compras/:id/recepcionar', recepcionarCompra);
router.post('/compras/:id/enviar-email', enviarOrdenCompraEmail);
router.put('/compras/:id/anular', anularCompra);

export default router;
