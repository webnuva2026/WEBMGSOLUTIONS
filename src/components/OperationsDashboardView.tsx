import React from 'react';
import {
  ArrowRight,
  ClipboardList,
  Package,
  Users,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Boxes,
} from 'lucide-react';
import { Cliente, OrdenServicio, Producto, Usuario } from '../types';

interface OperationsDashboardViewProps {
  currentUser: Usuario;
  ordenes: OrdenServicio[];
  productos: Producto[];
  clientes: Cliente[];
  setActiveView: (view: string) => void;
}

const ACTIVE_STATES = ['RECEPCIONADO', 'EN_DIAGNOSTICO', 'PRESUPUESTADO', 'APROBADO_EN_REPARACION', 'ESPERA_REPUESTOS'];

export const OperationsDashboardView: React.FC<OperationsDashboardViewProps> = ({
  currentUser,
  ordenes,
  productos,
  clientes,
  setActiveView,
}) => {
  const visibleOrders = currentUser.rol === 'TECNICO'
    ? ordenes.filter((order) => order.tecnicoId === currentUser.id)
    : ordenes;
  const activeOrders = visibleOrders.filter((order) => ACTIVE_STATES.includes(order.estado));
  const readyOrders = visibleOrders.filter((order) => order.estado === 'LISTO_ENTREGA' || order.estado === 'REPARADO_PROBADO');
  const receivedOrders = visibleOrders.filter((order) => order.estado === 'RECEPCIONADO');
  const lowStockProducts = productos.filter((product) => product.estado === 'ACTIVO' && product.stock <= 10);
  const recentOrders = [...visibleOrders].slice(0, 5);

  const goTo = (view: string) => setActiveView(view);

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8F9FF] p-6 md:p-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#00346F]">Panel operativo</p>
            <h1 className="text-2xl font-bold tracking-tight text-[#0B1C30] md:text-3xl">
              Hola, {currentUser.nombreCompleto.split(' ')[0]}
            </h1>
            <p className="mt-1 text-xs text-slate-500">Resumen de servicios técnicos, clientes e inventario.</p>
          </div>
          <button
            type="button"
            onClick={() => goTo('taller')}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#00346F] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#004A99]"
          >
            <Wrench className="h-4 w-4" />
            Ver servicios técnicos
          </button>
        </div>

        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={<ClipboardList className="h-5 w-5" />} label="Servicios activos" value={activeOrders.length} tone="blue" />
          <MetricCard icon={<Clock3 className="h-5 w-5" />} label="En diagnóstico" value={visibleOrders.filter((order) => order.estado === 'EN_DIAGNOSTICO').length} tone="amber" />
          <MetricCard icon={<CheckCircle2 className="h-5 w-5" />} label="Listos para entrega" value={readyOrders.length} tone="emerald" />
          <MetricCard icon={<Package className="h-5 w-5" />} label="Productos con stock bajo" value={lowStockProducts.length} tone="rose" />
        </div>

        {(currentUser.rol === 'SECRETARIA' || currentUser.rol === 'ALMACEN') && (
          <section className="mb-7 rounded-xl border border-blue-200 bg-[#EFF4FF] p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#00346F]">{currentUser.rol === 'ALMACEN' ? 'Panel de almacén' : 'Panel de recepción'}</p>
                <h2 className="mt-1 text-base font-bold text-[#0B1C30]">{currentUser.rol === 'ALMACEN' ? 'Control de inventario y sedes' : 'Atención de equipos y tickets'}</h2>
                <p className="mt-1 text-xs text-slate-600">{currentUser.rol === 'ALMACEN' ? 'Revisa existencias, stock bajo y movimientos entre sedes.' : 'Registra el ingreso de equipos y revisa los servicios que requieren seguimiento.'}</p>
              </div>
              <button type="button" onClick={() => goTo(currentUser.rol === 'ALMACEN' ? 'movimientos' : 'taller')} className="flex items-center justify-center gap-2 rounded-lg bg-[#00346F] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#004A99]">
                {currentUser.rol === 'ALMACEN' ? <Package className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
                {currentUser.rol === 'ALMACEN' ? 'Ver movimientos' : 'Registrar nuevo ticket'}
              </button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <ReceptionMetric label={currentUser.rol === 'ALMACEN' ? 'Productos con stock bajo' : 'Recién ingresados'} value={currentUser.rol === 'ALMACEN' ? lowStockProducts.length : receivedOrders.length} />
              <ReceptionMetric label={currentUser.rol === 'ALMACEN' ? 'Productos registrados' : 'En seguimiento'} value={currentUser.rol === 'ALMACEN' ? productos.length : activeOrders.length} />
              <ReceptionMetric label={currentUser.rol === 'ALMACEN' ? 'Sedes operativas' : 'Listos para entregar'} value={currentUser.rol === 'ALMACEN' ? 2 : readyOrders.length} />
            </div>
          </section>
        )}

        <div className="mb-7 grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 bg-[#EFF4FF] px-5 py-4">
              <div>
                <h2 className="text-sm font-bold text-[#00346F]">Servicios recientes</h2>
                <p className="mt-0.5 text-[11px] text-slate-500">Últimos tickets registrados en el taller.</p>
              </div>
              <button type="button" onClick={() => goTo('taller')} className="flex items-center gap-1 text-[11px] font-bold text-[#00346F] hover:text-[#004A99]">
                Ver todos <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {recentOrders.length === 0 ? (
                <p className="px-5 py-8 text-center text-xs text-slate-400">No hay servicios registrados.</p>
              ) : recentOrders.map((order) => (
                <button key={order.id} type="button" onClick={() => goTo('taller')} className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left transition-colors hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs font-bold text-[#00346F]">{order.codigo}</p>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-800">{order.marca} {order.modelo}</p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">{order.clienteNombre}</p>
                  </div>
                  <StatusBadge state={order.estado} />
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="mb-4 flex items-center gap-2">
              <Boxes className="h-5 w-5 text-[#00346F]" />
              <div>
                <h2 className="text-sm font-bold text-slate-800">Accesos rápidos</h2>
                <p className="text-[11px] text-slate-500">Operaciones frecuentes.</p>
              </div>
            </div>
            <div className="space-y-2">
              <QuickAction icon={<Wrench className="h-4 w-4" />} label="Gestionar servicios" onClick={() => goTo('taller')} />
              <QuickAction icon={<Users className="h-4 w-4" />} label={`Clientes registrados (${clientes.length})`} onClick={() => goTo('clientes')} />
              <QuickAction icon={<Package className="h-4 w-4" />} label={`Consultar inventario (${productos.length})`} onClick={() => goTo('productos')} />
              {currentUser.rol === 'ADMIN' && (
                <QuickAction icon={<Users className="h-4 w-4" />} label="Administrar usuarios" onClick={() => goTo('usuarios')} />
              )}
            </div>
          </section>
        </div>

        <section className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" />
          <div>
            <h2 className="text-xs font-bold">Inventario por revisar</h2>
            <p className="mt-1 text-xs leading-5 text-amber-800">
              {lowStockProducts.length > 0
                ? `${lowStockProducts.length} producto${lowStockProducts.length === 1 ? '' : 's'} tiene${lowStockProducts.length === 1 ? '' : 'n'} stock igual o menor a 10 unidades.`
                : 'No hay productos con stock bajo en este momento.'}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

function MetricCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: 'blue' | 'amber' | 'emerald' | 'rose' }) {
  const toneClasses = {
    blue: 'bg-blue-50 text-[#00346F]',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
  }[tone];

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className={`rounded-lg p-3 ${toneClasses}`}>{icon}</div>
      <div>
        <p className="text-[11px] font-semibold text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-lg border border-slate-200 px-3 py-3 text-left text-xs font-semibold text-slate-700 transition-colors hover:border-[#00346F] hover:bg-[#EFF4FF] hover:text-[#00346F]">
      <span className="text-[#00346F]">{icon}</span>
      {label}
      <ArrowRight className="ml-auto h-3.5 w-3.5 text-slate-400" />
    </button>
  );
}

function StatusBadge({ state }: { state: string }) {
  const labels: Record<string, string> = {
    RECEPCIONADO: 'Recepcionado',
    EN_DIAGNOSTICO: 'Diagnóstico',
    PRESUPUESTADO: 'Presupuestado',
    APROBADO_EN_REPARACION: 'En reparación',
    ESPERA_REPUESTOS: 'Espera repuestos',
    REPARADO_PROBADO: 'Reparado',
    LISTO_ENTREGA: 'Listo',
    ENTREGADO_COBRADO: 'Entregado',
  };
  return <span className="whitespace-nowrap rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-[#00346F]">{labels[state] || state}</span>;
}

function ReceptionMetric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-blue-100 bg-white px-4 py-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-xl font-bold text-[#00346F]">{value}</p></div>;
}
