import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  Receipt,
  User,
  CreditCard,
  Banknote,
  QrCode,
  Building,
  CheckCircle2,
  Laptop,
  Printer as PrinterIcon,
  HardDrive,
  Cpu,
  Package,
  X,
  History,
  Tag,
  Store,
  ChevronDown,
  UserPlus,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';
import {
  Producto,
  Cliente,
  Sucursal,
  EmpresaConfig,
  Usuario,
  Venta,
  ItemVenta,
  TipoComprobante,
  MetodoPago,
} from '../types';

interface SalesPOSViewProps {
  currentUser: Usuario;
  productos: Producto[];
  clientes: Cliente[];
  sucursales: Sucursal[];
  empresa: EmpresaConfig;
  ventas: Venta[];
  onSaveVenta: (venta: Venta) => void;
  onUpdateProductoStock: (productoId: number, delta: number) => void;
  onSaveCliente?: (cliente: Cliente) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  setActiveView: (view: string) => void;
}

export const SalesPOSView: React.FC<SalesPOSViewProps> = ({
  currentUser,
  productos,
  clientes,
  sucursales,
  empresa,
  ventas,
  onSaveVenta,
  onUpdateProductoStock,
  onSaveCliente,
  onShowToast,
  setActiveView,
}) => {
  // Navigation tabs within sales: POS vs History
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');

  // Filters & Product Search
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [selectedBrand, setSelectedBrand] = useState<string>('TODAS');
  const [activeSucursalNombre, setActiveSucursalNombre] = useState<string>(
    sucursales[0]?.nombre || 'Principal - Chiclayo Centro'
  );

  // Cart State
  const [cart, setCart] = useState<ItemVenta[]>([]);

  // Checkout State
  const [tipoComprobante, setTipoComprobante] = useState<TipoComprobante>('BOLETA');
  const [isConsumidorFinal, setIsConsumidorFinal] = useState<boolean>(true);
  const [selectedClientId, setSelectedClientId] = useState<number | undefined>(clientes[0]?.id);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [isClientSearchOpen, setIsClientSearchOpen] = useState(false);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO');
  const [montoRecibido, setMontoRecibido] = useState<string>('');
  const [descuentoGlobal, setDescuentoGlobal] = useState<number>(0);

  // Modal State for Generated Receipt
  const [completedVenta, setCompletedVenta] = useState<Venta | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Quick Client Modal
  const [isQuickClientOpen, setIsQuickClientOpen] = useState(false);
  const [quickClientForm, setQuickClientForm] = useState({
    tipoDocumento: 'DNI' as 'DNI' | 'RUC',
    numeroDocumento: '',
    razonSocial: '',
    telefono: '',
    email: '',
    direccionFiscal: '',
  });

  // History Filter
  const [historySearch, setHistorySearch] = useState('');

  // Selected client object
  const selectedClient = clientes.find((c) => c.id === selectedClientId);

  // Extract unique categories and brands from products
  const categoriesList = useMemo(() => {
    const set = new Set(productos.map((p) => p.categoriaNombre).filter(Boolean));
    return ['TODAS', ...Array.from(set)];
  }, [productos]);

  const brandsList = useMemo(() => {
    const set = new Set(productos.map((p) => p.marcaNombre).filter(Boolean));
    return ['TODAS', ...Array.from(set)];
  }, [productos]);

  // Filtered Products for Catalog
  const filteredProducts = useMemo(() => {
    return productos.filter((p) => {
      if (p.estado !== 'ACTIVO') return false;

      // Category filter
      if (selectedCategory !== 'TODAS' && p.categoriaNombre !== selectedCategory) {
        return false;
      }

      // Brand filter
      if (selectedBrand !== 'TODAS' && p.marcaNombre !== selectedBrand) {
        return false;
      }

      // Search term
      if (searchProductQuery.trim()) {
        const q = searchProductQuery.toLowerCase().trim();
        const matchName = p.nombre.toLowerCase().includes(q);
        const matchCode = p.codigo.toLowerCase().includes(q);
        const matchBar = p.codigoBarra ? p.codigoBarra.includes(q) : false;
        if (!matchName && !matchCode && !matchBar) return false;
      }

      return true;
    });
  }, [productos, selectedCategory, selectedBrand, searchProductQuery]);

  // Financial calculations
  const totalBruto = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalNeto = Math.max(0, totalBruto - descuentoGlobal);
  const subtotalBase = totalNeto / 1.18;
  const igvCalculado = totalNeto - subtotalBase;

  const montoRecibidoNum = parseFloat(montoRecibido) || 0;
  const vueltoCalculado = Math.max(0, montoRecibidoNum - totalNeto);

  // Cart operations
  const handleAddToCart = (product: Producto) => {
    if (product.stock <= 0) {
      onShowToast('Sin existencias', `El producto ${product.nombre} no tiene stock disponible.`, 'warning');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productoId === product.id);
      if (existing) {
        if (existing.cantidad >= product.stock) {
          onShowToast('Stock límite', `No puede agregar más de ${product.stock} unidades en stock.`, 'warning');
          return prev;
        }
        return prev.map((item) =>
          item.productoId === product.id
            ? {
                ...item,
                cantidad: item.cantidad + 1,
                subtotal: (item.cantidad + 1) * item.precioUnitario,
              }
            : item
        );
      } else {
        const newItem: ItemVenta = {
          productoId: product.id,
          codigo: product.codigo,
          nombre: product.nombre,
          categoria: product.categoriaNombre,
          marca: product.marcaNombre,
          precioUnitario: product.precioUnitario,
          cantidad: 1,
          subtotal: product.precioUnitario,
        };
        return [...prev, newItem];
      }
    });
    onShowToast('Producto añadido', `${product.nombre} se agregó al carrito de venta.`, 'info');
  };

  const handleUpdateQuantity = (productoId: number, delta: number) => {
    const prod = productos.find((p) => p.id === productoId);
    if (!prod) return;

    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productoId === productoId) {
            const nuevaCantidad = item.cantidad + delta;
            if (nuevaCantidad <= 0) return null;
            if (nuevaCantidad > prod.stock) {
              onShowToast('Stock máximo alcanzado', `Solo hay ${prod.stock} unidades en almacén.`, 'warning');
              return item;
            }
            return {
              ...item,
              cantidad: nuevaCantidad,
              subtotal: nuevaCantidad * item.precioUnitario,
            };
          }
          return item;
        })
        .filter(Boolean) as ItemVenta[]
    );
  };

  const handleRemoveFromCart = (productoId: number) => {
    setCart((prev) => prev.filter((i) => i.productoId !== productoId));
  };

  const handleClearCart = () => {
    setCart([]);
    setMontoRecibido('');
  };

  // Client Selection
  const handleSelectClient = (cli: Cliente) => {
    setSelectedClientId(cli.id);
    setIsConsumidorFinal(false);
    setIsClientSearchOpen(false);
    setClientSearchQuery('');
    if (cli.tipoDocumento === 'RUC') {
      setTipoComprobante('FACTURA');
    } else {
      setTipoComprobante('BOLETA');
    }
  };

  const handleQuickClientSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickClientForm.numeroDocumento.trim() || !quickClientForm.razonSocial.trim()) {
      onShowToast('Error', 'Complete documento y nombre del cliente.', 'warning');
      return;
    }

    const newClient: Cliente = {
      id: Date.now(),
      tipoDocumento: quickClientForm.tipoDocumento,
      numeroDocumento: quickClientForm.numeroDocumento.trim(),
      razonSocial: quickClientForm.razonSocial.trim().toUpperCase(),
      telefono: quickClientForm.telefono.trim(),
      email: quickClientForm.email.trim(),
      direccionFiscal: quickClientForm.direccionFiscal.trim() || 'Chiclayo, Perú',
      estado: 'ACTIVO',
      fechaRegistro: new Date().toISOString().split('T')[0],
    };

    if (onSaveCliente) onSaveCliente(newClient);
    handleSelectClient(newClient);
    setIsQuickClientOpen(false);
    onShowToast('Cliente registrado', `${newClient.razonSocial} seleccionado para la venta.`, 'success');
  };

  // Process Checkout & Emit Sale
  const handleProcessSale = () => {
    if (cart.length === 0) {
      onShowToast('Carrito vacío', 'Agregue al menos un producto para realizar la venta.', 'warning');
      return;
    }

    if (!isConsumidorFinal && !selectedClient) {
      onShowToast('Cliente requerido', 'Seleccione un cliente o marque Consumidor Final.', 'warning');
      return;
    }

    if (tipoComprobante === 'FACTURA' && isConsumidorFinal) {
      onShowToast('Factura requiere RUC', 'Para emitir Factura Electrónica debe seleccionar un cliente con RUC.', 'error');
      return;
    }

    if (tipoComprobante === 'FACTURA' && selectedClient?.tipoDocumento !== 'RUC') {
      onShowToast('Cliente no tiene RUC', 'El cliente seleccionado no tiene RUC. Cambie a Boleta o asigne un RUC.', 'warning');
      return;
    }

    if (metodoPago === 'EFECTIVO' && montoRecibidoNum > 0 && montoRecibidoNum < totalNeto) {
      onShowToast('Monto insuficiente', `El monto recibido (S/ ${montoRecibidoNum}) es menor al total a pagar (S/ ${totalNeto}).`, 'warning');
      return;
    }

    // Generate Code: B001-00010X or F001-00004X or NV-00010X
    const prefix = tipoComprobante === 'FACTURA' ? 'F001' : tipoComprobante === 'BOLETA' ? 'B001' : 'NV01';
    const nextNumber = String(ventas.length + 101).padStart(6, '0');
    const codigoComprobante = `${prefix}-${nextNumber}`;

    const newSale: Venta = {
      id: Date.now(),
      codigoComprobante,
      tipoComprobante,
      clienteId: isConsumidorFinal ? undefined : selectedClient?.id,
      clienteDocumento: isConsumidorFinal ? '00000000' : selectedClient?.numeroDocumento || '00000000',
      clienteNombre: isConsumidorFinal ? 'CLIENTES VARIOS / CONSUMIDOR FINAL' : selectedClient?.razonSocial || 'CLIENTE',
      clienteDireccion: isConsumidorFinal ? 'Chiclayo' : selectedClient?.direccionFiscal,
      vendedorId: currentUser.id,
      vendedorNombre: currentUser.nombreCompleto,
      sucursal: activeSucursalNombre,
      fecha: new Date().toLocaleString('es-PE', { hour12: false }),
      items: [...cart],
      subtotal: parseFloat(subtotalBase.toFixed(2)),
      igv: parseFloat(igvCalculado.toFixed(2)),
      descuento: descuentoGlobal,
      total: parseFloat(totalNeto.toFixed(2)),
      metodoPago,
      montoRecibido: metodoPago === 'EFECTIVO' ? montoRecibidoNum || totalNeto : totalNeto,
      vuelto: metodoPago === 'EFECTIVO' ? parseFloat(vueltoCalculado.toFixed(2)) : 0,
      estado: 'EMITIDO',
    };

    // 1. Save sale to global state / localStorage
    onSaveVenta(newSale);

    // 2. Discount stock for all sold items
    cart.forEach((item) => {
      onUpdateProductoStock(item.productoId, -item.cantidad);
    });

    // 3. Open receipt modal and reset cart
    setCompletedVenta(newSale);
    setIsReceiptModalOpen(true);
    setCart([]);
    setMontoRecibido('');
    setDescuentoGlobal(0);

    onShowToast('Venta realizada con éxito', `Comprobante ${newSale.codigoComprobante} emitido correctamente.`, 'success');
  };

  // Helper icon for product category
  const getCategoryIcon = (cat: string) => {
    const c = cat?.toUpperCase() || '';
    if (c.includes('LAPTOP') || c.includes('NOTEBOOK')) return <Laptop className="w-5 h-5 text-blue-600" />;
    if (c.includes('IMPRESORA')) return <PrinterIcon className="w-5 h-5 text-indigo-600" />;
    if (c.includes('ALMACENAMIENTO') || c.includes('SSD')) return <HardDrive className="w-5 h-5 text-emerald-600" />;
    if (c.includes('MEMORIA') || c.includes('RAM') || c.includes('CPU')) return <Cpu className="w-5 h-5 text-purple-600" />;
    return <Package className="w-5 h-5 text-slate-600" />;
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8F9FF] min-h-screen overflow-hidden">
      {/* Top POS Header Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00346F] text-white flex items-center justify-center shadow-md">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-[#0B1C30]">
                Punto de Venta • MG Solutions
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                POS ACTIVO
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Vendedor: <span className="font-bold text-slate-800">{currentUser.nombreCompleto}</span> • Sede:{' '}
              <span className="font-semibold text-[#00346F]">{activeSucursalNombre}</span>
            </p>
          </div>
        </div>

        {/* View Switcher: POS vs Sales History */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveTab('pos')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'pos'
                  ? 'bg-white text-[#00346F] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Terminal POS
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-white text-[#00346F] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Historial de Ventas ({ventas.length})
            </button>
          </div>

          <select
            value={activeSucursalNombre}
            onChange={(e) => setActiveSucursalNombre(e.target.value)}
            className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#00346F]"
          >
            {sucursales.map((s) => (
              <option key={s.id} value={s.nombre}>
                📍 {s.nombre}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* TAB 1: TERMINAL POS */}
      {activeTab === 'pos' && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* LEFT SIDE: PRODUCT CATALOG */}
          <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-4">
            {/* Search and Filters Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchProductQuery}
                    onChange={(e) => setSearchProductQuery(e.target.value)}
                    placeholder="Buscar laptop, impresora, accesorio por nombre, modelo o código de barra..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:border-[#00346F]"
                  />
                  {searchProductQuery && (
                    <button
                      onClick={() => setSearchProductQuery('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                  >
                    {brandsList.map((b) => (
                      <option key={b} value={b}>
                        Marca: {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
                {categoriesList.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-[#00346F] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-3">
                <p className="text-xs font-bold text-slate-700">
                  Catálogo de Equipos y Repuestos ({filteredProducts.length} productos disponibles)
                </p>
                <span className="text-[11px] text-slate-500">
                  Precios incluyen IGV (18%)
                </span>
              </div>

              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                  {filteredProducts.map((prod) => {
                    const isInCart = cart.find((i) => i.productoId === prod.id);
                    const isOutOfStock = prod.stock <= 0;

                    return (
                      <div
                        key={prod.id}
                        className={`bg-white rounded-xl border p-4 flex flex-col justify-between transition-all hover:shadow-md ${
                          isInCart
                            ? 'border-blue-400 ring-1 ring-blue-300'
                            : isOutOfStock
                            ? 'border-red-200 opacity-60 bg-red-50/20'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          {/* Card Header with Badges */}
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-blue-50 text-[#00346F] rounded text-[10px] font-extrabold uppercase tracking-wider">
                              {prod.categoriaNombre}
                            </span>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                              {prod.marcaNombre}
                            </span>
                          </div>

                          {/* Product Title and Icon */}
                          <div className="flex items-start gap-2.5 mb-2">
                            <div className="w-9 h-9 rounded-lg bg-[#EFF4FF] flex items-center justify-center flex-shrink-0 mt-0.5">
                              {getCategoryIcon(prod.categoriaNombre)}
                            </div>
                            <div>
                              <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                                {prod.nombre}
                              </h3>
                              <p className="font-mono text-[10px] text-slate-400 mt-0.5">
                                SKU: {prod.codigo} {prod.codigoBarra ? `• EAN: ${prod.codigoBarra}` : ''}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer: Stock & Price & Action */}
                        <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between">
                          <div>
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                isOutOfStock
                                  ? 'bg-red-100 text-red-700'
                                  : prod.stock <= 5
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isOutOfStock ? 'Agotado' : `Stock: ${prod.stock} ${prod.unidadMedida}`}
                            </span>
                            <div className="text-sm font-extrabold text-[#00346F] mt-0.5">
                              S/ {prod.precioUnitario.toFixed(2)}
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={isOutOfStock}
                            onClick={() => handleAddToCart(prod)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-all active:scale-95 ${
                              isOutOfStock
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : isInCart
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-[#00346F] hover:bg-[#004A99] text-white'
                            }`}
                          >
                            {isInCart ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>+{isInCart.cantidad}</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>Agregar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
                  <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-sm">No se encontraron productos</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Pruebe con otros términos de búsqueda o cambie el filtro de categoría/marca.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE: CART & CHECKOUT TERMINAL */}
          <div className="w-full lg:w-[420px] bg-white border-l border-slate-200 flex flex-col shadow-lg">
            {/* Cart Header */}
            <div className="p-4 border-b border-slate-200 bg-[#EFF4FF] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#00346F]" />
                <h2 className="text-xs font-bold text-[#00346F] uppercase tracking-wider">
                  Detalle de Venta ({cart.reduce((acc, i) => acc + i.cantidad, 0)} ítems)
                </h2>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearCart}
                  className="text-[11px] font-bold text-red-600 hover:text-red-800 transition-colors"
                >
                  Vaciar carrito
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px] max-h-[300px] lg:max-h-none">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div
                    key={item.productoId}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 hover:bg-slate-100/60 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-2">
                          {item.nombre}
                        </h4>
                        <p className="font-mono text-[10px] text-slate-500">
                          {item.marca} • P. Unit: S/ {item.precioUnitario.toFixed(2)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(item.productoId)}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.productoId, -1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded font-bold"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-xs px-2 text-slate-800">
                          {item.cantidad}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.productoId, 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded font-bold"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="font-extrabold text-xs text-[#00346F]">
                          S/ {item.subtotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <ShoppingCart className="w-10 h-10 mx-auto text-slate-200" />
                  <p className="font-semibold text-xs text-slate-600">El carrito está vacío</p>
                  <p className="text-[11px] text-slate-400 max-w-[240px] mx-auto">
                    Seleccione laptops, impresoras o accesorios del catálogo izquierdo para iniciar la venta.
                  </p>
                </div>
              )}
            </div>

            {/* Checkout Options Panel */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/80 space-y-3 text-xs">
              {/* Client Selection */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Cliente / Receptor *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsQuickClientOpen(true)}
                    className="text-[10px] font-bold text-[#00346F] hover:underline flex items-center gap-0.5"
                  >
                    <UserPlus className="w-3 h-3" />
                    + Nuevo
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsConsumidorFinal(true);
                      setIsClientSearchOpen(false);
                      if (tipoComprobante === 'FACTURA') setTipoComprobante('BOLETA');
                    }}
                    className={`py-1.5 px-2 rounded-lg font-bold text-[11px] border transition-all text-center ${
                      isConsumidorFinal
                        ? 'bg-[#00346F] text-white border-[#00346F]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Consumidor Final
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsConsumidorFinal(false);
                      setIsClientSearchOpen(true);
                    }}
                    className={`py-1.5 px-2 rounded-lg font-bold text-[11px] border transition-all text-center ${
                      !isConsumidorFinal
                        ? 'bg-[#00346F] text-white border-[#00346F]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Buscar Cliente
                  </button>
                </div>

                {/* Selected Client Card or Search Combobox */}
                {!isConsumidorFinal && (
                  <div className="space-y-1.5">
                    {selectedClient && !isClientSearchOpen ? (
                      <div className="p-2 bg-white border border-blue-200 rounded-lg flex items-center justify-between">
                        <div>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                              selectedClient.tipoDocumento === 'RUC'
                                ? 'bg-blue-100 text-[#00346F]'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {selectedClient.tipoDocumento} {selectedClient.numeroDocumento}
                          </span>
                          <p className="font-bold text-slate-800 text-[11px] mt-0.5 line-clamp-1">
                            {selectedClient.razonSocial}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsClientSearchOpen(true)}
                          className="text-[10px] font-bold text-[#00346F] hover:underline"
                        >
                          Cambiar
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          value={clientSearchQuery}
                          onChange={(e) => setClientSearchQuery(e.target.value)}
                          placeholder="Buscar por RUC, DNI o razón social..."
                          className="w-full p-2 bg-white border border-blue-400 rounded-lg text-xs font-medium focus:outline-none"
                        />
                        <div className="mt-1 max-h-36 overflow-y-auto border border-slate-200 rounded-lg bg-white divide-y divide-slate-100 shadow-lg">
                          {clientes
                            .filter((c) => {
                              if (!clientSearchQuery.trim()) return true;
                              const q = clientSearchQuery.toLowerCase();
                              return (
                                c.razonSocial.toLowerCase().includes(q) ||
                                c.numeroDocumento.includes(q)
                              );
                            })
                            .slice(0, 8)
                            .map((cli) => (
                              <div
                                key={cli.id}
                                onClick={() => handleSelectClient(cli)}
                                className="p-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                              >
                                <div>
                                  <span className="font-mono text-[9px] font-bold text-slate-500">
                                    [{cli.tipoDocumento} {cli.numeroDocumento}]
                                  </span>
                                  <p className="font-semibold text-slate-800 text-[11px]">
                                    {cli.razonSocial}
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Document Type Selector */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Tipo de Comprobante
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(['BOLETA', 'FACTURA', 'NOTA_VENTA'] as TipoComprobante[]).map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => setTipoComprobante(tipo)}
                      className={`py-1.5 rounded-lg font-bold text-[10px] border transition-all ${
                        tipoComprobante === tipo
                          ? 'bg-[#00346F] text-white border-[#00346F]'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {tipo === 'BOLETA'
                        ? 'Boleta'
                        : tipo === 'FACTURA'
                        ? 'Factura'
                        : 'Nota Venta'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Método de Pago
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {(
                    [
                      { key: 'EFECTIVO', label: 'Efectivo', icon: Banknote },
                      { key: 'YAPE_PLIN', label: 'Yape/Plin', icon: QrCode },
                      { key: 'TARJETA', label: 'Tarjeta', icon: CreditCard },
                      { key: 'TRANSFERENCIA', label: 'Transf.', icon: Building },
                    ] as const
                  ).map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setMetodoPago(m.key)}
                        className={`py-1.5 px-1 rounded-lg font-bold text-[10px] border flex flex-col items-center justify-center gap-0.5 transition-all ${
                          metodoPago === m.key
                            ? 'bg-[#00346F] text-white border-[#00346F]'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash Change Calculator */}
              {metodoPago === 'EFECTIVO' && (
                <div className="grid grid-cols-2 gap-2 bg-white p-2 rounded-lg border border-slate-200">
                  <div>
                    <label className="block font-bold text-slate-600 text-[10px] mb-0.5">
                      Monto Recibido (S/)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={montoRecibido}
                      onChange={(e) => setMontoRecibido(e.target.value)}
                      placeholder={totalNeto.toFixed(2)}
                      className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-bold text-[#00346F]"
                    />
                  </div>

                  <div>
                    <span className="block font-bold text-slate-600 text-[10px] mb-0.5">
                      Vuelto a Entregar
                    </span>
                    <div className="p-1.5 bg-emerald-50 text-emerald-800 rounded font-bold text-xs text-right border border-emerald-200">
                      S/ {vueltoCalculado.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              {/* Financial Totals Breakdown */}
              <div className="space-y-1 pt-2 border-t border-slate-200">
                <div className="flex justify-between text-slate-600">
                  <span>Op. Gravada (Subtotal):</span>
                  <span>S/ {subtotalBase.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>IGV (18%):</span>
                  <span>S/ {igvCalculado.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm text-[#00346F] pt-1 border-t border-slate-300">
                  <span>TOTAL A COBRAR:</span>
                  <span>S/ {totalNeto.toFixed(2)}</span>
                </div>
              </div>

              {/* Main Action Button */}
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={handleProcessSale}
                className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 ${
                  cart.length === 0
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-[#00346F] hover:bg-[#004A99] text-white'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>EMITIR {tipoComprobante} • S/ {totalNeto.toFixed(2)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HISTORIAL DE VENTAS */}
      {activeTab === 'history' && (
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Historial de Comprobantes y Ventas Emitidas
              </h3>
              <p className="text-[11px] text-slate-500">
                Registro de facturas, boletas y tickets emitidos por el equipo de ventas.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Buscar por comprobante o cliente..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-[#00346F]"
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#EFF4FF] font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">N° Comprobante</th>
                  <th className="py-2.5 px-3">Fecha y Hora</th>
                  <th className="py-2.5 px-3">Cliente Receptor</th>
                  <th className="py-2.5 px-3">Ítems Vendidos</th>
                  <th className="py-2.5 px-3">Método Pago</th>
                  <th className="py-2.5 px-3 text-right">Total (S/)</th>
                  <th className="py-2.5 px-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ventas
                  .filter((v) => {
                    if (!historySearch.trim()) return true;
                    const q = historySearch.toLowerCase();
                    return (
                      v.codigoComprobante.toLowerCase().includes(q) ||
                      v.clienteNombre.toLowerCase().includes(q) ||
                      v.clienteDocumento.includes(q)
                    );
                  })
                  .map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-[#00346F]">
                          {sale.codigoComprobante}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          {sale.tipoComprobante}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{sale.fecha}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-800 block">
                          {sale.clienteNombre}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Doc: {sale.clienteDocumento}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {sale.items.length} producto(s)
                        <span className="block text-[10px] text-slate-400 line-clamp-1">
                          {sale.items.map((i) => `${i.cantidad}x ${i.nombre}`).join(', ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700">
                        {sale.metodoPago}
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-[#00346F]">
                        S/ {sale.total.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setCompletedVenta(sale);
                            setIsReceiptModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-300 hover:border-blue-400 text-[#00346F] rounded-lg font-bold text-[11px] flex items-center gap-1 mx-auto shadow-xs"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Ver Ticket</span>
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE COMPROBANTE GENERADO (TICKET POS / FACTURA) */}
      {isReceiptModalOpen && completedVenta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-3.5 border-b border-slate-200 bg-[#00346F] text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Comprobante Electrónico Emitido
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="text-white/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thermal Ticket Format Container */}
            <div className="p-5 overflow-y-auto font-mono text-[11px] text-slate-800 space-y-3 bg-white">
              {/* Header Empresa */}
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-3">
                <p className="font-extrabold text-sm tracking-tight text-black">
                  {empresa.nombreComercial || 'MG SOLUTIONS GROUP'}
                </p>
                <p className="text-[10px] text-slate-600">{empresa.razonSocial}</p>
                <p className="text-[10px] font-bold">RUC: {empresa.ruc}</p>
                <p className="text-[9px] text-slate-500 leading-tight">
                  {empresa.direccionFiscal}
                </p>
                <p className="text-[9px] text-slate-500">Tel: {empresa.telefono}</p>
              </div>

              {/* Comprobante Info */}
              <div className="text-center py-1 border-b border-dashed border-slate-300">
                <p className="font-bold text-xs uppercase tracking-wider text-black">
                  {completedVenta.tipoComprobante === 'FACTURA'
                    ? 'FACTURA ELECTRÓNICA'
                    : completedVenta.tipoComprobante === 'BOLETA'
                    ? 'BOLETA DE VENTA ELECTRÓNICA'
                    : 'NOTA DE VENTA / TICKET'}
                </p>
                <p className="font-bold text-sm text-[#00346F]">
                  {completedVenta.codigoComprobante}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Fecha de emisión: {completedVenta.fecha}
                </p>
              </div>

              {/* Cliente Info */}
              <div className="space-y-0.5 border-b border-dashed border-slate-300 pb-2 text-[10px]">
                <p>
                  <span className="font-bold">CLIENTE:</span> {completedVenta.clienteNombre}
                </p>
                <p>
                  <span className="font-bold">DOC:</span> {completedVenta.clienteDocumento}
                </p>
                {completedVenta.clienteDireccion && (
                  <p>
                    <span className="font-bold">DIR:</span> {completedVenta.clienteDireccion}
                  </p>
                )}
                <p>
                  <span className="font-bold">CAJERO/VENDEDOR:</span>{' '}
                  {completedVenta.vendedorNombre}
                </p>
                <p>
                  <span className="font-bold">SEDE:</span> {completedVenta.sucursal}
                </p>
              </div>

              {/* Items Table */}
              <div className="space-y-1 border-b border-dashed border-slate-300 pb-2">
                <div className="flex justify-between font-bold border-b border-slate-200 pb-1 text-[10px]">
                  <span>CANT / DESCRIPCIÓN</span>
                  <span>TOTAL</span>
                </div>
                {completedVenta.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-[10px]">
                    <div className="pr-2">
                      <p className="font-semibold text-black">
                        {item.cantidad} x {item.nombre}
                      </p>
                      <p className="text-[9px] text-slate-500">
                        P.U: S/ {item.precioUnitario.toFixed(2)}
                      </p>
                    </div>
                    <span className="font-bold text-black flex-shrink-0">
                      S/ {item.subtotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2">
                <div className="flex justify-between">
                  <span>OP. GRAVADA:</span>
                  <span>S/ {completedVenta.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>I.G.V. (18%):</span>
                  <span>S/ {completedVenta.igv.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm text-black border-t border-slate-300 pt-1">
                  <span>TOTAL A PAGAR:</span>
                  <span>S/ {completedVenta.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-600 pt-1">
                  <span>FORMA DE PAGO:</span>
                  <span className="font-bold">{completedVenta.metodoPago}</span>
                </div>
                {completedVenta.metodoPago === 'EFECTIVO' && (
                  <>
                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span>MONTO RECIBIDO:</span>
                      <span>S/ {(completedVenta.montoRecibido || completedVenta.total).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-emerald-800 font-bold">
                      <span>VUELTO:</span>
                      <span>S/ {(completedVenta.vuelto || 0).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Footer Notice */}
              <div className="text-center space-y-1 text-[9px] text-slate-500">
                <p>Representación impresa de la Boleta/Factura Electrónica.</p>
                <p>Consulte su documento en www.sunat.gob.pe</p>
                <p className="font-bold text-black pt-1">¡GRACIAS POR SU PREFERENCIA!</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 bg-[#00346F] hover:bg-[#004A99] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Ticket</span>
              </button>
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRO RÁPIDO DE CLIENTE */}
      {isQuickClientOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-[#00346F] text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Nuevo Cliente para Facturación
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickClientOpen(false)}
                className="text-white/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickClientSave} className="p-5 space-y-3 text-xs bg-white">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo Doc</label>
                  <select
                    value={quickClientForm.tipoDocumento}
                    onChange={(e) =>
                      setQuickClientForm({
                        ...quickClientForm,
                        tipoDocumento: e.target.value as 'DNI' | 'RUC',
                      })
                    }
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="DNI">DNI (8 d.)</option>
                    <option value="RUC">RUC (11 d.)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">N° Documento *</label>
                  <input
                    type="text"
                    required
                    value={quickClientForm.numeroDocumento}
                    onChange={(e) =>
                      setQuickClientForm({
                        ...quickClientForm,
                        numeroDocumento: e.target.value,
                      })
                    }
                    placeholder={quickClientForm.tipoDocumento === 'DNI' ? '47891234' : '20609737524'}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-[#00346F]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {quickClientForm.tipoDocumento === 'RUC' ? 'Razón Social *' : 'Nombre Completo *'}
                </label>
                <input
                  type="text"
                  required
                  value={quickClientForm.razonSocial}
                  onChange={(e) =>
                    setQuickClientForm({
                      ...quickClientForm,
                      razonSocial: e.target.value,
                    })
                  }
                  placeholder="Ej: CORPORACIÓN ACEROS S.A.C."
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={quickClientForm.telefono}
                    onChange={(e) =>
                      setQuickClientForm({
                        ...quickClientForm,
                        telefono: e.target.value,
                      })
                    }
                    placeholder="987654321"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={quickClientForm.email}
                    onChange={(e) =>
                      setQuickClientForm({
                        ...quickClientForm,
                        email: e.target.value,
                      })
                    }
                    placeholder="contacto@empresa.pe"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dirección Fiscal</label>
                <input
                  type="text"
                  value={quickClientForm.direccionFiscal}
                  onChange={(e) =>
                    setQuickClientForm({
                      ...quickClientForm,
                      direccionFiscal: e.target.value,
                    })
                  }
                  placeholder="Av. Bolognesi 450, Chiclayo"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickClientOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#00346F] text-white font-bold rounded-lg text-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Guardar y Seleccionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
