import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  History,
  Search,
  Filter,
  FileSpreadsheet,
  RotateCcw,
  Layers,
  ShoppingBag,
  Users,
  Package,
  KeyRound,
  UserCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AuditModule } from '../../types';
import {
  exportAuditLogsToCsv,
  formatAuditHumanDate,
} from '../../services/auditService';

export const AuditLogView: React.FC = () => {
  const { auditLogs, logAction, users } = useApp();

  // Search and Filter States (general search, date/range, user, module)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | '7days' | '30days' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Extract unique modules from logs for filter dropdown
  const availableModules: AuditModule[] = useMemo(() => {
    const set = new Set<AuditModule>();
    auditLogs.forEach((l) => set.add(l.module));
    return Array.from(set).sort();
  }, [auditLogs]);

  // Extract unique users for filter dropdown
  const availableUsers = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((u) => map.set(u.name, u.name));
    auditLogs.forEach((l) => map.set(l.userName, l.userName));
    return Array.from(map.values()).sort();
  }, [users, auditLogs]);

  // Handle Date presets
  const handleDatePresetChange = (preset: 'all' | 'today' | '7days' | '30days' | 'custom') => {
    setDatePreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7days') {
      const past = new Date();
      past.setDate(now.getDate() - 7);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === '30days') {
      const past = new Date();
      past.setDate(now.getDate() - 30);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(todayStr);
    }
    setCurrentPage(1);
  };

  // Filtering: general search, module, user, and date range
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesQuery =
          log.description.toLowerCase().includes(query) ||
          log.action.toLowerCase().includes(query) ||
          log.recordId.toLowerCase().includes(query) ||
          log.userName.toLowerCase().includes(query) ||
          log.entityType.toLowerCase().includes(query) ||
          (log.previousValue && log.previousValue.toLowerCase().includes(query)) ||
          (log.newValue && log.newValue.toLowerCase().includes(query));

        if (!matchesQuery) return false;
      }

      // Module
      if (selectedModule !== 'all' && log.module !== selectedModule) {
        return false;
      }

      // User
      if (selectedUser !== 'all' && log.userName !== selectedUser) {
        return false;
      }

      // Date Range
      if (startDate) {
        const logDate = log.timestamp.split('T')[0];
        if (logDate < startDate) return false;
      }

      if (endDate) {
        const logDate = log.timestamp.split('T')[0];
        if (logDate > endDate) return false;
      }

      return true;
    });
  }, [
    auditLogs,
    searchTerm,
    selectedModule,
    selectedUser,
    startDate,
    endDate,
  ]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  // Check if any filter is active
  const hasActiveFilters = Boolean(
    searchTerm ||
    selectedModule !== 'all' ||
    selectedUser !== 'all' ||
    startDate ||
    endDate ||
    datePreset !== 'all'
  );

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedModule('all');
    setSelectedUser('all');
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Handle Export to CSV
  const handleExportCsv = () => {
    exportAuditLogsToCsv(filteredLogs);
    logAction({
      action: 'exportar reporte',
      module: 'Reportes',
      entityType: 'AuditLog',
      recordId: `EXP-CSV-${Date.now()}`,
      description: `Exportación de bitácora de auditoría a formato CSV (${filteredLogs.length} registros).`,
      previousValue: null,
      newValue: `CSV con ${filteredLogs.length} eventos filtrados`,
      metadata: { format: 'CSV', count: filteredLogs.length },
    });
  };

  // Badge styles based on action type
  const getActionBadge = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('merma') || act.includes('salida') || act.includes('cancelar')) {
      return 'bg-amber-100 text-amber-900 border-amber-300 font-semibold';
    }
    if (act.includes('crear') || act.includes('entrada') || act.includes('alta')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    if (act.includes('estado') || act.includes('listo') || act.includes('entregado')) {
      return 'bg-blue-50 text-blue-800 border-blue-200';
    }
    if (act.includes('pago') || act.includes('abono')) {
      return 'bg-teal-50 text-teal-800 border-teal-200';
    }
    if (act.includes('rol') || act.includes('usuario')) {
      return 'bg-purple-50 text-purple-800 border-purple-200';
    }
    return 'bg-stone-100 text-stone-700 border-stone-200';
  };

  // Module Icon & Color
  const getModuleBadge = (module: AuditModule) => {
    switch (module) {
      case 'Pedidos':
        return { bg: 'bg-[#681B2B]/10 text-[#681B2B] border-[#681B2B]/20', icon: ShoppingBag };
      case 'Inventario':
        return { bg: 'bg-teal-50 text-teal-800 border-teal-200', icon: Layers };
      case 'Componentes':
        return { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: Package };
      case 'Clientes':
        return { bg: 'bg-purple-50 text-purple-800 border-purple-200', icon: Users };
      case 'Usuarios':
        return { bg: 'bg-blue-50 text-blue-800 border-blue-200', icon: UserCheck };
      case 'Perfil':
        return { bg: 'bg-indigo-50 text-indigo-800 border-indigo-200', icon: KeyRound };
      default:
        return { bg: 'bg-gray-100 text-gray-800 border-gray-200', icon: History };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Export Controls */}
      <div className="bg-white rounded-2xl p-6 border border-[#F2D6DE]/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-[#681B2B]/10 text-[#681B2B]">
              <History className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#2C1E23]">Auditoría</h1>
              <p className="text-xs sm:text-sm text-[#7D6871] mt-0.5">
                Supervisión general de eventos, salidas por merma, pedidos y movimientos en el sistema EMILA.
              </p>
            </div>
          </div>

          {/* Action Button: Export CSV */}
          <div className="flex items-center">
            <button
              id="btn-audit-export-csv"
              onClick={handleExportCsv}
              className="px-3.5 py-2 text-xs font-semibold text-[#2C1E23] bg-white border border-[#F2D6DE] hover:bg-[#FBECEF] rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Simplified Filter Toolbar */}
      <div className="bg-white rounded-2xl p-5 border border-[#F2D6DE]/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#2C1E23] uppercase tracking-wide">
            <Filter className="w-3.5 h-3.5 text-[#681B2B]" />
            <span>Filtros de auditoría</span>
          </div>

          {hasActiveFilters && (
            <button
              id="btn-audit-reset-filters"
              onClick={handleResetFilters}
              className="text-xs font-semibold text-[#681B2B] hover:text-[#521522] flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-[#FBECEF] transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>

        {/* General Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#7D6871] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="input-audit-search"
            type="text"
            placeholder="Buscar en auditoría"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-[#FAF6F7] border border-[#F2D6DE] rounded-xl text-[#2C1E23] placeholder-[#7D6871]/70 focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20 focus:border-[#681B2B] transition-all"
          />
        </div>

        {/* Filter Controls Row: Fecha / Rango, Usuario, Módulo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1 text-xs">
          {/* 1. Fecha / Rango */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-[#7D6871]">Fecha / Rango</label>
            <select
              id="select-audit-date-preset"
              value={datePreset}
              onChange={(e) => handleDatePresetChange(e.target.value as any)}
              className="w-full px-3 py-2 bg-white border border-[#F2D6DE] rounded-xl text-[#2C1E23] focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20"
            >
              <option value="all">Todas las fechas</option>
              <option value="today">Hoy</option>
              <option value="7days">Últimos 7 días</option>
              <option value="30days">Últimos 30 días</option>
              <option value="custom">Rango personalizado</option>
            </select>
            {datePreset === 'custom' && (
              <div className="flex items-center gap-1 pt-1">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-1/2 px-2 py-1 text-[11px] bg-white border border-[#F2D6DE] rounded-lg text-[#2C1E23]"
                  title="Desde"
                />
                <span className="text-[#7D6871]">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-1/2 px-2 py-1 text-[11px] bg-white border border-[#F2D6DE] rounded-lg text-[#2C1E23]"
                  title="Hasta"
                />
              </div>
            )}
          </div>

          {/* 2. Usuario */}
          <div>
            <label className="block text-[11px] font-semibold text-[#7D6871] mb-1">Usuario</label>
            <select
              id="select-audit-user"
              value={selectedUser}
              onChange={(e) => {
                setSelectedUser(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-white border border-[#F2D6DE] rounded-xl text-[#2C1E23] focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20"
            >
              <option value="all">Todos los usuarios</option>
              {availableUsers.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Módulo */}
          <div>
            <label className="block text-[11px] font-semibold text-[#7D6871] mb-1">Módulo</label>
            <select
              id="select-audit-module"
              value={selectedModule}
              onChange={(e) => {
                setSelectedModule(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-white border border-[#F2D6DE] rounded-xl text-[#2C1E23] focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20"
            >
              <option value="all">Todos los módulos</option>
              {availableModules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-[#F2D6DE]/80 shadow-xs overflow-hidden">
        {/* Table Top Status Bar */}
        <div className="p-4 border-b border-[#F2D6DE] flex flex-wrap items-center justify-between gap-3 bg-[#FAF6F7]/50">
          <div className="text-xs font-semibold text-[#7D6871]">
            Mostrando <strong className="text-[#2C1E23]">{filteredLogs.length}</strong> eventos registrados
          </div>
          <div className="flex items-center gap-3 text-xs text-[#7D6871]">
            <div className="flex items-center gap-1.5">
              <span>Por página:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-[#F2D6DE] rounded-lg px-2 py-1 text-xs text-[#2C1E23] focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            {filteredLogs.length > 0 && (
              <span>
                Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
              </span>
            )}
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#FBECEF] text-[#681B2B] flex items-center justify-center mx-auto mb-3">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#2C1E23]">No se encontraron eventos</h3>
            <p className="text-xs text-[#7D6871] mt-1 max-w-md mx-auto">
              No hay registros de auditoría que coincidan con los filtros aplicados. Intente ajustar los criterios de búsqueda o fecha.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-3 px-3.5 py-1.5 text-xs font-semibold text-[#681B2B] bg-[#FBECEF] hover:bg-[#F2D6DE] rounded-xl transition-colors inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#2C1E23]">
              <thead className="bg-[#FAF6F7] text-[11px] font-bold text-[#7D6871] uppercase tracking-wider border-b border-[#F2D6DE]">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">Fecha y hora</th>
                  <th className="px-4 py-3 whitespace-nowrap">Usuario</th>
                  <th className="px-4 py-3 whitespace-nowrap">Acción</th>
                  <th className="px-4 py-3 whitespace-nowrap">Módulo</th>
                  <th className="px-4 py-3 whitespace-nowrap">Registro</th>
                  <th className="px-4 py-3">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2D6DE]/60">
                {paginatedLogs.map((log) => {
                  const mod = getModuleBadge(log.module);
                  const ModIcon = mod.icon;
                  const dateInfo = formatAuditHumanDate(log.timestamp);

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-[#FBECEF]/20 transition-colors"
                    >
                      {/* 1. Fecha y hora */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-medium text-[#2C1E23]">{dateInfo.relative}</div>
                        <div className="text-[10px] text-[#7D6871] font-mono">{log.timestamp.split('T')[0]}</div>
                      </td>

                      {/* 2. Usuario */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-[#2C1E23]">{log.userName}</div>
                        <div className="text-[10px] text-[#7D6871]">{log.userRole}</div>
                      </td>

                      {/* 3. Acción */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] border ${getActionBadge(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* 4. Módulo */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${mod.bg}`}
                        >
                          <ModIcon className="w-3 h-3" />
                          {log.module}
                        </span>
                      </td>

                      {/* 5. Registro */}
                      <td className="px-4 py-3.5 whitespace-nowrap font-mono text-xs font-semibold text-[#681B2B]">
                        {log.recordId}
                      </td>

                      {/* 6. Detalle */}
                      <td className="px-4 py-3.5 text-[#2C1E23]">
                        <div className="font-medium leading-relaxed">{log.description}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#F2D6DE] flex flex-wrap items-center justify-between gap-3 bg-white text-xs">
            <div className="text-[#7D6871]">
              Mostrando eventos del <strong>{(currentPage - 1) * pageSize + 1}</strong> al{' '}
              <strong>{Math.min(currentPage * pageSize, filteredLogs.length)}</strong> de{' '}
              <strong>{filteredLogs.length}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-[#F2D6DE] rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FBECEF] text-[#2C1E23] font-medium transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((pageNum, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && pageNum - prev > 1;

                  return (
                    <React.Fragment key={pageNum}>
                      {showEllipsis && <span className="px-1 text-[#7D6871]">...</span>}
                      <button
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-xl font-semibold transition-colors ${
                          currentPage === pageNum
                            ? 'bg-[#681B2B] text-white shadow-2xs'
                            : 'hover:bg-[#FBECEF] text-[#2C1E23] border border-[#F2D6DE]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 border border-[#F2D6DE] rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FBECEF] text-[#2C1E23] font-medium transition-colors flex items-center gap-1"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
