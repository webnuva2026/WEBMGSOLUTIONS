import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Asegurar carga inmediata de variables de entorno
dotenv.config();

// Configuración del transporte Nodemailer (Google / Gmail SMTP u otro)
export function getMailTransporter() {
  // Si no están en process.env (por ejemplo si el servidor no fue reiniciado tras editar el .env), recargar con override
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    dotenv.config({ override: true });
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : '';
  // Eliminar espacios que Google suele colocar en las contraseñas de app (ej: "abcd efgh ijkl mnop")
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '';

  if (!user || !pass) {
    console.warn('⚠️ SMTP_USER o SMTP_PASS no encontrados en process.env');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Verifica si las credenciales SMTP son válidas contra los servidores de Google
 */
export async function verifySMTPConnection(): Promise<{ ok: boolean; message: string }> {
  const transporter = getMailTransporter();
  if (!transporter) {
    return { ok: false, message: 'SMTP no configurado: faltan SMTP_USER o SMTP_PASS en el archivo .env' };
  }
  try {
    await transporter.verify();
    return { ok: true, message: 'Conexión SMTP con Google establecida exitosamente.' };
  } catch (error: any) {
    return { ok: false, message: `Error de autenticación SMTP: ${error.message}` };
  }
}

/**
 * Envía el correo electrónico con el código OTP de 6 dígitos para recuperación de contraseña
 */
export async function sendRecoveryCodeEmail(
  toEmail: string,
  nombreUsuario: string,
  codigoOtp: string
): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  const transporter = getMailTransporter();

  // Si no hay credenciales SMTP configuradas, simular en consola de desarrollo
  if (!transporter) {
    console.log('\n========================================================');
    console.log('📧 [SIMULADOR DE EMAIL - GOOGLE SMTP NO CONFIGURADO]');
    console.log(`Para: ${toEmail} (${nombreUsuario})`);
    console.log(`🔑 CÓDIGO DE RECUPERACIÓN OTP: [ ${codigoOtp} ]`);
    console.log('⏰ Válido por 15 minutos');
    console.log('💡 TIP: Para envío real por Gmail, configure SMTP_USER y SMTP_PASS en el archivo .env');
    console.log('========================================================\n');
    return { success: true, simulated: true };
  }

  const fromEmail = process.env.EMAIL_FROM || `"MG Solutions Security" <${process.env.SMTP_USER}>`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Código de Recuperación - MG Solutions</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F1F5F9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1E293B;
    }
    .container {
      max-width: 540px;
      margin: 30px auto;
      background: #FFFFFF;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      border: 1px solid #E2E8F0;
    }
    .header {
      background: linear-gradient(135deg, #002654 0%, #004A99 100%);
      padding: 30px 24px;
      text-align: center;
      color: #FFFFFF;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .header p {
      margin: 6px 0 0 0;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      opacity: 0.85;
    }
    .content {
      padding: 32px 28px;
    }
    .greeting {
      font-size: 16px;
      font-weight: 600;
      color: #0F172A;
      margin-bottom: 12px;
    }
    .text {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 24px;
    }
    .otp-box {
      background: #F8FAFC;
      border: 2px dashed #004A99;
      border-radius: 10px;
      padding: 20px;
      text-align: center;
      margin-bottom: 24px;
    }
    .otp-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #64748B;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .otp-code {
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #00346F;
      font-family: 'Courier New', monospace;
    }
    .warning {
      background: #FEF2F2;
      border-left: 4px solid #EF4444;
      padding: 12px 16px;
      border-radius: 4px;
      font-size: 12px;
      color: #991B1B;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .footer {
      background: #F8FAFC;
      padding: 18px 24px;
      text-align: center;
      font-size: 11px;
      color: #94A3B8;
      border-top: 1px solid #E2E8F0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MG SOLUTIONS GROUP</h1>
      <p>Centro de Seguridad y Recuperación</p>
    </div>
    <div class="content">
      <div class="greeting">Hola, ${nombreUsuario}</div>
      <div class="text">
        Hemos recibido una solicitud para restablecer la contraseña de su cuenta en el sistema <strong>MG Solutions ERP</strong>.
        Use el siguiente código de verificación de 6 dígitos para continuar con el proceso:
      </div>
      
      <div class="otp-box">
        <div class="otp-label">Su Código de Verificación OTP</div>
        <div class="otp-code">${codigoOtp}</div>
      </div>

      <div class="warning">
        ⏳ <strong>Importante:</strong> Este código vencerá en <strong>15 minutos</strong>. Si usted no solicitó este cambio, ignore este mensaje y contacte al Administrador.
      </div>

      <div class="text" style="font-size: 12px; color: #64748B; margin-bottom: 0;">
        Por motivos de seguridad, nunca comparta este código con nadie.
      </div>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} MG SOLUTIONS GROUP S.A.C. • Chiclayo, Perú • Todos los derechos reservados.
    </div>
  </div>
</body>
</html>
  `;

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: toEmail,
      subject: `🔑 ${codigoOtp} es tu código de recuperación - MG Solutions`,
      text: `Hola ${nombreUsuario}, tu código de recuperación es: ${codigoOtp}. Válido por 15 minutos.`,
      html: htmlContent,
    });
    return { success: true, simulated: false };
  } catch (error: any) {
    console.error('Error enviando email con Nodemailer (Google SMTP):', error);
    return { success: false, error: error.message };
  }
}

/**
 * Envía correo formal de bienvenida con credenciales de acceso al nuevo usuario creado
 */
export async function sendWelcomeCredentialsEmail(params: {
  toEmail: string;
  nombreCompleto: string;
  username: string;
  passwordTemporal: string;
  rolNombre: string;
  loginUrl?: string;
}): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  const {
    toEmail,
    nombreCompleto,
    username,
    passwordTemporal,
    rolNombre,
    loginUrl = process.env.FRONTEND_URL || 'http://localhost:3000',
  } = params;

  const transporter = getMailTransporter();

  // Si no hay credenciales SMTP configuradas, simular en consola de desarrollo
  if (!transporter) {
    console.log('\n========================================================');
    console.log('📧 [SIMULADOR DE EMAIL - NUEVO USUARIO CREADO]');
    console.log(`Para: ${toEmail} (${nombreCompleto})`);
    console.log(`👤 Usuario: [ ${username} ]`);
    console.log(`🔑 Contraseña Temporal: [ ${passwordTemporal} ]`);
    console.log(`🛡️ Rol: [ ${rolNombre} ]`);
    console.log(`🌐 Acceso: ${loginUrl}`);
    console.log('💡 TIP: Para envío real por Gmail, configure SMTP_USER y SMTP_PASS en .env');
    console.log('========================================================\n');
    return { success: true, simulated: true };
  }

  const fromEmail = process.env.EMAIL_FROM || `"MG Solutions ERP" <${process.env.SMTP_USER}>`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a MG Solutions ERP</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F1F5F9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1E293B;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #F1F5F9;
      padding: 30px 12px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background: #FFFFFF;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08);
      border: 1px solid #E2E8F0;
    }
    .header {
      background: linear-gradient(135deg, #002654 0%, #004A99 100%);
      padding: 32px 28px;
      text-align: center;
      color: #FFFFFF;
    }
    .badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.18);
      color: #E2E8F0;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      padding: 4px 12px;
      border-radius: 20px;
      margin-bottom: 12px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: #FFFFFF;
    }
    .header p {
      margin: 6px 0 0 0;
      font-size: 13px;
      color: #CBD5E1;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 32px 28px;
    }
    .salutation {
      font-size: 16px;
      font-weight: 700;
      color: #0F172A;
      margin-bottom: 14px;
    }
    .intro-text {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 24px;
    }
    .card-credentials {
      background: #F8FAFC;
      border: 1px solid #CBD5E1;
      border-radius: 10px;
      padding: 20px 22px;
      margin-bottom: 24px;
    }
    .card-header {
      font-size: 12px;
      font-weight: 800;
      color: #002654;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      border-bottom: 1px solid #E2E8F0;
      padding-bottom: 10px;
      margin-bottom: 14px;
    }
    .field-row {
      margin-bottom: 12px;
      display: flex;
    }
    .field-label {
      font-size: 12px;
      color: #64748B;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .field-value {
      font-size: 14px;
      color: #0F172A;
      font-weight: 600;
    }
    .field-password {
      font-family: 'Courier New', Courier, monospace;
      font-size: 16px;
      font-weight: 800;
      color: #00346F;
      background: #E2E8F0;
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      letter-spacing: 1px;
    }
    .btn-container {
      text-align: center;
      margin: 28px 0 24px 0;
    }
    .btn-action {
      background: linear-gradient(135deg, #004A99 0%, #002654 100%);
      color: #FFFFFF !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 700;
      padding: 14px 32px;
      border-radius: 8px;
      display: inline-block;
      box-shadow: 0 4px 12px rgba(0, 42, 84, 0.25);
    }
    .notice-box {
      background: #FFFBEB;
      border-left: 4px solid #F59E0B;
      padding: 14px 16px;
      border-radius: 6px;
      margin-bottom: 22px;
    }
    .notice-title {
      font-size: 13px;
      font-weight: 700;
      color: #B45309;
      margin-bottom: 4px;
    }
    .notice-text {
      font-size: 12px;
      line-height: 1.5;
      color: #92400E;
      margin: 0;
    }
    .security-tips {
      font-size: 12px;
      line-height: 1.6;
      color: #64748B;
      border-top: 1px solid #F1F5F9;
      padding-top: 18px;
    }
    .security-tips ul {
      margin: 6px 0 0 0;
      padding-left: 18px;
    }
    .footer {
      background: #F8FAFC;
      padding: 20px 24px;
      text-align: center;
      font-size: 11px;
      color: #94A3B8;
      border-top: 1px solid #E2E8F0;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="badge">MG SOLUTIONS GROUP S.A.C.</div>
        <h1>Bienvenido(a) a la Plataforma ERP</h1>
        <p>Notificación Oficial de Alta de Usuario</p>
      </div>
      <div class="content">
        <div class="salutation">Estimado(a) ${nombreCompleto},</div>
        <p class="intro-text">
          Nos complace informarle que la administración de <strong>MG SOLUTIONS GROUP S.A.C.</strong> ha creado y activado satisfactoriamente su cuenta de usuario en nuestro sistema integral <strong>MG Solutions ERP</strong>.
        </p>

        <div class="card-credentials">
          <div class="card-header">🔑 Sus Credenciales de Acceso</div>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; vertical-align: top; width: 40%;">
                <div class="field-label">Usuario de Acceso:</div>
                <div class="field-value">${username}</div>
              </td>
              <td style="padding: 6px 0; vertical-align: top; width: 60%;">
                <div class="field-label">Correo Registrado:</div>
                <div class="field-value">${toEmail}</div>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0 4px 0; vertical-align: top;">
                <div class="field-label">Rol Asignado:</div>
                <div class="field-value" style="color: #004A99;">${rolNombre}</div>
              </td>
              <td style="padding: 10px 0 4px 0; vertical-align: top;">
                <div class="field-label">Contraseña Temporal:</div>
                <div class="field-password">${passwordTemporal}</div>
              </td>
            </tr>
          </table>
        </div>

        <div class="notice-box">
          <div class="notice-title">🛡️ Política de Seguridad Obligatoria</div>
          <p class="notice-text">
            Por motivos de seguridad informática corporativa, el sistema le solicitará cambiar esta contraseña temporal por una nueva contraseña personal en su <strong>primer inicio de sesión</strong>.
          </p>
        </div>

        <div class="btn-container">
          <a href="${loginUrl}" target="_blank" class="btn-action">
            Acceder al Sistema ERP &rarr;
          </a>
        </div>

        <div class="security-tips">
          <strong>Recomendaciones de Seguridad:</strong>
          <ul>
            <li>No comparta sus credenciales con ninguna persona o colaborador.</li>
            <li>No ingrese sus datos en computadoras públicas o no autorizadas.</li>
            <li>Si no reconoce esta solicitud, comuníquese de inmediato con el Administrador del Sistema.</li>
          </ul>
        </div>
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} MG SOLUTIONS GROUP S.A.C. • Chiclayo, Lambayeque - Perú<br>
        Este correo contiene información confidencial y ha sido generado automáticamente por el sistema ERP.
      </div>
    </div>
  </div>
</body>
</html>
  `;

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: toEmail,
      subject: `🎉 Bienvenido a MG Solutions ERP - Sus Credenciales de Acceso`,
      text: `Estimado(a) ${nombreCompleto},\n\nSe ha creado su cuenta en MG Solutions ERP.\nUsuario: ${username}\nContraseña Temporal: ${passwordTemporal}\nRol: ${rolNombre}\nAcceso: ${loginUrl}\n\nPor seguridad, deberá cambiar su contraseña en el primer inicio de sesión.`,
      html: htmlContent,
    });
    return { success: true, simulated: false };
  } catch (error: any) {
    console.error('Error enviando email de bienvenida al usuario:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Envía el ticket de servicio técnico por correo electrónico al cliente
 */
export async function sendWorkshopTicketEmail(params: {
  toEmail: string;
  clienteNombre: string;
  clienteDocumento?: string;
  clienteTelefono?: string;
  codigoOrden: string;
  fechaIngreso: string;
  tipoEquipo: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  accesorios?: string | string[];
  fallaReportada: string;
  presupuestoTotal: number;
  adelantoPagado: number;
  saldoPendiente: number;
  garantiaDias?: number;
  tecnicoNombre?: string;
}): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  const {
    toEmail,
    clienteNombre,
    clienteDocumento = 'No registrado',
    clienteTelefono = 'No registrado',
    codigoOrden,
    fechaIngreso,
    tipoEquipo,
    marca,
    modelo,
    numeroSerie,
    accesorios = 'Solo equipo',
    fallaReportada,
    presupuestoTotal,
    adelantoPagado,
    saldoPendiente,
    garantiaDias = 90,
    tecnicoNombre = 'Laboratorio Técnico Especializado',
  } = params;

  const transporter = getMailTransporter();
  const accesoriosText = Array.isArray(accesorios) ? accesorios.join(', ') : accesorios;

  // Si no hay credenciales SMTP configuradas, simular en consola de desarrollo
  if (!transporter) {
    console.log('\n========================================================');
    console.log('📧 [SIMULADOR DE EMAIL - TICKET DE TALLER]');
    console.log(`Para: ${toEmail} (${clienteNombre})`);
    console.log(`📋 TICKET: [ ${codigoOrden} ]`);
    console.log(`💻 Equipo: ${marca} ${modelo} (S/N: ${numeroSerie})`);
    console.log(`⚠️ Falla: ${fallaReportada}`);
    console.log(`💰 Saldo Pendiente: S/ ${saldoPendiente.toFixed(2)}`);
    console.log('========================================================\n');
    return { success: true, simulated: true };
  }

  const fromEmail = process.env.EMAIL_FROM || `"MG Solutions Taller" <${process.env.SMTP_USER}>`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket de Servicio - ${codigoOrden}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F1F5F9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1E293B;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #F1F5F9;
      padding: 24px 12px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #FFFFFF;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08);
      border: 1px solid #CBD5E1;
    }
    .header {
      background: linear-gradient(135deg, #002654 0%, #004A99 100%);
      padding: 28px 24px;
      text-align: center;
      color: #FFFFFF;
    }
    .company-title {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0.5px;
      margin: 0;
    }
    .company-sub {
      font-size: 11px;
      letter-spacing: 1px;
      text-transform: uppercase;
      opacity: 0.85;
      margin: 4px 0 12px 0;
    }
    .ticket-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.18);
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 1.5px;
    }
    .ticket-number {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: 2px;
      margin: 10px 0 0 0;
      color: #38BDF8;
      font-family: 'Courier New', monospace;
    }
    .content {
      padding: 28px 24px;
    }
    .salutation {
      font-size: 15px;
      font-weight: 700;
      color: #0F172A;
      margin-bottom: 8px;
    }
    .intro-text {
      font-size: 13px;
      line-height: 1.5;
      color: #475569;
      margin-bottom: 20px;
    }
    .section-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 800;
      color: #00346F;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 1px solid #E2E8F0;
      padding-bottom: 6px;
      margin-bottom: 10px;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .data-table td {
      padding: 5px 0;
      vertical-align: top;
    }
    .data-label {
      color: #64748B;
      font-weight: 600;
      width: 38%;
    }
    .data-value {
      color: #0F172A;
      font-weight: 600;
      width: 62%;
    }
    .amount-box {
      background: #EFF6FF;
      border: 1px solid #BFDBFE;
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 18px;
    }
    .terms-box {
      background: #FFFBEB;
      border-left: 3px solid #F59E0B;
      padding: 10px 14px;
      border-radius: 4px;
      font-size: 11px;
      color: #78350F;
      line-height: 1.4;
      margin-bottom: 20px;
    }
    .footer {
      background: #F8FAFC;
      padding: 18px 24px;
      text-align: center;
      font-size: 11px;
      color: #94A3B8;
      border-top: 1px solid #E2E8F0;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="company-title">MG SOLUTIONS GROUP S.A.C.</div>
        <div class="company-sub">RUC: 20609737524 • Taller & Soporte Técnico Especializado</div>
        <div class="ticket-badge">COMPROBANTE DE INGRESO A SERVICIO</div>
        <div class="ticket-number">${codigoOrden}</div>
      </div>
      <div class="content">
        <div class="salutation">Estimado(a) ${clienteNombre},</div>
        <p class="intro-text">
          Confirmamos la recepción de su equipo en nuestro taller técnico especializado. A continuación le detallamos la información de su orden de servicio:
        </p>

        <!-- DATOS DEL CLIENTE -->
        <div class="section-card">
          <div class="section-title">👤 Datos del Cliente & Contacto</div>
          <table class="data-table">
            <tr>
              <td class="data-label">Cliente / Razón Social:</td>
              <td class="data-value">${clienteNombre}</td>
            </tr>
            <tr>
              <td class="data-label">Documento (DNI/RUC):</td>
              <td class="data-value">${clienteDocumento}</td>
            </tr>
            <tr>
              <td class="data-label">Teléfono Registrado:</td>
              <td class="data-value">${clienteTelefono}</td>
            </tr>
            <tr>
              <td class="data-label">Fecha y Hora de Ingreso:</td>
              <td class="data-value">${fechaIngreso}</td>
            </tr>
          </table>
        </div>

        <!-- DATOS DEL EQUIPO -->
        <div class="section-card">
          <div class="section-title">💻 Especificaciones del Equipo</div>
          <table class="data-table">
            <tr>
              <td class="data-label">Tipo de Equipo:</td>
              <td class="data-value">${tipoEquipo}</td>
            </tr>
            <tr>
              <td class="data-label">Marca y Modelo:</td>
              <td class="data-value"><strong>${marca} ${modelo}</strong></td>
            </tr>
            <tr>
              <td class="data-label">N° de Serie / Service Tag:</td>
              <td class="data-value" style="font-family: monospace;">${numeroSerie}</td>
            </tr>
            <tr>
              <td class="data-label">Accesorios Dejados:</td>
              <td class="data-value">${accesoriosText}</td>
            </tr>
            <tr>
              <td class="data-label">Falla / Motivo de Ingreso:</td>
              <td class="data-value" style="color: #DC2626;"><strong>${fallaReportada}</strong></td>
            </tr>
            <tr>
              <td class="data-label">Especialista Asignado:</td>
              <td class="data-value">${tecnicoNombre}</td>
            </tr>
          </table>
        </div>

        <!-- CUADRO ECONÓMICO -->
        <div class="amount-box">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 4px 0; color: #475569;">Presupuesto Estimado / Costo:</td>
              <td style="padding: 4px 0; text-align: right; font-weight: 600;">S/ ${presupuestoTotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #16A34A;">Adelanto Cancelado en Caja:</td>
              <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #16A34A;">S/ ${adelantoPagado.toFixed(2)}</td>
            </tr>
            <tr style="border-top: 1px dashed #93C5FD;">
              <td style="padding: 8px 0 4px 0; font-size: 15px; font-weight: 800; color: #1E3A8A;">Saldo Pendiente a la Entrega:</td>
              <td style="padding: 8px 0 4px 0; text-align: right; font-size: 16px; font-weight: 800; color: #1E3A8A;">S/ ${saldoPendiente.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <!-- CONDICIONES -->
        <div class="terms-box">
          • <strong>Garantía de Servicio:</strong> ${garantiaDias} días calendario sobre la reparación realizada.<br>
          • <strong>Custodia:</strong> Todo equipo no retirado dentro de los 30 días calendario posteriores a su notificación de finalización pasará a remate administrativo según condiciones del servicio.<br>
          • <strong>Seguimiento:</strong> Puede consultar el avance de su equipo en cualquier momento indicando su código de orden <strong>${codigoOrden}</strong>.
        </div>
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} MG SOLUTIONS GROUP S.A.C. • Soporte y Servicios Tecnológicos<br>
        Chiclayo, Lambayeque - Perú • Atención al cliente: 948 855 458
      </div>
    </div>
  </div>
</body>
</html>
  `;

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: toEmail,
      subject: `📋 Ticket de Servicio Técnico ${codigoOrden} - MG Solutions`,
      text: `Estimado(a) ${clienteNombre},\n\nConfirmamos el ingreso de su equipo ${marca} ${modelo} (S/N: ${numeroSerie}) a nuestro taller con la orden ${codigoOrden}.\nFalla: ${fallaReportada}\nSaldo Pendiente: S/ ${saldoPendiente.toFixed(2)}.\n\nMG SOLUTIONS GROUP S.A.C.`,
      html: htmlContent,
    });
    return { success: true, simulated: false };
  } catch (error: any) {
    console.error('Error enviando ticket de taller por email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Envía el comprobante electrónico de venta (Boleta / Factura / Ticket POS) con series y garantías al correo del cliente
 */
export async function sendSaleReceiptEmail(params: {
  toEmail: string;
  clienteNombre: string;
  clienteDocumento?: string;
  clienteDireccion?: string;
  codigoComprobante: string;
  tipoComprobante?: string;
  fechaVenta?: string;
  vendedorNombre?: string;
  sucursalNombre?: string;
  metodoPago?: string;
  montoRecibido?: number;
  vuelto?: number;
  subtotal: number;
  igv: number;
  total: number;
  items: Array<{
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    series?: string[];
  }>;
}): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  const {
    toEmail,
    clienteNombre,
    clienteDocumento = '00000000',
    clienteDireccion = 'Chiclayo, Perú',
    codigoComprobante,
    tipoComprobante = 'BOLETA DE VENTA ELECTRÓNICA',
    fechaVenta = new Date().toLocaleString('es-PE', { hour12: false }),
    vendedorNombre = 'Vendedor MG Solutions',
    sucursalNombre = 'Principal - Chiclayo Centro',
    metodoPago = 'EFECTIVO',
    montoRecibido,
    vuelto = 0,
    subtotal,
    igv,
    total,
    items,
  } = params;

  const transporter = getMailTransporter();

  // Si no hay SMTP configurado, simular en desarrollo
  if (!transporter) {
    console.log('\n========================================================');
    console.log('📧 [SIMULADOR DE EMAIL - GOOGLE SMTP NO CONFIGURADO]');
    console.log(`Para: ${toEmail} (${clienteNombre})`);
    console.log(`🧾 COMPROBANTE: ${tipoComprobante} [ ${codigoComprobante} ]`);
    console.log(`💰 TOTAL: S/ ${total.toFixed(2)} (${metodoPago})`);
    console.log(`📦 ÍTEMS: ${items.length} producto(s)`);
    console.log('========================================================\n');
    return { success: true, simulated: true };
  }

  const fromEmail = process.env.EMAIL_FROM || `"MG Solutions Comprobantes" <${process.env.SMTP_USER}>`;

  // Construir filas de productos
  const itemsHtml = items
    .map(
      (it) => `
      <tr style="border-bottom: 1px dashed #E2E8F0;">
        <td style="padding: 10px 8px; font-size: 13px; color: #1E293B;">
          <strong>${it.cantidad}x</strong> ${it.nombre}
          ${
            it.series && it.series.length > 0
              ? `<div style="margin-top: 4px; font-family: 'Courier New', monospace; font-size: 11px; color: #0284C7; background: #F0F9FF; padding: 3px 6px; border-radius: 4px; display: inline-block;">
                  S/N: ${it.series.join(', ')} • <strong>Garantía 12 Meses</strong>
                 </div>`
              : ''
          }
        </td>
        <td style="padding: 10px 8px; font-size: 13px; text-align: right; color: #64748B;">
          S/ ${it.precioUnitario.toFixed(2)}
        </td>
        <td style="padding: 10px 8px; font-size: 13px; text-align: right; font-weight: 700; color: #00346F;">
          S/ ${it.subtotal.toFixed(2)}
        </td>
      </tr>
    `
    )
    .join('');

  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comprobante de Pago - MG Solutions</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F8FAFC;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
    }
    .wrapper {
      width: 100%;
      background-color: #F8FAFC;
      padding: 30px 0;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background: #FFFFFF;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
      border: 1px solid #E2E8F0;
    }
    .header {
      background: linear-gradient(135deg, #002244 0%, #00346F 100%);
      padding: 28px 24px 22px;
      text-align: center;
      color: #FFFFFF;
    }
    .company-title {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .company-sub {
      font-size: 11px;
      color: #94A3B8;
      letter-spacing: 0.5px;
      margin-bottom: 14px;
    }
    .doc-badge {
      display: inline-block;
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.4);
      color: #38BDF8;
      font-size: 11px;
      font-weight: 800;
      padding: 4px 14px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .doc-code {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: 2px;
      margin-top: 8px;
      color: #FFFFFF;
      font-family: 'Courier New', monospace;
    }
    .content {
      padding: 24px;
    }
    .info-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 20px;
      font-size: 12px;
    }
    .info-grid {
      width: 100%;
      border-collapse: collapse;
    }
    .info-grid td {
      padding: 3px 0;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .items-table th {
      background: #F1F5F9;
      color: #475569;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 8px;
      text-align: left;
    }
    .totals-box {
      background: #EFF6FF;
      border: 1px solid #BFDBFE;
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 20px;
    }
    .totals-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .totals-table td {
      padding: 4px 0;
    }
    .footer {
      background: #F8FAFC;
      padding: 20px;
      text-align: center;
      font-size: 11px;
      color: #94A3B8;
      border-top: 1px solid #E2E8F0;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="company-title">MG SOLUTIONS GROUP S.A.C.</div>
        <div class="company-sub">RUC: 20609737524 • Av. Pedro Ruiz Nro. 349 Int. 09C, Chiclayo</div>
        <div class="doc-badge">${tipoComprobante}</div>
        <div class="doc-code">${codigoComprobante}</div>
      </div>
      
      <div class="content">
        <div class="info-card">
          <table class="info-grid">
            <tr>
              <td style="color: #64748B; width: 35%;"><strong>Cliente:</strong></td>
              <td style="color: #0F172A; font-weight: 700;">${clienteNombre}</td>
            </tr>
            <tr>
              <td style="color: #64748B;"><strong>Documento:</strong></td>
              <td style="color: #0F172A;">${clienteDocumento}</td>
            </tr>
            <tr>
              <td style="color: #64748B;"><strong>Dirección:</strong></td>
              <td style="color: #0F172A;">${clienteDireccion}</td>
            </tr>
            <tr>
              <td style="color: #64748B;"><strong>Fecha de Emisión:</strong></td>
              <td style="color: #0F172A;">${fechaVenta}</td>
            </tr>
            <tr>
              <td style="color: #64748B;"><strong>Sede / Cajero:</strong></td>
              <td style="color: #0F172A;">${sucursalNombre} • ${vendedorNombre}</td>
            </tr>
          </table>
        </div>

        <!-- TABLA DE PRODUCTOS -->
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 55%;">Producto / Serie</th>
              <th style="width: 20%; text-align: right;">P. Unit.</th>
              <th style="width: 25%; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- TOTALES -->
        <div class="totals-box">
          <table class="totals-table">
            <tr>
              <td style="color: #475569;">Op. Gravada (Subtotal):</td>
              <td style="text-align: right; font-weight: 600;">S/ ${subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="color: #475569;">I.G.V. (18%):</td>
              <td style="text-align: right; font-weight: 600;">S/ ${igv.toFixed(2)}</td>
            </tr>
            <tr style="border-top: 1px dashed #93C5FD;">
              <td style="padding-top: 8px; font-size: 16px; font-weight: 900; color: #00346F;">TOTAL A PAGAR:</td>
              <td style="padding-top: 8px; text-align: right; font-size: 18px; font-weight: 900; color: #00346F;">S/ ${total.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding-top: 6px; font-size: 12px; color: #64748B;">Forma de Pago:</td>
              <td style="padding-top: 6px; text-align: right; font-size: 12px; font-weight: 700; color: #0F172A;">${metodoPago}</td>
            </tr>
            ${
              metodoPago === 'EFECTIVO' && montoRecibido
                ? `
            <tr>
              <td style="font-size: 12px; color: #64748B;">Monto Recibido:</td>
              <td style="text-align: right; font-size: 12px;">S/ ${montoRecibido.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="font-size: 12px; color: #16A34A; font-weight: 700;">Vuelto:</td>
              <td style="text-align: right; font-size: 12px; color: #16A34A; font-weight: 700;">S/ ${vuelto.toFixed(2)}</td>
            </tr>
            `
                : ''
            }
          </table>
        </div>

        <div style="background: #FFFBEB; border-left: 3px solid #F59E0B; padding: 10px 14px; border-radius: 4px; font-size: 11px; color: #78350F; line-height: 1.4; margin-bottom: 14px;">
          🛡️ <strong>Garantía de Hardware:</strong> Los productos adquiridos con número de serie cuentan con <strong>12 meses de garantía</strong> directa por fallas de fábrica. Conserve este comprobante digital o su ticket físico.
        </div>

        <p style="font-size: 11px; text-align: center; color: #94A3B8; margin: 0;">
          Representación impresa de la Boleta/Factura Electrónica.<br>
          Consulte la validez de su comprobante en <strong>www.sunat.gob.pe</strong>
        </p>
      </div>

      <div class="footer">
        © ${new Date().getFullYear()} MG SOLUTIONS GROUP S.A.C. • Tecnología, Hardware & Servicio Técnico<br>
        Chiclayo, Lambayeque - Perú • Tel: +51 974 812 390 • Central: (074) 635 210
      </div>
    </div>
  </div>
</body>
</html>
  `;

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: toEmail,
      subject: `🧾 ${tipoComprobante} ${codigoComprobante} - MG Solutions`,
      text: `Estimado(a) ${clienteNombre},\n\nAdjuntamos la confirmación de su ${tipoComprobante} N° ${codigoComprobante}.\nTotal pagado: S/ ${total.toFixed(2)} (${metodoPago}).\n\nGracias por su compra en MG SOLUTIONS GROUP S.A.C.`,
      html: htmlContent,
    });
    return { success: true, simulated: false };
  } catch (error: any) {
    console.error('Error enviando comprobante de venta por email:', error);
    return { success: false, error: error.message };
  }
}

