import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Boxes,
  Package,
  Layers,
  Search,
  Filter,
  Plus,
  Eye,
  EyeOff,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  QrCode,
  Barcode,
  Laptop,
  Printer,
  Cpu,
  Wrench,
  X,
  RefreshCw,
  Loader2,
  Save,
  Copy,
  Check,
  Building,
  ArrowUpDown,
  FileSpreadsheet,
  AlertCircle,
  Tag,
  Info,
} from 'lucide-react';
import {
  warehouseService,
  ItemInventarioAlmacen,
  UnidadFisicaSerie,
  ResumenAlmacenData,
  RegistrarSeriesPayload,
  CreateProductoPayload,
} from '../services/warehouse.service';
import { Categoria, Marca, Modelo, Sucursal } from '../types';
import { categoryService } from '../services/category.service';
import { brandModelService } from '../services/brandModel.service';

interface WarehouseInventoryViewProps {
  sucursales?: Sucursal[];
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  readOnly?: boolean;
}

export const WarehouseInventoryView: React.FC<WarehouseInventoryViewProps> = ({
  sucursales = [],
  onShowToast,
  readOnly = false,
}) => {
  // ─── ESTADOS PRINCIPALES ───
  const [inventario, setInventario] = useState<ItemInventarioAlmacen[]>([]);
  const [resumen, setResumen] = useState<ResumenAlmacenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Catálogos para filtros y creación
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);

  // Filtros
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<number | 'ALL'>('ALL');
  const [selectedMarcaId, setSelectedMarcaId] = useState<number | 'ALL'>('ALL');
  const [selectedSedeFilter, setSelectedSedeFilter] = useState<number | 'ALL'>('ALL');
  const [selectedDestino, setSelectedDestino] = useState<'ALL' | 'VENTA' | 'SERVICIO_TALLER' | 'MIXTO'>('ALL');
  const [filtroCondicion, setFiltroCondicion] = useState<'ALL' | 'CON_CUARENTENA' | 'SOLO_DISPONIBLES' | 'STOCK_BAJO'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // ─── MODAL DE GESTIÓN DE SERIES ───
  const [selectedProductoForSeries, setSelectedProductoForSeries] = useState<ItemInventarioAlmacen | null>(null);
  const [unidadesList, setUnidadesList] = useState<UnidadFisicaSerie[]>([]);
  const [loadingUnidades, setLoadingUnidades] = useState(false);
  const [activeSeriesTab, setActiveSeriesTab] = useState<'list' | 'add'>('list');

  // Formulario de ingreso de nuevas series
  const [inputSeriesRaw, setInputSeriesRaw] = useState('');
  const [inputSucursalId, setInputSucursalId] = useState<number>(1);
  const [inputCondicion, setInputCondicion] = useState<'NUEVO' | 'DANADO_RECEPCION' | 'DEFECTUOSO' | 'USADO'>('NUEVO');
  const [inputTipoDestino, setInputTipoDestino] = useState<'VENTA' | 'SERVICIO_TALLER' | 'MIXTO'>('VENTA');
  const [inputVisibleVenta, setInputVisibleVenta] = useState(true);
  const [inputObservaciones, setInputObservaciones] = useState('');
  const [isSubmittingSeries, setIsSubmittingSeries] = useState(false);

  // Modal para reportar unidad a cuarentena / dañada
  const [unidadToQuarantine, setUnidadToQuarantine] = useState<UnidadFisicaSerie | null>(null);
  const [motivoCuarentena, setMotivoCuarentena] = useState('');
  const [isSubmittingQuarantine, setIsSubmittingQuarantine] = useState(false);

  // Copiado al portapapeles
  const [copiedSerie, setCopiedSerie] = useState<string | null>(null);

  // ─── MODAL DE CREACIÓN DE PRODUCTO ───
  const [isNewProdModalOpen, setIsNewProdModalOpen] = useState(false);
  const [newProdData, setNewProdData] = useState<CreateProductoPayload>({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoriaId: 1,
    marcaId: 1,
    modeloId: null,
    precioVenta: 0,
    precioCosto: 0,
    stockMinimo: 3,
    requiereSerie: false,
    disponibleVenta: true,
    tipoDestino: 'VENTA',
    stockInicial: 0,
    sucursalId: 1,
  });
  const [isSubmittingProd, setIsSubmittingProd] = useState(false);

  // ─── CARGA INICIAL DE DATOS ───
  const fetchAllData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const sedeParam = selectedSedeFilter === 'ALL' ? null : selectedSedeFilter;
      const [resInv, resRes, resCat, resMar, resMod] = await Promise.all([
        warehouseService.getInventario({ sucursal_id: sedeParam }),
        warehouseService.getResumen(sedeParam),
        categoryService.getCategorias(),
        brandModelService.getMarcas(),
        brandModelService.getModelos(),
      ]);

      if (resInv.success && resInv.inventario) {
        setInventario(resInv.inventario);
      }
      if (resRes.success && resRes.data) {
        setResumen(resRes.data);
      }
      if (resCat.success && resCat.categorias) {
        setCategorias(resCat.categorias);
      }
      if (resMar.success && resMar.marcas) {
        setMarcas(resMar.marcas);
      }
      if (resMod.success && resMod.modelos) {
        setModelos(resMod.modelos);
      }
    } catch (error) {
      console.error('Error cargando almacén:', error);
      onShowToast('Error', 'No se pudieron sincronizar los datos de almacén con el servidor.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSedeFilter, onShowToast]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Cargar series cuando se abre el modal de un producto
  const handleOpenSeriesModal = async (prod: ItemInventarioAlmacen) => {
    setSelectedProductoForSeries(prod);
    setActiveSeriesTab('list');
    setInputSeriesRaw('');
    setInputCondicion('NUEVO');
    setInputTipoDestino(prod.tipoDestino);
    setInputVisibleVenta(prod.disponibleVenta);
    setInputObservaciones('');
    setLoadingUnidades(true);

    try {
      const sedeParam = selectedSedeFilter === 'ALL' ? null : selectedSedeFilter;
      const res = await warehouseService.getUnidades(prod.id, sedeParam);
      if (res.success && res.unidades) {
        setUnidadesList(res.unidades);
      } else {
        setUnidadesList([]);
      }
    } catch (err) {
      console.error('Error al cargar unidades:', err);
      onShowToast('Error', 'No se pudieron cargar los números de serie.', 'error');
    } finally {
      setLoadingUnidades(false);
    }
  };

  // ─── ALTERNAR VISIBILIDAD DE VENTA (POS) ───
  const handleToggleVisibilidadVenta = async (prod: ItemInventarioAlmacen) => {
    try {
      const nuevoEstado = !prod.disponibleVenta;
      const res = await warehouseService.toggleVisibilidadVenta(prod.id, nuevoEstado);
      if (res.success) {
        setInventario((prev) =>
          prev.map((item) => (item.id === prod.id ? { ...item, disponibleVenta: nuevoEstado } : item))
        );
        onShowToast(
          nuevoEstado ? 'Visible en Punto de Venta' : 'Oculto para Vendedores',
          res.message,
          nuevoEstado ? 'success' : 'warning'
        );
        // Actualizar resumen
        const resStats = await warehouseService.getResumen();
        if (resStats.success && resStats.data) setResumen(resStats.data);
      } else {
        onShowToast('Error', res.message || 'No se pudo cambiar la visibilidad.', 'error');
      }
    } catch (err) {
      onShowToast('Error', 'Error al conectar con el servidor.', 'error');
    }
  };

  // ─── REGISTRAR NUEVAS SERIES ───
  const handleRegistrarSeries = async () => {
    if (!selectedProductoForSeries) return;

    // Procesar números de serie ingresados (por coma o salto de línea)
    const seriesParsed = inputSeriesRaw
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (seriesParsed.length === 0) {
      onShowToast('Atención', 'Ingrese al menos un número de serie válido.', 'warning');
      return;
    }

    setIsSubmittingSeries(true);
    try {
      const payload: RegistrarSeriesPayload = {
        sucursalId: inputSucursalId || 1,
        series: seriesParsed,
        tipoDestino: inputTipoDestino,
        disponibleVenta: inputCondicion === 'DANADO_RECEPCION' || inputCondicion === 'DEFECTUOSO' ? false : inputVisibleVenta,
        condicion: inputCondicion,
        observaciones: inputObservaciones,
      };

      const res = await warehouseService.registrarUnidades(selectedProductoForSeries.id, payload);
      if (res.success) {
        onShowToast(
          'Recepción Exitosa',
          `Se registraron ${res.unidadesRegistradas} unidades. ${res.estadoAsignado || ''}`,
          'success'
        );

        // Recargar unidades del producto y todo el inventario
        const [resUnits, resInv, resRes] = await Promise.all([
          warehouseService.getUnidades(selectedProductoForSeries.id),
          warehouseService.getInventario(),
          warehouseService.getResumen(),
        ]);

        if (resUnits.success && resUnits.unidades) setUnidadesList(resUnits.unidades);
        if (resInv.success && resInv.inventario) {
          setInventario(resInv.inventario);
          const updatedProd = resInv.inventario.find((p) => p.id === selectedProductoForSeries.id);
          if (updatedProd) setSelectedProductoForSeries(updatedProd);
        }
        if (resRes.success && resRes.data) setResumen(resRes.data);

        // Volver a la pestaña de listado
        setActiveSeriesTab('list');
        setInputSeriesRaw('');
      } else {
        onShowToast('Error al registrar', res.message || 'No se pudieron registrar las series.', 'error');
      }
    } catch (err) {
      onShowToast('Error', 'Ocurrió un error inesperado al registrar series.', 'error');
    } finally {
      setIsSubmittingSeries(false);
    }
  };

  // ─── MARCAR UNIDAD A CUARENTENA / DAÑADA ───
  const handleConfirmQuarantine = async () => {
    if (!unidadToQuarantine || !selectedProductoForSeries) return;

    setIsSubmittingQuarantine(true);
    try {
      const res = await warehouseService.updateEstadoUnidad(unidadToQuarantine.id, {
        estadoUnidadId: 5, // DANADO_CUARENTENA
        condicion: 'DANADO_RECEPCION',
        disponibleVenta: false,
        observaciones: motivoCuarentena.trim() || 'Reportado en mal estado / cuarentena en almacén',
      });

      if (res.success) {
        onShowToast(
          'Unidad en Cuarentena',
          `Serie ${unidadToQuarantine.numeroSerie} apartada y bloqueada para venta.`,
          'warning'
        );

        // Recargar lista de unidades e inventario
        const [resUnits, resInv, resRes] = await Promise.all([
          warehouseService.getUnidades(selectedProductoForSeries.id),
          warehouseService.getInventario(),
          warehouseService.getResumen(),
        ]);

        if (resUnits.success && resUnits.unidades) setUnidadesList(resUnits.unidades);
        if (resInv.success && resInv.inventario) {
          setInventario(resInv.inventario);
          const updatedProd = resInv.inventario.find((p) => p.id === selectedProductoForSeries.id);
          if (updatedProd) setSelectedProductoForSeries(updatedProd);
        }
        if (resRes.success && resRes.data) setResumen(resRes.data);

        setUnidadToQuarantine(null);
        setMotivoCuarentena('');
      } else {
        onShowToast('Error', res.message || 'No se pudo cambiar el estado.', 'error');
      }
    } catch (err) {
      onShowToast('Error', 'Error de conexión con el servidor.', 'error');
    } finally {
      setIsSubmittingQuarantine(false);
    }
  };

  // ─── REINTEGRAR UNIDAD A DISPONIBLE ───
  const handleReintegrateUnit = async (unidad: UnidadFisicaSerie) => {
    if (!selectedProductoForSeries) return;
    try {
      const res = await warehouseService.updateEstadoUnidad(unidad.id, {
        estadoUnidadId: 1, // DISPONIBLE
        condicion: 'NUEVO',
        disponibleVenta: true,
        observaciones: `Reintegrada a venta operativa (${new Date().toLocaleDateString('es-PE')})`,
      });

      if (res.success) {
        onShowToast('Unidad Reintegrada', `Serie ${unidad.numeroSerie} nuevamente disponible para venta.`, 'success');
        const [resUnits, resInv, resRes] = await Promise.all([
          warehouseService.getUnidades(selectedProductoForSeries.id),
          warehouseService.getInventario(),
          warehouseService.getResumen(),
        ]);

        if (resUnits.success && resUnits.unidades) setUnidadesList(resUnits.unidades);
        if (resInv.success && resInv.inventario) {
          setInventario(resInv.inventario);
          const updatedProd = resInv.inventario.find((p) => p.id === selectedProductoForSeries.id);
          if (updatedProd) setSelectedProductoForSeries(updatedProd);
        }
        if (resRes.success && resRes.data) setResumen(resRes.data);
      } else {
        onShowToast('Error', res.message, 'error');
      }
    } catch (err) {
      onShowToast('Error', 'Error al reintegrar unidad.', 'error');
    }
  };

  // Copiar número de serie
  const handleCopySerie = (serie: string) => {
    navigator.clipboard.writeText(serie);
    setCopiedSerie(serie);
    setTimeout(() => setCopiedSerie(null), 2000);
  };

  // ─── CREAR NUEVO PRODUCTO ───
  const handleCreateProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdData.nombre.trim()) {
      onShowToast('Atención', 'El nombre del producto es requerido.', 'warning');
      return;
    }

    setIsSubmittingProd(true);
    try {
      const res = await warehouseService.createProducto(newProdData);
      if (res.success) {
        onShowToast('Producto Creado', 'El producto ha sido registrado en el almacén.', 'success');
        setIsNewProdModalOpen(false);
        fetchAllData(true);
      } else {
        onShowToast('Error', res.message || 'No se pudo crear el producto.', 'error');
      }
    } catch (err) {
      onShowToast('Error', 'Error inesperado al crear el producto.', 'error');
    } finally {
      setIsSubmittingProd(false);
    }
  };

  // ─── FILTRADO DE ITEMS ───
  const filteredInventario = useMemo(() => {
    return inventario.filter((item) => {
      // Filtro Categoría
      if (selectedCategoriaId !== 'ALL' && item.categoria.id !== selectedCategoriaId) {
        return false;
      }
      // Filtro Marca
      if (selectedMarcaId !== 'ALL' && item.marca.id !== selectedMarcaId) {
        return false;
      }
      // Filtro Destino
      if (selectedDestino !== 'ALL' && item.tipoDestino !== selectedDestino) {
        return false;
      }
      // Filtro Condición
      if (filtroCondicion === 'CON_CUARENTENA' && item.seriesMetricas.cuarentenaDanadas === 0) {
        return false;
      }
      if (filtroCondicion === 'SOLO_DISPONIBLES' && (!item.disponibleVenta || item.stockTotal <= 0)) {
        return false;
      }
      if (filtroCondicion === 'STOCK_BAJO' && item.stockTotal > item.stockMinimo) {
        return false;
      }
      // Búsqueda en texto
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchNombre = item.nombre.toLowerCase().includes(term);
        const matchCodigo = item.codigo.toLowerCase().includes(term);
        const matchMarca = item.marca.nombre.toLowerCase().includes(term);
        const matchModelo = item.modelo?.nombre.toLowerCase().includes(term);
        const matchDetalles = item.modelo?.caracteristicas?.some(
          (c) => c.atributo.toLowerCase().includes(term) || c.valor.toLowerCase().includes(term)
        );
        if (!matchNombre && !matchCodigo && !matchMarca && !matchModelo && !matchDetalles) {
          return false;
        }
      }
      return true;
    });
  }, [inventario, selectedCategoriaId, selectedMarcaId, selectedDestino, filtroCondicion, searchTerm]);

  // Catálogos activos (excluyen los desactivados/inactivos)
  const categoriasActivas = useMemo(() => {
    return categorias.filter((c) => c.estado === 'ACTIVO' || c.estadoId === 1);
  }, [categorias]);

  const marcasActivas = useMemo(() => {
    return marcas.filter((m) => m.estado === 'ACTIVO' || m.estadoId === 1);
  }, [marcas]);

  const modelosActivos = useMemo(() => {
    return modelos.filter((m) => m.estado === 'ACTIVO' || m.estadoId === 1);
  }, [modelos]);

  // Modelos filtrados por la marca seleccionada en el formulario de creación
  const modelosFiltradosParaCrear = useMemo(() => {
    if (!newProdData.marcaId) return [];
    return modelosActivos.filter((m) => m.marcaId === Number(newProdData.marcaId));
  }, [modelosActivos, newProdData.marcaId]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8F9FF] p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* ─── HEADER PRINCIPAL ─── */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00346F] text-white shadow-md">
                <Boxes className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00346F]">
                  Módulo de Almacén & Existencias
                </p>
                <h1 className="text-2xl font-black tracking-tight text-[#0B1C30] md:text-3xl">
                  Control de Inventario y Series
                </h1>
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Jerarquía en cascada: Categoría ➔ Marca ➔ Modelo con especificaciones técnicas, números de serie y estado operativo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => fetchAllData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-[#00346F]' : ''}`} />
              Sincronizar
            </button>

            {!readOnly && (
              <button
                type="button"
                onClick={() => {
                  const primeraCat = categoriasActivas[0]?.id || 1;
                  const marcasDeCat = marcasActivas.filter((m) => !m.categoriaId || m.categoriaId === primeraCat);
                  const primeraMarca = marcasDeCat[0]?.id || marcasActivas[0]?.id || 1;

                  setNewProdData({
                    codigo: `PRD-${Date.now().toString().slice(-5)}`,
                    nombre: '',
                    descripcion: '',
                    categoriaId: primeraCat,
                    marcaId: primeraMarca,
                    modeloId: null,
                    precioVenta: 0,
                    precioCosto: 0,
                    stockMinimo: 3,
                    requiereSerie: primeraCat <= 3,
                    disponibleVenta: true,
                    tipoDestino: 'VENTA',
                    stockInicial: 0,
                    sucursalId: 1,
                  });
                  setIsNewProdModalOpen(true);
                }}
                className="flex items-center gap-2 rounded-xl bg-[#00346F] px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#004A99] active:scale-95"
              >
                <Plus className="h-4 w-4" />
                + Nuevo Producto / Equipo
              </button>
            )}
          </div>
        </div>

        {/* ─── TARJETAS DE INDICADORES (RESUMEN) ─── */}
        {resumen && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total en Stock</span>
                <Package className="h-4 w-4 text-[#00346F]" />
              </div>
              <p className="mt-2 text-2xl font-black text-[#0B1C30]">{resumen.totalUnidadesStock}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">{resumen.totalProductos} productos registrados</p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm">
              <div className="flex items-center justify-between text-emerald-700">
                <span className="text-[11px] font-bold uppercase tracking-wider">Series Vendibles</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="mt-2 text-2xl font-black text-emerald-800">{resumen.seriesDisponiblesVenta}</p>
              <p className="mt-0.5 text-[11px] text-emerald-600">Disponibles en vitrina / almacén</p>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 shadow-sm">
              <div className="flex items-center justify-between text-rose-700">
                <span className="text-[11px] font-bold uppercase tracking-wider">En Cuarentena</span>
                <ShieldAlert className="h-4 w-4 text-rose-600" />
              </div>
              <p className="mt-2 text-2xl font-black text-rose-800">{resumen.seriesCuarentenaDanadas}</p>
              <p className="mt-0.5 text-[11px] font-medium text-rose-600">
                {resumen.seriesCuarentenaDanadas > 0 ? 'Dañadas / Bloqueadas de venta' : 'Sin incidencias'}
              </p>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 shadow-sm">
              <div className="flex items-center justify-between text-indigo-700">
                <span className="text-[11px] font-bold uppercase tracking-wider">Taller / Servicio</span>
                <Wrench className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="mt-2 text-2xl font-black text-indigo-800">{resumen.seriesUsoTaller}</p>
              <p className="mt-0.5 text-[11px] text-indigo-600">Repuestos o equipos de prueba</p>
            </div>

            <div className="col-span-2 rounded-2xl border border-blue-100 bg-blue-50/40 p-4 shadow-sm sm:col-span-4 lg:col-span-1">
              <div className="flex items-center justify-between text-[#00346F]">
                <span className="text-[11px] font-bold uppercase tracking-wider">Visibilidad POS</span>
                <Eye className="h-4 w-4 text-[#00346F]" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl font-black text-[#00346F]">{resumen.productosVisiblesPOS}</span>
                <span className="text-xs text-slate-500">visibles /</span>
                <span className="text-sm font-bold text-amber-700">{resumen.productosOcultosPOS}</span>
                <span className="text-xs text-slate-500">ocultos</span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500">Control directo por producto</p>
            </div>
          </div>
        )}

        {/* ─── FILTROS Y BÚSQUEDA AVANZADA ─── */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm md:p-5">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-6">
            {/* Buscador */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por modelo, serie, código, procesador..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-[#00346F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00346F]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Selector de Sede */}
            <div>
              <select
                value={selectedSedeFilter}
                onChange={(e) => {
                  const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                  setSelectedSedeFilter(val);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 focus:border-[#00346F] focus:outline-none focus:ring-1 focus:ring-[#00346F]"
              >
                <option value="ALL">🏢 Todas las Sedes</option>
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id}>
                    📍 {s.nombre.replace(/^[0-9]+ - /, '')}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Categoría */}
            <div>
              <select
                value={selectedCategoriaId}
                onChange={(e) => {
                  const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                  setSelectedCategoriaId(val);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 focus:border-[#00346F] focus:outline-none focus:ring-1 focus:ring-[#00346F]"
              >
                <option value="ALL">📁 Todas las Categorías</option>
                {categoriasActivas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.id <= 3 ? '🔍 (Exige Serie)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Marca */}
            <div>
              <select
                value={selectedMarcaId}
                onChange={(e) => {
                  const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                  setSelectedMarcaId(val);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 focus:border-[#00346F] focus:outline-none focus:ring-1 focus:ring-[#00346F]"
              >
                <option value="ALL">🏷️ Todas las Marcas</option>
                {marcasActivas
                  .filter((m) => selectedCategoriaId === 'ALL' || m.categoriaId === selectedCategoriaId)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
              </select>
            </div>

            {/* Filtro por Condición de Stock */}
            <div>
              <select
                value={filtroCondicion}
                onChange={(e) => setFiltroCondicion(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 focus:border-[#00346F] focus:outline-none focus:ring-1 focus:ring-[#00346F]"
              >
                <option value="ALL">⚡ Todos los Estados</option>
                <option value="CON_CUARENTENA">⚠️ Con Cuarentena</option>
                <option value="SOLO_DISPONIBLES">🟢 Disponibles Venta</option>
                <option value="STOCK_BAJO">🔴 Stock Crítico</option>
              </select>
            </div>
          </div>

          {/* Filtros rápidos tipo destino */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Destino:</span>
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'VENTA', label: 'Venta Comercial Directa' },
              { id: 'SERVICIO_TALLER', label: 'Uso Interno / Taller' },
              { id: 'MIXTO', label: 'Mixto / Repuestos de Venta' },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedDestino(d.id as any)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                  selectedDestino === d.id
                    ? 'bg-[#00346F] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d.label}
              </button>
            ))}

            {(selectedCategoriaId !== 'ALL' ||
              selectedMarcaId !== 'ALL' ||
              selectedDestino !== 'ALL' ||
              filtroCondicion !== 'ALL' ||
              searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategoriaId('ALL');
                  setSelectedMarcaId('ALL');
                  setSelectedDestino('ALL');
                  setFiltroCondicion('ALL');
                  setSearchTerm('');
                }}
                className="ml-auto flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700"
              >
                <X className="h-3 w-3" /> Limpiar Filtros
              </button>
            )}
          </div>
        </div>

        {/* ─── LISTADO DE PRODUCTOS Y MODELOS ─── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#00346F]" />
            <p className="mt-3 text-xs font-semibold text-slate-500">Cargando inventario de almacén...</p>
          </div>
        ) : filteredInventario.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <Package className="h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-700">No se encontraron productos en el almacén</p>
            <p className="mt-1 text-xs text-slate-400">
              Prueba cambiando los filtros o registra un nuevo equipo haciendo clic en "+ Nuevo Producto / Equipo".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredInventario.map((item) => {
              const hasQuarantine = item.seriesMetricas.cuarentenaDanadas > 0;
              const isLaptopOrPrinter =
                item.categoria.nombre.includes('LAPTOP') ||
                item.categoria.nombre.includes('IMPRESORA') ||
                item.categoria.nombre.includes('MONITOR');

              return (
                <div
                  key={item.id}
                  className={`relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
                    hasQuarantine ? 'border-amber-300/80 bg-amber-50/10' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    {/* Bloque Izquierdo: Jerarquía y Detalles Técnicos */}
                    <div className="flex-1 space-y-3">
                      {/* Cabecera de Categoría y Marca */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#00346F]/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#00346F]">
                          {item.categoria.nombre}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-slate-700">
                          🏷️ {item.marca.nombre}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">{item.codigo}</span>

                        {/* Badge de Requisito de Serie */}
                        {item.requiereSerie && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">
                            <Barcode className="h-3 w-3" /> N° Serie Individual
                          </span>
                        )}

                        {/* Badge de Tipo de Destino */}
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            item.tipoDestino === 'VENTA'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : item.tipoDestino === 'SERVICIO_TALLER'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {item.tipoDestino === 'VENTA'
                            ? 'Venta Comercial'
                            : item.tipoDestino === 'SERVICIO_TALLER'
                            ? 'Uso Interno Taller'
                            : 'Mixto (Repuesto Vendible)'}
                        </span>
                      </div>

                      {/* Título y Modelo */}
                      <div>
                        <h2 className="text-base font-bold text-[#0B1C30] md:text-lg">{item.nombre}</h2>
                        {item.modelo && (
                          <p className="mt-0.5 text-xs font-semibold text-slate-600">
                            Modelo: <span className="text-[#00346F]">{item.modelo.nombre}</span>
                            {item.modelo.descripcion ? ` — ${item.modelo.descripcion}` : ''}
                          </p>
                        )}
                      </div>

                      {/* Características Técnicas (detalle_modelo) */}
                      {item.modelo?.caracteristicas && item.modelo.caracteristicas.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {item.modelo.caracteristicas.map((carac, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-[11px] text-slate-700"
                            >
                              <span className="font-bold text-slate-900">{carac.atributo}:</span>
                              <span>{carac.valor}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Alerta de Cuarentena si hay unidades dañadas */}
                      {hasQuarantine && (
                        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/90 px-3 py-2 text-xs font-medium text-rose-800">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                          <span>
                            <strong>Atención de Almacén:</strong> Hay{' '}
                            <strong>{item.seriesMetricas.cuarentenaDanadas} unidad(es)</strong> reportadas en mal estado / cuarentena.
                            Están <strong>ocultas del Punto de Venta</strong> para evitar despachos erróneos.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bloque Derecho: Stock, Precios y Controles de Venta */}
                    <div className="flex flex-col items-start gap-4 lg:items-end lg:border-l lg:border-slate-100 lg:pl-6">
                      {/* Métricas de Unidades */}
                      <div className="flex items-center gap-3 text-center flex-wrap justify-end">
                        {selectedSedeFilter !== 'ALL' && (
                          <div className="rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-1 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#00346F]">En Esta Sede</p>
                            <p className="text-xl font-black text-[#00346F]">{item.stockSede ?? 0}</p>
                          </div>
                        )}

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Stock Total</p>
                          <p className="text-xl font-black text-[#0B1C30]">{item.stockTotal}</p>
                        </div>

                        <div className="border-l border-slate-200 pl-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Disponibles</p>
                          <p className="text-xl font-black text-emerald-700">
                            {item.requiereSerie ? item.seriesMetricas.disponibles : item.stockTotal}
                          </p>
                        </div>

                        {item.seriesMetricas.cuarentenaDanadas > 0 && (
                          <div className="border-l border-rose-200 pl-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Dañados/Cuar.</p>
                            <p className="text-xl font-black text-rose-700">{item.seriesMetricas.cuarentenaDanadas}</p>
                          </div>
                        )}

                        <div className="border-l border-slate-200 pl-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Precio Venta</p>
                          <p className="text-base font-extrabold text-[#00346F]">S/ {item.precioVenta.toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Desglose de Stock por Sede */}
                      {item.stockPorSede && item.stockPorSede.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap justify-end text-[10px]">
                          <span className="font-bold text-slate-400 uppercase tracking-wider">Sedes:</span>
                          {item.stockPorSede.map((s) => (
                            <span
                              key={s.sucursalId}
                              className={`px-2 py-0.5 rounded-full font-bold border ${
                                selectedSedeFilter === s.sucursalId
                                  ? 'bg-[#00346F] text-white border-[#00346F]'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                              title={`${s.sucursalNombre}: ${s.stock} unidades`}
                            >
                              {s.sucursalNombre.replace(/^[0-9]+ - /, '').split(' ')[0]}: {s.stock}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Switch de Visibilidad para Venta en POS */}
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5">
                        <span className="text-[11px] font-semibold text-slate-600">
                          {item.disponibleVenta ? '🟢 Visible en POS' : '🔴 Oculto en POS'}
                        </span>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => handleToggleVisibilidadVenta(item)}
                            title={
                              item.disponibleVenta
                                ? 'Haga clic para ocultar a los vendedores en Punto de Venta'
                                : 'Haga clic para mostrar a los vendedores en Punto de Venta'
                            }
                            className={`flex h-6 w-11 items-center rounded-full p-1 transition-colors ${
                              item.disponibleVenta ? 'bg-emerald-600' : 'bg-slate-300'
                            }`}
                          >
                            <div
                              className={`h-4 w-4 rounded-full bg-white shadow-md transition-transform ${
                                item.disponibleVenta ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        )}
                      </div>

                      {/* Botones de Acción para Series */}
                      <div className="flex flex-wrap items-center gap-2">
                        {item.requiereSerie ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenSeriesModal(item)}
                              className="flex items-center gap-1.5 rounded-xl border border-[#00346F] bg-white px-3.5 py-2 text-xs font-bold text-[#00346F] shadow-sm transition hover:bg-[#EFF4FF]"
                            >
                              <Barcode className="h-3.5 w-3.5" />
                              Ver Series ({item.seriesMetricas.total})
                            </button>

                            {!readOnly && (
                              <button
                                type="button"
                                onClick={() => {
                                  handleOpenSeriesModal(item);
                                  setActiveSeriesTab('add');
                                }}
                                className="flex items-center gap-1.5 rounded-xl bg-[#00346F] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#004A99]"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                + Ingresar Series
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Control numérico a granel</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── MODAL DE GESTIÓN Y TRAZABILIDAD DE SERIES ─── */}
        {selectedProductoForSeries && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              {/* Header Modal */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-[#0B1C30] px-6 py-4 text-white">
                <div>
                  <div className="flex items-center gap-2">
                    <Barcode className="h-5 w-5 text-emerald-400" />
                    <h3 className="text-base font-bold">Trazabilidad por Números de Serie</h3>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-300">
                    {selectedProductoForSeries.marca.nombre} — {selectedProductoForSeries.nombre}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProductoForSeries(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Pestañas del Modal */}
              <div className="flex border-b border-slate-200 bg-slate-50 px-6">
                <button
                  type="button"
                  onClick={() => setActiveSeriesTab('list')}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${
                    activeSeriesTab === 'list'
                      ? 'border-[#00346F] text-[#00346F]'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Package className="h-4 w-4" />
                  Unidades Físicas Registradas ({unidadesList.length})
                </button>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => setActiveSeriesTab('add')}
                    className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${
                      activeSeriesTab === 'add'
                        ? 'border-[#00346F] text-[#00346F]'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                    + Ingresar Nuevas Series (Recepción)
                  </button>
                )}
              </div>

              {/* Contenido Modal */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeSeriesTab === 'list' ? (
                  loadingUnidades ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-[#00346F]" />
                      <p className="mt-2 text-xs text-slate-500">Cargando números de serie...</p>
                    </div>
                  ) : unidadesList.length === 0 ? (
                    <div className="py-12 text-center">
                      <Barcode className="mx-auto h-8 w-8 text-slate-300" />
                      <p className="mt-2 text-sm font-bold text-slate-700">No hay series registradas aún</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Ve a la pestaña "+ Ingresar Nuevas Series" para registrar los números de serie de esta máquina.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            <th className="pb-3">Número de Serie</th>
                            <th className="pb-3">Estado Operativo</th>
                            <th className="pb-3">Condición</th>
                            <th className="pb-3">Sucursal</th>
                            <th className="pb-3">En POS</th>
                            <th className="pb-3 text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {unidadesList.map((u) => {
                            const isDanado = u.estadoCodigo === 'DANADO_CUARENTENA';
                            const isVendido = u.estadoCodigo === 'VENDIDO';
                            const isTaller = u.estadoCodigo === 'EN_SERVICIO';

                            return (
                              <tr key={u.id} className="hover:bg-slate-50/80">
                                <td className="py-3 font-mono font-bold text-slate-800">
                                  <div className="flex items-center gap-2">
                                    <span>{u.numeroSerie}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopySerie(u.numeroSerie)}
                                      title="Copiar N° de serie"
                                      className="text-slate-400 hover:text-slate-600"
                                    >
                                      {copiedSerie === u.numeroSerie ? (
                                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                                      ) : (
                                        <Copy className="h-3.5 w-3.5" />
                                      )}
                                    </button>
                                  </div>
                                  {u.observaciones && (
                                    <p className="mt-0.5 text-[10px] font-normal text-rose-600 italic">
                                      {u.observaciones}
                                    </p>
                                  )}
                                </td>

                                <td className="py-3">
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                      isDanado
                                        ? 'bg-rose-100 text-rose-800'
                                        : isVendido
                                        ? 'bg-slate-200 text-slate-700'
                                        : isTaller
                                        ? 'bg-indigo-100 text-indigo-800'
                                        : 'bg-emerald-100 text-emerald-800'
                                    }`}
                                  >
                                    {isDanado ? '⚠️ En Cuarentena' : u.estadoNombre}
                                  </span>
                                </td>

                                <td className="py-3 text-slate-600">
                                  <span className="font-semibold">{u.condicion}</span>
                                </td>

                                <td className="py-3 text-slate-600">{u.sucursalNombre}</td>

                                <td className="py-3">
                                  {u.disponibleVenta ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                                      <CheckCircle2 className="h-3 w-3" /> Sí
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                                      <XCircle className="h-3 w-3" /> Oculto
                                    </span>
                                  )}
                                </td>

                                <td className="py-3 text-right">
                                  {!readOnly && (
                                    <div className="flex items-center justify-end gap-1.5">
                                      {!isDanado && !isVendido && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setUnidadToQuarantine(u);
                                            setMotivoCuarentena('');
                                          }}
                                          className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100"
                                        >
                                          Mover a Cuarentena
                                        </button>
                                      )}

                                      {isDanado && (
                                        <button
                                          type="button"
                                          onClick={() => handleReintegrateUnit(u)}
                                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100"
                                        >
                                          Reintegrar a Venta
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : (
                  /* Formulario de Ingreso de Series */
                  <div className="space-y-4">
                    <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-800">
                      <p className="font-bold">Instrucciones de Recepción:</p>
                      <p className="mt-0.5">
                        Puedes pegar múltiples números de serie separados por <strong>saltos de línea</strong> o por{' '}
                        <strong>comas</strong>. Si el lote o alguna máquina llegó con golpe de fábrica, puedes marcar la
                        condición como "Dañado en Recepción" para que se envíe directamente a cuarentena sin riesgo de ser vendida.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-bold text-slate-700">Sucursal de Destino</label>
                        <select
                          value={inputSucursalId}
                          onChange={(e) => setInputSucursalId(Number(e.target.value))}
                          className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold"
                        >
                          {sucursales.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.nombre}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-bold text-slate-700">Condición de Recepción</label>
                        <select
                          value={inputCondicion}
                          onChange={(e) => setInputCondicion(e.target.value as any)}
                          className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold"
                        >
                          <option value="NUEVO">🟢 Nuevo (Sellado / En óptimo estado)</option>
                          <option value="DANADO_RECEPCION">🔴 Dañado en Recepción (Separar a Cuarentena)</option>
                          <option value="DEFECTUOSO">⚠️ Falla de Fábrica / Defectuoso</option>
                          <option value="USADO">🔵 Usado / Open Box</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-700">
                        Números de Serie (Uno por línea o separados por coma)
                      </label>
                      <textarea
                        rows={5}
                        value={inputSeriesRaw}
                        onChange={(e) => setInputSeriesRaw(e.target.value)}
                        placeholder={`Ejemplo:\nSN-HP-2026-001\nSN-HP-2026-002\nSN-HP-2026-003`}
                        className="w-full rounded-xl border border-slate-200 p-3 font-mono text-xs focus:border-[#00346F] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-700">Observaciones del Lote / Recepción</label>
                      <input
                        type="text"
                        value={inputObservaciones}
                        onChange={(e) => setInputObservaciones(e.target.value)}
                        placeholder="Ej. Lote recibido con guía G001-492, embalaje revisado"
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveSeriesTab('list')}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleRegistrarSeries}
                        disabled={isSubmittingSeries}
                        className="flex items-center gap-2 rounded-xl bg-[#00346F] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#004A99] disabled:opacity-50"
                      >
                        {isSubmittingSeries && <Loader2 className="h-4 w-4 animate-spin" />}
                        Guardar Series en Almacén
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── MODAL CONFIRMAR CUARENTENA / DAÑADO ─── */}
        {unidadToQuarantine && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-center gap-3 text-rose-600">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100">
                  <ShieldAlert className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Enviar Unidad a Cuarentena</h3>
                  <p className="text-xs text-slate-500">Bloquear venta de este número de serie</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs text-rose-800">
                <p>
                  <strong>N° de Serie:</strong> <span className="font-mono font-bold">{unidadToQuarantine.numeroSerie}</span>
                </p>
                <p className="mt-1">
                  Al confirmar, esta máquina quedará <strong>automáticamente oculta para los vendedores</strong> en el módulo
                  de ventas POS y pasará al estado de Cuarentena para reclamo con proveedor.
                </p>
              </div>

              <div className="mt-4">
                <label className="mb-1 block text-xs font-bold text-slate-700">Motivo del daño o falla:</label>
                <textarea
                  rows={3}
                  value={motivoCuarentena}
                  onChange={(e) => setMotivoCuarentena(e.target.value)}
                  placeholder="Ej. Pantalla rota en caja, conector USB dañado, no enciende..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUnidadToQuarantine(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmQuarantine}
                  disabled={isSubmittingQuarantine}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-700 disabled:opacity-50"
                >
                  {isSubmittingQuarantine && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirmar Cuarentena
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── MODAL CREAR NUEVO PRODUCTO EN ALMACÉN ─── */}
        {isNewProdModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 bg-[#0B1C30] px-6 py-4 text-white">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-base font-bold">Registrar Producto / Equipo en Almacén</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewProdModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateProducto} className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Categoría, Marca y Modelo en Cascada */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">1. Categoría *</label>
                    <select
                      value={newProdData.categoriaId}
                      onChange={(e) => {
                        const catId = Number(e.target.value);
                        const marcasDisponibles = marcasActivas.filter((m) => !m.categoriaId || m.categoriaId === catId);
                        const primeraMarcaId = marcasDisponibles[0]?.id || marcasActivas[0]?.id || 0;
                        setNewProdData((prev) => ({
                          ...prev,
                          categoriaId: catId,
                          marcaId: primeraMarcaId,
                          modeloId: null,
                          requiereSerie: catId <= 3, // Auto activar serie para laptops/impresoras/monitores
                        }));
                      }}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold"
                    >
                      {categoriasActivas.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">2. Marca *</label>
                    <select
                      value={newProdData.marcaId}
                      onChange={(e) => {
                        const mId = Number(e.target.value);
                        setNewProdData((prev) => ({ ...prev, marcaId: mId, modeloId: null }));
                      }}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold"
                    >
                      {marcasActivas
                        .filter((m) => !m.categoriaId || m.categoriaId === newProdData.categoriaId)
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nombre}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">3. Modelo Específico</label>
                    <select
                      value={newProdData.modeloId || ''}
                      onChange={(e) => {
                        const modId = e.target.value ? Number(e.target.value) : null;
                        const mod = modelos.find((m) => m.id === modId);
                        setNewProdData((prev) => ({
                          ...prev,
                          modeloId: modId,
                          nombre: mod ? `${mod.nombre}` : prev.nombre,
                        }));
                      }}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold"
                    >
                      <option value="">(Sin modelo específico)</option>
                      {modelosFiltradosParaCrear.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Nombre y Código */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-bold text-slate-700">Nombre Completo Comercial *</label>
                    <input
                      type="text"
                      required
                      value={newProdData.nombre}
                      onChange={(e) => setNewProdData((prev) => ({ ...prev, nombre: e.target.value }))}
                      placeholder="Ej. Laptop Lenovo ThinkPad E14 Gen 5 Core i7"
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">Código Interno</label>
                    <input
                      type="text"
                      value={newProdData.codigo}
                      onChange={(e) => setNewProdData((prev) => ({ ...prev, codigo: e.target.value }))}
                      placeholder="Auto si se deja vacío"
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Precios y Stock Mínimo */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">Precio Venta (S/)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={newProdData.precioVenta === 0 ? '' : newProdData.precioVenta}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewProdData((prev) => ({
                          ...prev,
                          precioVenta: val === '' ? 0 : parseFloat(val) || 0,
                        }));
                      }}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold focus:border-[#00346F] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">Precio Costo (S/)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={newProdData.precioCosto === 0 ? '' : newProdData.precioCosto}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewProdData((prev) => ({
                          ...prev,
                          precioCosto: val === '' ? 0 : parseFloat(val) || 0,
                        }));
                      }}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold focus:border-[#00346F] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">Stock Mínimo (Alerta)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="3"
                      value={newProdData.stockMinimo === 0 ? '' : newProdData.stockMinimo}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewProdData((prev) => ({
                          ...prev,
                          stockMinimo: val === '' ? 0 : parseInt(val, 10) || 0,
                        }));
                      }}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold focus:border-[#00346F] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Destino y Controles de Venta */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                  <p className="text-xs font-bold text-slate-800">Propósito y Visibilidad</p>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600">Tipo de Destino:</label>
                      <select
                        value={newProdData.tipoDestino}
                        onChange={(e) => setNewProdData((prev) => ({ ...prev, tipoDestino: e.target.value as any }))}
                        className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold"
                      >
                        <option value="VENTA">Venta Comercial Directa (POS)</option>
                        <option value="SERVICIO_TALLER">Uso Interno / Servicio Técnico Taller</option>
                        <option value="MIXTO">Mixto (Repuesto de Venta o Taller)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3 pt-4">
                      <input
                        type="checkbox"
                        id="checkVisibleVenta"
                        checked={newProdData.disponibleVenta}
                        onChange={(e) => setNewProdData((prev) => ({ ...prev, disponibleVenta: e.target.checked }))}
                        className="h-4 w-4 rounded text-[#00346F]"
                      />
                      <label htmlFor="checkVisibleVenta" className="text-xs font-bold text-slate-700">
                        Mostrar en Punto de Venta (Vendedores)
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <input
                      type="checkbox"
                      id="checkRequiereSerie"
                      checked={newProdData.requiereSerie}
                      onChange={(e) => setNewProdData((prev) => ({ ...prev, requiereSerie: e.target.checked }))}
                      className="h-4 w-4 rounded text-[#00346F]"
                    />
                    <label htmlFor="checkRequiereSerie" className="text-xs font-bold text-slate-700">
                      Exigir Trazabilidad por Número de Serie (Laptops, Impresoras, PCs)
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewProdModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingProd}
                    className="flex items-center gap-2 rounded-xl bg-[#00346F] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#004A99] disabled:opacity-50"
                  >
                    {isSubmittingProd && <Loader2 className="h-4 w-4 animate-spin" />}
                    Guardar Producto en Almacén
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
