import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Menu,
  ChevronDown,
  User,
  Shield,
  RotateCcw,
  LogOut,
} from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';
import { EmilaLogo } from '../common/EmilaLogo';

interface NavbarProps {
  onToggleMobileSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileSidebar }) => {
  const { currentUser, logout, switchUserRole, resetDemoData, setActiveView } = useApp();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!currentUser) return null;

  const isColaborador = currentUser.role === 'Colaborador';

  return (
    <header className="sticky top-0 z-30 bg-[#FBECEF]/90 backdrop-blur-xs px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Mobile menu trigger */}
        <div className="flex items-center gap-3 lg:hidden">
          <button
            id="btn-toggle-mobile-sidebar"
            onClick={onToggleMobileSidebar}
            className="p-2 rounded-xl text-[#681B2B] hover:bg-white/60 transition-colors cursor-pointer"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <EmilaLogo size={28} variant="circle" />
            <span className="font-bold text-base text-[#681B2B] tracking-tight">EMILA</span>
          </div>
        </div>

        {/* Desktop spacer to push right session menu */}
        <div className="hidden lg:block" />

        {/* Right Section: Session selector / User info */}
        <div className="relative">
          <button
            id="btn-user-session-toggle"
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#4A202A] hover:text-[#681B2B] py-1.5 px-3 rounded-xl hover:bg-white/60 transition-all cursor-pointer"
          >
            <span className="text-[#7D6871] font-normal">Sesión:</span>
            <span className="font-semibold text-[#2C1E23]">{currentUser.name}</span>
            <ChevronDown className="w-4 h-4 text-[#7D6871] ml-0.5" />
          </button>

          {showUserDropdown && (
            <div
              id="user-session-dropdown"
              className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-lg border border-[#F2D6DE]/70 py-2.5 z-50 animate-in fade-in slide-in-from-top-2"
            >
              <div className="px-4 py-2 border-b border-[#F2D6DE]/40">
                <p className="text-xs font-bold text-[#2C1E23]">{currentUser.name}</p>
                <p className="text-[11px] text-[#7D6871]">@{currentUser.username}</p>
                <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#FBECEF] text-[#681B2B] text-[10px] font-semibold">
                  <Shield className="w-3 h-3" />
                  Rol actual: {currentUser.role}
                </div>
              </div>

              {/* Role switch toggle */}
              <div className="px-4 py-2.5 border-b border-[#F2D6DE]/40">
                <p className="text-[11px] font-medium text-[#7D6871] mb-2">Simular Permisos de Rol:</p>
                <div className="grid grid-cols-2 gap-1.5 bg-[#FBECEF]/60 p-1 rounded-xl">
                  <button
                    onClick={() => {
                      switchUserRole('Colaborador');
                      setShowUserDropdown(false);
                    }}
                    className={`py-1 text-xs rounded-lg font-semibold transition-all ${
                      isColaborador
                        ? 'bg-[#681B2B] text-white shadow-xs'
                        : 'text-[#681B2B] hover:bg-white/60'
                    }`}
                  >
                    Colaborador
                  </button>
                  <button
                    onClick={() => {
                      switchUserRole('Administrador');
                      setShowUserDropdown(false);
                    }}
                    className={`py-1 text-xs rounded-lg font-semibold transition-all ${
                      !isColaborador
                        ? 'bg-[#681B2B] text-white shadow-xs'
                        : 'text-[#681B2B] hover:bg-white/60'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              {/* Navigation link to users if admin */}
              {currentUser.role === 'Administrador' && (
                <button
                  onClick={() => {
                    setActiveView('users');
                    setShowUserDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-[#2C1E23] hover:text-[#681B2B] hover:bg-[#FBECEF]/50 flex items-center gap-2 font-medium cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-[#681B2B]" />
                  Gestión de usuarios y roles
                </button>
              )}

              {/* Reset demo data */}
              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  setShowResetConfirm(true);
                }}
                className="w-full px-4 py-2 text-left text-xs text-[#7D6871] hover:text-[#681B2B] hover:bg-[#FBECEF]/50 flex items-center gap-2 font-medium cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reiniciar datos de prueba
              </button>

              {/* Logout button */}
              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  logout();
                }}
                className="w-full px-4 py-2 text-left text-xs text-[#DC2626] hover:bg-red-50 flex items-center gap-2 font-medium border-t border-[#F2D6DE]/40 mt-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Cerrar Sesión
              </button>
            </div>
          )}
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
        message="Esta acción restaurará los pedidos iniciales, componentes, stock y clientes de demostración. Los cambios locales se restablecerán."
        confirmText="Sí, reiniciar datos"
        cancelText="Cancelar"
        type="warning"
      />
    </header>
  );
};

