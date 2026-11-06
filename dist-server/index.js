var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/utils/security.ts
var security_exports = {};
__export(security_exports, {
  comparePassword: () => comparePassword,
  decryptSensitiveData: () => decryptSensitiveData,
  encryptSensitiveData: () => encryptSensitiveData,
  hashPassword: () => hashPassword,
  maskDocument: () => maskDocument,
  maskEmail: () => maskEmail,
  maskPhone: () => maskPhone
});
import bcrypt from "bcryptjs";
import crypto from "crypto";
import dotenv2 from "dotenv";
async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}
async function comparePassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash);
}
function encryptSensitiveData(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}
function decryptSensitiveData(encryptedPayload) {
  if (!encryptedPayload || !encryptedPayload.includes(":")) return encryptedPayload;
  try {
    const [ivHex, encryptedText] = encryptedPayload.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("Error desencriptando dato sensible:", err);
    return encryptedPayload;
  }
}
function maskDocument(doc) {
  if (!doc || doc.length < 4) return "****";
  const visible = doc.slice(-4);
  return `${"*".repeat(doc.length - 4)}${visible}`;
}
function maskPhone(phone) {
  if (!phone || phone.length < 6) return "***";
  return phone.replace(/(\d{3})\s*(\d{3})\s*(\d{3})/, "$1 *** $3");
}
function maskEmail(email) {
  if (!email || !email.includes("@")) return "***@***.***";
  const [user, domain] = email.split("@");
  const visible = user.length > 2 ? user.slice(0, 2) : user.slice(0, 1);
  return `${visible}***@${domain}`;
}
var ENCRYPTION_KEY, IV_LENGTH;
var init_security = __esm({
  "server/utils/security.ts"() {
    dotenv2.config();
    ENCRYPTION_KEY = Buffer.from(
      process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      "hex"
    );
    IV_LENGTH = 16;
  }
});

// server/utils/mailer.ts
var mailer_exports = {};
__export(mailer_exports, {
  dispatchEmail: () => dispatchEmail,
  getMailTransporter: () => getMailTransporter,
  getRuntimeMailBridgeUrl: () => getRuntimeMailBridgeUrl,
  sendRecoveryCodeEmail: () => sendRecoveryCodeEmail,
  sendSaleReceiptEmail: () => sendSaleReceiptEmail,
  sendWelcomeCredentialsEmail: () => sendWelcomeCredentialsEmail,
  sendWorkshopTicketEmail: () => sendWorkshopTicketEmail,
  setRuntimeMailBridgeUrl: () => setRuntimeMailBridgeUrl,
  verifySMTPConnection: () => verifySMTPConnection
});
import nodemailer from "nodemailer";
import dotenv4 from "dotenv";
import dns from "dns";
function setRuntimeMailBridgeUrl(url) {
  runtimeMailBridgeUrl = (url || "").trim();
}
function getRuntimeMailBridgeUrl() {
  return runtimeMailBridgeUrl || process.env.GOOGLE_MAIL_BRIDGE_URL || DEFAULT_GOOGLE_MAIL_BRIDGE_URL;
}
async function resolveSmtpIpv4Host(hostname) {
  try {
    const ipv4List = await dns.promises.resolve4(hostname);
    if (ipv4List && ipv4List.length > 0) {
      return ipv4List[0];
    }
  } catch (err) {
    console.warn(`\u26A0\uFE0F No se pudo resolver IPv4 para ${hostname}, usando hostname directo:`, err);
  }
  return hostname;
}
function getMailTransporter(overridePort, resolvedIpv4Host) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    dotenv4.config({ override: true });
  }
  const originalHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const connectHost = resolvedIpv4Host || originalHost;
  const port = overridePort || parseInt(process.env.SMTP_PORT || "465", 10);
  const secure = port === 465 ? true : process.env.SMTP_SECURE === "true";
  const user = (process.env.SMTP_USER || "mgsolutionsg@gmail.com").trim();
  const pass = (process.env.SMTP_PASS || "qpulsrkfhicknmox").replace(/\s+/g, "");
  if (!user || !pass) {
    console.warn("\u26A0\uFE0F SMTP_USER o SMTP_PASS no encontrados en process.env");
    return null;
  }
  return nodemailer.createTransport({
    host: connectHost,
    port,
    secure,
    servername: originalHost,
    auth: {
      user,
      pass
    },
    tls: {
      servername: originalHost,
      rejectUnauthorized: false
    },
    connectionTimeout: 7e3,
    greetingTimeout: 7e3,
    socketTimeout: 9e3
  });
}
async function dispatchEmail(mailOptions) {
  const bridgeUrl = getRuntimeMailBridgeUrl();
  if (bridgeUrl && bridgeUrl.startsWith("https://")) {
    try {
      const response = await fetch(bridgeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        redirect: "follow",
        body: JSON.stringify({
          to: mailOptions.to,
          subject: mailOptions.subject,
          text: mailOptions.text || "",
          html: mailOptions.html,
          fromName: "MG Solutions Group S.A.C."
        })
      });
      if (response.ok) {
        const resData = await response.json().catch(() => ({ success: true }));
        if (resData.success !== false) {
          console.log(`\u2705 Correo enviado v\xEDa HTTPS Bridge (Puerto 443) a ${mailOptions.to}`);
          return;
        }
      }
      console.warn("\u26A0\uFE0F Fallo en HTTPS Bridge, pasando a SMTP IPv4 directo...");
    } catch (bridgeErr) {
      console.warn("\u26A0\uFE0F Error conectando a HTTPS Bridge, pasando a SMTP IPv4 directo:", bridgeErr?.message);
    }
  }
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || "MG Solutions <onboarding@resend.dev>",
          to: [mailOptions.to],
          subject: mailOptions.subject,
          html: mailOptions.html,
          text: mailOptions.text
        })
      });
      if (response.ok) {
        console.log(`\u2705 Correo enviado v\xEDa Resend HTTPS API (Puerto 443) a ${mailOptions.to}`);
        return;
      }
    } catch (resendErr) {
      console.warn("\u26A0\uFE0F Error en Resend API:", resendErr?.message);
    }
  }
  const originalHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const ipv4Host = await resolveSmtpIpv4Host(originalHost);
  const fromEmail = mailOptions.from || process.env.EMAIL_FROM || `"MG Solutions ERP" <${process.env.SMTP_USER || "mgsolutionsg@gmail.com"}>`;
  const fullMailOptions = {
    ...mailOptions,
    from: fromEmail
  };
  const primaryTransporter = getMailTransporter(465, ipv4Host);
  if (!primaryTransporter) {
    throw new Error("Transporter SMTP no disponible");
  }
  try {
    await primaryTransporter.sendMail(fullMailOptions);
    console.log(`\u2705 Correo enviado v\xEDa SMTP IPv4 (${ipv4Host}:465) a ${mailOptions.to}`);
  } catch (firstErr) {
    console.warn(`\u26A0\uFE0F Reintentando env\xEDo SMTP por ${ipv4Host}:587 tras fallo en 465:`, firstErr?.message);
    const fallbackTransporter = getMailTransporter(587, ipv4Host);
    if (!fallbackTransporter) throw firstErr;
    await fallbackTransporter.sendMail(fullMailOptions);
    console.log(`\u2705 Correo enviado v\xEDa SMTP IPv4 (${ipv4Host}:587) a ${mailOptions.to}`);
  }
}
async function sendMailWithRetry(mailOptions) {
  await dispatchEmail(mailOptions);
}
async function verifySMTPConnection() {
  const transporter = getMailTransporter();
  if (!transporter) {
    return { ok: false, message: "SMTP no configurado: faltan SMTP_USER o SMTP_PASS en el archivo .env" };
  }
  try {
    await transporter.verify();
    return { ok: true, message: "Conexi\xF3n SMTP con Google establecida exitosamente." };
  } catch (error) {
    return { ok: false, message: `Error de autenticaci\xF3n SMTP: ${error.message}` };
  }
}
async function sendRecoveryCodeEmail(toEmail, nombreUsuario, codigoOtp) {
  const transporter = getMailTransporter();
  if (!transporter) {
    console.log("\n========================================================");
    console.log("\u{1F4E7} [SIMULADOR DE EMAIL - GOOGLE SMTP NO CONFIGURADO]");
    console.log(`Para: ${toEmail} (${nombreUsuario})`);
    console.log(`\u{1F511} C\xD3DIGO DE RECUPERACI\xD3N OTP: [ ${codigoOtp} ]`);
    console.log("\u23F0 V\xE1lido por 15 minutos");
    console.log("\u{1F4A1} TIP: Para env\xEDo real por Gmail, configure SMTP_USER y SMTP_PASS en el archivo .env");
    console.log("========================================================\n");
    return { success: true, simulated: true };
  }
  const fromEmail = process.env.EMAIL_FROM || `"MG Solutions Security" <${process.env.SMTP_USER || "mgsolutionsg@gmail.com"}>`;
  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>C\xF3digo de Recuperaci\xF3n - MG Solutions</title>
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
      <p>Centro de Seguridad y Recuperaci\xF3n</p>
    </div>
    <div class="content">
      <div class="greeting">Hola, ${nombreUsuario}</div>
      <div class="text">
        Hemos recibido una solicitud para restablecer la contrase\xF1a de su cuenta en el sistema <strong>MG Solutions ERP</strong>.
        Use el siguiente c\xF3digo de verificaci\xF3n de 6 d\xEDgitos para continuar con el proceso:
      </div>
      
      <div class="otp-box">
        <div class="otp-label">Su C\xF3digo de Verificaci\xF3n OTP</div>
        <div class="otp-code">${codigoOtp}</div>
      </div>

      <div class="warning">
        \u23F3 <strong>Importante:</strong> Este c\xF3digo vencer\xE1 en <strong>15 minutos</strong>. Si usted no solicit\xF3 este cambio, ignore este mensaje y contacte al Administrador.
      </div>

      <div class="text" style="font-size: 12px; color: #64748B; margin-bottom: 0;">
        Por motivos de seguridad, nunca comparta este c\xF3digo con nadie.
      </div>
    </div>
    <div class="footer">
      \xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} MG SOLUTIONS GROUP S.A.C. \u2022 Chiclayo, Per\xFA \u2022 Todos los derechos reservados.
    </div>
  </div>
</body>
</html>
  `;
  try {
    await sendMailWithRetry({
      from: fromEmail,
      to: toEmail,
      subject: `\u{1F511} ${codigoOtp} es tu c\xF3digo de recuperaci\xF3n - MG Solutions`,
      text: `Hola ${nombreUsuario}, tu c\xF3digo de recuperaci\xF3n es: ${codigoOtp}. V\xE1lido por 15 minutos.`,
      html: htmlContent
    });
    return { success: true, simulated: false };
  } catch (error) {
    console.error("Error enviando email con Nodemailer (Google SMTP):", error);
    return { success: false, error: error.message };
  }
}
async function sendWelcomeCredentialsEmail(params) {
  const {
    toEmail,
    nombreCompleto,
    username,
    passwordTemporal,
    rolNombre,
    loginUrl = process.env.FRONTEND_URL || "http://localhost:3000"
  } = params;
  const transporter = getMailTransporter();
  if (!transporter) {
    console.log("\n========================================================");
    console.log("\u{1F4E7} [SIMULADOR DE EMAIL - NUEVO USUARIO CREADO]");
    console.log(`Para: ${toEmail} (${nombreCompleto})`);
    console.log(`\u{1F464} Usuario: [ ${username} ]`);
    console.log(`\u{1F511} Contrase\xF1a Temporal: [ ${passwordTemporal} ]`);
    console.log(`\u{1F6E1}\uFE0F Rol: [ ${rolNombre} ]`);
    console.log(`\u{1F310} Acceso: ${loginUrl}`);
    console.log("\u{1F4A1} TIP: Para env\xEDo real por Gmail, configure SMTP_USER y SMTP_PASS en .env");
    console.log("========================================================\n");
    return { success: true, simulated: true };
  }
  const fromEmail = process.env.EMAIL_FROM || `"MG Solutions ERP" <${process.env.SMTP_USER || "mgsolutionsg@gmail.com"}>`;
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
        <p>Notificaci\xF3n Oficial de Alta de Usuario</p>
      </div>
      <div class="content">
        <div class="salutation">Estimado(a) ${nombreCompleto},</div>
        <p class="intro-text">
          Nos complace informarle que la administraci\xF3n de <strong>MG SOLUTIONS GROUP S.A.C.</strong> ha creado y activado satisfactoriamente su cuenta de usuario en nuestro sistema integral <strong>MG Solutions ERP</strong>.
        </p>

        <div class="card-credentials">
          <div class="card-header">\u{1F511} Sus Credenciales de Acceso</div>
          
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
                <div class="field-label">Contrase\xF1a Temporal:</div>
                <div class="field-password">${passwordTemporal}</div>
              </td>
            </tr>
          </table>
        </div>

        <div class="notice-box">
          <div class="notice-title">\u{1F6E1}\uFE0F Pol\xEDtica de Seguridad Obligatoria</div>
          <p class="notice-text">
            Por motivos de seguridad inform\xE1tica corporativa, el sistema le solicitar\xE1 cambiar esta contrase\xF1a temporal por una nueva contrase\xF1a personal en su <strong>primer inicio de sesi\xF3n</strong>.
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
            <li>No ingrese sus datos en computadoras p\xFAblicas o no autorizadas.</li>
            <li>Si no reconoce esta solicitud, comun\xEDquese de inmediato con el Administrador del Sistema.</li>
          </ul>
        </div>
      </div>
      <div class="footer">
        \xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} MG SOLUTIONS GROUP S.A.C. \u2022 Chiclayo, Lambayeque - Per\xFA<br>
        Este correo contiene informaci\xF3n confidencial y ha sido generado autom\xE1ticamente por el sistema ERP.
      </div>
    </div>
  </div>
</body>
</html>
  `;
  try {
    await sendMailWithRetry({
      from: fromEmail,
      to: toEmail,
      subject: `\u{1F389} Bienvenido a MG Solutions ERP - Sus Credenciales de Acceso`,
      text: `Estimado(a) ${nombreCompleto},

Se ha creado su cuenta en MG Solutions ERP.
Usuario: ${username}
Contrase\xF1a Temporal: ${passwordTemporal}
Rol: ${rolNombre}
Acceso: ${loginUrl}

Por seguridad, deber\xE1 cambiar su contrase\xF1a en el primer inicio de sesi\xF3n.`,
      html: htmlContent
    });
    return { success: true, simulated: false };
  } catch (error) {
    console.error("Error enviando email de bienvenida al usuario:", error);
    return { success: false, error: error.message };
  }
}
async function sendWorkshopTicketEmail(params) {
  const {
    toEmail,
    clienteNombre,
    clienteDocumento = "No registrado",
    clienteTelefono = "No registrado",
    codigoOrden,
    fechaIngreso,
    tipoEquipo,
    marca,
    modelo,
    numeroSerie,
    accesorios = "Solo equipo",
    fallaReportada,
    presupuestoTotal,
    adelantoPagado,
    saldoPendiente,
    garantiaDias = 90,
    tecnicoNombre = "Laboratorio T\xE9cnico Especializado"
  } = params;
  const transporter = getMailTransporter();
  const accesoriosText = Array.isArray(accesorios) ? accesorios.join(", ") : accesorios;
  if (!transporter) {
    console.log("\n========================================================");
    console.log("\u{1F4E7} [SIMULADOR DE EMAIL - TICKET DE TALLER]");
    console.log(`Para: ${toEmail} (${clienteNombre})`);
    console.log(`\u{1F4CB} TICKET: [ ${codigoOrden} ]`);
    console.log(`\u{1F4BB} Equipo: ${marca} ${modelo} (S/N: ${numeroSerie})`);
    console.log(`\u26A0\uFE0F Falla: ${fallaReportada}`);
    console.log(`\u{1F4B0} Saldo Pendiente: S/ ${saldoPendiente.toFixed(2)}`);
    console.log("========================================================\n");
    return { success: true, simulated: true };
  }
  const fromEmail = process.env.EMAIL_FROM || `"MG Solutions Taller" <${process.env.SMTP_USER || "mgsolutionsg@gmail.com"}>`;
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
        <div class="company-sub">RUC: 20609737524 \u2022 Taller & Soporte T\xE9cnico Especializado</div>
        <div class="ticket-badge">COMPROBANTE DE INGRESO A SERVICIO</div>
        <div class="ticket-number">${codigoOrden}</div>
      </div>
      <div class="content">
        <div class="salutation">Estimado(a) ${clienteNombre},</div>
        <p class="intro-text">
          Confirmamos la recepci\xF3n de su equipo en nuestro taller t\xE9cnico especializado. A continuaci\xF3n le detallamos la informaci\xF3n de su orden de servicio:
        </p>

        <!-- DATOS DEL CLIENTE -->
        <div class="section-card">
          <div class="section-title">\u{1F464} Datos del Cliente & Contacto</div>
          <table class="data-table">
            <tr>
              <td class="data-label">Cliente / Raz\xF3n Social:</td>
              <td class="data-value">${clienteNombre}</td>
            </tr>
            <tr>
              <td class="data-label">Documento (DNI/RUC):</td>
              <td class="data-value">${clienteDocumento}</td>
            </tr>
            <tr>
              <td class="data-label">Tel\xE9fono Registrado:</td>
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
          <div class="section-title">\u{1F4BB} Especificaciones del Equipo</div>
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
              <td class="data-label">N\xB0 de Serie / Service Tag:</td>
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

        <!-- CUADRO ECON\xD3MICO -->
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
          \u2022 <strong>Garant\xEDa de Servicio:</strong> ${garantiaDias} d\xEDas calendario sobre la reparaci\xF3n realizada.<br>
          \u2022 <strong>Custodia:</strong> Todo equipo no retirado dentro de los 30 d\xEDas calendario posteriores a su notificaci\xF3n de finalizaci\xF3n pasar\xE1 a remate administrativo seg\xFAn condiciones del servicio.<br>
          \u2022 <strong>Seguimiento:</strong> Puede consultar el avance de su equipo en cualquier momento indicando su c\xF3digo de orden <strong>${codigoOrden}</strong>.
        </div>
      </div>
      <div class="footer">
        \xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} MG SOLUTIONS GROUP S.A.C. \u2022 Soporte y Servicios Tecnol\xF3gicos<br>
        Chiclayo, Lambayeque - Per\xFA \u2022 Atenci\xF3n al cliente: 948 855 458
      </div>
    </div>
  </div>
</body>
</html>
  `;
  try {
    await sendMailWithRetry({
      from: fromEmail,
      to: toEmail,
      subject: `\u{1F4CB} Ticket de Servicio T\xE9cnico ${codigoOrden} - MG Solutions`,
      text: `Estimado(a) ${clienteNombre},

Confirmamos el ingreso de su equipo ${marca} ${modelo} (S/N: ${numeroSerie}) a nuestro taller con la orden ${codigoOrden}.
Falla: ${fallaReportada}
Saldo Pendiente: S/ ${saldoPendiente.toFixed(2)}.

MG SOLUTIONS GROUP S.A.C.`,
      html: htmlContent
    });
    return { success: true, simulated: false };
  } catch (error) {
    console.error("Error enviando ticket de taller por email:", error);
    return { success: false, error: error.message };
  }
}
async function sendSaleReceiptEmail(params) {
  const {
    toEmail,
    clienteNombre,
    clienteDocumento = "00000000",
    clienteDireccion = "Chiclayo, Per\xFA",
    codigoComprobante,
    tipoComprobante = "BOLETA DE VENTA ELECTR\xD3NICA",
    fechaVenta = (/* @__PURE__ */ new Date()).toLocaleString("es-PE", { hour12: false }),
    vendedorNombre = "Vendedor MG Solutions",
    sucursalNombre = "Principal - Chiclayo Centro",
    metodoPago = "EFECTIVO",
    montoRecibido,
    vuelto = 0,
    subtotal,
    igv,
    total,
    items
  } = params;
  const transporter = getMailTransporter();
  if (!transporter) {
    console.log("\n========================================================");
    console.log("\u{1F4E7} [SIMULADOR DE EMAIL - GOOGLE SMTP NO CONFIGURADO]");
    console.log(`Para: ${toEmail} (${clienteNombre})`);
    console.log(`\u{1F9FE} COMPROBANTE: ${tipoComprobante} [ ${codigoComprobante} ]`);
    console.log(`\u{1F4B0} TOTAL: S/ ${total.toFixed(2)} (${metodoPago})`);
    console.log(`\u{1F4E6} \xCDTEMS: ${items.length} producto(s)`);
    console.log("========================================================\n");
    return { success: true, simulated: true };
  }
  const fromEmail = process.env.EMAIL_FROM || `"MG Solutions Comprobantes" <${process.env.SMTP_USER || "mgsolutionsg@gmail.com"}>`;
  const itemsHtml = items.map(
    (it) => `
      <tr style="border-bottom: 1px dashed #E2E8F0;">
        <td style="padding: 10px 8px; font-size: 13px; color: #1E293B;">
          <strong>${it.cantidad}x</strong> ${it.nombre}
          ${it.series && it.series.length > 0 ? `<div style="margin-top: 4px; font-family: 'Courier New', monospace; font-size: 11px; color: #0284C7; background: #F0F9FF; padding: 3px 6px; border-radius: 4px; display: inline-block;">
                  S/N: ${it.series.join(", ")} \u2022 <strong>Garant\xEDa 12 Meses</strong>
                 </div>` : ""}
        </td>
        <td style="padding: 10px 8px; font-size: 13px; text-align: right; color: #64748B;">
          S/ ${it.precioUnitario.toFixed(2)}
        </td>
        <td style="padding: 10px 8px; font-size: 13px; text-align: right; font-weight: 700; color: #00346F;">
          S/ ${it.subtotal.toFixed(2)}
        </td>
      </tr>
    `
  ).join("");
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
        <div class="company-sub">RUC: 20609737524 \u2022 Av. Pedro Ruiz Nro. 349 Int. 09C, Chiclayo</div>
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
              <td style="color: #64748B;"><strong>Direcci\xF3n:</strong></td>
              <td style="color: #0F172A;">${clienteDireccion}</td>
            </tr>
            <tr>
              <td style="color: #64748B;"><strong>Fecha de Emisi\xF3n:</strong></td>
              <td style="color: #0F172A;">${fechaVenta}</td>
            </tr>
            <tr>
              <td style="color: #64748B;"><strong>Sede / Cajero:</strong></td>
              <td style="color: #0F172A;">${sucursalNombre} \u2022 ${vendedorNombre}</td>
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
            ${metodoPago === "EFECTIVO" && montoRecibido ? `
            <tr>
              <td style="font-size: 12px; color: #64748B;">Monto Recibido:</td>
              <td style="text-align: right; font-size: 12px;">S/ ${montoRecibido.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="font-size: 12px; color: #16A34A; font-weight: 700;">Vuelto:</td>
              <td style="text-align: right; font-size: 12px; color: #16A34A; font-weight: 700;">S/ ${vuelto.toFixed(2)}</td>
            </tr>
            ` : ""}
          </table>
        </div>

        <div style="background: #FFFBEB; border-left: 3px solid #F59E0B; padding: 10px 14px; border-radius: 4px; font-size: 11px; color: #78350F; line-height: 1.4; margin-bottom: 14px;">
          \u{1F6E1}\uFE0F <strong>Garant\xEDa de Hardware:</strong> Los productos adquiridos con n\xFAmero de serie cuentan con <strong>12 meses de garant\xEDa</strong> directa por fallas de f\xE1brica. Conserve este comprobante digital o su ticket f\xEDsico.
        </div>

        <p style="font-size: 11px; text-align: center; color: #94A3B8; margin: 0;">
          Representaci\xF3n impresa de la Boleta/Factura Electr\xF3nica.<br>
          Consulte la validez de su comprobante en <strong>www.sunat.gob.pe</strong>
        </p>
      </div>

      <div class="footer">
        \xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} MG SOLUTIONS GROUP S.A.C. \u2022 Tecnolog\xEDa, Hardware & Servicio T\xE9cnico<br>
        Chiclayo, Lambayeque - Per\xFA \u2022 Tel: +51 974 812 390 \u2022 Central: (074) 635 210
      </div>
    </div>
  </div>
</body>
</html>
  `;
  try {
    await sendMailWithRetry({
      from: fromEmail,
      to: toEmail,
      subject: `\u{1F9FE} ${tipoComprobante} ${codigoComprobante} - MG Solutions`,
      text: `Estimado(a) ${clienteNombre},

Adjuntamos la confirmaci\xF3n de su ${tipoComprobante} N\xB0 ${codigoComprobante}.
Total pagado: S/ ${total.toFixed(2)} (${metodoPago}).

Gracias por su compra en MG SOLUTIONS GROUP S.A.C.`,
      html: htmlContent
    });
    return { success: true, simulated: false };
  } catch (error) {
    console.error("Error enviando comprobante de venta por email:", error);
    return { success: false, error: error.message };
  }
}
var DEFAULT_GOOGLE_MAIL_BRIDGE_URL, runtimeMailBridgeUrl;
var init_mailer = __esm({
  "server/utils/mailer.ts"() {
    try {
      dns.setDefaultResultOrder("ipv4first");
    } catch {
    }
    dotenv4.config();
    DEFAULT_GOOGLE_MAIL_BRIDGE_URL = "https://script.google.com/macros/s/AKfycbyr0WYIKEvVZbA1WmlN24OIATYOxQEkSEIlMT02dDPCKnVeXlhh_6vz40fdQQt9zY-6yg/exec";
    runtimeMailBridgeUrl = process.env.GOOGLE_MAIL_BRIDGE_URL || DEFAULT_GOOGLE_MAIL_BRIDGE_URL;
  }
});

// server/index.ts
import "dotenv/config";
import dns2 from "dns";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv6 from "dotenv";
import path from "path";
import fs from "fs";

// server/config/db.ts
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();
var pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "mg_solutions_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
  ssl: process.env.DB_SSL === "true" || process.env.NODE_ENV === "production" ? { minVersion: "TLSv1.2", rejectUnauthorized: false } : void 0
});
async function testDbConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("\u2705 Conexi\xF3n exitosa al pool de MySQL (mg_solutions_db)");
    connection.release();
    return true;
  } catch (error) {
    console.error("\u274C Error conectando a MySQL:", error);
    return false;
  }
}

// server/routes/auth.routes.ts
import { Router } from "express";

// server/controllers/auth.controller.ts
init_security();

// server/utils/jwt.ts
import jwt from "jsonwebtoken";
import dotenv3 from "dotenv";
dotenv3.config();
var JWT_SECRET = process.env.JWT_SECRET || "mg_solutions_default_dev_secret_key_2024";
var JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "2h";
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// server/controllers/auth.controller.ts
var MAX_LOGIN_ATTEMPTS = 5;
var LOCKOUT_DURATION_MINUTES = 15;
async function login(req, res) {
  try {
    const rawEmail = req.body.email || req.body.username;
    const { password } = req.body;
    if (!rawEmail || !password) {
      res.status(400).json({
        success: false,
        message: "Debe proporcionar su correo electr\xF3nico y contrase\xF1a."
      });
      return;
    }
    const cleanEmail = String(rawEmail).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      res.status(400).json({
        success: false,
        message: "El inicio de sesi\xF3n se realiza \xFAnicamente con correo electr\xF3nico (ej: usuario@mgsolutions.pe)."
      });
      return;
    }
    const [users] = await pool.query(
      `SELECT u.id, u.username, u.password_hash, u.nombre_completo, u.email,
              u.telefono_cifrado, COALESCE(td.codigo, 'DNI') AS tipo_documento, u.numero_documento_cifrado,
              e.nombre AS estado, u.avatar_url, u.sucursal_id,
              u.requiere_cambio_password, u.intentos_fallidos, u.bloqueado_hasta,
              r.codigo AS rol_codigo, r.nombre AS rol_nombre, r.modulos_predeterminados,
              s.nombre AS sucursal_nombre
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       JOIN estados e ON u.estado_id = e.id
       LEFT JOIN tipos_documento td ON u.tipo_documento_id = td.id
       LEFT JOIN sucursales s ON u.sucursal_id = s.id
       WHERE LOWER(u.email) = ?
       LIMIT 1`,
      [cleanEmail]
    );
    if (users.length === 0) {
      res.status(401).json({
        success: false,
        message: "Credenciales inv\xE1lidas: Correo electr\xF3nico no registrado."
      });
      return;
    }
    const user = users[0];
    if (user.estado !== "ACTIVO") {
      res.status(403).json({
        success: false,
        message: "Acceso bloqueado: Su cuenta se encuentra inactiva. Contacte a Gerencia."
      });
      return;
    }
    if (user.bloqueado_hasta && new Date(user.bloqueado_hasta) > /* @__PURE__ */ new Date()) {
      const minutosRestantes = Math.ceil(
        (new Date(user.bloqueado_hasta).getTime() - Date.now()) / 6e4
      );
      res.status(423).json({
        success: false,
        message: `Cuenta bloqueada temporalmente por m\xFAltiples intentos fallidos. Intente en ${minutosRestantes} minuto(s).`
      });
      return;
    }
    if (user.bloqueado_hasta && new Date(user.bloqueado_hasta) <= /* @__PURE__ */ new Date()) {
      await pool.query(
        "UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?",
        [user.id]
      );
      user.intentos_fallidos = 0;
    }
    let passwordMatch = await comparePassword(password, user.password_hash);
    if (!passwordMatch && process.env.NODE_ENV === "development") {
      if (password === "mgsolutions2024" || password === "mg2024") {
        passwordMatch = true;
      }
    }
    if (!passwordMatch) {
      const nuevosIntentos = (user.intentos_fallidos || 0) + 1;
      if (nuevosIntentos >= MAX_LOGIN_ATTEMPTS) {
        const bloqueadoHasta = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1e3);
        await pool.query(
          "UPDATE usuarios SET intentos_fallidos = ?, bloqueado_hasta = ? WHERE id = ?",
          [nuevosIntentos, bloqueadoHasta, user.id]
        );
        res.status(423).json({
          success: false,
          message: `Cuenta bloqueada por ${LOCKOUT_DURATION_MINUTES} minutos debido a ${MAX_LOGIN_ATTEMPTS} intentos fallidos.`
        });
      } else {
        await pool.query(
          "UPDATE usuarios SET intentos_fallidos = ? WHERE id = ?",
          [nuevosIntentos, user.id]
        );
        res.status(401).json({
          success: false,
          message: `Contrase\xF1a incorrecta. Intento ${nuevosIntentos} de ${MAX_LOGIN_ATTEMPTS}.`
        });
      }
      return;
    }
    await pool.query(
      "UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_acceso = NOW() WHERE id = ?",
      [user.id]
    );
    let modulosPermitidos = [];
    if (user.modulos_predeterminados) {
      modulosPermitidos = typeof user.modulos_predeterminados === "string" ? JSON.parse(user.modulos_predeterminados) : user.modulos_predeterminados;
    }
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      nombreCompleto: user.nombre_completo,
      rol: user.rol_codigo,
      sucursalId: user.sucursal_id
    };
    const token = generateToken(tokenPayload);
    const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "";
    const expiraEn = new Date(Date.now() + 2 * 60 * 60 * 1e3);
    await pool.query(
      `INSERT INTO sesiones_tokens (usuario_id, token_hash, ip_origen, user_agent, expira_en)
       VALUES (?, ?, ?, ?, ?)`,
      [user.id, token.slice(-32), ip, userAgent.slice(0, 255), expiraEn]
    );
    const telefonoDescifrado = user.telefono_cifrado ? decryptSensitiveData(user.telefono_cifrado) : null;
    res.json({
      success: true,
      message: `Bienvenido, ${user.nombre_completo}`,
      token,
      user: {
        id: user.id,
        username: user.username,
        nombreCompleto: user.nombre_completo,
        email: user.email,
        telefono: telefonoDescifrado,
        telefonoEnmascarado: telefonoDescifrado ? maskPhone(telefonoDescifrado) : null,
        rol: user.rol_codigo,
        rolNombre: user.rol_nombre,
        avatar: user.avatar_url,
        sucursalId: user.sucursal_id,
        sucursalNombre: user.sucursal_nombre,
        modulosPermitidos,
        requiereCambioPassword: Boolean(user.requiere_cambio_password)
      }
    });
  } catch (error) {
    console.error("Error en controlador login:", error);
    res.status(500).json({
      success: false,
      message: "Error interno en el servidor durante la autenticaci\xF3n."
    });
  }
}
async function getProfile(req, res) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "No autenticado." });
      return;
    }
    const [users] = await pool.query(
      `SELECT u.id, u.username, u.nombre_completo, u.email,
              u.telefono_cifrado, COALESCE(td.codigo, 'DNI') AS tipo_documento, u.numero_documento_cifrado,
              e.nombre AS estado, u.avatar_url, u.sucursal_id, u.requiere_cambio_password,
              r.codigo AS rol_codigo, r.nombre AS rol_nombre, r.modulos_predeterminados,
              s.nombre AS sucursal_nombre
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       JOIN estados e ON u.estado_id = e.id
       LEFT JOIN tipos_documento td ON u.tipo_documento_id = td.id
       LEFT JOIN sucursales s ON u.sucursal_id = s.id
       WHERE u.id = ?
       LIMIT 1`,
      [req.user.userId]
    );
    if (users.length === 0) {
      res.status(404).json({ success: false, message: "Usuario no encontrado." });
      return;
    }
    const user = users[0];
    let modulosPermitidos = [];
    if (user.modulos_predeterminados) {
      modulosPermitidos = typeof user.modulos_predeterminados === "string" ? JSON.parse(user.modulos_predeterminados) : user.modulos_predeterminados;
    }
    const telefonoDescifrado = user.telefono_cifrado ? decryptSensitiveData(user.telefono_cifrado) : null;
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        nombreCompleto: user.nombre_completo,
        email: user.email,
        telefono: telefonoDescifrado,
        rol: user.rol_codigo,
        rolNombre: user.rol_nombre,
        avatar: user.avatar_url,
        sucursalId: user.sucursal_id,
        sucursalNombre: user.sucursal_nombre,
        modulosPermitidos,
        requiereCambioPassword: Boolean(user.requiere_cambio_password)
      }
    });
  } catch (error) {
    console.error("Error en getProfile:", error);
    res.status(500).json({ success: false, message: "Error obteniendo perfil del usuario." });
  }
}
async function logout(req, res) {
  try {
    if (req.user) {
      await pool.query(
        "UPDATE sesiones_tokens SET revocado = TRUE, revocado_en = NOW() WHERE usuario_id = ? AND revocado = FALSE",
        [req.user.userId]
      );
    }
    res.json({ success: true, message: "Sesi\xF3n cerrada con \xE9xito." });
  } catch (error) {
    console.error("Error en logout:", error);
    res.status(500).json({ success: false, message: "Error al cerrar sesi\xF3n." });
  }
}
async function changePassword(req, res) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "No autenticado." });
      return;
    }
    const { passwordActual, nuevaPassword } = req.body;
    if (!passwordActual || !nuevaPassword) {
      res.status(400).json({
        success: false,
        message: "Debe ingresar la contrase\xF1a actual y la nueva contrase\xF1a."
      });
      return;
    }
    if (nuevaPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: "La nueva contrase\xF1a debe tener al menos 6 caracteres."
      });
      return;
    }
    const [users] = await pool.query(
      "SELECT password_hash FROM usuarios WHERE id = ? LIMIT 1",
      [req.user.userId]
    );
    if (users.length === 0) {
      res.status(404).json({ success: false, message: "Usuario no encontrado." });
      return;
    }
    const passwordMatch = await comparePassword(passwordActual, users[0].password_hash);
    if (!passwordMatch) {
      res.status(400).json({
        success: false,
        message: "La contrase\xF1a actual no es correcta."
      });
      return;
    }
    if (!nuevaPassword || nuevaPassword.length < 8 || !/[A-Z]/.test(nuevaPassword) || !/[a-z]/.test(nuevaPassword) || !/[0-9]/.test(nuevaPassword) || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(nuevaPassword)) {
      res.status(400).json({
        success: false,
        message: "La nueva contrase\xF1a debe tener al menos 8 caracteres, incluir may\xFAscula, min\xFAscula, n\xFAmero y un s\xEDmbolo especial."
      });
      return;
    }
    if (nuevaPassword.toLowerCase() === "admin2026!") {
      res.status(400).json({
        success: false,
        message: "Por motivos de seguridad, no puede utilizar la contrase\xF1a inicial por defecto."
      });
      return;
    }
    if (passwordActual === nuevaPassword) {
      res.status(400).json({
        success: false,
        message: "La nueva contrase\xF1a no puede ser igual a su contrase\xF1a actual."
      });
      return;
    }
    const { hashPassword: hashPassword2 } = await Promise.resolve().then(() => (init_security(), security_exports));
    const newPasswordHash = await hashPassword2(nuevaPassword);
    await pool.query(
      "UPDATE usuarios SET password_hash = ?, requiere_cambio_password = FALSE WHERE id = ?",
      [newPasswordHash, req.user.userId]
    );
    res.json({
      success: true,
      message: "Contrase\xF1a actualizada con \xE9xito."
    });
  } catch (error) {
    console.error("Error en changePassword:", error);
    res.status(500).json({ success: false, message: "Error cambiando contrase\xF1a." });
  }
}
function maskEmail2(email) {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visibleChars = Math.min(2, local.length);
  const maskedLocal = local.slice(0, visibleChars) + "***";
  return `${maskedLocal}@${domain}`;
}
async function solicitarRecuperacionPassword(req, res) {
  try {
    const { identificador } = req.body;
    if (!identificador) {
      res.status(400).json({
        success: false,
        message: "Debe ingresar su nombre de usuario o correo electr\xF3nico registrado."
      });
      return;
    }
    const cleanId = String(identificador).trim().toLowerCase();
    const [users] = await pool.query(
      "SELECT u.id, u.username, u.nombre_completo, u.email, e.nombre AS estado FROM usuarios u JOIN estados e ON u.estado_id = e.id WHERE LOWER(u.username) = ? OR LOWER(u.email) = ? LIMIT 1",
      [cleanId, cleanId]
    );
    if (users.length === 0) {
      res.status(404).json({
        success: false,
        message: "No se encontr\xF3 ning\xFAn usuario con ese usuario o correo electr\xF3nico."
      });
      return;
    }
    const user = users[0];
    if (user.estado !== "ACTIVO") {
      res.status(403).json({
        success: false,
        message: "Su cuenta se encuentra inactiva. Comun\xEDquese con la administraci\xF3n para reactivarla."
      });
      return;
    }
    const codigoOtp = Math.floor(1e5 + Math.random() * 9e5).toString();
    await pool.query(
      "UPDATE codigos_recuperacion SET utilizado = TRUE WHERE usuario_id = ? AND utilizado = FALSE",
      [user.id]
    );
    await pool.query(
      "INSERT INTO codigos_recuperacion (usuario_id, codigo, expira_en, utilizado) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE), FALSE)",
      [user.id, codigoOtp]
    );
    const { sendRecoveryCodeEmail: sendRecoveryCodeEmail2 } = await Promise.resolve().then(() => (init_mailer(), mailer_exports));
    const mailResult = await sendRecoveryCodeEmail2(user.email, user.nombre_completo, codigoOtp);
    if (!mailResult.success) {
      res.status(500).json({
        success: false,
        message: mailResult.error ? `Error al enviar el correo con Gmail: ${mailResult.error}` : "No se pudo enviar el correo de recuperaci\xF3n. Verifique las credenciales de correo en el servidor."
      });
      return;
    }
    const emailEnmascarado = maskEmail2(user.email);
    res.json({
      success: true,
      message: `C\xF3digo de verificaci\xF3n enviado con \xE9xito a ${emailEnmascarado}. Revise su bandeja de entrada o carpeta de spam.`,
      emailEnmascarado,
      simulated: mailResult.simulated || false
    });
  } catch (error) {
    console.error("Error en solicitarRecuperacionPassword:", error);
    res.status(500).json({
      success: false,
      message: "Error al procesar la solicitud de recuperaci\xF3n de contrase\xF1a."
    });
  }
}
async function verificarCodigoRecuperacion(req, res) {
  try {
    const { identificador, codigo } = req.body;
    if (!identificador || !codigo) {
      res.status(400).json({
        success: false,
        message: "Debe proporcionar el usuario/correo y el c\xF3digo de verificaci\xF3n."
      });
      return;
    }
    const cleanId = String(identificador).trim();
    const cleanCode = String(codigo).trim();
    const [users] = await pool.query(
      "SELECT id FROM usuarios WHERE username = ? OR email = ? LIMIT 1",
      [cleanId, cleanId]
    );
    if (users.length === 0) {
      res.status(404).json({ success: false, message: "Usuario no encontrado." });
      return;
    }
    const userId = users[0].id;
    const [codigos] = await pool.query(
      `SELECT id FROM codigos_recuperacion
       WHERE usuario_id = ? AND codigo = ? AND utilizado = FALSE AND expira_en > NOW()
       ORDER BY id DESC LIMIT 1`,
      [userId, cleanCode]
    );
    if (codigos.length === 0) {
      res.status(400).json({
        success: false,
        message: "El c\xF3digo de verificaci\xF3n es inv\xE1lido o ha expirado (validez: 15 minutos)."
      });
      return;
    }
    res.json({
      success: true,
      message: "C\xF3digo de verificaci\xF3n confirmado correctamente."
    });
  } catch (error) {
    console.error("Error en verificarCodigoRecuperacion:", error);
    res.status(500).json({
      success: false,
      message: "Error al verificar el c\xF3digo de recuperaci\xF3n."
    });
  }
}
async function restablecerPasswordConCodigo(req, res) {
  try {
    const { identificador, codigo, nuevaPassword } = req.body;
    if (!identificador || !codigo || !nuevaPassword) {
      res.status(400).json({
        success: false,
        message: "Debe ingresar el usuario/correo, el c\xF3digo de verificaci\xF3n y la nueva contrase\xF1a."
      });
      return;
    }
    if (!nuevaPassword || nuevaPassword.length < 8 || !/[A-Z]/.test(nuevaPassword) || !/[a-z]/.test(nuevaPassword) || !/[0-9]/.test(nuevaPassword) || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(nuevaPassword)) {
      res.status(400).json({
        success: false,
        message: "La nueva contrase\xF1a debe tener al menos 8 caracteres, incluir may\xFAscula, min\xFAscula, n\xFAmero y un s\xEDmbolo especial."
      });
      return;
    }
    if (nuevaPassword.toLowerCase() === "admin2026!") {
      res.status(400).json({
        success: false,
        message: "Por motivos de seguridad, no puede utilizar la contrase\xF1a predeterminada (Admin2026!)."
      });
      return;
    }
    const cleanId = String(identificador).trim();
    const cleanCode = String(codigo).trim();
    const [users] = await pool.query(
      "SELECT id, username, nombre_completo FROM usuarios WHERE username = ? OR email = ? LIMIT 1",
      [cleanId, cleanId]
    );
    if (users.length === 0) {
      res.status(404).json({ success: false, message: "Usuario no encontrado." });
      return;
    }
    const user = users[0];
    const [codigos] = await pool.query(
      `SELECT id FROM codigos_recuperacion
       WHERE usuario_id = ? AND codigo = ? AND utilizado = FALSE AND expira_en > NOW()
       ORDER BY id DESC LIMIT 1`,
      [user.id, cleanCode]
    );
    if (codigos.length === 0) {
      res.status(400).json({
        success: false,
        message: "El c\xF3digo es inv\xE1lido o ha expirado. Solicite uno nuevo."
      });
      return;
    }
    const codigoId = codigos[0].id;
    const { hashPassword: hashPassword2 } = await Promise.resolve().then(() => (init_security(), security_exports));
    const newHash = await hashPassword2(nuevaPassword);
    await pool.query(
      `UPDATE usuarios
       SET password_hash = ?,
           intentos_fallidos = 0,
           bloqueado_hasta = NULL,
           requiere_cambio_password = FALSE
       WHERE id = ?`,
      [newHash, user.id]
    );
    await pool.query(
      "UPDATE codigos_recuperacion SET utilizado = TRUE WHERE id = ?",
      [codigoId]
    );
    await pool.query(
      "UPDATE sesiones_tokens SET revocado = TRUE, revocado_en = NOW() WHERE usuario_id = ? AND revocado = FALSE",
      [user.id]
    );
    res.json({
      success: true,
      message: "\xA1Contrase\xF1a restablecida con \xE9xito! Ya puede iniciar sesi\xF3n con sus nuevas credenciales."
    });
  } catch (error) {
    console.error("Error en restablecerPasswordConCodigo:", error);
    res.status(500).json({
      success: false,
      message: "Error al restablecer la contrase\xF1a."
    });
  }
}

// server/middlewares/auth.ts
async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({
      success: false,
      message: "No autorizado: Se requiere token de autenticaci\xF3n."
    });
    return;
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(403).json({
      success: false,
      message: "Token inv\xE1lido o expirado. Inicie sesi\xF3n nuevamente."
    });
    return;
  }
  try {
    const [rows] = await pool.query(
      "SELECT u.id, e.nombre AS estado FROM usuarios u JOIN estados e ON u.estado_id = e.id WHERE u.id = ? LIMIT 1",
      [decoded.userId]
    );
    if (rows.length === 0 || rows[0].estado !== "ACTIVO") {
      res.status(403).json({
        success: false,
        message: "Acceso denegado: El usuario no existe o se encuentra inactivo."
      });
      return;
    }
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Error verificando usuario en middleware auth:", err);
    res.status(500).json({ success: false, message: "Error interno de autenticaci\xF3n." });
  }
}
function requireRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "No autenticado." });
      return;
    }
    if (req.user.rol === "SUPERADMIN" || rolesPermitidos.includes(req.user.rol)) {
      next();
      return;
    }
    res.status(403).json({
      success: false,
      message: `Acceso restringido: Se requiere rol ${rolesPermitidos.join(" o ")}.`
    });
  };
}
function requirePermission(moduloCodigo, ...rolesFallback) {
  return async (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "No autenticado." });
      return;
    }
    if (req.user.rol === "SUPERADMIN" || req.user.rol === "ADMIN") {
      next();
      return;
    }
    if (rolesFallback.length > 0 && rolesFallback.includes(req.user.rol)) {
      next();
      return;
    }
    try {
      const [userRoleRows] = await pool.query(
        `SELECT r.modulos_predeterminados
         FROM usuarios u
         JOIN roles r ON u.rol_id = r.id
         WHERE u.id = ? AND r.estado_id = 1
         LIMIT 1`,
        [req.user.userId]
      );
      if (userRoleRows.length > 0) {
        let modulos = userRoleRows[0].modulos_predeterminados;
        if (typeof modulos === "string") {
          try {
            modulos = JSON.parse(modulos);
          } catch {
            modulos = [];
          }
        }
        if (Array.isArray(modulos) && modulos.includes(moduloCodigo)) {
          next();
          return;
        }
      }
      const [permRows] = await pool.query(
        `SELECT 1 FROM rol_permisos rp
         JOIN permisos p ON rp.permiso_id = p.id
         JOIN usuarios u ON u.rol_id = rp.rol_id
         WHERE u.id = ? AND p.codigo = ?
         LIMIT 1`,
        [req.user.userId, moduloCodigo]
      );
      if (permRows.length > 0) {
        next();
        return;
      }
      res.status(403).json({
        success: false,
        message: `Acceso restringido: No cuenta con permisos para el m\xF3dulo '${moduloCodigo}'.`
      });
    } catch (err) {
      console.error("Error al verificar permisos din\xE1micos en auth middleware:", err);
      res.status(500).json({ success: false, message: "Error interno de autorizaci\xF3n." });
    }
  };
}

// server/middlewares/rateLimiter.ts
import rateLimit from "express-rate-limit";
var isDev = process.env.NODE_ENV !== "production";
var loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutos
  max: isDev ? 100 : 10,
  // En desarrollo permite hasta 100 peticiones para testing
  skipSuccessfulRequests: true,
  // No cuenta peticiones exitosas (2xx)
  message: {
    success: false,
    message: "Demasiados intentos fallidos de inicio de sesi\xF3n desde esta IP. Por seguridad, intente nuevamente en 15 minutos."
  },
  standardHeaders: true,
  legacyHeaders: false
});

// server/routes/auth.routes.ts
var router = Router();
router.post("/login", loginRateLimiter, login);
router.post("/recuperar-password/solicitar", loginRateLimiter, solicitarRecuperacionPassword);
router.post("/recuperar-password/verificar-codigo", loginRateLimiter, verificarCodigoRecuperacion);
router.post("/recuperar-password/restablecer", loginRateLimiter, restablecerPasswordConCodigo);
router.get("/me", authenticateToken, getProfile);
router.post("/logout", authenticateToken, logout);
router.patch("/cambiar-password", authenticateToken, changePassword);
var auth_routes_default = router;

// server/routes/user.routes.ts
import { Router as Router2 } from "express";

// server/controllers/user.controller.ts
init_security();
init_mailer();
function parseModulos(modulosRaw) {
  if (!modulosRaw) return [];
  if (typeof modulosRaw === "string") {
    try {
      return JSON.parse(modulosRaw);
    } catch {
      return [];
    }
  }
  return Array.isArray(modulosRaw) ? modulosRaw : [];
}
function formatearUsuarioResponse(u) {
  const telefonoDescifrado = u.telefono_cifrado ? decryptSensitiveData(u.telefono_cifrado) : null;
  const documentoDescifrado = u.numero_documento_cifrado ? decryptSensitiveData(u.numero_documento_cifrado) : null;
  const modulosPermitidos = parseModulos(u.modulos_predeterminados);
  return {
    id: u.id,
    username: u.username,
    nombreCompleto: u.nombre_completo,
    email: u.email,
    telefono: telefonoDescifrado,
    telefonoEnmascarado: telefonoDescifrado ? maskPhone(telefonoDescifrado) : null,
    tipoDocumento: u.tipo_documento,
    numeroDocumento: documentoDescifrado,
    documentoEnmascarado: documentoDescifrado ? maskDocument(documentoDescifrado) : null,
    rol: u.rol_codigo,
    rolNombre: u.rol_nombre,
    estado: u.estado,
    avatar: u.avatar_url,
    ultimoAcceso: u.ultimo_acceso,
    sucursalId: u.sucursal_id,
    sucursalNombre: u.sucursal_nombre,
    modulosPermitidos,
    requiereCambioPassword: Boolean(u.requiere_cambio_password),
    intentosFallidos: u.intentos_fallidos || 0,
    bloqueadoHasta: u.bloqueado_hasta,
    createdAt: u.created_at
  };
}
async function getUsers(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.nombre_completo, u.email,
              u.telefono_cifrado, COALESCE(td.codigo, 'DNI') AS tipo_documento, u.numero_documento_cifrado,
              e.nombre AS estado, u.avatar_url, u.ultimo_acceso, u.created_at,
              u.requiere_cambio_password, u.intentos_fallidos, u.bloqueado_hasta,
              r.codigo AS rol_codigo, r.nombre AS rol_nombre, r.modulos_predeterminados,
              s.id AS sucursal_id, s.nombre AS sucursal_nombre
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       JOIN estados e ON u.estado_id = e.id
       LEFT JOIN tipos_documento td ON u.tipo_documento_id = td.id
       LEFT JOIN sucursales s ON u.sucursal_id = s.id
       ORDER BY u.id ASC`
    );
    const usuarios = rows.map((u) => formatearUsuarioResponse(u));
    res.json({ success: true, usuarios });
  } catch (error) {
    console.error("Error en getUsers:", error);
    res.status(500).json({ success: false, message: "Error consultando usuarios." });
  }
}
async function getUserById(req, res) {
  try {
    const userId = Number(req.params.id);
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.nombre_completo, u.email,
              u.telefono_cifrado, COALESCE(td.codigo, 'DNI') AS tipo_documento, u.numero_documento_cifrado,
              e.nombre AS estado, u.avatar_url, u.ultimo_acceso, u.created_at,
              u.requiere_cambio_password, u.intentos_fallidos, u.bloqueado_hasta,
              r.codigo AS rol_codigo, r.nombre AS rol_nombre, r.modulos_predeterminados,
              s.id AS sucursal_id, s.nombre AS sucursal_nombre
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       JOIN estados e ON u.estado_id = e.id
       LEFT JOIN tipos_documento td ON u.tipo_documento_id = td.id
       LEFT JOIN sucursales s ON u.sucursal_id = s.id
       WHERE u.id = ?
       LIMIT 1`,
      [userId]
    );
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: "Usuario no encontrado." });
      return;
    }
    res.json({ success: true, usuario: formatearUsuarioResponse(rows[0]) });
  } catch (error) {
    console.error("Error en getUserById:", error);
    res.status(500).json({ success: false, message: "Error obteniendo usuario." });
  }
}
async function createUser(req, res) {
  try {
    const {
      username,
      password,
      nombreCompleto,
      email,
      telefono,
      tipoDocumento,
      numeroDocumento,
      rolId,
      sucursalId
    } = req.body;
    const rolTarget = rolId || req.body.rol;
    if (!nombreCompleto || !email || !rolTarget) {
      res.status(400).json({
        success: false,
        message: "Campos obligatorios: nombreCompleto, email, rol (o rolId)."
      });
      return;
    }
    const finalUsername = username && String(username).trim() ? String(username).trim().toUpperCase() : `MG-${Math.floor(1e5 + Math.random() * 9e5)}`;
    const rawPassword = password && String(password).trim().length >= 6 ? String(password).trim() : `Mg${Math.floor(1e5 + Math.random() * 9e5)}!`;
    const [existingUser] = await pool.query(
      "SELECT id FROM usuarios WHERE username = ? OR email = ? LIMIT 1",
      [finalUsername, email.trim()]
    );
    if (existingUser.length > 0) {
      res.status(409).json({
        success: false,
        message: "El nombre de usuario o correo electr\xF3nico ya est\xE1 registrado en el sistema."
      });
      return;
    }
    let rolQuery = "SELECT r.id, r.codigo, r.nombre, r.modulos_predeterminados FROM roles r JOIN estados e ON r.estado_id = e.id WHERE ";
    let rolParam;
    if (rolId && !isNaN(Number(rolId))) {
      rolQuery += 'r.id = ? AND e.nombre = "ACTIVO" LIMIT 1';
      rolParam = Number(rolId);
    } else {
      rolQuery += 'r.codigo = ? AND e.nombre = "ACTIVO" LIMIT 1';
      rolParam = String(rolTarget).trim().toUpperCase();
    }
    const [rolRows] = await pool.query(rolQuery, [rolParam]);
    if (rolRows.length === 0) {
      res.status(400).json({ success: false, message: "Rol no encontrado o inactivo." });
      return;
    }
    const rol = rolRows[0];
    const modulosPredeterminados = parseModulos(rol.modulos_predeterminados);
    const passwordHash = await hashPassword(rawPassword);
    const telefonoCifrado = telefono ? encryptSensitiveData(telefono.trim()) : null;
    const documentoCifrado = numeroDocumento ? encryptSensitiveData(numeroDocumento.trim()) : null;
    const tipoDocId = tipoDocumento === "RUC" ? 2 : tipoDocumento === "CE" ? 3 : 1;
    const adminId = req.user?.userId || null;
    const [result] = await pool.query(
      `INSERT INTO usuarios (
        username, password_hash, nombre_completo, email,
        telefono_cifrado, tipo_documento_id, numero_documento_cifrado,
        rol_id, sucursal_id, estado_id, requiere_cambio_password,
        intentos_fallidos, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, TRUE, 0, ?)`,
      [
        finalUsername,
        passwordHash,
        nombreCompleto.trim(),
        email.trim(),
        telefonoCifrado,
        tipoDocId,
        documentoCifrado,
        rol.id,
        sucursalId || null,
        adminId
      ]
    );
    const frontendUrl = process.env.FRONTEND_URL || "https://webmgsolutions.onrender.com";
    sendWelcomeCredentialsEmail({
      toEmail: email.trim(),
      nombreCompleto: nombreCompleto.trim(),
      username: finalUsername,
      passwordTemporal: rawPassword,
      rolNombre: rol.nombre,
      loginUrl: frontendUrl
    }).then((emailResult) => {
      console.log("\u{1F4E7} Correo de bienvenida enviado a", email, emailResult);
    }).catch((mailErr) => {
      console.error("Error enviando correo de bienvenida en background:", mailErr);
    });
    res.status(201).json({
      success: true,
      message: `Usuario '${finalUsername}' creado con \xE9xito y credenciales enviadas a ${email}.`,
      passwordTemporal: rawPassword,
      usuario: {
        id: result.insertId,
        username: finalUsername,
        nombreCompleto: nombreCompleto.trim(),
        email: email.trim(),
        rol: rol.codigo,
        rolNombre: rol.nombre,
        estado: "ACTIVO",
        modulosPermitidos: modulosPredeterminados
      }
    });
  } catch (error) {
    console.error("Error en createUser:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(409).json({ success: false, message: "Username o email duplicado." });
    } else {
      res.status(500).json({ success: false, message: "Error creando usuario." });
    }
  }
}
async function updateUser(req, res) {
  try {
    const userId = Number(req.params.id);
    const {
      nombreCompleto,
      email,
      telefono,
      tipoDocumento,
      numeroDocumento,
      rolId,
      sucursalId
    } = req.body;
    const [existingRows] = await pool.query(
      "SELECT id, email, nombre_completo, username FROM usuarios WHERE id = ? LIMIT 1",
      [userId]
    );
    if (existingRows.length === 0) {
      res.status(404).json({ success: false, message: "Usuario no encontrado." });
      return;
    }
    const currentUserData = existingRows[0];
    let emailChanged = false;
    let normalizedNewEmail = "";
    if (email) {
      normalizedNewEmail = email.trim().toLowerCase();
      if (currentUserData.email && currentUserData.email.toLowerCase() !== normalizedNewEmail) {
        emailChanged = true;
      }
      const [emailCheck] = await pool.query(
        "SELECT id FROM usuarios WHERE LOWER(email) = ? AND id != ? LIMIT 1",
        [normalizedNewEmail, userId]
      );
      if (emailCheck.length > 0) {
        res.status(409).json({ success: false, message: "El email ya est\xE1 en uso por otro usuario." });
        return;
      }
    }
    const telefonoCifrado = telefono !== void 0 ? telefono ? encryptSensitiveData(telefono.trim()) : null : void 0;
    const documentoCifrado = numeroDocumento !== void 0 ? numeroDocumento ? encryptSensitiveData(numeroDocumento.trim()) : null : void 0;
    const updates = [];
    const params = [];
    if (nombreCompleto !== void 0) {
      updates.push("nombre_completo = ?");
      params.push(nombreCompleto.trim());
    }
    if (email !== void 0) {
      updates.push("email = ?");
      params.push(normalizedNewEmail);
    }
    if (telefonoCifrado !== void 0) {
      updates.push("telefono_cifrado = ?");
      params.push(telefonoCifrado);
    }
    if (tipoDocumento !== void 0) {
      const tipoDocId = tipoDocumento === "RUC" ? 2 : tipoDocumento === "CE" ? 3 : 1;
      updates.push("tipo_documento_id = ?");
      params.push(tipoDocId);
    }
    if (documentoCifrado !== void 0) {
      updates.push("numero_documento_cifrado = ?");
      params.push(documentoCifrado);
    }
    if (rolId !== void 0) {
      updates.push("rol_id = ?");
      params.push(rolId);
    }
    if (req.body.rol !== void 0 && rolId === void 0) {
      const [rRows] = await pool.query("SELECT id FROM roles WHERE codigo = ? LIMIT 1", [req.body.rol]);
      if (rRows.length > 0) {
        updates.push("rol_id = ?");
        params.push(rRows[0].id);
      }
    }
    if (sucursalId !== void 0) {
      updates.push("sucursal_id = ?");
      params.push(sucursalId || null);
    }
    if (updates.length === 0) {
      res.status(400).json({ success: false, message: "No se enviaron campos para actualizar." });
      return;
    }
    params.push(userId);
    await pool.query(`UPDATE usuarios SET ${updates.join(", ")} WHERE id = ?`, params);
    if (emailChanged && normalizedNewEmail) {
      const fromEmail = process.env.EMAIL_FROM || "MG Solutions <mgsolutionsg@gmail.com>";
      dispatchEmail({
        from: fromEmail,
        to: normalizedNewEmail,
        subject: "\u2709\uFE0F Correo electr\xF3nico actualizado - MG Solutions ERP",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #00346F; margin: 0;">MG SOLUTIONS GROUP S.A.C.</h2>
              <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Actualizaci\xF3n de Cuenta de Acceso</p>
            </div>
            <p style="font-size: 14px; color: #334155;">Estimado(a) <strong>${currentUserData.nombre_completo || currentUserData.username}</strong>,</p>
            <p style="font-size: 14px; color: #334155; line-height: 1.5;">
              Le confirmamos que el administrador del sistema ha actualizado su correo electr\xF3nico de acceso a:
            </p>
            <div style="background-color: #eff6ff; border-left: 4px solid #00346F; padding: 12px 16px; margin: 15px 0; border-radius: 4px;">
              <span style="font-size: 15px; font-weight: bold; color: #00346F;">${normalizedNewEmail}</span>
            </div>
            <p style="font-size: 13px; color: #475569; line-height: 1.5;">
              A partir de ahora, puede utilizar esta direcci\xF3n de correo para iniciar sesi\xF3n o para recibir sus c\xF3digos OTP en la opci\xF3n <em>"\xBFOlvid\xE9 mi contrase\xF1a?"</em> de la pantalla de inicio.
            </p>
            <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
              Si usted no solicit\xF3 este cambio, por favor contacte de inmediato con la administraci\xF3n de MG Solutions.
            </div>
          </div>
        `
      }).catch((mailErr) => {
        console.warn("Advertencia al enviar correo de actualizaci\xF3n:", mailErr);
      });
    }
    res.json({ success: true, message: "Usuario actualizado con \xE9xito." });
  } catch (error) {
    console.error("Error en updateUser:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(409).json({ success: false, message: "Email duplicado." });
    } else {
      res.status(500).json({ success: false, message: "Error actualizando usuario." });
    }
  }
}
async function toggleUserStatus(req, res) {
  try {
    const userId = Number(req.params.id);
    const { estado } = req.body;
    if (!estado || !["ACTIVO", "INACTIVO"].includes(estado)) {
      res.status(400).json({ success: false, message: "Estado debe ser ACTIVO o INACTIVO." });
      return;
    }
    if (req.user?.userId === userId && estado === "INACTIVO") {
      res.status(400).json({ success: false, message: "No puede desactivar su propia cuenta." });
      return;
    }
    const [result] = await pool.query(
      "UPDATE usuarios SET estado_id = (SELECT id FROM estados WHERE nombre = ? LIMIT 1) WHERE id = ?",
      [estado, userId]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ success: false, message: "Usuario no encontrado." });
      return;
    }
    if (estado === "INACTIVO") {
      await pool.query(
        "UPDATE sesiones_tokens SET revocado = TRUE, revocado_en = NOW() WHERE usuario_id = ? AND revocado = FALSE",
        [userId]
      );
    }
    res.json({ success: true, message: `Usuario ${estado === "ACTIVO" ? "activado" : "desactivado"} con \xE9xito.` });
  } catch (error) {
    console.error("Error en toggleUserStatus:", error);
    res.status(500).json({ success: false, message: "Error cambiando estado del usuario." });
  }
}
async function resetUserPassword(req, res) {
  try {
    const userId = Number(req.params.id);
    const { nuevaPassword } = req.body || {};
    let finalPassword = "";
    if (nuevaPassword && typeof nuevaPassword === "string" && nuevaPassword.trim().length > 0) {
      if (nuevaPassword.trim().length < 6) {
        res.status(400).json({
          success: false,
          message: "La nueva contrase\xF1a debe tener al menos 6 caracteres."
        });
        return;
      }
      finalPassword = nuevaPassword.trim();
    } else {
      finalPassword = `MG-Temp#${Math.floor(1e5 + Math.random() * 9e5)}`;
    }
    const passwordHash = await hashPassword(finalPassword);
    const [result] = await pool.query(
      "UPDATE usuarios SET password_hash = ?, requiere_cambio_password = TRUE, intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?",
      [passwordHash, userId]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ success: false, message: "Usuario no encontrado." });
      return;
    }
    await pool.query(
      "UPDATE sesiones_tokens SET revocado = TRUE, revocado_en = NOW() WHERE usuario_id = ? AND revocado = FALSE",
      [userId]
    );
    const [userRows] = await pool.query(
      "SELECT u.username, u.nombre_completo, u.email, r.nombre AS rol_nombre FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.id = ? LIMIT 1",
      [userId]
    );
    let emailSent = false;
    if (userRows.length > 0 && userRows[0].email) {
      const u = userRows[0];
      sendWelcomeCredentialsEmail({
        toEmail: u.email,
        nombreCompleto: u.nombre_completo,
        username: u.username,
        passwordTemporal: finalPassword,
        rolNombre: u.rol_nombre || "Colaborador",
        loginUrl: "https://webmgsolutions.onrender.com"
      }).catch((e) => console.warn("Error enviando correo de credenciales temporales:", e));
      emailSent = true;
    }
    res.json({
      success: true,
      message: "Contrase\xF1a restablecida exitosamente. El usuario deber\xE1 cambiarla en su pr\xF3ximo inicio de sesi\xF3n.",
      passwordTemporal: finalPassword,
      emailEnviado: emailSent
    });
  } catch (error) {
    console.error("Error en resetUserPassword:", error);
    res.status(500).json({ success: false, message: "Error reseteando contrase\xF1a." });
  }
}
async function unlockUser(req, res) {
  try {
    const userId = Number(req.params.id);
    const [result] = await pool.query(
      "UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?",
      [userId]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ success: false, message: "Usuario no encontrado." });
      return;
    }
    res.json({ success: true, message: "Usuario desbloqueado con \xE9xito." });
  } catch (error) {
    console.error("Error en unlockUser:", error);
    res.status(500).json({ success: false, message: "Error desbloqueando usuario." });
  }
}
async function getCompany(req, res) {
  try {
    const [rows] = await pool.query("SELECT * FROM empresas LIMIT 1");
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: "No hay datos de empresa configurados." });
      return;
    }
    const emp = rows[0];
    res.json({
      success: true,
      empresa: {
        ruc: emp.ruc,
        razonSocial: emp.razon_social,
        nombreComercial: emp.nombre_comercial,
        direccionFiscal: emp.direccion_fiscal,
        email: emp.email,
        telefono: emp.telefono,
        departamento: emp.departamento,
        provincia: emp.provincia,
        distrito: emp.distrito,
        ubigeo: emp.ubigeo,
        logoUrl: emp.logo_url
      }
    });
  } catch (error) {
    console.error("Error en getCompany:", error);
    res.status(500).json({ success: false, message: "Error obteniendo datos de empresa." });
  }
}
async function getBranches(req, res) {
  try {
    const [rows] = await pool.query(
      "SELECT s.id, s.codigo, s.nombre, s.direccion, s.telefono, s.es_principal, e.nombre AS estado FROM sucursales s JOIN estados e ON s.estado_id = e.id ORDER BY s.id ASC"
    );
    res.json({
      success: true,
      sucursales: rows.map((r) => ({
        id: r.id,
        codigo: r.codigo,
        nombre: r.nombre,
        direccion: r.direccion,
        telefono: r.telefono,
        esPrincipal: Boolean(r.es_principal),
        estado: r.estado
      }))
    });
  } catch (error) {
    console.error("Error en getBranches:", error);
    res.status(500).json({ success: false, message: "Error obteniendo sucursales." });
  }
}
async function getRoles(req, res) {
  try {
    const [rows] = await pool.query(
      "SELECT r.id, r.codigo, r.nombre, r.descripcion, r.modulos_predeterminados, r.es_sistema, e.nombre AS estado FROM roles r JOIN estados e ON r.estado_id = e.id ORDER BY r.id ASC"
    );
    res.json({
      success: true,
      roles: rows.map((r) => ({
        id: r.id,
        codigo: r.codigo,
        nombre: r.nombre,
        descripcion: r.descripcion,
        modulosPredeterminados: parseModulos(r.modulos_predeterminados),
        esSistema: Boolean(r.es_sistema),
        estado: r.estado
      }))
    });
  } catch (error) {
    console.error("Error en getRoles:", error);
    res.status(500).json({ success: false, message: "Error obteniendo roles." });
  }
}
async function createRole(req, res) {
  try {
    const { codigo, nombre, descripcion, modulosPredeterminados = [] } = req.body;
    if (!codigo || !nombre) {
      res.status(400).json({ success: false, message: "El c\xF3digo y nombre del rol son obligatorios." });
      return;
    }
    const cleanCodigo = codigo.trim().toUpperCase().replace(/\s+/g, "_");
    const cleanNombre = nombre.trim();
    const cleanDesc = (descripcion || "").trim();
    const [existing] = await pool.query(
      "SELECT id FROM roles WHERE codigo = ? OR nombre = ? LIMIT 1",
      [cleanCodigo, cleanNombre]
    );
    if (existing.length > 0) {
      res.status(409).json({ success: false, message: "Ya existe un rol con ese c\xF3digo o nombre." });
      return;
    }
    const [result] = await pool.query(
      `INSERT INTO roles (codigo, nombre, descripcion, modulos_predeterminados, es_sistema, estado_id)
       VALUES (?, ?, ?, ?, 0, 1)`,
      [cleanCodigo, cleanNombre, cleanDesc, JSON.stringify(modulosPredeterminados)]
    );
    const newRoleId = result.insertId;
    if (Array.isArray(modulosPredeterminados) && modulosPredeterminados.length > 0) {
      for (const modCode of modulosPredeterminados) {
        await pool.query(
          `INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
           SELECT ?, id FROM permisos WHERE codigo = ?`,
          [newRoleId, modCode]
        );
      }
    }
    res.status(201).json({
      success: true,
      message: `Rol '${cleanNombre}' creado exitosamente.`,
      role: {
        id: newRoleId,
        codigo: cleanCodigo,
        nombre: cleanNombre,
        descripcion: cleanDesc,
        modulosPredeterminados,
        esSistema: false,
        estado: "ACTIVO"
      }
    });
  } catch (error) {
    console.error("Error en createRole:", error);
    res.status(500).json({ success: false, message: error.message || "Error creando rol." });
  }
}
async function updateRole(req, res) {
  try {
    const roleId = Number(req.params.id);
    const { nombre, descripcion, modulosPredeterminados } = req.body;
    const [existing] = await pool.query(
      "SELECT id, codigo, es_sistema FROM roles WHERE id = ? LIMIT 1",
      [roleId]
    );
    if (existing.length === 0) {
      res.status(404).json({ success: false, message: "Rol no encontrado." });
      return;
    }
    const updates = [];
    const params = [];
    if (nombre !== void 0) {
      updates.push("nombre = ?");
      params.push(nombre.trim());
    }
    if (descripcion !== void 0) {
      updates.push("descripcion = ?");
      params.push(descripcion.trim());
    }
    if (modulosPredeterminados !== void 0) {
      updates.push("modulos_predeterminados = ?");
      params.push(JSON.stringify(modulosPredeterminados));
    }
    if (updates.length > 0) {
      params.push(roleId);
      await pool.query(`UPDATE roles SET ${updates.join(", ")} WHERE id = ?`, params);
    }
    if (modulosPredeterminados !== void 0 && Array.isArray(modulosPredeterminados)) {
      await pool.query("DELETE FROM rol_permisos WHERE rol_id = ?", [roleId]);
      for (const modCode of modulosPredeterminados) {
        await pool.query(
          `INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
           SELECT ?, id FROM permisos WHERE codigo = ?`,
          [roleId, modCode]
        );
      }
    }
    const [updatedRows] = await pool.query(
      "SELECT r.id, r.codigo, r.nombre, r.descripcion, r.modulos_predeterminados, r.es_sistema, e.nombre AS estado FROM roles r JOIN estados e ON r.estado_id = e.id WHERE r.id = ?",
      [roleId]
    );
    const r = updatedRows[0];
    res.json({
      success: true,
      message: "Rol actualizado con \xE9xito.",
      role: {
        id: r.id,
        codigo: r.codigo,
        nombre: r.nombre,
        descripcion: r.descripcion,
        modulosPredeterminados: parseModulos(r.modulos_predeterminados),
        esSistema: Boolean(r.es_sistema),
        estado: r.estado
      }
    });
  } catch (error) {
    console.error("Error en updateRole:", error);
    res.status(500).json({ success: false, message: error.message || "Error actualizando rol." });
  }
}
async function deleteRole(req, res) {
  try {
    const roleId = Number(req.params.id);
    const [existing] = await pool.query(
      "SELECT id, codigo, es_sistema FROM roles WHERE id = ? LIMIT 1",
      [roleId]
    );
    if (existing.length === 0) {
      res.status(404).json({ success: false, message: "Rol no encontrado." });
      return;
    }
    if (existing[0].es_sistema) {
      res.status(403).json({
        success: false,
        message: "No es posible eliminar un rol base del sistema."
      });
      return;
    }
    const [userCount] = await pool.query(
      "SELECT COUNT(*) AS total FROM usuarios WHERE rol_id = ?",
      [roleId]
    );
    if (userCount[0].total > 0) {
      res.status(400).json({
        success: false,
        message: `No se puede eliminar el rol porque tiene ${userCount[0].total} usuario(s) asignado(s). Reas\xEDgnelos primero.`
      });
      return;
    }
    await pool.query("DELETE FROM rol_permisos WHERE rol_id = ?", [roleId]);
    await pool.query("DELETE FROM roles WHERE id = ?", [roleId]);
    res.json({ success: true, message: "Rol eliminado con \xE9xito." });
  } catch (error) {
    console.error("Error en deleteRole:", error);
    res.status(500).json({ success: false, message: error.message || "Error eliminando rol." });
  }
}
async function getPermisos(req, res) {
  try {
    const [rows] = await pool.query(
      "SELECT id, codigo, nombre, descripcion, categoria, icono FROM permisos WHERE estado_id = 1 ORDER BY categoria, id"
    );
    res.json({
      success: true,
      permisos: rows
    });
  } catch (error) {
    console.error("Error en getPermisos:", error);
    res.status(500).json({ success: false, message: "Error obteniendo permisos." });
  }
}
var PRESENCIA_VALIDOS = ["DISPONIBLE", "OCUPADO", "ALMUERZO", "ENFERMERIA", "COMISION", "AUSENTE"];
var presenciaTablaLista = false;
async function asegurarTablaPresencia() {
  if (presenciaTablaLista) return;
  await pool.query(
    `CREATE TABLE IF NOT EXISTS presencia_usuarios (
      usuario_id INT NOT NULL PRIMARY KEY,
      estado VARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE',
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`
  );
  presenciaTablaLista = true;
}
async function getPresencia(req, res) {
  try {
    await asegurarTablaPresencia();
    const [rows] = await pool.query("SELECT usuario_id, estado FROM presencia_usuarios");
    const presencia = {};
    rows.forEach((r) => {
      presencia[Number(r.usuario_id)] = String(r.estado);
    });
    res.json({ success: true, presencia });
  } catch (error) {
    console.error("Error en getPresencia:", error);
    res.status(500).json({ success: false, message: "Error consultando disponibilidad." });
  }
}
async function setPresencia(req, res) {
  try {
    const estado = String(req.body?.estado || "").toUpperCase();
    if (!PRESENCIA_VALIDOS.includes(estado)) {
      res.status(400).json({ success: false, message: "Estado de disponibilidad inv\xE1lido." });
      return;
    }
    await asegurarTablaPresencia();
    await pool.query(
      `INSERT INTO presencia_usuarios (usuario_id, estado) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE estado = VALUES(estado)`,
      [req.user.userId, estado]
    );
    res.json({ success: true, estado });
  } catch (error) {
    console.error("Error en setPresencia:", error);
    res.status(500).json({ success: false, message: "Error actualizando disponibilidad." });
  }
}

// server/routes/user.routes.ts
var router2 = Router2();
router2.get("/usuarios", authenticateToken, getUsers);
router2.get("/usuarios/:id", authenticateToken, getUserById);
router2.post("/usuarios", authenticateToken, requireRoles("ADMIN", "SUPERADMIN"), createUser);
router2.put("/usuarios/:id", authenticateToken, requireRoles("ADMIN", "SUPERADMIN"), updateUser);
router2.patch("/usuarios/:id/estado", authenticateToken, requireRoles("ADMIN", "SUPERADMIN"), toggleUserStatus);
router2.patch("/usuarios/:id/reset-password", authenticateToken, requireRoles("ADMIN", "SUPERADMIN"), resetUserPassword);
router2.patch("/usuarios/:id/desbloquear", authenticateToken, requireRoles("ADMIN", "SUPERADMIN"), unlockUser);
router2.get("/empresa", authenticateToken, getCompany);
router2.get("/sucursales", authenticateToken, getBranches);
router2.get("/roles", authenticateToken, getRoles);
router2.post("/roles", authenticateToken, requireRoles("ADMIN", "SUPERADMIN"), createRole);
router2.put("/roles/:id", authenticateToken, requireRoles("ADMIN", "SUPERADMIN"), updateRole);
router2.delete("/roles/:id", authenticateToken, requireRoles("ADMIN", "SUPERADMIN"), deleteRole);
router2.get("/permisos", authenticateToken, getPermisos);
router2.get("/presencia", authenticateToken, getPresencia);
router2.put("/presencia", authenticateToken, setPresencia);
var user_routes_default = router2;

// server/routes/client.routes.ts
import { Router as Router3 } from "express";

// server/utils/validation.ts
function validarDNI(dni) {
  if (!dni || dni.length !== 8) return false;
  return /^\d{8}$/.test(dni);
}
function validarRUC(ruc) {
  if (!ruc || ruc.length !== 11) return false;
  if (!/^\d{11}$/.test(ruc)) return false;
  const factores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let suma = 0;
  for (let i = 0; i < 10; i++) {
    suma += parseInt(ruc[i]) * factores[i];
  }
  const resto = suma % 11;
  let digitoVerificador = 11 - resto;
  if (digitoVerificador === 10) digitoVerificador = 0;
  if (digitoVerificador === 11) digitoVerificador = 1;
  return digitoVerificador === parseInt(ruc[10]);
}
function validarDocumento(tipo, numero) {
  const limpio = numero.trim();
  switch (tipo) {
    case "RUC":
      if (!validarRUC(limpio)) {
        return { valido: false, mensaje: "RUC inv\xE1lido (debe tener 11 d\xEDgitos y d\xEDgito verificador correcto)" };
      }
      break;
    case "DNI":
      if (!validarDNI(limpio)) {
        return { valido: false, mensaje: "DNI inv\xE1lido (debe tener 8 d\xEDgitos num\xE9ricos)" };
      }
      break;
    case "CE":
      if (limpio.length < 8 || limpio.length > 12) {
        return { valido: false, mensaje: "Carnet de Extranjer\xEDa inv\xE1lido (8-12 caracteres)" };
      }
      break;
    default:
      return { valido: false, mensaje: "Tipo de documento no soportado" };
  }
  return { valido: true };
}

// server/controllers/client.controller.ts
function getEstadoId(estado) {
  switch (estado) {
    case "INACTIVO":
      return 2;
    case "SUSPENDIDO":
      return 3;
    default:
      return 1;
  }
}
function parsePersonaRow(row) {
  const isRuc = Boolean(row.ruc);
  const tipoDoc = isRuc ? "RUC" : row.dni && String(row.dni).length === 8 ? "DNI" : row.dni ? "CE" : "DNI";
  const numDoc = row.ruc || row.dni || row.numero_documento || "";
  const fullName = [row.nombres, row.apellidos].filter(Boolean).join(" ").trim();
  const razonSocial = isRuc ? row.razon_social || "" : row.razon_social || fullName || "";
  return {
    id: row.id_cliente,
    idPersona: row.id_persona,
    tipoDocumento: tipoDoc,
    numeroDocumento: numDoc,
    razonSocial,
    nombreEmpresa: row.nombre_empresa || null,
    direccionFiscal: row.direccion || row.direccion_fiscal || "",
    email: row.correo || row.email || null,
    telefono: row.telefono || null,
    estado: row.estado_nombre || "ACTIVO",
    fechaRegistro: row.cliente_created_at || row.created_at || (/* @__PURE__ */ new Date()).toISOString(),
    totalEquipos: Number(row.total_equipos || 0),
    totalServicios: Number(row.total_servicios || 0)
  };
}
async function getClients(req, res) {
  try {
    const { search, estado, page = "1", limit = "25" } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const offset = (pageNum - 1) * limitNum;
    let whereClauses = [];
    let params = [];
    if (search) {
      whereClauses.push(
        `(c.razon_social LIKE ? OR c.nombre_empresa LIKE ? OR p.nombres LIKE ? OR p.apellidos LIKE ? OR p.dni LIKE ? OR c.ruc LIKE ? OR p.correo LIKE ?)`
      );
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam, searchParam, searchParam, searchParam);
    }
    if (estado && ["ACTIVO", "INACTIVO", "SUSPENDIDO"].includes(estado)) {
      whereClauses.push("e.nombre = ?");
      params.push(estado);
    }
    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
    const [rows] = await pool.query(
      `SELECT c.id_cliente, c.id_persona, c.ruc, c.razon_social, c.nombre_empresa,
              c.estado_id, e.nombre AS estado_nombre, c.created_at AS cliente_created_at,
              p.dni, p.nombres, p.apellidos, p.telefono, p.correo, p.direccion,
              (SELECT COUNT(*) FROM equipos eq WHERE eq.cliente_id = c.id_cliente) AS total_equipos,
              (SELECT COUNT(*) FROM ordenes_servicio os WHERE os.cliente_id = c.id_cliente) AS total_servicios
       FROM clientes c
       JOIN personas p ON c.id_persona = p.id_persona
       JOIN estados e ON c.estado_id = e.id
       ${whereSQL}
       ORDER BY c.id_cliente DESC
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM clientes c JOIN personas p ON c.id_persona = p.id_persona JOIN estados e ON c.estado_id = e.id ${whereSQL}`,
      params
    );
    const total = Number(countRows[0].total);
    const totalPages = Math.ceil(total / limitNum);
    const [statsRows] = await pool.query(
      `SELECT 
        COUNT(*) AS total,
        COALESCE(SUM(CASE WHEN e.nombre = 'ACTIVO' THEN 1 ELSE 0 END), 0) AS activos,
        COALESCE(SUM(CASE WHEN e.nombre = 'INACTIVO' THEN 1 ELSE 0 END), 0) AS inactivos
       FROM clientes c
       JOIN estados e ON c.estado_id = e.id`
    );
    const stats = {
      total: Number(statsRows[0]?.total || 0),
      activos: Number(statsRows[0]?.activos || 0),
      inactivos: Number(statsRows[0]?.inactivos || 0)
    };
    const clientes = rows.map((row) => parsePersonaRow(row));
    res.json({
      success: true,
      data: clientes,
      pagination: { page: pageNum, limit: limitNum, total, totalPages },
      stats
    });
  } catch (error) {
    console.error("Error en getClients:", error);
    res.status(500).json({ success: false, message: "Error obteniendo clientes." });
  }
}
async function getClientById(req, res) {
  try {
    const clientId = Number(req.params.id);
    const [rows] = await pool.query(
      `SELECT c.id_cliente, c.id_persona, c.ruc, c.razon_social, c.nombre_empresa,
              c.estado_id, e.nombre AS estado_nombre, c.created_at AS cliente_created_at,
              p.dni, p.nombres, p.apellidos, p.telefono, p.correo, p.direccion,
              (SELECT COUNT(*) FROM equipos eq WHERE eq.cliente_id = c.id_cliente) AS total_equipos,
              (SELECT COUNT(*) FROM ordenes_servicio os WHERE os.cliente_id = c.id_cliente) AS total_servicios
       FROM clientes c
       JOIN personas p ON c.id_persona = p.id_persona
       JOIN estados e ON c.estado_id = e.id
       WHERE c.id_cliente = ?
       LIMIT 1`,
      [clientId]
    );
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: "Cliente no encontrado." });
      return;
    }
    const clienteResponse = parsePersonaRow(rows[0]);
    res.json({ success: true, data: clienteResponse });
  } catch (error) {
    console.error("Error en getClientById:", error);
    res.status(500).json({ success: false, message: "Error obteniendo cliente." });
  }
}
async function createClient(req, res) {
  try {
    const {
      tipoDocumento,
      numeroDocumento,
      razonSocial,
      nombreEmpresa,
      direccionFiscal,
      email,
      telefono,
      estado = "ACTIVO"
    } = req.body;
    if (!tipoDocumento || !numeroDocumento || !direccionFiscal) {
      res.status(400).json({
        success: false,
        message: "Campos obligatorios: tipoDocumento, numeroDocumento, direccionFiscal."
      });
      return;
    }
    const docLimpio = String(numeroDocumento).trim().toUpperCase();
    const razonSocialLimpia = (razonSocial || "").trim().toUpperCase();
    const estadoId = getEstadoId(estado);
    if (tipoDocumento === "RUC") {
      if (!razonSocialLimpia) {
        res.status(400).json({
          success: false,
          message: "La Raz\xF3n Social es obligatoria para clientes de tipo RUC (Empresa)."
        });
        return;
      }
      const validation = validarDocumento("RUC", docLimpio);
      if (!validation.valido) {
        res.status(400).json({ success: false, message: validation.mensaje });
        return;
      }
      const [existingRUC] = await pool.query(
        "SELECT id_cliente FROM clientes WHERE ruc = ? LIMIT 1",
        [docLimpio]
      );
      if (existingRUC.length > 0) {
        res.status(409).json({ success: false, message: "El RUC ya se encuentra registrado en el sistema." });
        return;
      }
    } else {
      if (!razonSocialLimpia && !req.body.nombres) {
        res.status(400).json({
          success: false,
          message: "El nombre completo es obligatorio para personas naturales."
        });
        return;
      }
      const validation = validarDocumento(tipoDocumento, docLimpio);
      if (!validation.valido) {
        res.status(400).json({ success: false, message: validation.mensaje });
        return;
      }
      const [existingDoc] = await pool.query(
        "SELECT id_persona FROM personas WHERE dni = ? LIMIT 1",
        [docLimpio]
      );
      if (existingDoc.length > 0) {
        res.status(409).json({
          success: false,
          message: `${tipoDocumento} ya registrado en el sistema.`
        });
        return;
      }
    }
    let nombres = "";
    let apellidos = null;
    let tipoDocId = 1;
    if (tipoDocumento === "RUC") {
      nombres = razonSocialLimpia.slice(0, 100);
      apellidos = null;
      tipoDocId = 2;
    } else {
      tipoDocId = tipoDocumento === "CE" ? 3 : 1;
      const partesNombre = razonSocialLimpia.split(/\s+/);
      if (partesNombre.length === 1) {
        nombres = partesNombre[0];
        apellidos = "";
      } else {
        const mitad = Math.ceil(partesNombre.length / 2);
        nombres = partesNombre.slice(0, mitad).join(" ");
        apellidos = partesNombre.slice(mitad).join(" ");
      }
    }
    const connection = await pool.getConnection();
    try {
      await connection.query("START TRANSACTION");
      const [personaResult] = await connection.query(
        `INSERT INTO personas (tipo_documento_id, dni, nombres, apellidos, telefono, correo, direccion, estado_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tipoDocId,
          tipoDocumento === "RUC" ? null : docLimpio,
          nombres,
          apellidos,
          telefono || null,
          email || null,
          direccionFiscal.trim(),
          estadoId
        ]
      );
      const personaId = personaResult.insertId;
      const [clienteResult] = await connection.query(
        `INSERT INTO clientes (id_persona, ruc, nombre_empresa, razon_social, estado_id)
         VALUES (?, ?, ?, ?, ?)`,
        [
          personaId,
          tipoDocumento === "RUC" ? docLimpio : null,
          tipoDocumento === "RUC" ? nombreEmpresa?.trim() || null : null,
          tipoDocumento === "RUC" ? razonSocialLimpia : razonSocialLimpia || `${nombres} ${apellidos || ""}`.trim(),
          estadoId
        ]
      );
      const clienteId = clienteResult.insertId;
      await connection.query("COMMIT");
      const [newClient] = await pool.query(
        `SELECT c.id_cliente, c.id_persona, c.ruc, c.razon_social, c.nombre_empresa,
                c.estado_id, e.nombre AS estado_nombre, c.created_at AS cliente_created_at,
                p.dni, p.nombres, p.apellidos, p.telefono, p.correo, p.direccion,
                0 AS total_equipos, 0 AS total_servicios
         FROM clientes c
         JOIN personas p ON c.id_persona = p.id_persona
         JOIN estados e ON c.estado_id = e.id
         WHERE c.id_cliente = ?
         LIMIT 1`,
        [clienteId]
      );
      const clienteCreado = parsePersonaRow(newClient[0]);
      res.status(201).json({
        success: true,
        message: `Cliente '${clienteCreado.razonSocial}' registrado con \xE9xito.`,
        data: clienteCreado
      });
    } catch (transError) {
      await connection.query("ROLLBACK");
      throw transError;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error en createClient:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(409).json({ success: false, message: "Documento ya registrado." });
    } else {
      res.status(500).json({ success: false, message: error.message || "Error creando cliente." });
    }
  }
}
async function updateClient(req, res) {
  try {
    const clientId = Number(req.params.id);
    const {
      tipoDocumento,
      numeroDocumento,
      razonSocial,
      nombreEmpresa,
      direccionFiscal,
      email,
      telefono,
      estado
    } = req.body;
    const [existingRows] = await pool.query(
      "SELECT id_persona, ruc FROM clientes WHERE id_cliente = ? LIMIT 1",
      [clientId]
    );
    if (existingRows.length === 0) {
      res.status(404).json({ success: false, message: "Cliente no encontrado." });
      return;
    }
    const personaId = existingRows[0].id_persona;
    const isCurrentRuc = Boolean(existingRows[0].ruc);
    const targetIsRuc = tipoDocumento ? tipoDocumento === "RUC" : isCurrentRuc;
    const updatesPersona = [];
    const updatesCliente = [];
    const paramsPersona = [];
    const paramsCliente = [];
    if (numeroDocumento !== void 0) {
      const docLimpio = String(numeroDocumento).trim().toUpperCase();
      if (targetIsRuc) {
        updatesCliente.push("ruc = ?");
        paramsCliente.push(docLimpio);
        updatesPersona.push("dni = NULL");
        updatesPersona.push("tipo_documento_id = 2");
      } else {
        updatesPersona.push("dni = ?");
        paramsPersona.push(docLimpio);
        updatesPersona.push("tipo_documento_id = ?");
        paramsPersona.push(tipoDocumento === "CE" ? 3 : 1);
        updatesCliente.push("ruc = NULL");
      }
    }
    if (razonSocial !== void 0) {
      const razonLimpia = razonSocial.trim().toUpperCase();
      updatesCliente.push("razon_social = ?");
      paramsCliente.push(razonLimpia);
      if (targetIsRuc) {
        updatesPersona.push("nombres = ?");
        paramsPersona.push(razonLimpia.slice(0, 100));
        updatesPersona.push("apellidos = NULL");
      } else {
        const partes = razonLimpia.split(/\s+/);
        const mitad = Math.ceil(partes.length / 2);
        updatesPersona.push("nombres = ?, apellidos = ?");
        paramsPersona.push(partes.slice(0, mitad).join(" "));
        paramsPersona.push(partes.slice(mitad).join(" "));
      }
    }
    if (nombreEmpresa !== void 0) {
      updatesCliente.push("nombre_empresa = ?");
      paramsCliente.push(targetIsRuc ? nombreEmpresa?.trim() || null : null);
    }
    if (direccionFiscal !== void 0) {
      updatesPersona.push("direccion = ?");
      paramsPersona.push(direccionFiscal.trim());
    }
    if (telefono !== void 0) {
      updatesPersona.push("telefono = ?");
      paramsPersona.push(telefono || null);
    }
    if (email !== void 0) {
      updatesPersona.push("correo = ?");
      paramsPersona.push(email || null);
    }
    if (estado !== void 0) {
      const stId = getEstadoId(estado);
      updatesPersona.push("estado_id = ?");
      paramsPersona.push(stId);
      updatesCliente.push("estado_id = ?");
      paramsCliente.push(stId);
    }
    if (updatesPersona.length === 0 && updatesCliente.length === 0) {
      res.status(400).json({ success: false, message: "No se enviaron campos para actualizar." });
      return;
    }
    const connection = await pool.getConnection();
    try {
      await connection.query("START TRANSACTION");
      if (updatesPersona.length > 0) {
        await connection.query(
          `UPDATE personas SET ${updatesPersona.join(", ")} WHERE id_persona = ?`,
          [...paramsPersona, personaId]
        );
      }
      if (updatesCliente.length > 0) {
        await connection.query(
          `UPDATE clientes SET ${updatesCliente.join(", ")} WHERE id_cliente = ?`,
          [...paramsCliente, clientId]
        );
      }
      await connection.query("COMMIT");
      const [updatedClient] = await pool.query(
        `SELECT c.id_cliente, c.id_persona, c.ruc, c.razon_social, c.nombre_empresa,
                c.estado_id, e.nombre AS estado_nombre, c.created_at AS cliente_created_at,
                p.dni, p.nombres, p.apellidos, p.telefono, p.correo, p.direccion,
                (SELECT COUNT(*) FROM equipos eq WHERE eq.cliente_id = c.id_cliente) AS total_equipos,
                (SELECT COUNT(*) FROM ordenes_servicio os WHERE os.cliente_id = c.id_cliente) AS total_servicios
         FROM clientes c
         JOIN personas p ON c.id_persona = p.id_persona
         JOIN estados e ON c.estado_id = e.id
         WHERE c.id_cliente = ?
         LIMIT 1`,
        [clientId]
      );
      res.json({
        success: true,
        message: "Cliente actualizado con \xE9xito.",
        data: parsePersonaRow(updatedClient[0])
      });
    } catch (transError) {
      await connection.query("ROLLBACK");
      throw transError;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error en updateClient:", error);
    res.status(500).json({ success: false, message: error.message || "Error actualizando cliente." });
  }
}
async function toggleClientStatus(req, res) {
  try {
    const clientId = Number(req.params.id);
    const [existingRows] = await pool.query(
      "SELECT c.id_cliente, c.id_persona, e.nombre AS estado_actual FROM clientes c JOIN estados e ON c.estado_id = e.id WHERE c.id_cliente = ? LIMIT 1",
      [clientId]
    );
    if (existingRows.length === 0) {
      res.status(404).json({ success: false, message: "Cliente no encontrado." });
      return;
    }
    const estadoActual = existingRows[0].estado_actual;
    const personaId = existingRows[0].id_persona;
    const nuevoEstado = estadoActual === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    const nuevoEstadoId = getEstadoId(nuevoEstado);
    await pool.query(
      "UPDATE clientes SET estado_id = ? WHERE id_cliente = ?",
      [nuevoEstadoId, clientId]
    );
    await pool.query(
      "UPDATE personas SET estado_id = ? WHERE id_persona = ?",
      [nuevoEstadoId, personaId]
    );
    res.json({
      success: true,
      message: `Cliente ${nuevoEstado === "ACTIVO" ? "activado" : "desactivado"} con \xE9xito.`,
      data: { id: clientId, estado: nuevoEstado }
    });
  } catch (error) {
    console.error("Error en toggleClientStatus:", error);
    res.status(500).json({ success: false, message: "Error cambiando estado del cliente." });
  }
}
async function searchClientByDoc(req, res) {
  try {
    const documento = req.params.documento.trim().toUpperCase();
    if (!documento) {
      res.status(400).json({ success: false, message: "Documento requerido." });
      return;
    }
    const [rows] = await pool.query(
      `SELECT c.id_cliente, c.id_persona, c.ruc, c.razon_social, c.nombre_empresa,
              c.estado_id, e.nombre AS estado_nombre, c.created_at AS cliente_created_at,
              p.dni, p.nombres, p.apellidos, p.telefono, p.correo, p.direccion,
              (SELECT COUNT(*) FROM equipos eq WHERE eq.cliente_id = c.id_cliente) AS total_equipos,
              (SELECT COUNT(*) FROM ordenes_servicio os WHERE os.cliente_id = c.id_cliente) AS total_servicios
       FROM clientes c
       JOIN personas p ON c.id_persona = p.id_persona
       JOIN estados e ON c.estado_id = e.id
       WHERE c.ruc = ? OR p.dni = ?
       LIMIT 1`,
      [documento, documento]
    );
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: "Cliente no encontrado con ese documento." });
      return;
    }
    const clienteResponse = parsePersonaRow(rows[0]);
    res.json({ success: true, data: clienteResponse });
  } catch (error) {
    console.error("Error en searchClientByDoc:", error);
    res.status(500).json({ success: false, message: "Error buscando cliente." });
  }
}

// server/routes/client.routes.ts
var router3 = Router3();
router3.get("/", authenticateToken, requirePermission("clientes", "FACTURADOR", "SECRETARIA", "RECEPCION"), getClients);
router3.get("/:id", authenticateToken, requirePermission("clientes", "FACTURADOR", "SECRETARIA", "RECEPCION"), getClientById);
router3.post("/", authenticateToken, requirePermission("clientes", "FACTURADOR", "SECRETARIA", "RECEPCION"), createClient);
router3.put("/:id", authenticateToken, requirePermission("clientes", "FACTURADOR", "SECRETARIA", "RECEPCION"), updateClient);
router3.patch("/:id/estado", authenticateToken, requirePermission("clientes", "SECRETARIA", "RECEPCION"), toggleClientStatus);
router3.get("/buscar/:documento", authenticateToken, requirePermission("clientes", "SECRETARIA", "FACTURADOR", "RECEPCION"), searchClientByDoc);
var client_routes_default = router3;

// server/routes/company.routes.ts
import { Router as Router4 } from "express";

// server/controllers/company.controller.ts
async function getEmpresa(_req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT id, ruc, razon_social, nombre_comercial, direccion_fiscal, email, telefono,
              departamento, provincia, distrito, ubigeo, logo_url
       FROM empresas
       LIMIT 1`
    );
    if (rows.length === 0) {
      res.json({
        success: true,
        empresa: {
          ruc: "20609737524",
          razonSocial: "MG SOLUTIONS GROUP S.A.C.",
          nombreComercial: "MG SOLUTIONS GROUP",
          direccionFiscal: "AV. PEDRO RUIZ NRO. 349 INT. 09C (MERCADO MODELO) - LAMBAYEQUE - CHICLAYO - CHICLAYO",
          email: "mgsolutions.group@gmail.com",
          telefono: "+51 974 812 390",
          departamento: "Lambayeque",
          provincia: "Chiclayo",
          distrito: "Chiclayo",
          ubigeo: "140101"
        }
      });
      return;
    }
    const row = rows[0];
    res.json({
      success: true,
      empresa: {
        id: row.id,
        ruc: row.ruc,
        razonSocial: row.razon_social,
        nombreComercial: row.nombre_comercial || "",
        direccionFiscal: row.direccion_fiscal,
        email: row.email || "",
        telefono: row.telefono || "",
        departamento: row.departamento || "Lambayeque",
        provincia: row.provincia || "Chiclayo",
        distrito: row.distrito || "Chiclayo",
        ubigeo: row.ubigeo || "140101"
      }
    });
  } catch (error) {
    console.error("Error al obtener datos de la empresa:", error);
    res.status(500).json({
      success: false,
      message: "Error interno al consultar datos de la empresa."
    });
  }
}
async function updateEmpresa(req, res) {
  try {
    const {
      ruc,
      razonSocial,
      nombreComercial,
      direccionFiscal,
      email,
      telefono,
      departamento,
      provincia,
      distrito,
      ubigeo
    } = req.body;
    if (!ruc || !razonSocial || !direccionFiscal) {
      res.status(400).json({
        success: false,
        message: "RUC, Raz\xF3n Social y Direcci\xF3n Fiscal son campos obligatorios."
      });
      return;
    }
    const cleanRuc = String(ruc).trim();
    if (cleanRuc.length !== 11) {
      res.status(400).json({
        success: false,
        message: "El RUC debe tener exactamente 11 d\xEDgitos num\xE9ricos."
      });
      return;
    }
    const [existing] = await pool.query("SELECT id FROM empresas LIMIT 1");
    if (existing.length === 0) {
      await pool.query(
        `INSERT INTO empresas (ruc, razon_social, nombre_comercial, direccion_fiscal, email, telefono, departamento, provincia, distrito, ubigeo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cleanRuc,
          String(razonSocial).trim(),
          nombreComercial ? String(nombreComercial).trim() : null,
          String(direccionFiscal).trim(),
          email ? String(email).trim() : null,
          telefono ? String(telefono).trim() : null,
          departamento ? String(departamento).trim() : "Lambayeque",
          provincia ? String(provincia).trim() : "Chiclayo",
          distrito ? String(distrito).trim() : "Chiclayo",
          ubigeo ? String(ubigeo).trim() : "140101"
        ]
      );
    } else {
      const empresaId = existing[0].id;
      await pool.query(
        `UPDATE empresas
         SET ruc = ?,
             razon_social = ?,
             nombre_comercial = ?,
             direccion_fiscal = ?,
             email = ?,
             telefono = ?,
             departamento = ?,
             provincia = ?,
             distrito = ?,
             ubigeo = ?
         WHERE id = ?`,
        [
          cleanRuc,
          String(razonSocial).trim(),
          nombreComercial ? String(nombreComercial).trim() : null,
          String(direccionFiscal).trim(),
          email ? String(email).trim() : null,
          telefono ? String(telefono).trim() : null,
          departamento ? String(departamento).trim() : "Lambayeque",
          provincia ? String(provincia).trim() : "Chiclayo",
          distrito ? String(distrito).trim() : "Chiclayo",
          ubigeo ? String(ubigeo).trim() : "140101",
          empresaId
        ]
      );
    }
    res.json({
      success: true,
      message: "Datos de la empresa actualizados correctamente.",
      empresa: {
        ruc: cleanRuc,
        razonSocial: String(razonSocial).trim(),
        nombreComercial: nombreComercial ? String(nombreComercial).trim() : "",
        direccionFiscal: String(direccionFiscal).trim(),
        email: email ? String(email).trim() : "",
        telefono: telefono ? String(telefono).trim() : "",
        departamento: departamento ? String(departamento).trim() : "Lambayeque",
        provincia: provincia ? String(provincia).trim() : "Chiclayo",
        distrito: distrito ? String(distrito).trim() : "Chiclayo",
        ubigeo: ubigeo ? String(ubigeo).trim() : "140101"
      }
    });
  } catch (error) {
    console.error("Error al actualizar datos de la empresa:", error);
    res.status(500).json({
      success: false,
      message: "Error al guardar los datos de la empresa en la base de datos."
    });
  }
}
async function getSucursales(_req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT s.id, s.codigo, s.nombre, s.direccion, s.telefono, s.es_principal, s.estado_id,
              COALESCE(e.nombre, 'ACTIVO') AS estado
       FROM sucursales s
       LEFT JOIN estados e ON s.estado_id = e.id
       ORDER BY s.es_principal DESC, s.codigo ASC`
    );
    const sucursales = rows.map((r) => ({
      id: r.id,
      codigo: r.codigo,
      nombre: r.nombre,
      direccion: r.direccion,
      telefono: r.telefono || "",
      esPrincipal: Boolean(r.es_principal),
      estado: Number(r.estado_id) === 2 || String(r.estado).toUpperCase() === "INACTIVO" ? "INACTIVO" : "ACTIVO"
    }));
    res.json({
      success: true,
      sucursales
    });
  } catch (error) {
    console.error("Error al listar sucursales:", error);
    res.status(500).json({
      success: false,
      message: "Error al consultar sucursales."
    });
  }
}
async function createSucursal(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { codigo, nombre, direccion, telefono, esPrincipal } = req.body;
    if (!nombre || !String(nombre).trim()) {
      res.status(400).json({
        success: false,
        message: "El nombre de la sucursal es obligatorio."
      });
      return;
    }
    const cleanNombre = String(nombre).trim();
    const cleanDireccion = direccion ? String(direccion).trim() : "Direcci\xF3n pendiente";
    const cleanTelefono = telefono ? String(telefono).trim() : null;
    const esPrinc = Boolean(esPrincipal);
    const [empresaRows] = await connection.query("SELECT id FROM empresas LIMIT 1");
    const empresaId = empresaRows.length > 0 ? empresaRows[0].id : 1;
    let cleanCodigo = codigo ? String(codigo).trim() : "";
    if (!cleanCodigo) {
      const [countRows] = await connection.query("SELECT COUNT(*) AS total FROM sucursales");
      const total = countRows[0].total || 0;
      cleanCodigo = `000${total}`.slice(-4);
    }
    const [existingCode] = await connection.query(
      "SELECT id FROM sucursales WHERE codigo = ? LIMIT 1",
      [cleanCodigo]
    );
    if (existingCode.length > 0) {
      res.status(400).json({
        success: false,
        message: `El c\xF3digo de sucursal "${cleanCodigo}" ya se encuentra registrado.`
      });
      return;
    }
    if (esPrinc) {
      await connection.query("UPDATE sucursales SET es_principal = 0");
    }
    const [result] = await connection.query(
      `INSERT INTO sucursales (empresa_id, codigo, nombre, direccion, telefono, es_principal, estado_id)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [empresaId, cleanCodigo, cleanNombre, cleanDireccion, cleanTelefono, esPrinc ? 1 : 0]
    );
    await connection.commit();
    res.status(201).json({
      success: true,
      message: "Sucursal registrada exitosamente.",
      sucursal: {
        id: result.insertId,
        codigo: cleanCodigo,
        nombre: cleanNombre,
        direccion: cleanDireccion,
        telefono: cleanTelefono || "",
        esPrincipal: esPrinc,
        estado: "ACTIVO"
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al crear sucursal:", error);
    res.status(500).json({
      success: false,
      message: "Error al registrar la sucursal."
    });
  } finally {
    connection.release();
  }
}
async function updateSucursal(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const sucursalId = parseInt(req.params.id, 10);
    const { codigo, nombre, direccion, telefono, esPrincipal } = req.body;
    if (isNaN(sucursalId)) {
      res.status(400).json({ success: false, message: "ID de sucursal inv\xE1lido." });
      return;
    }
    if (!nombre || !String(nombre).trim()) {
      res.status(400).json({ success: false, message: "El nombre de la sucursal es obligatorio." });
      return;
    }
    const [existing] = await connection.query(
      "SELECT id, es_principal FROM sucursales WHERE id = ? LIMIT 1",
      [sucursalId]
    );
    if (existing.length === 0) {
      res.status(404).json({ success: false, message: "Sucursal no encontrada." });
      return;
    }
    const cleanNombre = String(nombre).trim();
    const cleanDireccion = direccion ? String(direccion).trim() : "";
    const cleanTelefono = telefono ? String(telefono).trim() : null;
    const esPrinc = Boolean(esPrincipal);
    if (codigo) {
      const cleanCodigo = String(codigo).trim();
      const [duplicate] = await connection.query(
        "SELECT id FROM sucursales WHERE codigo = ? AND id != ? LIMIT 1",
        [cleanCodigo, sucursalId]
      );
      if (duplicate.length > 0) {
        res.status(400).json({
          success: false,
          message: `El c\xF3digo "${cleanCodigo}" ya est\xE1 asignado a otra sucursal.`
        });
        return;
      }
    }
    if (esPrinc) {
      await connection.query("UPDATE sucursales SET es_principal = 0 WHERE id != ?", [sucursalId]);
    }
    await connection.query(
      `UPDATE sucursales
       SET codigo = COALESCE(?, codigo),
           nombre = ?,
           direccion = ?,
           telefono = ?,
           es_principal = ?
       WHERE id = ?`,
      [codigo ? String(codigo).trim() : null, cleanNombre, cleanDireccion, cleanTelefono, esPrinc ? 1 : 0, sucursalId]
    );
    await connection.commit();
    const [updatedRows] = await pool.query(
      `SELECT s.id, s.codigo, s.nombre, s.direccion, s.telefono, s.es_principal, s.estado_id,
              COALESCE(e.nombre, 'ACTIVO') AS estado
       FROM sucursales s
       LEFT JOIN estados e ON s.estado_id = e.id
       WHERE s.id = ?`,
      [sucursalId]
    );
    const r = updatedRows[0];
    res.json({
      success: true,
      message: "Sucursal actualizada exitosamente.",
      sucursal: {
        id: r.id,
        codigo: r.codigo,
        nombre: r.nombre,
        direccion: r.direccion,
        telefono: r.telefono || "",
        esPrincipal: Boolean(r.es_principal),
        estado: Number(r.estado_id) === 2 || String(r.estado).toUpperCase() === "INACTIVO" ? "INACTIVO" : "ACTIVO"
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al actualizar sucursal:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar la sucursal."
    });
  } finally {
    connection.release();
  }
}
async function toggleSucursalEstado(req, res) {
  try {
    const sucursalId = parseInt(req.params.id, 10);
    if (isNaN(sucursalId)) {
      res.status(400).json({ success: false, message: "ID de sucursal inv\xE1lido." });
      return;
    }
    const [rows] = await pool.query(
      "SELECT id, nombre, es_principal, estado_id FROM sucursales WHERE id = ? LIMIT 1",
      [sucursalId]
    );
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: "Sucursal no encontrada." });
      return;
    }
    const suc = rows[0];
    if (Boolean(suc.es_principal) && suc.estado_id === 1) {
      res.status(400).json({
        success: false,
        message: "No se puede desactivar la Sucursal Principal (Casa Matriz). Asigne otra sucursal como principal primero."
      });
      return;
    }
    const nuevoEstadoId = suc.estado_id === 1 ? 2 : 1;
    const nuevoEstadoNombre = nuevoEstadoId === 1 ? "ACTIVO" : "INACTIVO";
    await pool.query("UPDATE sucursales SET estado_id = ? WHERE id = ?", [nuevoEstadoId, sucursalId]);
    res.json({
      success: true,
      message: `Sucursal "${suc.nombre}" ahora est\xE1 ${nuevoEstadoNombre}.`,
      nuevoEstado: nuevoEstadoNombre
    });
  } catch (error) {
    console.error("Error al cambiar estado de sucursal:", error);
    res.status(500).json({
      success: false,
      message: "Error al cambiar estado de la sucursal."
    });
  }
}

// server/routes/company.routes.ts
init_mailer();
var router4 = Router4();
router4.post("/empresa/mail-bridge", authenticateToken, requireRoles("SUPERADMIN", "ADMIN"), async (req, res) => {
  try {
    const { bridgeUrl, testEmail } = req.body;
    if (bridgeUrl !== void 0) {
      setRuntimeMailBridgeUrl(String(bridgeUrl));
    }
    if (testEmail) {
      await dispatchEmail({
        to: String(testEmail).trim(),
        subject: "\u2705 Prueba de Correo MG Solutions ERP",
        text: "El servicio de correo electr\xF3nico de MG Solutions ERP est\xE1 operativo.",
        html: '<div style="font-family:sans-serif;padding:20px;border:1px solid #e2e8f0;border-radius:10px;"><h2 style="color:#00346F;">MG SOLUTIONS GROUP S.A.C.</h2><p>\u2705 El servicio de despacho de correo electr\xF3nico est\xE1 operativo.</p></div>'
      });
    }
    res.json({
      success: true,
      bridgeUrl: getRuntimeMailBridgeUrl(),
      message: "Configuraci\xF3n de correo actualizada y probada con \xE9xito."
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      bridgeUrl: getRuntimeMailBridgeUrl(),
      message: err?.message || "Error al probar el env\xEDo de correo."
    });
  }
});
router4.get("/empresa", authenticateToken, getEmpresa);
router4.put("/empresa", authenticateToken, requireRoles("SUPERADMIN", "ADMIN"), updateEmpresa);
router4.get("/sucursales", authenticateToken, getSucursales);
router4.post("/sucursales", authenticateToken, requireRoles("SUPERADMIN", "ADMIN"), createSucursal);
router4.put("/sucursales/:id", authenticateToken, requireRoles("SUPERADMIN", "ADMIN"), updateSucursal);
router4.patch("/sucursales/:id/estado", authenticateToken, requireRoles("SUPERADMIN", "ADMIN"), toggleSucursalEstado);
var company_routes_default = router4;

// server/routes/brandModel.routes.ts
import { Router as Router5 } from "express";

// server/controllers/brandModel.controller.ts
async function ensureSeedMarcasYModelos() {
  try {
    const [countRows] = await pool.query("SELECT COUNT(*) as total FROM marcas");
    if (countRows[0].total === 0) {
      console.log("\u{1F331} Sembrando marcas y modelos iniciales en MySQL...");
      const marcasIniciales = [
        ["LENOVO", "Equipos port\xE1tiles, desktops y servidores", 1],
        ["HP", "Laptops, impresoras y workstations empresariales", 1],
        ["DELL", "Port\xE1tiles Inspiron, Latitude y Alienware", 1],
        ["ASUS", "Laptops para productividad y serie gamer ROG / TUF", 1],
        ["APPLE", "MacBook, Mac Mini, iMac y dispositivos Apple", 1],
        ["EPSON", "Impresoras EcoTank, matriciales y proyectores", 1],
        ["ACER", "Laptops Aspire, Nitro y Predator", 1],
        ["SAMSUNG", "Monitores, almacenamiento y tablets", 1]
      ];
      for (const m of marcasIniciales) {
        await pool.query("INSERT INTO marcas (nombre, descripcion, estado_id) VALUES (?, ?, ?)", m);
      }
      const [lenovoRows] = await pool.query('SELECT id FROM marcas WHERE nombre = "LENOVO"');
      const [hpRows] = await pool.query('SELECT id FROM marcas WHERE nombre = "HP"');
      if (lenovoRows.length > 0) {
        const lenovoId = lenovoRows[0].id;
        const [m1] = await pool.query(
          "INSERT INTO modelos (marca_id, nombre, descripcion, estado_id) VALUES (?, ?, ?, 1)",
          [lenovoId, 'ThinkPad X1 Carbon Gen 14 Aura Edition (14" Intel)', "Ultrabook corporativo de gama ultra premium con IA integrada"]
        );
        const m1Id = m1.insertId;
        const caracsM1 = [
          ["Procesador", "Intel Core Ultra 7 258V con NPU IA"],
          ["Memoria RAM", "32 GB LPDDR5x 8533MHz"],
          ["Almacenamiento", "1 TB SSD M.2 PCIe Gen4 NVMe"],
          ["Pantalla", '14" 2.8K (2880 x 1800) OLED, 120Hz, HDR500 True Black'],
          ["Tarjeta Gr\xE1fica", "Intel Arc Graphics integrada"],
          ["Peso", "0.98 kg"]
        ];
        for (const [attr, val] of caracsM1) {
          await pool.query("INSERT INTO detalle_modelo (modelo_id, atributo, valor) VALUES (?, ?, ?)", [m1Id, attr, val]);
        }
        const [m2] = await pool.query(
          "INSERT INTO modelos (marca_id, nombre, descripcion, estado_id) VALUES (?, ?, ?, 1)",
          [lenovoId, "Lenovo Googlebook 15", "Port\xE1til vers\xE1til para trabajo en la nube y productividad educativa"]
        );
        const m2Id = m2.insertId;
        const caracsM2 = [
          ["Procesador", "Intel Core i5-1335U 10 n\xFAcleos"],
          ["Memoria RAM", "16 GB DDR5 5200MHz"],
          ["Almacenamiento", "512 GB SSD NVMe M.2"],
          ["Pantalla", '15.6" FHD (1920 x 1080) Antirreflejo IPS'],
          ["Bater\xEDa", "Hasta 11 horas de autonom\xEDa"]
        ];
        for (const [attr, val] of caracsM2) {
          await pool.query("INSERT INTO detalle_modelo (modelo_id, atributo, valor) VALUES (?, ?, ?)", [m2Id, attr, val]);
        }
        const [m3] = await pool.query(
          "INSERT INTO modelos (marca_id, nombre, descripcion, estado_id) VALUES (?, ?, ?, 1)",
          [lenovoId, 'ThinkPad T14 Gen 7 (14" Intel)', "Caballo de batalla corporativo con resistencia militar MIL-STD-810H"]
        );
        const m3Id = m3.insertId;
        const caracsM3 = [
          ["Procesador", "Intel Core Ultra 5 125U"],
          ["Memoria RAM", "16 GB DDR5 expandible a 64GB"],
          ["Almacenamiento", "512 GB SSD M.2 PCIe Gen4"],
          ["Pantalla", '14" WUXGA (1920 x 1200) IPS 400 nits Low Power'],
          ["Puertos", "2x Thunderbolt 4 / USB-C, 2x USB-A, HDMI 2.1, RJ-45 Ethernet"]
        ];
        for (const [attr, val] of caracsM3) {
          await pool.query("INSERT INTO detalle_modelo (modelo_id, atributo, valor) VALUES (?, ?, ?)", [m3Id, attr, val]);
        }
      }
      if (hpRows.length > 0) {
        const hpId = hpRows[0].id;
        const [mHp] = await pool.query(
          "INSERT INTO modelos (marca_id, nombre, descripcion, estado_id) VALUES (?, ?, ?, 1)",
          [hpId, "HP Pavilion 15-eg0021la", "Port\xE1til balanceado para oficina y estudiantes avanzados"]
        );
        const mHpId = mHp.insertId;
        const caracsHp = [
          ["Procesador", "Intel Core i5-1235U"],
          ["Memoria RAM", "16 GB DDR4 3200MHz"],
          ["Almacenamiento", "512 GB SSD PCIe NVMe"],
          ["Pantalla", '15.6" Full HD Micro-Edge'],
          ["Audio", "B&O con doble altavoz"]
        ];
        for (const [attr, val] of caracsHp) {
          await pool.query("INSERT INTO detalle_modelo (modelo_id, atributo, valor) VALUES (?, ?, ?)", [mHpId, attr, val]);
        }
      }
      console.log("\u2705 Semilla de Marcas, Modelos y Caracter\xEDsticas completada con \xE9xito.");
    }
  } catch (error) {
    console.error("Error al asegurar semilla de marcas y modelos:", error);
  }
}
ensureSeedMarcasYModelos();
async function getMarcas(_req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT m.id, m.nombre, m.descripcion, m.categoria_id AS categoriaId,
              c.nombre AS categoriaNombre,
              e.nombre AS estado, m.estado_id AS estadoId,
              m.created_at AS createdAt,
              COUNT(mo.id) AS totalModelos
       FROM marcas m
       LEFT JOIN categorias c ON m.categoria_id = c.id
       INNER JOIN estados e ON m.estado_id = e.id
       LEFT JOIN modelos mo ON mo.marca_id = m.id
       GROUP BY m.id, m.nombre, m.descripcion, m.categoria_id, c.nombre, e.nombre, m.estado_id, m.created_at
       ORDER BY m.nombre ASC`
    );
    res.json({
      success: true,
      marcas: rows.map((r) => ({
        id: r.id,
        nombre: r.nombre,
        descripcion: r.descripcion || "",
        categoriaId: r.categoriaId ? Number(r.categoriaId) : null,
        categoriaNombre: r.categoriaNombre || null,
        estado: r.estado,
        estadoId: r.estadoId,
        totalModelos: Number(r.totalModelos) || 0,
        createdAt: r.createdAt
      }))
    });
  } catch (error) {
    console.error("Error al listar marcas:", error);
    res.status(500).json({ success: false, message: "Error interno al consultar marcas." });
  }
}
async function createMarca(req, res) {
  try {
    const { nombre, descripcion, categoriaId } = req.body;
    if (!nombre || !nombre.trim()) {
      res.status(400).json({ success: false, message: "El nombre de la marca es obligatorio." });
      return;
    }
    const cleanNombre = nombre.trim().toUpperCase();
    const cleanCatId = categoriaId ? Number(categoriaId) : null;
    const [existing] = await pool.query(
      cleanCatId ? "SELECT id FROM marcas WHERE UPPER(nombre) = ? AND categoria_id = ? LIMIT 1" : "SELECT id FROM marcas WHERE UPPER(nombre) = ? LIMIT 1",
      cleanCatId ? [cleanNombre, cleanCatId] : [cleanNombre]
    );
    if (existing.length > 0) {
      res.status(409).json({ success: false, message: `La marca '${cleanNombre}' ya est\xE1 registrada.` });
      return;
    }
    const [result] = await pool.query(
      "INSERT INTO marcas (nombre, descripcion, categoria_id, estado_id) VALUES (?, ?, ?, 1)",
      [cleanNombre, descripcion?.trim() || null, cleanCatId]
    );
    let catNombre = null;
    if (cleanCatId) {
      const [catRow] = await pool.query("SELECT nombre FROM categorias WHERE id = ?", [cleanCatId]);
      if (catRow.length > 0) catNombre = catRow[0].nombre;
    }
    res.status(201).json({
      success: true,
      message: "Marca registrada exitosamente.",
      marca: {
        id: result.insertId,
        nombre: cleanNombre,
        descripcion: descripcion?.trim() || "",
        categoriaId: cleanCatId,
        categoriaNombre: catNombre,
        estado: "ACTIVO",
        estadoId: 1,
        totalModelos: 0
      }
    });
  } catch (error) {
    console.error("Error al registrar marca:", error);
    res.status(500).json({ success: false, message: "Error interno al guardar marca." });
  }
}
async function updateMarca(req, res) {
  try {
    const marcaId = Number(req.params.id);
    const { nombre, descripcion, categoriaId } = req.body;
    if (isNaN(marcaId)) {
      res.status(400).json({ success: false, message: "ID de marca inv\xE1lido." });
      return;
    }
    if (!nombre || !nombre.trim()) {
      res.status(400).json({ success: false, message: "El nombre de la marca es obligatorio." });
      return;
    }
    const cleanNombre = nombre.trim().toUpperCase();
    const cleanCatId = categoriaId !== void 0 ? categoriaId ? Number(categoriaId) : null : void 0;
    const [existing] = await pool.query(
      "SELECT id FROM marcas WHERE UPPER(nombre) = ? AND id != ? LIMIT 1",
      [cleanNombre, marcaId]
    );
    if (existing.length > 0) {
      res.status(409).json({ success: false, message: `La marca '${cleanNombre}' ya existe.` });
      return;
    }
    if (cleanCatId !== void 0) {
      await pool.query(
        "UPDATE marcas SET nombre = ?, descripcion = ?, categoria_id = ? WHERE id = ?",
        [cleanNombre, descripcion?.trim() || null, cleanCatId, marcaId]
      );
    } else {
      await pool.query(
        "UPDATE marcas SET nombre = ?, descripcion = ? WHERE id = ?",
        [cleanNombre, descripcion?.trim() || null, marcaId]
      );
    }
    res.json({
      success: true,
      message: "Marca actualizada exitosamente.",
      marca: {
        id: marcaId,
        nombre: cleanNombre,
        descripcion: descripcion?.trim() || "",
        categoriaId: cleanCatId
      }
    });
  } catch (error) {
    console.error("Error al actualizar marca:", error);
    res.status(500).json({ success: false, message: "Error interno al actualizar marca." });
  }
}
async function toggleMarcaEstado(req, res) {
  try {
    const marcaId = Number(req.params.id);
    if (isNaN(marcaId)) {
      res.status(400).json({ success: false, message: "ID de marca inv\xE1lido." });
      return;
    }
    const [rows] = await pool.query(
      "SELECT id, estado_id FROM marcas WHERE id = ?",
      [marcaId]
    );
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: "Marca no encontrada." });
      return;
    }
    const nuevoEstadoId = rows[0].estado_id === 1 ? 2 : 1;
    await pool.query("UPDATE marcas SET estado_id = ? WHERE id = ?", [nuevoEstadoId, marcaId]);
    res.json({
      success: true,
      message: `Marca ${nuevoEstadoId === 1 ? "activada" : "desactivada"} correctamente.`,
      nuevoEstado: nuevoEstadoId === 1 ? "ACTIVO" : "INACTIVO",
      nuevoEstadoId
    });
  } catch (error) {
    console.error("Error al alternar estado de marca:", error);
    res.status(500).json({ success: false, message: "Error interno al alternar estado." });
  }
}
async function getModelos(req, res) {
  try {
    const marcaIdParam = req.query.marca_id ? Number(req.query.marca_id) : null;
    const searchParam = req.query.search ? String(req.query.search).trim() : null;
    let query = `
      SELECT mo.id, mo.marca_id AS marcaId, m.nombre AS marcaNombre,
             mo.nombre, mo.descripcion, e.nombre AS estado, mo.estado_id AS estadoId,
             mo.created_at AS createdAt
      FROM modelos mo
      INNER JOIN marcas m ON mo.marca_id = m.id
      INNER JOIN estados e ON mo.estado_id = e.id
      WHERE 1=1
    `;
    const params = [];
    if (marcaIdParam && !isNaN(marcaIdParam)) {
      query += " AND mo.marca_id = ?";
      params.push(marcaIdParam);
    }
    if (searchParam) {
      query += " AND (mo.nombre LIKE ? OR m.nombre LIKE ?)";
      params.push(`%${searchParam}%`, `%${searchParam}%`);
    }
    query += " ORDER BY m.nombre ASC, mo.nombre ASC";
    const [modelosRows] = await pool.query(query, params);
    if (modelosRows.length === 0) {
      res.json({ success: true, modelos: [] });
      return;
    }
    const modeloIds = modelosRows.map((m) => m.id);
    const [detallesRows] = await pool.query(
      "SELECT id, modelo_id AS modeloId, atributo, valor FROM detalle_modelo WHERE modelo_id IN (?) ORDER BY id ASC",
      [modeloIds]
    );
    const detallesPorModelo = /* @__PURE__ */ new Map();
    for (const d of detallesRows) {
      if (!detallesPorModelo.has(d.modeloId)) {
        detallesPorModelo.set(d.modeloId, []);
      }
      detallesPorModelo.get(d.modeloId).push({
        id: d.id,
        atributo: d.atributo,
        valor: d.valor || ""
      });
    }
    const modelos = modelosRows.map((m) => ({
      id: m.id,
      marcaId: m.marcaId,
      marcaNombre: m.marcaNombre,
      nombre: m.nombre,
      descripcion: m.descripcion || "",
      estado: m.estado,
      estadoId: m.estadoId,
      createdAt: m.createdAt,
      caracteristicas: detallesPorModelo.get(m.id) || []
    }));
    res.json({ success: true, modelos });
  } catch (error) {
    console.error("Error al obtener modelos:", error);
    res.status(500).json({ success: false, message: "Error interno al consultar modelos." });
  }
}
async function createModelo(req, res) {
  const connection = await pool.getConnection();
  try {
    const { marcaId, nombre, descripcion, caracteristicas } = req.body;
    if (!marcaId || isNaN(Number(marcaId))) {
      res.status(400).json({ success: false, message: "La marca es obligatoria." });
      return;
    }
    if (!nombre || !nombre.trim()) {
      res.status(400).json({ success: false, message: "El nombre del modelo es obligatorio." });
      return;
    }
    const cleanNombre = nombre.trim();
    const cleanMarcaId = Number(marcaId);
    const [marcaRows] = await connection.query(
      "SELECT id, nombre FROM marcas WHERE id = ?",
      [cleanMarcaId]
    );
    if (marcaRows.length === 0) {
      res.status(404).json({ success: false, message: "La marca seleccionada no existe." });
      return;
    }
    const marcaNombre = marcaRows[0].nombre;
    await connection.beginTransaction();
    const [modeloResult] = await connection.query(
      "INSERT INTO modelos (marca_id, nombre, descripcion, estado_id) VALUES (?, ?, ?, 1)",
      [cleanMarcaId, cleanNombre, descripcion?.trim() || null]
    );
    const modeloId = modeloResult.insertId;
    const insertedCaracteristicas = [];
    if (Array.isArray(caracteristicas) && caracteristicas.length > 0) {
      for (const c of caracteristicas) {
        if (c.atributo && c.atributo.trim()) {
          const attr = c.atributo.trim();
          const val = c.valor ? c.valor.trim() : "";
          const [cRes] = await connection.query(
            "INSERT INTO detalle_modelo (modelo_id, atributo, valor) VALUES (?, ?, ?)",
            [modeloId, attr, val]
          );
          insertedCaracteristicas.push({
            id: cRes.insertId,
            atributo: attr,
            valor: val
          });
        }
      }
    }
    await connection.commit();
    res.status(201).json({
      success: true,
      message: "Modelo y caracter\xEDsticas t\xE9cnicas registradas exitosamente.",
      modelo: {
        id: modeloId,
        marcaId: cleanMarcaId,
        marcaNombre,
        nombre: cleanNombre,
        descripcion: descripcion?.trim() || "",
        estado: "ACTIVO",
        estadoId: 1,
        caracteristicas: insertedCaracteristicas
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al registrar modelo:", error);
    res.status(500).json({ success: false, message: "Error interno al registrar modelo." });
  } finally {
    connection.release();
  }
}
async function updateModelo(req, res) {
  const connection = await pool.getConnection();
  try {
    const modeloId = Number(req.params.id);
    const { marcaId, nombre, descripcion, caracteristicas } = req.body;
    if (isNaN(modeloId)) {
      res.status(400).json({ success: false, message: "ID de modelo inv\xE1lido." });
      return;
    }
    if (!marcaId || isNaN(Number(marcaId))) {
      res.status(400).json({ success: false, message: "La marca es obligatoria." });
      return;
    }
    if (!nombre || !nombre.trim()) {
      res.status(400).json({ success: false, message: "El nombre del modelo es obligatorio." });
      return;
    }
    const cleanNombre = nombre.trim();
    const cleanMarcaId = Number(marcaId);
    await connection.beginTransaction();
    await connection.query(
      "UPDATE modelos SET marca_id = ?, nombre = ?, descripcion = ? WHERE id = ?",
      [cleanMarcaId, cleanNombre, descripcion?.trim() || null, modeloId]
    );
    const [marcaRows] = await connection.query(
      "SELECT nombre FROM marcas WHERE id = ?",
      [cleanMarcaId]
    );
    const marcaNombre = marcaRows.length > 0 ? marcaRows[0].nombre : "";
    await connection.query("DELETE FROM detalle_modelo WHERE modelo_id = ?", [modeloId]);
    const insertedCaracteristicas = [];
    if (Array.isArray(caracteristicas) && caracteristicas.length > 0) {
      for (const c of caracteristicas) {
        if (c.atributo && c.atributo.trim()) {
          const attr = c.atributo.trim();
          const val = c.valor ? c.valor.trim() : "";
          const [cRes] = await connection.query(
            "INSERT INTO detalle_modelo (modelo_id, atributo, valor) VALUES (?, ?, ?)",
            [modeloId, attr, val]
          );
          insertedCaracteristicas.push({
            id: cRes.insertId,
            atributo: attr,
            valor: val
          });
        }
      }
    }
    await connection.commit();
    res.json({
      success: true,
      message: "Modelo y especificaciones actualizadas exitosamente.",
      modelo: {
        id: modeloId,
        marcaId: cleanMarcaId,
        marcaNombre,
        nombre: cleanNombre,
        descripcion: descripcion?.trim() || "",
        caracteristicas: insertedCaracteristicas
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al actualizar modelo:", error);
    res.status(500).json({ success: false, message: "Error interno al actualizar modelo." });
  } finally {
    connection.release();
  }
}
async function toggleModeloEstado(req, res) {
  try {
    const modeloId = Number(req.params.id);
    if (isNaN(modeloId)) {
      res.status(400).json({ success: false, message: "ID de modelo inv\xE1lido." });
      return;
    }
    const [rows] = await pool.query(
      "SELECT id, estado_id FROM modelos WHERE id = ?",
      [modeloId]
    );
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: "Modelo no encontrado." });
      return;
    }
    const nuevoEstadoId = rows[0].estado_id === 1 ? 2 : 1;
    await pool.query("UPDATE modelos SET estado_id = ? WHERE id = ?", [nuevoEstadoId, modeloId]);
    res.json({
      success: true,
      message: `Modelo ${nuevoEstadoId === 1 ? "activado" : "desactivado"} correctamente.`,
      nuevoEstado: nuevoEstadoId === 1 ? "ACTIVO" : "INACTIVO",
      nuevoEstadoId
    });
  } catch (error) {
    console.error("Error al alternar estado de modelo:", error);
    res.status(500).json({ success: false, message: "Error interno al alternar estado." });
  }
}

// server/routes/brandModel.routes.ts
var router5 = Router5();
router5.get("/marcas", authenticateToken, getMarcas);
router5.post("/marcas", authenticateToken, requirePermission("marcas", "ALMACEN"), createMarca);
router5.put("/marcas/:id", authenticateToken, requirePermission("marcas", "ALMACEN"), updateMarca);
router5.patch("/marcas/:id/estado", authenticateToken, requirePermission("marcas", "ALMACEN"), toggleMarcaEstado);
router5.get("/modelos", authenticateToken, getModelos);
router5.post("/modelos", authenticateToken, requirePermission("marcas", "ALMACEN", "TECNICO"), createModelo);
router5.put("/modelos/:id", authenticateToken, requirePermission("marcas", "ALMACEN", "TECNICO"), updateModelo);
router5.patch("/modelos/:id/estado", authenticateToken, requirePermission("marcas", "ALMACEN", "TECNICO"), toggleModeloEstado);
var brandModel_routes_default = router5;

// server/routes/category.routes.ts
import { Router as Router6 } from "express";

// server/controllers/category.controller.ts
async function ensureSeedCategorias() {
  try {
    const [rows] = await pool.query("SELECT COUNT(*) as total FROM categorias");
    if (rows[0].total === 0) {
      console.log("\u{1F331} Sembrando categor\xEDas maestras en MySQL...");
      const categoriasIniciales = [
        ["LAPTOPS & NOTEBOOKS", "Laptops de oficina, gaming, ultrabooks y estaciones de trabajo", 1],
        ["IMPRESORAS & MULTIFUNCIONALES", "Impresoras EcoTank, l\xE1ser monocrom\xE1ticas y multifuncionales", 1],
        ["MONITORES & PANTALLAS", "Monitores de oficina, gaming alta tasa de refresco y dise\xF1o", 1],
        ["PERIF\xC9RICOS & ACCESORIOS", "Teclados, mouses, auriculares, webcams y almohadillas", 1],
        ["COMPONENTES & HARDWARE", "Memorias RAM, discos SSD NVMe, fuentes de poder y tarjetas de video", 1],
        ["REPUESTOS DE TALLER", "Pantallas, teclados de reemplazo, bater\xEDas, cargadores y ventiladores", 1],
        ["SUMINISTROS & TINTAS", "Botellas de tinta original, t\xF3ner, cables de poder y adaptadores", 1]
      ];
      for (const cat of categoriasIniciales) {
        await pool.query(
          "INSERT INTO categorias (nombre, descripcion, estado_id) VALUES (?, ?, ?)",
          cat
        );
      }
      console.log("\u2705 Categor\xEDas maestras sembradas con \xE9xito.");
    }
  } catch (error) {
    console.error("Error sembrando categor\xEDas:", error);
  }
}
ensureSeedCategorias();
async function getCategorias(req, res) {
  try {
    const { ambito } = req.query;
    let query = `
      SELECT c.id, c.nombre, c.descripcion, e.nombre AS estado, c.estado_id AS estadoId,
             c.es_equipo_taller AS esEquipoTaller,
             c.es_venta AS esVenta,
             c.es_repuesto_taller AS esRepuestoTaller,
             c.created_at AS createdAt,
             COUNT(p.id) AS totalProductos
      FROM categorias c
      INNER JOIN estados e ON c.estado_id = e.id
      LEFT JOIN productos p ON p.categoria_id = c.id
      WHERE 1=1
    `;
    const params = [];
    if (ambito === "taller" || ambito === "equipo") {
      query += " AND c.es_equipo_taller = 1";
    } else if (ambito === "venta") {
      query += " AND c.es_venta = 1";
    } else if (ambito === "repuesto") {
      query += " AND c.es_repuesto_taller = 1";
    }
    query += `
      GROUP BY c.id, c.nombre, c.descripcion, e.nombre, c.estado_id, 
               c.es_equipo_taller, c.es_venta, c.es_repuesto_taller, c.created_at
      ORDER BY c.nombre ASC
    `;
    const [rows] = await pool.query(query, params);
    res.json({
      success: true,
      categorias: rows.map((r) => ({
        id: r.id,
        nombre: r.nombre,
        descripcion: r.descripcion || "",
        estado: r.estado,
        estadoId: r.estadoId,
        esEquipoTaller: Boolean(r.esEquipoTaller),
        esVenta: Boolean(r.esVenta),
        esRepuestoTaller: Boolean(r.esRepuestoTaller),
        totalProductos: Number(r.totalProductos) || 0,
        createdAt: r.createdAt
      }))
    });
  } catch (error) {
    console.error("Error al listar categor\xEDas:", error);
    res.status(500).json({ success: false, message: "Error interno al consultar categor\xEDas." });
  }
}
async function createCategoria(req, res) {
  try {
    const {
      nombre,
      descripcion,
      esEquipoTaller = false,
      esVenta = true,
      esRepuestoTaller = false
    } = req.body;
    if (!nombre || !nombre.trim()) {
      res.status(400).json({ success: false, message: "El nombre de la categor\xEDa es obligatorio." });
      return;
    }
    const cleanNombre = nombre.trim().toUpperCase();
    const [existing] = await pool.query(
      "SELECT id FROM categorias WHERE UPPER(nombre) = ? LIMIT 1",
      [cleanNombre]
    );
    if (existing.length > 0) {
      res.status(409).json({ success: false, message: `La categor\xEDa '${cleanNombre}' ya existe.` });
      return;
    }
    const [result] = await pool.query(
      `INSERT INTO categorias (nombre, descripcion, es_equipo_taller, es_venta, es_repuesto_taller, estado_id) 
       VALUES (?, ?, ?, ?, ?, 1)`,
      [
        cleanNombre,
        descripcion?.trim() || null,
        Boolean(esEquipoTaller) ? 1 : 0,
        Boolean(esVenta) ? 1 : 0,
        Boolean(esRepuestoTaller) ? 1 : 0
      ]
    );
    res.status(201).json({
      success: true,
      message: "Categor\xEDa registrada exitosamente.",
      categoria: {
        id: result.insertId,
        nombre: cleanNombre,
        descripcion: descripcion?.trim() || "",
        estado: "ACTIVO",
        estadoId: 1,
        esEquipoTaller: Boolean(esEquipoTaller),
        esVenta: Boolean(esVenta),
        esRepuestoTaller: Boolean(esRepuestoTaller),
        totalProductos: 0
      }
    });
  } catch (error) {
    console.error("Error al crear categor\xEDa:", error);
    res.status(500).json({ success: false, message: "Error interno al crear categor\xEDa." });
  }
}
async function updateCategoria(req, res) {
  try {
    const categoriaId = Number(req.params.id);
    const {
      nombre,
      descripcion,
      esEquipoTaller,
      esVenta,
      esRepuestoTaller
    } = req.body;
    if (isNaN(categoriaId)) {
      res.status(400).json({ success: false, message: "ID de categor\xEDa inv\xE1lido." });
      return;
    }
    if (!nombre || !nombre.trim()) {
      res.status(400).json({ success: false, message: "El nombre de la categor\xEDa es obligatorio." });
      return;
    }
    const cleanNombre = nombre.trim().toUpperCase();
    const [existing] = await pool.query(
      "SELECT id FROM categorias WHERE UPPER(nombre) = ? AND id != ? LIMIT 1",
      [cleanNombre, categoriaId]
    );
    if (existing.length > 0) {
      res.status(409).json({ success: false, message: `La categor\xEDa '${cleanNombre}' ya est\xE1 en uso.` });
      return;
    }
    await pool.query(
      `UPDATE categorias 
       SET nombre = ?, 
           descripcion = ?,
           es_equipo_taller = ?,
           es_venta = ?,
           es_repuesto_taller = ?
       WHERE id = ?`,
      [
        cleanNombre,
        descripcion?.trim() || null,
        Boolean(esEquipoTaller) ? 1 : 0,
        Boolean(esVenta) ? 1 : 0,
        Boolean(esRepuestoTaller) ? 1 : 0,
        categoriaId
      ]
    );
    res.json({
      success: true,
      message: "Categor\xEDa actualizada exitosamente.",
      categoria: {
        id: categoriaId,
        nombre: cleanNombre,
        descripcion: descripcion?.trim() || "",
        esEquipoTaller: Boolean(esEquipoTaller),
        esVenta: Boolean(esVenta),
        esRepuestoTaller: Boolean(esRepuestoTaller)
      }
    });
  } catch (error) {
    console.error("Error al actualizar categor\xEDa:", error);
    res.status(500).json({ success: false, message: "Error interno al actualizar categor\xEDa." });
  }
}
async function toggleCategoriaEstado(req, res) {
  try {
    const categoriaId = Number(req.params.id);
    if (isNaN(categoriaId)) {
      res.status(400).json({ success: false, message: "ID de categor\xEDa inv\xE1lido." });
      return;
    }
    const [rows] = await pool.query(
      "SELECT id, estado_id FROM categorias WHERE id = ?",
      [categoriaId]
    );
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: "Categor\xEDa no encontrada." });
      return;
    }
    const nuevoEstadoId = rows[0].estado_id === 1 ? 2 : 1;
    await pool.query("UPDATE categorias SET estado_id = ? WHERE id = ?", [nuevoEstadoId, categoriaId]);
    res.json({
      success: true,
      message: `Categor\xEDa ${nuevoEstadoId === 1 ? "activada" : "desactivada"} correctamente.`,
      nuevoEstado: nuevoEstadoId === 1 ? "ACTIVO" : "INACTIVO",
      nuevoEstadoId
    });
  } catch (error) {
    console.error("Error al alternar estado de categor\xEDa:", error);
    res.status(500).json({ success: false, message: "Error interno al alternar estado." });
  }
}

// server/routes/category.routes.ts
var router6 = Router6();
router6.get("/categorias", authenticateToken, getCategorias);
router6.post("/categorias", authenticateToken, requirePermission("categorias", "ALMACEN"), createCategoria);
router6.put("/categorias/:id", authenticateToken, requirePermission("categorias", "ALMACEN"), updateCategoria);
router6.patch("/categorias/:id/estado", authenticateToken, requirePermission("categorias", "ALMACEN"), toggleCategoriaEstado);
var category_routes_default = router6;

// server/routes/warranty.routes.ts
import { Router as Router7 } from "express";

// server/controllers/warranty.controller.ts
async function verificarGarantia(req, res) {
  try {
    const serie = req.query.serie ? String(req.query.serie).trim().toUpperCase() : "";
    if (!serie) {
      res.status(400).json({ success: false, message: "Debe ingresar un n\xFAmero de serie." });
      return;
    }
    const [rows] = await pool.query(
      `SELECT psg.id, psg.numero_serie, psg.meses_garantia, psg.fecha_venta,
              psg.estado_garantia, psg.observaciones,
              p.id AS producto_id, p.nombre AS producto_nombre, p.codigo AS producto_codigo,
              p.modelo_id, mo.nombre AS modelo_nombre,
              m.nombre AS marca_nombre,
              v.id AS venta_id, v.codigo_comprobante,
              c.id_cliente AS cliente_id,
              COALESCE(NULLIF(TRIM(c.razon_social), ''), CONCAT(COALESCE(per.nombres, ''), ' ', COALESCE(per.apellidos, ''))) AS cliente_nombre,
              COALESCE(c.ruc, per.dni, '') AS cliente_documento,
              per.telefono AS cliente_telefono
       FROM producto_series_garantia psg
       LEFT JOIN productos p ON psg.producto_id = p.id
       LEFT JOIN marcas m ON p.marca_id = m.id
       LEFT JOIN modelos mo ON p.modelo_id = mo.id
       LEFT JOIN ventas v ON psg.venta_id = v.id
       LEFT JOIN clientes c ON psg.cliente_id = c.id_cliente
       LEFT JOIN personas per ON c.id_persona = per.id_persona
       WHERE UPPER(psg.numero_serie) = ?
       LIMIT 1`,
      [serie]
    );
    if (rows.length === 0) {
      res.json({
        success: true,
        encontrado: false,
        estado: "NO_REGISTRADO",
        serie,
        message: "El n\xFAmero de serie no figura en el registro de ventas de MG Solutions."
      });
      return;
    }
    const r = rows[0];
    const fechaVenta = new Date(r.fecha_venta);
    const meses = Number(r.meses_garantia) || 12;
    let caracteristicas = [];
    if (r.modelo_id) {
      const [detalles] = await pool.query(
        "SELECT atributo, valor FROM detalle_modelo WHERE modelo_id = ? ORDER BY id ASC",
        [r.modelo_id]
      );
      caracteristicas = detalles.map((d) => ({ atributo: d.atributo, valor: d.valor }));
    }
    const fechaExpiracion = new Date(fechaVenta);
    fechaExpiracion.setMonth(fechaExpiracion.getMonth() + meses);
    const hoy = /* @__PURE__ */ new Date();
    const diferenciaMs = fechaExpiracion.getTime() - hoy.getTime();
    const diasRestantes = Math.ceil(diferenciaMs / (1e3 * 60 * 60 * 24));
    let estadoCalculado = "VIGENTE";
    if (r.estado_garantia === "ANULADA_DANO_FISICO") {
      estadoCalculado = "ANULADA_DANO_FISICO";
    } else if (diasRestantes <= 0) {
      estadoCalculado = "VENCIDA";
    }
    res.json({
      success: true,
      encontrado: true,
      serie: r.numero_serie,
      estado: estadoCalculado,
      diasRestantes: Math.max(0, diasRestantes),
      diasVencida: diasRestantes < 0 ? Math.abs(diasRestantes) : 0,
      fechaVenta: fechaVenta.toISOString().split("T")[0],
      fechaExpiracion: fechaExpiracion.toISOString().split("T")[0],
      mesesGarantia: meses,
      producto: {
        id: r.producto_id,
        nombre: r.producto_nombre || "Equipo Computacional",
        codigo: r.producto_codigo || "",
        marca: r.marca_nombre || "GEN\xC9RICO",
        modelo: r.modelo_nombre || null,
        caracteristicas
      },
      comprobante: r.codigo_comprobante || "VENTA EN TIENDA",
      cliente: {
        id: r.cliente_id,
        nombre: r.cliente_nombre ? String(r.cliente_nombre).trim() : "Cliente Particular",
        documento: r.cliente_documento || "",
        telefono: r.cliente_telefono || ""
      },
      observaciones: r.observaciones || ""
    });
  } catch (error) {
    console.error("Error al verificar garant\xEDa:", error);
    res.status(500).json({ success: false, message: "Error interno al consultar garant\xEDa." });
  }
}
async function registrarIngresoGarantia(req, res) {
  const connection = await pool.getConnection();
  try {
    const {
      numeroSerie,
      clienteNombre,
      clienteTelefono,
      clienteDocumento,
      marca,
      modelo,
      fallaReclamada,
      observacionesEsteticas,
      checklistFisico,
      // { pantallaRota: false, liquidos: false, golpes: false, sellosViolados: false }
      usuarioRecibeId
    } = req.body;
    if (!numeroSerie || !fallaReclamada) {
      res.status(400).json({
        success: false,
        message: "El n\xFAmero de serie y la falla reclamada son obligatorios."
      });
      return;
    }
    const tieneDanoFisico = checklistFisico?.pantallaRota || checklistFisico?.liquidos || checklistFisico?.golpes || checklistFisico?.sellosViolados;
    if (tieneDanoFisico) {
      res.status(400).json({
        success: false,
        message: "No procede garant\xEDa de f\xE1brica: el equipo presenta da\xF1os f\xEDsicos, ca\xEDdas o humedad."
      });
      return;
    }
    await connection.beginTransaction();
    const [garantiaRows] = await connection.query(
      `SELECT psg.id, psg.venta_id, v.cliente_id,
              COALESCE(NULLIF(TRIM(c.razon_social), ''), CONCAT(COALESCE(p.nombres, ''), ' ', COALESCE(p.apellidos, ''))) AS cliente_nombre,
              COALESCE(c.ruc, p.dni, '') AS cliente_documento,
              p.telefono AS cliente_telefono
       FROM producto_series_garantia psg
       JOIN ventas v ON psg.venta_id = v.id
       JOIN clientes c ON v.cliente_id = c.id_cliente
       JOIN personas p ON c.id_persona = p.id_persona
       WHERE UPPER(psg.numero_serie) = ? LIMIT 1`,
      [String(numeroSerie).trim().toUpperCase()]
    );
    const clienteRealId = garantiaRows[0]?.cliente_id || 1;
    const titularNombre = garantiaRows[0]?.cliente_nombre || clienteNombre || "Titular";
    const titularDoc = garantiaRows[0]?.cliente_documento || "";
    const titularTel = clienteTelefono || garantiaRows[0]?.cliente_telefono || "N/A";
    const [maxRows] = await connection.query(
      "SELECT COUNT(*) as total FROM ordenes_servicio"
    );
    const correlativo = String(Number(maxRows[0].total) + 1).padStart(5, "0");
    const codigoOrden = `GAR-${correlativo}`;
    const [eqRows] = await connection.query(
      "SELECT id FROM equipos WHERE UPPER(numero_serie) = ? LIMIT 1",
      [String(numeroSerie).trim().toUpperCase()]
    );
    let equipoId;
    if (eqRows.length > 0) {
      equipoId = eqRows[0].id;
    } else {
      const [eqInsert] = await connection.query(
        `INSERT INTO equipos (cliente_id, tipo_equipo_id, marca, modelo, numero_serie, accesorios, estado_id)
         VALUES (?, 1, ?, ?, ?, 'Cargador Original', 1)`,
        [clienteRealId, marca || "DESCONOCIDA", modelo || "MODELO NO ESPECIFICADO", numeroSerie]
      );
      equipoId = eqInsert.insertId;
    }
    const fechaPromesa = /* @__PURE__ */ new Date();
    fechaPromesa.setDate(fechaPromesa.getDate() + 3);
    const obsTexto = `[INGRESO POR GARANT\xCDA OFICIAL]
Estado Est\xE9tico: ${observacionesEsteticas || "Normal"}
Cliente: ${titularNombre} (Doc: ${titularDoc} | Tel: ${titularTel})
Checklist: Sin ca\xEDdas, sin humedad, sellos \xEDntegros.`;
    const [ordenInsert] = await connection.query(
      `INSERT INTO ordenes_servicio (
         codigo, cliente_id, equipo_id, usuario_recibe_id,
         descripcion_falla, costo_servicio, estado_orden_id, prioridad_id,
         fecha_ingreso, fecha_promesa, observaciones
       ) VALUES (?, ?, ?, ?, ?, 0.00, 1, 2, NOW(), ?, ?)`,
      [codigoOrden, clienteRealId, equipoId, usuarioRecibeId || 1, fallaReclamada, fechaPromesa, obsTexto]
    );
    await connection.commit();
    res.status(201).json({
      success: true,
      message: `Orden de Garant\xEDa #${codigoOrden} generada exitosamente a costo S/ 0.00.`,
      orden: {
        id: ordenInsert.insertId,
        codigo: codigoOrden,
        numeroSerie,
        marca,
        modelo,
        falla: fallaReclamada,
        costo: 0,
        fechaIngreso: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al registrar ingreso de garant\xEDa:", error);
    res.status(500).json({ success: false, message: "Error interno al registrar garant\xEDa." });
  } finally {
    connection.release();
  }
}

// server/routes/warranty.routes.ts
var router7 = Router7();
router7.get("/garantias/verificar", authenticateToken, verificarGarantia);
router7.post("/garantias/ingreso", authenticateToken, registrarIngresoGarantia);
var warranty_routes_default = router7;

// server/routes/warehouse.routes.ts
import { Router as Router8 } from "express";

// server/controllers/warehouse.controller.ts
async function getAlmacenResumen(req, res) {
  try {
    const sucursalIdQuery = req.query.sucursal_id && String(req.query.sucursal_id) !== "TODOS" && !isNaN(Number(req.query.sucursal_id)) ? Number(req.query.sucursal_id) : null;
    let statsQuery = "";
    const params = [];
    if (sucursalIdQuery) {
      statsQuery = `
        SELECT 
          (SELECT COUNT(*) FROM productos WHERE estado_id = 1) AS totalProductos,
          (SELECT COALESCE(SUM(stock), 0) FROM producto_stock_sede WHERE sucursal_id = ?) AS totalUnidadesStock,
          (SELECT COUNT(*) FROM producto_unidades WHERE estado_unidad_id = 1 AND disponible_venta = 1 AND sucursal_id = ?) AS seriesDisponiblesVenta,
          (SELECT COUNT(*) FROM producto_unidades WHERE estado_unidad_id = 5 AND sucursal_id = ?) AS seriesCuarentenaDanadas,
          (SELECT COUNT(*) FROM producto_unidades WHERE (estado_unidad_id = 3 OR tipo_destino = 'SERVICIO_TALLER') AND sucursal_id = ?) AS seriesUsoTaller,
          (SELECT COUNT(*) FROM productos WHERE disponible_venta = 1 AND estado_id = 1) AS productosVisiblesPOS,
          (SELECT COUNT(*) FROM productos WHERE disponible_venta = 0 AND estado_id = 1) AS productosOcultosPOS
      `;
      params.push(sucursalIdQuery, sucursalIdQuery, sucursalIdQuery, sucursalIdQuery);
    } else {
      statsQuery = `
        SELECT 
          (SELECT COUNT(*) FROM productos WHERE estado_id = 1) AS totalProductos,
          (SELECT COALESCE(SUM(stock), 0) FROM producto_stock_sede) AS totalUnidadesStock,
          (SELECT COUNT(*) FROM producto_unidades WHERE estado_unidad_id = 1 AND disponible_venta = 1) AS seriesDisponiblesVenta,
          (SELECT COUNT(*) FROM producto_unidades WHERE estado_unidad_id = 5) AS seriesCuarentenaDanadas,
          (SELECT COUNT(*) FROM producto_unidades WHERE estado_unidad_id = 3 OR tipo_destino = 'SERVICIO_TALLER') AS seriesUsoTaller,
          (SELECT COUNT(*) FROM productos WHERE disponible_venta = 1 AND estado_id = 1) AS productosVisiblesPOS,
          (SELECT COUNT(*) FROM productos WHERE disponible_venta = 0 AND estado_id = 1) AS productosOcultosPOS
      `;
    }
    const [stats] = await pool.query(statsQuery, params);
    res.json({
      success: true,
      data: stats[0] || {}
    });
  } catch (error) {
    console.error("Error al obtener resumen de almac\xE9n:", error);
    res.status(500).json({ success: false, message: "Error al consultar resumen de almac\xE9n." });
  }
}
async function getInventarioJerarquico(req, res) {
  try {
    const categoriaId = req.query.categoria_id ? Number(req.query.categoria_id) : null;
    const marcaId = req.query.marca_id ? Number(req.query.marca_id) : null;
    const tipoDestino = req.query.tipo_destino ? String(req.query.tipo_destino) : null;
    const search = req.query.search ? String(req.query.search).trim() : null;
    const sucursalIdQuery = req.query.sucursal_id && String(req.query.sucursal_id) !== "TODOS" && !isNaN(Number(req.query.sucursal_id)) ? Number(req.query.sucursal_id) : null;
    let query = `
      SELECT 
        p.id AS productoId,
        p.codigo,
        p.nombre AS productoNombre,
        p.descripcion AS productoDescripcion,
        p.categoria_id AS categoriaId,
        c.nombre AS categoriaNombre,
        c.requiere_serie AS categoriaRequiereSerie,
        p.marca_id AS marcaId,
        m.nombre AS marcaNombre,
        p.modelo_id AS modeloId,
        mo.nombre AS modeloNombre,
        mo.descripcion AS modeloDescripcion,
        p.precio_venta AS precioVenta,
        p.precio_costo AS precioCosto,
        p.stock_minimo AS stockMinimo,
        p.requiere_serie AS requiereSerie,
        p.disponible_venta AS disponibleVenta,
        p.tipo_destino AS tipoDestino,
        e.nombre AS estado,
        p.estado_id AS estadoId,
        COALESCE(stk.stockTotal, 0) AS stockTotal,
        COALESCE(uni.totalSeries, 0) AS totalSeries,
        COALESCE(uni.seriesDisponibles, 0) AS seriesDisponibles,
        COALESCE(uni.seriesCuarentena, 0) AS seriesCuarentena,
        COALESCE(uni.seriesTaller, 0) AS seriesTaller,
        COALESCE(uni.seriesVendidas, 0) AS seriesVendidas
      FROM productos p
      INNER JOIN categorias c ON p.categoria_id = c.id
      INNER JOIN marcas m ON p.marca_id = m.id
      LEFT JOIN modelos mo ON p.modelo_id = mo.id
      INNER JOIN estados e ON p.estado_id = e.id
      LEFT JOIN (
        SELECT producto_id, SUM(stock) AS stockTotal 
        FROM producto_stock_sede 
        GROUP BY producto_id
      ) stk ON stk.producto_id = p.id
      LEFT JOIN (
        SELECT 
          producto_id,
          COUNT(id) AS totalSeries,
          SUM(CASE WHEN estado_unidad_id = 1 AND disponible_venta = 1 THEN 1 ELSE 0 END) AS seriesDisponibles,
          SUM(CASE WHEN estado_unidad_id = 5 THEN 1 ELSE 0 END) AS seriesCuarentena,
          SUM(CASE WHEN estado_unidad_id = 3 OR tipo_destino = 'SERVICIO_TALLER' THEN 1 ELSE 0 END) AS seriesTaller,
          SUM(CASE WHEN estado_unidad_id = 2 THEN 1 ELSE 0 END) AS seriesVendidas
        FROM producto_unidades
        GROUP BY producto_id
      ) uni ON uni.producto_id = p.id
      WHERE 1=1
    `;
    const params = [];
    if (categoriaId && !isNaN(categoriaId)) {
      query += " AND p.categoria_id = ?";
      params.push(categoriaId);
    }
    if (marcaId && !isNaN(marcaId)) {
      query += " AND p.marca_id = ?";
      params.push(marcaId);
    }
    if (tipoDestino && ["VENTA", "SERVICIO_TALLER", "MIXTO"].includes(tipoDestino)) {
      query += " AND p.tipo_destino = ?";
      params.push(tipoDestino);
    }
    if (search) {
      query += " AND (p.nombre LIKE ? OR p.codigo LIKE ? OR m.nombre LIKE ? OR mo.nombre LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    query += " ORDER BY c.nombre ASC, m.nombre ASC, mo.nombre ASC, p.nombre ASC";
    const [productosRows] = await pool.query(query, params);
    const modeloIds = Array.from(new Set(productosRows.map((r) => r.modeloId).filter(Boolean)));
    const detallesPorModelo = /* @__PURE__ */ new Map();
    if (modeloIds.length > 0) {
      const [detalles] = await pool.query(
        "SELECT modelo_id AS modeloId, atributo, valor FROM detalle_modelo WHERE modelo_id IN (?) ORDER BY id ASC",
        [modeloIds]
      );
      for (const d of detalles) {
        if (!detallesPorModelo.has(d.modeloId)) {
          detallesPorModelo.set(d.modeloId, []);
        }
        detallesPorModelo.get(d.modeloId).push({
          atributo: d.atributo,
          valor: d.valor || ""
        });
      }
    }
    const prodIds = productosRows.map((r) => r.productoId);
    const stockPorSedeMap = /* @__PURE__ */ new Map();
    if (prodIds.length > 0) {
      const [sedeStockRows] = await pool.query(`
        SELECT pss.producto_id AS productoId, pss.sucursal_id AS sucursalId, s.nombre AS sucursalNombre, pss.stock
        FROM producto_stock_sede pss
        INNER JOIN sucursales s ON pss.sucursal_id = s.id
        WHERE pss.producto_id IN (?)
      `, [prodIds]);
      for (const r of sedeStockRows) {
        if (!stockPorSedeMap.has(r.productoId)) {
          stockPorSedeMap.set(r.productoId, []);
        }
        stockPorSedeMap.get(r.productoId).push({
          sucursalId: r.sucursalId,
          sucursalNombre: r.sucursalNombre,
          stock: Number(r.stock) || 0
        });
      }
    }
    const items = productosRows.map((p) => {
      const modeloId = p.modeloId ? Number(p.modeloId) : null;
      return {
        id: p.productoId,
        codigo: p.codigo,
        nombre: p.productoNombre,
        descripcion: p.productoDescripcion || "",
        categoria: {
          id: p.categoriaId,
          nombre: p.categoriaNombre,
          requiereSerie: Boolean(p.categoriaRequiereSerie)
        },
        marca: {
          id: p.marcaId,
          nombre: p.marcaNombre
        },
        modelo: modeloId ? {
          id: modeloId,
          nombre: p.modeloNombre,
          descripcion: p.modeloDescripcion || "",
          caracteristicas: detallesPorModelo.get(modeloId) || []
        } : null,
        precioVenta: Number(p.precioVenta) || 0,
        precioCosto: Number(p.precioCosto) || 0,
        stockMinimo: Number(p.stockMinimo) || 0,
        requiereSerie: Boolean(p.requiereSerie || p.categoriaRequiereSerie),
        disponibleVenta: Boolean(p.disponibleVenta),
        tipoDestino: p.tipoDestino,
        estado: p.estado,
        estadoId: p.estadoId,
        stockTotal: Math.max(Number(p.stockTotal) || 0, Number(p.seriesDisponibles) || 0),
        stockSede: sucursalIdQuery ? stockPorSedeMap.get(p.productoId)?.find((s) => s.sucursalId === sucursalIdQuery)?.stock ?? 0 : Math.max(Number(p.stockTotal) || 0, Number(p.seriesDisponibles) || 0),
        stockPorSede: stockPorSedeMap.get(p.productoId) || [],
        seriesMetricas: {
          total: Number(p.totalSeries) || 0,
          disponibles: Number(p.seriesDisponibles) || 0,
          cuarentenaDanadas: Number(p.seriesCuarentena) || 0,
          taller: Number(p.seriesTaller) || 0,
          vendidas: Number(p.seriesVendidas) || 0
        }
      };
    });
    res.json({
      success: true,
      total: items.length,
      inventario: items
    });
  } catch (error) {
    console.error("Error al obtener inventario jer\xE1rquico:", error);
    res.status(500).json({ success: false, message: "Error interno al consultar inventario." });
  }
}
async function getUnidadesProducto(req, res) {
  try {
    const productoId = Number(req.params.id);
    if (isNaN(productoId)) {
      res.status(400).json({ success: false, message: "ID de producto inv\xE1lido." });
      return;
    }
    const sucursalIdQuery = req.query.sucursal_id && String(req.query.sucursal_id) !== "TODOS" && !isNaN(Number(req.query.sucursal_id)) ? Number(req.query.sucursal_id) : null;
    let query = `
      SELECT 
        u.id,
        u.producto_id AS productoId,
        p.nombre AS productoNombre,
        p.codigo AS productoCodigo,
        u.sucursal_id AS sucursalId,
        s.nombre AS sucursalNombre,
        u.numero_serie AS numeroSerie,
        u.estado_unidad_id AS estadoUnidadId,
        eu.codigo AS estadoCodigo,
        eu.nombre AS estadoNombre,
        u.tipo_destino AS tipoDestino,
        u.disponible_venta AS disponibleVenta,
        u.condicion,
        u.observaciones,
        u.costo_adquisicion AS costoAdquisicion,
        u.fecha_ingreso AS fechaIngreso,
        u.created_at AS createdAt
      FROM producto_unidades u
      INNER JOIN productos p ON u.producto_id = p.id
      INNER JOIN sucursales s ON u.sucursal_id = s.id
      INNER JOIN estados_unidad eu ON u.estado_unidad_id = eu.id
      WHERE u.producto_id = ?
    `;
    const params = [productoId];
    if (sucursalIdQuery) {
      query += " AND u.sucursal_id = ?";
      params.push(sucursalIdQuery);
    }
    query += " ORDER BY u.id DESC";
    const [rows] = await pool.query(query, params);
    res.json({
      success: true,
      total: rows.length,
      unidades: rows.map((r) => ({
        id: r.id,
        productoId: r.productoId,
        productoNombre: r.productoNombre,
        productoCodigo: r.productoCodigo,
        sucursalId: r.sucursalId,
        sucursalNombre: r.sucursalNombre,
        numeroSerie: r.numeroSerie,
        estadoUnidadId: r.estadoUnidadId,
        estadoCodigo: r.estadoCodigo,
        estadoNombre: r.estadoNombre,
        tipoDestino: r.tipoDestino,
        disponibleVenta: Boolean(r.disponibleVenta),
        condicion: r.condicion,
        observaciones: r.observaciones || "",
        costoAdquisicion: r.costoAdquisicion ? Number(r.costoAdquisicion) : null,
        fechaIngreso: r.fechaIngreso
      }))
    });
  } catch (error) {
    console.error("Error al obtener unidades del producto:", error);
    res.status(500).json({ success: false, message: "Error interno al consultar n\xFAmeros de serie." });
  }
}
async function registrarUnidadesProducto(req, res) {
  const connection = await pool.getConnection();
  try {
    const productoId = Number(req.params.id);
    if (isNaN(productoId)) {
      res.status(400).json({ success: false, message: "ID de producto inv\xE1lido." });
      return;
    }
    const {
      sucursalId = 1,
      series = [],
      tipoDestino = "VENTA",
      disponibleVenta = true,
      condicion = "NUEVO",
      observaciones = "",
      costoAdquisicion = null
    } = req.body;
    if (!Array.isArray(series) || series.length === 0) {
      res.status(400).json({ success: false, message: "Debe ingresar al menos un n\xFAmero de serie." });
      return;
    }
    const cleanSeries = Array.from(new Set(series.map((s) => String(s).trim()).filter(Boolean)));
    if (cleanSeries.length === 0) {
      res.status(400).json({ success: false, message: "Los n\xFAmeros de serie ingresados no son v\xE1lidos." });
      return;
    }
    const [existentes] = await connection.query(
      "SELECT numero_serie FROM producto_unidades WHERE producto_id = ? AND numero_serie IN (?)",
      [productoId, cleanSeries]
    );
    if (existentes.length > 0) {
      const duplicados = existentes.map((e) => e.numero_serie).join(", ");
      res.status(409).json({
        success: false,
        message: `Los siguientes n\xFAmeros de serie ya est\xE1n registrados: ${duplicados}`
      });
      return;
    }
    const esDanado = ["DANADO_RECEPCION", "DEFECTUOSO"].includes(condicion);
    const estadoUnidadId = esDanado ? 5 : 1;
    const realDisponibleVenta = esDanado ? 0 : disponibleVenta ? 1 : 0;
    await connection.beginTransaction();
    for (const serie of cleanSeries) {
      await connection.query(
        `INSERT INTO producto_unidades 
         (producto_id, sucursal_id, numero_serie, estado_unidad_id, tipo_destino, disponible_venta, condicion, observaciones, costo_adquisicion, fecha_ingreso)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          productoId,
          sucursalId,
          serie,
          estadoUnidadId,
          tipoDestino,
          realDisponibleVenta,
          condicion,
          observaciones.trim() || null,
          costoAdquisicion
        ]
      );
    }
    const [stockActual] = await connection.query(
      "SELECT stock FROM producto_stock_sede WHERE producto_id = ? AND sucursal_id = ?",
      [productoId, sucursalId]
    );
    if (stockActual.length > 0) {
      await connection.query(
        "UPDATE producto_stock_sede SET stock = stock + ?, updated_at = NOW() WHERE producto_id = ? AND sucursal_id = ?",
        [cleanSeries.length, productoId, sucursalId]
      );
    } else {
      await connection.query(
        "INSERT INTO producto_stock_sede (producto_id, sucursal_id, stock, updated_at) VALUES (?, ?, ?, NOW())",
        [productoId, sucursalId, cleanSeries.length]
      );
    }
    await connection.query(
      "UPDATE productos SET requiere_serie = 1, updated_at = NOW() WHERE id = ?",
      [productoId]
    );
    await connection.commit();
    res.status(201).json({
      success: true,
      message: `Se registraron exitosamente ${cleanSeries.length} unidades con N\xB0 de serie.`,
      unidadesRegistradas: cleanSeries.length,
      estadoAsignado: esDanado ? "En Cuarentena / Da\xF1ado (Bloqueado de venta)" : "Disponible"
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al registrar unidades con serie:", error);
    res.status(500).json({ success: false, message: "Error interno al registrar unidades con serie." });
  } finally {
    connection.release();
  }
}
async function updateEstadoUnidad(req, res) {
  try {
    const unidadId = Number(req.params.id);
    if (isNaN(unidadId)) {
      res.status(400).json({ success: false, message: "ID de unidad inv\xE1lido." });
      return;
    }
    const { estadoUnidadId, disponibleVenta, condicion, observaciones, tipoDestino } = req.body;
    const [rows] = await pool.query(
      "SELECT id, numero_serie, estado_unidad_id FROM producto_unidades WHERE id = ?",
      [unidadId]
    );
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: "Unidad no encontrada." });
      return;
    }
    let finalDisponibleVenta = disponibleVenta !== void 0 ? disponibleVenta ? 1 : 0 : void 0;
    if (estadoUnidadId === 5 || estadoUnidadId === 6 || condicion === "DANADO_RECEPCION" || condicion === "DEFECTUOSO") {
      finalDisponibleVenta = 0;
    }
    const fields = [];
    const params = [];
    if (estadoUnidadId !== void 0) {
      fields.push("estado_unidad_id = ?");
      params.push(Number(estadoUnidadId));
    }
    if (finalDisponibleVenta !== void 0) {
      fields.push("disponible_venta = ?");
      params.push(finalDisponibleVenta);
    }
    if (condicion !== void 0) {
      fields.push("condicion = ?");
      params.push(condicion);
    }
    if (tipoDestino !== void 0) {
      fields.push("tipo_destino = ?");
      params.push(tipoDestino);
    }
    if (observaciones !== void 0) {
      fields.push("observaciones = ?");
      params.push(observaciones ? String(observaciones).trim() : null);
    }
    if (fields.length === 0) {
      res.status(400).json({ success: false, message: "No se enviaron campos para actualizar." });
      return;
    }
    params.push(unidadId);
    await pool.query(`UPDATE producto_unidades SET ${fields.join(", ")} WHERE id = ?`, params);
    res.json({
      success: true,
      message: "Estado de la unidad actualizado exitosamente."
    });
  } catch (error) {
    console.error("Error al actualizar estado de la unidad:", error);
    res.status(500).json({ success: false, message: "Error interno al actualizar estado de la unidad." });
  }
}
async function toggleVisibilidadVentaProducto(req, res) {
  try {
    const productoId = Number(req.params.id);
    if (isNaN(productoId)) {
      res.status(400).json({ success: false, message: "ID de producto inv\xE1lido." });
      return;
    }
    const { disponibleVenta } = req.body;
    const valor = disponibleVenta !== void 0 ? disponibleVenta ? 1 : 0 : null;
    if (valor === null) {
      await pool.query(
        "UPDATE productos SET disponible_venta = CASE WHEN disponible_venta = 1 THEN 0 ELSE 1 END WHERE id = ?",
        [productoId]
      );
    } else {
      await pool.query(
        "UPDATE productos SET disponible_venta = ? WHERE id = ?",
        [valor, productoId]
      );
    }
    const [updated] = await pool.query(
      "SELECT disponible_venta FROM productos WHERE id = ?",
      [productoId]
    );
    const isVisible = Boolean(updated[0]?.disponible_venta);
    res.json({
      success: true,
      message: isVisible ? "El producto ahora es VISIBLE para los vendedores en Punto de Venta." : "El producto ha sido OCULTADO del Punto de Venta (exclusivo para Almac\xE9n / Taller).",
      disponibleVenta: isVisible
    });
  } catch (error) {
    console.error("Error al alternar visibilidad de venta:", error);
    res.status(500).json({ success: false, message: "Error interno al cambiar visibilidad de venta." });
  }
}
async function createProductoAlmacen(req, res) {
  const connection = await pool.getConnection();
  try {
    const {
      codigo,
      nombre,
      descripcion = "",
      categoriaId,
      marcaId,
      modeloId = null,
      precioVenta = 0,
      precioCosto = 0,
      stockMinimo = 5,
      requiereSerie = false,
      disponibleVenta = true,
      tipoDestino = "VENTA",
      stockInicial = 0,
      sucursalId = 1,
      seriesIniciales = []
    } = req.body;
    if (!nombre || !nombre.trim()) {
      res.status(400).json({ success: false, message: "El nombre del producto es obligatorio." });
      return;
    }
    if (!categoriaId || !marcaId) {
      res.status(400).json({ success: false, message: "La categor\xEDa y marca son obligatorias." });
      return;
    }
    const cleanCodigo = codigo && codigo.trim() ? codigo.trim() : `PRD-${Date.now().toString().slice(-6)}`;
    await connection.beginTransaction();
    const [insertResult] = await connection.query(
      `INSERT INTO productos 
       (codigo, nombre, descripcion, categoria_id, marca_id, modelo_id, precio_venta, precio_costo, stock_minimo, requiere_serie, disponible_venta, tipo_destino, estado_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [
        cleanCodigo,
        nombre.trim(),
        descripcion.trim(),
        Number(categoriaId),
        Number(marcaId),
        modeloId ? Number(modeloId) : null,
        Number(precioVenta),
        Number(precioCosto),
        Number(stockMinimo),
        requiereSerie ? 1 : 0,
        disponibleVenta ? 1 : 0,
        tipoDestino
      ]
    );
    const newProdId = insertResult.insertId;
    if (requiereSerie && Array.isArray(seriesIniciales) && seriesIniciales.length > 0) {
      for (const s of seriesIniciales) {
        if (s && String(s).trim()) {
          await connection.query(
            `INSERT INTO producto_unidades 
             (producto_id, sucursal_id, numero_serie, estado_unidad_id, tipo_destino, disponible_venta, condicion, fecha_ingreso)
             VALUES (?, ?, ?, 1, ?, ?, 'NUEVO', NOW())`,
            [newProdId, sucursalId, String(s).trim(), tipoDestino, disponibleVenta ? 1 : 0]
          );
        }
      }
      await connection.query(
        "INSERT INTO producto_stock_sede (producto_id, sucursal_id, stock, updated_at) VALUES (?, ?, ?, NOW())",
        [newProdId, sucursalId, seriesIniciales.length]
      );
    } else if (Number(stockInicial) > 0) {
      await connection.query(
        "INSERT INTO producto_stock_sede (producto_id, sucursal_id, stock, updated_at) VALUES (?, ?, ?, NOW())",
        [newProdId, sucursalId, Number(stockInicial)]
      );
    }
    await connection.commit();
    res.status(201).json({
      success: true,
      message: "Producto registrado en almac\xE9n exitosamente.",
      productoId: newProdId
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al crear producto en almac\xE9n:", error);
    res.status(500).json({ success: false, message: "Error interno al registrar producto." });
  } finally {
    connection.release();
  }
}

// server/routes/warehouse.routes.ts
var router8 = Router8();
router8.use("/almacen", authenticateToken);
router8.get("/almacen/resumen", getAlmacenResumen);
router8.get("/almacen/inventario", getInventarioJerarquico);
router8.post("/almacen/productos", createProductoAlmacen);
router8.patch("/almacen/productos/:id/visibilidad-venta", toggleVisibilidadVentaProducto);
router8.get("/almacen/productos/:id/unidades", getUnidadesProducto);
router8.post("/almacen/productos/:id/unidades", registrarUnidadesProducto);
router8.patch("/almacen/unidades/:id/estado", updateEstadoUnidad);
var warehouse_routes_default = router8;

// server/routes/sale.routes.ts
import { Router as Router9 } from "express";

// server/controllers/sale.controller.ts
init_mailer();
async function getVentas(req, res) {
  try {
    const { search, limit = "50", page = "1" } = req.query;
    const limitNum = Math.min(Number(limit) || 50, 100);
    const offset = ((Number(page) || 1) - 1) * limitNum;
    let query = `
      SELECT v.id, v.codigo_comprobante AS codigoComprobante,
             tc.codigo AS tipoComprobanteCodigo, tc.nombre AS tipoComprobanteNombre,
             v.cliente_id AS clienteId,
             COALESCE(NULLIF(TRIM(c.razon_social), ''), CONCAT(COALESCE(per.nombres, ''), ' ', COALESCE(per.apellidos, ''))) AS clienteNombre,
             COALESCE(c.ruc, per.dni, '') AS clienteDocumento,
             per.telefono AS clienteTelefono,
             per.correo AS clienteEmail,
             v.subtotal, v.igv, v.total,
             mp.codigo AS metodoPagoCodigo, mp.nombre AS metodoPagoNombre,
             e.nombre AS estado, v.estado_id AS estadoId,
             v.fecha_venta AS fechaVenta,
             v.observaciones,
             s.nombre AS sucursalNombre,
             u.nombre_completo AS vendedorNombre,
             COUNT(dv.id) AS totalItems
      FROM ventas v
      INNER JOIN tipos_comprobante tc ON v.tipo_comprobante_id = tc.id
      INNER JOIN estados e ON v.estado_id = e.id
      INNER JOIN metodos_pago mp ON v.metodo_pago_id = mp.id
      LEFT JOIN clientes c ON v.cliente_id = c.id_cliente
      LEFT JOIN personas per ON c.id_persona = per.id_persona
      LEFT JOIN sucursales s ON v.sucursal_id = s.id
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      LEFT JOIN detalle_ventas dv ON dv.venta_id = v.id
      WHERE 1=1
    `;
    const params = [];
    if (search && String(search).trim()) {
      const term = `%${String(search).trim()}%`;
      query += ` AND (v.codigo_comprobante LIKE ? OR c.razon_social LIKE ? OR per.nombres LIKE ? OR per.apellidos LIKE ? OR per.dni LIKE ? OR c.ruc LIKE ?)`;
      params.push(term, term, term, term, term, term);
    }
    query += `
      GROUP BY v.id, v.codigo_comprobante, tc.codigo, tc.nombre, v.cliente_id,
               c.razon_social, per.nombres, per.apellidos, c.ruc, per.dni, per.telefono, per.correo,
               v.subtotal, v.igv, v.total, mp.codigo, mp.nombre, e.nombre, v.estado_id,
               v.fecha_venta, v.observaciones, s.nombre, u.nombre_completo
      ORDER BY v.fecha_venta DESC, v.id DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limitNum, offset);
    const [rows] = await pool.query(query, params);
    res.json({
      success: true,
      total: rows.length,
      ventas: rows.map((r) => ({
        id: r.id,
        codigoComprobante: r.codigoComprobante,
        tipoComprobante: r.tipoComprobanteCodigo,
        tipoComprobanteNombre: r.tipoComprobanteNombre,
        cliente: {
          id: r.clienteId,
          nombre: r.clienteNombre ? String(r.clienteNombre).trim() : "Cliente General",
          documento: r.clienteDocumento || "",
          telefono: r.clienteTelefono || "",
          email: r.clienteEmail || ""
        },
        subtotal: Number(r.subtotal) || 0,
        igv: Number(r.igv) || 0,
        total: Number(r.total) || 0,
        metodoPago: r.metodoPagoNombre,
        estado: r.estado,
        estadoId: r.estadoId,
        fechaVenta: r.fechaVenta,
        sucursal: r.sucursalNombre || "Principal",
        vendedor: r.vendedorNombre || "Vendedor",
        totalItems: Number(r.totalItems) || 0,
        observaciones: r.observaciones || ""
      }))
    });
  } catch (error) {
    console.error("Error al listar ventas:", error);
    res.status(500).json({ success: false, message: "Error interno al consultar historial de ventas." });
  }
}
async function getVentaById(req, res) {
  try {
    const ventaId = Number(req.params.id);
    if (isNaN(ventaId)) {
      res.status(400).json({ success: false, message: "ID de venta inv\xE1lido." });
      return;
    }
    const [ventaRows] = await pool.query(
      `SELECT v.id, v.codigo_comprobante AS codigoComprobante,
              tc.codigo AS tipoComprobanteCodigo, tc.nombre AS tipoComprobanteNombre,
              v.cliente_id AS clienteId,
              COALESCE(NULLIF(TRIM(c.razon_social), ''), CONCAT(COALESCE(per.nombres, ''), ' ', COALESCE(per.apellidos, ''))) AS clienteNombre,
              COALESCE(c.ruc, per.dni, '') AS clienteDocumento,
              per.telefono AS clienteTelefono, per.direccion AS clienteDireccion, per.correo AS clienteEmail,
              v.subtotal, v.igv, v.total,
              mp.codigo AS metodoPagoCodigo, mp.nombre AS metodoPagoNombre,
              e.nombre AS estado, v.fecha_venta AS fechaVenta,
              v.observaciones, s.nombre AS sucursalNombre, u.nombre_completo AS vendedorNombre
       FROM ventas v
       INNER JOIN tipos_comprobante tc ON v.tipo_comprobante_id = tc.id
       INNER JOIN estados e ON v.estado_id = e.id
       INNER JOIN metodos_pago mp ON v.metodo_pago_id = mp.id
       LEFT JOIN clientes c ON v.cliente_id = c.id_cliente
       LEFT JOIN personas per ON c.id_persona = per.id_persona
       LEFT JOIN sucursales s ON v.sucursal_id = s.id
       LEFT JOIN usuarios u ON v.usuario_id = u.id
       WHERE v.id = ?
       LIMIT 1`,
      [ventaId]
    );
    if (ventaRows.length === 0) {
      res.status(404).json({ success: false, message: "Venta no encontrada." });
      return;
    }
    const v = ventaRows[0];
    const [itemsRows] = await pool.query(
      `SELECT dv.id, dv.producto_id AS productoId,
              p.codigo AS productoCodigo, p.nombre AS productoNombre,
              m.nombre AS marcaNombre, mo.nombre AS modeloNombre,
              dv.cantidad, dv.precio_unitario AS precioUnitario,
              dv.descuento, dv.subtotal
       FROM detalle_ventas dv
       INNER JOIN productos p ON dv.producto_id = p.id
       LEFT JOIN marcas m ON p.marca_id = m.id
       LEFT JOIN modelos mo ON p.modelo_id = mo.id
       WHERE dv.venta_id = ?`,
      [ventaId]
    );
    const [seriesRows] = await pool.query(
      `SELECT psg.id, psg.producto_id AS productoId, psg.numero_serie AS numeroSerie,
              psg.meses_garantia AS mesesGarantia, psg.estado_garantia AS estadoGarantia
       FROM producto_series_garantia psg
       WHERE psg.venta_id = ?`,
      [ventaId]
    );
    const seriesPorProducto = /* @__PURE__ */ new Map();
    for (const s of seriesRows) {
      if (!seriesPorProducto.has(s.productoId)) {
        seriesPorProducto.set(s.productoId, []);
      }
      seriesPorProducto.get(s.productoId).push({
        numeroSerie: s.numeroSerie,
        mesesGarantia: Number(s.mesesGarantia) || 12,
        estadoGarantia: s.estadoGarantia
      });
    }
    res.json({
      success: true,
      venta: {
        id: v.id,
        codigoComprobante: v.codigoComprobante,
        tipoComprobante: v.tipoComprobanteCodigo,
        tipoComprobanteNombre: v.tipoComprobanteNombre,
        cliente: {
          id: v.clienteId,
          nombre: v.clienteNombre ? String(rClienteNombre(v.clienteNombre)) : "Cliente General",
          documento: v.clienteDocumento || "",
          telefono: v.clienteTelefono || "",
          direccion: v.clienteDireccion || "",
          email: v.clienteEmail || ""
        },
        subtotal: Number(v.subtotal) || 0,
        igv: Number(v.igv) || 0,
        total: Number(v.total) || 0,
        metodoPago: v.metodoPagoNombre,
        estado: v.estado,
        fechaVenta: v.fechaVenta,
        sucursal: v.sucursalNombre || "Principal",
        vendedor: v.vendedorNombre || "Vendedor",
        observaciones: v.observaciones || "",
        items: itemsRows.map((it) => ({
          id: it.id,
          productoId: it.productoId,
          codigo: it.productoCodigo,
          nombre: it.productoNombre,
          marca: it.marcaNombre || "",
          modelo: it.modeloNombre || "",
          cantidad: Number(it.cantidad) || 0,
          precioUnitario: Number(it.precioUnitario) || 0,
          descuento: Number(it.descuento) || 0,
          subtotal: Number(it.subtotal) || 0,
          series: seriesPorProducto.get(it.productoId) || []
        }))
      }
    });
  } catch (error) {
    console.error("Error al obtener detalle de venta:", error);
    res.status(500).json({ success: false, message: "Error interno al consultar detalle de venta." });
  }
}
function rClienteNombre(val) {
  return val ? String(val).trim() : "Cliente General";
}
async function createVenta(req, res) {
  const connection = await pool.getConnection();
  try {
    const {
      clienteId,
      tipoComprobanteId = 1,
      // 1: BOLETA, 2: FACTURA, 3: NOTA_VENTA
      metodoPagoId = 1,
      // 1: EFECTIVO, 2: YAPE, 3: PLIN, 4: TARJETA, 5: TRANSFERENCIA
      sucursalId = 1,
      items = [],
      observaciones = ""
    } = req.body;
    const usuarioId = req.user?.userId || 1;
    let finalClienteId = Number(clienteId);
    if (!finalClienteId || isNaN(finalClienteId)) {
      const [defaultCli] = await pool.query(
        "SELECT id_cliente FROM clientes WHERE razon_social LIKE '%CONSUMIDOR FINAL%' OR razon_social LIKE '%VARIOS%' LIMIT 1"
      );
      if (defaultCli.length > 0) {
        finalClienteId = defaultCli[0].id_cliente;
      } else {
        const [firstCli] = await pool.query(
          "SELECT id_cliente FROM clientes ORDER BY id_cliente ASC LIMIT 1"
        );
        finalClienteId = firstCli[0]?.id_cliente || 1;
      }
    }
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: "La venta debe contener al menos un producto." });
      return;
    }
    await connection.beginTransaction();
    const [tipoCompRows] = await connection.query(
      "SELECT id, codigo, serie_defecto FROM tipos_comprobante WHERE id = ?",
      [tipoComprobanteId]
    );
    const seriePrefijo = tipoCompRows[0]?.serie_defecto || "B001";
    const [lastCompRows] = await connection.query(
      "SELECT codigo_comprobante FROM ventas WHERE codigo_comprobante LIKE ? ORDER BY id DESC LIMIT 1",
      [`${seriePrefijo}-%`]
    );
    let nextNumero = 1;
    if (lastCompRows.length > 0) {
      const match = lastCompRows[0].codigo_comprobante.match(/-(\d+)$/);
      if (match) {
        nextNumero = parseInt(match[1], 10) + 1;
      }
    }
    const codigoComprobante = `${seriePrefijo}-${nextNumero.toString().padStart(6, "0")}`;
    let totalGeneral = 0;
    for (const it of items) {
      const precio = Number(it.precioUnitario) || 0;
      const cant = Number(it.cantidad) || 1;
      const desc = Number(it.descuento) || 0;
      totalGeneral += precio * cant - desc;
    }
    const subtotal = Math.round(totalGeneral / 1.18 * 100) / 100;
    const igv = Math.round((totalGeneral - subtotal) * 100) / 100;
    for (const it of items) {
      const prodId = Number(it.productoId);
      if (!prodId || isNaN(prodId)) {
        await connection.rollback();
        res.status(400).json({
          success: false,
          error: `ID de producto inv\xE1lido en el carrito (${it.productoId}).`
        });
        return;
      }
      const [prodRows] = await connection.query(
        "SELECT id, nombre FROM productos WHERE id = ?",
        [prodId]
      );
      if (prodRows.length === 0) {
        await connection.rollback();
        res.status(400).json({
          success: false,
          error: `El producto '${it.nombre || "ID " + prodId}' no existe en la base de datos de almac\xE9n. Aseg\xFArese de registrar el producto en 'Almac\xE9n & Inventario' antes de venderlo.`
        });
        return;
      }
    }
    const [ventaResult] = await connection.query(
      `INSERT INTO ventas 
       (codigo_comprobante, tipo_comprobante_id, cliente_id, usuario_id, sucursal_id,
        subtotal, igv, total, metodo_pago_id, estado_id, fecha_venta, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), ?)`,
      [
        codigoComprobante,
        tipoComprobanteId,
        finalClienteId,
        usuarioId,
        sucursalId,
        subtotal,
        igv,
        totalGeneral,
        metodoPagoId,
        observaciones ? String(observaciones).trim() : null
      ]
    );
    const newVentaId = ventaResult.insertId;
    for (const it of items) {
      const prodId = Number(it.productoId);
      const cantidad = Number(it.cantidad) || 1;
      const precioUnit = Number(it.precioUnitario) || 0;
      const desc = Number(it.descuento) || 0;
      const subtotalItem = precioUnit * cantidad - desc;
      await connection.query(
        `INSERT INTO detalle_ventas 
         (venta_id, producto_id, cantidad, precio_unitario, descuento, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [newVentaId, prodId, cantidad, precioUnit, desc, subtotalItem]
      );
      const seriesList = Array.isArray(it.series) ? it.series : [];
      if (seriesList.length > 0) {
        for (const serie of seriesList) {
          const cleanSerie = String(serie).trim();
          if (!cleanSerie) continue;
          await connection.query(
            `UPDATE producto_unidades 
             SET estado_unidad_id = 2, disponible_venta = 0, updated_at = NOW()
             WHERE producto_id = ? AND numero_serie = ?`,
            [prodId, cleanSerie]
          );
          await connection.query(
            `INSERT INTO producto_series_garantia 
             (venta_id, producto_id, numero_serie, cliente_id, meses_garantia, fecha_venta, estado_garantia, observaciones)
             VALUES (?, ?, ?, ?, 12, NOW(), 'ACTIVA', ?)`,
            [
              newVentaId,
              prodId,
              cleanSerie,
              finalClienteId,
              `Emitido en comprobante ${codigoComprobante}. Cobertura activa.`
            ]
          );
        }
      }
      const [updSedeRes] = await connection.query(
        `UPDATE producto_stock_sede 
         SET stock = GREATEST(0, stock - ?), updated_at = NOW()
         WHERE producto_id = ? AND sucursal_id = ? AND stock > 0`,
        [cantidad, prodId, sucursalId]
      );
      if (updSedeRes.affectedRows === 0) {
        await connection.query(
          `UPDATE producto_stock_sede 
           SET stock = GREATEST(0, stock - ?), updated_at = NOW()
           WHERE producto_id = ? AND stock > 0
           ORDER BY stock DESC LIMIT 1`,
          [cantidad, prodId]
        );
      }
    }
    await connection.commit();
    res.status(201).json({
      success: true,
      message: `Venta registrada con \xE9xito. Comprobante ${codigoComprobante} emitido.`,
      ventaId: newVentaId,
      codigoComprobante,
      total: totalGeneral,
      venta: {
        id: newVentaId,
        codigoComprobante,
        fechaVenta: (/* @__PURE__ */ new Date()).toISOString(),
        subtotal,
        igv,
        total: totalGeneral
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al registrar venta:", error);
    res.status(500).json({ success: false, error: error.message || "Error interno al registrar la venta.", message: error.message || "Error interno al registrar la venta." });
  } finally {
    connection.release();
  }
}
async function enviarComprobanteEmail(req, res) {
  try {
    const ventaId = Number(req.params.id || req.body.ventaId);
    const { toEmail: customEmail, saleData } = req.body;
    if (!ventaId || isNaN(ventaId)) {
      res.status(400).json({ success: false, message: "ID de venta no v\xE1lido." });
      return;
    }
    const [ventaRows] = await pool.query(
      `SELECT v.id, v.codigo_comprobante AS codigoComprobante,
              tc.codigo AS tipoComprobanteCodigo, tc.nombre AS tipoComprobanteNombre,
              v.cliente_id AS clienteId,
              COALESCE(NULLIF(TRIM(c.razon_social), ''), CONCAT(COALESCE(per.nombres, ''), ' ', COALESCE(per.apellidos, ''))) AS clienteNombre,
              COALESCE(c.ruc, per.dni, '') AS clienteDocumento,
              per.direccion AS clienteDireccion, per.correo AS clienteEmail,
              v.subtotal, v.igv, v.total,
              mp.nombre AS metodoPagoNombre,
              v.fecha_venta AS fechaVenta,
              s.nombre AS sucursalNombre, u.nombre_completo AS vendedorNombre
       FROM ventas v
       INNER JOIN tipos_comprobante tc ON v.tipo_comprobante_id = tc.id
       INNER JOIN metodos_pago mp ON v.metodo_pago_id = mp.id
       LEFT JOIN clientes c ON v.cliente_id = c.id_cliente
       LEFT JOIN personas per ON c.id_persona = per.id_persona
       LEFT JOIN sucursales s ON v.sucursal_id = s.id
       LEFT JOIN usuarios u ON v.usuario_id = u.id
       WHERE v.id = ?
       LIMIT 1`,
      [ventaId]
    );
    if (ventaRows.length === 0 && !saleData) {
      res.status(404).json({ success: false, message: "Venta no encontrada en la base de datos." });
      return;
    }
    const v = ventaRows[0] || {};
    const destinationEmail = String(customEmail || v.clienteEmail || saleData?.clienteEmail || "").trim();
    if (!destinationEmail || !destinationEmail.includes("@")) {
      res.status(400).json({
        success: false,
        message: "No se especific\xF3 un correo electr\xF3nico v\xE1lido para enviar el comprobante."
      });
      return;
    }
    let emailItems = [];
    if (ventaRows.length > 0) {
      const [itemsRows] = await pool.query(
        `SELECT dv.producto_id AS productoId, p.nombre AS productoNombre,
                dv.cantidad, dv.precio_unitario AS precioUnitario, dv.subtotal
         FROM detalle_ventas dv
         INNER JOIN productos p ON dv.producto_id = p.id
         WHERE dv.venta_id = ?`,
        [ventaId]
      );
      const [seriesRows] = await pool.query(
        `SELECT producto_id AS productoId, numero_serie AS numeroSerie
         FROM producto_series_garantia
         WHERE venta_id = ?`,
        [ventaId]
      );
      const seriesMap = /* @__PURE__ */ new Map();
      for (const s of seriesRows) {
        if (!seriesMap.has(s.productoId)) seriesMap.set(s.productoId, []);
        seriesMap.get(s.productoId).push(s.numeroSerie);
      }
      emailItems = itemsRows.map((it) => ({
        nombre: it.productoNombre,
        cantidad: Number(it.cantidad) || 1,
        precioUnitario: Number(it.precioUnitario) || 0,
        subtotal: Number(it.subtotal) || 0,
        series: seriesMap.get(it.productoId) || []
      }));
    } else if (Array.isArray(saleData?.items)) {
      emailItems = saleData.items.map((it) => ({
        nombre: it.nombre || "Producto",
        cantidad: Number(it.cantidad) || 1,
        precioUnitario: Number(it.precioUnitario) || 0,
        subtotal: Number(it.subtotal) || 0,
        series: Array.isArray(it.series) ? it.series : []
      }));
    }
    const totalNum = Number(v.total ?? saleData?.total) || 0;
    const subtotalNum = Number(v.subtotal ?? saleData?.subtotal) || Math.round(totalNum / 1.18 * 100) / 100;
    const igvNum = Number(v.igv ?? saleData?.igv) || Math.round((totalNum - subtotalNum) * 100) / 100;
    const emailResult = await sendSaleReceiptEmail({
      toEmail: destinationEmail,
      clienteNombre: v.clienteNombre || saleData?.clienteNombre || "Estimado(a) Cliente",
      clienteDocumento: v.clienteDocumento || saleData?.clienteDocumento || "",
      clienteDireccion: v.clienteDireccion || saleData?.clienteDireccion || "Chiclayo, Per\xFA",
      codigoComprobante: v.codigoComprobante || saleData?.codigoComprobante || "B001-000101",
      tipoComprobante: v.tipoComprobanteNombre || saleData?.tipoComprobante || "BOLETA DE VENTA ELECTR\xD3NICA",
      fechaVenta: v.fechaVenta ? new Date(v.fechaVenta).toLocaleString("es-PE", { hour12: false }) : saleData?.fecha || (/* @__PURE__ */ new Date()).toLocaleString("es-PE", { hour12: false }),
      vendedorNombre: v.vendedorNombre || saleData?.vendedorNombre || "Cajero MG Solutions",
      sucursalNombre: v.sucursalNombre || saleData?.sucursal || "Principal - Chiclayo Centro",
      metodoPago: v.metodoPagoNombre || saleData?.metodoPago || "EFECTIVO",
      subtotal: subtotalNum,
      igv: igvNum,
      total: totalNum,
      items: emailItems
    });
    if (!emailResult.success) {
      res.status(500).json({
        success: false,
        message: emailResult.error || "No se pudo enviar el correo electr\xF3nico con el comprobante."
      });
      return;
    }
    res.json({
      success: true,
      message: `Comprobante ${v.codigoComprobante} enviado con \xE9xito a ${destinationEmail}`,
      simulated: emailResult.simulated
    });
  } catch (error) {
    console.error("Error al enviar comprobante por correo:", error);
    res.status(500).json({ success: false, message: "Error interno al procesar el env\xEDo de correo." });
  }
}

// server/routes/sale.routes.ts
var router9 = Router9();
router9.get("/ventas", authenticateToken, getVentas);
router9.get("/ventas/:id", authenticateToken, getVentaById);
router9.post("/ventas", authenticateToken, createVenta);
router9.post("/ventas/:id/enviar-email", authenticateToken, enviarComprobanteEmail);
router9.post("/ventas/enviar-email", authenticateToken, enviarComprobanteEmail);
var sale_routes_default = router9;

// server/routes/workshop.routes.ts
import { Router as Router10 } from "express";

// server/controllers/workshop.controller.ts
init_mailer();
var ESTADO_MAP = {
  RECEPCIONADO: 1,
  EN_DIAGNOSTICO: 2,
  PRESUPUESTADO: 3,
  APROBADO_EN_REPARACION: 4,
  ESPERA_REPUESTOS: 5,
  REPARADO_PROBADO: 6,
  LISTO_ENTREGA: 7,
  ENTREGADO_COBRADO: 8,
  RECHAZADO_DEVUELTO: 9
};
var ESTADO_INV_MAP = {
  1: "RECEPCIONADO",
  2: "EN_DIAGNOSTICO",
  3: "PRESUPUESTADO",
  4: "APROBADO_EN_REPARACION",
  5: "ESPERA_REPUESTOS",
  6: "REPARADO_PROBADO",
  7: "LISTO_ENTREGA",
  8: "ENTREGADO_COBRADO",
  9: "RECHAZADO_DEVUELTO"
};
var PRIORIDAD_MAP = {
  NORMAL: 1,
  ALTA: 2,
  URGENTE: 3
};
var PRIORIDAD_INV_MAP = {
  1: "NORMAL",
  2: "ALTA",
  3: "URGENTE"
};
async function getOrdenes(req, res) {
  try {
    const { estado, search, sucursal_id } = req.query;
    let query = `
      SELECT 
        os.id,
        os.codigo,
        os.sucursal_id AS sucursalId,
        COALESCE(suc.nombre, 'Principal - Chiclayo Centro') AS sucursalNombre,
        os.cliente_id AS clienteId,
        COALESCE(NULLIF(TRIM(c.razon_social), ''), CONCAT(COALESCE(p.nombres, ''), ' ', COALESCE(p.apellidos, ''))) AS clienteNombre,
        COALESCE(c.ruc, p.dni, '') AS clienteDocumento,
        p.telefono AS clienteTelefono,
        p.correo AS clienteEmail,
        os.equipo_id AS equipoId,
        eq.marca,
        eq.modelo,
        eq.numero_serie AS numeroSerie,
        eq.accesorios,
        COALESCE(te.nombre, 'Equipo / Dispositivo') AS tipoEquipo,
        os.usuario_recibe_id AS recepcionadoPorId,
        rec.nombre_completo AS recepcionadoPorNombre,
        os.usuario_tecnico_id AS tecnicoId,
        tec.nombre_completo AS tecnicoNombre,
        os.descripcion_falla AS fallaReportada,
        os.diagnostico,
        os.solucion,
        os.costo_servicio AS costoTotal,
        os.estado_orden_id AS estadoOrdenId,
        eos.codigo AS estadoCodigo,
        eos.nombre AS estadoNombre,
        os.prioridad_id AS prioridadId,
        prio.codigo AS prioridadCodigo,
        os.fecha_ingreso AS fechaIngreso,
        os.fecha_promesa AS fechaEstimadaEntrega,
        os.fecha_entrega AS fechaEntrega,
        os.observaciones
      FROM ordenes_servicio os
      INNER JOIN clientes c ON os.cliente_id = c.id_cliente
      LEFT JOIN sucursales suc ON os.sucursal_id = suc.id
      LEFT JOIN personas p ON c.id_persona = p.id_persona
      LEFT JOIN equipos eq ON os.equipo_id = eq.id
      LEFT JOIN tipos_equipo te ON eq.tipo_equipo_id = te.id
      LEFT JOIN usuarios rec ON os.usuario_recibe_id = rec.id
      LEFT JOIN usuarios tec ON os.usuario_tecnico_id = tec.id
      INNER JOIN estados_orden_servicio eos ON os.estado_orden_id = eos.id
      LEFT JOIN prioridades_orden prio ON os.prioridad_id = prio.id
      WHERE 1=1
    `;
    const params = [];
    if (sucursal_id && String(sucursal_id) !== "TODOS" && !isNaN(Number(sucursal_id))) {
      query += " AND os.sucursal_id = ?";
      params.push(Number(sucursal_id));
    }
    if (estado && String(estado) !== "TODOS") {
      const estadoId = ESTADO_MAP[String(estado).toUpperCase()];
      if (estadoId) {
        query += " AND os.estado_orden_id = ?";
        params.push(estadoId);
      }
    }
    if (search && String(search).trim()) {
      const term = `%${String(search).trim()}%`;
      query += ` AND (os.codigo LIKE ? OR c.razon_social LIKE ? OR eq.marca LIKE ? OR eq.modelo LIKE ? OR eq.numero_serie LIKE ?)`;
      params.push(term, term, term, term, term);
    }
    query += " ORDER BY os.id DESC";
    const [rows] = await pool.query(query, params);
    const [repuestosRows] = await pool.query(
      "SELECT id, orden_id, producto_id AS productoId, codigo, descripcion, cantidad, precio_unitario AS precioUnitario, total, descontado_stock AS descontadoStock FROM orden_repuestos"
    );
    const [serviciosRows] = await pool.query(
      "SELECT id, orden_id, descripcion, precio FROM orden_servicios_mano_obra"
    );
    const repuestosMap = /* @__PURE__ */ new Map();
    for (const rep of repuestosRows) {
      if (!repuestosMap.has(rep.orden_id)) repuestosMap.set(rep.orden_id, []);
      repuestosMap.get(rep.orden_id).push({
        id: `rep-${rep.id}`,
        dbId: rep.id,
        productoId: rep.productoId,
        codigo: rep.codigo || "",
        descripcion: rep.descripcion,
        cantidad: Number(rep.cantidad) || 1,
        precioUnitario: Number(rep.precioUnitario) || 0,
        total: Number(rep.total) || 0,
        descontadoStock: Boolean(rep.descontadoStock)
      });
    }
    const serviciosMap = /* @__PURE__ */ new Map();
    for (const s of serviciosRows) {
      if (!serviciosMap.has(s.orden_id)) serviciosMap.set(s.orden_id, []);
      serviciosMap.get(s.orden_id).push({
        id: `mo-${s.id}`,
        dbId: s.id,
        descripcion: s.descripcion,
        precio: Number(s.precio) || 0
      });
    }
    const ordenes = rows.map((r) => {
      const accesoriosArr = r.accesorios ? typeof r.accesorios === "string" && r.accesorios.includes(",") ? r.accesorios.split(",").map((a) => a.trim()) : [r.accesorios] : ["Solo equipo"];
      const repuestos = repuestosMap.get(r.id) || [];
      const serviciosManoObra = serviciosMap.get(r.id) || [];
      const costoTotalRepuestos = repuestos.reduce((sum, x) => sum + (Number(x.total) || 0), 0);
      const costoTotalManoObra = serviciosManoObra.reduce((sum, x) => sum + (Number(x.precio) || 0), 0);
      const costoTotal = Number(r.costoTotal) || costoTotalRepuestos + costoTotalManoObra;
      return {
        id: r.id,
        codigo: r.codigo,
        clienteId: r.clienteId,
        clienteNombre: r.clienteNombre ? String(r.clienteNombre).trim() : "Cliente General",
        clienteDocumento: r.clienteDocumento || "",
        clienteTelefono: r.clienteTelefono || "",
        clienteEmail: r.clienteEmail || "",
        tipoEquipo: r.tipoEquipo,
        marca: r.marca || "GEN\xC9RICO",
        modelo: r.modelo || "Est\xE1ndar",
        numeroSerie: r.numeroSerie || "S/N",
        passwordEquipo: "No aplica",
        accesoriosDejados: accesoriosArr,
        fallaReportada: r.fallaReportada || "Revisi\xF3n preventiva",
        estadoEstetico: "Buen estado general",
        sucursalId: r.sucursalId || 1,
        sucursalNombre: r.sucursalNombre || "Principal - Chiclayo Centro",
        prioridad: PRIORIDAD_INV_MAP[r.prioridadId] || "NORMAL",
        tecnicoId: r.tecnicoId || 1,
        tecnicoNombre: r.tecnicoNombre || "Especialista Asignado",
        recepcionadoPorId: r.recepcionadoPorId || 1,
        recepcionadoPorNombre: r.recepcionadoPorNombre || "Recepci\xF3n",
        fechaIngreso: new Date(r.fechaIngreso).toLocaleString("es-PE", { hour12: false }),
        fechaEstimadaEntrega: r.fechaEstimadaEntrega ? new Date(r.fechaEstimadaEntrega).toLocaleDateString("es-PE") : "En 24 a 48 horas h\xE1biles",
        estado: ESTADO_INV_MAP[r.estadoOrdenId] || "RECEPCIONADO",
        repuestos,
        serviciosManoObra,
        costoTotalRepuestos,
        costoTotalManoObra,
        costoTotal,
        adelantoPagado: 0,
        saldoPendiente: costoTotal,
        bitacora: [
          {
            id: `b-${r.id}-init`,
            fecha: new Date(r.fechaIngreso).toLocaleString("es-PE", { hour12: false }),
            autorNombre: r.recepcionadoPorNombre || "Recepci\xF3n",
            autorRol: "RECEPCION",
            titulo: "Ingreso al Taller",
            descripcion: `Equipo ingresado con falla: "${r.fallaReportada}". Asignado a: ${r.tecnicoNombre || "Laboratorio"}.`,
            estadoNuevo: ESTADO_INV_MAP[r.estadoOrdenId] || "RECEPCIONADO"
          }
        ],
        comunicaciones: [],
        garantiaDias: r.codigo.startsWith("GAR") ? 180 : 90
      };
    });
    res.json({ success: true, ordenes });
  } catch (error) {
    console.error("Error al obtener \xF3rdenes de servicio:", error);
    res.status(500).json({ success: false, message: "Error interno al consultar \xF3rdenes de taller." });
  }
}
async function createOrden(req, res) {
  const connection = await pool.getConnection();
  try {
    const {
      clienteId,
      tipoEquipo = "Laptop / Notebook",
      marca,
      modelo,
      numeroSerie,
      accesorios = "Cargador original",
      fallaReportada,
      prioridad = "NORMAL",
      tecnicoId,
      esGarantia = false,
      costoServicio = 0,
      observaciones = ""
    } = req.body;
    const recepcionadoPorId = req.user?.userId || 1;
    let finalClienteId = Number(clienteId);
    if (!finalClienteId || isNaN(finalClienteId)) {
      const [firstCli] = await connection.query(
        "SELECT id_cliente FROM clientes ORDER BY id_cliente ASC LIMIT 1"
      );
      finalClienteId = firstCli[0]?.id_cliente || 1;
    }
    if (!marca || !modelo) {
      res.status(400).json({ success: false, message: "Marca y modelo del equipo son requeridos." });
      return;
    }
    await connection.beginTransaction();
    const tipoUpper = String(tipoEquipo).toUpperCase();
    let tipoEquipoId = 1;
    if (tipoUpper.includes("PC") || tipoUpper.includes("TORRE") || tipoUpper.includes("ESCRITORIO")) tipoEquipoId = 2;
    else if (tipoUpper.includes("IMPRESORA") || tipoUpper.includes("MULTIFUNCIONAL")) tipoEquipoId = 3;
    else if (tipoUpper.includes("MONITOR") || tipoUpper.includes("PANTALLA")) tipoEquipoId = 4;
    else if (tipoUpper.includes("COMPONENTE") || tipoUpper.includes("PLACA")) tipoEquipoId = 5;
    const accesoriosStr = Array.isArray(accesorios) ? accesorios.join(", ") : String(accesorios || "Solo equipo");
    const serieLimpia = String(numeroSerie || "S/N-SINDATO").trim().toUpperCase();
    const [equipoRes] = await connection.query(
      `INSERT INTO equipos (cliente_id, tipo_equipo_id, marca, modelo, numero_serie, accesorios, estado_id, fecha_registro)
       VALUES (?, ?, ?, ?, ?, ?, 1, NOW())`,
      [finalClienteId, tipoEquipoId, String(marca).trim().toUpperCase(), String(modelo).trim(), serieLimpia, accesoriosStr]
    );
    const equipoId = equipoRes.insertId;
    const prefix = esGarantia ? "GAR" : "OT";
    const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    const pattern = `${prefix}-${currentYear}-%`;
    const [lastRows] = await connection.query(
      "SELECT codigo FROM ordenes_servicio WHERE codigo LIKE ? ORDER BY id DESC LIMIT 1",
      [pattern]
    );
    let nextNumber = 1;
    if (lastRows.length > 0) {
      const match = lastRows[0].codigo.match(/-(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    const codigoOrden = `${prefix}-${currentYear}-${String(nextNumber).padStart(4, "0")}`;
    let finalTecnicoId = Number(tecnicoId);
    if (!finalTecnicoId || isNaN(finalTecnicoId)) {
      const [firstTec] = await connection.query(
        `SELECT u.id FROM usuarios u 
         JOIN roles r ON u.rol_id = r.id 
         WHERE r.codigo = 'TECNICO' AND u.estado_id = 1 
         ORDER BY u.id ASC LIMIT 1`
      );
      finalTecnicoId = firstTec[0]?.id || recepcionadoPorId;
    }
    const prioridadId = PRIORIDAD_MAP[String(prioridad).toUpperCase()] || 1;
    const targetSucursalId = req.body.sucursalId && !isNaN(Number(req.body.sucursalId)) ? Number(req.body.sucursalId) : req.user?.sucursalId || 1;
    const [ordenRes] = await connection.query(
      `INSERT INTO ordenes_servicio (
        codigo, cliente_id, sucursal_id, equipo_id, usuario_recibe_id, usuario_tecnico_id,
        descripcion_falla, costo_servicio, estado_orden_id, prioridad_id,
        fecha_ingreso, fecha_promesa, observaciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, NOW(), DATE_ADD(NOW(), INTERVAL 2 DAY), ?)`,
      [
        codigoOrden,
        finalClienteId,
        targetSucursalId,
        equipoId,
        recepcionadoPorId,
        finalTecnicoId,
        fallaReportada ? String(fallaReportada).trim() : "Revisi\xF3n general del equipo",
        Number(costoServicio) || 0,
        prioridadId,
        observaciones ? String(observaciones).trim() : null
      ]
    );
    await connection.commit();
    res.status(201).json({
      success: true,
      message: `Orden de servicio ${codigoOrden} registrada exitosamente en MySQL.`,
      ordenId: ordenRes.insertId,
      codigo: codigoOrden,
      equipoId
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al registrar orden de servicio:", error);
    res.status(500).json({ success: false, message: "Error interno al registrar la orden de servicio." });
  } finally {
    connection.release();
  }
}
async function descontarStockRepuestos(connection, ordenId, codigoOrden, sucursalId) {
  try {
    let finalSucursalId = sucursalId;
    if (!finalSucursalId) {
      const [osRows] = await connection.query("SELECT sucursal_id FROM ordenes_servicio WHERE id = ?", [ordenId]);
      finalSucursalId = osRows[0]?.sucursal_id || 1;
    }
    const [repuestos] = await connection.query(
      "SELECT id, producto_id, cantidad, descripcion FROM orden_repuestos WHERE orden_id = ? AND descontado_stock = 0 AND producto_id IS NOT NULL",
      [ordenId]
    );
    for (const rep of repuestos) {
      const cant = Number(rep.cantidad) || 1;
      await connection.query(
        "UPDATE producto_stock_sede SET stock = GREATEST(0, stock - ?), updated_at = NOW() WHERE producto_id = ? AND sucursal_id = ?",
        [cant, rep.producto_id, finalSucursalId]
      );
      const movCode = `MOV-SAL-${Date.now()}-${rep.producto_id}`;
      await connection.query(
        `INSERT INTO movimientos_inventario 
         (codigo, tipo, producto_id, sede_origen_id, cantidad, motivo, solicitado_por, estado_movimiento_id, fecha_solicitud, fecha_aprobacion, created_at)
         VALUES (?, 'CONSUMO_TALLER', ?, ?, ?, ?, 1, 4, NOW(), NOW(), NOW())`,
        [movCode, rep.producto_id, finalSucursalId, cant, `Consumo en taller - Orden ${codigoOrden}`]
      );
      await connection.query("UPDATE orden_repuestos SET descontado_stock = 1 WHERE id = ?", [rep.id]);
    }
  } catch (err) {
    console.error("Error al descontar stock de repuestos:", err);
  }
}
async function restaurarStockRepuestos(connection, ordenId, codigoOrden, sucursalId) {
  try {
    let finalSucursalId = sucursalId;
    if (!finalSucursalId) {
      const [osRows] = await connection.query("SELECT sucursal_id FROM ordenes_servicio WHERE id = ?", [ordenId]);
      finalSucursalId = osRows[0]?.sucursal_id || 1;
    }
    const [repuestos] = await connection.query(
      "SELECT id, producto_id, cantidad, descripcion FROM orden_repuestos WHERE orden_id = ? AND descontado_stock = 1 AND producto_id IS NOT NULL",
      [ordenId]
    );
    for (const rep of repuestos) {
      const cant = Number(rep.cantidad) || 1;
      await connection.query(
        "UPDATE producto_stock_sede SET stock = stock + ?, updated_at = NOW() WHERE producto_id = ? AND sucursal_id = ?",
        [cant, rep.producto_id, finalSucursalId]
      );
      const movCode = `MOV-DEV-${Date.now()}-${rep.producto_id}`;
      await connection.query(
        `INSERT INTO movimientos_inventario 
         (codigo, tipo, producto_id, sede_destino_id, cantidad, motivo, solicitado_por, estado_movimiento_id, fecha_solicitud, fecha_aprobacion, created_at)
         VALUES (?, 'DEVOLUCION_TALLER', ?, ?, ?, ?, 1, 4, NOW(), NOW(), NOW())`,
        [movCode, rep.producto_id, finalSucursalId, cant, `Devoluci\xF3n a almac\xE9n por cancelaci\xF3n/rechazo de orden ${codigoOrden}`]
      );
      await connection.query("UPDATE orden_repuestos SET descontado_stock = 0 WHERE id = ?", [rep.id]);
    }
  } catch (err) {
    console.error("Error al restaurar stock de repuestos:", err);
  }
}
async function savePresupuestoOrden(req, res) {
  const connection = await pool.getConnection();
  try {
    const ordenId = Number(req.params.id);
    const { repuestos = [], serviciosManoObra = [], costoTotal } = req.body;
    if (!ordenId || isNaN(ordenId)) {
      res.status(400).json({ success: false, message: "ID de orden inv\xE1lido." });
      return;
    }
    await connection.beginTransaction();
    const [ordenRows] = await connection.query(
      "SELECT id, codigo, estado_orden_id FROM ordenes_servicio WHERE id = ?",
      [ordenId]
    );
    if (ordenRows.length === 0) {
      await connection.rollback();
      res.status(404).json({ success: false, message: "Orden no encontrada." });
      return;
    }
    const orden = ordenRows[0];
    const [prevRep] = await connection.query(
      "SELECT id, producto_id, cantidad, descontado_stock FROM orden_repuestos WHERE orden_id = ?",
      [ordenId]
    );
    for (const r of prevRep) {
      if (r.descontado_stock && r.producto_id) {
        await connection.query(
          "UPDATE producto_stock_sede SET stock = stock + ? WHERE producto_id = ? AND sucursal_id = 1",
          [r.cantidad, r.producto_id]
        );
      }
    }
    await connection.query("DELETE FROM orden_repuestos WHERE orden_id = ?", [ordenId]);
    for (const r of repuestos) {
      const cant = Number(r.cantidad) || 1;
      const pu = Number(r.precioUnitario) || 0;
      const tot = Number(r.total) || cant * pu;
      await connection.query(
        `INSERT INTO orden_repuestos (orden_id, producto_id, codigo, descripcion, cantidad, precio_unitario, total, descontado_stock)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        [ordenId, r.productoId || null, r.codigo || null, r.descripcion, cant, pu, tot]
      );
    }
    await connection.query("DELETE FROM orden_servicios_mano_obra WHERE orden_id = ?", [ordenId]);
    for (const s of serviciosManoObra) {
      const p = Number(s.precio) || 0;
      await connection.query(
        "INSERT INTO orden_servicios_mano_obra (orden_id, descripcion, precio) VALUES (?, ?, ?)",
        [ordenId, s.descripcion, p]
      );
    }
    const totRep = repuestos.reduce((sum, r) => sum + (Number(r.total) || Number(r.cantidad || 1) * Number(r.precioUnitario || 0)), 0);
    const totMo = serviciosManoObra.reduce((sum, s) => sum + (Number(s.precio) || 0), 0);
    const finalCosto = costoTotal !== void 0 ? Number(costoTotal) : totRep + totMo;
    await connection.query(
      "UPDATE ordenes_servicio SET costo_servicio = ?, updated_at = NOW() WHERE id = ?",
      [finalCosto, ordenId]
    );
    if (orden.estado_orden_id === 4 || orden.estado_orden_id === 5) {
      await descontarStockRepuestos(connection, ordenId, orden.codigo);
    }
    await connection.commit();
    res.json({
      success: true,
      message: "Presupuesto, repuestos y mano de obra guardados exitosamente en la base de datos.",
      costoTotal: finalCosto
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al guardar presupuesto en base de datos:", error);
    res.status(500).json({ success: false, message: "Error interno al guardar presupuesto." });
  } finally {
    connection.release();
  }
}
async function updateEstadoOrden(req, res) {
  try {
    const ordenId = Number(req.params.id);
    const { nuevoEstado, diagnostico, solucion, costoServicio, observaciones } = req.body;
    if (!ordenId || isNaN(ordenId)) {
      res.status(400).json({ success: false, message: "ID de orden inv\xE1lido." });
      return;
    }
    const estadoId = ESTADO_MAP[String(nuevoEstado).toUpperCase()];
    if (!estadoId) {
      res.status(400).json({ success: false, message: "Estado t\xE9cnico no reconocido." });
      return;
    }
    const [ordenRows] = await pool.query(
      "SELECT id, codigo, estado_orden_id FROM ordenes_servicio WHERE id = ?",
      [ordenId]
    );
    if (ordenRows.length === 0) {
      res.status(404).json({ success: false, message: "Orden de servicio no encontrada." });
      return;
    }
    const orden = ordenRows[0];
    const updates = ["estado_orden_id = ?", "updated_at = NOW()"];
    const params = [estadoId];
    if (diagnostico !== void 0) {
      updates.push("diagnostico = ?");
      params.push(String(diagnostico).trim());
    }
    if (solucion !== void 0) {
      updates.push("solucion = ?");
      params.push(String(solucion).trim());
    }
    if (costoServicio !== void 0) {
      updates.push("costo_servicio = ?");
      params.push(Number(costoServicio) || 0);
    }
    if (observaciones !== void 0) {
      updates.push("observaciones = ?");
      params.push(String(observaciones).trim());
    }
    if (estadoId === 8) {
      updates.push("fecha_entrega = NOW()");
    }
    params.push(ordenId);
    const [result] = await pool.query(
      `UPDATE ordenes_servicio SET ${updates.join(", ")} WHERE id = ?`,
      params
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ success: false, message: "Orden de servicio no encontrada." });
      return;
    }
    if (estadoId === 4 || estadoId === 5) {
      await descontarStockRepuestos(pool, ordenId, orden.codigo);
    } else if (estadoId === 9) {
      await restaurarStockRepuestos(pool, ordenId, orden.codigo);
    }
    res.json({
      success: true,
      message: `Orden #${ordenId} actualizada al estado ${nuevoEstado}.`,
      nuevoEstado
    });
  } catch (error) {
    console.error("Error al actualizar estado de orden:", error);
    res.status(500).json({ success: false, message: "Error interno al actualizar estado de la orden." });
  }
}
async function sendTicketEmail(req, res) {
  try {
    const {
      toEmail,
      clienteNombre,
      clienteDocumento,
      clienteTelefono,
      codigoOrden,
      fechaIngreso,
      tipoEquipo,
      marca,
      modelo,
      numeroSerie,
      accesorios,
      fallaReportada,
      presupuestoTotal,
      adelantoPagado,
      saldoPendiente,
      garantiaDias,
      tecnicoNombre
    } = req.body;
    if (!toEmail || !toEmail.includes("@")) {
      res.status(400).json({ success: false, message: "Direcci\xF3n de correo electr\xF3nico inv\xE1lida." });
      return;
    }
    if (!codigoOrden) {
      res.status(400).json({ success: false, message: "C\xF3digo de orden de servicio requerido." });
      return;
    }
    const result = await sendWorkshopTicketEmail({
      toEmail: String(toEmail).trim(),
      clienteNombre: clienteNombre || "Estimado(a) Cliente",
      clienteDocumento,
      clienteTelefono,
      codigoOrden,
      fechaIngreso: fechaIngreso || (/* @__PURE__ */ new Date()).toLocaleString("es-PE"),
      tipoEquipo: tipoEquipo || "Dispositivo / Equipo",
      marca: marca || "EQUIPO",
      modelo: modelo || "Est\xE1ndar",
      numeroSerie: numeroSerie || "S/N",
      accesorios,
      fallaReportada: fallaReportada || "Revisi\xF3n t\xE9cnica",
      presupuestoTotal: Number(presupuestoTotal) || 0,
      adelantoPagado: Number(adelantoPagado) || 0,
      saldoPendiente: Number(saldoPendiente) || 0,
      garantiaDias: Number(garantiaDias) || 90,
      tecnicoNombre
    });
    if (result.success) {
      res.json({
        success: true,
        simulated: !!result.simulated,
        message: result.simulated ? `Ticket simulado en consola (sin SMTP activo). Destino: ${toEmail}` : `Ticket de servicio enviado exitosamente al correo ${toEmail}`
      });
    } else {
      res.status(500).json({
        success: false,
        message: `No se pudo enviar el correo: ${result.error || "Error del servidor de correo."}`
      });
    }
  } catch (error) {
    console.error("Error enviando ticket por correo:", error);
    res.status(500).json({ success: false, message: "Error interno al procesar el env\xEDo del ticket por correo." });
  }
}
async function getTrackingPublico(req, res) {
  try {
    const { codigo } = req.params;
    if (!codigo) {
      res.status(400).json({ success: false, message: "C\xF3digo requerido." });
      return;
    }
    const query = `
      SELECT 
        os.id,
        os.codigo,
        os.cliente_id AS clienteId,
        COALESCE(NULLIF(TRIM(c.razon_social), ''), CONCAT(COALESCE(p.nombres, ''), ' ', COALESCE(p.apellidos, ''))) AS clienteNombre,
        COALESCE(c.ruc, p.dni, '') AS clienteDocumento,
        p.telefono AS clienteTelefono,
        p.correo AS clienteEmail,
        os.equipo_id AS equipoId,
        eq.marca,
        eq.modelo,
        eq.numero_serie AS numeroSerie,
        eq.accesorios,
        COALESCE(te.nombre, 'Equipo / Dispositivo') AS tipoEquipo,
        os.usuario_recibe_id AS recepcionadoPorId,
        rec.nombre_completo AS recepcionadoPorNombre,
        os.usuario_tecnico_id AS tecnicoId,
        tec.nombre_completo AS tecnicoNombre,
        os.descripcion_falla AS fallaReportada,
        os.diagnostico,
        os.solucion,
        os.costo_servicio AS costoTotal,
        os.estado_orden_id AS estadoOrdenId,
        eos.codigo AS estadoCodigo,
        eos.nombre AS estadoNombre,
        os.prioridad_id AS prioridadId,
        prio.codigo AS prioridadCodigo,
        os.fecha_ingreso AS fechaIngreso,
        os.fecha_promesa AS fechaEstimadaEntrega,
        os.fecha_entrega AS fechaEntrega,
        os.observaciones
      FROM ordenes_servicio os
      INNER JOIN clientes c ON os.cliente_id = c.id_cliente
      LEFT JOIN personas p ON c.id_persona = p.id_persona
      LEFT JOIN equipos eq ON os.equipo_id = eq.id
      LEFT JOIN tipos_equipo te ON eq.tipo_equipo_id = te.id
      LEFT JOIN usuarios rec ON os.usuario_recibe_id = rec.id
      LEFT JOIN usuarios tec ON os.usuario_tecnico_id = tec.id
      INNER JOIN estados_orden_servicio eos ON os.estado_orden_id = eos.id
      LEFT JOIN prioridades_orden prio ON os.prioridad_id = prio.id
      WHERE os.codigo = ?
      LIMIT 1
    `;
    const [rows] = await pool.query(query, [codigo.trim().toUpperCase()]);
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: "Orden de servicio no encontrada." });
      return;
    }
    const r = rows[0];
    const [repuestosRows] = await pool.query(
      "SELECT id, producto_id AS productoId, codigo, descripcion, cantidad, precio_unitario AS precioUnitario, total, descontado_stock AS descontadoStock FROM orden_repuestos WHERE orden_id = ?",
      [r.id]
    );
    const [serviciosRows] = await pool.query(
      "SELECT id, descripcion, precio FROM orden_servicios_mano_obra WHERE orden_id = ?",
      [r.id]
    );
    const repuestos = repuestosRows.map((rep) => ({
      id: `rep-${rep.id}`,
      dbId: rep.id,
      productoId: rep.productoId,
      codigo: rep.codigo || "",
      descripcion: rep.descripcion,
      cantidad: Number(rep.cantidad) || 1,
      precioUnitario: Number(rep.precioUnitario) || 0,
      total: Number(rep.total) || 0,
      descontadoStock: Boolean(rep.descontadoStock)
    }));
    const serviciosManoObra = serviciosRows.map((s) => ({
      id: `mo-${s.id}`,
      dbId: s.id,
      descripcion: s.descripcion,
      precio: Number(s.precio) || 0
    }));
    const costoTotalRepuestos = repuestos.reduce((sum, x) => sum + (Number(x.total) || 0), 0);
    const costoTotalManoObra = serviciosManoObra.reduce((sum, x) => sum + (Number(x.precio) || 0), 0);
    const costoTotal = Number(r.costoTotal) || costoTotalRepuestos + costoTotalManoObra;
    const accesoriosArr = r.accesorios ? typeof r.accesorios === "string" && r.accesorios.includes(",") ? r.accesorios.split(",").map((a) => a.trim()) : [r.accesorios] : ["Solo equipo"];
    const estadoKey = ESTADO_INV_MAP[r.estadoOrdenId] || "RECEPCIONADO";
    const orden = {
      id: r.id,
      codigo: r.codigo,
      clienteId: r.clienteId,
      clienteNombre: r.clienteNombre ? String(r.clienteNombre).trim() : "Cliente General",
      clienteDocumento: r.clienteDocumento || "",
      clienteTelefono: r.clienteTelefono || "",
      clienteEmail: r.clienteEmail || "",
      tipoEquipo: r.tipoEquipo,
      marca: r.marca || "GEN\xC9RICO",
      modelo: r.modelo || "Est\xE1ndar",
      numeroSerie: r.numeroSerie || "S/N",
      passwordEquipo: "No aplica",
      accesoriosDejados: accesoriosArr,
      fallaReportada: r.fallaReportada || "Revisi\xF3n preventiva",
      estadoEstetico: "Buen estado general",
      prioridad: PRIORIDAD_INV_MAP[r.prioridadId] || "NORMAL",
      tecnicoId: r.tecnicoId || 1,
      tecnicoNombre: r.tecnicoNombre || "Especialista Asignado",
      recepcionadoPorId: r.recepcionadoPorId || 1,
      recepcionadoPorNombre: r.recepcionadoPorNombre || "Recepci\xF3n",
      fechaIngreso: new Date(r.fechaIngreso).toLocaleString("es-PE", { hour12: false }),
      fechaEstimadaEntrega: r.fechaEstimadaEntrega ? new Date(r.fechaEstimadaEntrega).toLocaleDateString("es-PE") : "En 24 a 48 horas h\xE1biles",
      estado: estadoKey,
      repuestos,
      serviciosManoObra,
      costoTotalRepuestos,
      costoTotalManoObra,
      costoTotal,
      adelantoPagado: 0,
      saldoPendiente: costoTotal,
      bitacora: [
        {
          id: `b-${r.id}-curr`,
          fecha: new Date(r.fechaIngreso).toLocaleString("es-PE", { hour12: false }),
          autorNombre: r.recepcionadoPorNombre || "Soporte T\xE9cnico",
          autorRol: "SISTEMA",
          titulo: estadoKey === "PRESUPUESTADO" ? "\u{1F4CB} Presupuesto Elaborado para Aprobaci\xF3n" : `Estado: ${r.estadoNombre}`,
          descripcion: r.observaciones || `Equipo en estado actual: ${r.estadoNombre}`,
          estadoNuevo: estadoKey
        }
      ],
      comunicaciones: [],
      garantiaDias: r.codigo.startsWith("GAR") ? 180 : 90
    };
    res.json({ success: true, orden });
  } catch (error) {
    console.error("Error al consultar tracking p\xFAblico:", error);
    res.status(500).json({ success: false, message: "Error interno al consultar tracking." });
  }
}
async function responderPresupuestoCliente(req, res) {
  try {
    const { codigo, accion, observacion } = req.body;
    if (!codigo || !accion) {
      res.status(400).json({ success: false, message: "C\xF3digo de orden y acci\xF3n (APROBAR o RECHAZAR) son requeridos." });
      return;
    }
    const accionUpper = String(accion).toUpperCase();
    if (accionUpper !== "APROBAR" && accionUpper !== "RECHAZAR") {
      res.status(400).json({ success: false, message: "Acci\xF3n no v\xE1lida. Debe ser APROBAR o RECHAZAR." });
      return;
    }
    const [rows] = await pool.query(
      "SELECT id, codigo, estado_orden_id, costo_servicio FROM ordenes_servicio WHERE codigo = ? LIMIT 1",
      [codigo.trim()]
    );
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: "Orden de servicio no encontrada." });
      return;
    }
    const orden = rows[0];
    const nuevoEstadoId = accionUpper === "APROBAR" ? 4 : 9;
    const nuevoEstadoStr = accionUpper === "APROBAR" ? "APROBADO_EN_REPARACION" : "RECHAZADO_DEVUELTO";
    const detalle = accionUpper === "APROBAR" ? `El cliente acept\xF3 y autoriz\xF3 el presupuesto desde la web de seguimiento.${observacion ? ` Comentario: ${observacion}` : ""}` : `El cliente rechaz\xF3 el presupuesto desde la web de seguimiento.${observacion ? ` Motivo: ${observacion}` : ""}`;
    await pool.query(
      'UPDATE ordenes_servicio SET estado_orden_id = ?, observaciones = CONCAT(COALESCE(observaciones, ""), " | ", ?), updated_at = NOW() WHERE id = ?',
      [nuevoEstadoId, detalle, orden.id]
    );
    if (accionUpper === "APROBAR") {
      await descontarStockRepuestos(pool, orden.id, orden.codigo);
    } else {
      await restaurarStockRepuestos(pool, orden.id, orden.codigo);
    }
    res.json({
      success: true,
      message: accionUpper === "APROBAR" ? "\xA1Presupuesto aprobado con \xE9xito! El taller comenzar\xE1 los trabajos en tu equipo." : "Presupuesto declinado. Tu equipo quedar\xE1 preparado para entrega en mostrador.",
      nuevoEstado: nuevoEstadoStr
    });
  } catch (error) {
    console.error("Error al responder presupuesto del cliente:", error);
    res.status(500).json({ success: false, message: "Error interno al procesar la respuesta del cliente." });
  }
}

// server/routes/workshop.routes.ts
var router10 = Router10();
router10.get("/taller/tracking/:codigo", getTrackingPublico);
router10.get("/taller/ordenes", authenticateToken, getOrdenes);
router10.post("/taller/ordenes", authenticateToken, createOrden);
router10.put("/taller/ordenes/:id/estado", authenticateToken, updateEstadoOrden);
router10.put("/taller/ordenes/:id/presupuesto", authenticateToken, savePresupuestoOrden);
router10.post("/taller/ordenes/enviar-ticket-email", authenticateToken, sendTicketEmail);
router10.post("/taller/ordenes/responder-presupuesto", responderPresupuestoCliente);
var workshop_routes_default = router10;

// server/routes/transfer.routes.ts
import { Router as Router11 } from "express";

// server/controllers/transfer.controller.ts
async function getMovimientos(req, res) {
  try {
    const { tipo, estado, sedeId } = req.query;
    let query = `
      SELECT 
        m.id,
        m.codigo,
        m.tipo,
        m.producto_id AS productoId,
        p.nombre AS productoNombre,
        p.codigo AS productoCodigo,
        p.requiere_serie AS requiereSerie,
        m.sede_origen_id AS sedeOrigenId,
        so.nombre AS sedeOrigenNombre,
        m.sede_destino_id AS sedeDestinoId,
        sd.nombre AS sedeDestinoNombre,
        m.cantidad,
        m.series,
        m.solicitado_por AS solicitadoPor,
        m.aprobado_por AS aprobadoPor,
        m.recibido_por AS recibidoPor,
        m.estado_movimiento_id AS estadoMovimientoId,
        em.codigo AS estadoCodigo,
        em.nombre AS estadoNombre,
        em.color_hex AS estadoColor,
        m.motivo,
        m.observaciones,
        m.fecha_solicitud AS fechaSolicitud,
        m.fecha_aprobacion AS fechaAprobacion,
        m.fecha_envio AS fechaEnvio,
        m.fecha_recepcion AS fechaRecepcion,
        m.fecha_devolucion AS fechaDevolucion,
        m.created_at AS createdAt
      FROM movimientos_inventario m
      INNER JOIN productos p ON m.producto_id = p.id
      INNER JOIN sucursales so ON m.sede_origen_id = so.id
      INNER JOIN sucursales sd ON m.sede_destino_id = sd.id
      INNER JOIN estados_movimiento em ON m.estado_movimiento_id = em.id
      WHERE 1=1
    `;
    const params = [];
    if (tipo && (tipo === "TRASLADO" || tipo === "PRESTAMO")) {
      query += " AND m.tipo = ?";
      params.push(tipo);
    }
    if (estado) {
      query += " AND em.codigo = ?";
      params.push(estado);
    }
    if (sedeId && !isNaN(Number(sedeId))) {
      query += " AND (m.sede_origen_id = ? OR m.sede_destino_id = ?)";
      params.push(Number(sedeId), Number(sedeId));
    }
    query += " ORDER BY m.id DESC";
    const [rows] = await pool.query(query, params);
    const movimientos = rows.map((r) => {
      let parsedSeries = [];
      if (r.series) {
        try {
          parsedSeries = JSON.parse(r.series);
        } catch {
          parsedSeries = String(r.series).split(",").map((s) => s.trim()).filter(Boolean);
        }
      }
      return {
        id: r.id,
        codigo: r.codigo,
        tipo: r.tipo,
        productoId: r.productoId,
        productoNombre: r.productoNombre,
        productoCodigo: r.productoCodigo,
        requiereSerie: Boolean(r.requiereSerie),
        sedeOrigenId: r.sedeOrigenId,
        sedeOrigen: r.sedeOrigenNombre,
        sedeDestinoId: r.sedeDestinoId,
        sedeDestino: r.sedeDestinoNombre,
        cantidad: Number(r.cantidad),
        series: parsedSeries,
        solicitadoPor: r.solicitadoPor,
        aprobadoPor: r.aprobadoPor,
        recibidoPor: r.recibidoPor,
        estado: r.estadoCodigo,
        estadoNombre: r.estadoNombre,
        estadoColor: r.estadoColor,
        motivo: r.motivo || "",
        observaciones: r.observaciones || "",
        fecha: r.fechaSolicitud ? new Date(r.fechaSolicitud).toLocaleDateString("es-PE") : "",
        fechaSolicitud: r.fechaSolicitud,
        fechaAprobacion: r.fechaAprobacion,
        fechaEnvio: r.fechaEnvio,
        fechaRecepcion: r.fechaRecepcion,
        fechaDevolucion: r.fechaDevolucion
      };
    });
    res.json({
      success: true,
      total: movimientos.length,
      movimientos
    });
  } catch (error) {
    console.error("Error al listar movimientos de inventario:", error);
    res.status(500).json({ success: false, message: "Error interno al consultar movimientos de inventario." });
  }
}
async function getSeriesDisponiblesSede(req, res) {
  try {
    const productoId = Number(req.query.productoId);
    const sucursalId = Number(req.query.sucursalId);
    if (isNaN(productoId) || isNaN(sucursalId)) {
      res.status(400).json({ success: false, message: "Par\xE1metros productoId y sucursalId requeridos." });
      return;
    }
    const [rows] = await pool.query(
      `SELECT id, numero_serie, condicion, observaciones
       FROM producto_unidades
       WHERE producto_id = ? AND sucursal_id = ? AND estado_unidad_id = 1 AND disponible_venta = 1
       ORDER BY numero_serie ASC`,
      [productoId, sucursalId]
    );
    res.json({
      success: true,
      total: rows.length,
      series: rows.map((r) => ({
        id: r.id,
        numeroSerie: r.numero_serie,
        condicion: r.condicion,
        observaciones: r.observaciones
      }))
    });
  } catch (error) {
    console.error("Error al obtener series disponibles en sede:", error);
    res.status(500).json({ success: false, message: "Error interno al consultar series disponibles." });
  }
}
async function createMovimiento(req, res) {
  const connection = await pool.getConnection();
  try {
    const {
      tipo = "TRASLADO",
      // 'TRASLADO' | 'PRESTAMO'
      productoId,
      sedeOrigenId,
      sedeDestinoId,
      cantidad = 1,
      series = [],
      solicitadoPor,
      motivo = "",
      observaciones = ""
    } = req.body;
    if (!productoId || !sedeOrigenId || !sedeDestinoId) {
      res.status(400).json({ success: false, message: "Producto, sede de origen y sede de destino son requeridos." });
      return;
    }
    if (Number(sedeOrigenId) === Number(sedeDestinoId)) {
      res.status(400).json({ success: false, message: "La sede de origen no puede ser igual a la sede de destino." });
      return;
    }
    const numCantidad = Number(cantidad);
    if (isNaN(numCantidad) || numCantidad < 1) {
      res.status(400).json({ success: false, message: "La cantidad a trasladar debe ser mayor a cero." });
      return;
    }
    const [prods] = await connection.query(
      "SELECT id, nombre, requiere_serie FROM productos WHERE id = ?",
      [productoId]
    );
    if (prods.length === 0) {
      res.status(404).json({ success: false, message: "Producto no encontrado." });
      return;
    }
    const prod = prods[0];
    const [stockOrigenRows] = await connection.query(
      "SELECT stock FROM producto_stock_sede WHERE producto_id = ? AND sucursal_id = ?",
      [productoId, sedeOrigenId]
    );
    const stockDisponible = stockOrigenRows.length > 0 ? Number(stockOrigenRows[0].stock) : 0;
    if (stockDisponible < numCantidad) {
      res.status(400).json({
        success: false,
        message: `Stock insuficiente en la sede origen. Disponible: ${stockDisponible}, Solicitado: ${numCantidad}.`
      });
      return;
    }
    let seriesList = [];
    if (Array.isArray(series) && series.length > 0) {
      seriesList = series.map((s) => String(s).trim()).filter(Boolean);
      if (seriesList.length !== numCantidad) {
        res.status(400).json({
          success: false,
          message: `Debe seleccionar exactamente ${numCantidad} n\xFAmero(s) de serie. (Seleccionados: ${seriesList.length}).`
        });
        return;
      }
      const [seriesEnOrigen] = await connection.query(
        `SELECT numero_serie FROM producto_unidades 
         WHERE producto_id = ? AND sucursal_id = ? AND estado_unidad_id = 1 AND numero_serie IN (?)`,
        [productoId, sedeOrigenId, seriesList]
      );
      if (seriesEnOrigen.length !== seriesList.length) {
        res.status(400).json({
          success: false,
          message: "Una o m\xE1s series seleccionadas no se encuentran disponibles en la sede origen."
        });
        return;
      }
    }
    const prefix = tipo === "PRESTAMO" ? "PREST" : "TRASL";
    const codigo = `${prefix}-${Date.now().toString().slice(-6)}`;
    const [insertResult] = await connection.query(
      `INSERT INTO movimientos_inventario 
       (codigo, tipo, producto_id, sede_origen_id, sede_destino_id, cantidad, series, solicitado_por, estado_movimiento_id, motivo, observaciones, fecha_solicitud)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NOW())`,
      [
        codigo,
        tipo,
        productoId,
        sedeOrigenId,
        sedeDestinoId,
        numCantidad,
        seriesList.length > 0 ? JSON.stringify(seriesList) : null,
        solicitadoPor || "Usuario",
        motivo.trim() || null,
        observaciones.trim() || null
      ]
    );
    res.status(201).json({
      success: true,
      message: `${tipo === "PRESTAMO" ? "Pr\xE9stamo" : "Traslado"} registrado exitosamente con c\xF3digo ${codigo}.`,
      movimientoId: insertResult.insertId,
      codigo
    });
  } catch (error) {
    console.error("Error al registrar movimiento entre sedes:", error);
    res.status(500).json({ success: false, message: "Error interno al registrar el movimiento." });
  } finally {
    connection.release();
  }
}
async function updateEstadoMovimiento(req, res) {
  const connection = await pool.getConnection();
  try {
    const movimientoId = Number(req.params.id);
    const { estadoCodigo, usuarioNombre = "Administrador" } = req.body;
    if (isNaN(movimientoId) || !estadoCodigo) {
      res.status(400).json({ success: false, message: "ID de movimiento y estadoCodigo son requeridos." });
      return;
    }
    const [movRows] = await connection.query(
      `SELECT m.*, em.codigo AS estadoActualCodigo 
       FROM movimientos_inventario m
       INNER JOIN estados_movimiento em ON m.estado_movimiento_id = em.id
       WHERE m.id = ?`,
      [movimientoId]
    );
    if (movRows.length === 0) {
      res.status(404).json({ success: false, message: "Movimiento no encontrado." });
      return;
    }
    const mov = movRows[0];
    const estadoActual = mov.estadoActualCodigo;
    const [estadoRows] = await connection.query(
      "SELECT id, codigo, nombre FROM estados_movimiento WHERE codigo = ?",
      [estadoCodigo]
    );
    if (estadoRows.length === 0) {
      res.status(400).json({ success: false, message: `Estado '${estadoCodigo}' no reconocido.` });
      return;
    }
    const nuevoEstadoId = estadoRows[0].id;
    let seriesList = [];
    if (mov.series) {
      try {
        seriesList = JSON.parse(mov.series);
      } catch {
        seriesList = String(mov.series).split(",").map((s) => s.trim()).filter(Boolean);
      }
    }
    await connection.beginTransaction();
    if (estadoCodigo === "RECIBIDO" && estadoActual !== "RECIBIDO") {
      const [stockOrigenRows] = await connection.query(
        "SELECT stock FROM producto_stock_sede WHERE producto_id = ? AND sucursal_id = ?",
        [mov.producto_id, mov.sede_origen_id]
      );
      const stockOrigen = stockOrigenRows.length > 0 ? Number(stockOrigenRows[0].stock) : 0;
      if (stockOrigen < mov.cantidad) {
        await connection.rollback();
        res.status(400).json({
          success: false,
          message: `Stock insuficiente en sede origen para concretar la recepci\xF3n. (Disponible: ${stockOrigen}, Necesario: ${mov.cantidad})`
        });
        return;
      }
      await connection.query(
        "UPDATE producto_stock_sede SET stock = stock - ?, updated_at = NOW() WHERE producto_id = ? AND sucursal_id = ?",
        [mov.cantidad, mov.producto_id, mov.sede_origen_id]
      );
      const [stockDestinoRows] = await connection.query(
        "SELECT stock FROM producto_stock_sede WHERE producto_id = ? AND sucursal_id = ?",
        [mov.producto_id, mov.sede_destino_id]
      );
      if (stockDestinoRows.length > 0) {
        await connection.query(
          "UPDATE producto_stock_sede SET stock = stock + ?, updated_at = NOW() WHERE producto_id = ? AND sucursal_id = ?",
          [mov.cantidad, mov.producto_id, mov.sede_destino_id]
        );
      } else {
        await connection.query(
          "INSERT INTO producto_stock_sede (producto_id, sucursal_id, stock, updated_at) VALUES (?, ?, ?, NOW())",
          [mov.producto_id, mov.sede_destino_id, mov.cantidad]
        );
      }
      if (seriesList.length > 0) {
        await connection.query(
          "UPDATE producto_unidades SET sucursal_id = ? WHERE producto_id = ? AND numero_serie IN (?)",
          [mov.sede_destino_id, mov.producto_id, seriesList]
        );
      }
      await connection.query(
        `UPDATE movimientos_inventario 
         SET estado_movimiento_id = ?, recibido_por = ?, fecha_recepcion = NOW(), updated_at = NOW()
         WHERE id = ?`,
        [nuevoEstadoId, usuarioNombre, movimientoId]
      );
    } else if (estadoCodigo === "DEVUELTO" && estadoActual === "RECIBIDO" && mov.tipo === "PRESTAMO") {
      await connection.query(
        "UPDATE producto_stock_sede SET stock = GREATEST(0, stock - ?), updated_at = NOW() WHERE producto_id = ? AND sucursal_id = ?",
        [mov.cantidad, mov.producto_id, mov.sede_destino_id]
      );
      await connection.query(
        "UPDATE producto_stock_sede SET stock = stock + ?, updated_at = NOW() WHERE producto_id = ? AND sucursal_id = ?",
        [mov.cantidad, mov.producto_id, mov.sede_origen_id]
      );
      if (seriesList.length > 0) {
        await connection.query(
          "UPDATE producto_unidades SET sucursal_id = ? WHERE producto_id = ? AND numero_serie IN (?)",
          [mov.sede_origen_id, mov.producto_id, seriesList]
        );
      }
      await connection.query(
        `UPDATE movimientos_inventario 
         SET estado_movimiento_id = ?, fecha_devolucion = NOW(), updated_at = NOW()
         WHERE id = ?`,
        [nuevoEstadoId, movimientoId]
      );
    } else {
      let extraUpdate = "";
      const updateParams = [nuevoEstadoId];
      if (estadoCodigo === "APROBADO") {
        extraUpdate = ", aprobado_por = ?, fecha_aprobacion = NOW()";
        updateParams.push(usuarioNombre);
      } else if (estadoCodigo === "EN_TRANSITO") {
        extraUpdate = ", fecha_envio = NOW()";
      }
      updateParams.push(movimientoId);
      await connection.query(
        `UPDATE movimientos_inventario 
         SET estado_movimiento_id = ?${extraUpdate}, updated_at = NOW()
         WHERE id = ?`,
        updateParams
      );
    }
    await connection.commit();
    res.json({
      success: true,
      message: `El movimiento ahora se encuentra en estado: ${estadoRows[0].nombre}.`,
      nuevoEstado: estadoCodigo
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al actualizar estado del movimiento:", error);
    res.status(500).json({ success: false, message: "Error interno al actualizar estado del movimiento." });
  } finally {
    connection.release();
  }
}

// server/routes/transfer.routes.ts
var router11 = Router11();
router11.use("/almacen", authenticateToken);
router11.get("/almacen/movimientos", getMovimientos);
router11.get("/almacen/series-disponibles", getSeriesDisponiblesSede);
router11.post("/almacen/movimientos", createMovimiento);
router11.put("/almacen/movimientos/:id/estado", updateEstadoMovimiento);
var transfer_routes_default = router11;

// server/routes/purchase.routes.ts
import { Router as Router12 } from "express";

// server/controllers/purchase.controller.ts
init_mailer();
async function getProveedores(_req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.id,
        p.ruc,
        p.razon_social AS razonSocial,
        p.nombre_contacto AS contacto,
        p.telefono,
        p.email,
        p.direccion,
        e.nombre AS estado,
        p.estado_id AS estadoId,
        DATE_FORMAT(p.created_at, '%Y-%m-%d') AS fechaRegistro
      FROM proveedores p
      INNER JOIN estados e ON p.estado_id = e.id
      ORDER BY p.id ASC
    `);
    res.json({
      success: true,
      total: rows.length,
      proveedores: rows.map((r) => ({
        id: r.id,
        ruc: r.ruc,
        razonSocial: r.razonSocial,
        contacto: r.contacto || "",
        telefono: r.telefono || "",
        email: r.email || "",
        direccion: r.direccion || "",
        estado: r.estado === "ACTIVO" ? "ACTIVO" : "INACTIVO",
        fechaRegistro: r.fechaRegistro || ""
      }))
    });
  } catch (error) {
    console.error("Error al listar proveedores:", error);
    res.status(500).json({ success: false, message: "Error interno al consultar proveedores." });
  }
}
async function createProveedor(req, res) {
  try {
    const { ruc, razonSocial, contacto = "", telefono = "", email = "", direccion = "" } = req.body;
    if (!ruc || !ruc.trim() || ruc.trim().length !== 11) {
      res.status(400).json({ success: false, message: "El RUC debe tener 11 d\xEDgitos num\xE9ricos." });
      return;
    }
    if (!razonSocial || !razonSocial.trim()) {
      res.status(400).json({ success: false, message: "La raz\xF3n social es obligatoria." });
      return;
    }
    const [exists] = await pool.query(
      "SELECT id FROM proveedores WHERE ruc = ?",
      [ruc.trim()]
    );
    if (exists.length > 0) {
      res.status(409).json({ success: false, message: "Ya existe un proveedor registrado con ese RUC." });
      return;
    }
    const [result] = await pool.query(
      `INSERT INTO proveedores (ruc, razon_social, nombre_contacto, telefono, email, direccion, estado_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [ruc.trim(), razonSocial.trim(), contacto.trim(), telefono.trim(), email.trim(), direccion.trim()]
    );
    res.status(201).json({
      success: true,
      message: "Proveedor registrado exitosamente.",
      proveedor: {
        id: result.insertId,
        ruc: ruc.trim(),
        razonSocial: razonSocial.trim(),
        contacto: contacto.trim(),
        telefono: telefono.trim(),
        email: email.trim(),
        direccion: direccion.trim(),
        estado: "ACTIVO",
        fechaRegistro: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
      }
    });
  } catch (error) {
    console.error("Error al crear proveedor:", error);
    res.status(500).json({ success: false, message: "Error interno al guardar proveedor." });
  }
}
async function updateProveedor(req, res) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "ID de proveedor inv\xE1lido." });
      return;
    }
    const { ruc, razonSocial, contacto = "", telefono = "", email = "", direccion = "" } = req.body;
    if (!ruc || !ruc.trim() || ruc.trim().length !== 11) {
      res.status(400).json({ success: false, message: "El RUC debe tener 11 d\xEDgitos num\xE9ricos." });
      return;
    }
    if (!razonSocial || !razonSocial.trim()) {
      res.status(400).json({ success: false, message: "La raz\xF3n social es obligatoria." });
      return;
    }
    await pool.query(
      `UPDATE proveedores 
       SET ruc = ?, razon_social = ?, nombre_contacto = ?, telefono = ?, email = ?, direccion = ?, updated_at = NOW()
       WHERE id = ?`,
      [ruc.trim(), razonSocial.trim(), contacto.trim(), telefono.trim(), email.trim(), direccion.trim(), id]
    );
    res.json({
      success: true,
      message: "Proveedor actualizado exitosamente.",
      proveedor: {
        id,
        ruc: ruc.trim(),
        razonSocial: razonSocial.trim(),
        contacto: contacto.trim(),
        telefono: telefono.trim(),
        email: email.trim(),
        direccion: direccion.trim(),
        estado: "ACTIVO"
      }
    });
  } catch (error) {
    console.error("Error al actualizar proveedor:", error);
    res.status(500).json({ success: false, message: "Error interno al actualizar proveedor." });
  }
}
async function toggleProveedorEstado(req, res) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "ID de proveedor inv\xE1lido." });
      return;
    }
    const [current] = await pool.query(
      "SELECT estado_id FROM proveedores WHERE id = ?",
      [id]
    );
    if (current.length === 0) {
      res.status(404).json({ success: false, message: "Proveedor no encontrado." });
      return;
    }
    const nuevoEstadoId = current[0].estado_id === 1 ? 2 : 1;
    await pool.query("UPDATE proveedores SET estado_id = ?, updated_at = NOW() WHERE id = ?", [nuevoEstadoId, id]);
    res.json({
      success: true,
      message: `Proveedor ${nuevoEstadoId === 1 ? "activado" : "desactivado"} exitosamente.`,
      nuevoEstado: nuevoEstadoId === 1 ? "ACTIVO" : "INACTIVO"
    });
  } catch (error) {
    console.error("Error al cambiar estado de proveedor:", error);
    res.status(500).json({ success: false, message: "Error interno al actualizar estado del proveedor." });
  }
}
async function getCompras(_req, res) {
  try {
    const [comprasRows] = await pool.query(`
      SELECT 
        c.id,
        c.codigo AS codigoComprobante,
        c.proveedor_id AS proveedorId,
        p.ruc AS proveedorRuc,
        p.razon_social AS proveedorRazonSocial,
        p.email AS proveedorEmail,
        p.telefono AS proveedorTelefono,
        c.sucursal_id AS sucursalId,
        COALESCE(s.nombre, 'Principal - Chiclayo Centro') AS sucursalDestino,
        c.usuario_id AS compradorId,
        COALESCE(u.nombre_completo, 'Administrador') AS compradorNombre,
        c.total,
        e.nombre AS estado,
        c.fecha_compra AS fecha,
        c.observaciones
      FROM compras c
      INNER JOIN proveedores p ON c.proveedor_id = p.id
      LEFT JOIN sucursales s ON c.sucursal_id = s.id
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      INNER JOIN estados e ON c.estado_id = e.id
      ORDER BY c.id DESC
    `);
    if (comprasRows.length === 0) {
      res.json({ success: true, total: 0, compras: [] });
      return;
    }
    const compraIds = comprasRows.map((c) => c.id);
    const [itemsRows] = await pool.query(`
      SELECT 
        dc.id,
        dc.compra_id AS compraId,
        dc.producto_id AS productoId,
        pr.codigo,
        pr.nombre,
        pr.requiere_serie AS requiereSerie,
        pr.tipo_destino AS tipoDestino,
        cat.nombre AS categoria,
        m.nombre AS marca,
        dc.cantidad,
        dc.precio_costo_unit AS precioCostoUnitario,
        dc.subtotal
      FROM detalle_compras dc
      INNER JOIN productos pr ON dc.producto_id = pr.id
      INNER JOIN categorias cat ON pr.categoria_id = cat.id
      INNER JOIN marcas m ON pr.marca_id = m.id
      WHERE dc.compra_id IN (?)
      ORDER BY dc.id ASC
    `, [compraIds]);
    const itemsMap = /* @__PURE__ */ new Map();
    for (const it of itemsRows) {
      if (!itemsMap.has(it.compraId)) {
        itemsMap.set(it.compraId, []);
      }
      itemsMap.get(it.compraId).push({
        productoId: it.productoId,
        codigo: it.codigo,
        nombre: it.nombre,
        categoria: it.categoria,
        marca: it.marca,
        cantidad: Number(it.cantidad),
        precioCostoUnitario: Number(it.precioCostoUnitario),
        subtotal: Number(it.subtotal),
        requiereSerie: Boolean(it.requiereSerie) || Number(it.requiereSerie) === 1,
        tipoDestino: it.tipoDestino || "VENTA"
      });
    }
    const compras = comprasRows.map((c) => {
      const tot = Number(c.total);
      const sub = Math.round(tot / 1.18 * 100) / 100;
      const igv = Math.round((tot - sub) * 100) / 100;
      const rawObs = String(c.observaciones || "");
      const isPendingOrder = rawObs.startsWith("[PEDIDO_SOLICITADO]");
      const cleanObs = rawObs.replace(/^\[PEDIDO_SOLICITADO\]\s*/i, "").replace(/^\[RECIBIDO_ALMACEN\]\s*/i, "").trim();
      const estadoResolved = c.estado !== "ACTIVO" ? "ANULADA" : isPendingOrder ? "SOLICITADO" : "REGISTRADA";
      const tipoCompResolved = c.codigoComprobante.startsWith("OC-") ? "ORDEN_COMPRA" : c.codigoComprobante.startsWith("F") ? "FACTURA" : c.codigoComprobante.startsWith("B") ? "BOLETA" : "GUIA_REMISION";
      return {
        id: c.id,
        codigoComprobante: c.codigoComprobante,
        tipoComprobante: tipoCompResolved,
        proveedorId: c.proveedorId,
        proveedorRuc: c.proveedorRuc,
        proveedorRazonSocial: c.proveedorRazonSocial,
        proveedorEmail: c.proveedorEmail || "",
        proveedorTelefono: c.proveedorTelefono || "",
        sucursalDestino: c.sucursalDestino,
        compradorId: c.compradorId || 1,
        compradorNombre: c.compradorNombre,
        fecha: new Date(c.fecha).toLocaleString("es-PE"),
        items: itemsMap.get(c.id) || [],
        subtotal: sub,
        igv,
        total: tot,
        estado: estadoResolved,
        observaciones: cleanObs
      };
    });
    res.json({
      success: true,
      total: compras.length,
      compras
    });
  } catch (error) {
    console.error("Error al listar compras:", error);
    res.status(500).json({ success: false, message: "Error interno al consultar compras." });
  }
}
async function createCompra(req, res) {
  const connection = await pool.getConnection();
  try {
    const {
      codigoComprobante,
      proveedorId,
      sucursalDestino,
      // puede ser nombre o ID
      compradorId = 1,
      items = [],
      total,
      observaciones = "",
      modoIngreso = "SOLICITADO"
      // 'SOLICITADO' | 'RECEPCION_DIRECTA'
    } = req.body;
    if (!proveedorId) {
      res.status(400).json({ success: false, message: "Debe seleccionar un proveedor v\xE1lido." });
      return;
    }
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: "El pedido debe contener al menos un producto." });
      return;
    }
    const isPendingOrder = modoIngreso === "SOLICITADO";
    let targetSucursalId = 1;
    if (typeof sucursalDestino === "number") {
      targetSucursalId = sucursalDestino;
    } else if (typeof sucursalDestino === "string") {
      const [sucRows] = await connection.query(
        "SELECT id FROM sucursales WHERE nombre LIKE ? LIMIT 1",
        [`%${sucursalDestino.trim()}%`]
      );
      if (sucRows.length > 0) {
        targetSucursalId = sucRows[0].id;
      }
    }
    const cleanCodigo = codigoComprobante && codigoComprobante.trim() ? codigoComprobante.trim() : isPendingOrder ? `OC-${Date.now().toString().slice(-6)}` : `CMP-${Date.now().toString().slice(-6)}`;
    const totalCalculado = items.reduce(
      (sum, it) => sum + Number(it.cantidad) * Number(it.precioCostoUnitario || it.precioUnitario || 0),
      0
    );
    const finalTotal = total ? Number(total) : totalCalculado;
    const storedObservaciones = isPendingOrder ? `[PEDIDO_SOLICITADO] ${(observaciones || "Orden de pedido emitida a proveedor. Pendiente de recepci\xF3n f\xEDsica en almac\xE9n.").trim()}` : `[RECIBIDO_ALMACEN] ${(observaciones || "Ingreso recepcionado conforme en almac\xE9n.").trim()}`;
    await connection.beginTransaction();
    const [compraResult] = await connection.query(
      `INSERT INTO compras (codigo, proveedor_id, sucursal_id, total, estado_id, usuario_id, fecha_compra, observaciones, updated_at)
       VALUES (?, ?, ?, ?, 1, ?, NOW(), ?, NOW())`,
      [cleanCodigo, Number(proveedorId), targetSucursalId, finalTotal, Number(compradorId) || 1, storedObservaciones]
    );
    const newCompraId = compraResult.insertId;
    for (const item of items) {
      const prodId = Number(item.productoId);
      const cant = Number(item.cantidad) || 1;
      const costoUnit = Number(item.precioCostoUnitario || item.precioUnitario || 0);
      const itemSubtotal = cant * costoUnit;
      const [prodCheck] = await connection.query(
        "SELECT id, nombre, requiere_serie, tipo_destino FROM productos WHERE id = ?",
        [prodId]
      );
      if (prodCheck.length === 0) {
        await connection.rollback();
        res.status(400).json({
          success: false,
          message: `El producto '${item.nombre || "ID " + prodId}' no existe en la base de datos de almac\xE9n.`
        });
        return;
      }
      await connection.query(
        `INSERT INTO detalle_compras (compra_id, producto_id, cantidad, precio_costo_unit, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [newCompraId, prodId, cant, costoUnit, itemSubtotal]
      );
      if (!isPendingOrder) {
        const [stockExists] = await connection.query(
          "SELECT stock FROM producto_stock_sede WHERE producto_id = ? AND sucursal_id = ?",
          [prodId, targetSucursalId]
        );
        if (stockExists.length > 0) {
          await connection.query(
            "UPDATE producto_stock_sede SET stock = stock + ?, updated_at = NOW() WHERE producto_id = ? AND sucursal_id = ?",
            [cant, prodId, targetSucursalId]
          );
        } else {
          await connection.query(
            "INSERT INTO producto_stock_sede (producto_id, sucursal_id, stock, updated_at) VALUES (?, ?, ?, NOW())",
            [prodId, targetSucursalId, cant]
          );
        }
        if (costoUnit > 0) {
          await connection.query(
            "UPDATE productos SET precio_costo = ?, updated_at = NOW() WHERE id = ?",
            [costoUnit, prodId]
          );
        }
        if (Array.isArray(item.series) && item.series.length > 0) {
          const destinoProd = prodCheck[0].tipo_destino || "VENTA";
          for (const s of item.series) {
            const cleanSerie = String(s || "").trim().toUpperCase();
            if (!cleanSerie) continue;
            const [existingUnit] = await connection.query(
              "SELECT id FROM producto_unidades WHERE producto_id = ? AND numero_serie = ?",
              [prodId, cleanSerie]
            );
            if (existingUnit.length > 0) {
              await connection.query(
                `UPDATE producto_unidades 
                 SET sucursal_id = ?, estado_unidad_id = 1, disponible_venta = 1, condicion = 'NUEVO', costo_adquisicion = ?, updated_at = NOW()
                 WHERE id = ?`,
                [targetSucursalId, costoUnit, existingUnit[0].id]
              );
            } else {
              await connection.query(
                `INSERT INTO producto_unidades 
                 (producto_id, sucursal_id, numero_serie, estado_unidad_id, tipo_destino, disponible_venta, condicion, costo_adquisicion, fecha_ingreso)
                 VALUES (?, ?, ?, 1, ?, 1, 'NUEVO', ?, NOW())`,
                [prodId, targetSucursalId, cleanSerie, destinoProd, costoUnit]
              );
            }
          }
        }
      }
    }
    await connection.commit();
    res.status(201).json({
      success: true,
      message: isPendingOrder ? `Orden de Pedido ${cleanCodigo} emitida al proveedor. Pendiente de Recepci\xF3n F\xEDsica en Almac\xE9n.` : `Recepci\xF3n ${cleanCodigo} registrada exitosamente. Stock actualizado en Almac\xE9n.`,
      compraId: newCompraId,
      codigoComprobante: cleanCodigo,
      estado: isPendingOrder ? "SOLICITADO" : "REGISTRADA"
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al registrar compra/pedido:", error);
    res.status(500).json({ success: false, message: "Error interno al registrar el pedido/compra." });
  } finally {
    connection.release();
  }
}
async function recepcionarCompra(req, res) {
  const connection = await pool.getConnection();
  try {
    const compraId = Number(req.params.id);
    if (isNaN(compraId)) {
      res.status(400).json({ success: false, message: "ID de pedido inv\xE1lido." });
      return;
    }
    const {
      codigoComprobante,
      observacionesRecepcion = "",
      seriesPorProducto = {},
      // Record<number, string[]>
      preciosVentaPorProducto = {},
      // Record<number, number>
      destinosPorProducto = {},
      // Record<number, string>
      mostrarEnPosPorProducto = {}
      // Record<number, boolean>
    } = req.body;
    const [compraRows] = await connection.query(
      "SELECT id, codigo, sucursal_id, estado_id, observaciones FROM compras WHERE id = ?",
      [compraId]
    );
    if (compraRows.length === 0) {
      res.status(404).json({ success: false, message: "Orden de pedido no encontrada." });
      return;
    }
    const cmp = compraRows[0];
    if (cmp.estado_id !== 1) {
      res.status(400).json({ success: false, message: "No se puede recepcionar un pedido anulado." });
      return;
    }
    const rawObs = String(cmp.observaciones || "");
    if (!rawObs.startsWith("[PEDIDO_SOLICITADO]")) {
      res.status(400).json({
        success: false,
        message: "Este pedido ya fue recepcionado previamente en el almac\xE9n."
      });
      return;
    }
    const [items] = await connection.query(
      `SELECT dc.producto_id AS productoId, dc.cantidad, dc.precio_costo_unit AS costoUnit,
              pr.nombre, pr.requiere_serie AS requiereSerie, pr.tipo_destino AS tipoDestino
       FROM detalle_compras dc
       INNER JOIN productos pr ON dc.producto_id = pr.id
       WHERE dc.compra_id = ?`,
      [compraId]
    );
    for (const it of items) {
      const reqSerie = Boolean(it.requiereSerie) || Number(it.requiereSerie) === 1;
      if (reqSerie) {
        const providedSeries = Array.isArray(seriesPorProducto[it.productoId]) ? seriesPorProducto[it.productoId].map((s) => String(s).trim()).filter(Boolean) : [];
        if (providedSeries.length < Number(it.cantidad)) {
          res.status(400).json({
            success: false,
            message: `Integridad de Almac\xE9n: El producto "${it.nombre}" requiere registrar ${it.cantidad} n\xFAmero(s) de serie f\xEDsicos para poder ingresar al almac\xE9n (registrados: ${providedSeries.length}).`
          });
          return;
        }
      }
    }
    await connection.beginTransaction();
    const targetSucursalId = Number(cmp.sucursal_id) || 1;
    for (const it of items) {
      const prodId = Number(it.productoId);
      const cant = Number(it.cantidad) || 1;
      const costoUnit = Number(it.costoUnit) || 0;
      const destinoProd = it.tipoDestino || "VENTA";
      const [stockExists] = await connection.query(
        "SELECT stock FROM producto_stock_sede WHERE producto_id = ? AND sucursal_id = ?",
        [prodId, targetSucursalId]
      );
      if (stockExists.length > 0) {
        await connection.query(
          "UPDATE producto_stock_sede SET stock = stock + ?, updated_at = NOW() WHERE producto_id = ? AND sucursal_id = ?",
          [cant, prodId, targetSucursalId]
        );
      } else {
        await connection.query(
          "INSERT INTO producto_stock_sede (producto_id, sucursal_id, stock, updated_at) VALUES (?, ?, ?, NOW())",
          [prodId, targetSucursalId, cant]
        );
      }
      const ventaConfirmada = Number(preciosVentaPorProducto[prodId]) || 0;
      const destinoConfirmado = destinosPorProducto[prodId] || destinoProd;
      const mostrarEnPos = mostrarEnPosPorProducto[prodId] !== void 0 ? mostrarEnPosPorProducto[prodId] ? 1 : 0 : 1;
      const prodUpdates = ["updated_at = NOW()"];
      const prodParams = [];
      if (costoUnit > 0) {
        prodUpdates.push("precio_costo = ?");
        prodParams.push(costoUnit);
      }
      if (ventaConfirmada > 0) {
        prodUpdates.push("precio_venta = ?");
        prodParams.push(ventaConfirmada);
      }
      if (destinoConfirmado) {
        prodUpdates.push("tipo_destino = ?");
        prodParams.push(destinoConfirmado);
      }
      prodUpdates.push("disponible_venta = ?");
      prodParams.push(mostrarEnPos);
      prodParams.push(prodId);
      await connection.query(
        `UPDATE productos SET ${prodUpdates.join(", ")} WHERE id = ?`,
        prodParams
      );
      const providedSeries = Array.isArray(seriesPorProducto[prodId]) ? seriesPorProducto[prodId] : [];
      for (const s of providedSeries) {
        const cleanSerie = String(s || "").trim().toUpperCase();
        if (!cleanSerie) continue;
        const [existingUnit] = await connection.query(
          "SELECT id FROM producto_unidades WHERE producto_id = ? AND numero_serie = ?",
          [prodId, cleanSerie]
        );
        if (existingUnit.length > 0) {
          await connection.query(
            `UPDATE producto_unidades 
             SET sucursal_id = ?, estado_unidad_id = 1, disponible_venta = 1, condicion = 'NUEVO', costo_adquisicion = ?, updated_at = NOW()
             WHERE id = ?`,
            [targetSucursalId, costoUnit, existingUnit[0].id]
          );
        } else {
          await connection.query(
            `INSERT INTO producto_unidades 
             (producto_id, sucursal_id, numero_serie, estado_unidad_id, tipo_destino, disponible_venta, condicion, costo_adquisicion, fecha_ingreso)
             VALUES (?, ?, ?, 1, ?, 1, 'NUEVO', ?, NOW())`,
            [prodId, targetSucursalId, cleanSerie, destinoProd, costoUnit]
          );
        }
      }
    }
    const prevCleanObs = rawObs.replace(/^\[PEDIDO_SOLICITADO\]\s*/i, "").trim();
    const finalObs = `[RECIBIDO_ALMACEN] ${prevCleanObs}${observacionesRecepcion.trim() ? ` | Recepci\xF3n: ${observacionesRecepcion.trim()}` : ""}`;
    const finalCodigo = codigoComprobante && String(codigoComprobante).trim() ? String(codigoComprobante).trim().toUpperCase() : cmp.codigo;
    await connection.query(
      "UPDATE compras SET codigo = ?, observaciones = ?, updated_at = NOW() WHERE id = ?",
      [finalCodigo, finalObs, compraId]
    );
    await connection.commit();
    res.json({
      success: true,
      message: `Mercader\xEDa recepcionada conforme (${finalCodigo}). El stock ya est\xE1 disponible para Ventas POS y Taller T\xE9cnico.`,
      codigoComprobante: finalCodigo,
      estado: "REGISTRADA"
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al recepcionar pedido en almac\xE9n:", error);
    res.status(500).json({ success: false, message: "Error interno al recepcionar el pedido en almac\xE9n." });
  } finally {
    connection.release();
  }
}
async function enviarOrdenCompraEmail(req, res) {
  try {
    const compraId = Number(req.params.id);
    if (isNaN(compraId)) {
      res.status(400).json({ success: false, message: "ID de orden inv\xE1lido." });
      return;
    }
    const [rows] = await pool.query(
      `SELECT c.id, c.codigo, c.total, c.fecha_compra AS fecha, c.observaciones,
              p.ruc AS proveedorRuc, p.razon_social AS proveedorRazonSocial, p.email AS proveedorEmail, p.nombre_contacto AS contacto,
              COALESCE(s.nombre, 'Principal - Chiclayo Centro') AS sucursalDestino
       FROM compras c
       INNER JOIN proveedores p ON c.proveedor_id = p.id
       LEFT JOIN sucursales s ON c.sucursal_id = s.id
       WHERE c.id = ?`,
      [compraId]
    );
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: "Orden de pedido no encontrada." });
      return;
    }
    const order = rows[0];
    const targetEmail = String(order.proveedorEmail || "").trim();
    if (!targetEmail || !targetEmail.includes("@")) {
      res.status(400).json({
        success: false,
        message: "El proveedor seleccionado no tiene un correo electr\xF3nico oficial registrado en el Directorio de Proveedores."
      });
      return;
    }
    const [items] = await pool.query(
      `SELECT pr.codigo, pr.nombre, dc.cantidad, dc.precio_costo_unit AS precioUnitario, dc.subtotal
       FROM detalle_compras dc
       INNER JOIN productos pr ON dc.producto_id = pr.id
       WHERE dc.compra_id = ?`,
      [compraId]
    );
    const rowsHtml = items.map(
      (it) => `
        <tr>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-family:monospace;font-size:12px;">${it.codigo}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;font-weight:600;">${it.nombre}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:12px;font-weight:700;">${it.cantidad}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:right;font-size:12px;">S/ ${Number(it.precioUnitario).toFixed(2)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:right;font-size:12px;font-weight:700;">S/ ${Number(it.subtotal).toFixed(2)}</td>
        </tr>`
    ).join("");
    const cleanObs = String(order.observaciones || "").replace(/^\[PEDIDO_SOLICITADO\]\s*/i, "").replace(/^\[RECIBIDO_ALMACEN\]\s*/i, "");
    const html = `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:640px;margin:0 auto;border:1px solid #cbd5e1;border-radius:12px;overflow:hidden;background:#ffffff;">
        <div style="background:#00346F;color:#ffffff;padding:20px 24px;">
          <h2 style="margin:0;font-size:18px;">ORDEN DE PEDIDO A PROVEEDOR \u2022 ${order.codigo}</h2>
          <p style="margin:4px 0 0;font-size:12px;color:#bfdbfe;">MG SOLUTIONS GROUP S.A.C. \u2022 Log\xEDstica & Abastecimiento de Almac\xE9n</p>
        </div>
        <div style="padding:20px 24px;color:#1e293b;font-size:13px;">
          <p>Estimados <strong>${order.proveedorRazonSocial}</strong> (RUC: ${order.proveedorRuc}),</p>
          <p>Por medio de la presente les remitimos nuestra Orden de Pedido oficial para abastecimiento de nuestra sede <strong>${order.sucursalDestino}</strong>:</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f8fafc;border-radius:8px;">
            <thead>
              <tr style="background:#e2e8f0;color:#0f172a;font-size:11px;text-transform:uppercase;">
                <th style="padding:8px 10px;text-align:left;">C\xF3digo</th>
                <th style="padding:8px 10px;text-align:left;">Descripci\xF3n / Repuesto / Equipo</th>
                <th style="padding:8px 10px;text-align:center;">Cant.</th>
                <th style="padding:8px 10px;text-align:right;">Costo Unit.</th>
                <th style="padding:8px 10px;text-align:right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <div style="text-align:right;font-size:15px;font-weight:800;color:#00346F;margin-top:12px;">
            TOTAL ORDENADO: S/ ${Number(order.total).toFixed(2)}
          </div>
          ${cleanObs ? `<p style="margin-top:14px;padding:10px;background:#f1f5f9;border-left:4px solid #00346F;font-size:12px;"><strong>Observaciones de Almac\xE9n:</strong> ${cleanObs}</p>` : ""}
          <p style="margin-top:18px;font-size:11px;color:#64748b;">Favor de adjuntar Factura Electr\xF3nica y Gu\xEDa de Remisi\xF3n al momento de la entrega f\xEDsica en nuestro almac\xE9n.</p>
        </div>
      </div>
    `;
    await dispatchEmail({
      to: targetEmail,
      subject: `Orden de Pedido ${order.codigo} - MG Solutions Group S.A.C.`,
      text: `Orden de Pedido ${order.codigo} para ${order.proveedorRazonSocial} por S/ ${Number(order.total).toFixed(2)}`,
      html
    });
    res.json({
      success: true,
      message: `Orden de Pedido ${order.codigo} enviada exitosamente al correo oficial del proveedor (${targetEmail}).`
    });
  } catch (error) {
    console.error("Error al enviar orden de compra por correo:", error);
    res.status(500).json({ success: false, message: "No se pudo enviar el correo al proveedor." });
  }
}
async function anularCompra(req, res) {
  const connection = await pool.getConnection();
  try {
    const compraId = Number(req.params.id);
    if (isNaN(compraId)) {
      res.status(400).json({ success: false, message: "ID de compra inv\xE1lido." });
      return;
    }
    const [compraRows] = await connection.query(
      "SELECT id, codigo, sucursal_id, estado_id, observaciones FROM compras WHERE id = ?",
      [compraId]
    );
    if (compraRows.length === 0) {
      res.status(404).json({ success: false, message: "Orden o compra no encontrada." });
      return;
    }
    const cmp = compraRows[0];
    if (cmp.estado_id !== 1) {
      res.status(400).json({ success: false, message: "El registro ya se encuentra anulado." });
      return;
    }
    const wasPendingOrder = String(cmp.observaciones || "").startsWith("[PEDIDO_SOLICITADO]");
    await connection.beginTransaction();
    if (!wasPendingOrder) {
      const [items] = await connection.query(
        "SELECT producto_id, cantidad FROM detalle_compras WHERE compra_id = ?",
        [compraId]
      );
      for (const it of items) {
        await connection.query(
          "UPDATE producto_stock_sede SET stock = GREATEST(0, stock - ?), updated_at = NOW() WHERE producto_id = ? AND sucursal_id = ?",
          [Number(it.cantidad), it.producto_id, cmp.sucursal_id]
        );
      }
    }
    await connection.query("UPDATE compras SET estado_id = 2, updated_at = NOW() WHERE id = ?", [compraId]);
    await connection.commit();
    res.json({
      success: true,
      message: wasPendingOrder ? `Orden de Pedido ${cmp.codigo} cancelada antes de recepci\xF3n (sin alterar stock).` : `Recepci\xF3n ${cmp.codigo} anulada exitosamente y stock revertido en almac\xE9n.`
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al anular compra:", error);
    res.status(500).json({ success: false, message: "Error interno al anular el registro." });
  } finally {
    connection.release();
  }
}

// server/routes/purchase.routes.ts
var router12 = Router12();
router12.use("/proveedores", authenticateToken);
router12.use("/compras", authenticateToken);
router12.get("/proveedores", getProveedores);
router12.post("/proveedores", createProveedor);
router12.put("/proveedores/:id", updateProveedor);
router12.patch("/proveedores/:id/estado", toggleProveedorEstado);
router12.get("/compras", getCompras);
router12.post("/compras", createCompra);
router12.post("/compras/:id/recepcionar", recepcionarCompra);
router12.post("/compras/:id/enviar-email", enviarOrdenCompraEmail);
router12.put("/compras/:id/anular", anularCompra);
var purchase_routes_default = router12;

// server/routes/consulta.routes.ts
import { Router as Router13 } from "express";

// server/controllers/consulta.controller.ts
var FALLBACK_RUCS = {
  "20609737524": {
    ruc: "20609737524",
    razonSocial: "MG SOLUTIONS GROUP S.A.C.",
    estado: "ACTIVO",
    condicion: "HABIDO",
    direccion: "AV. PEDRO RUIZ NRO. 349 INT. 09C (MERCADO MODELO)",
    distrito: "CHICLAYO",
    provincia: "CHICLAYO",
    departamento: "LAMBAYEQUE",
    ubigeo: "140101"
  },
  "20100047218": {
    ruc: "20100047218",
    razonSocial: "BANCO DE CREDITO DEL PERU",
    estado: "ACTIVO",
    condicion: "HABIDO",
    direccion: "JR. CENTENARIO NRO. 156 URB. LADERAS DE MELGAREJO",
    distrito: "LA MOLINA",
    provincia: "LIMA",
    departamento: "LIMA",
    ubigeo: "150114"
  },
  "20131312955": {
    ruc: "20131312955",
    razonSocial: "SUPERINTENDENCIA NACIONAL DE ADUANAS Y DE ADMINISTRACION TRIBUTARIA - SUNAT",
    estado: "ACTIVO",
    condicion: "HABIDO",
    direccion: "AV. GARCILASO DE LA VEGA NRO. 1472",
    distrito: "LIMA",
    provincia: "LIMA",
    departamento: "LIMA",
    ubigeo: "150101"
  },
  "20100070970": {
    ruc: "20100070970",
    razonSocial: "SUPERMERCADOS PERUANOS SOCIEDAD ANONIMA O S.P.S.A.",
    estado: "ACTIVO",
    condicion: "HABIDO",
    direccion: "CAL. MORELLI NRO. 181 INT. P-2",
    distrito: "SAN BORJA",
    provincia: "LIMA",
    departamento: "LIMA",
    ubigeo: "150130"
  }
};
var FALLBACK_DNIS = {
  "43716592": {
    dni: "43716592",
    nombres: "MARLON WILLY",
    apellidoPaterno: "BUSCH",
    apellidoMaterno: "RUDAS",
    nombreCompleto: "MARLON WILLY BUSCH RUDAS"
  },
  "71234567": {
    dni: "71234567",
    nombres: "CARLOS ALBERTO",
    apellidoPaterno: "RODRIGUEZ",
    apellidoMaterno: "MENDOZA",
    nombreCompleto: "CARLOS ALBERTO RODRIGUEZ MENDOZA"
  },
  "12345678": {
    dni: "12345678",
    nombres: "JUAN DIEGO",
    apellidoPaterno: "FLORES",
    apellidoMaterno: "QUISPE",
    nombreCompleto: "JUAN DIEGO FLORES QUISPE"
  }
};
async function consultarRuc(req, res) {
  try {
    const ruc = String(req.params.ruc || "").trim();
    if (!/^\d{11}$/.test(ruc)) {
      res.status(400).json({
        success: false,
        message: "El RUC debe contener exactamente 11 d\xEDgitos num\xE9ricos."
      });
      return;
    }
    try {
      const response = await fetch(`https://api.apis.net.pe/v1/ruc?numero=${ruc}`, {
        headers: { Accept: "application/json" }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.nombre) {
          const direccionCompleta = [
            data.direccion,
            data.distrito,
            data.provincia,
            data.departamento
          ].filter(Boolean).join(" - ");
          res.json({
            success: true,
            source: "SUNAT_LIVE",
            data: {
              ruc: data.numeroDocumento || ruc,
              razonSocial: data.nombre.trim(),
              estado: data.estado || "ACTIVO",
              condicion: data.condicion || "HABIDO",
              direccion: data.direccion ? data.direccion.trim() : direccionCompleta,
              distrito: data.distrito || "",
              provincia: data.provincia || "",
              departamento: data.departamento || "",
              ubigeo: data.ubigeo || ""
            }
          });
          return;
        }
      }
    } catch (netErr) {
      console.warn("Fallo en consulta SUNAT en vivo, usando respaldo local:", netErr.message);
    }
    if (FALLBACK_RUCS[ruc]) {
      res.json({
        success: true,
        source: "CACHE_DEMO",
        data: FALLBACK_RUCS[ruc]
      });
      return;
    }
    res.status(404).json({
      success: false,
      message: `No se encontr\xF3 informaci\xF3n en SUNAT para el RUC ${ruc}. Verifique que el n\xFAmero sea correcto.`
    });
  } catch (error) {
    console.error("Error al consultar RUC:", error);
    res.status(500).json({ success: false, message: "Error interno al consultar SUNAT." });
  }
}
async function consultarDni(req, res) {
  try {
    const dni = String(req.params.dni || "").trim();
    if (!/^\d{8}$/.test(dni)) {
      res.status(400).json({
        success: false,
        message: "El DNI debe contener exactamente 8 d\xEDgitos num\xE9ricos."
      });
      return;
    }
    try {
      const response = await fetch(`https://api.apis.net.pe/v1/dni?numero=${dni}`, {
        headers: { Accept: "application/json" }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.nombre) {
          res.json({
            success: true,
            source: "RENIEC_LIVE",
            data: {
              dni: data.numeroDocumento || dni,
              nombres: data.nombres || "",
              apellidoPaterno: data.apellidoPaterno || "",
              apellidoMaterno: data.apellidoMaterno || "",
              nombreCompleto: data.nombre.trim()
            }
          });
          return;
        }
      }
    } catch (netErr) {
      console.warn("Fallo en consulta RENIEC en vivo, usando respaldo local:", netErr.message);
    }
    if (FALLBACK_DNIS[dni]) {
      res.json({
        success: true,
        source: "CACHE_DEMO",
        data: FALLBACK_DNIS[dni]
      });
      return;
    }
    res.status(404).json({
      success: false,
      message: `No se encontr\xF3 informaci\xF3n en RENIEC para el DNI ${dni}. Verifique que el n\xFAmero sea correcto.`
    });
  } catch (error) {
    console.error("Error al consultar DNI:", error);
    res.status(500).json({ success: false, message: "Error interno al consultar RENIEC." });
  }
}

// server/routes/consulta.routes.ts
var router13 = Router13();
router13.get("/consultas/ruc/:ruc", authenticateToken, consultarRuc);
router13.get("/consultas/dni/:dni", authenticateToken, consultarDni);
var consulta_routes_default = router13;

// server/utils/seed-superadmin.ts
import dotenv5 from "dotenv";
init_security();
dotenv5.config();
var ALL_MODULES = [
  "ventas",
  "caja",
  "compras",
  "panel-recepcion",
  "panel-almacen",
  "taller",
  "equipos",
  "clientes",
  "productos",
  "categorias",
  "marcas",
  "usuarios",
  "config-empresa",
  "sucursales",
  "movimientos"
];
async function seedSuperAdmin() {
  const superadminName = process.env.SUPERADMIN_NAME || "Super Administrador";
  const superadminUsername = (process.env.SUPERADMIN_USERNAME || "superadmin").trim().toLowerCase();
  const superadminEmail = (process.env.SUPERADMIN_EMAIL || "superadmin@mgsolutions.pe").trim().toLowerCase();
  const superadminPassword = process.env.SUPERADMIN_PASSWORD || "CambiarEsto2026!";
  try {
    let superadminRoleId;
    const [existingRoles] = await pool.query(
      "SELECT id FROM roles WHERE codigo = ? LIMIT 1",
      ["SUPERADMIN"]
    );
    if (existingRoles.length > 0) {
      superadminRoleId = existingRoles[0].id;
    } else {
      console.log("\u{1F4CC} Creando rol del sistema SUPERADMIN...");
      const [roleResult] = await pool.query(
        `INSERT INTO roles (codigo, nombre, descripcion, modulos_predeterminados, es_sistema, estado_id)
         VALUES (?, ?, ?, ?, 1, 1)`,
        [
          "SUPERADMIN",
          "Super Administrador",
          "Acceso total, irrestricto y de supervisi\xF3n general sobre todos los m\xF3dulos y gesti\xF3n de roles.",
          JSON.stringify(ALL_MODULES)
        ]
      );
      superadminRoleId = roleResult.insertId;
      const [allPermisos] = await pool.query("SELECT id FROM permisos");
      for (const p of allPermisos) {
        await pool.query(
          "INSERT IGNORE INTO rol_permisos (rol_id, permiso_id) VALUES (?, ?)",
          [superadminRoleId, p.id]
        );
      }
      console.log(`\u2705 Rol SUPERADMIN creado con ID: ${superadminRoleId}`);
    }
    const [existingUsers] = await pool.query(
      `SELECT u.id, u.username, u.email, r.codigo AS rol_codigo
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE r.codigo = 'SUPERADMIN' OR u.username = ? OR u.email = ?
       LIMIT 1`,
      [superadminUsername, superadminEmail]
    );
    if (existingUsers.length > 0) {
      const u = existingUsers[0];
      console.log(`\u2139\uFE0F  Usuario Superadmin ya registrado: '${u.username}' (${u.email}) - Rol: ${u.rol_codigo}`);
      return;
    }
    console.log(`\u{1F331} Sembrando cuenta SUPERADMIN inicial: ${superadminUsername} (${superadminEmail})...`);
    const passwordHash = await hashPassword(superadminPassword);
    const [sucursales] = await pool.query(
      "SELECT id FROM sucursales WHERE es_principal = 1 OR estado_id = 1 ORDER BY id ASC LIMIT 1"
    );
    const sucursalId = sucursales.length > 0 ? sucursales[0].id : null;
    await pool.query(
      `INSERT INTO usuarios (
        username, password_hash, nombre_completo, email, rol_id, sucursal_id,
        estado_id, requiere_cambio_password, avatar_url
      ) VALUES (?, ?, ?, ?, ?, ?, 1, 1, ?)`,
      [
        superadminUsername,
        passwordHash,
        superadminName,
        superadminEmail,
        superadminRoleId,
        sucursalId,
        "SA"
      ]
    );
    console.log("\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557");
    console.log("\u2551   \u{1F389} SUPERADMIN CREADO EXITOSAMENTE (SEEDING)            \u2551");
    console.log("\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563");
    console.log(`\u2551   Usuario:   ${superadminUsername.padEnd(44)}\u2551`);
    console.log(`\u2551   Correo:    ${superadminEmail.padEnd(44)}\u2551`);
    console.log("\u2551   Seguridad: Forzar cambio de contrase\xF1a = S\xCD (Modal)    \u2551");
    console.log("\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D");
  } catch (error) {
    console.error("\u274C Error en seedSuperAdmin:", error);
  }
}
if (process.argv[1]?.includes("seed-superadmin")) {
  seedSuperAdmin().then(() => {
    pool.end();
  });
}

// server/index.ts
try {
  dns2.setDefaultResultOrder("ipv4first");
} catch {
}
dotenv6.config();
var app = express();
var PORT = Number(process.env.PORT) || 4e3;
var FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", auth_routes_default);
app.use("/api", user_routes_default);
app.use("/api/clientes", client_routes_default);
app.use("/api", company_routes_default);
app.use("/api", brandModel_routes_default);
app.use("/api", category_routes_default);
app.use("/api", warranty_routes_default);
app.use("/api", warehouse_routes_default);
app.use("/api", transfer_routes_default);
app.use("/api", purchase_routes_default);
app.use("/api", sale_routes_default);
app.use("/api", workshop_routes_default);
app.use("/api", consulta_routes_default);
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "MG Solutions ERP - Backend activo",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    env: process.env.NODE_ENV || "development"
  });
});
var distPath = path.resolve(process.cwd(), "dist");
if (fs.existsSync(distPath)) {
  console.log(`\u{1F4E6} Sirviendo frontend de producci\xF3n desde: ${distPath}`);
  app.use(express.static(distPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  app.get("/", (_req, res) => {
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
    <h1>\u2699\uFE0F MG Solutions - Backend API</h1>
    <p>El servidor API est\xE1 funcionando correctamente en el puerto <strong>4000</strong>.<br>Para acceder al portal web e iniciar sesi\xF3n, ingrese al puerto <strong>3000</strong>:</p>
    <a class="btn" href="http://localhost:3000">Ir al Sistema ERP (localhost:3000)</a>
    <br>
    <div class="badge"><span class="dot"></span> Express & MySQL 8.0 Conectados</div>
  </div>
</body>
</html>`);
  });
}
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Ruta no encontrada." });
});
app.use((err, _req, res, _next) => {
  console.error("Error no controlado:", err);
  res.status(500).json({ success: false, message: "Error interno del servidor." });
});
async function startServer() {
  const dbOk = await testDbConnection();
  if (!dbOk) {
    console.error("\u26A0\uFE0F  No se pudo conectar a MySQL. Verificar que XAMPP MySQL est\xE9 activo.");
    console.error(
      "   Configuraci\xF3n: DB_HOST=%s DB_PORT=%s DB_NAME=%s",
      process.env.DB_HOST || "localhost",
      process.env.DB_PORT || "3306",
      process.env.DB_NAME || "mg_solutions_db"
    );
  } else {
    await seedSuperAdmin();
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log("");
    console.log("\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557");
    console.log("\u2551   MG SOLUTIONS ERP - Backend Server             \u2551");
    console.log("\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563");
    console.log(`\u2551   \u{1F680} Servidor:  http://localhost:${PORT}            \u2551`);
    console.log(`\u2551   \u{1F310} CORS:      ${FRONTEND_URL}       \u2551`);
    console.log(`\u2551   \u{1F5C4}\uFE0F  MySQL:     ${dbOk ? "\u2705 Conectado" : "\u274C Sin conexi\xF3n"}               \u2551`);
    console.log(`\u2551   \u{1F512} Entorno:   ${process.env.NODE_ENV || "development"}                \u2551`);
    console.log("\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D");
    console.log("");
    console.log("Rutas disponibles:");
    console.log("  POST   /api/auth/login");
    console.log("  GET    /api/auth/me");
    console.log("  POST   /api/auth/logout");
    console.log("  GET    /api/usuarios");
    console.log("  GET    /api/usuarios/:id");
    console.log("  POST   /api/usuarios");
    console.log("  PUT    /api/usuarios/:id");
    console.log("  PUT    /api/usuarios/:id/modulos");
    console.log("  PATCH  /api/usuarios/:id/estado");
    console.log("  PATCH  /api/usuarios/:id/reset-password");
    console.log("  PATCH  /api/usuarios/:id/desbloquear");
    console.log("  GET    /api/empresa");
    console.log("  GET    /api/sucursales");
    console.log("  GET    /api/roles");
    console.log("  GET    /api/clientes");
    console.log("  POST   /api/clientes");
    console.log("  PUT    /api/clientes/:id");
    console.log("  PATCH  /api/clientes/:id/estado");
    console.log("  GET    /api/clientes/buscar/:documento");
    console.log("  GET    /api/health");
    console.log("");
  });
}
startServer();
