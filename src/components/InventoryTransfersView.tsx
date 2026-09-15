import React, { useState } from 'react';
import { ArrowRightLeft, CheckCircle2, Clock3, Package, Plus, Truck, XCircle } from 'lucide-react';
import { MovimientoInventario, Producto, Sucursal, UserRole } from '../types';

interface InventoryTransfersViewProps {
  productos: Producto[];
  sucursales: Sucursal[];
  movimientos: MovimientoInventario[];
  onSaveMovimiento: (movimiento: MovimientoInventario) => void;
  onUpdateMovimiento: (movimiento: MovimientoInventario) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  currentUserName: string;
  currentUserRole: UserRole;
}

const STATUS_CONFIG = {
  SOLICITADO: { label: 'Solicitado', className: 'bg-amber-50 text-amber-700', icon: Clock3 },
  APROBADO: { label: 'Aprobado', className: 'bg-blue-50 text-[#00346F]', icon: CheckCircle2 },
  EN_TRANSITO: { label: 'En tránsito', className: 'bg-indigo-50 text-indigo-700', icon: Truck },
  RECIBIDO: { label: 'Recibido', className: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
  CANCELADO: { label: 'Cancelado', className: 'bg-red-50 text-red-700', icon: XCircle },
} as const;

export const InventoryTransfersView: React.FC<InventoryTransfersViewProps> = ({
  productos,
  sucursales,
  movimientos,
  onSaveMovimiento,
  onUpdateMovimiento,
  onShowToast,
  currentUserName,
  currentUserRole,
}) => {
  const activeBranches = sucursales.filter((branch) => branch.estado === 'ACTIVO');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productoId, setProductoId] = useState(productos[0]?.id || 0);
  const [sedeOrigen, setSedeOrigen] = useState(activeBranches[0]?.nombre || 'Principal');
  const [sedeDestino, setSedeDestino] = useState(activeBranches[1]?.nombre || 'Sucursal Lambayeque Norte');
  const [cantidad, setCantidad] = useState(1);
  const canManageStatus = currentUserRole === 'ADMIN' || currentUserRole === 'ALMACEN';

  const getBranchStock = (product: Producto, branch: string) => {
    const stockByBranch = product.stockPorSede || { [product.sucursal]: product.stock };
    return stockByBranch[branch] ?? (branch.startsWith('Principal') ? stockByBranch.Principal || 0 : 0);
  };

  const getNextStates = (state: MovimientoInventario['estado']) => {
    if (state === 'SOLICITADO') return ['SOLICITADO', 'APROBADO', 'CANCELADO'];
    if (state === 'APROBADO') return ['APROBADO', 'EN_TRANSITO', 'CANCELADO'];
    if (state === 'EN_TRANSITO') return ['EN_TRANSITO', 'RECIBIDO', 'CANCELADO'];
    return [state];
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const producto = productos.find((item) => item.id === productoId);
    if (!producto || sedeOrigen === sedeDestino || cantidad < 1) {
      onShowToast('Datos incompletos', 'Selecciona sedes diferentes y una cantidad válida.', 'warning');
      return;
    }
    if (cantidad > getBranchStock(producto, sedeOrigen)) {
      onShowToast('Stock insuficiente', `La sede origen solo tiene ${getBranchStock(producto, sedeOrigen)} unidades disponibles.`, 'warning');
      return;
    }

    onSaveMovimiento({
      id: Date.now(),
      productoId: producto.id,
      productoNombre: producto.nombre,
      cantidad,
      sedeOrigen,
      sedeDestino,
      solicitadoPor: currentUserName,
      fecha: new Date().toLocaleDateString('es-PE'),
      estado: 'SOLICITADO',
    });
    setIsModalOpen(false);
    onShowToast('Movimiento registrado', 'La solicitud quedó pendiente de aprobación.', 'success');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8F9FF] p-6 md:p-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#00346F]">Inventario entre sedes</p>
            <h1 className="text-2xl font-bold tracking-tight text-[#0B1C30]">Movimientos de inventario</h1>
            <p className="mt-1 text-xs text-slate-500">Solicita y controla el traslado de productos entre las sedes autorizadas.</p>
          </div>
          <button type="button" onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 rounded-lg bg-[#00346F] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#004A99]">
            <Plus className="h-4 w-4" />
            Nuevo movimiento
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard label="Solicitudes abiertas" value={movimientos.filter((item) => !['RECIBIDO', 'CANCELADO'].includes(item.estado)).length} />
          <SummaryCard label="En tránsito" value={movimientos.filter((item) => item.estado === 'EN_TRANSITO').length} />
          <SummaryCard label="Movimientos completados" value={movimientos.filter((item) => item.estado === 'RECIBIDO').length} />
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-200 bg-[#EFF4FF] px-5 py-4">
            <ArrowRightLeft className="h-4 w-4 text-[#00346F]" />
            <h2 className="text-sm font-bold text-[#00346F]">Historial de movimientos</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-600">
                <tr><th className="px-5 py-3">Producto</th><th className="px-5 py-3">Ruta</th><th className="px-5 py-3 text-center">Cantidad</th><th className="px-5 py-3">Fecha</th><th className="px-5 py-3">Estado</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movimientos.length === 0 ? <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">No hay movimientos registrados.</td></tr> : movimientos.map((movement) => {
                  const status = STATUS_CONFIG[movement.estado];
                  const StatusIcon = status.icon;
                  const allowedStates = getNextStates(movement.estado);
                  return <tr key={movement.id} className="hover:bg-slate-50"><td className="px-5 py-3.5"><span className="flex items-center gap-2 font-semibold text-slate-800"><Package className="h-4 w-4 text-[#00346F]" />{movement.productoNombre}</span><span className="mt-1 block text-[10px] text-slate-400">Solicitado por: {movement.solicitadoPor}</span></td><td className="px-5 py-3.5 text-slate-600">{movement.sedeOrigen} <ArrowRightLeft className="mx-1 inline h-3 w-3 text-slate-400" /> {movement.sedeDestino}</td><td className="px-5 py-3.5 text-center font-bold text-slate-800">{movement.cantidad}</td><td className="px-5 py-3.5 text-slate-500">{movement.fecha}</td><td className="px-5 py-3.5">{canManageStatus ? <select value={movement.estado} onChange={(event) => { const nextMovement = { ...movement, estado: event.target.value as MovimientoInventario['estado'] }; onUpdateMovimiento(nextMovement); onShowToast('Estado actualizado', `${status.label}: ${movement.productoNombre}.`, 'info'); }} className={`rounded-full border-0 px-2.5 py-1 text-[10px] font-bold outline-none ${status.className}`}>{allowedStates.map((state) => <option key={state} value={state}>{STATUS_CONFIG[state].label}</option>)}</select> : <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${status.className}`}>{status.label}</span>}<StatusIcon className="ml-1 inline h-3 w-3" /></td></tr>;
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {isModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"><form onSubmit={handleSubmit} className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl"><div className="border-b border-slate-200 bg-[#EFF4FF] px-5 py-4"><h2 className="text-sm font-bold text-[#00346F]">Solicitar movimiento</h2></div><div className="space-y-4 p-5 text-xs"><label className="block font-bold text-slate-700">Producto<select value={productoId} onChange={(event) => setProductoId(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:border-[#00346F]">{productos.filter((item) => item.estado === 'ACTIVO').map((item) => <option key={item.id} value={item.id}>{item.codigo} - {item.nombre}</option>)}</select></label><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="font-bold text-slate-700">Sede origen<select value={sedeOrigen} onChange={(event) => setSedeOrigen(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:border-[#00346F]">{activeBranches.map((branch) => <option key={branch.id}>{branch.nombre}</option>)}</select></label><label className="font-bold text-slate-700">Sede destino<select value={sedeDestino} onChange={(event) => setSedeDestino(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:border-[#00346F]">{activeBranches.map((branch) => <option key={branch.id}>{branch.nombre}</option>)}</select></label></div><label className="block font-bold text-slate-700">Cantidad<input type="number" min="1" value={cantidad} onChange={(event) => setCantidad(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-[#00346F]" /></label></div><div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4"><button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button><button type="submit" className="rounded-lg bg-[#00346F] px-4 py-2 text-xs font-bold text-white hover:bg-[#004A99]">Registrar solicitud</button></div></form></div>}
    </div>
  );
};

function SummaryCard({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs"><p className="text-[11px] font-semibold text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-[#00346F]">{value}</p></div>;
}