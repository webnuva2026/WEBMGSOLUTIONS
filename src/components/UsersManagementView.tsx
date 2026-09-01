import React, { useState } from 'react';
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
} from 'lucide-react';
import { Usuario, UserRole, EstadoRegistro, MODULOS_DISPONIBLES } from '../types';

interface UsersManagementViewProps {
  usuarios: Usuario[];
  onSaveUsuario: (u: Usuario) => void;
  onToggleUsuarioEstado: (id: number) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

const ROLE_LABELS: Record<UserRole, { label: string; bg: string; text: string }> = {
  ADMIN: { label: 'Super Administrador', bg: 'bg-purple-100', text: 'text-purple-800' },
  SECRETARIA: { label: 'Secretaría / Recepción', bg: 'bg-pink-100', text: 'text-pink-800' },
  TECNICO: { label: 'Técnico de Taller', bg: 'bg-emerald-100', text: 'text-emerald-800' },
  FACTURADOR: { label: 'Ventas & Facturador', bg: 'bg-blue-100', text: 'text-[#00346F]' },
  ALMACEN: { label: 'Jefe de Almacén', bg: 'bg-amber-100', text: 'text-amber-800' },
  CAJERO: { label: 'Cajero / Tesorería', bg: 'bg-slate-100', text: 'text-slate-800' },
};

const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: MODULOS_DISPONIBLES.map((m) => m.id),
  SECRETARIA: ['taller', 'ventas', 'clientes', 'caja-bancos'],
  TECNICO: ['taller', 'productos'],
  FACTURADOR: ['ventas', 'clientes', 'productos'],
  ALMACEN: ['productos', 'categorias', 'marcas', 'compras'],
  CAJERO: ['caja-bancos', 'ventas'],
};

export const UsersManagementView: React.FC<UsersManagementViewProps> = ({
  usuarios,
  onSaveUsuario,
  onToggleUsuarioEstado,
  onShowToast,
}) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);

  const [formData, setFormData] = useState<Partial<Usuario>>({
    username: '',
    nombreCompleto: '',
    email: '',
    telefono: '',
    rol: 'FACTURADOR',
    estado: 'ACTIVO',
    modulosPermitidos: DEFAULT_ROLE_PERMISSIONS.FACTURADOR,
  });

  const filtered = usuarios.filter((u) => {
    const matchSearch =
      !search ||
      u.nombreCompleto.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.rol === roleFilter;
    return matchSearch && matchRole;
  });

  const handleOpenNew = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      nombreCompleto: '',
      email: '',
      telefono: '',
      rol: 'SECRETARIA',
      estado: 'ACTIVO',
      modulosPermitidos: DEFAULT_ROLE_PERMISSIONS.SECRETARIA,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: Usuario) => {
    setEditingUser(u);
    setFormData({
      ...u,
      modulosPermitidos: u.modulosPermitidos || DEFAULT_ROLE_PERMISSIONS[u.rol] || ['ventas'],
    });
    setIsModalOpen(true);
  };

  const handleRoleChange = (newRole: UserRole) => {
    const defaultPanels = DEFAULT_ROLE_PERMISSIONS[newRole] || ['ventas'];
    setFormData({
      ...formData,
      rol: newRole,
      modulosPermitidos: defaultPanels,
    });
  };

  const togglePanelPermission = (moduloId: string) => {
    const currentList = formData.modulosPermitidos || [];
    if (currentList.includes(moduloId)) {
      setFormData({
        ...formData,
        modulosPermitidos: currentList.filter((id) => id !== moduloId),
      });
    } else {
      setFormData({
        ...formData,
        modulosPermitidos: [...currentList, moduloId],
      });
    }
  };

  const applyPreset = (presetType: 'ALL' | 'SALES' | 'TECH' | 'SECRETARY' | 'ALMACEN') => {
    if (presetType === 'ALL') {
      setFormData({ ...formData, modulosPermitidos: MODULOS_DISPONIBLES.map((m) => m.id) });
    } else if (presetType === 'SALES') {
      setFormData({ ...formData, modulosPermitidos: ['ventas', 'clientes', 'productos'] });
    } else if (presetType === 'TECH') {
      setFormData({ ...formData, modulosPermitidos: ['taller', 'productos'] });
    } else if (presetType === 'SECRETARY') {
      setFormData({ ...formData, modulosPermitidos: ['taller', 'ventas', 'clientes', 'caja-bancos'] });
    } else if (presetType === 'ALMACEN') {
      setFormData({ ...formData, modulosPermitidos: ['productos', 'categorias', 'marcas', 'compras'] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.nombreCompleto || !formData.email) {
      onShowToast('Campos incompletos', 'Complete todos los campos obligatorios.', 'warning');
      return;
    }

    const assignedPanels = formData.modulosPermitidos && formData.modulosPermitidos.length > 0
      ? formData.modulosPermitidos
      : ['ventas'];

    const userToSave: Usuario = {
      id: editingUser ? editingUser.id : Date.now(),
      username: formData.username.trim().toLowerCase(),
      nombreCompleto: formData.nombreCompleto.trim(),
      email: formData.email.trim(),
      telefono: formData.telefono || '',
      rol: (formData.rol as UserRole) || 'FACTURADOR',
      estado: (formData.estado as EstadoRegistro) || 'ACTIVO',
      avatar: formData.nombreCompleto
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      ultimoAcceso: editingUser ? editingUser.ultimoAcceso : 'Nunca',
      modulosPermitidos: assignedPanels,
    };

    onSaveUsuario(userToSave);
    setIsModalOpen(false);
    onShowToast(
      editingUser ? 'Usuario y Permisos Actualizados' : 'Usuario Registrado',
      `Se configuraron ${assignedPanels.length} paneles visibles para '${userToSave.username}'.`,
      'success'
    );
  };

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto bg-[#F8F9FF] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#00346F] text-white">
              Control de Accesos & Roles (RBAC)
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0B1C30] tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#00346F]" />
            Gestión de Usuarios & Paneles Visibles
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Configure qué pantallas y módulos del ERP puede ver y operar cada usuario según su rol (Ventas, Técnico, Secretaría, Almacén, etc.).
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="bg-[#00346F] hover:bg-[#004A99] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

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

        <div className="w-full md:w-56">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Filtrar por Rol
          </label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#00346F]"
          >
            <option value="ALL">Todos los roles</option>
            <option value="ADMIN">Super Administrador</option>
            <option value="SECRETARIA">Secretaría / Recepción</option>
            <option value="TECNICO">Técnico de Taller</option>
            <option value="FACTURADOR">Ventas & Facturador</option>
            <option value="ALMACEN">Jefe de Almacén</option>
            <option value="CAJERO">Cajero</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-[#EFF4FF] border-b border-slate-200 flex justify-between items-center">
          <span className="text-xs font-bold text-[#00346F]">
            Lista de Usuarios Registrados ({filtered.length})
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            Haga clic en 'Editar' para ajustar los paneles visibles
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#EFF4FF] border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Nombre Completo</th>
                <th className="py-3 px-4">Rol del Sistema</th>
                <th className="py-3 px-4">Paneles Asignados</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4">Último Acceso</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u, idx) => {
                const roleBadge = ROLE_LABELS[u.rol] || ROLE_LABELS.FACTURADOR;
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
                          {allowedCount} / {MODULOS_DISPONIBLES.length} paneles
                        </span>
                        {u.modulosPermitidos?.slice(0, 3).map((modId) => {
                          const m = MODULOS_DISPONIBLES.find((d) => d.id === modId);
                          return (
                            <span key={modId} className="px-1.5 py-0.5 rounded text-[9px] bg-blue-50 text-blue-700 font-medium border border-blue-100">
                              {m?.nombre.split('&')[0] || modId}
                            </span>
                          );
                        })}
                        {allowedCount > 3 && (
                          <span className="text-[9px] text-slate-400 font-medium">+{allowedCount - 3} más</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => {
                          onToggleUsuarioEstado(u.id);
                          onShowToast(
                            'Estado modificado',
                            `Usuario '${u.username}' ahora está ${
                              u.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
                            }.`,
                            'info'
                          );
                        }}
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
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{u.ultimoAcceso}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="px-2.5 py-1.5 bg-[#EFF4FF] hover:bg-[#00346F] hover:text-white text-[#00346F] rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="Editar Usuario y Permisos de Paneles"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Permisos
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Editar / Crear Usuario y Paneles */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-[#00346F] text-white">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold">
                  {editingUser ? `Editar Permisos de @${editingUser.username}` : 'Nuevo Usuario & Configuración de Paneles'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5 text-xs bg-[#F8F9FF]">
              {/* Basic Details */}
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
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-medium focus:outline-none focus:border-[#00346F]"
                      placeholder="ej: kevin_tec"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Rol Funcional *
                    </label>
                    <select
                      value={formData.rol}
                      onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                    >
                      <option value="ADMIN">Super Administrador (Todos los paneles)</option>
                      <option value="SECRETARIA">Secretaría & Recepción (Taller, Ventas, Clientes)</option>
                      <option value="TECNICO">Técnico de Taller (Taller & Productos)</option>
                      <option value="FACTURADOR">Ventas & Facturador (Ventas, Clientes, Productos)</option>
                      <option value="ALMACEN">Jefe de Almacén (Productos, Marcas, Compras)</option>
                      <option value="CAJERO">Cajero / Cobranzas (Caja & Ventas)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Estado de Acceso
                    </label>
                    <select
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value as EstadoRegistro })}
                      className={`w-full p-2 border rounded-lg font-bold ${
                        formData.estado === 'ACTIVO'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-red-50 text-red-800 border-red-300'
                      }`}
                    >
                      <option value="ACTIVO">ACTIVO (Permitir Login)</option>
                      <option value="INACTIVO">INACTIVO (Bloqueado)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nombreCompleto}
                      onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
                      placeholder="Ej: Kevin Santisteban Mendoza"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
                      placeholder="kevin@mgsolutions.pe"
                    />
                  </div>
                </div>
              </div>

              {/* Modular Permissions Section */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-2">
                  <div>
                    <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      <LayoutGrid className="w-4 h-4 text-[#00346F]" />
                      Paneles y Módulos Visibles para este Usuario
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Marque los paneles a los que este usuario tendrá acceso en la barra de navegación:
                    </span>
                  </div>

                  {/* Preset Buttons */}
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => applyPreset('ALL')}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold text-slate-700"
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('TECH')}
                      className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 rounded text-[10px] font-bold text-emerald-800"
                    >
                      Técnico
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('SECRETARY')}
                      className="px-2 py-1 bg-pink-50 hover:bg-pink-100 rounded text-[10px] font-bold text-pink-800"
                    >
                      Secretaría
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('SALES')}
                      className="px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded text-[10px] font-bold text-[#00346F]"
                    >
                      Ventas
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('ALMACEN')}
                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 rounded text-[10px] font-bold text-amber-800"
                    >
                      Almacén
                    </button>
                  </div>
                </div>

                {/* Checkboxes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                  {MODULOS_DISPONIBLES.map((mod) => {
                    const isChecked = formData.modulosPermitidos?.includes(mod.id);
                    return (
                      <div
                        key={mod.id}
                        onClick={() => togglePanelPermission(mod.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                          isChecked
                            ? 'bg-blue-50/70 border-blue-300 text-slate-900 shadow-xs'
                            : 'bg-slate-50/50 border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <div className="pt-0.5">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-[#00346F]" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1">
                          <span className={`font-bold block text-xs ${isChecked ? 'text-[#00346F]' : 'text-slate-600'}`}>
                            {mod.nombre}
                          </span>
                          <span className="text-[10px] text-slate-500 leading-tight block">
                            {mod.descripcion}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-2 rounded-xl">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#00346F] hover:bg-[#004A99] text-white rounded-lg font-bold flex items-center gap-1.5 shadow"
                >
                  <Save className="w-4 h-4" />
                  Guardar Usuario y Permisos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
