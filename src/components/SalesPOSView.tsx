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
  Barcode,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Loader2,
  RefreshCw,
  Mail,
  Send,
  Check,
  Sparkles,
  Lock,
  Monitor,
  Wrench,
  LayoutGrid,
  ArrowLeft,
  Layers,
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
import { saleService, CreateVentaPayload } from '../services/sale.service';
import { warehouseService, UnidadFisicaSerie } from '../services/warehouse.service';
import { consultaService } from '../services/consulta.service';


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
  const [selectedCategory, setSelectedCategory] = useState<string>('DEPARTAMENTOS');
  const [selectedBrand, setSelectedBrand] = useState<string>('TODAS');
  const [activeSucursalNombre, setActiveSucursalNombre] = useState<string>(
    sucursales[0]?.nombre || 'Principal - Chiclayo Centro'
  );

  // Cart State
  const [cart, setCart] = useState<ItemVenta[]>([]);

  // Checkout State
  const [tipoComprobante, setTipoComprobante] = useState<TipoComprobante>('BOLETA');
  const [isConsumidorFinal, setIsConsumidorFinal] = useState<boolean>(true);
  const [selectedClientId, setSelectedClientId] = useState<number | undefined>(
    () => clientes.find((c) => c.estado === 'ACTIVO')?.id
  );
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [isClientSearchOpen, setIsClientSearchOpen] = useState(false);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO');
  const [montoRecibido, setMontoRecibido] = useState<string>('');
  const [descuentoGlobal, setDescuentoGlobal] = useState<number>(0);
  const [createdClientLocal, setCreatedClientLocal] = useState<Cliente | null>(null);

  // Modal State for Generated Receipt
  const [completedVenta, setCompletedVenta] = useState<Venta | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptEmailInput, setReceiptEmailInput] = useState<string>('');
  const [isSendingReceiptEmail, setIsSendingReceiptEmail] = useState<boolean>(false);
  const [isReceiptEmailSent, setIsReceiptEmailSent] = useState<boolean>(false);

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

  // Consulta SUNAT (RUC) / RENIEC (DNI) State
  const [isQueryingDoc, setIsQueryingDoc] = useState(false);
  const [docStatusBadge, setDocStatusBadge] = useState<string | null>(null);

  // Consultar documento ante SUNAT / RENIEC
  const handleQueryDocument = async () => {
    const num = quickClientForm.numeroDocumento.trim();
    const tipo = quickClientForm.tipoDocumento;

    if (tipo === 'DNI' && num.length !== 8) {
      onShowToast('DNI inválido', 'El DNI debe contener 8 dígitos numéricos.', 'warning');
      return;
    }
    if (tipo === 'RUC' && num.length !== 11) {
      onShowToast('RUC inválido', 'El RUC debe contener 11 dígitos numéricos.', 'warning');
      return;
    }

    setIsQueryingDoc(true);
    setDocStatusBadge(null);
    try {
      if (tipo === 'RUC') {
        const res = await consultaService.consultarRuc(num);
        if (res.success && res.data) {
          setQuickClientForm((prev) => ({
            ...prev,
            razonSocial: res.data!.razonSocial,
            direccionFiscal: res.data!.direccion || prev.direccionFiscal,
          }));
          setDocStatusBadge(`SUNAT: ${res.data.estado} - ${res.data.condicion}`);
          onShowToast('SUNAT: RUC Consultado', `${res.data.razonSocial} (${res.data.condicion})`, 'success');
        } else {
          onShowToast('No encontrado', res.message || 'No se encontró el RUC en SUNAT.', 'warning');
        }
      } else {
        const res = await consultaService.consultarDni(num);
        if (res.success && res.data) {
          setQuickClientForm((prev) => ({
            ...prev,
            razonSocial: res.data!.nombreCompleto,
          }));
          setDocStatusBadge('RENIEC: Identidad Verificada');
          onShowToast('RENIEC: DNI Consultado', res.data.nombreCompleto, 'success');
        } else {
          onShowToast('No encontrado', res.message || 'No se encontró el DNI en RENIEC.', 'warning');
        }
      }
    } catch (err: any) {
      console.error('Error al consultar documento:', err);
      onShowToast('Error', 'Fallo de conexión al consultar el documento.', 'error');
    } finally {
      setIsQueryingDoc(false);
    }
  };

  // History Filter & DB Sales Sync
  const [historySearch, setHistorySearch] = useState('');
  const [dbVentas, setDbVentas] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);


  // Enviar comprobante por correo electrónico
  const handleSendReceiptEmail = async () => {
    if (!completedVenta) return;
    const targetEmail = receiptEmailInput.trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      onShowToast('Correo inválido', 'Ingrese un correo electrónico válido para enviar el comprobante.', 'warning');
      return;
    }

    setIsSendingReceiptEmail(true);
    try {
      const res = await saleService.enviarComprobanteEmail(completedVenta.id, targetEmail, {
        clienteNombre: completedVenta.clienteNombre,
        clienteDocumento: completedVenta.clienteDocumento,
        clienteDireccion: completedVenta.clienteDireccion,
        clienteEmail: targetEmail,
        codigoComprobante: completedVenta.codigoComprobante,
        tipoComprobante: completedVenta.tipoComprobante,
        fecha: completedVenta.fecha,
        vendedorNombre: completedVenta.vendedorNombre,
        sucursal: completedVenta.sucursal,
        metodoPago: completedVenta.metodoPago,
        subtotal: completedVenta.subtotal,
        igv: completedVenta.igv,
        total: completedVenta.total,
        items: completedVenta.items,
      });

      if (res.success) {
        setIsReceiptEmailSent(true);
        onShowToast(
          'Correo enviado con éxito',
          res.simulated
            ? `Comprobante simulado en consola para ${targetEmail}`
            : `El comprobante fue enviado exitosamente a ${targetEmail}`,
          'success'
        );
      } else {
        onShowToast('Error al enviar correo', res.message || 'No se pudo enviar el correo.', 'error');
      }
    } catch (err: any) {
      console.error('Error al enviar comprobante por correo:', err);
      onShowToast('Error', 'No se pudo conectar con el servicio de correo.', 'error');
    } finally {
      setIsSendingReceiptEmail(false);
    }
  };

  // Series Selection Modal State
  const [seriesModal, setSeriesModal] = useState<{
    item: ItemVenta;
    availableUnits: UnidadFisicaSerie[];
    selectedSeries: string[];
    manualInput: string;
    loading: boolean;
  } | null>(null);

  // Cargar historial de ventas desde MySQL
  const loadDbVentas = React.useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await saleService.getVentas({ limit: 100 });
      if (res.success && res.ventas) {
        setDbVentas(res.ventas);
      }
    } catch (err) {

      console.error('Error al cargar ventas desde MySQL:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  React.useEffect(() => {
    if (activeTab === 'history') {
      loadDbVentas();
    }
  }, [activeTab, loadDbVentas]);

  // Abrir selector de serie para productos seriados
  const handleOpenSeriesModal = async (item: ItemVenta) => {
    const currentSelected = item.series || [];
    setSeriesModal({
      item,
      availableUnits: [],
      selectedSeries: [...currentSelected],
      manualInput: '',
      loading: true,
    });

    try {
      const res = await warehouseService.getUnidades(item.productoId);
      const units = res.success && res.unidades ? res.unidades.filter(u => u.estadoCodigo === 'DISPONIBLE' || u.estadoUnidadId === 1) : [];
      setSeriesModal((prev) => (prev ? { ...prev, availableUnits: units, loading: false } : null));
    } catch (err) {
      console.error('Error al consultar series disponibles:', err);
      setSeriesModal((prev) => (prev ? { ...prev, loading: false } : null));
    }
  };

  const handleSaveSeriesForCartItem = (productoId: number, series: string[]) => {
    setCart((prev) =>
      prev.map((i) => (i.productoId === productoId ? { ...i, series } : i))
    );
    setSeriesModal(null);
    onShowToast('Series asignadas', `${series.length} serie(s) vinculadas para garantía.`, 'info');
  };

  // Selected client object
  const selectedClient = clientes.find((c) => c.id === selectedClientId) || (createdClientLocal?.id === selectedClientId ? createdClientLocal : null);

  // Valida si el carrito contiene Laptops o productos que obligatoriamente requieren cliente para garantía y serie
  const requiresIdentifiedClient = useMemo(() => {
    return cart.some((item) => {
      const prod = productos.find((p) => p.id === item.productoId);
      const cat = ((prod?.categoriaNombre || item.categoria || '') + '').toUpperCase();
      const nom = ((prod?.nombre || item.nombre || '') + '').toUpperCase();
      return (
        Boolean(prod?.requiereSerie) ||
        cat.includes('LAPTOP') ||
        cat.includes('NOTEBOOK') ||
        cat.includes('COMPUTADORA') ||
        cat.includes('IMPRESORA') ||
        nom.includes('LAPTOP') ||
        nom.includes('NOTEBOOK') ||
        Boolean(item.series && item.series.length > 0)
      );
    });
  }, [cart, productos]);

  // Si entra un producto con garantía (como laptop) y estaba en Consumidor Final, cambiar automáticamente a Buscar Cliente
  React.useEffect(() => {
    if (requiresIdentifiedClient && isConsumidorFinal) {
      setIsConsumidorFinal(false);
      setIsClientSearchOpen(true);
      onShowToast(
        'Cliente Requerido para Garantía',
        'La venta incluye Laptops o Equipos con garantía. Debe seleccionar o registrar un cliente.',
        'info'
      );
    }
  }, [requiresIdentifiedClient]);

  // Productos habilitados para venta en mostrador POS (incluyendo Repuestos & Pantallas comercializables)
  const posEligibleProducts = useMemo(() => {
    return productos.filter(
      (p) =>
        p.estado === 'ACTIVO' &&
        p.disponibleVenta !== false &&
        p.tipoDestino !== 'SERVICIO_TALLER'
    );
  }, [productos]);

  // Orden prioritario de departamentos comerciales
  const getCategoryOrderScore = (cat: string) => {
    const c = (cat || '').toUpperCase();
    if (c.includes('LAPTOP') || c.includes('NOTEBOOK')) return 1;
    if (c.includes('IMPRESORA')) return 2;
    if (c.includes('MONITOR') || c.includes('PANTALLA')) return 3;
    if (c.includes('REPUESTO')) return 4;
    if (c.includes('COMPONENTE') || c.includes('HARDWARE')) return 5;
    if (c.includes('PERIF')) return 6;
    if (c.includes('SUMINISTRO') || c.includes('TINTA')) return 7;
    return 99;
  };

  // Extract unique categories ordered by commercial priority
  const categoriesList = useMemo(() => {
    const set = new Set<string>(
      posEligibleProducts.map((p) => p.categoriaNombre).filter((c): c is string => Boolean(c))
    );
    const sorted = Array.from(set).sort(
      (a, b) => getCategoryOrderScore(a) - getCategoryOrderScore(b)
    );
    return ['DEPARTAMENTOS', 'TODAS', ...sorted];
  }, [posEligibleProducts]);

  // Resumen enriquecido por Departamento / Categoría para la vista principal de tarjetas
  const departmentsSummary = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        count: number;
        totalStock: number;
        brands: Set<string>;
        minPrice: number;
        sampleProducts: string[];
      }
    >();

    posEligibleProducts.forEach((p) => {
      const cat = p.categoriaNombre || 'OTROS EQUIPOS';
      if (!map.has(cat)) {
        map.set(cat, {
          name: cat,
          count: 0,
          totalStock: 0,
          brands: new Set(),
          minPrice: p.precioUnitario,
          sampleProducts: [],
        });
      }
      const entry = map.get(cat)!;
      entry.count += 1;
      entry.totalStock += Math.max(0, p.stock);
      if (p.marcaNombre) entry.brands.add(p.marcaNombre);
      if (p.precioUnitario < entry.minPrice) entry.minPrice = p.precioUnitario;
      if (entry.sampleProducts.length < 3) entry.sampleProducts.push(p.nombre);
    });

    return Array.from(map.values())
      .sort((a, b) => getCategoryOrderScore(a.name) - getCategoryOrderScore(b.name))
      .map((d) => ({
        ...d,
        brands: Array.from(d.brands),
      }));
  }, [posEligibleProducts]);

  // Marcas dinámicas según el departamento activo
  const brandsList = useMemo(() => {
    const base =
      selectedCategory !== 'DEPARTAMENTOS' && selectedCategory !== 'TODAS'
        ? posEligibleProducts.filter((p) => p.categoriaNombre === selectedCategory)
        : posEligibleProducts;
    const set = new Set(base.map((p) => p.marcaNombre).filter(Boolean));
    return ['TODAS', ...Array.from(set)];
  }, [posEligibleProducts, selectedCategory]);

  // Filtered Products for Catalog
  const filteredProducts = useMemo(() => {
    return posEligibleProducts.filter((p) => {
      // Category filter (si está en vista DEPARTAMENTOS pero el usuario escribe en el buscador, busca en todo el catálogo)
      if (
        selectedCategory !== 'TODAS' &&
        selectedCategory !== 'DEPARTAMENTOS' &&
        p.categoriaNombre !== selectedCategory
      ) {
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
        const matchBrand = (p.marcaNombre || '').toLowerCase().includes(q);
        const matchCat = (p.categoriaNombre || '').toLowerCase().includes(q);
        const matchBar = p.codigoBarra ? p.codigoBarra.toLowerCase().includes(q) : false;
        if (!matchName && !matchCode && !matchBrand && !matchCat && !matchBar) return false;
      }

      return true;
    });
  }, [posEligibleProducts, selectedCategory, selectedBrand, searchProductQuery]);

  // Productos Relacionados y Complementarios según la Categoría activa o el Carrito
  const relatedProductsInfo = useMemo(() => {
    const activeCat =
      selectedCategory !== 'DEPARTAMENTOS' && selectedCategory !== 'TODAS'
        ? selectedCategory
        : cart.length > 0
          ? cart[cart.length - 1].categoria
          : '';

    if (!activeCat) return { title: '', subtitle: '', items: [] as { product: Producto; badge: string }[] };

    const c = activeCat.toUpperCase();
    const cartIds = new Set(cart.map((i) => i.productoId));
    const candidates = posEligibleProducts.filter(
      (p) => p.stock > 0 && !cartIds.has(p.id) && p.categoriaNombre !== activeCat
    );

    if (c.includes('LAPTOP') || c.includes('NOTEBOOK')) {
      const items = candidates
        .filter((p) => {
          const pc = (p.categoriaNombre || '').toUpperCase();
          return (
            pc.includes('PERIF') ||
            pc.includes('COMPONENTE') ||
            pc.includes('REPUESTO') ||
            pc.includes('MONITOR')
          );
        })
        .map((product) => {
          const pc = (product.categoriaNombre || '').toUpperCase();
          let badge = 'Complemento Laptop';
          if (pc.includes('COMPONENTE')) badge = 'Upgrade RAM / SSD';
          else if (pc.includes('REPUESTO')) badge = 'Repuesto / Mantenimiento';
          else if (pc.includes('PERIF')) badge = 'Accesorio Recomendado';
          else if (pc.includes('MONITOR')) badge = 'Pantalla Externa';
          return { product, badge };
        })
        .slice(0, 6);
      return {
        title: 'Productos Relacionados para Laptops & Notebooks',
        subtitle: 'Accesorios, upgrades de memoria RAM/SSD y repuestos compatibles (pantallas, baterías, pasta térmica)',
        items,
      };
    }

    if (c.includes('IMPRESORA')) {
      const items = candidates
        .filter((p) => {
          const pc = (p.categoriaNombre || '').toUpperCase();
          return pc.includes('SUMINISTRO') || pc.includes('TINTA') || pc.includes('PERIF') || pc.includes('REPUESTO');
        })
        .map((product) => {
          const pc = (product.categoriaNombre || '').toUpperCase();
          const badge = pc.includes('SUMINISTRO') || pc.includes('TINTA')
            ? 'Tinta / Suministro Oficial'
            : 'Complemento de Oficina';
          return { product, badge };
        })
        .slice(0, 6);
      return {
        title: 'Suministros, Tintas y Complementos para Impresoras',
        subtitle: 'Botellas de tinta original, kits de recarga y accesorios compatibles con impresoras',
        items,
      };
    }

    if (c.includes('MONITOR') || c.includes('PANTALLA')) {
      const items = candidates
        .filter((p) => {
          const pc = (p.categoriaNombre || '').toUpperCase();
          const pn = productNameUpper(p);
          return pc.includes('PERIF') || pc.includes('LAPTOP') || pn.includes('PANTALLA') || pc.includes('REPUESTO');
        })
        .map((product) => {
          const pc = (product.categoriaNombre || '').toUpperCase();
          const badge = pc.includes('REPUESTO')
            ? 'Pantalla Repuesto Laptop'
            : pc.includes('PERIF')
              ? 'Periférico de Estación'
              : 'Equipo Compatible';
          return { product, badge };
        })
        .slice(0, 6);
      return {
        title: 'Productos Relacionados a Monitores & Pantallas',
        subtitle: 'Pantallas de reemplazo para laptop, periféricos de escritorio y equipos portátiles',
        items,
      };
    }

    if (c.includes('REPUESTO')) {
      const items = candidates
        .filter((p) => {
          const pc = (p.categoriaNombre || '').toUpperCase();
          return pc.includes('COMPONENTE') || pc.includes('LAPTOP') || pc.includes('MONITOR');
        })
        .map((product) => {
          const pc = (product.categoriaNombre || '').toUpperCase();
          const badge = pc.includes('COMPONENTE') ? 'Hardware & Upgrade' : 'Equipo Compatible';
          return { product, badge };
        })
        .slice(0, 6);
      return {
        title: 'Hardware y Componentes Relacionados a Repuestos',
        subtitle: 'Unidades SSD NVMe, memorias RAM SODIMM y equipos compatibles para repotenciación',
        items,
      };
    }

    // Default para Componentes, Periféricos y Suministros
    const items = candidates
      .filter((p) => {
        const pc = (p.categoriaNombre || '').toUpperCase();
        if (c.includes('SUMINISTRO')) return pc.includes('IMPRESORA');
        if (c.includes('COMPONENTE')) return pc.includes('REPUESTO') || pc.includes('LAPTOP');
        return pc.includes('LAPTOP') || pc.includes('MONITOR') || pc.includes('COMPONENTE');
      })
      .map((product) => ({
        product,
        badge: 'Producto Relacionado',
      }))
      .slice(0, 6);

    return {
      title: `Productos Relacionados a ${activeCat}`,
      subtitle: 'Equipos y artículos complementarios sugeridos para venta cruzada',
      items,
    };
  }, [selectedCategory, cart, posEligibleProducts]);

  function productNameUpper(p: Producto) {
    return (p.nombre || '').toUpperCase();
  }

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

    setCreatedClientLocal(newClient);
    if (onSaveCliente) onSaveCliente(newClient);
    handleSelectClient(newClient);
    setIsQuickClientOpen(false);
    onShowToast('Cliente registrado', `${newClient.razonSocial} seleccionado para la venta.`, 'success');
  };

  // Process Checkout & Emit Sale to MySQL
  const handleProcessSale = async () => {
    if (cart.length === 0) {
      onShowToast('Carrito vacío', 'Agregue al menos un producto para realizar la venta.', 'warning');
      return;
    }

    if (!isConsumidorFinal && !selectedClient) {
      onShowToast('Cliente requerido', 'Seleccione un cliente o marque Consumidor Final.', 'warning');
      return;
    }

    if (requiresIdentifiedClient && (isConsumidorFinal || !selectedClient)) {
      onShowToast(
        'Cliente Obligatorio por Garantía',
        'La compra de una Laptop o equipo con garantía requiere obligatoriamente registrar o asociar un cliente para activar su póliza de cobertura.',
        'warning'
      );
      setIsConsumidorFinal(false);
      setIsClientSearchOpen(true);
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

    // Validar productos seriados (Laptops, Impresoras)
    for (const item of cart) {
      const prod = productos.find((p) => p.id === item.productoId);
      const isSeriado =
        prod?.requiereSerie ||
        prod?.categoriaNombre?.toUpperCase().includes('LAPTOP') ||
        prod?.categoriaNombre?.toUpperCase().includes('IMPRESORA');

      if (isSeriado && (!item.series || item.series.length < item.cantidad)) {
        onShowToast(
          'Número de serie requerido',
          `El producto "${item.nombre}" requiere asignar ${item.cantidad} número(s) de serie para el registro de garantía.`,
          'warning'
        );
        handleOpenSeriesModal(item);
        return;
      }
    }

    setIsSubmittingSale(true);
    try {
      const tipoCompId = tipoComprobante === 'FACTURA' ? 2 : tipoComprobante === 'BOLETA' ? 1 : 3;
      const metodoId = metodoPago === 'EFECTIVO' ? 1 : metodoPago === 'YAPE_PLIN' ? 2 : metodoPago === 'TARJETA' ? 4 : 5;
      const targetSuc = sucursales.find(s => s.nombre === activeSucursalNombre) || sucursales[0];
      const finalSucursalId = targetSuc ? targetSuc.id : (currentUser?.sucursalId || 1);

      const salePayload: CreateVentaPayload = {
        clienteId: isConsumidorFinal ? 0 : (selectedClient?.id || 0),
        tipoComprobanteId: tipoCompId,
        metodoPagoId: metodoId,
        sucursalId: finalSucursalId,
        items: cart.map((item) => ({
          productoId: item.productoId,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          descuento: 0,
          series: item.series || [],
        })),
        observaciones: `Venta POS emitida por ${currentUser.nombreCompleto}`,
      };

      const res = await saleService.createVenta(salePayload);

      // Si el backend responde error, alertamos
      if (!res.success) {
        onShowToast('Error en venta', res.message || 'No se pudo registrar la venta en la base de datos.', 'error');
        return;
      }

      const prefix = tipoComprobante === 'FACTURA' ? 'F001' : tipoComprobante === 'BOLETA' ? 'B001' : 'NV01';
      const nextNumber = String(ventas.length + 101).padStart(6, '0');
      const codigoComprobanteFinal = res.venta?.codigoComprobante || `${prefix}-${nextNumber}`;

      const newSale: Venta = {
        id: res.venta?.id || Date.now(),
        codigoComprobante: codigoComprobanteFinal,
        tipoComprobante,
        clienteId: isConsumidorFinal ? undefined : selectedClient?.id,
        clienteDocumento: isConsumidorFinal ? '00000000' : selectedClient?.numeroDocumento || '00000000',
        clienteNombre: isConsumidorFinal ? 'CLIENTES VARIOS / CONSUMIDOR FINAL' : selectedClient?.razonSocial || 'CLIENTE',
        clienteDireccion: isConsumidorFinal ? 'Chiclayo' : selectedClient?.direccionFiscal,
        vendedorId: currentUser.id,
        vendedorNombre: currentUser.nombreCompleto,
        sucursal: activeSucursalNombre,
        fecha: res.venta?.fechaVenta ? new Date(res.venta.fechaVenta).toLocaleString('es-PE', { hour12: false }) : new Date().toLocaleString('es-PE', { hour12: false }),
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

      // 1. Guardar local y actualizar stocks
      onSaveVenta(newSale);
      cart.forEach((item) => {
        onUpdateProductoStock(item.productoId, -item.cantidad);
      });

      // 2. Abrir ticket y resetear carrito
      setCompletedVenta(newSale);
      const targetEmail = (selectedClient?.email || '').trim();
      setReceiptEmailInput(targetEmail);
      setIsReceiptEmailSent(false);
      setIsReceiptModalOpen(true);
      setCart([]);
      setMontoRecibido('');
      setDescuentoGlobal(0);

      // 3. Envío automático del comprobante y detalle de compra por correo al cliente si tiene email
      if (targetEmail && targetEmail.includes('@')) {
        saleService
          .enviarComprobanteEmail(res.venta?.id || (res as any).ventaId || newSale.id, targetEmail, {
            clienteNombre: newSale.clienteNombre,
            clienteDocumento: newSale.clienteDocumento,
            clienteDireccion: newSale.clienteDireccion,
            clienteEmail: targetEmail,
            codigoComprobante: newSale.codigoComprobante,
            tipoComprobante: newSale.tipoComprobante,
            fecha: newSale.fecha,
            vendedorNombre: newSale.vendedorNombre,
            sucursal: newSale.sucursal,
            metodoPago: newSale.metodoPago,
            subtotal: newSale.subtotal,
            igv: newSale.igv,
            total: newSale.total,
            items: newSale.items,
            itemsCount: newSale.items.length,
          })
          .then((mailRes) => {
            if (mailRes.success) {
              setIsReceiptEmailSent(true);
              onShowToast(
                'Comprobante Enviado al Correo',
                `Se envió automáticamente el detalle de compra y garantía a ${targetEmail}`,
                'success'
              );
            }
          })
          .catch((mailErr) => {
            console.warn('Auto-envío de comprobante por correo:', mailErr);
          });
      }

      onShowToast(
        'Venta realizada con éxito',
        targetEmail
          ? `Comprobante ${codigoComprobanteFinal} emitido. Enviando copia a ${targetEmail}...`
          : `Comprobante ${codigoComprobanteFinal} emitido en MySQL. Garantía activada.`,
        'success'
      );

      // Refrescar lista de ventas de la BD
      loadDbVentas();
    } catch (err: any) {
      console.error('Error al procesar venta:', err);
      onShowToast('Error', 'Ocurrió un error inesperado al emitir la venta.', 'error');
    } finally {
      setIsSubmittingSale(false);
    }
  };

  // Helper icon for product category
  const getCategoryIcon = (cat: string) => {
    const c = cat?.toUpperCase() || '';
    if (c.includes('LAPTOP') || c.includes('NOTEBOOK')) return <Laptop className="w-5 h-5 text-blue-600" />;
    if (c.includes('IMPRESORA')) return <PrinterIcon className="w-5 h-5 text-indigo-600" />;
    if (c.includes('MONITOR') || c.includes('PANTALLA')) return <Monitor className="w-5 h-5 text-cyan-600" />;
    if (c.includes('REPUESTO')) return <Wrench className="w-5 h-5 text-amber-600" />;
    if (c.includes('COMPONENTE') || c.includes('HARDWARE') || c.includes('MEMORIA') || c.includes('RAM') || c.includes('CPU'))
      return <Cpu className="w-5 h-5 text-purple-600" />;
    if (c.includes('ALMACENAMIENTO') || c.includes('SSD')) return <HardDrive className="w-5 h-5 text-emerald-600" />;
    return <Package className="w-5 h-5 text-slate-600" />;
  };

  // Metadatos visuales y cromáticos distintivos para las Tarjetas de Departamentos
  const getDepartmentMeta = (cat: string) => {
    const c = (cat || '').toUpperCase();
    if (c.includes('LAPTOP') || c.includes('NOTEBOOK')) {
      return {
        icon: <Laptop className="w-5 h-5 text-blue-600" />,
        bgIcon: 'bg-blue-50 border-blue-200 text-blue-600',
        topBorder: 'border-t-4 border-t-blue-600',
        hoverBorder: 'hover:border-blue-300 hover:shadow-blue-500/10',
        badgeBg: 'bg-blue-50 text-blue-700 border border-blue-200',
        brandPill: 'bg-blue-50/70 text-blue-800 border border-blue-100',
        actionColor: 'text-blue-600 group-hover:text-blue-700',
        btnBg: 'bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white',
        description: 'Laptops corporativas, ultrabooks y equipos gaming de alta gama.',
      };
    }
    if (c.includes('IMPRESORA')) {
      return {
        icon: <PrinterIcon className="w-5 h-5 text-indigo-600" />,
        bgIcon: 'bg-indigo-50 border-indigo-200 text-indigo-600',
        topBorder: 'border-t-4 border-t-indigo-600',
        hoverBorder: 'hover:border-indigo-300 hover:shadow-indigo-500/10',
        badgeBg: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
        brandPill: 'bg-indigo-50/70 text-indigo-800 border border-indigo-100',
        actionColor: 'text-indigo-600 group-hover:text-indigo-700',
        btnBg: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white',
        description: 'Multifuncionales con sistema continuo EcoTank, inyección y láser.',
      };
    }
    if (c.includes('MONITOR') || c.includes('PANTALLA')) {
      return {
        icon: <Monitor className="w-5 h-5 text-cyan-600" />,
        bgIcon: 'bg-cyan-50 border-cyan-200 text-cyan-600',
        topBorder: 'border-t-4 border-t-cyan-500',
        hoverBorder: 'hover:border-cyan-300 hover:shadow-cyan-500/10',
        badgeBg: 'bg-cyan-50 text-cyan-800 border border-cyan-200',
        brandPill: 'bg-cyan-50/70 text-cyan-800 border border-cyan-100',
        actionColor: 'text-cyan-700 group-hover:text-cyan-800',
        btnBg: 'bg-cyan-50 text-cyan-800 hover:bg-cyan-600 hover:text-white',
        description: 'Monitores FHD, paneles IPS y pantallas gamer de alta frecuencia.',
      };
    }
    if (c.includes('REPUESTO')) {
      return {
        icon: <Wrench className="w-5 h-5 text-amber-600" />,
        bgIcon: 'bg-amber-50 border-amber-200 text-amber-600',
        topBorder: 'border-t-4 border-t-amber-500',
        hoverBorder: 'hover:border-amber-300 hover:shadow-amber-500/10',
        badgeBg: 'bg-amber-50 text-amber-800 border border-amber-200',
        brandPill: 'bg-amber-50/70 text-amber-900 border border-amber-200/80',
        actionColor: 'text-amber-700 group-hover:text-amber-800',
        btnBg: 'bg-amber-50 text-amber-800 hover:bg-amber-600 hover:text-white',
        description: 'Pantallas Slim FHD de reemplazo, baterías, teclados y pasta térmica.',
      };
    }
    if (c.includes('COMPONENTE') || c.includes('HARDWARE')) {
      return {
        icon: <Cpu className="w-5 h-5 text-purple-600" />,
        bgIcon: 'bg-purple-50 border-purple-200 text-purple-600',
        topBorder: 'border-t-4 border-t-purple-600',
        hoverBorder: 'hover:border-purple-300 hover:shadow-purple-500/10',
        badgeBg: 'bg-purple-50 text-purple-700 border border-purple-200',
        brandPill: 'bg-purple-50/70 text-purple-800 border border-purple-100',
        actionColor: 'text-purple-600 group-hover:text-purple-700',
        btnBg: 'bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white',
        description: 'Discos sólidos SSD NVMe M.2 y memorias RAM SODIMM para upgrades.',
      };
    }
    if (c.includes('PERIF')) {
      return {
        icon: <Layers className="w-5 h-5 text-emerald-600" />,
        bgIcon: 'bg-emerald-50 border-emerald-200 text-emerald-600',
        topBorder: 'border-t-4 border-t-emerald-600',
        hoverBorder: 'hover:border-emerald-300 hover:shadow-emerald-500/10',
        badgeBg: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        brandPill: 'bg-emerald-50/70 text-emerald-800 border border-emerald-100',
        actionColor: 'text-emerald-600 group-hover:text-emerald-700',
        btnBg: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white',
        description: 'Mouses inalámbricos, teclados, cargadores y mochilas protectoras.',
      };
    }
    return {
      icon: <Package className="w-5 h-5 text-rose-600" />,
      bgIcon: 'bg-rose-50 border-rose-200 text-rose-600',
      topBorder: 'border-t-4 border-t-rose-500',
      hoverBorder: 'hover:border-rose-300 hover:shadow-rose-500/10',
      badgeBg: 'bg-rose-50 text-rose-700 border border-rose-200',
      brandPill: 'bg-rose-50/70 text-rose-800 border border-rose-100',
      actionColor: 'text-rose-600 group-hover:text-rose-700',
      btnBg: 'bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white',
      description: 'Botellas de tinta original, kits de recarga y consumibles de impresión.',
    };
  };

  const isDepartmentGridView =
    selectedCategory === 'DEPARTAMENTOS' && !searchProductQuery.trim();

  return (
    <div className="flex-1 min-w-0 flex flex-col bg-[#F8F9FF] h-[calc(100vh-4.2rem)] max-h-[calc(100vh-4.2rem)] overflow-hidden">
      {/* Top POS Header Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-xs flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00346F] text-white flex items-center justify-center shadow-md">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-[#0B1C30]">
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
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'pos'
                ? 'bg-white text-[#00346F] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Terminal POS
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'history'
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
        <div className="flex-1 min-w-0 flex flex-col lg:flex-row overflow-hidden min-h-0">
          {/* LEFT SIDE: PRODUCT CATALOG */}
          <div className="flex-1 min-w-0 flex flex-col p-3 md:p-4 overflow-y-auto overflow-x-hidden space-y-3 min-h-0">
            {/* Search and Filters Bar */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchProductQuery}
                    onChange={(e) => setSearchProductQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const q = searchProductQuery.trim().toLowerCase();
                        if (!q) return;
                        const match = filteredProducts.find(
                          (p) =>
                            p.codigoBarra?.toLowerCase() === q ||
                            p.codigo.toLowerCase() === q ||
                            p.nombre.toLowerCase().includes(q)
                        ) || filteredProducts[0];
                        if (match) {
                          handleAddToCart(match);
                          setSearchProductQuery('');
                          onShowToast('Producto añadido', `${match.nombre} agregado al carrito`, 'info');
                        }
                      }
                    }}
                    placeholder="Escanear con pistola o buscar por código / modelo (Enter para agregar)..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:border-[#00346F]"
                  />
                  {searchProductQuery && (
                    <button
                      onClick={() => setSearchProductQuery('')}
                      className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
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
                    onClick={() => {
                      setSelectedCategory(cat);
                      setSelectedBrand('TODAS');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${selectedCategory === cat
                      ? 'bg-[#00346F] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    {cat === 'DEPARTAMENTOS' && <LayoutGrid className="w-3.5 h-3.5" />}
                    {cat === 'DEPARTAMENTOS'
                      ? 'DEPARTAMENTOS'
                      : cat === 'TODAS'
                        ? 'VER TODO EL CATÁLOGO'
                        : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* VISTA 1: DISTRIBUCIÓN POR DEPARTAMENTOS / CATEGORÍAS */}
            {isDepartmentGridView ? (
              <div className="flex-1 space-y-3">
                {/* Banner superior más compacto y estilizado */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-[#002B5C] via-[#003B7A] to-[#004A99] text-white p-3 sm:px-4 sm:py-2.5 rounded-xl shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                      <LayoutGrid className="w-4 h-4 text-blue-200" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-xs sm:text-sm font-black uppercase tracking-wide truncate">
                        Distribución por Departamentos Comerciales
                      </h2>
                      <p className="text-[11px] text-blue-100/90 truncate">
                        Seleccione una línea de negocio para explorar sus modelos, existencias y productos relacionados.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('TODAS')}
                    className="px-3 py-1 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-bold transition-all whitespace-nowrap self-start sm:self-auto shrink-0 shadow-2xs"
                  >
                    Ver Todo el Catálogo ({posEligibleProducts.length})
                  </button>
                </div>

                {/* Grid Compacto con Cromática Distintiva por Categoría */}
                <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-3">
                  {departmentsSummary.map((dept) => {
                    const meta = getDepartmentMeta(dept.name);
                    return (
                      <div
                        key={dept.name}
                        onClick={() => {
                          setSelectedCategory(dept.name);
                          setSelectedBrand('TODAS');
                        }}
                        className={`bg-white rounded-xl border border-slate-200/90 ${meta.topBorder} p-3.5 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 group ${meta.hoverBorder}`}
                      >
                        <div>
                          {/* Fila Superior: Ícono coloreado + Título + Píldora de Modelos */}
                          <div className="flex items-start justify-between gap-2.5 mb-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${meta.bgIcon}`}
                              >
                                {meta.icon}
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-[#00346F] transition-colors truncate">
                                  {dept.name}
                                </h3>
                                <p className="text-[10px] text-slate-500 truncate leading-tight">
                                  {meta.description}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0 ${meta.badgeBg}`}
                            >
                              {dept.count} {dept.count === 1 ? 'mod.' : 'modelos'}
                            </span>
                          </div>

                          {/* Chips de Marcas con cromática de categoría */}
                          {dept.brands.length > 0 && (
                            <div className="flex flex-wrap gap-1 my-2">
                              {dept.brands.slice(0, 5).map((b) => (
                                <span
                                  key={b}
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${meta.brandPill}`}
                                >
                                  {b}
                                </span>
                              ))}
                              {dept.brands.length > 5 && (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold">
                                  +{dept.brands.length - 5}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Pie de tarjeta compacto con precio, stock y botón de acceso */}
                        <div className="pt-2.5 border-t border-slate-100 mt-2 flex items-center justify-between text-xs">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">Desde</span>
                            <span className="text-xs font-black text-slate-900">
                              S/ {dept.minPrice.toFixed(2)}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 ml-1">
                              • {dept.totalStock} unds.
                            </span>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all ${meta.btnBg}`}
                          >
                            <span>Ingresar</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Si ya hay productos en el carrito, mostrar también sugerencias relacionadas en la vista principal */}
                {relatedProductsInfo.items.length > 0 && (
                  <div className="bg-gradient-to-br from-amber-50/70 via-white to-blue-50/50 rounded-xl border border-amber-200/80 p-4 shadow-xs">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                            {relatedProductsInfo.title}
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            {relatedProductsInfo.subtitle}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-2.5">
                      {relatedProductsInfo.items.map(({ product: relProd, badge }) => (
                        <div
                          key={relProd.id}
                          className="bg-white rounded-lg border border-slate-200 p-3 flex items-center justify-between gap-2.5 hover:border-[#00346F] transition-all"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-extrabold uppercase mb-1">
                              {badge}
                            </span>
                            <h4 className="text-xs font-bold text-slate-800 truncate">
                              {relProd.nombre}
                            </h4>
                            <p className="text-[11px] font-extrabold text-[#00346F] mt-0.5">
                              S/ {relProd.precioUnitario.toFixed(2)}{' '}
                              <span className="text-[10px] font-normal text-slate-500">
                                • Stock: {relProd.stock}
                              </span>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddToCart(relProd)}
                            className="px-2.5 py-1.5 bg-[#00346F] hover:bg-[#004A99] text-white rounded-lg text-[11px] font-bold flex items-center gap-1 flex-shrink-0 shadow-xs"
                          >
                            <Plus className="w-3 h-3" /> Agregar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* VISTA 2: PRODUCTOS DENTRO DEL DEPARTAMENTO SELECCIONADO + PRODUCTOS RELACIONADOS */
              <div className="flex-1 space-y-4">
                {/* Barra de Navegación del Departamento Activo */}
                <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('DEPARTAMENTOS');
                        setSelectedBrand('TODAS');
                        setSearchProductQuery('');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Departamentos
                    </button>
                    <div className="h-5 w-px bg-slate-200 hidden sm:block" />
                    <div className="flex items-center gap-2">
                      {selectedCategory !== 'TODAS' && selectedCategory !== 'DEPARTAMENTOS' && (
                        <div className="w-8 h-8 rounded-lg bg-[#EFF4FF] flex items-center justify-center">
                          {getCategoryIcon(selectedCategory)}
                        </div>
                      )}
                      <div>
                        <h2 className="text-xs sm:text-sm font-extrabold text-[#0B1C30] uppercase">
                          {selectedCategory === 'TODAS' || selectedCategory === 'DEPARTAMENTOS'
                            ? 'Catálogo Completo de Equipos y Repuestos'
                            : selectedCategory}
                        </h2>
                        <p className="text-[11px] text-slate-500">
                          {filteredProducts.length} {filteredProducts.length === 1 ? 'producto disponible' : 'productos disponibles'} • Precios incluyen IGV (18%)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Filtro rápido de marcas dentro de la categoría */}
                  {brandsList.length > 2 && (
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                      {brandsList.map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setSelectedBrand(b)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold whitespace-nowrap transition-all ${selectedBrand === b
                            ? 'bg-blue-100 text-[#00346F] ring-1 ring-blue-300'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                          {b === 'TODAS' ? 'Todas las Marcas' : b}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Grid de Productos de la Categoría */}
                {filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-3.5">
                    {filteredProducts.map((prod) => {
                      const isInCart = cart.find((i) => i.productoId === prod.id);
                      const isOutOfStock = prod.stock <= 0;

                      return (
                        <div
                          key={prod.id}
                          className={`bg-white rounded-xl border p-4 flex flex-col justify-between transition-all hover:shadow-md ${isInCart
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
                                className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${isOutOfStock
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
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-all active:scale-95 ${isOutOfStock
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

                {/* SECCIÓN DE PRODUCTOS RELACIONADOS Y COMPLEMENTARIOS AL INGRESAR A LA CATEGORÍA */}
                {relatedProductsInfo.items.length > 0 && (
                  <div className="bg-gradient-to-br from-[#EFF4FF] via-white to-amber-50/40 rounded-xl border border-blue-200 p-4 shadow-xs mt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#00346F] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs sm:text-sm font-extrabold text-[#0B1C30]">
                            {relatedProductsInfo.title}
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            {relatedProductsInfo.subtitle}
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-blue-100 text-[#00346F] text-[10px] font-extrabold uppercase self-start sm:self-auto">
                        Sugerencias Compatibles
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-3">
                      {relatedProductsInfo.items.map(({ product: relProd, badge }) => {
                        const isRelInCart = cart.find((i) => i.productoId === relProd.id);
                        return (
                          <div
                            key={relProd.id}
                            className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-col justify-between hover:border-[#00346F] hover:shadow-sm transition-all"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-extrabold uppercase">
                                  {badge}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500">
                                  {relProd.marcaNombre}
                                </span>
                              </div>
                              <div className="flex items-start gap-2">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  {getCategoryIcon(relProd.categoriaNombre)}
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                                    {relProd.nombre}
                                  </h4>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    {relProd.categoriaNombre}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="pt-2.5 border-t border-slate-100 mt-2.5 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] font-bold text-emerald-700 block">
                                  Stock: {relProd.stock} {relProd.unidadMedida}
                                </span>
                                <span className="text-xs font-extrabold text-[#00346F]">
                                  S/ {relProd.precioUnitario.toFixed(2)}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAddToCart(relProd)}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${isRelInCart
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-[#00346F] hover:bg-[#004A99] text-white'
                                  }`}
                              >
                                <Plus className="w-3 h-3" />
                                <span>{isRelInCart ? `+${isRelInCart.cantidad}` : 'Agregar'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT SIDE: CART & CHECKOUT TERMINAL */}
          <div className="w-full lg:w-[340px] xl:w-[400px] 2xl:w-[430px] bg-white border-l border-slate-200 flex flex-col h-full overflow-hidden shadow-lg flex-shrink-0">
            {/* Cart Header */}
            <div className="px-3.5 py-2.5 border-b border-slate-200 bg-[#EFF4FF] flex justify-between items-center flex-shrink-0">
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

            {/* Cart Items List - Max height constrained so checkout panel is never pushed down */}
            <div className="overflow-y-auto p-2.5 space-y-2 border-b border-slate-200 max-h-[26vh] xl:max-h-[30vh] bg-slate-50/50 flex-shrink-0">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div
                    key={item.productoId}
                    className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-1.5 hover:border-blue-300 transition-colors shadow-2xs"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                          {item.nombre}
                        </h4>
                        <p className="font-mono text-[10px] text-slate-500">
                          {item.marca} • P. Unit: S/ {item.precioUnitario.toFixed(2)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(item.productoId)}
                        className="text-slate-400 hover:text-red-600 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.productoId, -1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded font-bold"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-xs px-2 text-slate-800">
                          {item.cantidad}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.productoId, 1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded font-bold"
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

                    {/* Selector de Serie Física para Productos Seriados */}
                    {(() => {
                      const prod = productos.find((p) => p.id === item.productoId);
                      const isSeriado =
                        prod?.requiereSerie ||
                        prod?.categoriaNombre?.toUpperCase().includes('LAPTOP') ||
                        prod?.categoriaNombre?.toUpperCase().includes('IMPRESORA');

                      if (!isSeriado) return null;

                      const hasAllSeries = item.series && item.series.length >= item.cantidad;

                      return (
                        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1.5 text-[10px]">
                          <div className="flex items-center gap-1 min-w-0 flex-1">
                            <Barcode className="w-3 h-3 text-[#00346F] flex-shrink-0" />
                            {hasAllSeries ? (
                              <span className="truncate text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                S/N: {item.series!.join(', ')}
                              </span>
                            ) : (
                              <span className="truncate text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                S/N Pendiente ({item.series?.length || 0}/{item.cantidad})
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenSeriesModal(item)}
                            className={`px-2 py-0.5 rounded font-bold transition-all flex items-center gap-1 flex-shrink-0 text-[10px] ${hasAllSeries
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              : 'bg-[#00346F] hover:bg-[#004A99] text-white shadow-xs'
                              }`}
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span>{hasAllSeries ? 'Cambiar S/N' : 'Asignar S/N'}</span>
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-slate-400 space-y-1">
                  <ShoppingCart className="w-6 h-6 mx-auto text-slate-300" />
                  <p className="font-semibold text-xs text-slate-600">El carrito está vacío</p>
                  <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto">
                    Seleccione productos del catálogo o use el lector de código de barras.
                  </p>
                </div>
              )}
            </div>

            {/* Checkout Options Panel - Compact & Directly Accessible */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs bg-white">
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

                {/* Alerta de Cliente Requerido para Laptops / Equipos con Garantía */}
                {requiresIdentifiedClient && (
                  <div className="mb-2 p-2 bg-amber-50 border border-amber-300 rounded-lg text-[11px] text-amber-900 flex items-start gap-2 shadow-xs animate-in fade-in">
                    <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-900">Cliente Obligatorio por Garantía</p>
                      <p className="text-[10px] text-amber-800 leading-tight mt-0.5">
                        El carrito contiene laptops o equipos con garantía oficial. Debe seleccionar o registrar un cliente para la emisión de la póliza.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (requiresIdentifiedClient) {
                        onShowToast(
                          'No permitido para laptops',
                          'Las Laptops y equipos requieren asociar un cliente específico para el registro de su garantía.',
                          'warning'
                        );
                        return;
                      }
                      setIsConsumidorFinal(true);
                      setIsClientSearchOpen(false);
                      if (tipoComprobante === 'FACTURA') setTipoComprobante('BOLETA');
                    }}
                    disabled={requiresIdentifiedClient}
                    title={requiresIdentifiedClient ? 'Deshabilitado: La venta contiene equipos con garantía' : ''}
                    className={`py-1 px-2 rounded-lg font-bold text-[11px] border transition-all text-center ${requiresIdentifiedClient
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                      : isConsumidorFinal
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
                    className={`py-1 px-2 rounded-lg font-bold text-[11px] border transition-all text-center ${!isConsumidorFinal
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
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${selectedClient.tipoDocumento === 'RUC'
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
                              if (c.estado !== 'ACTIVO') return false;
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
                      className={`py-1.5 rounded-lg font-bold text-[10px] border transition-all ${tipoComprobante === tipo
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
                        className={`py-1.5 px-1 rounded-lg font-bold text-[10px] border flex flex-col items-center justify-center gap-0.5 transition-all ${metodoPago === m.key
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
                disabled={cart.length === 0 || isSubmittingSale}
                onClick={handleProcessSale}
                className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 ${cart.length === 0 || isSubmittingSale
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-[#00346F] hover:bg-[#004A99] text-white'
                  }`}
              >
                {isSubmittingSale ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>EMITIENDO EN MYSQL...</span>
                  </>
                ) : (
                  <>
                    <Receipt className="w-4 h-4" />
                    <span>EMITIR {tipoComprobante} • S/ {totalNeto.toFixed(2)}</span>
                  </>
                )}
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
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">
                  Historial de Comprobantes y Ventas (Base de Datos MySQL)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-[#00346F]">
                  {dbVentas.length > 0 ? `${dbVentas.length} registros en BD` : `${ventas.length} registros locales`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Registro de comprobantes emitidos en el sistema con vinculación de números de serie y garantías vigentes.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={loadDbVentas}
                disabled={loadingHistory}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-300 transition-colors"
                title="Sincronizar con MySQL"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin text-[#00346F]' : ''}`} />
                <span>Refrescar</span>
              </button>

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
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#EFF4FF] font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">N° Comprobante</th>
                  <th className="py-2.5 px-3">Fecha y Hora</th>
                  <th className="py-2.5 px-3">Cliente Receptor</th>
                  <th className="py-2.5 px-3">Ítems / Detalle</th>
                  <th className="py-2.5 px-3">Método Pago</th>
                  <th className="py-2.5 px-3 text-right">Total (S/)</th>
                  <th className="py-2.5 px-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingHistory ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#00346F]" />
                        <span>Consultando ventas en MySQL...</span>
                      </div>
                    </td>
                  </tr>
                ) : (dbVentas.length > 0 ? dbVentas : ventas)
                  .filter((v: any) => {
                    if (!historySearch.trim()) return true;
                    const q = historySearch.toLowerCase();
                    const comp = (v.codigoComprobante || '').toLowerCase();
                    const cliName = (v.cliente?.nombre || v.clienteNombre || '').toLowerCase();
                    const cliDoc = v.cliente?.documento || v.clienteDocumento || '';
                    return comp.includes(q) || cliName.includes(q) || cliDoc.includes(q);
                  })
                  .map((sale: any) => {
                    const isDb = Boolean(sale.cliente && typeof sale.cliente === 'object');
                    const compCode = sale.codigoComprobante;
                    const compType = sale.tipoComprobanteNombre || sale.tipoComprobante || 'BOLETA';
                    const fechaStr = sale.fechaVenta
                      ? new Date(sale.fechaVenta).toLocaleString('es-PE', { hour12: false })
                      : sale.fecha || '-';
                    const cliName = isDb ? sale.cliente.nombre : sale.clienteNombre;
                    const cliDoc = isDb ? sale.cliente.documento : sale.clienteDocumento;
                    const itemsDesc = isDb
                      ? `${sale.totalItems || 1} producto(s) en BD`
                      : `${sale.items?.length || 1} producto(s)`;

                    return (
                      <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-bold text-[#00346F]">
                            {compCode}
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            {compType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{fechaStr}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-800 block">
                            {cliName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Doc: {cliDoc || '00000000'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          <span className="font-medium text-slate-700">{itemsDesc}</span>
                          {sale.sucursal && (
                            <span className="block text-[10px] text-slate-400">
                              Sede: {sale.sucursal}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-700">
                          {sale.metodoPago}
                        </td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-[#00346F]">
                          S/ {Number(sale.total).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={async () => {
                              if (isDb) {
                                // Consultar detalle con series desde el backend
                                const detail = await saleService.getVentaById(sale.id);
                                if (detail.success && detail.venta) {
                                  const v = detail.venta;
                                  const ticketObj: Venta = {
                                    id: v.id,
                                    codigoComprobante: v.codigoComprobante,
                                    tipoComprobante: (v.tipoComprobante as any) || 'BOLETA',
                                    clienteId: v.cliente?.id,
                                    clienteDocumento: v.cliente?.documento || '00000000',
                                    clienteNombre: v.cliente?.nombre || 'CLIENTE',
                                    clienteDireccion: v.cliente?.direccion,
                                    vendedorId: 1,
                                    vendedorNombre: v.vendedor || 'Vendedor',
                                    sucursal: v.sucursal || 'Principal',
                                    fecha: v.fechaVenta ? new Date(v.fechaVenta).toLocaleString('es-PE', { hour12: false }) : '-',
                                    items: (v.items || []).map((it) => ({
                                      productoId: it.productoId,
                                      codigo: it.codigo,
                                      nombre: it.nombre,
                                      categoria: '',
                                      marca: it.marca || '',
                                      precioUnitario: it.precioUnitario,
                                      cantidad: it.cantidad,
                                      subtotal: it.subtotal,
                                      series: it.series?.map((s) => s.numeroSerie) || [],
                                    })),
                                    subtotal: v.subtotal || 0,
                                    igv: v.igv || 0,
                                    descuento: 0,
                                    total: v.total,
                                    metodoPago: (v.metodoPago as any) || 'EFECTIVO',
                                    estado: 'EMITIDO',
                                  };
                                  setCompletedVenta(ticketObj);
                                  const matchedClient = clientes.find(
                                    (c) => c.id === v.cliente?.id || (v.cliente?.documento && c.numeroDocumento === v.cliente.documento)
                                  );
                                  setReceiptEmailInput(matchedClient?.email || v.cliente?.email || '');
                                  setIsReceiptEmailSent(false);
                                  setIsReceiptModalOpen(true);
                                  return;
                                }
                              }
                              setCompletedVenta(sale);
                              const matchedLocal = clientes.find(
                                (c) => c.id === sale.clienteId || (sale.clienteDocumento && c.numeroDocumento === sale.clienteDocumento)
                              );
                              setReceiptEmailInput(
                                matchedLocal?.email || (sale as any)?.cliente?.email || (sale as any)?.clienteEmail || ''
                              );
                              setIsReceiptEmailSent(false);
                              setIsReceiptModalOpen(true);
                            }}

                            className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-300 hover:border-blue-400 text-[#00346F] rounded-lg font-bold text-[11px] flex items-center gap-1 mx-auto shadow-xs"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Ver Ticket</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE COMPROBANTE GENERADO (TICKET POS / FACTURA / ENVÍO AL CORREO DEL CLIENTE) */}
      {isReceiptModalOpen && completedVenta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-3.5 border-b border-slate-200 bg-[#00346F] text-white flex justify-between items-center no-print flex-shrink-0">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Comprobante Emitido • MG Solutions
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsReceiptModalOpen(false);
                  setCompletedVenta(null);
                }}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content: Ticket & Email Section */}
            <div className="flex-1 overflow-y-auto">
              {/* Thermal Ticket Format Container */}
              <div className="printable-content p-5 font-mono text-[11px] text-slate-800 space-y-3 bg-white">
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
                    <div key={idx} className="space-y-0.5 border-b border-dashed border-slate-100 pb-1">
                      <div className="flex justify-between items-start text-[10px]">
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
                      {item.series && item.series.length > 0 && (
                        <div className="text-[8.5px] font-mono text-blue-900 bg-blue-50 px-1 py-0.5 rounded">
                          <span>S/N: {item.series.join(', ')}</span>
                          <span className="font-bold text-emerald-700 ml-1.5">• Garantía 12m</span>
                        </div>
                      )}
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

              {/* SECCIÓN: ENVIAR COMPROBANTE AL CORREO ELECTRÓNICO DEL CLIENTE (no-print) */}
              <div className="no-print p-4 bg-gradient-to-r from-blue-50 to-indigo-50/60 border-t border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#00346F]">
                    <Mail className="w-4 h-4 text-[#00346F]" />
                    <span>Enviar al Correo Electrónico del Cliente</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-full border border-slate-300" title="Correo oficial bloqueado según la ficha del cliente">
                      <Lock className="w-2.5 h-2.5 text-slate-600" />
                      Fijo del Cliente
                    </span>
                    {isReceiptEmailSent && (
                      <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 animate-in fade-in">
                        <Check className="w-3 h-3" />
                        ¡Enviado!
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={receiptEmailInput || 'Sin correo registrado en ficha del cliente'}
                      readOnly
                      disabled
                      title="Por integridad de datos, el correo no se puede alterar al emitir la boleta. Debe corresponder al registrado en el Directorio de Clientes."
                      className="w-full pl-8 pr-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 cursor-not-allowed select-none shadow-2xs"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={isSendingReceiptEmail || !receiptEmailInput.trim()}
                    onClick={handleSendReceiptEmail}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs flex-shrink-0 ${isSendingReceiptEmail || !receiptEmailInput.trim()
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-[#00346F] hover:bg-[#004A99] text-white active:scale-95'
                      }`}
                  >
                    {isSendingReceiptEmail ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Enviar</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  {receiptEmailInput.trim()
                    ? '🔒 Correo bloqueado por integridad: se enviará únicamente al correo titular registrado en la ficha del cliente.'
                    : '⚠️ Este cliente no tiene correo registrado. Para habilitar el envío, actualice su correo en el Directorio de Clientes.'}
                </p>
              </div>
            </div>

            {/* Modal Actions (no-print) */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex gap-2 no-print flex-shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-[#00346F] hover:bg-[#004A99] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Ticket (80mm)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsReceiptModalOpen(false);
                  setCompletedVenta(null);
                }}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all"
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
                  <div className="flex justify-between items-center mb-1">
                    <label className="block font-bold text-slate-700">N° Documento *</label>
                    <span className="text-[10px] text-slate-400">
                      {quickClientForm.tipoDocumento === 'RUC' ? '11 dígitos' : '8 dígitos'}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      required
                      inputMode="numeric"
                      maxLength={quickClientForm.tipoDocumento === 'RUC' ? 11 : 8}
                      value={quickClientForm.numeroDocumento}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (quickClientForm.tipoDocumento === 'DNI') {
                          val = val.slice(0, 8);
                        } else {
                          val = val.slice(0, 11);
                        }
                        setQuickClientForm({
                          ...quickClientForm,
                          numeroDocumento: val,
                        });
                        setDocStatusBadge(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleQueryDocument();
                        }
                      }}
                      placeholder={quickClientForm.tipoDocumento === 'DNI' ? '47891234' : '20609737524'}
                      className="flex-1 p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-[#00346F] focus:outline-none focus:border-[#00346F]"
                    />
                    <button
                      type="button"
                      disabled={isQueryingDoc || !quickClientForm.numeroDocumento}
                      onClick={handleQueryDocument}
                      className="px-3 py-2 bg-[#00346F] hover:bg-[#004A99] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs flex-shrink-0 active:scale-95"
                      title={quickClientForm.tipoDocumento === 'RUC' ? 'Consultar RUC en SUNAT' : 'Consultar DNI en RENIEC'}
                    >
                      {isQueryingDoc ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Consultando...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>{quickClientForm.tipoDocumento === 'RUC' ? 'Buscar SUNAT' : 'Buscar RENIEC'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Badge de Estado SUNAT / RENIEC */}
                  {docStatusBadge && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md animate-in fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>{docStatusBadge}</span>
                    </div>
                  )}
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
                  onChange={(e) => {
                    let val = e.target.value;
                    if (quickClientForm.tipoDocumento === 'DNI') {
                      val = val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑäëïöüÄËÏÖÜ\s]/g, '');
                    }
                    setQuickClientForm({
                      ...quickClientForm,
                      razonSocial: val.toUpperCase(),
                    });
                  }}
                  placeholder="Ej: CORPORACIÓN ACEROS S.A.C."
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={9}
                    value={quickClientForm.telefono}
                    onChange={(e) =>
                      setQuickClientForm({
                        ...quickClientForm,
                        telefono: e.target.value.replace(/\D/g, '').slice(0, 9),
                      })
                    }
                    placeholder="987654321"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block font-bold text-slate-700">Email</label>
                    <span className="text-[10px] text-blue-700 font-semibold flex items-center gap-0.5">
                      <Mail className="w-2.5 h-2.5" /> Envío automático
                    </span>
                  </div>
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

      {/* MODAL DE ASIGNACIÓN DE NÚMEROS DE SERIE FÍSICOS */}
      {seriesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 bg-[#00346F] text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Barcode className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    Asignar Números de Serie • Control de Garantía
                  </h3>
                  <p className="text-[11px] text-blue-100 font-medium">
                    {seriesModal.item.nombre}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSeriesModal(null)}
                className="text-white/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <div>
                  <span className="text-[11px] font-bold text-[#00346F]">
                    Cantidad a entregar al cliente:
                  </span>
                  <div className="text-base font-extrabold text-slate-800">
                    {seriesModal.item.cantidad} unidad(es)
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-600">
                    Series seleccionadas:
                  </span>
                  <div
                    className={`text-base font-extrabold ${seriesModal.selectedSeries.length === seriesModal.item.cantidad
                      ? 'text-emerald-600'
                      : 'text-amber-600'
                      }`}
                  >
                    {seriesModal.selectedSeries.length} / {seriesModal.item.cantidad}
                  </div>
                </div>
              </div>

              {/* Buscador / Lector de código de barras para series registradas en almacén */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block font-bold text-slate-700 text-xs">
                    Buscar o Escanear Serie Física (Pistola Lector de Códigos / Búsqueda):
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Solo series registradas en almacén
                  </span>
                </div>
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={seriesModal.manualInput}
                    onChange={(e) =>
                      setSeriesModal({ ...seriesModal, manualInput: e.target.value.toUpperCase() })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const term = seriesModal.manualInput.trim();
                        if (!term) return;

                        // Validar estrictamente contra unidades registradas en MySQL para garantizar fiabilidad
                        const matchedUnit = seriesModal.availableUnits.find(
                          (u) => u.numeroSerie.toUpperCase() === term.toUpperCase()
                        );

                        if (!matchedUnit) {
                          onShowToast(
                            'Serie no válida o no registrada',
                            `La serie "${term}" no existe en el inventario disponible de esta sede. Para proteger la fiabilidad del stock, solo se pueden asignar series físicas registradas en almacén.`,
                            'error'
                          );
                          return;
                        }

                        if (seriesModal.selectedSeries.includes(matchedUnit.numeroSerie)) {
                          onShowToast(
                            'Serie ya seleccionada',
                            `La serie ${matchedUnit.numeroSerie} ya está en la lista a entregar.`,
                            'info'
                          );
                          setSeriesModal({ ...seriesModal, manualInput: '' });
                          return;
                        }

                        if (seriesModal.selectedSeries.length >= seriesModal.item.cantidad) {
                          onShowToast(
                            'Límite de cantidad',
                            `Solo puede asignar ${seriesModal.item.cantidad} serie(s) para este ítem.`,
                            'warning'
                          );
                          return;
                        }

                        setSeriesModal({
                          ...seriesModal,
                          selectedSeries: [...seriesModal.selectedSeries, matchedUnit.numeroSerie],
                          manualInput: '',
                        });
                        onShowToast('Serie asignada', `Unidad ${matchedUnit.numeroSerie} seleccionada con éxito.`, 'success');
                      }
                    }}
                    placeholder="Escanear con pistola o escribir serie para filtrar..."
                    className="w-full pl-9 pr-24 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-xs focus:bg-white focus:border-[#00346F] focus:ring-1 focus:ring-[#00346F] outline-none"
                  />
                  {seriesModal.manualInput && (
                    <button
                      type="button"
                      onClick={() => setSeriesModal({ ...seriesModal, manualInput: '' })}
                      className="absolute right-20 text-slate-400 hover:text-slate-600 p-1"
                      title="Limpiar búsqueda"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const term = seriesModal.manualInput.trim();
                      if (!term) return;

                      const matchedUnit = seriesModal.availableUnits.find(
                        (u) => u.numeroSerie.toUpperCase() === term.toUpperCase()
                      );

                      if (!matchedUnit) {
                        onShowToast(
                          'Serie no válida o no registrada',
                          `La serie "${term}" no existe en el inventario disponible de esta sede. Para proteger la fiabilidad del stock, solo se pueden asignar series físicas registradas en almacén.`,
                          'error'
                        );
                        return;
                      }

                      if (seriesModal.selectedSeries.includes(matchedUnit.numeroSerie)) {
                        onShowToast(
                          'Serie ya seleccionada',
                          `La serie ${matchedUnit.numeroSerie} ya está en la lista a entregar.`,
                          'info'
                        );
                        setSeriesModal({ ...seriesModal, manualInput: '' });
                        return;
                      }

                      if (seriesModal.selectedSeries.length >= seriesModal.item.cantidad) {
                        onShowToast(
                          'Límite de cantidad',
                          `Solo puede asignar ${seriesModal.item.cantidad} serie(s) para este ítem.`,
                          'warning'
                        );
                        return;
                      }

                      setSeriesModal({
                        ...seriesModal,
                        selectedSeries: [...seriesModal.selectedSeries, matchedUnit.numeroSerie],
                        manualInput: '',
                      });
                      onShowToast('Serie asignada', `Unidad ${matchedUnit.numeroSerie} seleccionada con éxito.`, 'success');
                    }}
                    className="absolute right-1 px-3 py-1.5 bg-[#00346F] hover:bg-blue-900 text-white rounded-md font-bold text-xs flex items-center gap-1 transition-colors"
                  >
                    <Barcode className="w-3.5 h-3.5" />
                    <span>Escanear</span>
                  </button>
                </div>
              </div>

              {/* Lista de Unidades Físicas Registradas en MySQL para este producto */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-bold text-slate-700">
                    Series disponibles en inventario físico:
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {seriesModal.manualInput.trim()
                      ? `${seriesModal.availableUnits.filter(u => u.numeroSerie.toLowerCase().includes(seriesModal.manualInput.trim().toLowerCase())).length} de ${seriesModal.availableUnits.length} disponibles`
                      : `${seriesModal.availableUnits.length} disponibles`}
                  </span>
                </div>

                {seriesModal.loading ? (
                  <div className="p-6 text-center text-slate-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#00346F]" />
                    <span>Consultando unidades en almacén...</span>
                  </div>
                ) : seriesModal.availableUnits.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50">
                    {(() => {
                      const filteredUnits = seriesModal.manualInput.trim()
                        ? seriesModal.availableUnits.filter((u) =>
                            u.numeroSerie.toLowerCase().includes(seriesModal.manualInput.trim().toLowerCase())
                          )
                        : seriesModal.availableUnits;

                      if (filteredUnits.length === 0) {
                        return (
                          <div className="p-4 text-center text-slate-500 text-xs">
                            No se encontraron series registradas que coincidan con &quot;<span className="font-mono font-bold text-slate-700">{seriesModal.manualInput}</span>&quot;.
                          </div>
                        );
                      }

                      return filteredUnits.map((unit) => {
                        const isChecked = seriesModal.selectedSeries.includes(unit.numeroSerie);

                        return (
                          <div
                            key={unit.id}
                            onClick={() => {
                              if (isChecked) {
                                setSeriesModal({
                                  ...seriesModal,
                                  selectedSeries: seriesModal.selectedSeries.filter(
                                    (s) => s !== unit.numeroSerie
                                  ),
                                });
                              } else {
                                if (seriesModal.selectedSeries.length >= seriesModal.item.cantidad) {
                                  onShowToast(
                                    'Límite alcanzado',
                                    `Ya seleccionó las ${seriesModal.item.cantidad} series requeridas.`,
                                    'warning'
                                  );
                                  return;
                                }
                                setSeriesModal({
                                  ...seriesModal,
                                  selectedSeries: [...seriesModal.selectedSeries, unit.numeroSerie],
                                });
                              }
                            }}
                            className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${isChecked
                              ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-300'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                readOnly
                                className="rounded text-[#00346F] focus:ring-0"
                              />
                              <div>
                                <span className="font-mono font-bold text-slate-800">
                                  {unit.numeroSerie}
                                </span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold">
                                    {unit.condicion || 'NUEVO'}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    Sede: {unit.sucursalNombre || 'Principal'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {isChecked && (
                              <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                                Asignado
                              </span>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-1">
                    <p className="font-bold text-amber-800">
                      No hay series físicas disponibles en almacén para este producto.
                    </p>
                    <p className="text-[11px] text-amber-700">
                      Para garantizar la fiabilidad del inventario, este producto requiere haber sido ingresado previamente en Almacén con sus números de serie correspondientes.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
              <span className="text-[11px] text-slate-500">
                Garantía automática: <strong>12 meses</strong> a partir de la emisión.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSeriesModal(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={seriesModal.selectedSeries.length === 0}
                  onClick={() =>
                    handleSaveSeriesForCartItem(
                      seriesModal.item.productoId,
                      seriesModal.selectedSeries
                    )
                  }
                  className={`px-4 py-2 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm ${seriesModal.selectedSeries.length === 0
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-[#00346F] hover:bg-[#004A99] text-white'
                    }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Series ({seriesModal.selectedSeries.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
