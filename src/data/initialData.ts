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

export const INITIAL_SUCURSALES: Sucursal[] = [
  {
    id: 1,
    codigo: '0000',
    nombre: 'Principal - Chiclayo Centro',
    direccion: 'AV. PEDRO RUIZ NRO. 349 INT. 09C, Chiclayo',
    telefono: '(074) 283921',
    esPrincipal: true,
    estado: 'ACTIVO',
  },
  {
    id: 2,
    codigo: '0001',
    nombre: 'Sucursal Lambayeque Norte',
    direccion: 'Av. Ramón Castilla 450, Lambayeque',
    telefono: '(074) 281190',
    esPrincipal: false,
    estado: 'ACTIVO',
  },
  {
    id: 3,
    codigo: '0002',
    nombre: 'Almacén Central Pomalca',
    direccion: 'Carretera Pomalca Km 4.5',
    telefono: '(074) 609923',
    esPrincipal: false,
    estado: 'INACTIVO',
  },
];

export const INITIAL_USUARIOS: Usuario[] = [
  {
    id: 1,
    username: 'tmilagros',
    password: 'admin123',
    nombreCompleto: 'Torres Ll Milagros (Administradora)',
    email: 'milagros.torres@mgsolutions.pe',
    telefono: '984712093',
    rol: 'ADMIN',
    estado: 'ACTIVO',
    avatar: 'TL',
    ultimoAcceso: '2024-10-24 10:45',
    modulosPermitidos: [
      'ventas',
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
  {
    id: 2,
    username: 'secretaria_ana',
    password: 'password123',
    nombreCompleto: 'Ana Lucía Paredes (Secretaría & Recepción)',
    email: 'ana.paredes@mgsolutions.pe',
    telefono: '974812390',
    rol: 'SECRETARIA',
    estado: 'ACTIVO',
    avatar: 'AP',
    ultimoAcceso: '2024-10-24 09:30',
    modulosPermitidos: ['panel-recepcion', 'taller', 'equipos', 'ventas', 'clientes'],
  },
  {
    id: 3,
    username: 'tecnico_kevin',
    password: 'password123',
    nombreCompleto: 'Kevin Santisteban (Técnico Hardware & Laptops)',
    email: 'kevin.tecnico@mgsolutions.pe',
    telefono: '981245678',
    rol: 'TECNICO',
    estado: 'ACTIVO',
    avatar: 'KS',
    ultimoAcceso: '2024-10-24 11:15',
    modulosPermitidos: ['taller', 'productos'],
  },
  {
    id: 4,
    username: 'cventas',
    password: 'password123',
    nombreCompleto: 'Carlos Mendoza Ramos (Ejecutivo de Ventas)',
    email: 'carlos.mendoza@mgsolutions.pe',
    telefono: '951234871',
    rol: 'FACTURADOR',
    estado: 'ACTIVO',
    avatar: 'CM',
    ultimoAcceso: '2024-10-24 09:12',
    modulosPermitidos: ['ventas', 'clientes', 'productos'],
  },
  {
    id: 5,
    username: 'almacen_juan',
    password: 'password123',
    nombreCompleto: 'Juan Quispe Salazar (Jefe de Almacén)',
    email: 'juan.quispe@mgsolutions.pe',
    telefono: '976123098',
    rol: 'ALMACEN',
    estado: 'ACTIVO',
    avatar: 'JQ',
    ultimoAcceso: '2024-10-23 16:30',
    modulosPermitidos: ['panel-almacen', 'productos', 'categorias', 'marcas', 'movimientos'],
  },
  {
    id: 6,
    username: 'ex_cajero_luis',
    password: 'password123',
    nombreCompleto: 'Luis Antonio Morales (Usuario Inactivo)',
    email: 'luis.morales@mgsolutions.pe',
    telefono: '990182736',
    rol: 'CAJERO',
    estado: 'INACTIVO',
    avatar: 'LM',
    ultimoAcceso: '2024-08-15 18:00',
    modulosPermitidos: ['ventas'],
  },
];

export const INITIAL_CATEGORIAS: Categoria[] = [
  { id: 1, nombre: 'LAPTOPS & NOTEBOOKS', descripcion: 'Equipos portátiles corporativos y gamers', estado: 'ACTIVO' },
  { id: 2, nombre: 'IMPRESORAS & MULTIFUNCIONALES', descripcion: 'Impresoras a tinta continua, láser y matriciales', estado: 'ACTIVO' },
  { id: 3, nombre: 'ALMACENAMIENTO', descripcion: 'Discos SSD, HDD y NVMe M.2', estado: 'ACTIVO' },
  { id: 4, nombre: 'MEMORIA RAM', descripcion: 'Módulos de memoria DDR4 y DDR5 para laptop y PC', estado: 'ACTIVO' },
  { id: 5, nombre: 'REDES & CONECTIVIDAD', descripcion: 'Routers, switches y adaptadores WiFi/Bluetooth', estado: 'ACTIVO' },
  { id: 6, nombre: 'PERIFERICOS & ACCESORIOS', descripcion: 'Teclados, mouse, cargadores y cables', estado: 'ACTIVO' },
  { id: 7, nombre: 'SOFTWARE & LICENCIAS', descripcion: 'Sistemas operativos y licencias Microsoft Office', estado: 'INACTIVO' },
];

export const INITIAL_MARCAS: Marca[] = [
  { id: 1, nombre: 'LENOVO', estado: 'ACTIVO' },
  { id: 2, nombre: 'ASUS', estado: 'ACTIVO' },
  { id: 3, nombre: 'HP', estado: 'ACTIVO' },
  { id: 4, nombre: 'EPSON', estado: 'ACTIVO' },
  { id: 5, nombre: 'LOGITECH', estado: 'ACTIVO' },
  { id: 6, nombre: 'KINGSTON', estado: 'ACTIVO' },
  { id: 7, nombre: 'TP-LINK', estado: 'ACTIVO' },
  { id: 8, nombre: 'TEROS', estado: 'ACTIVO' },
  { id: 9, nombre: 'CORSAIR', estado: 'ACTIVO' },
  { id: 10, nombre: 'GENIUS', estado: 'INACTIVO' },
];

export const INITIAL_PRODUCTOS: Producto[] = [];

export const INITIAL_CLIENTES: Cliente[] = [];

export const INITIAL_ORDENES_SERVICIO: OrdenServicio[] = [];

export const INITIAL_VENTAS: Venta[] = [];

export const INITIAL_PROVEEDORES: Proveedor[] = [];

export const INITIAL_COMPRAS: Compra[] = [];

export const INITIAL_CAJA_TURNOS: CajaTurno[] = [];

export const INITIAL_MOVIMIENTOS_CAJA: MovimientoCaja[] = [];
