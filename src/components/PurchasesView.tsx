import React, { useState, useMemo, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  FileText,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Printer,
  X,
  Trash2,
  Package,
  Layers,
  ArrowRight,
  RotateCcw,
  Store,
  DollarSign,
  Download,
  Filter,
  Eye,
  Check,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  FileSpreadsheet,
  Barcode,
  QrCode,
  Boxes,
  Lock,
  Send,
  Clock,
  Loader2,
  Wrench,
  ShoppingCart,
} from 'lucide-react';
import {
  Compra,
  ItemCompra,
  Proveedor,
  Producto,
  Sucursal,
  Usuario,
  EstadoRegistro,
} from '../types';
import { purchaseService } from '../services/purchase.service';
import { consultaService } from '../services/consulta.service';
import { categoryService } from '../services/category.service';
import { brandModelService } from '../services/brandModel.service';
import { warehouseService } from '../services/warehouse.service';
import { Categoria, Marca, Modelo } from '../types';

interface PurchasesViewProps {
  currentUser: Usuario;
  compras: Compra[];
  proveedores: Proveedor[];
  productos: Producto[];
  sucursales: Sucursal[];
  onSaveCompra: (compra: Compra) => void;
  onAnularCompra: (compraId: number) => void;
  onSaveProveedor: (proveedor: Proveedor) => void;
  onToggleProveedorEstado: (id: number) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  readOnly?: boolean;
  initialTab?: 'nueva' | 'historial' | 'proveedores';
  preselectedProductId?: number | null;
  onClearPreselectedProduct?: () => void;
  onRefreshData?: () => void;
  embeddedInWarehouse?: boolean;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  currentUser,
  compras,
  proveedores,
  productos,
  sucursales,
  onSaveCompra,
  onAnularCompra,
  onSaveProveedor,
  onToggleProveedorEstado,
  onShowToast,
  readOnly = false,
  initialTab = 'nueva',
  preselectedProductId = null,
  onClearPreselectedProduct,
  onRefreshData,
  embeddedInWarehouse = false,
}) => {
  const [activeTab, setActiveTab] = useState<'nueva' | 'historial' | 'proveedores'>(initialTab);
  const [modoOperacion, setModoOperacion] = useState<'SOLICITADO' | 'RECEPCION_DIRECTA'>('SOLICITADO');
  const [enviarCorreoAlEmitir, setEnviarCorreoAlEmitir] = useState<boolean>(true);
  const [filterEstadoPedido, setFilterEstadoPedido] = useState<'ALL' | 'SOLICITADO' | 'REGISTRADA' | 'ANULADA'>('ALL');

  // --- MODAL DE RECEPCIÓN FÍSICA EN ALMACÉN ---
  const [receivingCompra, setReceivingCompra] = useState<Compra | null>(null);
  const [recepcionComprobante, setRecepcionComprobante] = useState('');
  const [recepcionObs, setRecepcionObs] = useState('');
  const [recepcionSeriesMap, setRecepcionSeriesMap] = useState<Record<number, string[]>>({});
  const [recepcionBulkTextMap, setRecepcionBulkTextMap] = useState<Record<number, string>>({});
  const [isSubmittingRecepcion, setIsSubmittingRecepcion] = useState(false);
  const [sendingOrderEmailId, setSendingOrderEmailId] = useState<number | null>(null);
  const [isQueryingRuc, setIsQueryingRuc] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // --- NUEVA COMPRA STATE ---
  const [selectedProveedorId, setSelectedProveedorId] = useState<number | ''>(proveedores[0]?.id || '');
  const [tipoComprobante, setTipoComprobante] = useState<'FACTURA' | 'BOLETA' | 'GUIA_REMISION'>('FACTURA');
  const [serieNumero, setSerieNumero] = useState('');
  const isGlobalAdmin = currentUser?.rol === 'SUPERADMIN' || currentUser?.rol === 'ADMIN';
  const normalizeBranchName = (val?: string | null) =>
    (val || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();

  const assignedUserSucursal = useMemo(() => {
    const userBranchNorm = normalizeBranchName(currentUser?.sucursalNombre);
    return (
      sucursales.find((s) => s.id === currentUser?.sucursalId) ||
      (userBranchNorm
        ? sucursales.find((s) => normalizeBranchName(s.nombre) === userBranchNorm)
        : undefined)
    );
  }, [sucursales, currentUser?.sucursalId, currentUser?.sucursalNombre]);

  const [sucursalDestino, setSucursalDestino] = useState<string>(
    () =>
      assignedUserSucursal?.nombre ||
      currentUser?.sucursalNombre ||
      sucursales[0]?.nombre ||
      'Principal - Chiclayo Centro'
  );

  useEffect(() => {
    if (assignedUserSucursal) {
      setSucursalDestino(assignedUserSucursal.nombre);
    } else if (currentUser?.sucursalNombre) {
      setSucursalDestino(currentUser.sucursalNombre);
    }
  }, [assignedUserSucursal, currentUser?.sucursalNombre]);
  const [fechaCompra, setFechaCompra] = useState<string>(new Date().toISOString().slice(0, 10));
  const [observaciones, setObservaciones] = useState('');
  const [cartItems, setCartItems] = useState<ItemCompra[]>([]);

  // Item selector in form
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [itemCantidad, setItemCantidad] = useState<number>(1);
  const [itemPrecioCosto, setItemPrecioCosto] = useState<number | string>(0);

  // --- CATÁLOGO MAESTRO (Categoría → Marca → Modelo) ---
  const [catCategorias, setCatCategorias] = useState<Categoria[]>([]);
  const [catMarcas, setCatMarcas] = useState<Marca[]>([]);
  const [catModelos, setCatModelos] = useState<Modelo[]>([]);
  const [catFiltroCategoria, setCatFiltroCategoria] = useState<number | ''>('');
  const [catFiltroMarca, setCatFiltroMarca] = useState<number | ''>('');
  const [catModeloSel, setCatModeloSel] = useState<Modelo | null>(null);
  const [catPrecioVenta, setCatPrecioVenta] = useState<string>('');
  const [catDestino, setCatDestino] = useState<'VENTA' | 'SERVICIO_TALLER' | 'MIXTO'>('VENTA');
  const [catRequiereSerie, setCatRequiereSerie] = useState<boolean>(true);
  const [isCreatingFromCatalog, setIsCreatingFromCatalog] = useState(false);
  const [productSelectionMode, setProductSelectionMode] = useState<'catalogo' | 'almacen'>('catalogo');
  const [recepcionPreciosVentaMap, setRecepcionPreciosVentaMap] = useState<Record<number, string>>({});
  const [recepcionDestinosMap, setRecepcionDestinosMap] = useState<Record<number, string>>({});
  const [recepcionMostrarPosMap, setRecepcionMostrarPosMap] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [rc, rm, rmo] = await Promise.all([
          categoryService.getCategorias(),
          brandModelService.getMarcas(),
          brandModelService.getModelos(),
        ]);
        if (!active) return;
        if (rc.success && rc.categorias) setCatCategorias(rc.categorias.filter((c) => c.estado === 'ACTIVO'));
        if (rm.success && rm.marcas) setCatMarcas(rm.marcas.filter((m) => m.estado === 'ACTIVO'));
        if (rmo.success && rmo.modelos) setCatModelos(rmo.modelos.filter((m) => m.estado === 'ACTIVO'));
      } catch (err) {
        console.warn('No se pudo cargar el Catálogo Maestro:', err);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const catMarcasFiltradas = useMemo(
    () => catMarcas.filter((m) => !catFiltroCategoria || m.categoriaId === catFiltroCategoria),
    [catMarcas, catFiltroCategoria]
  );

  const catModelosFiltrados = useMemo(() => {
    const idsMarcas = new Set(catMarcasFiltradas.map((m) => m.id));
    return catModelos.filter(
      (mo) => idsMarcas.has(mo.marcaId) && (!catFiltroMarca || mo.marcaId === catFiltroMarca)
    );
  }, [catModelos, catMarcasFiltradas, catFiltroMarca]);

  const getProductoDeModelo = (modeloId: number) => productos.find((p) => p.modeloId === modeloId);

  const handleSelectModeloCatalogo = (modelo: Modelo) => {
    setCatModeloSel(modelo);
    const existente = getProductoDeModelo(modelo.id);
    const marca = catMarcas.find((m) => m.id === modelo.marcaId);
    const cat = catCategorias.find((c) => c.id === marca?.categoriaId);
    const nombreCat = (cat?.nombre || '').toUpperCase();
    
    setCatRequiereSerie(!(nombreCat.includes('REPUESTO') || nombreCat.includes('SUMINISTRO') || nombreCat.includes('PERIF') || nombreCat.includes('COMPONENTE')));
    setCatDestino(nombreCat.includes('REPUESTO') ? 'MIXTO' : 'VENTA');
    setItemCantidad(1);

    if (existente) {
      setSelectedProductId(existente.id);
      setItemPrecioCosto(existente.precioCosto || Math.round(existente.precioUnitario * 0.75));
      setCatPrecioVenta(String(existente.precioUnitario || ''));
    } else {
      setSelectedProductId('');
      setItemPrecioCosto(0);
      setCatPrecioVenta('');
    }
  };

  const handleCrearProductoDesdeCatalogo = async () => {
    if (!catModeloSel) return;
    const marca = catMarcas.find((m) => m.id === catModeloSel.marcaId);
    if (!marca || !marca.categoriaId) {
      onShowToast('Marca sin categoría', 'La marca del modelo no tiene categoría asignada en el Catálogo Maestro.', 'warning');
      return;
    }
    const costo = Number(itemPrecioCosto) || 0;
    const venta = Number(catPrecioVenta) || (costo > 0 ? Math.round(costo * 1.25) : 0);
    if (costo <= 0) {
      onShowToast('Costo requerido', 'Ingrese el costo unitario de compra pactado.', 'warning');
      return;
    }
    if (itemCantidad <= 0) {
      onShowToast('Cantidad inválida', 'La cantidad debe ser mayor a 0.', 'warning');
      return;
    }
    setIsCreatingFromCatalog(true);
    try {
      const nombre = `${marca.nombre} ${catModeloSel.nombre}`.trim();
      const res = await warehouseService.createProducto({
        nombre,
        descripcion: catModeloSel.descripcion || '',
        categoriaId: marca.categoriaId,
        marcaId: marca.id,
        modeloId: catModeloSel.id,
        precioVenta: venta,
        precioCosto: costo,
        requiereSerie: catRequiereSerie,
        tipoDestino: catDestino,
        disponibleVenta: catDestino !== 'SERVICIO_TALLER',
        stockInicial: 0,
      });
      if (!res.success || !res.productoId) {
        onShowToast('No se pudo crear el producto', res.message || 'Error al registrar el producto del catálogo.', 'error');
        return;
      }
      const cat = catCategorias.find((c) => c.id === marca.categoriaId);
      const newItem: ItemCompra = {
        productoId: res.productoId,
        codigo: '',
        nombre,
        categoria: cat?.nombre || '',
        marca: marca.nombre,
        cantidad: itemCantidad,
        precioCostoUnitario: costo,
        subtotal: itemCantidad * costo,
        requiereSerie: catRequiereSerie,
        series: [],
      };
      setCartItems((prev) => [...prev, newItem]);
      onShowToast('Producto creado y agregado', `${nombre} se registró desde el Catálogo Maestro y se añadió al pedido.`, 'success');
      setCatModeloSel(null);
      setItemPrecioCosto(0);
      setItemCantidad(1);
      setCatPrecioVenta('');
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      onShowToast('Error', err?.message || 'No se pudo crear el producto.', 'error');
    } finally {
      setIsCreatingFromCatalog(false);
    }
  };

  const handleAddModeloToOrder = () => {
    if (!catModeloSel) return;
    const existente = getProductoDeModelo(catModeloSel.id);
    const costo = Number(itemPrecioCosto) || 0;
    const cantidad = Number(itemCantidad) || 1;

    if (costo <= 0) {
      onShowToast('Costo requerido', 'Ingrese el costo de compra unitario pactado.', 'warning');
      return;
    }
    if (cantidad <= 0) {
      onShowToast('Cantidad inválida', 'La cantidad debe ser mayor a 0.', 'warning');
      return;
    }

    if (existente) {
      const newItem: ItemCompra = {
        productoId: existente.id,
        codigo: existente.codigo,
        nombre: existente.nombre,
        categoria: existente.categoria,
        marca: existente.marca,
        cantidad,
        precioCostoUnitario: costo,
        subtotal: cantidad * costo,
        requiereSerie: existente.requiereSerie,
        series: [],
      };
      setCartItems((prev) => [...prev, newItem]);
      onShowToast('Ítem agregado', `${existente.nombre} agregado al pedido de compra.`, 'info');
      setCatModeloSel(null);
      setItemPrecioCosto(0);
      setItemCantidad(1);
    } else {
      handleCrearProductoDesdeCatalogo();
    }
  };

  // Modal Compra Detalle / Imprimir
  const [selectedCompraDetail, setSelectedCompraDetail] = useState<Compra | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // --- SERIES MODAL STATE (ALMACÉN) ---
  const [seriesModalItemIndex, setSeriesModalItemIndex] = useState<number | null>(null);
  const [currentInputSerie, setCurrentInputSerie] = useState<string>('');
  const [bulkSeriesInput, setBulkSeriesInput] = useState<string>('');
  const [isBulkMode, setIsBulkMode] = useState<boolean>(false);

  // --- PROVEEDOR MODAL STATE ---
  const [isProveedorModalOpen, setIsProveedorModalOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null);
  const [proveedorForm, setProveedorForm] = useState<Partial<Proveedor>>({
    ruc: '',
    razonSocial: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: '',
    estado: 'ACTIVO',
  });

  // --- FILTERS STATE (HISTORIAL) ---
  const [historialSearch, setHistorialSearch] = useState('');
  const [filterSede, setFilterSede] = useState('ALL');
  const [filterProveedor, setFilterProveedor] = useState('ALL');

  // Calculations for new purchase
  const selectedProductObj = useMemo(() => {
    return productos.find((p) => p.id === Number(selectedProductId));
  }, [productos, selectedProductId]);

  const selectedProveedorObj = useMemo(() => {
    return proveedores.find((p) => p.id === Number(selectedProveedorId));
  }, [proveedores, selectedProveedorId]);

  // When selected product changes, update default cost price
  const handleSelectProduct = (prodId: number) => {
    setSelectedProductId(prodId);
    const found = productos.find((p) => p.id === prodId);
    if (found) {
      setItemPrecioCosto(found.precioCosto || Math.round(found.precioUnitario * 0.75));
    }
  };

  // Pre-select product when clicked from Warehouse Inventory ("Pedir a Proveedor")
  useEffect(() => {
    if (preselectedProductId) {
      setActiveTab('nueva');
      setProductSelectionMode('almacen');
      const found = productos.find((p) => p.id === preselectedProductId);
      if (found) {
        const linkedModel = found.modeloId ? catModelos.find((m) => m.id === found.modeloId) : null;
        if (linkedModel) {
          handleSelectModeloCatalogo(linkedModel);
          setSearchProductQuery(linkedModel.nombre);
        } else {
          handleSelectProduct(preselectedProductId);
          setSearchProductQuery(found.codigo || found.nombre);
        }
        setItemCantidad(found.stock <= 3 ? 5 : 2);
      } else {
        handleSelectProduct(preselectedProductId);
      }
      if (onClearPreselectedProduct) {
        onClearPreselectedProduct();
      }
    }
  }, [preselectedProductId, productos, catModelos]);

  const handleAddItemToCart = () => {
    if (!selectedProductObj) {
      onShowToast('Atención', 'Por favor selecciona un producto del catálogo.', 'warning');
      return;
    }
    if (itemCantidad <= 0) {
      onShowToast('Cantidad inválida', 'La cantidad debe ser mayor a 0.', 'warning');
      return;
    }
    const costoNum = Number(itemPrecioCosto) || 0;
    if (costoNum <= 0) {
      onShowToast('Precio inválido', 'El costo unitario debe ser mayor a 0.', 'warning');
      return;
    }

    const isSeriado = !!(selectedProductObj.requiereSerie || (selectedProductObj.categoriaId && selectedProductObj.categoriaId <= 3));

    // Check if already in cart
    const existingIndex = cartItems.findIndex((item) => item.productoId === selectedProductObj.id);
    if (existingIndex >= 0) {
      const updated = [...cartItems];
      updated[existingIndex].cantidad += itemCantidad;
      updated[existingIndex].precioCostoUnitario = costoNum;
      updated[existingIndex].subtotal = updated[existingIndex].cantidad * costoNum;
      updated[existingIndex].requiereSerie = isSeriado;
      setCartItems(updated);
    } else {
      const newItem: ItemCompra = {
        productoId: selectedProductObj.id,
        codigo: selectedProductObj.codigo,
        nombre: selectedProductObj.nombre,
        categoria: selectedProductObj.categoriaNombre,
        marca: selectedProductObj.marcaNombre,
        cantidad: itemCantidad,
        precioCostoUnitario: costoNum,
        subtotal: itemCantidad * costoNum,
        requiereSerie: isSeriado,
        series: [],
      };
      setCartItems([...cartItems, newItem]);
    }

    // Reset item picker
    setSelectedProductId('');
    setSearchProductQuery('');
    setItemCantidad(1);
    setItemPrecioCosto(0);
    onShowToast('Ítem agregado', `${selectedProductObj.nombre} agregado a la orden de compra.`, 'info');
  };

  const handleRemoveItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  // --- SERIES MANAGEMENT FOR ACTIVE ITEM ---
  const activeSeriesItem = seriesModalItemIndex !== null ? cartItems[seriesModalItemIndex] : null;

  const handleOpenSeriesModal = (index: number) => {
    setSeriesModalItemIndex(index);
    setCurrentInputSerie('');
    setBulkSeriesInput('');
    setIsBulkMode(false);
  };

  const handleAddSingleSerie = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (seriesModalItemIndex === null || !activeSeriesItem) return;
    const clean = currentInputSerie.trim().toUpperCase();
    if (!clean) return;

    const currentSeries = activeSeriesItem.series || [];
    if (currentSeries.includes(clean)) {
      onShowToast('Serie duplicada', `La serie '${clean}' ya fue ingresada para este producto.`, 'warning');
      return;
    }
    if (currentSeries.length >= activeSeriesItem.cantidad) {
      onShowToast('Límite alcanzado', `Ya se ingresaron las ${activeSeriesItem.cantidad} series de este producto.`, 'warning');
      return;
    }

    const updated = [...cartItems];
    updated[seriesModalItemIndex].series = [...currentSeries, clean];
    setCartItems(updated);
    setCurrentInputSerie('');
  };

  const handleRemoveSerie = (serieIndex: number) => {
    if (seriesModalItemIndex === null || !activeSeriesItem) return;
    const updated = [...cartItems];
    const filtered = (activeSeriesItem.series || []).filter((_, i) => i !== serieIndex);
    updated[seriesModalItemIndex].series = filtered;
    setCartItems(updated);
  };

  const handleApplyBulkSeries = () => {
    if (seriesModalItemIndex === null || !activeSeriesItem) return;
    const lines = bulkSeriesInput
      .split(/[\n,;]+/)
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s.length > 0);

    if (lines.length === 0) {
      onShowToast('Texto vacío', 'Pegue los números de serie en el campo de texto.', 'warning');
      return;
    }

    const uniqueLines = Array.from(new Set(lines));
    const targetCount = activeSeriesItem.cantidad;
    const finalSeries = uniqueLines.slice(0, targetCount);

    const updated = [...cartItems];
    updated[seriesModalItemIndex].series = finalSeries;
    setCartItems(updated);
    setIsBulkMode(false);
    onShowToast('Series asignadas', `${finalSeries.length} series registradas correctamente.`, 'success');
  };

  // Financial totals for the purchase
  const totalBruto = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cartItems]);

  const subtotalBase = tipoComprobante === 'FACTURA' ? Number((totalBruto / 1.18).toFixed(2)) : totalBruto;
  const igvCalculado = tipoComprobante === 'FACTURA' ? Number((totalBruto - subtotalBase).toFixed(2)) : 0;
  const totalFinal = totalBruto;

  const handleRegisterPurchase = async () => {
    if (!selectedProveedorObj) {
      onShowToast('Falta proveedor', 'Selecciona el proveedor para emitir el pedido.', 'error');
      return;
    }
    if (modoOperacion === 'RECEPCION_DIRECTA' && !serieNumero.trim()) {
      onShowToast('Falta comprobante', 'Para Recepción Directa debes ingresar el N° de Factura o Guía del proveedor (ej: F001-002849).', 'error');
      return;
    }
    if (cartItems.length === 0) {
      onShowToast('Orden vacía', 'Agrega al menos un producto o repuesto al pedido.', 'error');
      return;
    }

    // Validar que los productos seriados tengan sus series completas SOLO cuando es Recepción Directa
    if (modoOperacion === 'RECEPCION_DIRECTA') {
      for (const item of cartItems) {
        if (item.requiereSerie && (item.series?.length || 0) < item.cantidad) {
          onShowToast(
            'Faltan series físicas',
            `Para recepcionar en almacén, el producto '${item.nombre}' requiere ${item.cantidad} series físicas (${item.series?.length || 0} registradas).`,
            'warning'
          );
          return;
        }
      }
    }

    const generatedCode =
      modoOperacion === 'SOLICITADO'
        ? serieNumero.trim()
          ? serieNumero.toUpperCase().trim()
          : `OC-${String(compras.length + 101).padStart(5, '0')}`
        : serieNumero.toUpperCase().trim();

    const newCompra: Compra = {
      id: Date.now(),
      codigoComprobante: generatedCode,
      tipoComprobante: modoOperacion === 'SOLICITADO' ? 'ORDEN_COMPRA' : tipoComprobante,
      proveedorId: selectedProveedorObj.id,
      proveedorRuc: selectedProveedorObj.ruc,
      proveedorRazonSocial: selectedProveedorObj.razonSocial,
      proveedorEmail: selectedProveedorObj.email,
      proveedorTelefono: selectedProveedorObj.telefono,
      sucursalDestino,
      compradorId: currentUser.id,
      compradorNombre: currentUser.nombreCompleto,
      fecha: `${fechaCompra} ${new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`,
      items: cartItems,
      subtotal: subtotalBase,
      igv: igvCalculado,
      total: totalFinal,
      estado: modoOperacion === 'SOLICITADO' ? 'SOLICITADO' : 'REGISTRADA',
      observaciones: observaciones.trim() || undefined,
    };

    onSaveCompra(newCompra);

    // Open detail modal to review / print
    setSelectedCompraDetail(newCompra);
    setIsDetailModalOpen(true);

    // Reset form
    setCartItems([]);
    setSerieNumero('');
    setObservaciones('');
  };

  // --- RECEPCIÓN FÍSICA EN ALMACÉN DE UN PEDIDO EN TRÁNSITO ---
  const handleOpenReceptionModal = (compra: Compra) => {
    setReceivingCompra(compra);
    setRecepcionComprobante(`F001-${String(compra.id).slice(-5).padStart(6, '0')}`);
    setRecepcionObs('Mercadería verificada conforme en almacén.');
    const initialSeries: Record<number, string[]> = {};
    const initialBulk: Record<number, string> = {};
    compra.items.forEach((it) => {
      if (it.requiereSerie) {
        initialSeries[it.productoId] = [];
        initialBulk[it.productoId] = '';
      }
    });
    setRecepcionSeriesMap(initialSeries);
    setRecepcionBulkTextMap(initialBulk);
  };

  const handleConfirmReception = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingCompra) return;
    if (!recepcionComprobante.trim()) {
      onShowToast('Falta comprobante', 'Ingresa el N° de Factura o Guía de Remisión con que llegó el pedido.', 'warning');
      return;
    }

    // Validar series requeridas
    for (const it of receivingCompra.items) {
      if (it.requiereSerie) {
        const list = recepcionSeriesMap[it.productoId] || [];
        if (list.length < it.cantidad) {
          onShowToast(
            'Series requeridas para Almacén',
            `El equipo "${it.nombre}" requiere registrar sus ${it.cantidad} números de serie antes de ingresar al stock.`,
            'warning'
          );
          return;
        }
      }
    }

    setIsSubmittingRecepcion(true);
    try {
      const res = await purchaseService.recepcionarCompra(receivingCompra.id, {
        codigoComprobante: recepcionComprobante.trim().toUpperCase(),
        observacionesRecepcion: recepcionObs.trim(),
        seriesPorProducto: recepcionSeriesMap,
      });

      if (res.success) {
        onShowToast(
          'Recepción en Almacén Confirmada',
          res.message || `Stock incrementado exitosamente en ${receivingCompra.sucursalDestino}.`,
          'success'
        );
        setReceivingCompra(null);
        if (onRefreshData) onRefreshData();
      } else {
        onShowToast('Error en Recepción', res.message || 'No se pudo recepcionar el pedido.', 'error');
      }
    } finally {
      setIsSubmittingRecepcion(false);
    }
  };

  const handleSendOrderEmail = async (compra: Compra) => {
    setSendingOrderEmailId(compra.id);
    try {
      const res = await purchaseService.enviarOrdenCompraEmail(compra.id);
      if (res.success) {
        onShowToast('Orden Enviada al Proveedor', res.message || 'Correo enviado al proveedor.', 'success');
      } else {
        onShowToast('Atención', res.message || 'No se pudo enviar el correo al proveedor.', 'warning');
      }
    } finally {
      setSendingOrderEmailId(null);
    }
  };

  const handleConsultarRucProveedor = async () => {
    const ruc = (proveedorForm.ruc || '').trim();
    if (ruc.length !== 11) {
      onShowToast('RUC inválido', 'Ingrese un RUC de 11 dígitos para consultar en SUNAT.', 'warning');
      return;
    }
    setIsQueryingRuc(true);
    try {
      const res = await consultaService.consultarRuc(ruc);
      if (res.success && res.data) {
        setProveedorForm((prev) => ({
          ...prev,
          razonSocial: res.data!.razonSocial || prev.razonSocial,
          direccion: res.data!.direccion || prev.direccion,
        }));
        onShowToast('SUNAT: RUC Verificado', res.data.razonSocial, 'success');
      } else {
        onShowToast('SUNAT', res.message || 'No se encontraron datos para este RUC.', 'warning');
      }
    } finally {
      setIsQueryingRuc(false);
    }
  };

  // --- PROVEEDOR FORM HANDLERS ---
  const handleOpenNewProveedor = () => {
    setEditingProveedor(null);
    setProveedorForm({
      ruc: '',
      razonSocial: '',
      contacto: '',
      telefono: '',
      email: '',
      direccion: '',
      estado: 'ACTIVO',
    });
    setIsProveedorModalOpen(true);
  };

  const handleEditProveedor = (p: Proveedor) => {
    setEditingProveedor(p);
    setProveedorForm(p);
    setIsProveedorModalOpen(true);
  };

  const handleSaveProveedorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proveedorForm.ruc || proveedorForm.ruc.length !== 11) {
      onShowToast('RUC inválido', 'El RUC debe contener exactamente 11 dígitos numéricos.', 'error');
      return;
    }
    if (!proveedorForm.razonSocial?.trim()) {
      onShowToast('Campo obligatorio', 'Ingresa la Razón Social del proveedor.', 'error');
      return;
    }

    const saved: Proveedor = {
      id: editingProveedor ? editingProveedor.id : Date.now(),
      ruc: proveedorForm.ruc.trim(),
      razonSocial: proveedorForm.razonSocial.trim().toUpperCase(),
      contacto: proveedorForm.contacto?.trim() || '',
      telefono: proveedorForm.telefono?.trim() || '',
      email: proveedorForm.email?.trim().toLowerCase() || '',
      direccion: proveedorForm.direccion?.trim() || '',
      estado: proveedorForm.estado || 'ACTIVO',
      fechaRegistro: editingProveedor ? editingProveedor.fechaRegistro : new Date().toISOString().slice(0, 10),
    };

    onSaveProveedor(saved);
    setIsProveedorModalOpen(false);
    onShowToast(
      editingProveedor ? 'Proveedor Actualizado' : 'Proveedor Creado',
      `Proveedor ${saved.razonSocial} guardado con éxito.`,
      'success'
    );
  };

  // Control estricto de sede: usuarios asignados a una sucursal solo ven órdenes de su propia sede
  const scopedCompras = useMemo(() => {
    if (isGlobalAdmin || (!currentUser?.sucursalId && !currentUser?.sucursalNombre)) {
      return compras;
    }
    const targetId = assignedUserSucursal?.id ?? currentUser?.sucursalId;
    const targetNameNorm = normalizeBranchName(
      assignedUserSucursal?.nombre || currentUser?.sucursalNombre
    );
    return compras.filter((c) => {
      if (targetId && c.sucursalId) {
        return Number(c.sucursalId) === Number(targetId);
      }
      return targetNameNorm ? normalizeBranchName(c.sucursalDestino) === targetNameNorm : true;
    });
  }, [compras, isGlobalAdmin, assignedUserSucursal, currentUser?.sucursalId, currentUser?.sucursalNombre]);

  useEffect(() => {
    if (!isGlobalAdmin && (assignedUserSucursal?.nombre || currentUser?.sucursalNombre)) {
      setFilterSede(assignedUserSucursal?.nombre || currentUser?.sucursalNombre || 'ALL');
    } else {
      setFilterSede('ALL');
    }
  }, [isGlobalAdmin, assignedUserSucursal?.nombre, currentUser?.sucursalNombre]);

  // Filtered purchases history
  const filteredCompras = useMemo(() => {
    return scopedCompras.filter((c) => {
      const matchSearch =
        !historialSearch ||
        c.codigoComprobante.toLowerCase().includes(historialSearch.toLowerCase()) ||
        c.proveedorRazonSocial.toLowerCase().includes(historialSearch.toLowerCase()) ||
        c.proveedorRuc.includes(historialSearch);

      const matchSede =
        !isGlobalAdmin ||
        filterSede === 'ALL' ||
        normalizeBranchName(c.sucursalDestino) === normalizeBranchName(filterSede);
      const matchProv = filterProveedor === 'ALL' || String(c.proveedorId) === filterProveedor;
      const matchEstado = filterEstadoPedido === 'ALL' || c.estado === filterEstadoPedido;

      return matchSearch && matchSede && matchProv && matchEstado;
    });
  }, [scopedCompras, isGlobalAdmin, historialSearch, filterSede, filterProveedor, filterEstadoPedido]);

  // Metric stats (estrictamente sobre órdenes visibles para la sede)
  const pedidosEnTransito = scopedCompras.filter((c) => c.estado === 'SOLICITADO').length;
  const totalInvertido = scopedCompras
    .filter((c) => c.estado === 'REGISTRADA')
    .reduce((sum, c) => sum + c.total, 0);
  const totalItemsComprados = scopedCompras
    .filter((c) => c.estado === 'REGISTRADA')
    .reduce((sum, c) => sum + c.items.reduce((acc, it) => acc + it.cantidad, 0), 0);

  // Modelos del Catálogo Maestro que coinciden con la búsqueda rápida
  const availableCatalogModels = useMemo(() => {
    const q = searchProductQuery.toLowerCase().trim();
    if (!q) return catModelos.slice(0, 30);
    const tokens = q.split(/\s+/).filter(Boolean);
    return catModelos.filter((mo) => {
      const marca = catMarcas.find((m) => m.id === mo.marcaId);
      const categoria = catCategorias.find((c) => c.id === marca?.categoriaId);
      const searchable = [
        categoria?.nombre || '',
        marca?.nombre || '',
        mo.nombre || '',
        mo.descripcion || '',
      ]
        .join(' ')
        .toLowerCase();
      return tokens.every((tok) => searchable.includes(tok));
    });
  }, [catModelos, catMarcas, catCategorias, searchProductQuery]);

  const handleExportComprasCSV = () => {
    const csv =
      'data:text/csv;charset=utf-8,' +
      'ID,Comprobante,Tipo,RUC,Proveedor,SedeDestino,Fecha,Total,Estado\n' +
      filteredCompras
        .map(
          (c) =>
            `"${c.id}","${c.codigoComprobante}","${c.tipoComprobante}","${c.proveedorRuc}","${c.proveedorRazonSocial}","${c.sucursalDestino}","${c.fecha}",${c.total},"${c.estado}"`
        )
        .join('\n');
    const encoded = encodeURI(csv);
    const a = document.createElement('a');
    a.href = encoded;
    a.download = `compras_MG_Solutions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    onShowToast('Exportación exitosa', 'Reporte de compras exportado a CSV/Excel.', 'success');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8F9FF] p-5 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            {pedidosEnTransito > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setFilterEstadoPedido('SOLICITADO');
                    setActiveTab('historial');
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-300 px-3 py-1 text-xs font-bold text-amber-800 hover:bg-amber-200 transition"
                >
                  <Clock className="h-3.5 w-3.5" />
                  {pedidosEnTransito} Pedido(s) en Tránsito por Recepcionar en Almacén
                </button>
              </div>
            )}
            <h1 className="mt-1 text-2xl font-black tracking-tight text-[#0B1C30] md:text-3xl">
              {activeTab === 'proveedores'
                ? 'Directorio de Proveedores'
                : activeTab === 'historial'
                ? 'Órdenes de Compra & Recepción en Almacén'
                : 'Pedidos a Proveedores, Recepción en Almacén & Abastecimiento'}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {activeTab === 'proveedores'
                ? 'Empresas proveedoras, mayoristas y canales de abastecimiento homologados.'
                : activeTab === 'historial'
                ? 'Historial de compras emitidas y verificación física de series para ingreso a stock.'
                : 'Ciclo trazable en 2 etapas: 1° Emisión de Orden de Pedido al Proveedor (En Tránsito) → 2° Recepción Física y Alta de Series en Almacén para Ventas POS y Taller Técnico.'}
            </p>
          </div>

          {/* Tab Navigation buttons */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-200/70 p-1">
            <button
              onClick={() => setActiveTab('nueva')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                activeTab === 'nueva'
                  ? 'bg-white text-[#00346F] shadow-sm'
                  : 'text-slate-600 hover:text-[#00346F]'
              }`}
            >
              <Plus className="h-4 w-4" />
              Realizar Pedido a Proveedor
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                activeTab === 'historial'
                  ? 'bg-white text-[#00346F] shadow-sm'
                  : 'text-slate-600 hover:text-[#00346F]'
              }`}
            >
              <FileText className="h-4 w-4" />
              Órdenes & Recepción ({scopedCompras.length})
              {pedidosEnTransito > 0 && (
                <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-black text-white">
                  {pedidosEnTransito}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('proveedores')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                activeTab === 'proveedores'
                  ? 'bg-white text-[#00346F] shadow-sm'
                  : 'text-slate-600 hover:text-[#00346F]'
              }`}
            >
              <Building2 className="h-4 w-4" />
              Proveedores ({proveedores.length})
            </button>
          </div>
        </div>

        {/* --- TAB 1: EMITIR PEDIDO A PROVEEDOR / RECEPCIÓN --- */}
        {activeTab === 'nueva' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Left side: Invoice & Items Picker */}
            <div className="space-y-6">
              {/* Selector de Etapa / Modalidad Logística */}
              <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-r from-[#EFF4FF] to-indigo-50/60 p-4 shadow-xs">
                <p className="text-[11px] font-black uppercase tracking-wider text-[#00346F] mb-2">
                  Etapa del Proceso de Abastecimiento (Integridad de Almacén)
                </p>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setModoOperacion('SOLICITADO')}
                    className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                      modoOperacion === 'SOLICITADO'
                        ? 'border-[#00346F] bg-[#00346F] text-white shadow-md'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-xs">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span>1. Emitir Orden de Pedido (En Tránsito)</span>
                    </div>
                    <p className={`mt-1 text-[10px] leading-snug ${modoOperacion === 'SOLICITADO' ? 'text-blue-100' : 'text-slate-500'}`}>
                      Genera el pedido oficial al proveedor. <strong>No altera el stock real</strong> hasta que Almacén confirme su llegada física.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModoOperacion('RECEPCION_DIRECTA')}
                    className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                      modoOperacion === 'RECEPCION_DIRECTA'
                        ? 'border-emerald-700 bg-emerald-600 text-white shadow-md'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-xs">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>2. Recepción Directa con Factura</span>
                    </div>
                    <p className={`mt-1 text-[10px] leading-snug ${modoOperacion === 'RECEPCION_DIRECTA' ? 'text-emerald-50' : 'text-slate-500'}`}>
                      Cuando la mercadería ya llegó físicamente con Factura/Guía y series listas para entrar a stock.
                    </p>
                  </button>
                </div>
              </div>

              {/* Document Header Form */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EFF4FF] text-[#00346F]">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[#0B1C30]">
                        {modoOperacion === 'SOLICITADO' ? 'Datos de la Orden de Pedido al Proveedor' : 'Datos del Comprobante Recepcionado'}
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        {modoOperacion === 'SOLICITADO'
                          ? 'Selecciona el proveedor mayorista y la sede que solicita el reabastecimiento'
                          : 'Información del proveedor y factura/guía recibida en almacén'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenNewProveedor}
                    className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-[#EFF4FF] px-2.5 py-1.5 text-xs font-bold text-[#00346F] hover:bg-blue-100"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Nuevo Proveedor
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Proveedor */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700">Proveedor Homologado</label>
                    <select
                      value={selectedProveedorId}
                      onChange={(e) => setSelectedProveedorId(Number(e.target.value))}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-[#00346F] focus:bg-white"
                    >
                      {proveedores.filter((p) => p.estado === 'ACTIVO').map((prov) => (
                        <option key={prov.id} value={prov.id}>
                          {prov.ruc} - {prov.razonSocial}
                        </option>
                      ))}
                    </select>
                    {selectedProveedorObj && (
                      <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[11px] text-slate-600 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Phone className="h-3 w-3 text-[#00346F]" /> {selectedProveedorObj.telefono || 'Sin teléfono'}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-[#00346F]" /> {selectedProveedorObj.direccion || 'Sin dirección'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 border-t border-slate-200/80 pt-1.5 text-slate-700">
                          <Lock className="h-3 w-3 text-slate-500" />
                          <span className="font-bold">Correo Oficial del Proveedor:</span>
                          <span className="font-mono text-[#00346F] font-semibold">
                            {selectedProveedorObj.email || 'Sin correo en ficha'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tipo de Comprobante */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700">Tipo de Documento</label>
                    {modoOperacion === 'SOLICITADO' ? (
                      <input
                        type="text"
                        value="ORDEN DE PEDIDO / COMPRA (OC)"
                        readOnly
                        disabled
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-bold text-[#00346F] cursor-not-allowed"
                      />
                    ) : (
                      <select
                        value={tipoComprobante}
                        onChange={(e) => setTipoComprobante(e.target.value as any)}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#00346F] focus:bg-white"
                      >
                        <option value="FACTURA">FACTURA ELECTRÓNICA (con IGV)</option>
                        <option value="BOLETA">BOLETA DE VENTA</option>
                        <option value="GUIA_REMISION">GUÍA DE REMISIÓN</option>
                      </select>
                    )}
                  </div>

                  {/* Serie y Número */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      {modoOperacion === 'SOLICITADO' ? 'Código de Orden (Autogenerado si vacío)' : 'N° Comprobante / Factura del Proveedor *'}
                    </label>
                    <input
                      type="text"
                      value={serieNumero}
                      onChange={(e) => setSerieNumero(e.target.value)}
                      placeholder={modoOperacion === 'SOLICITADO' ? `Ej. OC-00${compras.length + 101} (Automático)` : 'Ej. F001-004819'}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold uppercase text-slate-800 outline-none focus:border-[#00346F] focus:bg-white"
                    />
                  </div>

                  {/* Sede Destino */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700">Sede Destino (Aumento de stock)</label>
                    <select
                      value={sucursalDestino}
                      disabled={!isGlobalAdmin && Boolean(assignedUserSucursal)}
                      onChange={(e) => setSucursalDestino(e.target.value)}
                      title={!isGlobalAdmin && assignedUserSucursal ? 'Sede asignada a su usuario' : 'Seleccionar sede destino'}
                      className={`mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#00346F] ${
                        !isGlobalAdmin && assignedUserSucursal ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50 focus:bg-white'
                      }`}
                    >
                      {sucursales.map((suc) => (
                        <option key={suc.id} value={suc.nombre}>
                          {suc.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Fecha */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700">Fecha de Emisión</label>
                    <input
                      type="date"
                      value={fechaCompra}
                      onChange={(e) => setFechaCompra(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#00346F] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Products Selector to add to purchase */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[#0B1C30]">Agregar Productos al Ingreso</h2>
                      <p className="text-[11px] text-slate-500">Selecciona los productos y su precio de compra</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Selector de Modo */}
                  <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
                    <button
                      type="button"
                      onClick={() => setProductSelectionMode('catalogo')}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                        productSelectionMode === 'catalogo'
                          ? 'bg-[#00346F] text-white shadow-md'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Layers className="h-4 w-4" />
                      1. Catálogo Maestro (Categoría ➔ Marca ➔ Modelo)
                      <span className="rounded-full bg-blue-500/30 px-2 py-0.5 text-[9px] font-black uppercase text-blue-100">
                        Recomendado
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductSelectionMode('almacen')}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                        productSelectionMode === 'almacen'
                          ? 'bg-[#00346F] text-white shadow-md'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Search className="h-4 w-4" />
                      2. Búsqueda Rápida en Catálogo Maestro
                    </button>
                  </div>

                  {productSelectionMode === 'catalogo' ? (
                    /* ─── MODO 1: CATÁLOGO MAESTRO JERÁRQUICO EN CASCADA ─── */
                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/30 p-4 space-y-4">
                      {/* PASO 1: CATEGORÍA */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-black text-white">1</span>
                            Seleccione Categoría Comercial:
                          </label>
                          {catFiltroCategoria && (
                            <button
                              type="button"
                              onClick={() => {
                                setCatFiltroCategoria('');
                                setCatFiltroMarca('');
                                setCatModeloSel(null);
                              }}
                              className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                            >
                              Ver todas
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {catCategorias.map((c) => {
                            const isSel = catFiltroCategoria === c.id;
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setCatFiltroCategoria(c.id);
                                  setCatFiltroMarca('');
                                  setCatModeloSel(null);
                                }}
                                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                                  isSel
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-indigo-50 hover:border-indigo-300'
                                }`}
                              >
                                {c.nombre}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* PASO 2: MARCA */}
                      {catFiltroCategoria && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-black text-white">2</span>
                              Seleccione Marca:
                            </label>
                            {catFiltroMarca && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCatFiltroMarca('');
                                  setCatModeloSel(null);
                                }}
                                className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                              >
                                Todas las marcas
                              </button>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {catMarcasFiltradas.length === 0 ? (
                              <p className="text-[11px] text-slate-400">No hay marcas asociadas a esta categoría.</p>
                            ) : (
                              catMarcasFiltradas.map((m) => {
                                const isSel = catFiltroMarca === m.id;
                                return (
                                  <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => {
                                      setCatFiltroMarca(m.id);
                                      setCatModeloSel(null);
                                    }}
                                    className={`rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                                      isSel
                                        ? 'bg-indigo-700 text-white shadow-xs'
                                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-indigo-50'
                                    }`}
                                  >
                                    {m.nombre}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}

                      {/* PASO 3: MODELOS DEL CATÁLOGO MAESTRO */}
                      {catFiltroCategoria && (
                        <div>
                          <label className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5 mb-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-black text-white">3</span>
                            Modelos Disponibles en Catálogo Maestro:
                          </label>
                          <div className="max-h-52 overflow-y-auto rounded-xl border border-indigo-200 bg-white p-2 space-y-1.5">
                            {catModelosFiltrados.length === 0 ? (
                              <p className="p-3 text-center text-xs text-slate-400">
                                No se encontraron modelos registrados en Catálogo Maestro para los filtros seleccionados.
                              </p>
                            ) : (
                              catModelosFiltrados.map((mo) => {
                                const prod = getProductoDeModelo(mo.id);
                                const isSel = catModeloSel?.id === mo.id;
                                const marcaNombre = mo.marcaNombre || catMarcas.find((m) => m.id === mo.marcaId)?.nombre || '';
                                return (
                                  <div
                                    key={mo.id}
                                    onClick={() => handleSelectModeloCatalogo(mo)}
                                    className={`flex cursor-pointer items-center justify-between rounded-xl p-2.5 transition-all ${
                                      isSel
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'hover:bg-indigo-50 border border-slate-100 text-slate-800'
                                    }`}
                                  >
                                    <div>
                                      <p className="font-bold text-xs">
                                        {marcaNombre} {mo.nombre}
                                      </p>
                                      {mo.descripcion && (
                                        <p className={`text-[10px] line-clamp-1 ${isSel ? 'text-indigo-100' : 'text-slate-500'}`}>
                                          {mo.descripcion}
                                        </p>
                                      )}
                                    </div>
                                    {prod && (
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                            isSel ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                                          }`}
                                        >
                                          ✔ En Almacén • Stock: {prod.stock}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* ─── MODO 2: BÚSQUEDA RÁPIDA EN CATÁLOGO MAESTRO ─── */
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700">
                          Buscar en Catálogo Maestro (Categoría, Marca o Modelo)
                        </label>
                        <div className="relative mt-1">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            value={searchProductQuery}
                            onChange={(e) => setSearchProductQuery(e.target.value)}
                            placeholder="Ej: Epson L3250, HP Smart Tank, ThinkPad, Monitor..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#00346F] focus:bg-white"
                          />
                        </div>
                      </div>

                      <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-1.5 space-y-1">
                        {availableCatalogModels.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400">
                            {searchProductQuery.trim()
                              ? `No se encontraron modelos en Catálogo Maestro para "${searchProductQuery}".`
                              : 'No hay modelos activos registrados en el Catálogo Maestro.'}
                          </div>
                        ) : (
                          availableCatalogModels.map((mo) => {
                            const marca = catMarcas.find((m) => m.id === mo.marcaId);
                            const categoria = catCategorias.find((c) => c.id === marca?.categoriaId);
                            const existente = getProductoDeModelo(mo.id);
                            const isSelected = catModeloSel?.id === mo.id;
                            const marcaNombre = marca?.nombre || '';
                            return (
                              <div
                                key={`cat-${mo.id}`}
                                onClick={() => handleSelectModeloCatalogo(mo)}
                                className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-xs transition-all ${
                                  isSelected
                                    ? 'bg-[#00346F] text-white shadow-xs'
                                    : 'bg-white hover:bg-indigo-50/60 text-slate-800 border border-slate-100'
                                }`}
                              >
                                <div className="pr-3">
                                  <p className="font-bold flex flex-wrap items-center gap-1.5">
                                    <span>{marcaNombre ? `${marcaNombre} ${mo.nombre}` : mo.nombre}</span>
                                    {categoria && (
                                      <span
                                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                          isSelected
                                            ? 'bg-blue-500/30 text-white'
                                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                        }`}
                                      >
                                        {categoria.nombre}
                                      </span>
                                    )}
                                    {existente ? (
                                      <span
                                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                          isSelected
                                            ? 'bg-emerald-500/30 text-emerald-100'
                                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        }`}
                                      >
                                        En almacén: {existente.stock} un.
                                      </span>
                                    ) : (
                                      <span
                                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                          isSelected
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-100 text-slate-600'
                                        }`}
                                      >
                                        Catálogo Maestro
                                      </span>
                                    )}
                                  </p>
                                  <p className={`text-[10px] line-clamp-1 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                                    {mo.descripcion || 'Modelo registrado en Catálogo Maestro'}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className={`text-[10px] font-bold ${isSelected ? 'text-blue-100' : 'text-indigo-600'}`}>
                                    Seleccionar ➔
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Producto heredado preseleccionado sin vínculo al catálogo */}
                      {selectedProductObj && !catModeloSel && (
                        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3">
                          <p className="text-xs font-bold text-[#00346F]">
                            Producto seleccionado: {selectedProductObj.nombre}
                          </p>
                          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600">Cantidad Comprada</label>
                              <input
                                type="number"
                                min="1"
                                value={itemCantidad}
                                onChange={(e) => setItemCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-black text-slate-800"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600">Costo Unit. Compra (S/)</label>
                              <input
                                type="number"
                                step="any"
                                min="0"
                                value={itemPrecioCosto === 0 ? '' : itemPrecioCosto}
                                onChange={(e) => setItemPrecioCosto(e.target.value)}
                                placeholder="0.00"
                                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-black text-slate-800"
                              />
                            </div>
                            <div className="flex items-end">
                              <button
                                type="button"
                                onClick={handleAddItemToCart}
                                className="w-full rounded-lg bg-[#00346F] px-4 py-2 text-xs font-bold text-white hover:bg-[#004A99] shadow-xs cursor-pointer"
                              >
                                + Agregar al Pedido
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                  {/* PASO 4 COMPARTIDO: CANTIDAD Y COSTO PACTADO DEL MODELO SELECCIONADO */}
                  {catModeloSel && (
                    <div className="rounded-xl border border-indigo-300 bg-white p-4 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div>
                          <span className="text-[10px] font-black uppercase text-indigo-600">
                            Cantidad y Costo Pactado
                          </span>
                          <h4 className="text-xs font-black text-slate-900">
                            {catMarcas.find((m) => m.id === catModeloSel.marcaId)?.nombre} {catModeloSel.nombre}
                          </h4>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          * El precio de venta se fijará al recepcionar la mercadería
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700">Cantidad a Pedir *</label>
                          <input
                            type="number"
                            min="1"
                            value={itemCantidad}
                            onChange={(e) => setItemCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-black text-slate-900 outline-none focus:border-indigo-600"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700">Costo Unit. Compra (S/) *</label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={itemPrecioCosto === 0 ? '' : itemPrecioCosto}
                            onChange={(e) => setItemPrecioCosto(e.target.value)}
                            placeholder="0.00"
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-black text-slate-900 outline-none focus:border-indigo-600"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700">Destino</label>
                          <select
                            value={catDestino}
                            onChange={(e) => setCatDestino(e.target.value as any)}
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                          >
                            <option value="VENTA">Venta Comercial Directa (POS)</option>
                            <option value="SERVICIO_TALLER">Uso Interno / Taller</option>
                            <option value="MIXTO">Mixto / Repuestos</option>
                          </select>
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            disabled={isCreatingFromCatalog}
                            onClick={handleAddModeloToOrder}
                            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-black text-white hover:bg-indigo-700 disabled:opacity-50 shadow-xs cursor-pointer"
                          >
                            {isCreatingFromCatalog ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            Agregar al Pedido
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-600">
                        <input
                          type="checkbox"
                          id="checkReqSerieCat"
                          checked={catRequiereSerie}
                          onChange={(e) => setCatRequiereSerie(e.target.checked)}
                          className="h-3.5 w-3.5 cursor-pointer"
                        />
                        <label htmlFor="checkReqSerieCat" className="cursor-pointer font-medium">
                          Exigir ingreso de números de serie físicos al recibir en almacén (Laptops, Impresoras, Monitores)
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right side: Cart Summary & Submit */}
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#00346F]">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#0B1C30]">Resumen de la Orden de Compra</h2>
                    <p className="text-[11px] text-slate-500">{cartItems.length} ítem(s) listos para ingresar</p>
                  </div>
                </div>
                {cartItems.length > 0 && (
                  <button
                    onClick={() => setCartItems([])}
                    className="text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Vaciar lista
                  </button>
                )}
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto min-h-[220px] max-h-[360px] space-y-2 border-b border-slate-100 pb-4">
                {cartItems.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center py-12 text-center text-slate-400">
                    <Package className="h-10 w-10 text-slate-300" />
                    <p className="mt-2 text-xs font-medium">No has agregado productos a esta compra todavía.</p>
                    <p className="text-[10px] text-slate-400">Selecciona un producto del catálogo para comenzar.</p>
                  </div>
                ) : (
                  cartItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 pr-3">
                          <p className="font-bold text-slate-800">{item.nombre}</p>
                          <p className="text-[11px] text-slate-500">
                            {item.cantidad} un. x S/ {item.precioCostoUnitario.toFixed(2)} | {item.marca}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-sm text-[#00346F]">
                            S/ {item.subtotal.toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Control de series para ingreso a almacén */}
                      {item.requiereSerie && (
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60">
                          {modoOperacion === 'RECEPCION_DIRECTA' ? (
                            <button
                              type="button"
                              onClick={() => handleOpenSeriesModal(index)}
                              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold border transition-colors cursor-pointer ${
                                (item.series?.length || 0) === item.cantidad
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  : 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                              }`}
                            >
                              <Barcode className="h-3.5 w-3.5" />
                              {(item.series?.length || 0) === item.cantidad
                                ? `✓ ${item.cantidad} series asignadas`
                                : `⚠️ Asignar series (${item.series?.length || 0}/${item.cantidad})`}
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200/60 px-2.5 py-1 text-[10px] font-bold text-[#00346F]">
                              <Barcode className="h-3 w-3 text-blue-600" />
                              Trazable por Serie • Se registrarán físicamente al recibir la mercadería
                            </span>
                          )}

                          {modoOperacion === 'RECEPCION_DIRECTA' && item.series && item.series.length > 0 && (
                            <span className="text-[10px] text-slate-500 truncate max-w-[280px]">
                              {item.series.join(', ')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Observaciones */}
              <div className="mt-4">
                <label className="block text-xs font-bold text-slate-700">Observaciones o Notas Internas</label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ej. Mercadería recibida conforme en sede central por el jefe de almacén..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 outline-none focus:border-[#00346F] focus:bg-white"
                />
              </div>

              {/* Financial Breakdown */}
              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal (Base):</span>
                  <span className="font-semibold">S/ {subtotalBase.toFixed(2)}</span>
                </div>
                {tipoComprobante === 'FACTURA' && (
                  <div className="flex justify-between text-slate-600">
                    <span>I.G.V. (18%):</span>
                    <span className="font-semibold">S/ {igvCalculado.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-[#00346F]">
                  <span>Total a Pagar:</span>
                  <span className="text-base">S/ {totalFinal.toFixed(2)}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleRegisterPurchase}
                disabled={cartItems.length === 0}
                className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-black uppercase tracking-wider text-white shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  modoOperacion === 'SOLICITADO'
                    ? 'bg-[#00346F] hover:bg-[#004A99] shadow-blue-900/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                }`}
              >
                {modoOperacion === 'SOLICITADO' ? (
                  <>
                    <Truck className="h-4 w-4" />
                    Emitir Orden de Pedido al Proveedor (En Tránsito)
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Registrar Recepción Directa e Incrementar Stock
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* --- TAB 2: HISTORIAL DE COMPRAS --- */}
        {activeTab === 'historial' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Pedidos en Tránsito (Solicitados)</p>
                <p className="mt-2 text-2xl font-black text-amber-700">{pedidosEnTransito}</p>
                <p className="mt-1 text-xs text-amber-700">Pendientes de recepción física en almacén</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Inversión Recepcionada</p>
                <p className="mt-2 text-2xl font-black text-[#00346F]">S/ {totalInvertido.toFixed(2)}</p>
                <p className="mt-1 text-xs text-slate-500">En equipos, repuestos y productos</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Unidades Ingresadas a Stock</p>
                <p className="mt-2 text-2xl font-black text-emerald-600">{totalItemsComprados} un.</p>
                <p className="mt-1 text-xs text-slate-500">Abastecidas para Ventas POS y Taller</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Proveedores Homologados</p>
                <p className="mt-2 text-2xl font-black text-indigo-600">{proveedores.filter(p => p.estado === 'ACTIVO').length}</p>
                <p className="mt-1 text-xs text-slate-500">Distribuidores mayoristas activos</p>
              </div>
            </div>

            {/* Filters bar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={historialSearch}
                  onChange={(e) => setHistorialSearch(e.target.value)}
                  placeholder="Buscar por código OC, N° factura, RUC o razón social del proveedor..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#00346F] focus:bg-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterEstadoPedido}
                  onChange={(e) => setFilterEstadoPedido(e.target.value as any)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-[#00346F] outline-none"
                >
                  <option value="ALL">⚡ Todos los Estados</option>
                  <option value="SOLICITADO">⏳ Pedidos Solicitados (En Tránsito)</option>
                  <option value="REGISTRADA">✅ Recibidos en Almacén (Stock OK)</option>
                  <option value="ANULADA">❌ Anulados</option>
                </select>

                {isGlobalAdmin ? (
                  <select
                    value={filterSede}
                    onChange={(e) => setFilterSede(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
                  >
                    <option value="ALL">Todas las Sedes</option>
                    {sucursales.map((s) => (
                      <option key={s.id} value={s.nombre}>{s.nombre}</option>
                    ))}
                  </select>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-[#00346F]">
                    <Store className="h-3.5 w-3.5" />
                    {assignedUserSucursal?.nombre || currentUser?.sucursalNombre || sucursalDestino}
                  </span>
                )}

                <select
                  value={filterProveedor}
                  onChange={(e) => setFilterProveedor(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="ALL">Todos los Proveedores</option>
                  {proveedores.map((p) => (
                    <option key={p.id} value={String(p.id)}>{p.razonSocial}</option>
                  ))}
                </select>

                <button
                  onClick={handleExportComprasCSV}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  Exportar CSV
                </button>
              </div>
            </div>

            {/* Purchases Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-600">
                    <tr>
                      <th className="px-5 py-3.5">Orden / Comprobante</th>
                      <th className="px-5 py-3.5">Proveedor Mayorista</th>
                      <th className="px-5 py-3.5">Fecha</th>
                      <th className="px-5 py-3.5">Sede Destino</th>
                      <th className="px-5 py-3.5">Ítems</th>
                      <th className="px-5 py-3.5 text-right">Total (S/)</th>
                      <th className="px-5 py-3.5 text-center">Estado Logístico</th>
                      <th className="px-5 py-3.5 text-right">Acciones de Almacén</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredCompras.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-slate-400">
                          No se encontraron órdenes de pedido o compras con los filtros seleccionados.
                        </td>
                      </tr>
                    ) : (
                      filteredCompras.map((compra) => {
                        const isAnulada = compra.estado === 'ANULADA';
                        const isSolicitado = compra.estado === 'SOLICITADO';
                        return (
                          <tr key={compra.id} className={`transition-colors ${isSolicitado ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-slate-50/70'}`}>
                            <td className="px-5 py-3.5">
                              <span className="font-mono font-bold text-[#00346F]">{compra.codigoComprobante}</span>
                              <span className="block text-[10px] text-slate-400">{compra.tipoComprobante}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <p className="font-semibold text-slate-800">{compra.proveedorRazonSocial}</p>
                              <p className="text-[10px] text-slate-400">RUC: {compra.proveedorRuc}</p>
                            </td>
                            <td className="px-5 py-3.5 text-slate-600">{compra.fecha}</td>
                            <td className="px-5 py-3.5">
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-[#00346F]">
                                <Store className="h-3 w-3" />
                                {compra.sucursalDestino}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 font-medium text-slate-600">
                              {compra.items.reduce((sum, it) => sum + it.cantidad, 0)} un. ({compra.items.length} prod.)
                            </td>
                            <td className="px-5 py-3.5 text-right font-black text-sm text-slate-900">
                              S/ {compra.total.toFixed(2)}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                  isAnulada
                                    ? 'bg-rose-100 text-rose-700'
                                    : isSolicitado
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                {isAnulada
                                  ? 'ANULADO'
                                  : isSolicitado
                                  ? '⏳ PEDIDO SOLICITADO (En Tránsito)'
                                  : '✅ RECIBIDO EN ALMACÉN'}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                {isSolicitado && !readOnly && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenReceptionModal(compra)}
                                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                                    title="Confirmar llegada física de mercadería al almacén e incrementar stock"
                                  >
                                    <Truck className="h-3.5 w-3.5" />
                                    Recepcionar en Almacén
                                  </button>
                                )}
                                {!isAnulada && (
                                  <button
                                    type="button"
                                    disabled={sendingOrderEmailId === compra.id}
                                    onClick={() => handleSendOrderEmail(compra)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1.5 text-[11px] font-bold text-[#00346F] hover:bg-blue-100 disabled:opacity-50"
                                    title="Enviar Orden de Pedido al Correo Oficial del Proveedor"
                                  >
                                    {sendingOrderEmailId === compra.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Mail className="h-3.5 w-3.5" />
                                    )}
                                    Enviar Orden
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setSelectedCompraDetail(compra);
                                    setIsDetailModalOpen(true);
                                  }}
                                  className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-[#EFF4FF] hover:text-[#00346F]"
                                  title="Ver detalle / Imprimir"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                {!isAnulada && !readOnly && (
                                  <button
                                    onClick={() => {
                                      const msg = isSolicitado
                                        ? `¿Estás seguro de cancelar el pedido en tránsito ${compra.codigoComprobante}?`
                                        : `¿Estás seguro de anular la recepción ${compra.codigoComprobante}? Se revertirá el stock ingresado a ${compra.sucursalDestino}.`;
                                      if (confirm(msg)) {
                                        onAnularCompra(compra.id);
                                      }
                                    }}
                                    className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                                    title={isSolicitado ? 'Cancelar pedido' : 'Anular compra y revertir stock'}
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 3: DIRECTORIO DE PROVEEDORES --- */}
        {activeTab === 'proveedores' && (
          <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <p className="text-xs text-slate-500">
                Empresas proveedoras registradas de componentes, equipos, partes para taller y accesorios ({proveedores.length})
              </p>
              <button
                type="button"
                onClick={handleOpenNewProveedor}
                className="flex items-center gap-2 rounded-xl bg-[#00346F] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#004A99] cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Registrar Nuevo Proveedor
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {proveedores.map((prov) => (
                <div
                  key={prov.id}
                  className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#00346F]">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        prov.estado === 'ACTIVO'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {prov.estado}
                    </span>
                  </div>

                  <h3 className="mt-3 font-bold text-sm text-slate-900 line-clamp-1">{prov.razonSocial}</h3>
                  <p className="text-xs font-semibold text-[#00346F]">RUC: {prov.ruc}</p>

                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                    {prov.contacto && (
                      <p className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span>{prov.contacto}</span>
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{prov.telefono}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span className="truncate">{prov.email}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span className="truncate">{prov.direccion}</span>
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                    <button
                      type="button"
                      onClick={() => handleEditProveedor(prov)}
                      className="font-bold text-[#00346F] hover:underline"
                    >
                      Editar datos
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleProveedorEstado(prov.id)}
                      className="text-slate-500 hover:text-slate-700 font-medium"
                    >
                      {prov.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL DETALLE / IMPRESIÓN DE COMPRA --- */}
      {isDetailModalOpen && selectedCompraDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Printable Area */}
            <div id="print-compra-area">
              <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                  <span className="inline-block rounded-md bg-[#00346F] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                    MG Solutions - Nota de Ingreso a Almacén
                  </span>
                  <h3 className="mt-1 text-xl font-black text-[#0B1C30]">
                    {selectedCompraDetail.tipoComprobante}: {selectedCompraDetail.codigoComprobante}
                  </h3>
                  <p className="text-xs text-slate-500">Fecha de registro: {selectedCompraDetail.fecha}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-700">Sede Destino:</p>
                  <p className="text-xs font-black text-[#00346F]">{selectedCompraDetail.sucursalDestino}</p>
                </div>
              </div>

              {/* Proveedor Info */}
              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs">
                <p className="font-bold text-slate-800">Proveedor: {selectedCompraDetail.proveedorRazonSocial}</p>
                <p className="text-slate-600">RUC: {selectedCompraDetail.proveedorRuc}</p>
                <p className="text-slate-500">Registrado por: {selectedCompraDetail.compradorNombre}</p>
              </div>

              {/* Items Table */}
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-bold uppercase text-slate-600">
                    <tr>
                      <th className="px-3 py-2">Código</th>
                      <th className="px-3 py-2">Descripción del Producto</th>
                      <th className="px-3 py-2 text-center">Cant.</th>
                      <th className="px-3 py-2 text-right">Costo Unit.</th>
                      <th className="px-3 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedCompraDetail.items.map((item, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-mono text-slate-500">{item.codigo}</td>
                        <td className="px-3 py-2 font-semibold text-slate-800">{item.nombre}</td>
                        <td className="px-3 py-2 text-center font-bold">{item.cantidad}</td>
                        <td className="px-3 py-2 text-right">S/ {item.precioCostoUnitario.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-black text-[#00346F]">S/ {item.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Total */}
              <div className="mt-4 flex justify-between items-center text-xs">
                <div>
                  {selectedCompraDetail.observaciones && (
                    <p className="text-slate-500 italic max-w-sm">
                      Nota: {selectedCompraDetail.observaciones}
                    </p>
                  )}
                </div>
                <div className="rounded-xl bg-[#EFF4FF] p-3 text-right">
                  <span className="block text-[11px] font-bold text-slate-600">Total Ingreso:</span>
                  <span className="text-xl font-black text-[#00346F]">
                    S/ {selectedCompraDetail.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-xl bg-[#00346F] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#004A99]"
              >
                <Printer className="h-4 w-4" />
                Imprimir Comprobante
              </button>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL CREAR / EDITAR PROVEEDOR --- */}
      {isProveedorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => setIsProveedorModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF4FF] text-[#00346F]">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#0B1C30]">
                  {editingProveedor ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}
                </h3>
                <p className="text-xs text-slate-500">Datos fiscales y de contacto mayorista</p>
              </div>
            </div>

            <form onSubmit={handleSaveProveedorSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700">RUC (11 dígitos)</label>
                  <div className="mt-1 flex gap-1.5">
                    <input
                      type="text"
                      maxLength={11}
                      value={proveedorForm.ruc}
                      onChange={(e) => setProveedorForm({ ...proveedorForm, ruc: e.target.value.replace(/\D/g, '') })}
                      placeholder="Ej. 20100154308"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#00346F] focus:bg-white"
                      required
                    />
                    <button
                      type="button"
                      disabled={isQueryingRuc}
                      onClick={handleConsultarRucProveedor}
                      className="shrink-0 rounded-xl bg-[#00346F] px-3 py-2 text-[11px] font-bold text-white hover:bg-[#004A99] disabled:opacity-50"
                      title="Consultar RUC en SUNAT"
                    >
                      {isQueryingRuc ? '...' : 'SUNAT'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={9}
                    value={proveedorForm.telefono}
                    onChange={(e) => setProveedorForm({ ...proveedorForm, telefono: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                    placeholder="974812390"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#00346F] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Razón Social</label>
                <input
                  type="text"
                  value={proveedorForm.razonSocial}
                  onChange={(e) => setProveedorForm({ ...proveedorForm, razonSocial: e.target.value })}
                  placeholder="Ej. GRUPO DELTRON S.A."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold uppercase text-slate-800 outline-none focus:border-[#00346F] focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Persona de Contacto / Ejecutivo</label>
                <input
                  type="text"
                  value={proveedorForm.contacto}
                  onChange={(e) => setProveedorForm({ ...proveedorForm, contacto: e.target.value })}
                  placeholder="Ej. Carlos Mendoza (Ejecutivo de Ventas)"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#00346F] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Correo Electrónico</label>
                <input
                  type="email"
                  value={proveedorForm.email}
                  onChange={(e) => setProveedorForm({ ...proveedorForm, email: e.target.value })}
                  placeholder="ventas@proveedor.com.pe"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#00346F] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Dirección Fiscal / Almacén</label>
                <input
                  type="text"
                  value={proveedorForm.direccion}
                  onChange={(e) => setProveedorForm({ ...proveedorForm, direccion: e.target.value })}
                  placeholder="Ej. Av. Nicolás Arriola 314, La Victoria, Lima"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#00346F] focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsProveedorModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#00346F] px-5 py-2 text-xs font-bold text-white hover:bg-[#004A99]"
                >
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL DE ASIGNACIÓN DE SERIES PARA ALMACÉN */}
      {seriesModalItemIndex !== null && activeSeriesItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-[#00346F] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
                  <Barcode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Series Físicas para Almacén</h3>
                  <p className="text-[11px] text-blue-200 truncate max-w-[320px]">
                    {activeSeriesItem.nombre}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSeriesModalItemIndex(null)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-header / Progress */}
            <div className="bg-blue-50/70 border-b border-blue-100 p-3.5 px-5 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-[#00346F]">Cantidad requerida: </span>
                <span className="font-black text-slate-800">{activeSeriesItem.cantidad} unidades</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                  (activeSeriesItem.series?.length || 0) === activeSeriesItem.cantidad
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {activeSeriesItem.series?.length || 0} de {activeSeriesItem.cantidad} ingresadas
                </span>
              </div>
            </div>

            {/* Mode switch */}
            <div className="p-5 pb-0 flex gap-2">
              <button
                type="button"
                onClick={() => setIsBulkMode(false)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  !isBulkMode
                    ? 'bg-[#00346F] text-white border-[#00346F]'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Pistoleo / Uno por Uno
              </button>
              <button
                type="button"
                onClick={() => setIsBulkMode(true)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  isBulkMode
                    ? 'bg-[#00346F] text-white border-[#00346F]'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Pegar Lote / Múltiples
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {!isBulkMode ? (
                <form onSubmit={handleAddSingleSerie} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      autoFocus
                      value={currentInputSerie}
                      onChange={(e) => setCurrentInputSerie(e.target.value.toUpperCase())}
                      placeholder="Escanear con pistola o escribir serie..."
                      className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold uppercase rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-[#00346F] outline-none"
                    />
                    <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                  <button
                    type="submit"
                    disabled={!currentInputSerie.trim() || (activeSeriesItem.series?.length || 0) >= activeSeriesItem.cantidad}
                    className="px-4 py-2 bg-[#00346F] hover:bg-[#004A99] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Agregar
                  </button>
                </form>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 block">
                    Pegar series (una por línea o separadas por comas):
                  </label>
                  <textarea
                    rows={4}
                    value={bulkSeriesInput}
                    onChange={(e) => setBulkSeriesInput(e.target.value.toUpperCase())}
                    placeholder={`SN-${activeSeriesItem.marca}-001\nSN-${activeSeriesItem.marca}-002`}
                    className="w-full p-2.5 text-xs font-mono rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-[#00346F] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyBulkSeries}
                    className="w-full py-2 bg-[#00346F] hover:bg-[#004A99] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cargar Lista de Series
                  </button>
                </div>
              )}



              {/* Lista de series ingresadas */}
              <div>
                <p className="text-xs font-bold text-slate-700 mb-2">
                  Series Registradas ({activeSeriesItem.series?.length || 0}):
                </p>
                {(!activeSeriesItem.series || activeSeriesItem.series.length === 0) ? (
                  <div className="py-6 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                    No se han ingresado números de serie todavía.
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {activeSeriesItem.series.map((s, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono"
                      >
                        <span className="font-bold text-slate-800">
                          #{idx + 1}. {s}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSerie(idx)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSeriesModalItemIndex(null)}
                className="px-4 py-2 bg-[#00346F] hover:bg-[#004A99] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Listo / Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE RECEPCIÓN FÍSICA Y CONTROL DE CALIDAD EN ALMACÉN --- */}
      {receivingCompra && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-emerald-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-200">
                    Paso 2: Verificación Física y Alta en Kardex
                  </span>
                  <h3 className="font-black text-base">
                    Recepcionar Pedido en Almacén ({receivingCompra.codigoComprobante})
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReceivingCompra(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReception} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-emerald-900">
                <p className="font-bold">
                  Proveedor: {receivingCompra.proveedorRazonSocial} (RUC: {receivingCompra.proveedorRuc})
                </p>
                <p className="mt-0.5 text-[11px] text-emerald-700">
                  Sede receptora de stock: <strong>{receivingCompra.sucursalDestino}</strong> • Al confirmar esta recepción se incrementará el stock real para <strong>Ventas POS</strong> y <strong>Taller Técnico</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    N° Factura / Guía de Remisión del Proveedor *
                  </label>
                  <input
                    type="text"
                    required
                    value={recepcionComprobante}
                    onChange={(e) => setRecepcionComprobante(e.target.value.toUpperCase())}
                    placeholder="Ej. F001-004825"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono font-bold uppercase text-slate-800 focus:border-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Conformidad / Observación de Almacén
                  </label>
                  <input
                    type="text"
                    value={recepcionObs}
                    onChange={(e) => setRecepcionObs(e.target.value)}
                    placeholder="Mercadería verificada conforme..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Productos y Series Físicas por Ingresar al Almacén:
                </p>
                {receivingCompra.items.map((it) => {
                  const seriesList = recepcionSeriesMap[it.productoId] || [];
                  const costo = Number(it.precioCostoUnitario || 0);
                  const ventaStr = recepcionPreciosVentaMap[it.productoId] || '';
                  const ventaNum = parseFloat(ventaStr) || 0;
                  const ganancia = ventaNum > costo ? ventaNum - costo : 0;
                  const margenPct = ventaNum > 0 && costo > 0 ? ((ventaNum - costo) / ventaNum) * 100 : 0;

                  return (
                    <div key={it.productoId} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">{it.codigo || 'SIN-COD'}</span>
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">{it.categoria || 'Equipo'}</span>
                          </div>
                          <p className="font-black text-slate-900 text-sm mt-0.5">{it.nombre}</p>
                          <p className="text-[11px] text-slate-500">
                            Costo de compra pactado: <strong className="text-slate-800">S/ {costo.toFixed(2)}</strong> c/u
                          </p>
                        </div>
                        <span className="rounded-xl bg-[#00346F] px-3 py-1.5 text-xs font-black text-white shadow-xs">
                          +{it.cantidad} un.
                        </span>
                      </div>

                      {/* Fijación de Precio de Venta al Público (PVP) */}
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 bg-white p-3 rounded-xl border border-slate-200">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Precio de Venta Comercial (PVP) (S/) *
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            required
                            value={ventaStr}
                            onChange={(e) => {
                              const val = e.target.value;
                              setRecepcionPreciosVentaMap((prev) => ({ ...prev, [it.productoId]: val }));
                            }}
                            placeholder="Ej. 3199.00"
                            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-black text-emerald-700 outline-none focus:border-emerald-600"
                          />
                        </div>
                        <div className="flex flex-col justify-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Margen Comercial Estimado</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs font-black ${margenPct > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>
                              {margenPct > 0 ? `+${margenPct.toFixed(1)}%` : '0.0%'}
                            </span>
                            {ganancia > 0 && (
                              <span className="text-[10px] font-semibold text-slate-500">
                                (Ganancia: S/ {ganancia.toFixed(2)} por unidad)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Ingreso de Series Físicas para Equipos Seriados */}
                      {it.requiereSerie && (
                        <div className="rounded-xl border border-blue-200 bg-white p-3.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#00346F] flex items-center gap-1.5 text-xs">
                              <Barcode className="w-4 h-4 text-blue-600" />
                              Series Físicas Recibidas ({seriesList.length}/{it.cantidad}):
                            </span>

                          </div>
                          <p className="text-[10px] text-slate-500">
                            Escanee el código de barras de cada caja o digite las series separadas por salto de línea.
                          </p>
                          <textarea
                            rows={Math.min(4, Math.max(2, it.cantidad))}
                            value={recepcionBulkTextMap[it.productoId] || ''}
                            onChange={(e) => {
                              const raw = e.target.value.toUpperCase();
                              setRecepcionBulkTextMap((prev) => ({ ...prev, [it.productoId]: raw }));
                              const parsed = Array.from(
                                new Set(
                                  raw
                                    .split(/[\n,;]+/)
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                                )
                              ).slice(0, it.cantidad);
                              setRecepcionSeriesMap((prev) => ({ ...prev, [it.productoId]: parsed }));
                            }}
                            placeholder={`Escanee o ingrese las ${it.cantidad} series físicas aquí...`}
                            className="w-full rounded-lg border border-slate-300 p-2 font-mono text-xs text-slate-800 outline-none focus:border-blue-600"
                          />
                          <div className="flex items-center justify-between text-[10px]">
                            <span className={seriesList.length >= it.cantidad ? 'font-bold text-emerald-600' : 'font-bold text-amber-600'}>
                              {seriesList.length >= it.cantidad
                                ? '✔ Todas las series requeridas han sido ingresadas'
                                : `Faltan ${it.cantidad - seriesList.length} series por ingresar`}
                            </span>
                            <span className="text-slate-400">Total a ingresar: {it.cantidad}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}</div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setReceivingCompra(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRecepcion}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-black text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isSubmittingRecepcion ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Ingresando a Stock...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Confirmar Recepción e Incrementar Stock
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
