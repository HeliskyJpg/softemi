import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  ShoppingBag,
  Layers,
  Sparkles,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
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

export const ReportsView: React.FC = () => {
  const { orders, components } = useApp();

  // 1. Orders by Status
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {
      Pendiente: 0,
      'En preparación': 0,
      Listo: 0,
      Entregado: 0,
      Cancelado: 0,
    };
    orders.forEach((o) => {
      if (counts[o.status] !== undefined) counts[o.status]++;
    });

    return [
      { name: 'Pendiente', count: counts['Pendiente'], color: '#B45309' },
      { name: 'En preparación', count: counts['En preparación'], color: '#8E315E' },
      { name: 'Listo', count: counts['Listo'], color: '#65733D' },
      { name: 'Entregado', count: counts['Entregado'], color: '#047857' },
      { name: 'Cancelado', count: counts['Cancelado'], color: '#9B2C2C' },
    ];
  }, [orders]);

  // 2. Orders by Channel
  const channelData = useMemo(() => {
    const channels: Record<string, number> = {
      WhatsApp: 0,
      Instagram: 0,
      Llamada: 0,
      Otro: 0,
    };
    orders.forEach((o) => {
      if (channels[o.channel] !== undefined) channels[o.channel]++;
      else channels['Otro'] = (channels['Otro'] || 0) + 1;
    });

    const COLORS = ['#25D366', '#E1306C', '#8E315E', '#6D5C64'];
    return Object.keys(channels).map((key, idx) => ({
      name: key,
      value: channels[key],
      color: COLORS[idx % COLORS.length],
    }));
  }, [orders]);

  // 3. Top Most Used Components
  const topComponentsData = useMemo(() => {
    const compUsage: Record<string, { name: string; quantity: number }> = {};

    orders.forEach((o) => {
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
  }, [orders]);

  // Financial KPI totals
  const totalVolume = orders
    .filter((o) => o.status !== 'Cancelado')
    .reduce((sum, o) => sum + o.total, 0);

  const totalAdvance = orders
    .filter((o) => o.status !== 'Cancelado')
    .reduce((sum, o) => sum + o.advancePayment, 0);

  const deliveredCount = orders.filter((o) => o.status === 'Entregado').length;
  const activeOrdersCount = orders.filter((o) => o.status !== 'Cancelado').length;
  const deliveryRate =
    activeOrdersCount > 0 ? Math.round((deliveredCount / activeOrdersCount) * 100) : 0;

  return (
    <div id="reports-view-container" className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#3A2D33] tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-[#8E315E]" />
          Reportes y Estadísticas de Pedidos
        </h1>
        <p className="text-xs sm:text-sm text-[#6D5C64] mt-0.5">
          Análisis del volumen de pedidos, canales de recepción e insumos más solicitados en taller.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#FBDAE3] shadow-xs">
          <span className="text-[11px] font-bold text-[#6D5C64] uppercase">Total de Pedidos</span>
          <div className="text-2xl font-extrabold text-[#3A2D33] mt-1">{orders.length}</div>
          <p className="text-[11px] text-[#6D5C64] mt-0.5">{activeOrdersCount} pedidos activos</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#FBDAE3] shadow-xs">
          <span className="text-[11px] font-bold text-[#8E315E] uppercase">
            Monto de Pedidos Activos
          </span>
          <div className="text-2xl font-extrabold text-[#8E315E] mt-1">
            Q {totalVolume.toFixed(2)}
          </div>
          <p className="text-[11px] text-[#6D5C64] mt-0.5">Excluye pedidos cancelados</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#FBDAE3] shadow-xs">
          <span className="text-[11px] font-bold text-[#65733D] uppercase">
            Anticipos Recibidos
          </span>
          <div className="text-2xl font-extrabold text-[#65733D] mt-1">
            Q {totalAdvance.toFixed(2)}
          </div>
          <p className="text-[11px] text-[#6D5C64] mt-0.5">Ingresos iniciales en taller</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#FBDAE3] shadow-xs">
          <span className="text-[11px] font-bold text-emerald-800 uppercase">Tasa de Entrega</span>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">{deliveryRate}%</div>
          <p className="text-[11px] text-[#6D5C64] mt-0.5">{deliveredCount} pedidos entregados</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Status Distribution */}
        <div className="bg-white rounded-2xl p-5 border border-[#FBDAE3] shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-[#3A2D33] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#8E315E]" />
            Distribución de Pedidos por Estado
          </h2>
          <p className="text-xs text-[#6D5C64]">
            Cantidad de órdenes en cada etapa del flujo de taller.
          </p>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: number) => [`${val} pedidos`, 'Cantidad']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #FBDAE3', fontSize: '12px' }}
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
        <div className="bg-white rounded-2xl p-5 border border-[#FBDAE3] shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-[#3A2D33] flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-[#8E315E]" />
            Canales de Recepción de Pedidos
          </h2>
          <p className="text-xs text-[#6D5C64]">
            Proporción de pedidos ingresados por WhatsApp, Instagram, Llamada u otros.
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
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => [`${val} pedidos`, 'Canal']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #FBDAE3', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Top Demanded Components */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-[#FBDAE3] shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-[#3A2D33] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#65733D]" />
            Insumos y Flores Más Solicitados en Pedidos Personalizados
          </h2>
          <p className="text-xs text-[#6D5C64]">
            Ranking de componentes con mayor consumo acumulado en los arreglos florales activos.
          </p>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={topComponentsData}
                margin={{ top: 10, right: 30, left: 60, bottom: 10 }}
              >
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
                <Tooltip
                  formatter={(val: number) => [`${val} unidades utilizadas`, 'Consumo']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #FBDAE3', fontSize: '12px' }}
                />
                <Bar dataKey="quantity" fill="#65733D" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
