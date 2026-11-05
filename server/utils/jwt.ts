import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'mg_solutions_default_dev_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';

export interface TokenPayload {
  userId: number;
  username: string;
  nombreCompleto: string;
  rol: string;
  sucursalId: number | null;
}

/**
 * Genera un token JWT firmado de sesión
 */
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
}

/**
 * Verifica y decodifica un token JWT
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}
