import React, { useState, useMemo, useEffect } from 'react';
import {
  Cpu,
  Search,
  Plus,
  Filter,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight,
  Truck,
  RotateCcw,
  Sparkles,
  Barcode,
  SlidersHorizontal,
  Info,
  Edit2,
  Trash2,
  X,
  Loader2,
  ExternalLink,
  Tag,
  ShieldCheck,
  Disc,
  Battery,
  Monitor,
  Fan,
  Zap,
} from 'lucide-react';
import { Usuario, Categoria, Marca } from '../types';
import { warehouseService, ItemInventarioAlmacen } from '../services/warehouse.service';
import { categoryService } from '../services/category.service';
import { brandModelService } from '../services/brandModel.service';

interface WorkshopPartsCatalogViewProps {
  currentUser: Usuario;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  onNavigateToPedidos?: (preselectedProductoId?: number) => void;
  setActiveView?: (view: string) => void;
}

export type TipoRepuesto =
  | 'ALL'
  | 'PANTALLAS'
  | 'BATERIAS'
  | 'TECLADOS'
  | 'CARGADORES'
  | 'COOLERS'
  | 'UPGRADE'
  | 'INSUMOS'
  | 'OTROS';

interface RepuestoFicha {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  tipoRepuesto: TipoRepuesto;
  partNumber: string;
  marcasCompatibles: string;
  marcaId: number;
  marcaNombre: string;
  categoriaId: number;
  categoriaNombre: string;
  precioCosto: number;
  precioVenta: number;
  stockTotal: number;
  stockPorSede: { sucursalId: number; sucursalNombre: string; stock: number }[];
  requiereSerie: boolean;
  estadoId: number;
}

export const WorkshopPartsCatalogView: React.FC<WorkshopPartsCatalogViewProps> = ({
  currentUser,
  onShowToast,
  onNavigateToPedidos,
  setActiveView,
}) => {
  const [repuestos, setRepuestos] = useState<RepuestoFicha[]>([]);
  const [loading, setLoading] = useState(true);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTipo, setSelectedTipo] = useState<TipoRepuesto>('ALL');
  const [selectedMarca, setSelectedMarca] = useState<string>('ALL');
  const [filterStock, setFilterStock] = useState<'ALL' | 'CON_STOCK' | 'SIN_STOCK'>('ALL');

  // Modal Alta / Edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRepuesto, setEditingRepuesto] = useState<RepuestoFicha | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    nombre: '',
    tipoRepuesto: 'PANTALLAS' as TipoRepuesto,
    partNumber: '',
    marcaId: '' as number | '',
    marcasCompatibles: '',
    especificaciones: '',
    precioCosto: '' as number | string,
    precioVenta: '' as number | string,
    stockMinimo: 2,
    requiereSerie: false,
  });

  // Cargar catálogo de repuestos
  const loadRepuestosData = async () => {
    setLoading(true);
    try {
      const [resInv, resCat, resMarcas] = await Promise.all([
        warehouseService.getInventario(),
        categoryService.getCategorias(),
        brandModelService.getMarcas(),
      ]);

      if (resCat.success && resCat.categorias) {
        setCategorias(resCat.categorias);
      }
      if (resMarcas.success && resMarcas.marcas) {
        setMarcas(resMarcas.marcas);
      }

      if (resInv.success && resInv.inventario) {
        // Filtrar productos que son repuestos de taller o componentes técnicos
        const items = resInv.inventario.filter((p) => {
          const cat = (p.categoria?.nombre || '').toUpperCase();
          const nom = (p.nombre || '').toUpperCase();
          const cod = (p.codigo || '').toUpperCase();
          const dest = p.tipoDestino;

          return (
            cat.includes('REPUESTO') ||
            cat.includes('COMPONENTE') ||
            dest === 'SERVICIO_TALLER' ||
            dest === 'MIXTO' ||
            cod.startsWith('REP-') ||
            cod.startsWith('INS-') ||
            nom.includes('PANTALLA') ||
            nom.includes('BATERÍA') ||
            nom.includes('BATERIA') ||
            nom.includes('TECLADO') ||
            nom.includes('CARGADOR') ||
            nom.includes('COOLER') ||
            nom.includes('PASTA TÉRMICA') ||
            nom.includes('PASTA TERMICA')
          );
        });

        // Mapear a formato de repuesto técnico
        const mapped: RepuestoFicha[] = items.map((p) => {
          const nom = (p.nombre || '').toUpperCase();
          let tipo: TipoRepuesto = 'OTROS';

          if (nom.includes('PANTALLA') || nom.includes('LED') || nom.includes('DISPLAY')) {
            tipo = 'PANTALLAS';
          } else if (nom.includes('BATER') || nom.includes('BAT-')) {
            tipo = 'BATERIAS';
          } else if (nom.includes('TECLADO') || nom.includes('KEYBOARD')) {
            tipo = 'TECLADOS';
          } else if (nom.includes('CARGADOR') || nom.includes('ADAPTADOR')) {
            tipo = 'CARGADORES';
          } else if (nom.includes('COOLER') || nom.includes('VENTILADOR') || nom.includes('FAN')) {
            tipo = 'COOLERS';
          } else if (nom.includes('SSD') || nom.includes('RAM') || nom.includes('DISCO')) {
            tipo = 'UPGRADE';
          } else if (nom.includes('PASTA') || nom.includes('PAD') || nom.includes('ALCOHOL') || nom.includes('INSUMO')) {
            tipo = 'INSUMOS';
          }

          // Extraer P/N o compatibilidad si está en descripción o código
          let partNumber = p.codigo || '';
          if (p.descripcion && p.descripcion.includes('P/N:')) {
            const match = p.descripcion.match(/P\/N:\s*([^,\n]+)/i);
            if (match) partNumber = match[1].trim();
          }

          return {
            id: p.id,
            codigo: p.codigo,
            nombre: p.nombre,
            descripcion: p.descripcion || '',
            tipoRepuesto: tipo,
            partNumber,
            marcasCompatibles: p.marca?.nombre || 'Multimarca',
            marcaId: p.marca?.id || 0,
            marcaNombre: p.marca?.nombre || 'Genérico',
            categoriaId: p.categoria?.id || 0,
            categoriaNombre: p.categoria?.nombre || 'Repuestos de Taller',
            precioCosto: p.precioCosto || 0,
            precioVenta: p.precioVenta || 0,
            stockTotal: p.stockTotal || 0,
            stockPorSede: p.stockPorSede || [],
            requiereSerie: p.requiereSerie || false,
            estadoId: p.estadoId || 1,
          };
        });

        setRepuestos(mapped);
      }
    } catch (err) {
      console.error('Error al cargar repuestos:', err);
      onShowToast('Error al cargar', 'No se pudieron sincronizar los repuestos de taller.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepuestosData();
  }, []);

  // Tipos de Repuesto con etiquetas e iconos
  const tiposConfig: { id: TipoRepuesto; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'ALL', label: 'Todos los Repuestos', icon: <Wrench className="h-4 w-4" />, color: 'bg-slate-800 text-white' },
    { id: 'PANTALLAS', label: 'Pantallas LED / Displays', icon: <Monitor className="h-4 w-4" />, color: 'bg-blue-600 text-white' },
    { id: 'BATERIAS', label: 'Baterías de Laptop', icon: <Battery className="h-4 w-4" />, color: 'bg-emerald-600 text-white' },
    { id: 'TECLADOS', label: 'Teclados de Reemplazo', icon: <Cpu className="h-4 w-4" />, color: 'bg-purple-600 text-white' },
    { id: 'CARGADORES', label: 'Cargadores & Adaptadores', icon: <Zap className="h-4 w-4" />, color: 'bg-amber-600 text-white' },
    { id: 'COOLERS', label: 'Coolers & Ventiladores', icon: <Fan className="h-4 w-4" />, color: 'bg-cyan-600 text-white' },
    { id: 'UPGRADE', label: 'Discos SSD & Memorias RAM', icon: <Disc className="h-4 w-4" />, color: 'bg-indigo-600 text-white' },
    { id: 'INSUMOS', label: 'Insumos & Pastas Térmicas', icon: <Sparkles className="h-4 w-4" />, color: 'bg-rose-600 text-white' },
  ];

  // Métricas
  const metricas = useMemo(() => {
    const total = repuestos.length;
    const conStock = repuestos.filter((r) => r.stockTotal > 0).length;
    const sinStock = repuestos.filter((r) => r.stockTotal === 0).length;
    const totalUnidades = repuestos.reduce((sum, r) => sum + r.stockTotal, 0);

    return { total, conStock, sinStock, totalUnidades };
  }, [repuestos]);

  // Lista de marcas únicas disponibles
  const marcasDisponibles = useMemo(() => {
    const set = new Set<string>();
    repuestos.forEach((r) => {
      if (r.marcaNombre && r.marcaNombre !== 'Genérico') set.add(r.marcaNombre);
    });
    return Array.from(set).sort();
  }, [repuestos]);

  // Filtrado de repuestos
  const repuestosFiltrados = useMemo(() => {
    return repuestos.filter((r) => {
      // Filtro tipo
      if (selectedTipo !== 'ALL' && r.tipoRepuesto !== selectedTipo) return false;

      // Filtro marca
      if (selectedMarca !== 'ALL' && r.marcaNombre.toUpperCase() !== selectedMarca.toUpperCase()) return false;

      // Filtro stock
      if (filterStock === 'CON_STOCK' && r.stockTotal <= 0) return false;
      if (filterStock === 'SIN_STOCK' && r.stockTotal > 0) return false;

      // Buscador
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchNom = r.nombre.toLowerCase().includes(query);
        const matchCod = r.codigo.toLowerCase().includes(query);
        const matchPN = r.partNumber.toLowerCase().includes(query);
        const matchDesc = r.descripcion.toLowerCase().includes(query);
        const matchMarca = r.marcaNombre.toLowerCase().includes(query);
        if (!matchNom && !matchCod && !matchPN && !matchDesc && !matchMarca) return false;
      }

      return true;
    });
  }, [repuestos, selectedTipo, selectedMarca, filterStock, searchTerm]);

  // Abrir modal de alta
  const handleOpenCreateModal = () => {
    setEditingRepuesto(null);
    setFormData({
      nombre: '',
      tipoRepuesto: 'PANTALLAS',
      partNumber: '',
      marcaId: marcas[0]?.id || '',
      marcasCompatibles: '',
      especificaciones: '',
      precioCosto: '',
      precioVenta: '',
      stockMinimo: 2,
      requiereSerie: false,
    });
    setIsModalOpen(true);
  };

  // Guardar repuesto
  const handleSubmitRepuesto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      onShowToast('Campo requerido', 'Ingrese el nombre o descripción del repuesto.', 'warning');
      return;
    }
    const costo = Number(formData.precioCosto) || 0;
    const venta = Number(formData.precioVenta) || 0;

    // Buscar categoría de repuestos
    const catRepuesto =
      categorias.find((c) => c.nombre.toUpperCase().includes('REPUESTO')) ||
      categorias.find((c) => c.nombre.toUpperCase().includes('COMPONENTE')) ||
      categorias[0];

    const prefix = formData.tipoRepuesto === 'PANTALLAS' ? 'REP-PAN' : formData.tipoRepuesto === 'BATERIAS' ? 'REP-BAT' : formData.tipoRepuesto === 'TECLADOS' ? 'REP-TEC' : formData.tipoRepuesto === 'CARGADORES' ? 'REP-CAR' : 'REP-GEN';
    const codigoGenerado = `${prefix}-${Date.now().toString().slice(-5)}`;

    const descFinal = [
      formData.partNumber ? `P/N: ${formData.partNumber}` : null,
      formData.marcasCompatibles ? `Compatibilidad: ${formData.marcasCompatibles}` : null,
      formData.especificaciones ? `Specs: ${formData.especificaciones}` : null,
    ]
      .filter(Boolean)
      .join(' • ');

    setSubmitting(true);
    try {
      const payload = {
        nombre: formData.nombre.trim(),
        descripcion: descFinal || 'Repuesto para servicio técnico de taller',
        categoriaId: catRepuesto ? catRepuesto.id : 6,
        marcaId: formData.marcaId ? Number(formData.marcaId) : null,
        precioCosto: costo,
        precioVenta: venta,
        stockMinimo: Number(formData.stockMinimo) || 2,
        tipoDestino: 'SERVICIO_TALLER' as const,
        requiereSerie: formData.requiereSerie,
        disponibleVenta: false,
        stockInicial: 0,
      };

      const res = await warehouseService.createProducto(payload);
      if (res.success) {
        onShowToast('Repuesto Registrado', `${formData.nombre} fue incorporado al catálogo técnico.`, 'success');
        setIsModalOpen(false);
        loadRepuestosData();
      } else {
        onShowToast('Error', res.message || 'No se pudo registrar el repuesto.', 'error');
      }
    } catch (err: any) {
      onShowToast('Error', err?.message || 'Error al guardar el repuesto en base de datos.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* ─── CABECERA DEL CATÁLOGO DE REPUESTOS ─── */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800">
                <Cpu className="h-3.5 w-3.5" />
                Área de Soporte & Servicio Técnico • Taller
              </span>
              <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                MG Solutions Chiclayo
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl flex items-center gap-2.5">
              Catálogo de Repuestos & Partes de Taller
            </h1>
            <p className="mt-1 text-xs md:text-sm text-slate-500">
              Inventario técnico de pantallas, baterías, teclados, cargadores y piezas para reparación de equipos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={loadRepuestosData}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
              Sincronizar
            </button>

            {onNavigateToPedidos && (
              <button
                type="button"
                onClick={() => onNavigateToPedidos()}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 cursor-pointer"
              >
                <Truck className="h-4 w-4" />
                Pedir Repuestos a Proveedor
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-indigo-700 active:scale-95 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              + Nuevo Repuesto / Parte
            </button>
          </div>
        </div>

        {/* ─── TARJETAS DE INDICADORES (KPIs) ─── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Repuestos</span>
              <Package className="h-4 w-4 text-indigo-600" />
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900">{metricas.total}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">Modelos de partes registrados</p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
            <div className="flex items-center justify-between text-emerald-700">
              <span className="text-[11px] font-bold uppercase tracking-wider">Stock en Taller</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-black text-emerald-950">{metricas.totalUnidades} un.</p>
            <p className="mt-0.5 text-[11px] text-emerald-700 font-semibold">{metricas.conStock} repuestos disponibles</p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
            <div className="flex items-center justify-between text-amber-700">
              <span className="text-[11px] font-bold uppercase tracking-wider">Sin Stock (Agotados)</span>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <p className="mt-2 text-2xl font-black text-amber-950">{metricas.sinStock}</p>
            <p className="mt-0.5 text-[11px] text-amber-700 font-semibold">Requieren pedido a proveedor</p>
          </div>

          <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 shadow-xs">
            <div className="flex items-center justify-between text-purple-700">
              <span className="text-[11px] font-bold uppercase tracking-wider">Familias de Repuestos</span>
              <Layers className="h-4 w-4 text-purple-600" />
            </div>
            <p className="mt-2 text-2xl font-black text-purple-950">7 Líneas</p>
            <p className="mt-0.5 text-[11px] text-purple-700 font-semibold">Pantallas, Baterías, Teclados...</p>
          </div>
        </div>

        {/* ─── FILTROS RÁPIDOS POR TIPO DE REPUESTO (PILLS) ─── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {tiposConfig.map((t) => {
            const isSelected = selectedTipo === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTipo(t.id)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? `${t.color} shadow-xs scale-102`
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* ─── BARRA DE BÚSQUEDA Y FILTROS ADICIONALES ─── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="relative md:col-span-6">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por Part Number (P/N), modelo de laptop compatible, código o nombre..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 py-2.5 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 rounded-md p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="md:col-span-3">
              <select
                value={selectedMarca}
                onChange={(e) => setSelectedMarca(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white cursor-pointer"
              >
                <option value="ALL">Todas las Marcas ({marcasDisponibles.length})</option>
                {marcasDisponibles.map((m) => (
                  <option key={m} value={m}>
                    Marca: {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <select
                value={filterStock}
                onChange={(e) => setFilterStock(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white cursor-pointer"
              >
                <option value="ALL">Todos los Estados de Stock</option>
                <option value="CON_STOCK">✔ Con Stock en Almacén ({metricas.conStock})</option>
                <option value="SIN_STOCK">⚠ Sin Stock / Por Pedir ({metricas.sinStock})</option>
              </select>
            </div>
          </div>
        </div>

        {/* ─── LISTADO DE REPUESTOS DE TALLER ─── */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-600" />
            <p className="mt-3 text-sm font-bold text-slate-700">Cargando catálogo técnico de repuestos...</p>
          </div>
        ) : repuestosFiltrados.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center shadow-xs space-y-3">
            <Wrench className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="text-base font-bold text-slate-800">No se encontraron repuestos con los filtros aplicados</h3>
            <p className="mx-auto max-w-md text-xs text-slate-500">
              Prueba cambiando el término de búsqueda o seleccionando otra familia de repuestos.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedTipo('ALL');
                setSelectedMarca('ALL');
                setFilterStock('ALL');
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restablecer Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {repuestosFiltrados.map((rep) => {
              const tieneStock = rep.stockTotal > 0;

              return (
                <div
                  key={rep.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-indigo-400 hover:shadow-md"
                >
                  <div className="space-y-3">
                    {/* Header de la tarjeta */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-md bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 text-[10px] font-extrabold uppercase text-indigo-700">
                          {rep.tipoRepuesto}
                        </span>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                          {rep.marcaNombre}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                          tieneStock
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {tieneStock ? `Stock: ${rep.stockTotal}` : 'Agotado'}
                      </span>
                    </div>

                    {/* Nombre y Part Number */}
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug">
                        {rep.nombre}
                      </h3>
                      {rep.partNumber && (
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase">Part Number:</span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-slate-800 border border-slate-200">
                            {rep.partNumber}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Compatibilidad & Especificaciones */}
                    {rep.descripcion && (
                      <div className="rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-600 space-y-1 border border-slate-100">
                        <p className="line-clamp-2 leading-relaxed">
                          {rep.descripcion}
                        </p>
                      </div>
                    )}

                    {/* Precios de referencia */}
                    <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2.5 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Costo Compra:</span>
                        <span className="font-bold text-slate-700">S/ {rep.precioCosto.toFixed(2)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-semibold block">Precio Taller (PVP):</span>
                        <span className="font-black text-indigo-700 text-sm">S/ {rep.precioVenta.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones de la tarjeta */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">
                      Cód: {rep.codigo}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {onNavigateToPedidos && (
                        <button
                          type="button"
                          onClick={() => onNavigateToPedidos(rep.id)}
                          title="Pedir este repuesto a proveedor"
                          className="flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
                        >
                          <Truck className="h-3.5 w-3.5" />
                          <span>Pedir</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── MODAL ALTA / EDICIÓN DE FICHA DE REPUESTO ─── */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-scaleIn">
              <div className="flex items-center justify-between border-b border-slate-100 bg-[#0B1C30] px-6 py-4 text-white">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
                    <Cpu className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">Ficha Técnica de Repuesto para Taller</h3>
                    <p className="text-[11px] text-slate-300">
                      Registro especializado de partes y repuestos para servicio técnico
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitRepuesto} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700">Tipo de Repuesto *</label>
                    <select
                      value={formData.tipoRepuesto}
                      onChange={(e) => setFormData({ ...formData, tipoRepuesto: e.target.value as any })}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600"
                    >
                      <option value="PANTALLAS">Pantalla LED / Display</option>
                      <option value="BATERIAS">Batería de Laptop</option>
                      <option value="TECLADOS">Teclado de Reemplazo</option>
                      <option value="CARGADORES">Cargador / Adaptador de Poder</option>
                      <option value="COOLERS">Cooler / Ventilador CPU & GPU</option>
                      <option value="UPGRADE">Disco SSD / Memoria RAM</option>
                      <option value="INSUMOS">Insumos Técnicos / Pasta Térmica</option>
                      <option value="OTROS">Otro Componente Técnico</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700">Marca Principal *</label>
                    <select
                      value={formData.marcaId}
                      onChange={(e) => setFormData({ ...formData, marcaId: Number(e.target.value) || '' })}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600"
                    >
                      <option value="">Seleccione Marca...</option>
                      {marcas.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Nombre Completo del Repuesto *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej. Pantalla LED 15.6 Slim FHD IPS 30 Pines Sin Orejas"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Número de Parte (Part Number / P/N)
                    </label>
                    <input
                      type="text"
                      value={formData.partNumber}
                      onChange={(e) => setFormData({ ...formData, partNumber: e.target.value.toUpperCase() })}
                      placeholder="Ej. B156HAN02.1 / HT03XL"
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-xs font-bold text-slate-900 outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Modelos de Laptop Compatibles
                    </label>
                    <input
                      type="text"
                      value={formData.marcasCompatibles}
                      onChange={(e) => setFormData({ ...formData, marcasCompatibles: e.target.value })}
                      placeholder="Ej. HP 15-dw, 15-dy, Lenovo IdeaPad 3 15ITL6"
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700">Costo Referencial Compra (S/)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={formData.precioCosto}
                      onChange={(e) => setFormData({ ...formData, precioCosto: e.target.value })}
                      placeholder="0.00"
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700">Precio Venta / Taller (S/)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={formData.precioVenta}
                      onChange={(e) => setFormData({ ...formData, precioVenta: e.target.value })}
                      placeholder="0.00"
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-indigo-700 outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700">Stock Mínimo (Alerta)</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.stockMinimo}
                      onChange={(e) => setFormData({ ...formData, stockMinimo: parseInt(e.target.value) || 2 })}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Especificaciones Físicas y Técnicas Adicionales
                  </label>
                  <textarea
                    rows={2}
                    value={formData.especificaciones}
                    onChange={(e) => setFormData({ ...formData, especificaciones: e.target.value })}
                    placeholder="Ej. Conector 30 pines inferior derecho, voltaje 11.55V 41.9Wh, acabado mate antideslumbrante..."
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="checkReqSerieRep"
                      checked={formData.requiereSerie}
                      onChange={(e) => setFormData({ ...formData, requiereSerie: e.target.checked })}
                      className="h-4 w-4 rounded text-indigo-600 cursor-pointer"
                    />
                    <label htmlFor="checkReqSerieRep" className="text-xs font-bold text-slate-700 cursor-pointer">
                      ¿Exigir Número de Serie individual?
                    </label>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    (Recomendado desactivado para pantallas/baterías; activar para Discos SSD)
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Guardar Ficha de Repuesto
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
