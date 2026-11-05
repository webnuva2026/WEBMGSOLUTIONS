import React, { useState, useEffect } from 'react';
import {
  INITIAL_EMPRESA,
  INITIAL_SUCURSALES,
  INITIAL_USUARIOS,
  INITIAL_CATEGORIAS,
  INITIAL_MARCAS,
  INITIAL_PRODUCTOS,
  INITIAL_ORDENES_SERVICIO,
  INITIAL_VENTAS,
  INITIAL_PROVEEDORES,
  INITIAL_COMPRAS,
  INITIAL_CAJA_TURNOS,
  INITIAL_MOVIMIENTOS_CAJA,
} from './data/initialData';
import { clientService } from './services/client.service';
import { warehouseService } from './services/warehouse.service';
import { categoryService } from './services/category.service';
import { brandModelService } from './services/brandModel.service';
import {
  Usuario,
  Cliente,
  Categoria,
  Marca,
  Producto,
  EmpresaConfig,
  Sucursal,
  MovimientoInventario,
  EstadoMovimientoInventario,
  Equipo,
  OrdenServicio,
  Venta,
  Proveedor,
  Compra,
  CajaTurno,
  MovimientoCaja,
} from './types';
import { TopNavBar } from './components/TopNavBar';
import { SideNavBar } from './components/SideNavBar';
import { LoginScreen } from './components/LoginScreen';
import { OperationsDashboardView } from './components/OperationsDashboardView';
import { SalesPOSView } from './components/SalesPOSView';
import { CompanySettingsView } from './components/CompanySettingsView';
import { UsersManagementView } from './components/UsersManagementView';
import { ClientsManagementView } from './components/ClientsManagementView';
import { CategoriesView } from './components/CategoriesView';
import { BrandsView } from './components/BrandsView';
import { CatalogMasterView } from './components/CatalogMasterView';
import { ToastContainer, ToastMessage } from './components/Toast';
import { SessionTimeoutGuard } from './components/SessionTimeoutGuard';
import { ServiceTrackingView } from './components/ServiceTrackingView';
import { TechnicalWorkshopView } from './components/TechnicalWorkshopView';
import { InventoryTransfersView } from './components/InventoryTransfersView';
import { EquipmentManagementView } from './components/EquipmentManagementView';
import { ReceptionDashboardView } from './components/ReceptionDashboardView';
import { WarehouseDashboardView } from './components/WarehouseDashboardView';
import { PurchasesView } from './components/PurchasesView';
import { CashRegisterView } from './components/CashRegisterView';
import { ForceChangePasswordModal } from './components/ForceChangePasswordModal';
import { authService } from './services/auth.service';
import { companyService } from './services/company.service';
import { userService } from './services/user.service';
import { workshopService } from './services/workshop.service';
import { transferService } from './services/transfer.service';
import { purchaseService } from './services/purchase.service';

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
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && !parsed.some((u: any) => u.username === 'kevin' || u.nombreCompleto?.includes('Santisteban') || u.username === 'guadalupe')) {
        return parsed;
      }
    } catch {
      // fallback
    }
    return [];
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
    const source = saved ? JSON.parse(saved) : [];
    return source.map((product: Producto) => ({
      ...product,
      stockPorSede: product.stockPorSede || { [product.sucursal]: product.stock },
    }));
  });

  const [clientes, setClientes] = useState<Cliente[]>(() => {
    const saved = localStorage.getItem('mg_clientes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && !parsed.some((c: any) => c.razonSocial?.includes('MINERA DEL SUR'))) {
          return parsed;
        }
      } catch {
        // fallback
      }
    }
    return [];
  });

  const [total, setTotal] = useState(0);

  // Multi-sede selection state (null = Todas las Sedes / Consolidado)
  const [selectedSedeId, setSelectedSedeId] = useState<number | null>(() => {
    const saved = localStorage.getItem('mg_selected_sede_id');
    return saved && saved !== 'ALL' ? Number(saved) : null;
  });

  const handleSelectSede = (sedeId: number | null) => {
    setSelectedSedeId(sedeId);
    if (sedeId) {
      localStorage.setItem('mg_selected_sede_id', String(sedeId));
    } else {
      localStorage.setItem('mg_selected_sede_id', 'ALL');
    }
  };

  const loadDatabaseData = (sedeFilter: number | null = selectedSedeId) => {
    clientService.getClients({ limit: 100 }).then((res) => {
      if (res.success && res.data) {
        setClientes(res.data);
        setTotal(res.pagination.total);
        localStorage.setItem('mg_clientes', JSON.stringify(res.data));
      }
    });

    // Cargar inventario desde MySQL filtrado por sede
    warehouseService.getInventario({ sucursal_id: sedeFilter }).then((res) => {
      if (res.success && res.inventario) {
        if (res.inventario.length === 0) {
          setProductos([]);
          localStorage.setItem('mg_productos', JSON.stringify([]));
        } else {
          const mappedProds: Producto[] = res.inventario.map((item) => {
            const branchRecord: Record<string, number> = {};
            if (item.stockPorSede) {
              item.stockPorSede.forEach((s) => {
                branchRecord[s.sucursalNombre || 'Principal'] = s.stock;
              });
            }

            const realAvailableStock = Math.max(
              Number(item.stockTotal) || 0,
              Number(item.seriesMetricas?.disponibles) || 0
            );

            return {
              id: item.id,
              codigo: item.codigo,
              codigoBarra: item.codigo,
              nombre: item.nombre,
              categoriaId: item.categoria?.id || 1,
              categoriaNombre: item.categoria?.nombre || 'General',
              marcaId: item.marca?.id || 1,
              marcaNombre: item.marca?.nombre || 'General',
              modeloId: item.modelo?.id || null,
              modeloNombre: item.modelo?.nombre || null,
              sucursal: item.stockPorSede?.[0]?.sucursalNombre || 'Principal - Chiclayo Centro',
              precioUnitario: item.precioVenta || 0,
              precioCosto: item.precioCosto || 0,
              stock: sedeFilter && (item.stockSede ?? 0) > 0 ? (item.stockSede ?? realAvailableStock) : realAvailableStock,
              stockPorSede: branchRecord,
              unidadMedida: 'NIU',
              estado: (item.estado as any) || 'ACTIVO',
              requiereSerie: item.requiereSerie || item.categoria?.requiereSerie || false,
              disponibleVenta: item.disponibleVenta !== false,
              tipoDestino: item.tipoDestino || 'VENTA',
            };
          });
          setProductos(mappedProds);
          localStorage.setItem('mg_productos', JSON.stringify(mappedProds));
        }
      }
    });

    // Cargar datos de Empresa y Sucursales desde MySQL
    companyService.getEmpresa().then((res) => {
      if (res.success && res.empresa) {
        setEmpresa(res.empresa);
      }
    });

    companyService.getSucursales().then((res) => {
      if (res.success && res.sucursales) {
        setSucursales(res.sucursales);
        localStorage.setItem('mg_sucursales', JSON.stringify(res.sucursales));
        if (sedeFilter) {
          const isStillActive = res.sucursales.some(
            (s) => s.id === sedeFilter && s.estado === 'ACTIVO'
          );
          if (!isStillActive) {
            handleSelectSede(null);
          }
        }
      }
    });

    // Cargar usuarios reales desde MySQL
    userService.getUsers().then((res) => {
      if (res.success && res.usuarios) {
        setUsuarios(res.usuarios);
        localStorage.setItem('mg_usuarios', JSON.stringify(res.usuarios));
      }
    });

    // Cargar órdenes de servicio reales desde MySQL filtradas por sede
    workshopService.getOrdenes({ sucursal_id: sedeFilter }).then((res) => {
      if (res.success && Array.isArray(res.ordenes)) {
        setOrdenes(res.ordenes);
        localStorage.setItem('mg_ordenes_servicio', JSON.stringify(res.ordenes));
      }
    });

    // Cargar movimientos y préstamos de inventario reales desde MySQL
    transferService.getMovimientos().then((res) => {
      if (res.success && Array.isArray(res.movimientos)) {
        setMovimientos(res.movimientos);
        localStorage.setItem('mg_movimientos_inventario', JSON.stringify(res.movimientos));
      }
    });

    // Cargar proveedores reales desde MySQL
    purchaseService.getProveedores().then((res) => {
      if (res.success && Array.isArray(res.proveedores)) {
        setProveedores(res.proveedores);
        localStorage.setItem('mg_proveedores', JSON.stringify(res.proveedores));
      }
    });

    // Cargar compras y reabastecimiento reales desde MySQL
    purchaseService.getCompras().then((res) => {
      if (res.success && Array.isArray(res.compras)) {
        setCompras(res.compras);
        localStorage.setItem('mg_compras', JSON.stringify(res.compras));
      }
    });

    // Cargar categorías reales desde MySQL
    categoryService.getCategorias().then((res) => {
      if (res.success && res.categorias && res.categorias.length > 0) {
        setCategorias(res.categorias);
        localStorage.setItem('mg_categorias', JSON.stringify(res.categorias));
      }
    });

    // Cargar marcas reales desde MySQL
    brandModelService.getMarcas().then((res) => {
      if (res.success && res.marcas && res.marcas.length > 0) {
        setMarcas(res.marcas);
        localStorage.setItem('mg_marcas', JSON.stringify(res.marcas));
      }
    });
  };

  useEffect(() => {
    loadDatabaseData(selectedSedeId);
  }, [selectedSedeId]);

  const [ordenes, setOrdenes] = useState<OrdenServicio[]>(() => {
    const saved = localStorage.getItem('mg_ordenes_servicio');
    return saved ? JSON.parse(saved) : [];
  });
  const [equipos, setEquipos] = useState<Equipo[]>(() => {
    const saved = localStorage.getItem('mg_equipos');
    return saved ? JSON.parse(saved) : [];
  });
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>(() => {
    const saved = localStorage.getItem('mg_movimientos_inventario');
    return saved ? JSON.parse(saved) : [];
  });
  const [ventas, setVentas] = useState<Venta[]>(() => {
    const saved = localStorage.getItem('mg_ventas');
    return saved ? JSON.parse(saved) : [];
  });

  const [proveedores, setProveedores] = useState<Proveedor[]>(() => {
    const saved = localStorage.getItem('mg_proveedores');
    return saved ? JSON.parse(saved) : [];
  });

  const [compras, setCompras] = useState<Compra[]>(() => {
    const saved = localStorage.getItem('mg_compras');
    return saved ? JSON.parse(saved) : [];
  });

  const [cajasTurnos, setCajasTurnos] = useState<CajaTurno[]>(() => {
    const saved = localStorage.getItem('mg_cajas_turnos');
    return saved ? JSON.parse(saved) : [];
  });

  // Limpiar cachés viejos de localStorage para sincronizar estrictamente con la base de datos real
  useEffect(() => {
    const legacyPurged = localStorage.getItem('mg_legacy_purged_v5');
    if (!legacyPurged) {
      localStorage.removeItem('mg_productos');
      localStorage.removeItem('mg_ordenes_servicio');
      localStorage.removeItem('mg_equipos');
      localStorage.removeItem('mg_ventas');
      localStorage.removeItem('mg_compras');
      localStorage.removeItem('mg_proveedores');
      localStorage.removeItem('mg_clientes');
      localStorage.removeItem('mg_cajas_turnos');
      localStorage.removeItem('mg_movimientos_caja');
      localStorage.removeItem('mg_movimientos_inventario');
      localStorage.setItem('mg_legacy_purged_v5', 'true');
      setProductos([]);
      setOrdenes([]);
      setEquipos([]);
      setVentas([]);
      setCompras([]);
      setProveedores([]);
      setClientes([]);
      setCajasTurnos([]);
    }
  }, []);

  const [movimientosCaja, setMovimientosCaja] = useState<MovimientoCaja[]>(() => {
    const saved = localStorage.getItem('mg_movimientos_caja');
    return saved ? JSON.parse(saved) : INITIAL_MOVIMIENTOS_CAJA;
  });

  // Current session
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [isWorkerAccess, setIsWorkerAccess] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showForceChangePassword, setShowForceChangePassword] = useState(false);

  // View Navigation
  const [activeView, setActiveView] = useState<string>('ventas');
  const [serviceClientId, setServiceClientId] = useState<number | undefined>();

  useEffect(() => {
    if (activeView === 'ventas' || activeView === 'panel-almacen' || activeView === 'productos') {
      loadDatabaseData(selectedSedeId);
    }
  }, [activeView]);
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (currentUser) {
      loadDatabaseData();
    }
  }, [activeView, currentUser]);

  // Modals & Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('mg_ventas', JSON.stringify(ventas));
  }, [ventas]);

  useEffect(() => {
    localStorage.setItem('mg_proveedores', JSON.stringify(proveedores));
  }, [proveedores]);

  useEffect(() => {
    localStorage.setItem('mg_compras', JSON.stringify(compras));
  }, [compras]);

  useEffect(() => {
    localStorage.setItem('mg_cajas_turnos', JSON.stringify(cajasTurnos));
  }, [cajasTurnos]);

  useEffect(() => {
    localStorage.setItem('mg_movimientos_caja', JSON.stringify(movimientosCaja));
  }, [movimientosCaja]);

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
      sessionStorage.setItem('mg_current_user', JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem('mg_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    if (
      currentUser &&
      currentUser.rol !== 'ADMIN' &&
      currentUser.rol !== 'SUPERADMIN' &&
      !currentUser.modulosPermitidos.includes(activeView)
    ) {
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

  // Validar sesión activa al cargar la app
  useEffect(() => {
    // Seguridad: eliminar sesiones persistentes antiguas (la sesión ahora vive solo mientras la pestaña esté abierta)
    localStorage.removeItem('mg_auth_token');
    localStorage.removeItem('mg_current_user');
    const token = authService.getToken();
    if (token) {
      authService.getProfile().then((res) => {
        if (res.success && res.user) {
          setCurrentUser(res.user);
          if (res.user.requiereCambioPassword) {
            setShowForceChangePassword(true);
          }
        }
      });
    }
  }, []);

  // Handlers
  const handleLoginSuccess = (user: Usuario) => {
    setCurrentUser(user);
    loadDatabaseData();
    // Si requiere cambio de contraseña, mostrar modal bloqueante
    if (user.requiereCambioPassword) {
      setShowForceChangePassword(true);
      return;
    }
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
    showToast('Bienvenido al Sistema', `Sesion iniciada como ${user.nombreCompleto} (${user.rol}).`, 'success');
  };

  const handleForceChangeSuccess = () => {
    setShowForceChangePassword(false);
    loadDatabaseData();
    if (currentUser) {
      const updatedUser = { ...currentUser, requiereCambioPassword: false };
      setCurrentUser(updatedUser);
      const rol = updatedUser.rol;
      setActiveView(
        rol === 'TECNICO'
          ? 'taller'
          : rol === 'SECRETARIA'
          ? 'panel-recepcion'
          : rol === 'ALMACEN'
          ? 'panel-almacen'
          : 'ventas'
      );
      setIsWorkerAccess(false);
      showToast('Contrasena actualizada', 'Su nueva contrasena ha sido guardada. Bienvenido al sistema.', 'success');
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    setActiveView('ventas');
    setIsWorkerAccess(false);
    setShowForceChangePassword(false);
    showToast('Sesión Finalizada', 'Ha cerrado sesión en el sistema ERP de forma segura.', 'info');
  };


  const handleSaveOrden = (orden: typeof INITIAL_ORDENES_SERVICIO[number]) => {
    setOrdenes((prev) => {
      const exists = prev.find((item) => item.id === orden.id);
      const updated = exists ? prev.map((item) => (item.id === orden.id ? orden : item)) : [orden, ...prev];
      try {
        localStorage.setItem('mg_ordenes_servicio', JSON.stringify(updated));
      } catch (err) {
        console.warn('Error saving to localStorage:', err);
      }
      return updated;
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

  const handleSaveMovimiento = async (data: any) => {
    setActionLoading(true);
    const res = await transferService.createMovimiento(data);
    setActionLoading(false);
    if (res.success) {
      showToast('Movimiento registrado', res.message || 'Solicitud registrada exitosamente.', 'success');
      loadDatabaseData();
    } else {
      showToast('Error', res.message || 'No se pudo registrar el movimiento.', 'error');
    }
  };

  const handleUpdateMovimiento = async (movimientoId: number, nuevoEstado: EstadoMovimientoInventario) => {
    setActionLoading(true);
    const res = await transferService.updateEstado(movimientoId, nuevoEstado, currentUser?.nombreCompleto || 'Usuario');
    setActionLoading(false);
    if (res.success) {
      showToast('Estado actualizado', res.message || `Movimiento actualizado a ${nuevoEstado}.`, 'success');
      loadDatabaseData();
    } else {
      showToast('Error', res.message || 'No se pudo actualizar el estado.', 'error');
    }
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
    // Recargar inventario y datos actualizados desde MySQL
    loadDatabaseData();

    // Also record in active cash register turn if open
    const openShift = cajasTurnos.find((c) => c.estado === 'ABIERTA');
    if (openShift) {
      const newMov: MovimientoCaja = {
        id: `caja-v-${Date.now()}`,
        cajaTurnoId: openShift.id,
        tipo: 'INGRESO',
        concepto: `Venta POS ${newVenta.tipoComprobante} ${newVenta.codigoComprobante}`,
        categoria: 'VENTA_POS',
        monto: newVenta.total,
        metodoPago: newVenta.metodoPago,
        fecha: newVenta.fecha,
        registradoPor: newVenta.vendedorNombre,
        referenciaCodigo: newVenta.codigoComprobante,
      };
      setMovimientosCaja((prev) => [newMov, ...prev]);
    }
  };

  // Purchases Actions
  const handleSaveCompra = async (newCompra: Compra) => {
    setActionLoading(true);
    const res = await purchaseService.createCompra({
      codigoComprobante: newCompra.codigoComprobante,
      proveedorId: newCompra.proveedorId,
      sucursalDestino: newCompra.sucursalDestino,
      compradorId: newCompra.compradorId,
      modoIngreso: newCompra.estado === 'SOLICITADO' ? 'SOLICITADO' : 'RECEPCION_DIRECTA',
      items: newCompra.items.map((it) => ({
        productoId: it.productoId,
        cantidad: it.cantidad,
        precioCostoUnitario: it.precioCostoUnitario,
        series: it.series || [],
      })),
      total: newCompra.total,
      observaciones: newCompra.observaciones,
    });
    setActionLoading(false);

    if (res.success) {
      showToast(
        newCompra.estado === 'SOLICITADO' ? 'Orden de Pedido Emitida' : 'Recepción Registrada',
        res.message || 'Operación logística guardada correctamente.',
        'success'
      );
      loadDatabaseData();
    } else {
      showToast('Error', res.message || 'No se pudo guardar el pedido en el servidor.', 'error');
    }
  };

  const handleAnularCompra = async (compraId: number) => {
    setActionLoading(true);
    const res = await purchaseService.anularCompra(compraId);
    setActionLoading(false);

    if (res.success) {
      showToast('Operación anulada', res.message || 'Registro actualizado correctamente.', 'info');
      loadDatabaseData();
    } else {
      showToast('Error', res.message || 'No se pudo anular el registro.', 'error');
    }
  };

  // Suppliers Actions
  const handleSaveProveedor = async (prov: Proveedor) => {
    setActionLoading(true);
    const isExisting = proveedores.some((p) => p.id === prov.id);
    const res = isExisting
      ? await purchaseService.updateProveedor(prov.id, {
          ruc: prov.ruc,
          razonSocial: prov.razonSocial,
          contacto: prov.contacto,
          telefono: prov.telefono,
          email: prov.email,
          direccion: prov.direccion,
        })
      : await purchaseService.createProveedor({
          ruc: prov.ruc,
          razonSocial: prov.razonSocial,
          contacto: prov.contacto,
          telefono: prov.telefono,
          email: prov.email,
          direccion: prov.direccion,
        });
    setActionLoading(false);

    if (res.success) {
      showToast(
        isExisting ? 'Proveedor actualizado' : 'Proveedor registrado',
        res.message || 'Proveedor guardado correctamente.',
        'success'
      );
      loadDatabaseData();
    } else {
      showToast('Error', res.message || 'No se pudo guardar el proveedor.', 'error');
    }
  };

  const handleToggleProveedorEstado = async (id: number) => {
    setActionLoading(true);
    const res = await purchaseService.toggleProveedorEstado(id);
    setActionLoading(false);

    if (res.success) {
      showToast('Estado de proveedor actualizado', res.message || 'Estado actualizado.', 'info');
      loadDatabaseData();
    } else {
      showToast('Error', res.message || 'No se pudo cambiar el estado.', 'error');
    }
  };

  // Cash Register Actions
  const handleAbrirCaja = (montoApertura: number, sucursal: string, observaciones?: string) => {
    const newTurno: CajaTurno = {
      id: Date.now(),
      sucursal,
      fechaApertura: new Date().toLocaleString('es-PE'),
      montoApertura,
      totalIngresosEfectivo: 0,
      totalIngresosDigital: 0,
      totalEgresos: 0,
      saldoEsperado: montoApertura,
      estado: 'ABIERTA',
      abiertaPor: currentUser?.nombreCompleto || 'Usuario',
      observaciones,
    };
    setCajasTurnos((prev) => [newTurno, ...prev]);
    showToast('Turno de Caja Abierto', `Fondo inicial registrado en S/ ${montoApertura.toFixed(2)}.`, 'success');
  };

  const handleCerrarCaja = (cajaId: number, montoEfectivoReal: number, observaciones?: string) => {
    setCajasTurnos((prev) =>
      prev.map((c) => {
        if (c.id !== cajaId) return c;
        const diff = montoEfectivoReal - c.saldoEsperado;
        return {
          ...c,
          fechaCierre: new Date().toLocaleString('es-PE'),
          montoCierreEfectivo: montoEfectivoReal,
          diferencia: diff,
          estado: 'CERRADA',
          cerradaPor: currentUser?.nombreCompleto || 'Usuario',
          observaciones: observaciones ? `${c.observaciones || ''} | Cierre: ${observaciones}` : c.observaciones,
        };
      })
    );
    showToast('Turno de Caja Cerrado', `Arqueo finalizado con S/ ${montoEfectivoReal.toFixed(2)}.`, 'info');
  };

  const handleRegistrarMovimientoCaja = (mov: Omit<MovimientoCaja, 'id' | 'cajaTurnoId' | 'fecha' | 'registradoPor'>) => {
    const openShift = cajasTurnos.find((c) => c.estado === 'ABIERTA');
    const newMov: MovimientoCaja = {
      ...mov,
      id: `mov-${Date.now()}`,
      cajaTurnoId: openShift ? openShift.id : 0,
      fecha: new Date().toLocaleString('es-PE'),
      registradoPor: currentUser?.nombreCompleto || 'Usuario',
    };
    setMovimientosCaja((prev) => [newMov, ...prev]);

    if (openShift) {
      setCajasTurnos((prev) =>
        prev.map((c) => {
          if (c.id !== openShift.id) return c;
          let incEfectivo = 0;
          let incDigital = 0;
          let incEgreso = 0;
          if (mov.tipo === 'INGRESO') {
            if (mov.metodoPago === 'EFECTIVO') incEfectivo = mov.monto;
            else incDigital = mov.monto;
          } else {
            incEgreso = mov.monto;
          }
          const nuevoEsperado = c.montoApertura + (c.totalIngresosEfectivo + incEfectivo) - (c.totalEgresos + incEgreso);
          return {
            ...c,
            totalIngresosEfectivo: c.totalIngresosEfectivo + incEfectivo,
            totalIngresosDigital: c.totalIngresosDigital + incDigital,
            totalEgresos: c.totalEgresos + incEgreso,
            saldoEsperado: nuevoEsperado,
          };
        })
      );
    }
  };

  // Client Actions
  const handleSaveCliente = async (cli: Cliente) => {
    setActionLoading(true);
    const res = await clientService.createClient(cli as any);
    setActionLoading(false);
    if (res.success) {
      setClientes(prev => [res.data, ...prev]);
      showToast('Cliente registrado', `Cliente ${res.data.razonSocial} creado.`, 'success');
    } else {
      showToast('Error', res.message || 'Error al crear cliente.', 'error');
    }
  };

  const handleToggleClienteStatus = async (id: number) => {
    setActionLoading(true);
    const res = await clientService.toggleStatus(id);
    setActionLoading(false);
    if (res.success) {
      setClientes(prev => prev.map(c => c.id === id ? { ...c, estado: res.data.estado as any } : c));
      showToast('Estado actualizado', `Cliente ${res.data.estado === 'ACTIVO' ? 'activado' : 'desactivado'}.`, 'success');
    } else {
      showToast('Error', res.message || 'Error al cambiar estado.', 'error');
    }
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
          <ServiceTrackingView
            ordenes={ordenes}
            onWorkerAccess={() => setIsWorkerAccess(true)}
            onSaveOrden={handleSaveOrden}
            onShowToast={showToast}
          />
        )}

        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  // Modal de cambio obligatorio de contrasena (bloquea acceso al sistema)
  if (showForceChangePassword && currentUser) {
    return (
      <div className="font-sans antialiased">
        <ForceChangePasswordModal
          username={currentUser.username}
          onSuccess={handleForceChangeSuccess}
          onLogout={handleLogout}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  const sucursalesActivas = sucursales.filter((s) => s.estado === 'ACTIVO');

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
        sucursales={sucursalesActivas}
        selectedSedeId={selectedSedeId}
        onSelectSede={handleSelectSede}
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
        <main className="flex-1 min-w-0 flex flex-col md:pl-[285px] transition-all min-h-[calc(100vh-4rem)]">
          {activeView === 'ventas' && (
            <SalesPOSView
              currentUser={currentUser}
              productos={productos}
              clientes={clientes}
              sucursales={sucursalesActivas}
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
              usuarios={usuarios}
              categorias={categorias}
              proveedores={proveedores}
              setActiveView={setActiveView}
              onOpenServices={handleOpenServices}
              onSaveOrden={handleSaveOrden}
              onSaveCliente={handleSaveCliente}
              onShowToast={showToast}
            />
          )}

          {(activeView === 'panel-almacen' || activeView === 'productos' || activeView === 'compras') && (
            <WarehouseDashboardView
              currentUser={currentUser}
              productos={productos}
              movimientos={movimientos}
              sucursales={sucursalesActivas}
              compras={compras}
              proveedores={proveedores}
              onSaveCompra={handleSaveCompra}
              onAnularCompra={handleAnularCompra}
              onSaveProveedor={handleSaveProveedor}
              onToggleProveedorEstado={handleToggleProveedorEstado}
              initialSection={activeView === 'compras' ? 'pedidos' : 'inventario'}
              setActiveView={setActiveView}
              onShowToast={showToast}
              onProductCreated={() => loadDatabaseData(selectedSedeId)}
              readOnly={currentUser.rol === 'TECNICO' || currentUser.rol === 'SECRETARIA'}
            />
          )}

          {activeView === 'taller' && currentUser && (
            <TechnicalWorkshopView
              ordenes={ordenes}
              usuarios={usuarios}
              clientes={clientes}
              productos={productos}
              marcas={marcas}
              categorias={categorias}
              proveedores={proveedores}
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
              sucursales={sucursalesActivas}
              movimientos={movimientos}
              onSaveMovimiento={handleSaveMovimiento}
              onUpdateMovimiento={handleUpdateMovimiento}
              onShowToast={showToast}
              currentUserName={currentUser.nombreCompleto}
              currentUserRole={currentUser.rol}
            />
          )}

          {(activeView === 'catalogo' || activeView === 'categorias' || activeView === 'marcas') && (
            <CatalogMasterView
              initialTab={activeView === 'marcas' ? 'marcas' : 'categorias'}
              onShowToast={showToast}
              readOnly={currentUser.rol !== 'ADMIN' && currentUser.rol !== 'SUPERADMIN' && currentUser.rol !== 'ALMACEN'}
              setActiveView={setActiveView}
            />
          )}

          {(activeView === 'config-empresa' || activeView === 'sucursales') &&
            (currentUser.rol === 'SUPERADMIN' ||
              currentUser.rol === 'ADMIN' ||
              currentUser.modulosPermitidos?.includes('config-empresa') ||
              currentUser.modulosPermitidos?.includes('sucursales')) && (
            <CompanySettingsView
              empresa={empresa}
              sucursales={sucursales}
              onSaveEmpresa={(updated) => setEmpresa(updated)}
              onSaveSucursal={(suc) =>
                setSucursales((prev) => {
                  const exists = prev.find((s) => s.id === suc.id);
                  const next = exists ? prev.map((s) => (s.id === suc.id ? suc : s)) : [...prev, suc];
                  if (suc.esPrincipal) {
                    return next.map((s) => (s.id === suc.id ? s : { ...s, esPrincipal: false }));
                  }
                  return next;
                })
              }
              onToggleSucursalEstado={(id) =>
                setSucursales((prev) => {
                  const updated = prev.map((s) =>
                    s.id === id ? { ...s, estado: (s.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO') as any } : s
                  );
                  if (selectedSedeId === id) {
                    const target = updated.find((s) => s.id === id);
                    if (target?.estado === 'INACTIVO') {
                      handleSelectSede(null);
                    }
                  }
                  return updated;
                })
              }
              onShowToast={showToast}
              setActiveView={setActiveView}
            />
          )}

          {activeView === 'usuarios' &&
            (currentUser.rol === 'SUPERADMIN' ||
              currentUser.rol === 'ADMIN' ||
              currentUser.modulosPermitidos?.includes('usuarios')) && (
            <UsersManagementView
              usuarios={usuarios}
              sucursales={sucursalesActivas}
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
              onClientUpdated={() => loadDatabaseData(selectedSedeId)}
            />
          )}

          {activeView === 'caja' && (
            <CashRegisterView
              currentUser={currentUser}
              sucursales={sucursalesActivas}
              cajasTurnos={cajasTurnos}
              movimientosCaja={movimientosCaja}
              onAbrirCaja={handleAbrirCaja}
              onCerrarCaja={handleCerrarCaja}
              onRegistrarMovimientoCaja={handleRegistrarMovimientoCaja}
              onShowToast={showToast}
              readOnly={currentUser.rol === 'TECNICO'}
            />
          )}

        </main>
      </div>

      {/* Cierre de sesión automático por inactividad (5 min + aviso de 60 s) */}
      <SessionTimeoutGuard
        onTimeout={async () => {
          await handleLogout();
          showToast('Sesión cerrada por inactividad', 'Por seguridad, vuelva a ingresar sus credenciales.', 'warning');
        }}
      />

      {/* Toast Notification Queue */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
export default App;
