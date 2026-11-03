import React, { useEffect, useState, useMemo } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Phone,
  MessageSquare,
  Printer,
  UserCheck,
  Package,
  Layers,
  Sparkles,
  Laptop,
  Monitor,
  Printer as PrinterIcon,
  HardDrive,
  Cpu,
  ChevronRight,
  Eye,
  Edit3,
  Trash2,
  DollarSign,
  Calendar,
  Shield,
  HelpCircle,
  X,
  Share2,
  UserPlus,
  History,
  RotateCcw,
  Check,
  ChevronDown,
  ShieldCheck,
  ShieldAlert,
  XCircle,
  Truck,
  Building2,
  Mail,
  Loader2,
} from 'lucide-react';

import {
  OrdenServicio,
  EstadoOrdenServicio,
  TipoEquipo,
  Usuario,
  Cliente,
  Producto,
  Marca,
  Modelo,
  Equipo,
  RepuestoUtilizado,
  ManoObraServicio,
  BitacoraAvance,
  ComunicacionCliente,
  Categoria,
  Proveedor,
} from '../types';
import { brandModelService } from '../services/brandModel.service';
import { categoryService } from '../services/category.service';
import { warrantyService, ResultadoGarantia } from '../services/warranty.service';
import { userService } from '../services/user.service';
import { workshopService } from '../services/workshop.service';

interface TechnicalWorkshopViewProps {
  ordenes: OrdenServicio[];
  usuarios: Usuario[];
  clientes: Cliente[];
  productos: Producto[];
  marcas?: Marca[];
  categorias?: Categoria[];
  proveedores?: Proveedor[];
  equipos?: Equipo[];
  currentUser: Usuario;
  onSaveOrden: (orden: OrdenServicio) => void;
  onUpdateProductoStock: (productoId: number, delta: number) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  onSaveCliente?: (cliente: Cliente) => void;
  preselectedClientId?: number;
  onClearPreselectedClient?: () => void;
  readOnly?: boolean;
}

const ESTADOS_CONFIG: Record<
  EstadoOrdenServicio,
  { label: string; bg: string; text: string; border: string; desc: string }
> = {
  RECEPCIONADO: {
    label: '1. Recepcionado',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    desc: 'Equipo ingresado en recepción por secretaría',
  },
  EN_DIAGNOSTICO: {
    label: '2. En Diagnóstico',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    desc: 'Técnico evaluando hardware y componentes',
  },
  PRESUPUESTADO: {
    label: '3. Presupuestado',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    desc: 'Costos calculados, esperando respuesta de cliente',
  },
  APROBADO_EN_REPARACION: {
    label: '4. En Reparación',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    desc: 'Cliente aprobó, técnico ejecutando solución',
  },
  ESPERA_REPUESTOS: {
    label: '5. Espera Repuestos',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    desc: 'A la espera de piezas de almacén o proveedor',
  },
  REPARADO_PROBADO: {
    label: '6. Reparado & Probado',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
    desc: 'Solucionado y con pruebas de estrés superadas',
  },
  LISTO_ENTREGA: {
    label: '7. Listo para Entrega',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    desc: 'En mostrador listo para recojo del cliente',
  },
  ENTREGADO_COBRADO: {
    label: '8. Entregado & Cobrado',
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-300',
    desc: 'Entregado con conformidad y constancia de servicio',
  },
  RECHAZADO_DEVUELTO: {
    label: 'Rechazado / Sin Reparación',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    desc: 'Cliente no autorizó o equipo irreparable',
  },
};

export const TechnicalWorkshopView: React.FC<TechnicalWorkshopViewProps> = ({
  ordenes,
  usuarios,
  clientes,
  productos,
  marcas = [],
  categorias = [],
  proveedores = [],
  equipos = [],
  currentUser,
  onSaveOrden,
  onUpdateProductoStock,
  onShowToast,
  onSaveCliente,
  preselectedClientId,
  onClearPreselectedClient,
  readOnly = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [technicianFilter, setTechnicianFilter] = useState<string>('TODOS');
  const [selectedOrder, setSelectedOrder] = useState<OrdenServicio | null>(null);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // New Order Form State
  const [ingresoModo, setIngresoModo] = useState<'SERVICIO' | 'GARANTIA'>('SERVICIO');
  const [dbMarcas, setDbMarcas] = useState<Marca[]>(marcas);
  const [dbModelos, setDbModelos] = useState<Modelo[]>([]);
  const [dbCategorias, setDbCategorias] = useState<Categoria[]>(categorias);
  const [dbUsuarios, setDbUsuarios] = useState<Usuario[]>(usuarios);
  const [garantiaResultado, setGarantiaResultado] = useState<ResultadoGarantia | null>(null);
  const [verificandoGarantia, setVerificandoGarantia] = useState(false);
  const [checklistGarantia, setChecklistGarantia] = useState({
    pantallaIntegra: false,
    sinLiquidos: false,
    sinGolpes: false,
    sellosIntactos: false,
  });

  const checklistGarantiaCompleto =
    checklistGarantia.pantallaIntegra &&
    checklistGarantia.sinLiquidos &&
    checklistGarantia.sinGolpes &&
    checklistGarantia.sellosIntactos;

  // Datos para Ficha de Reporte RMA con Proveedor / Mayorista
  const [garantiaProveedorNombre, setGarantiaProveedorNombre] = useState('DELTRON PERÚ (Mayorista Oficial)');
  const [garantiaProveedorContacto, setGarantiaProveedorContacto] = useState('Dpto. RMA & Garantías');
  const [garantiaProveedorTelefono, setGarantiaProveedorTelefono] = useState('01 411-0000 / 998-123-456');
  const [garantiaProveedorEmail, setGarantiaProveedorEmail] = useState('rma@deltron.pe');
  const [isRmaModalOpen, setIsRmaModalOpen] = useState(false);
  const [rmaReportData, setRmaReportData] = useState<{
    codigo: string;
    fecha: string;
    clienteNombre: string;
    clienteDocumento: string;
    clienteTelefono: string;
    productoNombre: string;
    marca: string;
    modelo: string;
    numeroSerie: string;
    comprobanteVenta: string;
    fallaReclamada: string;
    proveedorNombre: string;
    proveedorContacto: string;
    proveedorTelefono: string;
    proveedorEmail: string;
    diasRestantes: number;
  } | null>(null);

  const [newOrderClienteId, setNewOrderClienteId] = useState<number>(() => {
    const primerActivo = clientes.find((c) => c.estado === 'ACTIVO');
    return primerActivo ? primerActivo.id : 0;
  });
  const [newOrderTipo, setNewOrderTipo] = useState<string>('Laptop / Portátil');
  const [newOrderMarca, setNewOrderMarca] = useState('');
  const [newOrderModelo, setNewOrderModelo] = useState('');
  const [newOrderSerie, setNewOrderSerie] = useState('');
  const [newOrderPassword, setNewOrderPassword] = useState('');
  const [newOrderFalla, setNewOrderFalla] = useState('');
  const [newOrderEstetico, setNewOrderEstetico] = useState('Buen estado general.');
  const [newOrderPrioridad, setNewOrderPrioridad] = useState<'NORMAL' | 'ALTA' | 'URGENTE'>('NORMAL');
  const [newOrderTecnicoId, setNewOrderTecnicoId] = useState<number>(() => {
    const tec = usuarios.find((u) => {
      const rolCod = String(u.rol || (u as any).rol_codigo || '').toUpperCase();
      const rolNom = String(u.rolNombre || (u as any).rol_nombre || '').toUpperCase();
      return (rolCod === 'TECNICO' || rolNom.includes('TECNIC')) && (!u.estado || u.estado === 'ACTIVO');
    });
    return tec ? tec.id : usuarios[0]?.id || 1;
  });
  const [newOrderAccesorios, setNewOrderAccesorios] = useState<string[]>(['Cargador original']);
  const [newOrderAdelanto, setNewOrderAdelanto] = useState<string>('');

  // Estado para el modal de Ticket Generado (imprimir o enviar por correo)
  const [ticketModalOrder, setTicketModalOrder] = useState<OrdenServicio | null>(null);
  const [ticketEmailInput, setTicketEmailInput] = useState<string>('');
  const [isSendingTicketEmail, setIsSendingTicketEmail] = useState<boolean>(false);
  const [ticketEmailSent, setTicketEmailSent] = useState<boolean>(false);

  const handleSendTicketEmail = async (orderToSend?: OrdenServicio, customEmail?: string) => {
    const order = orderToSend || ticketModalOrder || selectedOrder;
    if (!order) return;
    const targetEmail = (customEmail !== undefined ? customEmail : ticketEmailInput).trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      onShowToast('Correo Requerido', 'Por favor ingrese un correo electrónico válido para enviar el ticket.', 'error');
      return;
    }

    setIsSendingTicketEmail(true);
    try {
      const res = await workshopService.sendTicketEmail({
        toEmail: targetEmail,
        clienteNombre: order.clienteNombre,
        clienteDocumento: order.clienteDocumento,
        clienteTelefono: order.clienteTelefono,
        codigoOrden: order.codigo,
        fechaIngreso: order.fechaIngreso,
        tipoEquipo: order.tipoEquipo,
        marca: order.marca,
        modelo: order.modelo,
        numeroSerie: order.numeroSerie,
        accesorios: order.accesoriosDejados,
        fallaReportada: order.fallaReportada,
        presupuestoTotal: order.costoTotal,
        adelantoPagado: order.adelantoPagado,
        saldoPendiente: order.saldoPendiente,
        garantiaDias: order.garantiaDias || 90,
        tecnicoNombre: order.tecnicoNombre,
      });

      if (res.success) {
        setTicketEmailSent(true);
        onShowToast('Correo Enviado', res.message || `Ticket enviado exitosamente a ${targetEmail}`, 'success');
      } else {
        onShowToast('Error al enviar correo', res.message || 'No se pudo entregar el correo del ticket.', 'error');
      }
    } catch (err: any) {
      onShowToast('Error', err.message || 'Error al conectar con el servidor de correo.', 'error');
    } finally {
      setIsSendingTicketEmail(false);
    }
  };


  useEffect(() => {
    if (usuarios && usuarios.length > 0) {
      setDbUsuarios(usuarios);
    }
  }, [usuarios]);

  // Si el cliente seleccionado no existe o está inactivo, auto-seleccionar el primer cliente activo
  useEffect(() => {
    const current = clientes.find((c) => c.id === Number(newOrderClienteId));
    if (!current || current.estado !== 'ACTIVO') {
      const activeCli = clientes.find((c) => c.estado === 'ACTIVO');
      setNewOrderClienteId(activeCli ? activeCli.id : 0);
    }
  }, [clientes, newOrderClienteId]);

  // Cargar marcas, modelos, categorías y técnicos de MySQL al abrir o montar
  useEffect(() => {
    async function loadCatalog() {
      try {
        const [resM, resMod, resCat, resUsers] = await Promise.all([
          brandModelService.getMarcas(),
          brandModelService.getModelos(),
          categoryService.getCategorias(),
          userService.getUsers(),
        ]);
        if (resM.success && resM.marcas) setDbMarcas(resM.marcas);
        if (resMod.success && resMod.modelos) setDbModelos(resMod.modelos);
        if (resCat.success && resCat.categorias && resCat.categorias.length > 0) {
          setDbCategorias(resCat.categorias);
          const primerEquipo = resCat.categorias.find((c) => c.esEquipoTaller && c.estado === 'ACTIVO');
          if (primerEquipo) {
            setNewOrderTipo(primerEquipo.nombre);
          } else {
            setNewOrderTipo(resCat.categorias[0].nombre);
          }
        }
        if (resUsers.success && resUsers.usuarios && resUsers.usuarios.length > 0) {
          setDbUsuarios(resUsers.usuarios);
        }
      } catch (err) {
        console.error('Error cargando catálogo y técnicos en taller:', err);
      }
    }
    loadCatalog();
  }, []);

  // Smart Client Search & Quick Register State
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [isClientSearchDropdownOpen, setIsClientSearchDropdownOpen] = useState(false);
  const [isQuickClientModalOpen, setIsQuickClientModalOpen] = useState(false);
  const [quickClientForm, setQuickClientForm] = useState<{
    tipoDocumento: 'DNI' | 'RUC';
    numeroDocumento: string;
    razonSocial: string;
    telefono: string;
    email: string;
    direccion: string;
  }>({
    tipoDocumento: 'DNI',
    numeroDocumento: '',
    razonSocial: '',
    telefono: '',
    email: '',
    direccion: '',
  });

  const selectedClient = clientes.find(
    (c) => c.id === Number(newOrderClienteId) && c.estado === 'ACTIVO'
  );

  const filteredClients = clientes.filter((c) => {
    if (c.estado !== 'ACTIVO') return false;
    if (!clientSearchQuery.trim()) return true;
    const q = clientSearchQuery.toLowerCase().trim();
    return (
      c.razonSocial.toLowerCase().includes(q) ||
      c.numeroDocumento.includes(q) ||
      (c.telefono && c.telefono.includes(q))
    );
  });

  // Client's registered equipment history for 1-click autocomplete
  const clientRegisteredEquipos = (equipos || []).filter(
    (eq) => eq.clienteId === newOrderClienteId
  );
  const clientPastEquiposFromOrders = ordenes
    .filter((o) => o.clienteId === newOrderClienteId)
    .map((o) => ({
      id: o.id,
      tipo: o.tipoEquipo,
      marca: o.marca,
      modelo: o.modelo,
      numeroSerie: o.numeroSerie,
      accesorios: o.accesoriosDejados.join(', '),
    }));

  const allClientEquipos = [
    ...clientRegisteredEquipos.map((eq) => ({
      id: eq.id,
      tipo: eq.tipo,
      marca: eq.marca,
      modelo: eq.modelo,
      numeroSerie: eq.numeroSerie,
      accesorios: Array.isArray(eq.accesorios) ? eq.accesorios.join(', ') : String(eq.accesorios || ''),
    })),
    ...clientPastEquiposFromOrders,
  ].filter(
    (item, index, self) =>
      index ===
      self.findIndex(
        (t) =>
          t.marca.toLowerCase() === item.marca.toLowerCase() &&
          t.modelo.toLowerCase() === item.modelo.toLowerCase() &&
          (t.numeroSerie ? t.numeroSerie === item.numeroSerie : true)
      )
  );

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
        onShowToast(
          'Garantía Vencida',
          `La garantía expiró hace ${res.diasVencida || 0} días (el ${res.fechaExpiracion || 'anteriormente'}).`,
          'error'
        );
        setIngresoModo('SERVICIO');
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
      } else {
        onShowToast('No registrado', res.message || 'Esta serie no figura como vendida por MG Solutions.', 'warning');
        setIngresoModo('SERVICIO');
      }
    } catch (err) {
      console.error('Error al verificar garantía:', err);
      onShowToast('Error', 'No se pudo conectar al verificador de garantías.', 'error');
    } finally {
      setVerificandoGarantia(false);
    }
  };

  const handleSelectPreExistingEquipo = (eq: {
    tipo: TipoEquipo;
    marca: string;
    modelo: string;
    numeroSerie?: string;
    accesorios?: string;
  }) => {
    setNewOrderTipo(eq.tipo);
    setNewOrderMarca(eq.marca);
    setNewOrderModelo(eq.modelo);
    if (eq.numeroSerie) setNewOrderSerie(eq.numeroSerie);
    if (eq.accesorios) {
      setNewOrderAccesorios(eq.accesorios.split(',').map((s) => s.trim()).filter(Boolean));
    }
    onShowToast('Equipo seleccionado', `Se cargaron los datos de "${eq.marca} ${eq.modelo}".`, 'info');
  };

  const handleQuickClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickClientForm.numeroDocumento.trim() || !quickClientForm.razonSocial.trim()) {
      onShowToast('Error', 'Complete documento y nombre del cliente.', 'warning');
      return;
    }
    const newClient: Cliente = {
      id: Date.now(),
      tipoDocumento: quickClientForm.tipoDocumento,
      numeroDocumento: quickClientForm.numeroDocumento.trim(),
      razonSocial: quickClientForm.razonSocial.trim().toUpperCase(),
      telefono: quickClientForm.telefono.trim(),
      email: quickClientForm.email.trim(),
      direccionFiscal: quickClientForm.direccion.trim(),
      estado: 'ACTIVO',
      fechaRegistro: new Date().toISOString().split('T')[0],
    };

    if (onSaveCliente) {
      onSaveCliente(newClient);
    }
    setNewOrderClienteId(newClient.id);
    setIsQuickClientModalOpen(false);
    setIsClientSearchDropdownOpen(false);
    setClientSearchQuery('');
    onShowToast('Cliente registrado', `Cliente ${newClient.razonSocial} añadido y seleccionado.`, 'success');
  };

  useEffect(() => {
    if (preselectedClientId === undefined) return;
    setNewOrderClienteId(preselectedClientId);
    setIsNewOrderModalOpen(true);
    onClearPreselectedClient?.();
  }, [preselectedClientId, onClearPreselectedClient]);

  // Helper para determinar el siguiente estado lógico técnico sugerido
  const getSiguienteEstadoLogico = (estado: EstadoOrdenServicio): EstadoOrdenServicio => {
    switch (estado) {
      case 'RECEPCIONADO':
        return 'EN_DIAGNOSTICO';
      case 'EN_DIAGNOSTICO':
        return 'PRESUPUESTADO';
      case 'PRESUPUESTADO':
        return 'APROBADO_EN_REPARACION';
      case 'ESPERA_REPUESTOS':
        return 'APROBADO_EN_REPARACION';
      case 'APROBADO_EN_REPARACION':
        return 'REPARADO_PROBADO';
      case 'REPARADO_PROBADO':
        return 'LISTO_ENTREGA';
      default:
        return estado;
    }
  };

  // Detail Modal Sub-forms
  const [activeDetailTab, setActiveDetailTab] = useState<'flujo' | 'bitacora' | 'repuestos' | 'ticket'>('flujo');
  const [newAvanceTitulo, setNewAvanceTitulo] = useState('');
  const [newAvanceDesc, setNewAvanceDesc] = useState('');
  const [newAvanceEstado, setNewAvanceEstado] = useState<EstadoOrdenServicio>('EN_DIAGNOSTICO');

  // Repuestos e insumos filtrados exclusivamente para uso técnico en taller
  const repuestosDisponibles = useMemo(() => {
    return productos.filter((p) => {
      if (p.estado !== 'ACTIVO') return false;

      // 1. Verificar categoría asociada en dbCategorias
      const cat = dbCategorias.find(
        (c) => c.id === p.categoriaId || (c.nombre && p.categoriaNombre && c.nombre.toUpperCase() === p.categoriaNombre.toUpperCase())
      );

      // Si la categoría tiene marcado explícitamente esRepuestoTaller
      if (cat?.esRepuestoTaller) {
        return true;
      }

      // Si la categoría es exclusivamente para venta comercial (ej: laptops completas, impresoras) y no repuesto
      if (cat && cat.esVenta && !cat.esRepuestoTaller) {
        return false;
      }
      if (cat && cat.esEquipoTaller && !cat.esRepuestoTaller) {
        return false;
      }

      // 2. Si el producto tiene tipoDestino explícito de taller
      if (p.tipoDestino === 'SERVICIO_TALLER' || p.tipoDestino === 'MIXTO') {
        return true;
      }

      // 3. Verificación heurística por código o nombre
      const catNom = (p.categoriaNombre || cat?.nombre || '').toUpperCase();
      const prodNom = (p.nombre || '').toUpperCase();
      const prodCod = (p.codigo || '').toUpperCase();

      const esPalabraRepuesto =
        prodCod.startsWith('REP-') ||
        prodCod.startsWith('INS-') ||
        catNom.includes('REPUESTO') ||
        catNom.includes('COMPONENTE') ||
        catNom.includes('HARDWARE') ||
        prodNom.includes('PANTALLA') ||
        prodNom.includes('TECLADO') ||
        prodNom.includes('MEMORIA RAM') ||
        prodNom.includes('DISCO') ||
        prodNom.includes('SSD') ||
        prodNom.includes('PASTA TÉRMICA') ||
        prodNom.includes('PASTA TERMICA') ||
        prodNom.includes('BATERÍA') ||
        prodNom.includes('BATERIA') ||
        prodNom.includes('PIN DE CARGA') ||
        prodNom.includes('FLEX') ||
        prodNom.includes('JACK DC');

      const esEquipoTerminadoVenta =
        (catNom.includes('LAPTOP') || catNom.includes('NOTEBOOK') || catNom.includes('IMPRESORA') || catNom.includes('MONITOR')) &&
        !catNom.includes('REPUESTO') &&
        !catNom.includes('PARTE');

      return esPalabraRepuesto && !esEquipoTerminadoVenta;
    });
  }, [productos, dbCategorias]);

  // Repuestos in detail
  const [selectedProdId, setSelectedProdId] = useState<number>(() => repuestosDisponibles[0]?.id || 0);
  const [repuestoCantidad, setRepuestoCantidad] = useState<number>(1);
  const [newServicioDesc, setNewServicioDesc] = useState('');
  const [newServicioPrecio, setNewServicioPrecio] = useState<string>('50');

  useEffect(() => {
    if (repuestosDisponibles.length > 0) {
      const existe = repuestosDisponibles.some((r) => r.id === selectedProdId);
      if (!existe) {
        setSelectedProdId(repuestosDisponibles[0].id);
      }
    }
  }, [repuestosDisponibles, selectedProdId]);





  // Modelos filtrados dinámicamente según la marca seleccionada
  const modelosDeMarcaSeleccionada = dbModelos.filter((m) => {
    if (!newOrderMarca) return false;
    const brandName = newOrderMarca.toUpperCase().trim();
    const directMatch = m.marcaNombre?.toUpperCase().trim() === brandName;
    const idMatch = dbMarcas.find((b) => b.id === m.marcaId)?.nombre.toUpperCase().trim() === brandName;
    return directMatch || idMatch;
  });

  const listaUsuarios = dbUsuarios && dbUsuarios.length > 0 ? dbUsuarios : usuarios;
  const tecnicos = listaUsuarios.filter((u) => {
    const rolCod = String(u.rol || (u as any).rol_codigo || '').toUpperCase().trim();
    const rolNom = String(u.rolNombre || (u as any).rol_nombre || '').toUpperCase().trim();
    const esTecnico =
      rolCod === 'TECNICO' ||
      rolNom.includes('TECNIC') ||
      rolNom.includes('TALLER');
    const estaActivo = !u.estado || u.estado.toUpperCase().trim() === 'ACTIVO';
    return esTecnico && estaActivo;
  });

  useEffect(() => {
    if (tecnicos.length > 0) {
      const existe = tecnicos.some((t) => t.id === newOrderTecnicoId);
      if (!newOrderTecnicoId || !existe) {
        setNewOrderTecnicoId(tecnicos[0].id);
      }
    }
  }, [tecnicos, newOrderTecnicoId]);

  const visibleOrders = currentUser.rol === 'TECNICO'
    ? ordenes.filter((order) => order.tecnicoId === currentUser.id)
    : ordenes;

  // Metrics
  const metricTotal = visibleOrders.length;
  const metricEnTaller = visibleOrders.filter((o) =>
    ['RECEPCIONADO', 'EN_DIAGNOSTICO', 'PRESUPUESTADO', 'APROBADO_EN_REPARACION', 'ESPERA_REPUESTOS'].includes(o.estado)
  ).length;
  const metricListos = visibleOrders.filter((o) => o.estado === 'LISTO_ENTREGA' || o.estado === 'REPARADO_PROBADO').length;
  const metricEntregados = visibleOrders.filter((o) => o.estado === 'ENTREGADO_COBRADO').length;

  // Filtered orders
  const filteredOrders = visibleOrders.filter((o) => {
    const matchesSearch =
      o.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.clienteDocumento.includes(searchTerm) ||
      o.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'TODOS' ? true : o.estado === statusFilter;
    const matchesTech =
      technicianFilter === 'TODOS'
        ? true
        : technicianFilter === 'MIS_ORDENES'
        ? o.tecnicoId === currentUser.id
        : o.tecnicoId === Number(technicianFilter);

    return matchesSearch && matchesStatus && matchesTech;
  });

  const handleOpenDetail = (order: OrdenServicio) => {
    setSelectedOrder(order);
    setNewAvanceEstado(getSiguienteEstadoLogico(order.estado));
    setActiveDetailTab('flujo');
    setIsDetailModalOpen(true);
  };

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateNewOrder = () => {
    const errors: Record<string, string> = {};
    if (!newOrderClienteId) errors.cliente = 'Seleccione un cliente.';

    if (ingresoModo === 'GARANTIA') {
      if (!newOrderSerie.trim()) errors.serie = 'Ingrese el número de serie para verificar la garantía.';
      if (!newOrderFalla.trim()) errors.falla = 'Describa la falla o motivo reclamado para garantía.';
      if (!checklistGarantiaCompleto) {
        errors.checklist = 'Debe verificar y marcar la conformidad de los 4 puntos del checklist físico para habilitar la garantía.';
        onShowToast('Inspección Incompleta', 'Debe validar la conformidad física del equipo (4 de 4 checks) para procesar la garantía oficial.', 'warning');
      }
      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    }

    if (!newOrderTipo) errors.tipo = 'Seleccione tipo de equipo.';
    if (!newOrderMarca.trim()) errors.marca = 'Ingrese la marca.';
    if (!newOrderModelo.trim()) errors.modelo = 'Ingrese el modelo.';
    if (!newOrderFalla.trim()) errors.falla = 'Describa la falla.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateNewOrder()) return;
    const cliente = clientes.find((c) => c.id === Number(newOrderClienteId));
    if (!cliente) return;

    if (cliente.estado === 'INACTIVO') {
      onShowToast('Cliente Inactivo', 'El cliente seleccionado está marcado como INACTIVO.', 'error');
      return;
    }

    const assignedTech = listaUsuarios.find((u) => u.id === Number(newOrderTecnicoId));
    const highest = ordenes.reduce((max, order) => {
      const match = order.codigo.match(/(\d+)$/);
      return Math.max(max, match ? Number(match[1]) : 0);
    }, 0) + 1;
    const prefix = ingresoModo === 'GARANTIA' ? 'GAR' : 'OT';
    let code = `${prefix}-2026-${String(highest).padStart(4, '0')}`;

    const finalMarca = ingresoModo === 'GARANTIA'
      ? (garantiaResultado?.producto?.marca || (newOrderMarca.trim() ? newOrderMarca : 'MG SOLUTIONS')).toUpperCase().trim()
      : newOrderMarca.toUpperCase().trim();

    const finalModelo = ingresoModo === 'GARANTIA'
      ? (garantiaResultado?.producto?.nombre || (newOrderModelo.trim() ? newOrderModelo : 'Equipo en Garantía')).trim()
      : newOrderModelo.trim();

    let newDbId = Date.now();
    try {
      const resOrder = await workshopService.createOrden({
        clienteId: cliente.id,
        sucursalId: currentUser.sucursalId || 1,
        tipoEquipo: ingresoModo === 'GARANTIA' ? 'GARANTIA_OFICIAL' : newOrderTipo,
        marca: finalMarca,
        modelo: finalModelo,
        numeroSerie: newOrderSerie.trim().toUpperCase() || 'S/N-SINDATO',
        accesorios: newOrderAccesorios,
        fallaReportada: newOrderFalla.trim(),
        prioridad: ingresoModo === 'GARANTIA' ? 'NORMAL' : newOrderPrioridad,
        tecnicoId: assignedTech ? assignedTech.id : currentUser.id,
        esGarantia: ingresoModo === 'GARANTIA',
        costoServicio: ingresoModo === 'GARANTIA' ? 0 : Number(newOrderAdelanto) || 0,
        observaciones: `Recepción ingresada por ${currentUser.nombreCompleto}`,
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
      clienteId: cliente.id,
      clienteNombre: cliente.razonSocial,
      clienteDocumento: cliente.numeroDocumento,
      clienteTelefono: cliente.telefono || '987654321',
      clienteEmail: cliente.email,
      tipoEquipo: ingresoModo === 'GARANTIA' ? 'GARANTIA_OFICIAL' : newOrderTipo,
      marca: finalMarca,
      modelo: finalModelo,
      numeroSerie: newOrderSerie.trim().toUpperCase() || 'S/N-SINDATO',
      passwordEquipo: ingresoModo === 'GARANTIA' ? 'No aplica' : newOrderPassword,
      accesoriosDejados: newOrderAccesorios.length > 0 ? newOrderAccesorios : ['Solo equipo'],
      fallaReportada: newOrderFalla.trim(),
      estadoEstetico: newOrderEstetico.trim(),
      prioridad: ingresoModo === 'GARANTIA' ? 'NORMAL' : newOrderPrioridad,
      tecnicoId: assignedTech ? assignedTech.id : currentUser.id,
      tecnicoNombre: assignedTech ? assignedTech.nombreCompleto : currentUser.nombreCompleto,
      recepcionadoPorId: currentUser.id,
      recepcionadoPorNombre: currentUser.nombreCompleto,
      fechaIngreso: new Date().toLocaleString('es-PE'),
      fechaEstimadaEntrega: ingresoModo === 'GARANTIA'
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
      bitacora: [
        {
          id: `b-${Date.now()}`,
          fecha: new Date().toLocaleString('es-PE'),
          autorNombre: currentUser.nombreCompleto,
          autorRol: currentUser.rol,
          titulo: ingresoModo === 'GARANTIA' ? 'Ingreso por Garantía Oficial (Costo S/ 0.00)' : 'Recepción del equipo e ingreso a taller',
          descripcion: ingresoModo === 'GARANTIA'
            ? `Equipo ingresado bajo cobertura de garantía oficial. Falla reclamada: "${newOrderFalla}". Plazo estimado: 7 a 30 días hábiles. Mayorista para RMA: ${garantiaProveedorNombre}. Checklist: Sin daños físicos ni líquidos.`
            : `Equipo ingresado por mostrador. Falla reportada: "${newOrderFalla}". Asignado al técnico ${assignedTech?.nombreCompleto || 'Especialista'}.`,
          estadoNuevo: 'RECEPCIONADO',
        },
      ],
      comunicaciones: [],
      garantiaDias: ingresoModo === 'GARANTIA' ? 180 : 90,
    };

    onSaveOrden(newOrder);

    if (ingresoModo === 'GARANTIA') {
      setRmaReportData({
        codigo: code,
        fecha: new Date().toLocaleDateString('es-PE'),
        clienteNombre: cliente.razonSocial,
        clienteDocumento: cliente.numeroDocumento,
        clienteTelefono: cliente.telefono || '987654321',
        productoNombre: finalModelo,
        marca: finalMarca,
        modelo: finalModelo,
        numeroSerie: newOrderSerie.trim().toUpperCase(),
        comprobanteVenta: garantiaResultado?.comprobante || 'VENTA MG SOLUTIONS',
        fallaReclamada: newOrderFalla.trim(),
        proveedorNombre: garantiaProveedorNombre,
        proveedorContacto: garantiaProveedorContacto,
        proveedorTelefono: garantiaProveedorTelefono,
        proveedorEmail: garantiaProveedorEmail,
        diasRestantes: garantiaResultado?.diasRestantes || 0,
      });
      setIsRmaModalOpen(true);
    } else {
      setTicketModalOrder(newOrder);
      setTicketEmailInput(cliente.email || '');
      setTicketEmailSent(false);
    }

    setIsNewOrderModalOpen(false);
    onShowToast(
      ingresoModo === 'GARANTIA' ? 'Garantía Registrada' : 'Orden Creada',
      ingresoModo === 'GARANTIA'
        ? `Orden ${code} generada bajo garantía oficial (S/ 0.00). Plazo: 7 a 30 días.`
        : `Orden ${code} generada. Puede imprimir el ticket o enviarlo por correo.`,
      'success'
    );
  };


  const handleAddAvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !newAvanceTitulo) return;
    if (currentUser.rol === 'TECNICO' && selectedOrder.tecnicoId !== currentUser.id) {
      onShowToast('Acceso restringido', 'Solo puedes actualizar tickets asignados a tu usuario.', 'error');
      return;
    }

    const newBitacoraItem: BitacoraAvance = {
      id: `b-${Date.now()}`,
      fecha: new Date().toLocaleString('es-PE'),
      autorNombre: currentUser.nombreCompleto,
      autorRol: currentUser.rol,
      titulo: newAvanceTitulo.trim(),
      descripcion: newAvanceDesc.trim(),
      estadoNuevo: newAvanceEstado,
    };

    const updatedOrder: OrdenServicio = {
      ...selectedOrder,
      estado: newAvanceEstado,
      bitacora: [newBitacoraItem, ...selectedOrder.bitacora],
    };

    setSelectedOrder(updatedOrder);
    onSaveOrden(updatedOrder);

    // Sincronizar actualización de estado técnico con MySQL
    workshopService
      .updateEstado(selectedOrder.id, {
        nuevoEstado: newAvanceEstado,
        observaciones: `${newAvanceTitulo}: ${newAvanceDesc}`,
      })
      .catch((err) => console.warn('Sync estado orden fallback:', err));

    setNewAvanceTitulo('');
    setNewAvanceDesc('');
    setNewAvanceEstado(getSiguienteEstadoLogico(newAvanceEstado));
    onShowToast('Avance registrado', `Estado actualizado a: ${ESTADOS_CONFIG[newAvanceEstado].label}`, 'success');
  };

  const handleAddRepuesto = () => {
    if (!selectedOrder) return;
    const prod = productos.find((p) => p.id === Number(selectedProdId));
    if (!prod) return;
    if (prod.estado !== 'ACTIVO' || repuestoCantidad < 1 || repuestoCantidad > prod.stock) {
      onShowToast('Stock insuficiente', `Solo hay ${prod.stock} unidades disponibles de ${prod.nombre}.`, 'warning');
      return;
    }

    const itemTotal = prod.precioUnitario * repuestoCantidad;
    const newRepuesto: RepuestoUtilizado = {
      id: `rep-${Date.now()}`,
      productoId: prod.id,
      codigo: prod.codigo,
      descripcion: prod.nombre,
      cantidad: repuestoCantidad,
      precioUnitario: prod.precioUnitario,
      total: itemTotal,
    };

    const updatedRepuestos = [...selectedOrder.repuestos, newRepuesto];
    const totalRepuestos = updatedRepuestos.reduce((acc, r) => acc + r.total, 0);
    const nuevoTotal = totalRepuestos + selectedOrder.costoTotalManoObra;

    const updatedOrder: OrdenServicio = {
      ...selectedOrder,
      repuestos: updatedRepuestos,
      costoTotalRepuestos: totalRepuestos,
      costoTotal: nuevoTotal,
      saldoPendiente: Math.max(0, nuevoTotal - selectedOrder.adelantoPagado),
    };

    setSelectedOrder(updatedOrder);
    onSaveOrden(updatedOrder);
    onUpdateProductoStock(prod.id, -repuestoCantidad);
    syncPresupuestoDB(updatedOrder);
    onShowToast('Repuesto agregado', `${prod.nombre} x${repuestoCantidad}`, 'info');
  };

  const syncPresupuestoDB = async (order: OrdenServicio) => {
    try {
      await workshopService.savePresupuesto(order.id, {
        repuestos: order.repuestos,
        serviciosManoObra: order.serviciosManoObra,
        costoTotal: order.costoTotal,
      });
    } catch (err) {
      console.warn('Sync presupuesto DB fallback:', err);
    }
  };

  const handleRemoveRepuesto = (id: string) => {
    if (!selectedOrder) return;
    const updatedRepuestos = selectedOrder.repuestos.filter((r) => r.id !== id);
    const totalRepuestos = updatedRepuestos.reduce((acc, r) => acc + r.total, 0);
    const nuevoTotal = totalRepuestos + selectedOrder.costoTotalManoObra;

    const updatedOrder: OrdenServicio = {
      ...selectedOrder,
      repuestos: updatedRepuestos,
      costoTotalRepuestos: totalRepuestos,
      costoTotal: nuevoTotal,
      saldoPendiente: Math.max(0, nuevoTotal - selectedOrder.adelantoPagado),
    };

    setSelectedOrder(updatedOrder);
    onSaveOrden(updatedOrder);
    const removedRepuesto = selectedOrder.repuestos.find((repuesto) => repuesto.id === id);
    if (removedRepuesto?.productoId) onUpdateProductoStock(removedRepuesto.productoId, removedRepuesto.cantidad);
    syncPresupuestoDB(updatedOrder);
  };

  const handleAddServicio = () => {
    if (!selectedOrder || !newServicioDesc) return;

    const newMo: ManoObraServicio = {
      id: `mo-${Date.now()}`,
      descripcion: newServicioDesc.trim(),
      precio: Number(newServicioPrecio) || 0,
    };

    const updatedMo = [...selectedOrder.serviciosManoObra, newMo];
    const totalMo = updatedMo.reduce((acc, m) => acc + m.precio, 0);
    const nuevoTotal = selectedOrder.costoTotalRepuestos + totalMo;

    const updatedOrder: OrdenServicio = {
      ...selectedOrder,
      serviciosManoObra: updatedMo,
      costoTotalManoObra: totalMo,
      costoTotal: nuevoTotal,
      saldoPendiente: Math.max(0, nuevoTotal - selectedOrder.adelantoPagado),
    };

    setSelectedOrder(updatedOrder);
    onSaveOrden(updatedOrder);
    syncPresupuestoDB(updatedOrder);
    setNewServicioDesc('');
    onShowToast('Mano de obra agregada', `${newMo.descripcion} - S/ ${newMo.precio}`, 'info');
  };

  const handleRemoveServicio = (id: string) => {
    if (!selectedOrder) return;
    const updatedMo = selectedOrder.serviciosManoObra.filter((m) => m.id !== id);
    const totalMo = updatedMo.reduce((acc, m) => acc + m.precio, 0);
    const nuevoTotal = selectedOrder.costoTotalRepuestos + totalMo;

    const updatedOrder: OrdenServicio = {
      ...selectedOrder,
      serviciosManoObra: updatedMo,
      costoTotalManoObra: totalMo,
      costoTotal: nuevoTotal,
      saldoPendiente: Math.max(0, nuevoTotal - selectedOrder.adelantoPagado),
    };

    setSelectedOrder(updatedOrder);
    onSaveOrden(updatedOrder);
    syncPresupuestoDB(updatedOrder);
  };

  // ==========================================
  // FLUJO DE CONTROL DEL PRESUPUESTO & ESTADOS
  // ==========================================

  const handleChangeOrderEstado = async (
    nuevoEstado: EstadoOrdenServicio,
    tituloBitacora: string,
    descripcionBitacora: string,
    costoTotal?: number
  ) => {
    if (!selectedOrder) return;

    const newBitacoraItem: BitacoraAvance = {
      id: `b-${Date.now()}`,
      fecha: new Date().toLocaleString('es-PE'),
      autorNombre: currentUser.nombreCompleto,
      autorRol: currentUser.rol,
      titulo: tituloBitacora,
      descripcion: descripcionBitacora,
      estadoNuevo: nuevoEstado,
    };

    const finalCosto = costoTotal !== undefined ? costoTotal : selectedOrder.costoTotal;
    const finalSaldo = Math.max(0, finalCosto - selectedOrder.adelantoPagado);

    const updatedOrder: OrdenServicio = {
      ...selectedOrder,
      estado: nuevoEstado,
      costoTotal: finalCosto,
      saldoPendiente: finalSaldo,
      bitacora: [newBitacoraItem, ...selectedOrder.bitacora],
    };

    setSelectedOrder(updatedOrder);
    setNewAvanceEstado(getSiguienteEstadoLogico(nuevoEstado));
    onSaveOrden(updatedOrder);

    try {
      await workshopService.updateEstado(selectedOrder.id, {
        nuevoEstado,
        costoServicio: finalCosto,
        observaciones: `${tituloBitacora}: ${descripcionBitacora}`,
      });
      onShowToast(
        'Estado de Orden Actualizado',
        `Pasa a: ${ESTADOS_CONFIG[nuevoEstado]?.label || nuevoEstado}`,
        'success'
      );
    } catch (err) {
      console.warn('Sync estado orden fallback:', err);
    }
  };

  const handleFijarPresupuesto = () => {
    if (!selectedOrder) return;
    syncPresupuestoDB(selectedOrder);
    const descRep = selectedOrder.repuestos.map((r) => `${r.descripcion} (S/ ${r.total.toFixed(2)})`).join(', ') || 'Sin repuestos de almacén';
    const descServ = selectedOrder.serviciosManoObra.map((s) => `${s.descripcion} (S/ ${s.precio.toFixed(2)})`).join(', ') || 'Revisión técnica';

    handleChangeOrderEstado(
      'PRESUPUESTADO',
      '📋 Presupuesto Elaborado para Aprobación',
      `Costos calculados: Total S/ ${selectedOrder.costoTotal.toFixed(2)} (Repuestos: ${descRep} | Servicios: ${descServ}). Esperando confirmación del cliente.`
    );
  };

  const handleAprobarPresupuesto = (irAEsperaRepuestos: boolean = false) => {
    if (!selectedOrder) return;
    const nuevoEstado: EstadoOrdenServicio = irAEsperaRepuestos ? 'ESPERA_REPUESTOS' : 'APROBADO_EN_REPARACION';
    handleChangeOrderEstado(
      nuevoEstado,
      '✅ Cliente Autorizó la Reparación',
      irAEsperaRepuestos
        ? `El cliente aprobó el presupuesto de S/ ${selectedOrder.costoTotal.toFixed(2)}. Estado puesto en Espera de Repuestos solicitados al proveedor.`
        : `El cliente aprobó el presupuesto de S/ ${selectedOrder.costoTotal.toFixed(2)}. Técnico asignado inicia trabajos en laboratorio.`
    );
  };

  const handleRechazarPresupuesto = () => {
    if (!selectedOrder) return;
    handleChangeOrderEstado(
      'RECHAZADO_DEVUELTO',
      '❌ Cliente Rechazó el Presupuesto',
      `El cliente no autorizó la reparación por S/ ${selectedOrder.costoTotal.toFixed(2)}. El equipo se pasa a mostrador para devolución sin reparación.`
    );
  };

  const handlePresupuestoAdicional = () => {
    if (!selectedOrder) return;
    handleChangeOrderEstado(
      'PRESUPUESTADO',
      '⚠️ Falla Adicional Detectada en Pruebas',
      `Se detectó una falla no identificada en el ingreso inicial. Presupuesto actualizado a S/ ${selectedOrder.costoTotal.toFixed(2)}. Se suspenden trabajos temporalmente hasta nueva aprobación del cliente.`
    );
  };

  const getCotizacionWhatsAppUrl = () => {
    if (!selectedOrder || !selectedOrder.clienteTelefono) return '';
    const tel = selectedOrder.clienteTelefono.replace(/\D/g, '');

    const repuestosTxt = selectedOrder.repuestos.length > 0
      ? selectedOrder.repuestos.map((r) => `  • ${r.descripcion} x${r.cantidad}: S/ ${r.total.toFixed(2)}`).join('\n')
      : '  • Sin repuestos requeridos';

    const manoObraTxt = selectedOrder.serviciosManoObra.length > 0
      ? selectedOrder.serviciosManoObra.map((s) => `  • ${s.descripcion}: S/ ${s.precio.toFixed(2)}`).join('\n')
      : '  • Servicio técnico general';

    const msg = `*MG SOLUTIONS GROUP - COTIZACIÓN DE SERVICIO TÉCNICO*
Hola *${selectedOrder.clienteNombre}*, le saludamos de nuestro taller especializado.
Le informamos el diagnóstico y presupuesto de su equipo:

📌 *Orden:* ${selectedOrder.codigo}
💻 *Equipo:* ${selectedOrder.tipoEquipo} ${selectedOrder.marca} ${selectedOrder.modelo}
⚠️ *Falla Diagnosticada:* ${selectedOrder.fallaReportada}

📋 *Detalle del Presupuesto:*
*Repuestos e Insumos:*
${repuestosTxt}

*Mano de Obra & Servicios:*
${manoObraTxt}

💰 *PRESUPUESTO TOTAL: S/ ${selectedOrder.costoTotal.toFixed(2)}*
💵 Adelanto Cancelado: S/ ${selectedOrder.adelantoPagado.toFixed(2)}
💳 *Saldo a Cancelar: S/ ${selectedOrder.saldoPendiente.toFixed(2)}*

¿Nos autoriza a proceder con la reparación de su equipo?
_Por favor responda a este mensaje con SÍ para comenzar o indíquenos si tiene dudas._`;

    return `https://wa.me/51${tel}?text=${encodeURIComponent(msg)}`;
  };




  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto bg-[#F8F9FF] min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#00346F] text-white">
              {currentUser.rol === 'TECNICO' ? 'Panel del Técnico' : 'Taller Especializado & Laboratorio'}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {currentUser.rol === 'TECNICO'
                ? `Órdenes asignadas a ${currentUser.nombreCompleto}`
                : 'Flujo Integrado: Recepción ➔ Diagnóstico ➔ Repuestos ➔ Cliente'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0B1C30] tracking-tight flex items-center gap-2">
            <Wrench className="w-6 h-6 text-[#00346F]" />
            Servicio Técnico & Reparaciones
          </h1>
        </div>

        <div className="flex gap-2">
          {/* El ingreso y creación de tickets se gestiona exclusivamente desde el Panel de Recepción */}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-lg bg-blue-50 text-[#00346F]">
            <Laptop className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-semibold block">Total Órdenes</span>
            <span className="text-xl font-bold text-slate-800">{metricTotal}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-semibold block">En Taller / Reparación</span>
            <span className="text-xl font-bold text-amber-700">{metricEnTaller}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-semibold block">Listos para Entrega</span>
            <span className="text-xl font-bold text-emerald-700">{metricListos}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-semibold block">Entregados & Cobrados</span>
            <span className="text-xl font-bold text-slate-800">{metricEntregados}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por N° de Orden (OT), Cliente, RUC/DNI, Marca, Modelo o N° de Serie..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#00346F] focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="RECEPCIONADO">1. Recepcionado</option>
              <option value="EN_DIAGNOSTICO">2. En Diagnóstico</option>
              <option value="PRESUPUESTADO">3. Presupuestado</option>
              <option value="APROBADO_EN_REPARACION">4. En Reparación</option>
              <option value="ESPERA_REPUESTOS">5. Espera Repuestos</option>
              <option value="REPARADO_PROBADO">6. Reparado & Probado</option>
              <option value="LISTO_ENTREGA">7. Listo para Entrega</option>
              <option value="ENTREGADO_COBRADO">8. Entregado & Cobrado</option>
            </select>

            {currentUser.rol !== 'TECNICO' && (
              <select
                value={technicianFilter}
                onChange={(e) => setTechnicianFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="TODOS">Todos los Técnicos</option>
                <option value="MIS_ORDENES">Mis Órdenes Asignadas</option>
                {tecnicos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombreCompleto}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-[#EFF4FF] border-b border-slate-200 flex justify-between items-center">
          <span className="text-xs font-bold text-[#00346F]">
            Bandeja de Órdenes de Servicio Técnico ({filteredOrders.length})
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            Haga clic en una orden para abrir la mesa de trabajo
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EFF4FF] text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">N° Orden</th>
                <th className="py-3 px-4">Fecha Ingreso</th>
                <th className="py-3 px-4">Cliente / Contacto</th>
                <th className="py-3 px-4">Equipo & Falla</th>
                <th className="py-3 px-4">Técnico Asignado</th>
                <th className="py-3 px-4">Estado del Proceso</th>
                <th className="py-3 px-4 text-right">Presupuesto</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    {readOnly ? 'No hay órdenes disponibles.' : 'No se encontraron órdenes de servicio con los filtros aplicados.'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const cfg = ESTADOS_CONFIG[o.estado] || ESTADOS_CONFIG.RECEPCIONADO;
                  return (
                    <tr
                      key={o.id}
                      onClick={() => handleOpenDetail(o)}
                      className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#00346F]">
                        <div className="flex items-center gap-1.5">
                          <span className="p-1 rounded bg-blue-100 text-[#00346F]">
                            {o.tipoEquipo === 'LAPTOP' ? (
                              <Laptop className="w-3.5 h-3.5" />
                            ) : o.tipoEquipo === 'IMPRESORA' ? (
                              <PrinterIcon className="w-3.5 h-3.5" />
                            ) : (
                              <Monitor className="w-3.5 h-3.5" />
                            )}
                          </span>
                          <div>
                            <span>{o.codigo}</span>
                            {o.sucursalNombre && (
                              <span className="block text-[9px] font-sans font-semibold text-slate-400">
                                {o.sucursalNombre.replace(/^[0-9]+ - /, '')}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {o.fechaIngreso}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 block truncate max-w-[180px]">
                          {o.clienteNombre}
                        </span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {o.clienteTelefono}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="font-semibold text-slate-800 block">
                          {o.marca} {o.modelo}
                        </span>
                        <span className="text-[11px] text-slate-500 line-clamp-1">
                          {o.fallaReportada}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-700 block truncate max-w-[140px]">
                          {o.tecnicoNombre}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Recibido por: {o.recepcionadoPorNombre.split(' ')[0]}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono">
                        {o.costoTotal > 0 ? (
                          <>
                            <span className="font-bold text-slate-900 block">
                              S/ {o.costoTotal.toFixed(2)}
                            </span>
                            {o.saldoPendiente > 0 && (
                              <span className="text-[10px] text-amber-700 font-semibold block">
                                Saldo: S/ {o.saldoPendiente.toFixed(2)}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400 italic">Por cotizar</span>
                        )}
                      </td>
                      <td
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenDetail(o)}
                            className="p-1.5 text-[#00346F] hover:bg-blue-100 rounded-lg"
                            title="Abrir mesa de trabajo"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Nueva Orden de Servicio */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-[#00346F] text-white">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold">
                  Recepción de equipo • Nuevo ticket de servicio
                </h3>
              </div>
              <button
                onClick={() => setIsNewOrderModalOpen(false)}
                className="text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs bg-[#F8F9FF]">
              {/* ============================================================== */}
              {/* SECCIÓN PRINCIPAL SUPERIOR: BÚSQUEDA Y VALIDACIÓN DE GARANTÍA */}
              {/* SIEMPRE VISIBLE PARA CUALQUIER INGRESO EN MOSTRADOR            */}
              {/* ============================================================== */}
              <div className="bg-white p-4 rounded-xl border-2 border-emerald-500/50 shadow-xs space-y-3">
                <div className="flex flex-wrap justify-between items-center gap-2 border-b border-emerald-100 pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <div>
                      <span className="font-extrabold text-[#00346F] text-xs uppercase tracking-wider block">
                        Búsqueda y Validación de Garantía MG Solutions
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Consulte por N° de serie para comprobar si cuenta con garantía activa, cuándo venció o si es equipo externo
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

                {/* Input de Búsqueda de Serie y Botón */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block font-bold text-slate-700 text-[11px]">
                      Número de Serie / Service Tag del Producto Vendido *
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Presione Enter o haga clic en 'Verificar Serie'
                    </span>
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
                        placeholder="Ej: EPS-L3250-X58821, LNV-X1C-2026-001..."
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
                      {verificandoGarantia ? (
                        <RotateCcw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      Verificar Serie
                    </button>
                  </div>
                </div>

                {/* TABLA / RESULTADO DE GARANTÍA DETALLADO */}
                {garantiaResultado && (
                  <div className="animate-in fade-in duration-200">
                    {/* CASO 1: HAY GARANTÍA (VIGENTE) */}
                    {garantiaResultado.encontrado && garantiaResultado.estado === 'VIGENTE' && (
                      <div className="p-3.5 bg-emerald-50/90 border-2 border-emerald-400 rounded-xl text-emerald-950 space-y-2.5 shadow-2xs">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-2xs">
                              <ShieldCheck className="w-5 h-5 shrink-0" />
                            </div>
                            <div>
                              <span className="font-extrabold text-xs block text-emerald-950 uppercase tracking-wide">
                                ¡HAY GARANTÍA OFICIAL ACTIVA Y VÁLIDA!
                              </span>
                              <p className="text-[11px] text-emerald-800 font-medium">
                                Equipo dentro de los {garantiaResultado.mesesGarantia || 12} meses de cobertura oficial de MG Solutions.
                              </p>
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-600 text-white shadow-2xs shrink-0">
                            {garantiaResultado.diasRestantes} días restantes
                          </span>
                        </div>

                        {/* Ficha técnica y datos de venta */}
                        <div className="p-2.5 bg-white/90 border border-emerald-200 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                          <div>
                            <span className="text-slate-400 block font-semibold text-[10px] uppercase">Producto Vendido</span>
                            <span className="font-bold text-slate-800 block">
                              {garantiaResultado.producto?.marca} {garantiaResultado.producto?.nombre}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">
                              S/N: {garantiaResultado.serie}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-semibold text-[10px] uppercase">Comprobante / Venta</span>
                            <span className="font-mono font-bold text-slate-800 block">
                              {garantiaResultado.comprobante || 'Factura MG Solutions'}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Comprado: {garantiaResultado.fechaVenta || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-semibold text-[10px] uppercase">Vigencia Oficial</span>
                            <span className="font-bold text-emerald-700 block">
                              Vence: {garantiaResultado.fechaExpiracion || '—'}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Titular: {garantiaResultado.cliente?.nombre || 'Particular'}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                          <span className="text-emerald-900 font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            Modalidad automática: Costo S/ 0.00 cubierta por garantía oficial.
                          </span>
                          {ingresoModo !== 'GARANTIA' && (
                            <button
                              type="button"
                              onClick={() => setIngresoModo('GARANTIA')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] shadow-2xs cursor-pointer"
                            >
                              Aplicar como Garantía (S/ 0.00)
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* CASO 2: NO HAY GARANTÍA / GARANTÍA VENCIDA */}
                    {garantiaResultado.encontrado && garantiaResultado.estado === 'VENCIDA' && (
                      <div className="p-3.5 bg-red-50/90 border-2 border-red-300 rounded-xl text-red-950 space-y-2.5 shadow-2xs">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-red-600 text-white rounded-lg shadow-2xs">
                              <ShieldAlert className="w-5 h-5 shrink-0" />
                            </div>
                            <div>
                              <span className="font-extrabold text-xs block text-red-950 uppercase tracking-wide">
                                NO HAY GARANTÍA VIGENTE • GARANTÍA VENCIDA
                              </span>
                              <p className="text-[11px] text-red-800 font-medium">
                                El periodo de garantía de {garantiaResultado.mesesGarantia || 12} meses ha finalizado.
                              </p>
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-full text-[11px] font-black bg-red-600 text-white shadow-2xs shrink-0">
                            Expiró hace {garantiaResultado.diasVencida || 0} días
                          </span>
                        </div>

                        {/* Cuándo acabó su garantía - Ficha clara */}
                        <div className="p-2.5 bg-white/90 border border-red-200 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                          <div>
                            <span className="text-slate-400 block font-semibold text-[10px] uppercase">¿Cuándo acabó su garantía?</span>
                            <span className="font-bold text-red-700 block">
                              Expiró el: {garantiaResultado.fechaExpiracion || '—'}
                            </span>
                            <span className="text-[10px] text-red-600 font-medium">
                              (hace {garantiaResultado.diasVencida || 0} días calendario)
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-semibold text-[10px] uppercase">Comprobante y Venta</span>
                            <span className="font-mono font-bold text-slate-800 block">
                              {garantiaResultado.comprobante || 'Factura MG Solutions'}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Comprado: {garantiaResultado.fechaVenta || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-semibold text-[10px] uppercase">Producto y Titular</span>
                            <span className="font-bold text-slate-800 block">
                              {garantiaResultado.producto?.marca} {garantiaResultado.producto?.nombre}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Cliente: {garantiaResultado.cliente?.nombre || 'Particular'}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                          <p className="text-red-900 font-medium">
                            ⚠️ Este equipo debe registrarse como <strong>Servicio Técnico Regular</strong> (diagnóstico y presupuesto de cotización al cliente).
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setIngresoModo('SERVICIO');
                              onShowToast('Servicio Regular Activado', 'Datos del equipo transferidos para cotización y reparación.', 'info');
                            }}
                            className="px-3 py-1 bg-[#00346F] hover:bg-[#004A99] text-white rounded-lg font-bold text-[10px] shadow-2xs cursor-pointer"
                          >
                            Continuar como Servicio Regular con Costo ➔
                          </button>
                        </div>
                      </div>
                    )}

                    {/* CASO 3: NO REGISTRADO EN MG SOLUTIONS */}
                    {!garantiaResultado.encontrado && (
                      <div className="p-3.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-slate-800 space-y-2 shadow-2xs">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-slate-700 text-white rounded-lg shadow-2xs">
                              <HelpCircle className="w-5 h-5 shrink-0" />
                            </div>
                            <div>
                              <span className="font-extrabold text-xs block text-slate-900 uppercase tracking-wide">
                                NO FIGURA EN VENTAS DE MG SOLUTIONS (EQUIPO EXTERNO)
                              </span>
                              <p className="text-[11px] text-slate-600 font-medium">
                                La serie <strong>{garantiaResultado.serie}</strong> no registra venta en la empresa. No aplica garantía de tienda.
                              </p>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800 shrink-0">
                            Sin Garantía de Tienda
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                          <span className="text-slate-600">
                            Puede recepcionarlo como <strong>Servicio Técnico Regular</strong> completando el formulario inferior.
                          </span>
                          <button
                            type="button"
                            onClick={() => setIngresoModo('SERVICIO')}
                            className="px-3 py-1 bg-[#00346F] text-white rounded-lg font-bold text-[10px] cursor-pointer"
                          >
                            Continuar como Servicio Regular
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SELECTOR DE 2 APARTADOS: SERVICIO TÉCNICO REGULAR VS GARANTÍA OFICIAL */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Modalidad de Recepción en Mostrador *
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Elija según el origen del equipo del cliente
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Apartado 1: Servicio Técnico Regular */}
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
                        <span>1. SERVICIO TÉCNICO REGULAR</span>
                        {ingresoModo === 'SERVICIO' && (
                          <span className="text-[9px] bg-[#00346F] text-white px-2 py-0.5 rounded-full font-bold">
                            SELECCIONADO
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Para clientes particulares o empresas. Mantenimiento, reparación o repuestos con diagnóstico y cotización.
                      </p>
                    </div>
                  </button>

                  {/* Apartado 2: Ingreso por Garantía Oficial */}
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
                        <span className="text-emerald-900">2. INGRESO POR GARANTÍA OFICIAL</span>
                        {ingresoModo === 'GARANTIA' && (
                          <span className="text-[9px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                            SELECCIONADO
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Vendido por MG Solutions. Validación por N° Serie, semáforo de vigencia y costo automático S/ 0.00.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Cliente Selector Inteligente con Buscador y Registro Rápido */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                      Cliente Solicitante *
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Busque por RUC, DNI o razón social entre todos los clientes registrados.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsQuickClientModalOpen(true)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-xs transition-all active:scale-95"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    + Nuevo Cliente
                  </button>
                </div>

                {/* Tarjeta de Cliente Seleccionado */}
                {selectedClient && !isClientSearchDropdownOpen && (
                  <div className="p-3 bg-[#EFF4FF] border border-blue-200 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            selectedClient.tipoDocumento === 'RUC'
                              ? 'bg-[#00346F] text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {selectedClient.tipoDocumento} {selectedClient.numeroDocumento}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">
                          {selectedClient.razonSocial}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        📞 {selectedClient.telefono || 'Sin teléfono'} • 📍 {selectedClient.direccion || 'Sin dirección registrada'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsClientSearchDropdownOpen(true)}
                      className="px-3 py-1 bg-white hover:bg-slate-100 text-[#00346F] border border-blue-300 font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-xs"
                    >
                      <Search className="w-3.5 h-3.5" />
                      Cambiar / Buscar otro
                    </button>
                  </div>
                )}

                {/* Input de Búsqueda de Clientes */}
                {(isClientSearchDropdownOpen || !selectedClient) && (
                  <div className="relative">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        autoFocus
                        value={clientSearchQuery}
                        onChange={(e) => setClientSearchQuery(e.target.value)}
                        placeholder="Escriba RUC, DNI, nombre o teléfono para buscar cliente..."
                        className="w-full pl-9 pr-8 py-2 bg-white border border-[#00346F] rounded-lg text-xs font-medium focus:outline-none shadow-xs"
                      />
                      {selectedClient && (
                        <button
                          type="button"
                          onClick={() => setIsClientSearchDropdownOpen(false)}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-[11px] font-bold"
                        >
                          Cerrar
                        </button>
                      )}
                    </div>

                    {/* Lista desplegable de clientes filtrados */}
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
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                    c.tipoDocumento === 'RUC'
                                      ? 'bg-blue-100 text-[#00346F]'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {c.tipoDocumento} {c.numeroDocumento}
                                </span>
                                <span className="font-bold text-slate-800 text-xs">{c.razonSocial}</span>
                              </div>
                              <p className="text-[10px] text-slate-500">
                                Tel: {c.telefono || '—'} • Dir: {c.direccion || '—'}
                              </p>
                            </div>
                            {newOrderClienteId === c.id && (
                              <Check className="w-4 h-4 text-[#00346F] flex-shrink-0" />
                            )}
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
                            className="mt-2 px-3 py-1 bg-[#00346F] text-white rounded text-xs font-bold"
                          >
                            + Registrar a "{clientSearchQuery}" ahora
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}


              </div>

              {/* ============================================================== */}
              {/* MODALIDAD 2: INGRESO POR GARANTÍA OFICIAL (SIMPLIFICADO Y RMA)  */}
              {/* ============================================================== */}
              {ingresoModo === 'GARANTIA' && (
                <div className="space-y-4">
                  <div className="bg-emerald-50/70 p-4 rounded-xl border-2 border-emerald-500/50 space-y-3">
                    <div className="flex justify-between items-center border-b border-emerald-200 pb-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-700" />
                        <div>
                          <span className="font-bold text-emerald-950 text-xs uppercase tracking-wider block">
                            Recepción Oficial en Garantía (Costo S/ 0.00)
                          </span>
                          <span className="text-[10px] text-emerald-800">
                            Serie: <strong className="font-mono">{newOrderSerie || 'SIN SERIE'}</strong> • Producto: {newOrderMarca || garantiaResultado?.producto?.marca || 'MG'} {newOrderModelo || garantiaResultado?.producto?.nombre || 'EQUIPO'}
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold shadow-xs">
                        Costo: S/ 0.00 (Oficial)
                      </span>
                    </div>

                    {/* 1. Caja de Texto de Falla Reclamada para Garantía */}
                    <div>
                      <label className="block font-bold text-emerald-950 mb-1 text-[11px]">
                        Falla o Motivo de Reclamo Reportado por el Cliente *
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={newOrderFalla}
                        onChange={(e) => setNewOrderFalla(e.target.value)}
                        placeholder="Detalle exactamente la falla informada por el cliente para el informe técnico y gestión con el mayorista (ej: No enciende, pantalla azul con código de error, no reconoce cargador)..."
                        className="w-full p-2.5 bg-white border border-emerald-400 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    {/* 3. Checklist Físico Obligatorio de Conformidad de Garantía */}
                    <div className="p-3.5 bg-white rounded-xl border-2 border-emerald-400 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-emerald-600" />
                          <div>
                            <span className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                              Checklist de Inspección Física Obligatoria
                            </span>
                            <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                              {[
                                checklistGarantia.pantallaIntegra,
                                checklistGarantia.sinLiquidos,
                                checklistGarantia.sinGolpes,
                                checklistGarantia.sellosIntactos,
                              ].filter(Boolean).length} / 4 Conformes
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setChecklistGarantia({
                                pantallaIntegra: true,
                                sinLiquidos: true,
                                sinGolpes: true,
                                sellosIntactos: true,
                              })
                            }
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold shadow-2xs transition-all active:scale-95"
                          >
                            ✓ Marcar Todo Conforme
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setChecklistGarantia({
                                pantallaIntegra: false,
                                sinLiquidos: false,
                                sinGolpes: false,
                                sellosIntactos: false,
                              })
                            }
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-medium"
                          >
                            Limpiar
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500">
                        Marque cada condición tras revisar físicamente el equipo en mostrador.
                        <strong> Las opciones de trámite y generación de orden se activarán una vez que cumpla con los 4 puntos de conformidad:</strong>
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <label className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all cursor-pointer ${
                          checklistGarantia.pantallaIntegra
                            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}>
                          <input
                            type="checkbox"
                            checked={checklistGarantia.pantallaIntegra}
                            onChange={(e) =>
                              setChecklistGarantia((prev) => ({ ...prev, pantallaIntegra: e.target.checked }))
                            }
                            className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <div>
                            <span className="block text-xs font-bold text-slate-800">
                              1. Pantalla y Carcasa Íntegras
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              Sin trizaduras, fisuras, fracturas ni rotura por impacto o golpe.
                            </span>
                          </div>
                        </label>

                        <label className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all cursor-pointer ${
                          checklistGarantia.sinLiquidos
                            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}>
                          <input
                            type="checkbox"
                            checked={checklistGarantia.sinLiquidos}
                            onChange={(e) =>
                              setChecklistGarantia((prev) => ({ ...prev, sinLiquidos: e.target.checked }))
                            }
                            className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <div>
                            <span className="block text-xs font-bold text-slate-800">
                              2. Libre de Humedad y Líquidos
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              Sin derrames, humedad, sarro o corrosión en puertos o placa base.
                            </span>
                          </div>
                        </label>

                        <label className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all cursor-pointer ${
                          checklistGarantia.sinGolpes
                            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}>
                          <input
                            type="checkbox"
                            checked={checklistGarantia.sinGolpes}
                            onChange={(e) =>
                              setChecklistGarantia((prev) => ({ ...prev, sinGolpes: e.target.checked }))
                            }
                            className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <div>
                            <span className="block text-xs font-bold text-slate-800">
                              3. Chasis Estructural Intacto
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              Sin caídas, esquinas abolladas, dobleces ni deformaciones físicas.
                            </span>
                          </div>
                        </label>

                        <label className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all cursor-pointer ${
                          checklistGarantia.sellosIntactos
                            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}>
                          <input
                            type="checkbox"
                            checked={checklistGarantia.sellosIntactos}
                            onChange={(e) =>
                              setChecklistGarantia((prev) => ({ ...prev, sellosIntactos: e.target.checked }))
                            }
                            className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <div>
                            <span className="block text-xs font-bold text-slate-800">
                              4. Sellos de Fábrica Originales
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              Etiquetas y sellos de garantía intactos, sin apertura no autorizada.
                            </span>
                          </div>
                        </label>
                      </div>

                      {/* Estado del Checklist */}
                      {checklistGarantiaCompleto ? (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 flex items-center justify-between text-xs animate-in fade-in">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <div>
                              <p className="font-bold">✓ Inspección Física Aprobada (4/4)</p>
                              <p className="text-[11px] text-emerald-800">
                                El equipo cumple con todas las condiciones para trámite de garantía oficial sin costo.
                              </p>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 bg-emerald-600 text-white rounded font-bold text-[11px]">
                            Opciones Desbloqueadas
                          </span>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 flex items-start justify-between gap-3 text-xs">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-[11px]">
                                Pendiente: Complete los 4 puntos de inspección física
                              </p>
                              <p className="text-[10px] text-amber-800 leading-snug">
                                Las opciones de plazo, ficha de proveedor RMA y emisión de la orden se activarán automáticamente una vez que marque todos los checks conformes.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIngresoModo('SERVICIO');
                              onShowToast(
                                'Cambiado a Servicio Regular',
                                'Si el equipo presenta daños o fallas no cubiertas, se recepciona con cotización y costo al cliente.',
                                'info'
                              );
                            }}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[10px] shrink-0 shadow-2xs"
                          >
                            ¿Daño físico? Pasar a Regular
                          </button>
                        </div>
                      )}
                    </div>

                    {/* BLOQUE CONDICIONAL: SE ACTIVA ÚNICAMENTE SI SE CUMPLEN TODOS LOS CHECKS */}
                    <div
                      className={`space-y-3 transition-all duration-300 ${
                        checklistGarantiaCompleto
                          ? 'opacity-100 pointer-events-auto'
                          : 'opacity-40 pointer-events-none select-none filter grayscale-50'
                      }`}
                    >
                      {/* 4. Plazo Oficial de Garantía Destacado (7 a 30 días hábiles) */}
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-blue-900">
                        <div className="flex items-center gap-2.5">
                          <Clock className="w-5 h-5 text-[#00346F] shrink-0" />
                          <div>
                            <span className="font-bold text-xs uppercase tracking-wide">Plazo Oficial de Garantía</span>
                            <p className="text-[11px] text-blue-700">
                              <strong>7 a 30 días hábiles</strong> (Tiempo establecido para gestión técnica con el mayorista o fabricante).
                            </p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 bg-[#00346F] text-white rounded-md font-bold text-[11px] shrink-0 shadow-2xs">
                          7 - 30 días
                        </span>
                      </div>

                      {/* 5. Ficha de Reporte para el Proveedor / RMA Mayorista */}
                      <div className="p-3.5 bg-white border border-emerald-300 rounded-lg space-y-2.5">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                          <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                            <Truck className="w-4 h-4 text-emerald-600" />
                            Proveedor / Mayorista de Origen (Ficha de Traslado RMA)
                          </span>
                          <span className="text-[10px] text-slate-400">Datos para enviar el equipo a solución</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                          <div>
                            <label className="block font-semibold text-slate-600 mb-1 text-[10px]">
                              Mayorista / Distribuidor de Compra *
                            </label>
                            <select
                              value={garantiaProveedorNombre}
                              onChange={(e) => {
                                const val = e.target.value;
                                setGarantiaProveedorNombre(val);
                                if (val.includes('DELTRON')) {
                                  setGarantiaProveedorContacto('Dpto. RMA & Garantías');
                                  setGarantiaProveedorTelefono('01 411-0000');
                                  setGarantiaProveedorEmail('rma@deltron.pe');
                                } else if (val.includes('INTCOMEX')) {
                                  setGarantiaProveedorContacto('Garantías Intcomex Perú');
                                  setGarantiaProveedorTelefono('01 716-5000');
                                  setGarantiaProveedorEmail('garantias.pe@intcomex.com');
                                } else if (val.includes('INGRAM')) {
                                  setGarantiaProveedorContacto('Mesa de Ayuda Ingram Micro');
                                  setGarantiaProveedorTelefono('01 615-5555');
                                  setGarantiaProveedorEmail('soporte.peru@ingrammicro.com');
                                } else if (val.includes('MÁXIMA')) {
                                  setGarantiaProveedorContacto('RMA Máxima Internacional');
                                  setGarantiaProveedorTelefono('01 200-9000');
                                  setGarantiaProveedorEmail('rma@maximainternacional.com');
                                }
                              }}
                              className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-xs"
                            >
                              <option value="DELTRON PERÚ (Mayorista Oficial)">DELTRON PERÚ (Mayorista Oficial)</option>
                              <option value="INTCOMEX DEL PERÚ">INTCOMEX DEL PERÚ</option>
                              <option value="INGRAM MICRO PERÚ">INGRAM MICRO PERÚ</option>
                              <option value="MÁXIMA INTERNACIONAL">MÁXIMA INTERNACIONAL</option>
                              {proveedores.map((p) => (
                                <option key={p.id} value={`${p.razonSocial} (RUC: ${p.ruc})`}>
                                  {p.razonSocial}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-600 mb-1 text-[10px]">
                              Ficha de Contacto RMA del Mayorista
                            </label>
                            <input
                              type="text"
                              value={`${garantiaProveedorContacto} • Tel: ${garantiaProveedorTelefono} • ${garantiaProveedorEmail}`}
                              onChange={(e) => setGarantiaProveedorContacto(e.target.value)}
                              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-[11px]"
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1.5 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              setRmaReportData({
                                codigo: 'ORDEN-GARANTIA',
                                fecha: new Date().toLocaleDateString('es-PE'),
                                clienteNombre: selectedClient?.razonSocial || 'Cliente Particular',
                                clienteDocumento: selectedClient?.numeroDocumento || '—',
                                clienteTelefono: selectedClient?.telefono || '—',
                                productoNombre: garantiaResultado?.producto?.nombre || 'Equipo Informático',
                                marca: garantiaResultado?.producto?.marca || 'MARCA',
                                modelo: garantiaResultado?.producto?.nombre || 'MODELO',
                                numeroSerie: newOrderSerie || 'S/N',
                                comprobanteVenta: garantiaResultado?.comprobante || 'Factura MG',
                                fallaReclamada: newOrderFalla || 'Falla no especificada',
                                proveedorNombre: garantiaProveedorNombre,
                                proveedorContacto: garantiaProveedorContacto,
                                proveedorTelefono: garantiaProveedorTelefono,
                                proveedorEmail: garantiaProveedorEmail,
                                diasRestantes: garantiaResultado?.diasRestantes || 0,
                              });
                              setIsRmaModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 shadow-xs"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Ver Ficha de Reporte para Proveedor
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const msg = encodeURIComponent(
                                `*SOLICITUD DE GARANTÍA RMA - MG SOLUTIONS*\n` +
                                `• *Mayorista:* ${garantiaProveedorNombre}\n` +
                                `• *Equipo:* ${garantiaResultado?.producto?.marca || ''} ${garantiaResultado?.producto?.nombre || ''}\n` +
                                `• *N° Serie:* ${newOrderSerie}\n` +
                                `• *Factura Venta:* ${garantiaResultado?.comprobante || 'S/N'}\n` +
                                `• *Falla Reportada:* ${newOrderFalla}\n` +
                                `• *Checklist Físico:* 100% Conforme (sin golpes, pantalla íntegra, sin humedad, sellos OK).\n` +
                                `Solicitamos código de autorización de RMA para envío del equipo a revisión.`
                              );
                              window.open(`https://wa.me/?text=${msg}`, '_blank');
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 shadow-xs"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Enviar Reporte por WhatsApp al Proveedor
                          </button>
                        </div>
                      </div>

                      {/* Técnico Asignado para Tramitar la Garantía */}
                      <div>
                        <label className="block font-semibold text-emerald-950 mb-1 text-[11px]">
                          Técnico / Encargado de Seguimiento RMA *
                        </label>
                        <select
                          value={newOrderTecnicoId}
                          onChange={(e) => setNewOrderTecnicoId(Number(e.target.value))}
                          className="w-full p-2 bg-white border border-emerald-400 rounded-lg font-medium text-xs"
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
                  </div>

                  {/* Botones de acción para Garantía */}
                  <div className="p-4 bg-white border border-slate-200 flex justify-between items-center rounded-xl">
                    <div className="text-[11px]">
                      {!checklistGarantiaCompleto ? (
                        <span className="text-amber-700 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Debe marcar los 4 checks de conformidad para habilitar el botón.
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Listo para emitir orden oficial y ficha de traslado.
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsNewOrderModalOpen(false)}
                        className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={!checklistGarantiaCompleto}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-bold shadow flex items-center gap-1.5 transition-all"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Generar Orden de Garantía Oficial (S/ 0.00) e Imprimir
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* MODALIDAD 1: SERVICIO TÉCNICO REGULAR (CAJAS LIBRES Y RÁPIDAS) */}
              {/* ============================================================== */}
              {ingresoModo === 'SERVICIO' && (
                <div className="space-y-4">
                  {/* Especificaciones del Equipo con Categorías de la BD y Cajas Libres */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <Laptop className="w-4 h-4 text-[#00346F]" />
                        Especificaciones del Equipo para el Ticket
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Categoría de BD + cajas de texto libres para el ticket
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Tipo de Equipo dinámico desde la BD (categorias) */}
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
                          {(() => {
                            const categoriasEquipos = dbCategorias.filter(
                              (c) => c.estado === 'ACTIVO' && c.esEquipoTaller === true
                            );
                            const listado = categoriasEquipos.length > 0 ? categoriasEquipos : dbCategorias.filter((c) => c.estado === 'ACTIVO');

                            return listado.map((cat) => (
                              <option key={cat.id} value={cat.nombre}>
                                {cat.nombre}
                              </option>
                            ));
                          })()}
                        </select>
                      </div>

                      {/* Marca: Caja de texto libre */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block font-semibold text-slate-600">Marca *</label>
                          <span className="text-[10px] text-slate-400">Texto libre</span>
                        </div>
                        <input
                          type="text"
                          required
                          value={newOrderMarca}
                          onChange={(e) => setNewOrderMarca(e.target.value.toUpperCase())}
                          placeholder="Ej: HP, LENOVO, ASUS, SAMSUNG"
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium uppercase text-xs focus:outline-none focus:border-[#00346F]"
                        />
                        {/* Chips rápidos de sugerencia opcional */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {['HP', 'LENOVO', 'ASUS', 'DELL', 'EPSON', 'ACER'].map((b) => (
                            <button
                              key={b}
                              type="button"
                              onClick={() => setNewOrderMarca(b)}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors ${
                                newOrderMarca === b
                                  ? 'bg-[#00346F] text-white border-[#00346F]'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {b}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Modelo: Caja de texto libre */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block font-semibold text-slate-600">Modelo *</label>
                          <span className="text-[10px] text-slate-400">Texto libre</span>
                        </div>
                        <input
                          type="text"
                          required
                          value={newOrderModelo}
                          onChange={(e) => setNewOrderModelo(e.target.value)}
                          placeholder="Ej: Pavilion 15, IdeaPad Slim 3, L3250"
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-xs focus:outline-none focus:border-[#00346F]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="mb-1">
                          <label className="block font-semibold text-slate-600">N° de Serie / Service Tag</label>
                        </div>
                        <input
                          type="text"
                          value={newOrderSerie}
                          onChange={(e) => setNewOrderSerie(e.target.value.toUpperCase())}
                          placeholder="Ej: SN-9482019 o SN-LEN-2026-VIG"
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-medium uppercase text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">Clave de Usuario / PIN de Windows</label>
                        <input
                          type="text"
                          value={newOrderPassword}
                          onChange={(e) => setNewOrderPassword(e.target.value)}
                          placeholder="Ej: 123456 o 'Sin clave'"
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Falla & Accesorios */}
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
                        placeholder="Detalle exactamente lo que el cliente informa: se apaga solo, no enciende, pantalla azul, lentitud, bisagra rota..."
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
                        <label className="block font-semibold text-slate-600 mb-1">Técnico Asignado *</label>
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

                  {/* Actions para Servicio Regular */}
                  <div className="p-4 bg-white border border-slate-200 flex justify-end gap-2 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setIsNewOrderModalOpen(false)}
                      className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-[#00346F] hover:bg-[#004A99] text-white rounded-lg font-bold shadow flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Generar Orden e Imprimir Ticket
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Modal: Mesa de Trabajo y Detalle de Orden */}
      {isDetailModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-[#00346F] text-white flex justify-between items-center border-b border-blue-900">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold font-mono">{selectedOrder.codigo}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ESTADOS_CONFIG[selectedOrder.estado].bg
                      } ${ESTADOS_CONFIG[selectedOrder.estado].text}`}
                    >
                      {ESTADOS_CONFIG[selectedOrder.estado].label}
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-200">
                    {selectedOrder.marca} {selectedOrder.modelo} • Cliente: {selectedOrder.clienteNombre}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-white/70 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs inside Detail */}
            <div className="bg-[#EFF4FF] border-b border-slate-200 px-4 flex gap-1 overflow-x-auto text-xs font-semibold text-slate-600">
              <button
                onClick={() => setActiveDetailTab('flujo')}
                className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeDetailTab === 'flujo'
                    ? 'border-[#00346F] text-[#00346F] font-bold bg-white'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                <Layers className="w-4 h-4" />
                Flujo & Avance Técnico
              </button>
              <button
                onClick={() => setActiveDetailTab('repuestos')}
                className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeDetailTab === 'repuestos'
                    ? 'border-[#00346F] text-[#00346F] font-bold bg-white'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                <Package className="w-4 h-4" />
                Repuestos & Mano de Obra (S/ {selectedOrder.costoTotal.toFixed(2)})
              </button>
              <button
                onClick={() => setActiveDetailTab('ticket')}
                className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeDetailTab === 'ticket'
                    ? 'border-[#00346F] text-[#00346F] font-bold bg-white'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                <Printer className="w-4 h-4" />
                Ficha de servicio
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-[#F8F9FF] text-xs">
              {/* TAB 1: FLUJO & AVANCE TECNICO */}
              {activeDetailTab === 'flujo' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Technical Form */}
                  <div className="lg:col-span-7 space-y-4">
                    {/* Device Overview Card */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-800 text-sm">
                          {selectedOrder.marca} {selectedOrder.modelo}
                        </span>
                        <span className="font-mono text-slate-500 text-[11px]">
                          S/N: {selectedOrder.numeroSerie}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg text-slate-700">
                        <span className="font-bold block text-slate-800 mb-0.5">Falla Reportada:</span>
                        {selectedOrder.fallaReportada}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                        <div>
                          <strong>Clave:</strong> {selectedOrder.passwordEquipo || 'Sin clave'}
                        </div>
                        <div>
                          <strong>Accesorios:</strong> {selectedOrder.accesoriosDejados.join(', ')}
                        </div>
                      </div>
                    </div>

                    {/* Add Avance Form (For Technicians / Secretary) */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2 font-bold text-slate-800">
                          <Edit3 className="w-4 h-4 text-[#00346F]" />
                          Subir Estado y Avance de Reparación
                        </div>
                        {currentUser.rol === 'TECNICO' && selectedOrder.estado === 'PRESUPUESTADO' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Lock className="w-3 h-3" />
                            Bloqueado por Recepción
                          </span>
                        )}
                      </div>

                      {/* Banner de Presupuesto Pendiente de Autorización */}
                      {selectedOrder.estado === 'PRESUPUESTADO' && (
                        currentUser.rol === 'TECNICO' ? (
                          <div className="p-4 bg-amber-50/90 border-2 border-amber-300 rounded-xl space-y-2 shadow-2xs">
                            <div className="flex items-center gap-2 text-amber-950 font-extrabold text-xs">
                              <div className="p-1.5 bg-amber-500 text-white rounded-lg shrink-0">
                                <Lock className="w-4 h-4" />
                              </div>
                              <span>🔒 En Espera de Confirmación de Recepción (S/ {selectedOrder.costoTotal.toFixed(2)})</span>
                            </div>
                            <p className="text-[11px] text-amber-900 leading-relaxed">
                              El presupuesto ya fue enviado a <strong>Recepción</strong>. Esta orden se encuentra <strong>bloqueada temporalmente</strong> hasta que Recepción se comunique con el cliente y confirme en el sistema si <strong>ACEPTÓ</strong> o <strong>RECHAZÓ</strong> la cotización.
                            </p>
                            <div className="pt-1 flex items-center gap-1.5 text-[10px] font-bold text-amber-800">
                              <Clock className="w-3.5 h-3.5 animate-pulse text-amber-600" />
                              <span>Se desbloqueará automáticamente cuando Recepción apruebe el presupuesto.</span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                              <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                              <span>Presupuesto Registrado por Técnico (S/ {selectedOrder.costoTotal.toFixed(2)}) — Esperando Confirmación de Recepción</span>
                            </div>
                            <p className="text-[11px] text-amber-800 leading-tight">
                              Confirme la decisión del cliente para desbloquear la orden al técnico o proceder a su devolución:
                            </p>
                            <div className="flex flex-wrap gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleAprobarPresupuesto(false)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Cliente Aceptó (Iniciar Reparación)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAprobarPresupuesto(true)}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                              >
                                <Clock className="w-3.5 h-3.5" />
                                Aceptó (Espera Repuestos)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('¿Confirmar que el cliente rechazó el presupuesto? Se pasará la orden a Rechazado / Sin Reparación.')) {
                                    handleChangeOrderEstado(
                                      'RECHAZADO_DEVUELTO',
                                      '❌ Presupuesto Rechazado por Cliente',
                                      'El cliente no aceptó los costos de reparación. El equipo se reensambla y se deja disponible para devolución en recepción.'
                                    );
                                  }
                                }}
                                className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-bold text-[11px] flex items-center gap-1 border border-red-300 transition-colors cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Cliente Rechazó
                              </button>
                            </div>
                          </div>
                        )
                      )}

                      {!(currentUser.rol === 'TECNICO' && selectedOrder.estado === 'PRESUPUESTADO') && (
                        <form onSubmit={handleAddAvance} className="space-y-3">
                          <div>
                            <label className="block font-semibold text-slate-600 mb-1">
                              Cambiar Estado del Proceso *
                            </label>
                            <select
                              value={newAvanceEstado}
                              onChange={(e) => setNewAvanceEstado(e.target.value as any)}
                              className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                            >
                              {currentUser.rol === 'TECNICO' &&
                              (selectedOrder.estado === 'RECEPCIONADO' || selectedOrder.estado === 'EN_DIAGNOSTICO') ? (
                                <>
                                  <option value="EN_DIAGNOSTICO">2. En Diagnóstico (Revisando hardware)</option>
                                  <option value="PRESUPUESTADO">3. Presupuestado (Enviar a Recepción para aprobación)</option>
                                </>
                              ) : currentUser.rol === 'TECNICO' ? (
                                <>
                                  <option value="APROBADO_EN_REPARACION">4. En Reparación (Trabajando en taller)</option>
                                  <option value="ESPERA_REPUESTOS">5. Espera Repuestos (Falta stock)</option>
                                  <option value="REPARADO_PROBADO">6. Reparado & Probado (Listo para entrega)</option>
                                  <option value="LISTO_ENTREGA">7. Listo para Entrega (Pasar a Recepción)</option>
                                </>
                              ) : (
                                <>
                                  <option value="EN_DIAGNOSTICO">2. En Diagnóstico (Revisando hardware)</option>
                                  <option value="PRESUPUESTADO">3. Presupuestado (Esperando autorización)</option>
                                  <option value="APROBADO_EN_REPARACION">4. En Reparación (Trabajando en taller)</option>
                                  <option value="ESPERA_REPUESTOS">5. Espera Repuestos (Falta stock)</option>
                                  <option value="REPARADO_PROBADO">6. Reparado & Probado (Listo para entrega)</option>
                                  <option value="LISTO_ENTREGA">7. Listo para Entrega (Pasar a Recepción)</option>
                                  <option value="RECHAZADO_DEVUELTO">Rechazado / Sin Reparación</option>
                                </>
                              )}
                            </select>
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-600 mb-1">
                              Título del Avance *
                            </label>
                            <input
                              type="text"
                              required
                              value={newAvanceTitulo}
                              onChange={(e) => setNewAvanceTitulo(e.target.value)}
                              placeholder="Ej: Diagnóstico concluido / Cambio de pasta térmica y limpieza"
                              className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-600 mb-1">
                              Descripción Técnica del Trabajo Realizado
                            </label>
                            <textarea
                              rows={3}
                              value={newAvanceDesc}
                              onChange={(e) => setNewAvanceDesc(e.target.value)}
                              placeholder="Detalle los hallazgos técnicos, componentes intervenidos, pruebas realizadas..."
                              className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                            />
                          </div>

                          <div className="flex justify-end">
                            <button
                              type="submit"
                              className="px-4 py-2 bg-[#00346F] hover:bg-[#004A99] text-white rounded-lg font-bold flex items-center gap-1.5 shadow cursor-pointer"
                            >
                              <SaveIcon className="w-3.5 h-3.5" />
                              Guardar Avance en Bitácora
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Timeline / Bitácora */}
                  <div className="lg:col-span-5 bg-white p-4 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-800 block mb-3 border-b border-slate-100 pb-2">
                      Línea de Tiempo del Servicio ({selectedOrder.bitacora.length} registros)
                    </span>

                    <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                      {selectedOrder.bitacora.map((b, idx) => (
                        <div key={b.id || idx} className="relative pl-5 border-l-2 border-blue-200 space-y-1">
                          <div className="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-[#00346F] border-2 border-white" />
                          <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <span className="font-mono">{b.fecha}</span>
                            <span className="font-semibold text-slate-600">
                              {b.autorNombre} ({b.autorRol})
                            </span>
                          </div>
                          <span className="font-bold text-slate-800 text-xs block">{b.titulo}</span>
                          <p className="text-slate-600 leading-relaxed text-[11px]">{b.descripcion}</p>
                          {b.estadoNuevo && (
                            <span
                              className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                                ESTADOS_CONFIG[b.estadoNuevo]?.bg
                              } ${ESTADOS_CONFIG[b.estadoNuevo]?.text}`}
                            >
                              Estado: {ESTADOS_CONFIG[b.estadoNuevo]?.label}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: REPUESTOS & MANO DE OBRA */}
              {activeDetailTab === 'repuestos' && (
                <div className="space-y-6">
                  {/* Repuestos Section */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-[#00346F]" />
                        Repuestos e Insumos Utilizados del Almacén
                      </span>
                      <span className="font-mono font-bold text-slate-700">
                        Subtotal Repuestos: S/ {selectedOrder.costoTotalRepuestos.toFixed(2)}
                      </span>
                    </div>

                    {!(currentUser.rol === 'TECNICO' && selectedOrder.estado === 'PRESUPUESTADO') && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select
                          value={selectedProdId}
                          onChange={(e) => setSelectedProdId(Number(e.target.value))}
                          disabled={repuestosDisponibles.length === 0}
                          className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          {repuestosDisponibles.length === 0 ? (
                            <option value={0} disabled>
                              ⚠️ No hay repuestos ni insumos de taller registrados en almacén
                            </option>
                          ) : (
                            repuestosDisponibles.map((p) => (
                              <option key={p.id} value={p.id}>
                                [{p.codigo}] {p.nombre} - S/ {p.precioUnitario.toFixed(2)} (Stock: {p.stock})
                              </option>
                            ))
                          )}
                        </select>


                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={repuestoCantidad}
                            onChange={(e) => setRepuestoCantidad(parseInt(e.target.value) || 1)}
                            className="w-16 p-2 bg-white border border-slate-300 rounded-lg text-center font-bold"
                          />
                          <button
                            type="button"
                            onClick={handleAddRepuesto}
                            className="px-3 py-2 bg-[#00346F] hover:bg-[#004A99] text-white rounded-lg font-bold flex items-center gap-1 text-xs cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Agregar Repuesto
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Repuestos List */}
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                      {selectedOrder.repuestos.length === 0 ? (
                        <div className="p-3 text-slate-400 text-center">No se han cargado repuestos a esta orden.</div>
                      ) : (
                        selectedOrder.repuestos.map((r) => (
                          <div key={r.id} className="p-2.5 flex justify-between items-center hover:bg-slate-50">
                            <div>
                              <span className="font-bold text-slate-800">
                                {r.descripcion} ({r.cantidad} un.)
                              </span>
                              <span className="font-mono text-[11px] text-slate-500 block">
                                P. Unit: S/ {r.precioUnitario.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 font-mono">
                              <span className="font-bold text-slate-900">S/ {r.total.toFixed(2)}</span>
                              {!(currentUser.rol === 'TECNICO' && selectedOrder.estado === 'PRESUPUESTADO') && (
                                <button
                                  onClick={() => handleRemoveRepuesto(r.id)}
                                  className="text-red-500 hover:text-red-700 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Mano de Obra Section */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Wrench className="w-4 h-4 text-[#00346F]" />
                        Mano de Obra & Servicios Técnicos
                      </span>
                      <span className="font-mono font-bold text-slate-700">
                        Subtotal Servicios: S/ {selectedOrder.costoTotalManoObra.toFixed(2)}
                      </span>
                    </div>

                    {!(currentUser.rol === 'TECNICO' && selectedOrder.estado === 'PRESUPUESTADO') && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={newServicioDesc}
                          onChange={(e) => setNewServicioDesc(e.target.value)}
                          placeholder="Descripción: ej. Mantenimiento profundo, Reballing, Reinstalación S.O."
                          className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={newServicioPrecio}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => setNewServicioPrecio(e.target.value)}
                          placeholder="Precio S/"
                          className="w-24 p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-right focus:border-[#00346F] focus:outline-none"
                        />

                        <button
                          type="button"
                          onClick={handleAddServicio}
                          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1 text-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Agregar Servicio
                        </button>
                      </div>
                    )}

                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                      {selectedOrder.serviciosManoObra.length === 0 ? (
                        <div className="p-3 text-slate-400 text-center">No se han registrado conceptos de mano de obra.</div>
                      ) : (
                        selectedOrder.serviciosManoObra.map((m) => (
                          <div key={m.id} className="p-2.5 flex justify-between items-center hover:bg-slate-50">
                            <span className="font-bold text-slate-800">{m.descripcion}</span>
                            <div className="flex items-center gap-3 font-mono">
                              <span className="font-bold text-slate-900">S/ {m.precio.toFixed(2)}</span>
                              {!(currentUser.rol === 'TECNICO' && selectedOrder.estado === 'PRESUPUESTADO') && (
                                <button
                                  onClick={() => handleRemoveServicio(m.id)}
                                  className="text-red-500 hover:text-red-700 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* PANEL COMPLETO DE RESUMEN ECONÓMICO Y GESTIÓN DE PRESUPUESTO */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                    {/* Encabezado del Resumen */}
                    <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50/40 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">Resumen Económico & Estado de Cotización</span>
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${ESTADOS_CONFIG[selectedOrder.estado]?.bg} ${ESTADOS_CONFIG[selectedOrder.estado]?.text} ${ESTADOS_CONFIG[selectedOrder.estado]?.border}`}>
                            {ESTADOS_CONFIG[selectedOrder.estado]?.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Repuestos: S/ {selectedOrder.costoTotalRepuestos.toFixed(2)} + Mano de Obra: S/ {selectedOrder.costoTotalManoObra.toFixed(2)}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-black text-[#00346F] font-mono">
                          TOTAL: S/ {selectedOrder.costoTotal.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-slate-600 font-mono">
                          Adelanto: S/ {selectedOrder.adelantoPagado.toFixed(2)} | <strong className="text-blue-700">Saldo Pendiente: S/ {selectedOrder.saldoPendiente.toFixed(2)}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Barra de Acciones según el Estado */}
                    <div className="p-4 bg-white space-y-3">
                      {/* CASO 1: Aún no presupuestado (RECEPCIONADO o EN_DIAGNOSTICO) */}
                      {(selectedOrder.estado === 'RECEPCIONADO' || selectedOrder.estado === 'EN_DIAGNOSTICO') && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
                          <div className="text-xs text-amber-900">
                            <strong>Paso siguiente:</strong> Una vez agregados los repuestos y mano de obra requeridos, fije el presupuesto para enviar la cotización al cliente.
                          </div>
                          <button
                            type="button"
                            onClick={handleFijarPresupuesto}
                            className="w-full sm:w-auto px-4 py-2.5 bg-[#00346F] hover:bg-[#004A99] text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all whitespace-nowrap"
                          >
                            <DollarSign className="w-4 h-4 text-emerald-400" />
                            Fijar Presupuesto y Pasar a "Presupuestado"
                          </button>
                        </div>
                      )}

                      {/* CASO 2: Ya está en PRESUPUESTADO (Esperando confirmación del cliente) */}
                      {selectedOrder.estado === 'PRESUPUESTADO' && (
                        currentUser.rol === 'TECNICO' ? (
                          <div className="p-4 bg-amber-50/90 border-2 border-amber-300 rounded-xl space-y-2 shadow-2xs">
                            <div className="flex items-center gap-2 text-amber-950 font-extrabold text-xs">
                              <div className="p-1.5 bg-amber-500 text-white rounded-lg shrink-0">
                                <Lock className="w-4 h-4" />
                              </div>
                              <span>
                                🔒 Presupuesto Enviado a Recepción (S/ {selectedOrder.costoTotal.toFixed(2)}) — Esperando Confirmación
                              </span>
                            </div>
                            <p className="text-[11px] text-amber-900 leading-relaxed">
                              La cotización ya fue registrada y está siendo gestionada por <strong>Recepción</strong>. Una vez que Recepción confirme si el cliente <strong>aceptó o rechazó</strong> el presupuesto, se habilitará el siguiente paso.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                              <div className="flex items-center gap-2 text-amber-900 text-xs">
                                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>
                                  <strong>Orden en Espera de Aprobación:</strong> El presupuesto de <strong>S/ {selectedOrder.costoTotal.toFixed(2)}</strong> está listo. Envíelo al cliente y registre su respuesta:
                                </span>
                              </div>

                              {/* Botones de Envío de Cotización */}
                              <div className="flex items-center gap-2 w-full md:w-auto">
                                {selectedOrder.clienteTelefono && (
                                  <a
                                    href={getCotizacionWhatsAppUrl()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 md:flex-none px-3 py-1.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    Cotizar por WhatsApp
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTicketModalOrder(selectedOrder);
                                    setTicketEmailInput(selectedOrder.clienteEmail || '');
                                    setTicketEmailSent(false);
                                  }}
                                  className="flex-1 md:flex-none px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                  Cotizar por Correo
                                </button>
                              </div>
                            </div>

                            {/* Botones de Decisión del Cliente */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleAprobarPresupuesto(false)}
                                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                ✓ Cliente Aceptó (Iniciar Reparación)
                              </button>

                              <button
                                type="button"
                                onClick={() => handleAprobarPresupuesto(true)}
                                className="py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                              >
                                <Package className="w-4 h-4" />
                                📦 Cliente Aceptó (Espera Repuestos)
                              </button>

                              <button
                                type="button"
                                onClick={handleRechazarPresupuesto}
                                className="py-2.5 px-3 bg-red-100 hover:bg-red-200 text-red-800 border border-red-300 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                              >
                                <XCircle className="w-4 h-4 text-red-600" />
                                ✕ Cliente Rechazó Presupuesto
                              </button>
                            </div>
                          </div>
                        )
                      )}

                      {/* CASO 3: Presupuesto Aprobado (En Reparación, Espera Repuestos o Reparado) */}
                      {(selectedOrder.estado === 'APROBADO_EN_REPARACION' ||
                        selectedOrder.estado === 'ESPERA_REPUESTOS' ||
                        selectedOrder.estado === 'REPARADO_PROBADO') && (
                        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-emerald-900 text-xs">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>
                              <strong>Presupuesto Aprobado:</strong> Trabajos técnicos autorizados por el cliente por S/ {selectedOrder.costoTotal.toFixed(2)}.
                            </span>
                          </div>

                          {/* Botón de Contingencia: ¿Apareció Falla Oculta? */}
                          <button
                            type="button"
                            onClick={handlePresupuestoAdicional}
                            className="w-full sm:w-auto px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors whitespace-nowrap"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            ¿Falla Oculta? Notificar Adicional
                          </button>
                        </div>
                      )}

                      {/* CASO 4: Rechazado */}
                      {selectedOrder.estado === 'RECHAZADO_DEVUELTO' && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-red-900 text-xs">
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                            <span>
                              <strong>Presupuesto No Autorizado:</strong> El cliente declinó la reparación. El equipo debe entregarse en mostrador.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleFijarPresupuesto}
                            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold text-xs transition-colors"
                          >
                            Reabrir Presupuesto
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 3: TICKET IMPRESO */}
              {activeDetailTab === 'ticket' && (
                <div className="printable-content bg-white p-6 rounded-xl border border-slate-300 max-w-md mx-auto shadow space-y-4 font-mono text-[11px] text-slate-800">
                  <div className="text-center space-y-1 border-b border-slate-300 pb-3">
                    <span className="text-sm font-extrabold text-[#00346F] block">
                      MG SOLUTIONS GROUP S.A.C.
                    </span>
                    <span>RUC: 20609737524</span>
                    <span className="block text-[10px] text-slate-500">
                      Taller & Soporte Técnico Especializado
                    </span>
                    <span className="font-bold text-sm block text-[#00346F] pt-1">
                      TICKET DE SERVICIO: {selectedOrder.codigo}
                    </span>
                  </div>

                  <div className="space-y-1 border-b border-slate-300 pb-3">
                    <div>
                      <strong>CLIENTE:</strong> {selectedOrder.clienteNombre}
                    </div>
                    <div>
                      <strong>DOC:</strong> {selectedOrder.clienteDocumento || 'No registrado'}
                    </div>
                    <div>
                      <strong>TEL:</strong> {selectedOrder.clienteTelefono || 'No registrado'}
                    </div>
                    <div>
                      <strong>FECHA INGRESO:</strong> {selectedOrder.fechaIngreso}
                    </div>
                  </div>

                  <div className="space-y-1 border-b border-slate-300 pb-3">
                    <div>
                      <strong>EQUIPO:</strong> {selectedOrder.marca} {selectedOrder.modelo}
                    </div>
                    <div>
                      <strong>SERIE:</strong> {selectedOrder.numeroSerie}
                    </div>
                    <div>
                      <strong>ACCESORIOS:</strong> {selectedOrder.accesoriosDejados.join(', ')}
                    </div>
                    <div>
                      <strong>FALLA:</strong> {selectedOrder.fallaReportada}
                    </div>
                  </div>

                  {/* DETALLE DE REPUESTOS E INSUMOS */}
                  <div className="space-y-1.5 border-b border-slate-300 pb-3">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      <span>REPUESTOS & COMPONENTES:</span>
                      {selectedOrder.costoTotalRepuestos > 0 && (
                        <span className="font-mono">Subt: S/ {selectedOrder.costoTotalRepuestos.toFixed(2)}</span>
                      )}
                    </div>
                    {selectedOrder.repuestos && selectedOrder.repuestos.length > 0 ? (
                      <div className="space-y-1">
                        {selectedOrder.repuestos.map((r, i) => (
                          <div key={r.id || i} className="flex justify-between items-start text-[10px]">
                            <span className="leading-tight pr-2">
                              • {r.cantidad}x {r.descripcion}
                            </span>
                            <span className="font-mono font-bold shrink-0">
                              S/ {(Number(r.total || (r.cantidad * r.precioUnitario)) || 0).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 italic">
                        Sin repuestos de almacén requeridos
                      </div>
                    )}
                  </div>

                  {/* DETALLE DE MANO DE OBRA & SERVICIOS */}
                  <div className="space-y-1.5 border-b border-slate-300 pb-3">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      <span>MANO DE OBRA & SERVICIOS:</span>
                      {selectedOrder.costoTotalManoObra > 0 && (
                        <span className="font-mono">Subt: S/ {selectedOrder.costoTotalManoObra.toFixed(2)}</span>
                      )}
                    </div>
                    {selectedOrder.serviciosManoObra && selectedOrder.serviciosManoObra.length > 0 ? (
                      <div className="space-y-1">
                        {selectedOrder.serviciosManoObra.map((s, i) => (
                          <div key={s.id || i} className="flex justify-between items-start text-[10px]">
                            <span className="leading-tight pr-2">
                              • {s.descripcion}
                            </span>
                            <span className="font-mono font-bold shrink-0">
                              S/ {(Number(s.precio) || 0).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 italic flex justify-between">
                        <span>• Diagnóstico técnico y laboratorio</span>
                        <span className="font-mono font-bold">
                          S/ {(Number(selectedOrder.costoTotalManoObra || (selectedOrder.costoTotal - (selectedOrder.costoTotalRepuestos || 0))) || 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CUADRO DE TOTALES */}
                  <div className="space-y-1 border-b border-slate-300 pb-3">
                    {selectedOrder.costoTotalRepuestos > 0 && (
                      <div className="flex justify-between text-[10px] text-slate-600">
                        <span>SUBTOTAL REPUESTOS:</span>
                        <span className="font-mono">S/ {selectedOrder.costoTotalRepuestos.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedOrder.costoTotalManoObra > 0 && (
                      <div className="flex justify-between text-[10px] text-slate-600">
                        <span>SUBTOTAL MANO DE OBRA:</span>
                        <span className="font-mono">S/ {selectedOrder.costoTotalManoObra.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[12px] font-black text-[#00346F] pt-0.5">
                      <span>PRESUPUESTO TOTAL:</span>
                      <strong>S/ {selectedOrder.costoTotal.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between text-emerald-700">
                      <span>ADELANTO EN CAJA:</span>
                      <span className="font-bold">S/ {selectedOrder.adelantoPagado.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1 text-[12px]">
                      <span>SALDO PENDIENTE:</span>
                      <span>S/ {selectedOrder.saldoPendiente.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 text-center space-y-1">
                    <p>* Todo equipo no recogido en 30 días pasará a remate administrativo.</p>
                    <p>* Garantía de servicio: {selectedOrder.garantiaDias || 90} días calendario.</p>
                  </div>

                  <div className="no-print flex flex-wrap sm:flex-nowrap gap-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="flex-1 py-2 bg-[#00346F] text-white rounded font-sans font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#004A99] shadow-xs"
                    >
                      <Printer className="w-4 h-4" />
                      Imprimir Ficha
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTicketModalOrder(selectedOrder);
                        setTicketEmailInput(selectedOrder.clienteEmail || '');
                        setTicketEmailSent(false);
                      }}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-sans font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      Enviar por Correo
                    </button>
                    {selectedOrder.clienteTelefono && (
                      <a
                        href={`https://wa.me/51${selectedOrder.clienteTelefono.replace(/\D/g, '')}?text=${encodeURIComponent(
                          `Estimado(a) ${selectedOrder.clienteNombre}, le saludamos de MG Solutions. Le informamos sobre su equipo ${selectedOrder.tipoEquipo} ${selectedOrder.marca} ${selectedOrder.modelo} (Ticket: ${selectedOrder.codigo}). Estado actual: ${selectedOrder.estado}. Saldo a liquidar: S/ ${selectedOrder.saldoPendiente.toFixed(2)}. Puede consultar el avance aquí o acercarse a nuestra sede.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 bg-[#25D366] text-white rounded font-sans font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#1EBE5D] transition-colors shadow-xs"
                      >
                        <MessageSquare className="w-4 h-4" />
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>

              )}
            </div>
          </div>
        </div>
      )}
      {/* Modal de Registro Rápido de Cliente */}
      {isQuickClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-[#00346F] text-white">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold">Registro Rápido de Cliente</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickClientModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickClientSubmit} className="p-5 space-y-3.5 text-xs bg-white">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tipo Doc
                  </label>
                  <select
                    value={quickClientForm.tipoDocumento}
                    onChange={(e) =>
                      setQuickClientForm({
                        ...quickClientForm,
                        tipoDocumento: e.target.value as 'DNI' | 'RUC',
                      })
                    }
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 focus:outline-none focus:border-[#00346F]"
                  >
                    <option value="DNI">DNI</option>
                    <option value="RUC">RUC</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    N° Documento *
                  </label>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    maxLength={quickClientForm.tipoDocumento === 'RUC' ? 11 : 8}
                    value={quickClientForm.numeroDocumento}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (quickClientForm.tipoDocumento === 'DNI') {
                        val = val.slice(0, 8);
                      } else {
                        val = val.slice(0, 11);
                      }
                      setQuickClientForm({ ...quickClientForm, numeroDocumento: val });
                    }}
                    placeholder={quickClientForm.tipoDocumento === 'DNI' ? '8 dígitos' : '11 dígitos'}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-[#00346F] focus:outline-none focus:border-[#00346F]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {quickClientForm.tipoDocumento === 'RUC' ? 'Razón Social *' : 'Nombre Completo *'}
                </label>
                <input
                  type="text"
                  required
                  value={quickClientForm.razonSocial}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (quickClientForm.tipoDocumento === 'DNI') {
                      val = val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑäëïöüÄËÏÖÜ\s]/g, '');
                    }
                    setQuickClientForm({ ...quickClientForm, razonSocial: val.toUpperCase() });
                  }}
                  placeholder="Ej: JUAN CARLOS PÉREZ / TECH SOLUTIONS S.A.C."
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium focus:outline-none focus:border-[#00346F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={9}
                    value={quickClientForm.telefono}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                      setQuickClientForm({ ...quickClientForm, telefono: val });
                    }}
                    placeholder="987654321"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium focus:outline-none focus:border-[#00346F]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email (Opcional)
                  </label>
                  <input
                    type="email"
                    value={quickClientForm.email}
                    onChange={(e) =>
                      setQuickClientForm({ ...quickClientForm, email: e.target.value })
                    }
                    placeholder="cliente@correo.com"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium focus:outline-none focus:border-[#00346F]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={quickClientForm.direccion}
                  onChange={(e) =>
                    setQuickClientForm({ ...quickClientForm, direccion: e.target.value })
                  }
                  placeholder="Av. Balta 123, Chiclayo"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium focus:outline-none focus:border-[#00346F]"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickClientModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  Guardar y Seleccionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ficha de Reporte para Mayorista / Proveedor (RMA) */}
      {isRmaModalOpen && rmaReportData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-auto flex flex-col">
            {/* Barra superior con controles */}
            <div className="p-4 bg-[#00346F] text-white flex justify-between items-center print:hidden">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm">Ficha de Reporte para Proveedor / Mayorista (RMA)</h3>
                  <p className="text-[11px] text-blue-200">Trámite oficial de derivación a servicio de garantía</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Ficha RMA
                </button>
                <button
                  type="button"
                  onClick={() => setIsRmaModalOpen(false)}
                  className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Hoja de Impresión Formal */}
            <div className="p-6 text-slate-800 space-y-4 print:p-0">
              {/* Encabezado Ficha */}
              <div className="border-b-2 border-slate-800 pb-4 flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-extrabold text-[#00346F] tracking-tight">MG SOLUTIONS & SERVICES</h1>
                  <p className="text-xs text-slate-500">RUC: 20600000000 • Soluciones Tecnológicas & Soporte Especializado</p>
                  <p className="text-[11px] text-slate-500">Área de Control de Calidad y Gestión de Garantías Oficiales</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded border border-emerald-300">
                    FICHA RMA OFICIAL
                  </span>
                  <p className="font-mono text-xs font-bold mt-1 text-slate-700">REF: {rmaReportData.codigo}</p>
                  <p className="text-[11px] text-slate-500">Fecha: {rmaReportData.fecha}</p>
                </div>
              </div>

              {/* Plazo Legal y Normativo */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-blue-900 text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#00346F] shrink-0" />
                  <span>
                    <strong>Plazo de Gestión Técnica: 7 a 30 días hábiles</strong> (Tiempo regulado ante Centro Autorizado / Fabricante).
                  </span>
                </div>
                <span className="font-bold text-[11px] bg-[#00346F] text-white px-2 py-0.5 rounded">
                  {rmaReportData.diasRestantes > 0 ? `${rmaReportData.diasRestantes} días vigentes` : 'Garantía Verificada'}
                </span>
              </div>

              {/* Bloques de Datos en Cuadrícula */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Proveedor / Mayorista de Destino */}
                <div className="border border-slate-200 rounded-lg p-3 space-y-1.5 bg-slate-50/50">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block border-b border-slate-200 pb-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-600" />
                    Destinatario: Mayorista / Fabricante
                  </span>
                  <div className="text-xs space-y-1 text-slate-700">
                    <p><strong>Mayorista:</strong> {rmaReportData.proveedorNombre}</p>
                    <p><strong>Atención / Contacto:</strong> {rmaReportData.proveedorContacto}</p>
                    <p><strong>Teléfono / Central:</strong> {rmaReportData.proveedorTelefono}</p>
                    <p><strong>Correo Electrónico:</strong> {rmaReportData.proveedorEmail}</p>
                  </div>
                </div>

                {/* Cliente Final / Afectado */}
                <div className="border border-slate-200 rounded-lg p-3 space-y-1.5 bg-slate-50/50">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block border-b border-slate-200 pb-1 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-slate-600" />
                    Datos del Cliente / Propietario
                  </span>
                  <div className="text-xs space-y-1 text-slate-700">
                    <p><strong>Nombre / Razón Social:</strong> {rmaReportData.clienteNombre}</p>
                    <p><strong>Documento (DNI/RUC):</strong> {rmaReportData.clienteDocumento}</p>
                    <p><strong>Teléfono Móvil:</strong> {rmaReportData.clienteTelefono}</p>
                    <p><strong>Comprobante Venta:</strong> {rmaReportData.comprobanteVenta}</p>
                  </div>
                </div>
              </div>

              {/* Datos del Equipo */}
              <div className="border border-slate-200 rounded-lg p-3.5 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block border-b border-slate-200 pb-1">
                  Identificación Técnica del Equipo
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 bg-slate-100 rounded">
                    <span className="block text-[10px] text-slate-500 font-semibold">MARCA</span>
                    <span className="font-bold text-slate-800">{rmaReportData.marca || 'N/A'}</span>
                  </div>
                  <div className="p-2 bg-slate-100 rounded">
                    <span className="block text-[10px] text-slate-500 font-semibold">MODELO</span>
                    <span className="font-bold text-slate-800">{rmaReportData.modelo || 'N/A'}</span>
                  </div>
                  <div className="p-2 bg-slate-100 rounded col-span-2">
                    <span className="block text-[10px] text-slate-500 font-semibold">NÚMERO DE SERIE (S/N)</span>
                    <span className="font-mono font-bold text-indigo-700 text-sm tracking-wide">{rmaReportData.numeroSerie}</span>
                  </div>
                </div>
              </div>

              {/* Falla Reclamada */}
              <div className="border border-red-200 bg-red-50/30 rounded-lg p-3.5 space-y-1">
                <span className="text-[11px] font-bold text-red-900 uppercase tracking-wider block">
                  Motivo de Falla / Diagnóstico Preliminar
                </span>
                <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {rmaReportData.fallaReclamada}
                </p>
              </div>

              {/* Checklist de Validez */}
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-[11px] text-slate-600 space-y-1">
                <span className="font-bold text-slate-700 block">Condiciones Físicas de Ingreso Verificadas:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-700">
                  <span className="flex items-center gap-1">✓ Pantalla e integridad OK</span>
                  <span className="flex items-center gap-1">✓ Sin derrames de líquido</span>
                  <span className="flex items-center gap-1">✓ Sin golpes ni deformaciones</span>
                  <span className="flex items-center gap-1">✓ Sellos de garantía intactos</span>
                </div>
              </div>

              {/* Firmas */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs text-slate-600">
                <div>
                  <div className="border-t border-slate-400 mx-auto w-44 pt-1 font-bold text-slate-800">
                    Mesa de Control RMA
                  </div>
                  <p className="text-[10px] text-slate-500">MG Solutions</p>
                </div>
                <div>
                  <div className="border-t border-slate-400 mx-auto w-44 pt-1 font-bold text-slate-800">
                    Recepción Proveedor
                  </div>
                  <p className="text-[10px] text-slate-500">{rmaReportData.proveedorNombre.slice(0, 24)}</p>
                </div>
              </div>
            </div>

            {/* Footer modal */}
            <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end gap-2 print:hidden">
              <button
                type="button"
                onClick={() => setIsRmaModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#00346F] hover:bg-[#004A99] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                Imprimir Documento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE TICKET GENERADO: VER NÚMERO, IMPRIMIR O ENVIAR POR CORREO */}
      {ticketModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
            {/* Header del Modal */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-[#002654] to-[#004A99] text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Printer className="w-5 h-5 text-blue-200" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold flex items-center gap-2">
                    Ticket de Servicio
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-mono font-bold">
                      {ticketModalOrder.codigo}
                    </span>
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    Orden generada con éxito. Elija imprimir el ticket o enviarlo por correo electrónico al cliente.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTicketModalOrder(null)}
                className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido: Ticket visual + Acciones */}
            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6 bg-[#F8FAFC]">
              {/* Columna Izquierda: Tarjeta de Ticket */}
              <div className="md:col-span-7 flex justify-center">
                <div
                  id="ticket-modal-card"
                  className="printable-content bg-white p-5 rounded-xl border border-slate-300 shadow-sm w-full font-mono text-[11px] text-slate-800 space-y-3"
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
                      TICKET DE SERVICIO: {ticketModalOrder.codigo}
                    </div>
                  </div>

                  <div className="space-y-1 border-b border-slate-300 pb-2.5">
                    <div><strong>CLIENTE:</strong> {ticketModalOrder.clienteNombre}</div>
                    <div><strong>DOC:</strong> {ticketModalOrder.clienteDocumento || 'No registrado'}</div>
                    <div><strong>TEL:</strong> {ticketModalOrder.clienteTelefono || 'No registrado'}</div>
                    <div><strong>FECHA INGRESO:</strong> {ticketModalOrder.fechaIngreso}</div>
                  </div>

                  <div className="space-y-1 border-b border-slate-300 pb-2.5">
                    <div><strong>EQUIPO:</strong> {ticketModalOrder.tipoEquipo} {ticketModalOrder.marca} {ticketModalOrder.modelo}</div>
                    <div><strong>SERIE:</strong> {ticketModalOrder.numeroSerie}</div>
                    <div><strong>ACCESORIOS:</strong> {ticketModalOrder.accesoriosDejados.join(', ')}</div>
                    <div><strong>FALLA:</strong> {ticketModalOrder.fallaReportada}</div>
                  </div>

                  {/* DETALLE DE REPUESTOS E INSUMOS */}
                  <div className="space-y-1.5 border-b border-slate-300 pb-2.5">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      <span>REPUESTOS & COMPONENTES:</span>
                      {ticketModalOrder.costoTotalRepuestos > 0 && (
                        <span className="font-mono">Subt: S/ {ticketModalOrder.costoTotalRepuestos.toFixed(2)}</span>
                      )}
                    </div>
                    {ticketModalOrder.repuestos && ticketModalOrder.repuestos.length > 0 ? (
                      <div className="space-y-1">
                        {ticketModalOrder.repuestos.map((r, i) => (
                          <div key={r.id || i} className="flex justify-between items-start text-[10px]">
                            <span className="leading-tight pr-2">
                              • {r.cantidad}x {r.descripcion}
                            </span>
                            <span className="font-mono font-bold shrink-0">
                              S/ {(Number(r.total || (r.cantidad * r.precioUnitario)) || 0).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 italic">
                        Sin repuestos de almacén requeridos
                      </div>
                    )}
                  </div>

                  {/* DETALLE DE MANO DE OBRA & SERVICIOS */}
                  <div className="space-y-1.5 border-b border-slate-300 pb-2.5">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      <span>MANO DE OBRA & SERVICIOS:</span>
                      {ticketModalOrder.costoTotalManoObra > 0 && (
                        <span className="font-mono">Subt: S/ {ticketModalOrder.costoTotalManoObra.toFixed(2)}</span>
                      )}
                    </div>
                    {ticketModalOrder.serviciosManoObra && ticketModalOrder.serviciosManoObra.length > 0 ? (
                      <div className="space-y-1">
                        {ticketModalOrder.serviciosManoObra.map((s, i) => (
                          <div key={s.id || i} className="flex justify-between items-start text-[10px]">
                            <span className="leading-tight pr-2">
                              • {s.descripcion}
                            </span>
                            <span className="font-mono font-bold shrink-0">
                              S/ {(Number(s.precio) || 0).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 italic flex justify-between">
                        <span>• Diagnóstico técnico y laboratorio</span>
                        <span className="font-mono font-bold">
                          S/ {(Number(ticketModalOrder.costoTotalManoObra || (ticketModalOrder.costoTotal - (ticketModalOrder.costoTotalRepuestos || 0))) || 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CUADRO DE TOTALES */}
                  <div className="space-y-1 border-b border-slate-300 pb-2.5">
                    {ticketModalOrder.costoTotalRepuestos > 0 && (
                      <div className="flex justify-between text-[10px] text-slate-600">
                        <span>SUBTOTAL REPUESTOS:</span>
                        <span className="font-mono">S/ {ticketModalOrder.costoTotalRepuestos.toFixed(2)}</span>
                      </div>
                    )}
                    {ticketModalOrder.costoTotalManoObra > 0 && (
                      <div className="flex justify-between text-[10px] text-slate-600">
                        <span>SUBTOTAL MANO DE OBRA:</span>
                        <span className="font-mono">S/ {ticketModalOrder.costoTotalManoObra.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[12px] font-black text-[#00346F] pt-0.5">
                      <span>PRESUPUESTO TOTAL:</span>
                      <strong>S/ {ticketModalOrder.costoTotal.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between text-emerald-700">
                      <span>ADELANTO EN CAJA:</span>
                      <span className="font-bold">S/ {ticketModalOrder.adelantoPagado.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1 text-[12px]">
                      <span>SALDO PENDIENTE:</span>
                      <span>S/ {ticketModalOrder.saldoPendiente.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 text-center space-y-1 pt-1">
                    <p>* Todo equipo no recogido en 30 días pasará a remate administrativo.</p>
                    <p>* Garantía de servicio: {ticketModalOrder.garantiaDias || 90} días calendario.</p>
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Panel de Opciones */}
              <div className="md:col-span-5 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  {/* Opción 1: Imprimir Ticket */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-[#00346F]">
                        <Printer className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs text-slate-800">1. Imprimir Ticket</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Imprima el ticket físico para entregar en mano al cliente en recepción.
                    </p>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="w-full py-2.5 bg-[#00346F] hover:bg-[#004A99] text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <Printer className="w-4 h-4" />
                      Imprimir Ticket Físico
                    </button>
                  </div>

                  {/* Opción 2: Enviar por Correo Electrónico */}
                  <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/20 shadow-xs">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                        <Mail className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs text-slate-800">2. Enviar por Correo</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-2.5">
                      Se enviará el ticket con formato oficial de MG Solutions al correo del cliente.
                    </p>
                    
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">
                          Correo del Cliente:
                        </label>
                        <input
                          type="email"
                          value={ticketEmailInput}
                          onChange={(e) => {
                            setTicketEmailInput(e.target.value);
                            setTicketEmailSent(false);
                          }}
                          placeholder="cliente@ejemplo.com"
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSendTicketEmail()}
                        disabled={isSendingTicketEmail || !ticketEmailInput.trim()}
                        className={`w-full py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all ${
                          isSendingTicketEmail
                            ? 'bg-slate-400 text-white cursor-wait'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {isSendingTicketEmail ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Enviando ticket al correo...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Enviar Ticket al Cliente
                          </>
                        )}
                      </button>

                      {ticketEmailSent && (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-[11px] text-emerald-800 font-semibold animate-in fade-in">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>¡Ticket enviado exitosamente a {ticketEmailInput}!</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Opción 3: WhatsApp */}
                  {ticketModalOrder.clienteTelefono && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <a
                        href={`https://wa.me/51${ticketModalOrder.clienteTelefono.replace(/\D/g, '')}?text=${encodeURIComponent(
                          `Estimado(a) ${ticketModalOrder.clienteNombre}, le confirmamos el ingreso de su equipo a MG Solutions. Ticket: ${ticketModalOrder.codigo}. Equipo: ${ticketModalOrder.tipoEquipo} ${ticketModalOrder.marca} ${ticketModalOrder.modelo}. Falla: ${ticketModalOrder.fallaReportada}. Saldo pendiente: S/ ${ticketModalOrder.saldoPendiente.toFixed(2)}.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Notificar por WhatsApp
                      </a>
                    </div>
                  )}
                </div>

                {/* Botón Cerrar */}
                <button
                  type="button"
                  onClick={() => setTicketModalOrder(null)}
                  className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold text-xs transition-colors mt-2"
                >
                  Finalizar y Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


function SaveIcon(props: any) {
  return <CheckCircle2 {...props} />;
}
