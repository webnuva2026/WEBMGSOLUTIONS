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
  Truck,
  DollarSign,
  ClipboardList,
  Layers,
  Laptop,
  Receipt,
  Store,
  Boxes,
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
  const [tallerOpen, setTallerOpen] = React.useState(true);
  const [configOpen, setConfigOpen] = React.useState(false);

  const isRestrictedUser = currentUser.rol !== 'ADMIN';

  const moduleLabels: Record<string, { label: string; icon: React.ReactNode }> = {
    dashboard: { label: 'Dashboard Operativo', icon: <LayoutDashboard className="w-5 h-5 shrink-0" /> },
    ventas: { label: 'Punto de Venta (POS)', icon: <Receipt className="w-5 h-5 shrink-0" /> },
    caja: { label: 'Caja & Finanzas', icon: <DollarSign className="w-5 h-5 shrink-0" /> },
    taller: {
      label: currentUser.rol === 'TECNICO' ? 'Mis servicios técnicos' : 'Taller & Órdenes de Servicio',
      icon: <Wrench className="w-5 h-5 shrink-0" />,
    },
    'panel-recepcion': { label: 'Panel de recepción', icon: <ClipboardList className="w-5 h-5 shrink-0" /> },
    'panel-almacen': { label: 'Panel de almacén', icon: <Boxes className="w-5 h-5 shrink-0" /> },
    equipos: { label: 'Equipos de Clientes', icon: <Laptop className="w-5 h-5 shrink-0" /> },
    productos: {
      label: currentUser.rol === 'TECNICO' ? 'Consultar inventario' : 'Productos & Stock por Sede',
      icon: <Package className="w-5 h-5 shrink-0" />,
    },
    compras: { label: 'Compras & Proveedores', icon: <Truck className="w-5 h-5 shrink-0" /> },
    movimientos: { label: 'Movimientos entre sedes', icon: <ArrowLeftRight className="w-5 h-5 shrink-0" /> },
    categorias: { label: 'Categorías', icon: <Layers className="w-5 h-5 shrink-0" /> },
    marcas: { label: 'Marcas', icon: <Tag className="w-5 h-5 shrink-0" /> },
    clientes: { label: 'Directorio de Clientes', icon: <Users className="w-5 h-5 shrink-0" /> },
    usuarios: { label: 'Usuarios & Permisos', icon: <ShieldCheck className="w-5 h-5 shrink-0" /> },
    'config-empresa': { label: 'Datos de Empresa', icon: <Building2 className="w-5 h-5 shrink-0" /> },
    sucursales: { label: 'Sedes & Sucursales', icon: <Store className="w-5 h-5 shrink-0" /> },
  };

  const handleNavClick = (viewName: string) => {
    setActiveView(viewName);
    onCloseMobile();
  };

  const renderNavItem = (viewId: string, label?: string, icon?: React.ReactNode) => {
    const info = moduleLabels[viewId] || { label: label || viewId, icon: icon || <Package className="w-5 h-5" /> };
    const isActive = activeView === viewId;

    return (
      <button
        key={viewId}
        type="button"
        onClick={() => handleNavClick(viewId)}
        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left text-sm font-semibold cursor-pointer ${
          isActive
            ? 'bg-[#004A99] text-white border-l-4 border-emerald-400 font-bold shadow-md'
            : 'text-slate-200/90 hover:bg-white/10 hover:text-white'
        }`}
      >
        {info.icon}
        <span className="truncate">{info.label}</span>
      </button>
    );
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
        className={`fixed top-0 bottom-0 left-0 w-[285px] bg-[#00346F] text-white z-50 flex flex-col shadow-2xl transition-transform duration-300 md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Company Header */}
        <div className="p-5 border-b border-blue-900/40 flex flex-col items-center justify-center text-center relative">
          <button
            onClick={onCloseMobile}
            className="md:hidden absolute top-4 right-4 text-white/70 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-2 shadow-md">
            <span className="font-black text-[#00346F] text-xl tracking-tight">MG</span>
          </div>
          <h2 className="font-black text-sm text-white tracking-wide">MG SOLUTIONS GROUP</h2>
          <p className="text-[10px] font-bold text-blue-200/80 uppercase tracking-widest mt-0.5">
            ERP System • Chiclayo
          </p>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-4 text-sm">
          {isRestrictedUser ? (
            <div>
              <p className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-blue-200/70">
                Módulos Habilitados
              </p>
              <div className="space-y-1">
                {currentUser.modulosPermitidos.map((moduleId) => renderNavItem(moduleId))}
              </div>
            </div>
          ) : (
            <>
              {/* Resumen Principal */}
              <div>
                <p className="px-3 pb-1.5 text-xs font-bold uppercase tracking-wider text-blue-200/70">
                  Principal
                </p>
                <div className="space-y-1">
                  {renderNavItem('dashboard', 'Dashboard Operativo', <LayoutDashboard className="w-5 h-5" />)}
                  {renderNavItem('ventas', 'Punto de Venta (POS)', <Receipt className="w-5 h-5" />)}
                  {renderNavItem('caja', 'Caja & Finanzas', <DollarSign className="w-5 h-5" />)}
                </div>
              </div>

              {/* Taller y Servicio Técnico */}
              <div>
                <div className="flex items-center justify-between px-3 pb-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-200/70">
                    Servicio Técnico
                  </p>
                  <button
                    type="button"
                    onClick={() => setTallerOpen(!tallerOpen)}
                    className="text-white/60 hover:text-white cursor-pointer"
                  >
                    {tallerOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
                {tallerOpen && (
                  <div className="space-y-1">
                    {renderNavItem('taller', 'Taller & Órdenes', <Wrench className="w-5 h-5" />)}
                    {renderNavItem('panel-recepcion', 'Panel de Recepción', <ClipboardList className="w-5 h-5" />)}
                    {renderNavItem('equipos', 'Equipos Registrados', <Laptop className="w-5 h-5" />)}
                  </div>
                )}
              </div>

              {/* Almacén e Inventario */}
              <div>
                <div className="flex items-center justify-between px-3 pb-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-200/70">
                    Almacén & Sedes
                  </p>
                  <button
                    type="button"
                    onClick={() => setAlmacenOpen(!almacenOpen)}
                    className="text-white/60 hover:text-white cursor-pointer"
                  >
                    {almacenOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
                {almacenOpen && (
                  <div className="space-y-1">
                    {renderNavItem('productos', 'Productos & Stock', <Package className="w-5 h-5" />)}
                    {renderNavItem('compras', 'Compras & Abastecimiento', <Truck className="w-5 h-5" />)}
                    {renderNavItem('movimientos', 'Traslados entre Sedes', <ArrowLeftRight className="w-5 h-5" />)}
                    {renderNavItem('panel-almacen', 'Panel de Almacén', <Boxes className="w-5 h-5" />)}
                    {renderNavItem('categorias', 'Categorías', <Layers className="w-5 h-5" />)}
                    {renderNavItem('marcas', 'Marcas', <Tag className="w-5 h-5" />)}
                  </div>
                )}
              </div>

              {/* Comercial */}
              <div>
                <p className="px-3 pb-1.5 text-xs font-bold uppercase tracking-wider text-blue-200/70">
                  Comercial
                </p>
                <div className="space-y-1">
                  {renderNavItem('clientes', 'Directorio de Clientes', <Users className="w-5 h-5" />)}
                </div>
              </div>

              {/* Administración */}
              <div>
                <div className="flex items-center justify-between px-3 pb-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-200/70">
                    Administración
                  </p>
                  <button
                    type="button"
                    onClick={() => setConfigOpen(!configOpen)}
                    className="text-white/60 hover:text-white cursor-pointer"
                  >
                    {configOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
                <div className="space-y-1">
                  {renderNavItem('usuarios', 'Usuarios & Paneles', <ShieldCheck className="w-5 h-5" />)}
                  {configOpen && (
                    <>
                      {renderNavItem('config-empresa', 'Datos de Empresa', <Building2 className="w-5 h-5" />)}
                      {renderNavItem('sucursales', 'Sedes & Sucursales', <Store className="w-5 h-5" />)}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Card Footer */}
        <div className="p-4 border-t border-blue-900/40 bg-blue-950/40 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-black text-sm text-blue-200">
            {currentUser.nombreCompleto.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{currentUser.nombreCompleto}</p>
            <p className="text-xs font-semibold text-blue-200/70 truncate">{currentUser.rol}</p>
          </div>
        </div>
      </aside>
    </>
  );
};
