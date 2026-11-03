import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  X,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Laptop,
  User,
  Receipt,
  Clock,
  Save,
  Loader2,
  FileText,
  AlertCircle,
  Printer,
} from 'lucide-react';
import { warrantyService, ResultadoGarantia } from '../services/warranty.service';
import { Usuario } from '../types';

interface WarrantyIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Usuario;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  onConvertToService?: (serie: string, marca?: string, modelo?: string) => void;
  onOrderCreated?: (orden: any) => void;
}

export const WarrantyIntakeModal: React.FC<WarrantyIntakeModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onShowToast,
  onConvertToService,
  onOrderCreated,
}) => {
  const [serieInput, setSerieInput] = useState('');
  const [verificando, setVerificando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoGarantia | null>(null);

  // Formulario de ingreso de garantía
  const [fallaReclamada, setFallaReclamada] = useState('');
  const [observacionesEsteticas, setObservacionesEsteticas] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');

  // Checklist de inspección física (exclusión de garantía)
  const [checklistFisico, setChecklistFisico] = useState({
    pantallaRota: false,
    liquidos: false,
    golpes: false,
    sellosViolados: false,
  });

  const [registrando, setRegistrando] = useState(false);
  const [actaRecepcion, setActaRecepcion] = useState<{
    codigo: string;
    fecha: string;
    cliente: string;
    telefono: string;
    serie: string;
    producto: string;
    marca: string;
    modelo: string;
    falla: string;
    plazo: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleVerificar = async (serieAProbar?: string) => {
    const s = (serieAProbar || serieInput).trim().toUpperCase();
    if (!s) {
      onShowToast('Serie requerida', 'Ingrese el número de serie de la etiqueta.', 'warning');
      return;
    }

    setSerieInput(s);
    setVerificando(true);
    setResultado(null);
    setActaRecepcion(null);

    try {
      const res = await warrantyService.verificarGarantia(s);
      setResultado(res);

      if (res.cliente?.nombre && res.cliente.nombre !== 'Cliente Particular') {
        setClienteNombre(res.cliente.nombre);
      }
      if (res.cliente?.telefono) {
        setClienteTelefono(res.cliente.telefono);
      }
    } catch {
      onShowToast('Error', 'No se pudo conectar con el servicio de garantías.', 'error');
    } finally {
      setVerificando(false);
    }
  };

  const tieneDanoFisico =
    checklistFisico.pantallaRota ||
    checklistFisico.liquidos ||
    checklistFisico.golpes ||
    checklistFisico.sellosViolados;

  const handleSubmitGarantia = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resultado?.encontrado || resultado.estado !== 'VIGENTE') {
      onShowToast('Garantía no válida', 'Solo se puede emitir orden de garantía a equipos con vigencia activa.', 'error');
      return;
    }

    if (tieneDanoFisico) {
      onShowToast(
        'Garantía no procede',
        'El equipo tiene daños físicos marcados. Debe ingresarse como Servicio Técnico con cobro.',
        'warning'
      );
      return;
    }

    if (!fallaReclamada.trim()) {
      onShowToast('Falla requerida', 'Describa el motivo o falla por la que ingresa.', 'warning');
      return;
    }

    setRegistrando(true);
    try {
      const payload = {
        numeroSerie: resultado.serie,
        clienteNombre: clienteNombre.trim() || resultado.cliente?.nombre || 'Titular',
        clienteTelefono: clienteTelefono.trim(),
        clienteDocumento: resultado.cliente?.documento || '',
        marca: resultado.producto?.marca || 'MARCA',
        modelo: resultado.producto?.nombre || 'MODELO',
        fallaReclamada: fallaReclamada.trim(),
        observacionesEsteticas: observacionesEsteticas.trim(),
        checklistFisico,
        usuarioRecibeId: currentUser.id,
      };

      const res = await warrantyService.registrarIngreso(payload);
      if (res.success) {
        onShowToast('Garantía Registrada', res.message, 'success');

        const acta = {
          codigo: res.orden?.codigo || 'GAR-00001',
          fecha: new Date().toLocaleString('es-PE'),
          cliente: clienteNombre.trim() || resultado.cliente?.nombre || 'Titular',
          telefono: clienteTelefono.trim() || resultado.cliente?.telefono || 'N/A',
          serie: resultado.serie,
          producto: resultado.producto?.nombre || 'Equipo Informático',
          marca: resultado.producto?.marca || '',
          modelo: resultado.producto?.modelo || resultado.producto?.nombre || '',
          falla: fallaReclamada.trim(),
          plazo: '3 a 7 días hábiles para diagnóstico y trámite con mayorista',
        };

        setActaRecepcion(acta);

        if (onOrderCreated) {
          onOrderCreated(res.orden || acta);
        }
      } else {
        onShowToast('Error', res.message, 'error');
      }
    } catch {
      onShowToast('Error de conexión', 'No se pudo registrar la orden.', 'error');
    } finally {
      setRegistrando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="p-4 border-b border-slate-200 bg-[#EFF4FF] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00346F] text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#00346F]">
                Módulo de Recepción: Verificación & Ingreso de Garantías
              </h3>
              <p className="text-[11px] text-slate-500">
                Atención en mostrador de equipos vendidos por MG Solutions
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido Modal */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {actaRecepcion ? (
            /* VISTA DE ACTA DE RECEPCIÓN OFICIAL EMITIDA */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="font-extrabold text-emerald-950 text-sm">
                      ¡Orden de Garantía Registrada con Éxito en MySQL!
                    </h4>
                    <p className="text-[11px] text-emerald-800">
                      El equipo ha sido recibido en mostrador a costo S/ 0.00 y derivado al departamento técnico.
                    </p>
                  </div>
                </div>
                <span className="font-mono text-base font-black px-3 py-1 bg-white border border-emerald-300 text-[#00346F] rounded-lg shadow-2xs">
                  {actaRecepcion.codigo}
                </span>
              </div>

              {/* Ficha Formal Imprimible del Acta */}
              <div className="p-5 bg-white border border-slate-300 rounded-xl shadow-xs space-y-3 font-mono text-[11px] text-slate-800">
                <div className="text-center pb-2 border-b border-dashed border-slate-300">
                  <p className="font-black text-sm text-[#00346F]">MG SOLUTIONS GROUP • CONSTANCIA DE INGRESO RMA</p>
                  <p className="text-[10px] text-slate-500">Servicio Técnico Autorizado • Chiclayo, Lambayeque</p>
                  <p className="text-xs font-bold text-slate-900 mt-1">ORDEN DE SERVICIO: {actaRecepcion.codigo}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10.5px] pb-2 border-b border-dashed border-slate-300">
                  <div>
                    <span className="font-bold text-slate-500">FECHA/HORA:</span> {actaRecepcion.fecha}
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">CLIENTE:</span> {actaRecepcion.cliente}
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">TELÉFONO:</span> {actaRecepcion.telefono}
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">MODALIDAD:</span> GARANTÍA OFICIAL (S/ 0.00)
                  </div>
                </div>

                <div className="space-y-1 pb-2 border-b border-dashed border-slate-300 text-[10.5px]">
                  <p><span className="font-bold text-slate-500">EQUIPO:</span> {actaRecepcion.producto}</p>
                  <p><span className="font-bold text-slate-500">N° DE SERIE (S/N):</span> <strong className="text-blue-900">{actaRecepcion.serie}</strong></p>
                  <p><span className="font-bold text-slate-500">FALLA RECLAMADA:</span> {actaRecepcion.falla}</p>
                  <p><span className="font-bold text-slate-500">PLAZO ESTIMADO:</span> {actaRecepcion.plazo}</p>
                  <p><span className="font-bold text-slate-500">ESTADO FÍSICO:</span> Inspección conforme (Sin golpes, sin humedad, sellos íntegros).</p>
                </div>

                <div className="flex justify-between items-center pt-1 text-xs">
                  <span className="font-bold text-slate-700">TOTAL A PAGAR POR EL CLIENTE:</span>
                  <span className="font-black text-sm text-emerald-700">S/ 0.00 (CUBIERTO POR GARANTÍA)</span>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Acta de Recepción</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-[#00346F] hover:bg-[#004A99] text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs"
                >
                  Finalizar y Volver
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* PASO 1: BUSCADOR POR S/N */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Paso 1: Número de Serie (S/N de la Etiqueta) *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={serieInput}
                      onChange={(e) => setSerieInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleVerificar()}
                      placeholder="Escanee o digite el S/N (ej: SN-LEN-2026-VIG)"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 text-xs focus:outline-none focus:border-[#00346F]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleVerificar()}
                    disabled={verificando}
                    className="px-4 py-2 bg-[#00346F] hover:bg-[#004A99] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {verificando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    <span>Verificar Serie</span>
                  </button>
                </div>

                {/* Accesos rápidos de prueba con series reales en MySQL */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Pruebas rápidas (Base de Datos):</span>
                  <button
                    type="button"
                    onClick={() => handleVerificar('LNV-X1C-2026-001')}
                    className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-mono font-bold hover:bg-emerald-100 cursor-pointer shadow-2xs"
                  >
                    LNV-X1C-2026-001 (Vigente 320d)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerificar('EPS-L3250-X58821')}
                    className="px-2.5 py-1 rounded bg-amber-50 text-amber-900 border border-amber-300 text-[10px] font-mono font-bold hover:bg-amber-100 cursor-pointer shadow-2xs"
                  >
                    EPS-L3250-X58821 (Por vencer 15d)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerificar('LNV-GB15-994101')}
                    className="px-2.5 py-1 rounded bg-red-50 text-red-800 border border-red-300 text-[10px] font-mono font-bold hover:bg-red-100 cursor-pointer shadow-2xs"
                  >
                    LNV-GB15-994101 (Vencida -55d)
                  </button>
                </div>
              </div>

              {/* PASO 2: SEMÁFORO Y RESULTADO DE GARANTÍA */}
              {resultado && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  {!resultado.encontrado ? (
                    /* CASO 1: NO REGISTRADO EN MG SOLUTIONS */
                    <div className="p-4 bg-red-50/70 border border-red-200 rounded-xl space-y-3">
                      <div className="flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-red-900 text-sm">Equipo no vendido por MG Solutions</h4>
                          <p className="text-[11px] text-red-700 mt-0.5 leading-relaxed">
                            El número de serie <strong>{resultado.serie}</strong> no figura en la base de datos de ventas de la empresa. No aplica garantía de tienda.
                          </p>
                        </div>
                      </div>
                      {onConvertToService && (
                        <div className="pt-2 border-t border-red-200 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onConvertToService(resultado.serie);
                            }}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <span>Ingresar como Servicio Técnico Particular (Con Costo) ➔</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : resultado.estado === 'VENCIDA' ? (
                    /* CASO 2: GARANTÍA VENCIDA */
                    <div className="p-4 bg-amber-50/80 border border-amber-300 rounded-xl space-y-3">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-amber-950 text-sm">Garantía Expirada</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                              Venció hace {resultado.diasVencida} días
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-900 mt-1">
                            Equipo: <strong>{resultado.producto?.nombre}</strong> (Vendido el {resultado.fechaVenta} - Comprobante: {resultado.comprobante}).
                          </p>
                        </div>
                      </div>
                      {onConvertToService && (
                        <div className="pt-2 border-t border-amber-200 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onConvertToService(resultado.serie, resultado.producto?.marca, resultado.producto?.nombre);
                            }}
                            className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <span>Cotizar Reparación Fuera de Garantía ➔</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* CASO 3: GARANTÍA VIGENTE */
                    <div className="p-4 bg-emerald-50/80 border border-emerald-300 rounded-xl space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-black text-emerald-950 text-sm">GARANTÍA VIGENTE OFICIAL</h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900 border border-emerald-300">
                                Quedan {resultado.diasRestantes} días de cobertura
                              </span>
                            </div>
                            <div className="text-[11px] text-emerald-900 mt-1 space-y-0.5">
                              <div>
                                Equipo: <strong>{resultado.producto?.nombre}</strong> ({resultado.producto?.marca})
                              </div>
                              {resultado.producto?.modelo && (
                                <div>
                                  Modelo Técnico: <strong className="font-mono">{resultado.producto.modelo}</strong>
                                </div>
                              )}
                              <div>
                                Fecha de Venta: <strong>{resultado.fechaVenta}</strong> | Vence: <strong>{resultado.fechaExpiracion}</strong>
                              </div>
                              <div>
                                Comprobante: <strong>{resultado.comprobante}</strong> | Titular: <strong>{resultado.cliente?.nombre}</strong> (DNI/RUC: {resultado.cliente?.documento || 'No especificado'})
                              </div>
                            </div>

                            {/* Ficha Técnica y Especificaciones Oficiales del Modelo */}
                            {resultado.producto?.caracteristicas && resultado.producto.caracteristicas.length > 0 && (
                              <div className="mt-2.5 pt-2 border-t border-emerald-200">
                                <span className="text-[10px] font-extrabold text-emerald-950 uppercase tracking-wider block mb-1">
                                  Ficha Técnica y Componentes de Fábrica:
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px]">
                                  {resultado.producto.caracteristicas.map((c, i) => (
                                    <div key={i} className="bg-white/90 border border-emerald-200 rounded px-2 py-1 flex items-start gap-1">
                                      <span className="font-bold text-slate-700">{c.atributo}:</span>
                                      <span className="text-slate-900 font-medium">{c.valor}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PASO 3: CHECKLIST DE INSPECCIÓN FÍSICA (POLÍTICA DE EXCLUSIÓN) */}
              {resultado?.encontrado && resultado.estado === 'VIGENTE' && (
                <form onSubmit={handleSubmitGarantia} className="space-y-4 pt-1">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 block flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                        <AlertCircle className="w-4 h-4 text-[#00346F]" />
                        Paso 2: Checklist Físico Obligatorio (Exclusión de Garantía)
                      </span>
                      <span className="text-[10px] text-slate-500 italic">Marque solo si presenta daño</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      La secretaria debe inspeccionar la máquina frente al cliente. Las caídas, golpes o humedad anulan la garantía de fábrica.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <label className={`p-2.5 rounded-lg border flex items-center gap-2.5 cursor-pointer transition-colors ${checklistFisico.pantallaRota ? 'bg-red-50 border-red-300 text-red-900 font-bold' : 'bg-white border-slate-200 text-slate-700'
                        }`}>
                        <input
                          type="checkbox"
                          checked={checklistFisico.pantallaRota}
                          onChange={(e) => setChecklistFisico({ ...checklistFisico, pantallaRota: e.target.checked })}
                          className="rounded text-red-600 focus:ring-red-500"
                        />
                        <span>¿Pantalla rota o rajada por golpe?</span>
                      </label>

                      <label className={`p-2.5 rounded-lg border flex items-center gap-2.5 cursor-pointer transition-colors ${checklistFisico.liquidos ? 'bg-red-50 border-red-300 text-red-900 font-bold' : 'bg-white border-slate-200 text-slate-700'
                        }`}>
                        <input
                          type="checkbox"
                          checked={checklistFisico.liquidos}
                          onChange={(e) => setChecklistFisico({ ...checklistFisico, liquidos: e.target.checked })}
                          className="rounded text-red-600 focus:ring-red-500"
                        />
                        <span>¿Derrame de líquidos / Humedad?</span>
                      </label>

                      <label className={`p-2.5 rounded-lg border flex items-center gap-2.5 cursor-pointer transition-colors ${checklistFisico.golpes ? 'bg-red-50 border-red-300 text-red-900 font-bold' : 'bg-white border-slate-200 text-slate-700'
                        }`}>
                        <input
                          type="checkbox"
                          checked={checklistFisico.golpes}
                          onChange={(e) => setChecklistFisico({ ...checklistFisico, golpes: e.target.checked })}
                          className="rounded text-red-600 focus:ring-red-500"
                        />
                        <span>¿Carcasa abollada o bisagra rota por caída?</span>
                      </label>

                      <label className={`p-2.5 rounded-lg border flex items-center gap-2.5 cursor-pointer transition-colors ${checklistFisico.sellosViolados ? 'bg-red-50 border-red-300 text-red-900 font-bold' : 'bg-white border-slate-200 text-slate-700'
                        }`}>
                        <input
                          type="checkbox"
                          checked={checklistFisico.sellosViolados}
                          onChange={(e) => setChecklistFisico({ ...checklistFisico, sellosViolados: e.target.checked })}
                          className="rounded text-red-600 focus:ring-red-500"
                        />
                        <span>¿Sellos violados / Abierto por terceros?</span>
                      </label>
                    </div>

                    {tieneDanoFisico && (
                      <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-900 text-xs font-bold flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-red-700 shrink-0" />
                        <span>ALERTA: Equipo con daño físico exterior. La garantía de fábrica no cubre caídas ni humedad. Debe cotizarse como servicio técnico de pago.</span>
                      </div>
                    )}
                  </div>

                  {/* PASO 4: DATOS DEL RECLAMO Y OBSERVACIONES */}
                  {!tieneDanoFisico && (
                    <div className="space-y-3 animate-in fade-in duration-150">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                            Nombre de Quien Entrega *
                          </label>
                          <input
                            type="text"
                            required
                            value={clienteNombre}
                            onChange={(e) => setClienteNombre(e.target.value)}
                            placeholder="Nombre completo"
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                            Teléfono de Contacto *
                          </label>
                          <input
                            type="tel"
                            required
                            value={clienteTelefono}
                            onChange={(e) => setClienteTelefono(e.target.value)}
                            placeholder="Ej: +51 974 812 390"
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                          Falla Reclamada por el Cliente *
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={fallaReclamada}
                          onChange={(e) => setFallaReclamada(e.target.value)}
                          placeholder="Ej: La laptop no enciende la pantalla o se apaga a los 10 minutos de encender..."
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                          Estado Estético y Accesorios Entregados
                        </label>
                        <input
                          type="text"
                          value={observacionesEsteticas}
                          onChange={(e) => setObservacionesEsteticas(e.target.value)}
                          placeholder="Ej: Sin rayones visibles. Incluye cargador original y funda."
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>

                      {/* Botón de Enviar */}
                      <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={onClose}
                          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-bold"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={registrando}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                        >
                          {registrando ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ShieldCheck className="w-4 h-4" />
                          )}
                          <span>Aceptar Ingreso por Garantía (Costo S/ 0.00)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
