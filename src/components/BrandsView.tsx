import React, { useState } from 'react';
import { Tag, Plus, CheckCircle2, XCircle, Edit2, Save, X, Search } from 'lucide-react';
import { Marca, EstadoRegistro } from '../types';

interface BrandsViewProps {
  marcas: Marca[];
  onSaveMarca: (m: Marca) => void;
  onToggleEstado: (id: number) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const BrandsView: React.FC<BrandsViewProps> = ({
  marcas,
  onSaveMarca,
  onToggleEstado,
  onShowToast,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMarca, setEditingMarca] = useState<Marca | null>(null);
  const [formData, setFormData] = useState<Partial<Marca>>({ nombre: '', estado: 'ACTIVO' });

  const filtered = marcas.filter((m) => m.nombre.toLowerCase().includes(search.toLowerCase()));

  const handleOpenNew = () => {
    setEditingMarca(null);
    setFormData({ nombre: '', estado: 'ACTIVO' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: Marca) => {
    setEditingMarca(m);
    setFormData({ ...m });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre) return;

    const marca: Marca = {
      id: editingMarca ? editingMarca.id : Date.now(),
      nombre: formData.nombre.trim().toUpperCase(),
      estado: (formData.estado as EstadoRegistro) || 'ACTIVO',
    };

    onSaveMarca(marca);
    setIsModalOpen(false);
    onShowToast('Marca guardada', `La marca '${marca.nombre}' está ${marca.estado}.`, 'success');
  };

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto bg-[#F8F9FF] min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1C30] tracking-tight">Marcas Registradas</h1>
          <p className="text-slate-500 text-xs mt-0.5">Control de marcas asociadas a los productos del catálogo.</p>
        </div>

        <button
          onClick={handleOpenNew}
          className="bg-[#00346F] hover:bg-[#004A99] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva Marca
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-[#EFF4FF] flex justify-between items-center">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar marca..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
            />
          </div>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-[#EFF4FF] font-bold text-slate-600 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">Nombre de Marca</th>
              <th className="py-3 px-4 text-center">Estado</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-mono font-bold text-[#00346F]">{m.id}</td>
                <td className="py-3 px-4 font-semibold text-slate-800">{m.nombre}</td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => {
                      onToggleEstado(m.id);
                      onShowToast('Estado de marca modificado', `Marca '${m.nombre}' actualizada.`, 'info');
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      m.estado === 'ACTIVO' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {m.estado === 'ACTIVO' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {m.estado}
                  </button>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => handleOpenEdit(m)}
                    className="p-1.5 text-slate-500 hover:text-[#00346F] rounded"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-[#EFF4FF]">
              <h3 className="text-sm font-bold text-[#00346F]">
                {editingMarca ? 'Editar Marca' : 'Nueva Marca'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Nombre de Marca *</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                  placeholder="LOGITECH"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#00346F] text-white rounded-lg font-semibold"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
