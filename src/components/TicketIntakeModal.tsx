import React, { useState, useMemo } from 'react';
import {
  Wrench,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Search,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  X,
  UserPlus,
  Check,
  Truck,
  Printer,
  Monitor,
  MessageSquare,
  Mail,
  Send,
  Clock,
  Laptop,
  Sparkles,
  Loader2,
  Plus,
  KeyRound,
} from 'lucide-react';
import { Cliente, OrdenServicio, Usuario, Categoria, Proveedor, Marca, Modelo } from '../types';
import { warrantyService, ResultadoGarantia } from '../services/warranty.service';
import { workshopService } from '../services/workshop.service';
import { clientService } from '../services/client.service';
import { consultaService } from '../services/consulta.service';
import { categoryService } from '../services/category.service';
import { brandModelService } from '../services/brandModel.service';

interface TicketIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Usuario;
  clientes: Cliente[];
  usuarios: Usuario[];
  categorias?: Categoria[];
  proveedores?: Proveedor[];
  ordenes: OrdenServicio[];
  onSaveOrden: (orden: OrdenServicio) => void;
  onSaveCliente?: (cliente: Cliente) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  initialClientId?: number;
}

export const TicketIntakeModal: React.FC<TicketIntakeModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  clientes,
  usuarios,
  categorias = [],
  proveedores = [],
  ordenes,
  onSaveOrden,
  onSaveCliente,
  onShowToast,
  initialClientId,
}) => {
  // Estado de la modalidad: 'SERVICIO' (Regular) o 'GARANTIA' (Oficial)
  const [ingresoModo, setIngresoModo] = useState<'SERVICIO' | 'GARANTIA'>('SERVICIO');

  // Datos del ticket
  const [newOrderClienteId, setNewOrderClienteId] = useState<number | ''>(initialClientId || '');
  const [newOrderTipo, setNewOrderTipo] = useState<string>('LAPTOP');
  const [newOrderMarca, setNewOrderMarca] = useState<string>('');
  const [newOrderModelo, setNewOrderModelo] = useState<string>('');
  const [newOrderSerie, setNewOrderSerie] = useState<string>('');
  const [newOrderPassword, setNewOrderPassword] = useState<string>('');
  const [newOrderFalla, setNewOrderFalla] = useState<string>('');
  const [newOrderEstetico, setNewOrderEstetico] = useState<string>('');
  const [newOrderTecnicoId, setNewOrderTecnicoId] = useState<number | ''>('');
  const [newOrderPrioridad, setNewOrderPrioridad] = useState<'NORMAL' | 'ALTA' | 'URGENTE'>('NORMAL');
  const [newOrderAdelanto, setNewOrderAdelanto] = useState<string>('');
  const [newOrderAccesorios, setNewOrderAccesorios] = useState<string[]>([]);

  // Garantía
  const [verificandoGarantia, setVerificandoGarantia] = useState<boolean>(false);
  const [garantiaResultado, setGarantiaResultado] = useState<ResultadoGarantia | null>(null);
  const [checklistGarantia, setChecklistGarantia] = useState({
    pantallaIntegra: false,
    sinLiquidos: false,
    sinGolpes: false,
    sellosIntactos: false,
  });
  const [garantiaProveedorNombre, setGarantiaProveedorNombre] = useState<string>('DELTRON PERÚ (Mayorista Oficial)');
  const [garantiaProveedorContacto, setGarantiaProveedorContacto] = useState<string>('Dpto. RMA & Garantías');
  const [garantiaProveedorTelefono, setGarantiaProveedorTelefono] = useState<string>('01 411-0000');
  const [garantiaProveedorEmail, setGarantiaProveedorEmail] = useState<string>('rma@deltron.pe');

  // Búsqueda inteligente de Clientes
  const [clientSearchQuery, setClientSearchQuery] = useState<string>('');
  const [isClientSearchDropdownOpen, setIsClientSearchDropdownOpen] = useState<boolean>(false);

  // Modal de Nuevo Cliente Rápido
  const [isQuickClientModalOpen, setIsQuickClientModalOpen] = useState<boolean>(false);
  const [quickClientForm, setQuickClientForm] = useState({
    tipoDocumento: 'DNI',
    numeroDocumento: '',
    razonSocial: '',
    telefono: '',
    email: '',
    direccion: 'Chiclayo',
  });
  const [isQueryingReniec, setIsQueryingReniec] = useState<boolean>(false);
  const [isSubmittingQuickClient, setIsSubmittingQuickClient] = useState<boolean>(false);

  // Ticket Generado para imprimir o enviar
  const [ticketGenerado, setTicketGenerado] = useState<OrdenServicio | null>(null);
  const [ticketEmailInput, setTicketEmailInput] = useState<string>('');
  const [isSendingTicketEmail, setIsSendingTicketEmail] = useState<boolean>(false);
  const [ticketEmailSent, setTicketEmailSent] = useState<boolean>(false);
  const [isSavingOrder, setIsSavingOrder] = useState<boolean>(false);

  // Filtrar técnicos
  const tecnicos = useMemo(() => {
    return usuarios.filter(
      (u) =>
        u.estado === 'ACTIVO' &&
        (u.rol === 'TECNICO' || u.rol === 'SUPERADMIN' || u.rol === 'ADMIN' || (u.rolNombre && u.rolNombre.toUpperCase().includes('TÉCNICO')))
    );
  }, [usuarios]);

  // Cliente seleccionado
  const selectedClient = useMemo(() => {
    return clientes.find((c) => c.id === Number(newOrderClienteId));
  }, [clientes, newOrderClienteId]);

  // Clientes filtrados por búsqueda
  const filteredClients = useMemo(() => {
    if (!clientSearchQuery.trim()) return clientes.slice(0, 15);
    const q = clientSearchQuery.toLowerCase().trim();
    return clientes
      .filter(
        (c) =>
          c.razonSocial.toLowerCase().includes(q) ||
          (c.numeroDocumento && c.numeroDocumento.includes(q)) ||
          (c.telefono && c.telefono.includes(q))
      )
      .slice(0, 20);
  }, [clientes, clientSearchQuery]);

  // Estados de datos sincronizados desde BD (Categorías de Taller, Marcas, Modelos)
  const [dbCategorias, setDbCategorias] = useState<Categoria[]>(categorias || []);
  const [dbMarcas, setDbMarcas] = useState<Marca[]>([]);
  const [dbModelos, setDbModelos] = useState<Modelo[]>([]);

  // Sincronizar catálogo real desde la BD al abrir el modal
  React.useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchAux = async () => {
      try {
        const [resCat, resMarcas, resModelos] = await Promise.all([
          categoryService.getCategorias(),
          brandModelService.getMarcas(),
          brandModelService.getModelos(),
        ]);
        if (!isMounted) return;

        if (resCat.success && resCat.categorias && resCat.categorias.length > 0) {
          setDbCategorias(resCat.categorias);
          const primerEquipo = resCat.categorias.find((c) => c.esEquipoTaller && c.estado === 'ACTIVO');
          if (primerEquipo) {
            setNewOrderTipo(primerEquipo.nombre);
          } else {
            setNewOrderTipo(resCat.categorias[0].nombre);
          }
        }
        if (resMarcas.success && resMarcas.marcas) {
          setDbMarcas(resMarcas.marcas);
        }
        if (resModelos.success && resModelos.modelos) {
          setDbModelos(resModelos.modelos);
        }
      } catch (err) {
        console.error('Error fetching categories in TicketIntakeModal:', err);
      }
    };

    fetchAux();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Categorías de equipos desde la BD (filtradas para taller)
  const categoriasEquipos = useMemo(() => {
    const list = dbCategorias.length > 0 ? dbCategorias : categorias;
    const filtradas = list.filter((c) => c.estado === 'ACTIVO' && c.esEquipoTaller === true);
    return filtradas.length > 0 ? filtradas : list.filter((c) => c.estado === 'ACTIVO');
  }, [dbCategorias, categorias]);

  // Marcas sugeridas en base a la categoría seleccionada
  const suggestedBrands = useMemo(() => {
    if (dbMarcas.length === 0) return ['HP', 'LENOVO', 'ASUS', 'DELL', 'EPSON', 'ACER'];
    const catActual = dbCategorias.find((c) => c.nombre.toUpperCase() === newOrderTipo.toUpperCase());
    if (catActual) {
      const marcasDeCat = dbMarcas.filter((m) => m.categoriaId === catActual.id && m.estado === 'ACTIVO');
      if (marcasDeCat.length > 0) return marcasDeCat.map((m) => m.nombre);
    }
    return dbMarcas.filter((m) => m.estado === 'ACTIVO').slice(0, 8).map((m) => m.nombre);
  }, [dbMarcas, dbCategorias, newOrderTipo]);

  // Detección contextual del tipo de equipo (Cómputo, Impresoras, Monitores, General)
  const tipoEquipoBehavior = useMemo<'COMPUTO' | 'IMPRESORA' | 'MONITOR' | 'GENERAL'>(() => {
    const t = (newOrderTipo || '').toUpperCase();
    if (t.includes('IMPRESORA') || t.includes('MULTIFUNCIONAL') || t.includes('PRINT')) {
      return 'IMPRESORA';
    }
    if (t.includes('MONITOR') || t.includes('PANTALLA') || t.includes('DISPLAY')) {
      return 'MONITOR';
    }
    if (
      t.includes('LAPTOP') ||
      t.includes('NOTEBOOK') ||
      t.includes('PC') ||
      t.includes('COMPUTADORA') ||
      t.includes('ALL IN ONE') ||
      t.includes('SERVIDOR')
    ) {
      return 'COMPUTO';
    }
    return 'GENERAL';
  }, [newOrderTipo]);

  // Estados contextuales específicos por tipo de equipo
  const [impresoraSistema, setImpresoraSistema] = useState<string>('EcoTank / Tanque Continuo');
  const [impresoraConsumibles, setImpresoraConsumibles] = useState<string>('Con tanques/tóner instalados');
  const [monitorBase, setMonitorBase] = useState<string>('Con base/pie original');
  const [monitorConector, setMonitorConector] = useState<string>('HDMI');
  const [customAccesorio, setCustomAccesorio] = useState<string>('');

  // Limpiar/ajustar clave de forma automática cuando cambia de tipo de equipo
  React.useEffect(() => {
    if (tipoEquipoBehavior === 'IMPRESORA' || tipoEquipoBehavior === 'MONITOR') {
      setNewOrderPassword('No aplica');
    } else if (newOrderPassword === 'No aplica') {
      setNewOrderPassword('');
    }
  }, [tipoEquipoBehavior]);

  // Presets de accesorios según categoría
  const ACCESORIOS_PRESETS: Record<'COMPUTO' | 'IMPRESORA' | 'MONITOR' | 'GENERAL', string[]> = {
    COMPUTO: [
      'Solo equipo',
      'Cargador Original',
      'Cargador Genérico',
      'Cable de Poder',
      'Funda / Maletín',
      'Mouse',
    ],
    IMPRESORA: [
      'Solo equipo',
      'Cable de Poder',
      'Transformador / Adaptador',
      'Cable USB Impresora',
      'Bandeja de Papel',
      'Frascos de Tinta',
    ],
    MONITOR: [
      'Solo equipo',
      'Adaptador 12V/19V',
      'Cable de Poder Directo',
      'Cable HDMI',
      'Cable VGA',
      'Base de pie incluida',
    ],
    GENERAL: [
      'Solo equipo',
      'Cable de Poder',
      'Cargador / Transformador',
      'Caja original',
    ],
  };

  const handleToggleAccesorio = (acc: string) => {
    setNewOrderAccesorios((prev) => {
      if (acc === 'Solo equipo') {
        return prev.includes('Solo equipo') ? [] : ['Solo equipo'];
      }
      const sinSoloEquipo = prev.filter((x) => x !== 'Solo equipo');
      if (sinSoloEquipo.includes(acc)) {
        return sinSoloEquipo.filter((x) => x !== acc);
      } else {
        return [...sinSoloEquipo, acc];
      }
    });
  };

  const handleAddCustomAccesorio = () => {
    const item = customAccesorio.trim();
    if (!item) return;
    setNewOrderAccesorios((prev) => {
      const sinSoloEquipo = prev.filter((x) => x !== 'Solo equipo');
      if (!sinSoloEquipo.includes(item)) {
        return [...sinSoloEquipo, item];
      }
      return sinSoloEquipo;
    });
    setCustomAccesorio('');
  };

  // Validación de checklist de garantía
  const checklistGarantiaCompleto =
    checklistGarantia.pantallaIntegra &&
    checklistGarantia.sinLiquidos &&
    checklistGarantia.sinGolpes &&
    checklistGarantia.sellosIntactos;

  // Asignar primer técnico por defecto si está vacío
  React.useEffect(() => {
    if (!newOrderTecnicoId && tecnicos.length > 0) {
      setNewOrderTecnicoId(tecnicos[0].id);
    }
  }, [tecnicos, newOrderTecnicoId]);

  // Verificar garantía por N° Serie
  const handleVerificarGarantia = async (serieOverride?: string) => {
    const serie = (serieOverride || newOrderSerie).trim().toUpperCase();
    if (!serie) {
      onShowToast('Serie requerida', 'Ingrese el número de serie para verificar la garantía.', 'warning');
      return;
    }
    if (serieOverride) {
      setNewOrderSerie(serieOverride.toUpperCase());
    }
    setVerificandoGarantia(true);
    try {
      const res = await warrantyService.verificarGarantia(serie);
      setGarantiaResultado(res);
      if (res.encontrado && res.estado === 'VIGENTE') {
        onShowToast('Garantía Vigente', `Equipo con garantía oficial activa (${res.diasRestantes} días restantes).`, 'success');
        setIngresoModo('GARANTIA');
        if (res.producto?.modelo || res.producto?.nombre) {
          setNewOrderModelo(res.producto.modelo || res.producto.nombre);
        }
        if (res.producto?.marca) {
          setNewOrderMarca(res.producto.marca);
        }
        if (res.cliente) {
          const clientFound = clientes.find(
            (c) => c.id === res.cliente?.id || (c.numeroDocumento && c.numeroDocumento === res.cliente?.documento)
          );
          if (clientFound) {
            setNewOrderClienteId(clientFound.id);
          }
        }
      } else if (res.encontrado && res.estado === 'VENCIDA') {
        onShowToast('Garantía Vencida', `La garantía expiró hace ${res.diasVencida} días. Trámite como servicio regular.`, 'warning');
      } else {
        onShowToast('Sin Registro de Venta', 'El número de serie no figura en ventas de MG Solutions. Trámite regular.', 'info');
      }
    } catch (err: any) {
      console.error('Error al verificar garantía:', err);
      onShowToast('Error', 'Fallo al consultar el servicio de garantía.', 'error');
    } finally {
      setVerificandoGarantia(false);
    }
  };

  // Consultar DNI / RUC en el modal de cliente rápido
  const handleConsultarDocumentoQuick = async () => {
    const doc = quickClientForm.numeroDocumento.trim();
    if (!doc) return;
    setIsQueryingReniec(true);
    try {
      if (quickClientForm.tipoDocumento === 'DNI' && doc.length === 8) {
        const res = await consultaService.consultarDni(doc);
        if (res.success && res.data) {
          setQuickClientForm((prev) => ({
            ...prev,
            razonSocial: res.data!.nombreCompleto,
          }));
          onShowToast('RENIEC Verificado', res.data.nombreCompleto, 'success');
        }
      } else if (quickClientForm.tipoDocumento === 'RUC' && doc.length === 11) {
        const res = await consultaService.consultarRuc(doc);
        if (res.success && res.data) {
          setQuickClientForm((prev) => ({
            ...prev,
            razonSocial: res.data!.razonSocial,
            direccion: res.data!.direccion || prev.direccion,
          }));
          onShowToast('SUNAT Verificado', res.data.razonSocial, 'success');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsQueryingReniec(false);
    }
  };

  // Guardar nuevo cliente express
  const handleSaveQuickClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickClientForm.razonSocial.trim()) {
      onShowToast('Nombre requerido', 'Ingrese el nombre o razón social del cliente.', 'warning');
      return;
    }
    setIsSubmittingQuickClient(true);
    try {
      const res = await clientService.createClient({
        tipoDocumento: quickClientForm.tipoDocumento as any,
        numeroDocumento: quickClientForm.numeroDocumento.trim(),
        razonSocial: quickClientForm.razonSocial.trim(),
        telefono: quickClientForm.telefono.trim(),
        email: quickClientForm.email.trim(),
        direccionFiscal: quickClientForm.direccion.trim(),
      });

      if (res.success && res.data) {
        const created: Cliente = {
          id: res.data.id || Date.now(),
          tipoDocumento: quickClientForm.tipoDocumento as any,
          numeroDocumento: quickClientForm.numeroDocumento.trim(),
          razonSocial: quickClientForm.razonSocial.trim(),
          telefono: quickClientForm.telefono.trim(),
          email: quickClientForm.email.trim(),
          direccionFiscal: quickClientForm.direccion.trim(),
          estado: 'ACTIVO',
          fechaRegistro: new Date().toISOString(),
        };
        if (onSaveCliente) onSaveCliente(created);
        setNewOrderClienteId(created.id);
        setIsQuickClientModalOpen(false);
        onShowToast('Cliente Registrado', `${created.razonSocial} seleccionado.`, 'success');
      } else {
        onShowToast('Error', res.message || 'No se pudo guardar el cliente.', 'error');
      }
    } catch (err: any) {
      onShowToast('Error', err.message || 'Error de conexión.', 'error');
    } finally {
      setIsSubmittingQuickClient(false);
    }
  };

  // Crear la orden de servicio
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) {
      onShowToast('Cliente Requerido', 'Seleccione un cliente solicitante para emitir el ticket.', 'warning');
      return;
    }

    if (!newOrderFalla.trim()) {
      onShowToast('Falla Requerida', 'Especifique la falla o motivo de ingreso del equipo.', 'warning');
      return;
    }

    if (ingresoModo === 'GARANTIA' && !checklistGarantiaCompleto) {
      onShowToast('Inspección Incompleta', 'Debe marcar conformes los 4 puntos de inspección física para tramitar garantía.', 'warning');
      return;
    }

    setIsSavingOrder(true);
    try {
      const assignedTech = tecnicos.find((u) => u.id === Number(newOrderTecnicoId));
      const highest =
        ordenes.reduce((max, order) => {
          const match = order.codigo.match(/(\d+)$/);
          return Math.max(max, match ? Number(match[1]) : 0);
        }, 0) + 1;

      const prefix = ingresoModo === 'GARANTIA' ? 'GAR' : 'OT';
      let code = `${prefix}-2026-${String(highest).padStart(4, '0')}`;

      const finalMarca =
        ingresoModo === 'GARANTIA'
          ? (garantiaResultado?.producto?.marca || (newOrderMarca.trim() ? newOrderMarca : 'MG SOLUTIONS')).toUpperCase().trim()
          : (newOrderMarca || 'GENÉRICO').toUpperCase().trim();

      const finalModelo =
        ingresoModo === 'GARANTIA'
          ? (garantiaResultado?.producto?.nombre || (newOrderModelo.trim() ? newOrderModelo : 'Equipo en Garantía')).trim()
          : (newOrderModelo || 'Modelo Estándar').trim();

      const detalleContextual =
        tipoEquipoBehavior === 'IMPRESORA'
          ? `[Impresora: ${impresoraSistema} | Consumibles: ${impresoraConsumibles}]`
          : tipoEquipoBehavior === 'MONITOR'
          ? `[Monitor: ${monitorBase} | Conector: ${monitorConector}]`
          : '';

      const finalPassword =
        ingresoModo === 'GARANTIA' || tipoEquipoBehavior === 'IMPRESORA' || tipoEquipoBehavior === 'MONITOR'
          ? 'No aplica'
          : newOrderPassword.trim() || 'Sin clave';

      const finalObservaciones = detalleContextual
        ? `${detalleContextual} Recepción ingresada en mostrador por ${currentUser.nombreCompleto}`
        : `Recepción ingresada en mostrador por ${currentUser.nombreCompleto}`;

      let newDbId = Date.now();

      try {
        const resOrder = await workshopService.createOrden({
          clienteId: selectedClient.id,
          sucursalId: currentUser.sucursalId || 1,
          tipoEquipo: ingresoModo === 'GARANTIA' ? 'GARANTIA_OFICIAL' : newOrderTipo,
          marca: finalMarca,
          modelo: finalModelo,
          numeroSerie: newOrderSerie.trim().toUpperCase() || 'S/N-SINDATO',
          accesorios: newOrderAccesorios.length > 0 ? newOrderAccesorios : ['Solo equipo'],
          fallaReportada: newOrderFalla.trim(),
          prioridad: ingresoModo === 'GARANTIA' ? 'NORMAL' : newOrderPrioridad,
          tecnicoId: assignedTech ? assignedTech.id : currentUser.id,
          esGarantia: ingresoModo === 'GARANTIA',
          costoServicio: ingresoModo === 'GARANTIA' ? 0 : Number(newOrderAdelanto) || 0,
          observaciones: finalObservaciones,
        });
        if (resOrder.success) {
          if (resOrder.codigo) code = resOrder.codigo;
          if (resOrder.ordenId) newDbId = resOrder.ordenId;
        }
      } catch (err) {
        console.warn('Persistencia MySQL fallback local:', err);
      }

      const newOrder: OrdenServicio = {
        id: newDbId,
        codigo: code,
        sucursalId: currentUser.sucursalId || 1,
        sucursalNombre: currentUser.sucursalNombre || 'Principal - Chiclayo Centro',
        clienteId: selectedClient.id,
        clienteNombre: selectedClient.razonSocial,
        clienteDocumento: selectedClient.numeroDocumento,
        clienteTelefono: selectedClient.telefono || '987654321',
        clienteEmail: selectedClient.email,
        tipoEquipo: ingresoModo === 'GARANTIA' ? 'GARANTIA_OFICIAL' : newOrderTipo,
        marca: finalMarca,
        modelo: finalModelo,
        numeroSerie: newOrderSerie.trim().toUpperCase() || 'S/N-SINDATO',
        passwordEquipo: finalPassword,
        accesoriosDejados: newOrderAccesorios.length > 0 ? newOrderAccesorios : ['Solo equipo'],
        fallaReportada: newOrderFalla.trim(),
        estadoEstetico: newOrderEstetico.trim(),
        prioridad: ingresoModo === 'GARANTIA' ? 'NORMAL' : newOrderPrioridad,
        tecnicoId: assignedTech ? assignedTech.id : currentUser.id,
        tecnicoNombre: assignedTech ? assignedTech.nombreCompleto : currentUser.nombreCompleto,
        recepcionadoPorId: currentUser.id,
        recepcionadoPorNombre: currentUser.nombreCompleto,
        fechaIngreso: new Date().toLocaleString('es-PE'),
        fechaEstimadaEntrega:
          ingresoModo === 'GARANTIA'
            ? '7 a 30 días hábiles (Gestión oficial de fabricante / mayorista)'
            : 'En 24 a 48 horas hábiles',
        estado: 'RECEPCIONADO',
        repuestos: [],
        serviciosManoObra: [],
        costoTotalRepuestos: 0,
        costoTotalManoObra: 0,
        costoTotal: 0,
        adelantoPagado: ingresoModo === 'GARANTIA' ? 0 : Number(newOrderAdelanto) || 0,
        saldoPendiente: 0,
        comunicaciones: [],
        bitacora: [
          {
            id: `b-${Date.now()}`,
            fecha: new Date().toLocaleString('es-PE'),
            autorNombre: currentUser.nombreCompleto,
            autorRol: currentUser.rol,
            titulo: ingresoModo === 'GARANTIA' ? 'Ingreso por Garantía Oficial (Costo S/ 0.00)' : 'Recepción del equipo e ingreso a mostrador',
            descripcion:
              ingresoModo === 'GARANTIA'
                ? `Recepción por Garantía oficial. Falla: ${newOrderFalla}. Inspección física conforme 4/4.`
                : `Equipo recepcionado. Falla: ${newOrderFalla}. Técnico asignado: ${assignedTech ? assignedTech.nombreCompleto : 'Por asignar'}`,
          },
        ],
      };

      onSaveOrden(newOrder);

      // Preparar vista de ticket impreso / envío
      setTicketGenerado(newOrder);
      setTicketEmailInput(selectedClient.email || '');
      setTicketEmailSent(false);

      onShowToast(
        ingresoModo === 'GARANTIA' ? 'Garantía Registrada' : 'Ticket Emitido',
        `Orden ${code} generada exitosamente. Comprobante listo para imprimir.`,
        'success'
      );
    } catch (err: any) {
      console.error(err);
      onShowToast('Error', 'Fallo al procesar la orden de servicio.', 'error');
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Enviar ticket por correo
  const handleSendTicketEmail = async () => {
    if (!ticketGenerado) return;
    const email = ticketEmailInput.trim();
    if (!email || !email.includes('@')) {
      onShowToast('Correo inválido', 'Ingrese un correo electrónico válido.', 'warning');
      return;
    }
    setIsSendingTicketEmail(true);
    try {
      const res = await workshopService.sendTicketEmail({
        toEmail: email,
        codigoOrden: ticketGenerado.codigo,
        clienteNombre: ticketGenerado.clienteNombre,
        clienteDocumento: ticketGenerado.clienteDocumento,
        clienteTelefono: ticketGenerado.clienteTelefono,
        tipoEquipo: ticketGenerado.tipoEquipo,
        marca: ticketGenerado.marca,
        modelo: ticketGenerado.modelo,
        numeroSerie: ticketGenerado.numeroSerie,
        fallaReportada: ticketGenerado.fallaReportada,
        fechaIngreso: ticketGenerado.fechaIngreso,
        presupuestoTotal: ticketGenerado.costoTotal,
        adelantoPagado: ticketGenerado.adelantoPagado,
        saldoPendiente: ticketGenerado.saldoPendiente,
      });
      if (res.success) {
        setTicketEmailSent(true);
        onShowToast('Correo Enviado', `Comprobante de ingreso enviado a ${email}`, 'success');
      } else {
        onShowToast('Error', res.message || 'No se pudo enviar el correo.', 'error');
      }
    } catch (err: any) {
      onShowToast('Error', err.message || 'Error al conectar con el servidor de correo.', 'error');
    } finally {
      setIsSendingTicketEmail(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* MODAL PRINCIPAL: NUEVO TICKET DE INGRESO */}
      {!ticketGenerado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-[#00346F] text-white">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold">
                    Recepción de mostrador • Nuevo ticket de servicio
                  </h3>
                  <p className="text-[10px] text-blue-200">
                    Atendido por: {currentUser.nombreCompleto} ({currentUser.rolNombre || currentUser.rol})
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="text-white/70 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs bg-[#F8F9FF]">
              {/* 1. SECCIÓN SUPERIOR: BÚSQUEDA Y VALIDACIÓN DE GARANTÍA */}
              <div className="bg-white p-4 rounded-xl border-2 border-emerald-500/50 shadow-xs space-y-3">
                <div className="flex flex-wrap justify-between items-center gap-2 border-b border-emerald-100 pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <div>
                      <span className="font-extrabold text-[#00346F] text-xs uppercase tracking-wider block">
                        Búsqueda y Validación de Garantía MG Solutions
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Consulte por N° de serie para comprobar si cuenta con garantía activa o si es equipo externo
                      </span>
                    </div>
                  </div>
                  {garantiaResultado ? (
                    garantiaResultado.encontrado && garantiaResultado.estado === 'VIGENTE' ? (
                      <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-full text-[10px] font-bold shadow-2xs flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Garantía Oficial Activa (Costo S/ 0.00)
                      </span>
                    ) : garantiaResultado.encontrado && garantiaResultado.estado === 'VENCIDA' ? (
                      <span className="px-2.5 py-1 bg-red-600 text-white rounded-full text-[10px] font-bold shadow-2xs flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Garantía Expirada (Servicio Regular)
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-slate-600 text-white rounded-full text-[10px] font-bold shadow-2xs flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5" />
                        Equipo Externo / Sin Registro de Venta
                      </span>
                    )
                  ) : (
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                      <Search className="w-3 h-3" />
                      Consulta Rápida en Mostrador
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={newOrderSerie}
                      onChange={(e) => setNewOrderSerie(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleVerificarGarantia();
                        }
                      }}
                      placeholder="Ingrese N° Serie / Service Tag (Ej: EPS-L3250-X58821)..."
                      className="w-full p-2.5 pr-8 bg-white border border-emerald-400 rounded-lg font-mono font-bold text-xs uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    />
                    {newOrderSerie && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewOrderSerie('');
                          setGarantiaResultado(null);
                        }}
                        className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                        title="Limpiar serie"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleVerificarGarantia()}
                    disabled={verificandoGarantia || !newOrderSerie.trim()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
                  >
                    {verificandoGarantia ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Verificar Serie
                  </button>
                </div>
              </div>

              {/* 2. SELECTOR DE MODALIDAD: SERVICIO REGULAR VS GARANTÍA */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIngresoModo('SERVICIO');
                      setGarantiaResultado(null);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      ingresoModo === 'SERVICIO'
                        ? 'bg-blue-50/90 border-[#00346F] ring-2 ring-[#00346F]/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${ingresoModo === 'SERVICIO' ? 'bg-[#00346F] text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                        <span>1. SERVICIO REGULAR</span>
                        {ingresoModo === 'SERVICIO' && (
                          <span className="text-[9px] bg-[#00346F] text-white px-2 py-0.5 rounded-full font-bold">
                            ACTIVO
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Particulares o empresas. Mantenimiento o reparación con diagnóstico y cotización.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIngresoModo('GARANTIA')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      ingresoModo === 'GARANTIA'
                        ? 'bg-emerald-50/90 border-emerald-600 ring-2 ring-emerald-600/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${ingresoModo === 'GARANTIA' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                        <span className="text-emerald-900">2. GARANTÍA OFICIAL</span>
                        {ingresoModo === 'GARANTIA' && (
                          <span className="text-[9px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                            ACTIVO
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Vendido por MG Solutions. Validación de serie, plazo oficial y costo automático S/ 0.00.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* 3. CLIENTE SOLICITANTE */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                      Cliente Solicitante *
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Busque por DNI, RUC o Nombre del titular
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsQuickClientModalOpen(true)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer transition-all active:scale-95"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    + Registrar Cliente
                  </button>
                </div>

                {selectedClient && !isClientSearchDropdownOpen && (
                  <div className="p-3 bg-[#EFF4FF] border border-blue-200 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            selectedClient.tipoDocumento === 'RUC' ? 'bg-[#00346F] text-white' : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {selectedClient.tipoDocumento} {selectedClient.numeroDocumento}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">{selectedClient.razonSocial}</span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        📞 {selectedClient.telefono || 'Sin teléfono'} • 📍 {selectedClient.direccion || 'Chiclayo'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsClientSearchDropdownOpen(true)}
                      className="px-3 py-1 bg-white hover:bg-slate-100 text-[#00346F] border border-blue-300 font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" />
                      Cambiar
                    </button>
                  </div>
                )}

                {(isClientSearchDropdownOpen || !selectedClient) && (
                  <div className="relative">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        autoFocus
                        value={clientSearchQuery}
                        onChange={(e) => setClientSearchQuery(e.target.value)}
                        placeholder="Escriba DNI, RUC, o nombre del cliente..."
                        className="w-full pl-9 pr-8 py-2 bg-white border border-[#00346F] rounded-lg text-xs font-medium focus:outline-none shadow-xs"
                      />
                      {selectedClient && (
                        <button
                          type="button"
                          onClick={() => setIsClientSearchDropdownOpen(false)}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-[11px] font-bold cursor-pointer"
                        >
                          Cerrar
                        </button>
                      )}
                    </div>

                    <div className="mt-1 max-h-52 overflow-y-auto border border-slate-200 rounded-lg bg-white shadow-lg divide-y divide-slate-100 z-20">
                      {filteredClients.length > 0 ? (
                        filteredClients.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setNewOrderClienteId(c.id);
                              setIsClientSearchDropdownOpen(false);
                              setClientSearchQuery('');
                            }}
                            className={`p-2.5 hover:bg-blue-50 cursor-pointer transition-colors flex items-center justify-between ${
                              newOrderClienteId === c.id ? 'bg-[#EFF4FF]' : ''
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-[#00346F]">
                                  {c.tipoDocumento} {c.numeroDocumento}
                                </span>
                                <span className="font-bold text-slate-800 text-xs">{c.razonSocial}</span>
                              </div>
                              <p className="text-[10px] text-slate-500">Tel: {c.telefono || '—'}</p>
                            </div>
                            {newOrderClienteId === c.id && <Check className="w-4 h-4 text-[#00346F] shrink-0" />}
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-slate-500">
                          <p className="font-semibold text-xs">No se encontró cliente con "{clientSearchQuery}"</p>
                          <button
                            type="button"
                            onClick={() => {
                              setQuickClientForm((prev) => ({
                                ...prev,
                                razonSocial: isNaN(Number(clientSearchQuery)) ? clientSearchQuery : '',
                                numeroDocumento: !isNaN(Number(clientSearchQuery)) ? clientSearchQuery : '',
                              }));
                              setIsQuickClientModalOpen(true);
                            }}
                            className="mt-2 px-3 py-1 bg-[#00346F] text-white rounded text-xs font-bold cursor-pointer"
                          >
                            + Registrar a "{clientSearchQuery}" ahora
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. ESPECIFICACIONES DEL EQUIPO */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Laptop className="w-4 h-4 text-[#00346F]" />
                    Especificaciones del Equipo
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block font-semibold text-slate-600">Tipo de Equipo *</label>
                      <span className="text-[9px] text-[#00346F] font-bold">Desde BD</span>
                    </div>
                    <select
                      value={newOrderTipo}
                      onChange={(e) => setNewOrderTipo(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-xs focus:outline-none focus:border-[#00346F]"
                    >
                      {categoriasEquipos.map((cat) => (
                        <option key={cat.id} value={cat.nombre}>
                          {cat.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block font-semibold text-slate-600">Marca *</label>
                      <span className="text-[10px] text-slate-400">Texto libre / Sugerencias</span>
                    </div>
                    <input
                      type="text"
                      required
                      value={newOrderMarca}
                      onChange={(e) => setNewOrderMarca(e.target.value.toUpperCase())}
                      placeholder="Ej: HP, LENOVO, ASUS, DELL"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium uppercase text-xs focus:outline-none focus:border-[#00346F]"
                    />
                    <div className="flex flex-wrap gap-1 mt-1">
                      {suggestedBrands.map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setNewOrderMarca(b)}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                            newOrderMarca.toUpperCase() === b.toUpperCase()
                              ? 'bg-[#00346F] text-white border-[#00346F]'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Modelo *</label>
                    <input
                      type="text"
                      required
                      value={newOrderModelo}
                      onChange={(e) => setNewOrderModelo(e.target.value)}
                      placeholder="Ej: Pavilion 15, IdeaPad Slim 3"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-xs focus:outline-none focus:border-[#00346F]"
                    />
                  </div>
                </div>

                {/* CAMPOS CONTEXTUALES SEGÚN TIPO DE EQUIPO */}
                {tipoEquipoBehavior === 'COMPUTO' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">N° de Serie / Service Tag</label>
                      <input
                        type="text"
                        value={newOrderSerie}
                        onChange={(e) => setNewOrderSerie(e.target.value.toUpperCase())}
                        placeholder="Ej: SN-9482019"
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-medium uppercase text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                        <span>Clave de Usuario / PIN de Windows</span>
                      </label>
                      <input
                        type="text"
                        value={newOrderPassword}
                        onChange={(e) => setNewOrderPassword(e.target.value)}
                        placeholder="Ej: 123456 o 'Sin clave'"
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-xs focus:outline-none focus:border-[#00346F]"
                      />
                    </div>
                  </div>
                )}

                {tipoEquipoBehavior === 'IMPRESORA' && (
                  <div className="space-y-3 p-3 bg-blue-50/50 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#00346F]">
                      <Printer className="w-4 h-4 text-[#00346F]" />
                      <span>Especificaciones de Impresión (Sin clave de Windows)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">N° de Serie de Impresora</label>
                        <input
                          type="text"
                          value={newOrderSerie}
                          onChange={(e) => setNewOrderSerie(e.target.value.toUpperCase())}
                          placeholder="Ej: SN-EPS-9821"
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-medium uppercase text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">Sistema de Tinta / Impresión *</label>
                        <select
                          value={impresoraSistema}
                          onChange={(e) => setImpresoraSistema(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-xs focus:outline-none focus:border-[#00346F]"
                        >
                          <option value="EcoTank / Tanque Continuo">EcoTank / Tanque Continuo</option>
                          <option value="Tóner Láser Monocromático">Tóner Láser Monocromático</option>
                          <option value="Tóner Láser Color">Tóner Láser Color</option>
                          <option value="Cartuchos de Tinta">Cartuchos de Tinta</option>
                          <option value="Matricial / Térmica">Matricial / Térmica (Tickets)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">Estado de Consumibles *</label>
                        <select
                          value={impresoraConsumibles}
                          onChange={(e) => setImpresoraConsumibles(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-xs focus:outline-none focus:border-[#00346F]"
                        >
                          <option value="Con tanques/tóner instalados">Con tanques/tóner instalados</option>
                          <option value="Sin consumibles / Tanques vacíos">Sin consumibles / Tanques vacíos</option>
                          <option value="Con atasco de papel">Con atasco de papel</option>
                          <option value="Trae hojas de prueba impresas">Trae hojas de prueba impresas</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {tipoEquipoBehavior === 'MONITOR' && (
                  <div className="space-y-3 p-3 bg-blue-50/50 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#00346F]">
                      <Monitor className="w-4 h-4 text-[#00346F]" />
                      <span>Especificaciones de Pantalla (Sin clave de Windows)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">N° de Serie / Service Tag</label>
                        <input
                          type="text"
                          value={newOrderSerie}
                          onChange={(e) => setNewOrderSerie(e.target.value.toUpperCase())}
                          placeholder="Ej: SN-MON-3841"
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-medium uppercase text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">Base / Soporte de pie *</label>
                        <select
                          value={monitorBase}
                          onChange={(e) => setMonitorBase(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-xs focus:outline-none focus:border-[#00346F]"
                        >
                          <option value="Con base/pie original">Con base/pie original</option>
                          <option value="Sin base (solo panel/pantalla)">Sin base (solo panel/pantalla)</option>
                          <option value="Con soporte de pared / brazo VESA">Con soporte de pared / brazo VESA</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">Puerto / Entrada Principal *</label>
                        <select
                          value={monitorConector}
                          onChange={(e) => setMonitorConector(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-xs focus:outline-none focus:border-[#00346F]"
                        >
                          <option value="HDMI">HDMI</option>
                          <option value="DisplayPort">DisplayPort</option>
                          <option value="VGA">VGA</option>
                          <option value="USB-C / Thunderbolt">USB-C / Thunderbolt</option>
                          <option value="Múltiples puertos">Múltiples puertos</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {tipoEquipoBehavior === 'GENERAL' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">N° de Serie / Código</label>
                      <input
                        type="text"
                        value={newOrderSerie}
                        onChange={(e) => setNewOrderSerie(e.target.value.toUpperCase())}
                        placeholder="Ej: SN-GEN-1029"
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-medium uppercase text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Clave o Código (Opcional)</label>
                      <input
                        type="text"
                        value={newOrderPassword}
                        onChange={(e) => setNewOrderPassword(e.target.value)}
                        placeholder="Dejar vacío si no aplica"
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* ACCESORIOS DEJADOS CONTEXTUALES */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                    <label className="block font-bold text-slate-700 text-xs">
                      Accesorios Recibidos / Dejados por el Cliente
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Haga clic para marcar o desmarcar
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {ACCESORIOS_PRESETS[tipoEquipoBehavior].map((acc) => {
                      const isSelected = newOrderAccesorios.includes(acc);
                      return (
                        <button
                          key={acc}
                          type="button"
                          onClick={() => handleToggleAccesorio(acc)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-[#00346F] text-white border-[#00346F] shadow-2xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] font-bold ${
                              isSelected ? 'bg-white text-[#00346F]' : 'border border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected ? '✓' : ''}
                          </span>
                          <span>{acc}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={customAccesorio}
                      onChange={(e) => setCustomAccesorio(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomAccesorio();
                        }
                      }}
                      placeholder="Otro accesorio adicional (ej: Cable especial, Mochila, etc.)..."
                      className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-[#00346F]"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomAccesorio}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer border border-slate-300 transition-colors"
                    >
                      + Añadir
                    </button>
                  </div>
                </div>
              </div>

              {/* 5. FALLA REPORTADA Y ACCESORIOS */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Falla / Motivo de Ingreso Reportado por el Cliente *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={newOrderFalla}
                    onChange={(e) => setNewOrderFalla(e.target.value)}
                    placeholder="Detalle exactamente lo que informa el cliente: no enciende, pantalla azul, lentitud, bisagra rota..."
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-medium focus:outline-none focus:border-[#00346F]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Estado Estético al Recibir</label>
                    <input
                      type="text"
                      value={newOrderEstetico}
                      onChange={(e) => setNewOrderEstetico(e.target.value)}
                      placeholder="Ej: Rayones en tapa, bisagra izquierda floja"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Técnico Asignado en Taller *</label>
                    <select
                      value={newOrderTecnicoId}
                      onChange={(e) => setNewOrderTecnicoId(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
                    >
                      {tecnicos.length === 0 ? (
                        <option value="">(Sin técnicos registrados)</option>
                      ) : (
                        tecnicos.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nombreCompleto} ({t.rolNombre || t.rol})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Prioridad</label>
                    <select
                      value={newOrderPrioridad}
                      onChange={(e) => setNewOrderPrioridad(e.target.value as any)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold"
                    >
                      <option value="NORMAL">Normal (24 a 48h)</option>
                      <option value="ALTA">Alta (Mismo día)</option>
                      <option value="URGENTE">Urgente (Inmediato)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Adelanto en Caja (S/)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={newOrderAdelanto}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setNewOrderAdelanto(e.target.value)}
                      placeholder="0.00"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold focus:border-[#00346F] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="p-4 bg-white border border-slate-200 flex justify-end gap-2 rounded-xl">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingOrder}
                  className="px-6 py-2 bg-[#00346F] hover:bg-[#004A99] disabled:opacity-50 text-white rounded-lg font-bold shadow flex items-center gap-1.5 cursor-pointer"
                >
                  {isSavingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Generar Ticket de Ingreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EXPRESS: REGISTRO DE CLIENTE RÁPIDO */}
      {isQuickClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-3 bg-[#00346F] text-white flex justify-between items-center">
              <span className="font-bold text-xs flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                Registrar Nuevo Cliente en Mostrador
              </span>
              <button onClick={() => setIsQuickClientModalOpen(false)} className="text-white/70 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveQuickClient} className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Tipo</label>
                  <select
                    value={quickClientForm.tipoDocumento}
                    onChange={(e) => setQuickClientForm({ ...quickClientForm, tipoDocumento: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  >
                    <option value="DNI">DNI</option>
                    <option value="RUC">RUC</option>
                    <option value="CE">C.E.</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block font-semibold text-slate-600">N° Documento *</label>
                    <span className="text-[10px] text-blue-700 font-bold">RENIEC / SUNAT</span>
                  </div>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      required
                      value={quickClientForm.numeroDocumento}
                      onChange={(e) => setQuickClientForm({ ...quickClientForm, numeroDocumento: e.target.value.trim() })}
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono text-xs"
                      placeholder="72345678"
                    />
                    <button
                      type="button"
                      onClick={handleConsultarDocumentoQuick}
                      disabled={isQueryingReniec || !quickClientForm.numeroDocumento}
                      className="px-2.5 py-1.5 bg-[#00346F] text-white rounded-lg font-bold text-xs shrink-0 cursor-pointer"
                    >
                      {isQueryingReniec ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Nombre Completo / Razón Social *</label>
                <input
                  type="text"
                  required
                  value={quickClientForm.razonSocial}
                  onChange={(e) => setQuickClientForm({ ...quickClientForm, razonSocial: e.target.value })}
                  placeholder="Juan Carlos Pérez"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={quickClientForm.telefono}
                    onChange={(e) => setQuickClientForm({ ...quickClientForm, telefono: e.target.value })}
                    placeholder="987654321"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={quickClientForm.email}
                    onChange={(e) => setQuickClientForm({ ...quickClientForm, email: e.target.value })}
                    placeholder="cliente@gmail.com"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuickClientModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingQuickClient}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold cursor-pointer"
                >
                  Guardar y Seleccionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TICKET GENERADO PARA IMPRESIÓN Y ENVÍO */}
      {ticketGenerado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-[#00346F] text-white flex justify-between items-center border-b border-blue-900">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold">Comprobante de Recepción • Ticket Generado</h3>
                  <p className="text-[10px] text-blue-200 font-mono">Orden: {ticketGenerado.codigo}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTicketGenerado(null);
                  onClose();
                }}
                className="text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido: Ticket visual + Acciones */}
            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6 bg-[#F8FAFC]">
              {/* Tarjeta del Ticket */}
              <div className="md:col-span-7 flex justify-center">
                <div
                  id="ticket-modal-card"
                  className="printable-content bg-white p-5 rounded-xl border border-slate-300 shadow-xs w-full font-mono text-[11px] text-slate-800 space-y-3"
                >
                  <div className="text-center space-y-1 border-b border-slate-300 pb-3">
                    <span className="text-sm font-extrabold text-[#00346F] block tracking-wide">
                      MG SOLUTIONS GROUP S.A.C.
                    </span>
                    <span className="block text-slate-600">RUC: 20609737524</span>
                    <span className="block text-[10px] text-slate-500 uppercase">
                      Taller & Soporte Técnico Especializado
                    </span>
                    <div className="mt-2 py-1 px-3 bg-blue-50 border border-blue-200 rounded font-bold text-sm text-[#00346F] inline-block">
                      TICKET DE INGRESO: {ticketGenerado.codigo}
                    </div>
                  </div>

                  <div className="space-y-1 border-b border-slate-300 pb-2.5">
                    <div><strong>CLIENTE:</strong> {ticketGenerado.clienteNombre}</div>
                    <div><strong>DOC:</strong> {ticketGenerado.clienteDocumento || 'No registrado'}</div>
                    <div><strong>TELÉFONO:</strong> {ticketGenerado.clienteTelefono || 'No registrado'}</div>
                    <div><strong>FECHA INGRESO:</strong> {ticketGenerado.fechaIngreso}</div>
                    <div><strong>RECEPCIONADO POR:</strong> {ticketGenerado.recepcionadoPorNombre}</div>
                  </div>

                  <div className="space-y-1 border-b border-slate-300 pb-2.5">
                    <div><strong>EQUIPO:</strong> {ticketGenerado.tipoEquipo} {ticketGenerado.marca} {ticketGenerado.modelo}</div>
                    <div><strong>SERIE:</strong> {ticketGenerado.numeroSerie}</div>
                    {ticketGenerado.passwordEquipo && ticketGenerado.passwordEquipo !== 'No aplica' && (
                      <div><strong>CLAVE/PIN:</strong> {ticketGenerado.passwordEquipo}</div>
                    )}
                    <div><strong>ACCESORIOS:</strong> {ticketGenerado.accesoriosDejados.join(', ')}</div>
                    <div><strong>FALLA REPORTADA:</strong> {ticketGenerado.fallaReportada}</div>
                    <div><strong>TÉCNICO ASIGNADO:</strong> {ticketGenerado.tecnicoNombre}</div>
                  </div>

                  <div className="space-y-1 border-b border-slate-300 pb-2.5">
                    <div className="flex justify-between text-emerald-700">
                      <span>ADELANTO EN CAJA:</span>
                      <span className="font-bold">S/ {ticketGenerado.adelantoPagado.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-0.5">
                      <span>ESTADO INICIAL:</span>
                      <span className="text-blue-700 font-bold uppercase">{ticketGenerado.estado}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 text-center space-y-1 pt-1">
                    <p>* Todo equipo no recogido en 30 días pasará a remate administrativo.</p>
                    <p>* Consulte el avance con el código {ticketGenerado.codigo} o acercándose a mostrador.</p>
                  </div>
                </div>
              </div>

              {/* Acciones: Imprimir, WhatsApp, Correo */}
              <div className="md:col-span-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-[#00346F]">
                        <Printer className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs text-slate-800">1. Imprimir Comprobante</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Imprima el ticket para entregárselo físicamente al cliente al recibir el equipo.
                    </p>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="w-full py-2 bg-[#00346F] hover:bg-[#004A99] text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      Imprimir Ticket en Mostrador
                    </button>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs text-slate-800">2. Enviar por WhatsApp</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const msg = encodeURIComponent(
                          `*MG SOLUTIONS - CONSTANCIA DE RECEPCIÓN*\n\n` +
                          `Hola *${ticketGenerado.clienteNombre}*, confirmamos el ingreso de su equipo a soporte técnico:\n` +
                          `• *Ticket:* ${ticketGenerado.codigo}\n` +
                          `• *Equipo:* ${ticketGenerado.tipoEquipo} ${ticketGenerado.marca} ${ticketGenerado.modelo}\n` +
                          `• *Serie:* ${ticketGenerado.numeroSerie}\n` +
                          `• *Falla:* ${ticketGenerado.fallaReportada}\n` +
                          `• *Adelanto:* S/ ${ticketGenerado.adelantoPagado.toFixed(2)}\n\n` +
                          `Le notificaremos en cuanto concluyamos el diagnóstico.`
                        );
                        const phone = (ticketGenerado.clienteTelefono || '').replace(/\D/g, '');
                        window.open(`https://wa.me/51${phone}?text=${msg}`, '_blank');
                      }}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Enviar Ticket por WhatsApp
                    </button>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
                        <Mail className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs text-slate-800">3. Enviar por Correo</span>
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      <input
                        type="email"
                        value={ticketEmailInput}
                        onChange={(e) => setTicketEmailInput(e.target.value)}
                        placeholder="cliente@gmail.com"
                        className="flex-1 p-2 border border-slate-300 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleSendTicketEmail}
                        disabled={isSendingTicketEmail || !ticketEmailInput.trim()}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        {isSendingTicketEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {ticketEmailSent && (
                      <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ Correo enviado con éxito</p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setTicketGenerado(null);
                    onClose();
                  }}
                  className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                >
                  Finalizar y Volver a Recepción
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
