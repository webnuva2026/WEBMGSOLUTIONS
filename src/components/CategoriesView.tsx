import React, { useState } from 'react';
import { Layers, Plus, CheckCircle2, XCircle, Edit2, Save, X, Search } from 'lucide-react';
import { Categoria, EstadoRegistro } from '../types';

interface CategoriesViewProps {
  categorias: Categoria[];
  onSaveCategoria: (cat: Categoria) => void;
  onToggleEstado: (id: number) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  readOnly?: boolean;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categorias,
  onSaveCategoria,
  onToggleEstado,
  onShowToast,
  readOnly = false,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Categoria | null>(null);
  const [formData, setFormData] = useState<Partial<Categoria>>({
    nombre: '',
    descripcion: '',
    estado: 'ACTIVO',
  });

  const filtered = categorias.filter(
    (c) =>
      c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (c.descripcion && c.descripcion.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenNew = () => {
    setEditingCat(null);
    setFormData({ nombre: '', descripcion: '', estado: 'ACTIVO' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Categoria) => {
    setEditingCat(c);
    setFormData({ ...c });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre) return;

    const cat: Categoria = {
      id: editingCat ? editingCat.id : Date.now(),
      nombre: formData.nombre.trim().toUpperCase(),
      descripcion: formData.descripcion || '',
      estado: (formData.estado as EstadoRegistro) || 'ACTIVO',
    };

    onSaveCategoria(cat);
    setIsModalOpen(false);
    onShowToast('Categoría guardada', `La categoría '${cat.nombre}' está ${cat.estado}.`, 'success');
  };

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto bg-[#F8F9FF] min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1C30] tracking-tight">Categorías de Productos</h1>
          <p className="text-slate-500 text-xs mt-0.5">Clasificación de productos del inventario y almacén.</p>
        </div>

        {!readOnly && (
          <button
            onClick={handleOpenNew}
            className="bg-[#00346F] hover:bg-[#004A99] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nueva Categoría
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-[#EFF4FF] flex justify-between items-center">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar categoría..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
            />
          </div>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-[#EFF4FF] font-bold text-slate-600 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">Nombre de Categoría</th>
              <th className="py-3 px-4">Descripción</th>
              <th className="py-3 px-4 text-center">Estado</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((cat) => (
              <tr key={cat.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-mono font-bold text-[#00346F]">{cat.id}</td>
                <td className="py-3 px-4 font-semibold text-slate-800">{cat.nombre}</td>
                <td className="py-3 px-4 text-slate-600">{cat.descripcion || '-'}</td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => {
                      onToggleEstado(cat.id);
                      onShowToast(
                        'Estado actualizado',
                        `Categoría '${cat.nombre}' cambió de estado.`,
                        'info'
                      );
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      cat.estado === 'ACTIVO'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {cat.estado === 'ACTIVO' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {cat.estado}
                  </button>
                </td>
                <td className="py-3 px-4 text-right">
                  {!readOnly && (
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1.5 text-slate-500 hover:text-[#00346F] rounded"
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-[#EFF4FF]">
              <h3 className="text-sm font-bold text-[#00346F]">
                {editingCat ? 'Editar Categoría' : 'Nueva Categoría'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                  placeholder="AUDIO Y SONIDO"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Descripción</label>
                <input
                  type="text"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                  placeholder="Equipos de sonido, altavoces y auriculares"
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
