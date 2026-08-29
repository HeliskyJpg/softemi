import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  CalendarDays,
  User,
  PackageCheck,
  RotateCcw,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { Order } from '../../types';

export const CalendarView: React.FC = () => {
  const {
    orders,
    navigateToOrderDetail,
    calendarViewState,
    setCalendarViewState,
  } = useApp();

  const { selectedMonth, selectedYear, selectedDateFilter } = calendarViewState;
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const setSelectedMonth = (updater: number | ((m: number) => number)) => {
    setCalendarViewState((prev) => ({
      ...prev,
      selectedMonth: typeof updater === 'function' ? updater(prev.selectedMonth) : updater,
    }));
  };

  const setSelectedYear = (updater: number | ((y: number) => number)) => {
    setCalendarViewState((prev) => ({
      ...prev,
      selectedYear: typeof updater === 'function' ? updater(prev.selectedYear) : updater,
    }));
  };

  const setSelectedDateFilter = (filter: string) => {
    setCalendarViewState((prev) => ({
      ...prev,
      selectedDateFilter: filter,
    }));
    setCurrentPage(1);
  };

  const months = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const handleGoToToday = () => {
    const today = new Date();
    setSelectedMonth(today.getMonth());
    setSelectedYear(today.getFullYear());
    setSelectedDateFilter(todayStr);
  };

  // Group active orders by delivery date
  const ordersByDate = useMemo(() => {
    return orders.reduce((acc, order) => {
      if (order.status !== 'Cancelado') {
        if (!acc[order.deliveryDate]) acc[order.deliveryDate] = [];
        acc[order.deliveryDate].push(order);
      }
      return acc;
    }, {} as Record<string, Order[]>);
  }, [orders]);

  // Get days in current selected month
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(selectedYear, selectedMonth, 1).getDay(); // 0 = Sun

  const daysArray = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1;
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(
        dayNum
      ).padStart(2, '0')}`;
      return {
        dayNum,
        dateStr,
        orders: ordersByDate[dateStr] || [],
      };
    });
  }, [selectedYear, selectedMonth, daysInMonth, ordersByDate]);

  // Determine active effective date for mobile/desktop view
  const activeDate = selectedDateFilter || todayStr;
  const activeOrdersForDate = ordersByDate[activeDate] || [];

  // Formatted date string in Spanish
  const formatFriendlyDate = (dateStr: string): { title: string; isToday: boolean } => {
    if (!dateStr) return { title: '', isToday: false };
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const monthNames = [
        'enero',
        'febrero',
        'marzo',
        'abril',
        'mayo',
        'junio',
        'julio',
        'agosto',
        'septiembre',
        'octubre',
        'noviembre',
        'diciembre',
      ];
      const dayOfWeek = dayNames[date.getDay()];
      const monthName = monthNames[m - 1];
      const isToday = dateStr === todayStr;

      return {
        title: `${dayOfWeek}, ${d} de ${monthName} ${y}`,
        isToday,
      };
    } catch {
      return { title: dateStr, isToday: false };
    }
  };

  const currentFormatted = formatFriendlyDate(activeDate);

  // Pagination for day orders if many
  const totalPages = Math.ceil(activeOrdersForDate.length / ITEMS_PER_PAGE) || 1;
  const paginatedOrders = activeOrdersForDate.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div id="calendar-view-container" className="space-y-5 sm:space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#2C1E23] tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#681B2B]" />
            Agenda de Entregas
          </h1>
          <p className="text-xs sm:text-sm text-[#7D6871] mt-0.5">
            Organización cronológica y control de pedidos en taller.
          </p>
        </div>

        {/* Controls: Month switcher & Hoy Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleGoToToday}
            className="px-2.5 py-1.5 rounded-xl border border-[#F2D6DE] bg-white text-xs font-semibold text-[#681B2B] hover:bg-[#FBECEF]/40 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Ir al día de hoy"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Hoy</span>
          </button>

          <div className="flex items-center gap-1 sm:gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-[#F2D6DE] shadow-2xs">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-[#FBECEF]/40 text-[#7D6871] hover:text-[#681B2B] cursor-pointer transition-colors"
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-[#2C1E23] min-w-[110px] sm:min-w-[130px] text-center">
              {months[selectedMonth]} {selectedYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-[#FBECEF]/40 text-[#7D6871] hover:text-[#681B2B] cursor-pointer transition-colors"
              title="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Calendar Grid (2 cols on Desktop, Top selector on Mobile) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-3.5 sm:p-5 border border-[#F2D6DE]/80 shadow-xs space-y-3 sm:space-y-4">
          {/* Day of week headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] sm:text-xs font-bold text-[#7D6871] uppercase tracking-wider pb-2 border-b border-[#F2D6DE]/40">
            <span>Dom</span>
            <span>Lun</span>
            <span>Mar</span>
            <span>Mié</span>
            <span>Jue</span>
            <span>Vie</span>
            <span>Sáb</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {/* Blank padding days */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div
                key={`blank-${i}`}
                className="h-10 sm:min-h-[85px] rounded-xl bg-gray-50/40 p-1"
              />
            ))}

            {/* Month days */}
            {daysArray.map(({ dayNum, dateStr, orders: dayOrders }) => {
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === activeDate;
              const hasOrders = dayOrders.length > 0;

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDateFilter(dateStr)}
                  className={`relative rounded-xl p-1 sm:p-2 border transition-all cursor-pointer select-none flex flex-col justify-between items-center sm:items-stretch ${
                    /* Mobile: compact square tap target (h-11 to h-12) */
                    /* Desktop: taller cell with room for preview tags */
                    'h-11 sm:h-auto sm:min-h-[85px]'
                  } ${
                    isSelected
                      ? 'border-[#681B2B] bg-[#FBECEF] ring-2 ring-[#681B2B]/20 shadow-xs'
                      : isToday
                      ? 'border-[#D9A3B5] bg-[#FBECEF]/25'
                      : hasOrders
                      ? 'border-[#F2D6DE] bg-white hover:border-[#D9A3B5] hover:bg-[#FBECEF]/15'
                      : 'border-gray-100 bg-white/70 hover:bg-gray-50'
                  }`}
                >
                  {/* Day Number and Mobile Dot/Badge Indicator */}
                  <div className="flex items-center justify-center sm:justify-between w-full h-full sm:h-auto">
                    <span
                      className={`text-xs font-bold transition-colors ${
                        isToday
                          ? 'w-6 h-6 rounded-full bg-[#681B2B] text-white flex items-center justify-center text-[11px] shadow-2xs'
                          : isSelected
                          ? 'text-[#681B2B] font-extrabold'
                          : 'text-[#2C1E23]'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {/* Desktop Counter Badge */}
                    {hasOrders && (
                      <span className="hidden sm:inline-flex text-[9px] font-extrabold px-1.5 py-0.2 bg-[#681B2B] text-white rounded-full">
                        {dayOrders.length}
                      </span>
                    )}
                  </div>

                  {/* MOBILE INDICATOR ONLY: Clean indicator dot or mini count badge */}
                  {hasOrders && (
                    <div className="sm:hidden flex items-center justify-center mt-auto pb-0.5">
                      {dayOrders.length === 1 ? (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-[#681B2B]' : 'bg-[#681B2B]'
                          }`}
                        />
                      ) : (
                        <span className="text-[8px] font-extrabold leading-none px-1 py-0.5 bg-[#681B2B] text-white rounded-full min-w-[12px] text-center">
                          {dayOrders.length}
                        </span>
                      )}
                    </div>
                  )}

                  {/* DESKTOP VIEW ONLY: Order tags inside day */}
                  <div className="hidden sm:block space-y-1 mt-1.5 overflow-hidden">
                    {dayOrders.slice(0, 2).map((ord) => (
                      <div
                        key={ord.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToOrderDetail(ord.id, 'calendar');
                        }}
                        className="text-[10px] font-medium truncate px-1.5 py-0.5 rounded bg-[#FBECEF]/60 text-[#681B2B] border border-[#F2D6DE]/70 hover:bg-[#681B2B] hover:text-white transition-colors"
                        title={`${ord.code} - ${ord.clientName}`}
                      >
                        {ord.deliveryTime ? `${ord.deliveryTime} ` : ''}
                        {ord.clientName}
                      </div>
                    ))}
                    {dayOrders.length > 2 && (
                      <span className="text-[9px] text-[#7D6871] font-bold block text-center">
                        +{dayOrders.length - 2} más
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Legend */}
          <div className="pt-2 border-t border-[#F2D6DE]/40 flex items-center justify-between text-[11px] text-[#7D6871]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#681B2B]" />
                Con pedidos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FBECEF] border border-[#681B2B]" />
                Seleccionado
              </span>
            </div>
            <span className="text-[10px] text-[#7D6871]/80 hidden sm:inline">
              Toca cualquier fecha para consultar pedidos
            </span>
          </div>
        </div>

        {/* Orders for Selected Date (Main focus on Mobile, Side panel on Desktop) */}
        <div id="selected-day-orders-section" className="space-y-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#F2D6DE]/80 shadow-xs flex flex-col">
            {/* Header: Selected Date & Total Count */}
            <div className="border-b border-[#F2D6DE]/50 pb-3 mb-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#681B2B] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Pedidos del día
                </span>

                <div className="flex items-center gap-1.5">
                  {currentFormatted.isToday && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full">
                      Hoy
                    </span>
                  )}
                  <span className="text-xs font-extrabold px-2 py-0.5 bg-[#FBECEF] text-[#681B2B] rounded-full">
                    {activeOrdersForDate.length}{' '}
                    {activeOrdersForDate.length === 1 ? 'pedido' : 'pedidos'}
                  </span>
                </div>
              </div>

              <h2 className="text-sm sm:text-base font-bold text-[#2C1E23] mt-1 capitalize leading-snug">
                {currentFormatted.title}
              </h2>
            </div>

            {/* List / Vertical Cards */}
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-0.5">
              {activeOrdersForDate.length === 0 ? (
                /* Empty State */
                <div className="text-center py-10 px-4 space-y-2.5">
                  <div className="w-11 h-11 mx-auto rounded-full bg-[#FBECEF] flex items-center justify-center text-[#681B2B]">
                    <PackageCheck className="w-5 h-5 opacity-70" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#2C1E23]">
                      Sin pedidos para esta fecha
                    </h4>
                    <p className="text-[11px] text-[#7D6871] mt-0.5 max-w-[200px] mx-auto">
                      No hay entregas programadas en el taller para este día.
                    </p>
                  </div>
                </div>
              ) : (
                /* Order Cards */
                paginatedOrders.map((order) => (
                  <div
                    key={order.id}
                    id={`calendar-order-card-${order.id}`}
                    onClick={() => navigateToOrderDetail(order.id, 'calendar')}
                    className="p-3.5 rounded-xl bg-white border border-[#F2D6DE] hover:border-[#681B2B] hover:shadow-xs transition-all cursor-pointer group space-y-2.5"
                  >
                    {/* Top Row: Code + Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-xs text-[#681B2B] group-hover:underline">
                        {order.code}
                      </span>
                      <StatusBadge status={order.status} size="sm" />
                    </div>

                    {/* Middle Row: Client & Description */}
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-[#2C1E23] flex items-center gap-1.5">
                        <User className="w-3 h-3 text-[#7D6871] shrink-0" />
                        <span className="truncate">{order.clientName}</span>
                      </div>
                      {order.description && (
                        <p className="text-[11px] text-[#7D6871] truncate mt-0.5">
                          {order.description}
                        </p>
                      )}
                    </div>

                    {/* Bottom Row: Delivery Time & Detail Action */}
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-[#F2D6DE]/40">
                      <span className="flex items-center gap-1 text-[#7D6871] font-medium text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-[#681B2B]" />
                        {order.deliveryTime ? `${order.deliveryTime} hrs` : 'Hora por definir'}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToOrderDetail(order.id, 'calendar');
                        }}
                        className="text-[11px] font-bold text-[#681B2B] hover:text-[#541421] flex items-center gap-1 group-hover:underline cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        Ver detalle
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination Controls if > ITEMS_PER_PAGE */}
            {totalPages > 1 && (
              <div className="pt-3 mt-3 border-t border-[#F2D6DE]/50 flex items-center justify-between text-xs">
                <span className="text-[11px] text-[#7D6871]">
                  Página {currentPage} de {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1 rounded-lg border border-[#F2D6DE] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 text-[#7D6871] cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1 rounded-lg border border-[#F2D6DE] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 text-[#7D6871] cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


