import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mg_solutions_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  ssl:
    process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production'
      ? { minVersion: 'TLSv1.2', rejectUnauthorized: false }
      : undefined,
});

// Helper de prueba de conexión
export async function testDbConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión exitosa al pool de MySQL (mg_solutions_db)');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error);
    return false;
  }
}
