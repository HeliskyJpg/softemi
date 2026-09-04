import React, { useState, useMemo, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { Client } from '../../types';
import { SystemAlert } from '../common/SystemAlert';
import {
  FormField,
  FormRow,
  Input,
  TextArea,
  Modal,
  EmptyState,
  Pagination,
} from '../common';

const CLIENTS_PER_PAGE = 9;

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
    hasPermission,
  } = useApp();

  const { searchTerm, currentPage: savedPage } = clientsViewState;
  const currentPage = savedPage || 1;

  const setSearchTerm = (term: string) => {
    setClientsViewState((prev) => ({ ...prev, searchTerm: term, currentPage: 1 }));
  };

  const setCurrentPage = (page: number) => {
    setClientsViewState((prev) => ({ ...prev, currentPage: page }));
  };

  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Filter clients across full dataset
  const filteredClients = useMemo(() => {
    return clients.filter((cli) => {
      const q = searchTerm.toLowerCase().trim();
      if (!q) return true;
      return (
        cli.name.toLowerCase().includes(q) ||
        cli.phone.toLowerCase().includes(q) ||
        (cli.notes && cli.notes.toLowerCase().includes(q))
      );
    });
  }, [clients, searchTerm]);

  // Pagination calculations
  const totalFiltered = filteredClients.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / CLIENTS_PER_PAGE));

  // Ensure current page is valid when filter changes
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * CLIENTS_PER_PAGE;
  const paginatedClients = useMemo(() => {
    return filteredClients.slice(startIndex, startIndex + CLIENTS_PER_PAGE);
  }, [filteredClients, startIndex]);

  const fromItem = totalFiltered === 0 ? 0 : startIndex + 1;
  const toItem = Math.min(startIndex + CLIENTS_PER_PAGE, totalFiltered);

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
    setFormError('');
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (cli: Client) => {
    setEditingClient(cli);
    setFormName(cli.name);
    setFormPhone(cli.phone);
    setFormNotes(cli.notes || '');
    setFormError('');
    setShowModal(true);
  };

  // Submit Client
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('El nombre del cliente es obligatorio.');
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

  // Page Numbers Generator
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, currentPage]);

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
        {hasPermission('clients.edit') && (
          <button
            id="btn-new-client"
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#681B2B] hover:bg-[#541421] text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer self-start sm:self-auto min-h-[42px]"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Cliente</span>
          </button>
        )}
      </div>

      {/* Summary Metrics Banner - Responsive 2+1 on mobile, 3 on desktop without text clipping */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Metric 1: Clientes */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-[#F2D6DE]/60 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FBECEF] text-[#681B2B] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] sm:text-xs font-semibold text-[#7D6871] uppercase tracking-wider block leading-tight">
              Clientes
            </span>
            <span className="text-lg sm:text-2xl font-extrabold text-[#2C1E23] mt-0.5 block">
              {totalClients}
            </span>
          </div>
        </div>

        {/* Metric 2: Clientes con pedidos */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-[#F2D6DE]/60 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] sm:text-xs font-semibold text-[#7D6871] uppercase tracking-wider block leading-tight">
              Clientes con pedidos
            </span>
            <span className="text-lg sm:text-2xl font-extrabold text-[#059669] mt-0.5 block">
              {clientsWithOrders}
            </span>
          </div>
        </div>

        {/* Metric 3: Pedidos registrados (full width on mobile 2+1 layout) */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-[#F2D6DE]/60 shadow-xs flex items-center gap-3 col-span-2 lg:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-[#FBECEF] text-[#681B2B] flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] sm:text-xs font-semibold text-[#7D6871] uppercase tracking-wider block leading-tight">
              Pedidos registrados
            </span>
            <span className="text-lg sm:text-2xl font-extrabold text-[#681B2B] mt-0.5 block">
              {totalOrdersCount}
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar & Results Counter */}
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
            className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] bg-[#FBECEF]/20 focus:bg-white text-[#2C1E23] placeholder-[#7D6871]/60 focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20 min-h-[40px]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#7D6871] hover:text-[#2C1E23] cursor-pointer"
              title="Limpiar búsqueda"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div id="clients-counter-info" className="text-xs text-[#7D6871] shrink-0 font-medium px-1">
          {totalFiltered === 0 ? (
            <span>0 clientes encontrados</span>
          ) : (
            <span>
              Mostrando <strong className="text-[#2C1E23]">{fromItem}–{toItem}</strong> de{' '}
              <strong className="text-[#2C1E23]">{totalFiltered}</strong> clientes
              {totalFiltered !== clients.length ? ` (filtrados de ${clients.length} totales)` : ''}
            </span>
          )}
        </div>
      </div>

      {/* Clients Cards Grid - 1 col Mobile, 2 cols Tablet, 3 cols Desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedClients.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              icon={Users}
              title="No se encontraron clientes"
              description={
                searchTerm
                  ? 'Intente con otros términos de búsqueda o limpie el filtro para ver todos los registros.'
                  : 'Comience registrando su primer cliente con el botón "+ Nuevo Cliente".'
              }
              action={
                searchTerm
                  ? {
                      label: 'Limpiar búsqueda',
                      onClick: () => setSearchTerm(''),
                    }
                  : {
                      label: 'Nuevo Cliente',
                      onClick: handleOpenCreate,
                      icon: Plus,
                    }
              }
            />
          </div>
        ) : (
          paginatedClients.map((client) => {
            const clientTotalOrders = orders.filter((o) => o.clientId === client.id).length;
            const initials = client.name
              .trim()
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0])
              .join('')
              .toUpperCase();

            return (
              <div
                key={client.id}
                id={`client-card-${client.id}`}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-[#F2D6DE]/60 shadow-xs hover:border-[#F2D6DE] hover:shadow-sm transition-all flex flex-col justify-between"
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
                <div className={`mt-4 pt-3.5 border-t border-[#F2D6DE]/40 ${hasPermission('clients.edit') ? 'grid grid-cols-2 gap-2' : 'flex'}`}>
                  {/* Action 1: Ver cliente */}
                  <button
                    id={`btn-view-client-${client.id}`}
                    type="button"
                    onClick={() => navigateToClientDetail(client.id, 'clients')}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#681B2B] hover:bg-[#541421] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer min-h-[38px]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver cliente</span>
                  </button>

                  {/* Action 2: Editar (only if user has clients.edit) */}
                  {hasPermission('clients.edit') && (
                    <button
                      id={`btn-edit-client-${client.id}`}
                      type="button"
                      onClick={() => handleOpenEdit(client)}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#F2D6DE] bg-white hover:bg-[#FBECEF]/40 text-[#2C1E23] font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer min-h-[38px]"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#681B2B]" />
                      <span>Editar</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Standardized Pagination Controls */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalFiltered}
        itemsPerPage={CLIENTS_PER_PAGE}
        onPageChange={(page) => setCurrentPage(page)}
        itemName="clientes"
        className="rounded-2xl border border-[#F2D6DE]/60 shadow-xs"
      />

      {/* ============================================================ */}
      {/* MODAL: CREAR / EDITAR CLIENTE */}
      {/* ============================================================ */}
      <Modal
        id="modal-client-form"
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingClient ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
        subtitle="Mantenga la información de contacto y gustos florales del cliente."
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-medium text-[#7D6871] hover:bg-gray-100 rounded-xl cursor-pointer min-h-[42px] sm:min-h-[36px] flex items-center justify-center"
            >
              Cancelar
            </button>
            <button
              id="btn-save-client-form"
              form="form-client-modal"
              type="submit"
              className="w-full sm:w-auto px-5 py-2 text-xs sm:text-sm font-bold bg-[#681B2B] hover:bg-[#541421] text-white rounded-xl shadow-xs cursor-pointer min-h-[42px] sm:min-h-[36px] flex items-center justify-center"
            >
              Guardar Cliente
            </button>
          </>
        }
      >
        <form id="form-client-modal" onSubmit={handleSubmit} className="space-y-4">
          <FormRow columns={2}>
            <FormField
              id="input-client-name"
              label="Nombre Completo"
              required
              error={formError}
            >
              <Input
                id="input-client-name"
                type="text"
                required
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="Ej. Sofía Morales"
                hasError={!!formError}
              />
            </FormField>

            <FormField
              id="input-client-phone"
              label="Teléfono / WhatsApp"
              optional
            >
              <Input
                id="input-client-phone"
                type="tel"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="Ej. 5555-1234"
              />
            </FormField>
          </FormRow>

          <TextArea
            id="input-client-notes"
            label="Observaciones / Preferencias Florales"
            rows={3}
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
            maxLength={200}
            showCounter={true}
            placeholder="Ej. Prefiere tonos pastel, no le gustan los lirios amarillos..."
          />
        </form>
      </Modal>
    </div>
  );
};
