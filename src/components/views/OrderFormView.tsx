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
    setActiveView,
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
  const calculatedBalance = Math.max(0, calculatedTotal - (advancePayment || 0));

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
    if (newQty <= 0) return;

    const comp = components.find((c) => c.id === componentId);
    if (!comp) return;

    const baseAvailable = comp.physicalStock - comp.reservedStock;
    let effectiveAvailable = baseAvailable;
    if (existingOrder) {
      const originalAllocated = existingOrder.items.find((it) => it.componentId === comp.id)?.quantity || 0;
      effectiveAvailable += originalAllocated;
    }

    if (newQty > effectiveAvailable) {
      addToast(
        `Stock máximo disponible para "${comp.name}" es de ${effectiveAvailable} ${comp.unit || 'unidades'}.`,
        'warning'
      );
      return;
    }

    setItems((prev) =>
      prev.map((it) =>
        it.componentId === componentId
          ? {
              ...it,
              quantity: newQty,
              subtotal: newQty * it.unitPrice,
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
    }
    if (advancePayment < 0) {
      newErrors.advancePayment = 'El anticipo no puede ser negativo.';
    }
    if (advancePayment > calculatedTotal) {
      newErrors.advancePayment = 'El anticipo no puede exceder el total del pedido.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      addToast('Por favor corrija los campos marcados en el formulario.', 'error', 'Validación');
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const payload = {
      clientId: selectedClientId,
      channel,
      description: description.trim(),
      observations: observations.trim(),
      deliveryDate,
      deliveryTime,
      items,
      advancePayment: Number(advancePayment) || 0,
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
            onClick={() => setActiveView(isEditing ? 'order-detail' : 'orders')}
            className="p-2 rounded-xl bg-white border border-[#FBDAE3] text-[#6D5C64] hover:text-[#8E315E] hover:bg-[#FFF7FA] transition-colors cursor-pointer"
            title="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#3A2D33] tracking-tight">
              {isEditing ? `Editar Pedido ${existingOrder?.code}` : 'Nuevo Pedido Personalizado'}
            </h1>
            <p className="text-xs text-[#6D5C64]">
              {isEditing
                ? 'Modifique datos, componentes o anticipo. El stock se recalculará automáticamente.'
                : 'Complete las 4 secciones para registrar el pedido y validar disponibilidad.'}
            </p>
          </div>
        </div>

        {isEditing && (
          <span className="text-xs font-bold px-3 py-1 bg-[#FBDAE3] text-[#8E315E] rounded-full border border-[#FAB2D7]">
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
          className="bg-white rounded-2xl p-5 sm:p-6 border border-[#FBDAE3] shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-[#3A2D33] uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#8E315E] text-white flex items-center justify-center text-xs">
                1
              </span>
              Identificación del Cliente
            </h2>

            <button
              id="btn-open-quick-client-modal"
              type="button"
              onClick={() => setShowClientModal(true)}
              className="text-xs font-bold text-[#8E315E] hover:text-[#7A294F] bg-[#FFF7FA] hover:bg-[#FBDAE3]/50 px-3 py-1.5 rounded-xl border border-[#FBDAE3] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              + Nuevo Cliente
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="select-order-client"
                className="block text-xs font-bold text-[#3A2D33] mb-1.5"
              >
                Seleccionar Cliente <span className="text-red-500">*</span>
              </label>
              <select
                id="select-order-client"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#3A2D33] bg-white focus:outline-none focus:ring-2 focus:ring-[#8E315E]/30 font-medium ${
                  errors.client ? 'border-red-400 bg-red-50/30' : 'border-[#FBDAE3]'
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
                className="p-3.5 rounded-xl bg-[#FFF7FA] border border-[#FBDAE3] flex flex-col justify-between text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#8E315E]">{selectedClient.name}</span>
                  <span className="text-[#6D5C64] font-medium">{selectedClient.phone}</span>
                </div>
                {selectedClient.notes && (
                  <p className="text-[#6D5C64] mt-1 text-[11px] italic">
                    Prefiere: "{selectedClient.notes}"
                  </p>
                )}
                <div className="mt-2 text-[10px] text-[#65733D] font-semibold">
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
          className="bg-white rounded-2xl p-5 sm:p-6 border border-[#FBDAE3] shadow-xs space-y-4"
        >
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-[#3A2D33] uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#8E315E] text-white flex items-center justify-center text-xs">
                2
              </span>
              Datos del Pedido y Entrega
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="select-order-channel"
                className="block text-xs font-bold text-[#3A2D33] mb-1.5"
              >
                Canal de Recepción <span className="text-red-500">*</span>
              </label>
              <select
                id="select-order-channel"
                value={channel}
                onChange={(e) => setChannel(e.target.value as OrderChannel)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#FBDAE3] text-sm text-[#3A2D33] bg-white focus:outline-none focus:ring-2 focus:ring-[#8E315E]/30 font-medium"
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
                className="block text-xs font-bold text-[#3A2D33] mb-1.5"
              >
                Fecha de Entrega <span className="text-red-500">*</span>
              </label>
              <input
                id="input-order-date"
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#3A2D33] bg-white focus:outline-none focus:ring-2 focus:ring-[#8E315E]/30 font-medium ${
                  errors.deliveryDate ? 'border-red-400 bg-red-50/30' : 'border-[#FBDAE3]'
                }`}
              />
              {errors.deliveryDate && (
                <p className="text-red-600 text-xs mt-1">{errors.deliveryDate}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="input-order-time"
                className="block text-xs font-bold text-[#3A2D33] mb-1.5"
              >
                Hora de Entrega <span className="text-red-500">*</span>
              </label>
              <input
                id="input-order-time"
                type="time"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#3A2D33] bg-white focus:outline-none focus:ring-2 focus:ring-[#8E315E]/30 font-medium ${
                  errors.deliveryTime ? 'border-red-400 bg-red-50/30' : 'border-[#FBDAE3]'
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
              className="block text-xs font-bold text-[#3A2D33] mb-1.5"
            >
              Descripción del Arreglo / Pedido <span className="text-red-500">*</span>
            </label>
            <input
              id="input-order-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Arreglo floral de rosas rojas con caja hexagonal y chocolates"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#3A2D33] bg-white focus:outline-none focus:ring-2 focus:ring-[#8E315E]/30 font-medium ${
                errors.description ? 'border-red-400 bg-red-50/30' : 'border-[#FBDAE3]'
              }`}
            />
            {errors.description && (
              <p className="text-red-600 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="input-order-observations"
              className="block text-xs font-bold text-[#3A2D33] mb-1.5"
            >
              Dedicatoria / Observaciones Especiales
            </label>
            <textarea
              id="input-order-observations"
              rows={2}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Texto de tarjeta personalizada, color de listón preferido, instrucciones de entrega..."
              className="w-full px-3.5 py-2 rounded-xl border border-[#FBDAE3] text-sm text-[#3A2D33] bg-white focus:outline-none focus:ring-2 focus:ring-[#8E315E]/30 font-medium resize-none"
            />
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECCIÓN 3 — COMPONENTES */}
        {/* ============================================================ */}
        <div
          id="section-order-components"
          className="bg-white rounded-2xl p-5 sm:p-6 border border-[#FBDAE3] shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#3A2D33] uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#8E315E] text-white flex items-center justify-center text-xs">
                  3
                </span>
                Selección de Componentes y Flores
              </h2>
              <p className="text-xs text-[#6D5C64] mt-0.5">
                Personalice el arreglo agregando insumos. El stock se validará en tiempo real.
              </p>
            </div>

            <button
              id="btn-open-add-component-modal"
              type="button"
              onClick={() => setShowAddComponentModal(true)}
              className="px-4 py-2 rounded-xl bg-[#65733D] hover:bg-[#546032] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + Agregar Componente
            </button>
          </div>

          {errors.items && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[#9B2C2C] text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {errors.items}
            </div>
          )}

          {/* Components Items Table */}
          <div className="overflow-x-auto border border-[#FBDAE3] rounded-xl">
            <table id="table-order-items" className="w-full text-left text-xs">
              <thead className="bg-[#FFF7FA] text-[#6D5C64] uppercase text-[10px] tracking-wider border-b border-[#FBDAE3]">
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
              <tbody className="divide-y divide-gray-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#6D5C64]">
                      <Layers className="w-6 h-6 mx-auto mb-1 text-[#FBDAE3]" />
                      <p className="font-semibold text-sm text-[#3A2D33]">
                        No hay componentes agregados
                      </p>
                      <p className="text-xs text-[#6D5C64]">
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
                        className="hover:bg-[#FFF7FA]/50 transition-colors"
                      >
                        <td className="py-2.5 px-3 font-semibold text-[#3A2D33]">
                          <div>{it.componentName}</div>
                          <div className="text-[10px] text-[#6D5C64] font-normal">
                            Físico: {comp?.physicalStock ?? 0} | Reservado: {comp?.reservedStock ?? 0}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-[#6D5C64]">
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
                                : 'bg-[#EBF1DE] text-[#4F5B2F]'
                            }`}
                          >
                            {effectiveAvailable} {comp?.unit || 'unids.'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-[#3A2D33]">
                          Q {it.unitPrice.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min={1}
                            max={effectiveAvailable}
                            value={it.quantity}
                            onChange={(e) =>
                              handleUpdateItemQuantity(
                                it.componentId,
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-16 px-2 py-1 rounded-lg border border-[#FBDAE3] text-center font-bold text-xs focus:ring-1 focus:ring-[#8E315E]"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#8E315E]">
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
          className="bg-white rounded-2xl p-5 sm:p-6 border border-[#FBDAE3] shadow-xs space-y-4"
        >
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-[#3A2D33] uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#8E315E] text-white flex items-center justify-center text-xs">
                4
              </span>
              Resumen de Precios y Anticipo
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Subtotal */}
            <div className="p-4 rounded-xl bg-[#FFF7FA] border border-[#FBDAE3]">
              <span className="text-[11px] font-semibold text-[#6D5C64] uppercase">
                Subtotal
              </span>
              <div className="text-xl font-bold text-[#3A2D33] mt-1">
                Q {calculatedSubtotal.toFixed(2)}
              </div>
              <p className="text-[10px] text-[#6D5C64] mt-0.5">Suma de componentes</p>
            </div>

            {/* Total */}
            <div className="p-4 rounded-xl bg-[#FBDAE3]/30 border border-[#FAB2D7]">
              <span className="text-[11px] font-semibold text-[#8E315E] uppercase">
                Total del Pedido
              </span>
              <div className="text-2xl font-extrabold text-[#8E315E] mt-1">
                Q {calculatedTotal.toFixed(2)}
              </div>
              <p className="text-[10px] text-[#6D5C64] mt-0.5">Monto total a cobrar</p>
            </div>

            {/* Anticipo Input */}
            <div className="p-4 rounded-xl bg-white border border-[#FBDAE3]">
              <label
                htmlFor="input-order-advance"
                className="block text-[11px] font-bold text-[#65733D] uppercase mb-1"
              >
                Anticipo Registrado (Q)
              </label>
              <input
                id="input-order-advance"
                type="number"
                min={0}
                max={calculatedTotal}
                step="any"
                value={advancePayment}
                onChange={(e) => setAdvancePayment(parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-1.5 rounded-lg border text-sm font-bold text-[#3A2D33] focus:outline-none focus:ring-2 focus:ring-[#65733D]/30 ${
                  errors.advancePayment ? 'border-red-400 bg-red-50' : 'border-[#FBDAE3]'
                }`}
              />
              {errors.advancePayment ? (
                <p className="text-red-600 text-[10px] mt-1">{errors.advancePayment}</p>
              ) : (
                <p className="text-[10px] text-[#6D5C64] mt-0.5">Pago inicial recibido</p>
              )}
            </div>

            {/* Saldo Pendiente */}
            <div className="p-4 rounded-xl bg-[#FFF7FA] border border-[#FBDAE3]">
              <span className="text-[11px] font-semibold text-[#6D5C64] uppercase">
                Saldo Pendiente
              </span>
              <div
                className={`text-xl font-bold mt-1 ${
                  calculatedBalance > 0 ? 'text-[#9B2C2C]' : 'text-emerald-700'
                }`}
              >
                Q {calculatedBalance.toFixed(2)}
              </div>
              <p className="text-[10px] text-[#6D5C64] mt-0.5">
                {calculatedBalance === 0 ? 'Pagado completamente' : 'Pendiente al entregar'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              id="btn-order-form-cancel"
              type="button"
              onClick={() => setActiveView(isEditing ? 'order-detail' : 'orders')}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-[#6D5C64] hover:text-[#3A2D33] hover:bg-gray-50 text-sm font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              id="btn-order-form-save"
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-[#8E315E] hover:bg-[#7A294F] text-white text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#FBDAE3] relative animate-in fade-in">
            <button
              onClick={() => setShowClientModal(false)}
              className="absolute top-4 right-4 text-[#6D5C64] hover:text-[#3A2D33] p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-[#8E315E] mb-1">Registrar Nuevo Cliente</h3>
            <p className="text-xs text-[#6D5C64] mb-4">
              Agregue al cliente para asociarlo de inmediato a este pedido.
            </p>

            <form onSubmit={handleCreateClientQuick} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#3A2D33] mb-1">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <input
                  id="input-quick-client-name"
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Ej. Andrea López"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#FBDAE3] focus:ring-2 focus:ring-[#8E315E]/30 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3A2D33] mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  id="input-quick-client-phone"
                  type="text"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  placeholder="Ej. 5512-3456"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#FBDAE3] focus:ring-2 focus:ring-[#8E315E]/30 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3A2D33] mb-1">
                  Observaciones / Preferencias
                </label>
                <textarea
                  id="input-quick-client-notes"
                  rows={2}
                  value={newClientNotes}
                  onChange={(e) => setNewClientNotes(e.target.value)}
                  placeholder="Tonos favoritos, tipo de flores preferidas..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#FBDAE3] focus:ring-2 focus:ring-[#8E315E]/30 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowClientModal(false)}
                  className="px-4 py-2 text-xs font-medium text-[#6D5C64] hover:bg-gray-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  id="btn-save-quick-client"
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#8E315E] hover:bg-[#7A294F] text-white rounded-xl shadow-xs"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#FBDAE3] relative animate-in fade-in">
            <button
              onClick={() => setShowAddComponentModal(false)}
              className="absolute top-4 right-4 text-[#6D5C64] hover:text-[#3A2D33] p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-[#3A2D33] mb-1">
              Agregar Componente al Arreglo
            </h3>
            <p className="text-xs text-[#6D5C64] mb-4">
              Seleccione el insumo del catálogo y la cantidad a descontar de inventario.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#3A2D33] mb-1.5">
                  Componente / Flor / Empaque
                </label>
                <select
                  id="select-add-component"
                  value={selectedComponentId}
                  onChange={(e) => setSelectedComponentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#FBDAE3] focus:ring-2 focus:ring-[#8E315E]/30 bg-white font-medium outline-none"
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
                    <div className="p-3.5 rounded-xl bg-[#FFF7FA] border border-[#FBDAE3] text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#8E315E]">{comp.name}</span>
                        <span className="font-bold text-[#65733D]">Q {comp.price.toFixed(2)} / {comp.unit}</span>
                      </div>
                      {comp.description && <p className="text-[#6D5C64] text-[11px]">{comp.description}</p>}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#FBDAE3]/50 text-center text-[11px]">
                        <div className="p-1.5 rounded-lg bg-white border border-gray-100">
                          <span className="text-[#6D5C64] block text-[10px]">Físico</span>
                          <span className="font-bold text-[#3A2D33]">{comp.physicalStock}</span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-white border border-gray-100">
                          <span className="text-[#6D5C64] block text-[10px]">Reservado</span>
                          <span className="font-bold text-amber-700">{comp.reservedStock}</span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-[#EBF1DE] border border-[#D5E2BA]">
                          <span className="text-[#4F5B2F] block text-[10px]">Disponible</span>
                          <span className="font-bold text-[#4F5B2F]">{avail}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              <div>
                <label className="block text-xs font-bold text-[#3A2D33] mb-1.5">
                  Cantidad a Incluir
                </label>
                <input
                  id="input-add-component-qty"
                  type="number"
                  min={1}
                  max={
                    selectedComponentId
                      ? Math.max(1, (components.find((c) => c.id === selectedComponentId)?.physicalStock || 0) - (components.find((c) => c.id === selectedComponentId)?.reservedStock || 0))
                      : 100
                  }
                  value={selectedComponentQty}
                  onChange={(e) => setSelectedComponentQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#FBDAE3] font-bold text-center focus:ring-2 focus:ring-[#8E315E]/30 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddComponentModal(false)}
                  className="px-4 py-2 text-xs font-medium text-[#6D5C64] hover:bg-gray-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  id="btn-confirm-add-component"
                  type="button"
                  onClick={handleAddComponentItem}
                  disabled={!selectedComponentId}
                  className="px-5 py-2 text-xs font-bold bg-[#65733D] hover:bg-[#546032] text-white rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
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
