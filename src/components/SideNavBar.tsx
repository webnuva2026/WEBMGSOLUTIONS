import React from 'react';
import {
  Settings,
  ShieldCheck,
  Wrench,
  Package,
  Tag,
  Users,
  Building2,
  ChevronDown,
  ChevronRight,
  X,
  ArrowLeftRight,
  LayoutDashboard,
  ShoppingCart,
} from 'lucide-react';
import { Usuario } from '../types';

interface SideNavBarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  currentUser: Usuario;
}

export const SideNavBar: React.FC<SideNavBarProps> = ({
  activeView,
  setActiveView,
  isOpenMobile,
  onCloseMobile,
  currentUser,
}) => {
  const [almacenOpen, setAlmacenOpen] = React.useState(true);
  const [configOpen, setConfigOpen] = React.useState(true);
  const isRestrictedUser = currentUser.rol !== 'ADMIN';
  const moduleLabels: Record<string, string> = {
    taller: currentUser.rol === 'TECNICO' ? 'Mis servicios técnicos' : 'Servicio técnico',
    'panel-recepcion': 'Panel de recepción',
    'panel-almacen': 'Panel de almacén',
    equipos: 'Equipos registrados',
    ventas: 'Punto de Venta (POS)',
    dashboard: 'Dashboard Operativo',
    clientes: 'Clientes',
    productos: currentUser.rol === 'TECNICO' ? 'Consultar inventario' : 'Productos e inventario',
    categorias: 'Categorías',
    marcas: 'Marcas',
    usuarios: 'Usuarios',
    'config-empresa': 'Empresa',
    sucursales: 'Sucursales',
    movimientos: 'Movimientos entre sedes',
  };

  const handleNavClick = (viewName: string) => {
    setActiveView(viewName);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-[260px] bg-[#00346F] text-white z-50 flex flex-col shadow-2xl transition-transform duration-300 md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Company Header matching Screenshot */}
        <div className="p-5 border-b border-blue-900/40 flex flex-col items-center justify-center text-center relative">
          <button
            onClick={onCloseMobile}
            className="md:hidden absolute top-4 right-4 text-white/70 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-2 shadow-md">
            <span className="font-extrabold text-[#00346F] text-xl tracking-tight">MG</span>
          </div>
          <h2 className="font-bold text-sm text-white tracking-wide">MG SOLUTIONS GROUP</h2>
          <p className="text-[10px] font-semibold text-blue-200/80 uppercase tracking-widest mt-0.5">
            ERP System
          </p>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 text-xs font-medium">
          {isRestrictedUser ? (
            <>
              <p className="px-3.5 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-200/70">
                Módulos disponibles
              </p>
              {currentUser.modulosPermitidos.map((moduleId) => (
                <button
                  key={moduleId}
                  onClick={() => handleNavClick(moduleId)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-left ${
                    activeView === moduleId
                      ? 'bg-[#004A99] text-white border-l-4 border-emerald-400 font-semibold shadow-inner'
                      : 'text-slate-200/85 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Package className="w-4 h-4 flex-shrink-0" />
                  <span>{moduleLabels[moduleId] || moduleId}</span>
                </button>
              ))}
            </>
          ) : (
            <>
          {/* Configuración */}
          <div>
            <button
              onClick={() => {
                setConfigOpen(!configOpen);
                handleNavClick('config-empresa');
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all text-left ${
                activeView.startsWith('config')
                  ? 'bg-[#004A99] text-white border-l-4 border-emerald-400 font-semibold shadow-inner'
                  : 'text-slate-200/85 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4 flex-shrink-0" />
                <span>Configuración</span>
              </div>
              {configOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-white/60" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-white/60" />
              )}
            </button>

            {configOpen && (
              <div className="pl-9 pr-2 py-1 space-y-0.5">
                <button
                  onClick={() => handleNavClick('config-empresa')}
                  className={`w-full text-left py-1.5 px-2 rounded text-[11px] transition-colors ${
                    activeView === 'config-empresa'
                      ? 'text-white font-bold bg-white/15'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Datos de la Empresa
                </button>
                <button
                  onClick={() => handleNavClick('sucursales')}
                  className={`w-full text-left py-1.5 px-2 rounded text-[11px] transition-colors ${
                    activeView === 'sucursales'
                      ? 'text-white font-bold bg-white/15'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Sucursales
                </button>
              </div>
            )}
          </div>

          {/* Administración / Usuarios */}
          <button
            onClick={() => handleNavClick('usuarios')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-left ${
              activeView === 'usuarios'
                ? 'bg-[#004A99] text-white border-l-4 border-emerald-400 font-semibold shadow-inner'
                : 'text-slate-200/85 hover:bg-white/10 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span>Administración / Usuarios</span>
          </button>

          {/* Clientes */}
          <button
            onClick={() => handleNavClick('clientes')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-left ${
              activeView === 'clientes'
                ? 'bg-[#004A99] text-white border-l-4 border-emerald-400 font-semibold shadow-inner'
                : 'text-slate-200/85 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 flex-shrink-0" />
            <span>Clientes</span>
          </button>

          {/* Servicio técnico */}
          <button
            onClick={() => handleNavClick('taller')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-left ${
              activeView === 'taller'
                ? 'bg-[#004A99] text-white border-l-4 border-emerald-400 font-semibold shadow-inner'
                : 'text-slate-200/85 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Wrench className="w-4 h-4 flex-shrink-0" />
            <span>Servicio técnico</span>
          </button>

          <button
            onClick={() => handleNavClick('equipos')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-left ${
              activeView === 'equipos'
                ? 'bg-[#004A99] text-white border-l-4 border-emerald-400 font-semibold shadow-inner'
                : 'text-slate-200/85 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4 flex-shrink-0" />
            <span>Equipos registrados</span>
          </button>

          {/* Almacén (Productos, Categorías, Marcas) */}
          <div>
            <button
              onClick={() => {
                setAlmacenOpen(!almacenOpen);
                handleNavClick('productos');
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all text-left ${
                activeView === 'productos' || activeView === 'categorias' || activeView === 'marcas'
                  ? 'bg-[#004A99] text-white border-l-4 border-emerald-400 font-semibold shadow-inner'
                  : 'text-slate-200/85 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 flex-shrink-0" />
                <span>Almacén</span>
              </div>
              {almacenOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-white/60" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-white/60" />
              )}
            </button>

            {almacenOpen && (
              <div className="pl-9 pr-2 py-1 space-y-0.5">
                <button
                  onClick={() => handleNavClick('productos')}
                  className={`w-full text-left py-1.5 px-2 rounded text-[11px] transition-colors ${
                    activeView === 'productos'
                      ? 'text-white font-bold bg-white/15'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Productos
                </button>
                <button
                  onClick={() => handleNavClick('categorias')}
                  className={`w-full text-left py-1.5 px-2 rounded text-[11px] transition-colors ${
                    activeView === 'categorias'
                      ? 'text-white font-bold bg-white/15'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Categorías
                </button>
                <button
                  onClick={() => handleNavClick('marcas')}
                  className={`w-full text-left py-1.5 px-2 rounded text-[11px] transition-colors ${
                    activeView === 'marcas'
                      ? 'text-white font-bold bg-white/15'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Marcas
                </button>
              </div>
            )}
          </div>

          {/* Movimientos de inventario */}
          <button
            onClick={() => handleNavClick('movimientos')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-left ${
              activeView === 'movimientos'
                ? 'bg-[#004A99] text-white border-l-4 border-emerald-400 font-semibold shadow-inner'
                : 'text-slate-200/85 hover:bg-white/10 hover:text-white'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4 flex-shrink-0" />
            <span>Movimientos entre sedes</span>
          </button>

          {/* Dashboard Operativo (Estadísticas y Resumen) */}
          <button
            onClick={() => handleNavClick('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-left ${
              activeView === 'dashboard'
                ? 'bg-[#004A99] text-white border-l-4 border-emerald-400 font-semibold shadow-inner'
                : 'text-slate-200/85 hover:bg-white/10 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
            <span>Dashboard Operativo</span>
          </button>

          {/* Punto de Venta (POS) */}
          <button
            onClick={() => handleNavClick('ventas')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-left ${
              activeView === 'ventas'
                ? 'bg-[#004A99] text-white border-l-4 border-emerald-400 font-semibold shadow-inner'
                : 'text-slate-200/85 hover:bg-white/10 hover:text-white'
            }`}
          >
            <ShoppingCart className="w-4 h-4 flex-shrink-0" />
            <span>Punto de Venta (POS)</span>
          </button>

            </>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-black/20 border-t border-blue-900/40 text-[10px] text-blue-200/70 text-center">
          <span>v2.5.0 • MG SOLUTIONS GROUP ERP</span>
        </div>
      </aside>
    </>
  );
};
