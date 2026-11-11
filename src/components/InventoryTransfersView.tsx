import React, { useState, useEffect } from 'react';
import {
  ArrowRightLeft,
  CheckCircle2,
  Clock3,
  Package,
  Plus,
  Truck,
  XCircle,
  RotateCcw,
  Search,
  Filter,
  Layers,
  Store,
  Info,
  Laptop,
  Check,
  Send,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { MovimientoInventario, Producto, Sucursal, UserRole, EstadoMovimientoInventario, TransferPrefill } from '../types';
import { transferService, SerieDisponible } from '../services/transfer.service';

interface InventoryTransfersViewProps {
  productos: Producto[];
  sucursales: Sucursal[];
  movimientos: MovimientoInventario[];
  onSaveMovimiento: (data: any) => Promise<boolean | void> | void;
  onUpdateMovimiento: (movimientoId: number, nuevoEstado: EstadoMovimientoInventario) => Promise<boolean | void> | void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  currentUserName: string;
  currentUserRole: UserRole;
  currentUserSucursalId?: number | null;
  currentUserSucursalNombre?: string | null;
  onRefreshMovimientos?: () => void;
  prefillRequest?: TransferPrefill | null;
  onClearPrefill?: () => void;
}

const STATUS_CONFIG: Record<EstadoMovimientoInventario, { label: string; bg: string; text: string; icon: any }> = {
  SOLICITADO: { label: 'Solicitado', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: Clock3 },
  APROBADO: { label: 'Aprobado', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', icon: CheckCircle2 },
  EN_TRANSITO: { label: 'En tránsito', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', icon: Truck },
  RECIBIDO: { label: 'Recibido', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: CheckCircle2 },
  DEVUELTO: { label: 'Devuelto a origen', bg: 'bg-teal-50 border-teal-200', text: 'text-teal-700', icon: RotateCcw },
  CANCELADO: { label: 'Cancelado', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', icon: XCircle },
};

export const InventoryTransfersView: React.FC<InventoryTransfersViewProps> = ({
  productos,
  sucursales,
  movimientos,
  onSaveMovimiento,
  onUpdateMovimiento,
  onShowToast,
  currentUserName,
  currentUserRole,
  currentUserSucursalId = null,
  currentUserSucursalNombre = null,
  onRefreshMovimientos,
  prefillRequest = null,
  onClearPrefill,
}) => {
  const activeBranches = sucursales.filter((b) => b.estado === 'ACTIVO');

  // Estados de filtros y búsqueda
  const [filterTab, setFilterTab] = useState<'TODOS' | 'PRESTAMO' | 'TRASLADO' | 'PENDIENTES'>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');

  // Estados del modal de creación
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tipoMovimiento, setTipoMovimiento] = useState<'TRASLADO' | 'PRESTAMO'>('PRESTAMO');
  const [selectedProductoId, setSelectedProductoId] = useState<number>(productos[0]?.id || 0);
  const [sedeOrigenId, setSedeOrigenId] = useState<number>(activeBranches[0]?.id || 1);
  const [sedeDestinoId, setSedeDestinoId] = useState<number>(
    currentUserSucursalId && activeBranches.some((b) => b.id === currentUserSucursalId && b.id !== (activeBranches[0]?.id || 1))
      ? currentUserSucursalId
      : activeBranches[1]?.id || (activeBranches[0]?.id ? activeBranches[0]?.id + 1 : 2)
  );
  const [cantidad, setCantidad] = useState<number>(1);
  const [motivo, setMotivo] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');

  // Series disponibles si el producto seleccionado requiere series físicas
  const [seriesDisponibles, setSeriesDisponibles] = useState<SerieDisponible[]>([]);
  const [seriesSeleccionadas, setSeriesSeleccionadas] = useState<string[]>([]);
  const [loadingSeries, setLoadingSeries] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const normalizedRole = String(currentUserRole || '').toUpperCase();
  const isSuperAdmin = normalizedRole === 'SUPERADMIN';
  const isAdminOrAlmacenGlobalRole = [
    'SUPERADMIN',
    'ADMIN',
    'ADMINISTRADOR',
    'ALMACEN',
    'ALMACEN_Y_LOGISTICA',
  ].includes(normalizedRole);

  const matchesUserBranch = (movSedeId?: number, movSedeNombre?: string): boolean => {
    if (currentUserSucursalId && movSedeId && Number(currentUserSucursalId) === Number(movSedeId)) {
      return true;
    }
    if (currentUserSucursalNombre && movSedeNombre) {
      return (
        currentUserSucursalNombre.trim().toLowerCase() === movSedeNombre.trim().toLowerCase()
      );
    }
    return false;
  };

  const hasAssignedBranch = Boolean(currentUserSucursalId || currentUserSucursalNombre);

  const canActOrigin = (m: MovimientoInventario) =>
    isSuperAdmin ||
    (!hasAssignedBranch && isAdminOrAlmacenGlobalRole) ||
    matchesUserBranch(m.sedeOrigenId, m.sedeOrigen);

  const canActDestino = (m: MovimientoInventario) =>
    isSuperAdmin ||
    (!hasAssignedBranch && isAdminOrAlmacenGlobalRole) ||
    matchesUserBranch(m.sedeDestinoId, m.sedeDestino);

  const canActReturn = (m: MovimientoInventario) => canActOrigin(m) || canActDestino(m);

  // Actualizar automáticamente movimientos cada 15s mientras está abierto el panel
  useEffect(() => {
    if (!onRefreshMovimientos) return;
    const interval = setInterval(() => {
      onRefreshMovimientos();
    }, 15000);
    return () => clearInterval(interval);
  }, [onRefreshMovimientos]);

  // Prellenar modal cuando se solicita préstamo directo desde el POS
  useEffect(() => {
    if (!prefillRequest) return;
    setTipoMovimiento(prefillRequest.tipo || 'PRESTAMO');
    setSelectedProductoId(prefillRequest.productoId);
    setSedeOrigenId(prefillRequest.sedeOrigenId);
    setSedeDestinoId(prefillRequest.sedeDestinoId);
    setCantidad(prefillRequest.cantidad || 1);
    setMotivo(prefillRequest.motivo || 'Préstamo solicitado desde Punto de Venta (POS)');
    setSeriesSeleccionadas([]);
    setIsModalOpen(true);
    onClearPrefill?.();
  }, [prefillRequest]);

  // Obtener producto seleccionado
  const selectedProd = productos.find((p) => p.id === selectedProductoId);

  // Obtener stock del producto en la sede origen elegida
  const getBranchStock = (prod: Producto | undefined, branchId: number): number => {
    if (!prod) return 0;
    if (prod.stockPorSedeId && branchId in prod.stockPorSedeId) {
      return Number(prod.stockPorSedeId[branchId]) || 0;
    }
    const branchObj = sucursales.find((s) => s.id === branchId);
    const branchName = branchObj ? branchObj.nombre : '';
    const stockMap = prod.stockPorSede || {};
    return Number(stockMap[branchName] ?? 0);
  };

  const stockDisponibleEnOrigen = getBranchStock(selectedProd, sedeOrigenId);

  // Cargar series disponibles cuando cambia el producto o la sede de origen
  useEffect(() => {
    if (!isModalOpen || !selectedProd?.requiereSerie) {
      setSeriesDisponibles([]);
      setSeriesSeleccionadas([]);
      return;
    }

    let isMounted = true;
    setLoadingSeries(true);
    transferService
      .getSeriesDisponibles(selectedProductoId, sedeOrigenId)
      .then((res) => {
        if (!isMounted) return;
        setLoadingSeries(false);
        if (res.success && res.series) {
          setSeriesDisponibles(res.series);
          // Si la cantidad actual supera las series disponibles, ajustar
          if (seriesSeleccionadas.length > res.series.length) {
            setSeriesSeleccionadas(res.series.slice(0, 1).map((s) => s.numeroSerie));
          }
        } else {
          setSeriesDisponibles([]);
          setSeriesSeleccionadas([]);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingSeries(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isModalOpen, selectedProductoId, sedeOrigenId, selectedProd?.requiereSerie]);

  // Manejo de selección/deselección de serie
  const toggleSerieSelection = (sn: string) => {
    setSeriesSeleccionadas((prev) => {
      const exists = prev.includes(sn);
      let updated: string[];
      if (exists) {
        updated = prev.filter((s) => s !== sn);
      } else {
        updated = [...prev, sn];
      }
      setCantidad(Math.max(1, updated.length));
      return updated;
    });
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProd) {
      onShowToast('Seleccione un producto', 'Debe seleccionar un producto válido.', 'warning');
      return;
    }

    if (sedeOrigenId === sedeDestinoId) {
      onShowToast('Sedes inválidas', 'La sede de origen debe ser diferente a la sede de destino.', 'warning');
      return;
    }

    if (cantidad < 1) {
      onShowToast('Cantidad inválida', 'La cantidad debe ser mayor a 0.', 'warning');
      return;
    }

    if (cantidad > stockDisponibleEnOrigen) {
      onShowToast('Stock insuficiente', `La sede origen solo cuenta con ${stockDisponibleEnOrigen} unidad(es) de este producto.`, 'error');
      return;
    }

    if (selectedProd.requiereSerie && seriesSeleccionadas.length !== cantidad) {
      onShowToast('Series requeridas', `Debe seleccionar exactamente ${cantidad} número(s) de serie. (Seleccionadas: ${seriesSeleccionadas.length}).`, 'warning');
      return;
    }

    const payload = {
      tipo: tipoMovimiento,
      productoId: selectedProd.id,
      sedeOrigenId,
      sedeDestinoId,
      cantidad,
      series: selectedProd.requiereSerie ? seriesSeleccionadas : undefined,
      solicitadoPor: currentUserName,
      motivo: motivo.trim() || (tipoMovimiento === 'PRESTAMO' ? 'Préstamo operativo entre sedes' : 'Traslado de reposición de inventario'),
      observaciones: observaciones.trim() || undefined,
    };

    await onSaveMovimiento(payload);
    setIsModalOpen(false);
    // Resetear formulario
    setMotivo('');
    setObservaciones('');
    setSeriesSeleccionadas([]);
    setCantidad(1);
  };

  // Cambio de estado
  const handleCambiarEstado = async (movimientoId: number, nuevoEstado: EstadoMovimientoInventario) => {
    setActionInProgress(movimientoId);
    await onUpdateMovimiento(movimientoId, nuevoEstado);
    setActionInProgress(null);
  };

  // Filtrado de movimientos
  const filteredMovimientos = movimientos.filter((m) => {
    // Filtro por tab
    if (filterTab === 'PRESTAMO' && m.tipo !== 'PRESTAMO') return false;
    if (filterTab === 'TRASLADO' && m.tipo !== 'TRASLADO') return false;
    if (filterTab === 'PENDIENTES' && ['RECIBIDO', 'DEVUELTO', 'CANCELADO'].includes(m.estado)) return false;

    // Filtro por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchCod = m.codigo?.toLowerCase().includes(term);
      const matchProd = m.productoNombre?.toLowerCase().includes(term);
      const matchOrig = m.sedeOrigen?.toLowerCase().includes(term);
      const matchDest = m.sedeDestino?.toLowerCase().includes(term);
      const matchSol = m.solicitadoPor?.toLowerCase().includes(term);
      const matchSeries = m.series?.some((s) => s.toLowerCase().includes(term));
      return matchCod || matchProd || matchOrig || matchDest || matchSol || matchSeries;
    }

    return true;
  });

  // Métricas
  const totalPrestamosActivos = movimientos.filter((m) => m.tipo === 'PRESTAMO' && m.estado === 'RECIBIDO').length;
  const totalEnTransito = movimientos.filter((m) => m.estado === 'EN_TRANSITO').length;
  const totalDevueltos = movimientos.filter((m) => m.estado === 'DEVUELTO').length;
  const totalPendientesAprobacion = movimientos.filter((m) => m.estado === 'SOLICITADO').length;

  const pendingMyOriginActions = movimientos.filter(
    (m) => (m.estado === 'SOLICITADO' || m.estado === 'APROBADO') && canActOrigin(m)
  ).length;
  const pendingMyDestActions = movimientos.filter(
    (m) => m.estado === 'EN_TRANSITO' && canActDestino(m)
  ).length;
  const totalMyPendingActions = pendingMyOriginActions + pendingMyDestActions;

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8F9FF] p-6 md:p-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        {/* Cabecera Principal */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-[#00346F]">
                <ArrowRightLeft className="h-3 w-3" /> LOGÍSTICA MULTI-SEDE
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-[#0B1C30]">
              Movimientos y Préstamos entre Sedes
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Control integral de traslados definitivos y préstamos temporales de laptops y accesorios entre Chiclayo y Lambayeque.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onRefreshMovimientos && (
              <button
                type="button"
                onClick={() => {
                  setRefreshing(true);
                  onRefreshMovimientos();
                  setTimeout(() => setRefreshing(false), 600);
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition-all hover:bg-slate-50 active:scale-95"
                title="Actualizar solicitudes entre sedes"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-[#00346F]' : ''}`} />
                Actualizar
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (productos.length > 0 && !selectedProductoId) {
                  setSelectedProductoId(productos[0].id);
                }
                setIsModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00346F] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-900/10 transition-all hover:bg-[#002652] active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Nuevo Traslado o Préstamo
            </button>
          </div>
        </div>

        {/* Banner de Acciones Pendientes para la Sede del Usuario */}
        {totalMyPendingActions > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-xs text-amber-900 shadow-xs">
            <div className="flex items-start sm:items-center gap-2.5">
              <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="font-extrabold">
                  Tienes {totalMyPendingActions} movimiento(s) pendiente(s) de tu sede
                  {currentUserSucursalNombre ? ` (${currentUserSucursalNombre})` : ''}:
                </span>{' '}
                <span>
                  {pendingMyOriginActions > 0 &&
                    `${pendingMyOriginActions} por aprobar/despachar (en Acciones: Aprobar → Despachar). `}
                  {pendingMyDestActions > 0 &&
                    `${pendingMyDestActions} en camino para confirmar con "Recibir en Destino".`}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFilterTab('PENDIENTES')}
              className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-amber-700 transition-colors self-start sm:self-auto"
            >
              Ver Pendientes
            </button>
          </div>
        )}

        {/* Tarjetas de Métricas Operativas */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Préstamos Activos</span>
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                <RotateCcw className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-[#0B1C30]">{totalPrestamosActivos}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Equipos prestados entre sedes</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">En Tránsito</span>
              <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
                <Truck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-purple-700">{totalEnTransito}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">En viaje físico entre sucursales</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Por Aprobar</span>
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <Clock3 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-blue-700">{totalPendientesAprobacion}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Solicitudes iniciales abiertas</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Préstamos Devueltos</span>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-700">{totalDevueltos}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Retornados con éxito al origen</p>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs">
          {/* Pestañas de Vista */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilterTab('TODOS')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                filterTab === 'TODOS'
                  ? 'bg-[#00346F] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Todos ({movimientos.length})
            </button>
            <button
              onClick={() => setFilterTab('PRESTAMO')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                filterTab === 'PRESTAMO'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-purple-700 hover:bg-purple-50'
              }`}
            >
              🤝 Préstamos entre Sedes ({movimientos.filter((m) => m.tipo === 'PRESTAMO').length})
            </button>
            <button
              onClick={() => setFilterTab('TRASLADO')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                filterTab === 'TRASLADO'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-blue-700 hover:bg-blue-50'
              }`}
            >
              🚚 Traslados Definitivos ({movimientos.filter((m) => m.tipo === 'TRASLADO').length})
            </button>
            <button
              onClick={() => setFilterTab('PENDIENTES')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                filterTab === 'PENDIENTES'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              ⏳ En Proceso / Pendientes ({movimientos.filter((m) => !['RECIBIDO', 'DEVUELTO', 'CANCELADO'].includes(m.estado)).length})
            </button>
          </div>

          {/* Campo de Búsqueda */}
          <div className="relative min-w-[260px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por serie, producto o código..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs outline-none transition-all focus:border-[#00346F] focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Tabla Principal de Movimientos */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-5 py-3.5">Código & Tipo</th>
                  <th className="px-5 py-3.5">Producto & Series Físicas</th>
                  <th className="px-5 py-3.5">Ruta de Sedes</th>
                  <th className="px-5 py-3.5 text-center">Cant.</th>
                  <th className="px-5 py-3.5">Solicitado Por</th>
                  <th className="px-5 py-3.5">Estado</th>
                  <th className="px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMovimientos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="rounded-full bg-slate-100 p-3 text-slate-400">
                          <ArrowRightLeft className="h-6 w-6" />
                        </div>
                        <p className="mt-3 text-xs font-bold text-slate-700">No hay movimientos registrados</p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          {searchTerm ? 'No se encontraron resultados con ese criterio.' : 'Inicia un nuevo traslado o préstamo entre sedes con el botón superior.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMovimientos.map((m) => {
                    const statusCfg = STATUS_CONFIG[m.estado] || STATUS_CONFIG.SOLICITADO;
                    const StatusIcon = statusCfg.icon;
                    const esPrestamo = m.tipo === 'PRESTAMO';
                    const isProcessing = actionInProgress === m.id;

                    return (
                      <tr key={m.id} className="transition-colors hover:bg-slate-50/60">
                        {/* Código & Tipo */}
                        <td className="px-5 py-4 align-top">
                          <div className="font-mono text-[11px] font-bold text-slate-800">{m.codigo || `MOV-#${m.id}`}</div>
                          <div className="mt-1">
                            {esPrestamo ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800 border border-purple-200">
                                🤝 PRÉSTAMO
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-[#00346F] border border-blue-200">
                                🚚 TRASLADO
                              </span>
                            )}
                          </div>
                          {m.motivo && (
                            <p className="mt-1.5 text-[10px] text-slate-400 italic line-clamp-1" title={m.motivo}>
                              "{m.motivo}"
                            </p>
                          )}
                        </td>

                        {/* Producto & Series */}
                        <td className="px-5 py-4 align-top">
                          <div className="flex items-start gap-2">
                            <div className="rounded-lg bg-blue-50 p-1.5 text-[#00346F] shrink-0">
                              <Package className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{m.productoNombre}</div>
                              {m.productoCodigo && (
                                <div className="text-[10px] font-mono text-slate-400">{m.productoCodigo}</div>
                              )}

                              {/* Series involucradas */}
                              {m.series && m.series.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {m.series.map((sn, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-700 border border-slate-200"
                                    >
                                      <Laptop className="h-2.5 w-2.5 text-slate-400" />
                                      {sn}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Ruta de Sedes */}
                        <td className="px-5 py-4 align-top">
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="font-semibold text-slate-700">{m.sedeOrigen}</span>
                            <ArrowRightLeft className="h-3 w-3 text-blue-500 shrink-0" />
                            <span className="font-semibold text-[#00346F]">{m.sedeDestino}</span>
                          </div>
                        </td>

                        {/* Cantidad */}
                        <td className="px-5 py-4 text-center align-top font-bold text-slate-800">
                          <span className="inline-block rounded-md bg-slate-100 px-2.5 py-1 text-xs">
                            {m.cantidad}
                          </span>
                        </td>

                        {/* Solicitado Por & Fecha */}
                        <td className="px-5 py-4 align-top text-slate-600">
                          <div className="font-medium text-slate-800">{m.solicitadoPor}</div>
                          <div className="text-[10px] text-slate-400">{m.fecha || 'Hoy'}</div>
                          {m.recibidoPor && (
                            <div className="mt-1 text-[10px] text-emerald-600 font-medium">
                              Recibió: {m.recibidoPor}
                            </div>
                          )}
                        </td>

                        {/* Estado */}
                        <td className="px-5 py-4 align-top">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusCfg.bg} ${statusCfg.text}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusCfg.label}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="px-5 py-4 text-right align-top">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Estado SOLICITADO -> Aprobar / Rechazar (Sede Origen / Almacén / Admin) */}
                            {m.estado === 'SOLICITADO' && canActOrigin(m) && (
                              <>
                                <button
                                  type="button"
                                  disabled={isProcessing}
                                  onClick={() => handleCambiarEstado(m.id, 'APROBADO')}
                                  className="rounded-lg bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-blue-700 transition-colors"
                                >
                                  Aprobar
                                </button>
                                <button
                                  type="button"
                                  disabled={isProcessing}
                                  onClick={() => handleCambiarEstado(m.id, 'CANCELADO')}
                                  className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-50"
                                >
                                  Rechazar
                                </button>
                              </>
                            )}
                            {m.estado === 'SOLICITADO' && !canActOrigin(m) && (
                              <span className="text-[10px] font-medium text-amber-600">
                                Esperando aprobación de {m.sedeOrigen}
                              </span>
                            )}

                            {/* Estado APROBADO -> Despachar (Sede Origen / Almacén / Admin) */}
                            {m.estado === 'APROBADO' && canActOrigin(m) && (
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleCambiarEstado(m.id, 'EN_TRANSITO')}
                                className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-purple-700 transition-colors"
                              >
                                <Truck className="h-3 w-3" /> Despachar
                              </button>
                            )}
                            {m.estado === 'APROBADO' && !canActOrigin(m) && (
                              <span className="text-[10px] font-medium text-blue-600">
                                Listo para despacho en {m.sedeOrigen}
                              </span>
                            )}

                            {/* Estado EN_TRANSITO -> Confirmar Recepción (Sede Destino / Almacén / Admin) */}
                            {m.estado === 'EN_TRANSITO' && canActDestino(m) && (
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleCambiarEstado(m.id, 'RECIBIDO')}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs"
                              >
                                <Check className="h-3 w-3" /> Recibir en Destino
                              </button>
                            )}
                            {m.estado === 'EN_TRANSITO' && !canActDestino(m) && (
                              <span className="text-[10px] font-medium text-purple-600">
                                En tránsito hacia {m.sedeDestino}
                              </span>
                            )}

                            {/* Estado RECIBIDO y es PRESTAMO -> Devolver Préstamo a Origen */}
                            {m.estado === 'RECIBIDO' && esPrestamo && canActReturn(m) && (
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleCambiarEstado(m.id, 'DEVUELTO')}
                                className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-teal-700 transition-colors shadow-xs"
                                title="Devolver este equipo prestado a la sede de origen"
                              >
                                <RotateCcw className="h-3 w-3" /> Devolver Préstamo
                              </button>
                            )}

                            {m.estado === 'RECIBIDO' && !esPrestamo && (
                              <span className="text-[10px] font-medium text-emerald-600">Completado</span>
                            )}

                            {m.estado === 'DEVUELTO' && (
                              <span className="text-[10px] font-medium text-teal-600">Devolución cerrada</span>
                            )}

                            {m.estado === 'CANCELADO' && (
                              <span className="text-[10px] font-medium text-rose-500">Cancelado</span>
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

      {/* ──────────────── MODAL CREAR TRASLADO O PRÉSTAMO ──────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Header del Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-[#00346F] p-2 text-white">
                  <ArrowRightLeft className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-[#0B1C30]">
                    Nuevo Movimiento de Inventario
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Transfiere o presta productos y laptops entre sucursales autorizadas
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4 p-6 text-xs max-h-[80vh] overflow-y-auto">
              {/* Selector de Modalidad: TRASLADO vs PRÉSTAMO */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Modalidad de Movimiento
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTipoMovimiento('PRESTAMO')}
                    className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${
                      tipoMovimiento === 'PRESTAMO'
                        ? 'border-purple-600 bg-purple-50/60 ring-2 ring-purple-100'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-bold text-purple-900 flex items-center gap-1.5">
                      🤝 Préstamo Temporal
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Sede solicita un producto prestado con posibilidad de devolución posterior a su origen.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoMovimiento('TRASLADO')}
                    className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${
                      tipoMovimiento === 'TRASLADO'
                        ? 'border-[#00346F] bg-blue-50/60 ring-2 ring-blue-100'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-bold text-[#00346F] flex items-center gap-1.5">
                      🚚 Traslado Definitivo
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Reabastecimiento permanente de stock que se transfiere sin retorno previsto.
                    </span>
                  </button>
                </div>
              </div>

              {/* Sedes Origen y Destino */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Sede Origen (De donde sale)
                  </label>
                  <select
                    value={sedeOrigenId}
                    onChange={(e) => {
                      const newId = Number(e.target.value);
                      setSedeOrigenId(newId);
                      // Si la sede destino es igual a la nueva sede origen, cambiar destino
                      if (newId === sedeDestinoId) {
                        const other = activeBranches.find((b) => b.id !== newId);
                        if (other) setSedeDestinoId(other.id);
                      }
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#00346F] focus:ring-1 focus:ring-blue-100"
                  >
                    {activeBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Sede Destino (A donde va)
                  </label>
                  <select
                    value={sedeDestinoId}
                    onChange={(e) => setSedeDestinoId(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#00346F] focus:ring-1 focus:ring-blue-100"
                  >
                    {activeBranches
                      .filter((b) => b.id !== sedeOrigenId)
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.nombre}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Selector de Producto */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Producto a Mover</label>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Stock en Sede Origen:{' '}
                    <strong className={stockDisponibleEnOrigen > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                      {stockDisponibleEnOrigen} und.
                    </strong>
                  </span>
                </div>
                <select
                  value={selectedProductoId}
                  onChange={(e) => {
                    const newId = Number(e.target.value);
                    setSelectedProductoId(newId);
                    setSeriesSeleccionadas([]);
                    setCantidad(1);
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#00346F] focus:ring-1 focus:ring-blue-100"
                >
                  {productos
                    .filter((p) => p.estado === 'ACTIVO')
                    .map((p) => {
                      const st = getBranchStock(p, sedeOrigenId);
                      return (
                        <option key={p.id} value={p.id}>
                          {p.codigo} - {p.nombre} (Disp: {st})
                        </option>
                      );
                    })}
                </select>
              </div>

              {/* Si el producto requiere Serie Física (Laptops, componentes) */}
              {selectedProd?.requiereSerie && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 flex items-center gap-1.5">
                      <Laptop className="h-4 w-4 text-blue-700" />
                      Selección de Números de Serie Físicos
                    </span>
                    <span className="text-[10px] font-medium text-blue-700">
                      {seriesSeleccionadas.length} seleccionada(s)
                    </span>
                  </div>

                  {loadingSeries ? (
                    <div className="py-3 text-center text-slate-400">Cargando números de serie disponibles...</div>
                  ) : seriesDisponibles.length === 0 ? (
                    <div className="rounded-lg bg-amber-50 p-2.5 text-[11px] text-amber-700 border border-amber-200">
                      No hay números de serie disponibles en esta sede de origen.
                    </div>
                  ) : (
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                      {seriesDisponibles.map((serie) => {
                        const isSelected = seriesSeleccionadas.includes(serie.numeroSerie);
                        return (
                          <div
                            key={serie.id}
                            onClick={() => toggleSerieSelection(serie.numeroSerie)}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer border transition-all ${
                              isSelected
                                ? 'bg-white border-[#00346F] text-[#00346F] font-bold shadow-xs'
                                : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="rounded text-[#00346F] focus:ring-0"
                              />
                              <span className="font-mono text-xs">{serie.numeroSerie}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">{serie.condicion || 'DISPONIBLE'}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Cantidad si NO requiere serie */}
              {!selectedProd?.requiereSerie && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cantidad de Unidades</label>
                  <input
                    type="number"
                    min="1"
                    max={stockDisponibleEnOrigen || 1}
                    value={cantidad}
                    onChange={(e) => setCantidad(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold outline-none focus:border-[#00346F]"
                  />
                </div>
              )}

              {/* Motivo del Préstamo o Traslado */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Motivo o Justificación <span className="font-normal text-slate-400">(Opcional)</span>
                </label>
                <input
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder={
                    tipoMovimiento === 'PRESTAMO'
                      ? 'Ej: Préstamo urgente para demostración a cliente en Lambayeque'
                      : 'Ej: Reposición semanal de inventario'
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-[#00346F]"
                />
              </div>

              {/* Observaciones */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Observaciones adicionales
                </label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Detalles sobre el envío, responsable de transporte, estado del paquete, etc."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-[#00346F]"
                />
              </div>

              {/* Footer con Botones */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={stockDisponibleEnOrigen < 1}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#00346F] px-5 py-2 text-xs font-bold text-white hover:bg-[#002652] transition-colors shadow-sm disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  Registrar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};