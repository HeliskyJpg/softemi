import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ArrowLeft,
  Edit,
  RefreshCw,
  XCircle,
  X,
  Clock,
  Calendar,
  Phone,
  MessageCircle,
  Receipt,
  Printer,
  Layers,
  History,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Banknote,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  StatusBadge,
  ConfirmDialog,
  Modal,
  FormField,
  MoneyFormatter,
  DateFormatter,
  AutocompleteSelect,
  TextArea,
} from '../common';
import { FormFieldError } from '../common/FormFieldError';
import { SystemAlert } from '../common/SystemAlert';
import { OrderReceiptModal } from '../modals/OrderReceiptModal';
import { OrderStatus } from '../../types';

interface OrderDetailViewProps {
  orderId: string;
}

export const OrderDetailView: React.FC<OrderDetailViewProps> = ({ orderId }) => {
  const {
    orders,
    goBack,
    navigateToOrderEdit,
    navigateToOrderReceipt,
    changeOrderStatus,
    cancelOrder,
    registerOrderPayment,
    addToast,
    getCatalogItems,
    getCatalogSelectOptions,
    hasPermission,
  } = useApp();

  const order = orders.find((o) => o.id === orderId);

  // Status Change Modal State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>('En preparación');
  const [statusNote, setStatusNote] = useState('');

  // Standalone Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>(() => {
    const active = getCatalogItems('payment_methods', true);
    return active[0]?.name || 'Efectivo';
  });
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Delivery Payment Step in Status Modal
  const [deliveryPaymentAmount, setDeliveryPaymentAmount] = useState('');
  const [deliveryPaymentMethod, setDeliveryPaymentMethod] = useState<string>(() => {
    const active = getCatalogItems('payment_methods', true);
    return active[0]?.name || 'Efectivo';
  });
  const [deliveryPaymentError, setDeliveryPaymentError] = useState<string | null>(null);

  // Cancel Order Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Cancelación solicitada por el cliente');

  // Receipt Modal State
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  if (!order) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-[#F2D6DE]/60 shadow-xs">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-[#2C1E23]">Pedido no encontrado</h2>
        <p className="text-xs text-[#7D6871] mt-1">El pedido seleccionado no existe o fue eliminado.</p>
        <button
          onClick={() => goBack('orders')}
          className="mt-4 px-4 py-2 bg-[#681B2B] hover:bg-[#541421] text-white text-xs font-bold rounded-xl cursor-pointer"
        >
          Volver
        </button>
      </div>
    );
  }

  const isCancelled = order.status === 'Cancelado';
  const isDelivered = order.status === 'Entregado';
  const hasPendingBalance = order.balance > 0;

  // Open Standalone Payment Modal
  const handleOpenPaymentModal = () => {
    setPaymentAmountInput(order.balance.toFixed(2));
    const active = getCatalogItems('payment_methods', true);
    setPaymentMethod(active[0]?.name || 'Efectivo');
    setPaymentNote('');
    setPaymentError(null);
    setShowPaymentModal(true);
  };

  // Submit Standalone Payment
  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(paymentAmountInput);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setPaymentError('Ingrese un monto válido mayor a Q0.00.');
      return;
    }

    if (parsedAmount > order.balance + 0.001) {
      setPaymentError(`El monto no puede superar el saldo pendiente de Q${order.balance.toFixed(2)}.`);
      return;
    }

    const res = registerOrderPayment(order.id, parsedAmount, {
      note: `${paymentMethod}${paymentNote.trim() ? ` - ${paymentNote.trim()}` : ''}`,
    });

    if (res.success) {
      setShowPaymentModal(false);
    } else if (res.error) {
      setPaymentError(res.error);
    }
  };

  // Open Status Change Modal
  const handleOpenStatusModal = () => {
    if (order.status === 'Pendiente') setNewStatus('En preparación');
    else if (order.status === 'En preparación') setNewStatus('Listo');
    else if (order.status === 'Listo') setNewStatus('Entregado');
    else setNewStatus(order.status);

    setStatusNote('');
    setDeliveryPaymentAmount(order.balance > 0 ? order.balance.toFixed(2) : '');
    const active = getCatalogItems('payment_methods', true);
    setDeliveryPaymentMethod(active[0]?.name || 'Efectivo');
    setDeliveryPaymentError(null);
    setShowStatusModal(true);
  };

  // Submit Status Change (Handles standard or delivery with payment)
  const handleConfirmStatusChange = (e: React.FormEvent) => {
    e.preventDefault();

    // If changing to "Entregado" and order has pending balance
    if (newStatus === 'Entregado' && order.balance > 0) {
      const parsedAmount = parseFloat(deliveryPaymentAmount);

      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setDeliveryPaymentError('Para entregar el pedido con saldo pendiente, ingrese el monto a cobrar (mayor a Q 0.00).');
        return;
      }

      if (parsedAmount > order.balance + 0.001) {
        setDeliveryPaymentError(`El monto no puede ser mayor al saldo de Q ${order.balance.toFixed(2)}.`);
        return;
      }

      // If full settlement
      const isFullSettlement = Math.abs(parsedAmount - order.balance) < 0.01;

      const res = registerOrderPayment(order.id, parsedAmount, {
        note: `Pago al entregar (${deliveryPaymentMethod})`,
        markAsDeliveredIfSettled: isFullSettlement,
        deliveryNote: statusNote.trim() || 'Entrega completada con saldo liquidado.',
      });

      if (res.success) {
        setShowStatusModal(false);
      } else if (res.error) {
        setDeliveryPaymentError(res.error);
      }
      return;
    }

    // Normal status transition (e.g. Pendiente -> En preparación, Listo, or Entregado when balance = 0)
    changeOrderStatus(order.id, newStatus, statusNote);
    setShowStatusModal(false);
  };

  const handleConfirmCancellation = () => {
    cancelOrder(order.id, cancelReason);
    setShowCancelModal(false);
  };

  // Helper calculation for standalone modal live projection
  const currentPayNum = parseFloat(paymentAmountInput) || 0;
  const projectedPaid = Math.min(order.total, Math.round((order.advancePayment + currentPayNum) * 100) / 100);
  const projectedBalance = Math.max(0, Math.round((order.balance - currentPayNum) * 100) / 100);

  // Helper calculation for delivery modal live projection
  const deliveryPayNum = parseFloat(deliveryPaymentAmount) || 0;
  const deliveryProjectedBalance = Math.max(0, Math.round((order.balance - deliveryPayNum) * 100) / 100);
  const willDeliver = deliveryPayNum > 0 && Math.abs(deliveryPayNum - order.balance) < 0.01;

  return (
    <div id="order-detail-view-container" className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            id="btn-order-detail-back"
            onClick={() => goBack('orders')}
            className="p-2 rounded-xl bg-white border border-[#F2D6DE] text-[#7D6871] hover:text-[#681B2B] hover:bg-[#FBECEF]/40 transition-colors cursor-pointer"
            title="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-[#681B2B] tracking-tight">{order.code}</h1>
              <StatusBadge status={order.status} size="lg" />
            </div>
            <p className="text-xs text-[#7D6871] mt-0.5">
              Registrado el {order.createdAt} por {order.createdBy}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Generar Comprobante */}
          <button
            id="btn-order-detail-generate-receipt"
            onClick={() => setShowReceiptModal(true)}
            className="px-4 py-2 rounded-xl border border-[#F2D6DE] bg-white hover:bg-[#FBECEF]/40 text-[#2C1E23] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Generar comprobante de pedido imprimible"
          >
            <Printer className="w-4 h-4 text-[#681B2B]" />
            <span>Generar comprobante</span>
          </button>

          {/* Register Payment Action Button (if pending balance exists and not cancelled) */}
          {!isCancelled && hasPendingBalance && hasPermission('payments.register') && (
            <button
              id="btn-order-detail-register-payment"
              onClick={handleOpenPaymentModal}
              className="px-4 py-2 rounded-xl bg-[#681B2B] hover:bg-[#541421] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Registrar pago o abono a este pedido"
            >
              <Receipt className="w-4 h-4 text-white/80" />
              <span>Registrar Pago</span>
            </button>
          )}

          {/* Edit button */}
          {!isCancelled && !isDelivered && hasPermission('orders.edit') && (
            <button
              id="btn-order-detail-edit"
              onClick={() => navigateToOrderEdit(order.id)}
              className="px-4 py-2 rounded-xl border border-[#F2D6DE] bg-white hover:bg-[#FBECEF]/30 text-[#2C1E23] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Edit className="w-4 h-4 text-[#681B2B]" />
              Editar Pedido
            </button>
          )}

          {/* Change status button */}
          {!isCancelled && hasPermission('orders.change_status') && (
            <button
              id="btn-order-detail-change-status"
              onClick={handleOpenStatusModal}
              className="px-4 py-2 rounded-xl bg-[#681B2B] hover:bg-[#541421] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-4 h-4" />
              Cambiar Estado
            </button>
          )}

          {/* Cancel button */}
          {!isCancelled && hasPermission('orders.change_status') && (
            <button
              id="btn-order-detail-cancel"
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-[#DC2626] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              Cancelar Pedido
            </button>
          )}
        </div>
      </div>

      {/* Cancellation Notice Banner if Cancelled */}
      {isCancelled && (
        <div
          id="banner-order-cancelled"
          className="p-4 rounded-2xl bg-red-50 border border-red-200 text-[#DC2626] text-xs flex items-start gap-3"
        >
          <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Este pedido fue cancelado</h4>
            <p className="mt-0.5 text-red-800">
              Todas las cantidades de componentes fueron restituidas automáticamente al inventario del taller.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Order Info & Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 cols: Client & Delivery Details */}
        <div className="md:col-span-2 space-y-6">
          {/* General Information Card */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#F2D6DE]/60 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-[#8C7A82] uppercase tracking-wider border-b border-[#F2D6DE]/40 pb-2.5">
              Información General y Entrega
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] text-[#7D6871] block">Cliente:</span>
                <div className="text-sm font-bold text-[#2C1E23] mt-0.5">{order.clientName}</div>
                <div className="text-xs text-[#7D6871] flex items-center gap-1 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-[#059669]" />
                  {order.clientPhone}
                </div>
              </div>

              <div>
                <span className="text-[11px] text-[#7D6871] block">Canal de Recepción:</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FBECEF] text-[#681B2B] text-xs font-bold mt-1">
                  <MessageCircle className="w-3.5 h-3.5" />
                  {order.channel}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-[#7D6871] block">Fecha de Entrega:</span>
                <div className="text-sm font-bold text-[#2C1E23] mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#681B2B]" />
                  {order.deliveryDate}
                </div>
              </div>

              <div>
                <span className="text-[11px] text-[#7D6871] block">Hora de Entrega:</span>
                <div className="text-sm font-bold text-[#2C1E23] mt-0.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#681B2B]" />
                  {order.deliveryTime || 'No especificada'}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#F2D6DE]/40">
              <span className="text-[11px] text-[#7D6871] block">Descripción del Arreglo:</span>
              <p className="text-sm font-semibold text-[#2C1E23] mt-0.5">{order.description}</p>
            </div>

            {order.observations && (
              <div className="p-3.5 rounded-xl bg-[#FBECEF]/40 border border-[#F2D6DE]/60">
                <span className="text-[11px] font-bold text-[#681B2B] uppercase block mb-1">
                  Dedicatoria / Observaciones:
                </span>
                <p className="text-xs text-[#2C1E23] italic whitespace-pre-wrap leading-relaxed">
                  "{order.observations}"
                </p>
              </div>
            )}
          </div>

          {/* Components Table Card (Desktop Table + Mobile Cards) */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#F2D6DE]/60 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#F2D6DE]/40 pb-2.5">
              <h2 className="text-xs font-bold text-[#8C7A82] uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#681B2B]" />
                Componentes e Insumos Utilizados
              </h2>
              <span className="text-xs font-semibold text-[#681B2B]">
                {order.items.length} elementos
              </span>
            </div>

            {/* Desktop View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#F2D6DE]/40 text-[#8C7A82] text-[11px] uppercase">
                    <th className="pb-2.5 font-semibold">Componente</th>
                    <th className="pb-2.5 font-semibold">Categoría</th>
                    <th className="pb-2.5 font-semibold text-center">Cantidad</th>
                    <th className="pb-2.5 font-semibold text-right">Precio Unit.</th>
                    <th className="pb-2.5 font-semibold text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2D6DE]/30">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#FBECEF]/30 transition-colors">
                      <td className="py-2.5 font-semibold text-[#2C1E23]">{item.componentName}</td>
                      <td className="py-2.5 text-[#7D6871]">
                        <span className="px-2 py-0.5 bg-gray-100 rounded-full text-[10px]">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-2.5 text-center font-bold text-[#2C1E23]">{item.quantity}</td>
                      <td className="py-2.5 text-right text-[#7D6871]">Q {item.unitPrice.toFixed(2)}</td>
                      <td className="py-2.5 text-right font-bold text-[#681B2B]">
                        Q {item.subtotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="block sm:hidden divide-y divide-[#F2D6DE]/40 space-y-2.5">
              {order.items.map((item, idx) => (
                <div key={idx} className="pt-2.5 first:pt-0 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#2C1E23] block">{item.componentName}</span>
                    <span className="text-[11px] text-[#7D6871]">
                      {item.quantity} × Q {item.unitPrice.toFixed(2)} &bull; {item.category}
                    </span>
                  </div>
                  <div className="font-extrabold text-[#681B2B] text-sm">
                    Q {item.subtotal.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right col: Financial Summary & Historial */}
        <div className="space-y-6">
          {/* Financial Totals Card */}
          <div className="bg-white rounded-2xl p-5 border border-[#F2D6DE]/60 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#F2D6DE]/40 pb-2">
              <h3 className="text-xs font-bold text-[#8C7A82] uppercase tracking-wider">
                Resumen de Pago
              </h3>
              {order.balance === 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Liquidado
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                  Con Saldo
                </span>
              )}
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-[#7D6871]">
                <span>Subtotal:</span>
                <span className="font-semibold text-[#2C1E23]">Q {order.subtotal.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-base font-extrabold text-[#681B2B] pt-2 border-t border-[#F2D6DE]/40">
                <span>Total del Pedido:</span>
                <span>Q {order.total.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold text-[#059669] pt-1">
                <span>Total Pagado:</span>
                <span>Q {order.advancePayment.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-sm font-bold pt-2 border-t border-[#F2D6DE]/40">
                <span>Saldo Pendiente:</span>
                <span className={order.balance > 0 ? 'text-[#DC2626]' : 'text-emerald-700'}>
                  Q {order.balance.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Quick action button inside financial card */}
            {!isCancelled && hasPendingBalance && hasPermission('payments.register') && (
              <button
                id="btn-order-card-register-payment"
                type="button"
                onClick={handleOpenPaymentModal}
                className="w-full mt-3 py-2.5 px-4 rounded-xl bg-[#681B2B] hover:bg-[#541421] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Receipt className="w-4 h-4 text-white/80" />
                <span>Registrar Pago (Saldo: Q{order.balance.toFixed(2)})</span>
              </button>
            )}

            {order.balance === 0 && (
              <div className="mt-3 p-2.5 rounded-xl bg-[#ECFDF5] text-[#047857] text-center text-xs font-bold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                Pago Completo Liquidado (Q 0.00 pendiente)
              </div>
            )}

            {/* Generar Comprobante Quick Action */}
            <button
              id="btn-order-card-generate-receipt"
              type="button"
              onClick={() => setShowReceiptModal(true)}
              className="w-full mt-2.5 py-2 px-3 rounded-xl border border-[#F2D6DE] bg-[#FDF8F9] hover:bg-[#FBECEF]/60 text-[#681B2B] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#681B2B]" />
              <span>Generar Comprobante</span>
            </button>
          </div>

          {/* Historial Card */}
          <div className="bg-white rounded-2xl p-5 border border-[#F2D6DE]/60 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-[#8C7A82] uppercase tracking-wider flex items-center gap-2 border-b border-[#F2D6DE]/40 pb-2">
              <History className="w-4 h-4 text-[#681B2B]" />
              Historial de Auditoría
            </h3>

            <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#F2D6DE]">
              {order.history.map((entry) => (
                <div key={entry.id} className="relative pl-7 text-xs space-y-0.5">
                  <div className="absolute left-1.5 top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#681B2B]" />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#2C1E23]">{entry.action}</span>
                    <span className="text-[10px] text-[#7D6871]">{entry.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-[#7D6871]">Por: {entry.user}</p>
                  {entry.details && (
                    <p className="text-[11px] text-[#2C1E23] bg-[#FBECEF]/40 p-1.5 rounded-lg border border-[#F2D6DE]/50">
                      {entry.details}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: REGISTRAR PAGO INDEPENDIENTE */}
      {/* ============================================================ */}
      <Modal
        id="modal-register-payment"
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title={
          <span className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#681B2B] shrink-0" />
            <span className="truncate">Registrar pago</span>
          </span>
        }
        subtitle={
          <span>
            Pedido <strong className="text-[#2C1E23]">{order.code}</strong> · Cliente:{' '}
            <strong className="text-[#2C1E23]">{order.clientName}</strong>
          </span>
        }
        size="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowPaymentModal(false)}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-medium text-[#7D6871] hover:bg-gray-100 rounded-xl cursor-pointer min-h-[42px] sm:min-h-[36px] flex items-center justify-center"
            >
              Cancelar
            </button>
            <button
              id="btn-confirm-payment-save"
              form="form-register-payment"
              type="submit"
              disabled={currentPayNum <= 0 || currentPayNum > order.balance + 0.001}
              className="w-full sm:w-auto px-5 py-2.5 sm:py-2 text-xs sm:text-sm font-bold bg-[#681B2B] hover:bg-[#541421] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 min-h-[42px] sm:min-h-[36px] transition-colors"
            >
              <Receipt className="w-4 h-4" />
              <span>Registrar pago</span>
            </button>
          </>
        }
      >
        <form id="form-register-payment" onSubmit={handleConfirmPayment} className="space-y-4">
          {/* Compact Financial Summary Strip */}
          <div
            id="payment-modal-summary-strip"
            className="px-3.5 py-2.5 rounded-xl bg-[#FBECEF]/40 border border-[#F2D6DE] text-xs flex flex-wrap items-center justify-between sm:justify-center gap-x-2.5 gap-y-1 text-[#7D6871]"
          >
            <span>
              Total <strong className="font-bold text-[#2C1E23]"><MoneyFormatter amount={order.total} /></strong>
            </span>
            <span className="text-[#F2D6DE]">·</span>
            <span>
              Pagado <strong className="font-bold text-[#2C1E23]"><MoneyFormatter amount={order.advancePayment} /></strong>
            </span>
            <span className="text-[#F2D6DE]">·</span>
            <span>
              Pendiente <strong className="font-bold text-[#681B2B]"><MoneyFormatter amount={order.balance} /></strong>
            </span>
          </div>

          {/* Payment Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="input-payment-amount"
                className="text-xs font-bold text-[#2C1E23]"
              >
                Monto a pagar <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                id="btn-use-pending-balance"
                onClick={() => {
                  setPaymentAmountInput(order.balance.toFixed(2));
                  setPaymentError(null);
                }}
                className="text-[11px] sm:text-xs font-semibold text-[#681B2B] hover:text-[#541421] hover:underline cursor-pointer transition-colors"
              >
                Usar saldo pendiente Q{order.balance.toFixed(2)}
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs sm:text-sm font-bold text-[#7D6871] pointer-events-none">
                Q
              </span>
              <input
                id="input-payment-amount"
                type="number"
                min={0.01}
                max={order.balance}
                step="0.01"
                required
                value={paymentAmountInput}
                onChange={(e) => {
                  setPaymentAmountInput(e.target.value);
                  setPaymentError(null);
                }}
                placeholder="0.00"
                className={`w-full pl-8 pr-3 py-2.5 text-xs sm:text-sm font-bold rounded-xl border outline-none text-[#2C1E23] ${
                  paymentError
                    ? 'border-rose-400 ring-1 ring-rose-200 bg-rose-50/20'
                    : 'border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20 focus:border-[#681B2B]'
                }`}
              />
            </div>
            <FormFieldError id="error-payment-amount" error={paymentError} />
          </div>

          {/* Simplified Calculation Preview */}
          {currentPayNum > 0 && currentPayNum <= order.balance + 0.001 && (
            <div
              id="payment-live-preview"
              className="px-3.5 py-2 rounded-xl bg-[#FBECEF]/30 border border-[#F2D6DE]/60 text-xs flex items-center justify-between text-[#7D6871]"
            >
              <span>Después del pago</span>
              <span className="text-[#F2D6DE]">·</span>
              <span className="font-medium">
                Saldo pendiente{' '}
                <strong
                  className={`font-bold ${
                    projectedBalance === 0 ? 'text-[#059669]' : 'text-[#681B2B]'
                  }`}
                >
                  <MoneyFormatter amount={projectedBalance} />
                </strong>
                {projectedBalance === 0 && (
                  <span className="ml-1.5 text-[11px] font-semibold text-[#059669]">
                    (Liquidado)
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Payment Method */}
          <div>
            <AutocompleteSelect
              id="select-payment-method"
              label="Forma de pago"
              required
              options={getCatalogSelectOptions('payment_methods', {
                currentValue: paymentMethod,
                isNew: true,
                includeDescription: true,
              })}
              value={paymentMethod}
              onChange={(val) => setPaymentMethod(val)}
              searchable={true}
              placeholder="Seleccione forma de pago..."
            />
          </div>

          {/* Note / Reference */}
          <div>
            <label className="block text-xs font-bold text-[#2C1E23] mb-1.5">
              Referencia o nota (opcional)
            </label>
            <input
              id="input-payment-note"
              type="text"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder="Ej. Comprobante #124567, transferencia bancaria..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20 focus:border-[#681B2B] outline-none"
            />
          </div>
        </form>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL 2: CAMBIAR ESTADO (WITH INTEGRATED DELIVERY BALANCE CHECK) */}
      {/* ============================================================ */}
      <Modal
        id="modal-change-status"
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title={`Actualizar Estado del Pedido ${order.code}`}
        subtitle={
          <span>
            Estado actual: <strong className="text-[#681B2B]">{order.status}</strong>
          </span>
        }
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowStatusModal(false)}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-medium text-[#7D6871] hover:bg-gray-100 rounded-xl cursor-pointer min-h-[42px] sm:min-h-[36px] flex items-center justify-center"
            >
              Cancelar
            </button>
            <button
              id="btn-confirm-status-update"
              form="form-change-status"
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 sm:py-2 text-xs sm:text-sm font-bold bg-[#681B2B] hover:bg-[#541421] text-white rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 min-h-[42px] sm:min-h-[36px]"
            >
              {newStatus === 'Entregado' && order.balance > 0 && willDeliver ? (
                <>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Cobrar y Marcar como Entregado</span>
                </>
              ) : newStatus === 'Entregado' && order.balance > 0 && !willDeliver ? (
                <>
                  <Receipt className="w-4 h-4 shrink-0" />
                  <span>Registrar Abono</span>
                </>
              ) : (
                'Actualizar Estado'
              )}
            </button>
          </>
        }
      >
        <form id="form-change-status" onSubmit={handleConfirmStatusChange} className="space-y-4">
          <AutocompleteSelect
            id="select-order-status"
            label="Nuevo Estado a Asignar"
            options={[
              { value: 'Pendiente', label: 'Pendiente' },
              { value: 'En preparación', label: 'En preparación' },
              { value: 'Listo', label: 'Listo' },
              { value: 'Entregado', label: 'Entregado' },
            ]}
            value={newStatus}
            onChange={(val) => {
              setNewStatus(val as OrderStatus);
              setDeliveryPaymentError(null);
            }}
            placeholder="Seleccionar estado"
          />

          {/* Conditional Block when user selects "Entregado" and order has pending balance */}
          {newStatus === 'Entregado' && order.balance > 0 && (
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900">
                    Este pedido tiene un saldo pendiente de <MoneyFormatter amount={order.balance} />.
                  </h4>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    Para marcar el pedido como <strong>Entregado</strong>, registre el pago del saldo pendiente. Si registra un abono parcial, el pago quedará asentado pero el estado no se cambiará a Entregado hasta su liquidación total.
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#2C1E23]">
                    Monto a Cobrar (Q) <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setDeliveryPaymentAmount(order.balance.toFixed(2))}
                    className="text-[10px] font-semibold text-[#681B2B] hover:text-[#541421] hover:underline cursor-pointer"
                  >
                    Pagar Saldo Completo
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-[#7D6871] pointer-events-none">
                    Q
                  </span>
                  <input
                    type="number"
                    min={0.01}
                    max={order.balance}
                    step="0.01"
                    required
                    value={deliveryPaymentAmount}
                    onChange={(e) => {
                      setDeliveryPaymentAmount(e.target.value);
                      setDeliveryPaymentError(null);
                    }}
                    placeholder="0.00"
                    className={`w-full pl-7 pr-3 py-2 text-xs font-bold rounded-lg border outline-none ${
                      deliveryPaymentError
                        ? 'border-rose-400 bg-rose-50/30 ring-1 ring-rose-200'
                        : 'border-amber-300 bg-white focus:ring-2 focus:ring-amber-500/30'
                    }`}
                  />
                </div>
                <FormFieldError id="error-delivery-payment" error={deliveryPaymentError} />
              </div>

              {/* Payment Method Selector */}
              <div>
                <AutocompleteSelect
                  id="select-delivery-payment-method"
                  label="Método de Cobro"
                  required
                  options={getCatalogSelectOptions('payment_methods', {
                    currentValue: deliveryPaymentMethod,
                    isNew: true,
                    includeDescription: true,
                  })}
                  value={deliveryPaymentMethod}
                  onChange={(val) => setDeliveryPaymentMethod(val)}
                  size="sm"
                  searchable={true}
                  placeholder="Seleccione método de cobro..."
                />
              </div>

              {/* Outcome Note */}
              {deliveryPayNum > 0 && (
                <div className="p-2 rounded-lg bg-white border border-amber-200 text-[11px]">
                  {willDeliver ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Saldo liquidado (Q 0.00 restante). El pedido se marcará como <strong>Entregado</strong>.
                    </span>
                  ) : (
                    <span className="text-amber-900 leading-snug block">
                      <strong>Abono Parcial:</strong> Quedará un saldo pendiente de <strong><MoneyFormatter amount={deliveryProjectedBalance} /></strong>. El pedido <strong>NO</strong> se marcará como Entregado.
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          <TextArea
            label="Nota / Observación del Cambio"
            rows={2}
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            placeholder="Ej. Entregado en recepción del taller con firma de recibido..."
          />
        </form>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL 3: CANCELAR PEDIDO (CRITICAL ACTION CONFIRMATION) */}
      {/* ============================================================ */}
      <ConfirmDialog
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancellation}
        title="¿Está seguro de cancelar este pedido?"
        message={`Al cancelar el pedido ${order.code}, se devolverán automáticamente todas las flores, empaques y accesorios utilizados al stock disponible del taller.`}
        confirmText="Sí, Cancelar Pedido"
        cancelText="Volver sin cancelar"
        type="danger"
      />

      {/* ============================================================ */}
      {/* MODAL 4: COMPROBANTE DE PEDIDO IMPRIMIBLE (NO FACTURA)       */}
      {/* ============================================================ */}
      <OrderReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        order={order}
        onViewFullPage={() => {
          setShowReceiptModal(false);
          navigateToOrderReceipt(order.id);
        }}
      />
    </div>
  );
};
