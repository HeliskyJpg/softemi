import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  UserCheck,
  Shield,
  Edit2,
  CheckCircle2,
  XCircle,
  X,
  Mail,
  Power,
  AlertTriangle,
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
  const { users, currentUser, updateUser, toggleUserActive, addToast, switchUserRole } = useApp();

  const isAdmin = currentUser?.role === 'Administrador';

  // Modal State for Editing Allowed User Info Only (No user creation flow)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);

  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('Colaborador');
  const [formActive, setFormActive] = useState(true);
  const [formErrors, setFormErrors] = useState<{ name?: string; username?: string; general?: string }>({});

  // Confirmation Modal State for User Deactivation (Rule 8)
  const [userToDeactivate, setUserToDeactivate] = useState<SystemUser | null>(null);
  const [pendingSavePayload, setPendingSavePayload] = useState<{ id: string; data: Partial<SystemUser> } | null>(null);

  // Active administrators counter for system integrity (Rule 9)
  const activeAdminsCount = useMemo(() => {
    return users.filter((u) => u.role === 'Administrador' && u.active).length;
  }, [users]);

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
            Este módulo requiere privilegios de <strong>Administrador</strong> para gestionar cuentas existentes y niveles de acceso en EMILA Floristería. Tu usuario actual tiene rol <strong>Colaborador</strong>.
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

  // Open Edit User Modal
  const handleOpenEdit = (user: SystemUser) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormUsername(user.username);
    setFormEmail(user.email || '');
    setFormRole(user.role);
    setFormActive(user.active);
    setFormErrors({});
    setShowEditModal(true);
  };

  // Trigger Deactivation confirmation for row action (Rule 8 & 9)
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

  // Toggle user activation directly if inactive (activating does not require deactivation warning)
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

    const errors: { name?: string; username?: string; general?: string } = {};

    if (!formName.trim()) {
      errors.name = 'El nombre completo es obligatorio.';
    }

    if (!formUsername.trim()) {
      errors.username = 'El nombre de usuario es obligatorio.';
    }

    const isCurrent = editingUser.id === currentUser?.id;
    const isOnlyActiveAdmin = editingUser.role === 'Administrador' && editingUser.active && activeAdminsCount <= 1;

    // Safety checks (Rule 9)
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
      username: formUsername.trim().toLowerCase().replace(/\s+/g, ''),
      email: formEmail.trim(),
      role: formRole,
      active: formActive,
    };

    // If user was active and is being set to inactive, show confirmation modal (Rule 8)
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
            Gestión de cuentas existentes de demostración, asignación de roles y control de acceso.
          </p>
        </div>

        {/* System Administrators badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-[#FBECEF]/60 border border-[#F2D6DE]/60 text-xs font-semibold text-[#681B2B]">
          <Shield className="w-4 h-4" />
          <span>{activeAdminsCount} {activeAdminsCount === 1 ? 'Administrador activo' : 'Administradores activos'}</span>
        </div>
      </div>

      {/* Users List Container */}
      <div className="bg-white rounded-2xl border border-[#F2D6DE]/60 shadow-xs overflow-hidden">
        {/* Desktop Table View (md and up) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FBECEF]/30 border-b border-[#F2D6DE]/60 text-[#7D6871] uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-bold">Nombre Completo</th>
                <th className="py-3.5 px-4 font-bold">Usuario / Correo</th>
                <th className="py-3.5 px-4 font-bold">Rol Asignado</th>
                <th className="py-3.5 px-4 font-bold text-center">Estado</th>
                <th className="py-3.5 px-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2D6DE]/30">
              {users.map((u) => {
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
                          <div className="font-bold text-[#2C1E23]">{u.name}</div>
                          {isCurrent && (
                            <span className="text-[10px] text-[#681B2B] font-bold">
                              (Tu sesión actual)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#2C1E23]">@{u.username}</div>
                      {u.email && <div className="text-[11px] text-[#7D6871]">{u.email}</div>}
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
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          id={`btn-edit-user-${u.id}`}
                          onClick={() => handleOpenEdit(u)}
                          className="px-3 py-1.5 rounded-lg border border-[#F2D6DE] bg-white text-[#681B2B] hover:bg-[#681B2B] hover:text-white font-semibold text-xs transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
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
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              u.active
                                ? 'border-gray-200 text-[#7D6871] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                            title={u.active ? 'Desactivar usuario' : 'Reactivar usuario'}
                            aria-label={u.active ? `Desactivar a ${u.name}` : `Activar a ${u.name}`}
                          >
                            <Power className="w-3.5 h-3.5" />
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

        {/* Mobile Card List View (Phones & Small screens) */}
        <div className="block md:hidden divide-y divide-[#F2D6DE]/40 p-3 space-y-3">
          {users.map((u) => {
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
                      <h3 className="font-bold text-[#2C1E23] text-sm leading-tight">{u.name}</h3>
                      <p className="text-xs text-[#7D6871] font-medium">@{u.username}</p>
                    </div>
                  </div>

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

                  {isCurrent && (
                    <span className="text-[11px] text-[#681B2B] font-bold">
                      (Tu sesión actual)
                    </span>
                  )}
                </div>

                {u.email && (
                  <p className="text-xs text-[#7D6871] flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#681B2B]" />
                    {u.email}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F2D6DE]/30">
                  <button
                    onClick={() => handleOpenEdit(u)}
                    className="flex-1 py-2 px-3 rounded-xl border border-[#F2D6DE] bg-[#FBECEF]/30 hover:bg-[#FBECEF] text-[#681B2B] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar Datos
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
                <td className="py-2 px-3 font-medium">Gestión de Usuarios y Roles</td>
                <td className="py-2 px-3 text-center text-rose-600 font-bold">✗ Restringido</td>
                <td className="py-2 px-3 text-center text-emerald-700 font-bold">✓ Permitido</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL: EDITAR USUARIO (ACCIONES ESTRICTAMENTE PERMITIDAS)     */}
      {/* NUNCA MOSTRAR, RECUPERAR NI PRECARGAR CONTRASEÑAS            */}
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
                  <SystemAlert
                    id="alert-user-form-error"
                    type="warning"
                    message={formErrors.general}
                  />
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
        </form>
      </Modal>

      {/* ============================================================ */}
      {/* CONFIRM MODAL: DESACTIVACIÓN DE USUARIO (REQUERIMIENTO 8)    */}
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
