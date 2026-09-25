import nodemailer from 'nodemailer';

// Configuración del transporte Nodemailer (Google / Gmail SMTP u otro)
export function getMailTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
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
