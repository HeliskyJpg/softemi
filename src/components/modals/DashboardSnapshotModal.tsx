import React, { useState, useRef } from 'react';
import {
  Download,
  X,
  Camera,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Package,
  Banknote,
  Boxes,
  Check,
  Printer,
  Sparkles,
  Info,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';

export interface DashboardSnapshotData {
  capturedAt: Date;
  currentUserName: string;
  operation: {
    todayDeliveries: number;
    todayPending: number;
    lateOrders: number;
    inPrepOrders: number;
    readyOrders: number;
  };
  money: {
    periodLabel: string;
    totalSold: number;
    totalCollected: number;
    pendingBalance: number;
  };
  inventory: {
    lowStockCount: number;
    outOfStockCount: number;
  };
  upcomingOrders: Array<{
    code: string;
    clientName: string;
    deliveryDate: string;
    deliveryTime?: string;
    status: string;
    total: number;
    balance: number;
  }>;
}

interface DashboardSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshotData: DashboardSnapshotData | null;
}

/**
 * Modal "Captura generada" para el Dashboard.
 * Mantiene la lógica de captura aislada para permitir su reemplazo
 * por una implementación real (ej. html2canvas o rasterizador de servidor).
 */
export const DashboardSnapshotModal: React.FC<DashboardSnapshotModalProps> = ({
  isOpen,
  onClose,
  snapshotData,
}) => {
  const { addToast } = useApp();
  const [isDownloading, setIsDownloading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  if (!snapshotData) return null;

  const dateFormatted = snapshotData.capturedAt.toLocaleDateString('es-GT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timeFormatted = snapshotData.capturedAt.toLocaleTimeString('es-GT', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const isoDateForFile = snapshotData.capturedAt
    .toISOString()
    .replace(/[:.]/g, '-')
    .substring(0, 19);

  // Simulación de descarga de imagen
  const handleDownloadImage = () => {
    setIsDownloading(true);

    try {
      // Creamos un canvas dinámico para generar un archivo PNG real para el prototipo
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 700;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Fondo elegante
        ctx.fillStyle = '#FBECEF';
        ctx.fillRect(0, 0, 1200, 700);

        // Tarjeta blanca principal
        ctx.fillStyle = '#FFFFFF';
        ctx.roundRect ? ctx.roundRect(40, 40, 1120, 620, 20) : ctx.fillRect(40, 40, 1120, 620);
        ctx.fill();

        // Borde
        ctx.strokeStyle = '#E8C4CE';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Cabecera
        ctx.fillStyle = '#681B2B';
        ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('EMILA — Instantánea del Dashboard Operativo', 70, 95);

        ctx.fillStyle = '#7D6871';
        ctx.font = '16px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(
          `Fecha y hora de captura: ${dateFormatted} • ${timeFormatted} | Usuario: ${snapshotData.currentUserName}`,
          70,
          125
        );

        // Línea divisora
        ctx.strokeStyle = '#F2D6DE';
        ctx.beginPath();
        ctx.moveTo(70, 145);
        ctx.lineTo(1130, 145);
        ctx.stroke();

        // Sección Operación
        ctx.fillStyle = '#2C1E23';
        ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('1. OPERACIÓN DEL DÍA', 70, 185);

        // Bloques de métricas operativas
        const drawMetricBox = (
          x: number,
          y: number,
          w: number,
          h: number,
          title: string,
          val: string,
          sub: string,
          accentColor: string
        ) => {
          ctx.fillStyle = '#FDF8F9';
          ctx.fillRect(x, y, w, h);
          ctx.strokeStyle = '#F2D6DE';
          ctx.strokeRect(x, y, w, h);

          ctx.fillStyle = '#7D6871';
          ctx.font = '13px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(title, x + 15, y + 25);

          ctx.fillStyle = accentColor;
          ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(val, x + 15, y + 60);

          ctx.fillStyle = '#7D6871';
          ctx.font = '11px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(sub, x + 15, y + 80);
        };

        drawMetricBox(
          70,
          205,
          245,
          95,
          'Entregas de hoy',
          `${snapshotData.operation.todayDeliveries}`,
          `${snapshotData.operation.todayPending} pendientes`,
          '#0284C7'
        );
        drawMetricBox(
          335,
          205,
          245,
          95,
          'Pedidos atrasados',
          `${snapshotData.operation.lateOrders}`,
          snapshotData.operation.lateOrders > 0 ? '¡Límite vencido!' : 'Al día',
          snapshotData.operation.lateOrders > 0 ? '#DC2626' : '#059669'
        );
        drawMetricBox(
          600,
          205,
          245,
          95,
          'En preparación',
          `${snapshotData.operation.inPrepOrders}`,
          'En taller',
          '#2563EB'
        );
        drawMetricBox(
          865,
          205,
          245,
          95,
          'Listos para entregar',
          `${snapshotData.operation.readyOrders}`,
          'Por despachar',
          '#059669'
        );

        // Sección Dinero
        ctx.fillStyle = '#2C1E23';
        ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('2. DINERO Y COBRANZA (QUETZALES)', 70, 345);

        drawMetricBox(
          70,
          365,
          330,
          95,
          `Total Vendido (${snapshotData.money.periodLabel})`,
          `Q ${snapshotData.money.totalSold.toFixed(2)}`,
          'En pedidos del período',
          '#2C1E23'
        );
        drawMetricBox(
          430,
          365,
          330,
          95,
          'Total Cobrado (Anticipos/Abonos)',
          `Q ${snapshotData.money.totalCollected.toFixed(2)}`,
          'Liquidado en caja',
          '#059669'
        );
        drawMetricBox(
          790,
          365,
          320,
          95,
          'Saldo Pendiente por Cobrar',
          `Q ${snapshotData.money.pendingBalance.toFixed(2)}`,
          'Por recaudar a la entrega',
          '#D97706'
        );

        // Sección Inventario
        ctx.fillStyle = '#2C1E23';
        ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('3. INVENTARIO CRÍTICO', 70, 505);

        drawMetricBox(
          70,
          525,
          500,
          85,
          'Componentes con bajo stock',
          `${snapshotData.inventory.lowStockCount}`,
          'Insumos cercanos al umbral mínimo',
          '#D97706'
        );
        drawMetricBox(
          610,
          525,
          500,
          85,
          'Componentes agotados',
          `${snapshotData.inventory.outOfStockCount}`,
          'Insumos en cero existencias',
          '#DC2626'
        );

        // Pie de página de agua
        ctx.fillStyle = '#9E8691';
        ctx.font = '12px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(
          'Remix EMILA — Prototipo Administrativo • Reporte exportable de control interno',
          70,
          640
        );

        // Disparo de descarga
        const dataUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = dataUrl;
        downloadLink.download = `captura-dashboard-emila-${isoDateForFile}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }

      setTimeout(() => {
        setIsDownloading(false);
        addToast(
          'Imagen de la captura descargada con éxito (formato PNG).',
          'success',
          'Descarga lista'
        );
      }, 400);
    } catch (err) {
      console.error('Error al generar la descarga de la imagen:', err);
      setIsDownloading(false);
      addToast(
        'Simulación de descarga completada para el prototipo.',
        'info',
        'Captura guardada'
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#681B2B]/10 text-[#681B2B] flex items-center justify-center">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#2C1E23]">
              Captura generada
            </h2>
            <p className="text-xs text-[#7D6871]">
              Instantánea del estado del negocio y panel operativo
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <div className="text-[11px] text-[#7D6871] flex items-center gap-1.5 self-start sm:self-auto">
            <Info className="w-3.5 h-3.5 text-[#681B2B] shrink-0" />
            <span>Simulación del prototipo lista para integración con biblioteca de renderizado.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              id="btn-close-snapshot-modal"
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-xl border border-[#F2D6DE] text-[#2C1E23] hover:bg-[#FDF8F9] font-bold text-xs transition-colors cursor-pointer text-center"
            >
              Cerrar
            </button>
            <button
              id="btn-download-snapshot-image"
              type="button"
              onClick={handleDownloadImage}
              disabled={isDownloading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#681B2B] hover:bg-[#541421] text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Generando imagen...' : 'Descargar imagen'}</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Banner de metadatos de fecha y hora */}
        <div className="bg-[#FDF8F9] border border-[#F2D6DE] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 text-[#2C1E23] font-medium">
            <Calendar className="w-4 h-4 text-[#681B2B] shrink-0" />
            <span className="capitalize">{dateFormatted}</span>
            <span className="text-[#7D6871]">•</span>
            <Clock className="w-4 h-4 text-[#681B2B] shrink-0" />
            <span className="font-bold text-[#681B2B]">{timeFormatted}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Captura completada
            </span>
            <span className="text-[11px] text-[#7D6871]">
              Por: <strong>{snapshotData.currentUserName}</strong>
            </span>
          </div>
        </div>

        {/* Vista previa del dashboard enmarcada */}
        <div className="border border-[#F2D6DE] rounded-2xl overflow-hidden bg-white shadow-xs">
          {/* Barra de título simulada estilo ventana */}
          <div className="bg-[#FBECEF]/70 px-4 py-2.5 border-b border-[#F2D6DE] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-bold text-[#681B2B] ml-2">
                Vista previa de la captura • EMILA
              </span>
            </div>
            <span className="text-[10px] font-semibold text-[#7D6871] uppercase tracking-wider">
              {timeFormatted}
            </span>
          </div>

          {/* Contenido representativo del snapshot */}
          <div
            ref={previewRef}
            id="snapshot-preview-canvas"
            className="p-4 sm:p-5 bg-gradient-to-b from-[#FDF8F9] to-white space-y-4 max-h-[55vh] overflow-y-auto"
          >
            {/* Cabecera del Snapshot */}
            <div className="border-b border-[#F2D6DE]/60 pb-3 flex items-start justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-[#2C1E23] tracking-tight">
                  Remix EMILA — Dashboard Operativo
                </h3>
                <p className="text-[11px] text-[#7D6871] mt-0.5">
                  Instantánea de control para toma de decisiones y seguimiento
                </p>
              </div>
              <span className="text-[11px] font-bold text-[#681B2B] px-2 py-1 rounded bg-[#681B2B]/10">
                Moneda: GTQ (Q)
              </span>
            </div>

            {/* 1. OPERACIÓN */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#7D6871] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#681B2B]" />
                Operación
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white p-3 rounded-xl border border-[#F2D6DE]">
                  <span className="text-[10px] text-[#7D6871] block font-medium">Entregas hoy</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-lg font-black text-[#0284C7]">
                      {snapshotData.operation.todayDeliveries}
                    </span>
                    <span className="text-[10px] text-[#7D6871]">
                      ({snapshotData.operation.todayPending} pend.)
                    </span>
                  </div>
                </div>

                <div
                  className={`p-3 rounded-xl border ${
                    snapshotData.operation.lateOrders > 0
                      ? 'bg-rose-50 border-rose-200'
                      : 'bg-white border-[#F2D6DE]'
                  }`}
                >
                  <span className="text-[10px] text-[#7D6871] block font-medium">Atrasados</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span
                      className={`text-lg font-black ${
                        snapshotData.operation.lateOrders > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {snapshotData.operation.lateOrders}
                    </span>
                    <span className="text-[10px] text-[#7D6871]">
                      {snapshotData.operation.lateOrders > 0 ? 'críticos' : 'al día'}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-[#F2D6DE]">
                  <span className="text-[10px] text-[#7D6871] block font-medium">En taller</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-lg font-black text-blue-600">
                      {snapshotData.operation.inPrepOrders}
                    </span>
                    <span className="text-[10px] text-[#7D6871]">preparación</span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-[#F2D6DE]">
                  <span className="text-[10px] text-[#7D6871] block font-medium">Listos</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-lg font-black text-emerald-600">
                      {snapshotData.operation.readyOrders}
                    </span>
                    <span className="text-[10px] text-[#7D6871]">por entregar</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. DINERO */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#7D6871] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#681B2B]" />
                Dinero y Cobranza ({snapshotData.money.periodLabel})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-white p-3 rounded-xl border border-[#F2D6DE]">
                  <span className="text-[10px] text-[#7D6871] block font-medium">Total Vendido</span>
                  <p className="text-base font-extrabold text-[#2C1E23] mt-0.5">
                    Q {snapshotData.money.totalSold.toFixed(2)}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#F2D6DE]">
                  <span className="text-[10px] text-[#7D6871] block font-medium">Total Cobrado</span>
                  <p className="text-base font-extrabold text-emerald-700 mt-0.5">
                    Q {snapshotData.money.totalCollected.toFixed(2)}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-amber-200 bg-amber-50/40">
                  <span className="text-[10px] text-amber-900 block font-medium">Saldo Pendiente</span>
                  <p className="text-base font-extrabold text-amber-900 mt-0.5">
                    Q {snapshotData.money.pendingBalance.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* 3. INVENTARIO */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#7D6871] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#681B2B]" />
                Inventario Crítico
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-3 rounded-xl border border-[#F2D6DE] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#7D6871] block font-medium">Bajo Stock</span>
                    <span className="text-base font-extrabold text-amber-800">
                      {snapshotData.inventory.lowStockCount} componentes
                    </span>
                  </div>
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#F2D6DE] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#7D6871] block font-medium">Agotados</span>
                    <span className="text-base font-extrabold text-rose-600">
                      {snapshotData.inventory.outOfStockCount} componentes
                    </span>
                  </div>
                  <Package className="w-4 h-4 text-rose-600 shrink-0" />
                </div>
              </div>
            </div>

            {/* 4. PRÓXIMAS ENTREGAS */}
            {snapshotData.upcomingOrders.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-[#7D6871] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#681B2B]" />
                  Próximas Entregas ({snapshotData.upcomingOrders.length})
                </span>
                <div className="divide-y divide-[#F2D6DE]/40 border border-[#F2D6DE] rounded-xl bg-white overflow-hidden text-xs">
                  {snapshotData.upcomingOrders.slice(0, 3).map((o) => (
                    <div key={o.code} className="p-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#681B2B] mr-2">{o.code}</span>
                        <span className="font-medium text-[#2C1E23]">{o.clientName}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-[#2C1E23]">Q {o.total.toFixed(2)}</span>
                        <span className="text-[10px] text-[#7D6871] block">
                          {o.deliveryDate} {o.deliveryTime || ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
