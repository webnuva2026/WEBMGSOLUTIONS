import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import {
  getOrdenes,
  createOrden,
  updateEstadoOrden,
  sendTicketEmail,
  responderPresupuestoCliente,
  getTrackingPublico,
  savePresupuestoOrden,
} from '../controllers/workshop.controller';

const router = Router();

// Consulta pública de tracking para clientes (sin login)
router.get('/taller/tracking/:codigo', getTrackingPublico);

// Listado de órdenes de taller
router.get('/taller/ordenes', authenticateToken, getOrdenes);

// Registro de nueva orden de trabajo / ingreso RMA
router.post('/taller/ordenes', authenticateToken, createOrden);

// Actualización de estado y avance técnico
router.put('/taller/ordenes/:id/estado', authenticateToken, updateEstadoOrden);

// Guardar detalle de presupuesto (repuestos y mano de obra)
router.put('/taller/ordenes/:id/presupuesto', authenticateToken, savePresupuestoOrden);

// Envío del ticket de servicio por correo al cliente
router.post('/taller/ordenes/enviar-ticket-email', authenticateToken, sendTicketEmail);

// Respuesta pública del cliente (Aprobar / Rechazar presupuesto sin autenticación de trabajador)
router.post('/taller/ordenes/responder-presupuesto', responderPresupuestoCliente);

export default router;


