import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

export const CalendarView: React.FC = () => {
  const {
    orders,
    navigateToOrderDetail,
    calendarViewState,
    setCalendarViewState,
  } = useApp();

  const { selectedMonth, selectedYear, selectedDateFilter } = calendarViewState;

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

  // Group orders by delivery date
  const ordersByDate = orders.reduce((acc, order) => {
    if (order.status !== 'Cancelado') {
      if (!acc[order.deliveryDate]) acc[order.deliveryDate] = [];
      acc[order.deliveryDate].push(order);
    }
    return acc;
  }, {} as Record<string, typeof orders>);

  // Get days in current selected month
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(selectedYear, selectedMonth, 1).getDay(); // 0 = Sun

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
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

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredOrdersList = selectedDateFilter
    ? ordersByDate[selectedDateFilter] || []
    : orders.filter((o) => o.status !== 'Cancelado');

  return (
    <div id="calendar-view-container" className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2C1E23] tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-[#681B2B]" />
            Agenda y Calendario de Entregas
          </h1>
          <p className="text-xs sm:text-sm text-[#7D6871] mt-0.5">
            Organización cronológica de pedidos programados y control de carga en taller.
          </p>
        </div>

        {/* Month switcher */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#F2D6DE]/60 shadow-xs">
          <button
            onClick={handlePrevMonth}
            className="p-1 rounded-lg hover:bg-[#FBECEF]/40 text-[#7D6871] hover:text-[#681B2B] cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-[#2C1E23] min-w-[130px] text-center">
            {months[selectedMonth]} {selectedYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1 rounded-lg hover:bg-[#FBECEF]/40 text-[#7D6871] hover:text-[#681B2B] cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-[#F2D6DE]/60 shadow-xs space-y-4">
          {/* Day of week headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[#7D6871] uppercase tracking-wider pb-2 border-b border-[#F2D6DE]/40">
            <span>Dom</span>
            <span>Lun</span>
            <span>Mar</span>
            <span>Mié</span>
            <span>Jue</span>
            <span>Vie</span>
            <span>Sáb</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Blank padding days */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`blank-${i}`} className="min-h-[75px] rounded-xl bg-gray-50/40 p-1" />
            ))}

            {/* Month days */}
            {daysArray.map(({ dayNum, dateStr, orders: dayOrders }) => {
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDateFilter;
              const hasOrders = dayOrders.length > 0;

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDateFilter(isSelected ? '' : dateStr)}
                  className={`min-h-[85px] rounded-xl p-1.5 border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#681B2B] bg-[#FBECEF]/40 ring-2 ring-[#681B2B]/20'
                      : isToday
                      ? 'border-[#F2D6DE] bg-[#FBECEF]/20'
                      : hasOrders
                      ? 'border-gray-200 bg-white hover:border-[#F2D6DE] hover:bg-[#FBECEF]/10'
                      : 'border-gray-100 bg-white/70 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-extrabold ${
                        isToday
                          ? 'w-5 h-5 rounded-full bg-[#681B2B] text-white flex items-center justify-center text-[10px]'
                          : 'text-[#2C1E23]'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {hasOrders && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 bg-[#681B2B] text-white rounded-full">
                        {dayOrders.length}
                      </span>
                    )}
                  </div>

                  {/* Tiny order tags inside day */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayOrders.slice(0, 2).map((ord) => (
                      <div
                        key={ord.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToOrderDetail(ord.id, 'calendar');
                        }}
                        className="text-[9px] font-semibold truncate px-1.5 py-0.5 rounded bg-[#FBECEF]/40 text-[#681B2B] border border-[#F2D6DE]/60 hover:bg-[#681B2B] hover:text-white transition-colors"
                        title={`${ord.code} - ${ord.clientName}`}
                      >
                        {ord.deliveryTime ? `${ord.deliveryTime} ` : ''}
                        {ord.clientName}
                      </div>
                    ))}
                    {dayOrders.length > 2 && (
                      <span className="text-[8px] text-[#7D6871] font-bold block text-center">
                        +{dayOrders.length - 2} más
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Deliveries on selected date / Upcoming sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-[#F2D6DE]/60 shadow-xs">
            <div className="flex items-center justify-between mb-3 border-b border-[#F2D6DE]/40 pb-2">
              <h3 className="text-sm font-bold text-[#2C1E23] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#681B2B]" />
                {selectedDateFilter ? `Entregas para ${selectedDateFilter}` : 'Próximas Entregas'}
              </h3>
              {selectedDateFilter && (
                <button
                  onClick={() => setSelectedDateFilter('')}
                  className="text-[11px] text-[#681B2B] hover:underline font-semibold cursor-pointer"
                >
                  Ver todas
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {filteredOrdersList.length === 0 ? (
                <p className="text-xs text-[#7D6871] text-center py-8">
                  No hay pedidos programados para esta fecha.
                </p>
              ) : (
                filteredOrdersList.map((order) => (
                  <div
                    key={order.id}
                    id={`calendar-order-${order.id}`}
                    className="p-3 rounded-xl bg-[#FBECEF]/20 border border-[#F2D6DE]/60 hover:border-[#681B2B] transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#681B2B]">{order.code}</span>
                      <StatusBadge status={order.status} size="sm" />
                    </div>

                    <div>
                      <div className="font-bold text-xs text-[#2C1E23]">{order.clientName}</div>
                      <p className="text-[11px] text-[#7D6871] truncate">{order.description}</p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#7D6871] pt-1 border-t border-[#F2D6DE]/40">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#059669]" />
                        {order.deliveryDate} ({order.deliveryTime || '--:--'})
                      </span>
                      <button
                        onClick={() => navigateToOrderDetail(order.id, 'calendar')}
                        className="font-bold text-[#681B2B] hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        Detalle
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

