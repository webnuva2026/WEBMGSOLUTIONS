import React, { useState } from 'react';
import {
  X,
  Receipt,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Search,
  Building,
  User,
  CreditCard,
  Printer,
  Sparkles,
} from 'lucide-react';
import {
  Cliente,
  Producto,
  Comprobante,
  DetalleComprobante,
  TipoComprobante,
} from '../types';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientes: Cliente[];
  productos: Producto[];
  initialType?: TipoComprobante;
  onEmitInvoice: (invoice: Comprobante) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  clientes,
  productos,
  initialType = 'FACTURA',
  onEmitInvoice,
  onShowToast,
}) => {
  const [tipo, setTipo] = useState<TipoComprobante>(initialType);
  const [serie, setSerie] = useState(initialType === 'FACTURA' ? 'F001' : 'B001');
  const [clienteId, setClienteId] = useState<number>(clientes[0]?.id || 1);
  const [formaPago, setFormaPago] = useState<'CONTADO' | 'CREDITO'>('CONTADO');
  const [observaciones, setObservaciones] = useState('');

  // Items
  const [items, setItems] = useState<
    Array<{
      productoId: number;
      cantidad: number;
      precioUnitario: number;
    }>
  >([
    {
      productoId: productos[0]?.id || 1,
      cantidad: 1,
      precioUnitario: productos[0]?.precioUnitario || 35.0,
    },
  ]);

  if (!isOpen) return null;

  const selectedCliente = clientes.find((c) => c.id === Number(clienteId));
  const isClienteInactivo = selectedCliente?.estado === 'INACTIVO';

  const handleTipoChange = (newTipo: TipoComprobante) => {
    setTipo(newTipo);
    setSerie(newTipo === 'FACTURA' ? 'F001' : newTipo === 'BOLETA' ? 'B001' : 'NC01');
  };

  const handleAddItem = () => {
    // Pick the first available active product
    const firstActive = productos.find((p) => p.estado === 'ACTIVO') || productos[0];
    setItems([
      ...items,
      {
        productoId: firstActive?.id || 1,
        cantidad: 1,
        precioUnitario: firstActive?.precioUnitario || 50,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      onShowToast('Mínimo 1 producto', 'El comprobante debe tener al menos 1 producto.', 'warning');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, newProdId: number) => {
    const prod = productos.find((p) => p.id === newProdId);
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      productoId: newProdId,
      precioUnitario: prod?.precioUnitario || 0,
    };
    setItems(updated);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const updated = [...items];
    updated[index].cantidad = Math.max(1, qty);
    setItems(updated);
  };

  // Calculations
  const calculatedDetails: DetalleComprobante[] = items.map((item, idx) => {
    const prod = productos.find((p) => p.id === item.productoId);
    const totalItem = item.cantidad * item.precioUnitario;
    const subtotalItem = totalItem / 1.18;
    const igvItem = totalItem - subtotalItem;

    return {
      id: `item-${idx}-${Date.now()}`,
      productoId: item.productoId,
      codigo: prod?.codigo || 'PROD',
      descripcion: prod?.nombre || 'Producto',
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
      subtotal: parseFloat(subtotalItem.toFixed(2)),
      igv: parseFloat(igvItem.toFixed(2)),
      total: parseFloat(totalItem.toFixed(2)),
    };
  });

  const totalComprobante = calculatedDetails.reduce((acc, d) => acc + d.total, 0);
  const subtotalNeto = totalComprobante / 1.18;
  const totalIgv = totalComprobante - subtotalNeto;

  // Validation for Inactive Products
  const hasInactiveProducts = items.some((item) => {
    const prod = productos.find((p) => p.id === item.productoId);
    return prod?.estado === 'INACTIVO';
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validar Cliente Activo
    if (isClienteInactivo) {
      onShowToast(
        'Emisión Bloqueada',
        `El cliente '${selectedCliente?.razonSocial}' tiene estado INACTIVO. Cambie el estado del cliente a ACTIVO para poder facturar.`,
        'error'
      );
      return;
    }

    // 2. Validar Productos Activos
    if (hasInactiveProducts) {
      onShowToast(
        'Productos Inactivos',
        'Uno o más productos en el detalle están INACTIVOS. Elimínelos o actívelos en el Almacén antes de emitir.',
        'error'
      );
      return;
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newInvoice: Comprobante = {
      id: Date.now(),
      tipo,
      serie,
      numero: String(randomNum).padStart(6, '0'),
      fechaEmision: new Date().toLocaleDateString('es-PE'),
      clienteId: selectedCliente?.id || 1,
      clienteDocumento: selectedCliente?.numeroDocumento || '20000000001',
      clienteNombre: selectedCliente?.razonSocial || 'CLIENTE GENERAL',
      moneda: 'PEN',
      subtotal: parseFloat(subtotalNeto.toFixed(2)),
      igv: parseFloat(totalIgv.toFixed(2)),
      total: parseFloat(totalComprobante.toFixed(2)),
      estado: 'PAGADO',
      estadoSunat: 'ACEPTADO',
      formaPago,
      observaciones,
      hashCdr: `hash_${Math.random().toString(36).slice(2, 11)}_sunat_ok`,
      detalles: calculatedDetails,
    };

    onEmitInvoice(newInvoice);
    onClose();
    onShowToast(
      'Comprobante Emitido',
      `Se generó exitosamente ${tipo} ${serie}-${newInvoice.numero} con respuesta SUNAT Aceptada.`,
      'success'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-[#00346F] text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold">Emisión de Comprobante Electrónico (CPE SUNAT)</h3>
              <p className="text-[11px] text-blue-200">
                UBL 2.1 • Validación en tiempo real de estados de Clientes y Productos
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6 text-xs bg-[#F8F9FF]">
          {/* Validation Warnings */}
          {isClienteInactivo && (
            <div className="p-3.5 bg-red-50 border border-red-300 rounded-xl text-red-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Cliente Inactivo Detectado:</span>
                <span>
                  El cliente seleccionado (<strong>{selectedCliente?.razonSocial}</strong>) está marcado como{' '}
                  <strong>INACTIVO</strong>. Las normativas del ERP bloquean la emisión de documentos para evitar errores comerciales.
                </span>
              </div>
            </div>
          )}

          {hasInactiveProducts && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Alerta de Producto Inactivo:</span>
                <span>
                  Hay productos marcados como <strong>INACTIVOS</strong> en el detalle. No es posible emitir comprobantes con ítems descontinuados.
                </span>
              </div>
            </div>
          )}

          {/* Row 1: Tipo & Serie & Pago */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tipo de Comprobante *
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleTipoChange('FACTURA')}
                  className={`flex-1 py-2 px-3 rounded-lg font-bold border transition-all ${
                    tipo === 'FACTURA'
                      ? 'bg-[#00346F] text-white border-[#00346F]'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Factura (F001)
                </button>
                <button
                  type="button"
                  onClick={() => handleTipoChange('BOLETA')}
                  className={`flex-1 py-2 px-3 rounded-lg font-bold border transition-all ${
                    tipo === 'BOLETA'
                      ? 'bg-[#00346F] text-white border-[#00346F]'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Boleta (B001)
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Forma de Pago
              </label>
              <select
                value={formaPago}
                onChange={(e) => setFormaPago(e.target.value as any)}
                className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-[#00346F]"
              >
                <option value="CONTADO">Contado (Efectivo / Transferencia)</option>
                <option value="CREDITO">Crédito (30 días)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Moneda & IGV
              </label>
              <div className="py-2 px-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-semibold flex justify-between">
                <span>SOLES (PEN)</span>
                <span className="text-emerald-700">IGV 18% Incluido</span>
              </div>
            </div>
          </div>

          {/* Row 2: Cliente Selector */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Cliente Receptor (RUC / DNI) *
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={clienteId}
                onChange={(e) => setClienteId(Number(e.target.value))}
                className={`flex-1 p-2.5 rounded-lg border font-medium focus:outline-none ${
                  isClienteInactivo
                    ? 'border-red-300 bg-red-50 text-red-900'
                    : 'border-slate-300 bg-white text-slate-900 focus:border-[#00346F]'
                }`}
              >
                {clientes.map((cli) => (
                  <option key={cli.id} value={cli.id}>
                    [{cli.tipoDocumento} {cli.numeroDocumento}] {cli.razonSocial}{' '}
                    {cli.estado === 'INACTIVO' ? '(ESTADO INACTIVO - BLOQUEADO)' : '(ACTIVO)'}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-2 rounded-lg font-bold text-[11px] ${
                    selectedCliente?.estado === 'ACTIVO'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}
                >
                  Estado: {selectedCliente?.estado}
                </span>
              </div>
            </div>
            {selectedCliente && (
              <p className="text-[11px] text-slate-500 mt-2">
                Dirección Fiscal: {selectedCliente.direccionFiscal} • Email: {selectedCliente.email || 'Sin email'}
              </p>
            )}
          </div>

          {/* Row 3: Items Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3.5 bg-[#EFF4FF] border-b border-slate-200 flex justify-between items-center">
              <span className="font-bold text-slate-800">Detalle de Productos y Servicios</span>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 bg-[#00346F] hover:bg-[#004A99] text-white rounded-lg font-semibold flex items-center gap-1 text-[11px]"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar Producto
              </button>
            </div>

            <div className="p-3.5 space-y-3">
              {items.map((item, idx) => {
                const prod = productos.find((p) => p.id === item.productoId);
                const isInactive = prod?.estado === 'INACTIVO';

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border flex flex-col sm:flex-row items-center gap-3 transition-colors ${
                      isInactive ? 'bg-red-50/70 border-red-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {/* Product Select */}
                    <div className="flex-1 w-full">
                      <select
                        value={item.productoId}
                        onChange={(e) => handleProductChange(idx, Number(e.target.value))}
                        className={`w-full p-2 rounded-lg border bg-white text-xs ${
                          isInactive ? 'border-red-400 text-red-900 font-semibold' : 'border-slate-300'
                        }`}
                      >
                        {productos.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.codigo}] {p.nombre} - S/ {p.precioUnitario.toFixed(2)}{' '}
                            {p.estado === 'INACTIVO' ? '(INACTIVO)' : ''}
                          </option>
                        ))}
                      </select>
                      {isInactive && (
                        <span className="text-[10px] text-red-600 font-bold block mt-1">
                          ⚠️ Producto INACTIVO: Desactive o cámbielo para continuar.
                        </span>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="w-24">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Cant.
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.cantidad}
                        onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value) || 1)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-center font-bold"
                      />
                    </div>

                    {/* Price */}
                    <div className="w-28 text-right font-mono">
                      <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">
                        Unitario (S/)
                      </span>
                      <span className="font-bold text-slate-800">S/ {item.precioUnitario.toFixed(2)}</span>
                    </div>

                    {/* Total Item */}
                    <div className="w-28 text-right font-mono">
                      <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">
                        Total (S/)
                      </span>
                      <span className="font-bold text-[#00346F]">
                        S/ {(item.cantidad * item.precioUnitario).toFixed(2)}
                      </span>
                    </div>

                    {/* Delete item */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                      title="Eliminar fila"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Subtotals & Total Summary */}
            <div className="p-4 bg-[#EFF4FF] border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-slate-600 text-[11px] max-w-sm">
                * Todos los precios incluyen el 18% del Impuesto General a las Ventas (IGV) reglamentario de SUNAT.
              </div>

              <div className="space-y-1 text-right min-w-[220px]">
                <div className="flex justify-between text-slate-600">
                  <span>Op. Gravadas (Subtotal):</span>
                  <span className="font-mono font-semibold">S/ {subtotalNeto.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>I.G.V. (18%):</span>
                  <span className="font-mono font-semibold">S/ {totalIgv.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-[#00346F] pt-1 border-t border-slate-300">
                  <span>IMPORTE TOTAL:</span>
                  <span className="font-mono text-base">S/ {totalComprobante.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold text-xs"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isClienteInactivo || hasInactiveProducts}
            className={`px-6 py-2.5 rounded-lg text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all ${
              isClienteInactivo || hasInactiveProducts
                ? 'bg-slate-400 cursor-not-allowed opacity-75'
                : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Firmar y Emitir a SUNAT
          </button>
        </div>
      </div>
    </div>
  );
};
