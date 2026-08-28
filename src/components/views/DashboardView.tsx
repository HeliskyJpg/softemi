import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  CalendarDays,
  Clock,
  Hammer,
  CheckCircle2,
  AlertOctagon,
  PlusCircle,
  ArrowRight,
  Eye,
  ShoppingBag,
  Sparkles,
  Layers,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { motion } from 'motion/react';

export const DashboardView: React.FC = () => {
  const { orders, components, setActiveView, navigateToOrderDetail } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  // Compute reactive indicators
  const todayOrders = orders.filter(
    (o) => o.deliveryDate === todayStr && o.status !== 'Cancelado'
  );
  const pendingOrders = orders.filter((o) => o.status === 'Pendiente');
  const inPrepOrders = orders.filter((o) => o.status === 'En preparación');
  const readyOrders = orders.filter((o) => o.status === 'Listo');

  // Atrasados: deliveryDate < today and status is either Pendiente or En preparación
  const lateOrders = orders.filter(
    (o) => o.deliveryDate < todayStr && (o.status === 'Pendiente' || o.status === 'En preparación')
  );

  // Próximas entregas: Active orders sorted by delivery date and time
  const upcomingDeliveries = [...orders]
    .filter((o) => o.status !== 'Cancelado' && o.status !== 'Entregado')
    .sort((a, b) => {
      const dateA = `${a.deliveryDate}T${a.deliveryTime || '00:00'}`;
      const dateB = `${b.deliveryDate}T${b.deliveryTime || '00:00'}`;
      return dateA.localeCompare(dateB);
    })
    .slice(0, 6);

  // Low stock alert items based on available stock
  const lowStockItems = components.filter((c) => {
    const available = c.physicalStock - c.reservedStock;
    return available <= c.minStockAlert;
  });

  const metrics = [
    {
      id: 'metric-today',
      title: 'Pedidos para hoy',
      count: todayOrders.length,
      icon: CalendarDays,
      bg: 'bg-white',
      border: 'border-[#FBDAE3]',
      iconColor: 'text-[#8E315E]',
      iconBg: 'bg-[#FBDAE3]/50',
      description: 'Programados para entrega hoy',
    },
    {
      id: 'metric-pending',
      title: 'Pendientes',
      count: pendingOrders.length,
      icon: Clock,
      bg: 'bg-white',
      border: 'border-amber-200',
      iconColor: 'text-amber-700',
      iconBg: 'bg-amber-100',
      description: 'Por iniciar preparación',
    },
    {
      id: 'metric-prep',
      title: 'En preparación',
      count: inPrepOrders.length,
      icon: Hammer,
      bg: 'bg-white',
      border: 'border-[#FAB2D7]',
      iconColor: 'text-[#8E315E]',
      iconBg: 'bg-[#FBDAE3]',
      description: 'En proceso en taller',
    },
    {
      id: 'metric-ready',
      title: 'Listos para entrega',
      count: readyOrders.length,
      icon: CheckCircle2,
      bg: 'bg-white',
      border: 'border-[#65733D]/30',
      iconColor: 'text-[#65733D]',
      iconBg: 'bg-[#EBF1DE]',
      description: 'Listos para retiro o envío',
    },
    {
      id: 'metric-late',
      title: 'Atrasados',
      count: lateOrders.length,
      icon: AlertOctagon,
      bg: 'bg-white',
      border: lateOrders.length > 0 ? 'border-red-300' : 'border-gray-200',
      iconColor: lateOrders.length > 0 ? 'text-[#9B2C2C]' : 'text-gray-400',
      iconBg: lateOrders.length > 0 ? 'bg-red-100' : 'bg-gray-100',
      description: 'Fecha límite vencida',
      isWarning: lateOrders.length > 0,
    },
  ];

  return (
    <div id="dashboard-view-container" className="space-y-6 pb-12">
      {/* Header with Title and Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#3A2D33] tracking-tight">
            Panel de Control de Pedidos
          </h1>
          <p className="text-xs sm:text-sm text-[#6D5C64] mt-0.5">
            Monitoreo en tiempo real del taller y flujo de personalización.
          </p>
        </div>

        <button
          id="btn-dashboard-new-order"
          onClick={() => setActiveView('order-new')}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#8E315E] hover:bg-[#7A294F] text-white font-bold text-sm shadow-sm transition-all cursor-pointer hover:shadow-md"
        >
          <PlusCircle className="w-4 h-4" />
          + Nuevo pedido
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              id={m.id}
              className={`p-4 rounded-2xl ${m.bg} border ${m.border} shadow-xs hover:shadow-md transition-all flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#6D5C64] uppercase tracking-wider">
                  {m.title}
                </span>
                <div className={`p-2 rounded-xl ${m.iconBg} ${m.iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3">
                <span className={`text-3xl font-extrabold tracking-tight ${
                  m.isWarning ? 'text-[#9B2C2C]' : 'text-[#3A2D33]'
                }`}>
                  {m.count}
                </span>
                <p className="text-[11px] text-[#6D5C64] mt-1 truncate">{m.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Section: Próximas Entregas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deliveries Table (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-[#FBDAE3] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#3A2D33] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#8E315E]" />
                Próximas Entregas
              </h2>
              <p className="text-xs text-[#6D5C64]">
                Pedidos activos ordenados por proximidad de fecha y hora.
              </p>
            </div>
            <button
              id="btn-dashboard-view-all-orders"
              onClick={() => setActiveView('orders')}
              className="text-xs font-semibold text-[#8E315E] hover:text-[#7A294F] flex items-center gap-1 hover:underline cursor-pointer"
            >
              Ver todos ({orders.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[#6D5C64] uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">Código</th>
                  <th className="pb-3 font-semibold">Cliente</th>
                  <th className="pb-3 font-semibold">Fecha</th>
                  <th className="pb-3 font-semibold">Hora</th>
                  <th className="pb-3 font-semibold">Estado</th>
                  <th className="pb-3 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {upcomingDeliveries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#6D5C64]">
                      No hay pedidos pendientes de entrega en este momento.
                    </td>
                  </tr>
                ) : (
                  upcomingDeliveries.map((order) => {
                    const isToday = order.deliveryDate === todayStr;
                    const isLate = order.deliveryDate < todayStr;

                    return (
                      <tr
                        key={order.id}
                        id={`row-dashboard-order-${order.id}`}
                        className="hover:bg-[#FFF7FA] transition-colors group"
                      >
                        <td className="py-3 font-bold text-[#8E315E]">{order.code}</td>
                        <td className="py-3 font-medium text-[#3A2D33]">
                          <div>{order.clientName}</div>
                          <div className="text-[11px] text-[#6D5C64] truncate max-w-[180px]">
                            {order.description}
                          </div>
                        </td>
                        <td className="py-3 text-[#3A2D33]">
                          <span
                            className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                              isToday
                                ? 'bg-[#FBDAE3] text-[#8E315E]'
                                : isLate
                                ? 'bg-red-100 text-[#9B2C2C]'
                                : 'text-[#6D5C64]'
                            }`}
                          >
                            {order.deliveryDate}
                            {isToday && ' (Hoy)'}
                          </span>
                        </td>
                        <td className="py-3 text-[#6D5C64] font-medium">{order.deliveryTime || '--:--'}</td>
                        <td className="py-3">
                          <StatusBadge status={order.status} size="sm" />
                        </td>
                        <td className="py-3 text-right">
                          <button
                            id={`btn-dashboard-view-${order.id}`}
                            onClick={() => navigateToOrderDetail(order.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#FFF7FA] hover:bg-[#8E315E] hover:text-white text-[#8E315E] font-semibold border border-[#FBDAE3] transition-all cursor-pointer text-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
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

        {/* Side summary card: Stock Alerts & Process Highlights */}
        <div className="space-y-4">
          {/* Stock summary card */}
          <div className="bg-white rounded-2xl p-5 border border-[#FBDAE3] shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#3A2D33] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#65733D]" />
                Disponibilidad de Stock
              </h3>
              <button
                onClick={() => setActiveView('components')}
                className="text-[11px] font-semibold text-[#65733D] hover:underline cursor-pointer"
              >
                Catálogo
              </button>
            </div>

            {lowStockItems.length > 0 ? (
              <div className="space-y-2.5">
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                  <p className="font-semibold">Atención: {lowStockItems.length} componentes bajo stock</p>
                </div>
                <div className="space-y-2">
                  {lowStockItems.slice(0, 4).map((item) => {
                    const avail = item.physicalStock - item.reservedStock;
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#FFF7FA]"
                      >
                        <span className="font-medium text-[#3A2D33] truncate max-w-[150px]">
                          {item.name}
                        </span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                            avail <= 0
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {avail} {item.unit || 'unids.'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#EBF1DE]/50 text-[#4F5B2F] text-xs text-center">
                <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-[#65733D]" />
                <p className="font-semibold">Inventario en niveles óptimos</p>
                <p className="text-[11px] text-[#65733D] mt-0.5">Todos los componentes cuentan con stock suficiente.</p>
              </div>
            )}
          </div>

          {/* Process Guide info card */}
          <div className="bg-gradient-to-br from-[#FBDAE3]/30 to-[#EBF1DE]/30 rounded-2xl p-5 border border-[#FBDAE3] shadow-xs">
            <h3 className="text-xs font-bold text-[#8E315E] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Flujo Central del Taller
            </h3>
            <ol className="text-xs text-[#3A2D33] space-y-1.5 font-medium list-decimal list-inside leading-relaxed">
              <li>Recepción & Identificación de cliente</li>
              <li>Personalización & Selección de componentes</li>
              <li>Validación y descuento de stock simulado</li>
              <li>Registro de anticipo & fecha de entrega</li>
              <li>Seguimiento: Pendiente → Preparación → Listo → Entregado</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
