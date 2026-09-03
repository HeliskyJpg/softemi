import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Filter,
  PlusCircle,
  Eye,
  Edit,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ShoppingBag,
  Clock,
  Phone,
} from 'lucide-react';
import {
  StatusBadge,
  AutocompleteSelect,
  Pagination,
  EmptyState,
  MoneyFormatter,
  DateFormatter,
} from '../common';
import { OrderStatus } from '../../types';

export const OrdersListView: React.FC = () => {
  const {
    orders,
    navigateToOrderNew,
    navigateToOrderDetail,
    navigateToOrderEdit,
    ordersViewState,
    setOrdersViewState,
  } = useApp();

  const {
    searchTerm,
    statusFilter,
    dateFilter,
    sortField,
    sortDirection,
    currentPage,
  } = ordersViewState;

  const setSearchTerm = (term: string) => {
    setOrdersViewState((prev) => ({ ...prev, searchTerm: term }));
  };

  const setStatusFilter = (status: string) => {
    setOrdersViewState((prev) => ({ ...prev, statusFilter: status }));
  };

  const setDateFilter = (date: string) => {
    setOrdersViewState((prev) => ({ ...prev, dateFilter: date }));
  };

  const setSortField = (field: 'deliveryDate' | 'code' | 'total') => {
    setOrdersViewState((prev) => ({ ...prev, sortField: field }));
  };

  const setSortDirection = (updater: 'asc' | 'desc' | ((prev: 'asc' | 'desc') => 'asc' | 'desc')) => {
    setOrdersViewState((prev) => ({
      ...prev,
      sortDirection: typeof updater === 'function' ? updater(prev.sortDirection) : updater,
    }));
  };

  const setCurrentPage = (updater: number | ((prev: number) => number)) => {
    setOrdersViewState((prev) => ({
      ...prev,
      currentPage: typeof updater === 'function' ? updater(prev.currentPage) : updater,
    }));
  };

  const itemsPerPage = 6;

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtering and sorting logic
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Search term
      const matchesSearch =
        order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.description.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === 'Todos' || order.status === statusFilter;

      // Date filter
      let matchesDate = true;
      if (dateFilter === 'hoy') {
        matchesDate = order.deliveryDate === todayStr;
      } else if (dateFilter === 'pendientes') {
        matchesDate = order.status === 'Pendiente' || order.status === 'En preparación';
      } else if (dateFilter === 'atrasados') {
        matchesDate =
          order.deliveryDate < todayStr &&
          (order.status === 'Pendiente' || order.status === 'En preparación');
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, searchTerm, statusFilter, dateFilter, todayStr]);

  // Sorting
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'deliveryDate') {
        const dateA = `${a.deliveryDate}T${a.deliveryTime || '00:00'}`;
        const dateB = `${b.deliveryDate}T${b.deliveryTime || '00:00'}`;
        comparison = dateA.localeCompare(dateB);
      } else if (sortField === 'code') {
        comparison = a.code.localeCompare(b.code);
      } else if (sortField === 'total') {
        comparison = a.total - b.total;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredOrders, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedOrders.length / itemsPerPage));
  const paginatedOrders = sortedOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSort = (field: 'deliveryDate' | 'code' | 'total') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const statusOptions = ['Todos', 'Pendiente', 'En preparación', 'Listo', 'Entregado', 'Cancelado'];

  return (
    <div id="orders-list-view-container" className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2C1E23] tracking-tight">
            Listado General de Pedidos
          </h1>
          <p className="text-xs sm:text-sm text-[#7D6871] mt-0.5 font-medium">
            Registro completo de pedidos personalizados, saldos y seguimiento de entregas.
          </p>
        </div>

        <button
          id="btn-orders-new"
          onClick={() => navigateToOrderNew('orders')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#681B2B] hover:bg-[#541421] text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          Nuevo Pedido
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#F2D6DE]/60 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="relative">
            <label htmlFor="input-orders-search" className="sr-only">Buscar pedido</label>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7D6871]">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="input-orders-search"
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por código, cliente o detalle..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] bg-white text-[#2C1E23] focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20 font-medium"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative">
            <AutocompleteSelect
              id="select-orders-status-filter"
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val || 'Todos');
                setCurrentPage(1);
              }}
              options={statusOptions.map((st) => ({
                value: st,
                label: `Estado: ${st}`,
              }))}
              searchable={false}
              size="sm"
            />
          </div>

          {/* Date Filter Dropdown */}
          <div className="relative">
            <AutocompleteSelect
              id="select-orders-date-filter"
              value={dateFilter}
              onChange={(val) => {
                setDateFilter(val || 'todos');
                setCurrentPage(1);
              }}
              options={[
                { value: 'todos', label: 'Fechas: Todos los pedidos' },
                { value: 'hoy', label: 'Entregas de Hoy' },
                { value: 'pendientes', label: 'Pendientes / En preparación' },
                { value: 'atrasados', label: 'Atrasados (Límite vencido)' },
              ]}
              searchable={false}
              size="sm"
            />
          </div>
        </div>

        {/* Active filters pill list */}
        <div className="flex flex-wrap items-center justify-between text-xs text-[#7D6871] pt-2 border-t border-[#F2D6DE]/40 gap-2">
          <span>
            Mostrando <strong className="text-[#2C1E23]">{sortedOrders.length}</strong> pedidos encontrados
          </span>
          {(searchTerm || statusFilter !== 'Todos' || dateFilter !== 'todos') && (
            <button
              id="btn-clear-orders-filters"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('Todos');
                setDateFilter('todos');
                setCurrentPage(1);
              }}
              className="text-[#681B2B] hover:underline font-semibold cursor-pointer"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Orders Container (Desktop Table + Mobile Cards) */}
      <div className="bg-white rounded-2xl border border-[#F2D6DE]/60 shadow-xs overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table id="table-orders-list" className="w-full text-left text-xs">
            <thead className="bg-[#FBECEF]/40 border-b border-[#F2D6DE]/60 text-[#8C7A82] uppercase tracking-wider text-[11px]">
              <tr>
                <th
                  onClick={() => toggleSort('code')}
                  className="py-3.5 px-4 font-bold cursor-pointer hover:text-[#681B2B] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Código
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-3.5 px-4 font-bold">Cliente</th>
                <th className="py-3.5 px-4 font-bold">Descripción</th>
                <th
                  onClick={() => toggleSort('deliveryDate')}
                  className="py-3.5 px-4 font-bold cursor-pointer hover:text-[#681B2B] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Fecha Entrega
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('total')}
                  className="py-3.5 px-4 font-bold cursor-pointer hover:text-[#681B2B] transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    Total
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-3.5 px-4 font-bold text-right">Anticipo</th>
                <th className="py-3.5 px-4 font-bold text-right">Saldo</th>
                <th className="py-3.5 px-4 font-bold text-center">Estado</th>
                <th className="py-3.5 px-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2D6DE]/30">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#7D6871]">
                    <EmptyState
                      icon={ShoppingBag}
                      title="No se encontraron pedidos"
                      description="Intente ajustar los filtros de búsqueda o registre un nuevo pedido."
                      action={{
                        label: 'Nuevo Pedido',
                        onClick: () => navigateToOrderNew('orders'),
                        icon: PlusCircle,
                      }}
                      size="sm"
                    />
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const isToday = order.deliveryDate === todayStr;
                  const isLate =
                    order.deliveryDate < todayStr &&
                    (order.status === 'Pendiente' || order.status === 'En preparación');

                  return (
                    <tr
                      key={order.id}
                      id={`order-row-${order.code}`}
                      className="hover:bg-[#FBECEF]/30 transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-bold text-[#681B2B] whitespace-nowrap">
                        {order.code}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#2C1E23]">{order.clientName}</div>
                        <div className="text-[11px] text-[#7D6871]">{order.clientPhone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-[#2C1E23] font-medium max-w-xs truncate" title={order.description}>
                          {order.description}
                        </div>
                        <div className="text-[10px] text-[#7D6871]">Canal: {order.channel}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <DateFormatter
                          date={order.deliveryDate}
                          time={order.deliveryTime}
                          showRelativeBadge={true}
                        />
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <MoneyFormatter value={order.total} />
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <MoneyFormatter value={order.advancePayment} colorScheme="positive" />
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <MoneyFormatter
                          value={order.balance}
                          colorScheme={order.balance > 0 ? 'negative' : 'positive'}
                        />
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <StatusBadge status={order.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`btn-view-order-${order.code}`}
                            onClick={() => navigateToOrderDetail(order.id, 'orders')}
                            className="p-1.5 rounded-lg bg-[#FBECEF]/60 hover:bg-[#681B2B] hover:text-white text-[#681B2B] border border-[#F2D6DE] transition-colors cursor-pointer"
                            title="Ver Detalle del Pedido"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {order.status !== 'Cancelado' && order.status !== 'Entregado' && (
                            <button
                              id={`btn-edit-order-${order.code}`}
                              onClick={() => navigateToOrderEdit(order.id, 'orders')}
                              className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-200 text-[#2C1E23] border border-gray-200 transition-colors cursor-pointer"
                              title="Editar Pedido"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View (Phones & Small screens) */}
        <div className="block md:hidden divide-y divide-[#F2D6DE]/40 p-3 space-y-3">
          {paginatedOrders.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No se encontraron pedidos"
              description="Ajuste los filtros o registre un nuevo pedido."
              action={{
                label: 'Nuevo Pedido',
                onClick: () => navigateToOrderNew('orders'),
                icon: PlusCircle,
              }}
              size="sm"
            />
          ) : (
            paginatedOrders.map((order) => {
              const isToday = order.deliveryDate === todayStr;
              const isLate =
                order.deliveryDate < todayStr &&
                (order.status === 'Pendiente' || order.status === 'En preparación');

              return (
                <div
                  key={order.id}
                  id={`mobile-card-order-${order.code}`}
                  className="bg-white rounded-xl p-4 border border-[#F2D6DE]/60 shadow-2xs space-y-3"
                >
                  {/* Card Header: Code + Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-[#681B2B]">
                        {order.code}
                      </span>
                      <span className="text-[10px] text-[#7D6871] bg-gray-100 px-2 py-0.5 rounded-md">
                        {order.channel}
                      </span>
                    </div>
                    <StatusBadge status={order.status} size="sm" />
                  </div>

                  {/* Client & Description */}
                  <div>
                    <h3 className="font-bold text-[#2C1E23] text-sm">{order.clientName}</h3>
                    <p className="text-xs text-[#7D6871] flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-[#681B2B]" />
                      {order.clientPhone}
                    </p>
                    <p className="text-xs text-[#2C1E23] mt-1.5 line-clamp-2 bg-[#FBECEF]/20 p-2 rounded-lg border border-[#F2D6DE]/40">
                      {order.description}
                    </p>
                  </div>

                  {/* Delivery date & time */}
                  <div className="pt-1 border-t border-[#F2D6DE]/30">
                    <DateFormatter
                      date={order.deliveryDate}
                      time={order.deliveryTime}
                      showRelativeBadge={true}
                    />
                  </div>

                  {/* Financials Row */}
                  <div className="grid grid-cols-3 gap-2 bg-[#FBECEF]/30 p-2.5 rounded-xl text-center text-xs">
                    <div>
                      <span className="text-[10px] font-semibold text-[#7D6871] uppercase block">Total</span>
                      <MoneyFormatter value={order.total} size="sm" />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-[#059669] uppercase block">Pagado</span>
                      <MoneyFormatter value={order.advancePayment} colorScheme="positive" size="sm" />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-[#7D6871] uppercase block">Saldo</span>
                      <MoneyFormatter
                        value={order.balance}
                        colorScheme={order.balance > 0 ? 'negative' : 'positive'}
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Card Actions (Touch targets at least 44px) */}
                  <div className="flex items-center gap-2 pt-1 border-t border-[#F2D6DE]/30">
                    <button
                      id={`btn-mobile-view-${order.code}`}
                      onClick={() => navigateToOrderDetail(order.id, 'orders')}
                      className="flex-1 min-h-[40px] py-2 px-3 rounded-xl bg-[#681B2B] hover:bg-[#541421] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Detalle
                    </button>

                    {order.status !== 'Cancelado' && order.status !== 'Entregado' && (
                      <button
                        id={`btn-mobile-edit-${order.code}`}
                        onClick={() => navigateToOrderEdit(order.id, 'orders')}
                        className="min-h-[40px] py-2 px-3 rounded-xl border border-[#F2D6DE] bg-white text-[#2C1E23] hover:bg-gray-50 font-semibold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Editar Pedido"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Editar
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Centralized Pagination Bar */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={sortedOrders.length}
          itemsPerPage={itemsPerPage}
          onPageChange={(p) => setCurrentPage(p)}
          itemName="pedidos"
        />
      </div>
    </div>
  );
};
