import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Search,
  Save,
  ShieldCheck,
  CheckCircle2,
  Store,
  Users as UsersIcon,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Plus,
  X,
} from 'lucide-react';
import { EmpresaConfig, Sucursal, EstadoRegistro } from '../types';

interface CompanySettingsViewProps {
  empresa: EmpresaConfig;
  sucursales: Sucursal[];
  onSaveEmpresa: (empresa: EmpresaConfig) => void;
  onSaveSucursal: (sucursal: Sucursal) => void;
  onToggleSucursalEstado?: (id: number) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  setActiveView: (view: string) => void;
}

export const CompanySettingsView: React.FC<CompanySettingsViewProps> = ({
  empresa,
  sucursales,
  onSaveEmpresa,
  onSaveSucursal,
  onToggleSucursalEstado,
  onShowToast,
  setActiveView,
}) => {
  const [activeTab, setActiveTab] = useState<'empresa' | 'sucursales' | 'usuarios'>('empresa');
  const [formData, setFormData] = useState<EmpresaConfig>({ ...empresa });

  // Sucursal modal state
  const [isSucursalModalOpen, setIsSucursalModalOpen] = useState(false);
  const [editingSucursal, setEditingSucursal] = useState<Sucursal | null>(null);
  const [sucursalForm, setSucursalForm] = useState<{
    codigo: string;
    nombre: string;
    direccion: string;
    telefono: string;
    esPrincipal: boolean;
    estado: EstadoRegistro;
  }>({
    codigo: '',
    nombre: '',
    direccion: '',
    telefono: '',
    esPrincipal: false,
    estado: 'ACTIVO',
  });

  const handleOpenAddSucursal = () => {
    const nextCode = `000${sucursales.length}`.slice(-4);
    setEditingSucursal(null);
    setSucursalForm({
      codigo: nextCode,
      nombre: '',
      direccion: '',
      telefono: '',
      esPrincipal: false,
      estado: 'ACTIVO',
    });
    setIsSucursalModalOpen(true);
  };

  const handleOpenEditSucursal = (suc: Sucursal) => {
    setEditingSucursal(suc);
    setSucursalForm({
      codigo: suc.codigo,
      nombre: suc.nombre,
      direccion: suc.direccion,
      telefono: suc.telefono,
      esPrincipal: suc.esPrincipal,
      estado: suc.estado,
    });
    setIsSucursalModalOpen(true);
  };

  const handleSaveSucursalForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sucursalForm.nombre.trim()) {
      onShowToast('Campo requerido', 'El nombre de la sucursal es obligatorio.', 'warning');
      return;
    }

    const updatedSucursal: Sucursal = {
      id: editingSucursal ? editingSucursal.id : Date.now(),
      codigo: sucursalForm.codigo.trim() || '0000',
      nombre: sucursalForm.nombre.trim(),
      direccion: sucursalForm.direccion.trim(),
      telefono: sucursalForm.telefono.trim(),
      esPrincipal: sucursalForm.esPrincipal,
      estado: sucursalForm.estado,
    };

    onSaveSucursal(updatedSucursal);
    setIsSucursalModalOpen(false);
    onShowToast(
      editingSucursal ? 'Sucursal actualizada' : 'Sucursal creada',
      `La sede "${updatedSucursal.nombre}" se guardó correctamente.`,
      'success'
    );
  };

  const handleToggleEstado = (suc: Sucursal) => {
    if (onToggleSucursalEstado) {
      onToggleSucursalEstado(suc.id);
    } else {
      const nuevoEstado: EstadoRegistro = suc.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
      onSaveSucursal({ ...suc, estado: nuevoEstado });
    }
    const nuevoEstado = suc.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    onShowToast(
      'Estado modificado',
      `La sucursal "${suc.nombre}" ahora está ${nuevoEstado}.`,
      nuevoEstado === 'ACTIVO' ? 'success' : 'warning'
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveEmpresa(formData);
    onShowToast('Configuración guardada', 'Los datos de la empresa se actualizaron correctamente.', 'success');
  };

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto bg-[#F8F9FF] min-h-screen">
      {/* Page Header matching Screenshot */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B1C30] tracking-tight">Datos de la Empresa</h1>
        <p className="text-slate-500 text-xs mt-0.5">Configure los datos principales de su empresa.</p>
      </div>

      {/* Tabs matching Screenshot */}
      <div className="bg-white rounded-t-xl border-x border-t border-slate-200 px-6 pt-3 shadow-xs">
        <div className="flex overflow-x-auto no-scrollbar gap-8 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('empresa')}
            className={`pb-3 px-1 text-xs uppercase font-bold tracking-wider whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'empresa'
                ? 'text-[#00346F] border-[#00346F]'
                : 'text-slate-500 border-transparent hover:text-[#00346F]'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Empresa
          </button>

          <button
            onClick={() => setActiveTab('sucursales')}
            className={`pb-3 px-1 text-xs uppercase font-bold tracking-wider whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'sucursales'
                ? 'text-[#00346F] border-[#00346F]'
                : 'text-slate-500 border-transparent hover:text-[#00346F]'
            }`}
          >
            <Store className="w-4 h-4" />
            Sucursales
          </button>

          <button
            onClick={() => setActiveView('usuarios')}
            className="pb-3 px-1 text-xs uppercase font-bold tracking-wider whitespace-nowrap text-slate-500 hover:text-[#00346F] transition-colors flex items-center gap-2"
          >
            <UsersIcon className="w-4 h-4" />
            Usuarios
          </button>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white rounded-b-xl border border-slate-200 p-6 md:p-8 shadow-xs">
        {activeTab === 'empresa' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Top Grid: RUC & Business Name */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* RUC Field with Consultation */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  RUC *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={formData.ruc}
                    onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                    className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-[#00346F]"
                    placeholder="20609737524"
                  />
                </div>
              </div>

              {/* Razón Social */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Razón Social *
                </label>
                <input
                  type="text"
                  required
                  value={formData.razonSocial}
                  onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#00346F]"
                  placeholder="MG SOLUTIONS GROUP S.A.C."
                />
              </div>
            </div>

            {/* Nombre Comercial */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nombre Comercial
              </label>
              <input
                type="text"
                value={formData.nombreComercial}
                onChange={(e) => setFormData({ ...formData, nombreComercial: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#00346F]"
                placeholder="MG SOLUTIONS GROUP"
              />
            </div>

            {/* Dirección Fiscal */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Dirección Fiscal *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.direccionFiscal}
                  onChange={(e) => setFormData({ ...formData, direccionFiscal: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#00346F]"
                  placeholder="AV. PEDRO RUIZ NRO. 349 INT. 09C (MERCADO MODELO)"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Geographic Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Departamento
                </label>
                <input
                  type="text"
                  value={formData.departamento}
                  onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#00346F]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Provincia
                </label>
                <input
                  type="text"
                  value={formData.provincia}
                  onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#00346F]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Distrito
                </label>
                <input
                  type="text"
                  value={formData.distrito}
                  onChange={(e) => setFormData({ ...formData, distrito: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#00346F]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Código Ubigeo
                </label>
                <input
                  type="text"
                  value={formData.ubigeo}
                  onChange={(e) => setFormData({ ...formData, ubigeo: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-[#00346F]"
                  placeholder="140101"
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#00346F]"
                    placeholder="mgsolutions.group@gmail.com"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Teléfono / Móvil
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#00346F]"
                    placeholder="+51 974 812 390"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-5 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                className="bg-[#00346F] hover:bg-[#004A99] text-white px-6 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 shadow transition-all active:scale-[0.98]"
              >
                <Save className="w-4 h-4" />
                Guardar Cambios
              </button>
            </div>
          </form>
        )}

        {activeTab === 'sucursales' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Sucursales y Puntos de Emisión</h3>
                <p className="text-[11px] text-slate-500">Gestione sedes, almacenes y puntos de atención de la empresa.</p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddSucursal}
                className="px-3.5 py-1.5 bg-[#00346F] text-white text-xs rounded-lg font-semibold hover:bg-[#004A99] flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                + Agregar Sucursal
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#EFF4FF] font-bold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Nombre</th>
                    <th className="py-2.5 px-3">Dirección</th>
                    <th className="py-2.5 px-3">Teléfono</th>
                    <th className="py-2.5 px-3 text-center">Tipo</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                    <th className="py-2.5 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sucursales.map((suc) => (
                    <tr key={suc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#00346F]">{suc.codigo}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{suc.nombre}</td>
                      <td className="py-2.5 px-3 text-slate-600">{suc.direccion || '—'}</td>
                      <td className="py-2.5 px-3 text-slate-500">{suc.telefono || '—'}</td>
                      <td className="py-2.5 px-3 text-center">
                        {suc.esPrincipal ? (
                          <span className="px-2 py-0.5 bg-blue-100 text-[#00346F] font-bold rounded text-[10px]">
                            Principal
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">
                            Anexo
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                            suc.estado === 'ACTIVO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${suc.estado === 'ACTIVO' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {suc.estado}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Botón Lápiz de Editar */}
                          <button
                            type="button"
                            title="Editar datos de sucursal"
                            onClick={() => handleOpenEditSucursal(suc)}
                            className="p-1.5 text-slate-600 hover:text-[#00346F] hover:bg-blue-50 rounded-lg border border-slate-200 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Botón Toggle Activar / Desactivar */}
                          <button
                            type="button"
                            title={suc.estado === 'ACTIVO' ? 'Desactivar sucursal' : 'Activar sucursal'}
                            onClick={() => handleToggleEstado(suc)}
                            className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 text-[10px] font-bold ${
                              suc.estado === 'ACTIVO'
                                ? 'text-emerald-700 hover:bg-emerald-50 border-emerald-200'
                                : 'text-red-700 hover:bg-red-50 border-red-200'
                            }`}
                          >
                            {suc.estado === 'ACTIVO' ? (
                              <ToggleRight className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <ToggleLeft className="w-4 h-4 text-slate-400" />
                            )}
                            <span className="hidden sm:inline">
                              {suc.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Agregar / Editar Sucursal */}
            {isSucursalModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
                <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-[#00346F] text-white">
                    <div className="flex items-center gap-2">
                      <Store className="w-5 h-5 text-blue-200" />
                      <h3 className="text-sm font-bold">
                        {editingSucursal ? 'Editar Sucursal / Sede' : 'Nueva Sucursal / Punto de Emisión'}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSucursalModalOpen(false)}
                      className="text-white/70 hover:text-white p-1 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveSucursalForm} className="p-5 space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Código *
                        </label>
                        <input
                          type="text"
                          required
                          value={sucursalForm.codigo}
                          onChange={(e) => setSucursalForm({ ...sucursalForm, codigo: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-[#00346F] focus:outline-none focus:border-[#00346F]"
                          placeholder="0001"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Estado Operativo
                        </label>
                        <select
                          value={sucursalForm.estado}
                          onChange={(e) =>
                            setSucursalForm({
                              ...sucursalForm,
                              estado: e.target.value as EstadoRegistro,
                            })
                          }
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold focus:outline-none focus:border-[#00346F]"
                        >
                          <option value="ACTIVO">ACTIVO (En operación)</option>
                          <option value="INACTIVO">INACTIVO (Suspendido)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Nombre de la Sucursal / Sede *
                      </label>
                      <input
                        type="text"
                        required
                        value={sucursalForm.nombre}
                        onChange={(e) => setSucursalForm({ ...sucursalForm, nombre: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium focus:outline-none focus:border-[#00346F]"
                        placeholder="Ej: Sucursal Lambayeque Norte"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Dirección Completa
                      </label>
                      <input
                        type="text"
                        value={sucursalForm.direccion}
                        onChange={(e) => setSucursalForm({ ...sucursalForm, direccion: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium focus:outline-none focus:border-[#00346F]"
                        placeholder="Av. Ramón Castilla 450, Chiclayo"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Teléfono de Contacto
                        </label>
                        <input
                          type="text"
                          value={sucursalForm.telefono}
                          onChange={(e) => setSucursalForm({ ...sucursalForm, telefono: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium focus:outline-none focus:border-[#00346F]"
                          placeholder="(074) 281190"
                        />
                      </div>

                      <div className="flex items-center pt-5">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={sucursalForm.esPrincipal}
                            onChange={(e) => setSucursalForm({ ...sucursalForm, esPrincipal: e.target.checked })}
                            className="w-4 h-4 text-[#00346F] rounded border-slate-300 focus:ring-blue-500"
                          />
                          <span className="font-bold text-slate-700">Sede Principal</span>
                        </label>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsSucursalModalOpen(false)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-[#00346F] hover:bg-[#004A99] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {editingSucursal ? 'Guardar Cambios' : 'Registrar Sucursal'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
