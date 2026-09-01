import React, { useState, useEffect } from 'react';
import {
  INITIAL_EMPRESA,
  INITIAL_SUCURSALES,
  INITIAL_USUARIOS,
  INITIAL_CATEGORIAS,
  INITIAL_MARCAS,
  INITIAL_PRODUCTOS,
  INITIAL_CLIENTES,
  INITIAL_COMPROBANTES,
} from './data/initialData';
import {
  Usuario,
  Cliente,
  Categoria,
  Marca,
  Producto,
  Comprobante,
  EmpresaConfig,
  Sucursal,
} from './types';
import { TopNavBar } from './components/TopNavBar';
import { SideNavBar } from './components/SideNavBar';
import { LoginScreen } from './components/LoginScreen';
import { DashboardView } from './components/DashboardView';
import { ProductsView } from './components/ProductsView';
import { CompanySettingsView } from './components/CompanySettingsView';
import { UsersManagementView } from './components/UsersManagementView';
import { ClientsManagementView } from './components/ClientsManagementView';
import { CategoriesView } from './components/CategoriesView';
import { BrandsView } from './components/BrandsView';
import { InvoiceModal } from './components/InvoiceModal';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';
import { ToastContainer, ToastMessage } from './components/Toast';

export function App() {
  // Persistence state loaders
  const [empresa, setEmpresa] = useState<EmpresaConfig>(() => {
    const saved = localStorage.getItem('mg_empresa');
    return saved ? JSON.parse(saved) : INITIAL_EMPRESA;
  });

  const [sucursales, setSucursales] = useState<Sucursal[]>(() => {
    const saved = localStorage.getItem('mg_sucursales');
    return saved ? JSON.parse(saved) : INITIAL_SUCURSALES;
  });

  const [usuarios, setUsuarios] = useState<Usuario[]>(() => {
    const saved = localStorage.getItem('mg_usuarios');
    return saved ? JSON.parse(saved) : INITIAL_USUARIOS;
  });

  const [categorias, setCategorias] = useState<Categoria[]>(() => {
    const saved = localStorage.getItem('mg_categorias');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIAS;
  });

  const [marcas, setMarcas] = useState<Marca[]>(() => {
    const saved = localStorage.getItem('mg_marcas');
    return saved ? JSON.parse(saved) : INITIAL_MARCAS;
  });

  const [productos, setProductos] = useState<Producto[]>(() => {
    const saved = localStorage.getItem('mg_productos');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTOS;
  });

  const [clientes, setClientes] = useState<Cliente[]>(() => {
    const saved = localStorage.getItem('mg_clientes');
    return saved ? JSON.parse(saved) : INITIAL_CLIENTES;
  });

  const [comprobantes, setComprobantes] = useState<Comprobante[]>(() => {
    const saved = localStorage.getItem('mg_comprobantes');
    return saved ? JSON.parse(saved) : INITIAL_COMPROBANTES;
  });

  // Current session
  const [currentUser, setCurrentUser] = useState<Usuario | null>(() => {
    const saved = localStorage.getItem('mg_current_user');
    return saved ? JSON.parse(saved) : INITIAL_USUARIOS[0];
  });

  // View Navigation
  const [activeView, setActiveView] = useState<string>('ventas');
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Notifications
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceModalInitialType, setInvoiceModalInitialType] = useState<'FACTURA' | 'BOLETA'>('FACTURA');
  const [selectedInvoiceForDetail, setSelectedInvoiceForDetail] = useState<Comprobante | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('mg_empresa', JSON.stringify(empresa));
  }, [empresa]);

  useEffect(() => {
    localStorage.setItem('mg_sucursales', JSON.stringify(sucursales));
  }, [sucursales]);

  useEffect(() => {
    localStorage.setItem('mg_usuarios', JSON.stringify(usuarios));
  }, [usuarios]);

  useEffect(() => {
    localStorage.setItem('mg_categorias', JSON.stringify(categorias));
  }, [categorias]);

  useEffect(() => {
    localStorage.setItem('mg_marcas', JSON.stringify(marcas));
  }, [marcas]);

  useEffect(() => {
    localStorage.setItem('mg_productos', JSON.stringify(productos));
  }, [productos]);

  useEffect(() => {
    localStorage.setItem('mg_clientes', JSON.stringify(clientes));
  }, [clientes]);

  useEffect(() => {
    localStorage.setItem('mg_comprobantes', JSON.stringify(comprobantes));
  }, [comprobantes]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('mg_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('mg_current_user');
    }
  }, [currentUser]);

  // Toast Helper
  const showToast = (
    title: string,
    message?: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info'
  ) => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title,
      message,
      type,
    };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Handlers
  const handleLoginSuccess = (user: Usuario) => {
    setCurrentUser(user);
    showToast('Bienvenido al Sistema', `Sesión iniciada como ${user.nombreCompleto} (${user.rol}).`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showToast('Sesión Finalizada', 'Ha cerrado sesión en el sistema ERP de forma segura.', 'info');
  };

  // Product Actions
  const handleSaveProducto = (prod: Producto) => {
    setProductos((prev) => {
      const exists = prev.find((p) => p.id === prod.id);
      if (exists) {
        return prev.map((p) => (p.id === prod.id ? prod : p));
      }
      return [prod, ...prev];
    });
  };

  const handleToggleProductStatus = (id: number) => {
    setProductos((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, estado: p.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO' } : p
      )
    );
  };

  const handleDeleteProducto = (id: number) => {
    setProductos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, estado: 'INACTIVO' } : p))
    );
  };

  // Client Actions
  const handleSaveCliente = (cli: Cliente) => {
    setClientes((prev) => {
      const exists = prev.find((c) => c.id === cli.id);
      if (exists) {
        return prev.map((c) => (c.id === cli.id ? cli : c));
      }
      return [cli, ...prev];
    });
  };

  const handleToggleClienteStatus = (id: number) => {
    setClientes((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, estado: c.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO' } : c
      )
    );
  };

  // User Actions
  const handleSaveUsuario = (user: Usuario) => {
    setUsuarios((prev) => {
      const exists = prev.find((u) => u.id === user.id);
      if (exists) {
        return prev.map((u) => (u.id === user.id ? user : u));
      }
      return [user, ...prev];
    });
  };

  const handleToggleUsuarioStatus = (id: number) => {
    setUsuarios((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, estado: u.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO' } : u
      )
    );
  };

  // Category Actions
  const handleSaveCategoria = (cat: Categoria) => {
    setCategorias((prev) => {
      const exists = prev.find((c) => c.id === cat.id);
      if (exists) {
        return prev.map((c) => (c.id === cat.id ? cat : c));
      }
      return [...prev, cat];
    });
  };

  const handleToggleCategoriaStatus = (id: number) => {
    setCategorias((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, estado: c.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO' } : c
      )
    );
  };

  // Brand Actions
  const handleSaveMarca = (marca: Marca) => {
    setMarcas((prev) => {
      const exists = prev.find((m) => m.id === marca.id);
      if (exists) {
        return prev.map((m) => (m.id === marca.id ? marca : m));
      }
      return [...prev, marca];
    });
  };

  const handleToggleMarcaStatus = (id: number) => {
    setMarcas((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, estado: m.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO' } : m
      )
    );
  };

  // Invoice Actions
  const handleOpenNewInvoice = (type: 'FACTURA' | 'BOLETA' = 'FACTURA') => {
    setInvoiceModalInitialType(type);
    setIsInvoiceModalOpen(true);
  };

  const handleEmitInvoice = (newComp: Comprobante) => {
    setComprobantes((prev) => [newComp, ...prev]);
  };

  if (!currentUser) {
    return (
      <div className="font-sans antialiased text-[#0B1C30]">
        <LoginScreen usuarios={usuarios} onLoginSuccess={handleLoginSuccess} />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FF] font-sans antialiased flex flex-col">
      {/* Top Navigation Bar */}
      <TopNavBar
        currentUser={currentUser}
        onLogout={handleLogout}
        onToggleSidebar={() => setSidebarOpenMobile(!sidebarOpenMobile)}
        activeView={activeView}
        setActiveView={setActiveView}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sunatConnected={empresa.estadoSunat === 'CONECTADO'}
      />

      {/* Main Layout Area */}
      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
        <SideNavBar
          activeView={activeView}
          setActiveView={setActiveView}
          isOpenMobile={sidebarOpenMobile}
          onCloseMobile={() => setSidebarOpenMobile(false)}
        />

        {/* View Switcher Container */}
        <main className="flex-1 flex flex-col md:pl-[260px] transition-all min-h-[calc(100vh-4rem)]">
          {activeView === 'ventas' && (
            <DashboardView
              comprobantes={comprobantes}
              empresa={empresa}
              onOpenNewInvoice={handleOpenNewInvoice}
              onViewInvoiceDetail={(comp) => setSelectedInvoiceForDetail(comp)}
              setActiveView={setActiveView}
            />
          )}

          {activeView === 'productos' && (
            <ProductsView
              productos={productos}
              categorias={categorias}
              marcas={marcas}
              onSaveProducto={handleSaveProducto}
              onToggleStatus={handleToggleProductStatus}
              onDeleteProducto={handleDeleteProducto}
              onShowToast={showToast}
            />
          )}

          {activeView === 'categorias' && (
            <CategoriesView
              categorias={categorias}
              onSaveCategoria={handleSaveCategoria}
              onToggleEstado={handleToggleCategoriaStatus}
              onShowToast={showToast}
            />
          )}

          {activeView === 'marcas' && (
            <BrandsView
              marcas={marcas}
              onSaveMarca={handleSaveMarca}
              onToggleEstado={handleToggleMarcaStatus}
              onShowToast={showToast}
            />
          )}

          {(activeView === 'config-empresa' || activeView === 'sucursales') && (
            <CompanySettingsView
              empresa={empresa}
              sucursales={sucursales}
              onSaveEmpresa={(updated) => setEmpresa(updated)}
              onSaveSucursal={(suc) =>
                setSucursales((prev) => prev.map((s) => (s.id === suc.id ? suc : s)))
              }
              onShowToast={showToast}
              setActiveView={setActiveView}
            />
          )}

          {activeView === 'usuarios' && (
            <UsersManagementView
              usuarios={usuarios}
              onSaveUsuario={handleSaveUsuario}
              onToggleUsuarioEstado={handleToggleUsuarioStatus}
              onShowToast={showToast}
            />
          )}

          {activeView === 'clientes' && (
            <ClientsManagementView
              clientes={clientes}
              onSaveCliente={handleSaveCliente}
              onToggleClienteEstado={handleToggleClienteStatus}
              onShowToast={showToast}
            />
          )}

          {/* Placeholders for ancillary ERP modules with quick action to return */}
          {['logistica', 'compras', 'cpe-sunat', 'cuentas', 'caja-bancos', 'contabilidad', 'reportes'].includes(
            activeView
          ) && (
            <div className="flex-1 p-8 max-w-5xl mx-auto w-full flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#EFF4FF] text-[#00346F] flex items-center justify-center mb-4 shadow-sm">
                <span className="text-2xl font-bold uppercase">{activeView.slice(0, 2)}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-800 capitalize mb-2">
                Módulo de {activeView.replace('-', ' ')}
              </h2>
              <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
                Módulo empresarial integrado al sistema ERP de MG SOLUTIONS GROUP S.A.C. Todas las operaciones verifican el estado activo de usuarios, clientes y productos.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setActiveView('ventas')}
                  className="px-4 py-2 bg-[#00346F] text-white text-xs font-semibold rounded-lg hover:bg-[#004A99] shadow"
                >
                  Ir al Panel de Ventas
                </button>
                <button
                  onClick={() => setActiveView('productos')}
                  className="px-4 py-2 bg-white border border-slate-300 text-[#00346F] text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Ver Productos
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Invoice Emission Modal */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        clientes={clientes}
        productos={productos}
        initialType={invoiceModalInitialType}
        onEmitInvoice={handleEmitInvoice}
        onShowToast={showToast}
      />

      {/* Invoice Detail / PDF Modal */}
      <InvoiceDetailModal
        comprobante={selectedInvoiceForDetail}
        empresa={empresa}
        onClose={() => setSelectedInvoiceForDetail(null)}
        onShowToast={showToast}
      />

      {/* Toast Notification Queue */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
export default App;
