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
  const moduleLabels: Record<string, { label: string; icon: React.ReactNode }> = {
    dashboard: { label: 'Dashboard Operativo', icon: <LayoutDashboard className="w-5 h-5 shrink-0" /> },
    ventas: { label: 'Punto de Venta (POS)', icon: <Receipt className="w-5 h-5 shrink-0" /> },
    caja: { label: 'Caja & Finanzas', icon: <DollarSign className="w-5 h-5 shrink-0" /> },
    compras: { label: 'Compras & Proveedores', icon: <Truck className="w-5 h-5 shrink-0" /> },
    'panel-recepcion': { label: 'Panel de recepción', icon: <ClipboardList className="w-5 h-5 shrink-0" /> },
    'panel-almacen': { label: 'Panel de almacén', icon: <Boxes className="w-5 h-5 shrink-0" /> },
    taller: {
      label: currentUser.rol === 'TECNICO' ? 'Mis servicios técnicos' : 'Taller & Órdenes de Servicio',
      icon: <Wrench className="w-5 h-5 shrink-0" />,
    },
    equipos: { label: 'Equipos de Clientes', icon: <Laptop className="w-5 h-5 shrink-0" /> },
    clientes: { label: 'Directorio de Clientes', icon: <Users className="w-5 h-5 shrink-0" /> },
    productos: {
      label: currentUser.rol === 'TECNICO' ? 'Consultar inventario' : 'Almacén & Inventario',
      icon: <Package className="w-5 h-5 shrink-0" />,
    },
    movimientos: { label: 'Movimientos entre sedes', icon: <ArrowLeftRight className="w-5 h-5 shrink-0" /> },
    catalogo: { label: 'Catálogo Maestro', icon: <Layers className="w-5 h-5 shrink-0" /> },
    categorias: { label: 'Catálogo Maestro', icon: <Layers className="w-5 h-5 shrink-0" /> },
    marcas: { label: 'Catálogo Maestro', icon: <Layers className="w-5 h-5 shrink-0" /> },
    usuarios: { label: 'Usuarios & Permisos', icon: <ShieldCheck className="w-5 h-5 shrink-0" /> },
    'config-empresa': { label: 'Sucursales', icon: <Store className="w-5 h-5 shrink-0" /> },
    sucursales: { label: 'Sucursales', icon: <Store className="w-5 h-5 shrink-0" /> },
  };

  const handleNavClick = (viewName: string) => {
    if (viewName === 'config-empresa') {
      setActiveView('sucursales');
    } else if (viewName === 'categorias' || viewName === 'marcas') {
      setActiveView('catalogo');
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
        : viewId;
    const info = moduleLabels[effectiveId] || { label: effectiveId, icon: <Package className="w-5 h-5 shrink-0" /> };
    const isActive =
      activeView === effectiveId ||
      (effectiveId === 'sucursales' && activeView === 'config-empresa') ||
      (effectiveId === 'catalogo' && (activeView === 'categorias' || activeView === 'marcas' || activeView === 'catalogo'));

    return (
      <button
        key={effectiveId}
        type="button"
        onClick={() => handleNavClick(effectiveId)}
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
      // Orden predeterminado con Catálogo Maestro unificado y Movimientos entre Sedes
      list = [
        'ventas',
        'caja',
        'compras',
        'panel-recepcion',
        'panel-almacen',
        'taller',
        'equipos',
        'clientes',
        'productos',
        'movimientos',
        'catalogo',
        'usuarios',
        'sucursales',
      ];
    } else {
      // Para otros roles, tomar sus módulos asignados y mapear a catalogo/sucursales
      const userModules = currentUser.modulosPermitidos || [];
      const mapped = userModules.map((m) => {
        if (m === 'config-empresa') return 'sucursales';
        if (m === 'categorias' || m === 'marcas') return 'catalogo';
        return m;
      });
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
        className={`fixed top-0 bottom-0 left-0 w-[285px] bg-[#00346F] text-white z-50 flex flex-col shadow-2xl transition-transform duration-300 md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Company Header */}
        <div className="p-5 border-b border-blue-900/40 flex flex-col items-center justify-center text-center relative">
          <button
            onClick={onCloseMobile}
            className="md:hidden absolute top-4 right-4 text-white/70 hover:text-white p-1 cursor-pointer"
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

        {/* Navigation list: Formato plano "MÓDULOS HABILITADOS" tal como estaba antes */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-4 text-sm">
          <div>
            <p className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-blue-200/70">
              Módulos Habilitados
            </p>
            <div className="space-y-1">
              {modulesToRender.map((moduleId) => renderNavItem(moduleId))}
            </div>
          </div>
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
