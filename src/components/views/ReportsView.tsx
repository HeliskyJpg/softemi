import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Layers,
  Calendar,
  Filter,
  CalendarDays,
} from 'lucide-react';
import { SystemAlert } from '../common/SystemAlert';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

type PeriodType = 'this_month' | 'last_month' | 'this_year' | 'month_year' | 'custom';

const MONTH_NAMES = [
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

const MONTH_OPTIONS = [
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

const padZero = (n: number) => n.toString().padStart(2, '0');

const getMonthLastDay = (year: number, monthIndex: number) => {
  return new Date(year, monthIndex + 1, 0).getDate();
};

const parseYMD = (str: string) => {
  const [y, m, d] = str.split('-').map(Number);
  return { year: y || 2026, month: (m || 1) - 1, day: d || 1 };
};

const formatRangeLabel = (startStr: string, endStr: string): string => {
  const start = parseYMD(startStr);
  const end = parseYMD(endStr);

  if (startStr === endStr) {
    return `Datos del ${start.day} de ${MONTH_NAMES[start.month]} de ${start.year}`;
  }

  if (start.year === end.year && start.month === end.month) {
    return `Datos del ${start.day} al ${end.day} de ${MONTH_NAMES[start.month]} de ${start.year}`;
  }

  if (start.year === end.year) {
    return `Datos del ${start.day} de ${MONTH_NAMES[start.month]} al ${end.day} de ${MONTH_NAMES[end.month]} de ${start.year}`;
  }

  return `Datos del ${start.day} de ${MONTH_NAMES[start.month]} de ${start.year} al ${end.day} de ${MONTH_NAMES[end.month]} de ${end.year}`;
};

export const ReportsView: React.FC = () => {
  const { orders } = useApp();

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonthIndex = today.getMonth();

  // Period Filter State
  const [periodType, setPeriodType] = useState<PeriodType>('this_month');
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthIndex);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [customStart, setCustomStart] = useState<string>(
    `${currentYear}-${padZero(currentMonthIndex + 1)}-01`
  );
  const [customEnd, setCustomEnd] = useState<string>(
    `${currentYear}-${padZero(currentMonthIndex + 1)}-${padZero(
      getMonthLastDay(currentYear, currentMonthIndex)
    )}`
  );

  // Mobile filters collapsible panel
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Available years dynamically gathered from orders + adjacent years
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([currentYear - 1, currentYear, currentYear + 1]);
    orders.forEach((o) => {
      const d = o.deliveryDate || (o.createdAt ? o.createdAt.split('T')[0] : '');
      if (d) {
        const y = parseInt(d.split('-')[0], 10);
        if (!isNaN(y)) yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [orders, currentYear]);

  // Compute active date boundaries
  const { activeStartDate, activeEndDate } = useMemo(() => {
    if (periodType === 'this_month') {
      const lastDay = getMonthLastDay(currentYear, currentMonthIndex);
      return {
        activeStartDate: `${currentYear}-${padZero(currentMonthIndex + 1)}-01`,
        activeEndDate: `${currentYear}-${padZero(currentMonthIndex + 1)}-${padZero(lastDay)}`,
      };
    }

    if (periodType === 'last_month') {
      const prevDate = new Date(currentYear, currentMonthIndex - 1, 1);
      const prevYear = prevDate.getFullYear();
      const prevMonth = prevDate.getMonth();
      const lastDay = getMonthLastDay(prevYear, prevMonth);
      return {
        activeStartDate: `${prevYear}-${padZero(prevMonth + 1)}-01`,
        activeEndDate: `${prevYear}-${padZero(prevMonth + 1)}-${padZero(lastDay)}`,
      };
    }

    if (periodType === 'this_year') {
      return {
        activeStartDate: `${currentYear}-01-01`,
        activeEndDate: `${currentYear}-12-31`,
      };
    }

    if (periodType === 'month_year') {
      const lastDay = getMonthLastDay(selectedYear, selectedMonth);
      return {
        activeStartDate: `${selectedYear}-${padZero(selectedMonth + 1)}-01`,
        activeEndDate: `${selectedYear}-${padZero(selectedMonth + 1)}-${padZero(lastDay)}`,
      };
    }

    // custom
    return {
      activeStartDate: customStart || `${currentYear}-01-01`,
      activeEndDate: customEnd || `${currentYear}-12-31`,
    };
  }, [periodType, selectedMonth, selectedYear, customStart, customEnd, currentYear, currentMonthIndex]);

  // Applied period label formatted in human Spanish
  const appliedPeriodLabel = useMemo(() => {
    return formatRangeLabel(activeStartDate, activeEndDate);
  }, [activeStartDate, activeEndDate]);

  // Filter orders according to active period (using deliveryDate or fallback to createdAt)
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const d = o.deliveryDate || (o.createdAt ? o.createdAt.split('T')[0] : '');
      if (!d) return false;
      return d >= activeStartDate && d <= activeEndDate;
    });
  }, [orders, activeStartDate, activeEndDate]);

  // 1. Orders by Status
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {
      Pendiente: 0,
      'En preparación': 0,
      Listo: 0,
      Entregado: 0,
      Cancelado: 0,
    };
    filteredOrders.forEach((o) => {
      if (counts[o.status] !== undefined) counts[o.status]++;
    });

    return [
      { name: 'Pendiente', count: counts['Pendiente'], color: '#B45309' },
      { name: 'En preparación', count: counts['En preparación'], color: '#681B2B' },
      { name: 'Listo', count: counts['Listo'], color: '#4B6B4E' },
      { name: 'Entregado', count: counts['Entregado'], color: '#047857' },
      { name: 'Cancelado', count: counts['Cancelado'], color: '#9B2C2C' },
    ];
  }, [filteredOrders]);

  // 2. Orders by Channel
  const channelData = useMemo(() => {
    const channels: Record<string, number> = {
      WhatsApp: 0,
      Instagram: 0,
      Llamada: 0,
      Otro: 0,
    };
    filteredOrders.forEach((o) => {
      if (channels[o.channel] !== undefined) channels[o.channel]++;
      else channels['Otro'] = (channels['Otro'] || 0) + 1;
    });

    const COLORS = ['#25D366', '#E1306C', '#681B2B', '#7D6871'];
    return Object.keys(channels).map((key, idx) => ({
      name: key,
      value: channels[key],
      color: COLORS[idx % COLORS.length],
    }));
  }, [filteredOrders]);

  // 3. Top Most Used Components in filtered orders
  const topComponentsData = useMemo(() => {
    const compUsage: Record<string, { name: string; quantity: number }> = {};

    filteredOrders.forEach((o) => {
      if (o.status !== 'Cancelado') {
        o.items.forEach((it) => {
          if (!compUsage[it.componentId]) {
            compUsage[it.componentId] = { name: it.componentName, quantity: 0 };
          }
          compUsage[it.componentId].quantity += it.quantity;
        });
      }
    });

    return Object.values(compUsage)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6);
  }, [filteredOrders]);

  // 4. Monthly Distribution (applicable when a full year is selected)
  const isFullYearSelected = periodType === 'this_year' || (
    activeStartDate.endsWith('-01-01') && activeEndDate.endsWith('-12-31')
  );

  const monthlyBreakdownData = useMemo(() => {
    if (!isFullYearSelected) return [];

    const monthAbbrs = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];

    const data = monthAbbrs.map((abbr, index) => ({
      month: abbr,
      monthIndex: index,
      pedidos: 0,
      monto: 0,
    }));

    filteredOrders.forEach((o) => {
      const d = o.deliveryDate || (o.createdAt ? o.createdAt.split('T')[0] : '');
      if (!d) return;
      const parts = d.split('-');
      const mIdx = parseInt(parts[1], 10) - 1;
      if (mIdx >= 0 && mIdx < 12) {
        data[mIdx].pedidos += 1;
        if (o.status !== 'Cancelado') {
          data[mIdx].monto += o.total;
        }
      }
    });

    return data;
  }, [filteredOrders, isFullYearSelected]);

  // Financial KPI totals
  const totalVolume = filteredOrders
    .filter((o) => o.status !== 'Cancelado')
    .reduce((sum, o) => sum + o.total, 0);

  const totalAdvance = filteredOrders
    .filter((o) => o.status !== 'Cancelado')
    .reduce((sum, o) => sum + o.advancePayment, 0);

  const deliveredCount = filteredOrders.filter((o) => o.status === 'Entregado').length;
  const activeOrdersCount = filteredOrders.filter((o) => o.status !== 'Cancelado').length;
  const deliveryRate =
    activeOrdersCount > 0 ? Math.round((deliveredCount / activeOrdersCount) * 100) : 0;

  return (
    <div id="reports-view-container" className="space-y-6 pb-16">
      {/* Header & Discreet Period Tag */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#2C1E23] tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#681B2B]" />
            Reportes
          </h1>
          <p className="text-xs sm:text-sm text-[#7D6871] mt-0.5">
            Resumen de pedidos, pagos y entregas.
          </p>
        </div>

        {/* Discreet applied period indicator */}
        <div
          id="applied-period-badge"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#F2D6DE] shadow-2xs self-start sm:self-auto"
        >
          <CalendarDays className="w-4 h-4 text-[#681B2B] shrink-0" />
          <span className="text-xs font-medium text-[#2C1E23]">{appliedPeriodLabel}</span>
        </div>
      </div>

      {/* Period Filter Bar */}
      <div
        id="reports-filter-bar"
        className="bg-white rounded-2xl p-3 sm:p-4 border border-[#F2D6DE]/60 shadow-xs space-y-3"
      >
        {/* Top filter controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#2C1E23]">
              <Filter className="w-3.5 h-3.5 text-[#681B2B]" />
              <span>Período:</span>
            </div>

            {/* Mobile collapsible toggle */}
            <button
              type="button"
              onClick={() => setShowMobileFilters((prev) => !prev)}
              className="sm:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#FAF7F5] border border-[#F2D6DE] text-[#2C1E23] cursor-pointer"
            >
              <span>Filtros</span>
            </button>
          </div>

          {/* Preset Buttons: Desktop always visible, Mobile in collapsible or compact bar */}
          <div
            className={`${
              showMobileFilters ? 'flex' : 'hidden sm:flex'
            } flex-wrap items-center gap-1.5`}
          >
            <button
              id="filter-period-this-month"
              type="button"
              onClick={() => setPeriodType('this_month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                periodType === 'this_month'
                  ? 'bg-[#681B2B] text-white shadow-2xs'
                  : 'bg-[#FAF7F5] text-[#7D6871] hover:text-[#2C1E23] hover:bg-[#FBECEF]/40'
              }`}
            >
              Este mes
            </button>

            <button
              id="filter-period-last-month"
              type="button"
              onClick={() => setPeriodType('last_month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                periodType === 'last_month'
                  ? 'bg-[#681B2B] text-white shadow-2xs'
                  : 'bg-[#FAF7F5] text-[#7D6871] hover:text-[#2C1E23] hover:bg-[#FBECEF]/40'
              }`}
            >
              Mes anterior
            </button>

            <button
              id="filter-period-this-year"
              type="button"
              onClick={() => setPeriodType('this_year')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                periodType === 'this_year'
                  ? 'bg-[#681B2B] text-white shadow-2xs'
                  : 'bg-[#FAF7F5] text-[#7D6871] hover:text-[#2C1E23] hover:bg-[#FBECEF]/40'
              }`}
            >
              Este año
            </button>

            <button
              id="filter-period-month-year"
              type="button"
              onClick={() => setPeriodType('month_year')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                periodType === 'month_year'
                  ? 'bg-[#681B2B] text-white shadow-2xs'
                  : 'bg-[#FAF7F5] text-[#7D6871] hover:text-[#2C1E23] hover:bg-[#FBECEF]/40'
              }`}
            >
              Seleccionar mes y año
            </button>

            <button
              id="filter-period-custom"
              type="button"
              onClick={() => setPeriodType('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                periodType === 'custom'
                  ? 'bg-[#681B2B] text-white shadow-2xs'
                  : 'bg-[#FAF7F5] text-[#7D6871] hover:text-[#2C1E23] hover:bg-[#FBECEF]/40'
              }`}
            >
              Rango personalizado
            </button>
          </div>
        </div>

        {/* Dynamic sub-controls for "month_year" */}
        {periodType === 'month_year' && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F2D6DE]/40">
            <span className="text-xs font-medium text-[#7D6871]">Seleccionar:</span>
            <select
              id="select-report-month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              aria-label="Seleccionar mes"
              className="px-3 py-1.5 rounded-xl border border-[#F2D6DE] text-xs font-semibold text-[#2C1E23] bg-white focus:outline-none focus:ring-1 focus:ring-[#681B2B]"
            >
              {MONTH_OPTIONS.map((m, idx) => (
                <option key={idx} value={idx}>
                  {m}
                </option>
              ))}
            </select>

            <select
              id="select-report-year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              aria-label="Seleccionar año"
              className="px-3 py-1.5 rounded-xl border border-[#F2D6DE] text-xs font-semibold text-[#2C1E23] bg-white focus:outline-none focus:ring-1 focus:ring-[#681B2B]"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Dynamic sub-controls for "custom" date range */}
        {periodType === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#F2D6DE]/40">
            <div className="flex items-center gap-1.5">
              <label htmlFor="input-custom-start" className="text-xs font-medium text-[#7D6871]">
                Desde:
              </label>
              <input
                id="input-custom-start"
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2.5 py-1 rounded-xl border border-[#F2D6DE] text-xs font-semibold text-[#2C1E23] bg-white focus:outline-none focus:ring-1 focus:ring-[#681B2B]"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <label htmlFor="input-custom-end" className="text-xs font-medium text-[#7D6871]">
                Hasta:
              </label>
              <input
                id="input-custom-end"
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2.5 py-1 rounded-xl border border-[#F2D6DE] text-xs font-semibold text-[#2C1E23] bg-white focus:outline-none focus:ring-1 focus:ring-[#681B2B]"
              />
            </div>

            {customStart && customEnd && customStart > customEnd && (
              <div className="w-full mt-1">
                <SystemAlert
                  id="alert-invalid-date-range"
                  type="warning"
                  message="La fecha inicial es posterior a la fecha final. Invierta las fechas para ver las estadísticas correctamente."
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total de pedidos */}
        <div id="kpi-total-orders" className="bg-white rounded-2xl p-5 border border-[#F2D6DE]/60 shadow-xs">
          <span className="text-[11px] font-bold text-[#7D6871] uppercase tracking-wider">
            Total de pedidos
          </span>
          <div className="text-2xl font-extrabold text-[#2C1E23] mt-1">
            {filteredOrders.length}
          </div>
          <p className="text-[11px] text-[#7D6871] mt-0.5">
            {filteredOrders.length === 0
              ? 'Sin pedidos en el período'
              : `${activeOrdersCount} activos en taller`}
          </p>
        </div>

        {/* KPI 2: Total en pedidos */}
        <div id="kpi-total-amount" className="bg-white rounded-2xl p-5 border border-[#F2D6DE]/60 shadow-xs">
          <span className="text-[11px] font-bold text-[#681B2B] uppercase tracking-wider">
            Total en pedidos
          </span>
          <div className="text-2xl font-extrabold text-[#681B2B] mt-1">
            Q{totalVolume.toFixed(2)}
          </div>
          <p className="text-[11px] text-[#7D6871] mt-0.5">
            {activeOrdersCount} pedidos registrados
          </p>
        </div>

        {/* KPI 3: Total pagado */}
        <div id="kpi-total-paid" className="bg-white rounded-2xl p-5 border border-[#F2D6DE]/60 shadow-xs">
          <span className="text-[11px] font-bold text-[#4B6B4E] uppercase tracking-wider">
            Total pagado
          </span>
          <div className="text-2xl font-extrabold text-[#4B6B4E] mt-1">
            Q{totalAdvance.toFixed(2)}
          </div>
          <p className="text-[11px] text-[#7D6871] mt-0.5">
            Monto cobrado en el período
          </p>
        </div>

        {/* KPI 4: Tasa de entrega */}
        <div id="kpi-delivery-rate" className="bg-white rounded-2xl p-5 border border-[#F2D6DE]/60 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
            Tasa de entrega
          </span>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            {deliveryRate}%
          </div>
          <p className="text-[11px] text-[#7D6871] mt-0.5">
            Pedidos entregados en el período
          </p>
        </div>
      </div>

      {/* Empty State if no orders in filtered period */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-[#F2D6DE]/60 shadow-xs text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FBECEF] text-[#681B2B] flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6 opacity-75" />
          </div>
          <h3 className="text-sm font-bold text-[#2C1E23]">
            No hay pedidos registrados en este período
          </h3>
          <p className="text-xs text-[#7D6871] max-w-sm mx-auto">
            No se encontraron registros entre las fechas seleccionadas. Puedes cambiar el filtro o volver al mes actual.
          </p>
          <button
            type="button"
            onClick={() => setPeriodType('this_month')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#681B2B] hover:bg-[#541421] text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Ver este mes
          </button>
        </div>
      ) : (
        /* Charts Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Yearly breakdown chart when full year is selected */}
          {isFullYearSelected && (
            <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-[#F2D6DE]/60 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-[#2C1E23] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#681B2B]" />
                Pedidos por mes
              </h2>
              <p className="text-xs text-[#7D6871]">
                Volumen y distribución de pedidos a lo largo del año.
              </p>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyBreakdownData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
                  >
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val: number, name: string) => [
                        name === 'pedidos' ? `${val} pedidos` : `Q${val.toFixed(2)}`,
                        name === 'pedidos' ? 'Cantidad de pedidos' : 'Monto total',
                      ]}
                      contentStyle={{
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        border: '1px solid #F2D6DE',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="pedidos" name="pedidos" fill="#681B2B" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Chart 1: Status Distribution */}
          <div className="bg-white rounded-2xl p-5 border border-[#F2D6DE]/60 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-[#2C1E23] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#681B2B]" />
              Pedidos por estado
            </h2>
            <p className="text-xs text-[#7D6871]">
              Distribución de pedidos según su estado actual.
            </p>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statusData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: number) => [`${val} pedidos`, 'Cantidad']}
                    contentStyle={{
                      backgroundColor: '#fff',
                      borderRadius: '12px',
                      border: '1px solid #F2D6DE',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Orders by Reception Channel */}
          <div className="bg-white rounded-2xl p-5 border border-[#F2D6DE]/60 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-[#2C1E23] flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-[#681B2B]" />
              Canales de pedidos
            </h2>
            <p className="text-xs text-[#7D6871]">
              Origen de los pedidos registrados.
            </p>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) =>
                      percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                    }
                  >
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [`${val} pedidos`, 'Canal']}
                    contentStyle={{
                      backgroundColor: '#fff',
                      borderRadius: '12px',
                      border: '1px solid #F2D6DE',
                      fontSize: '12px',
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Top Demanded Components */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-[#F2D6DE]/60 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-[#2C1E23] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#4B6B4E]" />
              Componentes más utilizados
            </h2>
            <p className="text-xs text-[#7D6871]">
              Componentes con mayor uso en los pedidos del período.
            </p>

            <div className="h-64 w-full pt-2">
              {topComponentsData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-[#7D6871]">
                  Sin datos de componentes en este período.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={topComponentsData}
                    margin={{ top: 10, right: 30, left: 60, bottom: 10 }}
                  >
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={140} />
                    <Tooltip
                      formatter={(val: number) => [`${val} unidades`, 'Cantidad']}
                      contentStyle={{
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        border: '1px solid #F2D6DE',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="quantity" fill="#4B6B4E" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
