# DICCIONARIO DE DATOS - SISTEMA ERP MG SOLUTIONS
**Base de Datos:** `mg_solutions_db`  
**Motor RDBMS:** MySQL 8.0 / MariaDB  
**Juego de Caracteres:** `utf8mb4` | **Collation:** `utf8mb4_unicode_ci`  
**Total de Tablas:** 39  
**Fecha de Generación:** 2026-10-06  

---

## 📑 Índice de Contenidos por Módulos

### 1. Módulo de Seguridad, Autenticación y Control de Acceso
- [`usuarios`](#tabla-usuarios) - Almacena las cuentas de usuario del sistema, credenciales encriptadas con bcrypt, bloqueo por fuerza bruta y rol principal asignado.
- [`roles`](#tabla-roles) - Define los 11 roles operativos y administrativos del sistema (SUPERADMIN, ADMIN, VENDEDOR, TECNICO, ALMACEN, etc.).
- [`permisos`](#tabla-permisos) - Catálogo maestro de permisos granulares por módulo y acción (crear, editar, eliminar, ver, etc.).
- [`rol_permisos`](#tabla-rol-permisos) - Matriz dinámica que asocia roles con permisos predeterminados.
- [`usuario_permisos`](#tabla-usuario-permisos) - Sobrescritura o personalización de permisos a nivel individual por usuario.
- [`sesiones_tokens`](#tabla-sesiones-tokens) - Gestión de tokens JWT y sesiones activas para control de concurrencia y revocación.
- [`codigos_recuperacion`](#tabla-codigos-recuperacion) - Tokens temporales y de un solo uso para recuperación segura de contraseñas por correo.

### 2. Módulo de Organización y Sedes
- [`empresas`](#tabla-empresas) - Configuración corporativa principal (Razón Social, RUC, Dirección, Régimen, Logos, Redes).
- [`sucursales`](#tabla-sucursales) - Sedes o tiendas físicas donde opera la empresa (Chiclayo Matriz, Sucursales secundarias).

### 3. Módulo de Personas, Clientes y Personal
- [`personas`](#tabla-personas) - Entidad unificada de personas naturales (datos básicos: DNI/RUC, nombres, apellidos, teléfono, correo).
- [`clientes`](#tabla-clientes) - Entidad comercial cliente (asociada a persona o personería jurídica con RUC/DNI, crédito y estado).
- [`vendedores`](#tabla-vendedores) - Perfil y comisión asignada a personal comercial.
- [`tecnicos`](#tabla-tecnicos) - Especialistas técnicos del taller de servicio y laboratorio de diagnóstico.

### 4. Módulo de Catálogo Maestro y Productos
- [`categorias`](#tabla-categorias) - Categorización jerárquica de productos (Laptops, Impresoras, Componentes, Redes, Accesorios).
- [`marcas`](#tabla-marcas) - Marcas de fabricantes registradas (Lenovo, HP, Epson, ASUS, Logitech, etc.).
- [`modelos`](#tabla-modelos) - Modelos específicos asociados a cada marca (ej: ThinkPad X1 Carbon, EcoTank L3250).
- [`detalle_modelo`](#tabla-detalle-modelo) - Especificaciones técnicas preconfiguradas para modelos de hardware.
- [`productos`](#tabla-productos) - Maestro de artículos comerciables con precios de venta, costos base, código de barras y SKU.
- [`producto_detalle`](#tabla-producto-detalle) - Especificaciones y atributos dinámicos vinculados a productos específicos.
- [`tipos_producto_detalle`](#tabla-tipos-producto-detalle) - Catálogo de tipos de atributos técnicos (Memoria RAM, Procesador, Almacenamiento, etc.).

### 5. Módulo de Inventario, Unidades Físicas y Trazabilidad
- [`producto_stock_sede`](#tabla-producto-stock-sede) - Control de stock físico por producto distribuido en cada sucursal/sede.
- [`producto_unidades`](#tabla-producto-unidades) - Trazabilidad individual de números de serie (S/N) físicos para productos seriados.
- [`estados_unidad`](#tabla-estados-unidad) - Estados físicos de las unidades en inventario (DISPONIBLE, RESERVADO, VENDIDO, DEFECTUOSO, REPARACION).
- [`estados_movimiento`](#tabla-estados-movimiento) - Estados para el ciclo de vida de transferencias y movimientos de almacén.

### 6. Módulo de Ventas y Comprobantes de Pago
- [`ventas`](#tabla-ventas) - Cabecera de ventas, facturación electrónica (Boletas/Facturas), medios de pago y totales.
- [`detalle_ventas`](#tabla-detalle-ventas) - Líneas de producto comercializadas por cada transacción de venta.
- [`tipos_comprobante`](#tabla-tipos-comprobante) - Tipos de comprobantes de pago según normativa SUNAT (01 Factura, 03 Boleta, 00 Nota de Venta).
- [`metodos_pago`](#tabla-metodos-pago) - Medios de recaudación (Efectivo, Yape, Plin, Tarjeta Débito/Crédito, Transferencia BCP/BBVA).

### 7. Módulo de Compras y Abastecimiento
- [`compras`](#tabla-compras) - Registro de órdenes de compra y recepción de mercadería de proveedores mayoristas.
- [`detalle_compras`](#tabla-detalle-compras) - Ítems, costos unitarios y cantidades adquiridas en cada compra.
- [`proveedores`](#tabla-proveedores) - Directorio comercial de distribuidores y proveedores mayoristas (Deltron, Ingram, etc.).

### 8. Módulo de Garantías y Posventa
- [`producto_series_garantia`](#tabla-producto-series-garantia) - Control posventa de garantías asociadas a números de serie vendidos y plazo de cobertura.

### 9. Módulo de Taller y Soporte Técnico
- [`ordenes_servicio`](#tabla-ordenes-servicio) - Órdenes de servicio técnico, tickets de reparación de hardware, diagnósticos y cotizaciones.
- [`equipos`](#tabla-equipos) - Equipos de clientes ingresados a taller (marca, modelo, número de serie, accesorios dejados).
- [`tipos_equipo`](#tabla-tipos-equipo) - Clasificación de equipos ingresados a reparación (Laptop, PC Escritorio, Impresora, Monitor).
- [`estados_orden_servicio`](#tabla-estados-orden-servicio) - Flujo de estados de la orden técnica (RECEPCIONADO, EN DIAGNOSTICO, ESPERA REPUESTO, REPARADO, ENTREGADO).
- [`prioridades_orden`](#tabla-prioridades-orden) - Nivel de urgencia de la orden de trabajo (BAJA, MEDIA, ALTA, URGENTE).

### 10. Módulo de Estados y Tipos Generales
- [`estados`](#tabla-estados) - Catálogo maestro genérico de estados (ACTIVO, INACTIVO, ANULADO, PENDIENTE).
- [`tipos_documento`](#tabla-tipos-documento) - Catálogo de tipos de documento de identidad oficial (DNI, RUC, CE, PASAPORTE).

---

## 🛠️ Especificación Técnica Detallada de Tablas

# 1. Módulo de Seguridad, Autenticación y Control de Acceso

<a id="tabla-usuarios"></a>
### 📄 Tabla: `usuarios`

**Descripción:** Almacena las cuentas de usuario del sistema, credenciales encriptadas con bcrypt, bloqueo por fuerza bruta y rol principal asignado.

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de usuarios. |
| `username` | `varchar(50)` | NO | **UQ** | NULL | - | Nombre de usuario para login |
| `password_hash` | `varchar(255)` | NO | - | NULL | - | Hash bcrypt de la contraseña |
| `nombre_completo` | `varchar(150)` | NO | - | NULL | - | Atributo de datos de la entidad. |
| `email` | `varchar(150)` | NO | **UQ** | NULL | - | Correo electrónico para comunicaciones o autenticación. |
| `telefono_cifrado` | `varchar(500)` | SÍ | - | NULL | - | Teléfono encriptado con AES-256-CBC |
| `tipo_documento_id` | `int` | NO | **FK** | `1` | - | Clave foránea (FK) de referencia relacional. |
| `numero_documento_cifrado` | `varchar(500)` | SÍ | - | NULL | - | Nro de documento encriptado con AES-256-CBC |
| `persona_id` | `int` | SÍ | **UQ** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `rol_id` | `int` | NO | **FK** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `sucursal_id` | `int` | SÍ | **FK** | NULL | - | Sede base asignada al usuario |
| `estado_id` | `int` | NO | **FK** | `1` | - | FK a estados (1=ACTIVO, 2=INACTIVO, 3=SUSPENDIDO) |
| `avatar_url` | `varchar(255)` | SÍ | - | NULL | - | Atributo de datos de la entidad. |
| `requiere_cambio_password` | `tinyint(1)` | SÍ | - | `1` | - | Forzar cambio de contraseña en primer login |
| `intentos_fallidos` | `tinyint unsigned` | SÍ | - | `0` | - | Contador de intentos fallidos de login (max 5) |
| `bloqueado_hasta` | `datetime` | SÍ | - | NULL | - | Fecha/hora hasta cuando está bloqueado por intentos fallidos |
| `ultimo_acceso` | `datetime` | SÍ | - | NULL | - | Atributo de datos de la entidad. |
| `created_at` | `datetime` | SÍ | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Fecha y hora de registro del registro. |
| `updated_at` | `datetime` | SÍ | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED on update CURRENT_TIMESTAMP` | Fecha y hora de la última modificación. |
| `created_by` | `int` | SÍ | - | NULL | - | ID del admin que creó esta cuenta |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `estado_id` | `estados` | `id` | `fk_usuarios_estado` |
| `persona_id` | `personas` | `id_persona` | `fk_usuarios_persona` |
| `rol_id` | `roles` | `id` | `fk_usuarios_rol` |
| `sucursal_id` | `sucursales` | `id` | `fk_usuarios_sucursal` |
| `tipo_documento_id` | `tipos_documento` | `id` | `fk_usuarios_tipo_doc` |

---

<a id="tabla-roles"></a>
### 📄 Tabla: `roles`

**Descripción:** Define los 11 roles operativos y administrativos del sistema (SUPERADMIN, ADMIN, VENDEDOR, TECNICO, ALMACEN, etc.).

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de roles. |
| `codigo` | `varchar(30)` | NO | **UQ** | NULL | - | ADMIN, SECRETARIA, TECNICO, FACTURADOR, ALMACEN, CAJERO |
| `nombre` | `varchar(60)` | NO | - | NULL | - | Nombre legible del rol |
| `descripcion` | `varchar(255)` | SÍ | - | NULL | - | Detalle informativo, notas u observaciones adicionales. |
| `modulos_predeterminados` | `json` | SÍ | - | NULL | - | Array JSON de módulos base heredados: ["ventas","caja"] |
| `es_sistema` | `tinyint(1)` | SÍ | - | `0` | - | TRUE = no se puede eliminar ni renombrar |
| `estado_id` | `int` | NO | **FK** | `1` | - | FK a estados (1=ACTIVO, 2=INACTIVO) |
| `created_at` | `datetime` | SÍ | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Fecha y hora de registro del registro. |
| `updated_at` | `datetime` | SÍ | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED on update CURRENT_TIMESTAMP` | Fecha y hora de la última modificación. |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `estado_id` | `estados` | `id` | `fk_roles_estado` |

---

<a id="tabla-permisos"></a>
### 📄 Tabla: `permisos`

**Descripción:** Catálogo maestro de permisos granulares por módulo y acción (crear, editar, eliminar, ver, etc.).

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de permisos. |
| `codigo` | `varchar(50)` | NO | **UQ** | NULL | - | Código del módulo (ej: ventas, taller, compras) |
| `nombre` | `varchar(100)` | NO | - | NULL | - | Nombre del panel o funcionalidad |
| `descripcion` | `varchar(255)` | SÍ | - | NULL | - | Detalle informativo, notas u observaciones adicionales. |
| `categoria` | `varchar(50)` | SÍ | - | NULL | - | Operaciones, Almacén, Taller, Administración |
| `icono` | `varchar(50)` | SÍ | - | NULL | - | Icono lucide-react |
| `estado_id` | `int` | NO | **FK** | `1` | - | FK a estados (1=ACTIVO, 2=INACTIVO) |
| `created_at` | `datetime` | SÍ | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Fecha y hora de registro del registro. |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `estado_id` | `estados` | `id` | `fk_permisos_estado` |

---

<a id="tabla-rol-permisos"></a>
### 📄 Tabla: `rol_permisos`

**Descripción:** Matriz dinámica que asocia roles con permisos predeterminados.

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `rol_id` | `int` | NO | **PK** | NULL | - | FK a roles |
| `permiso_id` | `int` | NO | **PK** | NULL | - | FK a permisos |
| `created_at` | `datetime` | SÍ | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Fecha y hora de registro del registro. |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `permiso_id` | `permisos` | `id` | `fk_rol_permisos_permiso` |
| `rol_id` | `roles` | `id` | `fk_rol_permisos_rol` |

---

<a id="tabla-usuario-permisos"></a>
### 📄 Tabla: `usuario_permisos`

**Descripción:** Sobrescritura o personalización de permisos a nivel individual por usuario.

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `usuario_id` | `int` | NO | **PK** | NULL | - | FK a usuarios |
| `permiso_id` | `int` | NO | **PK** | NULL | - | FK a permisos |
| `permitido` | `tinyint(1)` | NO | - | `1` | - | 1 = Concedido, 0 = Denegado |
| `created_at` | `datetime` | SÍ | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Fecha y hora de registro del registro. |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `permiso_id` | `permisos` | `id` | `fk_usuario_permisos_permiso` |
| `usuario_id` | `usuarios` | `id` | `fk_usuario_permisos_usuario` |

---

<a id="tabla-sesiones-tokens"></a>
### 📄 Tabla: `sesiones_tokens`

**Descripción:** Gestión de tokens JWT y sesiones activas para control de concurrencia y revocación.

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de sesiones_tokens. |
| `usuario_id` | `int` | NO | **FK** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `token_hash` | `varchar(255)` | NO | IDX | NULL | - | ├Ültimos 32 chars del JWT como identificador |
| `ip_origen` | `varchar(45)` | SÍ | - | NULL | - | IP del cliente (IPv4/IPv6) |
| `user_agent` | `varchar(255)` | SÍ | - | NULL | - | Atributo de datos de la entidad. |
| `expira_en` | `datetime` | NO | IDX | NULL | - | Atributo de datos de la entidad. |
| `revocado` | `tinyint(1)` | SÍ | - | `0` | - | TRUE = sesión cerrada o revocada |
| `revocado_en` | `datetime` | SÍ | - | NULL | - | Timestamp de revocación |
| `created_at` | `datetime` | SÍ | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Fecha y hora de registro del registro. |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `usuario_id` | `usuarios` | `id` | `fk_sesiones_usuario` |

---

<a id="tabla-codigos-recuperacion"></a>
### 📄 Tabla: `codigos_recuperacion`

**Descripción:** Tokens temporales y de un solo uso para recuperación segura de contraseñas por correo.

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de codigos_recuperacion. |
| `usuario_id` | `int` | NO | **FK** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `codigo` | `varchar(10)` | NO | - | NULL | - | Código OTP de 6 dígitos |
| `expira_en` | `datetime` | NO | IDX | NULL | - | Tiempo límite de validez (15 min) |
| `utilizado` | `tinyint(1)` | SÍ | - | `0` | - | TRUE = código ya canjeado |
| `created_at` | `datetime` | SÍ | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Fecha y hora de registro del registro. |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `usuario_id` | `usuarios` | `id` | `fk_recuperacion_usuario` |

---

# 2. Módulo de Organización y Sedes

<a id="tabla-empresas"></a>
### 📄 Tabla: `empresas`

**Descripción:** Configuración corporativa principal (Razón Social, RUC, Dirección, Régimen, Logos, Redes).

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de empresas. |
| `ruc` | `char(11)` | NO | **UQ** | NULL | - | RUC de 11 dígitos SUNAT |
| `razon_social` | `varchar(200)` | NO | - | NULL | - | Razón social registrada en SUNAT |
| `nombre_comercial` | `varchar(200)` | SÍ | - | NULL | - | Nombre comercial visible |
| `direccion_fiscal` | `varchar(255)` | NO | - | NULL | - | Dirección geográfica o domicilio fiscal. |
| `email` | `varchar(150)` | SÍ | - | NULL | - | Correo electrónico para comunicaciones o autenticación. |
| `telefono` | `varchar(30)` | SÍ | - | NULL | - | Número telefónico de contacto. |
| `departamento` | `varchar(100)` | SÍ | - | `Lambayeque` | - | Atributo de datos de la entidad. |
| `provincia` | `varchar(100)` | SÍ | - | `Chiclayo` | - | Atributo de datos de la entidad. |
| `distrito` | `varchar(100)` | SÍ | - | `Chiclayo` | - | Atributo de datos de la entidad. |
| `ubigeo` | `char(6)` | SÍ | - | `140101` | - | Código UBIGEO INEI |
| `logo_url` | `varchar(500)` | SÍ | - | NULL | - | URL del logo de la empresa |
| `created_at` | `datetime` | SÍ | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Fecha y hora de registro del registro. |
| `updated_at` | `datetime` | SÍ | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED on update CURRENT_TIMESTAMP` | Fecha y hora de la última modificación. |

---

<a id="tabla-sucursales"></a>
### 📄 Tabla: `sucursales`

**Descripción:** Sedes o tiendas físicas donde opera la empresa (Chiclayo Matriz, Sucursales secundarias).

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de sucursales. |
| `empresa_id` | `int` | NO | **FK** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `codigo` | `varchar(10)` | NO | IDX | NULL | - | Código correlativo: 0000, 0001, etc. |
| `nombre` | `varchar(120)` | NO | - | NULL | - | Nombre oficial o denominación del elemento. |
| `direccion` | `varchar(255)` | NO | - | NULL | - | Dirección geográfica o domicilio fiscal. |
| `telefono` | `varchar(30)` | SÍ | - | NULL | - | Número telefónico de contacto. |
| `es_principal` | `tinyint(1)` | SÍ | - | `0` | - | TRUE = sede principal de la empresa |
| `estado_id` | `int` | NO | **FK** | `1` | - | FK a estados (1=ACTIVO, 2=INACTIVO) |
| `created_at` | `datetime` | SÍ | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Fecha y hora de registro del registro. |
| `updated_at` | `datetime` | SÍ | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED on update CURRENT_TIMESTAMP` | Fecha y hora de la última modificación. |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `empresa_id` | `empresas` | `id` | `fk_sucursales_empresa` |
| `estado_id` | `estados` | `id` | `fk_sucursales_estado` |

---

# 3. Módulo de Personas, Clientes y Personal

<a id="tabla-personas"></a>
### 📄 Tabla: `personas`

**Descripción:** Entidad unificada de personas naturales (datos básicos: DNI/RUC, nombres, apellidos, teléfono, correo).

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id_persona` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de personas. |
| `tipo_documento_id` | `int` | SÍ | **FK** | `1` | - | Clave foránea (FK) de referencia relacional. |
| `dni` | `varchar(20)` | SÍ | **UQ** | NULL | - | Atributo de datos de la entidad. |
| `nombres` | `varchar(100)` | NO | - | NULL | - | Atributo de datos de la entidad. |
| `apellidos` | `varchar(100)` | SÍ | IDX | NULL | - | Atributo de datos de la entidad. |
| `telefono` | `varchar(10)` | SÍ | - | NULL | - | Número telefónico de contacto. |
| `correo` | `varchar(100)` | SÍ | - | NULL | - | Correo electrónico para comunicaciones o autenticación. |
| `direccion` | `varchar(200)` | SÍ | - | NULL | - | Dirección geográfica o domicilio fiscal. |
| `estado_id` | `int` | NO | **FK** | `1` | - | FK a tabla estados (1=ACTIVO, 2=INACTIVO) |
| `created_at` | `datetime` | SÍ | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Fecha y hora de registro del registro. |
| `updated_at` | `datetime` | SÍ | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED on update CURRENT_TIMESTAMP` | Fecha y hora de la última modificación. |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `estado_id` | `estados` | `id` | `fk_personas_estado` |
| `tipo_documento_id` | `tipos_documento` | `id` | `fk_personas_tipo_doc` |

---

<a id="tabla-clientes"></a>
### 📄 Tabla: `clientes`

**Descripción:** Entidad comercial cliente (asociada a persona o personería jurídica con RUC/DNI, crédito y estado).

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id_cliente` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de clientes. |
| `id_persona` | `int` | NO | **FK** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `ruc` | `varchar(11)` | SÍ | **UQ** | NULL | - | Atributo de datos de la entidad. |
| `razon_social` | `varchar(200)` | SÍ | - | NULL | - | Nombre oficial o denominación del elemento. |
| `nombre_empresa` | `varchar(200)` | SÍ | - | NULL | - | Atributo de datos de la entidad. |
| `estado_id` | `int` | NO | **FK** | `1` | - | Clave foránea (FK) de referencia relacional. |
| `created_at` | `datetime` | NO | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Fecha y hora de registro del registro. |
| `updated_at` | `datetime` | NO | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED on update CURRENT_TIMESTAMP` | Fecha y hora de la última modificación. |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `estado_id` | `estados` | `id` | `fk_clientes_estado` |
| `id_persona` | `personas` | `id_persona` | `fk_clientes_persona` |

---

<a id="tabla-vendedores"></a>
### 📄 Tabla: `vendedores`

**Descripción:** Perfil y comisión asignada a personal comercial.

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de vendedores. |
| `usuario_id` | `int` | NO | **UQ** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `comision_pct` | `decimal(5,2)` | NO | - | `0.00` | - | Atributo de datos de la entidad. |
| `estado_id` | `int` | NO | **FK** | `1` | - | Clave foránea (FK) de referencia relacional. |
| `created_at` | `datetime` | NO | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Fecha y hora de registro del registro. |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `estado_id` | `estados` | `id` | `fk_vendedores_estado` |
| `usuario_id` | `usuarios` | `id` | `fk_vendedores_usuario` |

---

<a id="tabla-tecnicos"></a>
### 📄 Tabla: `tecnicos`

**Descripción:** Especialistas técnicos del taller de servicio y laboratorio de diagnóstico.

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de tecnicos. |
| `usuario_id` | `int` | NO | **UQ** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `especialidad` | `varchar(200)` | SÍ | - | NULL | - | Atributo de datos de la entidad. |
| `estado_id` | `int` | NO | **FK** | `1` | - | Clave foránea (FK) de referencia relacional. |
| `created_at` | `datetime` | NO | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Fecha y hora de registro del registro. |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `estado_id` | `estados` | `id` | `fk_tecnicos_estado` |
| `usuario_id` | `usuarios` | `id` | `fk_tecnicos_usuario` |

---

# 4. Módulo de Catálogo Maestro y Productos

<a id="tabla-categorias"></a>
### 📄 Tabla: `categorias`

**Descripción:** Categorización jerárquica de productos (Laptops, Impresoras, Componentes, Redes, Accesorios).

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de categorias. |
| `nombre` | `varchar(100)` | NO | **UQ** | NULL | - | Nombre oficial o denominación del elemento. |
| `descripcion` | `text` | SÍ | - | NULL | - | Detalle informativo, notas u observaciones adicionales. |
| `requiere_serie` | `tinyint(1)` | NO | - | `0` | - | Atributo de datos de la entidad. |
| `estado_id` | `int` | NO | **FK** | `1` | - | Clave foránea (FK) de referencia relacional. |
| `created_at` | `datetime` | NO | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Fecha y hora de registro del registro. |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `estado_id` | `estados` | `id` | `fk_categorias_estado` |

---

<a id="tabla-marcas"></a>
### 📄 Tabla: `marcas`

**Descripción:** Marcas de fabricantes registradas (Lenovo, HP, Epson, ASUS, Logitech, etc.).

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de marcas. |
| `nombre` | `varchar(100)` | NO | **UQ** | NULL | - | Nombre oficial o denominación del elemento. |
| `descripcion` | `text` | SÍ | - | NULL | - | Detalle informativo, notas u observaciones adicionales. |
| `categoria_id` | `int` | SÍ | **FK** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `estado_id` | `int` | NO | **FK** | `1` | - | Clave foránea (FK) de referencia relacional. |
| `created_at` | `datetime` | NO | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Fecha y hora de registro del registro. |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `categoria_id` | `categorias` | `id` | `fk_marcas_categoria` |
| `estado_id` | `estados` | `id` | `fk_marcas_estado` |

---

<a id="tabla-modelos"></a>
### 📄 Tabla: `modelos`

**Descripción:** Modelos específicos asociados a cada marca (ej: ThinkPad X1 Carbon, EcoTank L3250).

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de modelos. |
| `marca_id` | `int` | SÍ | **FK** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `nombre` | `varchar(150)` | NO | - | NULL | - | Nombre oficial o denominación del elemento. |
| `descripcion` | `text` | SÍ | - | NULL | - | Detalle informativo, notas u observaciones adicionales. |
| `estado_id` | `int` | NO | **FK** | `1` | - | Clave foránea (FK) de referencia relacional. |
| `created_at` | `datetime` | NO | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Fecha y hora de registro del registro. |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `estado_id` | `estados` | `id` | `fk_modelos_estado` |
| `marca_id` | `marcas` | `id` | `fk_modelos_marca` |

---

<a id="tabla-detalle-modelo"></a>
### 📄 Tabla: `detalle_modelo`

**Descripción:** Especificaciones técnicas preconfiguradas para modelos de hardware.

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de detalle_modelo. |
| `modelo_id` | `int` | NO | **FK** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `atributo` | `varchar(100)` | NO | - | NULL | - | Atributo de datos de la entidad. |
| `valor` | `varchar(500)` | SÍ | - | NULL | - | Atributo de datos de la entidad. |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `modelo_id` | `modelos` | `id` | `fk_dm_modelo` |

---

<a id="tabla-productos"></a>
### 📄 Tabla: `productos`

**Descripción:** Maestro de artículos comerciables con precios de venta, costos base, código de barras y SKU.

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de productos. |
| `codigo` | `varchar(50)` | SÍ | - | NULL | - | Código identificador único o correlativo. |
| `nombre` | `varchar(200)` | NO | - | NULL | - | Nombre oficial o denominación del elemento. |
| `descripcion` | `text` | SÍ | - | NULL | - | Detalle informativo, notas u observaciones adicionales. |
| `categoria_id` | `int` | SÍ | **FK** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `marca_id` | `int` | SÍ | **FK** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `modelo_id` | `int` | SÍ | **FK** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `requiere_serie` | `tinyint(1)` | NO | - | `0` | - | Atributo de datos de la entidad. |
| `disponible_venta` | `tinyint(1)` | NO | - | `1` | - | Atributo de datos de la entidad. |
| `tipo_destino` | `enum('VENTA','SERVICIO_TALLER','MIXTO')` | NO | - | `VENTA` | - | Atributo de datos de la entidad. |
| `precio_venta` | `decimal(10,2)` | NO | - | `0.00` | - | Monto económico expresado en moneda nacional (PEN). |
| `precio_costo` | `decimal(10,2)` | NO | - | `0.00` | - | Monto económico expresado en moneda nacional (PEN). |
| `stock_minimo` | `int` | NO | - | `0` | - | Atributo de datos de la entidad. |
| `estado_id` | `int` | NO | **FK** | `1` | - | Clave foránea (FK) de referencia relacional. |
| `created_at` | `datetime` | NO | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Fecha y hora de registro del registro. |
| `updated_at` | `datetime` | NO | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED on update CURRENT_TIMESTAMP` | Fecha y hora de la última modificación. |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `categoria_id` | `categorias` | `id` | `fk_productos_categoria` |
| `estado_id` | `estados` | `id` | `fk_productos_estado` |
| `marca_id` | `marcas` | `id` | `fk_productos_marca` |
| `modelo_id` | `modelos` | `id` | `fk_productos_modelo` |

---

<a id="tabla-producto-detalle"></a>
### 📄 Tabla: `producto_detalle`

**Descripción:** Especificaciones y atributos dinámicos vinculados a productos específicos.

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de producto_detalle. |
| `producto_id` | `int` | NO | **FK** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `tipo_detalle_id` | `int` | SÍ | - | NULL | - | Clave foránea (FK) de referencia relacional. |
| `valor` | `varchar(500)` | SÍ | - | NULL | - | Atributo de datos de la entidad. |
| `created_at` | `datetime` | NO | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Fecha y hora de registro del registro. |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `producto_id` | `productos` | `id` | `fk_pd_producto` |

---

<a id="tabla-tipos-producto-detalle"></a>
### 📄 Tabla: `tipos_producto_detalle`

**Descripción:** Catálogo de tipos de atributos técnicos (Memoria RAM, Procesador, Almacenamiento, etc.).

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de tipos_producto_detalle. |
| `codigo` | `varchar(30)` | NO | **UQ** | NULL | - | Código identificador único o correlativo. |
| `nombre` | `varchar(60)` | NO | - | NULL | - | Nombre oficial o denominación del elemento. |
| `estado_id` | `int` | NO | **FK** | `1` | - | Clave foránea (FK) de referencia relacional. |
| `created_at` | `datetime` | SÍ | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Fecha y hora de registro del registro. |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `estado_id` | `estados` | `id` | `fk_tipos_prod_det_estado` |

---

# 5. Módulo de Inventario, Unidades Físicas y Trazabilidad

<a id="tabla-producto-stock-sede"></a>
### 📄 Tabla: `producto_stock_sede`

**Descripción:** Control de stock físico por producto distribuido en cada sucursal/sede.

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de producto_stock_sede. |
| `producto_id` | `int` | NO | **FK** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `sucursal_id` | `int` | NO | **FK** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `stock` | `int` | NO | - | `0` | - | Atributo de datos de la entidad. |
| `updated_at` | `datetime` | NO | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED on update CURRENT_TIMESTAMP` | Fecha y hora de la última modificación. |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `producto_id` | `productos` | `id` | `fk_pss_producto` |
| `sucursal_id` | `sucursales` | `id` | `fk_pss_sucursal` |

---

<a id="tabla-producto-unidades"></a>
### 📄 Tabla: `producto_unidades`

**Descripción:** Trazabilidad individual de números de serie (S/N) físicos para productos seriados.

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de producto_unidades. |
| `producto_id` | `int` | NO | **FK** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `sucursal_id` | `int` | NO | **FK** | `1` | - | Clave foránea (FK) de referencia relacional. |
| `numero_serie` | `varchar(100)` | NO | IDX | NULL | - | Atributo de datos de la entidad. |
| `estado_unidad_id` | `int` | NO | **FK** | `1` | - | Clave foránea (FK) de referencia relacional. |
| `tipo_destino` | `enum('VENTA','SERVICIO_TALLER','MIXTO')` | NO | - | `VENTA` | - | Atributo de datos de la entidad. |
| `disponible_venta` | `tinyint(1)` | NO | - | `1` | - | Atributo de datos de la entidad. |
| `condicion` | `enum('NUEVO','USADO','OPEN_BOX','DANADO_RECEPCION','DEFECTUOSO')` | NO | - | `NUEVO` | - | Atributo de datos de la entidad. |
| `observaciones` | `text` | SÍ | - | NULL | - | Detalle informativo, notas u observaciones adicionales. |
| `costo_adquisicion` | `decimal(10,2)` | SÍ | - | NULL | - | Atributo de datos de la entidad. |
| `fecha_ingreso` | `datetime` | NO | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Atributo de datos de la entidad. |
| `created_at` | `datetime` | NO | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Fecha y hora de registro del registro. |
| `updated_at` | `datetime` | NO | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED on update CURRENT_TIMESTAMP` | Fecha y hora de la última modificación. |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `estado_unidad_id` | `estados_unidad` | `id` | `fk_pu_estado_unidad` |
| `producto_id` | `productos` | `id` | `fk_pu_producto` |
| `sucursal_id` | `sucursales` | `id` | `fk_pu_sucursal` |

---

<a id="tabla-estados-unidad"></a>
### 📄 Tabla: `estados_unidad`

**Descripción:** Estados físicos de las unidades en inventario (DISPONIBLE, RESERVADO, VENDIDO, DEFECTUOSO, REPARACION).

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de estados_unidad. |
| `codigo` | `varchar(30)` | NO | **UQ** | NULL | - | Código identificador único o correlativo. |
| `nombre` | `varchar(60)` | NO | - | NULL | - | Nombre oficial o denominación del elemento. |
| `estado_id` | `int` | NO | **FK** | `1` | - | Clave foránea (FK) de referencia relacional. |
| `created_at` | `datetime` | SÍ | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Fecha y hora de registro del registro. |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `estado_id` | `estados` | `id` | `fk_estados_unidad_estado` |

---

<a id="tabla-estados-movimiento"></a>
### 📄 Tabla: `estados_movimiento`

**Descripción:** Estados para el ciclo de vida de transferencias y movimientos de almacén.

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de estados_movimiento. |
| `codigo` | `varchar(30)` | NO | **UQ** | NULL | - | Código identificador único o correlativo. |
| `nombre` | `varchar(50)` | NO | - | NULL | - | Nombre oficial o denominación del elemento. |
| `color_hex` | `varchar(10)` | SÍ | - | `#3B82F6` | - | Atributo de datos de la entidad. |
| `estado_id` | `int` | NO | **FK** | `1` | - | Clave foránea (FK) de referencia relacional. |
| `created_at` | `datetime` | SÍ | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Fecha y hora de registro del registro. |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `estado_id` | `estados` | `id` | `fk_estados_mov_estado` |

---

# 6. Módulo de Ventas y Comprobantes de Pago

<a id="tabla-ventas"></a>
### 📄 Tabla: `ventas`

**Descripción:** Cabecera de ventas, facturación electrónica (Boletas/Facturas), medios de pago y totales.

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de ventas. |
| `codigo_comprobante` | `varchar(20)` | NO | **UQ** | NULL | - | Código identificador único o correlativo. |
| `tipo_comprobante_id` | `int` | SÍ | **FK** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `cliente_id` | `int` | SÍ | **FK** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `usuario_id` | `int` | SÍ | **FK** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `sucursal_id` | `int` | SÍ | **FK** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `subtotal` | `decimal(10,2)` | NO | - | `0.00` | - | Monto económico expresado en moneda nacional (PEN). |
| `igv` | `decimal(10,2)` | NO | - | `0.00` | - | Atributo de datos de la entidad. |
| `total` | `decimal(10,2)` | NO | - | `0.00` | - | Monto económico expresado en moneda nacional (PEN). |
| `metodo_pago_id` | `int` | SÍ | **FK** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `estado_id` | `int` | NO | **FK** | `1` | - | Clave foránea (FK) de referencia relacional. |
| `fecha_venta` | `datetime` | NO | IDX | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Atributo de datos de la entidad. |
| `observaciones` | `text` | SÍ | - | NULL | - | Detalle informativo, notas u observaciones adicionales. |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `cliente_id` | `clientes` | `id_cliente` | `fk_ventas_cliente` |
| `estado_id` | `estados` | `id` | `fk_ventas_estado` |
| `metodo_pago_id` | `metodos_pago` | `id` | `fk_ventas_metodo_pago` |
| `sucursal_id` | `sucursales` | `id` | `fk_ventas_sucursal` |
| `tipo_comprobante_id` | `tipos_comprobante` | `id` | `fk_ventas_comprobante` |
| `usuario_id` | `usuarios` | `id` | `fk_ventas_usuario` |

---

<a id="tabla-detalle-ventas"></a>
### 📄 Tabla: `detalle_ventas`

**Descripción:** Líneas de producto comercializadas por cada transacción de venta.

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de detalle_ventas. |
| `venta_id` | `int` | NO | **FK** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `producto_id` | `int` | NO | **FK** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `cantidad` | `int` | NO | - | `1` | - | Atributo de datos de la entidad. |
| `precio_unitario` | `decimal(10,2)` | NO | - | `0.00` | - | Atributo de datos de la entidad. |
| `descuento` | `decimal(10,2)` | NO | - | `0.00` | - | Atributo de datos de la entidad. |
| `subtotal` | `decimal(10,2)` | NO | - | `0.00` | - | Monto económico expresado en moneda nacional (PEN). |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `producto_id` | `productos` | `id` | `fk_dv_producto` |
| `venta_id` | `ventas` | `id` | `fk_dv_venta` |

---

<a id="tabla-tipos-comprobante"></a>
### 📄 Tabla: `tipos_comprobante`

**Descripción:** Tipos de comprobantes de pago según normativa SUNAT (01 Factura, 03 Boleta, 00 Nota de Venta).

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de tipos_comprobante. |
| `codigo` | `varchar(25)` | NO | **UQ** | NULL | - | BOLETA, FACTURA, NOTA_VENTA, GUIA_REMISION |
| `nombre` | `varchar(60)` | NO | - | NULL | - | Nombre oficial o denominación del elemento. |
| `serie_defecto` | `varchar(10)` | SÍ | - | `B001` | - | Atributo de datos de la entidad. |
| `estado_id` | `int` | NO | **FK** | `1` | - | Clave foránea (FK) de referencia relacional. |
| `created_at` | `datetime` | SÍ | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Fecha y hora de registro del registro. |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `estado_id` | `estados` | `id` | `fk_tipos_comp_estado` |

---

<a id="tabla-metodos-pago"></a>
### 📄 Tabla: `metodos_pago`

**Descripción:** Medios de recaudación (Efectivo, Yape, Plin, Tarjeta Débito/Crédito, Transferencia BCP/BBVA).

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de metodos_pago. |
| `codigo` | `varchar(30)` | NO | **UQ** | NULL | - | EFECTIVO, YAPE, PLIN, TARJETA, TRANSFERENCIA |
| `nombre` | `varchar(60)` | NO | - | NULL | - | Nombre oficial o denominación del elemento. |
| `requiere_referencia` | `tinyint(1)` | SÍ | - | `0` | - | TRUE si requiere Nro de operación |
| `estado_id` | `int` | NO | **FK** | `1` | - | Clave foránea (FK) de referencia relacional. |
| `created_at` | `datetime` | SÍ | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Fecha y hora de registro del registro. |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `estado_id` | `estados` | `id` | `fk_metodos_pago_estado` |

---

# 7. Módulo de Compras y Abastecimiento

<a id="tabla-compras"></a>
### 📄 Tabla: `compras`

**Descripción:** Registro de órdenes de compra y recepción de mercadería de proveedores mayoristas.

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de compras. |
| `codigo` | `varchar(20)` | NO | **UQ** | NULL | - | Código identificador único o correlativo. |
| `proveedor_id` | `int` | NO | **FK** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `sucursal_id` | `int` | SÍ | **FK** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `total` | `decimal(10,2)` | NO | - | `0.00` | - | Monto económico expresado en moneda nacional (PEN). |
| `estado_id` | `int` | NO | **FK** | `1` | - | Clave foránea (FK) de referencia relacional. |
| `usuario_id` | `int` | SÍ | **FK** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `fecha_compra` | `datetime` | NO | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Atributo de datos de la entidad. |
| `observaciones` | `text` | SÍ | - | NULL | - | Detalle informativo, notas u observaciones adicionales. |
| `updated_at` | `datetime` | NO | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED on update CURRENT_TIMESTAMP` | Fecha y hora de la última modificación. |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `estado_id` | `estados` | `id` | `fk_compras_estado` |
| `proveedor_id` | `proveedores` | `id` | `fk_compras_proveedor` |
| `sucursal_id` | `sucursales` | `id` | `fk_compras_sucursal` |
| `usuario_id` | `usuarios` | `id` | `fk_compras_usuario` |

---

<a id="tabla-detalle-compras"></a>
### 📄 Tabla: `detalle_compras`

**Descripción:** Ítems, costos unitarios y cantidades adquiridas en cada compra.

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de detalle_compras. |
| `compra_id` | `int` | NO | **FK** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `producto_id` | `int` | NO | **FK** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `cantidad` | `int` | NO | - | `1` | - | Atributo de datos de la entidad. |
| `precio_costo_unit` | `decimal(10,2)` | NO | - | `0.00` | - | Atributo de datos de la entidad. |
| `subtotal` | `decimal(10,2)` | NO | - | `0.00` | - | Monto económico expresado en moneda nacional (PEN). |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `compra_id` | `compras` | `id` | `fk_dc_compra` |
| `producto_id` | `productos` | `id` | `fk_dc_producto` |

---

<a id="tabla-proveedores"></a>
### 📄 Tabla: `proveedores`

**Descripción:** Directorio comercial de distribuidores y proveedores mayoristas (Deltron, Ingram, etc.).

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de proveedores. |
| `ruc` | `varchar(11)` | SÍ | **UQ** | NULL | - | Atributo de datos de la entidad. |
| `razon_social` | `varchar(200)` | NO | - | NULL | - | Nombre oficial o denominación del elemento. |
| `nombre_contacto` | `varchar(150)` | SÍ | - | NULL | - | Atributo de datos de la entidad. |
| `telefono` | `varchar(20)` | SÍ | - | NULL | - | Número telefónico de contacto. |
| `email` | `varchar(100)` | SÍ | - | NULL | - | Correo electrónico para comunicaciones o autenticación. |
| `direccion` | `text` | SÍ | - | NULL | - | Dirección geográfica o domicilio fiscal. |
| `estado_id` | `int` | NO | **FK** | `1` | - | Clave foránea (FK) de referencia relacional. |
| `created_at` | `datetime` | NO | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Fecha y hora de registro del registro. |
| `updated_at` | `datetime` | NO | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED on update CURRENT_TIMESTAMP` | Fecha y hora de la última modificación. |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `estado_id` | `estados` | `id` | `fk_proveedores_estado` |

---

# 8. Módulo de Garantías y Posventa

<a id="tabla-producto-series-garantia"></a>
### 📄 Tabla: `producto_series_garantia`

**Descripción:** Control posventa de garantías asociadas a números de serie vendidos y plazo de cobertura.

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de producto_series_garantia. |
| `venta_id` | `int` | SÍ | - | NULL | - | Clave foránea (FK) de referencia relacional. |
| `producto_id` | `int` | NO | - | NULL | - | Clave foránea (FK) de referencia relacional. |
| `numero_serie` | `varchar(100)` | NO | **UQ** | NULL | - | Atributo de datos de la entidad. |
| `cliente_id` | `int` | SÍ | - | NULL | - | Clave foránea (FK) de referencia relacional. |
| `meses_garantia` | `int` | NO | - | `12` | - | Atributo de datos de la entidad. |
| `fecha_venta` | `datetime` | NO | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Atributo de datos de la entidad. |
| `estado_garantia` | `varchar(50)` | NO | - | `ACTIVA` | - | Atributo de datos de la entidad. |
| `observaciones` | `text` | SÍ | - | NULL | - | Detalle informativo, notas u observaciones adicionales. |
| `created_at` | `datetime` | NO | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Fecha y hora de registro del registro. |

---

# 9. Módulo de Taller y Soporte Técnico

<a id="tabla-ordenes-servicio"></a>
### 📄 Tabla: `ordenes_servicio`

**Descripción:** Órdenes de servicio técnico, tickets de reparación de hardware, diagnósticos y cotizaciones.

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de ordenes_servicio. |
| `codigo` | `varchar(20)` | NO | **UQ** | NULL | - | Código identificador único o correlativo. |
| `cliente_id` | `int` | NO | **FK** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `equipo_id` | `int` | SÍ | **FK** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `usuario_recibe_id` | `int` | SÍ | **FK** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `usuario_tecnico_id` | `int` | SÍ | **FK** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `descripcion_falla` | `text` | SÍ | - | NULL | - | Atributo de datos de la entidad. |
| `diagnostico` | `text` | SÍ | - | NULL | - | Atributo de datos de la entidad. |
| `solucion` | `text` | SÍ | - | NULL | - | Atributo de datos de la entidad. |
| `costo_servicio` | `decimal(10,2)` | NO | - | `0.00` | - | Atributo de datos de la entidad. |
| `estado_orden_id` | `int` | NO | **FK** | `1` | - | Clave foránea (FK) de referencia relacional. |
| `prioridad_id` | `int` | SÍ | **FK** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `fecha_ingreso` | `datetime` | NO | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Atributo de datos de la entidad. |
| `fecha_promesa` | `datetime` | SÍ | - | NULL | - | Atributo de datos de la entidad. |
| `fecha_entrega` | `datetime` | SÍ | - | NULL | - | Atributo de datos de la entidad. |
| `observaciones` | `text` | SÍ | - | NULL | - | Detalle informativo, notas u observaciones adicionales. |
| `updated_at` | `datetime` | NO | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED on update CURRENT_TIMESTAMP` | Fecha y hora de la última modificación. |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `cliente_id` | `clientes` | `id_cliente` | `fk_os_cliente` |
| `equipo_id` | `equipos` | `id` | `fk_os_equipo` |
| `estado_orden_id` | `estados_orden_servicio` | `id` | `fk_os_estado` |
| `prioridad_id` | `prioridades_orden` | `id` | `fk_os_prioridad` |
| `usuario_recibe_id` | `usuarios` | `id` | `fk_os_recibe` |
| `usuario_tecnico_id` | `usuarios` | `id` | `fk_os_tecnico` |

---

<a id="tabla-equipos"></a>
### 📄 Tabla: `equipos`

**Descripción:** Equipos de clientes ingresados a taller (marca, modelo, número de serie, accesorios dejados).

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de equipos. |
| `cliente_id` | `int` | NO | **FK** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `tipo_equipo_id` | `int` | SÍ | **FK** | NULL | - | Clave foránea (FK) de referencia relacional. |
| `marca` | `varchar(100)` | SÍ | - | NULL | - | Atributo de datos de la entidad. |
| `modelo` | `varchar(100)` | SÍ | - | NULL | - | Atributo de datos de la entidad. |
| `numero_serie` | `varchar(100)` | SÍ | - | NULL | - | Atributo de datos de la entidad. |
| `accesorios` | `text` | SÍ | - | NULL | - | Atributo de datos de la entidad. |
| `estado_id` | `int` | NO | **FK** | `1` | - | Clave foránea (FK) de referencia relacional. |
| `fecha_registro` | `datetime` | NO | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Fecha y hora de registro del registro. |
| `updated_at` | `datetime` | NO | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED on update CURRENT_TIMESTAMP` | Fecha y hora de la última modificación. |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `cliente_id` | `clientes` | `id_cliente` | `fk_equipos_cliente` |
| `estado_id` | `estados` | `id` | `fk_equipos_estado` |
| `tipo_equipo_id` | `tipos_equipo` | `id` | `fk_equipos_tipo` |

---

<a id="tabla-tipos-equipo"></a>
### 📄 Tabla: `tipos_equipo`

**Descripción:** Clasificación de equipos ingresados a reparación (Laptop, PC Escritorio, Impresora, Monitor).

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de tipos_equipo. |
| `codigo` | `varchar(30)` | NO | **UQ** | NULL | - | LAPTOP, PC_ESCRITORIO, etc. |
| `nombre` | `varchar(60)` | NO | - | NULL | - | Nombre oficial o denominación del elemento. |
| `estado_id` | `int` | NO | **FK** | `1` | - | Clave foránea (FK) de referencia relacional. |
| `created_at` | `datetime` | SÍ | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Fecha y hora de registro del registro. |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `estado_id` | `estados` | `id` | `fk_tipos_equipo_estado` |

---

<a id="tabla-estados-orden-servicio"></a>
### 📄 Tabla: `estados_orden_servicio`

**Descripción:** Flujo de estados de la orden técnica (RECEPCIONADO, EN DIAGNOSTICO, ESPERA REPUESTO, REPARADO, ENTREGADO).

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de estados_orden_servicio. |
| `codigo` | `varchar(40)` | NO | **UQ** | NULL | - | Código identificador único o correlativo. |
| `nombre` | `varchar(60)` | NO | - | NULL | - | Nombre oficial o denominación del elemento. |
| `descripcion` | `varchar(150)` | SÍ | - | NULL | - | Detalle informativo, notas u observaciones adicionales. |
| `secuencia_orden` | `tinyint unsigned` | NO | - | `1` | - | Atributo de datos de la entidad. |
| `color_hex` | `varchar(10)` | SÍ | - | `#004A99` | - | Atributo de datos de la entidad. |
| `estado_id` | `int` | NO | **FK** | `1` | - | Clave foránea (FK) de referencia relacional. |
| `created_at` | `datetime` | SÍ | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Fecha y hora de registro del registro. |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `estado_id` | `estados` | `id` | `fk_estados_orden_estado` |

---

<a id="tabla-prioridades-orden"></a>
### 📄 Tabla: `prioridades_orden`

**Descripción:** Nivel de urgencia de la orden de trabajo (BAJA, MEDIA, ALTA, URGENTE).

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de prioridades_orden. |
| `codigo` | `varchar(20)` | NO | **UQ** | NULL | - | NORMAL, ALTA, URGENTE |
| `nombre` | `varchar(40)` | NO | - | NULL | - | Nombre oficial o denominación del elemento. |
| `nivel_orden` | `int` | NO | - | `1` | - | 1=Bajo, 2=Medio, 3=Alto |
| `color_hex` | `varchar(10)` | SÍ | - | `#3B82F6` | - | Atributo de datos de la entidad. |
| `estado_id` | `int` | NO | **FK** | `1` | - | Clave foránea (FK) de referencia relacional. |
| `created_at` | `datetime` | SÍ | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Fecha y hora de registro del registro. |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `estado_id` | `estados` | `id` | `fk_prioridades_estado` |

---

# 10. Módulo de Estados y Tipos Generales

<a id="tabla-estados"></a>
### 📄 Tabla: `estados`

**Descripción:** Catálogo maestro genérico de estados (ACTIVO, INACTIVO, ANULADO, PENDIENTE).

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de estados. |
| `nombre` | `varchar(30)` | NO | **UQ** | NULL | - | ACTIVO, INACTIVO, SUSPENDIDO, DESCONTINUADO |
| `descripcion` | `varchar(150)` | SÍ | - | NULL | - | Detalle informativo, notas u observaciones adicionales. |
| `created_at` | `datetime` | SÍ | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Fecha y hora de registro del registro. |

---

<a id="tabla-tipos-documento"></a>
### 📄 Tabla: `tipos_documento`

**Descripción:** Catálogo de tipos de documento de identidad oficial (DNI, RUC, CE, PASAPORTE).

| Campo | Tipo de Dato | Nulo | Clave | Predeterminado | Extra | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `int` | NO | **PK** | NULL | `auto_increment` | Identificador único (Clave Primaria - PK) de tipos_documento. |
| `codigo` | `varchar(15)` | NO | **UQ** | NULL | - | DNI, RUC, CE, PASAPORTE |
| `nombre` | `varchar(60)` | NO | - | NULL | - | Nombre oficial o denominación del elemento. |
| `longitud_exacta` | `tinyint unsigned` | SÍ | - | NULL | - | 8 para DNI, 11 para RUC |
| `estado_id` | `int` | NO | **FK** | `1` | - | FK a estados |
| `created_at` | `datetime` | SÍ | - | `CURRENT_TIMESTAMP` | `DEFAULT_GENERATED` | Fecha y hora de registro del registro. |

**🔗 Relaciones Foráneas (Foreign Keys):**

| Campo Local | Tabla Referenciada | Campo Referenciado | Restricción |
| :--- | :--- | :--- | :--- |
| `estado_id` | `estados` | `id` | `fk_tipos_doc_estado` |

---
