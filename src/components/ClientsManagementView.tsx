import React, { useState } from 'react';
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
} from 'lucide-react';
import { Cliente, Equipo, TipoDocumentoCliente, EstadoRegistro, OrdenServicio, Usuario } from '../types';

interface ClientsManagementViewProps {
  clientes: Cliente[];
  ordenes: OrdenServicio[];
  equipos: Equipo[];
  currentUser: Usuario;
  onSaveCliente: (c: Cliente) => void;
  onToggleClienteEstado: (id: number) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  onGoToServices: (clientId?: number) => void;
}

export const ClientsManagementView: React.FC<ClientsManagementViewProps> = ({
  clientes,
  ordenes,
  equipos,
  currentUser,
  onSaveCliente,
  onToggleClienteEstado,
  onShowToast,
  onGoToServices,
}) => {
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<'ALL' | 'ACTIVO' | 'INACTIVO'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

  const [formData, setFormData] = useState<Partial<Cliente>>({
    tipoDocumento: 'RUC',
    numeroDocumento: '',
    razonSocial: '',
    direccionFiscal: '',
    email: '',
    telefono: '',
    estado: 'ACTIVO',
  });

  const filtered = clientes.filter((c) => {
    const matchSearch =
      !search ||
      c.razonSocial.toLowerCase().includes(search.toLowerCase()) ||
      c.numeroDocumento.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchEstado = estadoFilter === 'ALL' || c.estado === estadoFilter;
    return matchSearch && matchEstado;
  });

  const serviceCountByClient = ordenes.reduce((counts, order) => {
    counts.set(order.clienteId, (counts.get(order.clienteId) || 0) + 1);
    return counts;
  }, new Map<number, number>());
  const equipmentCountByClient = equipos.reduce((counts, equipment) => {
    counts.set(equipment.clienteId, (counts.get(equipment.clienteId) || 0) + 1);
    return counts;
  }, new Map<number, number>());

  const handleOpenNew = () => {
    setEditingCliente(null);
    setFormData({
      tipoDocumento: 'RUC',
      numeroDocumento: '',
      razonSocial: '',
      direccionFiscal: '',
      email: '',
      telefono: '',
      estado: 'ACTIVO',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Cliente) => {
    setEditingCliente(c);
    setFormData({ ...c });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.numeroDocumento || !formData.razonSocial) {
      onShowToast('Campos requeridos', 'Número de documento y razón social son obligatorios.', 'warning');
      return;
    }

    const clientToSave: Cliente = {
      id: editingCliente ? editingCliente.id : Date.now(),
      tipoDocumento: (formData.tipoDocumento as TipoDocumentoCliente) || 'RUC',
      numeroDocumento: formData.numeroDocumento.trim(),
      razonSocial: formData.razonSocial.trim().toUpperCase(),
      direccionFiscal: formData.direccionFiscal || 'CHICLAYO, LAMBAYEQUE',
      email: formData.email || '',
      telefono: formData.telefono || '',
      estado: (formData.estado as EstadoRegistro) || 'ACTIVO',
      fechaRegistro: editingCliente ? editingCliente.fechaRegistro : new Date().toISOString().slice(0, 10),
    };

    onSaveCliente(clientToSave);
    setIsModalOpen(false);
    onShowToast(
      editingCliente ? 'Cliente actualizado' : 'Cliente registrado',
      `El cliente '${clientToSave.razonSocial}' se guardó con estado ${clientToSave.estado}.`,
      'success'
    );
  };

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto bg-[#F8F9FF] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1C30] tracking-tight">
            Directorio de Clientes
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Gestión de clientes y contactos asociados a servicios técnicos y ventas.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onGoToServices()}
            className="bg-white border border-[#00346F] text-[#00346F] hover:bg-[#EFF4FF] px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Wrench className="w-4 h-4" />
            Registrar servicio
          </button>
          {(currentUser.rol === 'ADMIN' || currentUser.rol === 'SECRETARIA') && (
            <button
              onClick={handleOpenNew}
              className="bg-[#00346F] hover:bg-[#004A99] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Nuevo Cliente
            </button>
          )}
        </div>
      </div>

      {/* State Rule Banner */}
      <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-amber-900">Validación de estado para servicios</h4>
          <p className="mt-0.5 text-amber-800">
            Un cliente con estado <strong>INACTIVO</strong> no puede registrar nuevos servicios ni realizar operaciones hasta que sea reactivado por un Administrador.
          </p>
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
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#EFF4FF] border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider text-[11px]">
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">N° Documento</th>
                <th className="py-3 px-4">Razón Social / Nombres</th>
                <th className="py-3 px-4">Dirección Fiscal</th>
                <th className="py-3 px-4">Email / Teléfono</th>
                <th className="py-3 px-4 text-center">Servicios</th>
                <th className="py-3 px-4 text-center">Equipos</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c, idx) => (
                <tr key={c.id} className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.tipoDocumento === 'RUC'
                          ? 'bg-blue-100 text-[#00346F]'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {c.tipoDocumento}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{c.numeroDocumento}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{c.razonSocial}</td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{c.direccionFiscal}</td>
                  <td className="py-3 px-4 text-slate-500">
                    <div>{c.email}</div>
                    <div className="text-[10px]">{c.telefono}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => onGoToServices(c.id)}
                      className="inline-flex items-center gap-1 rounded-full bg-[#EFF4FF] px-2.5 py-1 text-[11px] font-bold text-[#00346F] hover:bg-blue-100"
                      title="Ver servicios técnicos"
                    >
                      <Wrench className="h-3 w-3" />
                      {serviceCountByClient.get(c.id) || 0}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                      {equipmentCountByClient.get(c.id) || 0}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {(currentUser.rol === 'ADMIN' || currentUser.rol === 'SECRETARIA') ? (
                      <button
                        onClick={() => {
                          onToggleClienteEstado(c.id);
                          onShowToast(
                            'Estado modificado',
                            `Cliente '${c.razonSocial}' ahora está ${
                              c.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
                            }.`,
                            'info'
                          );
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-transform hover:scale-105 ${
                          c.estado === 'ACTIVO'
                            ? 'bg-[#DCFCE7] text-[#166534]'
                            : 'bg-[#FEE2E2] text-[#991B1B]'
                        }`}
                        title="Haga clic para alternar Estado"
                      >
                        {c.estado === 'ACTIVO' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Activo</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>Inactivo</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          c.estado === 'ACTIVO'
                            ? 'bg-[#DCFCE7] text-[#166534]'
                            : 'bg-[#FEE2E2] text-[#991B1B]'
                        }`}
                      >
                        {c.estado === 'ACTIVO' ? (
                          <><CheckCircle2 className="w-3 h-3" /><span>Activo</span></>
                        ) : (
                          <><XCircle className="w-3 h-3" /><span>Inactivo</span></>
                        )}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {(currentUser.rol === 'ADMIN' || currentUser.rol === 'SECRETARIA') && (
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="text-slate-500 hover:text-[#00346F] p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                        title="Editar Cliente"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-[#EFF4FF]">
              <h3 className="text-base font-bold text-[#00346F]">
                {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tipo Doc. *
                  </label>
                  <select
                    value={formData.tipoDocumento}
                    onChange={(e) =>
                      setFormData({ ...formData, tipoDocumento: e.target.value as TipoDocumentoCliente })
                    }
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00346F]"
                  >
                    <option value="RUC">RUC (11)</option>
                    <option value="DNI">DNI (8)</option>
                    <option value="CE">C. Extranjería</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    N° Documento *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.numeroDocumento}
                    onChange={(e) => setFormData({ ...formData, numeroDocumento: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-[#00346F]"
                    placeholder="20481928371"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Razón Social / Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.razonSocial}
                  onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value.toUpperCase() })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00346F]"
                  placeholder="CONSTRUCTORA LOS ANDES S.A.C."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Dirección Fiscal
                </label>
                <input
                  type="text"
                  value={formData.direccionFiscal}
                  onChange={(e) => setFormData({ ...formData, direccionFiscal: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00346F]"
                  placeholder="Av. Balta 1082, Chiclayo"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00346F]"
                    placeholder="contacto@cliente.pe"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00346F]"
                    placeholder="074-283921"
                  />
                </div>
              </div>

              {/* Estado Selector */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <label className="block font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Estado del Cliente
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="estadoCli"
                      value="ACTIVO"
                      checked={formData.estado === 'ACTIVO'}
                      onChange={() => setFormData({ ...formData, estado: 'ACTIVO' })}
                    />
                    <span className="font-semibold text-emerald-800">ACTIVO (Puede registrar servicios)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="estadoCli"
                      value="INACTIVO"
                      checked={formData.estado === 'INACTIVO'}
                      onChange={() => setFormData({ ...formData, estado: 'INACTIVO' })}
                    />
                    <span className="font-semibold text-red-800">INACTIVO (Bloqueado)</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00346F] hover:bg-[#004A99] text-white rounded-lg font-semibold flex items-center gap-2 shadow"
                >
                  <Save className="w-4 h-4" />
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
