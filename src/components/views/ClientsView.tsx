import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Phone,
  ShoppingBag,
  X,
} from 'lucide-react';
import { Client } from '../../types';

export const ClientsView: React.FC = () => {
  const {
    clients,
    orders,
    addClient,
    updateClient,
    navigateToOrderDetail,
    addToast,
    clientsViewState,
    setClientsViewState,
  } = useApp();

  const { searchTerm } = clientsViewState;

  const setSearchTerm = (term: string) => {
    setClientsViewState((prev) => ({ ...prev, searchTerm: term }));
  };

  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Selected client for order history modal
  const [clientForHistory, setClientForHistory] = useState<Client | null>(null);

  // Filter clients
  const filteredClients = useMemo(() => {
    return clients.filter((cli) => {
      const q = searchTerm.toLowerCase();
      return (
        cli.name.toLowerCase().includes(q) ||
        cli.phone.toLowerCase().includes(q) ||
        (cli.notes && cli.notes.toLowerCase().includes(q))
      );
    });
  }, [clients, searchTerm]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingClient(null);
    setFormName('');
    setFormPhone('');
    setFormNotes('');
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (cli: Client) => {
    setEditingClient(cli);
    setFormName(cli.name);
    setFormPhone(cli.phone);
    setFormNotes(cli.notes || '');
    setShowModal(true);
  };

  // Submit Client
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      addToast('El nombre del cliente es obligatorio.', 'error');
      return;
    }

    if (editingClient) {
      updateClient(editingClient.id, {
        name: formName.trim(),
        phone: formPhone.trim() || 'No registrado',
        notes: formNotes.trim(),
      });
    } else {
      addClient({
        name: formName.trim(),
        phone: formPhone.trim() || 'No registrado',
        notes: formNotes.trim(),
      });
    }
    setShowModal(false);
  };

  // Get orders of a client
  const clientOrders = useMemo(() => {
    if (!clientForHistory) return [];
    return orders.filter((o) => o.clientId === clientForHistory.id);
  }, [orders, clientForHistory]);

  return (
    <div id="clients-view-container" className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2C1E23] tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#681B2B]" />
            Directorio de Clientes
          </h1>
          <p className="text-xs sm:text-sm text-[#7D6871] mt-0.5">
            Registro de contactos frecuentes, preferencias florales e historial de pedidos.
          </p>
        </div>

        <button
          id="btn-new-client"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#681B2B] hover:bg-[#541421] text-white font-bold text-sm shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#F2D6DE]/60 shadow-xs">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7D6871]">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="input-clients-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre de cliente, teléfono o preferencias..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] bg-[#FBECEF]/20 focus:bg-white text-[#2C1E23] placeholder-[#7D6871]/60 focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20"
          />
        </div>
      </div>

      {/* Clients Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-[#F2D6DE]/60">
            <Users className="w-8 h-8 text-[#F2D6DE] mx-auto mb-2" />
            <p className="font-semibold text-sm text-[#2C1E23]">No se encontraron clientes</p>
            <p className="text-xs text-[#7D6871]">Intente con otros términos de búsqueda.</p>
          </div>
        ) : (
          filteredClients.map((client) => {
            const clientTotalOrders = orders.filter((o) => o.clientId === client.id).length;

            return (
              <div
                key={client.id}
                id={`client-card-${client.id}`}
                className="bg-white rounded-2xl p-5 border border-[#F2D6DE]/60 shadow-xs hover:border-[#F2D6DE] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-[#2C1E23]">{client.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-[#7D6871] mt-1">
                        <Phone className="w-3.5 h-3.5 text-[#059669]" />
                        <span>{client.phone}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenEdit(client)}
                      className="p-1.5 rounded-lg border border-[#F2D6DE] bg-[#FBECEF]/40 text-[#681B2B] hover:bg-[#681B2B] hover:text-white transition-colors cursor-pointer"
                      title="Editar cliente"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {client.notes ? (
                    <div className="mt-3 p-2.5 rounded-xl bg-[#FBECEF]/30 border border-[#F2D6DE]/60 text-xs text-[#2C1E23]">
                      <span className="text-[10px] font-bold text-[#681B2B] uppercase block">
                        Preferencias:
                      </span>
                      <p className="text-[11px] text-[#7D6871] mt-0.5 italic">"{client.notes}"</p>
                    </div>
                  ) : (
                    <p className="mt-3 text-[11px] text-[#7D6871] italic">
                      Sin observaciones adicionales registradas.
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#F2D6DE]/40 flex items-center justify-between">
                  <span className="text-xs text-[#7D6871]">
                    Pedidos:{' '}
                    <strong className="text-[#681B2B] font-extrabold">{clientTotalOrders}</strong>
                  </span>

                  <button
                    id={`btn-view-client-history-${client.id}`}
                    onClick={() => setClientForHistory(client)}
                    className="text-xs font-semibold text-[#681B2B] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Ver historial
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL: CREAR / EDITAR CLIENTE */}
      {/* ============================================================ */}
      {showModal && (
        <div
          id="modal-client-form"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto"
        >
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#F2D6DE] relative animate-in fade-in max-h-[90dvh] flex flex-col my-auto overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 p-4 sm:p-6 pb-3 sm:pb-4 border-b border-[#F2D6DE]/60 shrink-0">
              <div className="min-w-0 flex-1 pr-2">
                <h3 className="text-base sm:text-lg font-bold text-[#2C1E23] leading-snug break-words">
                  {editingClient ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
                </h3>
                <p className="text-xs text-[#7D6871] mt-0.5 leading-relaxed break-words">
                  Mantenga la información de contacto y gustos florales del cliente.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#7D6871] hover:text-[#2C1E23] p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center -mr-1 -mt-1"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#2C1E23] mb-1">
                    Nombre Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-client-name"
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej. Sofía Morales"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2C1E23] mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    id="input-client-phone"
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="Ej. 5555-1234"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2C1E23] mb-1">
                    Observaciones / Preferencias
                  </label>
                  <textarea
                    id="input-client-notes"
                    rows={3}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Ej. Prefiere tonos pastel, no le gustan los lirios amarillos..."
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20 outline-none resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-3.5 sm:p-4 sm:px-6 border-t border-[#F2D6DE]/60 bg-gray-50/50 sm:bg-white flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-medium text-[#7D6871] hover:bg-gray-100 rounded-xl cursor-pointer min-h-[42px] sm:min-h-[36px] flex items-center justify-center"
                >
                  Cancelar
                </button>
                <button
                  id="btn-save-client-form"
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 sm:py-2 text-xs sm:text-sm font-bold bg-[#681B2B] hover:bg-[#541421] text-white rounded-xl shadow-xs cursor-pointer min-h-[42px] sm:min-h-[36px] flex items-center justify-center"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: HISTORIAL DE PEDIDOS DEL CLIENTE */}
      {/* ============================================================ */}
      {clientForHistory && (
        <div
          id="modal-client-history"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto"
        >
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-[#F2D6DE] relative animate-in fade-in max-h-[90dvh] flex flex-col my-auto overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 p-4 sm:p-6 pb-3 sm:pb-4 border-b border-[#F2D6DE]/60 shrink-0">
              <div className="min-w-0 flex-1 pr-2">
                <h3 className="text-base sm:text-lg font-bold text-[#2C1E23] leading-snug break-words">
                  Historial de Pedidos de {clientForHistory.name}
                </h3>
                <p className="text-xs text-[#7D6871] mt-0.5 leading-relaxed break-words">
                  Teléfono: {clientForHistory.phone || 'Sin registrar'} &bull; {clientOrders.length} pedido{clientOrders.length === 1 ? '' : 's'} registrado{clientOrders.length === 1 ? '' : 's'}
                </p>
              </div>
              <button
                onClick={() => setClientForHistory(null)}
                className="text-[#7D6871] hover:text-[#2C1E23] p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center -mr-1 -mt-1"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body with internal scroll */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5">
              {clientOrders.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#7D6871]">
                  Este cliente aún no tiene pedidos registrados.
                </div>
              ) : (
                clientOrders.map((o) => (
                  <div
                    key={o.id}
                    className="p-3 sm:p-3.5 rounded-xl bg-[#FBECEF]/30 border border-[#F2D6DE] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#681B2B]">{o.code}</span>
                        <span className="text-[11px] text-[#7D6871]">{o.deliveryDate}</span>
                      </div>
                      <p className="text-[11px] text-[#2C1E23] mt-0.5 break-words">
                        {o.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-[#F2D6DE]/40 shrink-0">
                      <div className="text-left sm:text-right">
                        <span className="font-bold text-[#2C1E23] block text-xs sm:text-sm">Q {o.total.toFixed(2)}</span>
                        <span className="text-[10px] text-[#059669] font-semibold">{o.status}</span>
                      </div>
                      <button
                        onClick={() => {
                          setClientForHistory(null);
                          navigateToOrderDetail(o.id, 'clients');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white border border-[#F2D6DE] text-[#681B2B] font-bold text-xs hover:bg-[#681B2B] hover:text-white transition-colors cursor-pointer min-h-[32px] flex items-center justify-center shrink-0"
                      >
                        Ver Pedido
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 sm:px-6 border-t border-[#F2D6DE]/60 bg-gray-50/50 sm:bg-white flex justify-end shrink-0">
              <button
                onClick={() => setClientForHistory(null)}
                className="w-full sm:w-auto px-5 py-2.5 sm:py-2 text-xs sm:text-sm font-bold bg-[#681B2B] hover:bg-[#541421] text-white rounded-xl shadow-xs cursor-pointer min-h-[42px] sm:min-h-[36px] flex items-center justify-center"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
