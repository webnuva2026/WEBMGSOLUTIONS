const mysql = require('mysql2/promise');
require('dotenv').config();

const CLIENTES = [
  ['77777777', 'Carlos Alberto', 'Pérez Quispe',      '987654321', 'perez54.12@gmail.com',     'Av. Balta 458, Chiclayo'],
  ['45218796', 'María Elena',    'García Rojas',      '976321450', 'garcia.maria87@hotmail.com','Calle San José 231, Chiclayo'],
  ['70384512', 'José Luis',      'Fernández Díaz',    '945123678', 'fernandez.jl92@outlook.com','Av. Luis Gonzales 1020, Chiclayo'],
  ['41927365', 'Rosa Isabel',    'Vásquez Mendoza',   '962887145', 'vasquez.rosa75@gmail.com',  'Urb. Santa Victoria Mz C Lt 12, Chiclayo'],
  ['73561489', 'Miguel Ángel',   'Torres Huamán',     '951402736', 'torres.miguel23@hotmail.com','Calle Elías Aguirre 612, Chiclayo'],
  ['46082731', 'Lucía Fernanda', 'Castillo Sánchez',  '934775219', 'castillo.lucia31@outlook.com','Av. Sáenz Peña 845, José Leonardo Ortiz'],
  ['72849165', 'Jorge Eduardo',  'Ramírez Chávez',    '988341205', 'ramirez.jorge89@gmail.com', 'Pasaje Los Pinos 145, La Victoria'],
  ['43716592', 'Ana Patricia',   'Flores Delgado',    '921568347', 'flores.ana66@hotmail.com',  'Av. Grau 390, Pimentel'],
];

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST, port: +process.env.DB_PORT,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  });
  for (const [dni, nombres, apellidos, tel, correo, dir] of CLIENTES) {
    const [dup] = await c.query('SELECT id_persona FROM personas WHERE dni=?', [dni]);
    if (dup.length) { console.log('Ya existe DNI', dni); continue; }
    await c.beginTransaction();
    try {
      const [p] = await c.query(
        'INSERT INTO personas (tipo_documento_id, dni, nombres, apellidos, telefono, correo, direccion, estado_id) VALUES (1,?,?,?,?,?,?,1)',
        [dni, nombres, apellidos, tel, correo, dir]);
      await c.query(
        'INSERT INTO clientes (id_persona, ruc, nombre_empresa, razon_social, estado_id) VALUES (?,NULL,NULL,?,1)',
        [p.insertId, `${nombres} ${apellidos}`.toUpperCase()]);
      await c.commit();
      console.log('OK', dni, nombres, apellidos, correo);
    } catch (e) { await c.rollback(); console.error('ERROR', dni, e.message); }
  }
  const [r] = await c.query(
    `SELECT c.id_cliente id, p.dni, c.razon_social, p.telefono, p.correo FROM clientes c JOIN personas p ON p.id_persona=c.id_persona ORDER BY c.id_cliente`);
  console.table(r);
  await c.end();
})();
