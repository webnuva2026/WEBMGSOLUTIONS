import { Router, Request, Response } from 'express';
import { authenticateToken, requireRoles, requirePermission } from '../middlewares/auth';
import {
  getEmpresa,
  updateEmpresa,
  getSucursales,
  createSucursal,
  updateSucursal,
  toggleSucursalEstado,
  setSucursalPrincipal,
} from '../controllers/company.controller';
import { dispatchEmail, setRuntimeMailBridgeUrl, getRuntimeMailBridgeUrl } from '../utils/mailer';

const router = Router();

// ─── CONFIGURACIÓN DE PUENTE DE CORREO HTTPS (PUERTO 443) ───
router.post('/empresa/mail-bridge', authenticateToken, requireRoles('SUPERADMIN', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const { bridgeUrl, testEmail } = req.body;
    if (bridgeUrl !== undefined) {
      setRuntimeMailBridgeUrl(String(bridgeUrl));
    }
    if (testEmail) {
      await dispatchEmail({
        to: String(testEmail).trim(),
        subject: '✅ Prueba de Correo MG Solutions ERP',
        text: 'El servicio de correo electrónico de MG Solutions ERP está operativo.',
        html: '<div style="font-family:sans-serif;padding:20px;border:1px solid #e2e8f0;border-radius:10px;"><h2 style="color:#00346F;">MG SOLUTIONS GROUP S.A.C.</h2><p>✅ El servicio de despacho de correo electrónico está operativo.</p></div>',
      });
    }
    res.json({
      success: true,
      bridgeUrl: getRuntimeMailBridgeUrl(),
      message: 'Configuración de correo actualizada y probada con éxito.',
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      bridgeUrl: getRuntimeMailBridgeUrl(),
      message: err?.message || 'Error al probar el envío de correo.',
    });
  }
});

// ─── EMPRESA ───
// Lectura de datos de empresa: cualquier usuario autenticado
router.get('/empresa', authenticateToken, getEmpresa);
// Modificación de datos de empresa: SUPERADMIN, ADMIN o permiso 'sucursales'
router.put('/empresa', authenticateToken, requirePermission('sucursales', 'SUPERADMIN', 'ADMIN'), updateEmpresa);

// ─── SUCURSALES ───
// Lectura de sucursales: cualquier usuario autenticado (para selectores de sucursal, etc.)
router.get('/sucursales', authenticateToken, getSucursales);
// Creación, edición y cambio de estado: SUPERADMIN, ADMIN o permiso 'sucursales'
router.post('/sucursales', authenticateToken, requirePermission('sucursales', 'SUPERADMIN', 'ADMIN'), createSucursal);
router.put('/sucursales/:id', authenticateToken, requirePermission('sucursales', 'SUPERADMIN', 'ADMIN'), updateSucursal);
router.patch('/sucursales/:id/principal', authenticateToken, requirePermission('sucursales', 'SUPERADMIN', 'ADMIN'), setSucursalPrincipal);
router.patch('/sucursales/:id/estado', authenticateToken, requirePermission('sucursales', 'SUPERADMIN', 'ADMIN'), toggleSucursalEstado);

export default router;
