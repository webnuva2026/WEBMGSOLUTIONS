const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: 'MG2026',
    database: 'mg_solutions_db',
  });

  const [existing] = await conn.query('SELECT COUNT(*) as count FROM proveedores');
  if (existing[0].count === 0) {
    const proveedores = [
      {
        id: 1,
        ruc: '20100154308',
        razon_social: 'GRUPO DELTRON S.A.',
        nombre_contacto: 'Jorge Villanueva (Ejecutivo Mayorista)',
        telefono: '+51 (01) 415-0100',
        email: 'ventas.chiclayo@deltron.com.pe',
        direccion: 'Av. Nicolás Arriola 314, La Victoria, Lima (Despacho Chiclayo)',
        estado_id: 1,
      },
      {
        id: 2,
        ruc: '20502123491',
        razon_social: 'INTCOMEX DEL PERU S.A.C.',
        nombre_contacto: 'Patricia Alarcón',
        telefono: '+51 (01) 712-4000',
        email: 'contacto.peru@intcomex.com',
        direccion: 'Av. Manuel Olguín 325 Of. 1102, Surco, Lima',
        estado_id: 1,
      },
      {
        id: 3,
        ruc: '20451298401',
        razon_social: 'TECH DATA PERU S.A.C.',
        nombre_contacto: 'Miguel Sandoval',
        telefono: '+51 987 654 321',
        email: 'ventas@techdata.com.pe',
        direccion: 'Calle Los Negocios 182, Surquillo, Lima',
        estado_id: 1,
      },
      {
        id: 4,
        ruc: '20601239845',
        razon_social: 'IMPORTACIONES Y REPUESTOS NORTE E.I.R.L.',
        nombre_contacto: 'Carlos Burga',
        telefono: '+51 974 555 123',
        email: 'repuestos.norte@gmail.com',
        direccion: 'Calle Alfonso Ugarte 450, Chiclayo',
        estado_id: 1,
      },
    ];

    for (const p of proveedores) {
      await conn.query(
        `INSERT INTO proveedores (id, ruc, razon_social, nombre_contacto, telefono, email, direccion, estado_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [p.id, p.ruc, p.razon_social, p.nombre_contacto, p.telefono, p.email, p.direccion, p.estado_id]
      );
    }
    console.log('Proveedores insertados en MySQL correctamente!');
  } else {
    console.log('Proveedores ya existen en la base de datos:', existing[0].count);
  }

  await conn.end();
}

main().catch(console.error);
