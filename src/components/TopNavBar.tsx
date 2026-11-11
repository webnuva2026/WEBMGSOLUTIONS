import React, { useState } from 'react';
import { userService } from '../services/user.service';
import {
  Search,
  Bell,
  Settings,
  HelpCircle,
  Menu,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Building2,
  User,
  Wrench,
  Package,
  Users,
  LayoutDashboard,
  Receipt,
  DollarSign,
  Truck,
  ClipboardList,
  Boxes,
  Laptop,
  ArrowLeftRight,
  Layers,
  ShieldCheck,
  Store,
  ChevronRight,
  ChevronDown,
  Globe,
  Check,
  LayoutGrid,
} from 'lucide-react';
import { Usuario, OrdenServicio, Producto, Cliente, Sucursal } from '../types';

interface ModuleMeta {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  badge?: string;
}

const MODULE_METADATA: Record<string, ModuleMeta> = {
  ventas: {
    title: 'Punto de Venta (POS)',
    subtitle: 'Ventas directas, boletas, facturas y comprobantes electrónicos',
    icon: Receipt,
  },
  dashboard: {
    title: 'Dashboard Operativo',
    subtitle: 'Métricas en tiempo real, rendimiento comercial y taller',
    icon: LayoutDashboard,
  },
  'panel-recepcion': {
    title: 'Panel de Recepción & Tickets',
    subtitle: 'Admisión, generación de tickets y entrega a clientes',
    icon: ClipboardList,
    badge: 'Atención al Cliente',
  },
  'panel-almacen': {
    title: 'Almacén & Inventario',
    subtitle: 'Control de existencias por sede, series físicas y reposiciones',
    icon: Boxes,
  },
  taller: {
    title: 'Servicio Técnico & Taller',
    subtitle: 'Diagnóstico de fallas, mesa de trabajo, repuestos y reparación',
    icon: Wrench,
    badge: 'Laboratorio',
  },
  productos: {
    title: 'Almacén & Inventario',
    subtitle: 'Control de existencias por sede, series físicas y reposiciones',
    icon: Boxes,
  },
  equipos: {
    title: 'Equipos Registrados',
    subtitle: 'Historial de equipos de clientes y trazabilidad de servicio',
    icon: Laptop,
  },
  movimientos: {
    title: 'Movimientos & Préstamos entre Sedes',
    subtitle: 'Traslados físicos, guías de remisión y préstamos inter-sucursal',
    icon: ArrowLeftRight,
    badge: 'Multi-Sede',
  },
  catalogo: {
    title: 'Catálogo Maestro',
    subtitle: 'Jerarquía unificada: Categorías, Marcas y Modelos con Fichas',
    icon: Layers,
  },
  categorias: {
    title: 'Catálogo Maestro • Categorías',
    subtitle: 'Administración de familias de productos y ámbito de taller',
    icon: Layers,
  },
  marcas: {
    title: 'Catálogo Maestro • Marcas',
    subtitle: 'Marcas homologadas y vinculación por categoría',
    icon: Layers,
  },
  usuarios: {
    title: 'Usuarios, Roles & Permisos',
    subtitle: 'Control de accesos RBAC, cuentas de colaboradores y seguridad',
    icon: ShieldCheck,
    badge: 'Seguridad',
  },
  clientes: {
    title: 'Directorio de Clientes',
    subtitle: 'Padrón de clientes con validación automática RENIEC / SUNAT',
    icon: Users,
  },
  compras: {
    title: 'Compras & Proveedores',
    subtitle: 'Registro de facturas, abastecimiento y cuentas de proveedores',
    icon: Truck,
  },
  caja: {
    title: 'Caja & Finanzas',
    subtitle: 'Aperturas, arqueos, cierres de turno y flujo de caja diario',
    icon: DollarSign,
  },
  sucursales: {
    title: 'Sedes & Sucursales',
    subtitle: 'Configuración de locales comerciales, puntos de venta y almacenes',
    icon: Store,
  },
  'config-empresa': {
    title: 'Configuración de Empresa & Sedes',
    subtitle: 'Razón social, RUC, series electrónicas y datos fiscales',
    icon: Building2,
  },
};

interface TopNavBarProps {
  currentUser: Usuario | null;
  onLogout: () => void;
  onToggleSidebar: () => void;
  activeView: string;
  setActiveView: (view: string) => void;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  ordenes?: OrdenServicio[];
  productos?: Producto[];
  clientes?: Cliente[];
  sucursales?: Sucursal[];
  selectedSedeId?: number | null;
  onSelectSede?: (sedeId: number | null) => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  currentUser,
  onLogout,
  onToggleSidebar,
  activeView,
  setActiveView,
  searchTerm,
  setSearchTerm,
  ordenes = [],
  productos = [],
  clientes = [],
  sucursales = [],
  selectedSedeId = null,
  onSelectSede,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSedeDropdown, setShowSedeDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const isSuperAdmin = currentUser?.rol === 'SUPERADMIN' || currentUser?.rol === 'ADMIN';
  const canAccessUsuarios =
    isSuperAdmin || Boolean(currentUser?.modulosPermitidos?.includes('usuarios'));
  const canAccessEmpresa =
    isSuperAdmin || Boolean(currentUser?.modulosPermitidos?.includes('config-empresa'));

  const currentSedeNombre = selectedSedeId
    ? sucursales.find((s) => s.id === selectedSedeId)?.nombre.replace(/^[0-9]+ - /, '') || 'Sede Seleccionada'
    : isSuperAdmin
    ? 'Todas las Sedes (Consolidado)'
    : currentUser?.sucursal?.replace(/^[0-9]+ - /, '') || 'Sede Principal';

  const currentMeta =
    MODULE_METADATA[activeView] ||
    (activeView === 'config-empresa' || activeView === 'sucursales'
      ? MODULE_METADATA['sucursales']
      : activeView === 'categorias' || activeView === 'marcas'
      ? MODULE_METADATA['catalogo']
      : {
          title: 'Sistema ERP MG Solutions',
          subtitle: 'Gestión integrada comercial, técnica y operativa',
          icon: LayoutDashboard,
        });

  const CurrentModuleIcon = currentMeta.icon;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-6 h-16 bg-gradient-to-r from-[#07193B] via-[#0B224D] to-[#081C42] text-white border-b border-blue-950/60 shadow-md w-full transition-all font-sans">
      {/* Decorative subtle curved waves matching reference design */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="hidden md:block absolute -top-12 right-52 w-72 h-36 rounded-full bg-[#15459B]/30 blur-xl" />
        <div className="hidden md:block absolute -bottom-16 right-16 w-80 h-32 rounded-full bg-[#1E5BBF]/20 blur-lg" />
      </div>

      {/* Left section: mobile hamburger, brand logo & sede/module selector */}
      <div className="relative z-10 flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="md:hidden text-white/85 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          title="Abrir Menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Identity */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <span className="font-black text-[#07193B] text-base tracking-tight">MG</span>
          </div>
          <div className="hidden xs:block sm:block">
            <p className="font-bold text-sm text-white tracking-wide leading-tight">MG SOLUTIONS</p>
            <p className="text-[10px] font-semibold text-blue-200/75 uppercase tracking-widest leading-tight">
              ERP SYSTEM
            </p>
          </div>
        </div>

        {/* Vertical divider */}
        <div className="hidden sm:block h-7 w-px bg-white/15 mx-1.5 shrink-0" />

        {/* Selector / Indicador de Sede Activa + Módulo actual */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative">
            {isSuperAdmin && onSelectSede ? (
              <button
                type="button"
                onClick={() => setShowSedeDropdown(!showSedeDropdown)}
                className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#102E66]/85 hover:bg-[#173F8A] text-white border border-blue-400/25 transition-all cursor-pointer shadow-xs"
                title="Haga clic para cambiar de sede de visualización"
              >
                {selectedSedeId ? (
                  <Store className="w-4 h-4 text-blue-200 shrink-0" strokeWidth={1.75} />
                ) : (
                  <LayoutGrid className="w-4 h-4 text-blue-200 shrink-0" strokeWidth={1.75} />
                )}
                <span className="max-w-[130px] sm:max-w-[200px] truncate">{currentSedeNombre}</span>
                <ChevronDown className="w-3.5 h-3.5 text-blue-200/80 shrink-0" />
              </button>
            ) : (
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#102E66]/75 text-white border border-blue-400/20">
                <Store className="w-4 h-4 text-blue-200 shrink-0" strokeWidth={1.75} />
                <span className="max-w-[130px] sm:max-w-[200px] truncate">{currentSedeNombre}</span>
              </span>
            )}

            {/* Dropdown Menu para SuperAdmin */}
            {isSuperAdmin && showSedeDropdown && onSelectSede && (
              <>
                <div
                  className="fixed inset-0 z-50"
                  onClick={() => setShowSedeDropdown(false)}
                />
                <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Filtrar por Sucursal
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectSede(null);
                      setShowSedeDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
                      selectedSedeId === null
                        ? 'bg-[#EFF4FF] text-[#00346F] font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                      <span>Todas las Sedes (Consolidado)</span>
                    </div>
                    {selectedSedeId === null && <Check className="w-3.5 h-3.5 text-[#00346F]" />}
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  {sucursales
                    .filter((suc) => suc.estado === 'ACTIVO')
                    .map((suc) => {
                      const isSelected = selectedSedeId === suc.id;
                      return (
                        <button
                          key={suc.id}
                          type="button"
                          onClick={() => {
                            onSelectSede(suc.id);
                            setShowSedeDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-[#EFF4FF] text-[#00346F] font-bold'
                              : 'text-slate-700 hover:bg-slate-50 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Store className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate">{suc.nombre.replace(/^[0-9]+ - /, '')}</span>
                            {suc.esPrincipal && (
                              <span className="text-[9px] px-1 bg-amber-100 text-amber-800 rounded font-bold shrink-0">
                                Central
                              </span>
                            )}
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#00346F] shrink-0" />}
                        </button>
                      );
                    })}
                </div>
              </>
            )}
          </div>

          {/* Active Module Pill on larger screens */}
          <div className="hidden lg:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-blue-100/90 truncate">
            <CurrentModuleIcon className="w-3.5 h-3.5 text-blue-300 shrink-0" strokeWidth={1.75} />
            <span className="truncate max-w-[220px]">{currentMeta.title}</span>
          </div>
        </div>
      </div>

      {/* Right section: profile */}
      <div className="relative z-10 flex items-center gap-2 sm:gap-4">
        {/* User Pill / Dropdown */}
        <div className="relative pl-3 border-l border-white/15">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 px-2 py-1 rounded-xl hover:bg-white/10 transition-colors text-left cursor-pointer"
          >
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1D4ED8] to-[#0A3075] text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-blue-300/35">
                {currentUser?.avatar || currentUser?.nombreCompleto?.slice(0, 2).toUpperCase() || 'SA'}
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-[#081C42] bg-emerald-400"
                title="Usuario activo"
              />
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-semibold text-white leading-tight truncate max-w-[170px]">
                {currentUser?.nombreCompleto || 'Usuario del Sistema'}
              </p>
              <p className="text-[11px] font-normal text-blue-200/75 tracking-normal truncate max-w-[170px]">
                {currentUser?.nombreCompleto?.trim().toUpperCase() === (currentUser?.rolNombre || currentUser?.rol || '').trim().toUpperCase()
                  ? (currentUser?.email || 'Cuenta Raíz')
                  : (currentUser?.rolNombre || (currentUser?.rol === 'ADMIN' ? 'Administrador' : currentUser?.rol || 'Personal'))}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-blue-200/80 hidden sm:block shrink-0" />
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800">{currentUser?.nombreCompleto}</p>
                  <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                      Cuenta: {currentUser?.estado || 'ACTIVO'}
                    </span>
                  </div>
                </div>

                {(canAccessUsuarios || canAccessEmpresa) && (
                  <div className="py-1 border-b border-slate-100">
                    {canAccessUsuarios && (
                      <button
                        onClick={() => {
                          setActiveView('usuarios');
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-lg text-left cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        Gestión de Usuarios
                      </button>
                    )}
                    {canAccessEmpresa && (
                      <button
                        onClick={() => {
                          setActiveView('config-empresa');
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-lg text-left cursor-pointer"
                      >
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        Datos de la Empresa
                      </button>
                    )}
                  </div>
                )}

                <div className="pt-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg text-left font-semibold cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-500" />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
