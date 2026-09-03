import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  User,
  Plus,
  Trash2,
  Calendar,
  Clock,
  MessageCircle,
  Phone,
  FileText,
  AlertTriangle,
  ArrowLeft,
  Save,
  Layers,
  Sparkles,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  OrderChannel,
  OrderItemDetail,
  Client,
  ComponentItem,
} from '../../types';
import {
  QuantityInput,
  FormField,
  FormFieldError,
  SystemAlert,
  AutocompleteSelect,
  TextArea,
  Modal,
  MoneyFormatter,
} from '../common';
import { OrderComponentsEditor } from '../orders/OrderComponentsEditor';

interface OrderFormViewProps {
  orderIdToEdit?: string | null;
}

export const OrderFormView: React.FC<OrderFormViewProps> = ({ orderIdToEdit }) => {
  const {
    clients,
    components,
    orders,
    createOrder,
    updateOrder,
    addClient,
    goBack,
    navigateToOrderDetail,
    addToast,
    newOrderInitialData,
    setNewOrderInitialData,
    getCatalogItems,
    getCatalogSelectOptions,
  } = useApp();

  const isEditing = !!orderIdToEdit;
  const existingOrder = isEditing ? orders.find((o) => o.id === orderIdToEdit) : null;

  // Form State
  const [selectedClientId, setSelectedClientId] = useState<string>(() => {
    if (existingOrder) return existingOrder.clientId;
    return newOrderInitialData?.clientId || '';
  });
  const [channel, setChannel] = useState<OrderChannel>(() => {
    if (existingOrder) return existingOrder.channel;
    const active = getCatalogItems('order_channels', true);
    return (active[0]?.name as OrderChannel) || 'WhatsApp';
  });
  const [deliveryDate, setDeliveryDate] = useState<string>(() => {
    if (existingOrder) return existingOrder.deliveryDate;
    if (newOrderInitialData?.deliveryDate) return newOrderInitialData.deliveryDate;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [deliveryTime, setDeliveryTime] = useState<string>('12:00');
  const [description, setDescription] = useState<string>('');
  const [observations, setObservations] = useState<string>('');
  const [items, setItems] = useState<OrderItemDetail[]>([]);
  const [advancePayment, setAdvancePayment] = useState<number>(0);

  // Quick Client Modal State
  const [showClientModal, setShowClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientNotes, setNewClientNotes] = useState('');

  // Form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or populate data
  useEffect(() => {
    if (existingOrder) {
      setSelectedClientId(existingOrder.clientId);
      setChannel(existingOrder.channel);
      setDeliveryDate(existingOrder.deliveryDate);
      setDeliveryTime(existingOrder.deliveryTime || '12:00');
      setDescription(existingOrder.description);
      setObservations(existingOrder.observations || '');
      setItems(existingOrder.items);
      setAdvancePayment(existingOrder.advancePayment);
    } else {
      if (newOrderInitialData?.deliveryDate) {
        setDeliveryDate(newOrderInitialData.deliveryDate);
      } else {
        // Default to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setDeliveryDate(tomorrow.toISOString().split('T')[0]);
      }
      if (newOrderInitialData?.clientId) {
        setSelectedClientId(newOrderInitialData.clientId);
      }
      setDeliveryTime('15:00');
    }
  }, [existingOrder, newOrderInitialData]);

  // Clean up initial navigation data on unmount
  useEffect(() => {
    return () => {
      setNewOrderInitialData(null);
    };
  }, [setNewOrderInitialData]);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  // Calculations
  const calculatedSubtotal = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  const calculatedTotal = calculatedSubtotal;
  const effectivePaid = isEditing && existingOrder ? existingOrder.advancePayment : (advancePayment || 0);
  const calculatedBalance = Math.max(0, calculatedTotal - effectivePaid);

  // Handle Client Quick Creation
  const handleCreateClientQuick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) {
      addToast('El nombre del cliente es obligatorio.', 'error');
      return;
    }
    const created = addClient({
      name: newClientName.trim(),
      phone: newClientPhone.trim() || 'No registrado',
      notes: newClientNotes.trim(),
    });
    setSelectedClientId(created.id);
    setShowClientModal(false);
    setNewClientName('');
    setNewClientPhone('');
    setNewClientNotes('');
  };

  // Add Component Item directly from Autocomplete
  const handleAddItemFromAutocomplete = (comp: ComponentItem) => {
    const baseAvailable = comp.physicalStock - comp.reservedStock;
    let effectiveAvailable = baseAvailable;
    if (existingOrder) {
      const originalAllocated =
        existingOrder.items.find((it) => it.componentId === comp.id)?.quantity || 0;
      effectiveAvailable += originalAllocated;
    }

    if (effectiveAvailable <= 0) {
      addToast(
        `Disponibilidad insuficiente para "${comp.name}". No hay existencias disponibles.`,
        'error'
      );
      return;
    }

    const existingInForm = items.find((it) => it.componentId === comp.id);
    if (existingInForm) {
      if (existingInForm.quantity + 1 > effectiveAvailable) {
        addToast(
          `Disponibilidad máxima alcanzada para "${comp.name}" (${effectiveAvailable} ${comp.unit || 'unidades'}).`,
          'warning'
        );
        return;
      }
      setItems((prev) =>
        prev.map((it) =>
          it.componentId === comp.id
            ? {
                ...it,
                quantity: it.quantity + 1,
                subtotal: (it.quantity + 1) * it.unitPrice,
              }
            : it
        )
      );
      addToast(`Se aumentó la cantidad de "${comp.name}" a ${existingInForm.quantity + 1}.`, 'info');
    } else {
      const newItem: OrderItemDetail = {
        componentId: comp.id,
        componentName: comp.name,
        category: comp.category,
        quantity: 1,
        unitPrice: comp.price,
        subtotal: comp.price,
      };
      setItems((prev) => [...prev, newItem]);
      addToast(`"${comp.name}" agregado al pedido.`, 'success');
    }

    if (errors.items) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.items;
        return copy;
      });
    }
  };

  // Update item quantity directly
  const handleUpdateItemQuantity = (componentId: string, newQty: number) => {
    setItems((prev) =>
      prev.map((it) =>
        it.componentId === componentId
          ? {
              ...it,
              quantity: newQty,
              subtotal: Math.max(0, newQty) * it.unitPrice,
            }
          : it
      )
    );

    if (errors.items) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.items;
        return copy;
      });
    }
  };

  const handleRemoveItem = (componentId: string) => {
    const item = items.find((it) => it.componentId === componentId);
    setItems((prev) => prev.filter((it) => it.componentId !== componentId));
    if (item) {
      addToast(`"${item.componentName}" eliminado del pedido.`, 'info');
    }
  };

  // Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!selectedClientId) {
      newErrors.client = 'Debe seleccionar o registrar un cliente.';
    }
    if (!deliveryDate) {
      newErrors.deliveryDate = 'La fecha de entrega es obligatoria.';
    }
    if (!deliveryTime) {
      newErrors.deliveryTime = 'La hora de entrega es obligatoria.';
    }
    if (!description.trim()) {
      newErrors.description = 'Debe ingresar una descripción breve del pedido.';
    }
    if (items.length === 0) {
      newErrors.items = 'Debe agregar al menos un componente o detalle al pedido.';
    } else {
      const invalidQtyItem = items.find((it) => it.quantity <= 0);
      if (invalidQtyItem) {
        newErrors.items = `Ingrese una cantidad mayor a 0 para "${invalidQtyItem.componentName}".`;
      } else {
        // Validate stock availability
        for (const it of items) {
          const comp = components.find((c) => c.id === it.componentId);
          if (comp) {
            const baseAvailable = comp.physicalStock - comp.reservedStock;
            let effectiveAvailable = baseAvailable;
            if (existingOrder) {
              const originalAllocated =
                existingOrder.items.find((x) => x.componentId === it.componentId)?.quantity || 0;
              effectiveAvailable += originalAllocated;
            }
            if (it.quantity > effectiveAvailable) {
              newErrors.items = `La cantidad de "${it.componentName}" (${it.quantity}) excede el disponible (${effectiveAvailable} ${comp.unit || 'unidades'}).`;
              break;
            }
          }
        }
      }
    }
    if (!isEditing) {
      if (advancePayment < 0) {
        newErrors.advancePayment = 'El anticipo no puede ser negativo.';
      }
      if (advancePayment > calculatedTotal) {
        newErrors.advancePayment = 'El anticipo no puede exceder el total del pedido.';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      addToast('Por favor corrija los campos marcados en el formulario.', 'error', 'Validación');
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const finalAdvancePayment = isEditing && existingOrder
      ? existingOrder.advancePayment
      : (Number(advancePayment) || 0);

    const payload = {
      clientId: selectedClientId,
      channel,
      description: description.trim(),
      observations: observations.trim(),
      deliveryDate,
      deliveryTime,
      items,
      advancePayment: finalAdvancePayment,
    };

    setTimeout(() => {
      if (isEditing && orderIdToEdit) {
        const res = updateOrder(orderIdToEdit, payload);
        if (!res.success) {
          addToast(res.error || 'Error al actualizar pedido', 'error');
          setIsSubmitting(false);
        }
      } else {
        const res = createOrder(payload);
        if (!res.success) {
          addToast(res.error || 'Error al crear pedido', 'error');
          setIsSubmitting(false);
        }
      }
    }, 350);
  };

  return (
    <div id="order-form-view-container" className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header and Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="btn-order-form-back"
            onClick={() => goBack(isEditing ? 'order-detail' : 'orders')}
            className="p-2 rounded-xl bg-white border border-[#F2D6DE] text-[#7D6871] hover:text-[#681B2B] hover:bg-[#FBECEF]/40 transition-colors cursor-pointer"
            title="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#2C1E23] tracking-tight">
              {isEditing ? `Editar Pedido ${existingOrder?.code}` : 'Nuevo Pedido Personalizado'}
            </h1>
            <p className="text-xs text-[#7D6871] mt-0.5 font-medium">
              {isEditing
                ? 'Modifique datos, componentes o anticipo. El stock se recalculará automáticamente.'
                : 'Complete las 4 secciones para registrar el pedido y validar disponibilidad.'}
            </p>
          </div>
        </div>

        {isEditing && (
          <span className="text-xs font-bold px-3 py-1 bg-[#FBECEF] text-[#681B2B] rounded-full border border-[#F2D6DE]">
            Modo Edición
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ============================================================ */}
        {/* SECCIÓN 1 — CLIENTE */}
        {/* ============================================================ */}
        <div
          id="section-order-client"
          className="bg-white rounded-2xl p-5 sm:p-6 border border-[#F2D6DE]/60 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#F2D6DE]/40 pb-3">
            <h2 className="text-sm font-bold text-[#2C1E23] uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#681B2B] text-white flex items-center justify-center text-xs font-bold">
                1
              </span>
              Identificación del Cliente
            </h2>

            <button
              id="btn-open-quick-client-modal"
              type="button"
              onClick={() => setShowClientModal(true)}
              className="text-xs font-bold text-[#681B2B] hover:text-[#541421] bg-[#FBECEF]/60 hover:bg-[#FBECEF] px-3 py-1.5 rounded-xl border border-[#F2D6DE] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Nuevo Cliente
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <AutocompleteSelect
                id="select-order-client"
                label="Seleccionar Cliente"
                required
                options={clients.map((cli) => ({
                  value: cli.id,
                  label: cli.name,
                  description: `Tel: ${cli.phone}${cli.notes ? ` • ${cli.notes}` : ''}`,
                }))}
                value={selectedClientId}
                onChange={(val) => setSelectedClientId(val)}
                placeholder="-- Buscar o seleccionar cliente --"
                searchable={true}
                allowClear={true}
                error={errors.client}
              />
            </div>

            {selectedClient && (
              <div
                id="selected-client-card"
                className="p-3.5 rounded-xl bg-[#FBECEF]/30 border border-[#F2D6DE] flex flex-col justify-between text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#681B2B]">{selectedClient.name}</span>
                  <span className="text-[#7D6871] font-medium">{selectedClient.phone}</span>
                </div>
                {selectedClient.notes && (
                  <p className="text-[#7D6871] mt-1 text-[11px] italic">
                    Prefiere: "{selectedClient.notes}"
                  </p>
                )}
                <div className="mt-2 text-[10px] text-[#059669] font-semibold">
                  Pedidos previos registrados: {selectedClient.totalOrders || 0}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECCIÓN 2 — DATOS DEL PEDIDO */}
        {/* ============================================================ */}
        <div
          id="section-order-details"
          className="bg-white rounded-2xl p-5 sm:p-6 border border-[#F2D6DE]/60 shadow-xs space-y-4"
        >
          <div className="border-b border-[#F2D6DE]/40 pb-3">
            <h2 className="text-sm font-bold text-[#2C1E23] uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#681B2B] text-white flex items-center justify-center text-xs font-bold">
                2
              </span>
              Datos del Pedido y Entrega
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <AutocompleteSelect
                id="select-order-channel"
                label="Canal de Recepción"
                required
                options={getCatalogSelectOptions('order_channels', {
                  currentValue: channel,
                  isNew: !isEditing,
                  includeDescription: true,
                })}
                value={channel}
                onChange={(val) => setChannel(val as OrderChannel)}
                searchable={true}
                placeholder="Seleccione un canal..."
              />
            </div>

            <FormField
              id="input-order-date"
              label="Fecha de Entrega"
              required
              error={errors.deliveryDate}
            >
              <input
                id="input-order-date"
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#2C1E23] bg-white focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20 font-medium ${
                  errors.deliveryDate ? 'border-rose-400 bg-rose-50/30 ring-1 ring-rose-200' : 'border-[#F2D6DE]'
                }`}
              />
            </FormField>

            <FormField
              id="input-order-time"
              label="Hora de Entrega"
              required
              error={errors.deliveryTime}
            >
              <input
                id="input-order-time"
                type="time"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#2C1E23] bg-white focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20 font-medium ${
                  errors.deliveryTime ? 'border-rose-400 bg-rose-50/30 ring-1 ring-rose-200' : 'border-[#F2D6DE]'
                }`}
              />
            </FormField>
          </div>

          <FormField
            id="input-order-description"
            label="Descripción del Arreglo / Pedido"
            required
            error={errors.description}
          >
            <input
              id="input-order-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Arreglo floral de rosas rojas con caja hexagonal y chocolates"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#2C1E23] bg-white focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20 font-medium ${
                errors.description ? 'border-rose-400 bg-rose-50/30 ring-1 ring-rose-200' : 'border-[#F2D6DE]'
              }`}
            />
          </FormField>

          <TextArea
            id="input-order-observations"
            label="Dedicatoria / Observaciones Especiales"
            rows={2}
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            maxLength={250}
            showCounter={true}
            placeholder="Texto de tarjeta personalizada, color de listón preferido, instrucciones de entrega..."
          />
        </div>

        {/* ============================================================ */}
        {/* SECCIÓN 3 — COMPONENTES */}
        {/* ============================================================ */}
        <OrderComponentsEditor
          items={items}
          components={components}
          existingOrder={existingOrder}
          onAddItem={handleAddItemFromAutocomplete}
          onUpdateQuantity={handleUpdateItemQuantity}
          onRemoveItem={handleRemoveItem}
          error={errors.items}
        />

        {/* ============================================================ */}
        {/* SECCIÓN 4 — RESUMEN FINANCIERO */}
        {/* ============================================================ */}
        <div
          id="section-order-summary"
          className="bg-white rounded-2xl p-5 sm:p-6 border border-[#F2D6DE]/60 shadow-xs space-y-4"
        >
          <div className="border-b border-[#F2D6DE]/40 pb-3">
            <h2 className="text-sm font-bold text-[#2C1E23] uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#681B2B] text-white flex items-center justify-center text-xs font-bold">
                4
              </span>
              Resumen de Precios y Anticipo
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Subtotal */}
            <div className="p-4 rounded-xl bg-[#FBECEF]/30 border border-[#F2D6DE]/60">
              <span className="text-[11px] font-semibold text-[#7D6871] uppercase">
                Subtotal
              </span>
              <div className="text-xl font-bold text-[#2C1E23] mt-1">
                Q {calculatedSubtotal.toFixed(2)}
              </div>
              <p className="text-[10px] text-[#7D6871] mt-0.5">Suma de componentes</p>
            </div>

            {/* Total */}
            <div className="p-4 rounded-xl bg-[#FBECEF]/60 border border-[#F2D6DE]">
              <span className="text-[11px] font-semibold text-[#681B2B] uppercase">
                Total del Pedido
              </span>
              <div className="text-2xl font-extrabold text-[#681B2B] mt-1">
                Q {calculatedTotal.toFixed(2)}
              </div>
              <p className="text-[10px] text-[#7D6871] mt-0.5">Monto total a cobrar</p>
            </div>

            {/* Anticipo / Pagos Registrados */}
            {isEditing ? (
              <div className="p-4 rounded-xl bg-white border border-[#F2D6DE]/60">
                <span className="block text-[11px] font-bold text-[#059669] uppercase mb-1">
                  Total Pagado a la Fecha
                </span>
                <div className="text-xl font-bold text-[#059669] mt-1">
                  Q {effectivePaid.toFixed(2)}
                </div>
                <p className="text-[10px] text-[#7D6871] mt-1 leading-tight">
                  Para registrar abonos o pagos, use la acción <strong>"Registrar pago"</strong> en el detalle del pedido.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white border border-[#F2D6DE]/60">
                <label
                  htmlFor="input-order-advance"
                  className="block text-[11px] font-bold text-[#059669] uppercase mb-1"
                >
                  Anticipo Inicial (Opcional)
                </label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs font-bold text-[#7D6871] pointer-events-none">
                    Q
                  </span>
                  <input
                    id="input-order-advance"
                    type="number"
                    min={0}
                    max={calculatedTotal}
                    step="any"
                    value={advancePayment === 0 ? '' : advancePayment}
                    placeholder="0.00"
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setAdvancePayment(isNaN(val) ? 0 : Math.max(0, val));
                    }}
                    className={`w-full pl-7 pr-3 py-1.5 rounded-lg border text-sm font-bold text-[#2C1E23] focus:outline-none focus:ring-2 focus:ring-[#059669]/30 ${
                      errors.advancePayment ? 'border-rose-400 bg-rose-50/40 ring-1 ring-rose-200' : 'border-[#F2D6DE]'
                    }`}
                  />
                </div>
                {errors.advancePayment ? (
                  <FormFieldError id="error-order-advance" error={errors.advancePayment} />
                ) : (
                  <p className="text-[10px] text-[#7D6871] mt-1">Pago inicial opcional recibido</p>
                )}
              </div>
            )}

            {/* Saldo Pendiente */}
            <div className="p-4 rounded-xl bg-[#FBECEF]/30 border border-[#F2D6DE]/60">
              <span className="text-[11px] font-semibold text-[#7D6871] uppercase">
                Saldo Pendiente
              </span>
              <div
                className={`text-xl font-bold mt-1 ${
                  calculatedBalance > 0 ? 'text-[#DC2626]' : 'text-emerald-700'
                }`}
              >
                Q {calculatedBalance.toFixed(2)}
              </div>
              <p className="text-[10px] text-[#7D6871] mt-0.5">
                {calculatedBalance === 0 ? 'Pagado completamente' : 'Pendiente al entregar'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#F2D6DE]/40">
            <button
              id="btn-order-form-cancel"
              type="button"
              onClick={() => goBack(isEditing ? 'order-detail' : 'orders')}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-[#7D6871] hover:text-[#2C1E23] hover:bg-gray-50 text-sm font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              id="btn-order-form-save"
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-[#681B2B] hover:bg-[#541421] text-white text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Guardando pedido...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditing ? 'Guardar Cambios' : 'Guardar Pedido'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* ============================================================ */}
      {/* MODAL: + NUEVO CLIENTE RÁPIDO */}
      {/* ============================================================ */}
      <Modal
        id="modal-quick-client"
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        title="Registrar Nuevo Cliente"
        subtitle="Agregue al cliente para asociarlo de inmediato a este pedido."
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowClientModal(false)}
              className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-medium text-[#7D6871] hover:bg-gray-100 rounded-xl cursor-pointer min-h-[42px] sm:min-h-[36px] flex items-center justify-center"
            >
              Cancelar
            </button>
            <button
              id="btn-save-quick-client"
              form="form-quick-client"
              type="submit"
              className="w-full sm:w-auto px-5 py-2 text-xs sm:text-sm font-bold bg-[#681B2B] hover:bg-[#541421] text-white rounded-xl shadow-xs cursor-pointer min-h-[42px] sm:min-h-[36px] flex items-center justify-center"
            >
              Guardar y Seleccionar
            </button>
          </>
        }
      >
        <form id="form-quick-client" onSubmit={handleCreateClientQuick} className="space-y-3.5">
          <FormField id="input-quick-client-name" label="Nombre Completo" required>
            <input
              id="input-quick-client-name"
              type="text"
              required
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              placeholder="Ej. Andrea López"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20 outline-none"
            />
          </FormField>

          <FormField id="input-quick-client-phone" label="Teléfono / WhatsApp" optional>
            <input
              id="input-quick-client-phone"
              type="text"
              value={newClientPhone}
              onChange={(e) => setNewClientPhone(e.target.value)}
              placeholder="Ej. 5512-3456"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20 outline-none"
            />
          </FormField>

          <TextArea
            id="input-quick-client-notes"
            label="Observaciones / Preferencias"
            rows={3}
            value={newClientNotes}
            onChange={(e) => setNewClientNotes(e.target.value)}
            maxLength={150}
            showCounter={true}
            placeholder="Tonos favoritos, tipo de flores preferidas..."
          />
        </form>
      </Modal>
    </div>

  );
};
