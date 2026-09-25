export type EstadoRegistro = 'ACTIVO' | 'INACTIVO';

export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'SECRETARIA' | 'TECNICO' | 'FACTURADOR' | 'ALMACEN' | 'CAJERO' | (string & {});

export interface Rol {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  modulosPredeterminados: string[];
  esSistema: boolean;
  estado: string;
}

export interface ModuloSistemaDef {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  categoria: 'Operaciones' | 'Taller' | 'Almacén' | 'Administración';
}

export const MODULOS_DISPONIBLES: ModuloSistemaDef[] = [
  { id: 'ventas', nombre: 'Ventas', descripcion: 'Gestión de ventas y operaciones comerciales', icono: 'Receipt', categoria: 'Operaciones' },
  { id: 'caja', nombre: 'Caja & Finanzas', descripcion: 'Apertura, arqueo, turnos y balance de caja', icono: 'DollarSign', categoria: 'Operaciones' },
  { id: 'compras', nombre: 'Compras & Proveedores', descripcion: 'Registro de facturas de compra, abastecimiento y proveedores', icono: 'Truck', categoria: 'Almacén' },
  { id: 'panel-recepcion', nombre: 'Panel de recepción', descripcion: 'Ingresos y seguimiento inicial de equipos', icono: 'ClipboardList', categoria: 'Taller' },
  { id: 'panel-almacen', nombre: 'Panel de almacén', descripcion: 'Stock y movimientos entre sedes', icono: 'Package', categoria: 'Almacén' },
  { id: 'taller', nombre: 'Servicio Técnico & Taller', descripcion: 'Recepción, bandeja del técnico, avances y entregas', icono: 'Wrench', categoria: 'Taller' },
  { id: 'equipos', nombre: 'Equipos registrados', descripcion: 'Equipos de clientes e historial de servicios', icono: 'Laptop', categoria: 'Taller' },
  { id: 'clientes', nombre: 'Directorio de Clientes', descripcion: 'Gestión y validación de RUC y DNI', icono: 'Users', categoria: 'Operaciones' },
  { id: 'productos', nombre: 'Productos & Stock', descripcion: 'Catálogo, inventario y control de precios', icono: 'Package', categoria: 'Almacén' },
  { id: 'categorias', nombre: 'Categorías', descripcion: 'Clasificación de productos', icono: 'Layers', categoria: 'Almacén' },
  { id: 'marcas', nombre: 'Marcas', descripcion: 'Registro de marcas del catálogo', icono: 'Tag', categoria: 'Almacén' },
  { id: 'usuarios', nombre: 'Gestión de Usuarios & Paneles', descripcion: 'Usuarios, roles y asignación de permisos a paneles', icono: 'ShieldCheck', categoria: 'Administración' },
  { id: 'config-empresa', nombre: 'Datos de Empresa', descripcion: 'Información general y parámetros operativos', icono: 'Building2', categoria: 'Administración' },
  { id: 'sucursales', nombre: 'Sucursales', descripcion: 'Sedes y almacenes secundarios', icono: 'Network', categoria: 'Administración' },
  { id: 'movimientos', nombre: 'Movimientos entre sedes', descripcion: 'Traslados y control de inventario entre sedes', icono: 'ArrowLeftRight', categoria: 'Almacén' },
];

export interface Usuario {
  id: number;
  username: string;
  password?: string;
  nombreCompleto: string;
  email: string;
  telefono?: string;
  rol: UserRole;
  estado: EstadoRegistro;
  avatar?: string;
  ultimoAcceso: string;
  modulosPermitidos: string[]; // IDs de paneles permitidos: ['ventas', 'taller', ...]
  requiereCambioPassword?: boolean;
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

export interface Equipo {
  id: number;
  clienteId: number;
  tipo: TipoEquipo;
  marca: string;
  modelo: string;
  numeroSerie: string;
  accesorios: string[];
  estado: 'REGISTRADO' | 'EN_SERVICIO' | 'LISTO_ENTREGA' | 'ENTREGADO';
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
  stockPorSede?: Record<string, number>;
  unidadMedida: string; // NIU, ZZ, KGM, etc.
  estado: EstadoRegistro;
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

export type EstadoMovimientoInventario = 'SOLICITADO' | 'APROBADO' | 'EN_TRANSITO' | 'RECIBIDO' | 'CANCELADO';

export interface MovimientoInventario {
  id: number;
  productoId: number;
  productoNombre: string;
  cantidad: number;
  sedeOrigen: string;
  sedeDestino: string;
  solicitadoPor: string;
  fecha: string;
  estado: EstadoMovimientoInventario;
}

export type TipoComprobante = 'BOLETA' | 'FACTURA' | 'NOTA_VENTA';
export type MetodoPago = 'EFECTIVO' | 'YAPE_PLIN' | 'TARJETA' | 'TRANSFERENCIA';

export interface ItemVenta {
  productoId: number;
  codigo: string;
  nombre: string;
  categoria: string;
  marca: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
}

export interface Venta {
  id: number;
  codigoComprobante: string; // Ej: B001-000124 o F001-000089
  tipoComprobante: TipoComprobante;
  clienteId?: number;
  clienteDocumento: string;
  clienteNombre: string;
  clienteDireccion?: string;
  vendedorId: number;
  vendedorNombre: string;
  sucursal: string;
  fecha: string;
  items: ItemVenta[];
  subtotal: number; // Base imponible
  igv: number;      // 18%
  descuento: number;
  total: number;
  metodoPago: MetodoPago;
  montoRecibido?: number;
  vuelto?: number;
  estado: 'EMITIDO' | 'ANULADO';
}

export interface Proveedor {
  id: number;
  ruc: string;
  razonSocial: string;
  contacto?: string;
  telefono: string;
  email: string;
  direccion: string;
  estado: EstadoRegistro;
  fechaRegistro: string;
}

export interface ItemCompra {
  productoId: number;
  codigo: string;
  nombre: string;
  categoria: string;
  marca: string;
  cantidad: number;
  precioCostoUnitario: number;
  subtotal: number;
}

export interface Compra {
  id: number;
  codigoComprobante: string; // Ej: FC01-00124 o GUIA-0089
  tipoComprobante: 'FACTURA' | 'BOLETA' | 'GUIA_REMISION';
  proveedorId: number;
  proveedorRuc: string;
  proveedorRazonSocial: string;
  sucursalDestino: string;
  compradorId: number;
  compradorNombre: string;
  fecha: string;
  items: ItemCompra[];
  subtotal: number;
  igv: number;
  total: number;
  estado: 'REGISTRADA' | 'ANULADA';
  observaciones?: string;
}

export interface MovimientoCaja {
  id: string;
  cajaTurnoId: number;
  tipo: 'INGRESO' | 'EGRESO';
  concepto: string;
  categoria: 'VENTA_POS' | 'TALLER_ADELANTO' | 'TALLER_LIQUIDACION' | 'GASTO_OPERATIVO' | 'COMPRA_SUMINISTRO' | 'OTRO';
  monto: number;
  metodoPago: MetodoPago;
  fecha: string;
  registradoPor: string;
  referenciaCodigo?: string;
}

export interface CajaTurno {
  id: number;
  sucursal: string;
  fechaApertura: string;
  fechaCierre?: string;
  montoApertura: number;
  montoCierreEfectivo?: number;
  totalIngresosEfectivo: number;
  totalIngresosDigital: number;
  totalEgresos: number;
  saldoEsperado: number;
  diferencia?: number;
  estado: 'ABIERTA' | 'CERRADA';
  abiertaPor: string;
  cerradaPor?: string;
  observaciones?: string;
}

