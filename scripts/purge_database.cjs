const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: 'MG2026',
    database: 'mg_solutions_db'
  });

  console.log('Connected to MySQL. Starting complete database purge...');

  await conn.query('SET FOREIGN_KEY_CHECKS = 0');

  // List of tables to truncate/clear completely
  const tablesToClear = [
    'orden_bitacora',
    'orden_servicios_mano_obra',
    'orden_repuestos',
    'ordenes_servicio',
    'equipos',
    'detalle_ventas',
    'ventas',
    'detalle_compras',
    'compras',
    'movimientos_inventario',
    'producto_series_garantia',
    'producto_unidades',
    'producto_stock_sede',
    'producto_detalle',
    'productos',
    'detalle_modelo',
    'modelos',
    'marcas',
    'categorias',
    'proveedores',
    'clientes',
    'vendedores',
    'tecnicos',
    'sucursales',
    'sesiones_tokens',
    'presencia_usuarios',
    'codigos_recuperacion'
  ];

  for (const table of tablesToClear) {
    try {
      await conn.query(`TRUNCATE TABLE \`${table}\``);
      console.log(`✓ Tabla limpiada: ${table}`);
    } catch (err) {
      console.warn(`! Fallo truncate en ${table}, probando DELETE:`, err.message);
      try {
        await conn.query(`DELETE FROM \`${table}\``);
        console.log(`✓ Tabla vaciada con DELETE: ${table}`);
      } catch (delErr) {
        console.warn(`! No se pudo vaciar ${table}:`, delErr.message);
      }
    }
  }

  // En usuarios: mantener UNICAMENTE al superadmin
  const [superadminUsers] = await conn.query(`
    SELECT u.id, u.username, u.persona_id 
    FROM usuarios u
    JOIN roles r ON u.rol_id = r.id
    WHERE r.codigo = 'SUPERADMIN' OR u.username = 'superadmin'
    LIMIT 1
  `);

  if (superadminUsers.length > 0) {
    const saId = superadminUsers[0].id;
    const saPersonaId = superadminUsers[0].persona_id;
    console.log(`Superadmin encontrado: ID ${saId} (${superadminUsers[0].username})`);

    // Eliminar todos los demás usuarios
    await conn.query('DELETE FROM usuarios WHERE id != ?', [saId]);
    // Desvincular sucursal del superadmin ya que las sucursales fueron vaciadas
    await conn.query('UPDATE usuarios SET sucursal_id = NULL WHERE id = ?', [saId]);

    // Eliminar permisos de otros usuarios
    await conn.query('DELETE FROM usuario_permisos WHERE usuario_id != ?', [saId]);

    // Eliminar personas que no sean del superadmin
    if (saPersonaId) {
      await conn.query('DELETE FROM personas WHERE id_persona != ?', [saPersonaId]);
    } else {
      await conn.query('DELETE FROM personas');
    }
    console.log('✓ Solo el usuario Superadministrador se mantiene en el sistema.');
  } else {
    console.warn('! No se encontró usuario superadmin existente.');
  }

  await conn.query('SET FOREIGN_KEY_CHECKS = 1');

  // Verificar recuento final
  console.log('\n--- VERIFICACIÓN DE RECUENTOS TRAS PURGA ---');
  const checkTables = [
    'usuarios', 'productos', 'modelos', 'marcas', 'categorias',
    'clientes', 'sucursales', 'ventas', 'compras', 'ordenes_servicio', 'proveedores'
  ];

  for (const t of checkTables) {
    const [rows] = await conn.query(`SELECT COUNT(*) as cnt FROM \`${t}\``);
    console.log(`- ${t}: ${rows[0].cnt} registro(s)`);
  }

  const [remainingUsers] = await conn.query(`
    SELECT u.id, u.username, u.email, r.codigo as rol
    FROM usuarios u
    LEFT JOIN roles r ON u.rol_id = r.id
  `);
  console.log('\nUsuarios restantes:', remainingUsers);

  await conn.end();
  console.log('\nPurga completada exitosamente.');
}

main().catch(console.error);

