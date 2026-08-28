import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Clock,
  Package,
  Check,
  AlertTriangle,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { OrderStatus } from '../../types';

export const DashboardView: React.FC = () => {
  const { orders, setActiveView, navigateToOrderDetail } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  // Active orders (not cancelled, not delivered yet for active pipeline)
  const activeOrders = orders.filter(
    (o) => o.status !== 'Cancelado' && o.status !== 'Entregado'
  );

  // Compute reactive metric indicators
  const todayOrders = orders.filter(
    (o) => o.deliveryDate === todayStr && o.status !== 'Cancelado'
  );
  const pendingOrders = orders.filter((o) => o.status === 'Pendiente');
  const inPrepOrders = orders.filter((o) => o.status === 'En preparación');
  const readyOrders = orders.filter((o) => o.status === 'Listo');
  const lateOrders = orders.filter(
    (o) => o.deliveryDate < todayStr && (o.status === 'Pendiente' || o.status === 'En preparación')
  );

  // Próximas entregas: up to 5 orders sorted by date and time
  const upcomingDeliveries = [...orders]
    .filter((o) => o.status !== 'Cancelado')
    .sort((a, b) => {
      const dateA = `${a.deliveryDate}T${a.deliveryTime || '00:00'}`;
      const dateB = `${b.deliveryDate}T${b.deliveryTime || '00:00'}`;
      return dateA.localeCompare(dateB);
    })
    .slice(0, 5);

  // Bottom widget: Channels distribution
  const channels = ['WhatsApp', 'Instagram', 'Llamada', 'Otro'];
  const channelCounts: { [key: string]: number } = {
    WhatsApp: 0,
    Instagram: 0,
    Llamada: 0,
    Otro: 0,
  };
  activeOrders.forEach((o) => {
    const ch = o.channel || 'Otro';
    if (channelCounts[ch] !== undefined) {
      channelCounts[ch] += 1;
    } else {
      channelCounts['Otro'] += 1;
    }
  });
  const maxChannelCount = Math.max(1, ...Object.values(channelCounts));

  // Bottom widget: Financial summary
  const totalActiveSales = activeOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalActiveAdvance = activeOrders.reduce((sum, o) => sum + (o.advancePayment || 0), 0);
  const pendingBalance = Math.max(0, totalActiveSales - totalActiveAdvance);

  // Bottom widget: Status distribution
  const statusList: { label: OrderStatus; color: string }[] = [
    { label: 'Pendiente', color: 'bg-[#FDE68A]' },
    { label: 'En preparación', color: 'bg-[#93C5FD]' },
    { label: 'Listo', color: 'bg-[#86EFAC]' },
    { label: 'Entregado', color: 'bg-[#6EE7B7]' },
    { label: 'Cancelado', color: 'bg-[#FCA5A5]' },
  ];
  const statusCounts: { [key: string]: number } = {
    Pendiente: 0,
    'En preparación': 0,
    Listo: 0,
    Entregado: 0,
    Cancelado: 0,
  };
  orders.forEach((o) => {
    if (statusCounts[o.status] !== undefined) {
      statusCounts[o.status] += 1;
    }
  });
  const maxStatusCount = Math.max(1, ...Object.values(statusCounts));

  const metrics = [
    {
      id: 'metric-today',
      title: 'Para hoy',
      count: todayOrders.length,
      textColor: 'text-[#0284C7]',
      icon: Calendar,
      iconBg: 'bg-[#E0F2FE]',
      iconColor: 'text-[#0284C7]',
    },
    {
      id: 'metric-pending',
      title: 'Pendientes',
      count: pendingOrders.length,
      textColor: 'text-[#B45309]',
      icon: Clock,
      iconBg: 'bg-[#FEF3C7]',
      iconColor: 'text-[#D97706]',
    },
    {
      id: 'metric-prep',
      title: 'En preparación',
      count: inPrepOrders.length,
      textColor: 'text-[#2563EB]',
      icon: Package,
      iconBg: 'bg-[#DBEAFE]',
      iconColor: 'text-[#2563EB]',
    },
    {
      id: 'metric-ready',
      title: 'Listos',
      count: readyOrders.length,
      textColor: 'text-[#16A34A]',
      icon: Check,
      iconBg: 'bg-[#DCFCE7]',
      iconColor: 'text-[#16A34A]',
    },
    {
      id: 'metric-late',
      title: 'Atrasados',
      count: lateOrders.length,
      textColor: 'text-[#DC2626]',
      icon: AlertTriangle,
      iconBg: 'bg-[#FEE2E2]',
      iconColor: 'text-[#DC2626]',
    },
  ];

  return (
    <div id="dashboard-view-container" className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2C1E23] tracking-tight">
            Dashboard de pedidos
          </h1>
          <p className="text-xs sm:text-sm text-[#7D6871] mt-0.5 font-medium">
            Resumen general de la operación del día.
          </p>
        </div>

        <button
          id="btn-dashboard-new-order"
          onClick={() => setActiveView('order-new')}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#681B2B] hover:bg-[#541421] text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Nuevo pedido
        </button>
      </div>

      {/* 5 Clean Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.id}
              id={m.id}
              className="bg-white rounded-2xl p-4 shadow-xs border border-[#F2D6DE]/60 flex items-center justify-between transition-all hover:shadow-sm"
            >
              <div>
                <p className="text-xs font-medium text-[#7D6871]">{m.title}</p>
                <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 ${m.textColor}`}>
                  {m.count}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${m.iconBg} ${m.iconColor} flex items-center justify-center shrink-0`}>
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Table: Próximas entregas */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-[#F2D6DE]/60">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-[#2C1E23]">Próximas entregas</h2>
          <button
            id="btn-dashboard-view-all-deliveries"
            onClick={() => setActiveView('orders')}
            className="text-xs font-semibold text-[#681B2B] hover:underline flex items-center gap-1 cursor-pointer"
          >
            Ver todos
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#F2D6DE]/40 text-[#8C7A82] uppercase text-[11px] font-semibold tracking-wider">
                <th className="pb-3 pl-1 font-semibold">PEDIDO</th>
                <th className="pb-3 font-semibold">CLIENTE</th>
                <th className="pb-3 font-semibold">FECHA</th>
                <th className="pb-3 font-semibold">HORA</th>
                <th className="pb-3 font-semibold">ESTADO</th>
                <th className="pb-3 pr-1 text-right font-semibold">ACCIÓN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2D6DE]/30">
              {upcomingDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#7D6871]">
                    No hay entregas pendientes en este momento.
                  </td>
                </tr>
              ) : (
                upcomingDeliveries.map((order) => {
                  const isToday = order.deliveryDate === todayStr;
                  const isLate = order.deliveryDate < todayStr && order.status !== 'Entregado';

                  // Format display date: e.g. "26/08/2026" or "Hoy"
                  const dateParts = order.deliveryDate.split('-');
                  const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : order.deliveryDate;

                  return (
                    <tr
                      key={order.id}
                      id={`row-dashboard-order-${order.id}`}
                      className="hover:bg-[#FBECEF]/30 transition-colors"
                    >
                      <td className="py-3.5 pl-1 font-bold text-[#681B2B] whitespace-nowrap">
                        {order.code}
                      </td>
                      <td className="py-3.5 font-medium text-[#2C1E23] whitespace-nowrap">
                        {order.clientName}
                      </td>
                      <td className="py-3.5 whitespace-nowrap">
                        {isToday ? (
                          <span className="font-semibold text-[#2563EB]">Hoy</span>
                        ) : isLate ? (
                          <span className="font-medium text-[#DC2626]">{formattedDate}</span>
                        ) : (
                          <span className="text-[#7D6871]">{formattedDate}</span>
                        )}
                      </td>
                      <td className="py-3.5 text-[#7D6871] font-medium whitespace-nowrap">
                        {order.deliveryTime || '--:--'}
                      </td>
                      <td className="py-3.5 whitespace-nowrap">
                        <StatusBadge status={order.status} size="sm" />
                      </td>
                      <td className="py-3.5 pr-1 text-right whitespace-nowrap">
                        <button
                          id={`btn-dashboard-view-${order.id}`}
                          onClick={() => navigateToOrderDetail(order.id)}
                          className="text-[#681B2B] hover:underline font-semibold text-xs cursor-pointer inline-flex items-center gap-1"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3 Bottom Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Pedidos activos por canal */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#F2D6DE]/60 space-y-4">
          <h3 className="text-sm font-bold text-[#2C1E23]">Pedidos activos por canal</h3>
          <div className="space-y-3 pt-1">
            {channels.map((ch) => {
              const count = channelCounts[ch] || 0;
              const percent = maxChannelCount > 0 ? (count / maxChannelCount) * 100 : 0;
              return (
                <div key={ch} className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-[#2C1E23] font-medium">
                    <span>{ch}</span>
                    <span className="font-bold">{count}</span>
                  </div>
                  <div className="w-full h-2 bg-[#FBECEF] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        count > 0 ? 'bg-[#681B2B]' : 'bg-[#E5E7EB]'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 2: Saldo pendiente de cobro */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#F2D6DE]/60 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-medium text-[#7D6871]">Saldo pendiente de cobro</h3>
            <p className="text-3xl font-extrabold text-[#2C1E23] tracking-tight mt-1.5">
              Q{pendingBalance.toFixed(2)}
            </p>
            <p className="text-xs text-[#7D6871] mt-0.5">
              en {activeOrders.length} pedidos activos
            </p>
          </div>

          <div className="border-t border-[#F2D6DE]/40 pt-3 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[#7D6871]">Total pedidos activos</span>
              <span className="font-semibold text-[#2C1E23]">Q{totalActiveSales.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#7D6871]">Anticipos registrados</span>
              <span className="font-semibold text-[#059669]">Q{totalActiveAdvance.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Distribución por estado */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#F2D6DE]/60 space-y-4">
          <h3 className="text-sm font-bold text-[#2C1E23]">Distribución por estado</h3>
          <div className="space-y-2.5 pt-1">
            {statusList.map((st) => {
              const count = statusCounts[st.label] || 0;
              const percent = maxStatusCount > 0 ? (count / maxStatusCount) * 100 : 0;
              return (
                <div key={st.label} className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-[#2C1E23] font-medium">
                    <span>{st.label}</span>
                    <span className="font-bold">{count}</span>
                  </div>
                  <div className="w-full h-2 bg-[#FBECEF] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${st.color}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

