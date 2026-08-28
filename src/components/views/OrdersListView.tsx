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
          onClick={() => setActiveView('order-new')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#681B2B] hover:bg-[#541421] text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.2]" />
          Nuevo Pedido
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#F2D6DE]/60 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search input */}
          <div className="relative lg:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7D6871]">
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
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] bg-[#FBECEF]/30 focus:bg-white text-[#2C1E23] placeholder-[#7D6871]/60 focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20 focus:border-[#681B2B] transition-all"
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
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] bg-white text-[#2C1E23] focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20 font-medium cursor-pointer"
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
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] bg-white text-[#2C1E23] focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20 font-medium cursor-pointer"
            >
              <option value="todos">Fechas: Todos los pedidos</option>
              <option value="hoy">Entregas de Hoy</option>
              <option value="pendientes">Pendientes / En preparación</option>
              <option value="atrasados">Atrasados (Límite vencido)</option>
            </select>
          </div>
        </div>

        {/* Active filters pill list */}
        <div className="flex items-center justify-between text-xs text-[#7D6871] pt-2 border-t border-[#F2D6DE]/40">
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

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-[#F2D6DE]/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
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
                    <div className="max-w-xs mx-auto space-y-2">
                      <ShoppingBag className="w-8 h-8 mx-auto text-[#F2D6DE]" />
                      <p className="font-semibold text-[#2C1E23]">No se encontraron pedidos</p>
                      <p className="text-xs text-[#7D6871]">
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
                        <div
                          className={`font-semibold ${
                            isToday
                              ? 'text-[#2563EB]'
                              : isLate
                              ? 'text-[#DC2626]'
                              : 'text-[#2C1E23]'
                          }`}
                        >
                          {order.deliveryDate}
                        </div>
                        <div className="text-[11px] text-[#7D6871] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#7D6871]" />
                          {order.deliveryTime || '--:--'}
                          {isToday && (
                            <span className="ml-1 text-[10px] font-bold px-1.5 py-0.2 bg-[#DBEAFE] text-[#2563EB] rounded">
                              Hoy
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#2C1E23] whitespace-nowrap">
                        Q {order.total.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-[#059669] font-semibold whitespace-nowrap">
                        Q {order.advancePayment.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            order.balance > 0 ? 'text-[#DC2626]' : 'text-emerald-700'
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
                            className="p-1.5 rounded-lg bg-[#FBECEF]/60 hover:bg-[#681B2B] hover:text-white text-[#681B2B] border border-[#F2D6DE] transition-colors cursor-pointer"
                            title="Ver Detalle del Pedido"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {order.status !== 'Cancelado' && order.status !== 'Entregado' && (
                            <button
                              id={`btn-edit-order-${order.code}`}
                              onClick={() => navigateToOrderEdit(order.id)}
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

        {/* Pagination Bar */}
        <div className="p-4 border-t border-[#F2D6DE]/60 bg-[#FBECEF]/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-[#7D6871]">
            Página <strong className="text-[#2C1E23]">{currentPage}</strong> de{' '}
            <strong className="text-[#2C1E23]">{totalPages}</strong> (
            {sortedOrders.length} pedidos totales)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              id="btn-pagination-prev"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-[#F2D6DE] bg-white text-[#2C1E23] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FBECEF]/40 transition-colors font-medium flex items-center gap-1 cursor-pointer"
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
                    ? 'bg-[#681B2B] text-white shadow-xs'
                    : 'bg-white text-[#7D6871] hover:bg-[#FBECEF]/40 border border-[#F2D6DE]'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              id="btn-pagination-next"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-[#F2D6DE] bg-white text-[#2C1E23] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FBECEF]/40 transition-colors font-medium flex items-center gap-1 cursor-pointer"
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
