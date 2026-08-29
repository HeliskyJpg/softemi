import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Phone,
  ShoppingBag,
  Eye,
  Heart,
  X,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { Client } from '../../types';

export const ClientsView: React.FC = () => {
  const {
    clients,
    orders,
    addClient,
    updateClient,
    navigateToClientDetail,
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

  // Overall Statistics for visual hierarchy
  const totalClients = clients.length;
  const clientsWithOrders = useMemo(() => {
    return clients.filter((c) => orders.some((o) => o.clientId === c.id)).length;
  }, [clients, orders]);
  const totalOrdersCount = orders.length;

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
      addToast('Cliente actualizado correctamente.', 'success');
    } else {
      addClient({
        name: formName.trim(),
        phone: formPhone.trim() || 'No registrado',
        notes: formNotes.trim(),
      });
      addToast('Cliente registrado correctamente.', 'success');
    }
    setShowModal(false);
  };

  return (
    <div id="clients-view-container" className="space-y-6 pb-16">
      {/* Header with Clear Visual Hierarchy & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#681B2B] text-white flex items-center justify-center shadow-xs">
              <Users className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#2C1E23] tracking-tight">
              Directorio de Clientes
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#7D6871] mt-1">
            Gestione información de contacto, notas y acceda a la ficha detallada de cada cliente.
          </p>
        </div>

        {/* Primary Action Button */}
        <button
          id="btn-new-client"
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#681B2B] hover:bg-[#541421] text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Summary Metrics Banner */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-[#F2D6DE]/60 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FBECEF] text-[#681B2B] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs font-semibold text-[#7D6871] uppercase tracking-wider block truncate">
              Total Clientes
            </span>
            <span className="text-base sm:text-xl font-extrabold text-[#2C1E23]">
              {totalClients}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-[#F2D6DE]/60 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs font-semibold text-[#7D6871] uppercase tracking-wider block truncate">
              Con Pedidos
            </span>
            <span className="text-base sm:text-xl font-extrabold text-[#059669]">
              {clientsWithOrders}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-[#F2D6DE]/60 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FBECEF] text-[#681B2B] flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs font-semibold text-[#7D6871] uppercase tracking-wider block truncate">
              Pedidos Totales
            </span>
            <span className="text-base sm:text-xl font-extrabold text-[#681B2B]">
              {totalOrdersCount}
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-[#F2D6DE]/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7D6871]">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="input-clients-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, teléfono o preferencias..."
            className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] bg-[#FBECEF]/20 focus:bg-white text-[#2C1E23] placeholder-[#7D6871]/60 focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#7D6871] hover:text-[#2C1E23]"
              title="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="text-xs text-[#7D6871] shrink-0 font-medium px-1">
          Mostrando <strong className="text-[#2C1E23]">{filteredClients.length}</strong> de{' '}
          {clients.length} clientes
        </div>
      </div>

      {/* Clients Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-[#F2D6DE]/60">
            <Users className="w-8 h-8 text-[#F2D6DE] mx-auto mb-2" />
            <p className="font-semibold text-sm text-[#2C1E23]">No se encontraron clientes</p>
            <p className="text-xs text-[#7D6871] mt-0.5">
              {searchTerm
                ? 'Intente con otros términos de búsqueda.'
                : 'Comience registrando su primer cliente con el botón "+ Nuevo Cliente".'}
            </p>
          </div>
        ) : (
          filteredClients.map((client) => {
            const clientTotalOrders = orders.filter((o) => o.clientId === client.id).length;
            const initials = client.name
              .trim()
              .split(' ')
              .slice(0, 2)
              .map((part) => part[0])
              .join('')
              .toUpperCase();

            return (
              <div
                key={client.id}
                id={`client-card-${client.id}`}
                className="bg-white rounded-2xl p-5 border border-[#F2D6DE]/60 shadow-xs hover:border-[#F2D6DE] hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  {/* Top Row: Name, Initials Avatar & Order Count Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-[#FBECEF] text-[#681B2B] font-bold text-sm flex items-center justify-center shrink-0 border border-[#F2D6DE]/40">
                        {initials || 'CL'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm sm:text-base text-[#2C1E23] truncate leading-snug">
                          {client.name}
                        </h3>
                        {/* Teléfono */}
                        <div className="flex items-center gap-1.5 text-xs text-[#7D6871] mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                          <span className="font-medium text-[#2C1E23] truncate">
                            {client.phone}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Cantidad de Pedidos Badge */}
                    <span
                      id={`client-orders-badge-${client.id}`}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 flex items-center gap-1 ${
                        clientTotalOrders > 0
                          ? 'bg-[#FBECEF] text-[#681B2B]'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                      title={`${clientTotalOrders} pedidos en total`}
                    >
                      <ShoppingBag className="w-3 h-3" />
                      <span>{clientTotalOrders}</span>
                    </span>
                  </div>

                  {/* Preferencias breves */}
                  <div className="min-h-[44px]">
                    {client.notes ? (
                      <div className="p-2.5 rounded-xl bg-[#FBECEF]/25 border border-[#F2D6DE]/60 text-xs">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-[#681B2B] uppercase tracking-wider mb-0.5">
                          <Heart className="w-3 h-3" />
                          <span>Preferencias:</span>
                        </div>
                        <p className="text-[11px] text-[#2C1E23] line-clamp-2 leading-relaxed italic">
                          "{client.notes}"
                        </p>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-gray-50/70 border border-gray-100 text-xs text-[#7D6871]/70 italic flex items-center gap-1.5">
                        <span>Sin preferencias registradas.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Clear Actions per Client */}
                <div className="mt-4 pt-3.5 border-t border-[#F2D6DE]/40 grid grid-cols-2 gap-2">
                  {/* Action 1: Ver cliente */}
                  <button
                    id={`btn-view-client-${client.id}`}
                    type="button"
                    onClick={() => navigateToClientDetail(client.id)}
                    className="w-full px-3 py-2 rounded-xl bg-[#681B2B] hover:bg-[#541421] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver cliente</span>
                  </button>

                  {/* Action 2: Editar */}
                  <button
                    id={`btn-edit-client-${client.id}`}
                    type="button"
                    onClick={() => handleOpenEdit(client)}
                    className="w-full px-3 py-2 rounded-xl border border-[#F2D6DE] bg-white hover:bg-[#FBECEF]/40 text-[#2C1E23] font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#681B2B]" />
                    <span>Editar</span>
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
                    Observaciones / Preferencias Florales
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
    </div>
  );
};
