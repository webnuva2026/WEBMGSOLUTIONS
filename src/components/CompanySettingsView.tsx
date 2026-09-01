import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Search,
  Save,
  ShieldCheck,
  Upload,
  CheckCircle2,
  Store,
  KeyRound,
  Users as UsersIcon,
  RefreshCw,
} from 'lucide-react';
import { EmpresaConfig, Sucursal } from '../types';

interface CompanySettingsViewProps {
  empresa: EmpresaConfig;
  sucursales: Sucursal[];
  onSaveEmpresa: (empresa: EmpresaConfig) => void;
  onSaveSucursal: (sucursal: Sucursal) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  setActiveView: (view: string) => void;
}

export const CompanySettingsView: React.FC<CompanySettingsViewProps> = ({
  empresa,
  sucursales,
  onSaveEmpresa,
  onSaveSucursal,
  onShowToast,
  setActiveView,
}) => {
  const [activeTab, setActiveTab] = useState<'empresa' | 'sucursales' | 'certificado' | 'usuarios'>('empresa');
  const [formData, setFormData] = useState<EmpresaConfig>({ ...empresa });
  const [isSearchingRuc, setIsSearchingRuc] = useState(false);

  const handleRucConsultation = () => {
    if (!formData.ruc || formData.ruc.length !== 11) {
      onShowToast('RUC Inválido', 'El RUC debe tener 11 dígitos numéricos.', 'warning');
      return;
    }

    setIsSearchingRuc(true);
    setTimeout(() => {
      setIsSearchingRuc(false);
      onShowToast(
        'Consulta SUNAT Exitosa',
        'Datos del contribuyente sincronizados con el padrón RUC.',
        'success'
      );
    }, 600);
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
            onClick={() => setActiveTab('certificado')}
            className={`pb-3 px-1 text-xs uppercase font-bold tracking-wider whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'certificado'
                ? 'text-[#00346F] border-[#00346F]'
                : 'text-slate-500 border-transparent hover:text-[#00346F]'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            Certificado Digital
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
                  <button
                    type="button"
                    onClick={handleRucConsultation}
                    disabled={isSearchingRuc}
                    className="px-3.5 py-2.5 bg-[#00346F] hover:bg-[#004A99] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                    title="Consultar en SUNAT"
                  >
                    {isSearchingRuc ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">SUNAT</span>
                  </button>
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
                  Código Ubigeo (SUNAT)
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
                  Correo Electrónico de Facturación
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
              <h3 className="text-sm font-bold text-slate-800">Sucursales y Puntos de Emisión</h3>
              <button
                onClick={() => onShowToast('Nueva Sucursal', 'Abriendo formulario de sucursal...', 'info')}
                className="px-3 py-1.5 bg-[#00346F] text-white text-xs rounded-lg font-semibold hover:bg-[#004A99]"
              >
                + Agregar Sucursal
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#EFF4FF] font-bold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Nombre</th>
                    <th className="py-2.5 px-3">Dirección</th>
                    <th className="py-2.5 px-3">Teléfono</th>
                    <th className="py-2.5 px-3 text-center">Tipo</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sucursales.map((suc) => (
                    <tr key={suc.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#00346F]">{suc.codigo}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{suc.nombre}</td>
                      <td className="py-2.5 px-3 text-slate-600">{suc.direccion}</td>
                      <td className="py-2.5 px-3 text-slate-500">{suc.telefono}</td>
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
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            suc.estado === 'ACTIVO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {suc.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'certificado' && (
          <div className="space-y-5 max-w-2xl">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-emerald-900">Certificado Digital SUNAT Vigente</h4>
                <p className="text-xs text-emerald-700 mt-1">
                  Certificado PFX/P12 cargado correctamente para firma electrónica XML UBL 2.1.
                </p>
                <p className="text-xs font-semibold text-emerald-800 mt-2">
                  Vigencia: Hasta el {empresa.certificadoVencimiento} (Activo)
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Usuario Secundario SOL (SUNAT)
              </label>
              <input
                type="text"
                value={formData.solUsuarioSunat}
                onChange={(e) => setFormData({ ...formData, solUsuarioSunat: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800"
                placeholder="MODDATOS"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Actualizar Certificado Digital (.pfx o .p12)
              </label>
              <div className="border-2 border-dashed border-slate-300 hover:border-[#00346F] rounded-xl p-6 text-center cursor-pointer bg-[#F8F9FF] transition-colors">
                <Upload className="w-8 h-8 text-[#00346F] mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Arrastre su archivo de certificado aquí o haga clic</p>
                <p className="text-[11px] text-slate-500 mt-1">Formatos soportados: .pfx, .p12 (Protegido por contraseña)</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
