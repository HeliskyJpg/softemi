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
  FormRow,
  Input,
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
    <div id="order-form-view-container" className="w-full max-w-7xl mx-auto space-y-5 pb-24 lg:pb-16">
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
            <h1 className="text-xl sm:text-2xl font-bold text-[#2C1E23] tracking-tight">
              {isEditing ? `Editar Pedido ${existingOrder?.code}` : 'Nuevo Pedido Personalizado'}
            </h1>
            <p className="text-xs text-[#7D6871] mt-0.5 font-medium">
              {isEditing
                ? 'Modifique datos, componentes o anticipo. El stock se recalculará automáticamente.'
                : 'Complete el cliente, los datos de entrega y los componentes florales del arreglo.'}
            </p>
          </div>
        </div>

        {isEditing && (
          <span className="text-xs font-bold px-3 py-1 bg-[#FBECEF] text-[#681B2B] rounded-full border border-[#F2D6DE]">
            Modo Edición
          </span>
        )}
      </div>

      {/* Global Form Validation Summary (if any) */}
      {Object.keys(errors).length > 0 && (
        <SystemAlert
          id="alert-order-form-validation"
          type="error"
          title="Verifique los campos requeridos antes de guardar"
          message={
            Object.values(errors).length === 1
              ? Object.values(errors)[0]
              : `Hay ${Object.values(errors).length} campos con observaciones (cliente, entrega o componentes).`
          }
        />
      )}

      <form id="form-order" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ============================================================ */}
        {/* COLUMNA PRINCIPAL (IZQUIERDA / CENTRAL) — 8 COLS             */}
        {/* ============================================================ */}
        <div className="lg:col-span-8 space-y-5">
          {/* ========================================================== */}
          {/* ZONA 1: CLIENTE Y DATOS DEL PEDIDO (COMPACTA)               */}
          {/* ========================================================== */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#F2D6DE]/60 shadow-xs space-y-4">
            {/* SECCIÓN 1: IDENTIFICACIÓN DEL CLIENTE */}
            <div id="section-order-client" className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#F2D6DE]/40 pb-2.5">
                <h2 className="text-xs sm:text-sm font-bold text-[#2C1E23] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#681B2B] text-white flex items-center justify-center text-[11px] sm:text-xs font-bold shrink-0">
                    1
                  </span>
                  Identificación del Cliente
                </h2>

                <button
                  id="btn-open-quick-client-modal"
                  type="button"
                  onClick={() => setShowClientModal(true)}
                  className="text-xs font-bold text-[#681B2B] hover:text-[#541421] bg-[#FBECEF]/60 hover:bg-[#FBECEF] px-3 py-1.5 rounded-xl border border-[#F2D6DE] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo Cliente</span>
                </button>
              </div>

              {/* Selector y Card/Resumen en la misma zona */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-start">
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
                    onChange={(val) => {
                      setSelectedClientId(val);
                      if (errors.client) {
                        setErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.client;
                          return copy;
                        });
                      }
                    }}
                    placeholder="-- Buscar por nombre o teléfono --"
                    searchable={true}
                    allowClear={true}
                    error={errors.client}
                    size="md"
                  />
                </div>

                {selectedClient ? (
                  <div
                    id="selected-client-card"
                    className="p-3 rounded-xl bg-[#FBECEF]/35 border border-[#F2D6DE] flex flex-col justify-between text-xs space-y-1.5 min-h-[70px]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <User className="w-3.5 h-3.5 text-[#681B2B] shrink-0" />
                        <span className="font-bold text-[#681B2B] truncate">{selectedClient.name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#7D6871] font-medium shrink-0">
                        <Phone className="w-3 h-3 text-[#7D6871]" />
                        <span>{selectedClient.phone}</span>
                      </div>
                    </div>
                    {selectedClient.notes && (
                      <p className="text-[#7D6871] text-[11px] italic truncate">
                        Prefiere: "{selectedClient.notes}"
                      </p>
                    )}
                    <div className="text-[10px] text-[#059669] font-semibold flex items-center justify-between">
                      <span>Pedidos históricos: {selectedClient.totalOrders || 0}</span>
                      <span className="text-[#7D6871] font-normal">Cliente frecuente</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl border border-dashed border-[#F2D6DE] bg-gray-50/60 flex items-center justify-center text-center text-xs text-[#7D6871] min-h-[70px]">
                    <span>Seleccione un cliente registrado o use "+ Nuevo Cliente".</span>
                  </div>
                )}
              </div>
            </div>

            {/* SECCIÓN 2: DATOS DEL PEDIDO Y ENTREGA */}
            <div id="section-order-details" className="space-y-3.5 pt-2 border-t border-[#F2D6DE]/40">
              <div className="pb-1">
                <h2 className="text-xs sm:text-sm font-bold text-[#2C1E23] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#681B2B] text-white flex items-center justify-center text-[11px] sm:text-xs font-bold shrink-0">
                    2
                  </span>
                  Datos del Pedido y Entrega
                </h2>
              </div>

              {/* Fila compacta: Canal de recepción + Fecha de entrega + Hora de entrega en UNA MISMA FILA */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Canal de Recepción */}
                <div>
                  <AutocompleteSelect
                    id="select-order-channel"
                    label="Canal de Recepción"
                    required
                    options={getCatalogSelectOptions('order_channels', {
                      currentValue: channel,
                      isNew: !isEditing,
                      includeDescription: false,
                    })}
                    value={channel}
                    onChange={(val) => setChannel(val as OrderChannel)}
                    searchable={true}
                    placeholder="Seleccione canal..."
                    size="md"
                  />
                </div>

                {/* 2. Fecha de Entrega */}
                <div>
                  <FormField
                    id="input-order-date"
                    label="Fecha de Entrega"
                    required
                    error={errors.deliveryDate}
                    maxWidth="full"
                  >
                    <Input
                      id="input-order-date"
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => {
                        setDeliveryDate(e.target.value);
                        if (errors.deliveryDate) {
                          setErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.deliveryDate;
                            return copy;
                          });
                        }
                      }}
                      hasError={!!errors.deliveryDate}
                    />
                  </FormField>
                </div>

                {/* 3. Hora de Entrega */}
                <div>
                  <FormField
                    id="input-order-time"
                    label="Hora de Entrega"
                    required
                    error={errors.deliveryTime}
                    maxWidth="full"
                  >
                    <Input
                      id="input-order-time"
                      type="time"
                      value={deliveryTime}
                      onChange={(e) => {
                        setDeliveryTime(e.target.value);
                        if (errors.deliveryTime) {
                          setErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.deliveryTime;
                            return copy;
                          });
                        }
                      }}
                      hasError={!!errors.deliveryTime}
                    />
                  </FormField>
                </div>
              </div>

              {/* Descripción del pedido a ancho completo */}
              <FormField
                id="input-order-description"
                label="Descripción del Arreglo / Pedido"
                required
                error={errors.description}
                maxWidth="full"
              >
                <Input
                  id="input-order-description"
                  type="text"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description) {
                      setErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.description;
                        return copy;
                      });
                    }
                  }}
                  placeholder="Ej. Ramo bouquet de 24 rosas rojas con follaje de eucalipto en caja hexagonal"
                  hasError={!!errors.description}
                />
              </FormField>

              {/* Dedicatoria / observaciones a ancho completo */}
              <TextArea
                id="input-order-observations"
                label="Dedicatoria / Observaciones Especiales"
                rows={2}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                maxLength={250}
                showCounter={true}
                placeholder="Texto de tarjeta personalizada, color de listón preferido, observaciones para el repartidor..."
              />
            </div>
          </div>

          {/* ========================================================== */}
          {/* ZONA 2: SELECCIÓN DE COMPONENTES Y FLORES (ÁREA PRINCIPAL)  */}
          {/* ========================================================== */}
          <OrderComponentsEditor
            items={items}
            components={components}
            existingOrder={existingOrder}
            onAddItem={handleAddItemFromAutocomplete}
            onUpdateQuantity={handleUpdateItemQuantity}
            onRemoveItem={handleRemoveItem}
            error={errors.items}
          />
        </div>

        {/* ============================================================ */}
        {/* COLUMNA LATERAL DERECHA (STICKY DESKTOP) — 4 COLS            */}
        {/* ============================================================ */}
        <div className="lg:col-span-4 lg:sticky lg:top-4 space-y-4">
          <div
            id="section-order-summary"
            className="bg-white rounded-2xl p-5 border border-[#F2D6DE]/60 shadow-xs space-y-4"
          >
            {/* Header del Resumen */}
            <div className="flex items-center justify-between border-b border-[#F2D6DE]/40 pb-3">
              <h2 className="text-xs sm:text-sm font-bold text-[#2C1E23] uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#681B2B]" />
                Resumen del Pedido
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FBECEF] text-[#681B2B]">
                {items.length} {items.length === 1 ? 'componente' : 'componentes'}
              </span>
            </div>

            {/* Total Destacado y Subtotal */}
            <div className="space-y-2.5">
              {/* Total del Pedido (Tarjeta de alto impacto) */}
              <div className="p-3.5 rounded-xl bg-[#FBECEF]/70 border border-[#F2D6DE]">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-[#681B2B] uppercase tracking-wide">
                    Total del Pedido
                  </span>
                  <span className="text-2xl font-black text-[#681B2B]">
                    Q {calculatedTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#7D6871] mt-1 pt-1 border-t border-[#F2D6DE]/50">
                  <span>Subtotal insumos:</span>
                  <span className="font-semibold text-[#2C1E23]">Q {calculatedSubtotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Anticipo Inicial / Pagado a la fecha */}
              {isEditing ? (
                <div className="p-3 rounded-xl bg-gray-50/80 border border-[#F2D6DE]/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#059669] uppercase">
                      Total Pagado
                    </span>
                    <span className="text-base font-bold text-[#059669]">
                      Q {effectivePaid.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#7D6871] leading-tight">
                    Para registrar abonos o liquidaciones, utilice "Registrar pago" en el detalle.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-white border border-[#F2D6DE]/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="input-order-advance"
                      className="block text-[11px] font-bold text-[#059669] uppercase"
                    >
                      Anticipo Inicial (Opcional)
                    </label>
                    {advancePayment > 0 && (
                      <span className="text-[10px] font-semibold text-[#059669] bg-emerald-50 px-1.5 py-0.5 rounded">
                        {calculatedTotal > 0 ? `${Math.round((advancePayment / calculatedTotal) * 100)}%` : ''}
                      </span>
                    )}
                  </div>

                  <Input
                    id="input-order-advance"
                    type="number"
                    min={0}
                    max={calculatedTotal}
                    step="any"
                    prefixElement={<span className="text-xs font-bold text-[#7D6871]">Q</span>}
                    value={advancePayment === 0 ? '' : advancePayment}
                    placeholder="0.00"
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      const safeVal = isNaN(val) ? 0 : Math.max(0, val);
                      setAdvancePayment(safeVal);
                      if (errors.advancePayment) {
                        setErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.advancePayment;
                          return copy;
                        });
                      }
                    }}
                    hasError={!!errors.advancePayment}
                    className="font-bold text-[#2C1E23]"
                  />
                  {errors.advancePayment && (
                    <FormFieldError id="error-order-advance" error={errors.advancePayment} />
                  )}

                  {/* Atajos rápidos de anticipo */}
                  {calculatedTotal > 0 && (
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] text-[#7D6871]">Atajos:</span>
                      <button
                        type="button"
                        onClick={() => setAdvancePayment(0)}
                        className="px-2 py-0.5 text-[10px] font-medium rounded-md border border-[#F2D6DE] text-[#7D6871] hover:bg-gray-100 cursor-pointer"
                      >
                        Q 0
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdvancePayment(Math.round(calculatedTotal * 0.5))}
                        className="px-2 py-0.5 text-[10px] font-bold rounded-md border border-[#F2D6DE] text-[#059669] bg-emerald-50/50 hover:bg-emerald-50 cursor-pointer"
                      >
                        50% (Q {Math.round(calculatedTotal * 0.5)})
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdvancePayment(calculatedTotal)}
                        className="px-2 py-0.5 text-[10px] font-bold rounded-md border border-[#F2D6DE] text-[#681B2B] bg-[#FBECEF]/60 hover:bg-[#FBECEF] cursor-pointer"
                      >
                        100% (Q {calculatedTotal})
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Saldo Pendiente */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  calculatedBalance > 0
                    ? 'bg-rose-50/50 border-rose-200'
                    : 'bg-emerald-50/50 border-emerald-200'
                }`}
              >
                <div>
                  <span className="text-[11px] font-bold uppercase text-[#7D6871] block">
                    Saldo Pendiente
                  </span>
                  <span className="text-[10px] text-[#7D6871]">
                    {calculatedBalance === 0 ? 'Pagado completamente' : 'Pendiente al entregar'}
                  </span>
                </div>
                <span
                  className={`text-lg font-black ${
                    calculatedBalance > 0 ? 'text-[#DC2626]' : 'text-[#059669]'
                  }`}
                >
                  Q {calculatedBalance.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Mini desglose visual de componentes agregados */}
            <div className="pt-2 border-t border-[#F2D6DE]/40">
              <div className="text-[11px] font-bold text-[#7D6871] uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Flores e Insumos</span>
                <span className="text-[10px] font-normal text-[#7D6871]">
                  ({items.reduce((acc, it) => acc + it.quantity, 0)} unidades)
                </span>
              </div>

              {items.length === 0 ? (
                <p className="text-xs text-[#7D6871] italic py-2 text-center bg-gray-50/50 rounded-lg">
                  Ningún componente seleccionado aún.
                </p>
              ) : (
                <ul className="max-h-36 overflow-y-auto divide-y divide-[#F2D6DE]/30 text-xs pr-1 space-y-1">
                  {items.map((it) => (
                    <li key={it.componentId} className="flex items-center justify-between py-1 text-[#2C1E23]">
                      <div className="flex items-center gap-1.5 truncate max-w-[170px] sm:max-w-[200px]">
                        <span className="font-bold text-[#681B2B] shrink-0">{it.quantity}×</span>
                        <span className="truncate">{it.componentName}</span>
                      </div>
                      <span className="font-semibold shrink-0">Q {it.subtotal.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Botones Principales de Acción en Desktop */}
            <div className="pt-3 border-t border-[#F2D6DE]/40 space-y-2">
              <button
                id="btn-order-form-save"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-[#681B2B] hover:bg-[#541421] text-white text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Guardando pedido...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isEditing ? 'Guardar Cambios' : 'Guardar Pedido'}</span>
                  </>
                )}
              </button>

              <button
                id="btn-order-form-cancel"
                type="button"
                onClick={() => goBack(isEditing ? 'order-detail' : 'orders')}
                disabled={isSubmitting}
                className="w-full py-2 rounded-xl border border-gray-200 bg-white text-[#7D6871] hover:text-[#2C1E23] hover:bg-gray-50 text-xs font-medium transition-colors cursor-pointer text-center"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* ============================================================ */}
      {/* BARRA FLOTANTE RESUMEN INFERIOR EN MÓVIL (< lg)             */}
      {/* ============================================================ */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-md border-t border-[#F2D6DE] px-4 py-2.5 shadow-lg flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase font-bold text-[#7D6871] leading-none">
            Total del Pedido
          </div>
          <div className="text-base font-black text-[#681B2B] leading-tight">
            Q {calculatedTotal.toFixed(2)}
          </div>
          <div className="text-[10px] text-[#7D6871] truncate">
            Saldo: <strong className={calculatedBalance > 0 ? 'text-[#DC2626]' : 'text-[#059669]'}>Q {calculatedBalance.toFixed(2)}</strong>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-xl bg-[#681B2B] hover:bg-[#541421] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shrink-0"
        >
          {isSubmitting ? (
            <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span>{isEditing ? 'Guardar Cambios' : 'Guardar Pedido'}</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* MODAL: + NUEVO CLIENTE RÁPIDO                                */}
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
        <form id="form-quick-client" onSubmit={handleCreateClientQuick} className="space-y-4">
          <FormRow columns={2}>
            <FormField id="input-quick-client-name" label="Nombre Completo" required>
              <Input
                id="input-quick-client-name"
                type="text"
                required
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Ej. Andrea López"
              />
            </FormField>

            <FormField id="input-quick-client-phone" label="Teléfono / WhatsApp" optional>
              <Input
                id="input-quick-client-phone"
                type="tel"
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
                placeholder="Ej. 5512-3456"
              />
            </FormField>
          </FormRow>

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
