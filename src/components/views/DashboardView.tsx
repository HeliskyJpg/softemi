import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Clock,
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  Banknote,
  CreditCard,
  History,
  Boxes,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  DollarSign,
  Receipt,
  Eye,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { MoneyFormatter, formatMoney } from '../common/MoneyFormatter';
import { DateFormatter } from '../common/DateFormatter';
import { EmptyState } from '../common/EmptyState';

export const DashboardView: React.FC = () => {
  const {
    orders,
    components,
    auditLogs,
    setActiveView,
    navigateToOrderDetail,
    navigateToOrderNew,
    hasPermission,
    ordersViewState,
    setOrdersViewState,
    componentsViewState,
    setComponentsViewState,
  } = useApp();

  // Selected period for DINERO metrics: 'month' (default), '30days', 'all'
  const [moneyPeriod, setMoneyPeriod] = useState<'month' | '30days' | 'all'>('month');

  // Selected tab for ACTIVIDAD section: 'upcoming' | 'payments' | 'recent'
  const [activityTab, setActivityTab] = useState<'upcoming' | 'payments' | 'recent'>('upcoming');

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthPrefix = todayStr.substring(0, 7); // e.g. "2026-09"

  // =========================================================================
  // 1. SECCIÓN OPERACIÓN: Métricas críticas del día a día
  // =========================================================================
  const todayOrders = useMemo(
    () => orders.filter((o) => o.deliveryDate === todayStr && o.status !== 'Cancelado'),
    [orders, todayStr]
  );
  const todayPendingCount = todayOrders.filter((o) => o.status !== 'Entregado').length;

  const lateOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.deliveryDate < todayStr &&
          o.status !== 'Entregado' &&
          o.status !== 'Cancelado'
      ),
    [orders, todayStr]
  );

  const inPrepOrders = useMemo(
    () => orders.filter((o) => o.status === 'En preparación'),
    [orders]
  );

  const readyOrders = useMemo(
    () => orders.filter((o) => o.status === 'Listo'),
    [orders]
  );

  // Navigation handlers for OPERACIÓN
  const handleFilterTodayDeliveries = () => {
    setOrdersViewState((prev) => ({
      ...prev,
      searchTerm: '',
      statusFilter: 'Todos',
      dateFilter: 'hoy',
      currentPage: 1,
    }));
    setActiveView('orders');
  };

  const handleFilterLateOrders = () => {
    setOrdersViewState((prev) => ({
      ...prev,
      searchTerm: '',
      statusFilter: 'Todos',
      dateFilter: 'atrasados',
      currentPage: 1,
    }));
    setActiveView('orders');
  };

  const handleFilterInPrep = () => {
    setOrdersViewState((prev) => ({
      ...prev,
      searchTerm: '',
      statusFilter: 'En preparación',
      dateFilter: 'todos',
      currentPage: 1,
    }));
    setActiveView('orders');
  };

  const handleFilterReady = () => {
    setOrdersViewState((prev) => ({
      ...prev,
      searchTerm: '',
      statusFilter: 'Listo',
      dateFilter: 'todos',
      currentPage: 1,
    }));
    setActiveView('orders');
  };

  // =========================================================================
  // 2. SECCIÓN DINERO: Totales monetarios en Quetzales (Q)
  // =========================================================================
  const periodOrders = useMemo(() => {
    const activeNonCancelled = orders.filter((o) => o.status !== 'Cancelado');

    if (moneyPeriod === 'all') {
      return activeNonCancelled;
    }

    if (moneyPeriod === 'month') {
      return activeNonCancelled.filter((o) => {
        const orderDate = o.deliveryDate || o.createdAt || '';
        return orderDate.startsWith(currentMonthPrefix);
      });
    }

    // '30days'
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    return activeNonCancelled.filter((o) => {
      const orderDate = o.deliveryDate || o.createdAt || '';
      return orderDate >= thirtyDaysAgoStr;
    });
  }, [orders, moneyPeriod, currentMonthPrefix]);

  const periodTotalSold = useMemo(
    () => periodOrders.reduce((sum, o) => sum + (o.total || 0), 0),
    [periodOrders]
  );

  const periodTotalCollected = useMemo(
    () => periodOrders.reduce((sum, o) => sum + (o.advancePayment || 0), 0),
    [periodOrders]
  );

  const ordersWithPendingBalance = useMemo(
    () => periodOrders.filter((o) => (o.balance || 0) > 0 && o.status !== 'Entregado'),
    [periodOrders]
  );

  const periodPendingBalance = useMemo(
    () => ordersWithPendingBalance.reduce((sum, o) => sum + Math.max(0, o.balance || 0), 0),
    [ordersWithPendingBalance]
  );

  const collectedPercentage =
    periodTotalSold > 0 ? Math.round((periodTotalCollected / periodTotalSold) * 100) : 0;

  // Navigation handlers for DINERO
  const handleNavigateToPendingBalance = () => {
    setOrdersViewState((prev) => ({
      ...prev,
      searchTerm: '',
      statusFilter: 'Todos',
      dateFilter: 'con_saldo',
      currentPage: 1,
    }));
    setActiveView('orders');
  };

  const handleNavigateToAllOrders = () => {
    setOrdersViewState((prev) => ({
      ...prev,
      searchTerm: '',
      statusFilter: 'Todos',
      dateFilter: 'todos',
      currentPage: 1,
    }));
    setActiveView('orders');
  };

  // =========================================================================
  // 3. SECCIÓN INVENTARIO: Stock crítico y alertas de insumos
  // =========================================================================
  const activeComponents = useMemo(
    () => components.filter((c) => c.active),
    [components]
  );

  const lowStockComponents = useMemo(() => {
    return activeComponents.filter((c) => {
      const available = Math.max(0, c.physicalStock - c.reservedStock);
      return available > 0 && available <= c.minStockAlert;
    });
  }, [activeComponents]);

  const outOfStockComponents = useMemo(() => {
    return activeComponents.filter((c) => {
      const available = Math.max(0, c.physicalStock - c.reservedStock);
      return available <= 0;
    });
  }, [activeComponents]);

  const handleNavigateToLowStock = () => {
    setComponentsViewState((prev) => ({
      ...prev,
      activeTab: 'catalog',
      statusFilter: 'low_stock',
      searchTerm: '',
      categoryFilter: 'Todas',
    }));
    setActiveView('components');
  };

  const handleNavigateToOutOfStock = () => {
    setComponentsViewState((prev) => ({
      ...prev,
      activeTab: 'catalog',
      statusFilter: 'out_of_stock',
      searchTerm: '',
      categoryFilter: 'Todas',
    }));
    setActiveView('components');
  };

  // =========================================================================
  // 4. SECCIÓN ACTIVIDAD: Próximos pedidos, Últimos pagos, Actividad reciente
  // =========================================================================

  // Próximos pedidos (activos no cancelados ni entregados, ordenados cronológicamente)
  const upcomingOrders = useMemo(() => {
    return [...orders]
      .filter((o) => o.status !== 'Cancelado' && o.status !== 'Entregado')
      .sort((a, b) => {
        const dateA = `${a.deliveryDate}T${a.deliveryTime || '00:00'}`;
        const dateB = `${b.deliveryDate}T${b.deliveryTime || '00:00'}`;
        return dateA.localeCompare(dateB);
      })
      .slice(0, 6);
  }, [orders]);

  // Últimos pagos registrados (extraídos de anticipos y abonos registrados)
  interface PaymentRecord {
    id: string;
    orderId: string;
    orderCode: string;
    clientName: string;
    amount: number;
    concept: string;
    timestamp: string;
    user: string;
  }

  const latestPayments = useMemo(() => {
    const list: PaymentRecord[] = [];

    orders.forEach((order) => {
      // Check history for specific payment / abono actions
      if (order.history && order.history.length > 0) {
        order.history.forEach((hist) => {
          const actionLower = hist.action.toLowerCase();
          if (
            actionLower.includes('pago') ||
            actionLower.includes('abono') ||
            actionLower.includes('liquidado')
          ) {
            // Try to extract amount from details e.g. "Monto recibido: Q 250.00"
            const match = hist.details?.match(/Q\s*([0-9,]+(?:\.[0-9]{2})?)/);
            let amount = match ? parseFloat(match[1].replace(/,/g, '')) : 0;
            if (amount <= 0 && hist.action.includes('liquidado')) {
              amount = order.total - (order.balance || 0);
            }

            list.push({
              id: hist.id || `pay-${order.id}-${hist.timestamp}`,
              orderId: order.id,
              orderCode: order.code,
              clientName: order.clientName,
              amount: amount > 0 ? amount : order.advancePayment,
              concept: hist.action,
              timestamp: hist.timestamp,
              user: hist.user || 'Sistema',
            });
          }
        });
      }

      // If order has advancePayment and wasn't already caught by history
      if (
        order.advancePayment > 0 &&
        !list.some((p) => p.orderId === order.id && p.concept.includes('Anticipo'))
      ) {
        list.push({
          id: `adv-${order.id}`,
          orderId: order.id,
          orderCode: order.code,
          clientName: order.clientName,
          amount: order.advancePayment,
          concept: 'Anticipo inicial',
          timestamp: order.createdAt || order.deliveryDate,
          user: order.createdBy || 'Taller',
        });
      }
    });

    // Also include payments from audit logs if not redundant
    auditLogs
      .filter((a) => a.operationType === 'Pagos y Abonos' || a.action.includes('pago'))
      .forEach((audit) => {
        const orderCode = audit.recordId;
        const matchingOrder = orders.find((o) => o.code === orderCode);
        if (matchingOrder && !list.some((p) => p.id === audit.id)) {
          const match = audit.description.match(/Q\s*([0-9,]+(?:\.[0-9]{2})?)/);
          const amount = match ? parseFloat(match[1].replace(/,/g, '')) : 0;
          if (amount > 0) {
            list.push({
              id: audit.id,
              orderId: matchingOrder.id,
              orderCode: matchingOrder.code,
              clientName: matchingOrder.clientName,
              amount,
              concept: audit.action,
              timestamp: audit.timestamp,
              user: audit.userName,
            });
          }
        }
      });

    // Sort descending by timestamp
    return list
      .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
      .slice(0, 7);
  }, [orders, auditLogs]);

  // Actividad reciente relevante
  const recentActivityLogs = useMemo(() => {
    // Take from auditLogs or synthesize from recent order history
    if (auditLogs && auditLogs.length > 0) {
      return [...auditLogs]
        .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
        .slice(0, 8);
    }
    return [];
  }, [auditLogs]);

  return (
    <div id="dashboard-view-container" className="space-y-7 pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2C1E23] tracking-tight flex items-center gap-2.5">
            <span>Dashboard Operativo</span>
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#681B2B]/10 text-[#681B2B]">
              En vivo
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#7D6871] mt-0.5 font-medium">
            Control de entregas, liquidez en quetzales, disponibilidad de inventario y actividad transaccional.
          </p>
        </div>

        {hasPermission('orders.create') && (
          <button
            id="btn-dashboard-new-order"
            onClick={() => navigateToOrderNew('dashboard')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#681B2B] hover:bg-[#541421] text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer self-start sm:self-auto hover:shadow-md active:scale-98"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Nuevo Pedido
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. SECCIÓN OPERACIÓN                                                      */}
      {/* ========================================================================= */}
      <section id="section-dashboard-operation" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#681B2B]" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#7D6871]">
              Operación del Día
            </h2>
          </div>
          <span className="text-[11px] font-medium text-[#7D6871]">
            Haz clic en una tarjeta para filtrar el listado
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Entregas de hoy */}
          <button
            id="card-op-today"
            type="button"
            onClick={handleFilterTodayDeliveries}
            className="bg-white rounded-2xl p-4 sm:p-5 border border-[#F2D6DE]/80 shadow-xs hover:shadow-md hover:border-[#0284C7]/50 transition-all text-left group cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0284C7] flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Calendar className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="flex items-center text-[11px] font-semibold text-[#0284C7] gap-0.5 group-hover:translate-x-0.5 transition-transform">
                <span>Ver</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold text-[#7D6871] group-hover:text-[#2C1E23] transition-colors">
                Entregas de hoy
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl sm:text-3xl font-extrabold text-[#0284C7] tracking-tight">
                  {todayOrders.length}
                </p>
                <span className="text-[11px] font-medium text-[#7D6871]">
                  {todayPendingCount} pendientes
                </span>
              </div>
            </div>
          </button>

          {/* 2. Pedidos atrasados */}
          <button
            id="card-op-late"
            type="button"
            onClick={handleFilterLateOrders}
            className={`rounded-2xl p-4 sm:p-5 border shadow-xs hover:shadow-md transition-all text-left group cursor-pointer flex flex-col justify-between ${
              lateOrders.length > 0
                ? 'bg-rose-50/50 border-rose-200 hover:border-rose-400'
                : 'bg-white border-[#F2D6DE]/80 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 ${
                  lateOrders.length > 0
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div
                className={`flex items-center text-[11px] font-semibold gap-0.5 group-hover:translate-x-0.5 transition-transform ${
                  lateOrders.length > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                <span>{lateOrders.length > 0 ? 'Atender' : 'Al día'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="mt-4">
              <p
                className={`text-xs font-semibold ${
                  lateOrders.length > 0 ? 'text-rose-800' : 'text-[#7D6871]'
                }`}
              >
                Pedidos atrasados
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <p
                  className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                    lateOrders.length > 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {lateOrders.length}
                </p>
                <span className="text-[11px] font-medium text-[#7D6871]">
                  {lateOrders.length > 0 ? 'Límite vencido' : 'Sin retrasos'}
                </span>
              </div>
            </div>
          </button>

          {/* 3. En preparación */}
          <button
            id="card-op-in-prep"
            type="button"
            onClick={handleFilterInPrep}
            className="bg-white rounded-2xl p-4 sm:p-5 border border-[#F2D6DE]/80 shadow-xs hover:shadow-md hover:border-blue-300 transition-all text-left group cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Package className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="flex items-center text-[11px] font-semibold text-blue-600 gap-0.5 group-hover:translate-x-0.5 transition-transform">
                <span>Ver</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold text-[#7D6871] group-hover:text-[#2C1E23] transition-colors">
                En preparación
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl sm:text-3xl font-extrabold text-blue-600 tracking-tight">
                  {inPrepOrders.length}
                </p>
                <span className="text-[11px] font-medium text-[#7D6871]">
                  En taller
                </span>
              </div>
            </div>
          </button>

          {/* 4. Listos para entregar */}
          <button
            id="card-op-ready"
            type="button"
            onClick={handleFilterReady}
            className="bg-white rounded-2xl p-4 sm:p-5 border border-[#F2D6DE]/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all text-left group cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="flex items-center text-[11px] font-semibold text-emerald-600 gap-0.5 group-hover:translate-x-0.5 transition-transform">
                <span>Ver</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold text-[#7D6871] group-hover:text-[#2C1E23] transition-colors">
                Listos para entregar
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight">
                  {readyOrders.length}
                </p>
                <span className="text-[11px] font-medium text-[#7D6871]">
                  Por despachar
                </span>
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. SECCIÓN DINERO & 3. SECCIÓN INVENTARIO (GRID ESTRUCTURAL)              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* DINERO (Cols 7 / 12) */}
        <section
          id="section-dashboard-money"
          className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-[#F2D6DE]/80 shadow-xs space-y-5 flex flex-col justify-between"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F2D6DE]/50 pb-3.5">
            <div>
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-[#681B2B]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#2C1E23]">
                  Dinero y Cobranza (Quetzales)
                </h2>
              </div>
              <p className="text-xs text-[#7D6871] mt-0.5">
                Flujo financiero en moneda nacional (Q).
              </p>
            </div>

            {/* Selector de período */}
            <div className="inline-flex rounded-xl bg-[#FBECEF]/80 p-1 border border-[#F2D6DE] text-xs font-semibold text-[#7D6871]">
              <button
                type="button"
                onClick={() => setMoneyPeriod('month')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  moneyPeriod === 'month'
                    ? 'bg-white text-[#681B2B] shadow-2xs font-bold'
                    : 'hover:text-[#2C1E23]'
                }`}
              >
                Este mes
              </button>
              <button
                type="button"
                onClick={() => setMoneyPeriod('30days')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  moneyPeriod === '30days'
                    ? 'bg-white text-[#681B2B] shadow-2xs font-bold'
                    : 'hover:text-[#2C1E23]'
                }`}
              >
                Últimos 30d
              </button>
              <button
                type="button"
                onClick={() => setMoneyPeriod('all')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  moneyPeriod === 'all'
                    ? 'bg-white text-[#681B2B] shadow-2xs font-bold'
                    : 'hover:text-[#2C1E23]'
                }`}
              >
                Histórico
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Total vendido del período */}
            <button
              id="card-money-total-sold"
              type="button"
              onClick={handleNavigateToAllOrders}
              className="p-4 rounded-xl bg-[#FDF8F9] border border-[#F2D6DE]/60 hover:border-[#681B2B]/40 hover:bg-white transition-all text-left cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <span className="text-[11px] font-semibold text-[#7D6871] uppercase tracking-wider block">
                  Total Vendido
                </span>
                <p className="text-xl sm:text-2xl font-extrabold text-[#2C1E23] tracking-tight mt-1.5 group-hover:text-[#681B2B] transition-colors">
                  Q {periodTotalSold.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#F2D6DE]/40 flex items-center justify-between text-[11px] text-[#7D6871]">
                <span>{periodOrders.length} pedidos</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#681B2B] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>

            {/* Total cobrado */}
            <button
              id="card-money-total-collected"
              type="button"
              onClick={handleNavigateToAllOrders}
              className="p-4 rounded-xl bg-[#FDF8F9] border border-[#F2D6DE]/60 hover:border-emerald-400 hover:bg-white transition-all text-left cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <span className="text-[11px] font-semibold text-[#7D6871] uppercase tracking-wider block">
                  Total Cobrado
                </span>
                <p className="text-xl sm:text-2xl font-extrabold text-emerald-700 tracking-tight mt-1.5">
                  Q {periodTotalCollected.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#F2D6DE]/40 flex items-center justify-between text-[11px] text-emerald-700 font-medium">
                <span>{collectedPercentage}% del total</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>

            {/* Saldo pendiente de cobro */}
            <button
              id="card-money-pending-balance"
              type="button"
              onClick={handleNavigateToPendingBalance}
              className={`p-4 rounded-xl border transition-all text-left cursor-pointer group flex flex-col justify-between ${
                periodPendingBalance > 0
                  ? 'bg-amber-50/40 border-amber-200/80 hover:border-amber-400 hover:bg-white'
                  : 'bg-[#FDF8F9] border-[#F2D6DE]/60 hover:border-emerald-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider block">
                    Saldo Pendiente
                  </span>
                  {periodPendingBalance > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </div>
                <p className="text-xl sm:text-2xl font-extrabold text-amber-900 tracking-tight mt-1.5 group-hover:text-[#681B2B] transition-colors">
                  Q {periodPendingBalance.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-amber-200/50 flex items-center justify-between text-[11px] text-amber-800 font-medium">
                <span>{ordersWithPendingBalance.length} con saldo</span>
                <span className="inline-flex items-center text-xs font-bold text-[#681B2B] gap-0.5">
                  Filtrar <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </button>
          </div>

          <div className="bg-[#FBECEF]/40 rounded-xl p-3 text-xs text-[#7D6871] flex items-center justify-between">
            <span>
              💡 Al hacer clic en <strong>Saldo Pendiente</strong> verás los pedidos activos con cobro por liquidar.
            </span>
          </div>
        </section>

        {/* INVENTARIO (Cols 5 / 12) */}
        <section
          id="section-dashboard-inventory"
          className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-[#F2D6DE]/80 shadow-xs space-y-4 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between border-b border-[#F2D6DE]/50 pb-3.5">
            <div>
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-[#681B2B]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#2C1E23]">
                  Inventario Crítico
                </h2>
              </div>
              <p className="text-xs text-[#7D6871] mt-0.5">
                Insumos que limitan nuevos pedidos.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setComponentsViewState((prev) => ({
                  ...prev,
                  activeTab: 'catalog',
                  statusFilter: 'all',
                }));
                setActiveView('components');
              }}
              className="text-xs font-bold text-[#681B2B] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Ver catálogo
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Componentes con bajo stock */}
            <button
              id="card-inv-low-stock"
              type="button"
              onClick={handleNavigateToLowStock}
              className={`p-4 rounded-xl border transition-all text-left cursor-pointer group flex flex-col justify-between ${
                lowStockComponents.length > 0
                  ? 'bg-amber-50/50 border-amber-200 hover:border-amber-400 hover:bg-white'
                  : 'bg-[#FDF8F9] border-[#F2D6DE]/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <AlertTriangle
                  className={`w-5 h-5 ${
                    lowStockComponents.length > 0 ? 'text-amber-600' : 'text-[#7D6871]'
                  }`}
                />
                <span className="text-[11px] font-bold text-amber-700 group-hover:translate-x-0.5 transition-transform">
                  Ver lista →
                </span>
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-extrabold text-amber-900 tracking-tight">
                  {lowStockComponents.length}
                </p>
                <p className="text-xs font-semibold text-[#7D6871] mt-0.5">
                  Bajo Stock
                </p>
                <span className="text-[10px] text-amber-800 font-medium block mt-0.5">
                  Cerca del mínimo
                </span>
              </div>
            </button>

            {/* Componentes agotados */}
            <button
              id="card-inv-out-of-stock"
              type="button"
              onClick={handleNavigateToOutOfStock}
              className={`p-4 rounded-xl border transition-all text-left cursor-pointer group flex flex-col justify-between ${
                outOfStockComponents.length > 0
                  ? 'bg-rose-50/50 border-rose-200 hover:border-rose-400 hover:bg-white'
                  : 'bg-[#FDF8F9] border-[#F2D6DE]/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <XCircle
                  className={`w-5 h-5 ${
                    outOfStockComponents.length > 0 ? 'text-rose-600' : 'text-[#7D6871]'
                  }`}
                />
                <span className="text-[11px] font-bold text-rose-700 group-hover:translate-x-0.5 transition-transform">
                  Ver lista →
                </span>
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 tracking-tight">
                  {outOfStockComponents.length}
                </p>
                <p className="text-xs font-semibold text-[#7D6871] mt-0.5">
                  Agotados
                </p>
                <span className="text-[10px] text-rose-700 font-medium block mt-0.5">
                  Sin existencias
                </span>
              </div>
            </button>
          </div>

          {/* Quick list of critical components if any */}
          <div className="pt-2 border-t border-[#F2D6DE]/40">
            {outOfStockComponents.length === 0 && lowStockComponents.length === 0 ? (
              <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5 py-1">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Todos los insumos activos cuentan con stock suficiente.
              </p>
            ) : (
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-[#7D6871] uppercase tracking-wider">
                  Insumos de atención inmediata:
                </p>
                <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                  {[...outOfStockComponents, ...lowStockComponents].slice(0, 3).map((comp) => {
                    const available = Math.max(0, comp.physicalStock - comp.reservedStock);
                    const isOut = available <= 0;
                    return (
                      <div
                        key={comp.id}
                        onClick={() => {
                          setComponentsViewState((prev) => ({
                            ...prev,
                            activeTab: 'catalog',
                            searchTerm: comp.name,
                          }));
                          setActiveView('components');
                        }}
                        className="flex items-center justify-between text-xs px-2 py-1 rounded-lg hover:bg-[#FBECEF]/60 cursor-pointer text-[#2C1E23] transition-colors"
                      >
                        <span className="font-medium truncate mr-2">{comp.name}</span>
                        <span
                          className={`font-bold px-1.5 py-0.2 rounded text-[10px] whitespace-nowrap ${
                            isOut
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {available} {comp.unit || 'uds'} disp.
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* 4. SECCIÓN ACTIVIDAD                                                      */}
      {/* ========================================================================= */}
      <section
        id="section-dashboard-activity"
        className="bg-white rounded-2xl border border-[#F2D6DE]/80 shadow-xs overflow-hidden"
      >
        {/* Navigation Tabs for Activity */}
        <div className="px-5 sm:px-6 pt-5 pb-3 border-b border-[#F2D6DE]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#681B2B]" />
              <h2 className="text-base font-bold text-[#2C1E23]">
                Actividad Transaccional
              </h2>
            </div>
            <p className="text-xs text-[#7D6871] mt-0.5">
              Próximos pedidos en agenda, últimos pagos y bitácora reciente.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-[#FBECEF]/80 p-1 rounded-xl border border-[#F2D6DE] text-xs font-semibold">
            <button
              id="tab-act-upcoming"
              type="button"
              onClick={() => setActivityTab('upcoming')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activityTab === 'upcoming'
                  ? 'bg-[#681B2B] text-white shadow-xs font-bold'
                  : 'text-[#7D6871] hover:text-[#2C1E23]'
              }`}
            >
              <span>Próximos Pedidos</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activityTab === 'upcoming'
                    ? 'bg-white/25 text-white'
                    : 'bg-[#681B2B]/10 text-[#681B2B]'
                }`}
              >
                {upcomingOrders.length}
              </span>
            </button>

            <button
              id="tab-act-payments"
              type="button"
              onClick={() => setActivityTab('payments')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activityTab === 'payments'
                  ? 'bg-[#681B2B] text-white shadow-xs font-bold'
                  : 'text-[#7D6871] hover:text-[#2C1E23]'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Últimos Pagos</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activityTab === 'payments'
                    ? 'bg-white/25 text-white'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {latestPayments.length}
              </span>
            </button>

            <button
              id="tab-act-recent"
              type="button"
              onClick={() => setActivityTab('recent')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activityTab === 'recent'
                  ? 'bg-[#681B2B] text-white shadow-xs font-bold'
                  : 'text-[#7D6871] hover:text-[#2C1E23]'
              }`}
            >
              <span>Bitácora Reciente</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Próximos Pedidos */}
        {activityTab === 'upcoming' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#7D6871]">
                Entregas ordenadas por fecha y hora más cercana
              </span>
              <button
                type="button"
                onClick={() => setActiveView('orders')}
                className="text-xs font-bold text-[#681B2B] hover:underline flex items-center gap-1 cursor-pointer"
              >
                Ver todos los pedidos
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {upcomingOrders.length === 0 ? (
              <EmptyState
                title="No hay entregas pendientes"
                description="Todos los pedidos activos han sido completados o no existen órdenes programadas."
              />
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#F2D6DE]/60 text-[#8C7A82] uppercase text-[11px] font-bold tracking-wider">
                        <th className="pb-3 pl-2">Código</th>
                        <th className="pb-3">Cliente</th>
                        <th className="pb-3">Fecha y Hora</th>
                        <th className="pb-3">Estado</th>
                        <th className="pb-3 text-right">Total</th>
                        <th className="pb-3 text-right">Saldo</th>
                        <th className="pb-3 pr-2 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F2D6DE]/40">
                      {upcomingOrders.map((order) => {
                        const isToday = order.deliveryDate === todayStr;
                        const isLate = order.deliveryDate < todayStr;

                        return (
                          <tr
                            key={order.id}
                            id={`row-dashboard-upcoming-${order.id}`}
                            className="hover:bg-[#FBECEF]/30 transition-colors"
                          >
                            <td className="py-3.5 pl-2 font-bold text-[#681B2B] whitespace-nowrap">
                              {order.code}
                            </td>
                            <td className="py-3.5 font-semibold text-[#2C1E23] whitespace-nowrap">
                              <div>{order.clientName}</div>
                              <div className="text-[11px] text-[#7D6871] font-normal">
                                {order.clientPhone || 'Sin teléfono'}
                              </div>
                            </td>
                            <td className="py-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 font-medium">
                                {isToday ? (
                                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-100 text-sky-800">
                                    Hoy
                                  </span>
                                ) : isLate ? (
                                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800">
                                    Atrasado
                                  </span>
                                ) : (
                                  <DateFormatter dateString={order.deliveryDate} format="short" />
                                )}
                                <span className="text-[#7D6871]">
                                  {order.deliveryTime || '--:--'}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 whitespace-nowrap">
                              <StatusBadge status={order.status} size="sm" />
                            </td>
                            <td className="py-3.5 text-right font-semibold text-[#2C1E23] whitespace-nowrap">
                              <MoneyFormatter value={order.total} />
                            </td>
                            <td className="py-3.5 text-right whitespace-nowrap">
                              {order.balance > 0 ? (
                                <span className="font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md">
                                  <MoneyFormatter value={order.balance} />
                                </span>
                              ) : (
                                <span className="text-emerald-700 font-semibold text-[11px]">
                                  Liquidado
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 pr-2 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => navigateToOrderDetail(order.id, 'dashboard')}
                                className="px-2.5 py-1 rounded-lg bg-[#681B2B]/10 hover:bg-[#681B2B] text-[#681B2B] hover:text-white font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-1"
                              >
                                Ver
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {upcomingOrders.map((order) => {
                    const isToday = order.deliveryDate === todayStr;
                    const isLate = order.deliveryDate < todayStr;

                    return (
                      <div
                        key={order.id}
                        onClick={() => navigateToOrderDetail(order.id, 'dashboard')}
                        className="p-3.5 rounded-xl border border-[#F2D6DE] bg-white hover:border-[#681B2B] shadow-2xs space-y-2 cursor-pointer transition-all active:bg-[#FBECEF]/30"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-[#681B2B]">{order.code}</span>
                          <StatusBadge status={order.status} size="sm" />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#2C1E23]">{order.clientName}</span>
                          <span className="font-bold text-[#2C1E23]">
                            <MoneyFormatter value={order.total} />
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[#7D6871] pt-1 border-t border-[#F2D6DE]/40">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {isToday ? (
                              <strong className="text-sky-700">Hoy</strong>
                            ) : isLate ? (
                              <strong className="text-rose-700">Atrasado</strong>
                            ) : (
                              order.deliveryDate
                            )}{' '}
                            {order.deliveryTime}
                          </span>
                          {order.balance > 0 ? (
                            <span className="text-amber-800 font-bold">
                              Saldo: Q {order.balance.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-bold">Liquidado</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 2: Últimos Pagos Registrados */}
        {activityTab === 'payments' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#7D6871]">
                Historial de cobros, abonos y anticipos recibidos en quetzales (Q)
              </span>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Cobranza reciente
              </span>
            </div>

            {latestPayments.length === 0 ? (
              <EmptyState
                title="Sin registros de pagos"
                description="No se han registrado abonos o anticipos en el sistema aún."
              />
            ) : (
              <div className="divide-y divide-[#F2D6DE]/40">
                {latestPayments.map((pay) => (
                  <div
                    key={pay.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-[#FBECEF]/20 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center shrink-0 mt-0.5">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigateToOrderDetail(pay.orderId, 'dashboard')}
                            className="font-bold text-xs text-[#681B2B] hover:underline cursor-pointer"
                          >
                            {pay.orderCode}
                          </button>
                          <span className="text-xs text-[#2C1E23] font-medium">•</span>
                          <span className="text-xs font-semibold text-[#2C1E23]">
                            {pay.clientName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#7D6871]">
                          <span className="font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded">
                            {pay.concept}
                          </span>
                          <span>• Por {pay.user}</span>
                          <span>• {pay.timestamp.includes('T') ? pay.timestamp.replace('T', ' ').substring(0, 16) : pay.timestamp}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-center pl-12 sm:pl-0">
                      <div className="text-right">
                        <span className="text-sm sm:text-base font-extrabold text-emerald-700">
                          + Q {pay.amount.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigateToOrderDetail(pay.orderId, 'dashboard')}
                        className="p-1.5 rounded-lg text-[#681B2B] hover:bg-[#681B2B]/10 transition-colors cursor-pointer"
                        title="Ver detalle del pedido"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Actividad Reciente Relevante */}
        {activityTab === 'recent' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#7D6871]">
                Registro de eventos clave: cambios de estado, ajustes de insumos y pedidos
              </span>
              {hasPermission('audit.view') && (
                <button
                  type="button"
                  onClick={() => setActiveView('audit')}
                  className="text-xs font-bold text-[#681B2B] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Ver bitácora completa
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {recentActivityLogs.length === 0 ? (
              <EmptyState
                title="Sin actividad registrada"
                description="No se registran eventos operativos recientes en la bitácora."
              />
            ) : (
              <div className="space-y-2.5">
                {recentActivityLogs.map((log) => {
                  const isOrder = log.module === 'Pedidos';
                  const isStock = log.module === 'Inventario' || log.module === 'Componentes';

                  return (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl border border-[#F2D6DE]/60 bg-[#FDF8F9] hover:bg-white hover:border-[#681B2B]/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isOrder
                                ? 'bg-sky-100 text-sky-800'
                                : isStock
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-purple-100 text-purple-900'
                            }`}
                          >
                            {log.module}
                          </span>
                          <span className="text-xs font-bold text-[#2C1E23]">
                            {log.action}
                          </span>
                          {log.recordId && (
                            <span className="text-xs font-semibold text-[#681B2B]">
                              ({log.recordId})
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#7D6871]">{log.description}</p>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <span className="text-[11px] font-medium text-[#2C1E23] block">
                          {log.userName}
                        </span>
                        <span className="text-[10px] text-[#7D6871]">
                          {log.timestamp.includes('T')
                            ? log.timestamp.replace('T', ' ').substring(0, 16)
                            : log.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
