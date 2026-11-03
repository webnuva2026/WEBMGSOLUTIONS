import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  Search,
  ShieldCheck,
  Wrench,
  FileText,
  Check,
  X,
  XCircle,
  Package,
  DollarSign,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { EstadoOrdenServicio, OrdenServicio, BitacoraAvance } from '../types';
import { workshopService } from '../services/workshop.service';

interface ServiceTrackingViewProps {
  ordenes: OrdenServicio[];
  onWorkerAccess: () => void;
  onSaveOrden?: (orden: OrdenServicio) => void;
  onShowToast?: (title: string, message?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

const STATUS_LABELS: Record<EstadoOrdenServicio, string> = {
  RECEPCIONADO: 'Recepcionado',
  EN_DIAGNOSTICO: 'En diagnóstico',
  PRESUPUESTADO: 'Presupuestado',
  APROBADO_EN_REPARACION: 'En reparación',
  ESPERA_REPUESTOS: 'Esperando repuestos',
  REPARADO_PROBADO: 'Reparado y probado',
  LISTO_ENTREGA: 'Listo para entrega',
  ENTREGADO_COBRADO: 'Entregado',
  RECHAZADO_DEVUELTO: 'Devuelto / sin reparación',
};

const WORKFLOW: EstadoOrdenServicio[] = [
  'RECEPCIONADO',
  'EN_DIAGNOSTICO',
  'PRESUPUESTADO',
  'APROBADO_EN_REPARACION',
  'ESPERA_REPUESTOS',
  'REPARADO_PROBADO',
  'LISTO_ENTREGA',
  'ENTREGADO_COBRADO',
];

export const ServiceTrackingView: React.FC<ServiceTrackingViewProps> = ({
  ordenes,
  onWorkerAccess,
  onSaveOrden,
  onShowToast,
}) => {
  const [ticket, setTicket] = useState('');
  const [searchedTicket, setSearchedTicket] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [remoteOrder, setRemoteOrder] = useState<OrdenServicio | null>(null);
  const [isSearchingApi, setIsSearchingApi] = useState(false);

  // Estados para presupuesto y toma de decisiones del cliente
  const [showPresupuestoModal, setShowPresupuestoModal] = useState(false);
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [decisionFeedback, setDecisionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [localOrderStatus, setLocalOrderStatus] = useState<Record<string, EstadoOrdenServicio>>({});

  const rawOrder = useMemo(() => {
    const normalized = searchedTicket.trim().toLowerCase();
    if (!normalized) return null;
    if (remoteOrder && remoteOrder.codigo.toLowerCase() === normalized) {
      return remoteOrder;
    }
    return ordenes.find((item) => item.codigo.toLowerCase() === normalized) ?? null;
  }, [ordenes, searchedTicket, remoteOrder]);

  const order = useMemo(() => {
    if (!rawOrder) return null;
    const overrideStatus = localOrderStatus[rawOrder.codigo];
    return overrideStatus ? { ...rawOrder, estado: overrideStatus } : rawOrder;
  }, [rawOrder, localOrderStatus]);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanTicket = ticket.trim();
    if (!cleanTicket) return;
    setSearchedTicket(cleanTicket);
    setHasSearched(true);
    setDecisionFeedback(null);

    // Intentar consultar en tiempo real a MySQL a través del endpoint público de tracking
    setIsSearchingApi(true);
    try {
      const res = await workshopService.getTrackingByCodigo(cleanTicket);
      if (res.success && res.orden) {
        setRemoteOrder(res.orden);
        if (onSaveOrden) {
          onSaveOrden(res.orden);
        }
      }
    } catch (e) {
      console.warn('Fallback a búsqueda local:', e);
    } finally {
      setIsSearchingApi(false);
    }
  };

  const handleClientDecision = async (accion: 'APROBAR' | 'RECHAZAR') => {
    if (!order) return;
    setIsSubmittingDecision(true);
    setDecisionFeedback(null);

    try {
      const res = await workshopService.responderPresupuesto({
        codigo: order.codigo,
        accion,
      });

      if (res.success) {
        const nuevoEstado: EstadoOrdenServicio =
          accion === 'APROBAR' ? 'APROBADO_EN_REPARACION' : 'RECHAZADO_DEVUELTO';
        setLocalOrderStatus((prev) => ({ ...prev, [order.codigo]: nuevoEstado }));

        const newBitacoraItem: BitacoraAvance = {
          id: `b-client-${Date.now()}`,
          fecha: new Date().toLocaleString('es-PE'),
          autorNombre: order.clienteNombre,
          autorRol: 'CLIENTE' as any,
          titulo:
            accion === 'APROBAR'
              ? '✅ Presupuesto Autorizado por el Cliente'
              : '❌ Presupuesto Declinado por el Cliente',
          descripcion:
            accion === 'APROBAR'
              ? `El cliente aceptó y autorizó el presupuesto de S/ ${order.costoTotal.toFixed(2)} desde la web de seguimiento.`
              : `El cliente rechazó el presupuesto de S/ ${order.costoTotal.toFixed(2)} desde la web de seguimiento.`,
          estadoNuevo: nuevoEstado,
        };

        const updatedOrder: OrdenServicio = {
          ...order,
          estado: nuevoEstado,
          bitacora: [newBitacoraItem, ...order.bitacora],
        };

        if (onSaveOrden) {
          onSaveOrden(updatedOrder);
        }

        setDecisionFeedback({
          type: 'success',
          message:
            res.message ||
            (accion === 'APROBAR'
              ? '¡Excelente! Has autorizado la reparación de tu equipo. El equipo técnico ha sido notificado para comenzar los trabajos inmediatamente.'
              : 'Has declinado el presupuesto. Tu equipo quedará preparado en mostrador para su devolución.'),
        });

        if (onShowToast) {
          onShowToast(
            accion === 'APROBAR' ? 'Presupuesto Aprobado' : 'Presupuesto Declinado',
            res.message,
            accion === 'APROBAR' ? 'success' : 'info'
          );
        }
      } else {
        setDecisionFeedback({
          type: 'error',
          message: res.message || 'No se pudo procesar tu respuesta. Por favor intenta nuevamente.',
        });
      }
    } catch (err: any) {
      setDecisionFeedback({
        type: 'error',
        message: err.message || 'Error de conexión con el servidor.',
      });
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const currentStep = order ? WORKFLOW.indexOf(order.estado) : -1;
  const latestProgress = order
    ? order.bitacora.find((entry) => entry.estadoNuevo === order.estado) || order.bitacora[0]
    : null;


  return (
    <main className="min-h-screen bg-[#F8F9FF] text-[#0B1C30] flex flex-col justify-between">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200/90 bg-white px-6 py-2.5 md:px-10 lg:px-14 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00346F] text-white shadow-sm">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-extrabold tracking-tight text-[#00346F]">MG Solutions</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Servicio técnico • Chiclayo</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onWorkerAccess}
          className="flex items-center gap-2 rounded-xl border-2 border-[#00346F] px-3.5 py-1.5 text-xs sm:text-sm font-bold text-[#00346F] transition-all hover:bg-[#00346F] hover:text-white cursor-pointer shadow-xs hover:shadow-md"
        >
          <LockKeyhole className="h-3.5 w-3.5" />
          Soy trabajador
        </button>
      </header>

      {/* Main Section */}
      <section className="flex-1 w-full max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-14 py-4 sm:py-6 lg:py-8 grid lg:grid-cols-12 gap-6 lg:gap-10 items-center">
        {/* Left Column: Hero info & ticket search */}
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#EFF4FF] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[#00346F] border border-blue-100">
            <ShieldCheck className="h-3.5 w-3.5" />
            Seguimiento de servicio
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-[1.15] tracking-tight text-[#0B1C30]">
            Consulta tu servicio técnico en un solo lugar.
          </h1>

          <p className="text-sm sm:text-base leading-relaxed text-slate-600 max-w-lg">
            Ingresa el código de tu ticket para conocer el avance de la revisión, reparación y entrega de tu equipo.
          </p>

          <form onSubmit={handleSearch} className="max-w-xl rounded-2xl border-2 border-slate-200/90 bg-white p-2 shadow-xl shadow-slate-200/60">
            <label htmlFor="ticket" className="sr-only">Código de ticket</label>
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <div className="flex flex-1 items-center gap-2.5 rounded-xl bg-slate-50 px-3.5">
                <Search className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  id="ticket"
                  value={ticket}
                  onChange={(event) => setTicket(event.target.value)}
                  placeholder="Ej. OT-2024-0042"
                  className="w-full bg-transparent py-2.5 text-sm sm:text-base font-bold uppercase text-slate-800 outline-none placeholder:normal-case placeholder:font-normal placeholder:text-slate-400"
                  required
                />
              </div>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#00346F] px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#004A99] hover:shadow-lg cursor-pointer shrink-0"
              >
                Consultar
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          <p className="text-xs text-slate-500 font-medium">
            El código aparece en la constancia que recibiste al <span className="underline decoration-dotted">dejar</span> tu equipo.
          </p>
        </div>

        {/* Right Column: Service Status Card */}
        <div className="lg:col-span-5 rounded-2xl bg-[#00346F] p-6 sm:p-7 text-white shadow-xl shadow-[#00346F]/25 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-200">Estado del servicio</p>
              <h2 className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight">
                {order ? STATUS_LABELS[order.estado] : 'Tu equipo, siempre informado'}
              </h2>
            </div>
            <Clock3 className="h-6 w-6 text-emerald-300 shrink-0" />
          </div>

          {order ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-xl bg-white/10 p-4 border border-white/10">
                <p className="text-xs uppercase tracking-wider text-blue-200 font-bold">{order.codigo}</p>
                <p className="mt-1 text-base sm:text-lg font-bold">{order.tipoEquipo} {order.marca} {order.modelo}</p>
                <p className="mt-0.5 text-xs text-blue-100">Cliente: {order.clienteNombre}</p>
                <div className="mt-3 grid gap-2 border-t border-white/15 pt-2.5 text-xs text-blue-50">
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-blue-200">Problema reportado</span>
                    <span className="mt-0.5 block leading-relaxed text-xs">{order.fallaReportada}</span>
                  </div>
                  {latestProgress && (
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-blue-200">Último avance</span>
                      <span className="mt-0.5 block leading-relaxed text-xs">{latestProgress.titulo}</span>
                    </div>
                  )}
                </div>

                {/* BLOQUE DE PRESUPUESTO & ACCIONES DIRECTAS DEL CLIENTE */}
                {String(order.estado).toUpperCase() === 'PRESUPUESTADO' && (
                  <div className="mt-3.5 p-3.5 bg-gradient-to-r from-amber-500/25 via-amber-600/15 to-amber-700/10 border-2 border-amber-300/50 rounded-xl space-y-3 animate-in fade-in shadow-inner">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-amber-300 font-extrabold text-xs uppercase tracking-wider">
                        <DollarSign className="w-4 h-4 text-amber-300" />
                        Presupuesto Listo
                      </div>
                      <span className="font-mono font-black text-amber-200 text-sm sm:text-base">
                        S/ {(Number(order.costoTotal) || 0).toFixed(2)}
                      </span>
                    </div>

                    <p className="text-[11px] text-blue-100 leading-tight">
                      Tu equipo ya fue diagnosticado. Revisa la proforma o responde directamente:
                    </p>

                    {/* Botón Ver Presupuesto */}
                    <button
                      type="button"
                      onClick={() => setShowPresupuestoModal(true)}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 active:scale-[0.99] text-slate-950 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-slate-950" />
                      Ver Presupuesto
                    </button>

                    {/* Botones Directos de Aceptar o Rechazar desde aquí */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => handleClientDecision('APROBAR')}
                        disabled={isSubmittingDecision}
                        className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {isSubmittingDecision ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        Aceptar
                      </button>

                      <button
                        type="button"
                        onClick={() => handleClientDecision('RECHAZAR')}
                        disabled={isSubmittingDecision}
                        className="py-2 px-3 bg-red-600/30 hover:bg-red-600/50 active:scale-[0.98] text-red-200 border border-red-400/40 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5 text-red-300" />
                        Rechazar
                      </button>
                    </div>
                  </div>
                )}

                {/* Si la orden ya fue aprobada y tiene costo */}
                {(order.estado === 'APROBADO_EN_REPARACION' ||
                  order.estado === 'ESPERA_REPUESTOS' ||
                  order.estado === 'REPARADO_PROBADO') && (
                  <div className="mt-3 p-2.5 bg-emerald-500/20 border border-emerald-400/30 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Presupuesto Aprobado</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPresupuestoModal(true)}
                      className="text-[11px] text-blue-200 hover:text-white underline font-semibold cursor-pointer"
                    >
                      Ver detalle (S/ {(Number(order.costoTotal) || 0).toFixed(2)})
                    </button>
                  </div>
                )}

                {/* Si fue rechazada */}
                {order.estado === 'RECHAZADO_DEVUELTO' && (
                  <div className="mt-3 p-2.5 bg-red-500/20 border border-red-400/30 rounded-xl flex items-center gap-2 text-xs text-red-200 font-semibold">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>Presupuesto declinado. Equipo listo para recojo en mostrador.</span>
                  </div>
                )}

                {/* Banner de Feedback si el cliente acaba de responder */}
                {decisionFeedback && (
                  <div
                    className={`mt-3 p-3 rounded-xl border text-xs font-semibold leading-relaxed flex items-start gap-2 animate-in fade-in ${
                      decisionFeedback.type === 'success'
                        ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                        : 'bg-red-500/20 border-red-400/40 text-red-200'
                    }`}
                  >
                    {decisionFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-300 shrink-0 mt-0.5" />
                    )}
                    <span>{decisionFeedback.message}</span>
                  </div>
                )}
              </div>


              <div className="space-y-2.5">
                {WORKFLOW.map((step, index) => {
                  const isDone = index <= currentStep;
                  return (
                    <div key={step} className="flex items-center gap-3 text-sm sm:text-base">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${isDone ? 'bg-emerald-300 text-[#00346F]' : 'border border-white/25 text-white/45'}`}>
                        {isDone ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                      </span>
                      <span className={isDone ? 'font-bold text-white' : 'text-white/45'}>{STATUS_LABELS[step]}</span>
                    </div>
                  );
                })}
              </div>

              {order.fechaEstimadaEntrega && (
                <p className="mt-4 border-t border-white/15 pt-3 text-xs text-blue-100">Entrega estimada: {order.fechaEstimadaEntrega}</p>
              )}
            </div>
          ) : (
            <div className="my-4 space-y-3 text-xs sm:text-sm text-blue-50">
              <p className="leading-relaxed">Podrás revisar el estado de tu equipo sin crear una cuenta ni llamar al taller.</p>
              <div className="space-y-2.5">
                {[
                  { num: '01', title: 'Recepción', desc: 'Registro y asignación de ticket único' },
                  { num: '02', title: 'Diagnóstico', desc: 'Evaluación técnica y presupuesto' },
                  { num: '03', title: 'Reparación y entrega', desc: 'Pruebas de calidad y listo para retirar' },
                ].map((item) => (
                  <div key={item.num} className="rounded-xl border border-white/15 bg-white/5 p-3 flex items-center gap-3 transition-all hover:bg-white/10">
                    <span className="text-sm font-black text-blue-300">{item.num}</span>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-white leading-snug">{item.title}</p>
                      <p className="text-[10px] text-blue-200 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-blue-200">
            <span>Soporte Técnico MG Solutions</span>
            <span>Chiclayo Centro</span>
          </div>
        </div>
      </section>

      {hasSearched && !order && (
        <div className="mx-auto max-w-[1360px] w-full px-6 sm:px-10 lg:px-14 pb-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs sm:text-sm text-amber-900 shadow-xs">
            No encontramos un servicio con el código <strong>{searchedTicket.toUpperCase()}</strong>. Verifica que esté escrito exactamente como aparece en tu ticket.
          </div>
        </div>
      )}

      {/* MODAL DE DETALLE DE PRESUPUESTO & AUTORIZACIÓN DEL CLIENTE */}
      {showPresupuestoModal && order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col my-auto max-h-[92vh]">
            {/* Header del Modal */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-[#002654] to-[#004A99] text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <FileText className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold flex items-center gap-2">
                    Presupuesto de Servicio Técnico
                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-mono font-bold">
                      {order.codigo}
                    </span>
                  </h3>
                  <p className="text-[10px] text-blue-200 uppercase tracking-wider">
                    MG Solutions Group S.A.C.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPresupuestoModal(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido del Presupuesto */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 bg-slate-50/50">
              {/* Equipo & Falla */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 shadow-xs">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Equipo Diagnosticado
                </div>
                <div className="text-sm font-extrabold text-slate-900">
                  {order.tipoEquipo} {order.marca} {order.modelo}
                </div>
                <div className="text-xs text-red-600 font-medium">
                  <strong>Falla / Diagnóstico:</strong> {order.fallaReportada}
                </div>
              </div>

              {/* Repuestos e Insumos */}
              <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-blue-600" />
                    Repuestos Requeridos
                  </span>
                  <span className="font-mono font-bold text-slate-700 text-xs">
                    S/ {(Number(order.costoTotalRepuestos) || 0).toFixed(2)}
                  </span>
                </div>
                {order.repuestos && order.repuestos.length > 0 ? (
                  <div className="divide-y divide-slate-100 text-xs">
                    {order.repuestos.map((r) => (
                      <div key={r.id} className="py-1.5 flex justify-between items-center">
                        <div>
                          <span className="font-semibold text-slate-800">{r.descripcion}</span>
                          <span className="text-[11px] text-slate-500 block">Cantidad: {r.cantidad} un. (P. Unit: S/ {(Number(r.precioUnitario) || 0).toFixed(2)})</span>
                        </div>
                        <span className="font-mono font-bold text-slate-800">S/ {(Number(r.total) || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 py-1">No se requieren repuestos de almacén.</p>
                )}
              </div>

              {/* Mano de Obra & Procedimientos */}
              <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-blue-600" />
                    Mano de Obra & Procedimientos
                  </span>
                  <span className="font-mono font-bold text-slate-700 text-xs">
                    S/ {(Number(order.costoTotalManoObra) || 0).toFixed(2)}
                  </span>
                </div>
                {order.serviciosManoObra && order.serviciosManoObra.length > 0 ? (
                  <div className="divide-y divide-slate-100 text-xs">
                    {order.serviciosManoObra.map((m) => (
                      <div key={m.id} className="py-1.5 flex justify-between items-center">
                        <span className="font-semibold text-slate-800">{m.descripcion}</span>
                        <span className="font-mono font-bold text-slate-800">S/ {(Number(m.precio) || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 py-1">Procedimientos técnicos de laboratorio.</p>
                )}
              </div>

              {/* Cuadro Total */}
              <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl space-y-1.5">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Presupuesto Total Estimado:</span>
                  <span className="font-bold font-mono text-slate-800">S/ {(Number(order.costoTotal) || 0).toFixed(2)}</span>
                </div>
                {Number(order.adelantoPagado) > 0 && (
                  <div className="flex justify-between text-xs text-emerald-700">
                    <span>Adelanto Pagado en Caja:</span>
                    <span className="font-bold font-mono">- S/ {(Number(order.adelantoPagado) || 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-[#00346F] border-t border-blue-200 pt-1.5">
                  <span>Saldo a Pagar al Retirar:</span>
                  <span className="font-mono">S/ {(Number(order.saldoPendiente) || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Cláusula de Garantía */}
              <div className="text-[10px] text-slate-500 text-center leading-relaxed">
                * Garantía técnica: {order.garantiaDias || 90} días calendario sobre la reparación realizada.
              </div>

              {/* Feedback si ya respondió */}
              {decisionFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs font-semibold leading-relaxed flex items-start gap-2 ${
                    decisionFeedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-red-50 border-red-300 text-red-900'
                  }`}
                >
                  {decisionFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <span>{decisionFeedback.message}</span>
                </div>
              )}
            </div>

            {/* Footer con Botones de Aceptación o Cierre */}
            <div className="p-4 bg-white border-t border-slate-200 space-y-2">
              {String(order.estado).toUpperCase() === 'PRESUPUESTADO' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleClientDecision('APROBAR')}
                    disabled={isSubmittingDecision}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingDecision ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Aceptar y Autorizar Reparación
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleClientDecision('RECHAZAR')}
                    disabled={isSubmittingDecision}
                    className="w-full py-2.5 bg-red-100 hover:bg-red-200 text-red-800 border border-red-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <X className="w-4 h-4 text-red-600" />
                    Rechazar Presupuesto
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-500">
                    Estado actual: <strong className="text-slate-800">{STATUS_LABELS[order.estado]}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPresupuestoModal(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    Cerrar Ventana
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-2.5 px-6 md:px-10 lg:px-14 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
        <span className="font-medium">© 2026 MG SOLUTIONS GROUP S.A.C. • Todos los derechos reservados.</span>
        <span>Chiclayo, Perú • Atención Lun - Sáb</span>
      </footer>
    </main>
  );
};

