import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  isSimulated?: boolean;
  simulationNote?: string;
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
      mimeType: 'text/csv;charset=utf-8;',
      fileSizeBytes: size,
      formattedFileSize: formatFileSize(size || 15400),
      downloadBlob: blob,
      isSimulated: false,
      simulationNote: 'Archivo tabular en formato CSV con codificación UTF-8 compatible con Microsoft Excel',
    };
  }

  // Format: PDF
  const fileName = `reporte-emila-${startDate}-${endDate}.pdf`;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Barra de acento institucional EMILA (#681B2B)
  doc.setFillColor(104, 27, 43);
  doc.rect(margin, 12, contentWidth, 1.5, 'F');

  // Encabezado del reporte
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(104, 27, 43);
  doc.text('REMIX EMILA — REPORTE OPERATIVO Y VENTAS', margin, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(125, 104, 113);
  const nowStr = new Date().toLocaleDateString('es-GT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(
    `Período: ${params.periodLabel} (${startDate} al ${endDate}) • Generado: ${nowStr}`,
    margin,
    26
  );

  // Tarjetas de Métricas Ejecutivas del período seleccionado
  const cardY = 31;
  const cardHeight = 17;
  const cardGap = 3;
  const cardWidth = (contentWidth - cardGap * 3) / 4;

  const metricCards = [
    { label: 'TOTAL VENDIDO', value: `Q ${metrics.totalSales.toFixed(2)}`, color: [104, 27, 43] },
    { label: 'TOTAL COBRADO', value: `Q ${metrics.totalAdvance.toFixed(2)}`, color: [4, 120, 87] },
    { label: 'SALDO PENDIENTE', value: `Q ${metrics.totalBalance.toFixed(2)}`, color: [180, 83, 9] },
    { label: 'PEDIDOS TOTALES', value: `${orders.length}`, color: [44, 30, 35] },
  ];

  metricCards.forEach((card, index) => {
    const cardX = margin + index * (cardWidth + cardGap);
    // Fondo y borde suave
    doc.setFillColor(250, 247, 245);
    doc.setDrawColor(242, 214, 222);
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    // Etiqueta
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(125, 104, 113);
    doc.text(card.label, cardX + 3.5, cardY + 5.5);

    // Valor en Quetzales / unidades
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(card.color[0], card.color[1], card.color[2]);
    doc.text(card.value, cardX + 3.5, cardY + 12.5);
  });

  // Resumen del desglose por estado
  const statusSummaryY = 53;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(125, 104, 113);
  doc.text(
    `Desglose: Entregados (${metrics.deliveredCount}) • Listos (${metrics.readyCount}) • En preparación (${metrics.inPrepCount}) • Pendientes (${metrics.pendingCount}) • Cancelados (${metrics.cancelledCount})`,
    margin,
    statusSummaryY
  );

  // Tabla con Detalle de Pedidos
  const tableRows =
    orders.length > 0
      ? orders.map((o) => [
          o.code,
          o.clientName,
          o.channel,
          `${o.deliveryDate}${o.deliveryTime ? ` ${o.deliveryTime}` : ''}`,
          o.status,
          `Q ${o.total.toFixed(2)}`,
          `Q ${o.advancePayment.toFixed(2)}`,
          o.balance > 0 ? `Q ${o.balance.toFixed(2)}` : 'Q 0.00',
        ])
      : [['--', 'Sin pedidos registrados en este período', '--', '--', '--', 'Q 0.00', 'Q 0.00', 'Q 0.00']];

  const runAutoTable = typeof autoTable === 'function' ? autoTable : (autoTable as unknown as { default: typeof autoTable }).default;
  runAutoTable(doc, {
    startY: 57,
    head: [['Código', 'Cliente', 'Canal', 'Fecha Entrega', 'Estado', 'Total', 'Anticipo', 'Saldo']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [104, 27, 43],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
      cellPadding: 2.2,
    },
    bodyStyles: {
      textColor: [44, 30, 35],
      fontSize: 7.5,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [253, 248, 249],
    },
    columnStyles: {
      0: { cellWidth: 22, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 22 },
      3: { cellWidth: 28 },
      4: { cellWidth: 23 },
      5: { cellWidth: 20, halign: 'right' },
      6: { cellWidth: 20, halign: 'right' },
      7: { cellWidth: 20, halign: 'right' },
    },
    margin: { left: margin, right: margin, bottom: 18 },
    showHead: 'everyPage',
  });

  // Numeración de páginas y pie administrativo en cada página generada
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    // Línea divisoria
    doc.setDrawColor(242, 214, 222);
    doc.line(margin, pageHeight - 13, pageWidth - margin, pageHeight - 13);

    // Texto de pie de página
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(125, 104, 113);
    doc.text(
      `Remix EMILA — Reporte Administrativo • Período: ${params.periodLabel}`,
      margin,
      pageHeight - 8.5
    );
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - margin,
      pageHeight - 8.5,
      { align: 'right' }
    );
  }

  const pdfBlob = doc.output('blob');
  const size = pdfBlob.size;

  return {
    fileName,
    mimeType: 'application/pdf',
    fileSizeBytes: size,
    formattedFileSize: formatFileSize(size),
    downloadBlob: pdfBlob,
    isSimulated: false,
  };
};
