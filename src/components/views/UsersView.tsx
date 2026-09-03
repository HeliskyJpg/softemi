import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  UserCheck,
  UserPlus,
  Shield,
  Edit2,
  CheckCircle2,
  XCircle,
  Mail,
  Power,
  Search,
  Copy,
  Check,
  Eye,
  EyeOff,
  Key,
  RefreshCw,
  AlertCircle,
  User as UserIcon,
} from 'lucide-react';
import { SystemUser, UserRole } from '../../types';
import {
  ConfirmDialog,
  SystemAlert,
  FormFieldError,
  Modal,
  AutocompleteSelect,
} from '../common';

export const UsersView: React.FC = () => {
  const {
    users,
    currentUser,
    updateUser,
    createUser,
    toggleUserActive,
    addToast,
    switchUserRole,
    resetUserPassword,
  } = useApp();

  const isAdmin = currentUser?.role === 'Administrador';

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'Administrador' | 'Colaborador'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal State for Creating User
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createUsername, setCreateUsername] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createRole, setCreateRole] = useState<UserRole>('Colaborador');
  const [createTempPassword, setCreateTempPassword] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createErrors, setCreateErrors] = useState<{ [key: string]: string }>({});
  const [createdSummary, setCreatedSummary] = useState<{
    user: SystemUser;
    tempPassword: string;
  } | null>(null);
  const [copiedCredentials, setCopiedCredentials] = useState(false);

  // Modal State for Editing Allowed User Info Only (No exposing existing password)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('Colaborador');
  const [formActive, setFormActive] = useState(true);
  const [enableResetPassword, setEnableResetPassword] = useState(false);
  const [editTempPassword, setEditTempPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{ name?: string; username?: string; general?: string }>({});

  // Confirmation Modal State for User Deactivation
  const [userToDeactivate, setUserToDeactivate] = useState<SystemUser | null>(null);
  const [pendingSavePayload, setPendingSavePayload] = useState<{ id: string; data: Partial<SystemUser> } | null>(null);

  // Active administrators counter for system integrity
  const activeAdminsCount = useMemo(() => {
    return users.filter((u) => u.role === 'Administrador' && u.active).length;
  }, [users]);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        u.name.toLowerCase().includes(term) ||
        u.username.toLowerCase().includes(term) ||
        (u.email && u.email.toLowerCase().includes(term));

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && u.active) ||
        (statusFilter === 'inactive' && !u.active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Helper to generate a friendly secure temporary password
  const generateRandomTempPassword = () => {
    const prefixes = ['Emila', 'Flores', 'Taller', 'Boutique', 'Rosa'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    const symbols = ['!', '#', '*', '$'];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    return `${prefix}${num}${symbol}`;
  };

  // Open Create User Modal
  const handleOpenCreate = () => {
    setCreateName('');
    setCreateUsername('');
    setCreateEmail('');
    setCreateRole('Colaborador');
    setCreateTempPassword(generateRandomTempPassword());
    setShowCreatePassword(true);
    setCreateErrors({});
    setCreatedSummary(null);
    setCopiedCredentials(false);
    setShowCreateModal(true);
  };

  // Handle Create User Submit
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    const trimmedName = createName.trim();
    if (!trimmedName) {
      errors.name = 'El nombre completo es obligatorio.';
    }

    const cleanUser = createUsername.trim().toLowerCase().replace(/\s+/g, '');
    if (!cleanUser) {
      errors.username = 'El nombre de usuario es obligatorio.';
    } else if (cleanUser.length < 3) {
      errors.username = 'El nombre de usuario debe tener al menos 3 caracteres.';
    } else if (users.some((u) => u.username.toLowerCase() === cleanUser)) {
      errors.username = `El usuario "@${cleanUser}" ya está en uso. Elija otro identificador.`;
    }

    const tempPass = createTempPassword.trim();
    if (!tempPass) {
      errors.password = 'La contraseña temporal funcional es obligatoria.';
    } else if (tempPass.length < 4) {
      errors.password = 'La contraseña debe tener al menos 4 caracteres.';
    }

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }

    setCreateErrors({});

    const result = createUser({
      name: trimmedName,
      username: cleanUser,
      email: createEmail.trim(),
      role: createRole,
      tempPassword: tempPass,
    });

    if (result.success && result.user) {
      setCreatedSummary({
        user: result.user,
        tempPassword: result.tempPassword || tempPass,
      });
      setCopiedCredentials(false);
    } else {
      setCreateErrors({ general: result.error || 'Ocurrió un error al registrar el usuario.' });
    }
  };

  // Copy credentials helper
  const handleCopyCredentials = () => {
    if (!createdSummary) return;
    const text = `Credenciales de acceso EMILA:\nUsuario: ${createdSummary.user.username}\nContraseña temporal: ${createdSummary.tempPassword}\nRol: ${createdSummary.user.role}\nNota: El sistema solicitará crear su contraseña personal en su primer inicio de sesión.`;
    navigator.clipboard.writeText(text);
    setCopiedCredentials(true);
    addToast('Credenciales copiadas al portapapeles.', 'success');
    setTimeout(() => setCopiedCredentials(false), 3000);
  };

  // Restrict access to administrators only
  if (!isAdmin) {
    return (
      <div id="users-access-restricted" className="max-w-xl mx-auto p-8 sm:p-12 text-center bg-white rounded-2xl border border-[#F2D6DE]/60 shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#FBECEF] text-[#681B2B] flex items-center justify-center mx-auto">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#2C1E23]">Módulo de Usuarios y Roles</h2>
          <p className="text-xs text-[#7D6871] mt-1.5 max-w-md mx-auto leading-relaxed">
            Este módulo requiere privilegios de <strong>Administrador</strong> para gestionar cuentas, crear usuarios y controlar accesos en EMILA Floristería. Tu usuario actual tiene rol <strong>Colaborador</strong>.
          </p>
        </div>

        <div className="pt-2">
          <button
            id="btn-switch-to-admin-mode"
            onClick={() => switchUserRole('Administrador')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#681B2B] hover:bg-[#531422] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" />
            Cambiar a Administrador (Modo Demostración)
          </button>
        </div>
      </div>
    );
  }

  // Open Edit User Modal (NEVER exposing existing passwords)
  const handleOpenEdit = (user: SystemUser) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormUsername(user.username);
    setFormEmail(user.email || '');
    setFormRole(user.role);
    setFormActive(user.active);
    setEnableResetPassword(false);
    setEditTempPassword('');
    setShowEditPassword(false);
    setFormErrors({});
    setShowEditModal(true);
  };

  // Trigger Deactivation confirmation for row action
  const handleRequestDeactivation = (user: SystemUser) => {
    if (user.id === currentUser?.id) {
      addToast('No puede desactivar el usuario con el que tiene sesión activa.', 'warning', 'Acción no permitida');
      return;
    }

    if (user.role === 'Administrador' && user.active && activeAdminsCount <= 1) {
      addToast('No se puede desactivar al único Administrador activo del sistema.', 'warning', 'Acción no permitida');
      return;
    }

    setPendingSavePayload(null);
    setUserToDeactivate(user);
  };

  // Toggle user activation directly if inactive
  const handleToggleClick = (user: SystemUser) => {
    if (user.active) {
      handleRequestDeactivation(user);
    } else {
      toggleUserActive(user.id);
    }
  };

  // Confirm deactivation from modal
  const handleConfirmDeactivation = () => {
    if (pendingSavePayload) {
      updateUser(pendingSavePayload.id, pendingSavePayload.data);
      setPendingSavePayload(null);
      setUserToDeactivate(null);
      setShowEditModal(false);
    } else if (userToDeactivate) {
      toggleUserActive(userToDeactivate.id);
      setUserToDeactivate(null);
    }
  };

  // Handle Edit form submission
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const errors: { name?: string; username?: string; general?: string; password?: string } = {};

    if (!formName.trim()) {
      errors.name = 'El nombre completo es obligatorio.';
    }

    const cleanUsername = formUsername.trim().toLowerCase().replace(/\s+/g, '');
    if (!cleanUsername) {
      errors.username = 'El nombre de usuario es obligatorio.';
    } else if (users.some((u) => u.id !== editingUser.id && u.username.toLowerCase() === cleanUsername)) {
      errors.username = `El usuario "@${cleanUsername}" ya pertenece a otra cuenta.`;
    }

    if (enableResetPassword && editTempPassword.trim().length < 4) {
      errors.password = 'La contraseña temporal debe tener al menos 4 caracteres.';
    }

    const isCurrent = editingUser.id === currentUser?.id;
    const isOnlyActiveAdmin = editingUser.role === 'Administrador' && editingUser.active && activeAdminsCount <= 1;

    // Safety checks
    if (!formActive && isCurrent) {
      errors.general = 'No puede desactivar su propia cuenta de administrador mientras tenga la sesión activa.';
    } else if (!formActive && isOnlyActiveAdmin) {
      errors.general = 'No se puede desactivar al único Administrador activo del sistema.';
    } else if (formRole !== 'Administrador' && isOnlyActiveAdmin) {
      errors.general = 'No puede cambiar el rol del único Administrador activo. El sistema debe conservar al menos un administrador.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    const updatedData: Partial<SystemUser> = {
      name: formName.trim(),
      username: cleanUsername,
      email: formEmail.trim(),
      role: formRole,
      active: formActive,
      ...(enableResetPassword && editTempPassword.trim()
        ? { password: editTempPassword.trim(), mustChangePassword: true }
        : {}),
    };

    // If user was active and is being set to inactive, show confirmation modal
    if (editingUser.active && !formActive) {
      setPendingSavePayload({ id: editingUser.id, data: updatedData });
      setUserToDeactivate(editingUser);
      return;
    }

    updateUser(editingUser.id, updatedData);
    setShowEditModal(false);
  };

  const isEditingCurrent = editingUser?.id === currentUser?.id;
  const isEditingOnlyAdmin = editingUser?.role === 'Administrador' && editingUser?.active && activeAdminsCount <= 1;

  return (
    <div id="users-view-container" className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2C1E23] tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-[#681B2B]" />
            Usuarios y roles
          </h1>
          <p className="text-xs sm:text-sm text-[#7D6871] mt-0.5 font-medium">
            Administración de colaboradores, asignación de roles, control de estado y auditoría de accesos.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          {/* Active administrators badge */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FBECEF]/70 border border-[#F2D6DE] text-xs font-semibold text-[#681B2B]">
            <Shield className="w-4 h-4" />
            <span>
              {activeAdminsCount} {activeAdminsCount === 1 ? 'Admin activo' : 'Admins activos'}
            </span>
          </div>

          {/* Create User Button */}
          <button
            id="btn-open-create-user"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#681B2B] hover:bg-[#531422] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Crear Usuario
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl border border-[#F2D6DE]/60 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#7D6871] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-users"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, usuario o correo..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#F2D6DE] text-xs sm:text-sm text-[#2C1E23] placeholder-[#7D6871]/60 focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20 focus:border-[#681B2B]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7D6871] hover:text-[#2C1E23]"
            >
              Limpiar
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Role filter */}
          <select
            id="select-filter-role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-[#F2D6DE] text-xs font-semibold text-[#2C1E23] bg-white focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20"
          >
            <option value="all">Todos los roles</option>
            <option value="Administrador">Administrador</option>
            <option value="Colaborador">Colaborador</option>
          </select>

          {/* Status filter */}
          <select
            id="select-filter-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-[#F2D6DE] text-xs font-semibold text-[#2C1E23] bg-white focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Users List Container */}
      <div className="bg-white rounded-2xl border border-[#F2D6DE]/60 shadow-xs overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-[#7D6871] space-y-2">
            <UserIcon className="w-10 h-10 text-[#7D6871]/40 mx-auto" />
            <p className="text-sm font-semibold text-[#2C1E23]">No se encontraron usuarios</p>
            <p className="text-xs">Intente modificar los términos de búsqueda o filtros seleccionados.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FBECEF]/30 border-b border-[#F2D6DE]/60 text-[#7D6871] uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">Nombre Completo</th>
                    <th className="py-3.5 px-4 font-bold">Usuario / Correo</th>
                    <th className="py-3.5 px-4 font-bold">Rol Asignado</th>
                    <th className="py-3.5 px-4 font-bold text-center">Estado y Acceso</th>
                    <th className="py-3.5 px-4 font-bold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2D6DE]/30">
                  {filteredUsers.map((u) => {
                    const isCurrent = u.id === currentUser?.id;
                    const isOnlyAdmin = u.role === 'Administrador' && u.active && activeAdminsCount <= 1;

                    return (
                      <tr key={u.id} className="hover:bg-[#FBECEF]/20 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#681B2B] text-white flex items-center justify-center text-xs font-bold shrink-0">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-[#2C1E23] flex items-center gap-1.5">
                                {u.name}
                                {isCurrent && (
                                  <span className="text-[10px] bg-[#FBECEF] text-[#681B2B] border border-[#F2D6DE] px-1.5 py-0.2 rounded font-bold">
                                    Tú
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#7D6871]">
                                Registrado: {u.createdAt || 'Inicial'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#2C1E23]">@{u.username}</div>
                          {u.email ? (
                            <div className="text-[11px] text-[#7D6871] flex items-center gap-1">
                              <Mail className="w-3 h-3 text-[#681B2B]" />
                              {u.email}
                            </div>
                          ) : (
                            <div className="text-[11px] text-[#7D6871]/50 italic">Sin correo registrado</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              u.role === 'Administrador'
                                ? 'bg-[#FBECEF] text-[#681B2B] border border-[#F2D6DE]'
                                : 'bg-gray-100 text-[#4A202A]'
                            }`}
                          >
                            <Shield className="w-3 h-3" />
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex flex-col items-center gap-1">
                            {u.active ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                Activo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                                <XCircle className="w-3 h-3" />
                                Inactivo
                              </span>
                            )}
                            {u.mustChangePassword && (
                              <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                                <Key className="w-2.5 h-2.5" />
                                Cambio inicial pendiente
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              id={`btn-edit-user-${u.id}`}
                              onClick={() => handleOpenEdit(u)}
                              className="px-3 py-1.5 rounded-lg border border-[#F2D6DE] bg-white text-[#681B2B] hover:bg-[#681B2B] hover:text-white font-semibold text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Editar
                            </button>

                            {/* Power button to toggle active/inactive */}
                            {isCurrent ? (
                              <span
                                className="p-1.5 rounded-lg border border-gray-200 text-gray-300 cursor-not-allowed inline-flex"
                                title="No puede desactivar su propia cuenta activa"
                              >
                                <Power className="w-3.5 h-3.5" />
                              </span>
                            ) : isOnlyAdmin ? (
                              <span
                                className="p-1.5 rounded-lg border border-gray-200 text-gray-300 cursor-not-allowed inline-flex"
                                title="No puede desactivar al único Administrador activo del sistema"
                              >
                                <Power className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <button
                                id={`btn-toggle-active-user-${u.id}`}
                                onClick={() => handleToggleClick(u)}
                                className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1 ${
                                  u.active
                                    ? 'border-gray-200 text-[#7D6871] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                }`}
                                title={u.active ? 'Desactivar usuario' : 'Activar usuario'}
                                aria-label={u.active ? `Desactivar a ${u.name}` : `Activar a ${u.name}`}
                              >
                                <Power className="w-3.5 h-3.5" />
                                <span>{u.active ? 'Desactivar' : 'Activar'}</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="block md:hidden divide-y divide-[#F2D6DE]/40 p-3 space-y-3">
              {filteredUsers.map((u) => {
                const isCurrent = u.id === currentUser?.id;
                const isOnlyAdmin = u.role === 'Administrador' && u.active && activeAdminsCount <= 1;

                return (
                  <div
                    key={u.id}
                    id={`card-user-${u.id}`}
                    className="bg-white rounded-xl p-4 border border-[#F2D6DE]/60 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-[#681B2B] text-white flex items-center justify-center text-sm font-bold shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-[#2C1E23] text-sm leading-tight flex items-center gap-1.5">
                            {u.name}
                            {isCurrent && (
                              <span className="text-[10px] bg-[#FBECEF] text-[#681B2B] border border-[#F2D6DE] px-1 rounded font-bold">
                                Tú
                              </span>
                            )}
                          </h3>
                          <p className="text-xs text-[#7D6871] font-medium">@{u.username}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {u.active ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                            <CheckCircle2 className="w-3 h-3" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 shrink-0">
                            <XCircle className="w-3 h-3" />
                            Inactivo
                          </span>
                        )}
                        {u.mustChangePassword && (
                          <span className="text-[9px] text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
                            Cambio pendiente
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 border-t border-[#F2D6DE]/30">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          u.role === 'Administrador'
                            ? 'bg-[#FBECEF] text-[#681B2B] border border-[#F2D6DE]'
                            : 'bg-gray-100 text-[#4A202A]'
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        {u.role}
                      </span>
                      {u.email && (
                        <span className="text-xs text-[#7D6871] flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-[#681B2B]" />
                          {u.email}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F2D6DE]/30">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="flex-1 py-2 px-3 rounded-xl border border-[#F2D6DE] bg-[#FBECEF]/30 hover:bg-[#FBECEF] text-[#681B2B] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Editar
                      </button>

                      {isCurrent ? (
                        <span className="py-2 px-3 rounded-xl border border-gray-200 text-gray-300 text-xs font-semibold cursor-not-allowed flex items-center gap-1">
                          <Power className="w-3.5 h-3.5" />
                          Sesión activa
                        </span>
                      ) : isOnlyAdmin ? (
                        <span className="py-2 px-3 rounded-xl border border-gray-200 text-gray-300 text-xs font-semibold cursor-not-allowed flex items-center gap-1">
                          <Power className="w-3.5 h-3.5" />
                          Único admin
                        </span>
                      ) : (
                        <button
                          onClick={() => handleToggleClick(u)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                            u.active
                              ? 'border-gray-200 text-[#7D6871] hover:bg-rose-50 hover:text-rose-600'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          {u.active ? 'Desactivar' : 'Activar'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Permissions Matrix Reference Card */}
      <div className="bg-white rounded-2xl p-5 border border-[#F2D6DE]/60 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#2C1E23] flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#681B2B]" />
            Matriz de Permisos por Rol en EMILA
          </h3>
          <span className="text-[11px] text-[#7D6871] font-medium hidden sm:inline">
            Control de acceso basado en roles (RBAC)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-[#F2D6DE]/40 rounded-xl overflow-hidden min-w-[340px]">
            <thead className="bg-[#FBECEF]/30 text-[#7D6871] uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Módulo / Acción</th>
                <th className="py-2.5 px-3 text-center">Colaborador</th>
                <th className="py-2.5 px-3 text-center">Administrador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2D6DE]/30 text-[#2C1E23]">
              <tr>
                <td className="py-2 px-3 font-medium">Recepción & Creación de Pedidos</td>
                <td className="py-2 px-3 text-center text-emerald-700 font-bold">✓ Permitido</td>
                <td className="py-2 px-3 text-center text-emerald-700 font-bold">✓ Permitido</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium">Actualización de Estado de Pedidos</td>
                <td className="py-2 px-3 text-center text-emerald-700 font-bold">✓ Permitido</td>
                <td className="py-2 px-3 text-center text-emerald-700 font-bold">✓ Permitido</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium">Consulta de Componentes y Stock</td>
                <td className="py-2 px-3 text-center text-emerald-700 font-bold">✓ Permitido</td>
                <td className="py-2 px-3 text-center text-emerald-700 font-bold">✓ Permitido</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium">Ajuste Manual de Existencias (Stock)</td>
                <td className="py-2 px-3 text-center text-rose-600 font-bold">✗ Restringido</td>
                <td className="py-2 px-3 text-center text-emerald-700 font-bold">✓ Permitido</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium">Crear, Editar, Activar y Desactivar Usuarios</td>
                <td className="py-2 px-3 text-center text-rose-600 font-bold">✗ Restringido</td>
                <td className="py-2 px-3 text-center text-emerald-700 font-bold">✓ Permitido</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium">Bitácora de Auditoría Global</td>
                <td className="py-2 px-3 text-center text-rose-600 font-bold">✗ Restringido</td>
                <td className="py-2 px-3 text-center text-emerald-700 font-bold">✓ Permitido</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL: CREAR USUARIO                                         */}
      {/* ============================================================ */}
      <Modal
        id="modal-create-user"
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={createdSummary ? 'Usuario Creado Exitosamente' : 'Crear Usuario'}
        subtitle={
          createdSummary
            ? 'Entregue la contraseña temporal directamente al colaborador.'
            : 'Registre un nuevo colaborador o administrador con contraseña temporal funcional.'
        }
        size="md"
        footer={
          createdSummary ? (
            <div className="w-full flex justify-end">
              <button
                id="btn-close-created-summary"
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold bg-[#681B2B] hover:bg-[#531422] text-white rounded-xl shadow-xs cursor-pointer"
              >
                Entendido / Finalizar
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                id="btn-cancel-create-user"
                onClick={() => setShowCreateModal(false)}
                className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-[#7D6871] hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="btn-submit-create-user"
                form="form-create-user"
                type="submit"
                className="w-full sm:w-auto px-5 py-2 text-xs font-bold bg-[#681B2B] hover:bg-[#531422] text-white rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Crear Usuario
              </button>
            </>
          )
        }
      >
        {createdSummary ? (
          <div className="space-y-4 py-2">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-emerald-900">
                ¡Usuario creado y listo para usar!
              </h3>
              <p className="text-xs text-emerald-800 mt-1">
                La cuenta de <strong>{createdSummary.user.name}</strong> ha sido registrada en el sistema.
              </p>
            </div>

            {/* Credentials Card */}
            <div className="bg-[#FBECEF]/40 border border-[#F2D6DE] rounded-2xl p-4 space-y-2.5">
              <p className="text-xs font-bold text-[#2C1E23] flex items-center justify-between">
                <span>Credenciales temporales asignadas:</span>
                <span className="text-[10px] text-[#681B2B] font-normal uppercase tracking-wider">
                  Acceso inicial
                </span>
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-[#F2D6DE]/60">
                  <span className="text-[10px] text-[#7D6871] block">Nombre de Usuario</span>
                  <strong className="text-sm text-[#2C1E23] font-mono">@{createdSummary.user.username}</strong>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-[#F2D6DE]/60">
                  <span className="text-[10px] text-[#7D6871] block">Rol</span>
                  <strong className="text-xs text-[#681B2B]">{createdSummary.user.role}</strong>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-[#F2D6DE]/60 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] text-[#7D6871] block font-semibold">Contraseña temporal funcional:</span>
                  <span className="font-mono text-sm font-bold text-[#681B2B] tracking-wider select-all">
                    {createdSummary.tempPassword}
                  </span>
                </div>

                <button
                  type="button"
                  id="btn-copy-credentials"
                  onClick={handleCopyCredentials}
                  className="px-3 py-1.5 rounded-lg border border-[#F2D6DE] hover:bg-[#FBECEF]/50 text-xs font-bold text-[#681B2B] inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {copiedCredentials ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Clear explicit security notes */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 space-y-2 text-left">
              <div className="flex items-start gap-2 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Requisitos de seguridad obligatorios:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
                    <li>
                      <strong>Cambio al primer inicio:</strong> El usuario deberá cambiar obligatoriamente esta contraseña al ingresar.
                    </li>
                    <li>
                      <strong>Entrega directa requerida:</strong> En este sistema no se simulan ni envían correos automáticos. Entregue esta contraseña directamente al colaborador de forma verbal o por canal interno seguro.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form id="form-create-user" onSubmit={handleCreateSubmit} className="space-y-4">
            {createErrors.general && (
              <SystemAlert id="alert-create-user-general" type="warning" message={createErrors.general} />
            )}

            {/* Full name input */}
            <div>
              <label htmlFor="input-create-name" className="block text-xs font-bold text-[#2C1E23] mb-1">
                Nombre Completo <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-create-name"
                type="text"
                required
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Ej. Carlos Mendoza"
                className={`w-full px-3 py-2 text-xs sm:text-sm rounded-xl border outline-none text-[#2C1E23] ${
                  createErrors.name ? 'border-rose-300 focus:ring-rose-200 ring-1 ring-rose-200' : 'border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20'
                }`}
              />
              <FormFieldError id="error-create-name" error={createErrors.name} />
            </div>

            {/* Username input */}
            <div>
              <label htmlFor="input-create-username" className="block text-xs font-bold text-[#2C1E23] mb-1">
                Nombre de Usuario (Para inicio de sesión) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7D6871]">@</span>
                <input
                  id="input-create-username"
                  type="text"
                  required
                  value={createUsername}
                  onChange={(e) => setCreateUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="carlos.mendoza"
                  className={`w-full pl-7 pr-3 py-2 text-xs sm:text-sm rounded-xl border outline-none text-[#2C1E23] ${
                    createErrors.username ? 'border-rose-300 focus:ring-rose-200 ring-1 ring-rose-200' : 'border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20'
                  }`}
                />
              </div>
              <FormFieldError id="error-create-username" error={createErrors.username} />
              <p className="text-[11px] text-[#7D6871] mt-1">Sin espacios, en minúsculas. Será su usuario único.</p>
            </div>

            {/* Email input */}
            <div>
              <label htmlFor="input-create-email" className="block text-xs font-bold text-[#2C1E23] mb-1">
                Correo Electrónico (Opcional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7D6871]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="input-create-email"
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="carlos@emila.com"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20 outline-none text-[#2C1E23]"
                />
              </div>
            </div>

            {/* Role selection */}
            <div>
              <label htmlFor="select-create-role" className="block text-xs font-bold text-[#2C1E23] mb-1">
                Rol Asignado <span className="text-rose-500">*</span>
              </label>
              <AutocompleteSelect
                id="select-create-role"
                value={createRole}
                onChange={(val) => setCreateRole(val as UserRole)}
                options={[
                  { value: 'Colaborador', label: 'Colaborador (Recepción de pedidos, agenda y taller)' },
                  { value: 'Administrador', label: 'Administrador (Acceso total, ajustes de stock y usuarios)' },
                ]}
                searchable={false}
                size="sm"
              />
            </div>

            {/* Functional temporary password */}
            <div className="p-3.5 bg-[#FBECEF]/30 rounded-2xl border border-[#F2D6DE]/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <label htmlFor="input-create-temp-password" className="text-xs font-bold text-[#2C1E23] flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#681B2B]" />
                  Contraseña Temporal Funcional <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  id="btn-generate-temp-password"
                  onClick={() => setCreateTempPassword(generateRandomTempPassword())}
                  className="text-[11px] font-bold text-[#681B2B] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Sugerir otra
                </button>
              </div>

              <div className="relative">
                <input
                  id="input-create-temp-password"
                  type={showCreatePassword ? 'text' : 'password'}
                  required
                  value={createTempPassword}
                  onChange={(e) => setCreateTempPassword(e.target.value)}
                  placeholder="Defina una contraseña temporal funcional"
                  className="w-full pl-3 pr-10 py-2 font-mono text-xs sm:text-sm rounded-xl border border-[#F2D6DE] bg-white outline-none focus:ring-2 focus:ring-[#681B2B]/20 text-[#2C1E23]"
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePassword(!showCreatePassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7D6871] hover:text-[#2C1E23]"
                  tabIndex={-1}
                >
                  {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <FormFieldError id="error-create-password" error={createErrors.password} />

              {/* Requirement notice & delivery policy */}
              <div className="text-[11px] text-[#7D6871] space-y-1.5 pt-1">
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold bg-emerald-50/80 p-2 rounded-lg border border-emerald-200/60">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Requiere cambio obligatorio de contraseña en el primer inicio de sesión.</span>
                </div>
                <p className="text-[10px] text-[#7D6871] leading-relaxed">
                  <strong>Aviso:</strong> No se envían correos electrónicos automáticos. Deberá entregar esta contraseña temporal directamente al nuevo usuario.
                </p>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* ============================================================ */}
      {/* MODAL: EDITAR USUARIO (DATOS PERMITIDOS)                      */}
      {/* NUNCA MOSTRAR, RECUPERAR NI PRECARGAR CONTRASEÑAS EXISTENTES  */}
      {/* ============================================================ */}
      <Modal
        id="modal-edit-user"
        isOpen={showEditModal && Boolean(editingUser)}
        onClose={() => setShowEditModal(false)}
        title="Editar Usuario"
        subtitle="Modifique los datos permitidos, rol y estado de la cuenta en EMILA."
        size="md"
        footer={
          <>
            <button
              type="button"
              id="btn-cancel-edit-user"
              onClick={() => setShowEditModal(false)}
              className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-medium text-[#7D6871] hover:bg-gray-100 rounded-xl cursor-pointer min-h-[42px] sm:min-h-[36px] flex items-center justify-center"
            >
              Cancelar
            </button>
            <button
              id="btn-save-edit-user"
              form="form-edit-user"
              type="submit"
              className="w-full sm:w-auto px-5 py-2 text-xs sm:text-sm font-bold bg-[#681B2B] hover:bg-[#531422] text-white rounded-xl shadow-xs cursor-pointer min-h-[42px] sm:min-h-[36px] flex items-center justify-center"
            >
              Guardar Cambios
            </button>
          </>
        }
      >
        <form id="form-edit-user" onSubmit={handleEditSubmit} className="space-y-4">
          {/* General error message if any */}
          {formErrors.general && (
            <SystemAlert id="alert-user-form-error" type="warning" message={formErrors.general} />
          )}

          {/* Full name input */}
          <div>
            <label htmlFor="input-edit-user-name" className="block text-xs font-bold text-[#2C1E23] mb-1">
              Nombre Completo <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-edit-user-name"
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ej. Elena Soto"
              className={`w-full px-3 py-2 text-xs sm:text-sm rounded-xl border outline-none text-[#2C1E23] ${
                formErrors.name ? 'border-rose-300 focus:ring-rose-200 ring-1 ring-rose-200' : 'border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20'
              }`}
            />
            <FormFieldError id="error-edit-user-name" error={formErrors.name} />
          </div>

          {/* Username input */}
          <div>
            <label htmlFor="input-edit-user-username" className="block text-xs font-bold text-[#2C1E23] mb-1">
              Nombre de Usuario (Identificador de acceso) <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-edit-user-username"
              type="text"
              required
              value={formUsername}
              onChange={(e) => setFormUsername(e.target.value)}
              placeholder="Ej. admin"
              className={`w-full px-3 py-2 text-xs sm:text-sm rounded-xl border outline-none text-[#2C1E23] ${
                formErrors.username ? 'border-rose-300 focus:ring-rose-200 ring-1 ring-rose-200' : 'border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20'
              }`}
            />
            <FormFieldError id="error-edit-user-username" error={formErrors.username} />
          </div>

          {/* Email input */}
          <div>
            <label htmlFor="input-edit-user-email" className="block text-xs font-bold text-[#2C1E23] mb-1">
              Correo Electrónico (Contacto)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7D6871]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="input-edit-user-email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="usuario@emila.com"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20 outline-none text-[#2C1E23]"
              />
            </div>
          </div>

          {/* Role selection */}
          <div>
            <label htmlFor="select-edit-user-role" className="block text-xs font-bold text-[#2C1E23] mb-1">
              Rol Asignado
            </label>
            <AutocompleteSelect
              id="select-edit-user-role"
              value={formRole}
              onChange={(val) => setFormRole(val as UserRole)}
              options={[
                { value: 'Colaborador', label: 'Colaborador (Recepción, agenda y taller)' },
                { value: 'Administrador', label: 'Administrador (Acceso total y configuración)' },
              ]}
              searchable={false}
              disabled={isEditingOnlyAdmin}
              size="sm"
            />

            {isEditingOnlyAdmin && (
              <div className="mt-2">
                <SystemAlert
                  id="alert-user-only-admin"
                  type="warning"
                  message="Este usuario es el único Administrador activo. Para cambiar su rol, primero asigne otro Administrador en el sistema."
                />
              </div>
            )}
          </div>

          {/* Active status checkbox */}
          <div className="pt-1">
            <label
              htmlFor="checkbox-edit-user-active"
              className={`flex items-start gap-2.5 p-3 rounded-xl border transition-colors ${
                isEditingCurrent || isEditingOnlyAdmin
                  ? 'bg-gray-50 border-gray-200 opacity-80 cursor-not-allowed'
                  : 'bg-white border-[#F2D6DE] hover:bg-[#FBECEF]/20 cursor-pointer'
              }`}
            >
              <input
                id="checkbox-edit-user-active"
                type="checkbox"
                checked={formActive}
                disabled={isEditingCurrent || isEditingOnlyAdmin}
                onChange={(e) => setFormActive(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-[#681B2B] rounded border-[#F2D6DE] focus:ring-[#681B2B] cursor-pointer disabled:cursor-not-allowed"
              />
              <div>
                <span className="text-xs font-bold text-[#2C1E23] block">
                  Usuario Activo
                </span>
                <span className="text-[11px] text-[#7D6871] block leading-snug">
                  {isEditingCurrent
                    ? 'No puede desactivar su propia cuenta activa de administrador.'
                    : isEditingOnlyAdmin
                    ? 'No puede desactivar al único Administrador activo del sistema.'
                    : 'Al estar inactivo, se impedirá inmediatamente su inicio de sesión en el sistema.'}
                </span>
              </div>
            </label>
          </div>

          {/* Security policy: Never show existing password. Option to set a new temporary password if forgotten */}
          <div className="pt-2 border-t border-[#F2D6DE]/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#2C1E23] flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#681B2B]" />
                Seguridad de Contraseña
              </span>
              <button
                type="button"
                id="btn-toggle-reset-password"
                onClick={() => {
                  setEnableResetPassword(!enableResetPassword);
                  if (!enableResetPassword) {
                    setEditTempPassword(generateRandomTempPassword());
                  } else {
                    setEditTempPassword('');
                  }
                }}
                className="text-[11px] font-bold text-[#681B2B] hover:underline cursor-pointer"
              >
                {enableResetPassword ? 'Cancelar reseteo' : 'Asignar nueva contraseña temporal'}
              </button>
            </div>

            <p className="text-[11px] text-[#7D6871] leading-relaxed">
              🔒 Por política de seguridad, las contraseñas existentes <strong>nunca son visibles ni recuperables</strong>.
            </p>

            {enableResetPassword && (
              <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                <label className="block text-[11px] font-bold text-amber-950">
                  Nueva Contraseña Temporal Funcional:
                </label>
                <div className="relative">
                  <input
                    id="input-edit-temp-password"
                    type={showEditPassword ? 'text' : 'password'}
                    value={editTempPassword}
                    onChange={(e) => setEditTempPassword(e.target.value)}
                    placeholder="Contraseña temporal"
                    className="w-full pl-3 pr-10 py-1.5 font-mono text-xs rounded-lg border border-amber-300 bg-white text-amber-950 outline-none focus:ring-2 focus:ring-[#681B2B]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-800"
                  >
                    {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <FormFieldError id="error-edit-password" error={formErrors.password} />
                <p className="text-[10px] text-amber-800">
                  ⚠️ Esta acción requerirá que el usuario configure una nueva contraseña en su próximo inicio de sesión. No se enviará ningún correo; entréguela directamente al colaborador.
                </p>
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* ============================================================ */}
      {/* CONFIRM MODAL: DESACTIVACIÓN DE USUARIO                      */}
      {/* “¿Desea desactivar a [nombre]? Ya no podrá iniciar sesión      */}
      {/*  hasta que vuelva a activarse.”                              */}
      {/* ============================================================ */}
      <ConfirmDialog
        isOpen={Boolean(userToDeactivate)}
        onClose={() => {
          setUserToDeactivate(null);
          setPendingSavePayload(null);
        }}
        onConfirm={handleConfirmDeactivation}
        title="Desactivar usuario"
        message={
          userToDeactivate
            ? `¿Desea desactivar a ${userToDeactivate.name}? Ya no podrá iniciar sesión hasta que vuelva a activarse.`
            : ''
        }
        confirmText="Desactivar"
        cancelText="Cancelar"
        type="warning"
      />
    </div>
  );
};
