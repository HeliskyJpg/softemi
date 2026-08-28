import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  User,
  Shield,
  RotateCcw,
  LogOut,
  ChevronDown,
  Menu,
  Sparkles,
} from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';

interface NavbarProps {
  onToggleSidebar?: () => void;
  onToggleMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onToggleMobileSidebar }) => {
  const { currentUser, logout, switchUserRole, resetDemoData, setActiveView } = useApp();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleToggleMenu = onToggleMobileSidebar || onToggleSidebar || (() => {});

  if (!currentUser) return null;

  const isColaborador = currentUser.role === 'Colaborador';

  return (
    <header className="bg-white border-b border-[#FBDAE3] sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section: Toggle & Brand */}
          <div className="flex items-center gap-3">
            <button
              id="btn-toggle-mobile-sidebar"
              onClick={handleToggleMenu}
              className="lg:hidden p-2 rounded-xl text-[#6D5C64] hover:text-[#3A2D33] hover:bg-[#FFF7FA] transition-colors"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div
              id="brand-logo-container"
              onClick={() => setActiveView('dashboard')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <img
                src="/emila-logo.png"
                alt="EMILA Floristería - Logo Oficial"
                className="w-10 h-10 object-contain rounded-full shadow-xs group-hover:scale-105 transition-transform shrink-0"
                referrerPolicy="no-referrer"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold tracking-tight text-[#8E315E]">EMILA</span>
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[#FBDAE3] text-[#8E315E] hidden sm:inline-block">
                    Floristería
                  </span>
                </div>
                <p className="text-[11px] text-[#6D5C64] leading-none hidden sm:block">
                  Gestión Administrativa de Pedidos
                </p>
              </div>
            </div>
          </div>

          {/* Right section: Role switcher, Reset Data, and User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Role Switcher for Academic Demo / Validation */}
            <div
              id="demo-role-switcher"
              className="hidden md:flex items-center bg-[#FFF7FA] border border-[#FBDAE3] rounded-xl p-1 text-xs"
              title="Cambia de rol para simular permisos del Administrador o Colaborador"
            >
              <span className="text-[#6D5C64] px-2 font-medium flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-[#8E315E]" />
                Rol:
              </span>
              <button
                id="btn-switch-role-colaborador"
                onClick={() => switchUserRole('Colaborador')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  isColaborador
                    ? 'bg-[#8E315E] text-white shadow-xs'
                    : 'text-[#6D5C64] hover:text-[#3A2D33]'
                }`}
              >
                Colaborador
              </button>
              <button
                id="btn-switch-role-admin"
                onClick={() => switchUserRole('Administrador')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  !isColaborador
                    ? 'bg-[#8E315E] text-white shadow-xs'
                    : 'text-[#6D5C64] hover:text-[#3A2D33]'
                }`}
              >
                Administrador
              </button>
            </div>

            {/* Reset Demo Data Button */}
            <button
              id="btn-reset-demo-data"
              onClick={() => setShowResetConfirm(true)}
              className="p-2 text-[#6D5C64] hover:text-[#8E315E] hover:bg-[#FFF7FA] rounded-xl transition-colors flex items-center gap-1.5 text-xs font-medium border border-transparent hover:border-[#FBDAE3]"
              title="Reiniciar datos de prueba a valores iniciales"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden xl:inline">Reiniciar Datos</span>
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                id="btn-user-profile-menu"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1.5 pl-2 rounded-xl bg-[#FFF7FA] hover:bg-[#FBDAE3]/40 border border-[#FBDAE3] transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-[#8E315E] text-white flex items-center justify-center text-xs font-bold">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-[#3A2D33] leading-tight flex items-center gap-1">
                    {currentUser.name.split(' ')[0]}
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                        currentUser.role === 'Administrador'
                          ? 'bg-[#8E315E]/15 text-[#8E315E]'
                          : 'bg-[#65733D]/15 text-[#65733D]'
                      }`}
                    >
                      {currentUser.role}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#6D5C64]" />
              </button>

              {showUserDropdown && (
                <div
                  id="user-dropdown-menu"
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#FBDAE3] py-2 z-50 animate-in fade-in slide-in-from-top-2"
                >
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs font-bold text-[#3A2D33]">{currentUser.name}</p>
                    <p className="text-[11px] text-[#6D5C64]">@{currentUser.username}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] text-emerald-700 font-medium">
                        Rol: {currentUser.role}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Role Switcher inside dropdown */}
                  <div className="px-4 py-2 md:hidden border-b border-gray-100">
                    <p className="text-[11px] font-semibold text-[#6D5C64] mb-1.5">Cambiar Rol:</p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          switchUserRole('Colaborador');
                          setShowUserDropdown(false);
                        }}
                        className={`flex-1 py-1 text-xs rounded-md ${
                          isColaborador ? 'bg-[#8E315E] text-white' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        Colaborador
                      </button>
                      <button
                        onClick={() => {
                          switchUserRole('Administrador');
                          setShowUserDropdown(false);
                        }}
                        className={`flex-1 py-1 text-xs rounded-md ${
                          !isColaborador ? 'bg-[#8E315E] text-white' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        Admin
                      </button>
                    </div>
                  </div>

                  <button
                    id="btn-nav-to-profile"
                    onClick={() => {
                      setActiveView('profile');
                      setShowUserDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-[#3A2D33] hover:bg-[#FFF7FA] flex items-center gap-2 font-medium"
                  >
                    <User className="w-4 h-4 text-[#8E315E]" />
                    Mi Perfil
                  </button>

                  <button
                    id="btn-nav-logout"
                    onClick={() => {
                      setShowUserDropdown(false);
                      logout();
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-[#9B2C2C] hover:bg-red-50 flex items-center gap-2 font-medium border-t border-gray-100 mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={() => {
          resetDemoData();
          setShowResetConfirm(false);
        }}
        title="¿Reiniciar datos del prototipo?"
        message="Esta acción restaurará los 10 pedidos iniciales, 12 componentes con su stock base, 8 clientes y usuarios de demostración. Los cambios locales se restablecerán."
        confirmText="Sí, reiniciar datos"
        cancelText="Cancelar"
        type="warning"
      />
    </header>
  );
};
