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
} from 'lucide-react';
import { SystemUser, UserRole } from '../../types';

export const UsersView: React.FC = () => {
  const { users, currentUser, addUser, updateUser, addToast, switchUserRole } = useApp();

  const isAdmin = currentUser?.role === 'Administrador';

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);

  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
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
            Este módulo requiere privilegios de <strong>Administrador</strong> para gestionar cuentas, credenciales y permisos del personal. Tu usuario actual tiene rol <strong>Colaborador</strong>.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={() => switchUserRole('Administrador')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#681B2B] hover:bg-[#531422] text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" />
            Cambiar a Administrador (Modo Demo)
          </button>
        </div>
      </div>
    );
  }

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormName('');
    setFormUsername('');
    setFormPassword('');
    setFormRole('Colaborador');
    setFormActive(true);
    setShowModal(true);
  };

  const handleOpenEdit = (user: SystemUser) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormUsername(user.username);
    setFormPassword(user.password || 'demo123');
    setFormRole(user.role);
    setFormActive(user.active);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUsername.trim() || !formPassword.trim()) {
      addToast('Todos los campos son obligatorios.', 'error');
      return;
    }

    if (editingUser) {
      updateUser(editingUser.id, {
        name: formName.trim(),
        username: formUsername.trim(),
        password: formPassword.trim(),
        role: formRole,
        active: formActive,
      });
    } else {
      addUser({
        name: formName.trim(),
        username: formUsername.trim(),
        password: formPassword.trim(),
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
          <p className="text-xs sm:text-sm text-[#7D6871] mt-0.5">
            Gestión de cuentas del personal, asignación de permisos y control de acceso.
          </p>
        </div>

        <button
          id="btn-new-user"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#681B2B] hover:bg-[#531422] text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          + Nuevo Usuario
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-[#F2D6DE]/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FBECEF]/30 border-b border-[#F2D6DE]/60 text-[#7D6871] uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-bold">Nombre Completo</th>
                <th className="py-3.5 px-4 font-bold">Usuario</th>
                <th className="py-3.5 px-4 font-bold">Rol Asignado</th>
                <th className="py-3.5 px-4 font-bold text-center">Estado</th>
                <th className="py-3.5 px-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2D6DE]/30">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#FBECEF]/20 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-[#2C1E23]">{u.name}</div>
                    {u.id === currentUser?.id && (
                      <span className="text-[10px] text-[#681B2B] font-semibold">
                        (Tu sesión actual)
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-[#7D6871]">@{u.username}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        u.role === 'Administrador'
                          ? 'bg-[#FBECEF] text-[#681B2B] border border-[#F2D6DE]'
                          : 'bg-[#F2D6DE]/30 text-[#2C1E23]'
                      }`}
                    >
                      <Shield className="w-3 h-3" />
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {u.active ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        <XCircle className="w-3.5 h-3.5" />
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="px-2.5 py-1.5 rounded-lg border border-[#F2D6DE]/60 bg-white text-[#681B2B] hover:bg-[#681B2B] hover:text-white font-medium text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions Matrix Reference Card */}
      <div className="bg-white rounded-2xl p-5 border border-[#F2D6DE]/60 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-[#2C1E23] flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#681B2B]" />
          Matriz de Permisos por Rol en EMILA
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-[#F2D6DE]/40 rounded-xl overflow-hidden">
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
      {/* MODAL: CREAR / EDITAR USUARIO */}
      {/* ============================================================ */}
      {showModal && (
        <div
          id="modal-user-form"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#F2D6DE]/60 relative animate-in fade-in">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-[#7D6871] hover:text-[#2C1E23] p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-[#2C1E23] mb-1">
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h3>
            <p className="text-xs text-[#7D6871] mb-4">
              Configure credenciales y rol en el sistema EMILA.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
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
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#F2D6DE]/60 focus:ring-2 focus:ring-[#681B2B]/20 outline-none"
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
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#F2D6DE]/60 focus:ring-2 focus:ring-[#681B2B]/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C1E23] mb-1">
                  Contraseña <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-user-password"
                  type="text"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#F2D6DE]/60 focus:ring-2 focus:ring-[#681B2B]/20 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C1E23] mb-1">Rol Asignado</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#F2D6DE]/60 focus:ring-2 focus:ring-[#681B2B]/20 outline-none bg-white font-medium text-[#2C1E23]"
                >
                  <option value="Colaborador">Colaborador (Recepción y Taller)</option>
                  <option value="Administrador">Administrador (Acceso Total)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  id="checkbox-user-active"
                  type="checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="w-4 h-4 text-[#681B2B] rounded border-[#F2D6DE] focus:ring-[#681B2B]"
                />
                <label htmlFor="checkbox-user-active" className="text-xs font-medium text-[#2C1E23]">
                  Usuario Activo (permite iniciar sesión)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#F2D6DE]/40">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-[#7D6871] hover:bg-[#FBECEF]/40 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  id="btn-save-user-form"
                  type="submit"
                  className="px-5 py-2 text-xs font-medium bg-[#681B2B] hover:bg-[#531422] text-white rounded-xl shadow-xs cursor-pointer"
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

