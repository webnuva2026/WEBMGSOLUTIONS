import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Laptop,
  Monitor,
  Package,
  Phone,
  Plus,
  Printer as PrinterIcon,
  Truck,
  UserPlus,
  Users,
  Wrench,
} from 'lucide-react';
import { Cliente, Equipo, OrdenServicio, Usuario } from '../types';

interface ReceptionDashboardViewProps {
  currentUser: Usuario;
  ordenes: OrdenServicio[];
  equipos: Equipo[];
  clientes: Cliente[];
  setActiveView: (view: string) => void;
  onOpenServices: (clientId?: number) => void;
  readOnly?: boolean;
}

const ESTADO_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  RECEPCIONADO: { label: 'Recepcionado', bg: 'bg-blue-50', text: 'text-blue-700' },
  EN_DIAGNOSTICO: { label: 'Diagnóstico', bg: 'bg-purple-50', text: 'text-purple-700' },
  PRESUPUESTADO: { label: 'Presupuestado', bg: 'bg-amber-50', text: 'text-amber-800' },
  APROBADO_EN_REPARACION: { label: 'En reparación', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  ESPERA_REPUESTOS: { label: 'Espera repuestos', bg: 'bg-orange-50', text: 'text-orange-700' },
  REPARADO_PROBADO: { label: 'Reparado', bg: 'bg-teal-50', text: 'text-teal-700' },
  LISTO_ENTREGA: { label: 'Listo para entrega', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  ENTREGADO_COBRADO: { label: 'Entregado', bg: 'bg-slate-100', text: 'text-slate-700' },
  RECHAZADO_DEVUELTO: { label: 'Rechazado', bg: 'bg-red-50', text: 'text-red-700' },
};

const EQUIPO_ICONS: Record<string, React.ElementType> = {
  LAPTOP: Laptop,
  PC_ESCRITORIO: Monitor,
  IMPRESORA: PrinterIcon,
  MONITOR: Monitor,
};

export const ReceptionDashboardView: React.FC<ReceptionDashboardViewProps> = ({
  currentUser,
  ordenes,
  equipos,
  clientes,
  setActiveView,
  onOpenServices,
  readOnly = false,
}) => {
  // --- Computed data ---
  const ticketsPendientes = ordenes.filter(
    (o) => o.estado === 'RECEPCIONADO' || o.estado === 'PRESUPUESTADO'
  );
  const serviciosListos = ordenes.filter(
    (o) => o.estado === 'LISTO_ENTREGA' || o.estado === 'REPARADO_PROBADO'
  );
  const equiposRecientes = [...equipos]
    .filter((e) => e.estado === 'EN_SERVICIO' || e.estado === 'REGISTRADO')
    .slice(0, 6);
  const clientesActivos = clientes.filter((c) => c.estado === 'ACTIVO').length;
  const enTaller = ordenes.filter((o) =>
    ['RECEPCIONADO', 'EN_DIAGNOSTICO', 'PRESUPUESTADO', 'APROBADO_EN_REPARACION', 'ESPERA_REPUESTOS'].includes(o.estado)
  ).length;

  const getClientName = (clienteId: number) =>
    clientes.find((c) => c.id === clienteId)?.razonSocial || 'Cliente no encontrado';

  const getEquipoIcon = (tipo: string) => EQUIPO_ICONS[tipo] || Package;

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8F9FF] p-6 md:p-8">
      <div className="mx-auto w-full max-w-7xl">
        {/* Header */}
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#00346F]">
              Panel de recepción
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-[#0B1C30] md:text-3xl">
              Hola, {currentUser.nombreCompleto.split(' ')[0]}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Gestiona los ingresos de equipos, tickets y entregas pendientes desde aquí.
            </p>
          </div>
          <div className="flex gap-2">
            {!readOnly && (
              <button
                type="button"
                onClick={() => setActiveView('clientes')}
                className="flex items-center justify-center gap-2 rounded-lg border border-[#00346F] bg-white px-4 py-2.5 text-xs font-bold text-[#00346F] shadow-sm transition-colors hover:bg-[#EFF4FF]"
              >
                <UserPlus className="h-4 w-4" />
                Nuevo cliente
              </button>
            )}
            {!readOnly && (
              <button
                type="button"
                onClick={() => onOpenServices()}
                className="flex items-center justify-center gap-2 rounded-lg bg-[#00346F] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#004A99]"
              >
                <Plus className="h-4 w-4" />
                Nuevo ticket / ingreso
              </button>
            )}
          </div>
        </div>

        {/* Metric Cards */}
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<ClipboardList className="h-5 w-5" />}
            label="Tickets pendientes"
            value={ticketsPendientes.length}
            tone="amber"
            subtitle="Requieren acción de recepción"
          />
          <MetricCard
            icon={<Wrench className="h-5 w-5" />}
            label="En taller"
            value={enTaller}
            tone="blue"
            subtitle="Servicios activos en reparación"
          />
          <MetricCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label="Listos para entrega"
            value={serviciosListos.length}
            tone="emerald"
            subtitle="Coordinar retiro con cliente"
          />
          <MetricCard
            icon={<Users className="h-5 w-5" />}
            label="Clientes activos"
            value={clientesActivos}
            tone="blue"
            subtitle="En el directorio"
          />
        </div>

        {/* Main Content Grid */}
        <div className="mb-7 grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Tickets pendientes de atención */}
          <section className="lg:col-span-7 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 bg-[#EFF4FF] px-5 py-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-[#00346F]" />
                <div>
                  <h2 className="text-sm font-bold text-[#00346F]">
                    Tickets pendientes de atención
                  </h2>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Órdenes que requieren seguimiento de recepción
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveView('taller')}
                className="flex items-center gap-1 text-[11px] font-bold text-[#00346F] hover:text-[#004A99]"
              >
                Ver todos <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {ticketsPendientes.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
                  <div className="mb-3 rounded-full bg-emerald-50 p-3">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">¡Todo al día!</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    No hay tickets pendientes de atención en este momento.
                  </p>
                </div>
              ) : (
                ticketsPendientes.map((order) => {
                  const estadoStyle = ESTADO_LABELS[order.estado] || ESTADO_LABELS.RECEPCIONADO;
                  return (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => setActiveView('taller')}
                      className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left transition-colors hover:bg-blue-50/50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="rounded-lg bg-blue-50 p-2 text-[#00346F]">
                          {React.createElement(getEquipoIcon(order.tipoEquipo), {
                            className: 'h-4 w-4',
                          })}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#00346F]">
                              {order.codigo}
                            </span>
                            {order.prioridad !== 'NORMAL' && (
                              <span
                                className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                                  order.prioridad === 'URGENTE'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {order.prioridad}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-xs font-semibold text-slate-800">
                            {order.marca} {order.modelo}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="truncate">{order.clienteNombre}</span>
                            <span className="flex items-center gap-0.5">
                              <Phone className="h-3 w-3 text-slate-400" />
                              {order.clienteTelefono}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span
                          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold ${estadoStyle.bg} ${estadoStyle.text}`}
                        >
                          {estadoStyle.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {order.fechaIngreso}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* Right Column: Servicios listos + accesos rápidos */}
          <div className="lg:col-span-5 space-y-5">
            {/* Servicios listos para entrega */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-200 bg-emerald-50 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-emerald-700" />
                  <div>
                    <h2 className="text-sm font-bold text-emerald-800">
                      Listos para entrega
                    </h2>
                    <p className="mt-0.5 text-[11px] text-emerald-600">
                      Coordinar retiro con el cliente
                    </p>
                  </div>
                </div>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                  {serviciosListos.length}
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {serviciosListos.length === 0 ? (
                  <p className="px-5 py-6 text-center text-xs text-slate-400">
                    No hay servicios listos para entrega en este momento.
                  </p>
                ) : (
                  serviciosListos.map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => setActiveView('taller')}
                      className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition-colors hover:bg-emerald-50/50"
                    >
                      <div className="min-w-0">
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => setActiveView('movimientos')}
                            className="rounded-lg bg-[#EFF4FF] px-2.5 py-1.5 text-[10px] font-bold text-[#00346F] transition-colors hover:bg-blue-100"
                          >
                            Transferir
                          </button>
                        )}
                        <p className="font-mono text-xs font-bold text-[#00346F]">
                          {order.codigo}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-700">
                          {order.marca} {order.modelo}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] text-slate-500">
                          {order.clienteNombre} • {order.clienteTelefono}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {order.costoTotal > 0 && (
                          <span className="font-mono text-xs font-bold text-slate-800">
                            S/ {order.costoTotal.toFixed(2)}
                          </span>
                        )}
                        {order.saldoPendiente > 0 && (
                          <span className="text-[10px] font-semibold text-amber-700">
                            Saldo: S/ {order.saldoPendiente.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </section>

            {/* Accesos rápidos */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <h2 className="mb-3 text-sm font-bold text-slate-800">Accesos rápidos</h2>
              <div className="space-y-2">
                <QuickAction
                  icon={<Wrench className="h-4 w-4" />}
                  label="Gestionar servicios técnicos"
                  onClick={() => setActiveView('taller')}
                />
                <QuickAction
                  icon={<Users className="h-4 w-4" />}
                  label={`Directorio de clientes (${clientes.length})`}
                  onClick={() => setActiveView('clientes')}
                />
                <QuickAction
                  icon={<Package className="h-4 w-4" />}
                  label={`Equipos registrados (${equipos.length})`}
                  onClick={() => setActiveView('equipos')}
                />
              </div>
            </section>
          </div>
        </div>

        {/* Equipos recién ingresados */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 bg-[#EFF4FF] px-5 py-4">
            <div className="flex items-center gap-2">
              <Laptop className="h-4 w-4 text-[#00346F]" />
              <div>
                <h2 className="text-sm font-bold text-[#00346F]">
                  Equipos recién ingresados
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Últimos equipos registrados en el sistema
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveView('equipos')}
              className="flex items-center gap-1 text-[11px] font-bold text-[#00346F] hover:text-[#004A99]"
            >
              Ver todos <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {equiposRecientes.length === 0 ? (
            <p className="px-5 py-8 text-center text-xs text-slate-400">
              No hay equipos recién ingresados.
            </p>
          ) : (
            <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-3">
              {equiposRecientes.map((equipo) => {
                const Icon = getEquipoIcon(equipo.tipo);
                return (
                  <div
                    key={equipo.id}
                    className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 transition-colors hover:bg-blue-50/30 sm:border-r last:border-r-0"
                  >
                    <div className="rounded-lg bg-blue-50 p-2.5 text-[#00346F]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-800">
                        {equipo.marca} {equipo.modelo}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-slate-500">
                        {getClientName(equipo.clienteId)}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400">
                          {equipo.numeroSerie}
                        </span>
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                            equipo.estado === 'EN_SERVICIO'
                              ? 'bg-blue-50 text-[#00346F]'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {equipo.estado === 'EN_SERVICIO' ? 'En servicio' : 'Registrado'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

// --- Sub-components ---

function MetricCard({
  icon,
  label,
  value,
  tone,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: 'blue' | 'amber' | 'emerald' | 'rose';
  subtitle?: string;
}) {
  const toneClasses = {
    blue: 'bg-blue-50 text-[#00346F]',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
  }[tone];

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-transform hover:scale-[1.02]">
      <div className={`rounded-lg p-3 ${toneClasses}`}>{icon}</div>
      <div>
        <p className="text-[11px] font-semibold text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
        {subtitle && (
          <p className="mt-0.5 text-[10px] text-slate-400">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function QuickAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg border border-slate-200 px-3 py-3 text-left text-xs font-semibold text-slate-700 transition-colors hover:border-[#00346F] hover:bg-[#EFF4FF] hover:text-[#00346F]"
    >
      <span className="text-[#00346F]">{icon}</span>
      {label}
      <ArrowRight className="ml-auto h-3.5 w-3.5 text-slate-400" />
    </button>
  );
}
