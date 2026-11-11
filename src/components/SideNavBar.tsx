import React from 'react';
import {
  ShieldCheck,
  Wrench,
  Package,
  Tag,
  Users,
  X,
  ArrowLeftRight,
  LayoutDashboard,
  Truck,
  DollarSign,
  ClipboardList,
  Layers,
  Laptop,
  Receipt,
  Store,
  Boxes,
  Cpu,
  LogOut,
} from 'lucide-react';
import { Usuario } from '../types';

interface SideNavBarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  currentUser: Usuario;
  onLogout?: () => void;
}

export const SideNavBar: React.FC<SideNavBarProps> = ({
  activeView,
  setActiveView,
  isOpenMobile,
  onCloseMobile,
  currentUser,
  onLogout,
}) => {
  const moduleLabels: Record<string, { label: string; icon: React.ReactNode }> = {
    dashboard: { label: 'Dashboard Operativo', icon: <LayoutDashboard className="w-5 h-5 shrink-0" strokeWidth={1.75} /> },
    ventas: { label: 'Punto de Venta (POS)', icon: <Receipt className="w-5 h-5 shrink-0" strokeWidth={1.75} /> },
    caja: { label: 'Caja & Finanzas', icon: <DollarSign className="w-5 h-5 shrink-0" strokeWidth={1.75} /> },
    compras: { label: 'Compras & Proveedores', icon: <Truck className="w-5 h-5 shrink-0" strokeWidth={1.75} /> },
    'panel-recepcion': { label: 'Panel de recepción', icon: <ClipboardList className="w-5 h-5 shrink-0" strokeWidth={1.75} /> },
    'panel-almacen': {
      label: currentUser.rol === 'TECNICO' ? 'Consultar inventario' : 'Almacén, Pedidos & Proveedores',
      icon: <Boxes className="w-5 h-5 shrink-0" strokeWidth={1.75} />,
    },
    taller: {
      label: currentUser.rol === 'TECNICO' ? 'Mis servicios técnicos' : 'Taller & Órdenes de Servicio',
      icon: <Wrench className="w-5 h-5 shrink-0" strokeWidth={1.75} />,
    },
    equipos: { label: 'Equipos de Clientes', icon: <Laptop className="w-5 h-5 shrink-0" strokeWidth={1.75} /> },
    clientes: { label: 'Directorio de Clientes', icon: <Users className="w-5 h-5 shrink-0" strokeWidth={1.75} /> },
    productos: {
      label: currentUser.rol === 'TECNICO' ? 'Consultar inventario' : 'Almacén, Pedidos & Proveedores',
      icon: <Boxes className="w-5 h-5 shrink-0" strokeWidth={1.75} />,
    },
    movimientos: { label: 'Movimientos entre sedes', icon: <ArrowLeftRight className="w-5 h-5 shrink-0" strokeWidth={1.75} /> },
    catalogo: { label: 'Catálogo de Productos', icon: <Layers className="w-5 h-5 shrink-0" strokeWidth={1.75} /> },
    categorias: { label: 'Catálogo de Productos', icon: <Layers className="w-5 h-5 shrink-0" strokeWidth={1.75} /> },
    marcas: { label: 'Catálogo de Productos', icon: <Layers className="w-5 h-5 shrink-0" strokeWidth={1.75} /> },
    'repuestos-catalogo': { label: 'Catálogo de Repuestos', icon: <Cpu className="w-5 h-5 shrink-0" strokeWidth={1.75} /> },
    usuarios: { label: 'Usuarios & Permisos', icon: <ShieldCheck className="w-5 h-5 shrink-0" strokeWidth={1.75} /> },
    'config-empresa': { label: 'Sucursales', icon: <Store className="w-5 h-5 shrink-0" strokeWidth={1.75} /> },
    sucursales: { label: 'Sucursales', icon: <Store className="w-5 h-5 shrink-0" strokeWidth={1.75} /> },
  };

  const handleNavClick = (viewName: string) => {
    if (viewName === 'config-empresa') {
      setActiveView('sucursales');
    } else if (viewName === 'categorias' || viewName === 'marcas') {
      setActiveView('catalogo');
    } else if (viewName === 'productos') {
      setActiveView('panel-almacen');
    } else {
      setActiveView(viewName);
    }
    onCloseMobile();
  };

  const renderNavItem = (viewId: string) => {
    const effectiveId =
      viewId === 'config-empresa'
        ? 'sucursales'
        : viewId === 'categorias' || viewId === 'marcas'
        ? 'catalogo'
        : viewId === 'productos'
        ? 'panel-almacen'
        : viewId;
    const info = moduleLabels[effectiveId] || { label: effectiveId, icon: <Package className="w-5 h-5 shrink-0" strokeWidth={1.75} /> };
    const isActive =
      activeView === effectiveId ||
      (effectiveId === 'panel-almacen' && (activeView === 'productos' || activeView === 'compras')) ||
      (effectiveId === 'sucursales' && activeView === 'config-empresa') ||
      (effectiveId === 'catalogo' && (activeView === 'categorias' || activeView === 'marcas' || activeView === 'catalogo'));

    return (
      <button
        key={effectiveId}
        type="button"
        onClick={() => handleNavClick(effectiveId)}
        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left font-sans text-[13px] leading-tight font-medium tracking-normal cursor-pointer border ${
          isActive
            ? 'bg-gradient-to-r from-[#1356B8] to-[#0D469B] text-white border-blue-400/40 shadow-[0_2px_10px_rgba(19,86,184,0.45)]'
            : 'text-slate-200/90 border-transparent hover:bg-white/10 hover:text-white'
        }`}
      >
        {info.icon}
        <span className="truncate">{info.label}</span>
      </button>
    );
  };

  // Módulos maquetados solo en frontend que se ocultan temporalmente de la vista
  // para trabajar en orden e ir activándolos uno por uno conforme se desarrolle su backend.
  // IMPORTANTE: NO están borrados; para reactivar cualquiera simplemente remuévalo de esta lista.
  const MODULOS_TEMPORALMENTE_OCULTOS: string[] = [
    'caja',            // Caja & Finanzas
    'equipos',         // Equipos de Clientes
  ];


  // Determinar los módulos a renderizar bajo "Módulos Habilitados"
  const getModulesList = (): string[] => {
    let list: string[] = [];
    if (currentUser.rol === 'SUPERADMIN' || currentUser.rol === 'ADMIN') {
      // Orden predeterminado con Almacén, Pedidos & Proveedores unificados
      list = [
        'ventas',
        'caja',
        'panel-recepcion',
        'panel-almacen',
        'taller',
        'equipos',
        'clientes',
        'movimientos',
        'catalogo',
        'repuestos-catalogo',
        'usuarios',
        'sucursales',
      ];
    } else {
      // Para otros roles, tomar sus módulos asignados y mapear a catalogo/sucursales/panel-almacen
      const userModules = currentUser.modulosPermitidos || [];
      const mapped = userModules.map((m) => {
        if (m === 'config-empresa') return 'sucursales';
        if (m === 'categorias' || m === 'marcas') return 'catalogo';
        if (m === 'productos' || m === 'compras') return 'panel-almacen';
        return m;
      });
      if (currentUser.rol === 'TECNICO' && !mapped.includes('repuestos-catalogo')) {
        mapped.push('repuestos-catalogo');
      }
      list = Array.from<string>(new Set(mapped));
    }

    // Filtrar para ocultar de la vista los módulos que aún son solo frontend
    return list.filter((m) => !MODULOS_TEMPORALMENTE_OCULTOS.includes(m));
  };

  const modulesToRender = getModulesList();

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
        className={`fixed top-0 md:top-16 bottom-0 left-0 w-[260px] bg-gradient-to-b from-[#071A3C] to-[#04122B] text-white z-50 md:z-40 flex flex-col border-r border-blue-950/60 shadow-2xl transition-transform duration-300 md:translate-x-0 font-sans ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Mobile-only Company Header (desktop brand is in TopNavBar) */}
        <div className="md:hidden p-5 border-b border-blue-900/40 flex flex-col items-center justify-center text-center relative">
          <button
            onClick={onCloseMobile}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center mb-2 shadow-md">
            <span className="font-black text-[#071A3C] text-lg tracking-tight">MG</span>
          </div>
          <h2 className="font-bold text-sm text-white tracking-wide">MG SOLUTIONS</h2>
          <p className="text-[10px] font-semibold text-blue-200/80 uppercase tracking-widest mt-0.5">
            ERP System
          </p>
        </div>

        {/* Navigation list: Formato plano "MÓDULOS HABILITADOS" */}
        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-4">
          <div>
            <p className="px-3 pb-2.5 text-[11px] font-semibold uppercase tracking-wider text-blue-200/60">
              Módulos Habilitados
            </p>
            <div className="space-y-1">
              {modulesToRender.map((moduleId) => renderNavItem(moduleId))}
            </div>
          </div>
        </div>

        {/* User / Logout Footer */}
        <div className="p-3 border-t border-white/10 bg-transparent">
          {onLogout ? (
            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-white border border-blue-300/35 font-medium text-[13px] transition-all cursor-pointer group"
              title="Cerrar sesión de forma segura"
            >
              <LogOut className="w-4 h-4 text-white" strokeWidth={1.75} />
              <span>Cerrar Sesión</span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5 px-2 py-1">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-black text-xs text-blue-200">
                {currentUser.nombreCompleto.charAt(0)}
              </div>
              <p className="text-xs font-bold text-white truncate">{currentUser.nombreCompleto}</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

