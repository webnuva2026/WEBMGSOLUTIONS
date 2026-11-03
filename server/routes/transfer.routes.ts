import { Router } from 'express';
import {
  getMovimientos,
  createMovimiento,
  updateEstadoMovimiento,
  getSeriesDisponiblesSede,
} from '../controllers/transfer.controller';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// Todas las rutas requieren sesión activa
router.use('/almacen', authenticateToken);

// Listar movimientos y préstamos
router.get('/almacen/movimientos', getMovimientos);

// Series físicas disponibles de un producto en una sucursal específica
router.get('/almacen/series-disponibles', getSeriesDisponiblesSede);

// Registrar nueva solicitud de traslado o préstamo
router.post('/almacen/movimientos', createMovimiento);

// Actualizar estado del movimiento (Aprobar, Enviar, Recibir, Devolver, Cancelar)
router.put('/almacen/movimientos/:id/estado', updateEstadoMovimiento);

export default router;
