import {
  Usuario,
  Cliente,
  Categoria,
  Marca,
  Producto,
  EmpresaConfig,
  Sucursal,
  OrdenServicio,
  Venta,
  Proveedor,
  Compra,
  CajaTurno,
  MovimientoCaja,
} from '../types';

export const INITIAL_EMPRESA: EmpresaConfig = {
  ruc: '20609737524',
  razonSocial: 'MG SOLUTIONS GROUP S.A.C.',
  nombreComercial: 'MG SOLUTIONS GROUP',
  direccionFiscal: 'AV. PEDRO RUIZ NRO. 349 INT. 09C (MERCADO MODELO) - LAMBAYEQUE - CHICLAYO - CHICLAYO',
  email: 'mgsolutions.group@gmail.com',
  telefono: '+51 974 812 390',
  departamento: 'Lambayeque',
  provincia: 'Chiclayo',
  distrito: 'Chiclayo',
  ubigeo: '140101',
};

export const INITIAL_SUCURSALES: Sucursal[] = [];

export const INITIAL_USUARIOS: Usuario[] = [
  {
    id: 1,
    username: 'superadmin',
    password: '',
    nombreCompleto: 'Super Administrador',
    email: 'superadmin@mgsolutions.pe',
    telefono: '',
    rol: 'SUPERADMIN',
    estado: 'ACTIVO',
    avatar: 'SA',
    ultimoAcceso: '',
    modulosPermitidos: [
      'ventas',
      'caja',
      'compras',
      'panel-recepcion',
      'panel-almacen',
      'taller',
      'equipos',
      'clientes',
      'productos',
      'categorias',
      'marcas',
      'usuarios',
      'config-empresa',
      'sucursales',
      'movimientos',
    ],
  },
];

export const INITIAL_CATEGORIAS: Categoria[] = [];

export const INITIAL_MARCAS: Marca[] = [];

export const INITIAL_PRODUCTOS: Producto[] = [];

export const INITIAL_CLIENTES: Cliente[] = [];

export const INITIAL_ORDENES_SERVICIO: OrdenServicio[] = [];

export const INITIAL_VENTAS: Venta[] = [];

export const INITIAL_PROVEEDORES: Proveedor[] = [];

export const INITIAL_COMPRAS: Compra[] = [];

export const INITIAL_CAJA_TURNOS: CajaTurno[] = [];

export const INITIAL_MOVIMIENTOS_CAJA: MovimientoCaja[] = [];
