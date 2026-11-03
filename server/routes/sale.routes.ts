import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import { getVentas, getVentaById, createVenta, enviarComprobanteEmail } from '../controllers/sale.controller';

const router = Router();

// Listado de ventas
router.get('/ventas', authenticateToken, getVentas);

// Detalle de una venta específica
router.get('/ventas/:id', authenticateToken, getVentaById);

// Registrar nueva venta desde Punto de Venta (POS)
router.post('/ventas', authenticateToken, createVenta);

// Enviar comprobante de venta por correo electrónico al cliente
router.post('/ventas/:id/enviar-email', authenticateToken, enviarComprobanteEmail);
router.post('/ventas/enviar-email', authenticateToken, enviarComprobanteEmail);

export default router;

