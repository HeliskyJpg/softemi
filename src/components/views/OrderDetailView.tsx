import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ArrowLeft,
  Edit,
  RefreshCw,
  XCircle,
  Clock,
  Calendar,
  Phone,
  User,
  MessageCircle,
  FileText,
  DollarSign,
  Layers,
  History,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Printer,
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
    setActiveView,
    navigateToOrderEdit,
    changeOrderStatus,
    cancelOrder,
    currentUser,
    addToast,
  } = useApp();

  const order = orders.find((o) => o.id === orderId);

  // Status Change Modal State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>('En preparación');
  const [statusNote, setStatusNote] = useState('');

  // Cancel Order Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Cancelación solicitada por el cliente');

  // Print Preview Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);

  if (!order) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-[#FBDAE3]">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-[#3A2D33]">Pedido no encontrado</h2>
        <p className="text-xs text-[#6D5C64] mt-1">El pedido seleccionado no existe o fue eliminado.</p>
        <button
          onClick={() => setActiveView('orders')}
          className="mt-4 px-4 py-2 bg-[#8E315E] text-white text-xs font-bold rounded-xl"
        >
          Volver a Pedidos
        </button>
      </div>
    );
  }

  const isCancelled = order.status === 'Cancelado';
  const isDelivered = order.status === 'Entregado';

  const handleOpenStatusModal = () => {
    // suggest next logical status
    if (order.status === 'Pendiente') setNewStatus('En preparación');
    else if (order.status === 'En preparación') setNewStatus('Listo');
    else if (order.status === 'Listo') setNewStatus('Entregado');
    else setNewStatus(order.status);
    setStatusNote('');
    setShowStatusModal(true);
  };

  const handleConfirmStatusChange = (e: React.FormEvent) => {
    e.preventDefault();
    changeOrderStatus(order.id, newStatus, statusNote);
    setShowStatusModal(false);
  };

  const handleConfirmCancellation = () => {
    cancelOrder(order.id, cancelReason);
    setShowCancelModal(false);
  };

  return (
    <div id="order-detail-view-container" className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            id="btn-order-detail-back"
            onClick={() => setActiveView('orders')}
            className="p-2 rounded-xl bg-white border border-[#FBDAE3] text-[#6D5C64] hover:text-[#8E315E] hover:bg-[#FFF7FA] transition-colors cursor-pointer"
            title="Volver a la lista"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-[#8E315E] tracking-tight">{order.code}</h1>
              <StatusBadge status={order.status} size="lg" />
            </div>
            <p className="text-xs text-[#6D5C64] mt-0.5">
              Registrado el {order.createdAt} por {order.createdBy}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Print preview button */}
          <button
            id="btn-order-detail-print"
            onClick={() => setShowPrintModal(true)}
            className="px-4 py-2 rounded-xl border border-[#FBDAE3] bg-[#FFF7FA] hover:bg-[#FBDAE3]/50 text-[#8E315E] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Ver vista previa de impresión o generar comprobante"
          >
            <Printer className="w-4 h-4" />
            Imprimir Ficha
          </button>

          {/* Edit button */}
          {!isCancelled && !isDelivered && (
            <button
              id="btn-order-detail-edit"
              onClick={() => navigateToOrderEdit(order.id)}
              className="px-4 py-2 rounded-xl border border-[#FBDAE3] bg-white hover:bg-[#FFF7FA] text-[#3A2D33] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Edit className="w-4 h-4 text-[#8E315E]" />
              Editar Pedido
            </button>
          )}

          {/* Change status button */}
          {!isCancelled && (
            <button
              id="btn-order-detail-change-status"
              onClick={handleOpenStatusModal}
              className="px-4 py-2 rounded-xl bg-[#65733D] hover:bg-[#546032] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
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
              className="px-4 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-[#9B2C2C] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
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
          className="p-4 rounded-2xl bg-red-50 border border-red-200 text-[#9B2C2C] text-xs flex items-start gap-3"
        >
          <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Este pedido fue cancelado</h4>
            <p className="mt-0.5 text-red-800">
              Todas las cantidades de componentes fueron restituidas automáticamente al inventario simulado.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Order Info & Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 cols: Client & Delivery Details */}
        <div className="md:col-span-2 space-y-6">
          {/* General Information Card */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#FBDAE3] shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-[#6D5C64] uppercase tracking-wider border-b border-gray-100 pb-2.5">
              Información General y Entrega
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] text-[#6D5C64] block">Cliente:</span>
                <div className="text-sm font-bold text-[#3A2D33] mt-0.5">{order.clientName}</div>
                <div className="text-xs text-[#6D5C64] flex items-center gap-1 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-[#65733D]" />
                  {order.clientPhone}
                </div>
              </div>

              <div>
                <span className="text-[11px] text-[#6D5C64] block">Canal de Recepción:</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FBDAE3]/50 text-[#8E315E] text-xs font-bold mt-1">
                  <MessageCircle className="w-3.5 h-3.5" />
                  {order.channel}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-[#6D5C64] block">Fecha de Entrega:</span>
                <div className="text-sm font-bold text-[#3A2D33] mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#8E315E]" />
                  {order.deliveryDate}
                </div>
              </div>

              <div>
                <span className="text-[11px] text-[#6D5C64] block">Hora de Entrega:</span>
                <div className="text-sm font-bold text-[#3A2D33] mt-0.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#8E315E]" />
                  {order.deliveryTime || 'No especificada'}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <span className="text-[11px] text-[#6D5C64] block">Descripción del Arreglo:</span>
              <p className="text-sm font-semibold text-[#3A2D33] mt-0.5">{order.description}</p>
            </div>

            {order.observations && (
              <div className="p-3.5 rounded-xl bg-[#FFF7FA] border border-[#FBDAE3]">
                <span className="text-[11px] font-bold text-[#8E315E] uppercase block mb-1">
                  Dedicatoria / Observaciones:
                </span>
                <p className="text-xs text-[#3A2D33] italic whitespace-pre-wrap leading-relaxed">
                  "{order.observations}"
                </p>
              </div>
            )}
          </div>

          {/* Components Table Card */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#FBDAE3] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <h2 className="text-xs font-bold text-[#6D5C64] uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#8E315E]" />
                Componentes e Insumos Utilizados
              </h2>
              <span className="text-xs font-semibold text-[#8E315E]">
                {order.items.length} elementos
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-[#6D5C64] text-[11px] uppercase">
                    <th className="pb-2.5 font-semibold">Componente</th>
                    <th className="pb-2.5 font-semibold">Categoría</th>
                    <th className="pb-2.5 font-semibold text-center">Cantidad</th>
                    <th className="pb-2.5 font-semibold text-right">Precio Unit.</th>
                    <th className="pb-2.5 font-semibold text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#FFF7FA]/60 transition-colors">
                      <td className="py-2.5 font-semibold text-[#3A2D33]">{item.componentName}</td>
                      <td className="py-2.5 text-[#6D5C64]">
                        <span className="px-2 py-0.5 bg-gray-100 rounded-full text-[10px]">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-2.5 text-center font-bold text-[#3A2D33]">{item.quantity}</td>
                      <td className="py-2.5 text-right text-[#6D5C64]">Q {item.unitPrice.toFixed(2)}</td>
                      <td className="py-2.5 text-right font-bold text-[#8E315E]">
                        Q {item.subtotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right col: Financial Summary & Historial */}
        <div className="space-y-6">
          {/* Financial Totals Card */}
          <div className="bg-white rounded-2xl p-5 border border-[#FBDAE3] shadow-xs space-y-3.5">
            <h3 className="text-xs font-bold text-[#6D5C64] uppercase tracking-wider border-b border-gray-100 pb-2">
              Resumen de Pago
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-[#6D5C64]">
                <span>Subtotal:</span>
                <span className="font-semibold text-[#3A2D33]">Q {order.subtotal.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-base font-extrabold text-[#8E315E] pt-2 border-t border-gray-100">
                <span>Total:</span>
                <span>Q {order.total.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold text-[#65733D] pt-1">
                <span>Anticipo Recibido:</span>
                <span>Q {order.advancePayment.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-sm font-bold pt-2 border-t border-gray-100">
                <span>Saldo Pendiente:</span>
                <span className={order.balance > 0 ? 'text-[#9B2C2C]' : 'text-emerald-700'}>
                  Q {order.balance.toFixed(2)}
                </span>
              </div>
            </div>

            {order.balance === 0 && (
              <div className="mt-3 p-2.5 rounded-xl bg-[#EBF1DE] text-[#4F5B2F] text-center text-xs font-bold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#65733D]" />
                Pago Completo Liquidado
              </div>
            )}
          </div>

          {/* Historial Card */}
          <div className="bg-white rounded-2xl p-5 border border-[#FBDAE3] shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-[#6D5C64] uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
              <History className="w-4 h-4 text-[#8E315E]" />
              Historial de Auditoría
            </h3>

            <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#FBDAE3]">
              {order.history.map((entry) => (
                <div key={entry.id} className="relative pl-7 text-xs space-y-0.5">
                  <div className="absolute left-1.5 top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#8E315E]" />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#3A2D33]">{entry.action}</span>
                    <span className="text-[10px] text-[#6D5C64]">{entry.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-[#6D5C64]">Por: {entry.user}</p>
                  {entry.details && (
                    <p className="text-[11px] text-[#3A2D33] bg-[#FFF7FA] p-1.5 rounded-lg border border-[#FBDAE3]/50">
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
      {/* MODAL: CAMBIAR ESTADO */}
      {/* ============================================================ */}
      {showStatusModal && (
        <div
          id="modal-change-status"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#FBDAE3] relative animate-in fade-in">
            <h3 className="text-base font-bold text-[#3A2D33] mb-1">
              Actualizar Estado del Pedido {order.code}
            </h3>
            <p className="text-xs text-[#6D5C64] mb-4">
              Estado actual: <strong className="text-[#8E315E]">{order.status}</strong>
            </p>

            <form onSubmit={handleConfirmStatusChange} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#3A2D33] mb-1.5">
                  Nuevo Estado a Asignar
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#FBDAE3] focus:ring-2 focus:ring-[#8E315E]/30 bg-white font-semibold outline-none"
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="En preparación">En preparación</option>
                  <option value="Listo">Listo</option>
                  <option value="Entregado">Entregado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3A2D33] mb-1.5">
                  Nota / Observación del Cambio
                </label>
                <textarea
                  rows={2}
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Ej. Taller finalizó hidratación y montaje; listo para empaque..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#FBDAE3] focus:ring-2 focus:ring-[#8E315E]/30 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 text-xs font-medium text-[#6D5C64] hover:bg-gray-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  id="btn-confirm-status-update"
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#8E315E] hover:bg-[#7A294F] text-white rounded-xl shadow-xs cursor-pointer"
                >
                  Actualizar Estado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: VISTA PREVIA DE IMPRESIÓN / FICHA DE PEDIDO */}
      {/* ============================================================ */}
      {showPrintModal && (
        <div
          id="modal-print-order-preview"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#FBDAE3] my-8 animate-in fade-in">
            {/* Action Bar inside preview */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 print:hidden">
              <div className="flex items-center gap-2 text-xs text-[#6D5C64]">
                <Printer className="w-4 h-4 text-[#8E315E]" />
                <span className="font-semibold">Vista Previa de Impresión / Ficha Oficial</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-[#6D5C64] hover:bg-gray-100 rounded-xl"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 text-xs font-bold bg-[#8E315E] hover:bg-[#7A294F] text-white rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir Documento
                </button>
              </div>
            </div>

            {/* Printable Document Area */}
            <div className="space-y-6 text-[#3A2D33]">
              {/* Document Header with Logo */}
              <div className="flex items-center justify-between border-b-2 border-[#FBDAE3] pb-4">
                <div className="flex items-center gap-3">
                  <img
                    src="/emila-logo.png"
                    alt="EMILA Floristería"
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-full shadow-xs shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-[#8E315E] tracking-tight">
                      EMILA FLORISTERÍA
                    </h2>
                    <p className="text-[11px] text-[#6D5C64]">
                      Gestión de Pedidos y Diseños Florales Personalizados
                    </p>
                    <p className="text-[10px] text-[#6D5C64]">
                      Documento Oficial de Taller y Entrega
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-[#6D5C64] uppercase block">
                    Código de Pedido
                  </span>
                  <span className="text-lg sm:text-xl font-extrabold text-[#8E315E]">
                    {order.code}
                  </span>
                  <div className="text-[11px] text-[#6D5C64] mt-0.5">
                    Estado: <strong>{order.status}</strong>
                  </div>
                </div>
              </div>

              {/* Order and Client Summary */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-[#FFF7FA] p-4 rounded-2xl border border-[#FBDAE3]">
                <div>
                  <span className="text-[10px] font-bold text-[#6D5C64] uppercase block">
                    Datos del Cliente
                  </span>
                  <p className="font-bold text-sm text-[#3A2D33] mt-0.5">{order.clientName}</p>
                  <p className="text-[#6D5C64] mt-0.5">Tel: {order.clientPhone}</p>
                  <p className="text-[#6D5C64]">Canal: {order.channel}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#6D5C64] uppercase block">
                    Programación de Entrega
                  </span>
                  <p className="font-bold text-sm text-[#8E315E] mt-0.5">
                    Fecha: {order.deliveryDate}
                  </p>
                  <p className="text-[#3A2D33] mt-0.5">
                    Hora: {order.deliveryTime || 'Por coordinar'}
                  </p>
                  <p className="text-[#6D5C64]">Registrado: {order.createdAt}</p>
                </div>
              </div>

              {/* Order Description & Observations */}
              <div className="text-xs space-y-2">
                <div>
                  <span className="text-[10px] font-bold text-[#6D5C64] uppercase block">
                    Descripción del Pedido
                  </span>
                  <p className="font-semibold text-sm text-[#3A2D33]">{order.description}</p>
                </div>
                {order.observations && (
                  <div className="p-3 bg-white rounded-xl border border-[#FBDAE3]">
                    <span className="text-[10px] font-bold text-[#8E315E] uppercase block mb-0.5">
                      Dedicatoria / Nota Especial:
                    </span>
                    <p className="italic text-xs text-[#3A2D33]">"{order.observations}"</p>
                  </div>
                )}
              </div>

              {/* Items Breakdown Table */}
              <div className="text-xs">
                <span className="text-[10px] font-bold text-[#6D5C64] uppercase block mb-1.5">
                  Detalle de Insumos y Componentes
                </span>
                <table className="w-full text-left border-collapse border border-gray-200 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-[#FFF7FA] text-[#6D5C64] text-[10px] uppercase border-b border-gray-200">
                      <th className="p-2 font-bold">Elemento</th>
                      <th className="p-2 font-bold">Categoría</th>
                      <th className="p-2 font-bold text-center">Cant.</th>
                      <th className="p-2 font-bold text-right">P. Unit</th>
                      <th className="p-2 font-bold text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {order.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-semibold text-[#3A2D33]">{item.componentName}</td>
                        <td className="p-2 text-[#6D5C64] text-[11px]">{item.category}</td>
                        <td className="p-2 text-center font-bold">{item.quantity}</td>
                        <td className="p-2 text-right text-[#6D5C64]">Q {item.unitPrice.toFixed(2)}</td>
                        <td className="p-2 text-right font-bold text-[#8E315E]">
                          Q {item.subtotal.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals */}
              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-1.5 text-xs bg-[#FFF7FA] p-3.5 rounded-2xl border border-[#FBDAE3]">
                  <div className="flex justify-between text-[#6D5C64]">
                    <span>Subtotal:</span>
                    <span className="font-semibold">Q {order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-[#8E315E] pt-1 border-t border-gray-200">
                    <span>Total:</span>
                    <span>Q {order.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#65733D] font-semibold text-xs">
                    <span>Anticipo:</span>
                    <span>Q {order.advancePayment.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-xs pt-1 border-t border-gray-200">
                    <span>Saldo Pendiente:</span>
                    <span className={order.balance > 0 ? 'text-[#9B2C2C]' : 'text-emerald-700'}>
                      Q {order.balance.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signature section */}
              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-[10px] text-[#6D5C64] border-t border-gray-200">
                <div>
                  <div className="border-b border-gray-400 w-36 mx-auto mb-1" />
                  <span>Firma Taller / Preparado</span>
                </div>
                <div>
                  <div className="border-b border-gray-400 w-36 mx-auto mb-1" />
                  <span>Firma Cliente / Recibido</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: CANCELAR PEDIDO (CRITICAL ACTION CONFIRMATION) */}
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
