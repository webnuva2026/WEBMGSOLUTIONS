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

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-2.5 px-6 md:px-10 lg:px-14 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
        <span className="font-medium">© 2026 MG SOLUTIONS GROUP S.A.C. • Todos los derechos reservados.</span>
        <span>Chiclayo, Perú • Atención Lun - Sáb</span>
      </footer>
    </main>
  );
};
