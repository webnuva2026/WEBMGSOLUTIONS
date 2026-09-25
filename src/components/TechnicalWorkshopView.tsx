import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import {
  OrdenServicio,
  EstadoOrdenServicio,
  TipoEquipo,
  Usuario,
  Cliente,
  Producto,
  Marca,
  Equipo,
  RepuestoUtilizado,
  ManoObraServicio,
  BitacoraAvance,
  ComunicacionCliente,
} from '../types';

interface TechnicalWorkshopViewProps {
  ordenes: OrdenServicio[];
  usuarios: Usuario[];
  clientes: Cliente[];
  productos: Producto[];
  marcas?: Marca[];
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
  const [newOrderClienteId, setNewOrderClienteId] = useState<number>(clientes[0]?.id || 1);
  const [newOrderTipo, setNewOrderTipo] = useState<TipoEquipo>('LAPTOP');
  const [newOrderMarca, setNewOrderMarca] = useState('');
  const [newOrderModelo, setNewOrderModelo] = useState('');
  const [newOrderSerie, setNewOrderSerie] = useState('');
  const [newOrderPassword, setNewOrderPassword] = useState('');
  const [newOrderFalla, setNewOrderFalla] = useState('');
  const [newOrderEstetico, setNewOrderEstetico] = useState('Buen estado general.');
  const [newOrderPrioridad, setNewOrderPrioridad] = useState<'NORMAL' | 'ALTA' | 'URGENTE'>('NORMAL');
  const [newOrderTecnicoId, setNewOrderTecnicoId] = useState<number>(() => {
    const tec = usuarios.find((u) => u.rol === 'TECNICO' && u.estado === 'ACTIVO');
    return tec ? tec.id : usuarios[0]?.id || 1;
  });
  const [newOrderAccesorios, setNewOrderAccesorios] = useState<string[]>(['Cargador original']);
  const [newOrderAdelanto, setNewOrderAdelanto] = useState<number>(0);

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

  const selectedClient = clientes.find((c) => c.id === Number(newOrderClienteId));

  const filteredClients = clientes.filter((c) => {
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

  // Detail Modal Sub-forms
  const [activeDetailTab, setActiveDetailTab] = useState<'flujo' | 'bitacora' | 'repuestos' | 'comunicacion' | 'ticket'>('flujo');
  const [newAvanceTitulo, setNewAvanceTitulo] = useState('');
  const [newAvanceDesc, setNewAvanceDesc] = useState('');
  const [newAvanceEstado, setNewAvanceEstado] = useState<EstadoOrdenServicio>('EN_DIAGNOSTICO');

  // Repuestos in detail
  const [selectedProdId, setSelectedProdId] = useState<number>(productos[0]?.id || 1);
  const [repuestoCantidad, setRepuestoCantidad] = useState<number>(1);
  const [newServicioDesc, setNewServicioDesc] = useState('');
  const [newServicioPrecio, setNewServicioPrecio] = useState<number>(50);

  // Comunicación in detail
  const [comunicacionResumen, setComunicacionResumen] = useState('');
  const [comunicacionCanal, setComunicacionCanal] = useState<'LLAMADA' | 'PRESENCIAL'>('LLAMADA');
  const [comunicacionResultado, setComunicacionResultado] = useState<'APROBADO' | 'RECHAZADO' | 'PENDIENTE' | 'CONSULTA'>('APROBADO');

  const tecnicos = usuarios.filter((u) => u.rol === 'TECNICO' && u.estado === 'ACTIVO');
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
    setNewAvanceEstado(order.estado);
    setActiveDetailTab('flujo');
    setIsDetailModalOpen(true);
  };

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateNewOrder = () => {
    const errors: Record<string, string> = {};
    if (!newOrderClienteId) errors.cliente = 'Seleccione un cliente.';
    if (!newOrderTipo) errors.tipo = 'Seleccione tipo de equipo.';
    if (!newOrderMarca.trim()) errors.marca = 'Ingrese la marca.';
    if (!newOrderModelo.trim()) errors.modelo = 'Ingrese el modelo.';
    if (!newOrderSerie.trim()) errors.serie = 'Ingrese el número de serie.';
    if (!newOrderFalla.trim()) errors.falla = 'Describa la falla.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateNewOrder()) return;
    const cliente = clientes.find((c) => c.id === Number(newOrderClienteId));
    if (!cliente) return;

    if (!newOrderMarca.trim() || !newOrderModelo.trim() || !newOrderFalla.trim()) {
      onShowToast('Datos incompletos', 'Registra marca, modelo y falla reportada del equipo.', 'warning');
      return;
    }

    if (cliente.estado === 'INACTIVO') {
      onShowToast('Cliente Inactivo', 'El cliente seleccionado está marcado como INACTIVO.', 'error');
      return;
    }

    const assignedTech = usuarios.find((u) => u.id === Number(newOrderTecnicoId));
    const nextNumber = ordenes.reduce((highest, order) => {
      const match = order.codigo.match(/(\d+)$/);
      return Math.max(highest, match ? Number(match[1]) : 0);
    }, 0) + 1;
    const code = `OT-2024-${String(nextNumber).padStart(4, '0')}`;

    const newOrder: OrdenServicio = {
      id: Date.now(),
      codigo: code,
      clienteId: cliente.id,
      clienteNombre: cliente.razonSocial,
      clienteDocumento: cliente.numeroDocumento,
      clienteTelefono: cliente.telefono || '987654321',
      clienteEmail: cliente.email,
      tipoEquipo: newOrderTipo,
      marca: newOrderMarca.toUpperCase().trim(),
      modelo: newOrderModelo.trim(),
      numeroSerie: newOrderSerie.trim().toUpperCase() || 'S/N-SINDATO',
      passwordEquipo: newOrderPassword,
      accesoriosDejados: newOrderAccesorios.length > 0 ? newOrderAccesorios : ['Solo equipo'],
      fallaReportada: newOrderFalla.trim(),
      estadoEstetico: newOrderEstetico.trim(),
      prioridad: newOrderPrioridad,
      tecnicoId: assignedTech ? assignedTech.id : currentUser.id,
      tecnicoNombre: assignedTech ? assignedTech.nombreCompleto : currentUser.nombreCompleto,
      recepcionadoPorId: currentUser.id,
      recepcionadoPorNombre: currentUser.nombreCompleto,
      fechaIngreso: new Date().toLocaleString('es-PE'),
      fechaEstimadaEntrega: 'En 24 a 48 horas hábiles',
      estado: 'RECEPCIONADO',
      repuestos: [],
      serviciosManoObra: [],
      costoTotalRepuestos: 0,
      costoTotalManoObra: 0,
      costoTotal: 0,
      adelantoPagado: Number(newOrderAdelanto) || 0,
      saldoPendiente: 0,
      bitacora: [
        {
          id: `b-${Date.now()}`,
          fecha: new Date().toLocaleString('es-PE'),
          autorNombre: currentUser.nombreCompleto,
          autorRol: currentUser.rol,
          titulo: 'Recepción del equipo e ingreso a taller',
          descripcion: `Equipo ingresado por secretaría. Falla reportada: "${newOrderFalla}". Asignado al técnico ${assignedTech?.nombreCompleto || 'Especialista'}.`,
          estadoNuevo: 'RECEPCIONADO',
        },
      ],
      comunicaciones: [],
      garantiaDias: 90,
    };

    onSaveOrden(newOrder);
    setIsNewOrderModalOpen(false);
    onShowToast('Orden de Servicio Creada', `Se generó la orden ${newOrder.codigo} para ${cliente.razonSocial}.`, 'success');
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
    setNewAvanceTitulo('');
    setNewAvanceDesc('');
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
    onShowToast('Repuesto agregado', `${prod.nombre} x${repuestoCantidad}`, 'info');
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
  };

  const handleAddComunicacion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !comunicacionResumen) return;

    const newCom: ComunicacionCliente = {
      id: `com-${Date.now()}`,
      fecha: new Date().toLocaleString('es-PE'),
      canal: comunicacionCanal,
      atendidoPor: currentUser.nombreCompleto,
      resumen: comunicacionResumen.trim(),
      resultado: comunicacionResultado,
    };

    let nextState = selectedOrder.estado;
    if (comunicacionResultado === 'APROBADO') {
      nextState = 'APROBADO_EN_REPARACION';
    } else if (comunicacionResultado === 'RECHAZADO') {
      nextState = 'RECHAZADO_DEVUELTO';
    }

    const updatedOrder: OrdenServicio = {
      ...selectedOrder,
      estado: nextState,
      comunicaciones: [newCom, ...selectedOrder.comunicaciones],
      bitacora: [
        {
          id: `b-${Date.now()}`,
          fecha: new Date().toLocaleString('es-PE'),
          autorNombre: currentUser.nombreCompleto,
          autorRol: currentUser.rol,
          titulo: `Comunicación con cliente (${comunicacionCanal})`,
          descripcion: `${comunicacionResumen} -> Resultado: ${comunicacionResultado}`,
          estadoNuevo: nextState,
        },
        ...selectedOrder.bitacora,
      ],
    };

    setSelectedOrder(updatedOrder);
    onSaveOrden(updatedOrder);
    setComunicacionResumen('');
    onShowToast('Contacto registrado', `Se guardó la interacción con el cliente vía ${comunicacionCanal}.`, 'success');
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
          {!readOnly && currentUser.rol !== 'TECNICO' && (
            <button
              onClick={() => setIsNewOrderModalOpen(true)}
              className="bg-[#00346F] hover:bg-[#004A99] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Nuevo ticket / ingreso de equipo
            </button>
          )}
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
                    {!readOnly && (
                      <button
                        onClick={() => setIsNewOrderModalOpen(true)}
                        className="mt-2 block mx-auto text-xs text-[#00346F] font-bold hover:underline"
                      >
                        Crear Orden
                      </button>
                    )}
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
                          <span>{o.codigo}</span>
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

                {/* Historial de Equipos Previos del Cliente (Autocompletar en 1 Clic) */}
                {allClientEquipos.length > 0 && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-1.5 mb-2">
                      <History className="w-4 h-4 text-amber-700" />
                      <span className="font-bold text-amber-900 text-[11px]">
                        Equipos previos registrados de este cliente (clic para autocompletar):
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {allClientEquipos.map((eq, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectPreExistingEquipo(eq)}
                          className="px-2.5 py-1.5 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg text-left text-[11px] font-medium text-slate-800 flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
                          title="Clic para cargar especificaciones de este equipo"
                        >
                          <span className="font-bold text-[#00346F]">[{eq.tipo}]</span>
                          <span>{eq.marca} {eq.modelo}</span>
                          {eq.numeroSerie && (
                            <span className="font-mono text-slate-500 text-[10px]">
                              (S/N: {eq.numeroSerie})
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Equipo Info con Marcas y Productos Registrados */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                  <span className="font-bold text-slate-800 text-xs">
                    Especificaciones del Equipo
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Seleccione marcas o modelos sugeridos del catálogo
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Tipo de Equipo</label>
                    <select
                      value={newOrderTipo}
                      onChange={(e) => setNewOrderTipo(e.target.value as any)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
                    >
                      <option value="LAPTOP">Laptop / Portátil</option>
                      <option value="PC_ESCRITORIO">PC de Escritorio</option>
                      <option value="IMPRESORA">Impresora / Multifuncional</option>
                      <option value="MONITOR">Monitor / Pantalla</option>
                      <option value="COMPONENTE">Tarjeta Madre / Componente</option>
                      <option value="SERVIDOR">Servidor</option>
                      <option value="OTRO">Otro Dispositivo</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block font-semibold text-slate-600">Marca *</label>
                      <span className="text-[10px] text-slate-400">Catálogo o personalizada</span>
                    </div>
                    <input
                      type="text"
                      required
                      list="registered-marcas-list"
                      value={newOrderMarca}
                      onChange={(e) => setNewOrderMarca(e.target.value.toUpperCase())}
                      placeholder="Ej: ASUS, HP, LENOVO, EPSON"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium uppercase"
                    />
                    <datalist id="registered-marcas-list">
                      {marcas
                        .filter((m) => m.estado === 'ACTIVO')
                        .map((m) => (
                          <option key={m.id} value={m.nombre} />
                        ))}
                    </datalist>
                    {/* Chips rápidos de marcas principales */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {['ASUS', 'LENOVO', 'HP', 'EPSON', 'DELL', 'CANON', 'ACER'].map((brand) => (
                        <button
                          key={brand}
                          type="button"
                          onClick={() => setNewOrderMarca(brand)}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors ${
                            newOrderMarca === brand
                              ? 'bg-[#00346F] text-white border-[#00346F]'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {brand}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block font-semibold text-slate-600">Modelo *</label>
                      <span className="text-[10px] text-slate-400">Sugerencias del catálogo</span>
                    </div>
                    <input
                      type="text"
                      required
                      list="registered-products-list"
                      value={newOrderModelo}
                      onChange={(e) => setNewOrderModelo(e.target.value)}
                      placeholder="Ej: TUF Gaming FX506 / Pavilion 15"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
                    />
                    <datalist id="registered-products-list">
                      {productos.slice(0, 50).map((prod) => (
                        <option key={prod.id} value={prod.nombre}>
                          SKU: {prod.codigo}
                        </option>
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">N° de Serie / Service Tag</label>
                    <input
                      type="text"
                      value={newOrderSerie}
                      onChange={(e) => setNewOrderSerie(e.target.value)}
                      placeholder="Ej: SN-9482019"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-medium uppercase"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Clave de Usuario / PIN de Windows</label>
                    <input
                      type="text"
                      value={newOrderPassword}
                      onChange={(e) => setNewOrderPassword(e.target.value)}
                      placeholder="Ej: 123456 o 'Sin clave'"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
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
                      {tecnicos.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nombreCompleto}
                        </option>
                      ))}
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
                      step="5"
                      value={newOrderAdelanto}
                      onChange={(e) => setNewOrderAdelanto(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-2 rounded-xl">
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
                onClick={() => setActiveDetailTab('comunicacion')}
                className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeDetailTab === 'comunicacion'
                    ? 'border-[#00346F] text-[#00346F] font-bold bg-white'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                <Phone className="w-4 h-4" />
                Contacto con Cliente ({selectedOrder.comunicaciones.length})
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
                      <div className="flex items-center gap-2 font-bold text-slate-800 border-b border-slate-100 pb-2">
                        <Edit3 className="w-4 h-4 text-[#00346F]" />
                        Subir Estado y Avance de Reparación
                      </div>

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
                            <option value="EN_DIAGNOSTICO">2. En Diagnóstico (Revisando hardware)</option>
                            <option value="PRESUPUESTADO">3. Presupuestado (Esperando autorización)</option>
                            <option value="APROBADO_EN_REPARACION">4. En Reparación (Trabajando en taller)</option>
                            <option value="ESPERA_REPUESTOS">5. Espera Repuestos (Falta stock)</option>
                            <option value="REPARADO_PROBADO">6. Reparado & Probado (Listo para entrega)</option>
                            <option value="LISTO_ENTREGA">7. Listo para Entrega (En recepción)</option>
                            <option value="ENTREGADO_COBRADO">8. Entregado al Cliente & Cobrado</option>
                            <option value="RECHAZADO_DEVUELTO">Rechazado / Sin Reparación</option>
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
                            className="px-4 py-2 bg-[#00346F] hover:bg-[#004A99] text-white rounded-lg font-bold flex items-center gap-1.5 shadow"
                          >
                            <SaveIcon className="w-3.5 h-3.5" />
                            Guardar Avance en Bitácora
                          </button>
                        </div>
                      </form>
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

                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={selectedProdId}
                        onChange={(e) => setSelectedProdId(Number(e.target.value))}
                        className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      >
                        {productos.filter((p) => p.estado === 'ACTIVO').map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.codigo}] {p.nombre} - S/ {p.precioUnitario.toFixed(2)} (Stock: {p.stock})
                          </option>
                        ))}
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
                          className="px-3 py-2 bg-[#00346F] hover:bg-[#004A99] text-white rounded-lg font-bold flex items-center gap-1 text-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Agregar Repuesto
                        </button>
                      </div>
                    </div>

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
                              <button
                                onClick={() => handleRemoveRepuesto(r.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
                        step="5"
                        value={newServicioPrecio}
                        onChange={(e) => setNewServicioPrecio(parseFloat(e.target.value) || 0)}
                        placeholder="Precio S/"
                        className="w-24 p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-right"
                      />
                      <button
                        type="button"
                        onClick={handleAddServicio}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1 text-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar Servicio
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                      {selectedOrder.serviciosManoObra.length === 0 ? (
                        <div className="p-3 text-slate-400 text-center">No se han registrado conceptos de mano de obra.</div>
                      ) : (
                        selectedOrder.serviciosManoObra.map((m) => (
                          <div key={m.id} className="p-2.5 flex justify-between items-center hover:bg-slate-50">
                            <span className="font-bold text-slate-800">{m.descripcion}</span>
                            <div className="flex items-center gap-3 font-mono">
                              <span className="font-bold text-slate-900">S/ {m.precio.toFixed(2)}</span>
                              <button
                                onClick={() => handleRemoveServicio(m.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div className="bg-[#EFF4FF] p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Resumen Económico de la Orden:</span>
                      <div className="text-base font-extrabold text-[#00346F] font-mono">
                        TOTAL: S/ {selectedOrder.costoTotal.toFixed(2)}
                        {selectedOrder.adelantoPagado > 0 && (
                          <span className="text-xs text-slate-600 font-normal ml-2">
                            (Adelanto: S/ {selectedOrder.adelantoPagado.toFixed(2)} | Pendiente: S/ {selectedOrder.saldoPendiente.toFixed(2)})
                          </span>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 3: CONTACTO CON CLIENTE */}
              {activeDetailTab === 'comunicacion' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-6 space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                      <span className="font-bold text-slate-800 block border-b border-slate-100 pb-2">
                        Registrar Interacción con el Cliente (Secretaría / Asesor)
                      </span>

                      <form onSubmit={handleAddComunicacion} className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block font-semibold text-slate-600 mb-1">Canal</label>
                            <select
                              value={comunicacionCanal}
                              onChange={(e) => setComunicacionCanal(e.target.value as any)}
                              className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                            >
                              <option value="LLAMADA">Llamada Telefónica</option>
                              <option value="PRESENCIAL">Presencial en Tienda</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-600 mb-1">Respuesta / Resultado</label>
                            <select
                              value={comunicacionResultado}
                              onChange={(e) => setComunicacionResultado(e.target.value as any)}
                              className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold"
                            >
                              <option value="APROBADO">✅ Aprobó Presupuesto</option>
                              <option value="RECHAZADO">❌ Rechazó / No Acepta</option>
                              <option value="PENDIENTE">⏳ Pendiente de Respuesta</option>
                              <option value="CONSULTA">ℹ️ Solo Consulta / Estado</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-600 mb-1">
                            Resumen de la Conversación
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={comunicacionResumen}
                            onChange={(e) => setComunicacionResumen(e.target.value)}
                            placeholder="Ej: Se comunicó al cliente el presupuesto de S/ 290.00 por cambio de SSD y limpieza. Cliente aceptó proceder."
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2 bg-[#00346F] hover:bg-[#004A99] text-white rounded-lg font-bold flex items-center justify-center gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Guardar Registro de Comunicación
                        </button>
                      </form>
                    </div>

                  </div>

                  <div className="lg:col-span-6 bg-white p-4 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-800 block mb-3 border-b border-slate-100 pb-2">
                      Historial de Comunicaciones
                    </span>
                    <div className="space-y-3 max-h-[380px] overflow-y-auto">
                      {selectedOrder.comunicaciones.length === 0 ? (
                        <div className="p-4 text-center text-slate-400">
                          Aún no se han registrado llamadas o mensajes para esta orden.
                        </div>
                      ) : (
                        selectedOrder.comunicaciones.map((c) => (
                          <div key={c.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                            <div className="flex justify-between items-center text-[10px] text-slate-400">
                              <span className="font-mono">{c.fecha}</span>
                              <span className="font-bold text-[#00346F]">{c.canal}</span>
                            </div>
                            <p className="text-slate-800 font-medium text-xs">{c.resumen}</p>
                            <div className="flex justify-between items-center pt-1 text-[10px]">
                              <span className="text-slate-500">Por: {c.atendidoPor}</span>
                              <span
                                className={`px-2 py-0.5 rounded font-bold ${
                                  c.resultado === 'APROBADO'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : c.resultado === 'RECHAZADO'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {c.resultado}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: TICKET IMPRESO */}
              {activeDetailTab === 'ticket' && (
                <div className="bg-white p-6 rounded-xl border border-slate-300 max-w-md mx-auto shadow space-y-4 font-mono text-[11px] text-slate-800">
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
                      <strong>DOC:</strong> {selectedOrder.clienteDocumento}
                    </div>
                    <div>
                      <strong>TEL:</strong> {selectedOrder.clienteTelefono}
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

                  <div className="space-y-1 border-b border-slate-300 pb-3">
                    <div className="flex justify-between">
                      <span>PRESUPUESTO TOTAL:</span>
                      <strong>S/ {selectedOrder.costoTotal.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>ADELANTO:</span>
                      <span>S/ {selectedOrder.adelantoPagado.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>SALDO PENDIENTE:</span>
                      <span>S/ {selectedOrder.saldoPendiente.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 text-center space-y-1">
                    <p>* Todo equipo no recogido en 30 días pasará a remate administrativo.</p>
                    <p>* Garantía de servicio: {selectedOrder.garantiaDias || 90} días calendario.</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => window.print()}
                      className="flex-1 py-2 bg-[#00346F] text-white rounded font-sans font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#004A99]"
                    >
                      <Printer className="w-4 h-4" />
                      Imprimir Ficha
                    </button>
                    {selectedOrder.clienteTelefono && (
                      <a
                        href={`https://wa.me/51${selectedOrder.clienteTelefono.replace(/\D/g, '')}?text=${encodeURIComponent(
                          `Estimado(a) ${selectedOrder.clienteNombre}, le saludamos de MG Solutions. Le informamos sobre su equipo ${selectedOrder.tipoEquipo} ${selectedOrder.marca} ${selectedOrder.modelo} (Ticket: ${selectedOrder.codigo}). Estado actual: ${selectedOrder.estado}. Saldo a liquidar: S/ ${selectedOrder.saldoPendiente.toFixed(2)}. Puede consultar el avance aquí o acercarse a nuestra sede.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 bg-[#25D366] text-white rounded font-sans font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#1EBE5D] transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Avisar por WhatsApp
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
                    value={quickClientForm.numeroDocumento}
                    onChange={(e) =>
                      setQuickClientForm({ ...quickClientForm, numeroDocumento: e.target.value })
                    }
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
                  onChange={(e) =>
                    setQuickClientForm({ ...quickClientForm, razonSocial: e.target.value })
                  }
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
                    value={quickClientForm.telefono}
                    onChange={(e) =>
                      setQuickClientForm({ ...quickClientForm, telefono: e.target.value })
                    }
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
    </div>
  );
};

function SaveIcon(props: any) {
  return <CheckCircle2 {...props} />;
}
