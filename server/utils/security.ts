import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Clave de encriptación simétrica AES-256 (32 bytes)
const ENCRYPTION_KEY = Buffer.from(
  process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  'hex'
);
const IV_LENGTH = 16; // Para AES-CBC

/**
 * Genera un hash seguro para contraseñas usando bcrypt (cost factor 10)
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

/**
 * Compara una contraseña en texto plano contra su hash bcrypt
 */
export async function comparePassword(plainPassword: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hash);
}

/**
 * Encripta datos sensibles (como DNI, teléfonos privados, o notas confidenciales)
 * usando AES-256-CBC con vector de inicialización aleatorio (IV)
 */
export function encryptSensitiveData(text: string): string {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  // Formato: iv:datos_encriptados
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Desencripta datos sensibles protegidos con AES-256-CBC
 */
export function decryptSensitiveData(encryptedPayload: string): string {
  if (!encryptedPayload || !encryptedPayload.includes(':')) return encryptedPayload;
  try {
    const [ivHex, encryptedText] = encryptedPayload.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Error desencriptando dato sensible:', err);
    return encryptedPayload;
  }
}

/**
 * Enmascara números de documentos para visualización segura en logs o interfaces
 * Ejemplo: "45829103" -> "****9103"
 */
export function maskDocument(doc: string): string {
  if (!doc || doc.length < 4) return '****';
  const visible = doc.slice(-4);
  return `${'*'.repeat(doc.length - 4)}${visible}`;
}

/**
 * Enmascara números de teléfono
 * Ejemplo: "+51 974 812 390" -> "+51 974 *** 390"
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return '***';
  return phone.replace(/(\d{3})\s*(\d{3})\s*(\d{3})/, '$1 *** $3');
}
