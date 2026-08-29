import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  User as UserIcon,
  Shield,
  Mail,
  Check,
  Edit2,
  Save,
  X,
  CheckCircle2,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { currentUser, updateUserProfile, addToast } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(currentUser?.name || '');
  const [emailInput, setEmailInput] = useState(currentUser?.email || '');

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'Administrador';

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      addToast('El nombre completo es obligatorio.', 'error');
      return;
    }

    updateUserProfile(nameInput.trim(), emailInput.trim());
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setNameInput(currentUser.name);
    setEmailInput(currentUser.email || '');
    setIsEditing(false);
  };

  // Role permissions list tailored strictly to the authenticated user
  const adminPermissions = [
    'Recepción y creación de pedidos',
    'Actualización de estados y cobros',
    'Consulta de catálogo y stock',
    'Registro y consulta de clientes',
    'Ajuste manual de existencias',
    'Gestión de usuarios y roles',
    'Consulta de reportes y estadísticas',
  ];

  const collaboratorPermissions = [
    'Recepción y creación de pedidos',
    'Actualización de estados y cobros',
    'Consulta de catálogo y stock',
    'Registro y consulta de clientes',
  ];

  const currentPermissions = isAdmin ? adminPermissions : collaboratorPermissions;

  return (
    <div id="profile-view-container" className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2C1E23] tracking-tight flex items-center gap-2">
            <UserIcon className="w-6 h-6 text-[#681B2B]" />
            Mi perfil
          </h1>
          <p className="text-xs sm:text-sm text-[#7D6871] mt-0.5 font-medium">
            Consulta la información de tu cuenta y los permisos asociados a tu rol.
          </p>
        </div>

        {!isEditing && (
          <button
            id="btn-edit-profile"
            onClick={() => {
              setNameInput(currentUser.name);
              setEmailInput(currentUser.email || '');
              setIsEditing(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#681B2B] hover:bg-[#541421] text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer self-start sm:self-auto"
          >
            <Edit2 className="w-4 h-4" />
            Editar información
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Simplified User Identity Summary */}
        <div className="bg-white rounded-2xl p-6 border border-[#F2D6DE]/60 shadow-xs flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-[#681B2B] text-white flex items-center justify-center text-2xl font-extrabold shadow-sm border-4 border-[#FBECEF]">
              {currentUser.name.charAt(0)}
            </div>
            {currentUser.active && (
              <div
                className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white shadow-xs"
                title="Cuenta Activa"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            )}
          </div>

          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#2C1E23]">{currentUser.name}</h2>
            <p className="text-xs font-semibold text-[#7D6871] mt-0.5">@{currentUser.username}</p>
          </div>

          <div className="w-full pt-4 border-t border-[#F2D6DE]/40 text-xs space-y-3 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[#7D6871] font-medium">Rol</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FBECEF] text-[#681B2B] text-xs font-bold border border-[#F2D6DE]">
                <Shield className="w-3 h-3" />
                {currentUser.role}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#7D6871] font-medium">Estado</span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  currentUser.active
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {currentUser.active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Account Data & Role Permissions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Account Data */}
          <div className="bg-white rounded-2xl p-6 border border-[#F2D6DE]/60 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#F2D6DE]/40 pb-3">
              <h3 className="text-sm font-bold text-[#2C1E23] uppercase tracking-wider flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-[#681B2B]" />
                Datos de la cuenta
              </h3>
              {isEditing && (
                <span className="text-xs text-[#681B2B] font-semibold">Editando datos</span>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="input-profile-name" className="block text-xs font-bold text-[#2C1E23] mb-1">
                      Nombre completo <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-profile-name"
                      type="text"
                      required
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20 outline-none text-[#2C1E23]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2C1E23] mb-1">
                      Usuario
                    </label>
                    <input
                      type="text"
                      disabled
                      value={`@${currentUser.username}`}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 bg-gray-50 text-[#7D6871] cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="input-profile-email" className="block text-xs font-bold text-[#2C1E23] mb-1">
                      Correo electrónico
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7D6871]">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="input-profile-email"
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="ejemplo@emila.com"
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20 outline-none text-[#2C1E23]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2C1E23] mb-1">
                      Rol
                    </label>
                    <input
                      type="text"
                      disabled
                      value={currentUser.role}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 bg-gray-50 text-[#7D6871] cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F2D6DE]/40">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-xs font-medium text-[#7D6871] hover:bg-gray-100 rounded-xl cursor-pointer flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancelar
                  </button>
                  <button
                    id="btn-save-profile"
                    type="submit"
                    className="px-5 py-2 text-xs font-bold bg-[#681B2B] hover:bg-[#541421] text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Guardar cambios
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#FBECEF]/20 border border-[#F2D6DE]/60">
                  <span className="text-[10px] font-bold text-[#7D6871] uppercase block">
                    Nombre completo
                  </span>
                  <p className="font-bold text-[#2C1E23] text-sm mt-0.5">{currentUser.name}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FBECEF]/20 border border-[#F2D6DE]/60">
                  <span className="text-[10px] font-bold text-[#7D6871] uppercase block">
                    Usuario
                  </span>
                  <p className="font-bold text-[#2C1E23] text-sm mt-0.5">@{currentUser.username}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FBECEF]/20 border border-[#F2D6DE]/60">
                  <span className="text-[10px] font-bold text-[#7D6871] uppercase block">
                    Correo electrónico
                  </span>
                  <p className="font-medium text-[#2C1E23] mt-0.5 flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-[#681B2B] shrink-0" />
                    <span className="truncate">{currentUser.email || 'No registrado'}</span>
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FBECEF]/20 border border-[#F2D6DE]/60">
                  <span className="text-[10px] font-bold text-[#7D6871] uppercase block">
                    Rol
                  </span>
                  <p className="font-bold text-[#681B2B] mt-0.5 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    {currentUser.role}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Permisos de tu rol */}
          <div className="bg-white rounded-2xl p-6 border border-[#F2D6DE]/60 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-[#2C1E23] uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#681B2B]" />
              Permisos de tu rol
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
              {currentPermissions.map((permission, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#FBECEF]/20 border border-[#F2D6DE]/50 flex items-center gap-2.5"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span className="font-medium text-[#2C1E23]">{permission}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
