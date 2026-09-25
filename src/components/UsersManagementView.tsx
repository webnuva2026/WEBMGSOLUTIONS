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
} from 'lucide-react';
import { Usuario, UserRole, EstadoRegistro, MODULOS_DISPONIBLES, Rol } from '../types';
import { userService, CreateRoleData } from '../services/user.service';

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
    estado: 'ACTIVO',
    modulosPermitidos: ['panel-recepcion', 'taller', 'equipos', 'ventas', 'clientes'],
  });

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
  }, [loadRoles, loadUsers]);

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

  // Open New User Modal
  const handleOpenNewUser = () => {
    setEditingUser(null);
    const defaultRol = roles.find(r => r.codigo === 'SECRETARIA') || roles[0];
    setUserForm({
      username: '',
      password: '',
      nombreCompleto: '',
      email: '',
      telefono: '',
      tipoDocumento: 'DNI',
      numeroDocumento: '',
      rol: defaultRol ? defaultRol.codigo : 'SECRETARIA',
      estado: 'ACTIVO',
      modulosPermitidos: defaultRol?.modulosPredeterminados || ['ventas'],
    });
    setIsUserModalOpen(true);
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
      estado: u.estado,
      modulosPermitidos: u.modulosPermitidos || userRole?.modulosPredeterminados || ['ventas'],
    });
    setIsUserModalOpen(true);
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
    if (!userForm.username.trim() || !userForm.nombreCompleto.trim() || !userForm.email.trim()) {
      onShowToast('Campos incompletos', 'Complete todos los campos obligatorios.', 'warning');
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
        });

        if (res.success) {
          const updatedUser: Usuario = {
            ...editingUser,
            nombreCompleto: userForm.nombreCompleto.trim(),
            email: userForm.email.trim(),
            telefono: userForm.telefono || '',
            rol: userForm.rol as any,
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
          username: userForm.username.trim().toLowerCase(),
          password: userForm.password || 'Admin2026!',
          nombreCompleto: userForm.nombreCompleto.trim(),
          email: userForm.email.trim(),
          telefono: userForm.telefono?.trim(),
          tipoDocumento: userForm.tipoDocumento,
          numeroDocumento: userForm.numeroDocumento?.trim(),
          rolId: selectedRoleObj?.id,
          rol: userForm.rol,
        });

        if (res.success) {
          await loadUsers();
          setIsUserModalOpen(false);
          onShowToast(
            'Usuario Creado',
            `Usuario @${userForm.username} registrado con éxito. Contraseña inicial: ${userForm.password || 'Admin2026!'}`,
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
        onShowToast(
          'Contraseña Restablecida',
          `Nueva clave temporal para @${user.username}: ${res.passwordTemporal || 'CambiarEsto2026!'}`,
          'success'
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
                    <th className="py-3 px-4">Módulos Visibles</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4">Último Acceso</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#00346F]" />
                        Cargando usuarios...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
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
          {/* Roles Header Banner */}
          <div className="bg-gradient-to-r from-[#00346F] to-[#005bb5] text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-300" />
                Catálogo de Roles y Módulos Concedidos
              </h2>
              <p className="text-blue-100 text-xs mt-1 max-w-2xl">
                Los roles definen qué partes del sistema pueden ver y operar los usuarios asignados. Al crear un nuevo rol, puede elegir exactamente qué módulos estarán habilitados.
              </p>
            </div>
            <button
              onClick={handleOpenNewRole}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Crear Nuevo Rol
            </button>
          </div>

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
              {/* Account Data */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 block border-b border-slate-100 pb-1">
                  Datos de Cuenta e Identificación
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Username / Usuario *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={Boolean(editingUser)}
                      value={userForm.username}
                      onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-medium focus:outline-none focus:border-[#00346F] disabled:bg-slate-100 disabled:text-slate-500"
                      placeholder="ej: kevin_tec"
                    />
                  </div>

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

                {!editingUser && (
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Contraseña Inicial (opcional, por defecto: Admin2026!)
                    </label>
                    <input
                      type="password"
                      value={userForm.password || ''}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-[#00346F]"
                      placeholder="Admin2026!"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={userForm.nombreCompleto}
                      onChange={(e) => setUserForm({ ...userForm, nombreCompleto: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00346F]"
                      placeholder="Kevin Quispe Rojas"
                    />
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Tipo Doc.</label>
                    <select
                      value={userForm.tipoDocumento}
                      onChange={(e) => setUserForm({ ...userForm, tipoDocumento: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                    >
                      <option value="DNI">DNI (8)</option>
                      <option value="CE">C. Extranjería</option>
                      <option value="RUC">RUC</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">N° Documento</label>
                    <input
                      type="text"
                      value={userForm.numeroDocumento}
                      onChange={(e) => setUserForm({ ...userForm, numeroDocumento: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono"
                      placeholder="72345678"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Teléfono</label>
                    <input
                      type="text"
                      value={userForm.telefono}
                      onChange={(e) => setUserForm({ ...userForm, telefono: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                      placeholder="987654321"
                    />
                  </div>
                </div>
              </div>

              {/* Module Permissions Picker */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-2">
                  <div>
                    <span className="font-bold text-slate-800 block">
                      Permisos de Módulos para este Usuario
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Cargados automáticamente del rol seleccionado, pero puede personalizar si es necesario.
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#EFF4FF] text-[#00346F]">
                    {userForm.modulosPermitidos.length} seleccionados
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
                  {MODULOS_DISPONIBLES.map((m) => {
                    const isChecked = userForm.modulosPermitidos.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => togglePanelPermission(m.id)}
                        className={`p-2.5 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-all select-none ${
                          isChecked
                            ? 'bg-[#EFF4FF] border-[#00346F] shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 opacity-60'
                        }`}
                      >
                        <div className={`mt-0.5 ${isChecked ? 'text-[#00346F]' : 'text-slate-400'}`}>
                          {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-xs truncate ${isChecked ? 'text-[#00346F]' : 'text-slate-700'}`}>
                            {m.nombre}
                          </p>
                          <p className="text-[10px] text-slate-400 line-clamp-1">{m.descripcion}</p>
                        </div>
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
