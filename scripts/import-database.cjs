const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno del .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'mg_solutions_db';

async function importDatabase() {
  console.log('=====================================================================');
  console.log('  MG SOLUTIONS ERP - INICIALIZADOR AUTOMÁTICO DE BASE DE DATOS');
  console.log('=====================================================================');
  console.log(`Conectando al servidor MySQL en ${DB_HOST}:${DB_PORT} con usuario '${DB_USER}'...`);

  let conn;
  try {
    conn = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      multipleStatements: true,
    });
  } catch (err) {
    console.error(`\n❌ Error al conectar a MySQL en ${DB_HOST}:${DB_PORT}:`, err.message);
    console.error(`\n💡 SUGERENCIAS:`);
    console.error(`1. Verifica que tu servicio MySQL (XAMPP, WampServer o MySQL Server) esté ENCENDIDO.`);
    console.error(`2. Revisa el puerto y contraseña en el archivo .env (DB_PORT, DB_PASSWORD).`);
    process.exit(1);
  }

  console.log('✅ Conexión con servidor MySQL establecida.');

  const sqlFilePath = path.resolve(__dirname, '../database_mg_solutions.sql');
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`❌ No se encontró el archivo SQL en: ${sqlFilePath}`);
    process.exit(1);
  }

  console.log(`Leyendo archivo de respaldo: database_mg_solutions.sql...`);
  const sql = fs.readFileSync(sqlFilePath, 'utf8');

  console.log(`Ejecutando sentencias SQL para crear '${DB_NAME}', 39 tablas y datos iniciales...`);
  try {
    await conn.query(sql);
    console.log(`\n🎉 ¡BASE DE DATOS INICIALIZADA CON ÉXITO!`);
    console.log(`   - Base de datos: ${DB_NAME}`);
    console.log(`   - 39 Tablas creadas con llaves foráneas y catálogos.`);
    console.log(`   - Usuario inicial: superadmin (Clave: CambiarEsto2026!)`);
    console.log(`   - Series de garantía de prueba listas.`);
    console.log(`\nYa puedes iniciar el sistema con: npm run dev:all`);
  } catch (err) {
    console.error(`\n❌ Error al ejecutar el script SQL:`, err.message);
  } finally {
    await conn.end();
  }
}

importDatabase();
