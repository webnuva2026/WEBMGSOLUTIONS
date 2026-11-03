import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Layers,
  Package,
  Plus,
  Tag,
  Truck,
  Boxes,
  BarChart3,
} from 'lucide-react';
import { MovimientoInventario, Producto, Sucursal, Usuario } from '../types';
import { WarehouseInventoryView } from './WarehouseInventoryView';

interface WarehouseDashboardViewProps {
  currentUser: Usuario;
  productos: Producto[];
  movimientos: MovimientoInventario[];
  sucursales: Sucursal[];
  setActiveView: (view: string) => void;
  readOnly?: boolean;
  onShowToast?: (title: string, message?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  onProductCreated?: () => void;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  SOLICITADO: { bg: 'bg-amber-50', text: 'text-amber-700' },
  APROBADO: { bg: 'bg-blue-50', text: 'text-[#00346F]' },
  EN_TRANSITO: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
  RECIBIDO: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  CANCELADO: { bg: 'bg-red-50', text: 'text-red-700' },
};

const STATUS_LABELS: Record<string, string> = {
  SOLICITADO: 'Solicitado',
  APROBADO: 'Aprobado',
  EN_TRANSITO: 'En tránsito',
  RECIBIDO: 'Recibido',
  CANCELADO: 'Cancelado',
};

export const WarehouseDashboardView: React.FC<WarehouseDashboardViewProps> = ({
  currentUser,
  productos,
  movimientos,
  sucursales,
  setActiveView,
  readOnly = false,
  onShowToast,
  onProductCreated,
}) => {
  const [activeTab, setActiveTab] = useState<'inventario' | 'resumen'>('inventario');

  // --- Computed data ---
  const productosActivos = productos.filter((p) => p.estado === 'ACTIVO');
  const stockBajo = productosActivos.filter((p) => p.stock <= 10);
  const movimientosEnTransito = movimientos.filter(
    (m) => m.estado === 'EN_TRANSITO'
  ).length;
  const movimientosAbiertos = movimientos.filter(
    (m) => !['RECIBIDO', 'CANCELADO'].includes(m.estado)
  ).length;
  const sedesActivas = sucursales.filter((s) => s.estado === 'ACTIVO').length;
  const movimientosRecientes = [...movimientos].slice(0, 5);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F9FF]">
      {/* Barra de Pestañas Superiores */}
      <div className="border-b border-slate-200 bg-white px-6 pt-3">
        <div className="mx-auto flex max-w-7xl items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('inventario')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition ${
              activeTab === 'inventario'
                ? 'border-[#00346F] text-[#00346F] bg-slate-50/80 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Boxes className="h-4 w-4" />
            Control de Inventario & Números de Serie
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('resumen')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition ${
              activeTab === 'resumen'
                ? 'border-[#00346F] text-[#00346F] bg-slate-50/80 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Métricas & Transferencias de Almacén
          </button>
        </div>
      </div>

      {/* Contenido según pestaña */}
      {activeTab === 'inventario' ? (
        <WarehouseInventoryView
          sucursales={sucursales}
          onShowToast={onShowToast || (() => {})}
          readOnly={readOnly}
          onProductCreated={onProductCreated}
        />
      ) : (
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto w-full max-w-7xl">
            {/* Header */}
            <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#00346F]">
                  Panel de almacén
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-[#0B1C30] md:text-3xl">
                  Hola, {currentUser.nombreCompleto.split(' ')[0]}
                </h1>
                <p className="mt-1 text-xs text-slate-500">
                  Control de inventario, stock por sede y movimientos entre sucursales.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('inventario')}
                  className="flex items-center justify-center gap-2 rounded-lg border border-[#00346F] bg-white px-4 py-2.5 text-xs font-bold text-[#00346F] shadow-sm transition-colors hover:bg-[#EFF4FF]"
                >
                  <Package className="h-4 w-4" />
                  Ver inventario y series
                </button>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => setActiveView('movimientos')}
                    className="flex items-center justify-center gap-2 rounded-lg bg-[#00346F] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#004A99]"
                  >
                    <Plus className="h-4 w-4" />
                    Nuevo movimiento
                  </button>
                )}
              </div>
            </div>

        {/* Metric Cards */}
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<AlertTriangle className="h-5 w-5" />}
            label="Stock bajo (≤ 10)"
            value={stockBajo.length}
            tone="rose"
            subtitle="Productos que necesitan reposición"
          />
          <MetricCard
            icon={<Truck className="h-5 w-5" />}
            label="En tránsito"
            value={movimientosEnTransito}
            tone="amber"
            subtitle="Movimientos entre sedes"
          />
          <MetricCard
            icon={<Package className="h-5 w-5" />}
            label="Productos activos"
            value={productosActivos.length}
            tone="blue"
            subtitle="En el catálogo del sistema"
          />
          <MetricCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label="Sedes operativas"
            value={sedesActivas}
            tone="emerald"
            subtitle="Sucursales habilitadas"
          />
        </div>

        {/* Main content grid */}
        <div className="mb-7 grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Stock crítico */}
          <section className="lg:col-span-7 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 bg-rose-50 px-5 py-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <div>
                  <h2 className="text-sm font-bold text-rose-800">
                    Productos con stock crítico
                  </h2>
                  <p className="mt-0.5 text-[11px] text-rose-600">
                    Productos activos con ≤ 10 unidades en inventario
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveView('productos')}
                className="flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:text-rose-900"
              >
                Ver catálogo <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-600">
                  <tr>
                    <th className="px-5 py-3">Producto</th>
                    <th className="px-5 py-3">Categoría</th>
                    <th className="px-5 py-3 text-center">Stock</th>
                    <th className="px-5 py-3 text-right">P. Unitario</th>
                    <th className="px-5 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockBajo.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <div className="rounded-full bg-emerald-50 p-3">
                            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                          </div>
                          <p className="font-semibold text-slate-700">Inventario saludable</p>
                          <p className="text-[11px] text-slate-400">
                            Todos los productos tienen stock suficiente.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    stockBajo.map((producto, idx) => (
                      <tr
                        key={producto.id}
                        className={`transition-colors hover:bg-slate-50 ${
                          idx % 2 ? 'bg-[#F8FAFC]' : 'bg-white'
                        }`}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="rounded-lg bg-blue-50 p-2 text-[#00346F]">
                              <Package className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 truncate max-w-[200px]">
                                {producto.nombre}
                              </p>
                              <p className="mt-0.5 text-[10px] text-slate-400 font-mono">
                                {producto.codigo}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          {producto.categoriaNombre}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-bold ${
                              producto.stock === 0
                                ? 'bg-red-100 text-red-700'
                                : producto.stock <= 5
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {producto.stock}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-semibold text-slate-800">
                          S/ {producto.precioUnitario.toFixed(2)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => setActiveView('movimientos')}
                            className="rounded-lg bg-[#EFF4FF] px-2.5 py-1.5 text-[10px] font-bold text-[#00346F] transition-colors hover:bg-blue-100"
                          >
                            Transferir
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Right: Movimientos recientes + accesos rápidos */}
          <div className="lg:col-span-5 space-y-5">
            {/* Movimientos recientes */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-200 bg-[#EFF4FF] px-5 py-4">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4 text-[#00346F]" />
                  <div>
                    <h2 className="text-sm font-bold text-[#00346F]">
                      Movimientos recientes
                    </h2>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {movimientosAbiertos} solicitudes abiertas
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveView('movimientos')}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#00346F] hover:text-[#004A99]"
                >
                  Ver todos <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {movimientosRecientes.length === 0 ? (
                  <p className="px-5 py-6 text-center text-xs text-slate-400">
                    No hay movimientos registrados.
                  </p>
                ) : (
                  movimientosRecientes.map((mov) => {
                    const statusStyle = STATUS_COLORS[mov.estado] || STATUS_COLORS.SOLICITADO;
                    return (
                      <div
                        key={mov.id}
                        className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-slate-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-800">
                            {mov.productoNombre}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-500">
                            {mov.sedeOrigen}
                            <ArrowLeftRight className="h-2.5 w-2.5 text-slate-400" />
                            {mov.sedeDestino}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            {mov.cantidad} un. • {mov.fecha}
                          </p>
                        </div>
                        <span
                          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyle.bg} ${statusStyle.text}`}
                        >
                          {STATUS_LABELS[mov.estado] || mov.estado}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Accesos rápidos */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <h2 className="mb-3 text-sm font-bold text-slate-800">Accesos rápidos</h2>
              <div className="space-y-2">
                <QuickAction
                  icon={<Package className="h-4 w-4" />}
                  label={`Productos e inventario (${productosActivos.length})`}
                  onClick={() => setActiveView('productos')}
                />
                <QuickAction
                  icon={<Layers className="h-4 w-4" />}
                  label="Categorías"
                  onClick={() => setActiveView('categorias')}
                />
                <QuickAction
                  icon={<Tag className="h-4 w-4" />}
                  label="Marcas"
                  onClick={() => setActiveView('marcas')}
                />
                <QuickAction
                  icon={<ArrowLeftRight className="h-4 w-4" />}
                  label="Movimientos entre sedes"
                  onClick={() => setActiveView('movimientos')}
                />
              </div>
            </section>
          </div>
        </div>

        {/* Alert banner */}
        {stockBajo.length > 0 && (
          <section className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" />
            <div>
              <h2 className="text-xs font-bold">Alerta de reposición</h2>
              <p className="mt-1 text-xs leading-5 text-amber-800">
                {stockBajo.length} producto{stockBajo.length === 1 ? '' : 's'} tiene
                {stockBajo.length === 1 ? '' : 'n'} stock igual o menor a 10 unidades.
                Considera solicitar un movimiento desde otra sede o realizar un pedido a proveedor.
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
      )}
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
