import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import { verificarGarantia, registrarIngresoGarantia } from '../controllers/warranty.controller';

const router = Router();

// Consultar vigencia de garantía por número de serie (S/N)
router.get('/garantias/verificar', authenticateToken, verificarGarantia);

// Registrar ingreso oficial por garantía
router.post('/garantias/ingreso', authenticateToken, registrarIngresoGarantia);

export default router;
