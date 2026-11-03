import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Tag,
  Plus,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Save,
  X,
  Search,
  Laptop,
  Cpu,
  HardDrive,
  Monitor,
  Zap,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  SlidersHorizontal,
  FolderPlus,
  Database,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Marca, Modelo, CaracteristicaModelo, EstadoRegistro } from '../types';
import { brandModelService, CreateMarcaData, CreateModeloData } from '../services/brandModel.service';

interface BrandsViewProps {
  marcas?: Marca[];
  onSaveMarca?: (m: Marca) => void;
  onToggleEstado?: (id: number) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  readOnly?: boolean;
}

const PRESET_ATTRIBUTES = [
  'Procesador',
  'Memoria RAM',
  'Almacenamiento',
  'Pantalla',
  'Tarjeta Gráfica',
  'Color',
  'Generación',
  'Batería',
];

export const BrandsView: React.FC<BrandsViewProps> = ({
  onShowToast,
  readOnly = false,
}) => {
  // ─── ESTADOS DE DATOS ───
  const [marcasList, setMarcasList] = useState<Marca[]>([]);
  const [modelosList, setModelosList] = useState<Modelo[]>([]);
  const [loading, setLoading] = useState(true);

  // ─── ESTADOS DE FILTRO ───
  const [search, setSearch] = useState('');
  const [selectedMarcaFilter, setSelectedMarcaFilter] = useState<number | 'ALL'>('ALL');
  const [expandedMarcas, setExpandedMarcas] = useState<Record<number, boolean>>({});

  // ─── MODAL DE MARCA ───
  const [isMarcaModalOpen, setIsMarcaModalOpen] = useState(false);
  const [editingMarca, setEditingMarca] = useState<Marca | null>(null);
  const [marcaForm, setMarcaForm] = useState<CreateMarcaData>({ nombre: '', descripcion: '' });
  const [savingMarca, setSavingMarca] = useState(false);

  // ─── MODAL DE MODELO Y CARACTERÍSTICAS ───
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

  // ─── CARGAR DATOS DESDE EL BACKEND ───
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [resMarcas, resModelos] = await Promise.all([
        brandModelService.getMarcas(),
        brandModelService.getModelos(),
      ]);

      if (resMarcas.success && resMarcas.marcas) {
        setMarcasList(resMarcas.marcas);
        // Expandir por defecto las 2 primeras marcas con modelos
        const initialExpanded: Record<number, boolean> = {};
        resMarcas.marcas.slice(0, 3).forEach((m) => {
          initialExpanded[m.id] = true;
        });
        setExpandedMarcas(initialExpanded);
      }

      if (resModelos.success && resModelos.modelos) {
        setModelosList(resModelos.modelos);
      }
    } catch (err) {
      console.error('Error cargando marcas y modelos:', err);
      onShowToast('Error', 'No se pudieron sincronizar marcas y modelos.', 'error');
    } finally {
      setLoading(false);
    }
  }, [onShowToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Agrupar modelos por marcaId
  const modelosPorMarca = useMemo(() => {
    const map = new Map<number, Modelo[]>();
    for (const m of modelosList) {
      if (!map.has(m.marcaId)) {
        map.set(m.marcaId, []);
      }
      map.get(m.marcaId)!.push(m);
    }
    return map;
  }, [modelosList]);

  // Total de características registradas en todo el sistema
  const totalCaracteristicasCount = useMemo(() => {
    return modelosList.reduce((acc, m) => acc + (m.caracteristicas?.length || 0), 0);
  }, [modelosList]);

  // Marcas filtradas por búsqueda y filtro de marca
  const filteredMarcas = useMemo(() => {
    return marcasList.filter((marca) => {
      if (selectedMarcaFilter !== 'ALL' && marca.id !== selectedMarcaFilter) {
        return false;
      }

      if (!search.trim()) return true;

      const q = search.toLowerCase();
      // Coincide con nombre de la marca
      if (marca.nombre.toLowerCase().includes(q)) return true;

      // Coincide con algún modelo de esa marca o sus características
      const modelos = modelosPorMarca.get(marca.id) || [];
      return modelos.some((mod) => {
        if (mod.nombre.toLowerCase().includes(q)) return true;
        return mod.caracteristicas?.some(
          (c) => c.atributo.toLowerCase().includes(q) || c.valor.toLowerCase().includes(q)
        );
      });
    });
  }, [marcasList, selectedMarcaFilter, search, modelosPorMarca]);

  const toggleExpandMarca = (marcaId: number) => {
    setExpandedMarcas((prev) => ({
      ...prev,
      [marcaId]: !prev[marcaId],
    }));
  };

  // ─── ACCIONES DE MARCAS ───
  const handleOpenNewMarca = () => {
    setEditingMarca(null);
    setMarcaForm({ nombre: '', descripcion: '' });
    setIsMarcaModalOpen(true);
  };

  const handleOpenEditMarca = (m: Marca) => {
    setEditingMarca(m);
    setMarcaForm({ nombre: m.nombre, descripcion: m.descripcion || '' });
    setIsMarcaModalOpen(true);
  };

  const handleSaveMarcaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!marcaForm.nombre.trim()) return;

    setSavingMarca(true);
    try {
      if (editingMarca) {
        const res = await brandModelService.updateMarca(editingMarca.id, marcaForm);
        if (res.success) {
          onShowToast('Marca actualizada', `Marca '${marcaForm.nombre}' guardada.`, 'success');
          setIsMarcaModalOpen(false);
          await loadData();
        } else {
          onShowToast('Error', res.message || 'No se pudo actualizar.', 'error');
        }
      } else {
        const res = await brandModelService.createMarca(marcaForm);
        if (res.success) {
          onShowToast('Marca creada', `Marca '${marcaForm.nombre}' registrada con éxito.`, 'success');
          setIsMarcaModalOpen(false);
          await loadData();
        } else {
          onShowToast('Error', res.message || 'No se pudo crear.', 'error');
        }
      }
    } catch {
      onShowToast('Error', 'Fallo de conexión.', 'error');
    } finally {
      setSavingMarca(false);
    }
  };

  const handleToggleMarca = async (marca: Marca) => {
    try {
      const res = await brandModelService.toggleMarcaEstado(marca.id);
      if (res.success) {
        onShowToast('Estado actualizado', res.message || 'Estado modificado.', 'info');
        setMarcasList((prev) =>
          prev.map((m) => (m.id === marca.id ? { ...m, estado: res.nuevoEstado as EstadoRegistro } : m))
        );
      }
    } catch {
      onShowToast('Error', 'No se pudo cambiar el estado.', 'error');
    }
  };

  // ─── ACCIONES DE MODELOS & CARACTERÍSTICAS ───
  const handleOpenNewModelo = (preselectedMarcaId?: number) => {
    setEditingModelo(null);
    setModeloForm({
      marcaId: preselectedMarcaId || (marcasList.length > 0 ? marcasList[0].id : ''),
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

  const handleOpenEditModelo = (modelo: Modelo) => {
    setEditingModelo(modelo);
    setModeloForm({
      marcaId: modelo.marcaId,
      nombre: modelo.nombre,
      descripcion: modelo.descripcion || '',
      caracteristicas:
        modelo.caracteristicas && modelo.caracteristicas.length > 0
          ? modelo.caracteristicas.map((c) => ({ atributo: c.atributo, valor: c.valor }))
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

  const handleSaveModeloSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modeloForm.marcaId || !modeloForm.nombre.trim()) {
      onShowToast('Campos obligatorios', 'Seleccione una marca e ingrese el nombre del modelo.', 'warning');
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
          onShowToast('Modelo actualizado', `Modelo '${payload.nombre}' guardado con éxito.`, 'success');
          setIsModeloModalOpen(false);
          await loadData();
        } else {
          onShowToast('Error', res.message || 'No se pudo actualizar el modelo.', 'error');
        }
      } else {
        const res = await brandModelService.createModelo(payload);
        if (res.success) {
          onShowToast('Modelo registrado', `Modelo '${payload.nombre}' agregado al catálogo.`, 'success');
          setIsModeloModalOpen(false);
          // Asegurar que la marca quede expandida
          setExpandedMarcas((prev) => ({ ...prev, [Number(modeloForm.marcaId)]: true }));
          await loadData();
        } else {
          onShowToast('Error', res.message || 'No se pudo registrar el modelo.', 'error');
        }
      }
    } catch {
      onShowToast('Error', 'Fallo de conexión al guardar modelo.', 'error');
    } finally {
      setSavingModelo(false);
    }
  };

  const handleToggleModelo = async (modelo: Modelo) => {
    try {
      const res = await brandModelService.toggleModeloEstado(modelo.id);
      if (res.success) {
        onShowToast('Estado modificado', res.message || 'Estado actualizado.', 'info');
        setModelosList((prev) =>
          prev.map((m) => (m.id === modelo.id ? { ...m, estado: res.nuevoEstado as EstadoRegistro } : m))
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
    return <Layers className="w-3.5 h-3.5 text-slate-500" />;
  };

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto bg-[#F8F9FF] min-h-screen">
      {/* ─── HEADER PRINCIPAL ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#00346F]/10 text-[#00346F] rounded-lg">
              <Tag className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-[#0B1C30] tracking-tight">
              Catálogo de Marcas y Modelos
            </h1>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Estructura jerárquica: <strong>Marca (M)</strong> ➔ <strong>Modelos (MO)</strong> ➔ <strong>Características Técnicas (C)</strong>.
          </p>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleOpenNewMarca}
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <FolderPlus className="w-4 h-4 text-[#00346F]" />
              <span>Nueva Marca</span>
            </button>

            <button
              onClick={() => handleOpenNewModelo()}
              className="flex-1 sm:flex-initial px-4 py-2 bg-[#00346F] hover:bg-[#004A99] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Modelo</span>
            </button>
          </div>
        )}
      </div>

      {/* ─── RESUMEN DE INDICADORES (KPIs) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#00346F] shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Marcas Registradas (M)
            </div>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {marcasList.length}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
            <Laptop className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Modelos de Equipos (MO)
            </div>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {modelosList.length}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Especificaciones Técnicas (C)
            </div>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {totalCaracteristicasCount}
            </div>
          </div>
        </div>
      </div>

      {/* ─── BARRA DE BÚSQUEDA Y FILTRO POR MARCA ─── */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por marca, modelo o especificación (ej. 'ThinkPad', 'Core Ultra', 'SSD')..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00346F] focus:bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
            title="Recargar datos de MySQL"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>

        {/* Chips horizontales de marcas para filtrado rápido */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Filtrar:
          </span>
          <button
            onClick={() => setSelectedMarcaFilter('ALL')}
            className={`px-3 py-1 rounded-full font-bold transition-all shrink-0 cursor-pointer ${
              selectedMarcaFilter === 'ALL'
                ? 'bg-[#00346F] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas ({marcasList.length})
          </button>
          {marcasList.map((m) => {
            const count = (modelosPorMarca.get(m.id) || []).length;
            const isSelected = selectedMarcaFilter === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMarcaFilter(m.id)}
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

      {/* ─── LISTADO JERÁRQUICO (M ➔ MO ➔ C) ─── */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#00346F]" />
          <p className="text-xs font-semibold text-slate-600">Cargando catálogo de marcas y modelos...</p>
        </div>
      ) : filteredMarcas.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <Tag className="w-10 h-10 mx-auto mb-3 text-slate-300 stroke-1" />
          <h3 className="text-sm font-bold text-slate-700">No se encontraron marcas ni modelos</h3>
          <p className="text-xs text-slate-500 mt-1">Pruebe ajustando el término de búsqueda o registre una nueva marca.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMarcas.map((marca) => {
            const modelos = modelosPorMarca.get(marca.id) || [];
            const isExpanded = Boolean(expandedMarcas[marca.id]);

            return (
              <div
                key={marca.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all"
              >
                {/* ── ENCABEZADO DE MARCA (NIVEL 1) ── */}
                <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleExpandMarca(marca.id)}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:border-slate-300 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                      title={isExpanded ? 'Contraer modelos' : 'Desplegar modelos'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[#00346F]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </button>

                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00346F] to-[#002047] text-white flex items-center justify-center font-black text-sm tracking-wider shadow-xs shrink-0">
                      {marca.nombre.slice(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-black text-slate-900 tracking-tight">
                          {marca.nombre}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#00346F] border border-blue-200 font-mono">
                          {modelos.length} {modelos.length === 1 ? 'modelo' : 'modelos'}
                        </span>
                        <button
                          onClick={() => handleToggleMarca(marca)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-transform hover:scale-105 ${
                            marca.estado === 'ACTIVO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {marca.estado}
                        </button>
                      </div>
                      {marca.descripcion && (
                        <p className="text-[11px] text-slate-500 mt-0.5">{marca.descripcion}</p>
                      )}
                    </div>
                  </div>

                  {!readOnly && (
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleOpenNewModelo(marca.id)}
                        className="px-3 py-1.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-[#00346F] rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title={`Agregar modelo a ${marca.nombre}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Añadir Modelo</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditMarca(marca)}
                        className="p-1.5 text-slate-500 hover:text-[#00346F] rounded-lg border border-slate-200 hover:border-slate-300 bg-white transition-colors cursor-pointer"
                        title="Editar marca"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* ── LISTADO DE MODELOS (NIVEL 2 Y 3) ── */}
                {isExpanded && (
                  <div className="p-4 bg-white">
                    {modelos.length === 0 ? (
                      <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <Laptop className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
                        <p className="text-xs font-semibold text-slate-600">
                          Aún no hay modelos registrados para {marca.nombre}.
                        </p>
                        {!readOnly && (
                          <button
                            onClick={() => handleOpenNewModelo(marca.id)}
                            className="mt-2 text-xs font-bold text-[#00346F] hover:underline inline-flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Registrar primer modelo
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {modelos.map((modelo) => {
                          const caracs = modelo.caracteristicas || [];
                          return (
                            <div
                              key={modelo.id}
                              className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xs bg-slate-50/40 transition-all flex flex-col md:flex-row md:items-start justify-between gap-4"
                            >
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="p-1.5 bg-blue-100 text-[#00346F] rounded-md shrink-0">
                                    <Laptop className="w-4 h-4" />
                                  </span>
                                  <h4 className="text-sm font-bold text-slate-900">
                                    {modelo.nombre}
                                  </h4>
                                  <button
                                    onClick={() => handleToggleModelo(modelo)}
                                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold cursor-pointer ${
                                      modelo.estado === 'ACTIVO'
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        : 'bg-red-50 text-red-800 border border-red-200'
                                    }`}
                                  >
                                    {modelo.estado}
                                  </button>
                                </div>

                                {modelo.descripcion && (
                                  <p className="text-[11px] text-slate-500 pl-7 leading-relaxed">
                                    {modelo.descripcion}
                                  </p>
                                )}

                                {/* ── CHIPS DE CARACTERÍSTICAS TÉCNICAS (NIVEL 3) ── */}
                                <div className="pl-0 sm:pl-7 pt-1">
                                  {caracs.length === 0 ? (
                                    <span className="text-[11px] text-slate-400 italic">
                                      Sin especificaciones técnicas registradas.
                                    </span>
                                  ) : (
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {caracs.map((c, cIdx) => (
                                        <div
                                          key={c.id || cIdx}
                                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs shadow-2xs hover:border-slate-300 transition-colors"
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
                              </div>

                              {!readOnly && (
                                <div className="flex items-center gap-2 shrink-0 self-end md:self-start">
                                  <button
                                    onClick={() => handleOpenEditModelo(modelo)}
                                    className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-blue-300 hover:text-[#00346F] text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                                    title="Editar modelo y características"
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
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── MODAL 1: NUEVA / EDITAR MARCA (NIVEL 1) ─── */}
      {isMarcaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-[#EFF4FF]">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#00346F]" />
                <h3 className="text-sm font-bold text-[#00346F]">
                  {editingMarca ? 'Editar Marca' : 'Nueva Marca (Nivel 1)'}
                </h3>
              </div>
              <button
                onClick={() => setIsMarcaModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMarcaSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Nombre de la Marca *
                </label>
                <input
                  type="text"
                  required
                  value={marcaForm.nombre}
                  onChange={(e) => setMarcaForm({ ...marcaForm, nombre: e.target.value.toUpperCase() })}
                  placeholder="Ej: LENOVO, HP, DELL, APPLE, ASUS"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 text-sm focus:outline-none focus:border-[#00346F] focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Descripción / Origen (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={marcaForm.descripcion}
                  onChange={(e) => setMarcaForm({ ...marcaForm, descripcion: e.target.value })}
                  placeholder="Ej: Equipos portátiles y corporativos"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#00346F] focus:bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMarcaModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingMarca}
                  className="px-5 py-2 bg-[#00346F] hover:bg-[#004A99] text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {savingMarca ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{editingMarca ? 'Actualizar Marca' : 'Guardar Marca'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: NUEVO / EDITAR MODELO CON CARACTERÍSTICAS DINÁMICAS (NIVELES 2 Y 3) ─── */}
      {isModeloModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-[#EFF4FF] shrink-0">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-[#00346F]" />
                <h3 className="text-sm font-bold text-[#00346F]">
                  {editingModelo ? 'Editar Modelo y Especificaciones' : 'Registrar Modelo & Características'}
                </h3>
              </div>
              <button
                onClick={() => setIsModeloModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModeloSubmit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Sección 1: Marca y Nombre del Modelo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Marca Perteneciente (M) *
                  </label>
                  <select
                    value={modeloForm.marcaId}
                    onChange={(e) => setModeloForm({ ...modeloForm, marcaId: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 text-xs focus:outline-none focus:border-[#00346F] focus:bg-white"
                    required
                  >
                    <option value="" disabled>Seleccione una marca...</option>
                    {marcasList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Nombre del Modelo (MO) *
                  </label>
                  <input
                    type="text"
                    required
                    value={modeloForm.nombre}
                    onChange={(e) => setModeloForm({ ...modeloForm, nombre: e.target.value })}
                    placeholder="Ej: ThinkPad X1 Carbon Gen 14 Aura Edition"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 text-xs focus:outline-none focus:border-[#00346F] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Descripción o Notas del Modelo
                </label>
                <input
                  type="text"
                  value={modeloForm.descripcion}
                  onChange={(e) => setModeloForm({ ...modeloForm, descripcion: e.target.value })}
                  placeholder="Ej: Ultrabook con NPU de IA integrada y pantalla OLED"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#00346F] focus:bg-white"
                />
              </div>

              {/* Sección 2: Características Técnicas (Nivel 3) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-2">
                  <div>
                    <span className="font-bold text-slate-800 block flex items-center gap-1.5">
                      <SlidersHorizontal className="w-4 h-4 text-[#00346F]" />
                      Especificaciones & Atributos Técnicos (C)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Asigna las características del modelo (Procesador, RAM, Almacenamiento, Pantalla, etc.).
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddCaracteristica()}
                    className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-[#00346F] rounded-md font-bold text-[11px] flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Añadir Fila</span>
                  </button>
                </div>

                {/* Botones de sugerencias rápidas */}
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

                {/* Lista dinámica de características */}
                <div className="space-y-2 pt-1 max-h-56 overflow-y-auto pr-1">
                  {modeloForm.caracteristicas.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 italic text-[11px]">
                      No hay características añadidas. Haz clic en las sugerencias arriba o en "+ Añadir Fila".
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
                            placeholder="Valor (ej: Intel Core Ultra 7 258V)"
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#00346F]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCaracteristica(idx)}
                          className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="Eliminar característica"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Botones de acción del modal */}
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
                  {savingModelo ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
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
