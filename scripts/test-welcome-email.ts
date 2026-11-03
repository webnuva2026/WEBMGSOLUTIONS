import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { verifySMTPConnection, sendWelcomeCredentialsEmail } from '../server/utils/mailer';

async function test() {
  console.log('Verificando conexión SMTP de Gmail...');
  const verify = await verifySMTPConnection();
  console.log('Resultado verificación:', verify);

  if (!verify.ok) {
    console.error('No se pudo conectar al SMTP:', verify.message);
    return;
  }

  console.log('Enviando correo formal de prueba de credenciales a mgsolutionsg@gmail.com...');
  const result = await sendWelcomeCredentialsEmail({
    toEmail: process.env.SMTP_USER || 'mgsolutionsg@gmail.com',
    nombreCompleto: 'Juan Pérez (Prueba Técnica)',
    username: 'JPEREZ2026',
    passwordTemporal: 'TempPass2026!',
    rolNombre: 'Técnico de Laboratorio',
    loginUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  });

  console.log('Resultado envío:', result);
}

test().catch(console.error);
