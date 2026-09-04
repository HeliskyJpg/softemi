import React, { useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Printer,
  Copy,
  Check,
  FileText,
  AlertTriangle,
  Receipt,
  Download,
  Share2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { OrderReceiptDocument } from '../orders/OrderReceiptDocument';

interface OrderReceiptViewProps {
  orderId: string;
}

/**
 * OrderReceiptView
 * 
 * Vista independiente de documento de Comprobante de Pedido.
 * Diseñada para reproducir la experiencia de impresión directa o exportación a PDF
 * compatible con plantillas Jinja2 y WeasyPrint en backend Flask.
 */
export const OrderReceiptView: React.FC<OrderReceiptViewProps> = ({ orderId }) => {
  const { orders, goBack, logAction, addToast, navigateToOrderDetail } = useApp();
  const [copied, setCopied] = React.useState(false);
  const hasLoggedAudit = useRef(false);

  const order = orders.find((o) => o.id === orderId);

  useEffect(() => {
    if (order && !hasLoggedAudit.current) {
      logAction({
        action: 'generar comprobante',
        module: 'Pedidos',
        entityType: 'Order',
        recordId: order.code,
        description: `Visualización de comprobante de pedido ${order.code} en vista independiente.`,
        metadata: {
          orderId: order.id,
          orderCode: order.code,
          clientName: order.clientName,
        },
      });
      hasLoggedAudit.current = true;
    }
  }, [order, logAction]);

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center bg-white rounded-2xl border border-[#F2D6DE]/60 shadow-xs">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-[#2C1E23]">Pedido no encontrado</h2>
        <p className="text-xs text-[#7D6871] mt-1">
          No se pudo generar el comprobante porque el pedido no existe o fue eliminado.
        </p>
        <button
          onClick={() => goBack('orders')}
          className="mt-4 px-4 py-2 bg-[#681B2B] hover:bg-[#541421] text-white text-xs font-bold rounded-xl cursor-pointer"
        >
          Volver a Pedidos
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

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
    addToast('Resumen copiado al portapapeles.', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div id="order-receipt-view-container" className="space-y-6 pb-20">
      {/* Top Action Bar (hidden in print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#F2D6DE]/80 shadow-xs no-print">
        <div className="flex items-center gap-3">
          <button
            id="btn-receipt-view-back"
            onClick={() => navigateToOrderDetail(order.id)}
            className="p-2 rounded-xl bg-white border border-[#F2D6DE] text-[#7D6871] hover:text-[#681B2B] hover:bg-[#FBECEF]/40 transition-colors cursor-pointer"
            title="Volver a la ficha del pedido"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-[#681B2B] tracking-tight">
                Comprobante de Pedido
              </h1>
              <span className="px-2.5 py-0.5 rounded-lg bg-[#FBECEF] text-[#681B2B] font-bold text-xs">
                {order.code}
              </span>
            </div>
            <p className="text-xs text-[#7D6871] mt-0.5">
              Documento imprimible &bull; Formato A4/Carta compatible con Flask / WeasyPrint
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="btn-receipt-view-copy"
            onClick={handleCopySummary}
            className="px-3.5 py-2 rounded-xl border border-[#F2D6DE] bg-white hover:bg-[#FBECEF]/40 text-[#2C1E23] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#7D6871]" />
                <span>Copiar Resumen</span>
              </>
            )}
          </button>

          <button
            id="btn-receipt-view-print"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-[#681B2B] hover:bg-[#541421] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-white/90" />
            <span>Imprimir / Guardar PDF</span>
          </button>
        </div>
      </div>

      {/* Document Area */}
      <div className="emila-receipt-print-wrapper py-2">
        <OrderReceiptDocument order={order} />
      </div>
    </div>
  );
};
