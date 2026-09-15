import React, { useMemo, useState } from 'react';
import { ClipboardList, Eye, Laptop, Monitor, Package, Printer, Search, Wrench } from 'lucide-react';
import { Cliente, Equipo, OrdenServicio } from '../types';

interface EquipmentManagementViewProps {
  equipos: Equipo[];
  clientes: Cliente[];
  ordenes: OrdenServicio[];
  onOpenService: (clientId: number) => void;
}

const STATUS_LABELS: Record<Equipo['estado'], string> = {
  REGISTRADO: 'Registrado',
  EN_SERVICIO: 'En servicio',
  LISTO_ENTREGA: 'Listo para entrega',
  ENTREGADO: 'Entregado',
};

export const EquipmentManagementView: React.FC<EquipmentManagementViewProps> = ({
  equipos,
  clientes,
  ordenes,
  onOpenService,
}) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | Equipo['estado']>('ALL');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipo | null>(null);

  const clientById = useMemo(() => new Map(clientes.map((client) => [client.id, client])), [clientes]);
  const servicesByEquipment = useMemo(() => {
    const result = new Map<number, OrdenServicio[]>();
    ordenes.forEach((order) => {
      const current = result.get(order.id) || [];
      result.set(order.id, [...current, order]);
    });
    return result;
  }, [ordenes]);

  const filteredEquipment = equipos.filter((equipment) => {
    const client = clientById.get(equipment.clienteId);
    const query = search.toLowerCase();
    const matchesSearch = !query || [
      equipment.marca,
      equipment.modelo,
      equipment.numeroSerie,
      client?.razonSocial || '',
      client?.numeroDocumento || '',
    ].some((value) => value.toLowerCase().includes(query));
    return matchesSearch && (status === 'ALL' || equipment.estado === status);
  });

  const getEquipmentIcon = (type: Equipo['tipo']) => {
    if (type === 'LAPTOP') return Laptop;
    if (type === 'IMPRESORA') return Printer;
    if (type === 'MONITOR' || type === 'PC_ESCRITORIO') return Monitor;
    return Package;
  };

  return (
    <div className="min-h-screen flex-1 overflow-y-auto bg-[#F8F9FF] p-6 md:p-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#00346F]">Activos de clientes</p>
            <h1 className="text-2xl font-bold tracking-tight text-[#0B1C30]">Equipos registrados</h1>
            <p className="mt-1 text-xs text-slate-500">Consulta el historial y estado de cada equipo asociado a un cliente.</p>
          </div>
          <button type="button" onClick={() => onOpenService()} className="flex items-center justify-center gap-2 rounded-lg bg-[#00346F] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#004A99]">
            <Wrench className="h-4 w-4" />
            Registrar servicio
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Summary label="Equipos registrados" value={equipos.length} />
          <Summary label="En servicio" value={equipos.filter((equipment) => equipment.estado === 'EN_SERVICIO').length} />
          <Summary label="Listos para entrega" value={equipos.filter((equipment) => equipment.estado === 'LISTO_ENTREGA').length} />
        </div>

        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por cliente, marca, modelo o serie..." className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs outline-none focus:border-[#00346F]" />
            </div>
            <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#00346F]">
              <option value="ALL">Todos los estados</option>
              {Object.entries(STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-200 bg-[#EFF4FF] px-5 py-4">
            <ClipboardList className="h-4 w-4 text-[#00346F]" />
            <h2 className="text-sm font-bold text-[#00346F]">Listado de equipos ({filteredEquipment.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-600">
                <tr><th className="px-5 py-3">Equipo</th><th className="px-5 py-3">Cliente</th><th className="px-5 py-3">Número de serie</th><th className="px-5 py-3">Servicios</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3 text-right">Acciones</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEquipment.length === 0 ? <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">No se encontraron equipos.</td></tr> : filteredEquipment.map((equipment, index) => {
                  const Icon = getEquipmentIcon(equipment.tipo);
                  const client = clientById.get(equipment.clienteId);
                  const serviceCount = servicesByEquipment.get(equipment.id)?.length || 0;
                  return <tr key={equipment.id} className={index % 2 ? 'bg-[#F8FAFC]' : 'bg-white'}><td className="px-5 py-3.5"><div className="flex items-center gap-2"><span className="rounded-lg bg-blue-50 p-2 text-[#00346F]"><Icon className="h-4 w-4" /></span><div><p className="font-bold text-slate-800">{equipment.marca} {equipment.modelo}</p><p className="mt-0.5 text-[10px] text-slate-500">{equipment.tipo}</p></div></div></td><td className="px-5 py-3.5"><p className="font-semibold text-slate-800">{client?.razonSocial || 'Cliente no encontrado'}</p><p className="text-[10px] text-slate-500">{client?.numeroDocumento}</p></td><td className="px-5 py-3.5 font-mono font-semibold text-[#00346F]">{equipment.numeroSerie}</td><td className="px-5 py-3.5 text-center font-bold text-slate-700">{serviceCount}</td><td className="px-5 py-3.5"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${equipment.estado === 'EN_SERVICIO' ? 'bg-blue-50 text-[#00346F]' : equipment.estado === 'LISTO_ENTREGA' ? 'bg-emerald-50 text-emerald-700' : equipment.estado === 'ENTREGADO' ? 'bg-slate-100 text-slate-700' : 'bg-amber-50 text-amber-700'}`}>{STATUS_LABELS[equipment.estado]}</span></td><td className="px-5 py-3.5 text-right"><button type="button" onClick={() => setSelectedEquipment(equipment)} className="rounded-lg p-1.5 text-[#00346F] hover:bg-blue-50" title="Ver detalle"><Eye className="h-4 w-4" /></button><button type="button" onClick={() => onOpenService(equipment.clienteId)} className="ml-1 rounded-lg p-1.5 text-[#00346F] hover:bg-blue-50" title="Registrar servicio"><Wrench className="h-4 w-4" /></button></td></tr>;
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {selectedEquipment && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setSelectedEquipment(null)}><div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between border-b border-slate-200 bg-[#EFF4FF] px-5 py-4"><div><h2 className="text-sm font-bold text-[#00346F]">Detalle del equipo</h2><p className="mt-0.5 text-[11px] text-slate-500">{selectedEquipment.marca} {selectedEquipment.modelo}</p></div><button type="button" onClick={() => setSelectedEquipment(null)} className="text-slate-400 hover:text-slate-700">Cerrar</button></div><div className="space-y-3 p-5 text-xs"><Detail label="Tipo" value={selectedEquipment.tipo} /><Detail label="Número de serie" value={selectedEquipment.numeroSerie} /><Detail label="Cliente" value={clientById.get(selectedEquipment.clienteId)?.razonSocial || 'No encontrado'} /><Detail label="Accesorios" value={selectedEquipment.accesorios.join(', ') || 'Sin accesorios registrados'} /><Detail label="Fecha de registro" value={selectedEquipment.fechaRegistro} /></div></div></div>}
    </div>
  );
};

function Summary({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs"><p className="text-[11px] font-semibold text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-[#00346F]">{value}</p></div>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="border-b border-slate-100 pb-2"><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span><span className="mt-1 block font-semibold text-slate-800">{value}</span></div>;
}
