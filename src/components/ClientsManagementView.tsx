import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Building,
  User,
  ShieldAlert,
  Save,
  X,
  RefreshCw,
  Wrench,
  ChevronLeft,
  ChevronRight,
  Package,
  Mail,
  Phone,
  MapPin,
  FileText,
  Loader2,
  AlertCircle,
  Inbox,
  Eye,
  MoreVertical,
  Filter,
  Grid3X3,
  List,
} from 'lucide-react';
import { clientService, Cliente, ClienteFormData } from '../services/client.service';
import { useDebounce } from '../hooks/useDebounce';

type ViewMode = 'table' | 'grid';

export const ClientsManagementView: React.FC = () => {
  // Data states
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters & search
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<'ALL' | 'ACTIVO' | 'INACTIVO'>('ALL');
  const debouncedSearch = useDebounce(search, 300);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const totalPages = Math.ceil(total / limit);

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState<ClienteFormData>({
    tipoDocumento: 'RUC',
    numeroDocumento: '',
    razonSocial: '',
    nombreEmpresa: '',
    direccionFiscal: '',
    email: '',
    telefono: '',
    estado: 'ACTIVO',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Detail modal
  const [detailCliente, setDetailCliente] = useState<Cliente | null>(null);

  // Load clients
  const loadClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { search?: string; estado?: string; page?: number; limit?: number } = {
        search: debouncedSearch || undefined,
        page,
        limit,
      };
      if (estadoFilter !== 'ALL') params.estado = estadoFilter;
      const res = await clientService.getClients(params);
      if (res.success) {
        setClientes(res.data);
        setTotal(res.pagination.total);
      } else {
        setError('Error al cargar clientes.');
      }
    } catch (err) {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, estadoFilter, page, limit]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, estadoFilter]);

  // Handlers
  const handleOpenNew = () => {
    setEditingCliente(null);
    setFormData({
      tipoDocumento: 'RUC',
      numeroDocumento: '',
      razonSocial: '',
      nombreEmpresa: '',
      direccionFiscal: '',
      email: '',
      telefono: '',
      estado: 'ACTIVO',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Cliente) => {
    setEditingCliente(c);
    setFormData({
      tipoDocumento: c.tipoDocumento as 'RUC' | 'DNI' | 'CE',
      numeroDocumento: c.numeroDocumento,
      razonSocial: c.razonSocial,
      nombreEmpresa: c.nombreEmpresa || '',
      direccionFiscal: c.direccionFiscal,
      email: c.email || '',
      telefono: c.telefono || '',
      estado: c.estado as 'ACTIVO' | 'INACTIVO',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleTipoDocumentoChange = (newTipo: 'RUC' | 'DNI' | 'CE') => {
    setFormData(prev => ({
      ...prev,
      tipoDocumento: newTipo,
      numeroDocumento: '',
      nombreEmpresa: newTipo === 'RUC' ? prev.nombreEmpresa : '',
    }));
    setFormErrors(prev => ({ ...prev, numeroDocumento: '', razonSocial: '' }));
  };

  const handleViewDetail = (c: Cliente) => {
    setDetailCliente(c);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setFormErrors({});

    // Validación dinámica local
    const errors: Record<string, string> = {};
    const doc = formData.numeroDocumento.trim();

    if (!doc) {
      errors.numeroDocumento = 'Número de documento requerido';
    } else {
      if (formData.tipoDocumento === 'RUC') {
        if (!/^(10|20)\d{9}$/.test(doc)) {
          errors.numeroDocumento = 'RUC debe tener 11 dígitos numéricos y comenzar con 10 o 20';
        }
      } else if (formData.tipoDocumento === 'DNI') {
        if (!/^\d{8}$/.test(doc)) {
          errors.numeroDocumento = 'DNI debe tener exactamente 8 dígitos numéricos';
        }
      } else if (formData.tipoDocumento === 'CE') {
        if (doc.length < 4 || doc.length > 12) {
          errors.numeroDocumento = 'Carnet de Extranjería debe tener entre 4 y 12 caracteres';
        }
      }
    }

    if (!formData.razonSocial.trim()) {
      errors.razonSocial = formData.tipoDocumento === 'RUC'
        ? 'Razón Social requerida'
        : 'Nombres y Apellidos requeridos';
    }

    if (!formData.direccionFiscal.trim()) {
      errors.direccionFiscal = formData.tipoDocumento === 'RUC'
        ? 'Dirección fiscal requerida'
        : 'Dirección requerida';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setModalLoading(false);
      return;
    }

    try {
      if (editingCliente) {
        const res = await clientService.updateClient(editingCliente.id, formData);
        if (res.success) {
          setClientes(prev => prev.map(c => c.id === editingCliente.id ? res.data : c));
          setIsModalOpen(false);
          setFormData({
            tipoDocumento: 'RUC',
            numeroDocumento: '',
            razonSocial: '',
            nombreEmpresa: '',
            direccionFiscal: '',
            email: '',
            telefono: '',
            estado: 'ACTIVO',
          });
        } else {
          setFormErrors({ submit: res.message || 'Error al actualizar cliente.' });
        }
      } else {
        const res = await clientService.createClient(formData);
        if (res.success) {
          setClientes(prev => [res.data, ...prev]);
          setTotal(prev => prev + 1);
          setIsModalOpen(false);
          setFormData({
            tipoDocumento: 'RUC',
            numeroDocumento: '',
            razonSocial: '',
            nombreEmpresa: '',
            direccionFiscal: '',
            email: '',
            telefono: '',
            estado: 'ACTIVO',
          });
        } else {
          setFormErrors({ submit: res.message || 'Error al crear cliente.' });
        }
      }
    } catch (err: any) {
      setFormErrors({ submit: err?.message || 'Error de conexión con el servidor.' });
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    setActionLoading(true);
    try {
      const res = await clientService.toggleStatus(id);
      if (res.success) {
        setClientes(prev => prev.map(c => c.id === id ? { ...c, estado: res.data.estado as any } : c));
      } else {
        setError(res.message || 'Error al cambiar estado.');
      }
    } catch (err) {
      setError('Error de conexión.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSearchByDoc = async (doc: string) => {
    if (!doc || doc.length < 8) return;
    try {
      const res = await clientService.searchByDocument(doc);
      if (res.success) {
        setClientes(prev => {
          const exists = prev.find(c => c.id === res.data.id);
          if (exists) return prev;
          return [res.data, ...prev];
        });
        setTotal(prev => prev + 1);
      }
    } catch (err) { }
  };

  // Skeleton loader
  const SkeletonCard = () => (
    <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-slate-200 rounded"></div>
        <div className="h-3 bg-slate-200 rounded w-2/3"></div>
      </div>
    </div>
  );

  // Empty state
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
        <Inbox className="w-12 h-12 text-blue-400" />
      </div>
      <h3 className="text-xl font-bold text-slate-700 mb-2">No hay clientes registrados</h3>
      <p className="text-slate-500 mb-6 max-w-md">
        Comienza registrando tu primer cliente. Los datos se guardan automáticamente en la base de datos.
      </p>
      <button
        onClick={handleOpenNew}
        className="bg-[#00346F] hover:bg-[#004A99] text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg transition-all"
      >
        <UserPlus className="w-5 h-5" />
        Registrar Primer Cliente
      </button>
    </div>
  );

  // Stats
  const stats = useMemo(() => ({
    total: clientes.length,
    activos: clientes.filter(c => c.estado === 'ACTIVO').length,
    inactivos: clientes.filter(c => c.estado === 'INACTIVO').length,
  }), [clientes]);

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto bg-[#F8F9FF] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1C30] tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-[#00346F] rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            Directorio de Clientes
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Gestión de clientes y contactos asociados a servicios técnicos y ventas.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            <button
              onClick={() => handleSearchByDoc(search)}
              className="bg-white border border-[#00346F] text-[#00346F] hover:bg-[#EFF4FF] px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              title="Buscar por RUC/DNI"
            >
              <FileText className="w-4 h-4" />
              Buscar por Doc.
            </button>
          )}
          <button
            onClick={handleOpenNew}
            className="bg-[#00346F] hover:bg-[#004A99] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-[#00346F]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              <p className="text-xs text-slate-500">Total Clientes</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.activos}</p>
              <p className="text-xs text-slate-500">Activos</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.inactivos}</p>
              <p className="text-xs text-slate-500">Inactivos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-end mb-6">
        <div className="flex-1 w-full">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Buscar Cliente
          </label>
          <div className="relative border border-slate-300 rounded-lg flex items-center px-3 bg-white focus-within:border-[#00346F]">
            <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="RUC, DNI, o Razón Social..."
              className="w-full py-2 bg-transparent border-none focus:outline-none text-xs text-slate-800"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="w-full md:w-48">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Estado
          </label>
          <select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value as any)}
            className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#00346F]"
          >
            <option value="ALL">Todos los estados</option>
            <option value="ACTIVO">Solo Activos</option>
            <option value="INACTIVO">Solo Inactivos</option>
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-[#EFF4FF] text-[#00346F]' : 'text-slate-400 hover:bg-slate-100'}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-[#EFF4FF] text-[#00346F]' : 'text-slate-400 hover:bg-slate-100'}`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Error:</span> {error}
          </div>
          <button onClick={() => loadClients()} className="text-red-700 hover:text-red-900">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty State */}
      {!loading && clientes.length === 0 && <EmptyState />}

      {/* Table View */}
      {!loading && clientes.length > 0 && viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#EFF4FF] border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider text-[11px]">
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">N° Doc.</th>
                  <th className="py-3 px-4">Razón Social / Nombres</th>
                  <th className="py-3 px-4">Dirección</th>
                  <th className="py-3 px-4">Email / Teléfono</th>
                  <th className="py-3 px-4 text-center">Equipos</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientes.map((c, idx) => (
                  <tr key={c.id} className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.tipoDocumento === 'RUC'
                        ? 'bg-blue-100 text-[#00346F]'
                        : c.tipoDocumento === 'DNI'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                        }`}>
                        {c.tipoDocumento}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs">
                      <div className="truncate">{c.razonSocial}</div>
                      {c.nombreEmpresa && (
                        <div className="text-[10px] text-slate-400 font-normal truncate">
                          {c.nombreEmpresa}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{c.direccionFiscal}</td>
                    <td className="py-3 px-4 text-slate-500">
                      <div className="flex items-center gap-1">
                        {c.email && <Mail className="w-3 h-3 text-slate-400" />}
                        <span className="text-[10px]">{c.email || '-'}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {c.telefono && <Phone className="w-3 h-3 text-slate-400" />}
                        <span className="text-[10px]">{c.telefono || '-'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700">
                        {c.totalEquipos || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(c.id, c.estado)}
                        disabled={actionLoading}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-transform hover:scale-105 ${c.estado === 'ACTIVO'
                          ? 'bg-[#DCFCE7] text-[#166534]'
                          : 'bg-[#FEE2E2] text-[#991B1B]'
                          }`}
                      >
                        {c.estado === 'ACTIVO' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{c.estado}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => handleViewDetail(c)} className="text-slate-500 hover:text-blue-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors" title="Ver">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleOpenEdit(c)} className="text-slate-500 hover:text-[#00346F] p-1.5 rounded-lg hover:bg-slate-200 transition-colors" title="Editar">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid View */}
      {!loading && clientes.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientes.map((c, idx) => (
            <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${c.estado === 'ACTIVO' ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#FEE2E2] text-[#991B1B]'
                    }`}>
                    {c.razonSocial.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{c.razonSocial}</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.tipoDocumento === 'RUC' ? 'bg-blue-100 text-[#00346F]' : 'bg-emerald-100 text-emerald-800'
                      }`}>{c.tipoDocumento}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-xs text-slate-600 mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-3 h-3 text-slate-400" />
                  <span className="font-mono">{c.numeroDocumento}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span className="truncate">{c.direccionFiscal}</span>
                </div>
                {c.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{c.telefono || '-'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className={`text-xs font-bold ${c.estado === 'ACTIVO' ? 'text-emerald-700' : 'text-red-700'}`}>
                  {c.estado === 'ACTIVO' ? '✓ Activo' : '✗ Inactivo'}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => handleViewDetail(c)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleOpenEdit(c)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(c.id, c.estado)}
                    disabled={actionLoading}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${c.estado === 'ACTIVO'
                      ? 'bg-red-50 text-red-700 hover:bg-red-100'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                  >
                    {c.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && clientes.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Mostrando {((page - 1) * limit) + 1}-{Math.min(page * limit, total)} de {total}</span>
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              className="px-2 py-1 border border-slate-300 rounded text-xs"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>por página</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              if (pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${page === pageNum ? 'bg-[#00346F] text-white' : 'border border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal - Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-[#EFF4FF]">
              <h3 className="text-base font-bold text-[#00346F]">
                {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {/* Form Errors */}
              {formErrors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {formErrors.submit}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Tipo Doc. *</label>
                  <select
                    value={formData.tipoDocumento}
                    onChange={(e) => handleTipoDocumentoChange(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00346F]"
                  >
                    <option value="RUC">RUC (Empresa)</option>
                    <option value="DNI">DNI (Persona)</option>
                    <option value="CE">C. Extranjería</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {formData.tipoDocumento === 'RUC' ? 'N° RUC (11 dígitos) *' : (formData.tipoDocumento === 'DNI' ? 'N° DNI (8 dígitos) *' : 'N° Documento *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.numeroDocumento}
                    onChange={(e) => setFormData({ ...formData, numeroDocumento: e.target.value.toUpperCase() })}
                    className={`w-full p-2 bg-white border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-[#00346F] ${formErrors.numeroDocumento ? 'border-red-500' : ''}`}
                    placeholder={formData.tipoDocumento === 'RUC' ? '20481928371' : (formData.tipoDocumento === 'DNI' ? '47891234' : '001234567')}
                  />
                  {formErrors.numeroDocumento && <p className="text-red-500 text-[10px] mt-1">{formErrors.numeroDocumento}</p>}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {formData.tipoDocumento === 'RUC' ? 'Razón Social *' : 'Nombres y Apellidos *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.razonSocial}
                  onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value.toUpperCase() })}
                  className={`w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00346F] ${formErrors.razonSocial ? 'border-red-500' : ''}`}
                  placeholder={formData.tipoDocumento === 'RUC' ? 'CONSTRUCTORA LOS ANDES S.A.C.' : 'JUAN CARLOS PÉREZ GÓMEZ'}
                />
                {formErrors.razonSocial && <p className="text-red-500 text-[10px] mt-1">{formErrors.razonSocial}</p>}
              </div>

              {formData.tipoDocumento === 'RUC' && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nombre Comercial / Empresa <span className="text-slate-400 font-normal lowercase">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nombreEmpresa || ''}
                    onChange={(e) => setFormData({ ...formData, nombreEmpresa: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00346F]"
                    placeholder="Ej: Constructora Los Andes"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {formData.tipoDocumento === 'RUC' ? 'Dirección Fiscal *' : 'Dirección *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.direccionFiscal}
                  onChange={(e) => setFormData({ ...formData, direccionFiscal: e.target.value })}
                  className={`w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00346F] ${formErrors.direccionFiscal ? 'border-red-500' : ''}`}
                  placeholder={formData.tipoDocumento === 'RUC' ? 'Av. Balta 1082, Chiclayo' : 'Jr. San José 450, Chiclayo'}
                />
                {formErrors.direccionFiscal && <p className="text-red-500 text-[10px] mt-1">{formErrors.direccionFiscal}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00346F]"
                    placeholder="contacto@cliente.pe"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formData.telefono || ''}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00346F]"
                    placeholder="074-283921"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <label className="block font-bold text-slate-800 uppercase tracking-wider mb-2">Estado</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="estadoCli" value="ACTIVO" checked={formData.estado === 'ACTIVO'} onChange={() => setFormData({ ...formData, estado: 'ACTIVO' })} />
                    <span className="font-semibold text-emerald-800">ACTIVO</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="estadoCli" value="INACTIVO" checked={formData.estado === 'INACTIVO'} onChange={() => setFormData({ ...formData, estado: 'INACTIVO' })} />
                    <span className="font-semibold text-red-800">INACTIVO</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold">Cancelar</button>
                <button type="submit" disabled={modalLoading} className="px-5 py-2 bg-[#00346F] hover:bg-[#004A99] text-white rounded-lg font-semibold flex items-center gap-2 shadow disabled:opacity-70">
                  {modalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {modalLoading ? 'Guardando...' : (editingCliente ? 'Actualizar' : 'Guardar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailCliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-[#EFF4FF]">
              <h3 className="text-base font-bold text-[#00346F]">Detalle del Cliente</h3>
              <button onClick={() => setDetailCliente(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#00346F] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {detailCliente.razonSocial.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{detailCliente.razonSocial}</p>
                  {detailCliente.nombreEmpresa && (
                    <p className="text-xs text-slate-500 font-medium">{detailCliente.nombreEmpresa}</p>
                  )}
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${detailCliente.estado === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {detailCliente.estado}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-slate-500">Tipo Doc.</p>
                  <p className="font-bold">{detailCliente.tipoDocumento === 'RUC' ? 'RUC (Empresa)' : (detailCliente.tipoDocumento === 'DNI' ? 'DNI (Persona)' : detailCliente.tipoDocumento)}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-slate-500">N° Documento</p>
                  <p className="font-bold font-mono">{detailCliente.numeroDocumento}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-slate-500">Equipos Registrados</p>
                  <p className="font-bold">{detailCliente.totalEquipos || 0}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-slate-500">Fecha Registro</p>
                  <p className="font-bold">{new Date(detailCliente.fechaRegistro).toLocaleDateString('es-PE')}</p>
                </div>
              </div>
              {detailCliente.email && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{detailCliente.email}</span>
                </div>
              )}
              {detailCliente.telefono && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{detailCliente.telefono}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>{detailCliente.direccionFiscal}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
