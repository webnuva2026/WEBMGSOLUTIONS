import 'dotenv/config';
import dns from 'dns';
import express from 'express';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Ignorar si no aplica
}
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { testDbConnection } from './config/db';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import clientRoutes from './routes/client.routes';
import companyRoutes from './routes/company.routes';
import brandModelRoutes from './routes/brandModel.routes';
import categoryRoutes from './routes/category.routes';
import warrantyRoutes from './routes/warranty.routes';
import warehouseRoutes from './routes/warehouse.routes';
import saleRoutes from './routes/sale.routes';
import workshopRoutes from './routes/workshop.routes';
import transferRoutes from './routes/transfer.routes';
import purchaseRoutes from './routes/purchase.routes';
import consultaRoutes from './routes/consulta.routes';
import maintenanceRoutes from './routes/maintenance.routes';
import { seedSuperAdmin, normalizeRolesModules } from './utils/seed-superadmin';
import { seedPrintersCatalog } from './utils/seed-printers';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ─── MIDDLEWARES GLOBALES ───
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin: (origin, callback) => {
    // Permitir cualquier origen en producción / desarrollo o solicitudes directas
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── RUTAS DE API ───
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api/clientes', clientRoutes);
app.use('/api', companyRoutes);
app.use('/api', brandModelRoutes);
app.use('/api', categoryRoutes);
app.use('/api', warrantyRoutes);
app.use('/api', warehouseRoutes);
app.use('/api', transferRoutes);
app.use('/api', purchaseRoutes);
app.use('/api', saleRoutes);
app.use('/api', workshopRoutes);
app.use('/api', consultaRoutes);
app.use('/api', maintenanceRoutes);


const distPath = path.resolve(process.cwd(), 'dist');
const distIndexPath = path.join(distPath, 'index.html');
let currentFrontendBuildId: string | null = null;
if (fs.existsSync(distIndexPath)) {
  try {
    const html = fs.readFileSync(distIndexPath, 'utf8');
    const match = html.match(/\/assets\/(index-[A-Za-z0-9_-]+\.js)/);
    currentFrontendBuildId = match ? match[1] : String(fs.statSync(distIndexPath).mtimeMs);
  } catch {
    currentFrontendBuildId = null;
  }
}

// ─── HEALTH CHECK ───
app.get('/api/health', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    success: true,
    message: 'MG Solutions ERP - Backend activo',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    frontendBuild: currentFrontendBuildId,
  });
});

// ─── STATIC CLIENT (PRODUCCIÓN & RENDER) ───
if (fs.existsSync(distPath)) {
  console.log(`📦 Sirviendo frontend de producción desde: ${distPath}`);
  app.use(
    express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    })
  );
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(distIndexPath);
  });
} else {
  // ─── ROOT / LANDING HANDLER (MODO DESARROLLO) ───
  app.get('/', (_req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>MG Solutions ERP - API Backend</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #0B1C30; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: #132742; border: 1px solid #1e3a61; border-radius: 16px; padding: 36px; max-width: 460px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
    h1 { font-size: 22px; margin-bottom: 8px; color: #60a5fa; }
    p { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }
    .btn { display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; transition: 0.2s; font-size: 14px; }
    .btn:hover { background: #1d4ed8; }
    .badge { display: inline-flex; align-items: center; gap: 6px; margin-top: 24px; font-size: 12px; color: #34d399; font-weight: 600; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 10px #10b981; }
  </style>
</head>
<body>
  <div class="card">
    <h1>⚙️ MG Solutions - Backend API</h1>
    <p>El servidor API está funcionando correctamente en el puerto <strong>4000</strong>.<br>Para acceder al portal web e iniciar sesión, ingrese al puerto <strong>3000</strong>:</p>
    <a class="btn" href="http://localhost:3000">Ir al Sistema ERP (localhost:3000)</a>
    <br>
    <div class="badge"><span class="dot"></span> Express & MySQL 8.0 Conectados</div>
  </div>
</body>
</html>`);
  });
}

// ─── 404 HANDLER ───
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada.' });
});

// ─── ERROR HANDLER GLOBAL ───
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error no controlado:', err);
  res.status(500).json({ success: false, message: 'Error interno del servidor.' });
});

// ─── INICIAR SERVIDOR ───
async function startServer() {
  const dbOk = await testDbConnection();
  if (!dbOk) {
    console.error('⚠️  No se pudo conectar a MySQL. Verificar que XAMPP MySQL esté activo.');
    console.error('   Configuración: DB_HOST=%s DB_PORT=%s DB_NAME=%s',
      process.env.DB_HOST || 'localhost',
      process.env.DB_PORT || '3306',
      process.env.DB_NAME || 'mg_solutions_db'
    );
  } else {
    await seedSuperAdmin();
    await normalizeRolesModules();
    await seedPrintersCatalog();
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║   MG SOLUTIONS ERP - Backend Server             ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║   🚀 Servidor:  http://localhost:${PORT}            ║`);
    console.log(`║   🌐 CORS:      ${FRONTEND_URL}       ║`);
    console.log(`║   🗄️  MySQL:     ${dbOk ? '✅ Conectado' : '❌ Sin conexión'}               ║`);
    console.log(`║   🔒 Entorno:   ${process.env.NODE_ENV || 'development'}                ║`);
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');
    console.log('Rutas disponibles:');
    console.log('  POST   /api/auth/login');
    console.log('  GET    /api/auth/me');
    console.log('  POST   /api/auth/logout');
    console.log('  GET    /api/usuarios');
    console.log('  GET    /api/usuarios/:id');
    console.log('  POST   /api/usuarios');
    console.log('  PUT    /api/usuarios/:id');
    console.log('  PUT    /api/usuarios/:id/modulos');
    console.log('  PATCH  /api/usuarios/:id/estado');
    console.log('  PATCH  /api/usuarios/:id/reset-password');
    console.log('  PATCH  /api/usuarios/:id/desbloquear');
    console.log('  GET    /api/empresa');
    console.log('  GET    /api/sucursales');
    console.log('  GET    /api/roles');
    console.log('  GET    /api/clientes');
    console.log('  POST   /api/clientes');
    console.log('  PUT    /api/clientes/:id');
    console.log('  PATCH  /api/clientes/:id/estado');
    console.log('  GET    /api/clientes/buscar/:documento');
    console.log('  GET    /api/health');
    console.log('');
  });
}

startServer();
