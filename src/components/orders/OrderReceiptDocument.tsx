import React from 'react';
import { Order } from '../../types';
import { EmilaLogo } from '../common/EmilaLogo';
import { StatusBadge } from '../common/StatusBadge';

interface OrderReceiptDocumentProps {
  order: Order;
  compact?: boolean;
  issuedAt?: string;
  showWatermark?: boolean;
}

/**
 * OrderReceiptDocument (Comprobante de Pedido EMILA)
 * 
 * Componente de documento visual e independiente.
 * Diseñado específicamente con CSS estándar y clases portables para que
 * pueda convertirse directamente a PDF mediante Flask / Jinja2 + WeasyPrint.
 * 
 * Cumplimiento normativo:
 * - No utiliza el término "Factura" (no es factura fiscal).
 * - Utiliza exclusivamente Quetzales (Q).
 * - Incluye código de pedido, cliente, fecha de registro y entrega,
 *   componentes con cantidades y precios, total, total pagado, saldo y estado.
 */
export const OrderReceiptDocument: React.FC<OrderReceiptDocumentProps> = ({
  order,
  compact = false,
  issuedAt,
  showWatermark = true,
}) => {
  const isSettled = order.balance <= 0.001;
  const isCancelled = order.status === 'Cancelado';
  const currentDate = issuedAt || new Date().toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Extraer pagos registrados en el historial para transparencia del cliente
  const paymentHistory = (order.history || []).filter(
    (h) =>
      h.action.toLowerCase().includes('pago') ||
      h.action.toLowerCase().includes('abono') ||
      h.action.toLowerCase().includes('anticipo') ||
      h.action.toLowerCase().includes('liquidado')
  );

  return (
    <div
      id={`order-receipt-${order.code}`}
      className={`emila-receipt-sheet bg-white text-[#2C1E23] font-sans relative ${
        compact ? 'p-6 sm:p-8' : 'p-8 sm:p-12'
      } rounded-2xl shadow-xs border border-[#E8C4CE]/80 max-w-3xl mx-auto selection:bg-[#F7A4D0] selection:text-[#681B2B]`}
      style={{ minHeight: '100%' }}
    >
      {/* Watermark de estado si cancelado o liquidado (solo pantalla, suave) */}
      {showWatermark && (isCancelled || isSettled) && (
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden opacity-[0.04] select-none"
          aria-hidden="true"
        >
          <span className="text-8xl sm:text-9xl font-black uppercase transform -rotate-25 tracking-widest text-[#681B2B]">
            {isCancelled ? 'CANCELADO' : 'LIQUIDADO'}
          </span>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. ENCABEZADO INSTITUCIONAL EMILA                           */}
      {/* ============================================================ */}
      <header className="border-b-2 border-[#681B2B] pb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Marca & Identidad */}
        <div className="flex items-start gap-3.5">
          <EmilaLogo size={58} variant="circle" className="shrink-0 drop-shadow-xs" />
          <div>
            <h1 className="text-2xl font-extrabold text-[#681B2B] tracking-tight leading-tight">
              EMILA Floristería
            </h1>
            <p className="text-xs font-semibold text-[#7D6871] mt-0.5">
              Arreglos y Detalles Personalizados
            </p>
            <p className="text-[11px] text-[#9E8691] mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
              <span>Guatemala</span>
              <span>&bull;</span>
              <span>Atención al Cliente: (502) 5555-0192</span>
            </p>
          </div>
        </div>

        {/* Bloque de Identificación del Comprobante */}
        <div className="text-left sm:text-right bg-[#FDF8F9] sm:bg-transparent p-3.5 sm:p-0 rounded-xl border border-[#F2D6DE]/60 sm:border-0">
          <div className="inline-block">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#681B2B] bg-[#FBECEF] px-2.5 py-1 rounded-md">
              COMPROBANTE DE PEDIDO
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#2C1E23] mt-1 tracking-tight">
            {order.code}
          </div>
          <div className="flex sm:justify-end items-center gap-2 mt-1.5">
            <span className="text-[11px] text-[#7D6871]">Estado:</span>
            <StatusBadge status={order.status} size="sm" />
          </div>
          <div className="text-[10px] text-[#9E8691] mt-1 font-medium">
            Documento de control interno no fiscal
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. DATOS GENERALES: CLIENTE Y ENTREGA                        */}
      {/* ============================================================ */}
      <section className="py-5 border-b border-[#F2D6DE]/70 grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
        {/* Columna Izquierda: Información del Cliente */}
        <div className="bg-[#FDF8F9] p-4 rounded-xl border border-[#F2D6DE]/60 space-y-2">
          <h2 className="text-[11px] font-bold text-[#681B2B] uppercase tracking-wider border-b border-[#F2D6DE]/40 pb-1">
            Datos del Cliente
          </h2>
          <div>
            <span className="text-[10px] text-[#7D6871] block uppercase tracking-wide">Nombre / Contacto:</span>
            <span className="text-sm font-bold text-[#2C1E23] block mt-0.5">{order.clientName}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <span className="text-[10px] text-[#7D6871] block">Teléfono:</span>
              <span className="font-semibold text-[#2C1E23]">{order.clientPhone || 'No registrado'}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#7D6871] block">Canal de Pedido:</span>
              <span className="font-semibold text-[#681B2B]">{order.channel}</span>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Fechas y Entrega */}
        <div className="bg-[#FDF8F9] p-4 rounded-xl border border-[#F2D6DE]/60 space-y-2">
          <h2 className="text-[11px] font-bold text-[#681B2B] uppercase tracking-wider border-b border-[#F2D6DE]/40 pb-1">
            Programación de Entrega
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-[#7D6871] block">Fecha de Registro:</span>
              <span className="font-semibold text-[#2C1E23]">{order.createdAt}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#7D6871] block">Atendido por:</span>
              <span className="font-semibold text-[#2C1E23]">{order.createdBy || 'Taller EMILA'}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#F2D6DE]/40">
            <div>
              <span className="text-[10px] text-[#7D6871] block font-semibold text-[#681B2B]">Fecha de Entrega:</span>
              <span className="text-sm font-bold text-[#681B2B]">{order.deliveryDate}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#7D6871] block font-semibold text-[#681B2B]">Hora Programada:</span>
              <span className="text-sm font-bold text-[#2C1E23]">{order.deliveryTime || 'Por coordinar'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. DESCRIPCIÓN DEL ARREGLO Y DEDICATORIA                     */}
      {/* ============================================================ */}
      <section className="py-4 border-b border-[#F2D6DE]/70 space-y-2.5 text-xs">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D6871] block">
            Descripción del Detalle / Arreglo:
          </span>
          <p className="text-sm font-semibold text-[#2C1E23] mt-0.5 leading-relaxed">
            {order.description}
          </p>
        </div>

        {order.observations && (
          <div className="p-3.5 rounded-xl bg-[#FBECEF]/40 border border-[#F2D6DE]/60 mt-2">
            <span className="text-[10px] font-bold text-[#681B2B] uppercase tracking-wider block mb-1">
              Dedicatoria para Tarjeta / Observaciones Especiales:
            </span>
            <p className="text-xs text-[#2C1E23] italic whitespace-pre-wrap leading-relaxed">
              "{order.observations}"
            </p>
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* 4. TABLA DETALLADA DE COMPONENTES E INSUMOS                  */}
      {/* ============================================================ */}
      <section className="py-5 border-b border-[#F2D6DE]/70">
        <h2 className="text-[11px] font-bold text-[#681B2B] uppercase tracking-wider mb-3">
          Detalle de Componentes e Insumos Utilizados
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FBECEF]/50 text-[#681B2B] border-b border-[#E8C4CE] font-bold text-[11px]">
                <th className="py-2.5 px-3 rounded-l-lg text-center w-16">Cant.</th>
                <th className="py-2.5 px-3">Descripción / Componente</th>
                <th className="py-2.5 px-3 hidden sm:table-cell">Categoría</th>
                <th className="py-2.5 px-3 text-right w-28">Precio Unit.</th>
                <th className="py-2.5 px-3 text-right rounded-r-lg w-28">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2D6DE]/40">
              {order.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#FDF8F9] transition-colors">
                  <td className="py-2.5 px-3 text-center font-bold text-[#2C1E23]">
                    {item.quantity}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-[#2C1E23] block">{item.componentName}</span>
                    <span className="text-[10px] text-[#7D6871] sm:hidden block">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[#7D6871] hidden sm:table-cell">
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px]">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-[#7D6871] font-medium font-mono">
                    Q {item.unitPrice.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-[#681B2B] font-mono">
                    Q {item.subtotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. RESUMEN FINANCIERO Y CONTROL DE SALDO (EXCLUSIVAMENTE Q)  */}
      {/* ============================================================ */}
      <section className="py-5 border-b border-[#F2D6DE]/70 grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
        {/* Columna Izquierda: Notas y Desglose de Pagos */}
        <div className="space-y-3 text-xs">
          {paymentHistory.length > 0 && (
            <div className="bg-[#FDF8F9] p-3 rounded-xl border border-[#F2D6DE]/60 space-y-1.5">
              <span className="text-[10px] font-bold text-[#681B2B] uppercase tracking-wider block">
                Historial de Abonos Registrados:
              </span>
              <ul className="divide-y divide-[#F2D6DE]/30 text-[11px]">
                {paymentHistory.map((ph, idx) => (
                  <li key={idx} className="py-1 flex justify-between items-center text-[#7D6871]">
                    <span>{ph.action} ({ph.timestamp}):</span>
                    <span className="font-medium text-[#059669]">{ph.details}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-[11px] text-[#7D6871] space-y-1">
            <span className="font-bold text-[#2C1E23] block">Condiciones de Entrega y Pago:</span>
            <p>
              • Todos los montos están expresados exclusivamente en moneda nacional (Quetzales - Q).
            </p>
            <p>
              • Todo arreglo floral personalizado requiere la liquidación total de su saldo contra entrega o previo al despacho.
            </p>
          </div>
        </div>

        {/* Columna Derecha: Totales Oficiales */}
        <div className="bg-[#FDF8F9] p-4 sm:p-5 rounded-xl border border-[#E8C4CE] space-y-2.5 text-xs">
          <div className="flex justify-between items-center text-[#7D6871]">
            <span>Subtotal:</span>
            <span className="font-semibold text-[#2C1E23] font-mono">
              Q {order.subtotal.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm sm:text-base font-black text-[#681B2B] pt-2 border-t border-[#F2D6DE]">
            <span>TOTAL DEL PEDIDO:</span>
            <span className="font-mono">Q {order.total.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center text-xs font-bold text-[#059669] pt-1">
            <span>Total Pagado / Anticipo:</span>
            <span className="font-mono">Q {order.advancePayment.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center text-sm font-extrabold pt-2 border-t-2 border-[#E8C4CE]">
            <span>SALDO PENDIENTE:</span>
            <span
              className={`font-mono ${
                isSettled ? 'text-[#059669]' : 'text-[#DC2626]'
              }`}
            >
              Q {order.balance.toFixed(2)}
            </span>
          </div>

          {/* Indicador de Estado de Saldo */}
          <div className="pt-2 text-center">
            {isSettled ? (
              <span className="inline-block px-3 py-1 bg-[#DCFCE7] text-[#065F46] border border-[#A7F3D0] rounded-lg text-xs font-extrabold tracking-wide uppercase">
                ✓ Pedido Liquidado (Saldo Q 0.00)
              </span>
            ) : (
              <span className="inline-block px-3 py-1 bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] rounded-lg text-xs font-bold tracking-wide uppercase">
                Pendiente de Cobro al Entregar: Q {order.balance.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. FIRMA DE RECIBIDO Y PIE DE PÁGINA                         */}
      {/* ============================================================ */}
      <footer className="pt-6 space-y-6">
        {/* Acuse de Recibo / Firma */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
          <div className="space-y-1">
            <div className="border-b border-gray-400 h-10"></div>
            <div className="flex justify-between text-[10px] text-[#7D6871] pt-1">
              <span>Firma y Nombre de quien recibe</span>
              <span>DPI: ________________</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="border-b border-gray-400 h-10"></div>
            <div className="flex justify-between text-[10px] text-[#7D6871] pt-1">
              <span>Firma de Entrega (Taller EMILA)</span>
              <span>Fecha / Hora: ____/____/____</span>
            </div>
          </div>
        </div>

        {/* Leyenda No Fiscal & Mensaje */}
        <div className="pt-4 border-t border-[#F2D6DE]/60 text-center space-y-1 text-[10px] text-[#9E8691]">
          <p className="font-semibold text-[#7D6871]">
            ¡Gracias por confiar en EMILA Floristería para tus fechas especiales!
          </p>
          <p className="max-w-xl mx-auto leading-normal">
            <strong>DOCUMENTO INTERNO NO FISCAL.</strong> Este comprobante acredita la confección,
            reserva de insumos, especificaciones técnicas y los abonos monetarios recibidos para
            el pedido referenciado. No constituye factura contable ni comprobante de crédito fiscal.
          </p>
          <p className="text-[9px] text-gray-400 pt-1">
            Comprobante emitido el {currentDate} &bull; Código de Verificación: EMILA-{order.code}-{order.clientId.substring(0, 6)}
          </p>
        </div>
      </footer>
    </div>
  );
};
