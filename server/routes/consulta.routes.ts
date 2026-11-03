import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import { consultarRuc, consultarDni } from '../controllers/consulta.controller';

const router = Router();

// Consulta de RUC ante SUNAT
router.get('/consultas/ruc/:ruc', authenticateToken, consultarRuc);

// Consulta de DNI ante RENIEC
router.get('/consultas/dni/:dni', authenticateToken, consultarDni);

export default router;
