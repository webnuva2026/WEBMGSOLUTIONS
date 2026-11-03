import React, { useState, useMemo } from 'react';
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
}) => {
  const [activeTab, setActiveTab] = useState<'nueva' | 'historial' | 'proveedores'>('nueva');

  // --- NUEVA COMPRA STATE ---
  const [selectedProveedorId, setSelectedProveedorId] = useState<number | ''>(proveedores[0]?.id || '');
  const [tipoComprobante, setTipoComprobante] = useState<'FACTURA' | 'BOLETA' | 'GUIA_REMISION'>('FACTURA');
  const [serieNumero, setSerieNumero] = useState('');
  const [sucursalDestino, setSucursalDestino] = useState<string>(
    sucursales[0]?.nombre || 'Principal - Chiclayo Centro'
  );
  const [fechaCompra, setFechaCompra] = useState<string>(new Date().toISOString().slice(0, 10));
  const [observaciones, setObservaciones] = useState('');
  const [cartItems, setCartItems] = useState<ItemCompra[]>([]);

  // Item selector in form
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [itemCantidad, setItemCantidad] = useState<number>(1);
  const [itemPrecioCosto, setItemPrecioCosto] = useState<number | string>(0);


  // Modal Compra Detalle / Imprimir
  const [selectedCompraDetail, setSelectedCompraDetail] = useState<Compra | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

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

    // Check if already in cart
    const existingIndex = cartItems.findIndex((item) => item.productoId === selectedProductObj.id);
    if (existingIndex >= 0) {
      const updated = [...cartItems];
      updated[existingIndex].cantidad += itemCantidad;
      updated[existingIndex].precioCostoUnitario = costoNum;
      updated[existingIndex].subtotal = updated[existingIndex].cantidad * costoNum;
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

  // Financial totals for the purchase
  const totalBruto = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cartItems]);

  const subtotalBase = tipoComprobante === 'FACTURA' ? Number((totalBruto / 1.18).toFixed(2)) : totalBruto;
  const igvCalculado = tipoComprobante === 'FACTURA' ? Number((totalBruto - subtotalBase).toFixed(2)) : 0;
  const totalFinal = totalBruto;

  const handleRegisterPurchase = () => {
    if (!selectedProveedorObj) {
      onShowToast('Falta proveedor', 'Selecciona el proveedor que emitió el comprobante.', 'error');
      return;
    }
    if (!serieNumero.trim()) {
      onShowToast('Falta número', 'Ingresa el número de serie y correlativo del comprobante (ej: F001-002849).', 'error');
      return;
    }
    if (cartItems.length === 0) {
      onShowToast('Orden vacía', 'Agrega al menos un producto a la compra para ingresar a stock.', 'error');
      return;
    }

    const newCompra: Compra = {
      id: Date.now(),
      codigoComprobante: serieNumero.toUpperCase().trim(),
      tipoComprobante,
      proveedorId: selectedProveedorObj.id,
      proveedorRuc: selectedProveedorObj.ruc,
      proveedorRazonSocial: selectedProveedorObj.razonSocial,
      sucursalDestino,
      compradorId: currentUser.id,
      compradorNombre: currentUser.nombreCompleto,
      fecha: `${fechaCompra} ${new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`,
      items: cartItems,
      subtotal: subtotalBase,
      igv: igvCalculado,
      total: totalFinal,
      estado: 'REGISTRADA',
      observaciones: observaciones.trim() || undefined,
    };

    onSaveCompra(newCompra);
    onShowToast(
      'Compra Registrada',
      `Factura ${newCompra.codigoComprobante} guardada. El stock en ${sucursalDestino} fue incrementado.`,
      'success'
    );

    // Open detail modal to review / print
    setSelectedCompraDetail(newCompra);
    setIsDetailModalOpen(true);

    // Reset form
    setCartItems([]);
    setSerieNumero('');
    setObservaciones('');
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

  // Filtered purchases history
  const filteredCompras = useMemo(() => {
    return compras.filter((c) => {
      const matchSearch =
        !historialSearch ||
        c.codigoComprobante.toLowerCase().includes(historialSearch.toLowerCase()) ||
        c.proveedorRazonSocial.toLowerCase().includes(historialSearch.toLowerCase()) ||
        c.proveedorRuc.includes(historialSearch);

      const matchSede = filterSede === 'ALL' || c.sucursalDestino === filterSede;
      const matchProv = filterProveedor === 'ALL' || String(c.proveedorId) === filterProveedor;

      return matchSearch && matchSede && matchProv;
    });
  }, [compras, historialSearch, filterSede, filterProveedor]);

  // Metric stats
  const totalInvertido = compras
    .filter((c) => c.estado === 'REGISTRADA')
    .reduce((sum, c) => sum + c.total, 0);
  const totalItemsComprados = compras
    .filter((c) => c.estado === 'REGISTRADA')
    .reduce((sum, c) => sum + c.items.reduce((acc, it) => acc + it.cantidad, 0), 0);

  // Products filtered for the purchase selector
  const availableProducts = useMemo(() => {
    if (!searchProductQuery.trim()) return productos.slice(0, 10);
    const q = searchProductQuery.toLowerCase();
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.codigo.toLowerCase().includes(q) ||
        p.marcaNombre.toLowerCase().includes(q)
    );
  }, [productos, searchProductQuery]);

  const handleExportComprasCSV = () => {
    const csv =
      'data:text/csv;charset=utf-8,' +
      'ID,Comprobante,Tipo,RUC,Proveedor,SedeDestino,Fecha,Total,Estado\n' +
      compras
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
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-[#00346F]">
                <Truck className="h-3.5 w-3.5" />
                Módulo de Abastecimiento (RF-09)
              </span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                Sedes Chiclayo
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-[#0B1C30] md:text-3xl">
              Compras, Ingreso de Mercadería & Proveedores
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Registra facturas de proveedores, abastece almacén y actualiza costos y existencias por sede.
            </p>
          </div>

          {/* Tab Navigation buttons */}
          <div className="flex items-center gap-2 rounded-xl bg-slate-200/70 p-1">
            <button
              onClick={() => setActiveTab('nueva')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                activeTab === 'nueva'
                  ? 'bg-white text-[#00346F] shadow-sm'
                  : 'text-slate-600 hover:text-[#00346F]'
              }`}
            >
              <Plus className="h-4 w-4" />
              Nueva Compra
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
              Historial ({compras.length})
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

        {/* --- TAB 1: REGISTRAR NUEVA COMPRA --- */}
        {activeTab === 'nueva' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Left side: Invoice & Items Picker */}
            <div className="space-y-6">
              {/* Document Header Form */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EFF4FF] text-[#00346F]">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[#0B1C30]">Datos del Comprobante</h2>
                      <p className="text-[11px] text-slate-500">Información del proveedor y factura de compra</p>
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
                    <label className="block text-xs font-bold text-slate-700">Proveedor</label>
                    <select
                      value={selectedProveedorId}
                      onChange={(e) => setSelectedProveedorId(Number(e.target.value))}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-[#00346F] focus:bg-white"
                    >
                      {proveedores.map((prov) => (
                        <option key={prov.id} value={prov.id}>
                          {prov.ruc} - {prov.razonSocial}
                        </option>
                      ))}
                    </select>
                    {selectedProveedorObj && (
                      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {selectedProveedorObj.telefono}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {selectedProveedorObj.direccion}</span>
                      </div>
                    )}
                  </div>

                  {/* Tipo de Comprobante */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700">Tipo de Documento</label>
                    <select
                      value={tipoComprobante}
                      onChange={(e) => setTipoComprobante(e.target.value as any)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#00346F] focus:bg-white"
                    >
                      <option value="FACTURA">FACTURA ELECTRÓNICA (con IGV)</option>
                      <option value="BOLETA">BOLETA DE VENTA</option>
                      <option value="GUIA_REMISION">GUÍA DE REMISIÓN</option>
                    </select>
                  </div>

                  {/* Serie y Número */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700">N° Comprobante / Factura</label>
                    <input
                      type="text"
                      value={serieNumero}
                      onChange={(e) => setSerieNumero(e.target.value)}
                      placeholder="Ej. F001-004819"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold uppercase text-slate-800 outline-none focus:border-[#00346F] focus:bg-white"
                    />
                  </div>

                  {/* Sede Destino */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700">Sede Destino (Aumento de stock)</label>
                    <select
                      value={sucursalDestino}
                      onChange={(e) => setSucursalDestino(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#00346F] focus:bg-white"
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

                <div className="space-y-3">
                  {/* Search product */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700">Buscar en Catálogo de MG Solutions</label>
                    <div className="relative mt-1">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={searchProductQuery}
                        onChange={(e) => setSearchProductQuery(e.target.value)}
                        placeholder="Escribe el nombre, código o marca del producto..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#00346F] focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Product options list */}
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-1.5 space-y-1">
                    {availableProducts.map((prod) => {
                      const isSelected = selectedProductId === prod.id;
                      return (
                        <div
                          key={prod.id}
                          onClick={() => handleSelectProduct(prod.id)}
                          className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-xs transition-all ${
                            isSelected
                              ? 'bg-[#00346F] text-white shadow-xs'
                              : 'hover:bg-white text-slate-800'
                          }`}
                        >
                          <div>
                            <p className="font-bold">{prod.nombre}</p>
                            <p className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                              Código: {prod.codigo} | Marca: {prod.marcaNombre} | Stock actual: {prod.stock} un.
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-xs">Costo act: S/ {prod.precioCosto.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quantity and unit cost inputs */}
                  {selectedProductObj && (
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
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => setItemPrecioCosto(e.target.value)}
                            placeholder="0.00"
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-black text-slate-800 focus:border-[#00346F] focus:outline-none"
                          />

                        </div>
                        <div className="flex flex-col justify-end">
                          <button
                            type="button"
                            onClick={handleAddItemToCart}
                            className="flex items-center justify-center gap-1.5 rounded-lg bg-[#00346F] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#004A99]"
                          >
                            <Plus className="h-4 w-4" />
                            Agregar a Orden
                          </button>
                        </div>
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
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs"
                    >
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
                          className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="h-4 w-4" />
                Registrar Compra e Incrementar Stock
              </button>
            </div>
          </div>
        )}

        {/* --- TAB 2: HISTORIAL DE COMPRAS --- */}
        {activeTab === 'historial' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Inversión Total Registrada</p>
                <p className="mt-2 text-2xl font-black text-[#00346F]">S/ {totalInvertido.toFixed(2)}</p>
                <p className="mt-1 text-xs text-slate-500">En repuestos y productos</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Unidades Abastecidas</p>
                <p className="mt-2 text-2xl font-black text-emerald-600">{totalItemsComprados} un.</p>
                <p className="mt-1 text-xs text-slate-500">Ingresadas a inventario</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Comprobantes Registrados</p>
                <p className="mt-2 text-2xl font-black text-slate-800">{compras.length}</p>
                <p className="mt-1 text-xs text-slate-500">Facturas, boletas y guías</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Proveedores Activos</p>
                <p className="mt-2 text-2xl font-black text-indigo-600">{proveedores.filter(p => p.estado === 'ACTIVO').length}</p>
                <p className="mt-1 text-xs text-slate-500">Distribuidores mayoristas</p>
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
                  placeholder="Buscar por N° factura, RUC o razón social del proveedor..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#00346F] focus:bg-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
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
                      <th className="px-5 py-3.5">Comprobante</th>
                      <th className="px-5 py-3.5">Proveedor</th>
                      <th className="px-5 py-3.5">Fecha</th>
                      <th className="px-5 py-3.5">Sede Destino</th>
                      <th className="px-5 py-3.5">Ítems</th>
                      <th className="px-5 py-3.5 text-right">Total (S/)</th>
                      <th className="px-5 py-3.5 text-center">Estado</th>
                      <th className="px-5 py-3.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredCompras.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-slate-400">
                          No se encontraron compras con los filtros seleccionados.
                        </td>
                      </tr>
                    ) : (
                      filteredCompras.map((compra) => {
                        const isAnulada = compra.estado === 'ANULADA';
                        return (
                          <tr key={compra.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-5 py-3.5">
                              <span className="font-bold text-[#00346F]">{compra.codigoComprobante}</span>
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
                                className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                  isAnulada
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                {compra.estado}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
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
                                      if (confirm(`¿Estás seguro de anular la compra ${compra.codigoComprobante}? Se revertirá el stock ingresado a ${compra.sucursalDestino}.`)) {
                                        onAnularCompra(compra.id);
                                        onShowToast('Compra Anulada', `La compra ${compra.codigoComprobante} fue anulada y el stock revertido.`, 'warning');
                                      }
                                    }}
                                    className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                                    title="Anular compra"
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
              <div>
                <h2 className="text-lg font-bold text-[#0B1C30]">Directorio de Proveedores Mayoristas</h2>
                <p className="text-xs text-slate-500">Empresas proveedoras de componentes, partes para taller y accesorios</p>
              </div>
              <button
                type="button"
                onClick={handleOpenNewProveedor}
                className="flex items-center gap-2 rounded-xl bg-[#00346F] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#004A99]"
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
                  <input
                    type="text"
                    maxLength={11}
                    value={proveedorForm.ruc}
                    onChange={(e) => setProveedorForm({ ...proveedorForm, ruc: e.target.value.replace(/\D/g, '') })}
                    placeholder="Ej. 20100154308"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#00346F] focus:bg-white"
                    required
                  />
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
    </div>
  );
};
