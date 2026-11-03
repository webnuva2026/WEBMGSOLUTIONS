const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mg_solutions_db'
  });

  const dbName = process.env.DB_NAME || 'mg_solutions_db';

  const [tables] = await connection.query(
    `SELECT TABLE_NAME, TABLE_COMMENT 
     FROM information_schema.TABLES 
     WHERE TABLE_SCHEMA = ? 
     ORDER BY TABLE_NAME`,
    [dbName]
  );

  const [columns] = await connection.query(
    `SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT, EXTRA, COLUMN_COMMENT
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ?
     ORDER BY TABLE_NAME, ORDINAL_POSITION`,
    [dbName]
  );

  const [fks] = await connection.query(
    `SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL
     ORDER BY TABLE_NAME, COLUMN_NAME`,
    [dbName]
  );

  const result = {
    database: dbName,
    tables: tables.map(t => ({
      name: t.TABLE_NAME,
      comment: t.TABLE_COMMENT || '',
      columns: columns.filter(c => c.TABLE_NAME === t.TABLE_NAME).map(c => ({
        name: c.COLUMN_NAME,
        dataType: c.DATA_TYPE,
        columnType: c.COLUMN_TYPE,
        nullable: c.IS_NULLABLE === 'YES',
        key: c.COLUMN_KEY,
        default: c.COLUMN_DEFAULT,
        extra: c.EXTRA,
        comment: c.COLUMN_COMMENT
      })),
      foreignKeys: fks.filter(f => f.TABLE_NAME === t.TABLE_NAME).map(f => ({
        column: f.COLUMN_NAME,
        referencedTable: f.REFERENCED_TABLE_NAME,
        referencedColumn: f.REFERENCED_COLUMN_NAME,
        constraint: f.CONSTRAINT_NAME
      }))
    }))
  };

  fs.writeFileSync('scripts/data-dictionary.json', JSON.stringify(result, null, 2), 'utf-8');
  console.log(`Extracted ${result.tables.length} tables successfully.`);
  await connection.end();
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
