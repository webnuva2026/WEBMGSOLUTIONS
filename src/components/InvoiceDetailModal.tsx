import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  FileCode2,
  FileText,
  CheckCircle2,
  QrCode,
  Building2,
  Copy,
} from 'lucide-react';
import { Comprobante, EmpresaConfig } from '../types';

interface InvoiceDetailModalProps {
  comprobante: Comprobante | null;
  empresa: EmpresaConfig;
  onClose: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  comprobante,
  empresa,
  onClose,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'pdf' | 'xml'>('pdf');

  if (!comprobante) return null;

  const handlePrint = () => {
    window.print();
  };

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
    <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
    <cbc:CustomizationID>2.0</cbc:CustomizationID>
    <cbc:ID>${comprobante.serie}-${comprobante.numero}</cbc:ID>
    <cbc:IssueDate>${comprobante.fechaEmision}</cbc:IssueDate>
    <cbc:InvoiceTypeCode listID="0101">${comprobante.tipo === 'FACTURA' ? '01' : '03'}</cbc:InvoiceTypeCode>
    <cbc:DocumentCurrencyCode>${comprobante.moneda}</cbc:DocumentCurrencyCode>
    
    <!-- Emisor -->
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="6">${empresa.ruc}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName>${empresa.razonSocial}</cbc:RegistrationName>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingSupplierParty>

    <!-- Receptor -->
    <cac:AccountingCustomerParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="6">${comprobante.clienteDocumento}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName>${comprobante.clienteNombre}</cbc:RegistrationName>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingCustomerParty>

    <!-- Totales -->
    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="PEN">${comprobante.igv.toFixed(2)}</cbc:TaxAmount>
    </cac:TaxTotal>
    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="PEN">${comprobante.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
        <cbc:PayableAmount currencyID="PEN">${comprobante.total.toFixed(2)}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>
</Invoice>`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-[#00346F] text-white">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold">
              Comprobante Electrónico: {comprobante.serie}-{comprobante.numero}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('pdf')}
              className={`px-3 py-1 rounded text-xs font-semibold ${
                activeTab === 'pdf' ? 'bg-white text-[#00346F]' : 'text-white/80 hover:text-white'
              }`}
            >
              Representación Impresa
            </button>
            <button
              onClick={() => setActiveTab('xml')}
              className={`px-3 py-1 rounded text-xs font-semibold ${
                activeTab === 'xml' ? 'bg-white text-[#00346F]' : 'text-white/80 hover:text-white'
              }`}
            >
              XML UBL 2.1
            </button>
            <button onClick={onClose} className="text-white/70 hover:text-white p-1 ml-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100">
          {activeTab === 'pdf' ? (
            /* Printable PDF Card matching Peruvian Electronic Invoicing standards */
            <div className="bg-white p-8 rounded-xl shadow border border-slate-200 text-slate-800 text-xs font-sans max-w-2xl mx-auto print:shadow-none print:border-none">
              {/* Header Box */}
              <div className="flex justify-between items-start gap-4 pb-6 border-b border-slate-200">
                <div className="space-y-1">
                  <div className="w-10 h-10 bg-[#00346F] text-white font-bold rounded-lg flex items-center justify-center text-lg mb-2">
                    MG
                  </div>
                  <h4 className="font-extrabold text-sm text-[#00346F]">{empresa.razonSocial}</h4>
                  <p className="text-[11px] text-slate-600 max-w-xs">{empresa.direccionFiscal}</p>
                  <p className="text-[11px] text-slate-600">Email: {empresa.email}</p>
                  <p className="text-[11px] text-slate-600">Tel: {empresa.telefono}</p>
                </div>

                {/* Right RUC Box */}
                <div className="border-2 border-[#00346F] rounded-lg p-3 text-center min-w-[200px] bg-blue-50/50">
                  <p className="font-mono font-bold text-xs">R.U.C. N° {empresa.ruc}</p>
                  <p className="font-extrabold text-sm text-[#00346F] my-1 uppercase">
                    {comprobante.tipo === 'FACTURA' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA'}
                  </p>
                  <p className="font-mono font-bold text-sm text-slate-800">
                    N° {comprobante.serie} - {comprobante.numero}
                  </p>
                </div>
              </div>

              {/* Client Info Grid */}
              <div className="grid grid-cols-2 gap-2 py-4 border-b border-slate-200 text-[11px]">
                <div>
                  <span className="font-bold text-slate-600">Señor(es): </span>
                  <span className="font-semibold text-slate-900">{comprobante.clienteNombre}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-600">Fecha Emisión: </span>
                  <span>{comprobante.fechaEmision}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-600">RUC / DNI: </span>
                  <span className="font-mono font-semibold">{comprobante.clienteDocumento}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-600">Moneda / Pago: </span>
                  <span>SOLES (PEN) - {comprobante.formaPago}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="py-4">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-[#EFF4FF] border-b border-slate-200 text-slate-700 font-bold">
                      <th className="py-2 px-2">CANT.</th>
                      <th className="py-2 px-2">CÓDIGO</th>
                      <th className="py-2 px-2">DESCRIPCIÓN</th>
                      <th className="py-2 px-2 text-right">P. UNIT</th>
                      <th className="py-2 px-2 text-right">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {comprobante.detalles.map((d, i) => (
                      <tr key={i}>
                        <td className="py-2 px-2 font-mono font-semibold">{d.cantidad} NIU</td>
                        <td className="py-2 px-2 font-mono text-slate-600">{d.codigo}</td>
                        <td className="py-2 px-2 font-medium">{d.descripcion}</td>
                        <td className="py-2 px-2 text-right font-mono">S/ {d.precioUnitario.toFixed(2)}</td>
                        <td className="py-2 px-2 text-right font-mono font-bold">S/ {d.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Hash */}
              <div className="pt-4 border-t border-slate-200 flex justify-between items-end">
                <div className="flex items-center gap-3">
                  <div className="p-2 border border-slate-300 rounded bg-slate-50 flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-slate-800" />
                  </div>
                  <div className="text-[10px] text-slate-500 space-y-0.5">
                    <p className="font-bold text-slate-700">Representación impresa autorizada por SUNAT</p>
                    <p className="font-mono">Hash: {comprobante.hashCdr || 'z1m8j4k9L3q/K0m19x...'}</p>
                    <p className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Estado SUNAT: {comprobante.estadoSunat}
                    </p>
                  </div>
                </div>

                <div className="space-y-1 text-right text-xs">
                  <div className="flex justify-between gap-6 text-slate-600">
                    <span>Op. Gravadas:</span>
                    <span className="font-mono">S/ {comprobante.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between gap-6 text-slate-600">
                    <span>I.G.V. (18%):</span>
                    <span className="font-mono">S/ {comprobante.igv.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between gap-6 font-extrabold text-sm text-[#00346F] pt-1 border-t border-slate-200">
                    <span>IMPORTE TOTAL:</span>
                    <span className="font-mono">S/ {comprobante.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto relative">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(xmlContent);
                  onShowToast('XML Copiado', 'Contenido XML UBL 2.1 copiado al portapapeles.', 'info');
                }}
                className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded text-[11px] flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                Copiar
              </button>
              <pre className="whitespace-pre">{xmlContent}</pre>
            </div>
          )}
        </div>

        {/* Modal Bottom Bar */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center">
          <span className="text-xs text-slate-500 font-medium">
            Formato Estándar Factura Electrónica SUNAT UBL 2.1
          </span>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#00346F] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-[#004A99]"
            >
              <Printer className="w-4 h-4" />
              Imprimir / PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
