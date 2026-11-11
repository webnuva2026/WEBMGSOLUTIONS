import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Layers,
  Tag,
  Laptop,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Save,
  X,
  RefreshCw,
  Loader2,
  FolderPlus,
  Cpu,
  Zap,
  HardDrive,
  Monitor,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Package,
  Wrench,
  Trash2,
  ArrowLeft,
  ChevronRight,
  ShoppingCart,
  Activity,
  Volume2,
  Cable,
  Palette,
} from 'lucide-react';
import { Categoria, Marca, Modelo, EstadoRegistro } from '../types';
import { categoryService, CreateCategoriaData } from '../services/category.service';
import { brandModelService, CreateMarcaData, CreateModeloData } from '../services/brandModel.service';

interface CatalogMasterViewProps {
  initialTab?: 'categorias' | 'marcas' | 'modelos';
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  readOnly?: boolean;
  setActiveView?: (view: string) => void;
}

const PRESET_ATTRIBUTES = [
  'Procesador',
  'Memoria RAM',
  'Almacenamiento',
  'Pantalla',
  'Tarjeta Gráfica',
  'Tasa de Refresco',
  'Tiempo de Respuesta',
  'Puertos',
  'Audio',
  'Color',
  'Generación',
  'Batería',
];

export const CatalogMasterView: React.FC<CatalogMasterViewProps> = ({
  initialTab = 'categorias',
  onShowToast,
  readOnly = false,
  setActiveView,
}) => {
  const [activeTab, setActiveTab] = useState<'categorias' | 'marcas' | 'modelos'>(initialTab);

  // ─── ESTADOS DE NAVEGACIÓN JERÁRQUICA (DRILL-DOWN) ───
  const [selectedCategory, setSelectedCategory] = useState<Categoria | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<Marca | null>(null);

  const handleSelectCategory = (cat: Categoria) => {
    setSelectedCategory(cat);
    setSelectedBrand(null);
    setSelectedCatFilterInMarcas(cat.id);
    setActiveTab('marcas');
  };

  const handleSelectBrand = (marca: Marca) => {
    setSelectedBrand(marca);
    setSelectedMarcaFilter(marca.id);
    setActiveTab('modelos');
    setExpandedMarcas((prev) => ({ ...prev, [marca.id]: true }));
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedBrand(null);
    setSelectedCatFilterInMarcas('ALL');
    setActiveTab('categorias');
  };

  const handleBackToBrands = () => {
    setSelectedBrand(null);
    setSelectedMarcaFilter('ALL');
    setActiveTab('marcas');
  };

  // ─── ESTADOS DE DATOS ───
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [loading, setLoading] = useState(true);

  // ─── FILTROS DE BÚSQUEDA ───
  const [searchCat, setSearchCat] = useState('');
  const [searchMarca, setSearchMarca] = useState('');
  const [searchModelo, setSearchModelo] = useState('');
  const [selectedMarcaFilter, setSelectedMarcaFilter] = useState<number | 'ALL'>('ALL');
  const [expandedMarcas, setExpandedMarcas] = useState<Record<number, boolean>>({});

  // ─── MODAL CATEGORÍA ───
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Categoria | null>(null);
  const [catForm, setCatForm] = useState<CreateCategoriaData>({
    nombre: '',
    descripcion: '',
    esEquipoTaller: false,
    esVenta: true,
    esRepuestoTaller: false,
  });
  const [savingCat, setSavingCat] = useState(false);

  // ─── MODAL MARCA ───
  const [isMarcaModalOpen, setIsMarcaModalOpen] = useState(false);
  const [editingMarca, setEditingMarca] = useState<Marca | null>(null);
  const [marcaForm, setMarcaForm] = useState<CreateMarcaData>({ nombre: '', descripcion: '', categoriaId: null });
  const [savingMarca, setSavingMarca] = useState(false);
  const [selectedCatFilterInMarcas, setSelectedCatFilterInMarcas] = useState<number | 'ALL'>('ALL');
  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({});

  // ─── MODAL MODELO & CARACTERÍSTICAS ───
  const [isModeloModalOpen, setIsModeloModalOpen] = useState(false);
  const [editingModelo, setEditingModelo] = useState<Modelo | null>(null);
  const [modeloForm, setModeloForm] = useState<{
    marcaId: number | '';
    nombre: string;
    descripcion: string;
    caracteristicas: { atributo: string; valor: string }[];
  }>({
    marcaId: '',
    nombre: '',
    descripcion: '',
    caracteristicas: [],
  });
  const [savingModelo, setSavingModelo] = useState(false);

  // ─── CARGAR DATOS ───
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [resCat, resMarcas, resModelos] = await Promise.all([
        categoryService.getCategorias(),
        brandModelService.getMarcas(),
        brandModelService.getModelos(),
      ]);

      if (resCat.success && resCat.categorias) setCategorias(resCat.categorias);
      if (resMarcas.success && resMarcas.marcas) {
        setMarcas(resMarcas.marcas);
        const exp: Record<number, boolean> = {};
        resMarcas.marcas.slice(0, 3).forEach((m) => (exp[m.id] = true));
        setExpandedMarcas(exp);
      }
      if (resModelos.success && resModelos.modelos) setModelos(resModelos.modelos);
    } catch {
      onShowToast('Error', 'No se pudo sincronizar el catálogo con la base de datos.', 'error');
    } finally {
      setLoading(false);
    }
  }, [onShowToast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Actualizar tab si cambia initialTab
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Modelos agrupados por marca
  const modelosPorMarca = useMemo(() => {
    const map = new Map<number, Modelo[]>();
    for (const m of modelos) {
      if (!map.has(m.marcaId)) map.set(m.marcaId, []);
      map.get(m.marcaId)!.push(m);
    }
    return map;
  }, [modelos]);

  // Marcas agrupadas por categoría
  const marcasPorCategoria = useMemo(() => {
    const map = new Map<number, Marca[]>();
    for (const m of marcas) {
      const catId = m.categoriaId || 0;
      if (!map.has(catId)) map.set(catId, []);
      map.get(catId)!.push(m);
    }
    return map;
  }, [marcas]);

  // ─── FILTRADOS ───
  const filteredCategorias = useMemo(() => {
    const q = searchCat.toLowerCase();
    return categorias.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        (c.descripcion && c.descripcion.toLowerCase().includes(q))
    );
  }, [categorias, searchCat]);

  const filteredMarcas = useMemo(() => {
    const q = searchMarca.toLowerCase();
    return marcas.filter((m) => {
      if (selectedCatFilterInMarcas !== 'ALL' && m.categoriaId !== selectedCatFilterInMarcas) {
        return false;
      }
      return (
        m.nombre.toLowerCase().includes(q) ||
        (m.descripcion && m.descripcion.toLowerCase().includes(q)) ||
        (m.categoriaNombre && m.categoriaNombre.toLowerCase().includes(q))
      );
    });
  }, [marcas, searchMarca, selectedCatFilterInMarcas]);

  const filteredModelos = useMemo(() => {
    const q = searchModelo.toLowerCase().trim();
    return modelos.filter((mod) => {
      if (selectedMarcaFilter !== 'ALL' && mod.marcaId !== selectedMarcaFilter) {
        return false;
      }
      if (!q) return true;

      const matchNombre = mod.nombre.toLowerCase().includes(q);
      const matchMarca = (mod.marcaNombre || '').toLowerCase().includes(q);
      const matchDesc = (mod.descripcion || '').toLowerCase().includes(q);
      const matchCaract = mod.caracteristicas?.some(
        (c) => c.atributo.toLowerCase().includes(q) || c.valor.toLowerCase().includes(q)
      );

      return matchNombre || matchMarca || matchDesc || matchCaract;
    });
  }, [modelos, selectedMarcaFilter, searchModelo]);

  // ─── ACCIONES CATEGORÍAS ───
  const handleOpenNewCat = () => {
    setEditingCat(null);
    setCatForm({
      nombre: '',
      descripcion: '',
      esEquipoTaller: false,
      esVenta: true,
      esRepuestoTaller: false,
    });
    setIsCatModalOpen(true);
  };

  const handleOpenEditCat = (c: Categoria) => {
    setEditingCat(c);
    setCatForm({
      nombre: c.nombre,
      descripcion: c.descripcion || '',
      esEquipoTaller: Boolean(c.esEquipoTaller),
      esVenta: c.esVenta !== undefined ? Boolean(c.esVenta) : true,
      esRepuestoTaller: Boolean(c.esRepuestoTaller),
    });
    setIsCatModalOpen(true);
  };

  const handleSaveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.nombre.trim()) return;

    setSavingCat(true);
    try {
      if (editingCat) {
        const res = await categoryService.updateCategoria(editingCat.id, catForm);
        if (res.success) {
          onShowToast('Categoría actualizada', `Categoría '${catForm.nombre}' guardada.`, 'success');
          setIsCatModalOpen(false);
          await loadAll();
        } else {
          onShowToast('Error', res.message || 'No se pudo actualizar categoría.', 'error');
        }
      } else {
        const res = await categoryService.createCategoria(catForm);
        if (res.success) {
          onShowToast('Categoría creada', `Categoría '${catForm.nombre}' registrada.`, 'success');
          setIsCatModalOpen(false);
          await loadAll();
        } else {
          onShowToast('Error', res.message || 'No se pudo registrar categoría.', 'error');
        }
      }
    } catch {
      onShowToast('Error', 'Fallo de conexión al guardar categoría.', 'error');
    } finally {
      setSavingCat(false);
    }
  };

  const handleToggleCat = async (c: Categoria) => {
    try {
      const res = await categoryService.toggleCategoriaEstado(c.id);
      if (res.success) {
        onShowToast('Estado modificado', res.message || 'Estado actualizado.', 'info');
        setCategorias((prev) =>
          prev.map((cat) => (cat.id === c.id ? { ...cat, estado: res.nuevoEstado as EstadoRegistro } : cat))
        );
      }
    } catch {
      onShowToast('Error', 'No se pudo alternar el estado.', 'error');
    }
  };

  // ─── ACCIONES MARCAS ───
  const handleOpenNewMarca = (preselectedCatId?: number) => {
    setEditingMarca(null);
    setMarcaForm({
      nombre: '',
      descripcion: '',
      categoriaId: preselectedCatId || (categorias.length > 0 ? categorias[0].id : null),
    });
    setIsMarcaModalOpen(true);
  };

  const handleOpenEditMarca = (m: Marca) => {
    setEditingMarca(m);
    setMarcaForm({
      nombre: m.nombre,
      descripcion: m.descripcion || '',
      categoriaId: m.categoriaId || null,
    });
    setIsMarcaModalOpen(true);
  };

  const handleSaveMarca = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!marcaForm.nombre.trim()) return;

    setSavingMarca(true);
    try {
      if (editingMarca) {
        const res = await brandModelService.updateMarca(editingMarca.id, marcaForm);
        if (res.success) {
          onShowToast('Marca actualizada', `Marca '${marcaForm.nombre}' guardada.`, 'success');
          setIsMarcaModalOpen(false);
          await loadAll();
        } else {
          onShowToast('Error', res.message || 'Error al actualizar marca.', 'error');
        }
      } else {
        const res = await brandModelService.createMarca(marcaForm);
        if (res.success) {
          onShowToast('Marca creada', `Marca '${marcaForm.nombre}' registrada.`, 'success');
          setIsMarcaModalOpen(false);
          await loadAll();
        } else {
          onShowToast('Error', res.message || 'Error al crear marca.', 'error');
        }
      }
    } catch {
      onShowToast('Error', 'Fallo de conexión con el servidor.', 'error');
    } finally {
      setSavingMarca(false);
    }
  };

  const handleToggleMarca = async (m: Marca) => {
    try {
      const res = await brandModelService.toggleMarcaEstado(m.id);
      if (res.success) {
        onShowToast('Estado actualizado', res.message || 'Estado modificado.', 'info');
        setMarcas((prev) =>
          prev.map((x) => (x.id === m.id ? { ...x, estado: res.nuevoEstado as EstadoRegistro } : x))
        );
      }
    } catch {
      onShowToast('Error', 'No se pudo cambiar el estado.', 'error');
    }
  };

  // ─── ACCIONES MODELOS ───
  const handleOpenNewModelo = (preselectedMarcaId?: number) => {
    setEditingModelo(null);
    setModeloForm({
      marcaId: preselectedMarcaId || (marcas.length > 0 ? marcas[0].id : ''),
      nombre: '',
      descripcion: '',
      caracteristicas: [
        { atributo: 'Procesador', valor: '' },
        { atributo: 'Memoria RAM', valor: '' },
        { atributo: 'Almacenamiento', valor: '' },
        { atributo: 'Pantalla', valor: '' },
      ],
    });
    setIsModeloModalOpen(true);
  };

  const handleOpenEditModelo = (mod: Modelo) => {
    setEditingModelo(mod);
    setModeloForm({
      marcaId: mod.marcaId,
      nombre: mod.nombre,
      descripcion: mod.descripcion || '',
      caracteristicas:
        mod.caracteristicas && mod.caracteristicas.length > 0
          ? mod.caracteristicas.map((c) => ({ atributo: c.atributo, valor: c.valor }))
          : [{ atributo: 'Procesador', valor: '' }],
    });
    setIsModeloModalOpen(true);
  };

  const handleAddCaracteristica = (atributo = '', valor = '') => {
    setModeloForm((prev) => ({
      ...prev,
      caracteristicas: [...prev.caracteristicas, { atributo, valor }],
    }));
  };

  const handleRemoveCaracteristica = (index: number) => {
    setModeloForm((prev) => ({
      ...prev,
      caracteristicas: prev.caracteristicas.filter((_, idx) => idx !== index),
    }));
  };

  const handleUpdateCaracteristica = (index: number, field: 'atributo' | 'valor', text: string) => {
    setModeloForm((prev) => {
      const updated = [...prev.caracteristicas];
      updated[index] = { ...updated[index], [field]: text };
      return { ...prev, caracteristicas: updated };
    });
  };

  const handleSaveModelo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modeloForm.marcaId || !modeloForm.nombre.trim()) {
      onShowToast('Campos obligatorios', 'Seleccione la marca e ingrese el nombre del modelo.', 'warning');
      return;
    }

    setSavingModelo(true);
    try {
      const payload: CreateModeloData = {
        marcaId: Number(modeloForm.marcaId),
        nombre: modeloForm.nombre.trim(),
        descripcion: modeloForm.descripcion.trim(),
        caracteristicas: modeloForm.caracteristicas.filter((c) => c.atributo.trim() && c.valor.trim()),
      };

      if (editingModelo) {
        const res = await brandModelService.updateModelo(editingModelo.id, payload);
        if (res.success) {
          onShowToast('Modelo actualizado', `Modelo '${payload.nombre}' guardado.`, 'success');
          setIsModeloModalOpen(false);
          await loadAll();
        } else {
          onShowToast('Error', res.message || 'No se pudo actualizar modelo.', 'error');
        }
      } else {
        const res = await brandModelService.createModelo(payload);
        if (res.success) {
          onShowToast('Modelo creado', `Modelo '${payload.nombre}' registrado.`, 'success');
          setIsModeloModalOpen(false);
          setExpandedMarcas((prev) => ({ ...prev, [Number(modeloForm.marcaId)]: true }));
          await loadAll();
        } else {
          onShowToast('Error', res.message || 'No se pudo crear modelo.', 'error');
        }
      }
    } catch {
      onShowToast('Error', 'Fallo de conexión al guardar modelo.', 'error');
    } finally {
      setSavingModelo(false);
    }
  };

  const handleToggleModelo = async (mod: Modelo) => {
    try {
      const res = await brandModelService.toggleModeloEstado(mod.id);
      if (res.success) {
        onShowToast('Estado actualizado', res.message || 'Estado modificado.', 'info');
        setModelos((prev) =>
          prev.map((m) => (m.id === mod.id ? { ...m, estado: res.nuevoEstado as EstadoRegistro } : m))
        );
      }
    } catch {
      onShowToast('Error', 'No se pudo alternar el estado del modelo.', 'error');
    }
  };

  const getAttributeIcon = (attr: string) => {
    const a = attr.toLowerCase();
    if (a.includes('procesador') || a.includes('cpu')) return <Cpu className="w-3.5 h-3.5 text-blue-600" />;
    if (a.includes('ram') || a.includes('memoria')) return <Zap className="w-3.5 h-3.5 text-amber-600" />;
    if (a.includes('disco') || a.includes('ssd') || a.includes('almacenamiento'))
      return <HardDrive className="w-3.5 h-3.5 text-emerald-600" />;
    if (a.includes('pantalla') || a.includes('display'))
      return <Monitor className="w-3.5 h-3.5 text-indigo-600" />;
    if (a.includes('grafica') || a.includes('video') || a.includes('gpu'))
      return <Sparkles className="w-3.5 h-3.5 text-purple-600" />;
    if (a.includes('refresco') || a.includes('hz') || a.includes('respuesta') || a.includes('ms'))
      return <Activity className="w-3.5 h-3.5 text-rose-600" />;
    if (a.includes('puerto') || a.includes('hdmi') || a.includes('vga') || a.includes('usb'))
      return <Cable className="w-3.5 h-3.5 text-cyan-600" />;
    if (a.includes('audio') || a.includes('parlante') || a.includes('sonido'))
      return <Volume2 className="w-3.5 h-3.5 text-teal-600" />;
    if (a.includes('color'))
      return <Palette className="w-3.5 h-3.5 text-slate-600" />;
    return <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />;
  };

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto bg-[#F8F9FF] min-h-screen">
      {/* ─── HEADER PRINCIPAL CON PESTAÑAS MAESTRAS ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#00346F]/10 text-[#00346F] rounded-lg">
              <Package className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-[#0B1C30] tracking-tight">
              Catálogo Maestro del Sistema
            </h1>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Administración unificada: Categorías generales, Marcas registradas y Modelos con fichas técnicas.
          </p>
        </div>

        <button
          onClick={loadAll}
          disabled={loading}
          className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#00346F] ${loading ? 'animate-spin' : ''}`} />
          <span>Sincronizar BD</span>
        </button>
      </div>

      {/* ─── NAVEGACIÓN POR PESTAÑAS ─── */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6 pb-2">
        <button
          type="button"
          onClick={() => {
            setSelectedCategory(null);
            setSelectedBrand(null);
            setSelectedCatFilterInMarcas('ALL');
            setActiveTab('categorias');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'categorias'
              ? 'bg-[#00346F] text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>1. Categorías</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              activeTab === 'categorias' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {categorias.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('marcas');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'marcas'
              ? 'bg-[#00346F] text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>2. Marcas</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              activeTab === 'marcas' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {marcas.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('modelos');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'modelos'
              ? 'bg-[#00346F] text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Laptop className="w-4 h-4" />
          <span>3. Modelos & Ficha Técnica</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              activeTab === 'modelos' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {modelos.length}
          </span>
        </button>
      </div>

      {/* ─── PESTAÑA 1: CATEGORÍAS ─── */}
      {activeTab === 'categorias' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchCat}
                onChange={(e) => setSearchCat(e.target.value)}
                placeholder="Buscar categoría de producto..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-[#00346F] focus:bg-white"
              />
            </div>
            {!readOnly && (
              <button
                onClick={handleOpenNewCat}
                className="px-4 py-2 bg-[#00346F] hover:bg-[#004A99] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Categoría</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EFF4FF] font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nombre de Categoría</th>
                  <th className="py-3 px-4">Ámbito Operativo</th>
                  <th className="py-3 px-4">Descripción Operativa</th>
                  <th className="py-3 px-4 text-center">Marcas Vinculadas</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#00346F]" />
                      Cargando categorías...
                    </td>
                  </tr>
                ) : filteredCategorias.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No se encontraron categorías registradas.
                    </td>
                  </tr>
                ) : (
                  filteredCategorias.map((cat, idx) => {
                    const marcasDeEstaCat = marcasPorCategoria.get(cat.id) || [];
                    const isExpanded = !!expandedCategories[cat.id];

                    return (
                      <React.Fragment key={cat.id}>
                        <tr className={`${idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'} hover:bg-blue-50/50 transition-colors`}>
                          <td
                            className="py-3.5 px-4 font-bold text-slate-900 cursor-pointer group"
                            onClick={() => handleSelectCategory(cat)}
                            title={`Explorar marcas de ${cat.nombre}`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="p-2 rounded-lg bg-blue-50 text-[#00346F] group-hover:bg-[#00346F] group-hover:text-white transition-colors">
                                <Layers className="w-4 h-4" />
                              </span>
                              <div>
                                <span className="text-xs group-hover:text-[#00346F] group-hover:underline transition-colors block">
                                  {cat.nombre}
                                </span>
                                <span className="text-[10px] text-slate-400 group-hover:text-[#00346F] font-normal flex items-center gap-0.5">
                                  Ver {marcasDeEstaCat.length} {marcasDeEstaCat.length === 1 ? 'marca' : 'marcas'} ➔
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1">
                              {cat.esEquipoTaller && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#00346F] border border-blue-200">
                                  💻 Equipo Taller
                                </span>
                              )}
                              {cat.esVenta && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  🛒 Venta
                                </span>
                              )}
                              {cat.esRepuestoTaller && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                                  🔧 Repuesto
                                </span>
                              )}
                              {!cat.esEquipoTaller && !cat.esVenta && !cat.esRepuestoTaller && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] text-slate-400 bg-slate-100">
                                  Sin asignar
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-medium">
                            {cat.descripcion || <span className="italic text-slate-300">Sin descripción</span>}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleSelectCategory(cat)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                marcasDeEstaCat.length > 0
                                  ? 'bg-blue-100 text-[#00346F] hover:bg-blue-200 hover:scale-105'
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              }`}
                              title={`Ver marcas registradas en ${cat.nombre}`}
                            >
                              <span>{marcasDeEstaCat.length} {marcasDeEstaCat.length === 1 ? 'marca' : 'marcas'}</span>
                              <span className="text-xs">➔</span>
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleToggleCat(cat)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-transform hover:scale-105 ${
                                cat.estado === 'ACTIVO'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {cat.estado === 'ACTIVO' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              <span>{cat.estado}</span>
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!readOnly && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenNewMarca(cat.id)}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                                  title={`Registrar nueva marca en ${cat.nombre}`}
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>+ Marca</span>
                                </button>
                              )}
                              {!readOnly && (
                                <button
                                  onClick={() => handleOpenEditCat(cat)}
                                  className="p-1.5 text-slate-500 hover:text-[#00346F] rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                                  title="Editar categoría"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* DESPLIEGUE EN CASCADA: MARCAS Y MODELOS DE ESTA CATEGORÍA */}
                        {isExpanded && (
                          <tr className="bg-slate-50/80 border-y-2 border-blue-200">
                            <td colSpan={6} className="p-4">
                              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-inner">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                  <div className="flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-[#00346F]" />
                                    <h4 className="font-bold text-xs text-slate-800">
                                      Marcas registradas en <span className="text-[#00346F] underline">{cat.nombre}</span>
                                    </h4>
                                    <span className="px-2 py-0.5 bg-blue-50 text-[#00346F] rounded text-[10px] font-bold">
                                      {marcasDeEstaCat.length} registradas
                                    </span>
                                  </div>
                                  {!readOnly && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenNewMarca(cat.id)}
                                      className="px-3 py-1 bg-[#00346F] hover:bg-[#004A99] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Nueva Marca en {cat.nombre}</span>
                                    </button>
                                  )}
                                </div>

                                {marcasDeEstaCat.length === 0 ? (
                                  <div className="p-4 text-center text-slate-500 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-300 space-y-2">
                                    <p className="font-medium">No hay marcas asociadas a esta categoría todavía.</p>
                                    {!readOnly && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenNewMarca(cat.id)}
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1 shadow-xs"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Crear Primera Marca para {cat.nombre}</span>
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {marcasDeEstaCat.map((m) => {
                                      const mods = modelosPorMarca.get(m.id) || [];
                                      return (
                                        <div
                                          key={m.id}
                                          className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-300 transition-all flex flex-col justify-between"
                                        >
                                          <div className="flex items-start justify-between gap-2 mb-2">
                                            <div>
                                              <span className="font-bold text-xs text-slate-900 block">{m.nombre}</span>
                                              <span className="text-[10px] text-slate-500 font-medium">
                                                {mods.length} {mods.length === 1 ? 'modelo registrado' : 'modelos registrados'}
                                              </span>
                                            </div>
                                            <span
                                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                                m.estado === 'ACTIVO' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                              }`}
                                            >
                                              {m.estado}
                                            </span>
                                          </div>

                                          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] gap-2">
                                            {!readOnly && (
                                              <button
                                                type="button"
                                                onClick={() => handleOpenNewModelo(m.id)}
                                                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] flex items-center gap-1 shadow-2xs cursor-pointer"
                                                title={`Crear nuevo modelo para ${m.nombre}`}
                                              >
                                                <Plus className="w-3 h-3" />
                                                <span>+ Modelo</span>
                                              </button>
                                            )}
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setSelectedMarcaFilter(m.id);
                                                setActiveTab('modelos');
                                              }}
                                              className="font-bold text-[#00346F] hover:underline cursor-pointer text-[10px]"
                                            >
                                              Ver modelos ➔
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── PESTAÑA 2: MARCAS ─── */}
      {activeTab === 'marcas' && (
        <div className="space-y-4">
          {/* Breadcrumb contextual si venimos de una Categoría */}
          {selectedCategory && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-blue-50/80 border border-blue-200 rounded-xl px-4 py-2.5 gap-2">
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <button
                  type="button"
                  onClick={handleBackToCategories}
                  className="inline-flex items-center gap-1 font-bold text-[#00346F] hover:underline cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Categorías</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-blue-200">
                  {selectedCategory.nombre}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-[#00346F] font-bold">
                  Marcas vinculadas
                </span>
              </div>
              <button
                type="button"
                onClick={handleBackToCategories}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00346F] hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a Categorías</span>
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            {/* Buscador de Marcas */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchMarca}
                onChange={(e) => setSearchMarca(e.target.value)}
                placeholder="Buscar marca por nombre o categoría (ej: HP, Lenovo, Laptops)..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-[#00346F] focus:bg-white"
              />
            </div>

            {/* Filtro por Categoría */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-bold text-slate-600 hidden sm:inline">Categoría:</span>
              <select
                value={selectedCatFilterInMarcas}
                onChange={(e) => {
                  const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                  setSelectedCatFilterInMarcas(val);
                  if (val === 'ALL') {
                    setSelectedCategory(null);
                  } else {
                    const match = categorias.find((c) => c.id === val);
                    setSelectedCategory(match || null);
                  }
                }}
                className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-[#00346F]"
              >
                <option value="ALL">Todas las Categorías ({categorias.length})</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            {!readOnly && (
              <button
                onClick={() => handleOpenNewMarca(selectedCategory ? selectedCategory.id : undefined)}
                className="px-4 py-2 bg-[#00346F] hover:bg-[#004A99] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Nueva Marca</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {loading ? (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#00346F]" />
                Cargando marcas...
              </div>
            ) : filteredMarcas.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 space-y-2">
                <p>No se encontraron marcas para este criterio de búsqueda o categoría.</p>
                {selectedCatFilterInMarcas !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCatFilterInMarcas('ALL');
                      setSelectedCategory(null);
                    }}
                    className="text-xs font-bold text-[#00346F] underline cursor-pointer"
                  >
                    Ver marcas de todas las categorías
                  </button>
                )}
              </div>
            ) : (
              filteredMarcas.map((marca) => {
                const count = (modelosPorMarca.get(marca.id) || []).length;
                return (
                  <div
                    key={marca.id}
                    className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div
                          className="flex items-center gap-2.5 cursor-pointer group"
                          onClick={() => handleSelectBrand(marca)}
                          title={`Ver modelos de ${marca.nombre}`}
                        >
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#00346F] to-[#001D40] text-white font-black text-xs flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                            {marca.nombre.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-slate-900 group-hover:text-[#00346F] group-hover:underline transition-colors">
                              {marca.nombre}
                            </h3>
                            <span className="text-[10px] font-mono text-[#00346F] font-bold">
                              {count} {count === 1 ? 'modelo' : 'modelos'} ➔
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleToggleMarca(marca)}
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold cursor-pointer ${
                            marca.estado === 'ACTIVO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {marca.estado}
                        </button>
                      </div>

                      {/* Badge de Categoría Asociada */}
                      <div className="mb-2">
                        {marca.categoriaNombre ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#00346F] border border-blue-200">
                            <Layers className="w-3 h-3" />
                            {marca.categoriaNombre}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                            Sin categoría
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                        {marca.descripcion || 'Sin descripción adicional.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-3 gap-2">
                      <div className="flex items-center gap-1.5">
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => handleOpenNewModelo(marca.id)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                            title={`Crear nuevo modelo de ${marca.nombre}`}
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ Modelo</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleSelectBrand(marca)}
                          className="text-[11px] font-bold text-[#00346F] hover:underline cursor-pointer"
                        >
                          Ver modelos ({count}) ➔
                        </button>
                      </div>
                      {!readOnly && (
                        <button
                          onClick={() => handleOpenEditMarca(marca)}
                          className="p-1 text-slate-400 hover:text-[#00346F] rounded cursor-pointer"
                          title="Editar marca"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─── PESTAÑA 3: MODELOS & FICHA TÉCNICA (M ➔ MO ➔ C) ─── */}
      {activeTab === 'modelos' && (
        <div className="space-y-4">
          {/* Breadcrumb contextual de navegación jerárquica */}
          {(selectedCategory || selectedBrand) && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-blue-50/80 border border-blue-200 rounded-xl px-4 py-2.5 gap-2">
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <button
                  type="button"
                  onClick={handleBackToCategories}
                  className="inline-flex items-center gap-1 font-bold text-[#00346F] hover:underline cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Categorías</span>
                </button>
                {selectedCategory && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    <button
                      type="button"
                      onClick={handleBackToBrands}
                      className="font-bold text-[#00346F] hover:underline cursor-pointer"
                    >
                      {selectedCategory.nombre}
                    </button>
                  </>
                )}
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <button
                  type="button"
                  onClick={handleBackToBrands}
                  className="font-bold text-[#00346F] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Marcas</span>
                </button>
                {selectedBrand && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-blue-200">
                      {selectedBrand.nombre}
                    </span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={handleBackToBrands}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00346F] hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a Marcas {selectedCategory ? `de ${selectedCategory.nombre}` : ''}</span>
              </button>
            </div>
          )}

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchModelo}
                  onChange={(e) => setSearchModelo(e.target.value)}
                  placeholder="Buscar modelo o especificación (ej: 'ThinkPad', 'Core i7', 'SSD 1TB', 'OLED')..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-[#00346F] focus:bg-white"
                />
              </div>

              {!readOnly && (
                <button
                  onClick={() =>
                    handleOpenNewModelo(
                      selectedBrand
                        ? selectedBrand.id
                        : selectedMarcaFilter !== 'ALL'
                        ? selectedMarcaFilter
                        : undefined
                    )
                  }
                  className="px-4 py-2 bg-[#00346F] hover:bg-[#004A99] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Modelo</span>
                </button>
              )}
            </div>

            {/* Chips de filtro por marca */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                Marca:
              </span>
              <button
                onClick={() => {
                  setSelectedMarcaFilter('ALL');
                  setSelectedBrand(null);
                }}
                className={`px-3 py-1 rounded-full font-bold transition-all shrink-0 cursor-pointer ${
                  selectedMarcaFilter === 'ALL'
                    ? 'bg-[#00346F] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todas ({marcas.length})
              </button>
              {marcas.map((m) => {
                const count = (modelosPorMarca.get(m.id) || []).length;
                const isSelected = selectedMarcaFilter === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedMarcaFilter(m.id);
                      setSelectedBrand(m);
                    }}
                    className={`px-3 py-1 rounded-full font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#00346F] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{m.nombre}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Listado directo de modelos */}
          {loading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#00346F]" />
              <p className="text-xs font-semibold text-slate-600">Cargando modelos...</p>
            </div>
          ) : filteredModelos.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              <Laptop className="w-10 h-10 mx-auto mb-3 text-slate-300 stroke-1" />
              <h3 className="text-sm font-bold text-slate-700">No se encontraron modelos</h3>
              <p className="text-xs text-slate-500 mt-1">Pruebe ajustando el filtro de búsqueda o registre uno nuevo.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>
                  Mostrando <strong className="text-slate-800">{filteredModelos.length}</strong> de <strong className="text-slate-800">{modelos.length}</strong> modelos registrados
                </span>
                {selectedMarcaFilter !== 'ALL' && (
                  <button
                    onClick={() => setSelectedMarcaFilter('ALL')}
                    className="text-[#00346F] hover:underline font-bold cursor-pointer"
                  >
                    Ver todas las marcas
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3">
                {filteredModelos.map((mod) => {
                  const marcaObj = marcas.find((m) => m.id === mod.marcaId);
                  const marcaLabel = mod.marcaNombre || marcaObj?.nombre || 'MARCA';

                  return (
                    <div
                      key={mod.id}
                      className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 bg-white shadow-xs transition-all flex flex-col md:flex-row md:items-start justify-between gap-4"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Insignia de Marca */}
                          <span className="px-2.5 py-1 bg-[#00346F] text-white rounded-lg text-xs font-black tracking-wide shadow-2xs">
                            {marcaLabel}
                          </span>

                          <h4 className="text-sm font-black text-slate-900">{mod.nombre}</h4>

                          <button
                            onClick={() => handleToggleModelo(mod)}
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold cursor-pointer transition-transform hover:scale-105 ${
                              mod.estado === 'ACTIVO'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-red-50 text-red-800 border border-red-200'
                            }`}
                            title="Clic para alternar estado del modelo"
                          >
                            {mod.estado}
                          </button>
                        </div>

                        {mod.descripcion && (
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {mod.descripcion}
                          </p>
                        )}

                        {/* Ficha técnica y características */}
                        {mod.caracteristicas && mod.caracteristicas.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap pt-1">
                            {mod.caracteristicas.map((c, idx) => (
                              <div
                                key={idx}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs shadow-2xs"
                              >
                                {getAttributeIcon(c.atributo)}
                                <span className="font-semibold text-slate-500 text-[10px]">
                                  {c.atributo}:
                                </span>
                                <span className="font-bold text-slate-800 text-[11px]">
                                  {c.valor}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {!readOnly && (
                        <div className="flex items-center gap-1.5 self-end md:self-start shrink-0">
                          {setActiveView && (
                            <button
                              onClick={() => {
                                setActiveView('panel-almacen');
                                onShowToast('Realizar Pedido', `Abriendo módulo de pedidos para ${mod.nombre}.`, 'info');
                              }}
                              className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition-colors"
                              title="Crear o agregar a una orden de compra en Almacén"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>Pedir</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditModelo(mod)}
                            className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-[#00346F] hover:text-[#00346F] text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition-colors"
                            title="Editar Ficha Técnica del Modelo"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL CATEGORÍA ─── */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-[#EFF4FF]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#00346F]" />
                <h3 className="text-sm font-bold text-[#00346F]">
                  {editingCat ? 'Editar Categoría' : 'Nueva Categoría de Productos'}
                </h3>
              </div>
              <button onClick={() => setIsCatModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCat} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Nombre de la Categoría *</label>
                <input
                  type="text"
                  required
                  value={catForm.nombre}
                  onChange={(e) => setCatForm({ ...catForm, nombre: e.target.value.toUpperCase() })}
                  placeholder="Ej: LAPTOPS, IMPRESORAS, MONITORES"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 text-sm focus:outline-none focus:border-[#00346F]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Descripción / Uso</label>
                <textarea
                  rows={2}
                  value={catForm.descripcion}
                  onChange={(e) => setCatForm({ ...catForm, descripcion: e.target.value })}
                  placeholder="Ej: Equipos portátiles y ultrabooks para oficina y gaming"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#00346F]"
                />
              </div>

              {/* Selección de Ámbitos Operativos */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                <span className="font-bold text-slate-800 text-xs block">
                  Ámbitos y Destino de Uso *
                </span>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Defina dónde estará disponible esta categoría para evitar mezclar repuestos con equipos de cliente o mercadería de tienda:
                </p>

                <div className="space-y-2 pt-1">
                  {/* Ámbito 1: Equipo Taller */}
                  <label className="flex items-start gap-2.5 p-2.5 bg-white rounded-lg border border-slate-200 hover:border-blue-300 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={Boolean(catForm.esEquipoTaller)}
                      onChange={(e) => setCatForm({ ...catForm, esEquipoTaller: e.target.checked })}
                      className="mt-0.5 rounded text-[#00346F] focus:ring-[#00346F]"
                    />
                    <div>
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        💻 Equipo Recepcionable en Taller
                      </span>
                      <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                        Aparecerá en el selector de tipo de equipo al emitir tickets y órdenes de trabajo (Laptops, PCs, Impresoras, etc.).
                      </span>
                    </div>
                  </label>

                  {/* Ámbito 2: Producto de Venta Comercial */}
                  <label className="flex items-start gap-2.5 p-2.5 bg-white rounded-lg border border-slate-200 hover:border-emerald-300 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={Boolean(catForm.esVenta)}
                      onChange={(e) => setCatForm({ ...catForm, esVenta: e.target.checked })}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-600"
                    />
                    <div>
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        🛒 Producto de Venta Comercial
                      </span>
                      <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                        Disponible para los vendedores en el Punto de Venta (POS) y catálogo comercial de tienda.
                      </span>
                    </div>
                  </label>

                  {/* Ámbito 3: Repuesto Técnico Interno */}
                  <label className="flex items-start gap-2.5 p-2.5 bg-white rounded-lg border border-slate-200 hover:border-purple-300 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={Boolean(catForm.esRepuestoTaller)}
                      onChange={(e) => setCatForm({ ...catForm, esRepuestoTaller: e.target.checked })}
                      className="mt-0.5 rounded text-purple-600 focus:ring-purple-600"
                    />
                    <div>
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        🔧 Repuesto de Uso Técnico Interno
                      </span>
                      <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                        Solo visible para técnicos al presupuestar e instalar repuestos. No aparecerá en recepción ni a los vendedores.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingCat}
                  className="px-5 py-2 bg-[#00346F] hover:bg-[#004A99] text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {savingCat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingCat ? 'Actualizar' : 'Guardar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL MARCA ─── */}
      {isMarcaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-[#EFF4FF]">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#00346F]" />
                <h3 className="text-sm font-bold text-[#00346F]">
                  {editingMarca ? 'Editar Marca' : 'Nueva Marca'}
                </h3>
              </div>
              <button onClick={() => setIsMarcaModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMarca} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Nombre de Marca *</label>
                <input
                  type="text"
                  required
                  value={marcaForm.nombre}
                  onChange={(e) => setMarcaForm({ ...marcaForm, nombre: e.target.value.toUpperCase() })}
                  placeholder="Ej: HP, LENOVO, EPSON, DELL"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 text-sm focus:outline-none focus:border-[#00346F]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Categoría de Destino *</label>
                <select
                  required
                  value={marcaForm.categoriaId || ''}
                  onChange={(e) =>
                    setMarcaForm({
                      ...marcaForm,
                      categoriaId: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 text-xs focus:outline-none focus:border-[#00346F]"
                >
                  <option value="" disabled>
                    Seleccione a qué categoría pertenece esta marca...
                  </option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Permite organizar a qué categoría pertenece la marca (ej: Laptops, Impresoras, Monitores).
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Descripción / Notas</label>
                <textarea
                  rows={3}
                  value={marcaForm.descripcion}
                  onChange={(e) => setMarcaForm({ ...marcaForm, descripcion: e.target.value })}
                  placeholder="Ej: Fabricante de laptops y periféricos"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#00346F]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMarcaModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingMarca}
                  className="px-5 py-2 bg-[#00346F] hover:bg-[#004A99] text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {savingMarca ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingMarca ? 'Actualizar' : 'Guardar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL MODELO CON CARACTERÍSTICAS ─── */}
      {isModeloModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-[#EFF4FF] shrink-0">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-[#00346F]" />
                <h3 className="text-sm font-bold text-[#00346F]">
                  {editingModelo ? 'Editar Modelo & Ficha Técnica' : 'Nuevo Modelo & Ficha Técnica'}
                </h3>
              </div>
              <button onClick={() => setIsModeloModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModelo} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Marca Perteneciente *</label>
                  <select
                    value={modeloForm.marcaId}
                    onChange={(e) => setModeloForm({ ...modeloForm, marcaId: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 text-xs focus:outline-none focus:border-[#00346F]"
                    required
                  >
                    <option value="" disabled>Seleccione marca...</option>
                    {marcas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre} {m.categoriaNombre ? `— [${m.categoriaNombre}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Nombre del Modelo *</label>
                  <input
                    type="text"
                    required
                    value={modeloForm.nombre}
                    onChange={(e) => setModeloForm({ ...modeloForm, nombre: e.target.value })}
                    placeholder="Ej: Predator Helios 18 AI o ThinkPad T14"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 text-xs focus:outline-none focus:border-[#00346F]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Descripción o Notas</label>
                <input
                  type="text"
                  value={modeloForm.descripcion}
                  onChange={(e) => setModeloForm({ ...modeloForm, descripcion: e.target.value })}
                  placeholder="Ej: Laptop gamer de alto rendimiento con pantalla Mini LED"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#00346F]"
                />
              </div>

              {/* Ficha técnica */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-2">
                  <div>
                    <span className="font-bold text-slate-800 block flex items-center gap-1.5">
                      <SlidersHorizontal className="w-4 h-4 text-[#00346F]" />
                      Especificaciones Técnicas (Ficha del Modelo)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Asigna las características técnicas (Procesador, RAM, Almacenamiento, etc.).
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddCaracteristica()}
                    className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-[#00346F] rounded-md font-bold text-[11px] flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Añadir Atributo</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Sugerencias:</span>
                  {PRESET_ATTRIBUTES.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleAddCaracteristica(preset, '')}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-[#00346F] cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>

                <div className="space-y-2 pt-1 max-h-52 overflow-y-auto pr-1">
                  {modeloForm.caracteristicas.length === 0 ? (
                    <div className="p-3 text-center text-slate-400 italic text-[11px]">
                      Haga clic en las sugerencias arriba o en "+ Añadir Atributo".
                    </div>
                  ) : (
                    modeloForm.caracteristicas.map((c, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-2/5">
                          <input
                            type="text"
                            value={c.atributo}
                            onChange={(e) => handleUpdateCaracteristica(idx, 'atributo', e.target.value)}
                            placeholder="Atributo (ej: Procesador)"
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#00346F]"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={c.valor}
                            onChange={(e) => handleUpdateCaracteristica(idx, 'valor', e.target.value)}
                            placeholder="Valor (ej: Core i9 14th Gen)"
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#00346F]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCaracteristica(idx)}
                          className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                          title="Eliminar fila"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModeloModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingModelo}
                  className="px-5 py-2 bg-[#00346F] hover:bg-[#004A99] text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {savingModelo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingModelo ? 'Guardar Cambios' : 'Registrar Modelo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
