import { Order } from '../types';

export type ReportExportFormat = 'pdf' | 'excel';

export interface ReportExportParams {
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
    channelBreakdown?: Array<{ name: string; count: number; total: number }>;
  };
}

export interface PreparedExportResult {
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  formattedFileSize: string;
  downloadUrl?: string;
  downloadBlob?: Blob;
}

/**
 * BACKEND INTEGRATION SPECIFICATION (FLASK VERSION):
 * ----------------------------------------------------
 * When migrating to the Flask production backend:
 *
 * 1. PDF Export:
 *    - Route: POST /api/reports/export/pdf
 *    - Engine: WeasyPrint (templates/reports/report_pdf.html -> WeasyPrint HTML(string=html).write_pdf())
 *    - Features: Header branding, tables with pagination, headers/footers with page numbers.
 *
 * 2. Excel Export:
 *    - Route: POST /api/reports/export/excel
 *    - Engine: openpyxl or xlsxwriter
 *    - Features: Multi-sheet workbook ('Resumen Ejecutivo', 'Detalle de Pedidos', 'Canales de Venta'),
 *      formatted currency columns (Q #,##0.00), styled headers, auto-fit columns.
 */

/**
 * Formatea bytes en cadena legible para usuario (sin tecnicismos)
 */
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Genera el archivo descargable para el prototipo según el formato seleccionado.
 */
export const generateReportFile = (params: ReportExportParams): PreparedExportResult => {
  const { format, startDate, endDate, orders, metrics } = params;
  const timestampStr = `${startDate}_al_${endDate}`;

  if (format === 'excel') {
    const fileName = `reporte_pedidos_emila_${timestampStr}.csv`;

    // Generamos un contenido estructurado con UTF-8 BOM compatible con Microsoft Excel
    const headerLines = [
      'REMIX EMILA — REPORTE DE VENTAS Y OPERACIÓN',
      `Período aplicado: "${params.periodLabel}"`,
      `Rango de fechas: ${startDate} al ${endDate}`,
      `Fecha de emisión: ${new Date().toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      '',
      'RESUMEN GENERAL DEL PERÍODO',
      `Total de pedidos registrados,${orders.length}`,
      `Monto Total Vendido (Q),${metrics.totalSales.toFixed(2)}`,
      `Total Cobrado en Anticipos y Abonos (Q),${metrics.totalAdvance.toFixed(2)}`,
      `Saldo Pendiente por Cobrar (Q),${metrics.totalBalance.toFixed(2)}`,
      `Pedidos Entregados,${metrics.deliveredCount}`,
      `Pedidos Listos para entrega,${metrics.readyCount}`,
      `Pedidos En preparación,${metrics.inPrepCount}`,
      `Pedidos Pendientes,${metrics.pendingCount}`,
      `Pedidos Cancelados,${metrics.cancelledCount}`,
      '',
      'DETALLE DE PEDIDOS',
      'Código,Cliente,Teléfono,Canal,Fecha Entrega,Hora Entrega,Estado,Total (Q),Anticipo (Q),Saldo (Q)',
    ];

    const orderRows = orders.map((o) => {
      const sanitizedName = (o.clientName || '').replace(/"/g, '""');
      const sanitizedPhone = (o.clientPhone || '').replace(/"/g, '""');
      const time = o.deliveryTime || '--:--';
      return `${o.code},"${sanitizedName}","${sanitizedPhone}",${o.channel},${o.deliveryDate},${time},${o.status},${o.total.toFixed(2)},${o.advancePayment.toFixed(2)},${o.balance.toFixed(2)}`;
    });

    const csvBody = '\uFEFF' + [...headerLines, ...orderRows].join('\r\n');
    const blob = new Blob([csvBody], { type: 'text/csv;charset=utf-8;' });
    const size = blob.size;

    return {
      fileName,
      mimeType: 'application/vnd.ms-excel',
      fileSizeBytes: size,
      formattedFileSize: formatFileSize(size || 15400),
      downloadBlob: blob,
    };
  }

  // Format: PDF
  const fileName = `reporte_operativo_emila_${timestampStr}.pdf`;

  // Construimos un documento HTML estilizado con el formato de reporte imprimible de EMILA
  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte Operativo — Remix EMILA</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #2C1E23; margin: 40px; }
    .header { border-bottom: 2px solid #681B2B; padding-bottom: 12px; margin-bottom: 20px; }
    .brand { font-size: 24px; font-weight: bold; color: #681B2B; }
    .subtitle { color: #7D6871; font-size: 13px; margin-top: 4px; }
    .grid { display: flex; gap: 16px; margin-bottom: 24px; }
    .card { flex: 1; background: #FDF8F9; border: 1px solid #F2D6DE; border-radius: 8px; padding: 12px; }
    .card-title { font-size: 11px; color: #7D6871; text-transform: uppercase; font-weight: bold; }
    .card-val { font-size: 20px; font-weight: bold; color: #2C1E23; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
    th { text-align: left; padding: 8px; background: #FBECEF; color: #681B2B; border-bottom: 1px solid #F2D6DE; }
    td { padding: 8px; border-bottom: 1px solid #F2D6DE; }
    .text-right { text-align: right; }
    .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; background: #F2D6DE; color: #681B2B; }
    .footer { margin-top: 40px; font-size: 11px; color: #7D6871; border-top: 1px solid #F2D6DE; padding-top: 10px; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">Remix EMILA — Reporte Operativo y Ventas</div>
    <div class="subtitle">Período: ${params.periodLabel} (${startDate} al ${endDate}) • Generado: ${new Date().toLocaleString('es-GT')}</div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-title">Total Vendido</div>
      <div class="card-val">Q ${metrics.totalSales.toFixed(2)}</div>
    </div>
    <div class="card">
      <div class="card-title">Total Cobrado</div>
      <div class="card-val" style="color: #047857;">Q ${metrics.totalAdvance.toFixed(2)}</div>
    </div>
    <div class="card">
      <div class="card-title">Saldo Pendiente</div>
      <div class="card-val" style="color: #B45309;">Q ${metrics.totalBalance.toFixed(2)}</div>
    </div>
    <div class="card">
      <div class="card-title">Pedidos Totales</div>
      <div class="card-val">${orders.length}</div>
    </div>
  </div>

  <h3>Detalle de Pedidos del Período</h3>
  <table>
    <thead>
      <tr>
        <th>Código</th>
        <th>Cliente</th>
        <th>Canal</th>
        <th>Fecha Entrega</th>
        <th>Estado</th>
        <th class="text-right">Total</th>
        <th class="text-right">Saldo</th>
      </tr>
    </thead>
    <tbody>
      ${orders
        .map(
          (o) => `
        <tr>
          <td><strong>${o.code}</strong></td>
          <td>${o.clientName}</td>
          <td>${o.channel}</td>
          <td>${o.deliveryDate} ${o.deliveryTime || ''}</td>
          <td><span class="badge">${o.status}</span></td>
          <td class="text-right">Q ${o.total.toFixed(2)}</td>
          <td class="text-right">${o.balance > 0 ? `Q ${o.balance.toFixed(2)}` : 'Liquidado'}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <div class="footer">
    Reporte generado automáticamente por Remix EMILA. Documento para uso administrativo interno.
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  // Estimar tamaño representativo de PDF
  const estimatedPdfBytes = 85000 + orders.length * 950;

  return {
    fileName,
    mimeType: 'application/pdf',
    fileSizeBytes: estimatedPdfBytes,
    formattedFileSize: formatFileSize(estimatedPdfBytes),
    downloadBlob: blob,
  };
};
