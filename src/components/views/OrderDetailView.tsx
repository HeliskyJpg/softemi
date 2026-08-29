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
  DollarSign,
  Layers,
  History,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Banknote,
  Sparkles,
  Info,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { ConfirmModal } from '../common/ConfirmModal';
import { OrderStatus } from '../../types';

interface OrderDetailViewProps {
  orderId: string;
}

export const OrderDetailView: React.FC<OrderDetailViewProps> = ({ orderId }) => {
  const {
    orders,
    goBack,
    navigateToOrderEdit,
    changeOrderStatus,
    cancelOrder,
    registerOrderPayment,
    addToast,
  } = useApp();

  const order = orders.find((o) => o.id === orderId);

  // Status Change Modal State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>('En preparación');
  const [statusNote, setStatusNote] = useState('');

  // Standalone Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Delivery Payment Step in Status Modal
  const [deliveryPaymentAmount, setDeliveryPaymentAmount] = useState('');
  const [deliveryPaymentMethod, setDeliveryPaymentMethod] = useState('Efectivo');
  const [deliveryPaymentError, setDeliveryPaymentError] = useState<string | null>(null);

  // Cancel Order Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Cancelación solicitada por el cliente');

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
    setPaymentMethod('Efectivo');
    setPaymentNote('');
    setPaymentError(null);
    setShowPaymentModal(true);
  };

  // Submit Standalone Payment
  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(paymentAmountInput);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setPaymentError('Ingrese un monto válido mayor a Q 0.00.');
      return;
    }

    if (parsedAmount > order.balance + 0.001) {
      setPaymentError(`El monto no puede exceder el saldo pendiente de Q ${order.balance.toFixed(2)}.`);
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
    setDeliveryPaymentMethod('Efectivo');
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
          {/* Register Payment Action Button (if pending balance exists and not cancelled) */}
          {!isCancelled && hasPendingBalance && (
            <button
              id="btn-order-detail-register-payment"
              onClick={handleOpenPaymentModal}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Registrar pago o abono a este pedido"
            >
              <DollarSign className="w-4 h-4 text-emerald-200" />
              Registrar Pago
            </button>
          )}

          {/* Edit button */}
          {!isCancelled && !isDelivered && (
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
          {!isCancelled && (
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
          {!isCancelled && (
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
            {!isCancelled && hasPendingBalance && (
              <button
                id="btn-order-card-register-payment"
                type="button"
                onClick={handleOpenPaymentModal}
                className="w-full mt-3 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <DollarSign className="w-4 h-4 text-emerald-200" />
                Registrar Pago (Saldo: Q {order.balance.toFixed(2)})
              </button>
            )}

            {order.balance === 0 && (
              <div className="mt-3 p-2.5 rounded-xl bg-[#ECFDF5] text-[#047857] text-center text-xs font-bold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                Pago Completo Liquidado (Q 0.00 pendiente)
              </div>
            )}
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
      {showPaymentModal && (
        <div
          id="modal-register-payment"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#F2D6DE] relative animate-in fade-in max-h-[90dvh] flex flex-col my-auto overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 p-4 sm:p-6 pb-3 sm:pb-4 border-b border-[#F2D6DE]/60 shrink-0">
              <div className="min-w-0 flex-1 pr-2">
                <h3 className="text-base sm:text-lg font-bold text-[#681B2B] flex items-center gap-2 leading-snug break-words">
                  <DollarSign className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="truncate">Registrar Pago de Pedido</span>
                </h3>
                <p className="text-xs text-[#7D6871] mt-0.5 leading-relaxed break-words">
                  Pedido <strong className="text-[#2C1E23]">{order.code}</strong> • Cliente:{' '}
                  <strong className="text-[#2C1E23]">{order.clientName}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-[#7D6871] hover:text-[#2C1E23] p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center -mr-1 -mt-1"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {/* Financial Status Metrics */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#FBECEF]/40 border border-[#F2D6DE]">
                  <div className="text-center">
                    <span className="text-[10px] font-semibold text-[#7D6871] uppercase block">
                      Total Pedido
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-[#2C1E23]">
                      Q {order.total.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-center border-x border-[#F2D6DE]">
                    <span className="text-[10px] font-semibold text-[#059669] uppercase block">
                      Total Pagado
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-[#059669]">
                      Q {order.advancePayment.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] font-semibold text-[#DC2626] uppercase block">
                      Saldo Pendiente
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-[#DC2626]">
                      Q {order.balance.toFixed(2)}
                    </span>
                  </div>
                </div>
              {/* Payment Amount Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="input-payment-amount"
                    className="text-xs font-bold text-[#2C1E23]"
                  >
                    Monto a Pagar <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setPaymentAmountInput(order.balance.toFixed(2))}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                  >
                    Liquidar Saldo Completo (Q {order.balance.toFixed(2)})
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-bold text-[#7D6871] pointer-events-none">
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
                    className="w-full pl-8 pr-3 py-2.5 text-sm font-bold rounded-xl border border-[#F2D6DE] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                  />
                </div>
                {paymentError && (
                  <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {paymentError}
                  </p>
                )}
              </div>

              {/* Live Financial Outcome Preview */}
              {currentPayNum > 0 && currentPayNum <= order.balance && (
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-emerald-900">
                    <span>Nuevo Total Pagado:</span>
                    <strong className="font-bold">Q {projectedPaid.toFixed(2)}</strong>
                  </div>
                  <div className="flex items-center justify-between text-emerald-950 font-bold border-t border-emerald-200/60 pt-1">
                    <span>Nuevo Saldo Restante:</span>
                    <span className={projectedBalance === 0 ? 'text-emerald-700' : 'text-amber-800'}>
                      Q {projectedBalance.toFixed(2)}
                      {projectedBalance === 0 && ' (¡Liquidado al 100%!)'}
                    </span>
                  </div>
                </div>
              )}

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold text-[#2C1E23] mb-1.5">
                  Forma de Pago
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Efectivo', 'Transferencia', 'Tarjeta'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        paymentMethod === m
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-xs'
                          : 'border-gray-200 hover:border-gray-300 text-[#7D6871]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note / Reference */}
              <div>
                <label className="block text-xs font-bold text-[#2C1E23] mb-1.5">
                  Referencia o Nota (Opcional)
                </label>
                <input
                  id="input-payment-note"
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Ej. Comprobante #124567, pago en sucursal..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20 outline-none"
                />
              </div>

              </div>

              {/* Action Buttons */}
              <div className="p-3.5 sm:p-4 sm:px-6 border-t border-[#F2D6DE]/60 bg-gray-50/50 sm:bg-white flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-medium text-[#7D6871] hover:bg-gray-100 rounded-xl cursor-pointer min-h-[42px] sm:min-h-[36px] flex items-center justify-center"
                >
                  Cancelar
                </button>
                <button
                  id="btn-confirm-payment-save"
                  type="submit"
                  disabled={currentPayNum <= 0 || currentPayNum > order.balance}
                  className="w-full sm:w-auto px-5 py-2.5 sm:py-2 text-xs sm:text-sm font-bold bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 min-h-[42px] sm:min-h-[36px]"
                >
                  <DollarSign className="w-4 h-4" />
                  Confirmar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: CAMBIAR ESTADO (WITH INTEGRATED DELIVERY BALANCE CHECK) */}
      {/* ============================================================ */}
      {showStatusModal && (
        <div
          id="modal-change-status"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto"
        >
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#F2D6DE] relative animate-in fade-in max-h-[90dvh] flex flex-col my-auto overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 p-4 sm:p-6 pb-3 sm:pb-4 border-b border-[#F2D6DE]/60 shrink-0">
              <div className="min-w-0 flex-1 pr-2">
                <h3 className="text-base sm:text-lg font-bold text-[#2C1E23] leading-snug break-words">
                  Actualizar Estado del Pedido {order.code}
                </h3>
                <p className="text-xs text-[#7D6871] mt-0.5 leading-relaxed break-words">
                  Estado actual: <strong className="text-[#681B2B]">{order.status}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-[#7D6871] hover:text-[#2C1E23] p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center -mr-1 -mt-1"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmStatusChange} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#2C1E23] mb-1.5">
                    Nuevo Estado a Asignar
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => {
                      setNewStatus(e.target.value as OrderStatus);
                      setDeliveryPaymentError(null);
                    }}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20 bg-white font-semibold outline-none"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="En preparación">En preparación</option>
                    <option value="Listo">Listo</option>
                    <option value="Entregado">Entregado</option>
                  </select>
                </div>

                {/* Conditional Block when user selects "Entregado" and order has pending balance */}
                {newStatus === 'Entregado' && order.balance > 0 && (
                  <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-amber-900">
                          Este pedido tiene un saldo pendiente de Q {order.balance.toFixed(2)}.
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
                          className="text-[10px] font-semibold text-emerald-800 hover:underline cursor-pointer"
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
                          className="w-full pl-7 pr-3 py-2 text-xs font-bold rounded-lg border border-amber-300 bg-white focus:ring-2 focus:ring-amber-500/30 outline-none"
                        />
                      </div>
                      {deliveryPaymentError && (
                        <p className="text-[11px] text-red-600 mt-1 font-semibold">
                          {deliveryPaymentError}
                        </p>
                      )}
                    </div>

                    {/* Payment Method Selector */}
                    <div>
                      <label className="block text-[11px] font-bold text-[#2C1E23] mb-1">
                        Método de Cobro
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {['Efectivo', 'Transferencia', 'Tarjeta'].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setDeliveryPaymentMethod(m)}
                            className={`py-1 px-2 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                              deliveryPaymentMethod === m
                                ? 'border-emerald-600 bg-white text-emerald-900 font-bold shadow-xs'
                                : 'border-amber-200 bg-amber-100/40 text-amber-900'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
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
                            <strong>Abono Parcial:</strong> Quedará un saldo pendiente de <strong>Q {deliveryProjectedBalance.toFixed(2)}</strong>. El pedido <strong>NO</strong> se marcará como Entregado.
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#2C1E23] mb-1.5">
                    Nota / Observación del Cambio
                  </label>
                  <textarea
                    rows={2}
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Ej. Entregado en recepción del taller con firma de recibido..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20 outline-none resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-3.5 sm:p-4 sm:px-6 border-t border-[#F2D6DE]/60 bg-gray-50/50 sm:bg-white flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-medium text-[#7D6871] hover:bg-gray-100 rounded-xl cursor-pointer min-h-[42px] sm:min-h-[36px] flex items-center justify-center"
                >
                  Cancelar
                </button>
                <button
                  id="btn-confirm-status-update"
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
                      <DollarSign className="w-4 h-4 shrink-0" />
                      <span>Registrar Abono</span>
                    </>
                  ) : (
                    'Actualizar Estado'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: CANCELAR PEDIDO (CRITICAL ACTION CONFIRMATION) */}
      {/* ============================================================ */}
      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancellation}
        title="¿Está seguro de cancelar este pedido?"
        message={`Al cancelar el pedido ${order.code}, se devolverán automáticamente todas las flores, empaques y accesorios utilizados al stock disponible del taller.`}
        confirmText="Sí, Cancelar Pedido"
        cancelText="Volver sin cancelar"
        type="danger"
      />
    </div>
  );
};
