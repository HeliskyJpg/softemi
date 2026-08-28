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
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { OrderStatus } from '../../types';

export const OrdersListView: React.FC = () => {
  const { orders, setActiveView, navigateToOrderDetail, navigateToOrderEdit } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [dateFilter, setDateFilter] = useState<string>('todos');
  const [sortField, setSortField] = useState<'deliveryDate' | 'code' | 'total'>('deliveryDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
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
    <div id="orders-list-view-container" className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#3A2D33] tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-[#8E315E]" />
            Listado General de Pedidos
          </h1>
          <p className="text-xs sm:text-sm text-[#6D5C64] mt-0.5">
            Registro completo de pedidos personalizados, saldos y seguimiento de entregas.
          </p>
        </div>

        <button
          id="btn-orders-new"
          onClick={() => setActiveView('order-new')}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#8E315E] hover:bg-[#7A294F] text-white font-bold text-sm shadow-sm transition-all cursor-pointer hover:shadow-md"
        >
          <PlusCircle className="w-4 h-4" />
          + Nuevo Pedido
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#FBDAE3] shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search input */}
          <div className="relative lg:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6D5C64]">
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
              placeholder="Buscar por código (PED-XXXX), cliente o descripción..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-[#FBDAE3] bg-[#FFF7FA]/50 focus:bg-white text-[#3A2D33] placeholder-[#6D5C64]/60 focus:outline-none focus:ring-2 focus:ring-[#8E315E]/30 focus:border-[#8E315E] transition-all"
            />
          </div>

          {/* Status filter dropdown */}
          <div className="relative">
            <label htmlFor="select-orders-status-filter" className="sr-only">Filtrar por Estado</label>
            <select
              id="select-orders-status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#FBDAE3] bg-white text-[#3A2D33] focus:outline-none focus:ring-2 focus:ring-[#8E315E]/30 font-medium cursor-pointer"
            >
              {statusOptions.map((st) => (
                <option key={st} value={st}>
                  Estado: {st}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Date Filter */}
          <div className="relative">
            <label htmlFor="select-orders-date-filter" className="sr-only">Filtrar por Fecha</label>
            <select
              id="select-orders-date-filter"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#FBDAE3] bg-white text-[#3A2D33] focus:outline-none focus:ring-2 focus:ring-[#8E315E]/30 font-medium cursor-pointer"
            >
              <option value="todos">Fechas: Todos los pedidos</option>
              <option value="hoy">Entregas de Hoy</option>
              <option value="pendientes">Pendientes / En preparación</option>
              <option value="atrasados">Atrasados (Límite vencido)</option>
            </select>
          </div>
        </div>

        {/* Active filters pill list */}
        <div className="flex items-center justify-between text-xs text-[#6D5C64] pt-2 border-t border-gray-100">
          <span>
            Mostrando <strong className="text-[#3A2D33]">{sortedOrders.length}</strong> pedidos encontrados
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
              className="text-[#8E315E] hover:underline font-semibold cursor-pointer"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-[#FBDAE3] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table id="table-orders-list" className="w-full text-left text-xs">
            <thead className="bg-[#FFF7FA] border-b border-[#FBDAE3] text-[#6D5C64] uppercase tracking-wider text-[11px]">
              <tr>
                <th
                  onClick={() => toggleSort('code')}
                  className="py-3.5 px-4 font-bold cursor-pointer hover:text-[#8E315E] transition-colors"
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
                  className="py-3.5 px-4 font-bold cursor-pointer hover:text-[#8E315E] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Fecha Entrega
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('total')}
                  className="py-3.5 px-4 font-bold cursor-pointer hover:text-[#8E315E] transition-colors text-right"
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
            <tbody className="divide-y divide-gray-100">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#6D5C64]">
                    <div className="max-w-xs mx-auto space-y-2">
                      <ShoppingBag className="w-8 h-8 mx-auto text-[#FBDAE3]" />
                      <p className="font-semibold text-[#3A2D33]">No se encontraron pedidos</p>
                      <p className="text-xs text-[#6D5C64]">
                        Intente ajustar los filtros de búsqueda o registre un nuevo pedido.
                      </p>
                    </div>
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
                      className="hover:bg-[#FFF7FA]/80 transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-bold text-[#8E315E] whitespace-nowrap">
                        {order.code}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#3A2D33]">{order.clientName}</div>
                        <div className="text-[11px] text-[#6D5C64]">{order.clientPhone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-[#3A2D33] font-medium max-w-xs truncate" title={order.description}>
                          {order.description}
                        </div>
                        <div className="text-[10px] text-[#6D5C64]">Canal: {order.channel}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div
                          className={`font-semibold ${
                            isToday
                              ? 'text-[#8E315E]'
                              : isLate
                              ? 'text-[#9B2C2C]'
                              : 'text-[#3A2D33]'
                          }`}
                        >
                          {order.deliveryDate}
                        </div>
                        <div className="text-[11px] text-[#6D5C64] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#6D5C64]" />
                          {order.deliveryTime || '--:--'}
                          {isToday && (
                            <span className="ml-1 text-[10px] font-bold px-1.5 py-0.2 bg-[#FBDAE3] text-[#8E315E] rounded">
                              Hoy
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#3A2D33] whitespace-nowrap">
                        Q {order.total.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-[#65733D] font-semibold whitespace-nowrap">
                        Q {order.advancePayment.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            order.balance > 0 ? 'text-[#9B2C2C]' : 'text-emerald-700'
                          }`}
                        >
                          Q {order.balance.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <StatusBadge status={order.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`btn-view-order-${order.code}`}
                            onClick={() => navigateToOrderDetail(order.id)}
                            className="p-1.5 rounded-lg bg-[#FFF7FA] hover:bg-[#8E315E] hover:text-white text-[#8E315E] border border-[#FBDAE3] transition-colors cursor-pointer"
                            title="Ver Detalle del Pedido"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {order.status !== 'Cancelado' && order.status !== 'Entregado' && (
                            <button
                              id={`btn-edit-order-${order.code}`}
                              onClick={() => navigateToOrderEdit(order.id)}
                              className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-200 text-[#3A2D33] border border-gray-200 transition-colors cursor-pointer"
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

        {/* Pagination Bar */}
        <div className="p-4 border-t border-[#FBDAE3] bg-[#FFF7FA]/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-[#6D5C64]">
            Página <strong className="text-[#3A2D33]">{currentPage}</strong> de{' '}
            <strong className="text-[#3A2D33]">{totalPages}</strong> (
            {sortedOrders.length} pedidos totales)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              id="btn-pagination-prev"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-[#FBDAE3] bg-white text-[#3A2D33] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FBDAE3]/30 transition-colors font-medium flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Anterior
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentPage === pageNum
                    ? 'bg-[#8E315E] text-white shadow-xs'
                    : 'bg-white text-[#6D5C64] hover:bg-[#FBDAE3]/30 border border-[#FBDAE3]'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              id="btn-pagination-next"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-[#FBDAE3] bg-white text-[#3A2D33] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FBDAE3]/30 transition-colors font-medium flex items-center gap-1 cursor-pointer"
            >
              Siguiente
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
