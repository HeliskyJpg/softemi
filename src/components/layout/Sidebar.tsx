import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutGrid,
  FileText,
  Users,
  Package,
  CalendarDays,
  BarChart3,
  UserCheck,
  Plus,
  LogOut,
} from 'lucide-react';
import { ActiveView } from '../../types';
import { EmilaLogo } from '../common/EmilaLogo';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const { activeView, setActiveView, navigateToOrderNew, currentUser, logout } = useApp();

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'Administrador';

  const navItems: Array<{
    id: ActiveView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    matchViews?: ActiveView[];
    adminOnly?: boolean;
  }> = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutGrid,
    },
    {
      id: 'orders',
      label: 'Pedidos',
      icon: FileText,
      matchViews: ['orders', 'order-detail', 'order-edit'],
    },
    {
      id: 'clients',
      label: 'Clientes',
      icon: Users,
      matchViews: ['clients'],
    },
    {
      id: 'components',
      label: 'Componentes',
      icon: Package,
      matchViews: ['components'],
    },
    {
      id: 'calendar',
      label: 'Agenda',
      icon: CalendarDays,
      matchViews: ['calendar'],
    },
    {
      id: 'reports',
      label: 'Reportes',
      icon: BarChart3,
      matchViews: ['reports'],
    },
    {
      id: 'users',
      label: 'Usuarios y roles',
      icon: UserCheck,
      matchViews: ['users'],
    },
  ];

  const handleNavClick = (viewId: ActiveView) => {
    setActiveView(viewId, { clearHistory: true });
    onCloseMobile();
  };

  const handleNewOrderClick = () => {
    navigateToOrderNew(activeView);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          id="mobile-sidebar-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        id="app-main-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-[#F2D6DE] shadow-xs flex flex-col justify-between p-5 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Logo & Navigation */}
        <div className="space-y-6">
          {/* Logo Brand Header */}
          <div
            id="sidebar-brand-header"
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-3 cursor-pointer select-none group pb-4 border-b border-[#F2D6DE]/60"
          >
            <EmilaLogo size={46} variant="circle" className="shadow-xs hover:scale-105 transition-transform" />
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-[#2C1E23] leading-none">
                EMILA
              </h1>
              <p className="text-[11px] text-[#7D6871] mt-1 font-medium">
                Floristería &bull; Taller
              </p>
            </div>
          </div>

          {/* Navigation Section Title */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9C858F] px-2 block mb-2">
              Menú Principal
            </span>

            {/* Navigation Items List */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  activeView === item.id ||
                  (item.matchViews && item.matchViews.includes(activeView));

                return (
                  <button
                    key={item.id}
                    id={`sidebar-nav-${item.id}`}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#681B2B] text-white shadow-xs font-bold'
                        : 'text-[#5C3B45] hover:bg-[#FBECEF]/60 hover:text-[#681B2B]'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-white' : 'text-[#681B2B]'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Section: New Order Button & User Profile */}
        <div className="space-y-3 pt-4 border-t border-[#F2D6DE]/60">
          {/* Primary Action Button */}
          <button
            id="btn-sidebar-new-order"
            onClick={handleNewOrderClick}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#681B2B] hover:bg-[#541421] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Nuevo pedido
          </button>

          {/* Current User Session Card */}
          <div
            id="sidebar-user-card"
            onClick={() => handleNavClick('profile')}
            className={`rounded-2xl p-2.5 flex items-center justify-between border transition-all cursor-pointer ${
              activeView === 'profile'
                ? 'bg-[#681B2B] text-white border-[#681B2B] shadow-xs'
                : 'bg-[#FBECEF]/40 border-[#F2D6DE] hover:bg-[#FBECEF]'
            }`}
            title="Ver mi perfil y permisos"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  activeView === 'profile' ? 'bg-white text-[#681B2B]' : 'bg-[#681B2B] text-white'
                }`}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p
                  className={`text-xs font-bold truncate leading-tight ${
                    activeView === 'profile' ? 'text-white' : 'text-[#2C1E23]'
                  }`}
                >
                  {currentUser.name}
                </p>
                <p
                  className={`text-[10px] font-medium leading-tight mt-0.5 ${
                    activeView === 'profile' ? 'text-white/80' : 'text-[#7D6871]'
                  }`}
                >
                  {currentUser.role === 'Administrador' ? 'Admin' : 'Colaborador'} &bull; Mi Perfil
                </p>
              </div>
            </div>

            <button
              id="btn-sidebar-logout"
              onClick={(e) => {
                e.stopPropagation();
                logout();
              }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                activeView === 'profile'
                  ? 'text-white/80 hover:text-white hover:bg-white/20'
                  : 'text-[#7D6871] hover:text-[#DC2626] hover:bg-white'
              }`}
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

