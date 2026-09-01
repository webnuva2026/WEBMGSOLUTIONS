import React, { useState } from 'react';
import {
  TrendingUp,
  Receipt,
  Clock,
  CloudCheck,
  PlusCircle,
  FileText,
  Download,
  Eye,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Comprobante, EmpresaConfig } from '../types';

interface DashboardViewProps {
  comprobantes: Comprobante[];
  empresa: EmpresaConfig;
  onOpenNewInvoice: (type?: 'FACTURA' | 'BOLETA') => void;
  onViewInvoiceDetail: (comp: Comprobante) => void;
  setActiveView: (view: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  comprobantes,
  empresa,
  onOpenNewInvoice,
  onViewInvoiceDetail,
  setActiveView,
}) => {
  const [activeTab, setActiveTab] = useState<'panel' | 'tienda' | 'empresa' | 'marca' | 'categorias' | 'productos'>('panel');
  const [filterQuery, setFilterQuery] = useState('');

  // Calculate live statistics
  const totalVentasMes = comprobantes
    .filter((c) => c.estado !== 'ANULADO')
    .reduce((acc, c) => acc + c.total, 45230 - 17770.5); // base + live

  const countTotal = 1245 + comprobantes.length - 4;
  const countFacturas = 850 + comprobantes.filter((c) => c.tipo === 'FACTURA').length - 3;
  const countBoletas = 395 + comprobantes.filter((c) => c.tipo === 'BOLETA').length - 1;

  const porCobrar = comprobantes
    .filter((c) => c.estado === 'PENDIENTE')
    .reduce((acc, c) => acc + c.total, 0) || 8450.0;

  const filteredComprobantes = comprobantes.filter((c) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      c.serie.toLowerCase().includes(q) ||
      c.numero.includes(q) ||
      c.clienteNombre.toLowerCase().includes(q) ||
      c.clienteDocumento.includes(q)
    );
  });

  const handleDownloadReport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Fecha,Comprobante,Cliente,Documento,Subtotal,IGV,Total,Estado,SUNAT\n' +
      comprobantes
        .map(
          (c) =>
            `${c.fechaEmision},"${c.serie}-${c.numero}","${c.clienteNombre}",${c.clienteDocumento},${c.subtotal},${c.igv},${c.total},${c.estado},${c.estadoSunat}`
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_ventas_MG_SOLUTIONS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 min-h-screen flex flex-col bg-[#F8F9FF]">
      {/* Tabs Header matching Screenshot */}
      <div className="bg-white border-b border-slate-200 px-6 pt-5 shadow-xs">
        <h2 className="text-xl font-bold text-[#0B1C30] mb-4">Ventas / Panel Principal</h2>
        <div className="flex overflow-x-auto no-scrollbar gap-6">
          <button
            onClick={() => setActiveTab('panel')}
            className={`pb-3 px-1 text-xs uppercase font-bold tracking-wider whitespace-nowrap transition-all border-b-2 ${
              activeTab === 'panel'
                ? 'text-[#00346F] border-[#00346F]'
                : 'text-slate-500 border-transparent hover:text-[#00346F]'
            }`}
          >
            Panel
          </button>
          <button
            onClick={() => {
              setActiveTab('tienda');
              alert('Vista Tienda: Configuración de puntos de venta y cajas.');
            }}
            className={`pb-3 px-1 text-xs uppercase font-bold tracking-wider whitespace-nowrap transition-all border-b-2 ${
              activeTab === 'tienda'
                ? 'text-[#00346F] border-[#00346F]'
                : 'text-slate-500 border-transparent hover:text-[#00346F]'
            }`}
          >
            Tienda
          </button>
          <button
            onClick={() => setActiveView('config-empresa')}
            className="text-slate-500 hover:text-[#00346F] transition-colors pb-3 px-1 whitespace-nowrap text-xs uppercase font-bold tracking-wider"
          >
            Empresa
          </button>
          <button
            onClick={() => setActiveView('marcas')}
            className="text-slate-500 hover:text-[#00346F] transition-colors pb-3 px-1 whitespace-nowrap text-xs uppercase font-bold tracking-wider"
          >
            Marca
          </button>
          <button
            onClick={() => setActiveView('categorias')}
            className="text-slate-500 hover:text-[#00346F] transition-colors pb-3 px-1 whitespace-nowrap text-xs uppercase font-bold tracking-wider"
          >
            Categorías
          </button>
          <button
            onClick={() => setActiveView('productos')}
            className="text-slate-500 hover:text-[#00346F] transition-colors pb-3 px-1 whitespace-nowrap text-xs uppercase font-bold tracking-wider"
          >
            Productos
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto">
        {/* Quick Actions matching Screenshot */}
        <div className="flex flex-wrap items-center gap-3.5 mb-8">
          <button
            onClick={() => onOpenNewInvoice()}
            className="bg-[#00346F] hover:bg-[#004A99] text-white px-5 py-2.5 rounded-lg shadow-sm font-semibold text-sm flex items-center gap-2 transition-all active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            Emitir Comprobante
          </button>

          <button
            onClick={() => onOpenNewInvoice('FACTURA')}
            className="bg-white border border-slate-300 hover:border-[#00346F] text-[#00346F] hover:bg-slate-50 px-5 py-2.5 rounded-lg shadow-xs font-semibold text-sm flex items-center gap-2 transition-all"
          >
            <Receipt className="w-4 h-4" />
            Nueva Factura
          </button>

          <button
            onClick={handleDownloadReport}
            className="bg-white border border-slate-300 hover:border-[#00346F] text-[#00346F] hover:bg-slate-50 px-5 py-2.5 rounded-lg shadow-xs font-semibold text-sm flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" />
            Descargar Reporte Mensual
          </button>
        </div>

        {/* Summary KPI Cards Grid matching Screenshot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Card 1: Ventas del Mes */}
          <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Ventas del Mes
                </p>
                <h3 className="text-2xl lg:text-3xl font-extrabold text-[#0B1C30] tracking-tight">
                  S/ {totalVentasMes.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="p-3 bg-[#EFF4FF] rounded-full text-[#00346F]">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center text-emerald-600 font-semibold text-xs">
              <ArrowUpRight className="w-4 h-4 mr-1" />
              <span>+12.5% vs mes anterior</span>
            </div>
          </div>

          {/* Card 2: Comprobantes Emitidos */}
          <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Comprobantes Emitidos
                </p>
                <h3 className="text-2xl lg:text-3xl font-extrabold text-[#0B1C30] tracking-tight">
                  {countTotal.toLocaleString('es-PE')}
                </h3>
              </div>
              <div className="p-3 bg-[#EFF4FF] rounded-full text-[#00346F]">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center text-slate-600 font-medium text-xs">
              <span>{countFacturas} Facturas / {countBoletas} Boletas</span>
            </div>
          </div>

          {/* Card 3: Por Cobrar */}
          <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Por Cobrar (Pendientes)
                </p>
                <h3 className="text-2xl lg:text-3xl font-extrabold text-[#0B1C30] tracking-tight">
                  S/ {porCobrar.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="p-3 bg-red-50 rounded-full text-red-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center text-red-600 font-semibold text-xs">
              <AlertTriangle className="w-4 h-4 mr-1" />
              <span>15 documentos vencidos</span>
            </div>
          </div>

          {/* Card 4: Estado SUNAT */}
          <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Estado SUNAT
                </p>
                <h3 className="text-2xl lg:text-3xl font-extrabold text-[#0B1C30] tracking-tight">
                  {empresa.estadoSunat === 'CONECTADO' ? 'Conectado' : 'Mantenimiento'}
                </h3>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full text-emerald-700">
                <CloudCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center text-emerald-700 font-semibold text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-ping"></span>
              <span>Última sinc. hace 5 min</span>
            </div>
          </div>
        </div>

        {/* Recent Invoices Table Area matching Screenshot */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#F8F9FF]">
            <h3 className="text-base font-bold text-[#0B1C30]">
              Últimos Comprobantes Emitidos
            </h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filtrar por serie/cliente..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#00346F]"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              </div>
              <button
                onClick={() => setFilterQuery('')}
                className="text-xs font-semibold text-[#00346F] hover:underline flex items-center gap-1"
              >
                Ver todos
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="bg-[#EFF4FF] text-slate-600 uppercase font-bold tracking-wider border-b border-slate-200 text-[11px]">
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Comprobante</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-center">SUNAT</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredComprobantes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No se encontraron comprobantes con el criterio de búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredComprobantes.map((comp, idx) => (
                    <tr
                      key={comp.id}
                      className={`hover:bg-[#F1F5F9] transition-colors ${
                        idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'
                      }`}
                    >
                      <td className="py-3 px-4 font-medium text-slate-600">{comp.fechaEmision}</td>
                      <td className="py-3 px-4 font-bold text-[#00346F]">
                        {comp.serie}-{comp.numero}
                      </td>
                      <td className="py-3 px-4 font-medium">
                        <div className="font-semibold text-slate-800">{comp.clienteNombre}</div>
                        <div className="text-[10px] text-slate-500">{comp.clienteDocumento}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                        S/{' '}
                        {comp.total.toLocaleString('es-PE', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            comp.estado === 'PAGADO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : comp.estado === 'PENDIENTE'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {comp.estado === 'PAGADO'
                            ? 'Pagado'
                            : comp.estado === 'PENDIENTE'
                            ? 'Pendiente'
                            : 'Anulado'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {comp.estadoSunat === 'ACEPTADO' ? (
                          <span className="inline-flex items-center text-emerald-600" title="CDR Aceptado por SUNAT">
                            <CheckCircle2 className="w-4 h-4" />
                          </span>
                        ) : comp.estadoSunat === 'RECHAZADO' ? (
                          <span className="inline-flex items-center text-red-600" title="Rechazado por SUNAT">
                            <XCircle className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-amber-500" title="Pendiente de envío">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onViewInvoiceDetail(comp)}
                            className="p-1 text-slate-500 hover:text-[#00346F] hover:bg-slate-200 rounded transition-colors"
                            title="Ver Detalle y Factura Electrónica"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onViewInvoiceDetail(comp)}
                            className="p-1 text-slate-500 hover:text-[#00346F] hover:bg-slate-200 rounded transition-colors"
                            title="Descargar PDF / XML SUNAT"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer matching screenshot */}
      <footer className="mt-auto border-t border-slate-200 bg-[#EFF4FF] py-3.5 px-6 flex flex-col sm:flex-row justify-between items-center text-slate-600 text-xs gap-2">
        <p className="font-medium">
          © 2024 MG SOLUTIONS GROUP S.A.C. - RUC: {empresa.ruc}
        </p>
        <div className="flex flex-wrap gap-4 text-slate-500 text-[11px]">
          <span>Dirección: {empresa.direccionFiscal.slice(0, 35)}...</span>
          <span>Email: {empresa.email}</span>
        </div>
      </footer>
    </div>
  );
};
