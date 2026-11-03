const fs = require('fs');

const data = JSON.parse(fs.readFileSync('scripts/data-dictionary.json', 'utf-8'));

const modules = {
  '1. MODULO DE SEGURIDAD, AUTENTICACION Y CONTROL DE ACCESO': [
    'usuarios', 'roles', 'permisos', 'rol_permisos', 'usuario_permisos', 'sesiones_tokens', 'codigos_recuperacion'
  ],
  '2. MODULO DE ORGANIZACION Y SEDES': [
    'empresas', 'sucursales'
  ],
  '3. MODULO DE PERSONAS, CLIENTES Y PERSONAL': [
    'personas', 'clientes', 'vendedores', 'tecnicos'
  ],
  '4. MODULO DE CATALOGO MAESTRO Y PRODUCTOS': [
    'categorias', 'marcas', 'modelos', 'detalle_modelo', 'productos', 'producto_detalle', 'tipos_producto_detalle'
  ],
  '5. MODULO DE INVENTARIO, UNIDADES FISICAS Y TRAZABILIDAD': [
    'producto_stock_sede', 'producto_unidades', 'estados_unidad', 'estados_movimiento'
  ],
  '6. MODULO DE VENTAS Y COMPROBANTES DE PAGO': [
    'ventas', 'detalle_ventas', 'tipos_comprobante', 'metodos_pago'
  ],
  '7. MODULO DE COMPRAS Y ABASTECIMIENTO': [
    'compras', 'detalle_compras', 'proveedores'
  ],
  '8. MODULO DE GARANTIAS Y POSVENTA': [
    'producto_series_garantia'
  ],
  '9. MODULO DE TALLER Y SOPORTE TECNICO': [
    'ordenes_servicio', 'equipos', 'tipos_equipo', 'estados_orden_servicio', 'prioridades_orden'
  ],
  '10. MODULO DE ESTADOS Y TIPOS GENERALES': [
    'estados', 'tipos_documento'
  ]
};

const tableDescriptions = {
  'usuarios': 'Almacena las cuentas de usuario del sistema, credenciales encriptadas con bcrypt, bloqueo por fuerza bruta y rol principal asignado.',
  'roles': 'Define los 11 roles operativos y administrativos del sistema (SUPERADMIN, ADMIN, VENDEDOR, TECNICO, ALMACEN, etc.).',
  'permisos': 'Catalogo maestro de permisos granulares por modulo y accion (crear, editar, eliminar, ver, etc.).',
  'rol_permisos': 'Matriz dinamica que asocia roles con permisos predeterminados.',
  'usuario_permisos': 'Sobrescritura o personalizacion de permisos a nivel individual por usuario.',
  'sesiones_tokens': 'Gestion de tokens JWT y sesiones activas para control de concurrencia y revocacion.',
  'codigos_recuperacion': 'Tokens temporales y de un solo uso para recuperacion segura de contrasenas por correo.',
  'empresas': 'Configuracion corporativa principal (Razon Social, RUC, Direccion, Regimen, Logos, Redes).',
  'sucursales': 'Sedes o tiendas fisicas donde opera la empresa (Chiclayo Matriz, Sucursales secundarias).',
  'personas': 'Entidad unificada de personas naturales (datos basicos: DNI/RUC, nombres, apellidos, telefono, correo).',
  'clientes': 'Entidad comercial cliente (asociada a persona o personeria juridica con RUC/DNI, credito y estado).',
  'vendedores': 'Perfil y comision asignada a personal comercial.',
  'tecnicos': 'Especialistas tecnicos del taller de servicio y laboratorio de diagnostico.',
  'categorias': 'Categorizacion jerarquica de productos (Laptops, Impresoras, Componentes, Redes, Accesorios).',
  'marcas': 'Marcas de fabricantes registradas (Lenovo, HP, Epson, ASUS, Logitech, etc.).',
  'modelos': 'Modelos especificos asociados a cada marca (ej: ThinkPad X1 Carbon, EcoTank L3250).',
  'detalle_modelo': 'Especificaciones tecnicas preconfiguradas para modelos de hardware.',
  'productos': 'Maestro de articulos comerciables con precios de venta, costos base, codigo de barras y SKU.',
  'producto_detalle': 'Especificaciones y atributos dinamicos vinculados a productos especificos.',
  'tipos_producto_detalle': 'Catalogo de tipos de atributos tecnicos (Memoria RAM, Procesador, Almacenamiento, etc.).',
  'producto_stock_sede': 'Control de stock fisico por producto distribuido en cada sucursal/sede.',
  'producto_unidades': 'Trazabilidad individual de numeros de serie (S/N) fisicos para productos seriados.',
  'estados_unidad': 'Estados fisicos de las unidades en inventario (DISPONIBLE, RESERVADO, VENDIDO, DEFECTUOSO, REPARACION).',
  'estados_movimiento': 'Estados para el ciclo de vida de transferencias y movimientos de almacen.',
  'ventas': 'Cabecera de ventas, facturacion electronica (Boletas/Facturas), medios de pago y totales.',
  'detalle_ventas': 'Lineas de producto comercializadas por cada transaccion de venta.',
  'tipos_comprobante': 'Tipos de comprobantes de pago segun normativa SUNAT (01 Factura, 03 Boleta, 00 Nota de Venta).',
  'metodos_pago': 'Medios de recaudacion (Efectivo, Yape, Plin, Tarjeta Debito/Credito, Transferencia BCP/BBVA).',
  'compras': 'Registro de ordenes de compra y recepcion de mercaderia de proveedores mayoristas.',
  'detalle_compras': 'Items, costos unitarios y cantidades adquiridas en cada compra.',
  'proveedores': 'Directorio comercial de distribuidores y proveedores mayoristas (Deltron, Ingram, etc.).',
  'producto_series_garantia': 'Control posventa de garantias asociadas a numeros de serie vendidos y plazo de cobertura.',
  'ordenes_servicio': 'Ordenes de servicio tecnico, tickets de reparacion de hardware, diagnosticos y cotizaciones.',
  'equipos': 'Equipos de clientes ingresados a taller (marca, modelo, numero de serie, accesorios dejados).',
  'tipos_equipo': 'Clasificacion de equipos ingresados a reparacion (Laptop, PC Escritorio, Impresora, Monitor).',
  'estados_orden_servicio': 'Flujo de estados de la orden tecnica (RECEPCIONADO, EN DIAGNOSTICO, ESPERA REPUESTO, REPARADO, ENTREGADO).',
  'prioridades_orden': 'Nivel de urgencia de la orden de trabajo (BAJA, MEDIA, ALTA, URGENTE).',
  'estados': 'Catalogo maestro generico de estados (ACTIVO, INACTIVO, ANULADO, PENDIENTE).',
  'tipos_documento': 'Catalogo de tipos de documento de identidad oficial (DNI, RUC, CE, PASAPORTE).'
};

function getColumnDescription(table, col) {
  if (col.comment && col.comment.trim()) {
    return col.comment
      .replace(/[\r\n]+/g, ' ')
      .replace(/contrase├▒a/g, 'contraseña')
      .replace(/est├í/g, 'está')
      .replace(/cre├│/g, 'creó')
      .replace(/Tel├®fono/g, 'Teléfono')
      .replace(/m├│dulos/g, 'módulos');
  }
  const name = col.name.toLowerCase();
  if (col.key === 'PRI') return `Identificador unico (Clave Primaria - PK) de ${table}.`;
  if (name.endsWith('_id') || name.startsWith('id_')) return `Clave foranea (FK) de referencia relacional.`;
  if (name === 'created_at' || name === 'fecha_creacion' || name === 'fecha_registro') return 'Fecha y hora de registro.';
  if (name === 'updated_at' || name === 'fecha_actualizacion') return 'Fecha y hora de la ultima modificacion.';
  if (name === 'estado' || name === 'estado_id') return 'Estado logico o de ciclo de vida del registro.';
  if (name === 'codigo' || name === 'codigo_comprobante' || name === 'sku') return 'Codigo identificador unico o correlativo.';
  if (name === 'nombre' || name === 'razon_social') return 'Nombre oficial o denominacion.';
  if (name === 'descripcion' || name === 'observaciones') return 'Detalle informativo, notas u observaciones.';
  if (name === 'precio' || name === 'precio_venta' || name === 'precio_costo' || name === 'total' || name === 'subtotal') return 'Monto economico en moneda nacional (PEN).';
  if (name === 'telefono' || name === 'celular') return 'Numero telefonico de contacto.';
  if (name === 'email' || name === 'correo') return 'Correo electronico para comunicaciones o autenticacion.';
  if (name === 'direccion' || name === 'direccion_fiscal') return 'Direccion geografica o domicilio fiscal.';
  return 'Atributo de datos de la entidad.';
}

function pad(str, len) {
  const s = String(str || '');
  if (s.length >= len) return s.slice(0, len);
  return s + ' '.repeat(len - s.length);
}

let txt = '';
txt += '====================================================================================================\r\n';
txt += '                         DICCIONARIO DE DATOS - SISTEMA ERP MG SOLUTIONS                           \r\n';
txt += '====================================================================================================\r\n';
txt += `Base de Datos: ${data.database}\r\n`;
txt += 'Motor RDBMS:   MySQL 8.0 / MariaDB\r\n';
txt += 'Codificacion:  utf8mb4 (utf8mb4_unicode_ci)\r\n';
txt += `Total Tablas:  ${data.tables.length}\r\n`;
txt += `Fecha:         ${new Date().toISOString().split('T')[0]}\r\n`;
txt += '====================================================================================================\r\n\r\n';

txt += 'INDICE DE TABLAS POR MODULO:\r\n';
txt += '----------------------------------------------------------------------------------------------------\r\n';
for (const [mod, list] of Object.entries(modules)) {
  txt += `\r\n[ ${mod} ]\r\n`;
  for (const t of list) {
    txt += `  * ${pad(t, 28)} : ${tableDescriptions[t] || ''}\r\n`;
  }
}
txt += '\r\n====================================================================================================\r\n\r\n';

for (const [mod, list] of Object.entries(modules)) {
  txt += '####################################################################################################\r\n';
  txt += `### ${mod}\r\n`;
  txt += '####################################################################################################\r\n\r\n';

  for (const tName of list) {
    const table = data.tables.find(t => t.name === tName);
    if (!table) continue;

    txt += '====================================================================================================\r\n';
    txt += `TABLA: ${table.name.toUpperCase()}\r\n`;
    txt += `DESCRIPCION: ${tableDescriptions[table.name] || table.comment || 'Tabla de almacenamiento de datos.'}\r\n`;
    txt += '====================================================================================================\r\n';
    txt += `${pad('CAMPO', 27)} | ${pad('TIPO DE DATO', 18)} | ${pad('NULO', 5)} | ${pad('CLAVE', 5)} | ${pad('DEFECTO', 12)} | DESCRIPCION\r\n`;
    txt += '----------------------------------------------------------------------------------------------------\r\n';

    for (const c of table.columns) {
      const isNull = c.nullable ? 'SI' : 'NO';
      let key = '-';
      if (c.key === 'PRI') key = 'PK';
      else if (c.key === 'UNI') key = 'UQ';
      else if (c.key === 'MUL') {
        const isFk = table.foreignKeys.some(f => f.column === c.name);
        key = isFk ? 'FK' : 'IDX';
      }
      const def = c.default === null ? 'NULL' : String(c.default);
      const desc = getColumnDescription(table.name, c);

      txt += `${pad(c.name, 27)} | ${pad(c.columnType, 18)} | ${pad(isNull, 5)} | ${pad(key, 5)} | ${pad(def, 12)} | ${desc}\r\n`;
    }

    if (table.foreignKeys.length > 0) {
      txt += '----------------------------------------------------------------------------------------------------\r\n';
      txt += 'RELACIONES FORANEAS (FOREIGN KEYS):\r\n';
      for (const fk of table.foreignKeys) {
        txt += `  - Campo: [${fk.column}] -> Referencia: ${fk.referencedTable}(${fk.referencedColumn})  [${fk.constraint}]\r\n`;
      }
    }

    txt += '\r\n\r\n';
  }
}

fs.writeFileSync('DICCIONARIO_DE_DATOS_MG_SOLUTIONS.txt', txt, 'utf-8');
console.log('DICCIONARIO_DE_DATOS_MG_SOLUTIONS.txt created successfully.');
