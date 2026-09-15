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
} from 'lucide-react';
import { Usuario, OrdenServicio, Producto, Cliente } from '../types';

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
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
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

  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 md:px-6 h-16 bg-white border-b border-slate-200 shadow-sm w-full md:pl-[260px] transition-all">
      {/* Left section: mobile hamburger & title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden text-slate-600 hover:text-[#00346F] p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          title="Abrir Menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <h1 className="text-base sm:text-lg font-bold text-[#00346F] tracking-tight">
            Gestión de ventas, inventario y servicio técnico
          </h1>
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

          <button
            onClick={() => setActiveView('config-empresa')}
            className="text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors hidden sm:block"
            title="Configuración de Empresa"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              alert(
                'Sistema ERP MG SOLUTIONS GROUP S.A.C.\n\nSoporte Técnico: soporte@mgsolutions.pe\nTeléfono: +51 974 812 390\nRUC: 20609737524\nVersión Backend: Spring Boot 3.3.x + MySQL 8.0'
              );
            }}
            className="text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors hidden sm:block"
            title="Ayuda y Soporte"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        {/* User Pill / Dropdown */}
        <div className="relative pl-3 border-l border-slate-200">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1 rounded-full hover:bg-slate-100 transition-colors text-left"
          >
            <div className="text-right hidden md:block">
              <p className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[150px]">
                {currentUser?.nombreCompleto || 'Torres Ll Milagros Mil...'}
              </p>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                {currentUser?.rol === 'ADMIN' ? 'Administrador' : currentUser?.rol || 'Administrador'}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#004A99] text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {currentUser?.avatar || 'TL'}
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800">{currentUser?.nombreCompleto}</p>
                <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                  Estado: {currentUser?.estado || 'ACTIVO'}
                </span>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setActiveView('usuarios');
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-lg text-left"
                >
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  Gestión de Usuarios
                </button>
                <button
                  onClick={() => {
                    setActiveView('config-empresa');
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-lg text-left"
                >
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  Datos de la Empresa
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg text-left font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-500" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
