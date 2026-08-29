import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  UserCheck,
  Shield,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  X,
  Lock,
  Mail,
  Power,
  Info,
} from 'lucide-react';
import { SystemUser, UserRole } from '../../types';

export const UsersView: React.FC = () => {
  const { users, currentUser, addUser, updateUser, toggleUserActive, addToast, switchUserRole } = useApp();

  const isAdmin = currentUser?.role === 'Administrador';

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);

  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('Colaborador');
  const [formActive, setFormActive] = useState(true);

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto p-8 sm:p-12 text-center bg-white rounded-2xl border border-[#F2D6DE]/60 shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#FBECEF] text-[#681B2B] flex items-center justify-center mx-auto">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#2C1E23]">Módulo de Usuarios y Roles</h2>
          <p className="text-xs text-[#7D6871] mt-1 max-w-md mx-auto">
            Este módulo requiere privilegios de <strong>Administrador</strong> para gestionar cuentas, personal y control de acceso en EMILA Floristería. Tu usuario actual tiene rol <strong>Colaborador</strong>.
          </p>
        </div>

        <div className="pt-2">
          <button
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

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormName('');
    setFormUsername('');
    setFormEmail('');
    setFormRole('Colaborador');
    setFormActive(true);
    setShowModal(true);
  };

  const handleOpenEdit = (user: SystemUser) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormUsername(user.username);
    setFormEmail(user.email || '');
    setFormRole(user.role);
    setFormActive(user.active);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUsername.trim()) {
      addToast('El nombre y el usuario son obligatorios.', 'error');
      return;
    }

    if (editingUser) {
      updateUser(editingUser.id, {
        name: formName.trim(),
        username: formUsername.trim(),
        email: formEmail.trim(),
        role: formRole,
        active: formActive,
      });
    } else {
      addUser({
        name: formName.trim(),
        username: formUsername.trim(),
        email: formEmail.trim(),
        role: formRole,
        active: formActive,
      });
    }
    setShowModal(false);
  };

  return (
    <div id="users-view-container" className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2C1E23] tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-[#681B2B]" />
            Control de Usuarios y Roles
          </h1>
          <p className="text-xs sm:text-sm text-[#7D6871] mt-0.5 font-medium">
            Gestión de cuentas del personal, asignación de permisos y control de acceso.
          </p>
        </div>

        <button
          id="btn-new-user"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#681B2B] hover:bg-[#531422] text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Nuevo Usuario
        </button>
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

                        {!isCurrent && (
                          <button
                            id={`btn-toggle-active-user-${u.id}`}
                            onClick={() => toggleUserActive(u.id)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              u.active
                                ? 'border-gray-200 text-[#7D6871] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                            title={u.active ? 'Desactivar acceso' : 'Reactivar acceso'}
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

                  {!isCurrent && (
                    <button
                      onClick={() => toggleUserActive(u.id)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                        u.active
                          ? 'border-gray-200 text-[#7D6871] hover:bg-rose-50 hover:text-rose-600'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
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
        <h3 className="text-sm font-bold text-[#2C1E23] flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#681B2B]" />
          Matriz de Permisos por Rol en EMILA
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-[#F2D6DE]/40 rounded-xl overflow-hidden min-w-[340px]">
            <thead className="bg-[#FBECEF]/30 text-[#7D6871] uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Módulo / Acción</th>
                <th className="py-2.5 px-3 text-center">Colaborador (Empleado)</th>
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
                <td className="py-2 px-3 text-center text-rose-600 font-bold">✗ Oculto</td>
                <td className="py-2 px-3 text-center text-emerald-700 font-bold">✓ Permitido</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL: CREAR / EDITAR USUARIO (SIN EXPOSICIÓN DE PASSWORD) */}
      {/* ============================================================ */}
      {showModal && (
        <div
          id="modal-user-form"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#F2D6DE]/60 relative animate-in fade-in max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-[#7D6871] hover:text-[#2C1E23] p-1.5 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-[#2C1E23] mb-0.5 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#681B2B]" />
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h3>
            <p className="text-xs text-[#7D6871] mb-4">
              Configure los datos de identificación y nivel de acceso en EMILA.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2C1E23] mb-1">
                  Nombre Completo <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-user-name"
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej. Sofía Valenzuela"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20 outline-none text-[#2C1E23]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C1E23] mb-1">
                  Nombre de Usuario (Login) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-user-username"
                  type="text"
                  required
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="Ej. svalenzuela"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20 outline-none text-[#2C1E23]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C1E23] mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7D6871]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="input-user-email"
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="usuario@emila.com"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20 outline-none text-[#2C1E23]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C1E23] mb-1">Rol Asignado</label>
                <select
                  id="select-user-role"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20 outline-none bg-white font-medium text-[#2C1E23] cursor-pointer"
                >
                  <option value="Colaborador">Colaborador (Recepción y Taller)</option>
                  <option value="Administrador">Administrador (Acceso Total)</option>
                </select>
              </div>

              {/* Security info banner instead of password fields */}
              <div className="p-3 rounded-xl bg-[#FBECEF]/40 border border-[#F2D6DE] text-xs text-[#681B2B] flex items-start gap-2">
                <Lock className="w-4 h-4 shrink-0 mt-0.5 text-[#681B2B]" />
                <p className="text-[11px] leading-relaxed">
                  Las credenciales de acceso se gestionan de forma cifrada e independiente. Ninguna contraseña es expuesta ni precargada en el navegador.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="checkbox-user-active"
                  type="checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="w-4 h-4 text-[#681B2B] rounded border-[#F2D6DE] focus:ring-[#681B2B] cursor-pointer"
                />
                <label htmlFor="checkbox-user-active" className="text-xs font-medium text-[#2C1E23] cursor-pointer">
                  Usuario Activo (permite iniciar sesión en el sistema)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#F2D6DE]/40">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-[#7D6871] hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-save-user-form"
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#681B2B] hover:bg-[#531422] text-white rounded-xl shadow-xs cursor-pointer"
                >
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
