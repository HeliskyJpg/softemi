import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  User as UserIcon,
  Shield,
  Mail,
  CheckCircle2,
  Lock,
  Edit2,
  Save,
  X,
  Clock,
  Sparkles,
  Calendar,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { currentUser, updateUserProfile, addToast, setActiveView } = useApp();

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

  return (
    <div id="profile-view-container" className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2C1E23] tracking-tight flex items-center gap-2">
            <UserIcon className="w-6 h-6 text-[#681B2B]" />
            Perfil de Usuario
          </h1>
          <p className="text-xs sm:text-sm text-[#7D6871] mt-0.5 font-medium">
            Información de la cuenta, rol y permisos de acceso en EMILA Floristería.
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
            Editar Información
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: User Identity Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#F2D6DE]/60 shadow-xs flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-[#681B2B] text-white flex items-center justify-center text-3xl font-extrabold shadow-md border-4 border-[#FBECEF]">
              {currentUser.name.charAt(0)}
            </div>
            <div
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white shadow-xs"
              title="Cuenta Activa"
            >
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[#2C1E23]">{currentUser.name}</h2>
            <p className="text-xs font-semibold text-[#7D6871] mt-0.5">@{currentUser.username}</p>
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FBECEF] text-[#681B2B] text-xs font-bold border border-[#F2D6DE]">
              <Shield className="w-3.5 h-3.5" />
              Rol: {currentUser.role}
            </div>
          </div>

          <div className="w-full pt-4 border-t border-[#F2D6DE]/40 text-xs space-y-2.5 text-left">
            <div className="flex items-center justify-between text-[#7D6871]">
              <span className="font-medium">Estado de la cuenta:</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                {currentUser.active ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[#7D6871]">
              <span className="font-medium">Tipo de acceso:</span>
              <span className="text-[#2C1E23] font-semibold">
                {isAdmin ? 'Acceso Administrativo Total' : 'Operación de Taller y Pedidos'}
              </span>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => setActiveView('users')}
              className="w-full mt-2 py-2 px-3 rounded-xl border border-[#F2D6DE] bg-[#FBECEF]/30 hover:bg-[#FBECEF] text-[#681B2B] text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              Administrar todos los usuarios
            </button>
          )}
        </div>

        {/* Right: Personal Information & Permissions Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Data Form / View */}
          <div className="bg-white rounded-2xl p-6 border border-[#F2D6DE]/60 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#F2D6DE]/40 pb-3">
              <h3 className="text-sm font-bold text-[#2C1E23] uppercase tracking-wider flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-[#681B2B]" />
                Datos de la Cuenta
              </h3>
              {isEditing && (
                <span className="text-xs text-[#681B2B] font-semibold">Modo Edición</span>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#2C1E23] mb-1">
                      Nombre Completo <span className="text-red-500">*</span>
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
                      Nombre de Usuario
                    </label>
                    <input
                      type="text"
                      disabled
                      value={`@${currentUser.username}`}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                      title="El nombre de usuario solo puede ser modificado por un Administrador en Gestión de Usuarios"
                    />
                    <span className="text-[10px] text-[#7D6871] mt-0.5 block">
                      Identificador de inicio de sesión
                    </span>
                  </div>
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
                      id="input-profile-email"
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="usuario@emila.com"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20 outline-none text-[#2C1E23]"
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
                    Guardar Cambios
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-[#FBECEF]/20 border border-[#F2D6DE]/60">
                  <span className="text-[10px] font-bold text-[#7D6871] uppercase block">
                    Nombre Completo
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
                    Correo Electrónico
                  </span>
                  <p className="font-medium text-[#2C1E23] mt-0.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#681B2B]" />
                    {currentUser.email || 'No registrado'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FBECEF]/20 border border-[#F2D6DE]/60">
                  <span className="text-[10px] font-bold text-[#7D6871] uppercase block">
                    Rol en Sistema
                  </span>
                  <p className="font-bold text-[#681B2B] mt-0.5 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    {currentUser.role}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Security & Credentials Notice (OWASP Alignment) */}
          <div className="bg-white rounded-2xl p-5 border border-[#F2D6DE]/60 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-[#8C7A82] uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-700" />
              Seguridad y Privacidad de Credenciales
            </h3>
            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                Protección activa de contraseñas
              </p>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Por políticas de seguridad y buenas prácticas de protección de datos (OWASP), las contraseñas nunca son expuestas, almacenadas en texto plano ni devueltas al navegador.
              </p>
            </div>
          </div>

          {/* Functional Permissions Table for this user */}
          <div className="bg-white rounded-2xl p-5 border border-[#F2D6DE]/60 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-[#8C7A82] uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#681B2B]" />
              Permisos Asignados a tu Rol ({currentUser.role})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                <span className="text-[#2C1E23]">Recepción y creación de pedidos</span>
                <span className="font-bold text-emerald-700">✓ Autorizado</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                <span className="text-[#2C1E23]">Actualización de estados y cobros</span>
                <span className="font-bold text-emerald-700">✓ Autorizado</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                <span className="text-[#2C1E23]">Consulta de catálogo y stock</span>
                <span className="font-bold text-emerald-700">✓ Autorizado</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                <span className="text-[#2C1E23]">Ajuste manual de inventario</span>
                {isAdmin ? (
                  <span className="font-bold text-emerald-700">✓ Autorizado</span>
                ) : (
                  <span className="font-bold text-rose-600">✗ Solo Admin</span>
                )}
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between sm:col-span-2">
                <span className="text-[#2C1E23]">Gestión de cuentas de usuarios y roles</span>
                {isAdmin ? (
                  <span className="font-bold text-emerald-700">✓ Autorizado</span>
                ) : (
                  <span className="font-bold text-rose-600">✗ Solo Admin</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
