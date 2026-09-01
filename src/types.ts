export type EstadoRegistro = 'ACTIVO' | 'INACTIVO';

export type UserRole = 'ADMIN' | 'SECRETARIA' | 'TECNICO' | 'FACTURADOR' | 'ALMACEN' | 'CAJERO';

export interface ModuloSistemaDef {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  categoria: 'Operaciones' | 'Taller' | 'Almacén' | 'Administración';
}

export const MODULOS_DISPONIBLES: ModuloSistemaDef[] = [
  { id: 'ventas', nombre: 'Ventas & Facturación', descripcion: 'Emisión de comprobantes, métricas y dashboard', icono: 'Receipt', categoria: 'Operaciones' },
  { id: 'taller', nombre: 'Servicio Técnico & Taller', descripcion: 'Recepción, bandeja del técnico, avances y entregas', icono: 'Wrench', categoria: 'Taller' },
  { id: 'clientes', nombre: 'Directorio de Clientes', descripcion: 'Gestión y validación de RUC y DNI', icono: 'Users', categoria: 'Operaciones' },
  { id: 'productos', nombre: 'Productos & Stock', descripcion: 'Catálogo, inventario y control de precios', icono: 'Package', categoria: 'Almacén' },
  { id: 'categorias', nombre: 'Categorías', descripcion: 'Clasificación de productos', icono: 'Layers', categoria: 'Almacén' },
  { id: 'marcas', nombre: 'Marcas', descripcion: 'Registro de marcas del catálogo', icono: 'Tag', categoria: 'Almacén' },
  { id: 'usuarios', nombre: 'Gestión de Usuarios & Paneles', descripcion: 'Usuarios, roles y asignación de permisos a paneles', icono: 'ShieldCheck', categoria: 'Administración' },
  { id: 'config-empresa', nombre: 'Datos de Empresa & SUNAT', descripcion: 'RUC, certificados digitales y parámetros fiscales', icono: 'Building2', categoria: 'Administración' },
  { id: 'sucursales', nombre: 'Sucursales', descripcion: 'Sedes y almacenes secundarios', icono: 'Network', categoria: 'Administración' },
  { id: 'compras', nombre: 'Compras a Proveedores', descripcion: 'Órdenes de compra e ingreso de mercadería', icono: 'Truck', categoria: 'Operaciones' },
  { id: 'caja-bancos', nombre: 'Caja & Bancos', descripcion: 'Movimientos de efectivo y transferencias', icono: 'Wallet', categoria: 'Operaciones' },
  { id: 'reportes', nombre: 'Reportes Gerenciales', descripcion: 'Informes contables y estadísticas', icono: 'BarChart3', categoria: 'Administración' },
];

export interface Usuario {
  id: number;
  username: string;
  nombreCompleto: string;
  email: string;
  telefono?: string;
  rol: UserRole;
  estado: EstadoRegistro;
  avatar?: string;
  ultimoAcceso: string;
  modulosPermitidos: string[]; // IDs de paneles permitidos: ['ventas', 'taller', ...]
}

export type TipoEquipo = 'LAPTOP' | 'PC_ESCRITORIO' | 'IMPRESORA' | 'MONITOR' | 'COMPONENTE' | 'SERVIDOR' | 'OTRO';

export type EstadoOrdenServicio =
  | 'RECEPCIONADO'
  | 'EN_DIAGNOSTICO'
  | 'PRESUPUESTADO'
  | 'APROBADO_EN_REPARACION'
  | 'ESPERA_REPUESTOS'
  | 'REPARADO_PROBADO'
  | 'LISTO_ENTREGA'
  | 'ENTREGADO_COBRADO'
  | 'RECHAZADO_DEVUELTO';

export interface RepuestoUtilizado {
  id: string;
  productoId?: number;
  codigo: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

export interface ManoObraServicio {
  id: string;
  descripcion: string;
  precio: number;
}

export interface BitacoraAvance {
  id: string;
  fecha: string;
  autorNombre: string;
  autorRol: UserRole;
  titulo: string;
  descripcion: string;
  fotos?: string[];
  estadoNuevo?: EstadoOrdenServicio;
}

export interface ComunicacionCliente {
  id: string;
  fecha: string;
  canal: 'WHATSAPP' | 'LLAMADA' | 'PRESENCIAL' | 'EMAIL';
  atendidoPor: string;
  resumen: string;
  resultado: 'APROBADO' | 'RECHAZADO' | 'PENDIENTE' | 'CONSULTA';
}

export interface OrdenServicio {
  id: number;
  codigo: string; // Ej: OT-2024-0101
  clienteId: number;
  clienteNombre: string;
  clienteDocumento: string;
  clienteTelefono: string;
  clienteEmail?: string;
  tipoEquipo: TipoEquipo;
  marca: string;
  modelo: string;
  numeroSerie: string;
  passwordEquipo?: string;
  accesoriosDejados: string[]; // ['Cargador original', 'Funda', etc.]
  fallaReportada: string;
  estadoEstetico: string;
  prioridad: 'NORMAL' | 'ALTA' | 'URGENTE';
  tecnicoId: number;
  tecnicoNombre: string;
  recepcionadoPorId: number;
  recepcionadoPorNombre: string;
  fechaIngreso: string;
  fechaEstimadaEntrega?: string;
  fechaSalida?: string;
  estado: EstadoOrdenServicio;
  diagnosticoTecnico?: string;
  solucionAplicada?: string;
  repuestos: RepuestoUtilizado[];
  serviciosManoObra: ManoObraServicio[];
  costoTotalRepuestos: number;
  costoTotalManoObra: number;
  costoTotal: number;
  adelantoPagado: number;
  saldoPendiente: number;
  bitacora: BitacoraAvance[];
  comunicaciones: ComunicacionCliente[];
  comprobanteEmitidoId?: number;
  garantiaDias?: number;
  notasInternas?: string;
}

export type TipoDocumentoCliente = 'RUC' | 'DNI' | 'CE' | 'PASAPORTE';

export interface Cliente {
  id: number;
  tipoDocumento: TipoDocumentoCliente;
  numeroDocumento: string; // RUC (11 dígitos) o DNI (8 dígitos)
  razonSocial: string;
  direccionFiscal: string;
  email: string;
  telefono?: string;
  estado: EstadoRegistro;
  fechaRegistro: string;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  estado: EstadoRegistro;
}

export interface Marca {
  id: number;
  nombre: string;
  estado: EstadoRegistro;
}

export interface Producto {
  id: number;
  codigoBarra: string;
  codigo: string;
  nombre: string;
  categoriaId: number;
  categoriaNombre: string;
  marcaId: number;
  marcaNombre: string;
  sucursal: string;
  precioUnitario: number;
  precioCosto: number;
  stock: number;
  unidadMedida: string; // NIU, ZZ, KGM, etc.
  estado: EstadoRegistro;
}

export type TipoComprobante = 'FACTURA' | 'BOLETA' | 'NOTA_CREDITO' | 'NOTA_DEBITO';
export type EstadoComprobante = 'PAGADO' | 'PENDIENTE' | 'ANULADO';
export type EstadoSunat = 'ACEPTADO' | 'RECHAZADO' | 'PENDIENTE' | 'EXCEPCION';

export interface DetalleComprobante {
  id: string;
  productoId: number;
  codigo: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  igv: number;
  total: number;
}

export interface Comprobante {
  id: number;
  tipo: TipoComprobante;
  serie: string; // Ej: F001, B001
  numero: string; // Ej: 000456
  fechaEmision: string;
  fechaVencimiento?: string;
  clienteId: number;
  clienteDocumento: string;
  clienteNombre: string;
  moneda: 'PEN' | 'USD';
  subtotal: number;
  igv: number; // 18%
  total: number;
  estado: EstadoComprobante;
  estadoSunat: EstadoSunat;
  detalles: DetalleComprobante[];
  hashCdr?: string;
  observaciones?: string;
  formaPago: 'CONTADO' | 'CREDITO';
}

export interface EmpresaConfig {
  ruc: string;
  razonSocial: string;
  nombreComercial: string;
  direccionFiscal: string;
  email: string;
  telefono: string;
  departamento: string;
  provincia: string;
  distrito: string;
  ubigeo: string;
  solUsuarioSunat: string;
  certificadoVencimiento: string;
  estadoSunat: 'CONECTADO' | 'DESCONECTADO' | 'MANTENIMIENTO';
}

export interface Sucursal {
  id: number;
  codigo: string;
  nombre: string;
  direccion: string;
  telefono: string;
  esPrincipal: boolean;
  estado: EstadoRegistro;
}
