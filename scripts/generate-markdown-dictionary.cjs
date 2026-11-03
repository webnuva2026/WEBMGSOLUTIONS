const fs = require('fs');

const data = JSON.parse(fs.readFileSync('scripts/data-dictionary.json', 'utf-8'));

// Categorización por módulos funcionales para que la documentación sea clara y ordenada
const modules = {
  '1. Módulo de Seguridad, Autenticación y Control de Acceso': [
    'usuarios', 'roles', 'permisos', 'rol_permisos', 'usuario_permisos', 'sesiones_tokens', 'codigos_recuperacion'
  ],
  '2. Módulo de Organización y Sedes': [
    'empresas', 'sucursales'
  ],
  '3. Módulo de Personas, Clientes y Personal': [
    'personas', 'clientes', 'vendedores', 'tecnicos'
  ],
  '4. Módulo de Catálogo Maestro y Productos': [
    'categorias', 'marcas', 'modelos', 'detalle_modelo', 'productos', 'producto_detalle', 'tipos_producto_detalle'
  ],
  '5. Módulo de Inventario, Unidades Físicas y Trazabilidad': [
    'producto_stock_sede', 'producto_unidades', 'estados_unidad', 'estados_movimiento'
  ],
  '6. Módulo de Ventas y Comprobantes de Pago': [
    'ventas', 'detalle_ventas', 'tipos_comprobante', 'metodos_pago'
  ],
  '7. Módulo de Compras y Abastecimiento': [
    'compras', 'detalle_compras', 'proveedores'
  ],
  '8. Módulo de Garantías y Posventa': [
    'producto_series_garantia'
  ],
  '9. Módulo de Taller y Soporte Técnico': [
    'ordenes_servicio', 'equipos', 'tipos_equipo', 'estados_orden_servicio', 'prioridades_orden'
  ],
  '10. Módulo de Estados y Tipos Generales': [
    'estados', 'tipos_documento'
  ]
};

// Descripciones de propósito para cada tabla
const tableDescriptions = {
  'usuarios': 'Almacena las cuentas de usuario del sistema, credenciales encriptadas con bcrypt, bloqueo por fuerza bruta y rol principal asignado.',
  'roles': 'Define los 11 roles operativos y administrativos del sistema (SUPERADMIN, ADMIN, VENDEDOR, TECNICO, ALMACEN, etc.).',
  'permisos': 'Catálogo maestro de permisos granulares por módulo y acción (crear, editar, eliminar, ver, etc.).',
  'rol_permisos': 'Matriz dinámica que asocia roles con permisos predeterminados.',
  'usuario_permisos': 'Sobrescritura o personalización de permisos a nivel individual por usuario.',
  'sesiones_tokens': 'Gestión de tokens JWT y sesiones activas para control de concurrencia y revocación.',
  'codigos_recuperacion': 'Tokens temporales y de un solo uso para recuperación segura de contraseñas por correo.',
  'empresas': 'Configuración corporativa principal (Razón Social, RUC, Dirección, Régimen, Logos, Redes).',
  'sucursales': 'Sedes o tiendas físicas donde opera la empresa (Chiclayo Matriz, Sucursales secundarias).',
  'personas': 'Entidad unificada de personas naturales (datos básicos: DNI/RUC, nombres, apellidos, teléfono, correo).',
  'clientes': 'Entidad comercial cliente (asociada a persona o personería jurídica con RUC/DNI, crédito y estado).',
  'vendedores': 'Perfil y comisión asignada a personal comercial.',
  'tecnicos': 'Especialistas técnicos del taller de servicio y laboratorio de diagnóstico.',
  'categorias': 'Categorización jerárquica de productos (Laptops, Impresoras, Componentes, Redes, Accesorios).',
  'marcas': 'Marcas de fabricantes registradas (Lenovo, HP, Epson, ASUS, Logitech, etc.).',
  'modelos': 'Modelos específicos asociados a cada marca (ej: ThinkPad X1 Carbon, EcoTank L3250).',
  'detalle_modelo': 'Especificaciones técnicas preconfiguradas para modelos de hardware.',
  'productos': 'Maestro de artículos comerciables con precios de venta, costos base, código de barras y SKU.',
  'producto_detalle': 'Especificaciones y atributos dinámicos vinculados a productos específicos.',
  'tipos_producto_detalle': 'Catálogo de tipos de atributos técnicos (Memoria RAM, Procesador, Almacenamiento, etc.).',
  'producto_stock_sede': 'Control de stock físico por producto distribuido en cada sucursal/sede.',
  'producto_unidades': 'Trazabilidad individual de números de serie (S/N) físicos para productos seriados.',
  'estados_unidad': 'Estados físicos de las unidades en inventario (DISPONIBLE, RESERVADO, VENDIDO, DEFECTUOSO, REPARACION).',
  'estados_movimiento': 'Estados para el ciclo de vida de transferencias y movimientos de almacén.',
  'ventas': 'Cabecera de ventas, facturación electrónica (Boletas/Facturas), medios de pago y totales.',
  'detalle_ventas': 'Líneas de producto comercializadas por cada transacción de venta.',
  'tipos_comprobante': 'Tipos de comprobantes de pago según normativa SUNAT (01 Factura, 03 Boleta, 00 Nota de Venta).',
  'metodos_pago': 'Medios de recaudación (Efectivo, Yape, Plin, Tarjeta Débito/Crédito, Transferencia BCP/BBVA).',
  'compras': 'Registro de órdenes de compra y recepción de mercadería de proveedores mayoristas.',
  'detalle_compras': 'Ítems, costos unitarios y cantidades adquiridas en cada compra.',
  'proveedores': 'Directorio comercial de distribuidores y proveedores mayoristas (Deltron, Ingram, etc.).',
  'producto_series_garantia': 'Control posventa de garantías asociadas a números de serie vendidos y plazo de cobertura.',
  'ordenes_servicio': 'Órdenes de servicio técnico, tickets de reparación de hardware, diagnósticos y cotizaciones.',
  'equipos': 'Equipos de clientes ingresados a taller (marca, modelo, número de serie, accesorios dejados).',
  'tipos_equipo': 'Clasificación de equipos ingresados a reparación (Laptop, PC Escritorio, Impresora, Monitor).',
  'estados_orden_servicio': 'Flujo de estados de la orden técnica (RECEPCIONADO, EN DIAGNOSTICO, ESPERA REPUESTO, REPARADO, ENTREGADO).',
  'prioridades_orden': 'Nivel de urgencia de la orden de trabajo (BAJA, MEDIA, ALTA, URGENTE).',
  'estados': 'Catálogo maestro genérico de estados (ACTIVO, INACTIVO, ANULADO, PENDIENTE).',
  'tipos_documento': 'Catálogo de tipos de documento de identidad oficial (DNI, RUC, CE, PASAPORTE).'
};

// Column comments/descriptions mapping for standard fields
function getColumnDescription(table, col) {
  if (col.comment && col.comment.trim()) return col.comment;
  const name = col.name.toLowerCase();
  if (col.key === 'PRI') return `Identificador único (Clave Primaria - PK) de ${table}.`;
  if (name.endsWith('_id') || name.startsWith('id_')) return `Clave foránea (FK) de referencia relacional.`;
  if (name === 'created_at' || name === 'fecha_creacion' || name === 'fecha_registro') return 'Fecha y hora de registro del registro.';
  if (name === 'updated_at' || name === 'fecha_actualizacion') return 'Fecha y hora de la última modificación.';
  if (name === 'estado' || name === 'estado_id') return 'Estado lógico o de ciclo de vida del registro.';
  if (name === 'codigo' || name === 'codigo_comprobante' || name === 'sku') return 'Código identificador único o correlativo.';
  if (name === 'nombre' || name === 'razon_social') return 'Nombre oficial o denominación del elemento.';
  if (name === 'descripcion' || name === 'observaciones') return 'Detalle informativo, notas u observaciones adicionales.';
  if (name === 'precio' || name === 'precio_venta' || name === 'precio_costo' || name === 'total' || name === 'subtotal') return 'Monto económico expresado en moneda nacional (PEN).';
  if (name === 'telefono' || name === 'celular') return 'Número telefónico de contacto.';
  if (name === 'email' || name === 'correo') return 'Correo electrónico para comunicaciones o autenticación.';
  if (name === 'direccion' || name === 'direccion_fiscal') return 'Dirección geográfica o domicilio fiscal.';
  return 'Atributo de datos de la entidad.';
}

let md = `# DICCIONARIO DE DATOS - SISTEMA ERP MG SOLUTIONS
**Base de Datos:** \`${data.database}\`  
**Motor RDBMS:** MySQL 8.0 / MariaDB  
**Juego de Caracteres:** \`utf8mb4\` | **Collation:** \`utf8mb4_unicode_ci\`  
**Total de Tablas:** ${data.tables.length}  
**Fecha de Generación:** ${new Date().toISOString().split('T')[0]}  

---

## 📑 Índice de Contenidos por Módulos
`;

for (const [moduleName, tableList] of Object.entries(modules)) {
  md += `\n### ${moduleName}\n`;
  for (const tName of tableList) {
    const tableObj = data.tables.find(t => t.name === tName);
    if (tableObj) {
      md += `- [\`${tName}\`](#tabla-${tName.replace(/_/g, '-')}) - ${tableDescriptions[tName] || ''}\n`;
    }
  }
}

md += `\n---\n\n## 🛠️ Especificación Técnica Detallada de Tablas\n`;

for (const [moduleName, tableList] of Object.entries(modules)) {
  md += `\n# ${moduleName}\n`;

  for (const tName of tableList) {
    const tableObj = data.tables.find(t => t.name === tName);
    if (!tableObj) continue;

    md += `\n<a id="tabla-${tName.replace(/_/g, '-')}"></a>\n`;
    md += `### 📄 Tabla: \`${tableObj.name}\`\n\n`;
    md += `**Descripción:** ${tableDescriptions[tableObj.name] || tableObj.comment || 'Tabla de almacenamiento de datos del sistema.'}\n\n`;

    md += `| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |\n`;
    md += `| :--- | :--- | :---: | :---: | :---: | :--- | :--- |\n`;

    for (const c of tableObj.columns) {
      const isNull = c.nullable ? 'SÍ' : 'NO';
      let key = '-';
      if (c.key === 'PRI') key = '**PK**';
      else if (c.key === 'UNI') key = '**UQ**';
      else if (c.key === 'MUL') {
        const isFk = tableObj.foreignKeys.some(f => f.column === c.name);
        key = isFk ? '**FK**' : 'IDX';
      }

      const def = c.default === null ? 'NULL' : `\`${c.default}\``;
      const extra = c.extra ? `\`${c.extra}\`` : '-';
      const desc = getColumnDescription(tableObj.name, c);

      md += `| \`${c.name}\` | \`${c.columnType}\` | ${isNull} | ${key} | ${def} | ${extra} | ${desc} |\n`;
    }

    if (tableObj.foreignKeys.length > 0) {
      md += `\n**🔗 Relaciones Foráneas (Foreign Keys):**\n\n`;
      md += `| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |\n`;
      md += `| :--- | :--- | :--- | :--- |\n`;
      for (const fk of tableObj.foreignKeys) {
        md += `| \`${fk.column}\` | \`${fk.referencedTable}\` | \`${fk.referencedColumn}\` | \`${fk.constraint}\` |\n`;
      }
    }

    md += `\n---\n`;
  }
}

fs.writeFileSync('DICCIONARIO_DE_DATOS_MG_SOLUTIONS.md', md, 'utf-8');
console.log('DICCIONARIO_DE_DATOS_MG_SOLUTIONS.md created successfully.');
