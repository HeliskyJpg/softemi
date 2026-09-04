import React, { useEffect, useRef } from 'react';
import {
  Printer,
  X,
  Copy,
  Check,
  Download,
  FileText,
  Calendar,
  Share2,
  AlertCircle,
} from 'lucide-react';
import { Order } from '../../types';
import { OrderReceiptDocument } from '../orders/OrderReceiptDocument';
import { useApp } from '../../context/AppContext';

interface OrderReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onViewFullPage?: () => void;
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({
  isOpen,
  onClose,
  order,
  onViewFullPage,
}) => {
  const { logAction, addToast } = useApp();
  const [copied, setCopied] = React.useState(false);
  const hasLoggedAudit = useRef(false);

  // Registrar auditoría al abrir el comprobante
  useEffect(() => {
    if (isOpen && !hasLoggedAudit.current) {
      logAction({
        action: 'generar comprobante',
        module: 'Pedidos',
        entityType: 'Order',
        recordId: order.code,
        description: `Generación de comprobante imprimible para pedido ${order.code} (${order.clientName}). Total: Q ${order.total.toFixed(2)}, Saldo: Q ${order.balance.toFixed(2)}`,
        metadata: {
          orderId: order.id,
          orderCode: order.code,
          clientName: order.clientName,
          total: order.total,
          balance: order.balance,
        },
      });
      hasLoggedAudit.current = true;
    }
    if (!isOpen) {
      hasLoggedAudit.current = false;
      setCopied(false);
    }
  }, [isOpen, order, logAction]);

  // Listener para cerrar con tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Imprimir comprobante
  const handlePrint = () => {
    window.print();
  };

  // Copiar resumen de texto rápido para WhatsApp / mensaje
  const handleCopySummary = () => {
    const lines = [
      `🌸 *EMILA Floristería - Comprobante de Pedido*`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `📋 *Código:* ${order.code}`,
      `👤 *Cliente:* ${order.clientName}`,
      `📞 *Teléfono:* ${order.clientPhone || 'No registrado'}`,
      `📅 *Fecha de entrega:* ${order.deliveryDate} ${order.deliveryTime ? `a las ${order.deliveryTime}` : ''}`,
      `📦 *Arreglo:* ${order.description}`,
      order.observations ? `💌 *Dedicatoria:* "${order.observations}"` : '',
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `*Componentes del Arreglo:*`,
      ...order.items.map(
        (it) => `• ${it.quantity}x ${it.componentName} (Q ${it.unitPrice.toFixed(2)}) = Q ${it.subtotal.toFixed(2)}`
      ),
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `💰 *Total:* Q ${order.total.toFixed(2)}`,
      `💵 *Pagado / Anticipo:* Q ${order.advancePayment.toFixed(2)}`,
      `🏷️ *Saldo Pendiente:* Q ${order.balance.toFixed(2)} (${order.balance <= 0 ? 'Liquidado' : 'Pendiente al entregar'})`,
      `📌 *Estado:* ${order.status}`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `_Documento de control interno no fiscal emitido por EMILA Floristería._`,
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(lines);
    setCopied(true);
    addToast('Resumen del comprobante copiado al portapapeles.', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      id="order-receipt-modal-container"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-receipt-modal-title"
    >
      {/* Contenedor Modal de Diálogo */}
      <div className="bg-[#F8F9FA] rounded-2xl w-full max-w-4xl shadow-2xl border border-[#F2D6DE] max-h-[94dvh] flex flex-col overflow-hidden my-auto">
        {/* Barra Superior de Herramientas & Acciones */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-5 bg-white border-b border-[#F2D6DE]/80 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FBECEF] text-[#681B2B] flex items-center justify-center border border-[#F2D6DE]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="order-receipt-modal-title"
                className="text-sm sm:text-base font-bold text-[#2C1E23] flex items-center gap-2"
              >
                <span>Comprobante de Pedido</span>
                <span className="text-[#681B2B] font-extrabold">{order.code}</span>
              </h2>
              <p className="text-[11px] text-[#7D6871]">
                Vista previa imprimible &bull; Formato optimizado para PDF (Flask / WeasyPrint)
              </p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-2">
            {/* Copiar texto para WhatsApp */}
            <button
              id="btn-receipt-copy-summary"
              type="button"
              onClick={handleCopySummary}
              className="px-3 py-1.5 rounded-xl border border-[#F2D6DE] bg-white hover:bg-[#FBECEF]/40 text-[#2C1E23] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copiar texto formateado para enviar por WhatsApp"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#7D6871]" />
                  <span>Copiar Resumen</span>
                </>
              )}
            </button>

            {/* Imprimir / Guardar como PDF */}
            <button
              id="btn-receipt-print"
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-[#681B2B] hover:bg-[#541421] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Imprimir comprobante o guardar como archivo PDF"
            >
              <Printer className="w-3.5 h-3.5 text-white/90" />
              <span>Imprimir / PDF</span>
            </button>

            {/* Ver página completa si se proporciona */}
            {onViewFullPage && (
              <button
                id="btn-receipt-view-full"
                type="button"
                onClick={onViewFullPage}
                className="hidden md:inline-flex px-3 py-1.5 rounded-xl border border-[#F2D6DE] bg-white hover:bg-[#FBECEF]/30 text-[#681B2B] text-xs font-semibold items-center gap-1.5 transition-colors cursor-pointer"
                title="Abrir en vista de documento completo"
              >
                <span>Vista Completa</span>
              </button>
            )}

            {/* Cerrar modal */}
            <button
              id="btn-receipt-close"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#7D6871] hover:text-[#2C1E23] hover:bg-[#FBECEF]/50 transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo con Scroll y Hoja de Papel Simulada */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-[#EFE9EB]/70">
          <div className="emila-receipt-print-wrapper">
            <OrderReceiptDocument order={order} />
          </div>
        </div>

        {/* Barra Inferior Informativa */}
        <div className="p-3 px-5 bg-white border-t border-[#F2D6DE]/60 flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] text-[#7D6871] gap-2 no-print">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-[#681B2B]" />
            <span>
              <strong>Nota:</strong> Este documento es un comprobante interno de pedido y control de pagos en Quetzales (Q), no es una factura contable fiscal.
            </span>
          </div>
          <div className="text-[10px] text-[#9E8691] shrink-0">
            EMILA &bull; WeasyPrint Ready
          </div>
        </div>
      </div>
    </div>
  );
};
