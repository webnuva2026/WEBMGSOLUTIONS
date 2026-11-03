import React, { useState } from 'react';
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
  searchTerm: string;
  setSearchTerm: (term: string) => void;
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
  const [showPresenceMenu, setShowPresenceMenu] = useState(false);

  const isSuperAdmin = currentUser?.rol === 'SUPERADMIN' || currentUser?.rol === 'ADMIN';
  const canAccessUsuarios =
    isSuperAdmin || Boolean(currentUser?.modulosPermitidos?.includes('usuarios'));
  const canAccessEmpresa =
    isSuperAdmin || Boolean(currentUser?.modulosPermitidos?.includes('config-empresa'));

  const PRESENCE_OPTIONS = [
    {
      id: 'DISPONIBLE',
      label: 'Disponible (En línea)',
      shortLabel: 'Disponible',
      desc: 'Activo y recibiendo asignaciones',
      dotClass: 'bg-emerald-500 animate-pulse',
      pillClass: 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100',
    },
    {
      id: 'OCUPADO',
      label: 'Ocupado / En Reparación',
      shortLabel: 'Ocupado',
      desc: 'En diagnóstico o mesa de trabajo',
      dotClass: 'bg-red-500',
      pillClass: 'bg-red-50 border-red-200 text-red-800 hover:bg-red-100',
    },
    {
      id: 'ALMUERZO',
      label: 'En Almuerzo / Refrigerio',
      shortLabel: 'Almuerzo',
      desc: 'Horario de refrigerio en curso',
      dotClass: 'bg-amber-500',
      pillClass: 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100',
    },
    {
      id: 'ENFERMERIA',
      label: 'Enfermería / Tópico',
      shortLabel: 'Enfermería',
      desc: 'Atención médica o tópico',
      dotClass: 'bg-purple-500',
      pillClass: 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100',
    },
    {
      id: 'COMISION',
      label: 'Atendiendo / En Comisión',
      shortLabel: 'En Comisión',
      desc: 'En mostrador o diligencia externa',
      dotClass: 'bg-blue-500',
      pillClass: 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100',
    },
    {
      id: 'AUSENTE',
      label: 'Ausente / Pausa corta',
      shortLabel: 'Ausente',
      desc: 'Fuera del puesto temporalmente',
      dotClass: 'bg-slate-400',
      pillClass: 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200',
    },
  ] as const;

  const presenceStorageKey = `mg_presence_status_${currentUser?.id || 'default'}`;
  const [presenceStatus, setPresenceStatus] = useState<string>(() => {
    return localStorage.getItem(presenceStorageKey) || 'DISPONIBLE';
  });

  React.useEffect(() => {
    const saved = localStorage.getItem(presenceStorageKey);
    setPresenceStatus(saved || 'DISPONIBLE');
  }, [presenceStorageKey]);

  const handleSelectPresence = (statusId: string) => {
    setPresenceStatus(statusId);
    localStorage.setItem(presenceStorageKey, statusId);
    setShowPresenceMenu(false);
  };

  const currentPresence =
    PRESENCE_OPTIONS.find((p) => p.id === presenceStatus) || PRESENCE_OPTIONS[0];
  const currentSedeNombre = selectedSedeId
    ? sucursales.find((s) => s.id === selectedSedeId)?.nombre.replace(/^[0-9]+ - /, '') || 'Sede Seleccionada'
    : isSuperAdmin
    ? 'Todas las Sedes (Consolidado)'
    : currentUser?.sucursal?.replace(/^[0-9]+ - /, '') || 'Sede Principal';
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const searchResults = React.useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (q.length < 2) return null;

    const matchedOrders = ordenes
      .filter(
        (o) =>
          o.codigo.toLowerCase().includes(q) ||
          o.clienteNombre.toLowerCase().includes(q) ||
          o.modelo.toLowerCase().includes(q) ||
          o.marca.toLowerCase().includes(q)
      )
      .slice(0, 3);

    const matchedProducts = productos
      .filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.codigo.toLowerCase().includes(q) ||
          (p.codigoBarra && p.codigoBarra.includes(q))
      )
      .slice(0, 3);

    const matchedClients = clientes
      .filter(
        (c) =>
          c.razonSocial.toLowerCase().includes(q) ||
          c.numeroDocumento.includes(q)
      )
      .slice(0, 3);

    return {
      orders: matchedOrders,
      products: matchedProducts,
      clients: matchedClients,
      hasResults:
        matchedOrders.length > 0 ||
        matchedProducts.length > 0 ||
        matchedClients.length > 0,
    };
  }, [searchTerm, ordenes, productos, clientes]);

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
    <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 md:px-6 h-16 bg-white border-b border-slate-200 shadow-sm w-full md:pl-[285px] transition-all">
      {/* Left section: mobile hamburger & dynamic module title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="md:hidden text-slate-600 hover:text-[#00346F] p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
          title="Abrir Menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dynamic Module Identity */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#00346F]/10 text-[#00346F] flex items-center justify-center shrink-0 border border-[#00346F]/15 shadow-2xs">
            <CurrentModuleIcon className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            {/* Breadcrumb superior sutil */}
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 leading-tight">
              <span className="font-bold text-slate-700 hidden sm:inline">MG SOLUTIONS</span>
              <ChevronRight className="w-3 h-3 text-slate-400 hidden sm:inline" />
              <span className="text-[#00346F] font-bold truncate">
                {currentMeta.title}
              </span>
              {currentMeta.badge && (
                <span className="hidden md:inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-50 text-[#00346F] border border-blue-200 ml-1">
                  {currentMeta.badge}
                </span>
              )}
            </div>

            {/* Título y Sede activa */}
            <div className="flex items-center gap-2 mt-0.5">
              <h1 className="text-sm sm:text-base font-black text-[#0B1C30] tracking-tight truncate leading-tight">
                {currentMeta.title}
              </h1>

              {/* Selector / Indicador de Sede Activa */}
              <div className="relative">
                {isSuperAdmin && onSelectSede ? (
                  <button
                    type="button"
                    onClick={() => setShowSedeDropdown(!showSedeDropdown)}
                    className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF4FF] hover:bg-blue-100 text-[#00346F] border border-blue-200 transition-all cursor-pointer shadow-2xs"
                    title="Haga clic para cambiar de sede de visualización"
                  >
                    {selectedSedeId ? (
                      <Store className="w-3 h-3 text-[#00346F]" />
                    ) : (
                      <Globe className="w-3 h-3 text-[#00346F]" />
                    )}
                    <span className="max-w-[140px] truncate">{currentSedeNombre}</span>
                    <ChevronDown className="w-3 h-3 text-[#00346F]/70" />
                  </button>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    <Store className="w-3 h-3 text-[#00346F]" />
                    <span className="max-w-[140px] truncate">{currentSedeNombre}</span>
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
                          <span>🌐 Todas las Sedes (Consolidado)</span>
                        </div>
                        {selectedSedeId === null && <Check className="w-3.5 h-3.5 text-[#00346F]" />}
                      </button>

                      <div className="my-1 border-t border-slate-100" />

                      {sucursales.map((suc) => {
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
            </div>
          </div>
        </div>
      </div>

      {/* Right section: search, notifications, system links & profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Global Search with Live Results Dropdown */}
        <div className="relative hidden lg:block">
          <div className="flex items-center bg-[#F1F5F9] rounded-full px-3.5 py-1.5 border border-slate-200 focus-within:border-[#00346F] focus-within:bg-white transition-all w-60 xl:w-72 shadow-2xs">
            <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar ticket, producto..."
              className="bg-transparent border-none focus:outline-none text-xs text-slate-700 w-full placeholder-slate-400"
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1"
              >
                ×
              </button>
            ) : (
              <kbd className="hidden xl:inline-block px-1.5 py-0.5 text-[9px] font-mono font-bold bg-white text-slate-400 rounded border border-slate-200 shadow-2xs">
                Ctrl K
              </kbd>
            )}
          </div>

          {/* Search Dropdown Popup */}
          {searchResults && searchResults.hasResults && (
            <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 p-2.5 z-50 text-xs divide-y divide-slate-100">
              {/* Tickets */}
              {searchResults.orders.length > 0 && (
                <div className="pb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    Tickets de Taller
                  </span>
                  <div className="space-y-1 mt-1">
                    {searchResults.orders.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => {
                          setActiveView('taller');
                          setSearchTerm('');
                          setIsSearchFocused(false);
                        }}
                        className="w-full text-left p-1.5 hover:bg-blue-50 rounded-lg flex items-center justify-between transition-colors"
                      >
                        <div>
                          <span className="font-mono font-bold text-[#00346F]">
                            {o.codigo}
                          </span>
                          <p className="text-[11px] text-slate-600 line-clamp-1">
                            {o.marca} {o.modelo} • {o.clienteNombre}
                          </p>
                        </div>
                        <Wrench className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Products */}
              {searchResults.products.length > 0 && (
                <div className="py-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    Productos & Catálogo
                  </span>
                  <div className="space-y-1 mt-1">
                    {searchResults.products.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setActiveView('ventas');
                          setSearchTerm('');
                          setIsSearchFocused(false);
                        }}
                        className="w-full text-left p-1.5 hover:bg-emerald-50 rounded-lg flex items-center justify-between transition-colors"
                      >
                        <div>
                          <span className="font-bold text-slate-800 line-clamp-1">
                            {p.nombre}
                          </span>
                          <p className="text-[10px] text-slate-500 font-mono">
                            SKU: {p.codigo} • S/ {p.precioUnitario.toFixed(2)}
                          </p>
                        </div>
                        <Package className="w-3.5 h-3.5 text-emerald-600" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Clients */}
              {searchResults.clients.length > 0 && (
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    Clientes
                  </span>
                  <div className="space-y-1 mt-1">
                    {searchResults.clients.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setActiveView('clientes');
                          setSearchTerm('');
                          setIsSearchFocused(false);
                        }}
                        className="w-full text-left p-1.5 hover:bg-slate-50 rounded-lg flex items-center justify-between transition-colors"
                      >
                        <div>
                          <span className="font-bold text-slate-800 line-clamp-1">
                            {c.razonSocial}
                          </span>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {c.tipoDocumento}: {c.numeroDocumento}
                          </p>
                        </div>
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors relative"
              title="Notificaciones"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 font-semibold text-slate-800">
                  <span>Notificaciones del sistema</span>
                  <span className="text-[10px] text-emerald-600">Al día</span>
                </div>
                <div className="space-y-2 mt-2">
                  <div className="p-2 rounded bg-emerald-50 text-emerald-800 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Certificado Digital Validado</p>
                      <p className="text-[10px] text-emerald-600">Vigente hasta 31/12/2026</p>
                    </div>
                  </div>
                  <div className="p-2 rounded bg-amber-50 text-amber-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Servicios pendientes de revisión</p>
                      <p className="text-[10px] text-amber-600">Requieren atención del equipo técnico</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {canAccessEmpresa && (
            <button
              onClick={() => setActiveView('config-empresa')}
              className="text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors hidden sm:block cursor-pointer"
              title="Configuración de Empresa"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => {
              alert(
                'Sistema ERP MG SOLUTIONS GROUP S.A.C.\n\nSoporte Técnico: soporte@mgsolutions.pe\nTeléfono: +51 974 812 390\nRUC: 20609737524\nVersión Backend: Node.js + TiDB Cloud MySQL'
              );
            }}
            className="text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors hidden sm:block cursor-pointer"
            title="Ayuda y Soporte"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Selector interactivo de Estado Operativo (Disponible, Ocupado, Almuerzo, Enfermería, etc.) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowPresenceMenu(!showPresenceMenu);
              setShowUserMenu(false);
              setShowNotifications(false);
            }}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all cursor-pointer shadow-2xs ${currentPresence.pillClass}`}
            title="Cambiar mi estado operativo actual"
          >
            <span className={`w-2 h-2 rounded-full ${currentPresence.dotClass}`}></span>
            <span>{currentPresence.shortLabel}</span>
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>

          {showPresenceMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowPresenceMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-100">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Mi Estado Operativo
                  </p>
                </div>
                <div className="py-1">
                  {PRESENCE_OPTIONS.map((opt) => {
                    const isSelected = currentPresence.id === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectPresence(opt.id)}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected ? 'bg-[#EFF4FF]' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${opt.dotClass}`} />
                          <div>
                            <p className={`text-xs ${isSelected ? 'font-bold text-[#00346F]' : 'font-semibold text-slate-800'}`}>
                              {opt.label}
                            </p>
                            <p className="text-[10px] text-slate-400 leading-tight">
                              {opt.desc}
                            </p>
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#00346F] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Pill / Dropdown */}
        <div className="relative pl-3 border-l border-slate-200">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowPresenceMenu(false);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 p-1 rounded-full hover:bg-slate-100 transition-colors text-left cursor-pointer"
          >
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[150px]">
                {currentUser?.nombreCompleto || 'Usuario del Sistema'}
              </p>
              <p className="text-[10px] font-black text-[#00346F] uppercase tracking-wider">
                {currentUser?.rolNombre || (currentUser?.rol === 'ADMIN' ? 'Administrador' : currentUser?.rol || 'Personal')}
              </p>
            </div>
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00346F] to-[#001D40] text-white flex items-center justify-center font-black text-xs shadow-xs ring-2 ring-blue-100">
                {currentUser?.avatar || currentUser?.nombreCompleto?.slice(0, 2).toUpperCase() || 'SA'}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${currentPresence.dotClass}`}
              />
            </div>
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
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${currentPresence.pillClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${currentPresence.dotClass}`} />
                      {currentPresence.shortLabel}
                    </span>
                  </div>
                </div>

                {/* Selector rápido de estado dentro del menú de perfil */}
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Cambiar disponibilidad
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {PRESENCE_OPTIONS.map((opt) => {
                      const active = currentPresence.id === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectPresence(opt.id)}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                            active
                              ? 'bg-[#00346F] text-white shadow-2xs'
                              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? 'bg-white' : opt.dotClass}`} />
                          <span className="truncate">{opt.shortLabel}</span>
                        </button>
                      );
                    })}
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
