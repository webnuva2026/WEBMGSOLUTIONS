import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Cargar variables de entorno del archivo .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { verifySMTPConnection, sendRecoveryCodeEmail } from '../server/utils/mailer';

async function main() {
  console.log('========================================================');
  console.log('🔍 PROBANDO CONFIGURACIÓN SMTP DE GMAIL...');
  console.log(`👤 SMTP_USER: ${process.env.SMTP_USER || '(no configurado)'}`);
  console.log(`🔑 SMTP_PASS: ${process.env.SMTP_PASS ? '******** (' + process.env.SMTP_PASS.replace(/\s+/g, '').length + ' caracteres)' : '(no configurado)'}`);
  console.log(`🌐 SMTP_HOST: ${process.env.SMTP_HOST || 'smtp.gmail.com'}`);
  console.log(`🔌 SMTP_PORT: ${process.env.SMTP_PORT || '465'}`);
  console.log('========================================================\n');

  if (!process.env.SMTP_PASS) {
    console.log('⚠️ Falta colocar SMTP_PASS en el archivo .env.');
    console.log('Genera la Contraseña de Aplicación en: https://myaccount.google.com/apppasswords');
    process.exit(1);
  }

  console.log('⏳ Verificando credenciales con Google...');
  const verifyResult = await verifySMTPConnection();

  if (!verifyResult.ok) {
    console.error('❌ Error de conexión:', verifyResult.message);
    process.exit(1);
  }

  console.log('✅', verifyResult.message);
  console.log('\n📧 Enviando correo de prueba a mgsolutionsg@gmail.com...');
  const sendResult = await sendRecoveryCodeEmail(
    process.env.SMTP_USER || 'mgsolutionsg@gmail.com',
    'Administrador MG Solutions',
    '982415'
  );

  if (sendResult.success && !sendResult.simulated) {
    console.log('🎉 ¡CORREO ENVIADO CON ÉXITO! Revisa la bandeja de entrada de mgsolutionsg@gmail.com');
  } else {
    console.error('❌ Error al enviar:', sendResult.error || 'Simulado o no enviado');
  }
}

main().catch(console.error);
