-- =====================================================================
-- MG SOLUTIONS ERP - ESQUEMA Y DATOS COMPLETOS DE LA BASE DE DATOS
-- Base de Datos: mg_solutions_db
-- Fecha de generación: 2026-10-06T06:15:15.990Z
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `mg_solutions_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `mg_solutions_db`;

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET NAMES utf8mb4;

-- -------------------------------------------------------------------
-- Estructura de tabla para: `categorias`
-- -------------------------------------------------------------------
DROP TABLE IF EXISTS `categorias`;
CREATE TABLE `categorias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `requiere_serie` tinyint(1) NOT NULL DEFAULT '0',
  `estado_id` int NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categorias_nombre` (`nombre`),
  KEY `fk_categorias_estado` (`estado_id`),
  CONSTRAINT `fk_categorias_estado` FOREIGN KEY (`estado_id`) REFERENCES `estados` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos volcados para: `categorias` (7 registros)
INSERT INTO `categorias` (`id`, `nombre`, `descripcion`, `requiere_serie`, `estado_id`, `created_at`) VALUES (1, 'LAPTOPS & NOTEBOOKS', 'Laptops de oficina, gaming, ultrabooks y estaciones de trabajo', 1, 1, '2026-09-30 09:32:40');
INSERT INTO `categorias` (`id`, `nombre`, `descripcion`, `requiere_serie`, `estado_id`, `created_at`) VALUES (2, 'IMPRESORAS & MULTIFUNCIONALES', 'Impresoras EcoTank, láser monocromáticas y multifuncionales', 1, 1, '2026-09-30 09:32:40');
INSERT INTO `categorias` (`id`, `nombre`, `descripcion`, `requiere_serie`, `estado_id`, `created_at`) VALUES (3, 'MONITORES & PANTALLAS', 'Monitores de oficina, gaming alta tasa de refresco y diseño', 1, 1, '2026-09-30 09:32:40');
INSERT INTO `categorias` (`id`, `nombre`, `descripcion`, `requiere_serie`, `estado_id`, `created_at`) VALUES (4, 'PERIFÉRICOS & ACCESORIOS', 'Teclados, mouses, auriculares, webcams y almohadillas', 0, 1, '2026-09-30 09:32:40');
INSERT INTO `categorias` (`id`, `nombre`, `descripcion`, `requiere_serie`, `estado_id`, `created_at`) VALUES (5, 'COMPONENTES & HARDWARE', 'Memorias RAM, discos SSD NVMe, fuentes de poder y tarjetas de video', 0, 1, '2026-09-30 09:32:40');
INSERT INTO `categorias` (`id`, `nombre`, `descripcion`, `requiere_serie`, `estado_id`, `created_at`) VALUES (6, 'REPUESTOS DE TALLER', 'Pantallas, teclados de reemplazo, baterías, cargadores y ventiladores', 0, 1, '2026-09-30 09:32:40');
INSERT INTO `categorias` (`id`, `nombre`, `descripcion`, `requiere_serie`, `estado_id`, `created_at`) VALUES (7, 'SUMINISTROS & TINTAS', 'Botellas de tinta original, tóner, cables de poder y adaptadores', 0, 1, '2026-09-30 09:32:41');

-- -------------------------------------------------------------------
-- Estructura de tabla para: `clientes`
-- -------------------------------------------------------------------
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos volcados para: `clientes` (3 registros)
INSERT INTO `clientes` (`id_cliente`, `id_persona`, `ruc`, `razon_social`, `nombre_empresa`, `estado_id`, `created_at`, `updated_at`) VALUES (1, 13, NULL, 'ARNOLD JEAMPIERRE CACHAY HUANCAS', NULL, 1, '2026-09-25 21:49:12', '2026-09-26 02:08:26');
INSERT INTO `clientes` (`id_cliente`, `id_persona`, `ruc`, `razon_social`, `nombre_empresa`, `estado_id`, `created_at`, `updated_at`) VALUES (2, 14, NULL, 'GUADALUPE TORRES', NULL, 1, '2026-09-26 02:06:41', '2026-09-26 02:07:52');
INSERT INTO `clientes` (`id_cliente`, `id_persona`, `ruc`, `razon_social`, `nombre_empresa`, `estado_id`, `created_at`, `updated_at`) VALUES (3, 15, NULL, 'SAMSUNG', NULL, 1, '2026-09-26 07:13:20', '2026-09-26 07:28:54');

-- -------------------------------------------------------------------
-- Estructura de tabla para: `codigos_recuperacion`
-- -------------------------------------------------------------------
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
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='C├│digos OTP temporales para recuperaci├│n de contrase├▒a';

-- Datos volcados para: `codigos_recuperacion` (22 registros)
INSERT INTO `codigos_recuperacion` (`id`, `usuario_id`, `codigo`, `expira_en`, `utilizado`, `created_at`) VALUES (1, 11, '586205', '2026-09-30 04:00:52', 1, '2026-09-30 03:45:52');
INSERT INTO `codigos_recuperacion` (`id`, `usuario_id`, `codigo`, `expira_en`, `utilizado`, `created_at`) VALUES (2, 12, '320268', '2026-09-30 05:18:51', 1, '2026-09-30 05:03:51');
INSERT INTO `codigos_recuperacion` (`id`, `usuario_id`, `codigo`, `expira_en`, `utilizado`, `created_at`) VALUES (3, 11, '996483', '2026-09-30 05:19:39', 1, '2026-09-30 05:04:39');
INSERT INTO `codigos_recuperacion` (`id`, `usuario_id`, `codigo`, `expira_en`, `utilizado`, `created_at`) VALUES (4, 11, '868467', '2026-09-30 05:19:58', 1, '2026-09-30 05:04:58');
INSERT INTO `codigos_recuperacion` (`id`, `usuario_id`, `codigo`, `expira_en`, `utilizado`, `created_at`) VALUES (5, 11, '795815', '2026-09-30 05:24:16', 1, '2026-09-30 05:09:16');
INSERT INTO `codigos_recuperacion` (`id`, `usuario_id`, `codigo`, `expira_en`, `utilizado`, `created_at`) VALUES (6, 11, '382272', '2026-09-30 05:24:49', 1, '2026-09-30 05:09:49');
INSERT INTO `codigos_recuperacion` (`id`, `usuario_id`, `codigo`, `expira_en`, `utilizado`, `created_at`) VALUES (7, 11, '697965', '2026-09-30 05:31:04', 1, '2026-09-30 05:16:04');
INSERT INTO `codigos_recuperacion` (`id`, `usuario_id`, `codigo`, `expira_en`, `utilizado`, `created_at`) VALUES (8, 11, '509944', '2026-09-30 05:32:32', 1, '2026-09-30 05:17:32');
INSERT INTO `codigos_recuperacion` (`id`, `usuario_id`, `codigo`, `expira_en`, `utilizado`, `created_at`) VALUES (9, 11, '153131', '2026-09-30 05:33:24', 1, '2026-09-30 05:18:24');
INSERT INTO `codigos_recuperacion` (`id`, `usuario_id`, `codigo`, `expira_en`, `utilizado`, `created_at`) VALUES (10, 11, '274430', '2026-09-30 05:40:36', 1, '2026-09-30 05:25:36');
INSERT INTO `codigos_recuperacion` (`id`, `usuario_id`, `codigo`, `expira_en`, `utilizado`, `created_at`) VALUES (11, 11, '641979', '2026-09-30 05:40:46', 1, '2026-09-30 05:25:46');
INSERT INTO `codigos_recuperacion` (`id`, `usuario_id`, `codigo`, `expira_en`, `utilizado`, `created_at`) VALUES (12, 11, '319029', '2026-09-30 05:56:17', 0, '2026-09-30 05:41:17');
INSERT INTO `codigos_recuperacion` (`id`, `usuario_id`, `codigo`, `expira_en`, `utilizado`, `created_at`) VALUES (13, 13, '236325', '2026-10-02 10:02:04', 1, '2026-10-02 09:47:04');
INSERT INTO `codigos_recuperacion` (`id`, `usuario_id`, `codigo`, `expira_en`, `utilizado`, `created_at`) VALUES (14, 13, '538258', '2026-10-02 10:18:25', 1, '2026-10-02 10:03:25');
INSERT INTO `codigos_recuperacion` (`id`, `usuario_id`, `codigo`, `expira_en`, `utilizado`, `created_at`) VALUES (15, 13, '367594', '2026-10-02 10:26:02', 1, '2026-10-02 10:11:02');
INSERT INTO `codigos_recuperacion` (`id`, `usuario_id`, `codigo`, `expira_en`, `utilizado`, `created_at`) VALUES (16, 13, '167129', '2026-10-02 10:29:21', 1, '2026-10-02 10:14:21');
INSERT INTO `codigos_recuperacion` (`id`, `usuario_id`, `codigo`, `expira_en`, `utilizado`, `created_at`) VALUES (17, 13, '351080', '2026-10-02 10:30:17', 0, '2026-10-02 10:15:17');
INSERT INTO `codigos_recuperacion` (`id`, `usuario_id`, `codigo`, `expira_en`, `utilizado`, `created_at`) VALUES (18, 14, '994511', '2026-10-03 06:35:35', 1, '2026-10-03 06:20:35');
INSERT INTO `codigos_recuperacion` (`id`, `usuario_id`, `codigo`, `expira_en`, `utilizado`, `created_at`) VALUES (19, 14, '561847', '2026-10-03 06:35:41', 1, '2026-10-03 06:20:41');
INSERT INTO `codigos_recuperacion` (`id`, `usuario_id`, `codigo`, `expira_en`, `utilizado`, `created_at`) VALUES (20, 14, '800128', '2026-10-03 06:36:48', 1, '2026-10-03 06:21:48');
INSERT INTO `codigos_recuperacion` (`id`, `usuario_id`, `codigo`, `expira_en`, `utilizado`, `created_at`) VALUES (21, 14, '224087', '2026-10-03 06:37:20', 0, '2026-10-03 06:22:20');
INSERT INTO `codigos_recuperacion` (`id`, `usuario_id`, `codigo`, `expira_en`, `utilizado`, `created_at`) VALUES (22, 12, '921070', '2026-10-03 06:39:34', 1, '2026-10-03 06:24:34');

-- -------------------------------------------------------------------
-- Estructura de tabla para: `compras`
-- -------------------------------------------------------------------
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

-- -------------------------------------------------------------------
-- Estructura de tabla para: `detalle_compras`
-- -------------------------------------------------------------------
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

-- -------------------------------------------------------------------
-- Estructura de tabla para: `detalle_modelo`
-- -------------------------------------------------------------------
DROP TABLE IF EXISTS `detalle_modelo`;
CREATE TABLE `detalle_modelo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `modelo_id` int NOT NULL,
  `atributo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_dm_modelo` (`modelo_id`),
  CONSTRAINT `fk_dm_modelo` FOREIGN KEY (`modelo_id`) REFERENCES `modelos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos volcados para: `detalle_modelo` (30 registros)
INSERT INTO `detalle_modelo` (`id`, `modelo_id`, `atributo`, `valor`) VALUES (1, 1, 'Procesador', 'Intel Core Ultra 7 258V con NPU IA');
INSERT INTO `detalle_modelo` (`id`, `modelo_id`, `atributo`, `valor`) VALUES (2, 1, 'Memoria RAM', '32 GB LPDDR5x 8533MHz');
INSERT INTO `detalle_modelo` (`id`, `modelo_id`, `atributo`, `valor`) VALUES (3, 1, 'Almacenamiento', '1 TB SSD M.2 PCIe Gen4 NVMe');
INSERT INTO `detalle_modelo` (`id`, `modelo_id`, `atributo`, `valor`) VALUES (4, 1, 'Pantalla', '14" 2.8K (2880 x 1800) OLED, 120Hz, HDR500 True Black');
INSERT INTO `detalle_modelo` (`id`, `modelo_id`, `atributo`, `valor`) VALUES (5, 1, 'Tarjeta Gráfica', 'Intel Arc Graphics integrada');
INSERT INTO `detalle_modelo` (`id`, `modelo_id`, `atributo`, `valor`) VALUES (6, 1, 'Peso', '0.98 kg');
INSERT INTO `detalle_modelo` (`id`, `modelo_id`, `atributo`, `valor`) VALUES (7, 2, 'Procesador', 'Intel Core i5-1335U 10 núcleos');
INSERT INTO `detalle_modelo` (`id`, `modelo_id`, `atributo`, `valor`) VALUES (8, 2, 'Memoria RAM', '16 GB DDR5 5200MHz');
INSERT INTO `detalle_modelo` (`id`, `modelo_id`, `atributo`, `valor`) VALUES (9, 2, 'Almacenamiento', '512 GB SSD NVMe M.2');
INSERT INTO `detalle_modelo` (`id`, `modelo_id`, `atributo`, `valor`) VALUES (10, 2, 'Pantalla', '15.6" FHD (1920 x 1080) Antirreflejo IPS');
INSERT INTO `detalle_modelo` (`id`, `modelo_id`, `atributo`, `valor`) VALUES (11, 2, 'Batería', 'Hasta 11 horas de autonomía');
INSERT INTO `detalle_modelo` (`id`, `modelo_id`, `atributo`, `valor`) VALUES (12, 3, 'Procesador', 'Intel Core Ultra 5 125U');
INSERT INTO `detalle_modelo` (`id`, `modelo_id`, `atributo`, `valor`) VALUES (13, 3, 'Memoria RAM', '16 GB DDR5 expandible a 64GB');
INSERT INTO `detalle_modelo` (`id`, `modelo_id`, `atributo`, `valor`) VALUES (14, 3, 'Almacenamiento', '512 GB SSD M.2 PCIe Gen4');
INSERT INTO `detalle_modelo` (`id`, `modelo_id`, `atributo`, `valor`) VALUES (15, 3, 'Pantalla', '14" WUXGA (1920 x 1200) IPS 400 nits Low Power');
INSERT INTO `detalle_modelo` (`id`, `modelo_id`, `atributo`, `valor`) VALUES (16, 3, 'Puertos', '2x Thunderbolt 4 / USB-C, 2x USB-A, HDMI 2.1, RJ-45 Ethernet');
INSERT INTO `detalle_modelo` (`id`, `modelo_id`, `atributo`, `valor`) VALUES (17, 4, 'Procesador', 'Intel Core i5-1235U');
INSERT INTO `detalle_modelo` (`id`, `modelo_id`, `atributo`, `valor`) VALUES (18, 4, 'Memoria RAM', '16 GB DDR4 3200MHz');
INSERT INTO `detalle_modelo` (`id`, `modelo_id`, `atributo`, `valor`) VALUES (19, 4, 'Almacenamiento', '512 GB SSD PCIe NVMe');
INSERT INTO `detalle_modelo` (`id`, `modelo_id`, `atributo`, `valor`) VALUES (20, 4, 'Pantalla', '15.6" Full HD Micro-Edge');
INSERT INTO `detalle_modelo` (`id`, `modelo_id`, `atributo`, `valor`) VALUES (21, 4, 'Audio', 'B&O con doble altavoz');
INSERT INTO `detalle_modelo` (`id`, `modelo_id`, `atributo`, `valor`) VALUES (22, 5, 'Procesador', 'Intel Core i9 14th Gen');
INSERT INTO `detalle_modelo` (`id`, `modelo_id`, `atributo`, `valor`) VALUES (23, 5, 'Memoria RAM', '32 GB DDR5');
INSERT INTO `detalle_modelo` (`id`, `modelo_id`, `atributo`, `valor`) VALUES (24, 5, 'Almacenamiento', 'NVIDIA RTX 4080 12GB');
INSERT INTO `detalle_modelo` (`id`, `modelo_id`, `atributo`, `valor`) VALUES (25, 5, 'Pantalla', '18" Mini LED 250Hz');
INSERT INTO `detalle_modelo` (`id`, `modelo_id`, `atributo`, `valor`) VALUES (26, 5, 'Almacenamiento', '1 TB SSD NVMe');
INSERT INTO `detalle_modelo` (`id`, `modelo_id`, `atributo`, `valor`) VALUES (27, 6, 'Tecnología de Impresión', 'Inyección de tinta Heat-Free MicroPiezo');
INSERT INTO `detalle_modelo` (`id`, `modelo_id`, `atributo`, `valor`) VALUES (28, 6, 'Resolución Máxima', '5760 x 1440 dpi');
INSERT INTO `detalle_modelo` (`id`, `modelo_id`, `atributo`, `valor`) VALUES (29, 6, 'Velocidad de Impresión', 'Negro 33 ppm / Color 15 ppm');
INSERT INTO `detalle_modelo` (`id`, `modelo_id`, `atributo`, `valor`) VALUES (30, 6, 'Conectividad', 'WiFi Direct, USB 2.0 de alta velocidad');

-- -------------------------------------------------------------------
-- Estructura de tabla para: `detalle_ventas`
-- -------------------------------------------------------------------
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos volcados para: `detalle_ventas` (5 registros)
INSERT INTO `detalle_ventas` (`id`, `venta_id`, `producto_id`, `cantidad`, `precio_unitario`, `descuento`, `subtotal`) VALUES (1, 1, 1, 1, '7899.00', '0.00', '7899.00');
INSERT INTO `detalle_ventas` (`id`, `venta_id`, `producto_id`, `cantidad`, `precio_unitario`, `descuento`, `subtotal`) VALUES (2, 2, 3, 1, '850.00', '0.00', '850.00');
INSERT INTO `detalle_ventas` (`id`, `venta_id`, `producto_id`, `cantidad`, `precio_unitario`, `descuento`, `subtotal`) VALUES (3, 3, 2, 1, '2850.00', '0.00', '2850.00');
INSERT INTO `detalle_ventas` (`id`, `venta_id`, `producto_id`, `cantidad`, `precio_unitario`, `descuento`, `subtotal`) VALUES (4, 4, 1, 1, '3899.00', '0.00', '3899.00');
INSERT INTO `detalle_ventas` (`id`, `venta_id`, `producto_id`, `cantidad`, `precio_unitario`, `descuento`, `subtotal`) VALUES (5, 5, 2, 1, '2850.00', '0.00', '2850.00');

-- -------------------------------------------------------------------
-- Estructura de tabla para: `empresas`
-- -------------------------------------------------------------------
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

-- Datos volcados para: `empresas` (1 registros)
INSERT INTO `empresas` (`id`, `ruc`, `razon_social`, `nombre_comercial`, `direccion_fiscal`, `email`, `telefono`, `departamento`, `provincia`, `distrito`, `ubigeo`, `logo_url`, `created_at`, `updated_at`) VALUES (1, '20609737524', 'MG SOLUTIONS GROUP S.A.C.', 'MG SOLUTIONS GROUP', 'AV. PEDRO RUIZ NRO. 349 INT. 09C (MERCADO MODELO) - LAMBAYEQUE - CHICLAYO - CHICLAYO', 'mgsolutions.group@gmail.com', '+51 974 812 390', 'Lambayeque', 'Chiclayo', 'Chiclayo', '140101', NULL, '2026-09-20 18:21:30', '2026-09-30 06:47:18');

-- -------------------------------------------------------------------
-- Estructura de tabla para: `equipos`
-- -------------------------------------------------------------------
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos volcados para: `equipos` (1 registros)
INSERT INTO `equipos` (`id`, `cliente_id`, `tipo_equipo_id`, `marca`, `modelo`, `numero_serie`, `accesorios`, `estado_id`, `fecha_registro`, `updated_at`) VALUES (1, 2, 1, 'Epson', 'EcoTank L3250 WiFi', 'EPS-L3250-X58821', 'Cargador Original', 1, '2026-10-05 20:51:21', '2026-10-05 20:51:21');

-- -------------------------------------------------------------------
-- Estructura de tabla para: `estados`
-- -------------------------------------------------------------------
DROP TABLE IF EXISTS `estados`;
CREATE TABLE `estados` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ACTIVO, INACTIVO, SUSPENDIDO, DESCONTINUADO',
  `descripcion` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cat├ílogo maestro de estados operativo/inactivo del sistema';

-- Datos volcados para: `estados` (4 registros)
INSERT INTO `estados` (`id`, `nombre`, `descripcion`, `created_at`) VALUES (1, 'ACTIVO', 'Registro activo y plenamente operativo', '2026-09-20 18:21:30');
INSERT INTO `estados` (`id`, `nombre`, `descripcion`, `created_at`) VALUES (2, 'INACTIVO', 'Registro dado de baja o inactivo', '2026-09-20 18:21:30');
INSERT INTO `estados` (`id`, `nombre`, `descripcion`, `created_at`) VALUES (3, 'SUSPENDIDO', 'Registro temporalmente suspendido', '2026-09-20 18:21:30');
INSERT INTO `estados` (`id`, `nombre`, `descripcion`, `created_at`) VALUES (4, 'DESCONTINUADO', 'Producto o ├¡tem descontinuado comercialmente', '2026-09-20 18:21:30');

-- -------------------------------------------------------------------
-- Estructura de tabla para: `estados_movimiento`
-- -------------------------------------------------------------------
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo de estados de traslados y movimientos entre sedes';

-- Datos volcados para: `estados_movimiento` (5 registros)
INSERT INTO `estados_movimiento` (`id`, `codigo`, `nombre`, `color_hex`, `estado_id`, `created_at`) VALUES (1, 'SOLICITADO', 'Solicitado', '#3B82F6', 1, '2026-09-24 08:23:41');
INSERT INTO `estados_movimiento` (`id`, `codigo`, `nombre`, `color_hex`, `estado_id`, `created_at`) VALUES (2, 'APROBADO', 'Aprobado', '#F59E0B', 1, '2026-09-24 08:23:41');
INSERT INTO `estados_movimiento` (`id`, `codigo`, `nombre`, `color_hex`, `estado_id`, `created_at`) VALUES (3, 'EN_TRANSITO', 'En Tránsito', '#8B5CF6', 1, '2026-09-24 08:23:41');
INSERT INTO `estados_movimiento` (`id`, `codigo`, `nombre`, `color_hex`, `estado_id`, `created_at`) VALUES (4, 'RECIBIDO', 'Recibido en Destino', '#10B981', 1, '2026-09-24 08:23:41');
INSERT INTO `estados_movimiento` (`id`, `codigo`, `nombre`, `color_hex`, `estado_id`, `created_at`) VALUES (5, 'CANCELADO', 'Cancelado', '#EF4444', 1, '2026-09-24 08:23:41');

-- -------------------------------------------------------------------
-- Estructura de tabla para: `estados_orden_servicio`
-- -------------------------------------------------------------------
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

-- Datos volcados para: `estados_orden_servicio` (9 registros)
INSERT INTO `estados_orden_servicio` (`id`, `codigo`, `nombre`, `descripcion`, `secuencia_orden`, `color_hex`, `estado_id`, `created_at`) VALUES (1, 'RECEPCIONADO', 'Recepcionado', 'Equipo recibido en mostrador, pendiente de diagnóstico inicial', 1, '#64748B', 1, '2026-09-24 08:23:41');
INSERT INTO `estados_orden_servicio` (`id`, `codigo`, `nombre`, `descripcion`, `secuencia_orden`, `color_hex`, `estado_id`, `created_at`) VALUES (2, 'EN_DIAGNOSTICO', 'En diagnóstico técnico', 'Especialista evaluando fallas de hardware y software', 2, '#3B82F6', 1, '2026-09-24 08:23:41');
INSERT INTO `estados_orden_servicio` (`id`, `codigo`, `nombre`, `descripcion`, `secuencia_orden`, `color_hex`, `estado_id`, `created_at`) VALUES (3, 'PRESUPUESTADO', 'Presupuestado', 'Cotización de mano de obra y repuestos emitida para el cliente', 3, '#F59E0B', 1, '2026-09-24 08:23:41');
INSERT INTO `estados_orden_servicio` (`id`, `codigo`, `nombre`, `descripcion`, `secuencia_orden`, `color_hex`, `estado_id`, `created_at`) VALUES (4, 'APROBADO_EN_REPARACION', 'En reparación activa', 'Cliente aprobó presupuesto; técnico interviniendo equipo', 4, '#8B5CF6', 1, '2026-09-24 08:23:41');
INSERT INTO `estados_orden_servicio` (`id`, `codigo`, `nombre`, `descripcion`, `secuencia_orden`, `color_hex`, `estado_id`, `created_at`) VALUES (5, 'ESPERA_REPUESTOS', 'Esperando repuestos', 'Taller esperando llegada de componentes o insumos de almacén', 5, '#EC4899', 1, '2026-09-24 08:23:41');
INSERT INTO `estados_orden_servicio` (`id`, `codigo`, `nombre`, `descripcion`, `secuencia_orden`, `color_hex`, `estado_id`, `created_at`) VALUES (6, 'REPARADO_PROBADO', 'Reparado y con pruebas superadas', 'Reparación completada y pruebas de estrés aprobadas', 6, '#10B981', 1, '2026-09-24 08:23:41');
INSERT INTO `estados_orden_servicio` (`id`, `codigo`, `nombre`, `descripcion`, `secuencia_orden`, `color_hex`, `estado_id`, `created_at`) VALUES (7, 'LISTO_ENTREGA', 'Listo para recojo en mostrador', 'Equipo limpio y listo en mostrador esperando al cliente', 7, '#059669', 1, '2026-09-24 08:23:41');
INSERT INTO `estados_orden_servicio` (`id`, `codigo`, `nombre`, `descripcion`, `secuencia_orden`, `color_hex`, `estado_id`, `created_at`) VALUES (8, 'ENTREGADO_COBRADO', 'Entregado con conformidad', 'Cliente recogió equipo y liquidó saldo pendiente', 8, '#00346F', 1, '2026-09-24 08:23:41');
INSERT INTO `estados_orden_servicio` (`id`, `codigo`, `nombre`, `descripcion`, `secuencia_orden`, `color_hex`, `estado_id`, `created_at`) VALUES (9, 'RECHAZADO_DEVUELTO', 'Devuelto sin reparación', 'Cliente no aceptó presupuesto o equipo no tuvo reparación', 9, '#DC2626', 1, '2026-09-24 08:23:41');

-- -------------------------------------------------------------------
-- Estructura de tabla para: `estados_unidad`
-- -------------------------------------------------------------------
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

-- Datos volcados para: `estados_unidad` (6 registros)
INSERT INTO `estados_unidad` (`id`, `codigo`, `nombre`, `estado_id`, `created_at`) VALUES (1, 'DISPONIBLE', 'Disponible en Almacén / Vitrina', 1, '2026-09-24 08:23:41');
INSERT INTO `estados_unidad` (`id`, `codigo`, `nombre`, `estado_id`, `created_at`) VALUES (2, 'VENDIDO', 'Vendido a Cliente', 1, '2026-09-24 08:23:41');
INSERT INTO `estados_unidad` (`id`, `codigo`, `nombre`, `estado_id`, `created_at`) VALUES (3, 'EN_SERVICIO', 'Instalado en Orden de Taller', 1, '2026-09-24 08:23:41');
INSERT INTO `estados_unidad` (`id`, `codigo`, `nombre`, `estado_id`, `created_at`) VALUES (4, 'GARANTIA', 'Devuelto a Proveedor por Garantía', 1, '2026-09-24 08:23:41');
INSERT INTO `estados_unidad` (`id`, `codigo`, `nombre`, `estado_id`, `created_at`) VALUES (5, 'DANADO_CUARENTENA', 'Dañado / Cuarentena (Oculto de Venta)', 1, '2026-10-02 10:22:45');
INSERT INTO `estados_unidad` (`id`, `codigo`, `nombre`, `estado_id`, `created_at`) VALUES (6, 'BAJA_MERMA', 'Baja / Merma (Descarte)', 1, '2026-10-02 10:22:45');

-- -------------------------------------------------------------------
-- Estructura de tabla para: `marcas`
-- -------------------------------------------------------------------
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos volcados para: `marcas` (8 registros)
INSERT INTO `marcas` (`id`, `nombre`, `descripcion`, `categoria_id`, `estado_id`, `created_at`) VALUES (1, 'LENOVO', 'Equipos portátiles, desktops y servidores', 1, 1, '2026-09-30 08:44:04');
INSERT INTO `marcas` (`id`, `nombre`, `descripcion`, `categoria_id`, `estado_id`, `created_at`) VALUES (2, 'HP', 'Laptops, impresoras y workstations empresariales', 1, 1, '2026-09-30 08:44:05');
INSERT INTO `marcas` (`id`, `nombre`, `descripcion`, `categoria_id`, `estado_id`, `created_at`) VALUES (3, 'DELL', 'Portátiles Inspiron, Latitude y Alienware', 1, 1, '2026-09-30 08:44:05');
INSERT INTO `marcas` (`id`, `nombre`, `descripcion`, `categoria_id`, `estado_id`, `created_at`) VALUES (4, 'ASUS', 'Laptops para productividad y serie gamer ROG / TUF', 1, 1, '2026-09-30 08:44:05');
INSERT INTO `marcas` (`id`, `nombre`, `descripcion`, `categoria_id`, `estado_id`, `created_at`) VALUES (5, 'APPLE', 'MacBook, Mac Mini, iMac y dispositivos Apple', 1, 1, '2026-09-30 08:44:05');
INSERT INTO `marcas` (`id`, `nombre`, `descripcion`, `categoria_id`, `estado_id`, `created_at`) VALUES (6, 'EPSON', 'Impresoras EcoTank, matriciales y proyectores', 2, 1, '2026-09-30 08:44:05');
INSERT INTO `marcas` (`id`, `nombre`, `descripcion`, `categoria_id`, `estado_id`, `created_at`) VALUES (7, 'ACER', 'Laptops Aspire, Nitro y Predator', 1, 1, '2026-09-30 08:44:05');
INSERT INTO `marcas` (`id`, `nombre`, `descripcion`, `categoria_id`, `estado_id`, `created_at`) VALUES (8, 'SAMSUNG', 'Monitores, almacenamiento y tablets', 3, 1, '2026-09-30 08:44:06');

-- -------------------------------------------------------------------
-- Estructura de tabla para: `metodos_pago`
-- -------------------------------------------------------------------
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

-- Datos volcados para: `metodos_pago` (5 registros)
INSERT INTO `metodos_pago` (`id`, `codigo`, `nombre`, `requiere_referencia`, `estado_id`, `created_at`) VALUES (1, 'EFECTIVO', 'Efectivo en Soles (Caja mostrador)', 0, 1, '2026-09-24 08:23:41');
INSERT INTO `metodos_pago` (`id`, `codigo`, `nombre`, `requiere_referencia`, `estado_id`, `created_at`) VALUES (2, 'YAPE', 'Billetera Digital Yape', 1, 1, '2026-09-24 08:23:41');
INSERT INTO `metodos_pago` (`id`, `codigo`, `nombre`, `requiere_referencia`, `estado_id`, `created_at`) VALUES (3, 'PLIN', 'Billetera Digital Plin', 1, 1, '2026-09-24 08:23:41');
INSERT INTO `metodos_pago` (`id`, `codigo`, `nombre`, `requiere_referencia`, `estado_id`, `created_at`) VALUES (4, 'TARJETA', 'Tarjeta Débito / Crédito (POS)', 1, 1, '2026-09-24 08:23:41');
INSERT INTO `metodos_pago` (`id`, `codigo`, `nombre`, `requiere_referencia`, `estado_id`, `created_at`) VALUES (5, 'TRANSFERENCIA', 'Transferencia Bancaria (BCP/BBVA/Interbank)', 1, 1, '2026-09-24 08:23:41');

-- -------------------------------------------------------------------
-- Estructura de tabla para: `modelos`
-- -------------------------------------------------------------------
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos volcados para: `modelos` (6 registros)
INSERT INTO `modelos` (`id`, `marca_id`, `nombre`, `descripcion`, `estado_id`, `created_at`) VALUES (1, 1, 'ThinkPad X1 Carbon Gen 14 Aura Edition (14" Intel)', 'Ultrabook corporativo de gama ultra premium con IA integrada', 1, '2026-09-30 08:44:06');
INSERT INTO `modelos` (`id`, `marca_id`, `nombre`, `descripcion`, `estado_id`, `created_at`) VALUES (2, 1, 'Lenovo Googlebook 15', 'Portátil versátil para trabajo en la nube y productividad educativa', 1, '2026-09-30 08:44:06');
INSERT INTO `modelos` (`id`, `marca_id`, `nombre`, `descripcion`, `estado_id`, `created_at`) VALUES (3, 1, 'ThinkPad T14 Gen 7 (14" Intel)', 'Caballo de batalla corporativo con resistencia militar MIL-STD-810H', 1, '2026-09-30 08:44:07');
INSERT INTO `modelos` (`id`, `marca_id`, `nombre`, `descripcion`, `estado_id`, `created_at`) VALUES (4, 2, 'HP Pavilion 15-eg0021la', 'Portátil balanceado para oficina y estudiantes avanzados', 1, '2026-09-30 08:44:07');
INSERT INTO `modelos` (`id`, `marca_id`, `nombre`, `descripcion`, `estado_id`, `created_at`) VALUES (5, 7, 'Predator Helios 18 AI', 'acer Nitro V 17 AI', 1, '2026-09-30 09:01:37');
INSERT INTO `modelos` (`id`, `marca_id`, `nombre`, `descripcion`, `estado_id`, `created_at`) VALUES (6, 6, 'EcoTank L3250 WiFi', 'Multifuncional inalámbrica con sistema continuo original de tinta', 1, '2026-10-02 10:22:45');

-- -------------------------------------------------------------------
-- Estructura de tabla para: `ordenes_servicio`
-- -------------------------------------------------------------------
DROP TABLE IF EXISTS `ordenes_servicio`;
CREATE TABLE `ordenes_servicio` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cliente_id` int NOT NULL,
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
  CONSTRAINT `fk_os_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id_cliente`),
  CONSTRAINT `fk_os_equipo` FOREIGN KEY (`equipo_id`) REFERENCES `equipos` (`id`),
  CONSTRAINT `fk_os_estado` FOREIGN KEY (`estado_orden_id`) REFERENCES `estados_orden_servicio` (`id`),
  CONSTRAINT `fk_os_prioridad` FOREIGN KEY (`prioridad_id`) REFERENCES `prioridades_orden` (`id`),
  CONSTRAINT `fk_os_recibe` FOREIGN KEY (`usuario_recibe_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `fk_os_tecnico` FOREIGN KEY (`usuario_tecnico_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos volcados para: `ordenes_servicio` (1 registros)
INSERT INTO `ordenes_servicio` (`id`, `codigo`, `cliente_id`, `equipo_id`, `usuario_recibe_id`, `usuario_tecnico_id`, `descripcion_falla`, `diagnostico`, `solucion`, `costo_servicio`, `estado_orden_id`, `prioridad_id`, `fecha_ingreso`, `fecha_promesa`, `fecha_entrega`, `observaciones`, `updated_at`) VALUES (1, 'GAR-00001', 2, 1, 1, NULL, 'Cabezal de impresión obstruido en color magenta', NULL, NULL, '0.00', 1, 2, '2026-10-05 20:51:21', '2026-10-08 20:51:22', NULL, '[INGRESO POR GARANTÍA OFICIAL]\nEstado Estético: Sin golpes. Tintas originales en nivel medio.\nCliente: GUADALUPE TORRES (Doc: 12345678 | Tel: 948123456)\nChecklist: Sin caídas, sin humedad, sellos íntegros.', '2026-10-05 20:51:21');

-- -------------------------------------------------------------------
-- Estructura de tabla para: `permisos`
-- -------------------------------------------------------------------
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

-- Datos volcados para: `permisos` (15 registros)
INSERT INTO `permisos` (`id`, `codigo`, `nombre`, `descripcion`, `categoria`, `icono`, `estado_id`, `created_at`) VALUES (1, 'ventas', 'Ventas', 'Gestión de ventas y operaciones comerciales', 'Operaciones', 'Receipt', 1, '2026-09-20 18:22:29');
INSERT INTO `permisos` (`id`, `codigo`, `nombre`, `descripcion`, `categoria`, `icono`, `estado_id`, `created_at`) VALUES (2, 'caja', 'Caja & Finanzas', 'Apertura, arqueo, turnos y balance de caja', 'Operaciones', 'DollarSign', 1, '2026-09-20 18:22:29');
INSERT INTO `permisos` (`id`, `codigo`, `nombre`, `descripcion`, `categoria`, `icono`, `estado_id`, `created_at`) VALUES (3, 'compras', 'Compras & Proveedores', 'Registro de facturas de compra, abastecimiento y proveedores', 'Almacén', 'Truck', 1, '2026-09-20 18:22:29');
INSERT INTO `permisos` (`id`, `codigo`, `nombre`, `descripcion`, `categoria`, `icono`, `estado_id`, `created_at`) VALUES (4, 'panel-recepcion', 'Panel de recepción', 'Ingresos y seguimiento inicial de equipos', 'Taller', 'ClipboardList', 1, '2026-09-20 18:22:29');
INSERT INTO `permisos` (`id`, `codigo`, `nombre`, `descripcion`, `categoria`, `icono`, `estado_id`, `created_at`) VALUES (5, 'panel-almacen', 'Panel de almacén', 'Stock y movimientos entre sedes', 'Almacén', 'Package', 1, '2026-09-20 18:22:29');
INSERT INTO `permisos` (`id`, `codigo`, `nombre`, `descripcion`, `categoria`, `icono`, `estado_id`, `created_at`) VALUES (6, 'taller', 'Servicio Técnico & Taller', 'Recepción, bandeja del técnico, avances y entregas', 'Taller', 'Wrench', 1, '2026-09-20 18:22:29');
INSERT INTO `permisos` (`id`, `codigo`, `nombre`, `descripcion`, `categoria`, `icono`, `estado_id`, `created_at`) VALUES (7, 'equipos', 'Equipos registrados', 'Equipos de clientes e historial de servicios', 'Taller', 'Laptop', 1, '2026-09-20 18:22:29');
INSERT INTO `permisos` (`id`, `codigo`, `nombre`, `descripcion`, `categoria`, `icono`, `estado_id`, `created_at`) VALUES (8, 'clientes', 'Directorio de Clientes', 'Gestión y validación de RUC y DNI', 'Operaciones', 'Users', 1, '2026-09-20 18:22:29');
INSERT INTO `permisos` (`id`, `codigo`, `nombre`, `descripcion`, `categoria`, `icono`, `estado_id`, `created_at`) VALUES (9, 'productos', 'Productos & Stock', 'Catálogo, inventario y control de precios', 'Almacén', 'Package', 1, '2026-09-20 18:22:29');
INSERT INTO `permisos` (`id`, `codigo`, `nombre`, `descripcion`, `categoria`, `icono`, `estado_id`, `created_at`) VALUES (10, 'categorias', 'Categorías', 'Clasificación de productos', 'Almacén', 'Layers', 1, '2026-09-20 18:22:29');
INSERT INTO `permisos` (`id`, `codigo`, `nombre`, `descripcion`, `categoria`, `icono`, `estado_id`, `created_at`) VALUES (11, 'marcas', 'Marcas', 'Registro de marcas del catálogo', 'Almacén', 'Tag', 1, '2026-09-20 18:22:29');
INSERT INTO `permisos` (`id`, `codigo`, `nombre`, `descripcion`, `categoria`, `icono`, `estado_id`, `created_at`) VALUES (12, 'usuarios', 'Gestión de Usuarios & Paneles', 'Usuarios, roles y asignación de permisos a paneles', 'Administración', 'ShieldCheck', 1, '2026-09-20 18:22:29');
INSERT INTO `permisos` (`id`, `codigo`, `nombre`, `descripcion`, `categoria`, `icono`, `estado_id`, `created_at`) VALUES (13, 'config-empresa', 'Datos de Empresa', 'Información general y parámetros operativos', 'Administración', 'Building2', 1, '2026-09-20 18:22:29');
INSERT INTO `permisos` (`id`, `codigo`, `nombre`, `descripcion`, `categoria`, `icono`, `estado_id`, `created_at`) VALUES (14, 'sucursales', 'Sucursales', 'Sedes y almacenes secundarios', 'Administración', 'Network', 1, '2026-09-20 18:22:29');
INSERT INTO `permisos` (`id`, `codigo`, `nombre`, `descripcion`, `categoria`, `icono`, `estado_id`, `created_at`) VALUES (15, 'movimientos', 'Movimientos entre sedes', 'Traslados y control de inventario entre sedes', 'Almacén', 'ArrowLeftRight', 1, '2026-09-20 18:22:29');

-- -------------------------------------------------------------------
-- Estructura de tabla para: `personas`
-- -------------------------------------------------------------------
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
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Datos personales base de clientes y contactos externos';

-- Datos volcados para: `personas` (15 registros)
INSERT INTO `personas` (`id_persona`, `tipo_documento_id`, `dni`, `nombres`, `apellidos`, `telefono`, `correo`, `direccion`, `estado_id`, `created_at`, `updated_at`) VALUES (1, 1, '47891234', 'Juan', 'Perez Gomez', '984129384', 'juan.perez@gmail.com', 'Jr. San José 450, Chiclayo', 1, '2026-09-20 18:22:29', '2026-09-20 18:22:29');
INSERT INTO `personas` (`id_persona`, `tipo_documento_id`, `dni`, `nombres`, `apellidos`, `telefono`, `correo`, `direccion`, `estado_id`, `created_at`, `updated_at`) VALUES (2, 1, '41234567', 'Carlos', 'Quispe Rojas', '0742938', 'contacto@constructorasur.pe', 'Av. Balta 1082, Chiclayo', 1, '2026-09-20 18:22:29', '2026-09-20 18:22:29');
INSERT INTO `personas` (`id_persona`, `tipo_documento_id`, `dni`, `nombres`, `apellidos`, `telefono`, `correo`, `direccion`, `estado_id`, `created_at`, `updated_at`) VALUES (3, 1, '39876543', 'Roberto', 'Mendoza Silva', '0513294', 'contacto@mineradelsur.com.pe', 'Carretera Central Km 12, Puno', 1, '2026-09-20 18:22:29', '2026-09-20 18:22:29');
INSERT INTO `personas` (`id_persona`, `tipo_documento_id`, `dni`, `nombres`, `apellidos`, `telefono`, `correo`, `direccion`, `estado_id`, `created_at`, `updated_at`) VALUES (4, 1, '45123678', 'Patricia', 'Flores Ruiz', '0148291', 'ventas@distribuidoralima.com', 'Av. Nicolás de Piérola 740, Lima', 1, '2026-09-20 18:22:29', '2026-09-20 18:22:29');
INSERT INTO `personas` (`id_persona`, `tipo_documento_id`, `dni`, `nombres`, `apellidos`, `telefono`, `correo`, `direccion`, `estado_id`, `created_at`, `updated_at`) VALUES (5, 1, '38765432', 'Luis', 'Vargas Díaz', '0442918', 'bajas@comercialinactiva.pe', 'Calle Real 120, Trujillo', 2, '2026-09-20 18:22:29', '2026-09-20 18:22:29');
INSERT INTO `personas` (`id_persona`, `tipo_documento_id`, `dni`, `nombres`, `apellidos`, `telefono`, `correo`, `direccion`, `estado_id`, `created_at`, `updated_at`) VALUES (6, 1, '62490163', 'MARIO CESAR', 'HUAMAN GOMEZ', '912345678', 'mario.huaman@gmail.com', 'Jr. Bolognesi 456, Chiclayo', 1, '2026-09-24 11:38:44', '2026-09-24 11:38:44');
INSERT INTO `personas` (`id_persona`, `tipo_documento_id`, `dni`, `nombres`, `apellidos`, `telefono`, `correo`, `direccion`, `estado_id`, `created_at`, `updated_at`) VALUES (7, 1, '76364221', 'MARIO CESAR', 'HUAMAN GOMEZ', '912345678', 'mario.huaman@gmail.com', 'Jr. Bolognesi 456, Chiclayo', 1, '2026-09-24 11:39:00', '2026-09-24 11:39:00');
INSERT INTO `personas` (`id_persona`, `tipo_documento_id`, `dni`, `nombres`, `apellidos`, `telefono`, `correo`, `direccion`, `estado_id`, `created_at`, `updated_at`) VALUES (8, 2, NULL, 'LOGISTICA ANDINA S.A.C.', NULL, '987654321', 'contacto@andinaexpress.pe', 'Av. Las Gardenias 123, Chiclayo', 1, '2026-09-24 11:39:27', '2026-09-24 11:39:27');
INSERT INTO `personas` (`id_persona`, `tipo_documento_id`, `dni`, `nombres`, `apellidos`, `telefono`, `correo`, `direccion`, `estado_id`, `created_at`, `updated_at`) VALUES (9, 1, '74213456', 'MARIO CESAR', 'HUAMAN GOMEZ', '912345678', 'mario.huaman@gmail.com', 'Jr. Bolognesi 456, Chiclayo', 1, '2026-09-24 11:39:27', '2026-09-24 11:39:27');
INSERT INTO `personas` (`id_persona`, `tipo_documento_id`, `dni`, `nombres`, `apellidos`, `telefono`, `correo`, `direccion`, `estado_id`, `created_at`, `updated_at`) VALUES (10, 2, NULL, 'LOGISTICA ANDINA S.A.C.', NULL, '987654321', 'contacto@andinaexpress.pe', 'Av. Las Gardenias 123, Chiclayo', 1, '2026-09-24 11:41:57', '2026-09-24 11:41:57');
INSERT INTO `personas` (`id_persona`, `tipo_documento_id`, `dni`, `nombres`, `apellidos`, `telefono`, `correo`, `direccion`, `estado_id`, `created_at`, `updated_at`) VALUES (11, 1, '83072975', 'MARIO CESAR', 'HUAMAN GOMEZ', '912345678', 'mario.huaman@gmail.com', 'Jr. Bolognesi 456, Chiclayo', 1, '2026-09-24 11:41:57', '2026-09-24 11:41:57');
INSERT INTO `personas` (`id_persona`, `tipo_documento_id`, `dni`, `nombres`, `apellidos`, `telefono`, `correo`, `direccion`, `estado_id`, `created_at`, `updated_at`) VALUES (12, 1, '73307286', 'ARNOLD JEAMPIERRE', 'CACHAY HUANCAS', '948847159', 'cachay35.78@gmail.com', 'jose2004', 1, '2026-09-25 21:33:28', '2026-09-25 21:33:28');
INSERT INTO `personas` (`id_persona`, `tipo_documento_id`, `dni`, `nombres`, `apellidos`, `telefono`, `correo`, `direccion`, `estado_id`, `created_at`, `updated_at`) VALUES (13, 1, '73307284', 'ARNOLD JEAMPIERRE', 'CACHAY HUANCAS', '948847159', 'cachay35.78@gmail.com', '28 de julio', 1, '2026-09-25 21:49:12', '2026-09-26 02:08:26');
INSERT INTO `personas` (`id_persona`, `tipo_documento_id`, `dni`, `nombres`, `apellidos`, `telefono`, `correo`, `direccion`, `estado_id`, `created_at`, `updated_at`) VALUES (14, 1, '12345678', 'GUADALUPE', 'TORRES', '987456123', 'guadalupe@gmail.com', 'chiclayo', 1, '2026-09-26 02:06:41', '2026-09-26 02:07:52');
INSERT INTO `personas` (`id_persona`, `tipo_documento_id`, `dni`, `nombres`, `apellidos`, `telefono`, `correo`, `direccion`, `estado_id`, `created_at`, `updated_at`) VALUES (15, 1, '71584464', 'SAMSUNG', '', '928704044', 'ANGEL@GMAIL.COM', 'PASAJE PERU 120', 1, '2026-09-26 07:13:20', '2026-09-26 07:28:54');

-- -------------------------------------------------------------------
-- Estructura de tabla para: `prioridades_orden`
-- -------------------------------------------------------------------
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

-- Datos volcados para: `prioridades_orden` (3 registros)
INSERT INTO `prioridades_orden` (`id`, `codigo`, `nombre`, `nivel_orden`, `color_hex`, `estado_id`, `created_at`) VALUES (1, 'NORMAL', 'Prioridad Normal (Atención regular)', 1, '#3B82F6', 1, '2026-09-24 08:23:41');
INSERT INTO `prioridades_orden` (`id`, `codigo`, `nombre`, `nivel_orden`, `color_hex`, `estado_id`, `created_at`) VALUES (2, 'ALTA', 'Prioridad Alta (Diagnóstico en 24h)', 2, '#F59E0B', 1, '2026-09-24 08:23:41');
INSERT INTO `prioridades_orden` (`id`, `codigo`, `nombre`, `nivel_orden`, `color_hex`, `estado_id`, `created_at`) VALUES (3, 'URGENTE', 'Prioridad Urgente (Atención inmediata)', 3, '#EF4444', 1, '2026-09-24 08:23:41');

-- -------------------------------------------------------------------
-- Estructura de tabla para: `producto_detalle`
-- -------------------------------------------------------------------
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

-- -------------------------------------------------------------------
-- Estructura de tabla para: `producto_series_garantia`
-- -------------------------------------------------------------------
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos volcados para: `producto_series_garantia` (7 registros)
INSERT INTO `producto_series_garantia` (`id`, `venta_id`, `producto_id`, `numero_serie`, `cliente_id`, `meses_garantia`, `fecha_venta`, `estado_garantia`, `observaciones`, `created_at`) VALUES (1, NULL, 1, 'SN-LEN-2026-VIG', NULL, 12, '2026-06-30 09:41:09', 'ACTIVA', 'Laptop vendida con boleta B001-00452. Cliente: Juan Carlos Pérez.', '2026-09-30 09:41:09');
INSERT INTO `producto_series_garantia` (`id`, `venta_id`, `producto_id`, `numero_serie`, `cliente_id`, `meses_garantia`, `fecha_venta`, `estado_garantia`, `observaciones`, `created_at`) VALUES (2, NULL, 1, 'SN-HP-2025-EXP', NULL, 12, '2025-07-30 09:41:09', 'EXPIRADA', 'Laptop vendida con factura F001-00120. Garantía expiró hace 2 meses.', '2026-09-30 09:41:09');
INSERT INTO `producto_series_garantia` (`id`, `venta_id`, `producto_id`, `numero_serie`, `cliente_id`, `meses_garantia`, `fecha_venta`, `estado_garantia`, `observaciones`, `created_at`) VALUES (3, 1, 1, 'LNV-X1C-2026-001', 1, 12, '2026-08-21 20:03:57', 'VIGENTE', 'Equipo nuevo en empaque sellado. Cobertura completa de fábrica.', '2026-10-05 20:03:57');
INSERT INTO `producto_series_garantia` (`id`, `venta_id`, `producto_id`, `numero_serie`, `cliente_id`, `meses_garantia`, `fecha_venta`, `estado_garantia`, `observaciones`, `created_at`) VALUES (4, 2, 3, 'EPS-L3250-X58821', 2, 12, '2025-10-20 20:03:57', 'VIGENTE', 'Facturado a cliente empresa. Próximo a vencer periodo anual.', '2026-10-05 20:03:57');
INSERT INTO `producto_series_garantia` (`id`, `venta_id`, `producto_id`, `numero_serie`, `cliente_id`, `meses_garantia`, `fecha_venta`, `estado_garantia`, `observaciones`, `created_at`) VALUES (5, 3, 2, 'LNV-GB15-994101', 1, 12, '2025-08-11 20:03:57', 'VENCIDA', 'Periodo de 12 meses concluido. Aplicar tarifa de diagnóstico o cotización.', '2026-10-05 20:03:57');
INSERT INTO `producto_series_garantia` (`id`, `venta_id`, `producto_id`, `numero_serie`, `cliente_id`, `meses_garantia`, `fecha_venta`, `estado_garantia`, `observaciones`, `created_at`) VALUES (6, 4, 1, 'LNV-X1C-2026-999', 1, 12, '2026-10-05 20:36:13', 'VIGENTE', 'Emitido en comprobante B001-000089. Cobertura activa.', '2026-10-05 20:36:13');
INSERT INTO `producto_series_garantia` (`id`, `venta_id`, `producto_id`, `numero_serie`, `cliente_id`, `meses_garantia`, `fecha_venta`, `estado_garantia`, `observaciones`, `created_at`) VALUES (7, 5, 2, 'LNV-GB15-994103', 0, 12, '2026-10-06 04:39:10', 'VIGENTE', 'Emitido en comprobante B001-000090. Cobertura activa.', '2026-10-06 04:39:10');

-- -------------------------------------------------------------------
-- Estructura de tabla para: `producto_stock_sede`
-- -------------------------------------------------------------------
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos volcados para: `producto_stock_sede` (6 registros)
INSERT INTO `producto_stock_sede` (`id`, `producto_id`, `sucursal_id`, `stock`, `updated_at`) VALUES (1, 1, 1, 2, '2026-10-05 20:36:13');
INSERT INTO `producto_stock_sede` (`id`, `producto_id`, `sucursal_id`, `stock`, `updated_at`) VALUES (2, 2, 1, 3, '2026-10-06 04:39:10');
INSERT INTO `producto_stock_sede` (`id`, `producto_id`, `sucursal_id`, `stock`, `updated_at`) VALUES (3, 3, 1, 5, '2026-10-02 10:22:45');
INSERT INTO `producto_stock_sede` (`id`, `producto_id`, `sucursal_id`, `stock`, `updated_at`) VALUES (4, 4, 1, 15, '2026-10-02 10:22:45');
INSERT INTO `producto_stock_sede` (`id`, `producto_id`, `sucursal_id`, `stock`, `updated_at`) VALUES (5, 5, 1, 8, '2026-10-02 10:22:45');
INSERT INTO `producto_stock_sede` (`id`, `producto_id`, `sucursal_id`, `stock`, `updated_at`) VALUES (6, 7, 1, 1, '2026-10-02 10:35:05');

-- -------------------------------------------------------------------
-- Estructura de tabla para: `producto_unidades`
-- -------------------------------------------------------------------
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
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos volcados para: `producto_unidades` (13 registros)
INSERT INTO `producto_unidades` (`id`, `producto_id`, `sucursal_id`, `numero_serie`, `estado_unidad_id`, `tipo_destino`, `disponible_venta`, `condicion`, `observaciones`, `costo_adquisicion`, `fecha_ingreso`, `created_at`, `updated_at`) VALUES (1, 1, 1, 'LNV-X1C-2026-001', 2, 'VENTA', 0, 'NUEVO', 'Unidad en vitrina principal', NULL, '2026-10-02 10:22:45', '2026-10-02 10:22:45', '2026-10-05 20:03:57');
INSERT INTO `producto_unidades` (`id`, `producto_id`, `sucursal_id`, `numero_serie`, `estado_unidad_id`, `tipo_destino`, `disponible_venta`, `condicion`, `observaciones`, `costo_adquisicion`, `fecha_ingreso`, `created_at`, `updated_at`) VALUES (2, 1, 1, 'LNV-X1C-2026-002', 1, 'VENTA', 1, 'NUEVO', 'Sellado en caja', NULL, '2026-10-02 10:22:45', '2026-10-02 10:22:45', '2026-10-02 10:22:45');
INSERT INTO `producto_unidades` (`id`, `producto_id`, `sucursal_id`, `numero_serie`, `estado_unidad_id`, `tipo_destino`, `disponible_venta`, `condicion`, `observaciones`, `costo_adquisicion`, `fecha_ingreso`, `created_at`, `updated_at`) VALUES (3, 1, 1, 'LNV-X1C-2026-003', 5, 'VENTA', 0, 'DANADO_RECEPCION', 'Caja llegó golpeada en esquina, bisagra desajustada. Separado para reclamo a proveedor', NULL, '2026-10-02 10:22:45', '2026-10-02 10:22:45', '2026-10-02 10:22:45');
INSERT INTO `producto_unidades` (`id`, `producto_id`, `sucursal_id`, `numero_serie`, `estado_unidad_id`, `tipo_destino`, `disponible_venta`, `condicion`, `observaciones`, `costo_adquisicion`, `fecha_ingreso`, `created_at`, `updated_at`) VALUES (4, 2, 1, 'LNV-GB15-994101', 2, 'VENTA', 0, 'NUEVO', 'Disponible para venta', NULL, '2026-10-02 10:22:45', '2026-10-02 10:22:45', '2026-10-05 20:03:57');
INSERT INTO `producto_unidades` (`id`, `producto_id`, `sucursal_id`, `numero_serie`, `estado_unidad_id`, `tipo_destino`, `disponible_venta`, `condicion`, `observaciones`, `costo_adquisicion`, `fecha_ingreso`, `created_at`, `updated_at`) VALUES (5, 2, 1, 'LNV-GB15-994102', 1, 'VENTA', 1, 'NUEVO', 'Disponible para venta', NULL, '2026-10-02 10:22:45', '2026-10-02 10:22:45', '2026-10-02 10:22:45');
INSERT INTO `producto_unidades` (`id`, `producto_id`, `sucursal_id`, `numero_serie`, `estado_unidad_id`, `tipo_destino`, `disponible_venta`, `condicion`, `observaciones`, `costo_adquisicion`, `fecha_ingreso`, `created_at`, `updated_at`) VALUES (6, 2, 1, 'LNV-GB15-994103', 2, 'VENTA', 0, 'NUEVO', 'Disponible para venta', NULL, '2026-10-02 10:22:45', '2026-10-02 10:22:45', '2026-10-06 04:39:10');
INSERT INTO `producto_unidades` (`id`, `producto_id`, `sucursal_id`, `numero_serie`, `estado_unidad_id`, `tipo_destino`, `disponible_venta`, `condicion`, `observaciones`, `costo_adquisicion`, `fecha_ingreso`, `created_at`, `updated_at`) VALUES (7, 2, 1, 'LNV-GB15-994104', 3, 'SERVICIO_TALLER', 0, 'USADO', 'Asignada a equipo de demostración y pruebas técnicas', NULL, '2026-10-02 10:22:45', '2026-10-02 10:22:45', '2026-10-02 10:22:45');
INSERT INTO `producto_unidades` (`id`, `producto_id`, `sucursal_id`, `numero_serie`, `estado_unidad_id`, `tipo_destino`, `disponible_venta`, `condicion`, `observaciones`, `costo_adquisicion`, `fecha_ingreso`, `created_at`, `updated_at`) VALUES (8, 3, 1, 'EPS-L3250-X58821', 2, 'VENTA', 0, 'NUEVO', 'Mostrador', NULL, '2026-10-02 10:22:45', '2026-10-02 10:22:45', '2026-10-05 20:03:57');
INSERT INTO `producto_unidades` (`id`, `producto_id`, `sucursal_id`, `numero_serie`, `estado_unidad_id`, `tipo_destino`, `disponible_venta`, `condicion`, `observaciones`, `costo_adquisicion`, `fecha_ingreso`, `created_at`, `updated_at`) VALUES (9, 3, 1, 'EPS-L3250-X58822', 1, 'VENTA', 1, 'NUEVO', 'Almacén central', NULL, '2026-10-02 10:22:45', '2026-10-02 10:22:45', '2026-10-02 10:22:45');
INSERT INTO `producto_unidades` (`id`, `producto_id`, `sucursal_id`, `numero_serie`, `estado_unidad_id`, `tipo_destino`, `disponible_venta`, `condicion`, `observaciones`, `costo_adquisicion`, `fecha_ingreso`, `created_at`, `updated_at`) VALUES (10, 3, 1, 'EPS-L3250-X58823', 1, 'VENTA', 1, 'NUEVO', 'Almacén central', NULL, '2026-10-02 10:22:45', '2026-10-02 10:22:45', '2026-10-02 10:22:45');
INSERT INTO `producto_unidades` (`id`, `producto_id`, `sucursal_id`, `numero_serie`, `estado_unidad_id`, `tipo_destino`, `disponible_venta`, `condicion`, `observaciones`, `costo_adquisicion`, `fecha_ingreso`, `created_at`, `updated_at`) VALUES (11, 3, 1, 'EPS-L3250-X58824', 5, 'VENTA', 0, 'DEFECTUOSO', 'Llegó con derrame interno de tinta en el empaque. Bloqueado de venta', NULL, '2026-10-02 10:22:45', '2026-10-02 10:22:45', '2026-10-02 10:22:45');
INSERT INTO `producto_unidades` (`id`, `producto_id`, `sucursal_id`, `numero_serie`, `estado_unidad_id`, `tipo_destino`, `disponible_venta`, `condicion`, `observaciones`, `costo_adquisicion`, `fecha_ingreso`, `created_at`, `updated_at`) VALUES (12, 3, 1, 'EPS-L3250-X58825', 1, 'VENTA', 1, 'NUEVO', 'Almacén central', NULL, '2026-10-02 10:22:45', '2026-10-02 10:22:45', '2026-10-02 10:22:45');
INSERT INTO `producto_unidades` (`id`, `producto_id`, `sucursal_id`, `numero_serie`, `estado_unidad_id`, `tipo_destino`, `disponible_venta`, `condicion`, `observaciones`, `costo_adquisicion`, `fecha_ingreso`, `created_at`, `updated_at`) VALUES (13, 7, 1, 'aas', 1, 'VENTA', 1, 'NUEVO', NULL, NULL, '2026-10-02 10:35:05', '2026-10-02 10:35:05', '2026-10-02 10:35:05');

-- -------------------------------------------------------------------
-- Estructura de tabla para: `productos`
-- -------------------------------------------------------------------
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos volcados para: `productos` (8 registros)
INSERT INTO `productos` (`id`, `codigo`, `nombre`, `descripcion`, `categoria_id`, `marca_id`, `modelo_id`, `requiere_serie`, `disponible_venta`, `tipo_destino`, `precio_venta`, `precio_costo`, `stock_minimo`, `estado_id`, `created_at`, `updated_at`) VALUES (1, 'LAP-LEN-X1', 'Laptop Lenovo ThinkPad X1 Carbon Gen 14 Aura Edition', 'Ultrabook corporativo 14" OLED Intel Core Ultra 7 32GB 1TB SSD', 1, 1, 1, 1, 1, 'VENTA', '7899.00', '6200.00', 2, 1, '2026-10-02 10:22:45', '2026-10-02 10:22:45');
INSERT INTO `productos` (`id`, `codigo`, `nombre`, `descripcion`, `categoria_id`, `marca_id`, `modelo_id`, `requiere_serie`, `disponible_venta`, `tipo_destino`, `precio_venta`, `precio_costo`, `stock_minimo`, `estado_id`, `created_at`, `updated_at`) VALUES (2, 'LAP-LEN-GB15', 'Laptop Lenovo Googlebook 15 Core i5', 'Portátil 15.6" FHD Core i5-1335U 16GB 512GB SSD', 1, 1, 2, 1, 1, 'VENTA', '2850.00', '2200.00', 3, 1, '2026-10-02 10:22:45', '2026-10-02 10:22:45');
INSERT INTO `productos` (`id`, `codigo`, `nombre`, `descripcion`, `categoria_id`, `marca_id`, `modelo_id`, `requiere_serie`, `disponible_venta`, `tipo_destino`, `precio_venta`, `precio_costo`, `stock_minimo`, `estado_id`, `created_at`, `updated_at`) VALUES (3, 'IMP-EPS-L3250', 'Impresora Multifuncional Epson EcoTank L3250 WiFi', 'Sistema continuo original tintas T544', 2, 6, 6, 1, 1, 'VENTA', '850.00', '680.00', 2, 1, '2026-10-02 10:22:45', '2026-10-02 10:22:45');
INSERT INTO `productos` (`id`, `codigo`, `nombre`, `descripcion`, `categoria_id`, `marca_id`, `modelo_id`, `requiere_serie`, `disponible_venta`, `tipo_destino`, `precio_venta`, `precio_costo`, `stock_minimo`, `estado_id`, `created_at`, `updated_at`) VALUES (4, 'REP-SSD-1TB', 'SSD Kingston NV2 1TB NVMe M.2 2280', 'Almacenamiento de alta velocidad PCIe 4.0', 5, 2, NULL, 0, 1, 'MIXTO', '280.00', '195.00', 5, 1, '2026-10-02 10:22:45', '2026-10-02 10:22:45');
INSERT INTO `productos` (`id`, `codigo`, `nombre`, `descripcion`, `categoria_id`, `marca_id`, `modelo_id`, `requiere_serie`, `disponible_venta`, `tipo_destino`, `precio_venta`, `precio_costo`, `stock_minimo`, `estado_id`, `created_at`, `updated_at`) VALUES (5, 'REP-PAS-MX4', 'Pasta Térmica Arctic MX-4 4g Taller', 'Insumo técnico para mantenimiento preventivo', 6, 2, NULL, 0, 0, 'SERVICIO_TALLER', '35.00', '20.00', 10, 1, '2026-10-02 10:22:45', '2026-10-02 10:22:45');
INSERT INTO `productos` (`id`, `codigo`, `nombre`, `descripcion`, `categoria_id`, `marca_id`, `modelo_id`, `requiere_serie`, `disponible_venta`, `tipo_destino`, `precio_venta`, `precio_costo`, `stock_minimo`, `estado_id`, `created_at`, `updated_at`) VALUES (6, 'PRD-74319', 'HP Pavilion 15-eg0021la', '', 1, 2, 4, 1, 0, 'VENTA', '54854.00', '0.00', 3, 1, '2026-10-02 10:33:55', '2026-10-02 10:33:55');
INSERT INTO `productos` (`id`, `codigo`, `nombre`, `descripcion`, `categoria_id`, `marca_id`, `modelo_id`, `requiere_serie`, `disponible_venta`, `tipo_destino`, `precio_venta`, `precio_costo`, `stock_minimo`, `estado_id`, `created_at`, `updated_at`) VALUES (7, 'PRD-44892', 'Predator Helios 18 AI', '', 2, 7, 5, 1, 1, 'VENTA', '0.00', '0.00', 3, 1, '2026-10-02 10:34:20', '2026-10-02 10:35:05');
INSERT INTO `productos` (`id`, `codigo`, `nombre`, `descripcion`, `categoria_id`, `marca_id`, `modelo_id`, `requiere_serie`, `disponible_venta`, `tipo_destino`, `precio_venta`, `precio_costo`, `stock_minimo`, `estado_id`, `created_at`, `updated_at`) VALUES (8, 'PRD-68928', 'Predator Helios 18 AI', '', 1, 7, 5, 1, 1, 'VENTA', '0.00', '0.00', 3, 1, '2026-10-02 10:34:43', '2026-10-02 10:34:43');

-- -------------------------------------------------------------------
-- Estructura de tabla para: `proveedores`
-- -------------------------------------------------------------------
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------
-- Estructura de tabla para: `rol_permisos`
-- -------------------------------------------------------------------
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

-- Datos volcados para: `rol_permisos` (61 registros)
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (1, 1, '2026-09-20 18:22:29');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (1, 2, '2026-09-20 18:22:29');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (1, 3, '2026-09-20 18:22:29');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (1, 4, '2026-09-20 18:22:29');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (1, 5, '2026-09-20 18:22:29');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (1, 6, '2026-09-20 18:22:29');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (1, 7, '2026-09-20 18:22:29');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (1, 8, '2026-09-20 18:22:29');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (1, 9, '2026-09-20 18:22:29');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (1, 10, '2026-09-20 18:22:29');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (1, 11, '2026-09-20 18:22:29');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (1, 12, '2026-09-20 18:22:29');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (1, 13, '2026-09-20 18:22:29');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (1, 14, '2026-09-20 18:22:29');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (1, 15, '2026-09-20 18:22:29');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (2, 4, '2026-09-20 18:22:29');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (2, 6, '2026-09-20 18:22:29');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (2, 7, '2026-09-20 18:22:29');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (2, 8, '2026-09-20 18:22:29');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (3, 6, '2026-09-20 18:22:29');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (3, 7, '2026-09-20 18:22:29');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (3, 9, '2026-09-20 18:22:29');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (4, 1, '2026-09-20 18:22:29');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (4, 8, '2026-09-20 18:22:29');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (4, 9, '2026-09-20 18:22:29');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (5, 3, '2026-09-20 18:22:29');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (5, 5, '2026-09-20 18:22:29');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (5, 9, '2026-09-20 18:22:29');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (5, 10, '2026-09-20 18:22:29');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (5, 11, '2026-09-20 18:22:29');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (5, 15, '2026-09-20 18:22:29');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (6, 1, '2026-09-20 18:22:29');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (6, 2, '2026-09-20 18:22:29');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (7, 1, '2026-09-24 11:41:26');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (7, 2, '2026-09-24 11:41:26');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (7, 3, '2026-09-24 11:41:26');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (7, 4, '2026-09-24 11:41:26');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (7, 5, '2026-09-24 11:41:26');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (7, 6, '2026-09-24 11:41:26');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (7, 7, '2026-09-24 11:41:26');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (7, 8, '2026-09-24 11:41:26');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (7, 9, '2026-09-24 11:41:26');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (7, 10, '2026-09-24 11:41:26');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (7, 11, '2026-09-24 11:41:26');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (7, 12, '2026-09-24 11:41:26');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (7, 13, '2026-09-24 11:41:26');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (7, 14, '2026-09-24 11:41:26');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (7, 15, '2026-09-24 11:41:26');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (9, 1, '2026-09-26 02:01:46');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (9, 2, '2026-09-26 02:01:46');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (10, 1, '2026-09-26 02:18:16');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (10, 2, '2026-09-26 02:18:16');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (10, 8, '2026-09-26 02:18:16');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (10, 14, '2026-09-26 02:18:16');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (11, 1, '2026-09-26 07:16:04');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (12, 4, '2026-10-02 09:39:34');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (12, 5, '2026-10-02 09:39:34');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (12, 6, '2026-10-02 09:39:34');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (12, 7, '2026-10-02 09:39:34');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (12, 8, '2026-10-02 09:39:34');
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`, `created_at`) VALUES (12, 11, '2026-10-02 09:39:34');

-- -------------------------------------------------------------------
-- Estructura de tabla para: `roles`
-- -------------------------------------------------------------------
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
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Roles del sistema con m├│dulos predeterminados por rol';

-- -------------------------------------------------------------------
-- Estructura de tabla para: `sesiones_tokens`
-- -------------------------------------------------------------------
DROP TABLE IF EXISTS `sesiones_tokens`;
CREATE TABLE `sesiones_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `token_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '├Ültimos 32 chars del JWT como identificador',
  `ip_origen` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'IP del cliente (IPv4/IPv6)',
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expira_en` datetime NOT NULL,
  `revocado` tinyint(1) DEFAULT '0' COMMENT 'TRUE = sesi├│n cerrada o revocada',
  `revocado_en` datetime DEFAULT NULL COMMENT 'Timestamp de revocaci├│n',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sesiones_token` (`token_hash`),
  KEY `idx_sesiones_usuario` (`usuario_id`,`revocado`),
  KEY `idx_sesiones_expira` (`expira_en`),
  CONSTRAINT `fk_sesiones_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Auditor├¡a de sesiones JWT activas y revocadas';

-- Datos volcados para: `sesiones_tokens` (41 registros)
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (1, 1, 'Yahio9Gjsi5-POI9dAo9q8u9KrQQHMgw', '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.26100.9444', '2026-09-20 21:39:48', 1, '2026-09-20 13:40:28', '2026-09-20 13:39:47');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (2, 1, 'h6bPzm9t4grbEmT5j73DO93zPt4DeYBE', '127.0.0.1', 'curl/8.21.0', '2026-09-20 21:40:13', 1, '2026-09-20 13:40:28', '2026-09-20 13:40:13');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (3, 2, 'zTexn5z0k4q4uk8tOWDGQuNx46VBbHlU', '127.0.0.1', 'curl/8.21.0', '2026-09-20 21:40:37', 0, NULL, '2026-09-20 13:40:37');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (4, 3, '_2FyF9ADOVY5fTbA4ksCTrrcVwKtR4PY', '127.0.0.1', 'curl/8.21.0', '2026-09-20 21:40:44', 0, NULL, '2026-09-20 13:40:43');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (5, 1, 'ucefujynkFJvz--1pQNFNV_HXrtCXnHw', '127.0.0.1', 'curl/8.21.0', '2026-09-20 21:41:07', 0, NULL, '2026-09-20 13:41:07');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (6, 1, 'OhGvnAgC5U_evxiPoSKw57Qvv5hopjys', '127.0.0.1', 'node', '2026-09-24 14:38:45', 0, NULL, '2026-09-24 06:38:44');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (7, 1, 'RevgGR9YtMLLcdoi28X3935uZNdGDh-4', '127.0.0.1', 'node', '2026-09-24 14:39:00', 0, NULL, '2026-09-24 06:39:00');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (8, 1, 'wvoq1BZDu4n1kb9CserdZZd3Z62G3qX0', '127.0.0.1', 'node', '2026-09-24 14:39:27', 0, NULL, '2026-09-24 06:39:27');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (9, 6, 'ob55K4RIw-SknZxEYPGmBGv-T7KiDIGA', '127.0.0.1', 'node', '2026-09-24 14:41:57', 1, '2026-09-25 17:17:47', '2026-09-24 06:41:57');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (10, 6, 'UIq4LZx-VH-VHuCOoU-O37mVO0qHmSJ4', '127.0.0.1', 'node', '2026-09-24 14:47:20', 1, '2026-09-25 17:17:47', '2026-09-24 06:47:19');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (11, 6, 'U-E-9jG9O3w0EOltoD7IuREWDEETcCBQ', '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.26100.9444', '2026-09-24 15:00:51', 1, '2026-09-25 17:17:47', '2026-09-24 07:00:51');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (12, 6, 'EDwm886LjOV1BoJREuqJV2lT26fQqOeg', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '2026-09-26 00:30:55', 1, '2026-09-25 17:17:47', '2026-09-25 16:30:54');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (13, 6, '8v_NURZpoB3rppzZOdza7-wcML_EKxRA', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '2026-09-26 04:58:51', 1, '2026-09-25 21:03:05', '2026-09-25 20:58:51');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (14, 8, 'yExj_DMvlJKh_eJuYMF-92lC5FgyYKVg', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '2026-09-26 05:03:10', 1, '2026-09-25 21:03:51', '2026-09-25 21:03:09');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (15, 6, 'ZwU7Yj9uKSvFBZaBGBciC4fazlk49LwI', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '2026-09-26 05:03:56', 1, '2026-09-26 02:04:21', '2026-09-25 21:03:55');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (16, 6, 'hihSVIo22rl-Yb3iMmhQgAR5qzd5D1s0', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', '2026-09-26 10:04:25', 1, '2026-09-26 02:14:45', '2026-09-26 02:04:25');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (17, 6, 'RddsOIvAiMzW52OXrYc6eEZ7U2EKpB-E', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', '2026-09-26 10:15:03', 1, '2026-09-26 02:20:38', '2026-09-26 02:15:03');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (18, 10, 'Osxj-byaASn3YGjpXNVPSkMPfGv4lc8M', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', '2026-09-26 10:20:43', 1, '2026-09-26 02:22:52', '2026-09-26 02:20:42');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (19, 6, '7N9xosn1IdFQvjx8lA-qdBThOW9XhyNk', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', '2026-09-26 10:23:34', 1, '2026-09-26 02:23:50', '2026-09-26 02:23:34');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (20, 6, 'oKD8CQo6xlvuIIrQeb2q8zG9wyRRUz80', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', '2026-09-26 10:24:06', 1, '2026-09-29 22:40:36', '2026-09-26 02:24:06');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (21, 6, 'myStegANa0Cw4XNp6VALVPPjxgL_1q0g', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', '2026-09-30 04:37:16', 1, '2026-09-29 22:40:36', '2026-09-29 20:37:16');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (22, 6, 'h0N44FBWMRNq2Pr-alxw3n6VtokIQRcw', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', '2026-09-30 06:41:08', 1, '2026-09-29 22:44:42', '2026-09-29 22:41:08');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (23, 11, 'BaNM4a4MAosuvZP3z980Z4DCPm4SStVk', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', '2026-09-30 06:44:58', 1, '2026-09-29 22:45:26', '2026-09-29 22:44:57');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (24, 11, 'jIZwluJQREOMHIO-uxvFfAvELCOme8i8', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', '2026-09-30 06:47:21', 1, '2026-09-29 22:47:25', '2026-09-29 22:47:21');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (25, 6, 'dXu8w2YOS4o-froynLJyd37jgrkwAY7s', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', '2026-09-30 06:48:34', 1, '2026-09-29 23:26:33', '2026-09-29 22:48:34');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (26, 6, 'gn--GzV3T8PXiieSdI9CNCwax_0-xY0A', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', '2026-09-30 07:26:41', 1, '2026-09-29 23:39:58', '2026-09-29 23:26:41');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (27, 6, 'yJZrE_y6rpm-UKgRA1cd9WSTmeWDPDzQ', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', '2026-09-30 07:59:39', 1, '2026-09-30 00:02:23', '2026-09-29 23:59:38');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (28, 12, 'soFVZXSXsvHdJSNHR3e8PUZrbXkaJwqo', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', '2026-09-30 08:02:40', 1, '2026-09-30 00:03:41', '2026-09-30 00:02:40');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (29, 6, '0xGGE1ejkhSIqypdB_PJvT4bkRT7GQFI', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', '2026-09-30 08:10:14', 1, '2026-09-30 00:15:54', '2026-09-30 00:10:13');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (30, 6, 'vEe4SnM--jR6eSm2ZBquUctd-PskGIc4', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', '2026-09-30 09:25:40', 1, '2026-10-02 04:46:39', '2026-09-30 01:25:39');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (31, 6, '0SbC94TWUMrjSBI66t22zUAOunx02zAM', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', '2026-09-30 11:53:47', 1, '2026-10-02 04:46:39', '2026-09-30 03:53:47');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (32, 6, 'o_BSxUfRZPgb2M5oy27E3o7lsPtGwKfA', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', '2026-10-02 12:36:23', 1, '2026-10-02 04:46:39', '2026-10-02 04:36:23');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (33, 6, 'ct8gwHUywJUw4qOcklWrUn1LUP2MrmBA', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', '2026-10-02 12:53:03', 1, '2026-10-02 04:53:12', '2026-10-02 04:53:03');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (34, 6, 'lx30DV78L9V82uxP15fbbMLVKv3Gr-PE', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', '2026-10-02 12:56:12', 1, '2026-10-02 05:02:12', '2026-10-02 04:56:12');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (35, 6, 'bvyTM5yItsEprGxG-CJUcaKigoIYMWN4', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', '2026-10-02 13:15:35', 1, '2026-10-02 05:30:56', '2026-10-02 05:15:34');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (36, 6, 'uJAAm3RK9vSmJXF4hDJ-Ane1d82TN0J0', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', '2026-10-02 13:31:50', 1, '2026-10-03 01:20:19', '2026-10-02 05:31:50');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (37, 6, 'fEk5jgG1b9gY8d19DIwSuhzzGxiuLnK8', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', '2026-10-03 09:18:32', 1, '2026-10-03 01:20:19', '2026-10-03 01:18:31');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (38, 6, 'Qr7JiNHIw9DUD0aGIMQ4uHe9DaJ8bNwY', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', '2026-10-03 09:23:01', 1, '2026-10-03 01:24:19', '2026-10-03 01:23:01');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (39, 12, 'TJG-q5FRRR-GQMxxFKXp-OhCMsClFOPU', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', '2026-10-03 09:26:07', 1, '2026-10-03 01:26:16', '2026-10-03 01:26:06');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (40, 6, '16AX01T4p6eR0g60ha3f2ZyTWSRh6Xmw', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', '2026-10-03 09:27:02', 0, NULL, '2026-10-03 01:27:01');
INSERT INTO `sesiones_tokens` (`id`, `usuario_id`, `token_hash`, `ip_origen`, `user_agent`, `expira_en`, `revocado`, `revocado_en`, `created_at`) VALUES (41, 6, '-WitKWk3iMA0e8bAEdxebgFbFSYe8hv8', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', '2026-10-06 07:36:41', 0, NULL, '2026-10-05 23:36:40');

-- -------------------------------------------------------------------
-- Estructura de tabla para: `sucursales`
-- -------------------------------------------------------------------
DROP TABLE IF EXISTS `sucursales`;
CREATE TABLE `sucursales` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empresa_id` int NOT NULL,
  `codigo` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'C├│digo correlativo: 0000, 0001, etc.',
  `nombre` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `direccion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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

-- Datos volcados para: `sucursales` (6 registros)
INSERT INTO `sucursales` (`id`, `empresa_id`, `codigo`, `nombre`, `direccion`, `telefono`, `es_principal`, `estado_id`, `created_at`, `updated_at`) VALUES (1, 1, '0000', 'Principal - Chiclayo Centro', 'AV. PEDRO RUIZ NRO. 349 INT. 09C, Chiclayo', '(074) 283921', 1, 1, '2026-09-20 13:21:30', '2026-09-30 01:47:53');
INSERT INTO `sucursales` (`id`, `empresa_id`, `codigo`, `nombre`, `direccion`, `telefono`, `es_principal`, `estado_id`, `created_at`, `updated_at`) VALUES (2, 1, '0001', 'Sucursal Lambayeque Norte', 'Av. Ramón Castilla 450, Lambayeque', '(074) 281190', 0, 1, '2026-09-20 13:21:30', '2026-09-30 01:47:53');
INSERT INTO `sucursales` (`id`, `empresa_id`, `codigo`, `nombre`, `direccion`, `telefono`, `es_principal`, `estado_id`, `created_at`, `updated_at`) VALUES (3, 1, '0003', 'CHICLAYO BALTA', 'AV.656', '48554699//9', 0, 1, '2026-09-30 01:47:28', '2026-09-30 01:47:38');
INSERT INTO `sucursales` (`id`, `empresa_id`, `codigo`, `nombre`, `direccion`, `telefono`, `es_principal`, `estado_id`, `created_at`, `updated_at`) VALUES (4, 1, '0002', 'Almacén Central Pomalca', 'Carretera Pomalca Km 4.5', '(074) 609923', 0, 1, '2026-09-30 01:47:53', '2026-09-30 01:47:53');
INSERT INTO `sucursales` (`id`, `empresa_id`, `codigo`, `nombre`, `direccion`, `telefono`, `es_principal`, `estado_id`, `created_at`, `updated_at`) VALUES (5, 1, '0004', 'MALL AVENTURA', 'MALL AVENTURA', '658962656956', 0, 1, '2026-09-30 02:54:46', '2026-09-30 02:54:46');
INSERT INTO `sucursales` (`id`, `empresa_id`, `codigo`, `nombre`, `direccion`, `telefono`, `es_principal`, `estado_id`, `created_at`, `updated_at`) VALUES (6, 1, '0005', 'LAMBEYEQUE', 'REAL PLAZA LAMAAQUEYEQUE', '074-626495', 0, 1, '2026-09-30 03:13:36', '2026-09-30 03:13:36');

-- -------------------------------------------------------------------
-- Estructura de tabla para: `tecnicos`
-- -------------------------------------------------------------------
DROP TABLE IF EXISTS `tecnicos`;
CREATE TABLE `tecnicos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `especialidad` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado_id` int NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id` (`usuario_id`),
  KEY `fk_tecnicos_estado` (`estado_id`),
  CONSTRAINT `fk_tecnicos_estado` FOREIGN KEY (`estado_id`) REFERENCES `estados` (`id`),
  CONSTRAINT `fk_tecnicos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------
-- Estructura de tabla para: `tipos_comprobante`
-- -------------------------------------------------------------------
DROP TABLE IF EXISTS `tipos_comprobante`;
CREATE TABLE `tipos_comprobante` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(25) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'BOLETA, FACTURA, NOTA_VENTA, GUIA_REMISION',
  `nombre` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `serie_defecto` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'B001',
  `estado_id` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `fk_tipos_comp_estado` (`estado_id`),
  CONSTRAINT `fk_tipos_comp_estado` FOREIGN KEY (`estado_id`) REFERENCES `estados` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo maestro de tipos de comprobante de pago';

-- Datos volcados para: `tipos_comprobante` (4 registros)
INSERT INTO `tipos_comprobante` (`id`, `codigo`, `nombre`, `serie_defecto`, `estado_id`, `created_at`) VALUES (1, 'BOLETA', 'Boleta de Venta Electrónica', 'B001', 1, '2026-09-24 03:23:41');
INSERT INTO `tipos_comprobante` (`id`, `codigo`, `nombre`, `serie_defecto`, `estado_id`, `created_at`) VALUES (2, 'FACTURA', 'Factura Electrónica', 'F001', 1, '2026-09-24 03:23:41');
INSERT INTO `tipos_comprobante` (`id`, `codigo`, `nombre`, `serie_defecto`, `estado_id`, `created_at`) VALUES (3, 'NOTA_VENTA', 'Nota de Venta Interna', 'NV01', 1, '2026-09-24 03:23:41');
INSERT INTO `tipos_comprobante` (`id`, `codigo`, `nombre`, `serie_defecto`, `estado_id`, `created_at`) VALUES (4, 'GUIA_REMISION', 'Guía de Remisión Remitente', 'T001', 1, '2026-09-24 03:23:41');

-- -------------------------------------------------------------------
-- Estructura de tabla para: `tipos_documento`
-- -------------------------------------------------------------------
DROP TABLE IF EXISTS `tipos_documento`;
CREATE TABLE `tipos_documento` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'DNI, RUC, CE, PASAPORTE',
  `nombre` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `longitud_exacta` tinyint unsigned DEFAULT NULL COMMENT '8 para DNI, 11 para RUC',
  `estado_id` int NOT NULL DEFAULT '1' COMMENT 'FK a estados',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `fk_tipos_doc_estado` (`estado_id`),
  CONSTRAINT `fk_tipos_doc_estado` FOREIGN KEY (`estado_id`) REFERENCES `estados` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo maestro de tipos de documento de identidad';

-- Datos volcados para: `tipos_documento` (4 registros)
INSERT INTO `tipos_documento` (`id`, `codigo`, `nombre`, `longitud_exacta`, `estado_id`, `created_at`) VALUES (1, 'DNI', 'Documento Nacional de Identidad', 8, 1, '2026-09-24 03:23:41');
INSERT INTO `tipos_documento` (`id`, `codigo`, `nombre`, `longitud_exacta`, `estado_id`, `created_at`) VALUES (2, 'RUC', 'Registro Único de Contribuyentes', 11, 1, '2026-09-24 03:23:41');
INSERT INTO `tipos_documento` (`id`, `codigo`, `nombre`, `longitud_exacta`, `estado_id`, `created_at`) VALUES (3, 'CE', 'Carnet de Extranjería', 9, 1, '2026-09-24 03:23:41');
INSERT INTO `tipos_documento` (`id`, `codigo`, `nombre`, `longitud_exacta`, `estado_id`, `created_at`) VALUES (4, 'PASAPORTE', 'Pasaporte', 12, 1, '2026-09-24 03:23:41');

-- -------------------------------------------------------------------
-- Estructura de tabla para: `tipos_equipo`
-- -------------------------------------------------------------------
DROP TABLE IF EXISTS `tipos_equipo`;
CREATE TABLE `tipos_equipo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'LAPTOP, PC_ESCRITORIO, etc.',
  `nombre` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado_id` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `fk_tipos_equipo_estado` (`estado_id`),
  CONSTRAINT `fk_tipos_equipo_estado` FOREIGN KEY (`estado_id`) REFERENCES `estados` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo maestro de tipos de equipo recibidos en taller';

-- Datos volcados para: `tipos_equipo` (7 registros)
INSERT INTO `tipos_equipo` (`id`, `codigo`, `nombre`, `estado_id`, `created_at`) VALUES (1, 'LAPTOP', 'Laptop / Notebook', 1, '2026-09-24 03:23:41');
INSERT INTO `tipos_equipo` (`id`, `codigo`, `nombre`, `estado_id`, `created_at`) VALUES (2, 'PC_ESCRITORIO', 'Computadora de Escritorio / Torre', 1, '2026-09-24 03:23:41');
INSERT INTO `tipos_equipo` (`id`, `codigo`, `nombre`, `estado_id`, `created_at`) VALUES (3, 'IMPRESORA', 'Impresora / Multifuncional', 1, '2026-09-24 03:23:41');
INSERT INTO `tipos_equipo` (`id`, `codigo`, `nombre`, `estado_id`, `created_at`) VALUES (4, 'MONITOR', 'Monitor / Pantalla', 1, '2026-09-24 03:23:41');
INSERT INTO `tipos_equipo` (`id`, `codigo`, `nombre`, `estado_id`, `created_at`) VALUES (5, 'COMPONENTE', 'Componente / Tarjeta / Placa', 1, '2026-09-24 03:23:41');
INSERT INTO `tipos_equipo` (`id`, `codigo`, `nombre`, `estado_id`, `created_at`) VALUES (6, 'SERVIDOR', 'Servidor / Rack', 1, '2026-09-24 03:23:41');
INSERT INTO `tipos_equipo` (`id`, `codigo`, `nombre`, `estado_id`, `created_at`) VALUES (7, 'OTRO', 'Otro Dispositivo Electrónico', 1, '2026-09-24 03:23:41');

-- -------------------------------------------------------------------
-- Estructura de tabla para: `tipos_producto_detalle`
-- -------------------------------------------------------------------
DROP TABLE IF EXISTS `tipos_producto_detalle`;
CREATE TABLE `tipos_producto_detalle` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado_id` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `fk_tipos_prod_det_estado` (`estado_id`),
  CONSTRAINT `fk_tipos_prod_det_estado` FOREIGN KEY (`estado_id`) REFERENCES `estados` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo de destino de unidades individuales de producto';

-- Datos volcados para: `tipos_producto_detalle` (3 registros)
INSERT INTO `tipos_producto_detalle` (`id`, `codigo`, `nombre`, `estado_id`, `created_at`) VALUES (1, 'VENTA', 'Unidad para Venta Directa', 1, '2026-09-24 03:23:41');
INSERT INTO `tipos_producto_detalle` (`id`, `codigo`, `nombre`, `estado_id`, `created_at`) VALUES (2, 'SERVICIO', 'Unidad asignada a Taller / Servicio Técnico', 1, '2026-09-24 03:23:41');
INSERT INTO `tipos_producto_detalle` (`id`, `codigo`, `nombre`, `estado_id`, `created_at`) VALUES (3, 'GARANTIA', 'Unidad de Reemplazo por Garantía', 1, '2026-09-24 03:23:41');

-- -------------------------------------------------------------------
-- Estructura de tabla para: `usuario_permisos`
-- -------------------------------------------------------------------
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

-- Datos volcados para: `usuario_permisos` (31 registros)
INSERT INTO `usuario_permisos` (`usuario_id`, `permiso_id`, `permitido`, `created_at`) VALUES (1, 1, 1, '2026-09-20 13:22:29');
INSERT INTO `usuario_permisos` (`usuario_id`, `permiso_id`, `permitido`, `created_at`) VALUES (1, 2, 1, '2026-09-20 13:22:29');
INSERT INTO `usuario_permisos` (`usuario_id`, `permiso_id`, `permitido`, `created_at`) VALUES (1, 3, 1, '2026-09-20 13:22:29');
INSERT INTO `usuario_permisos` (`usuario_id`, `permiso_id`, `permitido`, `created_at`) VALUES (1, 4, 1, '2026-09-20 13:22:29');
INSERT INTO `usuario_permisos` (`usuario_id`, `permiso_id`, `permitido`, `created_at`) VALUES (1, 5, 1, '2026-09-20 13:22:29');
INSERT INTO `usuario_permisos` (`usuario_id`, `permiso_id`, `permitido`, `created_at`) VALUES (1, 6, 1, '2026-09-20 13:22:29');
INSERT INTO `usuario_permisos` (`usuario_id`, `permiso_id`, `permitido`, `created_at`) VALUES (1, 7, 1, '2026-09-20 13:22:29');
INSERT INTO `usuario_permisos` (`usuario_id`, `permiso_id`, `permitido`, `created_at`) VALUES (1, 8, 1, '2026-09-20 13:22:29');
INSERT INTO `usuario_permisos` (`usuario_id`, `permiso_id`, `permitido`, `created_at`) VALUES (1, 9, 1, '2026-09-20 13:22:29');
INSERT INTO `usuario_permisos` (`usuario_id`, `permiso_id`, `permitido`, `created_at`) VALUES (1, 10, 1, '2026-09-20 13:22:29');
INSERT INTO `usuario_permisos` (`usuario_id`, `permiso_id`, `permitido`, `created_at`) VALUES (1, 11, 1, '2026-09-20 13:22:29');
INSERT INTO `usuario_permisos` (`usuario_id`, `permiso_id`, `permitido`, `created_at`) VALUES (1, 12, 1, '2026-09-20 13:22:29');
INSERT INTO `usuario_permisos` (`usuario_id`, `permiso_id`, `permitido`, `created_at`) VALUES (1, 13, 1, '2026-09-20 13:22:29');
INSERT INTO `usuario_permisos` (`usuario_id`, `permiso_id`, `permitido`, `created_at`) VALUES (1, 14, 1, '2026-09-20 13:22:29');
INSERT INTO `usuario_permisos` (`usuario_id`, `permiso_id`, `permitido`, `created_at`) VALUES (1, 15, 1, '2026-09-20 13:22:29');
INSERT INTO `usuario_permisos` (`usuario_id`, `permiso_id`, `permitido`, `created_at`) VALUES (2, 4, 1, '2026-09-20 13:22:29');
INSERT INTO `usuario_permisos` (`usuario_id`, `permiso_id`, `permitido`, `created_at`) VALUES (2, 6, 1, '2026-09-20 13:22:29');
INSERT INTO `usuario_permisos` (`usuario_id`, `permiso_id`, `permitido`, `created_at`) VALUES (2, 7, 1, '2026-09-20 13:22:29');
INSERT INTO `usuario_permisos` (`usuario_id`, `permiso_id`, `permitido`, `created_at`) VALUES (2, 8, 1, '2026-09-20 13:22:29');
INSERT INTO `usuario_permisos` (`usuario_id`, `permiso_id`, `permitido`, `created_at`) VALUES (3, 6, 1, '2026-09-20 13:22:29');
INSERT INTO `usuario_permisos` (`usuario_id`, `permiso_id`, `permitido`, `created_at`) VALUES (3, 7, 1, '2026-09-20 13:22:29');
INSERT INTO `usuario_permisos` (`usuario_id`, `permiso_id`, `permitido`, `created_at`) VALUES (3, 9, 1, '2026-09-20 13:22:29');
INSERT INTO `usuario_permisos` (`usuario_id`, `permiso_id`, `permitido`, `created_at`) VALUES (4, 1, 1, '2026-09-20 13:22:29');
INSERT INTO `usuario_permisos` (`usuario_id`, `permiso_id`, `permitido`, `created_at`) VALUES (4, 8, 1, '2026-09-20 13:22:29');
INSERT INTO `usuario_permisos` (`usuario_id`, `permiso_id`, `permitido`, `created_at`) VALUES (4, 9, 1, '2026-09-20 13:22:29');
INSERT INTO `usuario_permisos` (`usuario_id`, `permiso_id`, `permitido`, `created_at`) VALUES (5, 3, 1, '2026-09-20 13:22:29');
INSERT INTO `usuario_permisos` (`usuario_id`, `permiso_id`, `permitido`, `created_at`) VALUES (5, 5, 1, '2026-09-20 13:22:29');
INSERT INTO `usuario_permisos` (`usuario_id`, `permiso_id`, `permitido`, `created_at`) VALUES (5, 9, 1, '2026-09-20 13:22:29');
INSERT INTO `usuario_permisos` (`usuario_id`, `permiso_id`, `permitido`, `created_at`) VALUES (5, 10, 1, '2026-09-20 13:22:29');
INSERT INTO `usuario_permisos` (`usuario_id`, `permiso_id`, `permitido`, `created_at`) VALUES (5, 11, 1, '2026-09-20 13:22:29');
INSERT INTO `usuario_permisos` (`usuario_id`, `permiso_id`, `permitido`, `created_at`) VALUES (5, 15, 1, '2026-09-20 13:22:29');

-- -------------------------------------------------------------------
-- Estructura de tabla para: `usuarios`
-- -------------------------------------------------------------------
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre de usuario para login',
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Hash bcrypt de la contrase├▒a',
  `nombre_completo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono_cifrado` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Tel├®fono encriptado con AES-256-CBC',
  `tipo_documento_id` int NOT NULL DEFAULT '1',
  `numero_documento_cifrado` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nro de documento encriptado con AES-256-CBC',
  `persona_id` int DEFAULT NULL,
  `rol_id` int NOT NULL,
  `sucursal_id` int DEFAULT NULL COMMENT 'Sede base asignada al usuario',
  `estado_id` int NOT NULL DEFAULT '1' COMMENT 'FK a estados (1=ACTIVO, 2=INACTIVO, 3=SUSPENDIDO)',
  `avatar_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cuentas del personal con credenciales y datos sensibles cifrados';

-- Datos volcados para: `usuarios` (13 registros)
INSERT INTO `usuarios` (`id`, `username`, `password_hash`, `nombre_completo`, `email`, `telefono_cifrado`, `tipo_documento_id`, `numero_documento_cifrado`, `persona_id`, `rol_id`, `sucursal_id`, `estado_id`, `avatar_url`, `requiere_cambio_password`, `intentos_fallidos`, `bloqueado_hasta`, `ultimo_acceso`, `created_at`, `updated_at`, `created_by`) VALUES (1, 'admin', '$2b$10$2Wbpwwlyf3ymF.kNVdLbIeTNP.XN.OMnlgLbyu36UvmpyZxOxwAwC', 'Administrador Principal', 'admin@mgsolutions.pe', NULL, 1, NULL, NULL, 1, 1, 1, NULL, 0, 0, NULL, '2026-09-24 06:39:27', '2026-09-20 13:21:30', '2026-09-24 06:39:27', NULL);
INSERT INTO `usuarios` (`id`, `username`, `password_hash`, `nombre_completo`, `email`, `telefono_cifrado`, `tipo_documento_id`, `numero_documento_cifrado`, `persona_id`, `rol_id`, `sucursal_id`, `estado_id`, `avatar_url`, `requiere_cambio_password`, `intentos_fallidos`, `bloqueado_hasta`, `ultimo_acceso`, `created_at`, `updated_at`, `created_by`) VALUES (2, 'secretaria', '$2b$10$2Wbpwwlyf3ymF.kNVdLbIeTNP.XN.OMnlgLbyu36UvmpyZxOxwAwC', 'Ana Torres (Secretaria)', 'secretaria@mgsolutions.pe', NULL, 1, NULL, NULL, 2, 1, 1, NULL, 0, 0, NULL, '2026-09-20 13:40:37', '2026-09-20 13:21:30', '2026-09-20 13:40:37', 1);
INSERT INTO `usuarios` (`id`, `username`, `password_hash`, `nombre_completo`, `email`, `telefono_cifrado`, `tipo_documento_id`, `numero_documento_cifrado`, `persona_id`, `rol_id`, `sucursal_id`, `estado_id`, `avatar_url`, `requiere_cambio_password`, `intentos_fallidos`, `bloqueado_hasta`, `ultimo_acceso`, `created_at`, `updated_at`, `created_by`) VALUES (3, 'tecnico', '$2b$10$2Wbpwwlyf3ymF.kNVdLbIeTNP.XN.OMnlgLbyu36UvmpyZxOxwAwC', 'Kevin Ramos (T├®cnico)', 'tecnico@mgsolutions.pe', NULL, 1, NULL, NULL, 3, 1, 1, NULL, 0, 0, NULL, '2026-09-20 13:40:43', '2026-09-20 13:21:30', '2026-09-20 13:40:43', 1);
INSERT INTO `usuarios` (`id`, `username`, `password_hash`, `nombre_completo`, `email`, `telefono_cifrado`, `tipo_documento_id`, `numero_documento_cifrado`, `persona_id`, `rol_id`, `sucursal_id`, `estado_id`, `avatar_url`, `requiere_cambio_password`, `intentos_fallidos`, `bloqueado_hasta`, `ultimo_acceso`, `created_at`, `updated_at`, `created_by`) VALUES (4, 'vendedor', '$2b$10$2Wbpwwlyf3ymF.kNVdLbIeTNP.XN.OMnlgLbyu36UvmpyZxOxwAwC', 'Carlos Mendoza (Ventas)', 'vendedor@mgsolutions.pe', NULL, 1, NULL, NULL, 4, 1, 1, NULL, 0, 0, NULL, NULL, '2026-09-20 13:21:30', '2026-09-20 13:21:30', 1);
INSERT INTO `usuarios` (`id`, `username`, `password_hash`, `nombre_completo`, `email`, `telefono_cifrado`, `tipo_documento_id`, `numero_documento_cifrado`, `persona_id`, `rol_id`, `sucursal_id`, `estado_id`, `avatar_url`, `requiere_cambio_password`, `intentos_fallidos`, `bloqueado_hasta`, `ultimo_acceso`, `created_at`, `updated_at`, `created_by`) VALUES (5, 'almacen', '$2b$10$2Wbpwwlyf3ymF.kNVdLbIeTNP.XN.OMnlgLbyu36UvmpyZxOxwAwC', 'Mario D├¡az (Almac├®n)', 'almacen@mgsolutions.pe', NULL, 1, NULL, NULL, 5, 1, 1, NULL, 0, 0, NULL, NULL, '2026-09-20 13:21:30', '2026-09-20 13:21:30', 1);
INSERT INTO `usuarios` (`id`, `username`, `password_hash`, `nombre_completo`, `email`, `telefono_cifrado`, `tipo_documento_id`, `numero_documento_cifrado`, `persona_id`, `rol_id`, `sucursal_id`, `estado_id`, `avatar_url`, `requiere_cambio_password`, `intentos_fallidos`, `bloqueado_hasta`, `ultimo_acceso`, `created_at`, `updated_at`, `created_by`) VALUES (6, 'superadmin', '$2b$10$mxQexSxoHNG333yAenVxvO2znd25e70K9oFC018lrYG1tvWrhI.7W', 'Super Administrador', 'superadmin@mgsolutions.pe', NULL, 1, NULL, NULL, 7, 1, 1, 'SA', 0, 0, NULL, '2026-10-05 23:36:40', '2026-09-24 06:41:26', '2026-10-05 23:36:40', NULL);
INSERT INTO `usuarios` (`id`, `username`, `password_hash`, `nombre_completo`, `email`, `telefono_cifrado`, `tipo_documento_id`, `numero_documento_cifrado`, `persona_id`, `rol_id`, `sucursal_id`, `estado_id`, `avatar_url`, `requiere_cambio_password`, `intentos_fallidos`, `bloqueado_hasta`, `ultimo_acceso`, `created_at`, `updated_at`, `created_by`) VALUES (8, 'mg-milagros', '$2b$10$DIIjqAOzThKClk8qCAUP7OU.oe4g6h3VPpkHSmiAL.qcPNJ/xFBVa', 'milagros', 'milagros@gmail.com', '0c445c8e5732d8549f52f2b6cbe5bf88:91fd97985d88dc977adab7c1bf722094', 1, '597da2f31f219f94f08faa2e05d1cf28:941a607213c532f3d866422243536366', NULL, 12, 2, 1, NULL, 0, 0, NULL, '2026-09-25 21:03:09', '2026-09-25 21:01:33', '2026-10-02 04:40:39', 6);
INSERT INTO `usuarios` (`id`, `username`, `password_hash`, `nombre_completo`, `email`, `telefono_cifrado`, `tipo_documento_id`, `numero_documento_cifrado`, `persona_id`, `rol_id`, `sucursal_id`, `estado_id`, `avatar_url`, `requiere_cambio_password`, `intentos_fallidos`, `bloqueado_hasta`, `ultimo_acceso`, `created_at`, `updated_at`, `created_by`) VALUES (9, 'guadalupita', '$2b$10$Do/4R1DRXgAc4j6WodJG/.W5MA0Z0EK6qoTM1n82GoS1wqNBeI0Hy', 'GUADALUPE TORRES', 'GUADALUPE123@GMAIL.COM', '3d808e45d567ed63c03bc5c1231d0ed3:c5bcd7db51ea4039464f66e96cddf587', 1, '061a741b01643cfe5062e8e914022055:893bd7073f00fb12daa215b3633ad61c', NULL, 12, 1, 1, NULL, 1, 0, NULL, NULL, '2026-09-25 21:19:37', '2026-10-02 04:40:22', 6);
INSERT INTO `usuarios` (`id`, `username`, `password_hash`, `nombre_completo`, `email`, `telefono_cifrado`, `tipo_documento_id`, `numero_documento_cifrado`, `persona_id`, `rol_id`, `sucursal_id`, `estado_id`, `avatar_url`, `requiere_cambio_password`, `intentos_fallidos`, `bloqueado_hasta`, `ultimo_acceso`, `created_at`, `updated_at`, `created_by`) VALUES (10, 'mg_milagrost', '$2b$10$QaAy69kuYdyyj83tXVIxKOxWUXJZLE28bzx.9P9/wzvEOiT0hAGgm', 'MILAGROS TORRES', 'MG_MILAGROST@GMAIL.COM', 'c19e731008ae040ad8acb492c082b7e0:afdd897d9947202e1c4b3fe0344c88b0', 1, '1c6de0240b230109c99945bf344c02da:71af50066b56cee919153d963a746482', NULL, 11, NULL, 1, NULL, 0, 0, NULL, '2026-09-26 02:20:42', '2026-09-26 02:20:33', '2026-09-26 02:21:07', 6);
INSERT INTO `usuarios` (`id`, `username`, `password_hash`, `nombre_completo`, `email`, `telefono_cifrado`, `tipo_documento_id`, `numero_documento_cifrado`, `persona_id`, `rol_id`, `sucursal_id`, `estado_id`, `avatar_url`, `requiere_cambio_password`, `intentos_fallidos`, `bloqueado_hasta`, `ultimo_acceso`, `created_at`, `updated_at`, `created_by`) VALUES (11, 'MG-128511', '$2b$10$Zga7oRYZv77PSvwZSp.0C.kNewO/pCcj2TtTPj14W2TQ6aghvEctG', 'Milagros Torres', 'milagros2002trabajo@gmail.com', '0af705da2b36a439122cdd72dddedece:0d2dce72adf1e1f0f865794ec50ba542', 1, '4885caf72ab4ab829ad00b5a469bf440:41e31757b63cc24979f84633eab8996d', NULL, 11, NULL, 1, NULL, 0, 0, NULL, '2026-09-29 22:47:21', '2026-09-29 22:44:36', '2026-09-29 22:47:21', 6);
INSERT INTO `usuarios` (`id`, `username`, `password_hash`, `nombre_completo`, `email`, `telefono_cifrado`, `tipo_documento_id`, `numero_documento_cifrado`, `persona_id`, `rol_id`, `sucursal_id`, `estado_id`, `avatar_url`, `requiere_cambio_password`, `intentos_fallidos`, `bloqueado_hasta`, `ultimo_acceso`, `created_at`, `updated_at`, `created_by`) VALUES (12, 'MG-289241', '$2b$10$S6FPQ.GKD7PlTrzradOkEOzW/XxIqxF84JRonA04sNGbBHUd.yJSy', 'ROBERTO MARTIN CELIS', 'C23919@UTP.EDU.PE', '6e7fd3301796fbf9480da0e0552a8d1a:5b5396949b1497d79eeb2efdfc079363', 1, '725ac19e5dacea931d88b6b10bf951a1:33d650dfd80f1de394b4de8a6be883bb', NULL, 10, NULL, 1, NULL, 0, 0, NULL, '2026-10-03 01:26:06', '2026-09-30 00:02:17', '2026-10-03 01:26:06', 6);
INSERT INTO `usuarios` (`id`, `username`, `password_hash`, `nombre_completo`, `email`, `telefono_cifrado`, `tipo_documento_id`, `numero_documento_cifrado`, `persona_id`, `rol_id`, `sucursal_id`, `estado_id`, `avatar_url`, `requiere_cambio_password`, `intentos_fallidos`, `bloqueado_hasta`, `ultimo_acceso`, `created_at`, `updated_at`, `created_by`) VALUES (13, 'MG-709840', '$2b$10$CSq7JIwfnMu4UViGBsdYXutbmiF/zCrcOkqgruEj8e8C37/KSPZHq', 'Jeampierre cachay', 'u21316643@utp.edu.pe', 'efd8f49de3ebca8fc385c6c3ccedb9db:77b122492b2f907ed2b71f182b2b4c31', 1, '866e9bfadb2c99a783cd7e35da972218:786796f168048297a9fed7803a665cd1', NULL, 12, 1, 1, NULL, 1, 2, NULL, NULL, '2026-10-02 04:46:35', '2026-10-02 05:03:00', 6);
INSERT INTO `usuarios` (`id`, `username`, `password_hash`, `nombre_completo`, `email`, `telefono_cifrado`, `tipo_documento_id`, `numero_documento_cifrado`, `persona_id`, `rol_id`, `sucursal_id`, `estado_id`, `avatar_url`, `requiere_cambio_password`, `intentos_fallidos`, `bloqueado_hasta`, `ultimo_acceso`, `created_at`, `updated_at`, `created_by`) VALUES (14, 'MG-495172', '$2b$10$NQm6gjsfFFpf9a4bI4aV0e1MPDvA/ONZ15bvsKDdehfUY/7D3tW4i', 'Guadalupe llamo', 'u20225340@utp.edu.pe', '4b1e2e40873fc9de2f7e18119954b5e5:e40fe30df8a1dd957c488032dc8f3111', 1, '293dbfb5ee49afd5a26e74ec48446714:a466cb7e64217ad690309db1fbe6ed15', NULL, 12, 4, 1, NULL, 1, 0, NULL, NULL, '2026-10-03 01:20:16', '2026-10-03 01:20:16', 6);

-- -------------------------------------------------------------------
-- Estructura de tabla para: `vendedores`
-- -------------------------------------------------------------------
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

-- -------------------------------------------------------------------
-- Estructura de tabla para: `ventas`
-- -------------------------------------------------------------------
DROP TABLE IF EXISTS `ventas`;
CREATE TABLE `ventas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo_comprobante` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
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
  `observaciones` text COLLATE utf8mb4_unicode_ci,
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos volcados para: `ventas` (5 registros)
INSERT INTO `ventas` (`id`, `codigo_comprobante`, `tipo_comprobante_id`, `cliente_id`, `usuario_id`, `sucursal_id`, `subtotal`, `igv`, `total`, `metodo_pago_id`, `estado_id`, `fecha_venta`, `observaciones`) VALUES (1, 'B001-000101', 1, 1, 1, 1, '6694.07', '1204.93', '7899.00', 1, 1, '2026-08-21 15:03:57', 'Venta mostrador de Laptop Corporativa con Garantía Oficial 12 Meses');
INSERT INTO `ventas` (`id`, `codigo_comprobante`, `tipo_comprobante_id`, `cliente_id`, `usuario_id`, `sucursal_id`, `subtotal`, `igv`, `total`, `metodo_pago_id`, `estado_id`, `fecha_venta`, `observaciones`) VALUES (2, 'F001-000042', 2, 2, 1, 1, '720.34', '129.66', '850.00', 4, 1, '2025-10-20 15:03:57', 'Factura corporativa con sistema continuo original. Vence pronto.');
INSERT INTO `ventas` (`id`, `codigo_comprobante`, `tipo_comprobante_id`, `cliente_id`, `usuario_id`, `sucursal_id`, `subtotal`, `igv`, `total`, `metodo_pago_id`, `estado_id`, `fecha_venta`, `observaciones`) VALUES (3, 'B001-000088', 1, 1, 1, 1, '2415.25', '434.75', '2850.00', 2, 1, '2025-08-11 15:03:57', 'Garantía comercial vencida. Para probar cobro de servicio técnico fuera de plazo.');
INSERT INTO `ventas` (`id`, `codigo_comprobante`, `tipo_comprobante_id`, `cliente_id`, `usuario_id`, `sucursal_id`, `subtotal`, `igv`, `total`, `metodo_pago_id`, `estado_id`, `fecha_venta`, `observaciones`) VALUES (4, 'B001-000089', 1, 1, 1, 1, '3304.24', '594.76', '3899.00', 1, 1, '2026-10-05 15:36:13', 'Venta de prueba automatizada E2E con garantía');
INSERT INTO `ventas` (`id`, `codigo_comprobante`, `tipo_comprobante_id`, `cliente_id`, `usuario_id`, `sucursal_id`, `subtotal`, `igv`, `total`, `metodo_pago_id`, `estado_id`, `fecha_venta`, `observaciones`) VALUES (5, 'B001-000090', 1, 1, 6, 1, '2415.25', '434.75', '2850.00', 1, 1, '2026-10-05 23:39:10', 'Venta POS emitida por Super Administrador');

SET FOREIGN_KEY_CHECKS = 1;
-- =====================================================================
-- FIN DEL VOLCADO DE BASE DE DATOS
-- =====================================================================
