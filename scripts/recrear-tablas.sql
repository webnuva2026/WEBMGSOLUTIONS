-- =====================================================================
-- MG SOLUTIONS ERP - RECREAR TABLAS ELIMINADAS
-- Ejecutar en MySQL Workbench sobre la base mg_solutions_db
-- =====================================================================

USE mg_solutions_db;

SET FOREIGN_KEY_CHECKS = 0;

-- TABLA: clientes
CREATE TABLE IF NOT EXISTS clientes (
  id_cliente    INT AUTO_INCREMENT PRIMARY KEY,
  id_persona    INT NOT NULL,
  ruc           VARCHAR(11)  NULL,
  razon_social  VARCHAR(200) NULL,
  nombre_empresa VARCHAR(200) NULL,
  estado_id     INT NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_clientes_persona  FOREIGN KEY (id_persona) REFERENCES personas(id_persona),
  CONSTRAINT fk_clientes_estado   FOREIGN KEY (estado_id)  REFERENCES estados(id),
  UNIQUE KEY uq_clientes_ruc (ruc),
  INDEX idx_clientes_persona (id_persona)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: categorias
CREATE TABLE IF NOT EXISTS categorias (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT NULL,
  estado_id   INT NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_categorias_estado FOREIGN KEY (estado_id) REFERENCES estados(id),
  UNIQUE KEY uq_categorias_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: marcas
CREATE TABLE IF NOT EXISTS marcas (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT NULL,
  estado_id   INT NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_marcas_estado FOREIGN KEY (estado_id) REFERENCES estados(id),
  UNIQUE KEY uq_marcas_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: productos
CREATE TABLE IF NOT EXISTS productos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  codigo          VARCHAR(50)    NULL,
  nombre          VARCHAR(200)   NOT NULL,
  descripcion     TEXT           NULL,
  categoria_id    INT            NULL,
  marca_id        INT            NULL,
  precio_venta    DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  precio_costo    DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  stock_minimo    INT            NOT NULL DEFAULT 0,
  estado_id       INT            NOT NULL DEFAULT 1,
  created_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_productos_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id),
  CONSTRAINT fk_productos_marca     FOREIGN KEY (marca_id)     REFERENCES marcas(id),
  CONSTRAINT fk_productos_estado    FOREIGN KEY (estado_id)    REFERENCES estados(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: producto_stock_sede
CREATE TABLE IF NOT EXISTS producto_stock_sede (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  producto_id  INT NOT NULL,
  sucursal_id  INT NOT NULL,
  stock        INT NOT NULL DEFAULT 0,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pss_producto  FOREIGN KEY (producto_id) REFERENCES productos(id),
  CONSTRAINT fk_pss_sucursal  FOREIGN KEY (sucursal_id) REFERENCES sucursales(id),
  UNIQUE KEY uq_pss (producto_id, sucursal_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: producto_detalle
CREATE TABLE IF NOT EXISTS producto_detalle (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  producto_id     INT NOT NULL,
  tipo_detalle_id INT NULL,
  valor           VARCHAR(500) NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pd_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: modelos
CREATE TABLE IF NOT EXISTS modelos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  marca_id    INT NULL,
  nombre      VARCHAR(150) NOT NULL,
  descripcion TEXT NULL,
  estado_id   INT NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_modelos_marca   FOREIGN KEY (marca_id)   REFERENCES marcas(id),
  CONSTRAINT fk_modelos_estado  FOREIGN KEY (estado_id)  REFERENCES estados(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: detalle_modelo
CREATE TABLE IF NOT EXISTS detalle_modelo (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  modelo_id   INT NOT NULL,
  atributo    VARCHAR(100) NOT NULL,
  valor       VARCHAR(500) NULL,
  CONSTRAINT fk_dm_modelo FOREIGN KEY (modelo_id) REFERENCES modelos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: equipos
CREATE TABLE IF NOT EXISTS equipos (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id       INT            NOT NULL,
  tipo_equipo_id   INT            NULL,
  marca            VARCHAR(100)   NULL,
  modelo           VARCHAR(100)   NULL,
  numero_serie     VARCHAR(100)   NULL,
  accesorios       TEXT           NULL,
  estado_id        INT            NOT NULL DEFAULT 1,
  fecha_registro   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_equipos_cliente     FOREIGN KEY (cliente_id)     REFERENCES clientes(id_cliente),
  CONSTRAINT fk_equipos_tipo        FOREIGN KEY (tipo_equipo_id) REFERENCES tipos_equipo(id),
  CONSTRAINT fk_equipos_estado      FOREIGN KEY (estado_id)      REFERENCES estados(id),
  INDEX idx_equipos_cliente (cliente_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: ordenes_servicio
CREATE TABLE IF NOT EXISTS ordenes_servicio (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  codigo              VARCHAR(20)    NOT NULL UNIQUE,
  cliente_id          INT            NOT NULL,
  equipo_id           INT            NULL,
  usuario_recibe_id   INT            NULL,
  usuario_tecnico_id  INT            NULL,
  descripcion_falla   TEXT           NULL,
  diagnostico         TEXT           NULL,
  solucion            TEXT           NULL,
  costo_servicio      DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  estado_orden_id     INT            NOT NULL DEFAULT 1,
  prioridad_id        INT            NULL,
  fecha_ingreso       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_promesa       DATETIME       NULL,
  fecha_entrega       DATETIME       NULL,
  observaciones       TEXT           NULL,
  updated_at          DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_os_cliente    FOREIGN KEY (cliente_id)         REFERENCES clientes(id_cliente),
  CONSTRAINT fk_os_equipo     FOREIGN KEY (equipo_id)          REFERENCES equipos(id),
  CONSTRAINT fk_os_recibe     FOREIGN KEY (usuario_recibe_id)  REFERENCES usuarios(id),
  CONSTRAINT fk_os_tecnico    FOREIGN KEY (usuario_tecnico_id) REFERENCES usuarios(id),
  CONSTRAINT fk_os_estado     FOREIGN KEY (estado_orden_id)    REFERENCES estados_orden_servicio(id),
  CONSTRAINT fk_os_prioridad  FOREIGN KEY (prioridad_id)       REFERENCES prioridades_orden(id),
  INDEX idx_os_cliente  (cliente_id),
  INDEX idx_os_estado   (estado_orden_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: proveedores
CREATE TABLE IF NOT EXISTS proveedores (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  ruc             VARCHAR(11)   NULL,
  razon_social    VARCHAR(200)  NOT NULL,
  nombre_contacto VARCHAR(150)  NULL,
  telefono        VARCHAR(20)   NULL,
  email           VARCHAR(100)  NULL,
  direccion       TEXT          NULL,
  estado_id       INT           NOT NULL DEFAULT 1,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_proveedores_estado FOREIGN KEY (estado_id) REFERENCES estados(id),
  UNIQUE KEY uq_proveedores_ruc (ruc)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: compras
CREATE TABLE IF NOT EXISTS compras (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  codigo        VARCHAR(20)    NOT NULL UNIQUE,
  proveedor_id  INT            NOT NULL,
  sucursal_id   INT            NULL,
  total         DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  estado_id     INT            NOT NULL DEFAULT 1,
  usuario_id    INT            NULL,
  fecha_compra  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  observaciones TEXT           NULL,
  updated_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_compras_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
  CONSTRAINT fk_compras_sucursal  FOREIGN KEY (sucursal_id)  REFERENCES sucursales(id),
  CONSTRAINT fk_compras_usuario   FOREIGN KEY (usuario_id)   REFERENCES usuarios(id),
  CONSTRAINT fk_compras_estado    FOREIGN KEY (estado_id)    REFERENCES estados(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: detalle_compras
CREATE TABLE IF NOT EXISTS detalle_compras (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  compra_id         INT            NOT NULL,
  producto_id       INT            NOT NULL,
  cantidad          INT            NOT NULL DEFAULT 1,
  precio_costo_unit DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  subtotal          DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  CONSTRAINT fk_dc_compra   FOREIGN KEY (compra_id)   REFERENCES compras(id),
  CONSTRAINT fk_dc_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: ventas
CREATE TABLE IF NOT EXISTS ventas (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  codigo_comprobante  VARCHAR(20)    NOT NULL UNIQUE,
  tipo_comprobante_id INT            NULL,
  cliente_id          INT            NULL,
  usuario_id          INT            NULL,
  sucursal_id         INT            NULL,
  subtotal            DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  igv                 DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  total               DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  metodo_pago_id      INT            NULL,
  estado_id           INT            NOT NULL DEFAULT 1,
  fecha_venta         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  observaciones       TEXT           NULL,
  CONSTRAINT fk_ventas_cliente     FOREIGN KEY (cliente_id)          REFERENCES clientes(id_cliente),
  CONSTRAINT fk_ventas_usuario     FOREIGN KEY (usuario_id)          REFERENCES usuarios(id),
  CONSTRAINT fk_ventas_sucursal    FOREIGN KEY (sucursal_id)         REFERENCES sucursales(id),
  CONSTRAINT fk_ventas_comprobante FOREIGN KEY (tipo_comprobante_id) REFERENCES tipos_comprobante(id),
  CONSTRAINT fk_ventas_metodo_pago FOREIGN KEY (metodo_pago_id)      REFERENCES metodos_pago(id),
  CONSTRAINT fk_ventas_estado      FOREIGN KEY (estado_id)           REFERENCES estados(id),
  INDEX idx_ventas_cliente (cliente_id),
  INDEX idx_ventas_fecha   (fecha_venta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: detalle_ventas
CREATE TABLE IF NOT EXISTS detalle_ventas (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  venta_id        INT            NOT NULL,
  producto_id     INT            NOT NULL,
  cantidad        INT            NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  descuento       DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  subtotal        DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  CONSTRAINT fk_dv_venta    FOREIGN KEY (venta_id)    REFERENCES ventas(id),
  CONSTRAINT fk_dv_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: tecnicos
CREATE TABLE IF NOT EXISTS tecnicos (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id   INT NOT NULL UNIQUE,
  especialidad VARCHAR(200) NULL,
  estado_id    INT NOT NULL DEFAULT 1,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tecnicos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  CONSTRAINT fk_tecnicos_estado  FOREIGN KEY (estado_id)  REFERENCES estados(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: vendedores
CREATE TABLE IF NOT EXISTS vendedores (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id   INT NOT NULL UNIQUE,
  comision_pct DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  estado_id    INT NOT NULL DEFAULT 1,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vendedores_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  CONSTRAINT fk_vendedores_estado  FOREIGN KEY (estado_id)  REFERENCES estados(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- VERIFICACION FINAL: mostrar todas las tablas creadas
SELECT TABLE_NAME AS 'Tabla', TABLE_ROWS AS 'Filas', CREATE_TIME AS 'Creada'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'mg_solutions_db'
ORDER BY TABLE_NAME;
