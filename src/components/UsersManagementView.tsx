import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  KeyRound,
  ShieldAlert,
  Save,
  X,
  LayoutGrid,
  CheckSquare,
  Square,
  Lock,
  Sparkles,
  Layers,
  Wrench,
  Receipt,
  Users,
  Package,
  Plus,
  DollarSign,
  Truck,
  ClipboardList,
  Laptop,
  Building2,
  Network,
  ArrowLeftRight,
  Shield,
  Loader2,
  AlertCircle,
  Tag,
  Check,
  RefreshCw,
  User,
  Store,
  Mail,
  Copy,
} from 'lucide-react';
import { Usuario, UserRole, EstadoRegistro, MODULOS_DISPONIBLES, Rol, Sucursal } from '../types';
import { userService, CreateRoleData } from '../services/user.service';
import { companyService } from '../services/company.service';
import { consultaService } from '../services/consulta.service';

interface UsersManagementViewProps {
  usuarios: Usuario[];
  onSaveUsuario: (u: Usuario) => void;
  onToggleUsuarioEstado: (id: number) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

const DEFAULT_ROLE_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  SUPERADMIN: { label: 'Super Administrador', bg: 'bg-purple-100', text: 'text-purple-800' },
  ADMIN: { label: 'Administrador General', bg: 'bg-indigo-100', text: 'text-indigo-800' },
  SECRETARIA: { label: 'Secretaría / Recepción', bg: 'bg-pink-100', text: 'text-pink-800' },
  TECNICO: { label: 'Técnico de Taller', bg: 'bg-emerald-100', text: 'text-emerald-800' },
  FACTURADOR: { label: 'Ventas', bg: 'bg-blue-100', text: 'text-[#00346F]' },
  ALMACEN: { label: 'Jefe de Almacén', bg: 'bg-amber-100', text: 'text-amber-800' },
  CAJERO: { label: 'Cajero / Tesorería', bg: 'bg-slate-100', text: 'text-slate-800' },
};

const getRoleBadge = (rolCodigo: string, rolNombre?: string) => {
  if (DEFAULT_ROLE_LABELS[rolCodigo]) {
    return DEFAULT_ROLE_LABELS[rolCodigo];
  }
  return {
    label: rolNombre || rolCodigo,
    bg: 'bg-teal-100',
    text: 'text-teal-800',
  };
};

const ICON_MAP: Record<string, React.ReactNode> = {
  Receipt: <Receipt className="w-4 h-4" />,
  DollarSign: <DollarSign className="w-4 h-4" />,
  Truck: <Truck className="w-4 h-4" />,
  ClipboardList: <ClipboardList className="w-4 h-4" />,
  Package: <Package className="w-4 h-4" />,
  Wrench: <Wrench className="w-4 h-4" />,
  Laptop: <Laptop className="w-4 h-4" />,
  Users: <Users className="w-4 h-4" />,
  Layers: <Layers className="w-4 h-4" />,
  Tag: <Tag className="w-4 h-4" />,
  ShieldCheck: <ShieldCheck className="w-4 h-4" />,
  Building2: <Building2 className="w-4 h-4" />,
  Network: <Network className="w-4 h-4" />,
  ArrowLeftRight: <ArrowLeftRight className="w-4 h-4" />,
};

export const UsersManagementView: React.FC<UsersManagementViewProps> = ({
  usuarios: initialUsuarios,
  onSaveUsuario,
  onToggleUsuarioEstado,
  onShowToast,
}) => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'usuarios' | 'roles'>('usuarios');

  // Users State
  const [usuariosList, setUsuariosList] = useState<Usuario[]>(initialUsuarios);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [userModalLoading, setUserModalLoading] = useState(false);

  // Roles State
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Rol | null>(null);
  const [roleModalLoading, setRoleModalLoading] = useState(false);

  // Sucursales State
  const [sucursalesList, setSucursalesList] = useState<Sucursal[]>([]);
  const [loadingSucursales, setLoadingSucursales] = useState(false);

  // Modal de Restablecer Contraseña (Llave)
  const [resetModalUser, setResetModalUser] = useState<Usuario | null>(null);
  const [resetMode, setResetMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [manualPassword, setManualPassword] = useState('');
  const [resettingLoading, setResettingLoading] = useState(false);
  const [resetSuccessData, setResetSuccessData] = useState<{
    passwordTemporal: string;
    emailEnviado: boolean;
  } | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // User Form
  const [userForm, setUserForm] = useState<{
    username: string;
    password?: string;
    nombreCompleto: string;
    email: string;
    telefono: string;
    tipoDocumento: string;
    numeroDocumento: string;
    rol: string;
    sucursalId?: number | null;
    estado: EstadoRegistro;
    modulosPermitidos: string[];
  }>({
    username: '',
    password: '',
    nombreCompleto: '',
    email: '',
    telefono: '',
    tipoDocumento: 'DNI',
    numeroDocumento: '',
    rol: 'SECRETARIA',
    sucursalId: null,
    estado: 'ACTIVO',
    modulosPermitidos: ['panel-recepcion', 'taller', 'equipos', 'ventas', 'clientes'],
  });

  // Consulta RENIEC / SUNAT State
  const [isQueryingDoc, setIsQueryingDoc] = useState(false);
  const [consultaUserBadge, setConsultaUserBadge] = useState<string | null>(null);
  const [isDocVerified, setIsDocVerified] = useState(false);

  // Role Form
  const [roleForm, setRoleForm] = useState<CreateRoleData>({
    codigo: '',
    nombre: '',
    descripcion: '',
    modulosPredeterminados: [],
  });

  // Load Roles from backend
  const loadRoles = useCallback(async () => {
    setLoadingRoles(true);
    try {
      const res = await userService.getRoles();
      if (res.success && res.roles) {
        setRoles(res.roles);
      }
    } catch (err) {
      console.error('Error cargando roles:', err);
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  // Load Sucursales from backend
  const loadSucursales = useCallback(async () => {
    setLoadingSucursales(true);
    try {
      const res = await companyService.getSucursales();
      if (res.success && res.sucursales) {
        setSucursalesList(res.sucursales);
      }
    } catch (err) {
      console.error('Error cargando sucursales:', err);
    } finally {
      setLoadingSucursales(false);
    }
  }, []);

  // Load Users from backend
  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await userService.getUsers();
      if (res.success && res.usuarios) {
        setUsuariosList(res.usuarios);
      }
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
    loadUsers();
    loadSucursales();
  }, [loadRoles, loadUsers, loadSucursales]);

  // Sync with prop when changed
  useEffect(() => {
    if (initialUsuarios && initialUsuarios.length > 0) {
      setUsuariosList(prev => {
        // preserve backend fresh list if already loaded
        return prev.length >= initialUsuarios.length ? prev : initialUsuarios;
      });
    }
  }, [initialUsuarios]);

  // Filtered Users
  const filteredUsers = usuariosList.filter((u) => {
    const matchSearch =
      !search ||
      u.nombreCompleto.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.rol === roleFilter;
    return matchSearch && matchRole;
  });

  // Generador de Username automático tipo MG-023456 (6 dígitos aleatorios)
  const generarUsernameMG = (): string => {
    const randomDigits = Math.floor(100000 + Math.random() * 900000).toString();
    return `MG-${randomDigits}`;
  };

  const handleRegenerarUsername = () => {
    if (!editingUser) {
      setUserForm(prev => ({ ...prev, username: generarUsernameMG() }));
    }
  };

  // Open New User Modal
  const handleOpenNewUser = () => {
    setEditingUser(null);
    const defaultRol = roles.find(r => r.codigo === 'SECRETARIA') || roles[0];
    const defaultSucursal = sucursalesList.find(s => s.esPrincipal) || sucursalesList[0];
    const usernameAuto = generarUsernameMG();
    setUserForm({
      username: usernameAuto,
      password: '',
      nombreCompleto: '',
      email: '',
      telefono: '',
      tipoDocumento: 'DNI',
      numeroDocumento: '',
      rol: defaultRol ? defaultRol.codigo : 'SECRETARIA',
      sucursalId: defaultSucursal ? defaultSucursal.id : null,
      estado: 'ACTIVO',
      modulosPermitidos: defaultRol?.modulosPredeterminados || ['ventas'],
    });
    setIsUserModalOpen(true);
    setConsultaUserBadge(null);
    setIsDocVerified(false);
  };

  // Open Edit User Modal
  const handleOpenEditUser = (u: Usuario) => {
    setEditingUser(u);
    const userRole = roles.find(r => r.codigo === u.rol);
    setUserForm({
      username: u.username,
      password: '',
      nombreCompleto: u.nombreCompleto,
      email: u.email,
      telefono: u.telefono || '',
      tipoDocumento: (u as any).tipoDocumento || 'DNI',
      numeroDocumento: (u as any).numeroDocumento || '',
      rol: u.rol,
      sucursalId: u.sucursalId !== undefined ? u.sucursalId : null,
      estado: u.estado,
      modulosPermitidos: u.modulosPermitidos || userRole?.modulosPredeterminados || ['ventas'],
    });
    setConsultaUserBadge(null);
    setIsDocVerified(false);
    setIsUserModalOpen(true);
  };

  // Consultar documento ante RENIEC (DNI) / SUNAT (RUC)
  const handleQueryDocument = async () => {
    const doc = (userForm.numeroDocumento || '').trim();
    const tipo = userForm.tipoDocumento;

    if (!doc) {
      onShowToast('Documento requerido', 'Ingrese el número de documento para consultar.', 'warning');
      return;
    }

    if (tipo === 'DNI' && doc.length !== 8) {
      onShowToast('DNI inválido', 'El DNI debe contener exactamente 8 dígitos numéricos.', 'warning');
      return;
    }

    if (tipo === 'RUC' && doc.length !== 11) {
      onShowToast('RUC inválido', 'El RUC debe contener exactamente 11 dígitos numéricos.', 'warning');
      return;
    }

    setIsQueryingDoc(true);
    setConsultaUserBadge(null);
    setIsDocVerified(false);

    try {
      if (tipo === 'DNI') {
        const res = await consultaService.consultarDni(doc);
        if (res.success && res.data) {
          setUserForm(prev => ({
            ...prev,
            nombreCompleto: res.data!.nombreCompleto,
          }));
          setIsDocVerified(true);
          setConsultaUserBadge('RENIEC: Identidad Verificada');
          onShowToast('RENIEC: Identidad Verificada', res.data.nombreCompleto, 'success');
        } else {
          setIsDocVerified(false);
          onShowToast('No encontrado', res.message || 'No se encontró el DNI en RENIEC.', 'warning');
        }
      } else if (tipo === 'RUC') {
        const res = await consultaService.consultarRuc(doc);
        if (res.success && res.data) {
          setUserForm(prev => ({
            ...prev,
            nombreCompleto: res.data!.razonSocial,
          }));
          setIsDocVerified(true);
          setConsultaUserBadge(`SUNAT: ${res.data.estado} - ${res.data.condicion}`);
          onShowToast('SUNAT: RUC Consultado', res.data.razonSocial, 'success');
        } else {
          setIsDocVerified(false);
          onShowToast('No encontrado', res.message || 'No se encontró el RUC en SUNAT.', 'warning');
        }
      }
    } catch (err: any) {
      setIsDocVerified(false);
      console.error('Error al consultar documento de usuario:', err);
      onShowToast('Error', 'Fallo de conexión al consultar el documento.', 'error');
    } finally {
      setIsQueryingDoc(false);
    }
  };

  // Handle Role Change in User Form
  const handleUserRoleChange = (newRoleCode: string) => {
    const foundRole = roles.find(r => r.codigo === newRoleCode);
    const defaultPanels = foundRole?.modulosPredeterminados || ['ventas'];
    setUserForm(prev => ({
      ...prev,
      rol: newRoleCode,
      modulosPermitidos: defaultPanels,
    }));
  };

  // Toggle Panel in User Form
  const togglePanelPermission = (moduloId: string) => {
    setUserForm(prev => {
      const currentList = prev.modulosPermitidos || [];
      const updated = currentList.includes(moduloId)
        ? currentList.filter(id => id !== moduloId)
        : [...currentList, moduloId];
      return { ...prev, modulosPermitidos: updated };
    });
  };

  // Submit User
  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.nombreCompleto.trim() || !userForm.email.trim()) {
      onShowToast('Campos incompletos', 'Por favor complete el nombre completo y el correo electrónico.', 'warning');
      return;
    }

    if (userForm.tipoDocumento === 'DNI' && userForm.numeroDocumento && userForm.numeroDocumento.trim().length !== 8) {
      onShowToast('DNI incompleto', 'El DNI debe contener exactamente 8 dígitos.', 'warning');
      return;
    }
    if (userForm.tipoDocumento === 'RUC' && userForm.numeroDocumento && userForm.numeroDocumento.trim().length !== 11) {
      onShowToast('RUC incompleto', 'El RUC debe contener exactamente 11 dígitos.', 'warning');
      return;
    }

    setUserModalLoading(true);

    try {
      const selectedRoleObj = roles.find(r => r.codigo === userForm.rol);

      if (editingUser) {
        // Update user
        const res = await userService.updateUser(editingUser.id, {
          nombreCompleto: userForm.nombreCompleto.trim(),
          email: userForm.email.trim(),
          telefono: userForm.telefono?.trim(),
          tipoDocumento: userForm.tipoDocumento,
          numeroDocumento: userForm.numeroDocumento?.trim(),
          rolId: selectedRoleObj?.id,
          rol: userForm.rol,
          sucursalId: userForm.sucursalId,
        });

        if (res.success) {
          const updatedSucursal = sucursalesList.find(s => s.id === userForm.sucursalId);
          const updatedUser: Usuario = {
            ...editingUser,
            nombreCompleto: userForm.nombreCompleto.trim(),
            email: userForm.email.trim(),
            telefono: userForm.telefono || '',
            rol: userForm.rol as any,
            sucursalId: userForm.sucursalId,
            sucursalNombre: updatedSucursal ? updatedSucursal.nombre : null,
            estado: userForm.estado,
            modulosPermitidos: userForm.modulosPermitidos,
          };
          setUsuariosList(prev => prev.map(u => u.id === editingUser.id ? updatedUser : u));
          onSaveUsuario(updatedUser);
          setIsUserModalOpen(false);
          onShowToast('Usuario actualizado', `Datos de @${userForm.username} actualizados.`, 'success');
        } else {
          onShowToast('Error', res.message || 'Error actualizando usuario.', 'error');
        }
      } else {
        // Create user
        const res = await userService.createUser({
          username: userForm.username.trim() ? userForm.username.trim().toUpperCase() : undefined,
          password: userForm.password ? userForm.password.trim() : undefined,
          nombreCompleto: userForm.nombreCompleto.trim(),
          email: userForm.email.trim(),
          telefono: userForm.telefono?.trim(),
          tipoDocumento: userForm.tipoDocumento,
          numeroDocumento: userForm.numeroDocumento?.trim(),
          rolId: selectedRoleObj?.id,
          rol: userForm.rol,
          sucursalId: userForm.sucursalId,
        });

        if (res.success) {
          await loadUsers();
          if (res.usuario) {
            onSaveUsuario(res.usuario as any);
          }
          setIsUserModalOpen(false);
          onShowToast(
            '¡Usuario Creado Exitosamente!',
            `Hemos enviado las credenciales correctamente al correo del usuario (${userForm.email.trim()}).`,
            'success'
          );
        } else {
          onShowToast('Error', res.message || 'Error creando usuario.', 'error');
        }
      }
    } catch (err: any) {
      onShowToast('Error de conexión', err?.message || 'No se pudo conectar con el servidor.', 'error');
    } finally {
      setUserModalLoading(false);
    }
  };

  // Toggle user active status
  const handleToggleStatus = async (user: Usuario) => {
    try {
      const res = await userService.toggleStatus(user.id);
      if (res.success) {
        const nuevoEstado = user.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
        setUsuariosList(prev => prev.map(u => u.id === user.id ? { ...u, estado: nuevoEstado } : u));
        onToggleUsuarioEstado(user.id);
        onShowToast(
          'Estado modificado',
          `Usuario '${user.username}' ahora está ${nuevoEstado}.`,
          'info'
        );
      } else {
        onShowToast('Error', res.message || 'Error cambiando estado.', 'error');
      }
    } catch {
      onShowToast('Error', 'No se pudo conectar con el servidor.', 'error');
    }
  };

  // Reset password
  const handleResetPassword = async (user: Usuario) => {
    if (!confirm(`¿Restablecer la contraseña del usuario @${user.username}? Se generará una contraseña temporal.`)) return;
    try {
      const res = await userService.resetPassword(user.id);
      if (res.success) {
        const tempPass = res.passwordTemporal || 'MG-Temp#2026';
        onShowToast(
          'Contraseña Restablecida',
          `Clave temporal para @${user.username}: ${tempPass}`,
          'success'
        );
        window.prompt(
          `Nueva contraseña temporal generada para @${user.username}.\nPuede copiarla ahora para entregársela al usuario:`,
          tempPass
        );
      } else {
        onShowToast('Error', res.message || 'Error restableciendo contraseña.', 'error');
      }
    } catch {
      onShowToast('Error', 'No se pudo conectar con el servidor.', 'error');
    }
  };

  // Unlock user
  const handleUnlockUser = async (user: Usuario) => {
    try {
      const res = await userService.unlockUser(user.id);
      if (res.success) {
        onShowToast('Cuenta Desbloqueada', `Usuario @${user.username} desbloqueado.`, 'success');
        loadUsers();
      } else {
        onShowToast('Error', res.message || 'Error desbloqueando cuenta.', 'error');
      }
    } catch {
      onShowToast('Error', 'No se pudo conectar con el servidor.', 'error');
    }
  };

  // ─── ROLES HANDLERS ───
  const handleOpenNewRole = () => {
    setEditingRole(null);
    setRoleForm({
      codigo: '',
      nombre: '',
      descripcion: '',
      modulosPredeterminados: ['ventas', 'clientes'],
    });
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = (role: Rol) => {
    setEditingRole(role);
    setRoleForm({
      codigo: role.codigo,
      nombre: role.nombre,
      descripcion: role.descripcion || '',
      modulosPredeterminados: role.modulosPredeterminados || [],
    });
    setIsRoleModalOpen(true);
  };

  const handleRoleNameChange = (val: string) => {
    const autoCode = val
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z0-9\s]/g, '')
      .replace(/\s+/g, '_');

    setRoleForm(prev => ({
      ...prev,
      nombre: val,
      // only auto-update code if creating and hasn't manually customized
      codigo: !editingRole ? autoCode : prev.codigo,
    }));
  };

  const toggleRoleModule = (modId: string) => {
    setRoleForm(prev => {
      const current = prev.modulosPredeterminados || [];
      const updated = current.includes(modId)
        ? current.filter(id => id !== modId)
        : [...current, modId];
      return { ...prev, modulosPredeterminados: updated };
    });
  };

  const handleSelectAllRoleModules = (selectAll: boolean) => {
    setRoleForm(prev => ({
      ...prev,
      modulosPredeterminados: selectAll ? MODULOS_DISPONIBLES.map(m => m.id) : [],
    }));
  };

  const handleSubmitRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.nombre.trim() || !roleForm.codigo.trim()) {
      onShowToast('Campos requeridos', 'El nombre y código del rol son obligatorios.', 'warning');
      return;
    }

    setRoleModalLoading(true);
    try {
      if (editingRole) {
        const res = await userService.updateRole(editingRole.id, {
          nombre: roleForm.nombre.trim(),
          descripcion: roleForm.descripcion?.trim(),
          modulosPredeterminados: roleForm.modulosPredeterminados,
        });
        if (res.success) {
          onShowToast('Rol Actualizado', `El rol '${roleForm.nombre}' fue actualizado con éxito.`, 'success');
          setIsRoleModalOpen(false);
          await loadRoles();
        } else {
          onShowToast('Error', res.message || 'Error actualizando rol.', 'error');
        }
      } else {
        const res = await userService.createRole({
          codigo: roleForm.codigo.trim().toUpperCase().replace(/\s+/g, '_'),
          nombre: roleForm.nombre.trim(),
          descripcion: roleForm.descripcion?.trim(),
          modulosPredeterminados: roleForm.modulosPredeterminados,
        });
        if (res.success) {
          onShowToast('Rol Creado', `El rol '${roleForm.nombre}' fue creado con éxito.`, 'success');
          setIsRoleModalOpen(false);
          await loadRoles();
        } else {
          onShowToast('Error', res.message || 'Error creando rol.', 'error');
        }
      }
    } catch (err: any) {
      onShowToast('Error de conexión', err?.message || 'Error al comunicarse con el servidor.', 'error');
    } finally {
      setRoleModalLoading(false);
    }
  };

  const handleDeleteRole = async (role: Rol) => {
    if (role.esSistema) {
      onShowToast('Protegido', 'Los roles base del sistema no pueden ser eliminados.', 'warning');
      return;
    }
    if (!confirm(`¿Está seguro de eliminar el rol '${role.nombre}'? Esta acción no se puede deshacer.`)) return;

    try {
      const res = await userService.deleteRole(role.id);
      if (res.success) {
        onShowToast('Rol Eliminado', `Rol '${role.nombre}' eliminado.`, 'success');
        await loadRoles();
      } else {
        onShowToast('No se puede eliminar', res.message || 'Error al eliminar rol.', 'error');
      }
    } catch {
      onShowToast('Error', 'No se pudo conectar con el servidor.', 'error');
    }
  };

  // Group modules by category
  const categorizedModules = MODULOS_DISPONIBLES.reduce((acc, mod) => {
    if (!acc[mod.categoria]) acc[mod.categoria] = [];
    acc[mod.categoria].push(mod);
    return acc;
  }, {} as Record<string, typeof MODULOS_DISPONIBLES>);

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto bg-[#F8F9FF] min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#00346F] text-white">
              Seguridad & Accesos RBAC
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              {roles.length} Roles Activos
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0B1C30] tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#00346F]" />
            Control de Usuarios & Roles de Sistema
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Cree roles personalizados (Cajero, Técnico Nivel 2, etc.), defina sus módulos permitidos y gestione las cuentas del personal.
          </p>
        </div>

        {/* Action Button depending on Tab */}
        <div className="flex items-center gap-2">
          {activeTab === 'usuarios' ? (
            <button
              onClick={handleOpenNewUser}
              className="bg-[#00346F] hover:bg-[#004A99] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4" />
              Nuevo Usuario
            </button>
          ) : (
            <button
              onClick={handleOpenNewRole}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Crear Nuevo Rol
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex gap-2 p-1 bg-slate-200/70 rounded-xl max-w-md mb-6">
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'usuarios'
              ? 'bg-white text-[#00346F] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Usuarios ({filteredUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'roles'
              ? 'bg-white text-[#00346F] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          Roles & Permisos ({roles.length})
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: GESTIÓN DE USUARIOS                                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'usuarios' && (
        <>
          {/* Filter and Search Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-end mb-6">
            <div className="flex-1 w-full">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Buscar Usuario por Nombre, Username o Correo
              </label>
              <div className="relative border border-slate-300 rounded-lg flex items-center px-3 bg-white focus-within:border-[#00346F]">
                <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre, @usuario o correo..."
                  className="w-full py-2 bg-transparent border-none focus:outline-none text-xs text-slate-800"
                />
              </div>
            </div>

            <div className="w-full md:w-60">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Filtrar por Rol
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#00346F]"
              >
                <option value="ALL">Todos los roles</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.codigo}>
                    {r.nombre} ({r.codigo})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-[#EFF4FF] border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-[#00346F]">
                Usuarios Registrados en el Sistema ({filteredUsers.length})
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Conectado con Base de Datos MySQL
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#EFF4FF] border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                    <th className="py-3 px-4">Usuario</th>
                    <th className="py-3 px-4">Nombre Completo</th>
                    <th className="py-3 px-4">Rol Asignado</th>
                    <th className="py-3 px-4">Sucursal</th>
                    <th className="py-3 px-4">Módulos Visibles</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4">Último Acceso</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#00346F]" />
                        Cargando usuarios...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No se encontraron usuarios con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u, idx) => {
                      const roleBadge = getRoleBadge(u.rol, (u as any).rolNombre);
                      const allowedCount = u.modulosPermitidos?.length || 0;
                      return (
                        <tr key={u.id} className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}>
                          <td className="py-3.5 px-4 font-mono font-bold text-[#00346F]">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-[#00346F] text-white flex items-center justify-center font-bold text-[11px] shadow-xs">
                                {u.avatar || u.username.slice(0, 2).toUpperCase()}
                              </div>
                              <span>@{u.username}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            <div>{u.nombreCompleto}</div>
                            <div className="text-[11px] text-slate-500 font-normal">{u.email}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${roleBadge.bg} ${roleBadge.text}`}>
                              {roleBadge.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {u.sucursalNombre ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                                <Store className="w-3.5 h-3.5 text-[#00346F] shrink-0" />
                                <span>{u.sucursalNombre}</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px] flex items-center gap-1">
                                <Store className="w-3 h-3 text-slate-300" />
                                <span>Sin sucursal</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                {allowedCount} / {MODULOS_DISPONIBLES.length}
                              </span>
                              {u.modulosPermitidos?.slice(0, 2).map((modId) => {
                                const m = MODULOS_DISPONIBLES.find((d) => d.id === modId);
                                return (
                                  <span key={modId} className="px-1.5 py-0.5 rounded text-[9px] bg-blue-50 text-blue-700 font-medium border border-blue-100">
                                    {m?.nombre.split('&')[0] || modId}
                                  </span>
                                );
                              })}
                              {allowedCount > 2 && (
                                <span className="text-[9px] text-slate-400 font-medium">+{allowedCount - 2} más</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-transform hover:scale-105 ${
                                u.estado === 'ACTIVO'
                                  ? 'bg-[#DCFCE7] text-[#166534]'
                                  : 'bg-[#FEE2E2] text-[#991B1B]'
                              }`}
                              title="Haga clic para alternar Estado"
                            >
                              {u.estado === 'ACTIVO' ? (
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
                          <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                            {u.ultimoAcceso || 'Nunca'}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleResetPassword(u)}
                                className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-amber-600 rounded-lg transition-colors"
                                title="Restablecer Contraseña"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEditUser(u)}
                                className="px-2.5 py-1.5 bg-[#EFF4FF] hover:bg-[#00346F] hover:text-white text-[#00346F] rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                                title="Editar Usuario y Permisos"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                Editar
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
        </>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: GESTIÓN DE ROLES & PERMISOS                            */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          {/* Roles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {roles.map((r) => {
              const badge = getRoleBadge(r.codigo, r.nombre);
              const assignedModules = r.modulosPredeterminados || [];
              const usersCount = usuariosList.filter(u => u.rol === r.codigo).length;

              return (
                <div
                  key={r.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    {/* Header Card */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badge.bg} ${badge.text}`}>
                            {r.codigo}
                          </span>
                          {r.esSistema ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              Sistema
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Personalizado
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-1">{r.nombre}</h3>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] font-bold text-slate-500 block">
                          {usersCount} {usersCount === 1 ? 'usuario' : 'usuarios'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                      {r.descripcion || 'Sin descripción detallada.'}
                    </p>

                    {/* Permissions Preview */}
                    <div className="space-y-1.5 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-600">Módulos permitidos:</span>
                        <span className="font-mono font-bold text-[#00346F]">
                          {assignedModules.length} / {MODULOS_DISPONIBLES.length}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pt-1">
                        {assignedModules.map((mCode) => {
                          const mInfo = MODULOS_DISPONIBLES.find(d => d.id === mCode);
                          return (
                            <span
                              key={mCode}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              {mInfo?.nombre.split('&')[0] || mCode}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenEditRole(r)}
                      className="px-3 py-1.5 bg-[#EFF4FF] hover:bg-[#00346F] hover:text-white text-[#00346F] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Editar Permisos
                    </button>

                    {!r.esSistema && (
                      <button
                        onClick={() => handleDeleteRole(r)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar Rol"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL: CREAR / EDITAR USUARIO                                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-[#00346F] text-white">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold">
                  {editingUser ? `Editar Usuario: @${editingUser.username}` : 'Registrar Nuevo Usuario'}
                </h3>
              </div>
              <button onClick={() => setIsUserModalOpen(false)} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitUser} className="p-6 overflow-y-auto flex-1 space-y-5 text-xs bg-[#F8F9FF]">
              {/* Bloque 1: Datos Personales y de Contacto (Primero) */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 block border-b border-slate-100 pb-1 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#00346F]" />
                  Datos Personales y de Contacto
                </span>

                {/* 1. Documento de Identidad y Contacto (En Primer Lugar) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Tipo Doc.</label>
                    <select
                      value={userForm.tipoDocumento}
                      onChange={(e) => {
                        setUserForm({ ...userForm, tipoDocumento: e.target.value, numeroDocumento: '' });
                        setConsultaUserBadge(null);
                        setIsDocVerified(false);
                      }}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00346F]"
                    >
                      <option value="DNI">DNI (8)</option>
                      <option value="CE">C. Extranjería</option>
                      <option value="RUC">RUC</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-600">N° Documento *</label>
                      {(userForm.tipoDocumento === 'DNI' || userForm.tipoDocumento === 'RUC') && (
                        <span className="text-[10px] text-blue-700 font-semibold flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5 text-amber-500" /> {userForm.tipoDocumento === 'DNI' ? 'RENIEC' : 'SUNAT'}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        inputMode={userForm.tipoDocumento === 'CE' ? 'text' : 'numeric'}
                        maxLength={userForm.tipoDocumento === 'RUC' ? 11 : (userForm.tipoDocumento === 'DNI' ? 8 : 12)}
                        value={userForm.numeroDocumento}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (userForm.tipoDocumento === 'DNI') {
                            val = val.replace(/\D/g, '').slice(0, 8);
                          } else if (userForm.tipoDocumento === 'RUC') {
                            val = val.replace(/\D/g, '').slice(0, 11);
                          } else {
                            val = val.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12).toUpperCase();
                          }
                          setUserForm({ ...userForm, numeroDocumento: val });
                          if (isDocVerified) {
                            setIsDocVerified(false);
                            setConsultaUserBadge(null);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (userForm.tipoDocumento === 'DNI' || userForm.tipoDocumento === 'RUC')) {
                            e.preventDefault();
                            handleQueryDocument();
                          }
                        }}
                        className={`w-full p-2 bg-white border rounded-lg font-mono focus:outline-none focus:border-[#00346F] ${isDocVerified ? 'border-emerald-500 ring-1 ring-emerald-200' : 'border-slate-300'}`}
                        placeholder={userForm.tipoDocumento === 'RUC' ? '20481928371' : (userForm.tipoDocumento === 'DNI' ? '72345678' : '001234567')}
                      />
                      {(userForm.tipoDocumento === 'DNI' || userForm.tipoDocumento === 'RUC') && (
                        <button
                          type="button"
                          onClick={handleQueryDocument}
                          disabled={isQueryingDoc || !userForm.numeroDocumento}
                          title={`Buscar en ${userForm.tipoDocumento === 'DNI' ? 'RENIEC' : 'SUNAT'}`}
                          className="px-2.5 py-2 bg-[#00346F] hover:bg-[#004A99] disabled:bg-slate-300 text-white rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer text-xs whitespace-nowrap shadow-xs"
                        >
                          {isQueryingDoc ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Search className="w-3.5 h-3.5" />
                          )}
                          <span>{isQueryingDoc ? '...' : (userForm.tipoDocumento === 'DNI' ? 'RENIEC' : 'SUNAT')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Teléfono</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={9}
                      value={userForm.telefono}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                        setUserForm({ ...userForm, telefono: val });
                      }}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00346F]"
                      placeholder="987654321"
                    />
                  </div>
                </div>

                {/* 2. Nombres (obtenidos de RENIEC) y Correo Electrónico */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-600 flex items-center gap-1">
                        Nombre Completo *
                        {isDocVerified && (
                          <Lock className="w-3.5 h-3.5 text-emerald-600" title="Bloqueado por verificación oficial en RENIEC" />
                        )}
                      </label>
                      {consultaUserBadge ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-[10px] text-emerald-800 flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                            {consultaUserBadge}
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsDocVerified(false)}
                            title="Desbloquear para editar nombre manualmente"
                            className="text-[10px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
                          >
                            Modificar
                          </button>
                        </div>
                      ) : (
                        userForm.tipoDocumento === 'DNI' && (
                          <span className="text-[10px] text-slate-400">
                            Digitar DNI y pulsar RENIEC
                          </span>
                        )
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        readOnly={isDocVerified}
                        value={userForm.nombreCompleto}
                        onChange={(e) => {
                          if (isDocVerified) return;
                          const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑäëïöüÄËÏÖÜ\s]/g, '');
                          setUserForm({ ...userForm, nombreCompleto: val });
                        }}
                        className={`w-full p-2 rounded-lg transition-colors focus:outline-none ${
                          isDocVerified
                            ? 'bg-slate-100 text-slate-700 font-semibold border border-emerald-400 cursor-not-allowed select-none pr-8'
                            : 'bg-white border border-slate-300 focus:border-[#00346F]'
                        }`}
                        placeholder={userForm.tipoDocumento === 'DNI' ? 'Se autocompletará con RENIEC...' : 'Kevin Quispe Rojas'}
                      />
                      {isDocVerified && (
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none" title="Nombre validado ante RENIEC">
                          <Lock className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      required
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00346F]"
                      placeholder="usuario@mgsolutions.pe"
                    />
                  </div>
                </div>
              </div>

              {/* Bloque 2: Asignación Laboral y Permisos */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 block border-b border-slate-100 pb-1 flex items-center gap-2">
                  <Store className="w-4 h-4 text-[#00346F]" />
                  Asignación Laboral y Permisos
                </span>

                {/* Identificador visible solo al editar */}
                {editingUser && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600">
                    <span>Código de Usuario:</span>
                    <span className="font-mono font-bold text-[#00346F]">@{userForm.username}</span>
                  </div>
                )}

                {/* Rol Funcional, Sucursal de Trabajo y Estado */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Rol Funcional *
                    </label>
                    <select
                      value={userForm.rol}
                      onChange={(e) => handleUserRoleChange(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 focus:outline-none focus:border-[#00346F]"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.codigo}>
                          {r.nombre} ({r.codigo})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-[#00346F]" />
                      <span>Sucursal de Trabajo *</span>
                    </label>
                    <select
                      value={userForm.sucursalId ?? ''}
                      onChange={(e) => setUserForm({ ...userForm, sucursalId: e.target.value ? Number(e.target.value) : null })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 focus:outline-none focus:border-[#00346F]"
                      required
                    >
                      <option value="" disabled>Seleccione una sucursal...</option>
                      {sucursalesList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.codigo} - {s.nombre} {s.esPrincipal ? '(Matriz / Principal)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Estado
                    </label>
                    <select
                      value={userForm.estado}
                      onChange={(e) => setUserForm({ ...userForm, estado: e.target.value as EstadoRegistro })}
                      className={`w-full p-2 border rounded-lg font-bold ${
                        userForm.estado === 'ACTIVO'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-red-50 text-red-800 border-red-300'
                      }`}
                    >
                      <option value="ACTIVO">ACTIVO</option>
                      <option value="INACTIVO">INACTIVO</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Module Permissions (Solo Lectura - Heredados del Rol) */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-2">
                  <div>
                    <span className="font-bold text-slate-800 block flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#00346F]" />
                      Permisos Heredados del Rol ({userForm.rol})
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Asignados automáticamente por el Rol Funcional. Para editar o dar más permisos a este rol, diríjase a la pestaña <strong>Roles de Sistema</strong>.
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 flex items-center gap-1.5 shrink-0 border border-slate-200">
                    <Lock className="w-3 h-3 text-slate-500" />
                    <span>{userForm.modulosPermitidos.length} módulos habilitados</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
                  {MODULOS_DISPONIBLES.map((m) => {
                    const isAllowed = userForm.modulosPermitidos.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        className={`p-2.5 rounded-lg border flex items-start gap-2.5 select-none transition-all ${
                          isAllowed
                            ? 'bg-[#EFF4FF]/70 border-blue-200 shadow-xs'
                            : 'bg-slate-50/60 border-slate-200/80 opacity-40'
                        }`}
                      >
                        <div className={`mt-0.5 ${isAllowed ? 'text-[#00346F]' : 'text-slate-400'}`}>
                          {isAllowed ? (
                            <CheckSquare className="w-4 h-4 text-[#00346F]" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-xs truncate ${isAllowed ? 'text-[#00346F]' : 'text-slate-500'}`}>
                            {m.nombre}
                          </p>
                          <p className="text-[10px] text-slate-400 line-clamp-1">{m.descripcion}</p>
                        </div>
                        {isAllowed && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                            Activo
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={userModalLoading}
                  className="px-5 py-2 bg-[#00346F] hover:bg-[#004A99] text-white rounded-lg font-semibold flex items-center gap-2 shadow disabled:opacity-70"
                >
                  {userModalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {userModalLoading ? 'Guardando...' : (editingUser ? 'Guardar Cambios' : 'Crear Usuario')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL: CREAR / EDITAR ROL Y PERMISOS                          */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-[#00346F] to-[#004A99] text-white">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold">
                  {editingRole ? `Editar Rol: ${editingRole.nombre}` : 'Crear Nuevo Rol de Sistema'}
                </h3>
              </div>
              <button onClick={() => setIsRoleModalOpen(false)} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRole} className="p-6 overflow-y-auto flex-1 space-y-5 text-xs bg-[#F8F9FF]">
              {/* Basic Role Fields */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 block border-b border-slate-100 pb-1">
                  Definición del Rol
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Nombre del Rol *
                    </label>
                    <input
                      type="text"
                      required
                      value={roleForm.nombre}
                      onChange={(e) => handleRoleNameChange(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium focus:outline-none focus:border-[#00346F]"
                      placeholder="ej: Supervisor de Taller"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Código del Rol (Identificador Interno) *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={Boolean(editingRole && editingRole.esSistema)}
                      value={roleForm.codigo}
                      onChange={(e) => setRoleForm({ ...roleForm, codigo: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold uppercase focus:outline-none focus:border-[#00346F] disabled:bg-slate-100 disabled:text-slate-500"
                      placeholder="SUPERVISOR_TALLER"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">
                    Descripción de Funciones
                  </label>
                  <input
                    type="text"
                    value={roleForm.descripcion || ''}
                    onChange={(e) => setRoleForm({ ...roleForm, descripcion: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00346F]"
                    placeholder="Acceso a recepción, diagnósticos y supervisión técnica..."
                  />
                </div>
              </div>

              {/* Module Permissions Picker */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-2">
                  <div>
                    <span className="font-bold text-slate-800 block text-sm">
                      Módulos y Permisos Concedidos a este Rol
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Seleccione las pantallas que podrán ver y operar los usuarios con este rol.
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectAllRoleModules(true)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-[#00346F] hover:bg-blue-50 rounded border border-blue-200"
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectAllRoleModules(false)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 rounded border border-slate-200"
                    >
                      Limpiar
                    </button>
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#EFF4FF] text-[#00346F]">
                      {roleForm.modulosPredeterminados.length} de {MODULOS_DISPONIBLES.length}
                    </span>
                  </div>
                </div>

                {/* Categorized Permissions Grid */}
                <div className="space-y-4">
                  {Object.entries(categorizedModules).map(([categoria, mods]) => (
                    <div key={categoria} className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#00346F]"></span>
                        {categoria}
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {mods.map((m) => {
                          const isChecked = roleForm.modulosPredeterminados.includes(m.id);
                          return (
                            <div
                              key={m.id}
                              onClick={() => toggleRoleModule(m.id)}
                              className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all select-none ${
                                isChecked
                                  ? 'bg-[#EFF4FF] border-[#00346F] shadow-xs'
                                  : 'bg-white border-slate-200 hover:border-slate-300 opacity-60'
                              }`}
                            >
                              <div className={`mt-0.5 ${isChecked ? 'text-[#00346F]' : 'text-slate-400'}`}>
                                {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className={isChecked ? 'text-[#00346F]' : 'text-slate-400'}>
                                    {ICON_MAP[m.icono] || <Package className="w-3.5 h-3.5" />}
                                  </span>
                                  <p className={`font-bold text-xs truncate ${isChecked ? 'text-[#00346F]' : 'text-slate-700'}`}>
                                    {m.nombre}
                                  </p>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                                  {m.descripcion}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={roleModalLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-2 shadow disabled:opacity-70"
                >
                  {roleModalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {roleModalLoading ? 'Guardando...' : (editingRole ? 'Guardar Cambios del Rol' : 'Crear Rol')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
