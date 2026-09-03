import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ArrowLeft,
  Phone,
  Calendar,
  ShoppingBag,
  Edit2,
  Plus,
  Heart,
  ChevronRight,
  Receipt,
  Clock,
  AlertCircle,
  X,
} from 'lucide-react';
import {
  StatusBadge,
  MoneyFormatter,
  DateFormatter,
  EmptyState,
  Modal,
  FormField,
  TextArea,
} from '../common';
import { Client } from '../../types';

interface ClientDetailViewProps {
  clientId: string;
}

export const ClientDetailView: React.FC<ClientDetailViewProps> = ({ clientId }) => {
  const {
    clients,
    orders,
    goBack,
    updateClient,
    navigateToOrderDetail,
    navigateToOrderNew,
    addToast,
  } = useApp();

  const client = clients.find((c) => c.id === clientId);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [formName, setFormName] = useState(client?.name || '');
  const [formPhone, setFormPhone] = useState(client?.phone || '');
  const [formNotes, setFormNotes] = useState(client?.notes || '');

  // Filter orders for this specific client
  const clientOrders = useMemo(() => {
    if (!client) return [];
    return orders
      .filter((o) => o.clientId === client.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, client]);

  // Client metrics
  const totalSpent = useMemo(() => {
    return clientOrders
      .filter((o) => o.status !== 'Cancelado')
      .reduce((sum, o) => sum + o.total, 0);
  }, [clientOrders]);

  const pendingBalance = useMemo(() => {
    return clientOrders
      .filter((o) => o.status !== 'Cancelado' && o.status !== 'Entregado')
      .reduce((sum, o) => sum + (o.balance || 0), 0);
  }, [clientOrders]);

  // Initials for avatar
  const clientInitials = useMemo(() => {
    if (!client?.name) return 'CL';
    const parts = client.name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return client.name.substring(0, 2).toUpperCase();
  }, [client]);

  const handleOpenEdit = () => {
    if (!client) return;
    setFormName(client.name);
    setFormPhone(client.phone);
    setFormNotes(client.notes || '');
    setShowEditModal(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    if (!formName.trim()) {
      addToast('El nombre del cliente es obligatorio.', 'error');
      return;
    }

    updateClient(client.id, {
      name: formName.trim(),
      phone: formPhone.trim() || 'No registrado',
      notes: formNotes.trim(),
    });
    addToast('Datos del cliente actualizados exitosamente.', 'success');
    setShowEditModal(false);
  };

  if (!client) {
    return (
      <div id="client-not-found" className="py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#FBECEF] text-[#681B2B] flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#2C1E23]">Cliente no encontrado</h2>
        <p className="text-sm text-[#7D6871] max-w-md mx-auto">
          El cliente solicitado no existe o fue retirado del sistema.
        </p>
        <button
          onClick={() => goBack('clients')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#681B2B] text-white text-sm font-bold hover:bg-[#541421] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Directorio de Clientes
        </button>
      </div>
    );
  }

  return (
    <div id="client-detail-container" className="space-y-6 pb-16">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-to-clients"
            type="button"
            onClick={() => goBack('clients')}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white border border-[#F2D6DE] text-[#681B2B] hover:bg-[#FBECEF]/40 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
            title="Volver a lista de clientes"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Volver a Clientes</span>
          </button>

          <div>
            <div className="flex items-center gap-2 text-xs text-[#7D6871]">
              <span>Clientes</span>
              <span>/</span>
              <span className="font-medium text-[#2C1E23]">Ficha de Cliente</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#2C1E23] tracking-tight">
              {client.name}
            </h1>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            id="btn-edit-client-detail"
            type="button"
            onClick={handleOpenEdit}
            className="px-3.5 py-2 rounded-xl border border-[#F2D6DE] bg-white hover:bg-[#FBECEF]/40 text-[#2C1E23] font-semibold text-xs sm:text-sm shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-[#681B2B]" />
            <span>Editar</span>
          </button>

          <button
            id="btn-create-order-for-client"
            type="button"
            onClick={() => navigateToOrderNew('client-detail', { initialClientId: client.id })}
            className="px-4 py-2 rounded-xl bg-[#681B2B] hover:bg-[#541421] text-white font-bold text-xs sm:text-sm shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Pedido</span>
          </button>
        </div>
      </div>

      {/* Client Overview Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#F2D6DE]/60 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#F2D6DE]/40">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#681B2B] text-white flex items-center justify-center font-extrabold text-xl sm:text-2xl shadow-xs shrink-0 tracking-wider">
              {clientInitials}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-[#2C1E23]">{client.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FBECEF] text-[#681B2B]">
                  Cliente Frecuente
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs sm:text-sm text-[#7D6871]">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-[#059669]" />
                  <span className="font-semibold text-[#2C1E23]">{client.phone}</span>
                </div>

                {client.createdAt && (
                  <div className="flex items-center gap-1.5 text-xs text-[#7D6871]">
                    <Calendar className="w-3.5 h-3.5 text-[#681B2B]" />
                    <span>Registrado desde {client.createdAt.split('T')[0]}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 shrink-0">
            <div className="p-3 sm:px-4 rounded-xl bg-[#FBECEF]/30 border border-[#F2D6DE]/60 text-center">
              <span className="text-[10px] sm:text-xs font-bold text-[#7D6871] uppercase tracking-wider block">
                Pedidos
              </span>
              <span className="text-base sm:text-xl font-extrabold text-[#681B2B] mt-0.5 block">
                {clientOrders.length}
              </span>
            </div>

            <div className="p-3 sm:px-4 rounded-xl bg-[#FBECEF]/30 border border-[#F2D6DE]/60 text-center">
              <span className="text-[10px] sm:text-xs font-bold text-[#7D6871] uppercase tracking-wider block">
                Total Invertido
              </span>
              <span className="text-base sm:text-xl font-extrabold text-[#2C1E23] mt-0.5 block">
                <MoneyFormatter amount={totalSpent} />
              </span>
            </div>

            <div className="p-3 sm:px-4 rounded-xl bg-[#FBECEF]/30 border border-[#F2D6DE]/60 text-center">
              <span className="text-[10px] sm:text-xs font-bold text-[#7D6871] uppercase tracking-wider block">
                Saldo Activo
              </span>
              <span
                className={`text-base sm:text-xl font-extrabold mt-0.5 block ${
                  pendingBalance > 0 ? 'text-amber-700' : 'text-[#059669]'
                }`}
              >
                <MoneyFormatter amount={pendingBalance} />
              </span>
            </div>
          </div>
        </div>

        {/* Preferences / Floral Taste Callout */}
        <div className="mt-5">
          <div className="p-4 rounded-xl bg-[#FBECEF]/25 border border-[#F2D6DE]/70">
            <div className="flex items-center gap-2 mb-1.5">
              <Heart className="w-4 h-4 text-[#681B2B] fill-[#681B2B]/20" />
              <h3 className="text-xs font-bold text-[#681B2B] uppercase tracking-wider">
                Preferencias y Gustos Florales
              </h3>
            </div>
            {client.notes ? (
              <p className="text-xs sm:text-sm text-[#2C1E23] leading-relaxed font-normal italic pl-6 border-l-2 border-[#681B2B]/40 my-1">
                "{client.notes}"
              </p>
            ) : (
              <p className="text-xs text-[#7D6871] italic pl-6">
                No se han registrado preferencias específicas para este cliente aún. Puede agregarlas
                haciendo clic en "Editar".
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Order History Section */}
      <div
        id="section-client-order-history"
        className="bg-white rounded-2xl p-5 sm:p-6 border border-[#F2D6DE]/60 shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#F2D6DE]/40 pb-3">
          <div>
            <h2 className="text-base font-bold text-[#2C1E23] flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#681B2B]" />
              Historial de Pedidos del Cliente
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FBECEF] text-[#681B2B]">
                {clientOrders.length}
              </span>
            </h2>
            <p className="text-xs text-[#7D6871] mt-0.5">
              Listado completo de pedidos solicitados por {client.name}.
            </p>
          </div>
        </div>

        {clientOrders.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Este cliente aún no tiene pedidos registrados"
            description="Cree el primer pedido para este cliente para comenzar a registrar su historial."
            action={{
              label: 'Crear Primer Pedido',
              onClick: () => navigateToOrderNew('client-detail', { initialClientId: client.id }),
              icon: Plus,
            }}
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto border border-[#F2D6DE]/60 rounded-xl">
              <table id="table-client-orders" className="w-full text-left text-xs">
                <thead className="bg-[#FBECEF]/40 text-[#8C7A82] uppercase text-[10px] tracking-wider border-b border-[#F2D6DE]/60">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Código</th>
                    <th className="py-3 px-4 font-semibold">Fecha de Entrega</th>
                    <th className="py-3 px-4 font-semibold">Descripción del Pedido</th>
                    <th className="py-3 px-4 font-semibold text-right">Total</th>
                    <th className="py-3 px-4 font-semibold text-center">Estado</th>
                    <th className="py-3 px-4 font-semibold text-center w-28">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2D6DE]/30">
                  {clientOrders.map((order) => (
                    <tr
                      key={order.id}
                      id={`client-order-row-${order.id}`}
                      className="hover:bg-[#FBECEF]/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-bold text-[#681B2B]">
                        {order.code}
                      </td>
                      <td className="py-3 px-4 text-[#2C1E23]">
                        <DateFormatter
                          date={order.deliveryDate}
                          time={order.deliveryTime}
                          showIcon={true}
                          format="short"
                        />
                      </td>
                      <td className="py-3 px-4 text-[#2C1E23] max-w-xs truncate">
                        <span title={order.description}>{order.description}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#2C1E23]">
                        <MoneyFormatter amount={order.total} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={order.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          id={`btn-view-order-${order.id}`}
                          type="button"
                          onClick={() => navigateToOrderDetail(order.id, 'client-detail')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#681B2B] hover:bg-[#541421] text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                          title="Ver detalle del pedido"
                        >
                          <span>Ver pedido</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {clientOrders.map((order) => (
                <div
                  key={order.id}
                  id={`client-order-card-${order.id}`}
                  className="p-4 rounded-xl border border-[#F2D6DE]/60 bg-white shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-[#681B2B]">{order.code}</span>
                    <StatusBadge status={order.status} size="sm" />
                  </div>

                  <p className="text-xs text-[#2C1E23] line-clamp-2">{order.description}</p>

                  <div className="flex items-center justify-between text-xs text-[#7D6871] pt-2 border-t border-[#F2D6DE]/40">
                    <DateFormatter
                      date={order.deliveryDate}
                      time={order.deliveryTime}
                      showIcon={true}
                      format="short"
                    />
                    <div className="text-right">
                      <span className="text-[10px] text-[#7D6871] block">Total</span>
                      <strong className="text-sm font-bold text-[#2C1E23]">
                        <MoneyFormatter amount={order.total} />
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigateToOrderDetail(order.id, 'client-detail')}
                    className="w-full py-2 px-3 rounded-lg bg-[#681B2B] hover:bg-[#541421] text-white font-bold text-xs flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer"
                  >
                    <span>Ver pedido</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Edit Client Modal */}
      <Modal
        id="modal-edit-client-detail"
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Datos del Cliente"
        subtitle="Actualice la información de contacto y gustos florales."
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-medium text-[#7D6871] hover:bg-gray-100 rounded-xl cursor-pointer min-h-[42px] sm:min-h-[36px] flex items-center justify-center"
            >
              Cancelar
            </button>
            <button
              id="btn-confirm-save-client"
              form="form-edit-client-detail"
              type="submit"
              className="w-full sm:w-auto px-5 py-2 text-xs sm:text-sm font-bold bg-[#681B2B] hover:bg-[#541421] text-white rounded-xl shadow-xs cursor-pointer min-h-[42px] sm:min-h-[36px] flex items-center justify-center"
            >
              Guardar Cambios
            </button>
          </>
        }
      >
        <form id="form-edit-client-detail" onSubmit={handleSaveEdit} className="space-y-3.5">
          <FormField
            id="input-edit-client-name"
            label="Nombre Completo"
            required
          >
            <input
              id="input-edit-client-name"
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ej. Sofía Morales"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20 outline-none"
            />
          </FormField>

          <FormField
            id="input-edit-client-phone"
            label="Teléfono / WhatsApp"
            optional
          >
            <input
              id="input-edit-client-phone"
              type="text"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              placeholder="Ej. 5555-1234"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20 outline-none"
            />
          </FormField>

          <TextArea
            id="input-edit-client-notes"
            label="Preferencias / Notas Florales"
            rows={4}
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
            maxLength={250}
            showCounter={true}
            placeholder="Ej. Prefiere rosas inglesas en tonos pastel, evitar follaje artificial..."
          />
        </form>
      </Modal>
    </div>
  );
};
