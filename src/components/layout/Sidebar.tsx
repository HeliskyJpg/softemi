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

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const { activeView, setActiveView, currentUser, logout } = useApp();

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
    setActiveView(viewId);
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
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#FBECEF] flex flex-col justify-between p-5 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Logo & Navigation */}
        <div className="space-y-8">
          {/* Logo Brand Header */}
          <div
            id="sidebar-brand-header"
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-3 cursor-pointer select-none group pt-1"
          >
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#F5B5C8] to-[#E39CB2] flex items-center justify-center text-white shadow-xs border border-white/60">
              <span className="font-serif text-sm tracking-wider font-semibold italic text-white">
                EMILA
              </span>
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-[#2C1E23] leading-none">
                EMILA
              </h1>
              <p className="text-[11px] text-[#7D6871] mt-1 font-medium">
                Gestión de pedidos
              </p>
            </div>
          </div>

          {/* Navigation Items List */}
          <nav className="space-y-1.5">
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
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#681B2B] text-white shadow-xs'
                      : 'text-[#4A202A] hover:bg-white/50 hover:text-[#681B2B]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-[#681B2B]/70'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: New Order Button & User Profile */}
        <div className="space-y-3 pt-4">
          {/* Primary Action Button */}
          <button
            id="btn-sidebar-new-order"
            onClick={() => handleNavClick('order-new')}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#681B2B] hover:bg-[#541421] text-white font-bold text-sm shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Nuevo pedido
          </button>

          {/* Current User Session Card */}
          <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-2.5 flex items-center justify-between border border-[#F2D6DE]/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#681B2B] text-white flex items-center justify-center text-xs font-bold shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#2C1E23] truncate leading-tight">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-[#7D6871] font-medium leading-tight mt-0.5">
                  {currentUser.role === 'Administrador' ? 'Admin' : 'Colaborador'}
                </p>
              </div>
            </div>

            <button
              id="btn-sidebar-logout"
              onClick={logout}
              className="p-1.5 rounded-lg text-[#7D6871] hover:text-[#DC2626] hover:bg-[#FBECEF] transition-colors cursor-pointer"
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

