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
  { id: 'ventas', nombre: 'Punto de Venta (POS)', descripcion: 'Gestión de ventas y operaciones comerciales', icono: 'Receipt', categoria: 'Operaciones' },
  { id: 'clientes', nombre: 'Directorio de Clientes', descripcion: 'Gestión y validación de RUC y DNI', icono: 'Users', categoria: 'Operaciones' },
  { id: 'panel-recepcion', nombre: 'Panel de recepción', descripcion: 'Ingresos y seguimiento inicial de equipos', icono: 'ClipboardList', categoria: 'Taller' },
  { id: 'taller', nombre: 'Taller & Órdenes de Servicio', descripcion: 'Recepción, bandeja del técnico, avances y entregas', icono: 'Wrench', categoria: 'Taller' },
  { id: 'panel-almacen', nombre: 'Almacén: Inventario & Series', descripcion: 'Control de inventario, números de serie y métricas entre sedes', icono: 'Package', categoria: 'Almacén' },
  { id: 'compras', nombre: 'Almacén: Pedidos & Proveedores', descripcion: 'Realizar pedidos, recepción de proveedores y directorio', icono: 'Truck', categoria: 'Almacén' },
  { id: 'movimientos', nombre: 'Movimientos entre sedes', descripcion: 'Traslados y control de inventario entre sedes', icono: 'ArrowLeftRight', categoria: 'Almacén' },
  { id: 'catalogo', nombre: 'Catálogo de Productos', descripcion: 'Categorías, marcas, modelos y productos maestros', icono: 'Layers', categoria: 'Almacén' },
  { id: 'repuestos-catalogo', nombre: 'Catálogo de Repuestos', descripcion: 'Catálogo maestro de repuestos y compatibilidades', icono: 'Cpu', categoria: 'Almacén' },
  { id: 'usuarios', nombre: 'Usuarios & Permisos', descripcion: 'Usuarios, roles y asignación de permisos a paneles', icono: 'ShieldCheck', categoria: 'Administración' },
  { id: 'sucursales', nombre: 'Sucursales & Empresa', descripcion: 'Datos de empresa, sedes y almacenes secundarios', icono: 'Network', categoria: 'Administración' },
];

const ACTIVE_MODULE_ID_SET = new Set(MODULOS_DISPONIBLES.map((m) => m.id));

const LEGACY_MODULE_ALIAS: Record<string, string | null> = {
  productos: 'panel-almacen',
  categorias: 'catalogo',
  marcas: 'catalogo',
  'config-empresa': 'sucursales',
  caja: null,
  equipos: null,
};

export function normalizeModuleIds(mods: string[] | undefined | null): string[] {
  if (!Array.isArray(mods)) return [];
  const result = new Set<string>();
  for (const raw of mods) {
    const mapped = raw in LEGACY_MODULE_ALIAS ? LEGACY_MODULE_ALIAS[raw] : raw;
    if (mapped && ACTIVE_MODULE_ID_SET.has(mapped)) {
      result.add(mapped);
    }
  }
  return Array.from(result);
}

export function hasModuleAccess(userModules: string[] | undefined | null, targetView: string): boolean {
  const normalized = normalizeModuleIds(userModules);
  const mappedTarget = targetView in LEGACY_MODULE_ALIAS ? LEGACY_MODULE_ALIAS[targetView] : targetView;
  if (!mappedTarget) return false;
  if (mappedTarget === 'panel-almacen') {
    return normalized.includes('panel-almacen') || normalized.includes('compras');
  }
  return normalized.includes(mappedTarget);
}

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
  sucursalId?: number | null;
  sucursalNombre?: string | null;
}

export type TipoEquipo = 'LAPTOP' | 'PC_ESCRITORIO' | 'IMPRESORA' | 'MONITOR' | 'COMPONENTE' | 'SERVIDOR' | 'OTRO' | (string & {});

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
  sucursalId?: number;
  sucursalNombre?: string;
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
  estadoId?: number;
  esEquipoTaller?: boolean;
  esVenta?: boolean;
  esRepuestoTaller?: boolean;
  totalProductos?: number;
  createdAt?: string;
}

export interface Marca {
  id: number;
  nombre: string;
  descripcion?: string;
  categoriaId?: number | null;
  categoriaNombre?: string | null;
  estado: EstadoRegistro;
  estadoId?: number;
  totalModelos?: number;
  createdAt?: string;
}

export interface CaracteristicaModelo {
  id?: number;
  modeloId?: number;
  atributo: string;
  valor: string;
}

export interface Modelo {
  id: number;
  marcaId: number;
  marcaNombre?: string;
  nombre: string;
  descripcion?: string;
  estado: EstadoRegistro;
  estadoId?: number;
  createdAt?: string;
  caracteristicas?: CaracteristicaModelo[];
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
  stockPorSedeId?: Record<number, number>;
  stockTotalGlobal?: number;
  unidadMedida: string; // NIU, ZZ, KGM, etc.
  estado: EstadoRegistro;
  modeloId?: number | null;
  modeloNombre?: string | null;
  requiereSerie?: boolean;
  disponibleVenta?: boolean;
  tipoDestino?: 'VENTA' | 'SERVICIO_TALLER' | 'MIXTO';
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

export type EstadoMovimientoInventario = 'SOLICITADO' | 'APROBADO' | 'EN_TRANSITO' | 'RECIBIDO' | 'DEVUELTO' | 'CANCELADO';

export interface TransferPrefill {
  tipo: 'PRESTAMO' | 'TRASLADO';
  productoId: number;
  sedeOrigenId: number;
  sedeDestinoId: number;
  cantidad?: number;
  motivo?: string;
}

export interface MovimientoInventario {
  id: number;
  codigo?: string;
  tipo?: 'TRASLADO' | 'PRESTAMO';
  productoId: number;
  productoNombre: string;
  productoCodigo?: string;
  requiereSerie?: boolean;
  sedeOrigenId?: number;
  sedeOrigen: string;
  sedeDestinoId?: number;
  sedeDestino: string;
  cantidad: number;
  series?: string[];
  solicitadoPor: string;
  aprobadoPor?: string;
  recibidoPor?: string;
  fecha: string;
  fechaSolicitud?: string;
  fechaAprobacion?: string;
  fechaEnvio?: string;
  fechaRecepcion?: string;
  fechaDevolucion?: string;
  motivo?: string;
  observaciones?: string;
  estado: EstadoMovimientoInventario;
  estadoColor?: string;
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
  series?: string[];
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
  requiereSerie?: boolean;
  series?: string[];
}

export interface Compra {
  id: number;
  codigoComprobante: string; // Ej: OC-000105, FC01-00124 o GUIA-0089
  tipoComprobante: 'ORDEN_COMPRA' | 'FACTURA' | 'BOLETA' | 'GUIA_REMISION';
  proveedorId: number;
  proveedorRuc: string;
  proveedorRazonSocial: string;
  proveedorEmail?: string;
  proveedorTelefono?: string;
  sucursalDestino: string;
  compradorId: number;
  compradorNombre: string;
  fecha: string;
  items: ItemCompra[];
  subtotal: number;
  igv: number;
  total: number;
  estado: 'SOLICITADO' | 'REGISTRADA' | 'ANULADA';
  destinoPedido?: 'VENTA' | 'SERVICIO_TALLER' | 'MIXTO';
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

