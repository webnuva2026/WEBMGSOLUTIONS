import React, { useState } from 'react';
import {
  Plus,
  Download,
  Upload,
  FileSpreadsheet,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
  Package,
  Layers,
  Sparkles,
  X,
  Save,
} from 'lucide-react';
import { Producto, Categoria, Marca, EstadoRegistro } from '../types';

interface ProductsViewProps {
  productos: Producto[];
  categorias: Categoria[];
  marcas: Marca[];
  onSaveProducto: (prod: Producto) => void;
  onToggleStatus: (id: number) => void;
  onDeleteProducto: (id: number) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  productos,
  categorias,
  marcas,
  onSaveProducto,
  onToggleStatus,
  onDeleteProducto,
  onShowToast,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('ALL');
  const [selectedEstado, setSelectedEstado] = useState<'ALL' | 'ACTIVO' | 'INACTIVO'>('ALL');
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Producto>>({
    codigoBarra: '',
    codigo: '',
    nombre: '',
    categoriaId: 1,
    marcaId: 1,
    sucursal: 'Principal',
    precioUnitario: 0,
    precioCosto: 0,
    stock: 10,
    unidadMedida: 'NIU',
    estado: 'ACTIVO',
  });

  // Filter Logic
  const filtered = productos.filter((p) => {
    const matchSearch =
      !search ||
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo.toLowerCase().includes(search.toLowerCase()) ||
      p.codigoBarra.includes(search) ||
      p.marcaNombre.toLowerCase().includes(search.toLowerCase());

    const matchCat =
      selectedCategoria === 'ALL' ||
      p.categoriaNombre.toUpperCase() === selectedCategoria.toUpperCase();

    const matchEstado = selectedEstado === 'ALL' || p.estado === selectedEstado;

    return matchSearch && matchCat && matchEstado;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleOpenNew = () => {
    setEditingProduct(null);
    setFormData({
      codigoBarra: String(Math.floor(10000000 + Math.random() * 90000000)),
      codigo: `PROD-${Math.floor(100 + Math.random() * 900)}`,
      nombre: '',
      categoriaId: categorias[0]?.id || 1,
      marcaId: marcas[0]?.id || 1,
      sucursal: 'Principal',
      precioUnitario: 50.0,
      precioCosto: 35.0,
      stock: 20,
      unidadMedida: 'NIU',
      estado: 'ACTIVO',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod: Producto) => {
    setEditingProduct(prod);
    setFormData({ ...prod });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.codigo || !formData.precioUnitario) {
      onShowToast('Campos requeridos', 'Por favor complete el nombre, código y precio.', 'warning');
      return;
    }

    const catObj = categorias.find((c) => c.id === Number(formData.categoriaId)) || categorias[0];
    const marcaObj = marcas.find((m) => m.id === Number(formData.marcaId)) || marcas[0];

    const prodToSave: Producto = {
      id: editingProduct ? editingProduct.id : Date.now(),
      codigoBarra: formData.codigoBarra || '79368705',
      codigo: formData.codigo.toUpperCase(),
      nombre: formData.nombre.toUpperCase(),
      categoriaId: catObj?.id || 1,
      categoriaNombre: catObj?.nombre || 'GENERAL',
      marcaId: marcaObj?.id || 1,
      marcaNombre: marcaObj?.nombre || 'GENERICO',
      sucursal: formData.sucursal || 'Principal',
      precioUnitario: Number(formData.precioUnitario),
      precioCosto: Number(formData.precioCosto || 0),
      stock: Number(formData.stock || 0),
      unidadMedida: formData.unidadMedida || 'NIU',
      estado: formData.estado as EstadoRegistro,
    };

    onSaveProducto(prodToSave);
    setIsModalOpen(false);
    onShowToast(
      editingProduct ? 'Producto actualizado' : 'Producto creado',
      `El producto '${prodToSave.nombre}' se guardó con estado ${prodToSave.estado}.`,
      'success'
    );
  };

  const handleExportExcel = () => {
    const csv =
      'data:text/csv;charset=utf-8,' +
      'Codigo Barra,Codigo,Producto,Categoria,Marca,Sucursal,Precio Unitario,Stock,Estado\n' +
      productos
        .map(
          (p) =>
            `"${p.codigoBarra}","${p.codigo}","${p.nombre}","${p.categoriaNombre}","${p.marcaNombre}","${p.sucursal}",${p.precioUnitario},${p.stock},${p.estado}`
        )
        .join('\n');
    const encoded = encodeURI(csv);
    const a = document.createElement('a');
    a.href = encoded;
    a.download = `catalogo_productos_MG_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    onShowToast('Exportación exitosa', 'Catálogo de productos exportado a CSV/Excel.', 'success');
  };

  const handleDownloadTemplate = () => {
    const csv =
      'data:text/csv;charset=utf-8,' +
      'CodigoBarra,Codigo,Producto,Categoria,Marca,Sucursal,PrecioUnitario,Stock,Estado\n' +
      '79368705,C00124,ADAPTADOR NANO USB BLUETOOTH 4.0,REDES,TP-LINK,Principal,35.00,48,ACTIVO\n' +
      '84912384,RAM08G,MEMORIA RAM DDR4 8GB TEROS,MEMORIA RAM,TEROS,Principal,120.50,24,ACTIVO\n';
    const encoded = encodeURI(csv);
    const a = document.createElement('a');
    a.href = encoded;
    a.download = 'plantilla_importacion_productos.csv';
    a.click();
    onShowToast('Plantilla descargada', 'Plantilla lista para ser llenada y subida.', 'info');
  };

  const handleSimulateUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls';
    input.onchange = () => {
      onShowToast(
        'Excel procesado',
        'Se validaron los estados y el catálogo fue sincronizado con MySQL.',
        'success'
      );
    };
    input.click();
  };

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto bg-[#F8F9FF] min-h-screen">
      {/* Page Header & Actions matching Screenshot */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1C30] tracking-tight">Catálogo de Productos</h1>
          <p className="text-slate-500 text-xs mt-0.5">Gestione el inventario y servicios de la empresa.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDownloadTemplate}
            className="bg-white border border-slate-300 text-[#00346F] hover:bg-slate-50 transition-colors px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-4 h-4" />
            Descargar plantilla
          </button>

          <button
            onClick={handleSimulateUpload}
            className="bg-white border border-slate-300 text-[#00346F] hover:bg-slate-50 transition-colors px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <Upload className="w-4 h-4" />
            Subir Excel
          </button>

          <button
            onClick={handleExportExcel}
            className="bg-white border border-slate-300 text-[#107C41] hover:bg-slate-50 transition-colors px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>

          <button
            onClick={handleOpenNew}
            className="bg-[#00346F] hover:bg-[#004A99] transition-colors text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Filters Bar matching Screenshot */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-end mb-6">
        {/* Search */}
        <div className="flex-1 w-full">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Buscar Producto
          </label>
          <div className="relative border border-slate-300 rounded-lg flex items-center px-3 bg-white focus-within:border-[#00346F] focus-within:ring-2 focus-within:ring-[#00346F]/20 transition-all">
            <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Código, nombre o marca..."
              className="w-full py-2 bg-transparent border-none focus:outline-none text-xs text-slate-800 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Category */}
        <div className="w-full md:w-56">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Categoría
          </label>
          <select
            value={selectedCategoria}
            onChange={(e) => {
              setSelectedCategoria(e.target.value);
              setPage(1);
            }}
            className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#00346F]"
          >
            <option value="ALL">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.nombre}>
                {c.nombre} {c.estado === 'INACTIVO' ? '(Inactivo)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Estado Filter matching requirement */}
        <div className="w-full md:w-48">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Estado
          </label>
          <select
            value={selectedEstado}
            onChange={(e) => {
              setSelectedEstado(e.target.value as any);
              setPage(1);
            }}
            className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#00346F]"
          >
            <option value="ALL">Todos los estados</option>
            <option value="ACTIVO">Solo Activos</option>
            <option value="INACTIVO">Solo Inactivos</option>
          </select>
        </div>
      </div>

      {/* Data Table matching Screenshot */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="bg-[#EFF4FF] border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider text-[11px]">
                <th className="py-3 px-4">Código Barra</th>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Marca</th>
                <th className="py-3 px-4">Sucursal</th>
                <th className="py-3 px-4 text-right">Precio</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    No se encontraron productos coincidentes.
                  </td>
                </tr>
              ) : (
                paginated.map((prod, idx) => (
                  <tr
                    key={prod.id}
                    className={`transition-colors group hover:bg-[#F1F5F9] ${
                      idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono text-slate-500">{prod.codigoBarra}</td>
                    <td className="py-3 px-4 font-bold text-[#00346F]">{prod.codigo}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div>{prod.nombre}</div>
                      <div className="text-[10px] text-slate-500 font-normal">Stock: {prod.stock} {prod.unidadMedida}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-medium">
                        {prod.categoriaNombre}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{prod.marcaNombre}</td>
                    <td className="py-3 px-4 text-slate-500">{prod.sucursal}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                      S/ {prod.precioUnitario.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          onToggleStatus(prod.id);
                          onShowToast(
                            'Estado cambiado',
                            `Producto '${prod.nombre}' ahora está ${
                              prod.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
                            }.`,
                            'info'
                          );
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-transform hover:scale-105 cursor-pointer ${
                          prod.estado === 'ACTIVO'
                            ? 'bg-[#DCFCE7] text-[#166534] hover:bg-green-200'
                            : 'bg-[#FEE2E2] text-[#991B1B] hover:bg-red-200'
                        }`}
                        title="Haga clic para alternar Estado Activo / Inactivo"
                      >
                        {prod.estado === 'ACTIVO' ? (
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
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEdit(prod)}
                          className="text-slate-500 hover:text-[#00346F] p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                          title="Editar Producto"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`¿Desea cambiar el estado del producto '${prod.nombre}' a INACTIVO?`)) {
                              onDeleteProducto(prod.id);
                              onShowToast('Estado actualizado', `El producto '${prod.nombre}' fue deshabilitado.`, 'warning');
                            }
                          }}
                          className="text-slate-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          title="Desactivar Producto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination matching Screenshot */}
        <div className="bg-[#F8FAFC] border-t border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Mostrando <span className="font-bold text-slate-800">{paginated.length > 0 ? (page - 1) * itemsPerPage + 1 : 0}</span> a{' '}
            <span className="font-bold text-slate-800">{Math.min(page * itemsPerPage, filtered.length)}</span> de{' '}
            <span className="font-bold text-slate-800">{filtered.length}</span> resultados
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => setPage(num)}
                className={`w-7 h-7 rounded text-xs font-bold transition-all ${
                  page === num ? 'bg-[#00346F] text-white' : 'hover:bg-slate-200 text-slate-700'
                }`}
              >
                {num}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Create / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-[#EFF4FF]">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#00346F]" />
                <h3 className="text-base font-bold text-[#00346F]">
                  {editingProduct ? 'Editar Producto' : 'Registrar Nuevo Producto'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Código de Barra (EAN/UPC)
                  </label>
                  <input
                    type="text"
                    value={formData.codigoBarra}
                    onChange={(e) => setFormData({ ...formData, codigoBarra: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00346F]"
                    placeholder="79368705"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Código Interno / SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00346F]"
                    placeholder="C00124"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre o Descripción del Producto *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00346F]"
                  placeholder="ADAPTADOR NANO USB BLUETOOTH 4.0"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Categoría *
                  </label>
                  <select
                    value={formData.categoriaId}
                    onChange={(e) => setFormData({ ...formData, categoriaId: Number(e.target.value) })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00346F]"
                  >
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Marca *
                  </label>
                  <select
                    value={formData.marcaId}
                    onChange={(e) => setFormData({ ...formData, marcaId: Number(e.target.value) })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00346F]"
                  >
                    {marcas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Sucursal
                  </label>
                  <input
                    type="text"
                    value={formData.sucursal}
                    onChange={(e) => setFormData({ ...formData, sucursal: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00346F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Precio Unitario Venta (S/) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    value={formData.precioUnitario}
                    onChange={(e) => setFormData({ ...formData, precioUnitario: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00346F]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Precio Costo (S/)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precioCosto}
                    onChange={(e) => setFormData({ ...formData, precioCosto: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00346F]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Stock Disponible *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00346F]"
                  />
                </div>
              </div>

              {/* Estado Selector - Essential Requirement */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <label className="block font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Estado del Producto (Control de Ciclo de Vida)
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="estadoProd"
                      value="ACTIVO"
                      checked={formData.estado === 'ACTIVO'}
                      onChange={() => setFormData({ ...formData, estado: 'ACTIVO' })}
                      className="text-[#00346F] focus:ring-[#00346F]"
                    />
                    <span className="font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-xs">
                      ACTIVO (Disponible para ventas y facturación)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="estadoProd"
                      value="INACTIVO"
                      checked={formData.estado === 'INACTIVO'}
                      onChange={() => setFormData({ ...formData, estado: 'INACTIVO' })}
                      className="text-red-600 focus:ring-red-600"
                    />
                    <span className="font-semibold text-red-800 bg-red-100 px-2 py-0.5 rounded text-xs">
                      INACTIVO (Descontinuado / Bloqueado en facturas)
                    </span>
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
                  {editingProduct ? 'Guardar Cambios' : 'Registrar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
