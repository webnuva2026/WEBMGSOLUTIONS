import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  Search,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { EstadoOrdenServicio, OrdenServicio } from '../types';

interface ServiceTrackingViewProps {
  ordenes: OrdenServicio[];
  onWorkerAccess: () => void;
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
}) => {
  const [ticket, setTicket] = useState('');
  const [searchedTicket, setSearchedTicket] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const order = useMemo(() => {
    const normalized = searchedTicket.trim().toLowerCase();
    if (!normalized) return null;
    return ordenes.find((item) => item.codigo.toLowerCase() === normalized) ?? null;
  }, [ordenes, searchedTicket]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setSearchedTicket(ticket);
    setHasSearched(true);
  };

  const currentStep = order ? WORKFLOW.indexOf(order.estado) : -1;
  const latestProgress = order
    ? order.bitacora.find((entry) => entry.estadoNuevo === order.estado) || order.bitacora[0]
    : null;

  return (
    <main className="min-h-screen bg-[#F8F9FF] text-[#0B1C30]">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 md:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00346F] text-white shadow-sm">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-wide text-[#00346F]">MG Solutions</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Servicio técnico</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onWorkerAccess}
          className="flex items-center gap-2 rounded-lg border border-[#00346F] px-3.5 py-2 text-xs font-bold text-[#00346F] transition-colors hover:bg-[#EFF4FF]"
        >
          <LockKeyhole className="h-4 w-4" />
          Soy trabajador
        </button>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-12 md:grid-cols-[1.05fr_0.95fr] md:items-center md:px-12 md:py-20">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#EFF4FF] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#00346F]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Seguimiento de servicio
          </div>
          <h1 className="max-w-xl text-4xl font-black leading-[1.08] tracking-tight text-[#0B1C30] md:text-6xl">
            Consulta tu servicio técnico en un solo lugar.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
            Ingresa el código de tu ticket para conocer el avance de la revisión, reparación y entrega de tu equipo.
          </p>

          <form onSubmit={handleSearch} className="mt-8 max-w-lg rounded-2xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-200/60">
            <label htmlFor="ticket" className="sr-only">Código de ticket</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex flex-1 items-center gap-2 rounded-xl bg-slate-50 px-3.5">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  id="ticket"
                  value={ticket}
                  onChange={(event) => setTicket(event.target.value)}
                  placeholder="Ej. OT-2024-0042"
                  className="w-full bg-transparent py-3 text-sm font-semibold uppercase text-slate-800 outline-none placeholder:normal-case placeholder:font-normal placeholder:text-slate-400"
                  required
                />
              </div>
              <button type="submit" className="flex items-center justify-center gap-2 rounded-xl bg-[#00346F] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#004A99]">
                Consultar
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
          <p className="mt-3 text-xs text-slate-500">El código aparece en la constancia que recibiste al dejar tu equipo.</p>
        </div>

        <div className="rounded-3xl bg-[#00346F] p-6 text-white shadow-xl shadow-[#00346F]/20 md:p-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">Estado del servicio</p>
              <h2 className="mt-2 text-2xl font-bold">{order ? STATUS_LABELS[order.estado] : 'Tu equipo, siempre informado'}</h2>
            </div>
            <Clock3 className="h-6 w-6 text-emerald-200" />
          </div>

          {order ? (
            <div className="mt-7">
              <div className="mb-5 rounded-xl bg-white/10 p-4">
                <p className="text-[11px] uppercase tracking-wider text-blue-100">{order.codigo}</p>
                <p className="mt-1 font-semibold">{order.tipoEquipo} {order.marca} {order.modelo}</p>
                <p className="mt-1 text-xs text-blue-100">Cliente: {order.clienteNombre}</p>
                <div className="mt-4 grid gap-3 border-t border-white/15 pt-3 text-xs text-blue-50">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-200">Problema reportado</span>
                    <span className="mt-1 block leading-5">{order.fallaReportada}</span>
                  </div>
                  {latestProgress && (
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-200">Último avance</span>
                      <span className="mt-1 block leading-5">{latestProgress.titulo}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                {WORKFLOW.map((step, index) => {
                  const isDone = index <= currentStep;
                  return (
                    <div key={step} className="flex items-center gap-3 text-sm">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full ${isDone ? 'bg-emerald-300 text-[#00346F]' : 'border border-white/25 text-white/45'}`}>
                        {isDone ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                      </span>
                      <span className={isDone ? 'font-semibold text-white' : 'text-white/45'}>{STATUS_LABELS[step]}</span>
                    </div>
                  );
                })}
              </div>
              {order.fechaEstimadaEntrega && (
                <p className="mt-6 border-t border-white/15 pt-4 text-xs text-blue-100">Entrega estimada: {order.fechaEstimadaEntrega}</p>
              )}
            </div>
          ) : (
            <div className="mt-12 space-y-5 text-sm text-blue-50">
              <p>Podrás revisar el estado de tu equipo sin crear una cuenta ni llamar al taller.</p>
              <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
                {['Recepción', 'Diagnóstico', 'Reparación y entrega'].map((label, index) => (
                  <div key={label} className="rounded-xl border border-white/15 bg-white/5 p-4">
                    <span className="text-xs font-bold text-blue-200">0{index + 1}</span>
                    <p className="mt-2 font-semibold">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {hasSearched && !order && (
        <div className="mx-auto max-w-6xl px-5 pb-12 md:px-12">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            No encontramos un servicio con el código <strong>{searchedTicket.toUpperCase()}</strong>. Verifica que esté escrito exactamente como aparece en tu ticket.
          </div>
        </div>
      )}
    </main>
  );
};
