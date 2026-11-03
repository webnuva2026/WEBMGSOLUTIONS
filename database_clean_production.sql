-- ========================================================
-- MG SOLUTIONS GROUP S.A.C. - BASE DE DATOS DE PRODUCCIÓN
-- Generado: 2026-11-03T04:44:28.832Z
-- Contiene: Superadmin, Roles, Permisos, Catálogo Maestro y Sedes.
-- Tablas operativas limpias listas para uso en vivo.
-- ========================================================

SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

-- Estructura de tabla `categorias`
DROP TABLE IF EXISTS `categorias`;
CREATE TABLE `categorias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `es_equipo_taller` tinyint(1) NOT NULL DEFAULT '0',
  `es_venta` tinyint(1) NOT NULL DEFAULT '1',
  `es_repuesto_taller` tinyint(1) NOT NULL DEFAULT '0',
  `requiere_serie` tinyint(1) NOT NULL DEFAULT '0',
  `estado_id` int NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categorias_nombre` (`nombre`),
  KEY `fk_categorias_estado` (`estado_id`),
  CONSTRAINT `fk_categorias_estado` FOREIGN KEY (`estado_id`) REFERENCES `estados` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos de tabla `categorias` (7 registros)
INSERT INTO `categorias` (`id`, `nombre`, `descripcion`, `es_equipo_taller`, `es_venta`, `es_repuesto_taller`, `requiere_serie`, `estado_id`, `created_at`) VALUES
(1, 'LAPTOPS & NOTEBOOKS', 'Laptops de oficina, gaming, ultrabooks y estaciones de trabajo', 1, 1, 0, 1, 1, '2026-09-30 14:32:40'),
(2, 'IMPRESORAS & MULTIFUNCIONALES', 'Impresoras EcoTank, láser monocromáticas y multifuncionales', 1, 1, 0, 1, 1, '2026-09-30 14:32:40'),
(3, 'MONITORES & PANTALLAS', 'Monitores de oficina, gaming alta tasa de refresco y diseño', 1, 1, 0, 1, 1, '2026-09-30 14:32:40'),
(4, 'PERIFÉRICOS & ACCESORIOS', 'Teclados, mouses, auriculares, webcams y almohadillas', 0, 1, 0, 0, 1, '2026-09-30 14:32:40'),
(5, 'COMPONENTES & HARDWARE', 'Memorias RAM, discos SSD NVMe, fuentes de poder y tarjetas de video', 0, 1, 1, 0, 1, '2026-09-30 14:32:40'),
(6, 'REPUESTOS DE TALLER', 'Pantallas, teclados de reemplazo, baterías, cargadores y ventiladores', 0, 0, 1, 0, 1, '2026-09-30 14:32:40'),
(7, 'SUMINISTROS & TINTAS', 'Botellas de tinta original, tóner, cables de poder y adaptadores', 0, 1, 0, 0, 1, '2026-09-30 14:32:41');

-- Estructura de tabla `clientes`
DROP TABLE IF EXISTS `clientes`;
CREATE TABLE `clientes` (
  `id_cliente` int NOT NULL AUTO_INCREMENT,
  `id_persona` int NOT NULL,
  `ruc` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `razon_social` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nombre_empresa` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado_id` int NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_cliente`),
  UNIQUE KEY `uq_clientes_ruc` (`ruc`),
  KEY `fk_clientes_estado` (`estado_id`),
  KEY `idx_clientes_persona` (`id_persona`),
  CONSTRAINT `fk_clientes_estado` FOREIGN KEY (`estado_id`) REFERENCES `estados` (`id`),
  CONSTRAINT `fk_clientes_persona` FOREIGN KEY (`id_persona`) REFERENCES `personas` (`id_persona`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Estructura de tabla `codigos_recuperacion`
DROP TABLE IF EXISTS `codigos_recuperacion`;
CREATE TABLE `codigos_recuperacion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `codigo` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'C├│digo OTP de 6 d├¡gitos',
  `expira_en` datetime NOT NULL COMMENT 'Tiempo l├¡mite de validez (15 min)',
  `utilizado` tinyint(1) DEFAULT '0' COMMENT 'TRUE = c├│digo ya canjeado',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_recuperacion_usuario_codigo` (`usuario_id`,`codigo`,`utilizado`),
  KEY `idx_recuperacion_expira` (`expira_en`),
  CONSTRAINT `fk_recuperacion_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='C├│digos OTP temporales para recuperaci├│n de contrase├▒a';

-- Estructura de tabla `compras`
DROP TABLE IF EXISTS `compras`;
CREATE TABLE `compras` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `proveedor_id` int NOT NULL,
  `sucursal_id` int DEFAULT NULL,
  `total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `estado_id` int NOT NULL DEFAULT '1',
  `usuario_id` int DEFAULT NULL,
  `fecha_compra` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `fk_compras_proveedor` (`proveedor_id`),
  KEY `fk_compras_sucursal` (`sucursal_id`),
  KEY `fk_compras_usuario` (`usuario_id`),
  KEY `fk_compras_estado` (`estado_id`),
  CONSTRAINT `fk_compras_estado` FOREIGN KEY (`estado_id`) REFERENCES `estados` (`id`),
  CONSTRAINT `fk_compras_proveedor` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`),
  CONSTRAINT `fk_compras_sucursal` FOREIGN KEY (`sucursal_id`) REFERENCES `sucursales` (`id`),
  CONSTRAINT `fk_compras_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Estructura de tabla `detalle_compras`
DROP TABLE IF EXISTS `detalle_compras`;
CREATE TABLE `detalle_compras` (
  `id` int NOT NULL AUTO_INCREMENT,
  `compra_id` int NOT NULL,
  `producto_id` int NOT NULL,
  `cantidad` int NOT NULL DEFAULT '1',
  `precio_costo_unit` decimal(10,2) NOT NULL DEFAULT '0.00',
  `subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `fk_dc_compra` (`compra_id`),
  KEY `fk_dc_producto` (`producto_id`),
  CONSTRAINT `fk_dc_compra` FOREIGN KEY (`compra_id`) REFERENCES `compras` (`id`),
  CONSTRAINT `fk_dc_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Estructura de tabla `detalle_modelo`
DROP TABLE IF EXISTS `detalle_modelo`;
CREATE TABLE `detalle_modelo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `modelo_id` int NOT NULL,
  `atributo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_dm_modelo` (`modelo_id`),
  CONSTRAINT `fk_dm_modelo` FOREIGN KEY (`modelo_id`) REFERENCES `modelos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=82 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos de tabla `detalle_modelo` (81 registros)
INSERT INTO `detalle_modelo` (`id`, `modelo_id`, `atributo`, `valor`) VALUES
(1, 1, 'Procesador', 'Intel Core Ultra 7 258V con NPU IA'),
(2, 1, 'Memoria RAM', '32 GB LPDDR5x 8533MHz'),
(3, 1, 'Almacenamiento', '1 TB SSD M.2 PCIe Gen4 NVMe'),
(4, 1, 'Pantalla', '14" 2.8K (2880 x 1800) OLED, 120Hz, HDR500 True Black'),
(5, 1, 'Tarjeta Gráfica', 'Intel Arc Graphics integrada'),
(6, 1, 'Peso', '0.98 kg'),
(7, 2, 'Procesador', 'Intel Core i5-1335U 10 núcleos'),
(8, 2, 'Memoria RAM', '16 GB DDR5 5200MHz'),
(9, 2, 'Almacenamiento', '512 GB SSD NVMe M.2'),
(10, 2, 'Pantalla', '15.6" FHD (1920 x 1080) Antirreflejo IPS'),
(11, 2, 'Batería', 'Hasta 11 horas de autonomía'),
(12, 3, 'Procesador', 'Intel Core Ultra 5 125U'),
(13, 3, 'Memoria RAM', '16 GB DDR5 expandible a 64GB'),
(14, 3, 'Almacenamiento', '512 GB SSD M.2 PCIe Gen4'),
(15, 3, 'Pantalla', '14" WUXGA (1920 x 1200) IPS 400 nits Low Power'),
(16, 3, 'Puertos', '2x Thunderbolt 4 / USB-C, 2x USB-A, HDMI 2.1, RJ-45 Ethernet'),
(17, 4, 'Procesador', 'Intel Core i5-1235U'),
(18, 4, 'Memoria RAM', '16 GB DDR4 3200MHz'),
(19, 4, 'Almacenamiento', '512 GB SSD PCIe NVMe'),
(20, 4, 'Pantalla', '15.6" Full HD Micro-Edge'),
(21, 4, 'Audio', 'B&O con doble altavoz'),
(22, 5, 'Procesador', 'Intel Core i9 14th Gen'),
(23, 5, 'Memoria RAM', '32 GB DDR5'),
(24, 5, 'Almacenamiento', 'NVIDIA RTX 4080 12GB'),
(25, 5, 'Pantalla', '18" Mini LED 250Hz'),
(26, 5, 'Almacenamiento', '1 TB SSD NVMe'),
(27, 6, 'Tecnología de Impresión', 'Inyección de tinta Heat-Free MicroPiezo'),
(28, 6, 'Resolución Máxima', '5760 x 1440 dpi'),
(29, 6, 'Velocidad de Impresión', 'Negro 33 ppm / Color 15 ppm'),
(30, 6, 'Conectividad', 'WiFi Direct, USB 2.0 de alta velocidad'),
(31, 7, 'Procesador', 'Intel Core Ultra 9 185H (16 núcleos, hasta 5.1 GHz)'),
(32, 7, 'Memoria RAM', '32GB LPDDR5X 7467 MHz'),
(33, 7, 'Almacenamiento', '1TB SSD M.2 PCIe 4.0 NVMe'),
(34, 7, 'Tarjeta Gráfica', 'NVIDIA GeForce RTX 4070 8GB GDDR6'),
(35, 7, 'Pantalla', '16" 2.5K OLED 240Hz 0.2ms 500 nits ROG Nebula'),
(36, 7, 'Sistema Operativo', 'Windows 11 Home 64-bit'),
(37, 8, 'Procesador', 'AMD Ryzen 7 7735HS (8 núcleos, 16 hilos)'),
(38, 8, 'Memoria RAM', '16GB DDR5 4800 MHz (Expandible a 32GB)'),
(39, 8, 'Almacenamiento', '512GB SSD M.2 NVMe PCIe 4.0'),
(40, 8, 'Tarjeta Gráfica', 'NVIDIA GeForce RTX 4060 8GB GDDR6'),
(41, 8, 'Pantalla', '15.6" Full HD IPS 144Hz Adaptive-Sync'),
(42, 8, 'Refrigeración', 'Ventiladores Arc Flow con 4 salidas de aire'),
(43, 9, 'Procesador', 'Intel Core i5-1335U vPro (10 núcleos, hasta 4.6 GHz)'),
(44, 9, 'Memoria RAM', '16GB DDR4 3200 MHz'),
(45, 9, 'Almacenamiento', '512GB SSD PCIe NVMe M.2 Class 35'),
(46, 9, 'Pantalla', '14.0" FHD (1920x1080) Antirreflejo 250 nits'),
(47, 9, 'Seguridad', 'Chip TPM 2.0, lector de huella dactilar, cámara IR'),
(48, 9, 'Conectividad', 'Thunderbolt 4, RJ-45, Wi-Fi 6E'),
(49, 10, 'Procesador', 'Intel Core i5-1235U (10 núcleos, hasta 4.4 GHz)'),
(50, 10, 'Memoria RAM', '16GB DDR4 2666 MHz'),
(51, 10, 'Almacenamiento', '512GB SSD M.2 PCIe NVMe'),
(52, 10, 'Pantalla', '15.6" FHD WVA 120Hz con bordes delgados'),
(53, 10, 'Teclado', 'Español con teclado numérico integrado'),
(54, 11, 'Procesador', 'Intel Core i7-13700H (14 núcleos, hasta 5.0 GHz)'),
(55, 11, 'Memoria RAM', '16GB DDR5 5200 MHz'),
(56, 11, 'Almacenamiento', '1TB SSD PCIe Gen4 NVMe TLC M.2'),
(57, 11, 'Tarjeta Gráfica', 'NVIDIA GeForce RTX 4060 8GB GDDR6'),
(58, 11, 'Pantalla', '16.1" FHD IPS 144Hz antirreflejo'),
(59, 11, 'Audio', 'Audio por B&O con altavoces dobles'),
(60, 12, 'Procesador', 'Intel Core i7-1355U (10 núcleos, hasta 5.0 GHz)'),
(61, 12, 'Memoria RAM', '16GB DDR4 3200 MHz'),
(62, 12, 'Almacenamiento', '512GB SSD PCIe NVMe Value M.2'),
(63, 12, 'Pantalla', '15.6" FHD IPS antirreflejo 250 nits'),
(64, 12, 'Batería', 'HP Long Life de 3 celdas, 51 Wh'),
(65, 13, 'Procesador', 'Intel Core i7-14700HX (20 núcleos, 28 hilos, hasta 5.5 GHz)'),
(66, 13, 'Memoria RAM', '32GB DDR5 5600 MHz'),
(67, 13, 'Almacenamiento', '1TB SSD M.2 2280 PCIe 4.0 NVMe'),
(68, 13, 'Tarjeta Gráfica', 'NVIDIA GeForce RTX 4070 8GB GDDR6 140W'),
(69, 13, 'Pantalla', '16" WQXGA (2560x1600) IPS 240Hz 500nits 100% sRGB'),
(70, 13, 'Teclado', 'Legion TrueStrike con retroiluminación RGB de 4 zonas'),
(71, 14, 'Procesador', 'Apple M2 (CPU de 8 núcleos, GPU de 8 núcleos, Neural Engine 16 núcleos)'),
(72, 14, 'Memoria Unificada', '8GB Memoria Unificada de alto ancho de banda'),
(73, 14, 'Almacenamiento', '256GB SSD ultrarrápido'),
(74, 14, 'Pantalla', '13.6" Liquid Retina con True Tone (2560x1664) 500 nits'),
(75, 14, 'Puertos', 'Carga MagSafe 3, dos puertos Thunderbolt/USB 4, jack 3.5mm'),
(76, 14, 'Cámara y Audio', 'FaceTime HD 1080p, sistema de 4 altavoces con Audio Espacial'),
(77, 15, 'Procesador', 'Intel Core i5-1335U (10 núcleos, hasta 4.6 GHz)'),
(78, 15, 'Memoria RAM', '16GB LPDDR5 Dual Channel'),
(79, 15, 'Almacenamiento', '512GB SSD PCIe NVMe Gen4'),
(80, 15, 'Pantalla', '15.6" Full HD (1920x1080) IPS Acer ComfyView'),
(81, 15, 'Conectividad', 'Wi-Fi 6E, Thunderbolt 4 Tipo-C, HDMI 2.1');

-- Estructura de tabla `detalle_ventas`
DROP TABLE IF EXISTS `detalle_ventas`;
CREATE TABLE `detalle_ventas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `venta_id` int NOT NULL,
  `producto_id` int NOT NULL,
  `cantidad` int NOT NULL DEFAULT '1',
  `precio_unitario` decimal(10,2) NOT NULL DEFAULT '0.00',
  `descuento` decimal(10,2) NOT NULL DEFAULT '0.00',
  `subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `fk_dv_venta` (`venta_id`),
  KEY `fk_dv_producto` (`producto_id`),
  CONSTRAINT `fk_dv_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`),
  CONSTRAINT `fk_dv_venta` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Estructura de tabla `empresas`
DROP TABLE IF EXISTS `empresas`;
CREATE TABLE `empresas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ruc` char(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'RUC de 11 d├¡gitos SUNAT',
  `razon_social` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Raz├│n social registrada en SUNAT',
  `nombre_comercial` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nombre comercial visible',
  `direccion_fiscal` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `departamento` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Lambayeque',
  `provincia` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Chiclayo',
  `distrito` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Chiclayo',
  `ubigeo` char(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '140101' COMMENT 'C├│digo UBIGEO INEI',
  `logo_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'URL del logo de la empresa',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ruc` (`ruc`),
  KEY `idx_empresas_ruc` (`ruc`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Datos fiscales e institucionales de la empresa';

-- Datos de tabla `empresas` (1 registros)
INSERT INTO `empresas` (`id`, `ruc`, `razon_social`, `nombre_comercial`, `direccion_fiscal`, `email`, `telefono`, `departamento`, `provincia`, `distrito`, `ubigeo`, `logo_url`, `created_at`, `updated_at`) VALUES
(1, '20609737524', 'MG SOLUTIONS GROUP S.A.C.', 'MG SOLUTIONS GROUP', 'AV. PEDRO RUIZ NRO. 349 INT. 09C (MERCADO MODELO) - LAMBAYEQUE - CHICLAYO - CHICLAYO', 'mgsolutions.group@gmail.com', '+51 974 812 390', 'Lambayeque', 'Chiclayo', 'Chiclayo', '140101', NULL, '2026-09-20 23:21:30', '2026-09-30 11:47:18');

-- Estructura de tabla `equipos`
DROP TABLE IF EXISTS `equipos`;
CREATE TABLE `equipos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `tipo_equipo_id` int DEFAULT NULL,
  `marca` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modelo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_serie` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `accesorios` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `estado_id` int NOT NULL DEFAULT '1',
  `fecha_registro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_equipos_tipo` (`tipo_equipo_id`),
  KEY `fk_equipos_estado` (`estado_id`),
  KEY `idx_equipos_cliente` (`cliente_id`),
  CONSTRAINT `fk_equipos_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id_cliente`),
  CONSTRAINT `fk_equipos_estado` FOREIGN KEY (`estado_id`) REFERENCES `estados` (`id`),
  CONSTRAINT `fk_equipos_tipo` FOREIGN KEY (`tipo_equipo_id`) REFERENCES `tipos_equipo` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Estructura de tabla `estados`
DROP TABLE IF EXISTS `estados`;
CREATE TABLE `estados` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ACTIVO, INACTIVO, SUSPENDIDO, DESCONTINUADO',
  `descripcion` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cat├ílogo maestro de estados operativo/inactivo del sistema';

-- Datos de tabla `estados` (4 registros)
INSERT INTO `estados` (`id`, `nombre`, `descripcion`, `created_at`) VALUES
(1, 'ACTIVO', 'Registro activo y plenamente operativo', '2026-09-20 23:21:30'),
(2, 'INACTIVO', 'Registro dado de baja o inactivo', '2026-09-20 23:21:30'),
(3, 'SUSPENDIDO', 'Registro temporalmente suspendido', '2026-09-20 23:21:30'),
(4, 'DESCONTINUADO', 'Producto o ├¡tem descontinuado comercialmente', '2026-09-20 23:21:30');

-- Estructura de tabla `estados_movimiento`
DROP TABLE IF EXISTS `estados_movimiento`;
CREATE TABLE `estados_movimiento` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `color_hex` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '#3B82F6',
  `estado_id` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `fk_estados_mov_estado` (`estado_id`),
  CONSTRAINT `fk_estados_mov_estado` FOREIGN KEY (`estado_id`) REFERENCES `estados` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo de estados de traslados y movimientos entre sedes';

-- Datos de tabla `estados_movimiento` (6 registros)
INSERT INTO `estados_movimiento` (`id`, `codigo`, `nombre`, `color_hex`, `estado_id`, `created_at`) VALUES
(1, 'SOLICITADO', 'Solicitado', '#3B82F6', 1, '2026-09-24 13:23:41'),
(2, 'APROBADO', 'Aprobado', '#F59E0B', 1, '2026-09-24 13:23:41'),
(3, 'EN_TRANSITO', 'En Tránsito', '#8B5CF6', 1, '2026-09-24 13:23:41'),
(4, 'RECIBIDO', 'Recibido en Destino', '#10B981', 1, '2026-09-24 13:23:41'),
(5, 'CANCELADO', 'Cancelado', '#EF4444', 1, '2026-09-24 13:23:41'),
(6, 'DEVUELTO', 'Devuelto a Origen', '#059669', 1, '2026-10-08 15:02:00');

-- Estructura de tabla `estados_orden_servicio`
DROP TABLE IF EXISTS `estados_orden_servicio`;
CREATE TABLE `estados_orden_servicio` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `secuencia_orden` tinyint unsigned NOT NULL DEFAULT '1',
  `color_hex` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '#004A99',
  `estado_id` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `fk_estados_orden_estado` (`estado_id`),
  CONSTRAINT `fk_estados_orden_estado` FOREIGN KEY (`estado_id`) REFERENCES `estados` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo maestro de estados del flujo de servicio técnico';

-- Datos de tabla `estados_orden_servicio` (9 registros)
INSERT INTO `estados_orden_servicio` (`id`, `codigo`, `nombre`, `descripcion`, `secuencia_orden`, `color_hex`, `estado_id`, `created_at`) VALUES
(1, 'RECEPCIONADO', 'Recepcionado', 'Equipo recibido en mostrador, pendiente de diagnóstico inicial', 1, '#64748B', 1, '2026-09-24 13:23:41'),
(2, 'EN_DIAGNOSTICO', 'En diagnóstico técnico', 'Especialista evaluando fallas de hardware y software', 2, '#3B82F6', 1, '2026-09-24 13:23:41'),
(3, 'PRESUPUESTADO', 'Presupuestado', 'Cotización de mano de obra y repuestos emitida para el cliente', 3, '#F59E0B', 1, '2026-09-24 13:23:41'),
(4, 'APROBADO_EN_REPARACION', 'En reparación activa', 'Cliente aprobó presupuesto; técnico interviniendo equipo', 4, '#8B5CF6', 1, '2026-09-24 13:23:41'),
(5, 'ESPERA_REPUESTOS', 'Esperando repuestos', 'Taller esperando llegada de componentes o insumos de almacén', 5, '#EC4899', 1, '2026-09-24 13:23:41'),
(6, 'REPARADO_PROBADO', 'Reparado y con pruebas superadas', 'Reparación completada y pruebas de estrés aprobadas', 6, '#10B981', 1, '2026-09-24 13:23:41'),
(7, 'LISTO_ENTREGA', 'Listo para recojo en mostrador', 'Equipo limpio y listo en mostrador esperando al cliente', 7, '#059669', 1, '2026-09-24 13:23:41'),
(8, 'ENTREGADO_COBRADO', 'Entregado con conformidad', 'Cliente recogió equipo y liquidó saldo pendiente', 8, '#00346F', 1, '2026-09-24 13:23:41'),
(9, 'RECHAZADO_DEVUELTO', 'Devuelto sin reparación', 'Cliente no aceptó presupuesto o equipo no tuvo reparación', 9, '#DC2626', 1, '2026-09-24 13:23:41');

-- Estructura de tabla `estados_unidad`
DROP TABLE IF EXISTS `estados_unidad`;
CREATE TABLE `estados_unidad` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado_id` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `fk_estados_unidad_estado` (`estado_id`),
  CONSTRAINT `fk_estados_unidad_estado` FOREIGN KEY (`estado_id`) REFERENCES `estados` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo de estado operativo de unidades con serie/IMEI';

-- Datos de tabla `estados_unidad` (6 registros)
INSERT INTO `estados_unidad` (`id`, `codigo`, `nombre`, `estado_id`, `created_at`) VALUES
(1, 'DISPONIBLE', 'Disponible en Almacén / Vitrina', 1, '2026-09-24 13:23:41'),
(2, 'VENDIDO', 'Vendido a Cliente', 1, '2026-09-24 13:23:41'),
(3, 'EN_SERVICIO', 'Instalado en Orden de Taller', 1, '2026-09-24 13:23:41'),
(4, 'GARANTIA', 'Devuelto a Proveedor por Garantía', 1, '2026-09-24 13:23:41'),
(5, 'DANADO_CUARENTENA', 'Dañado / Cuarentena (Oculto de Venta)', 1, '2026-10-02 15:22:45'),
(6, 'BAJA_MERMA', 'Baja / Merma (Descarte)', 1, '2026-10-02 15:22:45');

-- Estructura de tabla `marcas`
DROP TABLE IF EXISTS `marcas`;
CREATE TABLE `marcas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `categoria_id` int DEFAULT NULL,
  `estado_id` int NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_marcas_nombre` (`nombre`),
  KEY `fk_marcas_estado` (`estado_id`),
  KEY `fk_marcas_categoria` (`categoria_id`),
  CONSTRAINT `fk_marcas_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_marcas_estado` FOREIGN KEY (`estado_id`) REFERENCES `estados` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos de tabla `marcas` (9 registros)
INSERT INTO `marcas` (`id`, `nombre`, `descripcion`, `categoria_id`, `estado_id`, `created_at`) VALUES
(1, 'LENOVO', 'Equipos portátiles, desktops y servidores', 1, 1, '2026-09-30 13:44:04'),
(2, 'HP', 'Laptops, impresoras y workstations empresariales', 1, 1, '2026-09-30 13:44:05'),
(3, 'DELL', 'Portátiles Inspiron, Latitude y Alienware', 1, 1, '2026-09-30 13:44:05'),
(4, 'ASUS', 'Laptops para productividad y serie gamer ROG / TUF', 1, 1, '2026-09-30 13:44:05'),
(5, 'APPLE', 'MacBook, Mac Mini, iMac y dispositivos Apple', 1, 1, '2026-09-30 13:44:05'),
(6, 'EPSON', 'Impresoras EcoTank, matriciales y proyectores', 2, 1, '2026-09-30 13:44:05'),
(7, 'ACER', 'Laptops Aspire, Nitro y Predator', 1, 1, '2026-09-30 13:44:05'),
(8, 'SAMSUNG', 'Monitores, almacenamiento y tablets', 3, 1, '2026-09-30 13:44:06'),
(10, 'FAIL-35417', 'No debe crearse', NULL, 1, '2026-10-06 16:58:55');

-- Estructura de tabla `metodos_pago`
DROP TABLE IF EXISTS `metodos_pago`;
CREATE TABLE `metodos_pago` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'EFECTIVO, YAPE, PLIN, TARJETA, TRANSFERENCIA',
  `nombre` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `requiere_referencia` tinyint(1) DEFAULT '0' COMMENT 'TRUE si requiere Nro de operación',
  `estado_id` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `fk_metodos_pago_estado` (`estado_id`),
  CONSTRAINT `fk_metodos_pago_estado` FOREIGN KEY (`estado_id`) REFERENCES `estados` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo maestro de métodos de pago aceptados';

-- Datos de tabla `metodos_pago` (5 registros)
INSERT INTO `metodos_pago` (`id`, `codigo`, `nombre`, `requiere_referencia`, `estado_id`, `created_at`) VALUES
(1, 'EFECTIVO', 'Efectivo en Soles (Caja mostrador)', 0, 1, '2026-09-24 13:23:41'),
(2, 'YAPE', 'Billetera Digital Yape', 1, 1, '2026-09-24 13:23:41'),
(3, 'PLIN', 'Billetera Digital Plin', 1, 1, '2026-09-24 13:23:41'),
(4, 'TARJETA', 'Tarjeta Débito / Crédito (POS)', 1, 1, '2026-09-24 13:23:41'),
(5, 'TRANSFERENCIA', 'Transferencia Bancaria (BCP/BBVA/Interbank)', 1, 1, '2026-09-24 13:23:41');

-- Estructura de tabla `modelos`
DROP TABLE IF EXISTS `modelos`;
CREATE TABLE `modelos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `marca_id` int DEFAULT NULL,
  `nombre` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `estado_id` int NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_modelos_marca` (`marca_id`),
  KEY `fk_modelos_estado` (`estado_id`),
  CONSTRAINT `fk_modelos_estado` FOREIGN KEY (`estado_id`) REFERENCES `estados` (`id`),
  CONSTRAINT `fk_modelos_marca` FOREIGN KEY (`marca_id`) REFERENCES `marcas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos de tabla `modelos` (15 registros)
INSERT INTO `modelos` (`id`, `marca_id`, `nombre`, `descripcion`, `estado_id`, `created_at`) VALUES
(1, 1, 'ThinkPad X1 Carbon Gen 14 Aura Edition (14" Intel)', 'Ultrabook corporativo de gama ultra premium con IA integrada', 1, '2026-09-30 13:44:06'),
(2, 1, 'Lenovo Googlebook 15', 'Portátil versátil para trabajo en la nube y productividad educativa', 1, '2026-09-30 13:44:06'),
(3, 1, 'ThinkPad T14 Gen 7 (14" Intel)', 'Caballo de batalla corporativo con resistencia militar MIL-STD-810H', 1, '2026-09-30 13:44:07'),
(4, 2, 'HP Pavilion 15-eg0021la', 'Portátil balanceado para oficina y estudiantes avanzados', 1, '2026-09-30 13:44:07'),
(5, 7, 'Predator Helios 18 AI', 'acer Nitro V 17 AI', 1, '2026-09-30 14:01:37'),
(6, 6, 'EcoTank L3250 WiFi', 'Multifuncional inalámbrica con sistema continuo original de tinta', 1, '2026-10-02 15:22:45'),
(7, 4, 'ROG Zephyrus G16 GU605', 'Laptop gamer ultraportátil con Intel Core Ultra 9 y GeForce RTX 4070', 1, '2026-10-06 23:35:24'),
(8, 4, 'TUF Gaming A15 FA507', 'Portátil gamer resistente con AMD Ryzen 7 y GeForce RTX 4060', 1, '2026-10-06 23:35:24'),
(9, 3, 'Latitude 5440 Business', 'Línea corporativa Dell con seguridad avanzada y chasis reforzado', 1, '2026-10-06 23:35:24'),
(10, 3, 'Inspiron 15 3520', 'Portátil para uso diario con pantalla de 120Hz', 1, '2026-10-06 23:35:24'),
(11, 2, 'Victus Gaming 16-r0000la', 'Portátil gaming HP con pantalla de 16.1" y tarjeta gráfica RTX 4060', 1, '2026-10-06 23:35:24'),
(12, 2, 'ProBook 450 G10', 'Laptop profesional con Intel Core i7 y diseño premium duradero', 1, '2026-10-06 23:35:24'),
(13, 1, 'Legion Pro 5 16IRX9', 'Gamer competitiva con pantalla 240Hz 500 nits y RTX 4070', 1, '2026-10-06 23:35:24'),
(14, 5, 'MacBook Air 13.6" M2 Midnight', 'Ultrabook Apple con Chip M2, diseño unibody silencioso sin ventilador', 1, '2026-10-06 23:35:24'),
(15, 7, 'Aspire 5 A515-58M', 'Portátil práctico y eficiente para trabajo multitarea continuo', 1, '2026-10-06 23:35:24');

-- Estructura de tabla `movimientos_inventario`
DROP TABLE IF EXISTS `movimientos_inventario`;
CREATE TABLE `movimientos_inventario` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('TRASLADO','PRESTAMO','CONSUMO_TALLER','DEVOLUCION_TALLER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `producto_id` int NOT NULL,
  `sede_origen_id` int DEFAULT NULL,
  `sede_destino_id` int DEFAULT NULL,
  `cantidad` int NOT NULL DEFAULT '1',
  `series` text COLLATE utf8mb4_unicode_ci COMMENT 'Lista o JSON de series físicas',
  `solicitado_por` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `aprobado_por` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recibido_por` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado_movimiento_id` int NOT NULL DEFAULT '1',
  `motivo` text COLLATE utf8mb4_unicode_ci,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `fecha_solicitud` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_aprobacion` datetime DEFAULT NULL,
  `fecha_envio` datetime DEFAULT NULL,
  `fecha_recepcion` datetime DEFAULT NULL,
  `fecha_devolucion` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `fk_mov_producto` (`producto_id`),
  KEY `fk_mov_origen` (`sede_origen_id`),
  KEY `fk_mov_destino` (`sede_destino_id`),
  KEY `fk_mov_estado` (`estado_movimiento_id`),
  CONSTRAINT `fk_mov_destino` FOREIGN KEY (`sede_destino_id`) REFERENCES `sucursales` (`id`),
  CONSTRAINT `fk_mov_estado` FOREIGN KEY (`estado_movimiento_id`) REFERENCES `estados_movimiento` (`id`),
  CONSTRAINT `fk_mov_origen` FOREIGN KEY (`sede_origen_id`) REFERENCES `sucursales` (`id`),
  CONSTRAINT `fk_mov_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Estructura de tabla `orden_repuestos`
DROP TABLE IF EXISTS `orden_repuestos`;
CREATE TABLE `orden_repuestos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orden_id` int NOT NULL,
  `producto_id` int DEFAULT NULL,
  `codigo` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cantidad` int NOT NULL DEFAULT '1',
  `precio_unitario` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `descontado_stock` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_orden_id` (`orden_id`),
  KEY `idx_producto_id` (`producto_id`),
  CONSTRAINT `fk_orden_repuestos_orden` FOREIGN KEY (`orden_id`) REFERENCES `ordenes_servicio` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Estructura de tabla `orden_servicios_mano_obra`
DROP TABLE IF EXISTS `orden_servicios_mano_obra`;
CREATE TABLE `orden_servicios_mano_obra` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orden_id` int NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `precio` decimal(10,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_orden_servicios_orden` (`orden_id`),
  CONSTRAINT `fk_orden_servicios_orden` FOREIGN KEY (`orden_id`) REFERENCES `ordenes_servicio` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Estructura de tabla `ordenes_servicio`
DROP TABLE IF EXISTS `ordenes_servicio`;
CREATE TABLE `ordenes_servicio` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cliente_id` int NOT NULL,
  `sucursal_id` int NOT NULL DEFAULT '1',
  `equipo_id` int DEFAULT NULL,
  `usuario_recibe_id` int DEFAULT NULL,
  `usuario_tecnico_id` int DEFAULT NULL,
  `descripcion_falla` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `diagnostico` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `solucion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `costo_servicio` decimal(10,2) NOT NULL DEFAULT '0.00',
  `estado_orden_id` int NOT NULL DEFAULT '1',
  `prioridad_id` int DEFAULT NULL,
  `fecha_ingreso` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_promesa` datetime DEFAULT NULL,
  `fecha_entrega` datetime DEFAULT NULL,
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `fk_os_equipo` (`equipo_id`),
  KEY `fk_os_recibe` (`usuario_recibe_id`),
  KEY `fk_os_tecnico` (`usuario_tecnico_id`),
  KEY `fk_os_prioridad` (`prioridad_id`),
  KEY `idx_os_cliente` (`cliente_id`),
  KEY `idx_os_estado` (`estado_orden_id`),
  KEY `idx_os_sucursal` (`sucursal_id`),
  CONSTRAINT `fk_os_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id_cliente`),
  CONSTRAINT `fk_os_equipo` FOREIGN KEY (`equipo_id`) REFERENCES `equipos` (`id`),
  CONSTRAINT `fk_os_estado` FOREIGN KEY (`estado_orden_id`) REFERENCES `estados_orden_servicio` (`id`),
  CONSTRAINT `fk_os_prioridad` FOREIGN KEY (`prioridad_id`) REFERENCES `prioridades_orden` (`id`),
  CONSTRAINT `fk_os_recibe` FOREIGN KEY (`usuario_recibe_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `fk_os_sucursal` FOREIGN KEY (`sucursal_id`) REFERENCES `sucursales` (`id`),
  CONSTRAINT `fk_os_tecnico` FOREIGN KEY (`usuario_tecnico_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Estructura de tabla `permisos`
DROP TABLE IF EXISTS `permisos`;
CREATE TABLE `permisos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Código del módulo (ej: ventas, taller, compras)',
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre del panel o funcionalidad',
  `descripcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `categoria` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Operaciones, Almacén, Taller, Administración',
  `icono` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Icono lucide-react',
  `estado_id` int NOT NULL DEFAULT '1' COMMENT 'FK a estados (1=ACTIVO, 2=INACTIVO)',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `idx_permisos_estado` (`estado_id`),
  CONSTRAINT `fk_permisos_estado` FOREIGN KEY (`estado_id`) REFERENCES `estados` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo de módulos y paneles con permisos del sistema';

-- Datos de tabla `permisos` (15 registros)
INSERT INTO `permisos` (`id`, `codigo`, `nombre`, `descripcion`, `categoria`, `icono`, `estado_id`, `created_at`) VALUES
(1, 'ventas', 'Ventas', 'Gestión de ventas y operaciones comerciales', 'Operaciones', 'Receipt', 1, '2026-09-20 23:22:29'),
(2, 'caja', 'Caja & Finanzas', 'Apertura, arqueo, turnos y balance de caja', 'Operaciones', 'DollarSign', 1, '2026-09-20 23:22:29'),
(3, 'compras', 'Compras & Proveedores', 'Registro de facturas de compra, abastecimiento y proveedores', 'Almacén', 'Truck', 1, '2026-09-20 23:22:29'),
(4, 'panel-recepcion', 'Panel de recepción', 'Ingresos y seguimiento inicial de equipos', 'Taller', 'ClipboardList', 1, '2026-09-20 23:22:29'),
(5, 'panel-almacen', 'Panel de almacén', 'Stock y movimientos entre sedes', 'Almacén', 'Package', 1, '2026-09-20 23:22:29'),
(6, 'taller', 'Servicio Técnico & Taller', 'Recepción, bandeja del técnico, avances y entregas', 'Taller', 'Wrench', 1, '2026-09-20 23:22:29'),
(7, 'equipos', 'Equipos registrados', 'Equipos de clientes e historial de servicios', 'Taller', 'Laptop', 1, '2026-09-20 23:22:29'),
(8, 'clientes', 'Directorio de Clientes', 'Gestión y validación de RUC y DNI', 'Operaciones', 'Users', 1, '2026-09-20 23:22:29'),
(9, 'productos', 'Productos & Stock', 'Catálogo, inventario y control de precios', 'Almacén', 'Package', 1, '2026-09-20 23:22:29'),
(10, 'categorias', 'Categorías', 'Clasificación de productos', 'Almacén', 'Layers', 1, '2026-09-20 23:22:29'),
(11, 'marcas', 'Marcas', 'Registro de marcas del catálogo', 'Almacén', 'Tag', 1, '2026-09-20 23:22:29'),
(12, 'usuarios', 'Gestión de Usuarios & Paneles', 'Usuarios, roles y asignación de permisos a paneles', 'Administración', 'ShieldCheck', 1, '2026-09-20 23:22:29'),
(13, 'config-empresa', 'Datos de Empresa', 'Información general y parámetros operativos', 'Administración', 'Building2', 1, '2026-09-20 23:22:29'),
(14, 'sucursales', 'Sucursales', 'Sedes y almacenes secundarios', 'Administración', 'Network', 1, '2026-09-20 23:22:29'),
(15, 'movimientos', 'Movimientos entre sedes', 'Traslados y control de inventario entre sedes', 'Almacén', 'ArrowLeftRight', 1, '2026-09-20 23:22:29');

-- Estructura de tabla `personas`
DROP TABLE IF EXISTS `personas`;
CREATE TABLE `personas` (
  `id_persona` int NOT NULL AUTO_INCREMENT,
  `tipo_documento_id` int DEFAULT '1',
  `dni` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nombres` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellidos` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `correo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado_id` int NOT NULL DEFAULT '1' COMMENT 'FK a tabla estados (1=ACTIVO, 2=INACTIVO)',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_persona`),
  UNIQUE KEY `dni` (`dni`),
  KEY `idx_personas_dni` (`dni`),
  KEY `idx_personas_estado` (`estado_id`),
  KEY `idx_personas_nombres` (`apellidos`,`nombres`),
  KEY `fk_personas_tipo_doc` (`tipo_documento_id`),
  CONSTRAINT `fk_personas_estado` FOREIGN KEY (`estado_id`) REFERENCES `estados` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_personas_tipo_doc` FOREIGN KEY (`tipo_documento_id`) REFERENCES `tipos_documento` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Datos personales base de clientes y contactos externos';

-- Estructura de tabla `prioridades_orden`
DROP TABLE IF EXISTS `prioridades_orden`;
CREATE TABLE `prioridades_orden` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'NORMAL, ALTA, URGENTE',
  `nombre` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nivel_orden` int NOT NULL DEFAULT '1' COMMENT '1=Bajo, 2=Medio, 3=Alto',
  `color_hex` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '#3B82F6',
  `estado_id` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `fk_prioridades_estado` (`estado_id`),
  CONSTRAINT `fk_prioridades_estado` FOREIGN KEY (`estado_id`) REFERENCES `estados` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo de niveles de prioridad de órdenes de servicio';

-- Datos de tabla `prioridades_orden` (3 registros)
INSERT INTO `prioridades_orden` (`id`, `codigo`, `nombre`, `nivel_orden`, `color_hex`, `estado_id`, `created_at`) VALUES
(1, 'NORMAL', 'Prioridad Normal (Atención regular)', 1, '#3B82F6', 1, '2026-09-24 13:23:41'),
(2, 'ALTA', 'Prioridad Alta (Diagnóstico en 24h)', 2, '#F59E0B', 1, '2026-09-24 13:23:41'),
(3, 'URGENTE', 'Prioridad Urgente (Atención inmediata)', 3, '#EF4444', 1, '2026-09-24 13:23:41');

-- Estructura de tabla `producto_detalle`
DROP TABLE IF EXISTS `producto_detalle`;
CREATE TABLE `producto_detalle` (
  `id` int NOT NULL AUTO_INCREMENT,
  `producto_id` int NOT NULL,
  `tipo_detalle_id` int DEFAULT NULL,
  `valor` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_pd_producto` (`producto_id`),
  CONSTRAINT `fk_pd_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Estructura de tabla `producto_series_garantia`
DROP TABLE IF EXISTS `producto_series_garantia`;
CREATE TABLE `producto_series_garantia` (
  `id` int NOT NULL AUTO_INCREMENT,
  `venta_id` int DEFAULT NULL,
  `producto_id` int NOT NULL,
  `numero_serie` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cliente_id` int DEFAULT NULL,
  `meses_garantia` int NOT NULL DEFAULT '12',
  `fecha_venta` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado_garantia` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVA',
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero_serie` (`numero_serie`),
  KEY `idx_psg_serie` (`numero_serie`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Estructura de tabla `producto_stock_sede`
DROP TABLE IF EXISTS `producto_stock_sede`;
CREATE TABLE `producto_stock_sede` (
  `id` int NOT NULL AUTO_INCREMENT,
  `producto_id` int NOT NULL,
  `sucursal_id` int NOT NULL,
  `stock` int NOT NULL DEFAULT '0',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pss` (`producto_id`,`sucursal_id`),
  KEY `fk_pss_sucursal` (`sucursal_id`),
  CONSTRAINT `fk_pss_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`),
  CONSTRAINT `fk_pss_sucursal` FOREIGN KEY (`sucursal_id`) REFERENCES `sucursales` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Estructura de tabla `producto_unidades`
DROP TABLE IF EXISTS `producto_unidades`;
CREATE TABLE `producto_unidades` (
  `id` int NOT NULL AUTO_INCREMENT,
  `producto_id` int NOT NULL,
  `sucursal_id` int NOT NULL DEFAULT '1',
  `numero_serie` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado_unidad_id` int NOT NULL DEFAULT '1',
  `tipo_destino` enum('VENTA','SERVICIO_TALLER','MIXTO') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'VENTA',
  `disponible_venta` tinyint(1) NOT NULL DEFAULT '1',
  `condicion` enum('NUEVO','USADO','OPEN_BOX','DANADO_RECEPCION','DEFECTUOSO') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NUEVO',
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `costo_adquisicion` decimal(10,2) DEFAULT NULL,
  `fecha_ingreso` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_pu_sucursal` (`sucursal_id`),
  KEY `fk_pu_estado_unidad` (`estado_unidad_id`),
  KEY `idx_pu_serie` (`numero_serie`),
  KEY `idx_pu_prod_estado` (`producto_id`,`estado_unidad_id`),
  CONSTRAINT `fk_pu_estado_unidad` FOREIGN KEY (`estado_unidad_id`) REFERENCES `estados_unidad` (`id`),
  CONSTRAINT `fk_pu_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pu_sucursal` FOREIGN KEY (`sucursal_id`) REFERENCES `sucursales` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Estructura de tabla `productos`
DROP TABLE IF EXISTS `productos`;
CREATE TABLE `productos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nombre` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `categoria_id` int DEFAULT NULL,
  `marca_id` int DEFAULT NULL,
  `modelo_id` int DEFAULT NULL,
  `requiere_serie` tinyint(1) NOT NULL DEFAULT '0',
  `disponible_venta` tinyint(1) NOT NULL DEFAULT '1',
  `tipo_destino` enum('VENTA','SERVICIO_TALLER','MIXTO') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'VENTA',
  `precio_venta` decimal(10,2) NOT NULL DEFAULT '0.00',
  `precio_costo` decimal(10,2) NOT NULL DEFAULT '0.00',
  `stock_minimo` int NOT NULL DEFAULT '0',
  `estado_id` int NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_productos_categoria` (`categoria_id`),
  KEY `fk_productos_marca` (`marca_id`),
  KEY `fk_productos_estado` (`estado_id`),
  KEY `fk_productos_modelo` (`modelo_id`),
  CONSTRAINT `fk_productos_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`),
  CONSTRAINT `fk_productos_estado` FOREIGN KEY (`estado_id`) REFERENCES `estados` (`id`),
  CONSTRAINT `fk_productos_marca` FOREIGN KEY (`marca_id`) REFERENCES `marcas` (`id`),
  CONSTRAINT `fk_productos_modelo` FOREIGN KEY (`modelo_id`) REFERENCES `modelos` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Estructura de tabla `proveedores`
DROP TABLE IF EXISTS `proveedores`;
CREATE TABLE `proveedores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ruc` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `razon_social` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre_contacto` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `estado_id` int NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_proveedores_ruc` (`ruc`),
  KEY `fk_proveedores_estado` (`estado_id`),
  CONSTRAINT `fk_proveedores_estado` FOREIGN KEY (`estado_id`) REFERENCES `estados` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos de tabla `proveedores` (4 registros)
INSERT INTO `proveedores` (`id`, `ruc`, `razon_social`, `nombre_contacto`, `telefono`, `email`, `direccion`, `estado_id`, `created_at`, `updated_at`) VALUES
(1, '20100154308', 'GRUPO DELTRON S.A.', 'Jorge Villanueva (Ejecutivo Mayorista)', '+51 (01) 415-0100', 'ventas.chiclayo@deltron.com.pe', 'Av. Nicolás Arriola 314, La Victoria, Lima (Despacho Chiclayo)', 1, '2026-10-08 15:40:52', '2026-10-08 15:40:52'),
(2, '20502123491', 'INTCOMEX DEL PERU S.A.C.', 'Patricia Alarcón', '+51 (01) 712-4000', 'contacto.peru@intcomex.com', 'Av. Manuel Olguín 325 Of. 1102, Surco, Lima', 1, '2026-10-08 15:40:52', '2026-10-08 15:40:52'),
(3, '20451298401', 'TECH DATA PERU S.A.C.', 'Miguel Sandoval', '+51 987 654 321', 'ventas@techdata.com.pe', 'Calle Los Negocios 182, Surquillo, Lima', 1, '2026-10-08 15:40:52', '2026-10-08 15:40:52'),
(4, '20601239845', 'IMPORTACIONES Y REPUESTOS NORTE E.I.R.L.', 'Carlos Burga', '+51 974 555 123', 'repuestos.norte@gmail.com', 'Calle Alfonso Ugarte 450, Chiclayo', 1, '2026-10-08 15:40:52', '2026-10-08 15:40:52');

-- Estructura de tabla `rol_permisos`
DROP TABLE IF EXISTS `rol_permisos`;
CREATE TABLE `rol_permisos` (
  `rol_id` int NOT NULL COMMENT 'FK a roles',
  `permiso_id` int NOT NULL COMMENT 'FK a permisos',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`rol_id`,`permiso_id`),
  KEY `idx_rol_permisos_rol` (`rol_id`),
  KEY `idx_rol_permisos_permiso` (`permiso_id`),
  CONSTRAINT `fk_rol_permisos_permiso` FOREIGN KEY (`permiso_id`) REFERENCES `permisos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_rol_permisos_rol` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Permisos predeterminados asignados a cada rol del sistema';

-- Datos de tabla `rol_permisos` (24 registros)
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES
(7, 1, '2026-09-24 16:41:26'),
(7, 2, '2026-09-24 16:41:26'),
(7, 3, '2026-09-24 16:41:26'),
(7, 4, '2026-09-24 16:41:26'),
(7, 5, '2026-09-24 16:41:26'),
(7, 6, '2026-09-24 16:41:26'),
(7, 7, '2026-09-24 16:41:26'),
(7, 8, '2026-09-24 16:41:26'),
(7, 9, '2026-09-24 16:41:26'),
(7, 10, '2026-09-24 16:41:26'),
(7, 11, '2026-09-24 16:41:26'),
(7, 12, '2026-09-24 16:41:26'),
(7, 13, '2026-09-24 16:41:26'),
(7, 14, '2026-09-24 16:41:26'),
(7, 15, '2026-09-24 16:41:26'),
(13, 1, '2026-10-06 23:07:54'),
(13, 4, '2026-10-06 23:07:54'),
(13, 6, '2026-10-06 23:07:54'),
(13, 8, '2026-10-06 23:07:54'),
(14, 5, '2026-10-06 23:10:06'),
(14, 6, '2026-10-06 23:10:06'),
(14, 7, '2026-10-06 23:10:06'),
(14, 9, '2026-10-06 23:10:06'),
(15, 8, '2026-10-07 00:26:43');

-- Estructura de tabla `roles`
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ADMIN, SECRETARIA, TECNICO, FACTURADOR, ALMACEN, CAJERO',
  `nombre` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre legible del rol',
  `descripcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modulos_predeterminados` json DEFAULT NULL COMMENT 'Array JSON de m├│dulos base heredados: ["ventas","caja"]',
  `es_sistema` tinyint(1) DEFAULT '0' COMMENT 'TRUE = no se puede eliminar ni renombrar',
  `estado_id` int NOT NULL DEFAULT '1' COMMENT 'FK a estados (1=ACTIVO, 2=INACTIVO)',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `idx_roles_codigo` (`codigo`),
  KEY `idx_roles_estado` (`estado_id`),
  CONSTRAINT `fk_roles_estado` FOREIGN KEY (`estado_id`) REFERENCES `estados` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Roles del sistema con m├│dulos predeterminados por rol';

-- Datos de tabla `roles` (4 registros)
INSERT INTO `roles` (`id`, `codigo`, `nombre`, `descripcion`, `modulos_predeterminados`, `es_sistema`, `estado_id`, `created_at`, `updated_at`) VALUES
(7, 'SUPERADMIN', 'Super Administrador', 'Acceso total y configuración de roles del sistema', 'ventas,caja,compras,panel-recepcion,panel-almacen,taller,equipos,clientes,productos,categorias,marcas,usuarios,config-empresa,sucursales,movimientos', 1, 1, '2026-10-06 15:18:24', '2026-10-06 15:18:24'),
(13, 'RECEPCION', 'Recepcion', 'Secre', 'clientes,ventas,panel-recepcion,taller', 0, 1, '2026-10-06 23:07:54', '2026-10-06 23:07:54'),
(14, 'TECNICO', 'Tecnico', '', 'panel-almacen,taller,equipos,productos', 0, 1, '2026-10-06 23:10:06', '2026-10-06 23:10:06'),
(15, 'LOGISTICA', 'Logística', 'Area logitica', 'clientes', 0, 1, '2026-10-07 00:26:43', '2026-10-07 00:26:43');

-- Estructura de tabla `sesiones_tokens`
DROP TABLE IF EXISTS `sesiones_tokens`;
CREATE TABLE `sesiones_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `token_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '├Ültimos 32 chars del JWT como identificador',
  `ip_origen` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'IP del cliente (IPv4/IPv6)',
  `user_agent` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expira_en` datetime NOT NULL,
  `revocado` tinyint(1) DEFAULT '0' COMMENT 'TRUE = sesi├│n cerrada o revocada',
  `revocado_en` datetime DEFAULT NULL COMMENT 'Timestamp de revocaci├│n',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sesiones_token` (`token_hash`),
  KEY `idx_sesiones_usuario` (`usuario_id`,`revocado`),
  KEY `idx_sesiones_expira` (`expira_en`),
  CONSTRAINT `fk_sesiones_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Auditor├¡a de sesiones JWT activas y revocadas';

-- Estructura de tabla `sucursales`
DROP TABLE IF EXISTS `sucursales`;
CREATE TABLE `sucursales` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empresa_id` int NOT NULL,
  `codigo` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'C├│digo correlativo: 0000, 0001, etc.',
  `nombre` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `direccion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `es_principal` tinyint(1) DEFAULT '0' COMMENT 'TRUE = sede principal de la empresa',
  `estado_id` int NOT NULL DEFAULT '1' COMMENT 'FK a estados (1=ACTIVO, 2=INACTIVO)',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_sucursales_empresa` (`empresa_id`),
  KEY `idx_sucursales_codigo` (`codigo`),
  KEY `idx_sucursales_estado` (`estado_id`),
  CONSTRAINT `fk_sucursales_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_sucursales_estado` FOREIGN KEY (`estado_id`) REFERENCES `estados` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sedes y almacenes operativos';

-- Datos de tabla `sucursales` (6 registros)
INSERT INTO `sucursales` (`id`, `empresa_id`, `codigo`, `nombre`, `direccion`, `telefono`, `es_principal`, `estado_id`, `created_at`, `updated_at`) VALUES
(1, 1, '0000', 'Principal - Chiclayo Centro', 'AV. PEDRO RUIZ NRO. 349 INT. 09C, Chiclayo', '(074) 283921', 1, 1, '2026-09-20 18:21:30', '2026-09-30 06:47:53'),
(2, 1, '0001', 'Sucursal Lambayeque Norte', 'Av. Ramón Castilla 450, Lambayeque', '(074) 281190', 0, 1, '2026-09-20 18:21:30', '2026-09-30 06:47:53'),
(3, 1, '0003', 'CHICLAYO BALTA', 'AV.656', '48554699//9', 0, 1, '2026-09-30 06:47:28', '2026-09-30 06:47:38'),
(4, 1, '0002', 'Almacén Central Pomalca', 'Carretera Pomalca Km 4.5', '(074) 609923', 0, 1, '2026-09-30 06:47:53', '2026-09-30 06:47:53'),
(5, 1, '0004', 'MALL AVENTURA', 'MALL AVENTURA', '658962656956', 0, 1, '2026-09-30 07:54:46', '2026-09-30 07:54:46'),
(6, 1, '0005', 'LAMBEYEQUE', 'REAL PLAZA LAMAAQUEYEQUE', '074-626495', 0, 1, '2026-09-30 08:13:36', '2026-09-30 08:13:36');

-- Estructura de tabla `tecnicos`
DROP TABLE IF EXISTS `tecnicos`;
CREATE TABLE `tecnicos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `especialidad` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado_id` int NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id` (`usuario_id`),
  KEY `fk_tecnicos_estado` (`estado_id`),
  CONSTRAINT `fk_tecnicos_estado` FOREIGN KEY (`estado_id`) REFERENCES `estados` (`id`),
  CONSTRAINT `fk_tecnicos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Estructura de tabla `tipos_comprobante`
DROP TABLE IF EXISTS `tipos_comprobante`;
CREATE TABLE `tipos_comprobante` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'BOLETA, FACTURA, NOTA_VENTA, GUIA_REMISION',
  `nombre` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `serie_defecto` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'B001',
  `estado_id` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `fk_tipos_comp_estado` (`estado_id`),
  CONSTRAINT `fk_tipos_comp_estado` FOREIGN KEY (`estado_id`) REFERENCES `estados` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo maestro de tipos de comprobante de pago';

-- Datos de tabla `tipos_comprobante` (4 registros)
INSERT INTO `tipos_comprobante` (`id`, `codigo`, `nombre`, `serie_defecto`, `estado_id`, `created_at`) VALUES
(1, 'BOLETA', 'Boleta de Venta Electrónica', 'B001', 1, '2026-09-24 08:23:41'),
(2, 'FACTURA', 'Factura Electrónica', 'F001', 1, '2026-09-24 08:23:41'),
(3, 'NOTA_VENTA', 'Nota de Venta Interna', 'NV01', 1, '2026-09-24 08:23:41'),
(4, 'GUIA_REMISION', 'Guía de Remisión Remitente', 'T001', 1, '2026-09-24 08:23:41');

-- Estructura de tabla `tipos_documento`
DROP TABLE IF EXISTS `tipos_documento`;
CREATE TABLE `tipos_documento` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'DNI, RUC, CE, PASAPORTE',
  `nombre` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `longitud_exacta` tinyint unsigned DEFAULT NULL COMMENT '8 para DNI, 11 para RUC',
  `estado_id` int NOT NULL DEFAULT '1' COMMENT 'FK a estados',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `fk_tipos_doc_estado` (`estado_id`),
  CONSTRAINT `fk_tipos_doc_estado` FOREIGN KEY (`estado_id`) REFERENCES `estados` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo maestro de tipos de documento de identidad';

-- Datos de tabla `tipos_documento` (4 registros)
INSERT INTO `tipos_documento` (`id`, `codigo`, `nombre`, `longitud_exacta`, `estado_id`, `created_at`) VALUES
(1, 'DNI', 'Documento Nacional de Identidad', 8, 1, '2026-09-24 08:23:41'),
(2, 'RUC', 'Registro Único de Contribuyentes', 11, 1, '2026-09-24 08:23:41'),
(3, 'CE', 'Carnet de Extranjería', 9, 1, '2026-09-24 08:23:41'),
(4, 'PASAPORTE', 'Pasaporte', 12, 1, '2026-09-24 08:23:41');

-- Estructura de tabla `tipos_equipo`
DROP TABLE IF EXISTS `tipos_equipo`;
CREATE TABLE `tipos_equipo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'LAPTOP, PC_ESCRITORIO, etc.',
  `nombre` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado_id` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `fk_tipos_equipo_estado` (`estado_id`),
  CONSTRAINT `fk_tipos_equipo_estado` FOREIGN KEY (`estado_id`) REFERENCES `estados` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo maestro de tipos de equipo recibidos en taller';

-- Datos de tabla `tipos_equipo` (7 registros)
INSERT INTO `tipos_equipo` (`id`, `codigo`, `nombre`, `estado_id`, `created_at`) VALUES
(1, 'LAPTOP', 'Laptop / Notebook', 1, '2026-09-24 08:23:41'),
(2, 'PC_ESCRITORIO', 'Computadora de Escritorio / Torre', 1, '2026-09-24 08:23:41'),
(3, 'IMPRESORA', 'Impresora / Multifuncional', 1, '2026-09-24 08:23:41'),
(4, 'MONITOR', 'Monitor / Pantalla', 1, '2026-09-24 08:23:41'),
(5, 'COMPONENTE', 'Componente / Tarjeta / Placa', 1, '2026-09-24 08:23:41'),
(6, 'SERVIDOR', 'Servidor / Rack', 1, '2026-09-24 08:23:41'),
(7, 'OTRO', 'Otro Dispositivo Electrónico', 1, '2026-09-24 08:23:41');

-- Estructura de tabla `tipos_producto_detalle`
DROP TABLE IF EXISTS `tipos_producto_detalle`;
CREATE TABLE `tipos_producto_detalle` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado_id` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `fk_tipos_prod_det_estado` (`estado_id`),
  CONSTRAINT `fk_tipos_prod_det_estado` FOREIGN KEY (`estado_id`) REFERENCES `estados` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo de destino de unidades individuales de producto';

-- Datos de tabla `tipos_producto_detalle` (3 registros)
INSERT INTO `tipos_producto_detalle` (`id`, `codigo`, `nombre`, `estado_id`, `created_at`) VALUES
(1, 'VENTA', 'Unidad para Venta Directa', 1, '2026-09-24 08:23:41'),
(2, 'SERVICIO', 'Unidad asignada a Taller / Servicio Técnico', 1, '2026-09-24 08:23:41'),
(3, 'GARANTIA', 'Unidad de Reemplazo por Garantía', 1, '2026-09-24 08:23:41');

-- Estructura de tabla `usuario_permisos`
DROP TABLE IF EXISTS `usuario_permisos`;
CREATE TABLE `usuario_permisos` (
  `usuario_id` int NOT NULL COMMENT 'FK a usuarios',
  `permiso_id` int NOT NULL COMMENT 'FK a permisos',
  `permitido` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1 = Concedido, 0 = Denegado',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`usuario_id`,`permiso_id`),
  KEY `idx_usuario_permisos_usuario` (`usuario_id`),
  KEY `idx_usuario_permisos_permiso` (`permiso_id`),
  CONSTRAINT `fk_usuario_permisos_permiso` FOREIGN KEY (`permiso_id`) REFERENCES `permisos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_usuario_permisos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Permisos específicos por usuario para acceso a paneles';

-- Estructura de tabla `usuarios`
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre de usuario para login',
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Hash bcrypt de la contrase├▒a',
  `nombre_completo` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono_cifrado` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Tel├®fono encriptado con AES-256-CBC',
  `tipo_documento_id` int NOT NULL DEFAULT '1',
  `numero_documento_cifrado` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nro de documento encriptado con AES-256-CBC',
  `persona_id` int DEFAULT NULL,
  `rol_id` int NOT NULL,
  `sucursal_id` int DEFAULT NULL COMMENT 'Sede base asignada al usuario',
  `estado_id` int NOT NULL DEFAULT '1' COMMENT 'FK a estados (1=ACTIVO, 2=INACTIVO, 3=SUSPENDIDO)',
  `avatar_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `requiere_cambio_password` tinyint(1) DEFAULT '1' COMMENT 'Forzar cambio de contrase├▒a en primer login',
  `intentos_fallidos` tinyint unsigned DEFAULT '0' COMMENT 'Contador de intentos fallidos de login (max 5)',
  `bloqueado_hasta` datetime DEFAULT NULL COMMENT 'Fecha/hora hasta cuando est├í bloqueado por intentos fallidos',
  `ultimo_acceso` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL COMMENT 'ID del admin que cre├│ esta cuenta',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `persona_id` (`persona_id`),
  KEY `fk_usuarios_sucursal` (`sucursal_id`),
  KEY `idx_usuarios_username` (`username`),
  KEY `idx_usuarios_email` (`email`),
  KEY `idx_usuarios_rol` (`rol_id`),
  KEY `idx_usuarios_estado` (`estado_id`),
  KEY `fk_usuarios_tipo_doc` (`tipo_documento_id`),
  CONSTRAINT `fk_usuarios_estado` FOREIGN KEY (`estado_id`) REFERENCES `estados` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_usuarios_persona` FOREIGN KEY (`persona_id`) REFERENCES `personas` (`id_persona`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_usuarios_rol` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_usuarios_sucursal` FOREIGN KEY (`sucursal_id`) REFERENCES `sucursales` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_usuarios_tipo_doc` FOREIGN KEY (`tipo_documento_id`) REFERENCES `tipos_documento` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cuentas del personal con credenciales y datos sensibles cifrados';

-- Datos de tabla `usuarios` (1 registros)
INSERT INTO `usuarios` (`id`, `username`, `password_hash`, `nombre_completo`, `email`, `telefono_cifrado`, `tipo_documento_id`, `numero_documento_cifrado`, `persona_id`, `rol_id`, `sucursal_id`, `estado_id`, `avatar_url`, `requiere_cambio_password`, `intentos_fallidos`, `bloqueado_hasta`, `ultimo_acceso`, `created_at`, `updated_at`, `created_by`) VALUES
(1, 'superadmin', '$2b$10$k.FIJ42XepBirgt5FHRLAOgN0q7eDPFNT9vLI4GC/rKMXQDEzv4Jm', 'Super Administrador', 'superadmin@mgsolutions.pe', NULL, 1, NULL, NULL, 7, 1, 1, 'SA', 0, 0, NULL, '2026-11-03 03:12:49', '2026-10-06 22:19:00', '2026-11-03 03:12:49', NULL);

-- Estructura de tabla `vendedores`
DROP TABLE IF EXISTS `vendedores`;
CREATE TABLE `vendedores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `comision_pct` decimal(5,2) NOT NULL DEFAULT '0.00',
  `estado_id` int NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id` (`usuario_id`),
  KEY `fk_vendedores_estado` (`estado_id`),
  CONSTRAINT `fk_vendedores_estado` FOREIGN KEY (`estado_id`) REFERENCES `estados` (`id`),
  CONSTRAINT `fk_vendedores_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Estructura de tabla `ventas`
DROP TABLE IF EXISTS `ventas`;
CREATE TABLE `ventas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo_comprobante` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_comprobante_id` int DEFAULT NULL,
  `cliente_id` int DEFAULT NULL,
  `usuario_id` int DEFAULT NULL,
  `sucursal_id` int DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
  `igv` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `metodo_pago_id` int DEFAULT NULL,
  `estado_id` int NOT NULL DEFAULT '1',
  `fecha_venta` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_comprobante` (`codigo_comprobante`),
  KEY `fk_ventas_usuario` (`usuario_id`),
  KEY `fk_ventas_sucursal` (`sucursal_id`),
  KEY `fk_ventas_comprobante` (`tipo_comprobante_id`),
  KEY `fk_ventas_metodo_pago` (`metodo_pago_id`),
  KEY `fk_ventas_estado` (`estado_id`),
  KEY `idx_ventas_cliente` (`cliente_id`),
  KEY `idx_ventas_fecha` (`fecha_venta`),
  CONSTRAINT `fk_ventas_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id_cliente`),
  CONSTRAINT `fk_ventas_comprobante` FOREIGN KEY (`tipo_comprobante_id`) REFERENCES `tipos_comprobante` (`id`),
  CONSTRAINT `fk_ventas_estado` FOREIGN KEY (`estado_id`) REFERENCES `estados` (`id`),
  CONSTRAINT `fk_ventas_metodo_pago` FOREIGN KEY (`metodo_pago_id`) REFERENCES `metodos_pago` (`id`),
  CONSTRAINT `fk_ventas_sucursal` FOREIGN KEY (`sucursal_id`) REFERENCES `sucursales` (`id`),
  CONSTRAINT `fk_ventas_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;
