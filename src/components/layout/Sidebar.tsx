import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  ShoppingBag,
  PlusCircle,
  Users,
  Layers,
  Calendar,
  BarChart3,
  UserCheck,
  User,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { ActiveView } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const { activeView, setActiveView, currentUser, orders, components, logout } = useApp();

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'Administrador';

  // Counts for reactive badges
  const pendingOrdersCount = orders.filter(
    (o) => o.status === 'Pendiente' || o.status === 'En preparación'
  ).length;
  const lowStockCount = components.filter((c) => c.stock <= c.minStockAlert).length;

  const navItems = [
    {
      section: 'PROCESO PRINCIPAL',
      items: [
        {
          id: 'dashboard' as ActiveView,
          label: 'Dashboard',
          icon: LayoutDashboard,
          badge: null,
        },
        {
          id: 'orders' as ActiveView,
          label: 'Pedidos',
          icon: ShoppingBag,
          badge: pendingOrdersCount > 0 ? `${pendingOrdersCount} activos` : null,
          badgeClass: 'bg-[#FBDAE3] text-[#8E315E]',
        },
        {
          id: 'order-new' as ActiveView,
          label: 'Nuevo Pedido',
          icon: PlusCircle,
          badge: 'Nuevo',
          badgeClass: 'bg-[#65733D] text-white',
          highlight: true,
        },
      ],
    },
    {
      section: 'GESTIÓN Y APOYO',
      items: [
        {
          id: 'clients' as ActiveView,
          label: 'Clientes',
          icon: Users,
          badge: null,
        },
        {
          id: 'components' as ActiveView,
          label: 'Componentes y Stock',
          icon: Layers,
          badge: lowStockCount > 0 ? `${lowStockCount} bajo stock` : null,
          badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300',
        },
        {
          id: 'calendar' as ActiveView,
          label: 'Agenda de Entregas',
          icon: Calendar,
          badge: null,
        },
      ],
    },
    {
      section: 'ANÁLISIS Y CONTROL',
      items: [
        {
          id: 'reports' as ActiveView,
          label: 'Reportes de Pedidos',
          icon: BarChart3,
          badge: null,
        },
        ...(isAdmin
          ? [
              {
                id: 'users' as ActiveView,
                label: 'Usuarios y Roles',
                icon: UserCheck,
                badge: 'Admin',
                badgeClass: 'bg-[#8E315E]/15 text-[#8E315E]',
              },
            ]
          : []),
      ],
    },
  ];

  const handleNavClick = (viewId: ActiveView) => {
    setActiveView(viewId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          id="mobile-sidebar-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        id="app-main-sidebar"
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-[#FBDAE3] flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navItems.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <p className="px-3 text-[10px] font-bold tracking-wider text-[#6D5C64] uppercase mb-2">
                {group.section}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  activeView === item.id ||
                  (item.id === 'orders' &&
                    (activeView === 'order-detail' || activeView === 'order-edit'));

                return (
                  <button
                    key={item.id}
                    id={`sidebar-nav-${item.id}`}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#8E315E] text-white shadow-xs'
                        : item.highlight
                        ? 'bg-[#FFF7FA] text-[#8E315E] border border-[#FAB2D7] hover:bg-[#FBDAE3]/50'
                        : 'text-[#3A2D33] hover:bg-[#FFF7FA] hover:text-[#8E315E]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive
                            ? 'text-white'
                            : item.highlight
                            ? 'text-[#8E315E]'
                            : 'text-[#6D5C64]'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                          isActive ? 'bg-white/20 text-white' : item.badgeClass || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom footer card inside sidebar */}
        <div className="p-3 border-t border-[#FBDAE3] bg-[#FFF7FA]/60">
          <div className="bg-white rounded-xl p-3 border border-[#FBDAE3] shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <img
                  src="/emila-logo.png"
                  alt="EMILA"
                  className="w-6 h-6 object-contain rounded-full shadow-xs shrink-0"
                  referrerPolicy="no-referrer"
                />
                <span className="text-xs font-bold text-[#3A2D33]">EMILA Floristería</span>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#8E315E]/10 text-[#8E315E]">
                Oficial
              </span>
            </div>
            <p className="text-[11px] text-[#6D5C64] leading-relaxed">
              Gestión de pedidos personalizados y stock de taller.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
