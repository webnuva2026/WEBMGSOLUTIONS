export interface CodeFile {
  name: string;
  path: string;
  language: string;
  description: string;
  code: string;
}

export const SPRING_BOOT_CODE_FILES: CodeFile[] = [
  {
    name: 'EstadoRegistro.java',
    path: 'src/main/java/com/mgsolutions/erp/model/enums/EstadoRegistro.java',
    language: 'java',
    description: 'Enum para control estricto de estados Activo / Inactivo en usuarios, clientes y productos.',
    code: `package com.mgsolutions.erp.model.enums;

/**
 * Enumeración para el control de ciclo de vida de entidades.
 * Garantiza que solo registros ACTIVO puedan ser facturados o autenticados.
 */
public enum EstadoRegistro {
    ACTIVO,
    INACTIVO
}
`,
  },
  {
    name: 'Producto.java',
    path: 'src/main/java/com/mgsolutions/erp/model/entity/Producto.java',
    language: 'java',
    description: 'Entidad JPA Producto con control de estado, soft-delete e índice MySQL para búsquedas rápidas.',
    code: `package com.mgsolutions.erp.model.entity;

import com.mgsolutions.erp.model.enums.EstadoRegistro;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "productos", indexes = {
    @Index(name = "idx_producto_codigo", columnList = "codigo"),
    @Index(name = "idx_producto_barra", columnList = "codigo_barra"),
    @Index(name = "idx_producto_estado", columnList = "estado")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SQLDelete(sql = "UPDATE productos SET estado = 'INACTIVO', updated_at = NOW() WHERE id = ?")
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "codigo_barra", length = 30)
    private String codigoBarra;

    @NotBlank(message = "El código interno del producto es obligatorio")
    @Column(nullable = false, unique = true, length = 50)
    private String codigo;

    @NotBlank(message = "El nombre del producto es obligatorio")
    @Column(nullable = false, length = 255)
    private String nombre;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id", nullable = false)
    private Categoria categoria;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "marca_id", nullable = false)
    private Marca marca;

    @Column(length = 100)
    private String sucursal = "Principal";

    @NotNull
    @PositiveOrZero
    @Column(name = "precio_unitario", precision = 12, scale = 2, nullable = false)
    private BigDecimal precioUnitario;

    @PositiveOrZero
    @Column(name = "precio_costo", precision = 12, scale = 2)
    private BigDecimal precioCosto;

    @NotNull
    @PositiveOrZero
    @Column(nullable = false)
    private Integer stock = 0;

    @Column(name = "unidad_medida", length = 10)
    private String unidadMedida = "NIU";

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private EstadoRegistro estado = EstadoRegistro.ACTIVO;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
`,
  },
  {
    name: 'Cliente.java',
    path: 'src/main/java/com/mgsolutions/erp/model/entity/Cliente.java',
    language: 'java',
    description: 'Entidad Cliente validando documento único y control de estado para evitar facturar a clientes inactivos.',
    code: `package com.mgsolutions.erp.model.entity;

import com.mgsolutions.erp.model.enums.EstadoRegistro;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "clientes", indexes = {
    @Index(name = "idx_cliente_doc", columnList = "numero_documento"),
    @Index(name = "idx_cliente_estado", columnList = "estado")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(name = "tipo_documento", length = 10, nullable = false)
    private String tipoDocumento; // RUC, DNI, CE

    @NotBlank
    @Column(name = "numero_documento", length = 20, nullable = false, unique = true)
    private String numeroDocumento;

    @NotBlank
    @Column(name = "razon_social", length = 255, nullable = false)
    private String razonSocial;

    @Column(name = "direccion_fiscal", length = 500)
    private String direccionFiscal;

    @Column(length = 150)
    private String email;

    @Column(length = 30)
    private String telefono;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private EstadoRegistro estado = EstadoRegistro.ACTIVO;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
`,
  },
  {
    name: 'Usuario.java',
    path: 'src/main/java/com/mgsolutions/erp/model/entity/Usuario.java',
    language: 'java',
    description: 'Entidad Usuario de Spring Security con control de estado (usuarios INACTIVOS son rechazados al iniciar sesión).',
    code: `package com.mgsolutions.erp.model.entity;

import com.mgsolutions.erp.model.enums.EstadoRegistro;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios", indexes = {
    @Index(name = "idx_usuario_username", columnList = "username"),
    @Index(name = "idx_usuario_estado", columnList = "estado")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @NotBlank
    @Column(nullable = false, length = 255)
    private String password;

    @NotBlank
    @Column(name = "nombre_completo", nullable = false, length = 150)
    private String nombreCompleto;

    @Column(length = 150, unique = true)
    private String email;

    @Column(length = 30)
    private String telefono;

    @Column(length = 30, nullable = false)
    private String rol = "ADMIN"; // ADMIN, FACTURADOR, ALMACEN, CAJERO

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private EstadoRegistro estado = EstadoRegistro.ACTIVO;

    @Column(name = "ultimo_acceso")
    private LocalDateTime ultimoAcceso;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public boolean isActivo() {
        return EstadoRegistro.ACTIVO.equals(this.estado);
    }
}
`,
  },
  {
    name: 'ComprobanteService.java',
    path: 'src/main/java/com/mgsolutions/erp/service/ComprobanteService.java',
    language: 'java',
    description: 'Lógica de negocio: Valida que Cliente y Productos estén en estado ACTIVO antes de emitir factura/boleta.',
    code: `package com.mgsolutions.erp.service;

import com.mgsolutions.erp.dto.EmitirComprobanteRequest;
import com.mgsolutions.erp.dto.ItemDetalleRequest;
import com.mgsolutions.erp.exception.BusinessException;
import com.mgsolutions.erp.model.entity.*;
import com.mgsolutions.erp.model.enums.EstadoRegistro;
import com.mgsolutions.erp.repository.ClienteRepository;
import com.mgsolutions.erp.repository.ComprobanteRepository;
import com.mgsolutions.erp.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ComprobanteService {

    private final ComprobanteRepository comprobanteRepository;
    private final ClienteRepository clienteRepository;
    private final ProductoRepository productoRepository;

    @Transactional
    public Comprobante emitirComprobante(EmitirComprobanteRequest request) {
        // 1. Validar Cliente y su Estado
        Cliente cliente = clienteRepository.findById(request.getClienteId())
                .orElseThrow(() -> new BusinessException("Cliente no encontrado con ID: " + request.getClienteId()));

        if (cliente.getEstado() != EstadoRegistro.ACTIVO) {
            throw new BusinessException("Error de emisión: El cliente '" + cliente.getRazonSocial() + 
                    "' se encuentra INACTIVO. Active el cliente para continuar.");
        }

        // 2. Validar cada Producto y su Estado
        List<DetalleComprobante> detalles = new ArrayList<>();
        BigDecimal totalComprobante = BigDecimal.ZERO;

        for (ItemDetalleRequest itemReq : request.getItems()) {
            Producto prod = productoRepository.findById(itemReq.getProductoId())
                    .orElseThrow(() -> new BusinessException("Producto no encontrado: " + itemReq.getProductoId()));

            // VALIDACIÓN CRÍTICA DE ESTADO
            if (prod.getEstado() != EstadoRegistro.ACTIVO) {
                throw new BusinessException("Error de emisión: El producto '" + prod.getNombre() + 
                        "' está INACTIVO y no puede ser facturado.");
            }

            if (prod.getStock() < itemReq.getCantidad()) {
                throw new BusinessException("Stock insuficiente para el producto: " + prod.getNombre() +
                        " (Stock disponible: " + prod.getStock() + ")");
            }

            // Descontar stock
            prod.setStock(prod.getStock() - itemReq.getCantidad());
            productoRepository.save(prod);

            BigDecimal subtotalItem = prod.getPrecioUnitario().multiply(BigDecimal.valueOf(itemReq.getCantidad()));
            totalComprobante = totalComprobante.add(subtotalItem);

            DetalleComprobante detalle = DetalleComprobante.builder()
                    .producto(prod)
                    .codigo(prod.getCodigo())
                    .descripcion(prod.getNombre())
                    .cantidad(itemReq.getCantidad())
                    .precioUnitario(prod.getPrecioUnitario())
                    .subtotal(subtotalItem.divide(BigDecimal.valueOf(1.18), 2, RoundingMode.HALF_UP))
                    .igv(subtotalItem.subtract(subtotalItem.divide(BigDecimal.valueOf(1.18), 2, RoundingMode.HALF_UP)))
                    .total(subtotalItem)
                    .build();

            detalles.add(detalle);
        }

        BigDecimal subtotalNeto = totalComprobante.divide(BigDecimal.valueOf(1.18), 2, RoundingMode.HALF_UP);
        BigDecimal igv = totalComprobante.subtract(subtotalNeto);

        // 3. Construir y guardar Comprobante Electrónico
        Comprobante comprobante = Comprobante.builder()
                .tipo(request.getTipo()) // FACTURA, BOLETA
                .serie(request.getSerie()) // F001, B001
                .numero(generarSiguienteNumero(request.getTipo(), request.getSerie()))
                .fechaEmision(LocalDate.now())
                .cliente(cliente)
                .moneda("PEN")
                .subtotal(subtotalNeto)
                .igv(igv)
                .total(totalComprobante)
                .estado("PAGADO")
                .estadoSunat("ACEPTADO")
                .detalles(detalles)
                .build();

        return comprobanteRepository.save(comprobante);
    }

    private String generarSiguienteNumero(String tipo, String serie) {
        Long count = comprobanteRepository.countByTipoAndSerie(tipo, serie);
        return String.format("%06d", count + 1);
    }
}
`,
  },
  {
    name: 'mysql_schema.sql',
    path: 'src/main/resources/db/migration/V1__init_erp_mysql_schema.sql',
    language: 'sql',
    description: 'Script DDL completo para MySQL 8.0 con restricciones de integridad, claves foráneas e índices de estado.',
    code: `-- ==========================================================
-- MG SOLUTIONS GROUP S.A.C. - Sistema de Facturación Electrónica
-- Base de Datos MySQL 8.0+
-- ==========================================================

CREATE DATABASE IF NOT EXISTS mg_solutions_erp 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE mg_solutions_erp;

-- 1. Tabla: Categorias
CREATE TABLE IF NOT EXISTS categorias (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_categorias_estado (estado)
) ENGINE=InnoDB;

-- 2. Tabla: Marcas
CREATE TABLE IF NOT EXISTS marcas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_marcas_estado (estado)
) ENGINE=InnoDB;

-- 3. Tabla: Productos (con estado ACTIVO/INACTIVO)
CREATE TABLE IF NOT EXISTS productos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    codigo_barra VARCHAR(30),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    categoria_id BIGINT NOT NULL,
    marca_id BIGINT NOT NULL,
    sucursal VARCHAR(100) DEFAULT 'Principal',
    precio_unitario DECIMAL(12, 2) NOT NULL,
    precio_costo DECIMAL(12, 2) DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 0,
    unidad_medida VARCHAR(10) DEFAULT 'NIU',
    estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_producto_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id),
    CONSTRAINT fk_producto_marca FOREIGN KEY (marca_id) REFERENCES marcas(id),
    INDEX idx_producto_codigo (codigo),
    INDEX idx_producto_barra (codigo_barra),
    INDEX idx_producto_estado (estado)
) ENGINE=InnoDB;

-- 4. Tabla: Clientes (con estado ACTIVO/INACTIVO)
CREATE TABLE IF NOT EXISTS clientes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tipo_documento ENUM('RUC', 'DNI', 'CE', 'PASAPORTE') NOT NULL,
    numero_documento VARCHAR(20) NOT NULL UNIQUE,
    razon_social VARCHAR(255) NOT NULL,
    direccion_fiscal VARCHAR(500),
    email VARCHAR(150),
    telefono VARCHAR(30),
    estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_cliente_doc (numero_documento),
    INDEX idx_cliente_estado (estado)
) ENGINE=InnoDB;

-- 5. Tabla: Usuarios (con estado ACTIVO/INACTIVO)
CREATE TABLE IF NOT EXISTS usuarios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE,
    telefono VARCHAR(30),
    rol ENUM('ADMIN', 'FACTURADOR', 'ALMACEN', 'CAJERO') NOT NULL DEFAULT 'ADMIN',
    estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    avatar VARCHAR(10) DEFAULT 'TL',
    ultimo_acceso DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuario_username (username),
    INDEX idx_usuario_estado (estado)
) ENGINE=InnoDB;

-- 6. Tabla: Comprobantes de Pago Electrónicos (SUNAT)
CREATE TABLE IF NOT EXISTS comprobantes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('FACTURA', 'BOLETA', 'NOTA_CREDITO', 'NOTA_DEBITO') NOT NULL,
    serie VARCHAR(10) NOT NULL,
    numero VARCHAR(20) NOT NULL,
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE,
    cliente_id BIGINT NOT NULL,
    moneda VARCHAR(5) DEFAULT 'PEN',
    subtotal DECIMAL(12, 2) NOT NULL,
    igv DECIMAL(12, 2) NOT NULL,
    total DECIMAL(12, 2) NOT NULL,
    estado ENUM('PAGADO', 'PENDIENTE', 'ANULADO') DEFAULT 'PAGADO',
    estado_sunat ENUM('ACEPTADO', 'RECHAZADO', 'PENDIENTE', 'EXCEPCION') DEFAULT 'ACEPTADO',
    forma_pago ENUM('CONTADO', 'CREDITO') DEFAULT 'CONTADO',
    hash_cdr VARCHAR(255),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comprobante_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    UNIQUE KEY uq_comprobante_serie_num (tipo, serie, numero),
    INDEX idx_comprobante_fecha (fecha_emision),
    INDEX idx_comprobante_estado (estado)
) ENGINE=InnoDB;

-- 7. Tabla: Detalle de Comprobantes
CREATE TABLE IF NOT EXISTS comprobante_detalles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    comprobante_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    codigo_producto VARCHAR(50) NOT NULL,
    descripcion_producto VARCHAR(255) NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(12, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    igv DECIMAL(12, 2) NOT NULL,
    total DECIMAL(12, 2) NOT NULL,
    CONSTRAINT fk_detalle_comprobante FOREIGN KEY (comprobante_id) REFERENCES comprobantes(id) ON DELETE CASCADE,
    CONSTRAINT fk_detalle_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
) ENGINE=InnoDB;

-- ==========================================================
-- Datos Iniciales (Seed Data)
-- ==========================================================
INSERT INTO categorias (id, nombre, descripcion, estado) VALUES
(1, 'REDES', 'Equipos y adaptadores de red', 'ACTIVO'),
(2, 'MEMORIA RAM', 'Módulos de memoria DDR4 y DDR5', 'ACTIVO'),
(3, 'ALMACENAMIENTO', 'Discos SSD, HDD y NVMe', 'ACTIVO');

INSERT INTO marcas (id, nombre, estado) VALUES
(1, 'TP-LINK', 'ACTIVO'),
(2, 'TEROS', 'ACTIVO'),
(3, 'KINGSTON', 'ACTIVO');

INSERT INTO productos (codigo_barra, codigo, nombre, categoria_id, marca_id, sucursal, precio_unitario, stock, estado) VALUES
('79368705', 'C00124', 'ADAPTADOR NANO USB BLUETOOTH 4.0', 1, 1, 'Principal', 35.00, 48, 'ACTIVO'),
('84912384', 'RAM08G', 'MEMORIA RAM DDR4 8GB TEROS', 2, 2, 'Principal', 120.50, 24, 'ACTIVO'),
('77519283', 'SSD480K', 'DISCO SOLIDO SSD 480GB KINGSTON A400', 3, 3, 'Principal', 155.00, 15, 'ACTIVO');

INSERT INTO clientes (tipo_documento, numero_documento, razon_social, direccion_fiscal, email, estado) VALUES
('RUC', '20481928371', 'CONSTRUCTORA LOS ANDES S.A.C.', 'Av. Balta 1082, Chiclayo', 'contacto@constructorasur.pe', 'ACTIVO'),
('DNI', '47891234', 'JUAN PEREZ GOMEZ', 'Jr. San José 450, Chiclayo', 'juan.perez@gmail.com', 'ACTIVO'),
('RUC', '20192837465', 'MINERA DEL SUR S.A.', 'Carretera Central Km 12, Puno', 'facturacion@mineradelsur.com.pe', 'ACTIVO'),
('RUC', '20339485721', 'COMERCIAL INACTIVA Y MOROSA S.A.', 'Calle Real 120, Trujillo', 'bajas@comercialinactiva.pe', 'INACTIVO');
`,
  },
];
