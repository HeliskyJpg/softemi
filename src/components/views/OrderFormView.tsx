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
  DollarSign,
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
import { QuantityInput } from '../common/QuantityInput';

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
  } = useApp();

  const isEditing = !!orderIdToEdit;
  const existingOrder = isEditing ? orders.find((o) => o.id === orderIdToEdit) : null;

  // Form State
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [channel, setChannel] = useState<OrderChannel>('WhatsApp');
  const [deliveryDate, setDeliveryDate] = useState<string>('');
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

  // Add Component Modal State
  const [showAddComponentModal, setShowAddComponentModal] = useState(false);
  const [selectedComponentId, setSelectedComponentId] = useState('');
  const [selectedComponentQty, setSelectedComponentQty] = useState(1);

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
      // Default to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDeliveryDate(tomorrow.toISOString().split('T')[0]);
      setDeliveryTime('15:00');
    }
  }, [existingOrder]);

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

  // Add Component Item to Order
  const handleAddComponentItem = () => {
    if (!selectedComponentId) return;
    const comp = components.find((c) => c.id === selectedComponentId);
    if (!comp) return;

    if (selectedComponentQty <= 0) {
      addToast('La cantidad debe ser mayor a 0.', 'error');
      return;
    }

    // Check availability (factoring in items already in the form)
    const existingInForm = items.find((it) => it.componentId === comp.id);
    const existingQty = existingInForm ? existingInForm.quantity : 0;
    const totalRequested = existingQty + selectedComponentQty;

    // For editing, consider available stock plus what was already allocated to this order
    const baseAvailable = comp.physicalStock - comp.reservedStock;
    let effectiveAvailable = baseAvailable;
    if (existingOrder) {
      const originalAllocated = existingOrder.items.find((it) => it.componentId === comp.id)?.quantity || 0;
      effectiveAvailable += originalAllocated;
    }

    if (totalRequested > effectiveAvailable) {
      addToast(
        `Disponibilidad insuficiente para "${comp.name}". Disponible: ${effectiveAvailable}, Solicitado total: ${totalRequested}.`,
        'error'
      );
      return;
    }

    if (existingInForm) {
      setItems((prev) =>
        prev.map((it) =>
          it.componentId === comp.id
            ? {
                ...it,
                quantity: it.quantity + selectedComponentQty,
                subtotal: (it.quantity + selectedComponentQty) * it.unitPrice,
              }
            : it
        )
      );
    } else {
      const newItem: OrderItemDetail = {
        componentId: comp.id,
        componentName: comp.name,
        category: comp.category,
        quantity: selectedComponentQty,
        unitPrice: comp.price,
        subtotal: selectedComponentQty * comp.price,
      };
      setItems((prev) => [...prev, newItem]);
    }

    setShowAddComponentModal(false);
    setSelectedComponentId('');
    setSelectedComponentQty(1);
    addToast(`"${comp.name}" agregado al pedido.`, 'success');
  };

  // Update item quantity directly in table
  const handleUpdateItemQuantity = (componentId: string, newQty: number) => {
    const comp = components.find((c) => c.id === componentId);
    if (!comp) return;

    const baseAvailable = comp.physicalStock - comp.reservedStock;
    let effectiveAvailable = baseAvailable;
    if (existingOrder) {
      const originalAllocated = existingOrder.items.find((it) => it.componentId === comp.id)?.quantity || 0;
      effectiveAvailable += originalAllocated;
    }

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
  };

  const handleRemoveItem = (componentId: string) => {
    setItems((prev) => prev.filter((it) => it.componentId !== componentId));
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
              <label
                htmlFor="select-order-client"
                className="block text-xs font-bold text-[#2C1E23] mb-1.5"
              >
                Seleccionar Cliente <span className="text-red-500">*</span>
              </label>
              <select
                id="select-order-client"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#2C1E23] bg-white focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20 font-medium cursor-pointer ${
                  errors.client ? 'border-red-400 bg-red-50/30' : 'border-[#F2D6DE]'
                }`}
              >
                <option value="">-- Buscar o seleccionar cliente --</option>
                {clients.map((cli) => (
                  <option key={cli.id} value={cli.id}>
                    {cli.name} ({cli.phone})
                  </option>
                ))}
              </select>
              {errors.client && <p className="text-red-600 text-xs mt-1">{errors.client}</p>}
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
              <label
                htmlFor="select-order-channel"
                className="block text-xs font-bold text-[#2C1E23] mb-1.5"
              >
                Canal de Recepción <span className="text-red-500">*</span>
              </label>
              <select
                id="select-order-channel"
                value={channel}
                onChange={(e) => setChannel(e.target.value as OrderChannel)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#F2D6DE] text-sm text-[#2C1E23] bg-white focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20 font-medium cursor-pointer"
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="Instagram">Instagram</option>
                <option value="Llamada">Llamada</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="input-order-date"
                className="block text-xs font-bold text-[#2C1E23] mb-1.5"
              >
                Fecha de Entrega <span className="text-red-500">*</span>
              </label>
              <input
                id="input-order-date"
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#2C1E23] bg-white focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20 font-medium ${
                  errors.deliveryDate ? 'border-red-400 bg-red-50/30' : 'border-[#F2D6DE]'
                }`}
              />
              {errors.deliveryDate && (
                <p className="text-red-600 text-xs mt-1">{errors.deliveryDate}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="input-order-time"
                className="block text-xs font-bold text-[#2C1E23] mb-1.5"
              >
                Hora de Entrega <span className="text-red-500">*</span>
              </label>
              <input
                id="input-order-time"
                type="time"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#2C1E23] bg-white focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20 font-medium ${
                  errors.deliveryTime ? 'border-red-400 bg-red-50/30' : 'border-[#F2D6DE]'
                }`}
              />
              {errors.deliveryTime && (
                <p className="text-red-600 text-xs mt-1">{errors.deliveryTime}</p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="input-order-description"
              className="block text-xs font-bold text-[#2C1E23] mb-1.5"
            >
              Descripción del Arreglo / Pedido <span className="text-red-500">*</span>
            </label>
            <input
              id="input-order-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Arreglo floral de rosas rojas con caja hexagonal y chocolates"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#2C1E23] bg-white focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20 font-medium ${
                errors.description ? 'border-red-400 bg-red-50/30' : 'border-[#F2D6DE]'
              }`}
            />
            {errors.description && (
              <p className="text-red-600 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="input-order-observations"
              className="block text-xs font-bold text-[#2C1E23] mb-1.5"
            >
              Dedicatoria / Observaciones Especiales
            </label>
            <textarea
              id="input-order-observations"
              rows={2}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Texto de tarjeta personalizada, color de listón preferido, instrucciones de entrega..."
              className="w-full px-3.5 py-2 rounded-xl border border-[#F2D6DE] text-sm text-[#2C1E23] bg-white focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20 font-medium resize-none"
            />
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECCIÓN 3 — COMPONENTES */}
        {/* ============================================================ */}
        <div
          id="section-order-components"
          className="bg-white rounded-2xl p-5 sm:p-6 border border-[#F2D6DE]/60 shadow-xs space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#F2D6DE]/40 pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#2C1E23] uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#681B2B] text-white flex items-center justify-center text-xs font-bold">
                  3
                </span>
                Selección de Componentes y Flores
              </h2>
              <p className="text-xs text-[#7D6871] mt-0.5">
                Personalice el arreglo agregando insumos. El stock se validará en tiempo real.
              </p>
            </div>

            <button
              id="btn-open-add-component-modal"
              type="button"
              onClick={() => setShowAddComponentModal(true)}
              className="px-4 py-2 rounded-xl bg-[#681B2B] hover:bg-[#541421] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Agregar Componente
            </button>
          </div>

          {errors.items && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {errors.items}
            </div>
          )}

          {/* Components Items Table */}
          <div className="overflow-x-auto border border-[#F2D6DE]/60 rounded-xl">
            <table id="table-order-items" className="w-full text-left text-xs">
              <thead className="bg-[#FBECEF]/40 text-[#8C7A82] uppercase text-[10px] tracking-wider border-b border-[#F2D6DE]/60">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Componente</th>
                  <th className="py-2.5 px-3 font-semibold">Categoría</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Stock Actual</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Precio Unit.</th>
                  <th className="py-2.5 px-3 font-semibold text-center w-28">Cantidad</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Subtotal</th>
                  <th className="py-2.5 px-3 font-semibold text-center w-12">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2D6DE]/30">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#7D6871]">
                      <Layers className="w-6 h-6 mx-auto mb-1 text-[#F2D6DE]" />
                      <p className="font-semibold text-sm text-[#2C1E23]">
                        No hay componentes agregados
                      </p>
                      <p className="text-xs text-[#7D6871]">
                        Haga clic en "+ Agregar Componente" para incluir rosas, empaques, chocolates,
                        etc.
                      </p>
                    </td>
                  </tr>
                ) : (
                  items.map((it) => {
                    const comp = components.find((c) => c.id === it.componentId);
                    const baseAvailable = comp ? comp.physicalStock - comp.reservedStock : 0;
                    let effectiveAvailable = baseAvailable;
                    if (existingOrder) {
                      const originalAllocated =
                        existingOrder.items.find((x) => x.componentId === it.componentId)?.quantity || 0;
                      effectiveAvailable += originalAllocated;
                    }

                    return (
                      <tr
                        key={it.componentId}
                        id={`item-row-${it.componentId}`}
                        className="hover:bg-[#FBECEF]/30 transition-colors"
                      >
                        <td className="py-2.5 px-3 font-semibold text-[#2C1E23]">
                          <div>{it.componentName}</div>
                          <div className="text-[10px] text-[#7D6871] font-normal">
                            Físico: {comp?.physicalStock ?? 0} | Reservado: {comp?.reservedStock ?? 0}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-[#7D6871]">
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-medium">
                            {it.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              effectiveAvailable <= 0
                                ? 'bg-red-100 text-red-800'
                                : effectiveAvailable < 10
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-[#ECFDF5] text-[#047857]'
                            }`}
                          >
                            {effectiveAvailable} {comp?.unit || 'unids.'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-[#2C1E23]">
                          Q {it.unitPrice.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center w-28">
                          <div className="w-20 mx-auto">
                            <QuantityInput
                              id={`input-item-qty-${it.componentId}`}
                              value={it.quantity}
                              max={effectiveAvailable}
                              unit={comp?.unit}
                              onChange={(newQty) =>
                                handleUpdateItemQuantity(it.componentId, newQty)
                              }
                              size="sm"
                              align="center"
                            />
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#681B2B]">
                          Q {it.subtotal.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(it.componentId)}
                            className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Eliminar componente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

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
                      errors.advancePayment ? 'border-red-400 bg-red-50' : 'border-[#F2D6DE]'
                    }`}
                  />
                </div>
                {errors.advancePayment ? (
                  <p className="text-red-600 text-[10px] mt-1">{errors.advancePayment}</p>
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
      {showClientModal && (
        <div
          id="modal-quick-client"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto"
        >
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#F2D6DE] relative animate-in fade-in max-h-[90dvh] flex flex-col my-auto overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 p-4 sm:p-6 pb-3 sm:pb-4 border-b border-[#F2D6DE]/60 shrink-0">
              <div className="min-w-0 flex-1 pr-2">
                <h3 className="text-base sm:text-lg font-bold text-[#681B2B] leading-snug break-words">
                  Registrar Nuevo Cliente
                </h3>
                <p className="text-xs text-[#7D6871] mt-0.5 leading-relaxed break-words">
                  Agregue al cliente para asociarlo de inmediato a este pedido.
                </p>
              </div>
              <button
                onClick={() => setShowClientModal(false)}
                className="text-[#7D6871] hover:text-[#2C1E23] p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center -mr-1 -mt-1"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClientQuick} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#2C1E23] mb-1">
                    Nombre Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-quick-client-name"
                    type="text"
                    required
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Ej. Andrea López"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2C1E23] mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    id="input-quick-client-phone"
                    type="text"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="Ej. 5512-3456"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2C1E23] mb-1">
                    Observaciones / Preferencias
                  </label>
                  <textarea
                    id="input-quick-client-notes"
                    rows={3}
                    value={newClientNotes}
                    onChange={(e) => setNewClientNotes(e.target.value)}
                    placeholder="Tonos favoritos, tipo de flores preferidas..."
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20 outline-none resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-3.5 sm:p-4 sm:px-6 border-t border-[#F2D6DE]/60 bg-gray-50/50 sm:bg-white flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowClientModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-medium text-[#7D6871] hover:bg-gray-100 rounded-xl cursor-pointer min-h-[42px] sm:min-h-[36px] flex items-center justify-center"
                >
                  Cancelar
                </button>
                <button
                  id="btn-save-quick-client"
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 sm:py-2 text-xs sm:text-sm font-bold bg-[#681B2B] hover:bg-[#541421] text-white rounded-xl shadow-xs cursor-pointer min-h-[42px] sm:min-h-[36px] flex items-center justify-center"
                >
                  Guardar y Seleccionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: + AGREGAR COMPONENTE AL PEDIDO */}
      {/* ============================================================ */}
      {showAddComponentModal && (
        <div
          id="modal-add-component-item"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#F2D6DE] relative animate-in fade-in max-h-[90dvh] flex flex-col my-auto overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 p-4 sm:p-6 pb-3 sm:pb-4 border-b border-[#F2D6DE]/60 shrink-0">
              <div className="min-w-0 flex-1 pr-2">
                <h3 className="text-base sm:text-lg font-bold text-[#2C1E23] leading-snug break-words">
                  Agregar Componente al Arreglo
                </h3>
                <p className="text-xs text-[#7D6871] mt-0.5 leading-relaxed break-words">
                  Seleccione el insumo del catálogo y la cantidad a descontar de inventario.
                </p>
              </div>
              <button
                onClick={() => setShowAddComponentModal(false)}
                className="text-[#7D6871] hover:text-[#2C1E23] p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center -mr-1 -mt-1"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#2C1E23] mb-1.5">
                    Componente / Flor / Empaque
                  </label>
                  <select
                    id="select-add-component"
                    value={selectedComponentId}
                    onChange={(e) => setSelectedComponentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20 bg-white font-medium outline-none cursor-pointer"
                  >
                    <option value="">-- Seleccionar del catálogo --</option>
                    {components
                      .filter((c) => c.active)
                      .map((comp) => {
                        const avail = comp.physicalStock - comp.reservedStock;
                        return (
                          <option
                            key={comp.id}
                            value={comp.id}
                            disabled={avail <= 0}
                          >
                            {comp.name} [{comp.category}] — Q{comp.price.toFixed(2)} (Disponible: {avail} {comp.unit})
                          </option>
                        );
                      })}
                  </select>
                </div>

                {selectedComponentId && (
                  (() => {
                    const comp = components.find((c) => c.id === selectedComponentId);
                    if (!comp) return null;
                    const avail = comp.physicalStock - comp.reservedStock;

                    return (
                      <div className="p-3.5 rounded-xl bg-[#FBECEF]/30 border border-[#F2D6DE] text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#681B2B]">{comp.name}</span>
                          <span className="font-bold text-[#059669]">Q {comp.price.toFixed(2)} / {comp.unit}</span>
                        </div>
                        {comp.description && <p className="text-[#7D6871] text-[11px]">{comp.description}</p>}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#F2D6DE]/50 text-center text-[11px]">
                          <div className="p-1.5 rounded-lg bg-white border border-gray-100">
                            <span className="text-[#7D6871] block text-[10px]">Físico</span>
                            <span className="font-bold text-[#2C1E23]">{comp.physicalStock}</span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-white border border-gray-100">
                            <span className="text-[#7D6871] block text-[10px]">Reservado</span>
                            <span className="font-bold text-amber-700">{comp.reservedStock}</span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0]">
                            <span className="text-[#047857] block text-[10px]">Disponible</span>
                            <span className="font-bold text-[#047857]">{avail}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}

                <div>
                  <label
                    htmlFor="input-add-component-qty"
                    className="block text-xs font-bold text-[#2C1E23] mb-1.5"
                  >
                    Cantidad a Incluir{' '}
                    {selectedComponentId && (
                      <span className="text-[#7D6871] font-normal">
                        ({components.find((c) => c.id === selectedComponentId)?.unit || 'unidades'})
                      </span>
                    )}
                  </label>
                  <QuantityInput
                    id="input-add-component-qty"
                    value={selectedComponentQty}
                    max={
                      selectedComponentId
                        ? Math.max(
                            0,
                            (components.find((c) => c.id === selectedComponentId)?.physicalStock || 0) -
                              (components.find((c) => c.id === selectedComponentId)?.reservedStock || 0)
                          )
                        : undefined
                    }
                    unit={components.find((c) => c.id === selectedComponentId)?.unit}
                    onChange={(newQty) => setSelectedComponentQty(newQty)}
                    size="lg"
                    align="center"
                    showErrorText
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-3.5 sm:p-4 sm:px-6 border-t border-[#F2D6DE]/60 bg-gray-50/50 sm:bg-white flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddComponentModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-medium text-[#7D6871] hover:bg-gray-100 rounded-xl cursor-pointer min-h-[42px] sm:min-h-[36px] flex items-center justify-center"
                >
                  Cancelar
                </button>
                <button
                  id="btn-confirm-add-component"
                  type="button"
                  onClick={handleAddComponentItem}
                  disabled={!selectedComponentId}
                  className="w-full sm:w-auto px-5 py-2.5 sm:py-2 text-xs sm:text-sm font-bold bg-[#681B2B] hover:bg-[#541421] text-white rounded-xl shadow-xs disabled:opacity-50 cursor-pointer min-h-[42px] sm:min-h-[36px] flex items-center justify-center"
                >
                  Agregar Línea
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

  );
};
