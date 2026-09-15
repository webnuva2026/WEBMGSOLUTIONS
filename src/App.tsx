import React, { useState, useEffect } from 'react';
import {
  INITIAL_EMPRESA,
  INITIAL_SUCURSALES,
  INITIAL_USUARIOS,
  INITIAL_CATEGORIAS,
  INITIAL_MARCAS,
  INITIAL_PRODUCTOS,
  INITIAL_CLIENTES,
  INITIAL_ORDENES_SERVICIO,
  INITIAL_VENTAS,
} from './data/initialData';
import {
  Usuario,
  Cliente,
  Categoria,
  Marca,
  Producto,
  EmpresaConfig,
  Sucursal,
  MovimientoInventario,
  Equipo,
  Venta,
} from './types';
import { TopNavBar } from './components/TopNavBar';
import { SideNavBar } from './components/SideNavBar';
import { LoginScreen } from './components/LoginScreen';
import { OperationsDashboardView } from './components/OperationsDashboardView';
import { SalesPOSView } from './components/SalesPOSView';
import { ProductsView } from './components/ProductsView';
import { CompanySettingsView } from './components/CompanySettingsView';
import { UsersManagementView } from './components/UsersManagementView';
import { ClientsManagementView } from './components/ClientsManagementView';
import { CategoriesView } from './components/CategoriesView';
import { BrandsView } from './components/BrandsView';
import { ToastContainer, ToastMessage } from './components/Toast';
import { ServiceTrackingView } from './components/ServiceTrackingView';
import { TechnicalWorkshopView } from './components/TechnicalWorkshopView';
import { InventoryTransfersView } from './components/InventoryTransfersView';
import { EquipmentManagementView } from './components/EquipmentManagementView';
import { ReceptionDashboardView } from './components/ReceptionDashboardView';
import { WarehouseDashboardView } from './components/WarehouseDashboardView';

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
    if (!saved) return INITIAL_USUARIOS;
    const allowedModules = new Set([
      'ventas',
      'panel-recepcion',
      'panel-almacen',
      'taller',
      'clientes',
      'productos',
      'categorias',
      'marcas',
      'usuarios',
      'config-empresa',
      'sucursales',
      'movimientos',
      'equipos',
    ]);
    return JSON.parse(saved).map((user: Usuario) => {
      const modules = user.modulosPermitidos.filter((moduleId) => allowedModules.has(moduleId));
      const rolePanel = user.rol === 'SECRETARIA' ? 'panel-recepcion' : user.rol === 'ALMACEN' ? 'panel-almacen' : null;
      if (user.rol === 'ALMACEN' && !modules.includes('movimientos')) modules.push('movimientos');
      if (user.rol === 'ADMIN' && !modules.includes('movimientos')) modules.push('movimientos');
      return {
        ...user,
        modulosPermitidos: rolePanel && !modules.includes(rolePanel) ? [rolePanel, ...modules] : modules,
      };
    });
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
    const source = saved ? JSON.parse(saved) : INITIAL_PRODUCTOS;
    return source.map((product: Producto) => ({
      ...product,
      stockPorSede: product.stockPorSede || { [product.sucursal]: product.stock },
    }));
  });

  const [clientes, setClientes] = useState<Cliente[]>(() => {
    const saved = localStorage.getItem('mg_clientes');
    return saved ? JSON.parse(saved) : INITIAL_CLIENTES;
  });

  const [ordenes, setOrdenes] = useState(() => {
    const saved = localStorage.getItem('mg_ordenes_servicio');
    return saved ? JSON.parse(saved) : INITIAL_ORDENES_SERVICIO;
  });
  const [equipos, setEquipos] = useState<Equipo[]>(() => {
    const saved = localStorage.getItem('mg_equipos');
    if (saved) return JSON.parse(saved);
    return INITIAL_ORDENES_SERVICIO.map((order) => ({
      id: order.id,
      clienteId: order.clienteId,
      tipo: order.tipoEquipo,
      marca: order.marca,
      modelo: order.modelo,
      numeroSerie: order.numeroSerie,
      accesorios: order.accesoriosDejados,
      estado: order.estado === 'ENTREGADO_COBRADO' ? 'ENTREGADO' : 'EN_SERVICIO',
      fechaRegistro: order.fechaIngreso,
    }));
  });
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>(() => {
    const saved = localStorage.getItem('mg_movimientos_inventario');
    return saved ? JSON.parse(saved) : [];
  });
  const [ventas, setVentas] = useState<Venta[]>(() => {
    const saved = localStorage.getItem('mg_ventas');
    return saved ? JSON.parse(saved) : INITIAL_VENTAS;
  });

  // Current session
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [isWorkerAccess, setIsWorkerAccess] = useState(false);

  // View Navigation
  const [activeView, setActiveView] = useState<string>('ventas');
  const [serviceClientId, setServiceClientId] = useState<number | undefined>();
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('mg_ventas', JSON.stringify(ventas));
  }, [ventas]);

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
    localStorage.setItem('mg_ordenes_servicio', JSON.stringify(ordenes));
  }, [ordenes]);

  useEffect(() => {
    localStorage.setItem('mg_equipos', JSON.stringify(equipos));
  }, [equipos]);

  useEffect(() => {
    localStorage.setItem('mg_movimientos_inventario', JSON.stringify(movimientos));
  }, [movimientos]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('mg_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('mg_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && currentUser.rol !== 'ADMIN' && !currentUser.modulosPermitidos.includes(activeView)) {
      setActiveView(currentUser.modulosPermitidos[0] || 'ventas');
    }
  }, [activeView, currentUser]);

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
    setActiveView(
      user.rol === 'TECNICO'
        ? 'taller'
        : user.rol === 'SECRETARIA'
        ? 'panel-recepcion'
        : user.rol === 'ALMACEN'
        ? 'panel-almacen'
        : 'ventas'
    );
    setIsWorkerAccess(false);
    showToast('Bienvenido al Sistema', `Sesión iniciada como ${user.nombreCompleto} (${user.rol}).`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveView('ventas');
    setIsWorkerAccess(false);
    showToast('Sesión Finalizada', 'Ha cerrado sesión en el sistema ERP de forma segura.', 'info');
  };

  const handleSaveOrden = (orden: typeof INITIAL_ORDENES_SERVICIO[number]) => {
    setOrdenes((prev) => {
      const exists = prev.find((item) => item.id === orden.id);
      return exists ? prev.map((item) => (item.id === orden.id ? orden : item)) : [orden, ...prev];
    });
    setEquipos((previous) => {
      const equipment: Equipo = {
        id: orden.id,
        clienteId: orden.clienteId,
        tipo: orden.tipoEquipo,
        marca: orden.marca,
        modelo: orden.modelo,
        numeroSerie: orden.numeroSerie,
        accesorios: orden.accesoriosDejados,
        estado: orden.estado === 'ENTREGADO_COBRADO' ? 'ENTREGADO' : orden.estado === 'LISTO_ENTREGA' ? 'LISTO_ENTREGA' : 'EN_SERVICIO',
        fechaRegistro: orden.fechaIngreso,
      };
      const exists = previous.some((item) => item.id === equipment.id);
      return exists ? previous.map((item) => item.id === equipment.id ? equipment : item) : [equipment, ...previous];
    });
  };

  const handleOpenServices = (clientId?: number) => {
    setServiceClientId(clientId);
    setActiveView('taller');
  };

  const handleSaveMovimiento = (movimiento: MovimientoInventario) => {
    setMovimientos((previous) => [movimiento, ...previous]);
  };

  const handleUpdateMovimiento = (movimiento: MovimientoInventario) => {
    setMovimientos((previous) => {
      const previousMovement = previous.find((item) => item.id === movimiento.id);
      if (previousMovement && previousMovement.estado !== 'RECIBIDO' && movimiento.estado === 'RECIBIDO') {
        updateProductBranchStock(previousMovement.productoId, previousMovement.sedeOrigen, -previousMovement.cantidad);
        updateProductBranchStock(previousMovement.productoId, previousMovement.sedeDestino, previousMovement.cantidad);
      }
      if (previousMovement?.estado === 'RECIBIDO' && movimiento.estado !== 'RECIBIDO') {
        updateProductBranchStock(previousMovement.productoId, previousMovement.sedeOrigen, previousMovement.cantidad);
        updateProductBranchStock(previousMovement.productoId, previousMovement.sedeDestino, -previousMovement.cantidad);
      }
      return previous.map((item) => item.id === movimiento.id ? movimiento : item);
    });
  };

  const updateProductBranchStock = (productoId: number, branch: string, delta: number) => {
    setProductos((previous) => previous.map((product) => {
      if (product.id !== productoId) return product;
      const branchStock: Record<string, number> = { ...(product.stockPorSede || { [product.sucursal]: product.stock }) };
      branchStock[branch] = Math.max(0, (branchStock[branch] || 0) + delta);
      return { ...product, stockPorSede: branchStock, stock: Object.values(branchStock).reduce((total, value) => total + value, 0) };
    }));
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

  const handleUpdateProductoStock = (productoId: number, delta: number) => {
    setProductos((previous) => previous.map((producto) => {
      if (producto.id !== productoId) return producto;
      const branchStock: Record<string, number> = { ...(producto.stockPorSede || { [producto.sucursal]: producto.stock }) };
      // El taller opera desde la sede principal
      const sedePrincipal = Object.keys(branchStock)[0] || producto.sucursal || 'Principal';
      branchStock[sedePrincipal] = Math.max(0, (branchStock[sedePrincipal] || 0) + delta);
      const nuevoStockTotal = Object.values(branchStock).reduce((total, value) => total + value, 0);
      return { ...producto, stock: nuevoStockTotal, stockPorSede: branchStock };
    }));
  };

  const handleDeleteProducto = (id: number) => {
    setProductos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, estado: 'INACTIVO' } : p))
    );
  };

  // Sales Actions
  const handleSaveVenta = (newVenta: Venta) => {
    setVentas((prev) => [newVenta, ...prev]);
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

  if (!currentUser) {
    return (
      <div className="font-sans antialiased text-[#0B1C30]">
        {isWorkerAccess ? (
          <LoginScreen
            usuarios={usuarios}
            onLoginSuccess={handleLoginSuccess}
            onBackToClient={() => setIsWorkerAccess(false)}
          />
        ) : (
          <ServiceTrackingView ordenes={ordenes} onWorkerAccess={() => setIsWorkerAccess(true)} />
        )}
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
        ordenes={ordenes}
        productos={productos}
        clientes={clientes}
      />

      {/* Main Layout Area */}
      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
        <SideNavBar
          activeView={activeView}
          setActiveView={setActiveView}
          isOpenMobile={sidebarOpenMobile}
          onCloseMobile={() => setSidebarOpenMobile(false)}
          currentUser={currentUser}
        />

        {/* View Switcher Container */}
        <main className="flex-1 flex flex-col md:pl-[260px] transition-all min-h-[calc(100vh-4rem)]">
          {activeView === 'ventas' && (
            <SalesPOSView
              currentUser={currentUser}
              productos={productos}
              clientes={clientes}
              sucursales={sucursales}
              empresa={empresa}
              ventas={ventas}
              onSaveVenta={handleSaveVenta}
              onUpdateProductoStock={handleUpdateProductoStock}
              onSaveCliente={handleSaveCliente}
              onShowToast={showToast}
              setActiveView={setActiveView}
            />
          )}

          {activeView === 'dashboard' && (
            <OperationsDashboardView
              currentUser={currentUser}
              ordenes={ordenes}
              productos={productos}
              clientes={clientes}
              setActiveView={setActiveView}
            />
          )}

          {activeView === 'panel-recepcion' && (
            <ReceptionDashboardView
              currentUser={currentUser}
              ordenes={ordenes}
              equipos={equipos}
              clientes={clientes}
              setActiveView={setActiveView}
              onOpenServices={handleOpenServices}
            />
          )}

          {activeView === 'panel-almacen' && (
            <WarehouseDashboardView
              currentUser={currentUser}
              productos={productos}
              movimientos={movimientos}
              sucursales={sucursales}
              setActiveView={setActiveView}
            />
          )}

          {activeView === 'taller' && currentUser && (
            <TechnicalWorkshopView
              ordenes={ordenes}
              usuarios={usuarios}
              clientes={clientes}
              productos={productos}
              marcas={marcas}
              equipos={equipos}
              currentUser={currentUser}
              onSaveOrden={handleSaveOrden}
              onUpdateProductoStock={handleUpdateProductoStock}
              onShowToast={showToast}
              onSaveCliente={handleSaveCliente}
              preselectedClientId={serviceClientId}
              onClearPreselectedClient={() => setServiceClientId(undefined)}
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
              readOnly={currentUser.rol === 'TECNICO' || currentUser.rol === 'SECRETARIA'}
            />
          )}

          {activeView === 'equipos' && (
            <EquipmentManagementView
              equipos={equipos}
              clientes={clientes}
              ordenes={ordenes}
              onOpenService={handleOpenServices}
            />
          )}

          {activeView === 'movimientos' && (
            <InventoryTransfersView
              productos={productos}
              sucursales={sucursales}
              movimientos={movimientos}
              onSaveMovimiento={handleSaveMovimiento}
              onUpdateMovimiento={handleUpdateMovimiento}
              onShowToast={showToast}
              currentUserName={currentUser.nombreCompleto}
              currentUserRole={currentUser.rol}
            />
          )}

          {activeView === 'categorias' && (
            <CategoriesView
              categorias={categorias}
              onSaveCategoria={handleSaveCategoria}
              onToggleEstado={handleToggleCategoriaStatus}
              onShowToast={showToast}
              readOnly={currentUser.rol !== 'ADMIN' && currentUser.rol !== 'ALMACEN'}
            />
          )}

          {activeView === 'marcas' && (
            <BrandsView
              marcas={marcas}
              onSaveMarca={handleSaveMarca}
              onToggleEstado={handleToggleMarcaStatus}
              onShowToast={showToast}
              readOnly={currentUser.rol !== 'ADMIN' && currentUser.rol !== 'ALMACEN'}
            />
          )}

          {(activeView === 'config-empresa' || activeView === 'sucursales') && (
            <CompanySettingsView
              empresa={empresa}
              sucursales={sucursales}
              onSaveEmpresa={(updated) => setEmpresa(updated)}
              onSaveSucursal={(suc) =>
                setSucursales((prev) => {
                  const exists = prev.find((s) => s.id === suc.id);
                  return exists ? prev.map((s) => (s.id === suc.id ? suc : s)) : [...prev, suc];
                })
              }
              onToggleSucursalEstado={(id) =>
                setSucursales((prev) =>
                  prev.map((s) =>
                    s.id === id ? { ...s, estado: s.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO' } : s
                  )
                )
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
              ordenes={ordenes}
              equipos={equipos}
              currentUser={currentUser}
              onSaveCliente={handleSaveCliente}
              onToggleClienteEstado={handleToggleClienteStatus}
              onShowToast={showToast}
              onGoToServices={handleOpenServices}
            />
          )}


        </main>
      </div>

      {/* Toast Notification Queue */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
export default App;
