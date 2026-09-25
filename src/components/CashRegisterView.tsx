import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Plus,
  Minus,
  Lock,
  Unlock,
  Printer,
  History,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Banknote,
  QrCode,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Store,
  Receipt,
  Wrench,
  Search,
  X,
} from 'lucide-react';
import {
  CajaTurno,
  MovimientoCaja,
  Usuario,
  Sucursal,
  MetodoPago,
} from '../types';

interface CashRegisterViewProps {
  currentUser: Usuario;
  sucursales: Sucursal[];
  cajasTurnos: CajaTurno[];
  movimientosCaja: MovimientoCaja[];
  onAbrirCaja: (montoApertura: number, sucursal: string, observaciones?: string) => void;
  onCerrarCaja: (cajaId: number, montoEfectivoReal: number, observaciones?: string) => void;
  onRegistrarMovimientoCaja: (mov: Omit<MovimientoCaja, 'id' | 'cajaTurnoId' | 'fecha' | 'registradoPor'>) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  readOnly?: boolean;
}

export const CashRegisterView: React.FC<CashRegisterViewProps> = ({
  currentUser,
  sucursales,
  cajasTurnos,
  movimientosCaja,
  onAbrirCaja,
  onCerrarCaja,
  onRegistrarMovimientoCaja,
  onShowToast,
  readOnly = false,
}) => {
  const [activeTab, setActiveTab] = useState<'turno_actual' | 'movimientos' | 'historial'>('turno_actual');

  // Modal states
  const [isAperturaModalOpen, setIsAperturaModalOpen] = useState(false);
  const [isCierreModalOpen, setIsCierreModalOpen] = useState(false);
  const [isMovimientoModalOpen, setIsMovimientoModalOpen] = useState(false);
  const [movimientoTipo, setMovimientoTipo] = useState<'INGRESO' | 'EGRESO'>('EGRESO');

  // Form states
  const [aperturaMonto, setAperturaMonto] = useState<string>('200.00');
  const [aperturaSede, setAperturaSede] = useState<string>(sucursales[0]?.nombre || 'Principal - Chiclayo Centro');
  const [aperturaNotas, setAperturaNotas] = useState('');

  const [cierreEfectivoReal, setCierreEfectivoReal] = useState<string>('');
  const [cierreNotas, setCierreNotas] = useState('');

  const [movConcepto, setMovConcepto] = useState('');
  const [movMonto, setMovMonto] = useState('');
  const [movMetodoPago, setMovMetodoPago] = useState<MetodoPago>('EFECTIVO');
  const [movCategoria, setMovCategoria] = useState<any>('GASTO_OPERATIVO');

  // Filters
  const [movSearch, setMovSearch] = useState('');
  const [movFilterTipo, setMovFilterTipo] = useState<'ALL' | 'INGRESO' | 'EGRESO'>('ALL');

  // Current open box shift (the most recent open shift for current user's branch or general)
  const currentOpenShift = useMemo(() => {
    return cajasTurnos.find((c) => c.estado === 'ABIERTA') || null;
  }, [cajasTurnos]);

  // Movements of current open shift
  const currentShiftMovements = useMemo(() => {
    if (!currentOpenShift) return [];
    return movimientosCaja.filter((m) => m.cajaTurnoId === currentOpenShift.id);
  }, [movimientosCaja, currentOpenShift]);

  // Live calculation of current shift numbers
  const liveShiftStats = useMemo(() => {
    if (!currentOpenShift) {
      return {
        montoApertura: 0,
        ingresosEfectivo: 0,
        ingresosDigitales: 0,
        egresosEfectivo: 0,
        saldoEfectivoEsperado: 0,
        totalVentas: 0,
      };
    }

    const ingresosEfectivo = currentShiftMovements
      .filter((m) => m.tipo === 'INGRESO' && m.metodoPago === 'EFECTIVO')
      .reduce((sum, m) => sum + m.monto, 0);

    const ingresosDigitales = currentShiftMovements
      .filter((m) => m.tipo === 'INGRESO' && m.metodoPago !== 'EFECTIVO')
      .reduce((sum, m) => sum + m.monto, 0);

    const egresosEfectivo = currentShiftMovements
      .filter((m) => m.tipo === 'EGRESO')
      .reduce((sum, m) => sum + m.monto, 0);

    const saldoEfectivoEsperado = currentOpenShift.montoApertura + ingresosEfectivo - egresosEfectivo;

    return {
      montoApertura: currentOpenShift.montoApertura,
      ingresosEfectivo,
      ingresosDigitales,
      egresosEfectivo,
      saldoEfectivoEsperado,
      totalVentas: ingresosEfectivo + ingresosDigitales,
    };
  }, [currentOpenShift, currentShiftMovements]);

  // Handlers
  const handleOpenApertura = () => {
    setAperturaMonto('200.00');
    setAperturaNotas('');
    setIsAperturaModalOpen(true);
  };

  const handleConfirmApertura = (e: React.FormEvent) => {
    e.preventDefault();
    const monto = parseFloat(aperturaMonto);
    if (isNaN(monto) || monto < 0) {
      onShowToast('Monto inválido', 'El monto de apertura en efectivo debe ser mayor o igual a 0.', 'error');
      return;
    }
    onAbrirCaja(monto, aperturaSede, aperturaNotas);
    setIsAperturaModalOpen(false);
  };

  const handleOpenCierre = () => {
    if (!currentOpenShift) return;
    setCierreEfectivoReal(liveShiftStats.saldoEfectivoEsperado.toFixed(2));
    setCierreNotas('');
    setIsCierreModalOpen(true);
  };

  const handleConfirmCierre = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOpenShift) return;
    const real = parseFloat(cierreEfectivoReal);
    if (isNaN(real) || real < 0) {
      onShowToast('Monto inválido', 'Ingresa el monto de efectivo físico contado.', 'error');
      return;
    }
    onCerrarCaja(currentOpenShift.id, real, cierreNotas);
    setIsCierreModalOpen(false);
  };

  const handleOpenMovimientoModal = (tipo: 'INGRESO' | 'EGRESO') => {
    setMovimientoTipo(tipo);
    setMovConcepto('');
    setMovMonto('');
    setMovMetodoPago('EFECTIVO');
    setMovCategoria(tipo === 'EGRESO' ? 'GASTO_OPERATIVO' : 'OTRO');
    setIsMovimientoModalOpen(true);
  };

  const handleConfirmMovimiento = (e: React.FormEvent) => {
    e.preventDefault();
    const monto = parseFloat(movMonto);
    if (!movConcepto.trim()) {
      onShowToast('Concepto requerido', 'Ingresa una descripción para el movimiento.', 'error');
      return;
    }
    if (isNaN(monto) || monto <= 0) {
      onShowToast('Monto inválido', 'El monto debe ser mayor a 0.', 'error');
      return;
    }

    onRegistrarMovimientoCaja({
      tipo: movimientoTipo,
      concepto: movConcepto.trim(),
      categoria: movCategoria,
      monto,
      metodoPago: movMetodoPago,
    });

    setIsMovimientoModalOpen(false);
    onShowToast(
      movimientoTipo === 'INGRESO' ? 'Ingreso Registrado' : 'Egreso Registrado',
      `Se registró ${movimientoTipo.toLowerCase()} por S/ ${monto.toFixed(2)} en caja.`,
      'success'
    );
  };

  // Filtered movements for all history
  const filteredMovimientos = useMemo(() => {
    return movimientosCaja.filter((m) => {
      const matchSearch =
        !movSearch ||
        m.concepto.toLowerCase().includes(movSearch.toLowerCase()) ||
        m.registradoPor.toLowerCase().includes(movSearch.toLowerCase()) ||
        (m.referenciaCodigo && m.referenciaCodigo.toLowerCase().includes(movSearch.toLowerCase()));

      const matchTipo = movFilterTipo === 'ALL' || m.tipo === movFilterTipo;
      return matchSearch && matchTipo;
    });
  }, [movimientosCaja, movSearch, movFilterTipo]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8F9FF] p-5 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                <DollarSign className="h-3.5 w-3.5" />
                Control de Caja Chica & Finanzas
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  currentOpenShift
                    ? 'bg-blue-100 text-[#00346F]'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {currentOpenShift ? (
                  <>
                    <Unlock className="h-3 w-3" /> Turno Abierto ({currentOpenShift.sucursal})
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3" /> Caja Cerrada
                  </>
                )}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-[#0B1C30] md:text-3xl">
              Arqueo de Caja & Movimientos Diarios
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Control en tiempo real de cobros en efectivo, transferencias Yape/Plin, adelantos de taller y gastos menores.
            </p>
          </div>

          {/* Action and Tab buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl bg-slate-200/70 p-1">
              <button
                onClick={() => setActiveTab('turno_actual')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  activeTab === 'turno_actual'
                    ? 'bg-white text-[#00346F] shadow-xs'
                    : 'text-slate-600 hover:text-[#00346F]'
                }`}
              >
                <DollarSign className="h-4 w-4" />
                Turno Actual
              </button>
              <button
                onClick={() => setActiveTab('movimientos')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  activeTab === 'movimientos'
                    ? 'bg-white text-[#00346F] shadow-xs'
                    : 'text-slate-600 hover:text-[#00346F]'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                Movimientos ({movimientosCaja.length})
              </button>
              <button
                onClick={() => setActiveTab('historial')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  activeTab === 'historial'
                    ? 'bg-white text-[#00346F] shadow-xs'
                    : 'text-slate-600 hover:text-[#00346F]'
                }`}
              >
                <History className="h-4 w-4" />
                Historial Turnos
              </button>
            </div>
          </div>
        </div>

        {/* --- TAB 1: TURNO ACTUAL --- */}
        {activeTab === 'turno_actual' && (
          <div className="space-y-6">
            {/* Status Banner */}
            {!currentOpenShift ? (
              <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-6 sm:flex-row">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
                    <Lock className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-amber-950">No hay turno de caja abierto actualmente</h2>
                    <p className="text-xs text-amber-800">
                      Para registrar ventas en efectivo y gastos menores, es necesario abrir un nuevo turno de caja con el fondo inicial.
                    </p>
                  </div>
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={handleOpenApertura}
                    className="flex items-center gap-2 rounded-xl bg-[#00346F] px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-[#004A99]"
                  >
                    <Unlock className="h-4 w-4" />
                    Abrir Turno de Caja
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-blue-200 bg-[#EFF4FF] p-5 sm:flex-row">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00346F] text-white">
                    <Unlock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#00346F]">
                      Turno Abierto #{currentOpenShift.id} - {currentOpenShift.sucursal}
                    </p>
                    <p className="text-xs text-slate-600">
                      Iniciado el {currentOpenShift.fechaApertura} por <strong>{currentOpenShift.abiertaPor}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenMovimientoModal('INGRESO')}
                    className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-700 shadow-xs hover:bg-emerald-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Ingreso Extra
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenMovimientoModal('EGRESO')}
                    className="flex items-center gap-1.5 rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-bold text-rose-700 shadow-xs hover:bg-rose-50"
                  >
                    <Minus className="h-3.5 w-3.5" />
                    Egreso Caja Chica
                  </button>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={handleOpenCierre}
                      className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-black"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      Arqueo & Cierre de Caja
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Saldo Efectivo Esperado en Caja */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Efectivo en Gaveta
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Banknote className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-2 text-3xl font-black text-emerald-600">
                  S/ {liveShiftStats.saldoEfectivoEsperado.toFixed(2)}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Fondo Inicial (S/ {liveShiftStats.montoApertura.toFixed(2)}) + Cobros en Efectivo
                </p>
              </div>

              {/* Cobros Digitales (Yape / Tarjetas) */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Digital (Yape/Tarjetas)
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                    <QrCode className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-2 text-3xl font-black text-purple-700">
                  S/ {liveShiftStats.ingresosDigitales.toFixed(2)}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  En cuentas bancarias / billeteras digitales
                </p>
              </div>

              {/* Egresos de Caja Chica */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Egresos / Gastos
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                    <TrendingDown className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-2 text-3xl font-black text-rose-600">
                  S/ {liveShiftStats.egresosEfectivo.toFixed(2)}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Gastos operativos menores de mostrador
                </p>
              </div>

              {/* Total Facturado en el Turno */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Total Facturado
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[#00346F]">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-2 text-3xl font-black text-[#00346F]">
                  S/ {liveShiftStats.totalVentas.toFixed(2)}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Ventas POS + Liquidaciones de Taller
                </p>
              </div>
            </div>

            {/* Current Shift Table */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-5 py-4">
                <div>
                  <h2 className="text-sm font-bold text-[#0B1C30]">Movimientos del Turno Vigente</h2>
                  <p className="text-[11px] text-slate-500">
                    {currentShiftMovements.length} transacciones registradas durante este turno
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Imprimir Arqueo Rápido
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="px-5 py-3">Hora</th>
                      <th className="px-5 py-3">Tipo</th>
                      <th className="px-5 py-3">Concepto / Motivo</th>
                      <th className="px-5 py-3">Método</th>
                      <th className="px-5 py-3">Referencia</th>
                      <th className="px-5 py-3">Responsable</th>
                      <th className="px-5 py-3 text-right">Monto (S/)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {currentShiftMovements.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Aún no se han registrado cobros ni gastos en este turno.
                        </td>
                      </tr>
                    ) : (
                      currentShiftMovements.map((mov) => {
                        const isIngreso = mov.tipo === 'INGRESO';
                        return (
                          <tr key={mov.id} className="hover:bg-slate-50/70">
                            <td className="px-5 py-3 font-mono text-slate-500">
                              {mov.fecha.split(' ')[1] || mov.fecha}
                            </td>
                            <td className="px-5 py-3">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  isIngreso
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {mov.tipo}
                              </span>
                            </td>
                            <td className="px-5 py-3 font-medium text-slate-800">{mov.concepto}</td>
                            <td className="px-5 py-3">
                              <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                                {mov.metodoPago}
                              </span>
                            </td>
                            <td className="px-5 py-3 font-mono text-[11px] text-blue-800">
                              {mov.referenciaCodigo || '-'}
                            </td>
                            <td className="px-5 py-3 text-slate-600">{mov.registradoPor}</td>
                            <td className="px-5 py-3 text-right font-black">
                              <span className={isIngreso ? 'text-emerald-700' : 'text-rose-700'}>
                                {isIngreso ? '+' : '-'} S/ {mov.monto.toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 2: TODOS LOS MOVIMIENTOS HISTÓRICOS --- */}
        {activeTab === 'movimientos' && (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={movSearch}
                  onChange={(e) => setMovSearch(e.target.value)}
                  placeholder="Buscar por concepto, comprobante de referencia o usuario..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#00346F] focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={movFilterTipo}
                  onChange={(e) => setMovFilterTipo(e.target.value as any)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="ALL">Todos los Movimientos</option>
                  <option value="INGRESO">Solo Ingresos (+)</option>
                  <option value="EGRESO">Solo Egresos (-)</option>
                </select>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase text-slate-500 text-[10px]">
                    <tr>
                      <th className="px-5 py-3">Fecha y Hora</th>
                      <th className="px-5 py-3">Turno</th>
                      <th className="px-5 py-3">Tipo</th>
                      <th className="px-5 py-3">Concepto</th>
                      <th className="px-5 py-3">Medio de Pago</th>
                      <th className="px-5 py-3">Referencia</th>
                      <th className="px-5 py-3 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMovimientos.map((m) => {
                      const isIngreso = m.tipo === 'INGRESO';
                      return (
                        <tr key={m.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3 text-slate-600">{m.fecha}</td>
                          <td className="px-5 py-3 font-semibold text-slate-800">#{m.cajaTurnoId}</td>
                          <td className="px-5 py-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                isIngreso ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {m.tipo}
                            </span>
                          </td>
                          <td className="px-5 py-3 font-medium text-slate-800">{m.concepto}</td>
                          <td className="px-5 py-3">{m.metodoPago}</td>
                          <td className="px-5 py-3 font-mono text-blue-700">{m.referenciaCodigo || '-'}</td>
                          <td className="px-5 py-3 text-right font-black">
                            <span className={isIngreso ? 'text-emerald-700' : 'text-rose-700'}>
                              {isIngreso ? '+' : '-'} S/ {m.monto.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 3: HISTORIAL DE TURNOS --- */}
        {activeTab === 'historial' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-5 py-3">N° Turno</th>
                    <th className="px-5 py-3">Sede</th>
                    <th className="px-5 py-3">Apertura</th>
                    <th className="px-5 py-3">Cierre</th>
                    <th className="px-5 py-3">Fondo Inicial</th>
                    <th className="px-5 py-3">Efectivo Ingresado</th>
                    <th className="px-5 py-3">Egresos</th>
                    <th className="px-5 py-3">Saldo Esperado</th>
                    <th className="px-5 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cajasTurnos.map((turno) => (
                    <tr key={turno.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-bold text-[#00346F]">Turno #{turno.id}</td>
                      <td className="px-5 py-3">{turno.sucursal}</td>
                      <td className="px-5 py-3 text-slate-600">{turno.fechaApertura}</td>
                      <td className="px-5 py-3 text-slate-600">{turno.fechaCierre || 'En curso'}</td>
                      <td className="px-5 py-3 font-semibold">S/ {turno.montoApertura.toFixed(2)}</td>
                      <td className="px-5 py-3 text-emerald-700 font-semibold">+ S/ {turno.totalIngresosEfectivo.toFixed(2)}</td>
                      <td className="px-5 py-3 text-rose-700 font-semibold">- S/ {turno.totalEgresos.toFixed(2)}</td>
                      <td className="px-5 py-3 font-black text-slate-900">S/ {turno.saldoEsperado.toFixed(2)}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            turno.estado === 'ABIERTA' ? 'bg-blue-100 text-[#00346F]' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {turno.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL APERTURA DE CAJA --- */}
      {isAperturaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => setIsAperturaModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Unlock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#0B1C30]">Apertura de Turno de Caja</h3>
                <p className="text-xs text-slate-500">Inicia el turno para registrar ventas y taller</p>
              </div>
            </div>

            <form onSubmit={handleConfirmApertura} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700">Sede Operativa</label>
                <select
                  value={aperturaSede}
                  onChange={(e) => setAperturaSede(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#00346F]"
                >
                  {sucursales.map((s) => (
                    <option key={s.id} value={s.nombre}>{s.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Fondo Inicial en Efectivo (S/)</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">S/</span>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    value={aperturaMonto}
                    onChange={(e) => setAperturaMonto(e.target.value)}
                    placeholder="200.00"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm font-black text-slate-800 outline-none focus:border-[#00346F]"
                    required
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Monto para vuelto en billetes y monedas.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Observaciones</label>
                <textarea
                  rows={2}
                  value={aperturaNotas}
                  onChange={(e) => setAperturaNotas(e.target.value)}
                  placeholder="Ej. Billetes de 20 y 10 soles, monedas de 5 y 2..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAperturaModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#00346F] px-5 py-2 text-xs font-bold text-white hover:bg-[#004A99]"
                >
                  Confirmar Apertura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL CIERRE DE CAJA / ARQUEO --- */}
      {isCierreModalOpen && currentOpenShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => setIsCierreModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#0B1C30]">Arqueo & Cierre de Caja</h3>
                <p className="text-xs text-slate-500">Turno #{currentOpenShift.id} - {currentOpenShift.sucursal}</p>
              </div>
            </div>

            <form onSubmit={handleConfirmCierre} className="space-y-4">
              <div className="rounded-xl bg-slate-50 p-3.5 space-y-2 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span>Fondo Inicial:</span>
                  <span className="font-semibold">S/ {liveShiftStats.montoApertura.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>(+) Ingresos Efectivo:</span>
                  <span className="font-semibold text-emerald-700">+ S/ {liveShiftStats.ingresosEfectivo.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>(-) Egresos Mostrador:</span>
                  <span className="font-semibold text-rose-700">- S/ {liveShiftStats.egresosEfectivo.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 font-black text-sm text-[#00346F]">
                  <span>Efectivo Teórico Esperado:</span>
                  <span>S/ {liveShiftStats.saldoEfectivoEsperado.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Efectivo Físico Contado en Gaveta (S/)</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">S/</span>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    value={cierreEfectivoReal}
                    onChange={(e) => setCierreEfectivoReal(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm font-black text-slate-800 outline-none focus:border-[#00346F]"
                    required
                  />
                </div>
                {cierreEfectivoReal && (
                  <p className="mt-1 text-xs font-bold">
                    Diferencia: {' '}
                    <span
                      className={
                        parseFloat(cierreEfectivoReal) - liveShiftStats.saldoEfectivoEsperado === 0
                          ? 'text-emerald-600'
                          : parseFloat(cierreEfectivoReal) - liveShiftStats.saldoEfectivoEsperado > 0
                          ? 'text-blue-600'
                          : 'text-rose-600'
                      }
                    >
                      S/ {(parseFloat(cierreEfectivoReal) - liveShiftStats.saldoEfectivoEsperado).toFixed(2)}{' '}
                      {parseFloat(cierreEfectivoReal) - liveShiftStats.saldoEfectivoEsperado === 0
                        ? '(Cuadre exacto)'
                        : parseFloat(cierreEfectivoReal) - liveShiftStats.saldoEfectivoEsperado > 0
                        ? '(Sobrante)'
                        : '(Faltante)'}
                    </span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Observaciones del Cierre</label>
                <textarea
                  rows={2}
                  value={cierreNotas}
                  onChange={(e) => setCierreNotas(e.target.value)}
                  placeholder="Ej. Billetes entregados a gerencia en sobre sellado..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCierreModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-black"
                >
                  Cerrar Turno & Guardar Arqueo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL INGRESO / EGRESO MANUAL --- */}
      {isMovimientoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => setIsMovimientoModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-5 flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  movimientoTipo === 'INGRESO'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-rose-50 text-rose-600'
                }`}
              >
                {movimientoTipo === 'INGRESO' ? <Plus className="h-5 w-5" /> : <Minus className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="text-base font-black text-[#0B1C30]">
                  {movimientoTipo === 'INGRESO' ? 'Registrar Ingreso Extraordinario' : 'Registrar Egreso de Caja Chica'}
                </h3>
                <p className="text-xs text-slate-500">Afecta el saldo en efectivo de la gaveta</p>
              </div>
            </div>

            <form onSubmit={handleConfirmMovimiento} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700">Concepto / Motivo</label>
                <input
                  type="text"
                  value={movConcepto}
                  onChange={(e) => setMovConcepto(e.target.value)}
                  placeholder={
                    movimientoTipo === 'EGRESO'
                      ? 'Ej. Compra de cinta de embalaje y bolsas'
                      : 'Ej. Ingreso por ajuste de sencillo o propina'
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#00346F]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Monto (S/)</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">S/</span>
                    <input
                      type="number"
                      step="0.50"
                      min="0.10"
                      value={movMonto}
                      onChange={(e) => setMovMonto(e.target.value)}
                      placeholder="35.00"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs font-black text-slate-800 outline-none focus:border-[#00346F]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">Medio de Pago</label>
                  <select
                    value={movMetodoPago}
                    onChange={(e) => setMovMetodoPago(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
                  >
                    <option value="EFECTIVO">EFECTIVO</option>
                    <option value="YAPE_PLIN">YAPE / PLIN</option>
                    <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsMovimientoModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`rounded-xl px-5 py-2 text-xs font-bold text-white ${
                    movimientoTipo === 'INGRESO'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Guardar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
