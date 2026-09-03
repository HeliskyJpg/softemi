import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Loader2,
  Receipt,
  Info,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';
import {
  ReportExportFormat,
  generateReportFile,
  PreparedExportResult,
} from '../../services/reportExportService';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  format: ReportExportFormat;
  periodLabel: string;
  startDate: string;
  endDate: string;
  orders: Order[];
  metrics: {
    totalSales: number;
    totalAdvance: number;
    totalBalance: number;
    deliveredCount: number;
    pendingCount: number;
    inPrepCount: number;
    readyCount: number;
    cancelledCount: number;
  };
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  isOpen,
  onClose,
  format,
  periodLabel,
  startDate,
  endDate,
  orders,
  metrics,
}) => {
  const { logAction, addToast } = useApp();

  // Estados de simulación de generación
  const [generationStep, setGenerationStep] = useState<'preparing' | 'completed'>('preparing');
  const [progressPercent, setProgressPercent] = useState<number>(15);
  const [preparedResult, setPreparedResult] = useState<PreparedExportResult | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const hasLoggedAudit = useRef(false);

  // Reiniciar estado cada vez que se abre la modal o cambia de formato
  useEffect(() => {
    if (!isOpen) {
      setGenerationStep('preparing');
      setProgressPercent(15);
      setPreparedResult(null);
      setIsDownloading(false);
      hasLoggedAudit.current = false;
      return;
    }

    setGenerationStep('preparing');
    setProgressPercent(25);
    hasLoggedAudit.current = false;

    // Simulación progresiva de generación
    const timer1 = setTimeout(() => {
      setProgressPercent(65);
    }, 450);

    const timer2 = setTimeout(() => {
      setProgressPercent(100);
      const result = generateReportFile({
        format,
        periodLabel,
        startDate,
        endDate,
        orders,
        metrics,
      });
      setPreparedResult(result);
      setGenerationStep('completed');

      // Registrar en Auditoría (solo una vez por apertura)
      if (!hasLoggedAudit.current) {
        hasLoggedAudit.current = true;
        const formatTitle = format === 'pdf' ? 'PDF' : 'Excel';
        logAction({
          action: `exportar reporte ${formatTitle}`,
          module: 'Reportes',
          entityType: 'Report',
          operationType: 'Reportes y Exportaciones',
          recordId: `REP-${format.toUpperCase()}-${startDate}_${endDate}`,
          description: `Exportación de reporte en formato ${formatTitle} para el período: "${periodLabel}" (${orders.length} pedidos, Total: Q ${metrics.totalSales.toFixed(2)})`,
          previousValue: null,
          newValue: `Reporte preparado correctamente (${formatTitle})`,
          metadata: {
            format,
            periodLabel,
            startDate,
            endDate,
            totalOrders: orders.length,
            totalSales: metrics.totalSales,
            totalAdvance: metrics.totalAdvance,
            totalBalance: metrics.totalBalance,
          },
        });
      }
    }, 1100);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isOpen, format, periodLabel, startDate, endDate, orders, metrics, logAction]);

  if (!isOpen) return null;

  const isPdf = format === 'pdf';
  const formatName = isPdf ? 'PDF' : 'Excel';
  const formatDescription = isPdf
    ? 'Documento listo para impresión y distribución'
    : 'Hoja de cálculo estructurada con fórmulas y datos tabulares';

  const handleDownload = () => {
    if (!preparedResult?.downloadBlob) {
      addToast('No fue posible procesar la descarga.', 'error', 'Error');
      return;
    }

    setIsDownloading(true);

    try {
      const url = URL.createObjectURL(preparedResult.downloadBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', preparedResult.fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast(
        `Reporte en formato ${formatName} descargado correctamente.`,
        'success',
        'Descarga completada'
      );

      setTimeout(() => {
        setIsDownloading(false);
        onClose();
      }, 400);
    } catch {
      setIsDownloading(false);
      addToast(
        `Reporte en formato ${formatName} preparado.`,
        'info',
        'Descarga lista'
      );
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isPdf
                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
            }`}
          >
            {isPdf ? <FileText className="w-5 h-5" /> : <FileSpreadsheet className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-base font-bold text-[#2C1E23]">
              Exportar Reporte ({formatName})
            </h2>
            <p className="text-xs text-[#7D6871]">{formatDescription}</p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <button
            id="btn-close-export-modal"
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#F2D6DE] text-[#2C1E23] hover:bg-[#FDF8F9] font-bold text-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>

          <button
            id="btn-confirm-download-report"
            type="button"
            onClick={handleDownload}
            disabled={generationStep !== 'completed' || isDownloading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#681B2B] hover:bg-[#541421] text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md active:scale-98"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Descargando...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Descargar</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Banner de Estado de Preparación */}
        {generationStep === 'preparing' ? (
          <div className="bg-[#FDF8F9] border border-[#F2D6DE] rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-[#681B2B] animate-spin shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-[#2C1E23]">
                  Preparando reporte en formato {formatName}...
                </h4>
                <p className="text-[11px] text-[#7D6871]">
                  Recopilando pedidos y estructurando métricas del período seleccionado.
                </p>
              </div>
            </div>

            {/* Barra de progreso visual */}
            <div className="w-full bg-[#F2D6DE]/60 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#681B2B] h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : (
          <div
            id="report-ready-banner"
            className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 animate-in fade-in duration-300"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-900">
                  Reporte preparado correctamente
                </h4>
                <p className="text-[11px] text-emerald-700">
                  {preparedResult?.fileName || `reporte_${formatName.toLowerCase()}`}
                  {preparedResult?.formattedFileSize && ` • ${preparedResult.formattedFileSize}`}
                </p>
              </div>
            </div>

            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
              Listo
            </span>
          </div>
        )}

        {/* Resumen del Período y Filtros Aplicados */}
        <div className="bg-white border border-[#F2D6DE] rounded-2xl p-4 space-y-3 shadow-2xs">
          <h5 className="text-[11px] font-bold text-[#7D6871] uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#681B2B]" />
            Período y filtros aplicados
          </h5>

          <div className="bg-[#FAF7F5] rounded-xl p-3 border border-[#F2D6DE]/60 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs text-[#7D6871]">Período activo:</span>
              <span className="text-xs font-bold text-[#2C1E23] text-right">
                {periodLabel}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-[#7D6871]">Rango de fechas:</span>
              <span className="font-medium text-[#2C1E23]">
                {startDate} al {endDate}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-[#7D6871]">Formato solicitado:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  isPdf
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {formatName}
              </span>
            </div>
          </div>

          {/* Métricas de alcance incluidas */}
          <div className="grid grid-cols-3 gap-2 text-xs pt-1">
            <div className="bg-[#FDF8F9] p-2.5 rounded-xl border border-[#F2D6DE]/60 text-center">
              <span className="text-[10px] text-[#7D6871] block font-medium">Pedidos</span>
              <span className="text-sm font-extrabold text-[#2C1E23]">
                {orders.length}
              </span>
            </div>
            <div className="bg-[#FDF8F9] p-2.5 rounded-xl border border-[#F2D6DE]/60 text-center">
              <span className="text-[10px] text-[#7D6871] block font-medium">Total vendido</span>
              <span className="text-sm font-extrabold text-[#681B2B]">
                Q {metrics.totalSales.toFixed(2)}
              </span>
            </div>
            <div className="bg-[#FDF8F9] p-2.5 rounded-xl border border-[#F2D6DE]/60 text-center">
              <span className="text-[10px] text-[#7D6871] block font-medium">Pendiente</span>
              <span className="text-sm font-extrabold text-amber-700">
                Q {metrics.totalBalance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Nota informativa de auditoría */}
        <div className="text-[11px] text-[#7D6871] flex items-center gap-1.5 px-1">
          <Info className="w-3.5 h-3.5 text-[#681B2B] shrink-0" />
          <span>
            Esta acción se registra automáticamente en la bitácora de auditoría del sistema.
          </span>
        </div>
      </div>
    </Modal>
  );
};
