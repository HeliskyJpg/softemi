import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  History,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  Eye,
  X,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  Layers,
  ShoppingBag,
  Users,
  Package,
  KeyRound,
  UserCheck,
  Calendar,
} from 'lucide-react';
import { AuditLogEntry, AuditModule } from '../../types';
import { exportAuditLogsToCsv, exportAuditLogsToJson } from '../../services/auditService';

export const AuditLogView: React.FC = () => {
  const { auditLogs, logAction, users, currentUser } = useApp();

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Selected Log for Inspector Modal
  const [inspectingLog, setInspectingLog] = useState<AuditLogEntry | null>(null);
  const [showSqlSchemaHelp, setShowSqlSchemaHelp] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Extract unique modules and actions from logs for filter dropdowns
  const availableModules: AuditModule[] = useMemo(() => {
    const set = new Set<AuditModule>();
    auditLogs.forEach((l) => set.add(l.module));
    return Array.from(set).sort();
  }, [auditLogs]);

  const availableActions = useMemo(() => {
    const set = new Set<string>();
    auditLogs.forEach((l) => set.add(l.action));
    return Array.from(set).sort();
  }, [auditLogs]);

  const availableUsers = useMemo(() => {
    const map = new Map<string, string>();
    auditLogs.forEach((l) => map.set(l.userName, l.userName));
    return Array.from(map.values()).sort();
  }, [auditLogs]);

  // Filtering
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

      // Action
      if (selectedAction !== 'all' && log.action !== selectedAction) {
        return false;
      }

      // Role
      if (selectedRole !== 'all' && log.userRole !== selectedRole) {
        return false;
      }

      // User
      if (selectedUser !== 'all' && log.userName !== selectedUser) {
        return false;
      }

      // Date Range
      if (startDate) {
        const logDate = log.timestamp.split(' ')[0]; // YYYY-MM-DD
        if (logDate < startDate) return false;
      }

      if (endDate) {
        const logDate = log.timestamp.split(' ')[0]; // YYYY-MM-DD
        if (logDate > endDate) return false;
      }

      return true;
    });
  }, [auditLogs, searchTerm, selectedModule, selectedAction, selectedRole, selectedUser, startDate, endDate]);

  // Stats
  const stats = useMemo(() => {
    const total = auditLogs.length;
    const ordersCount = auditLogs.filter((l) => l.module === 'Pedidos').length;
    const inventoryCount = auditLogs.filter((l) => l.module === 'Inventario' || l.module === 'Componentes').length;
    const usersCount = auditLogs.filter((l) => l.module === 'Usuarios' || l.module === 'Perfil').length;
    return { total, ordersCount, inventoryCount, usersCount };
  }, [auditLogs]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  // Handle Export to CSV
  const handleExportCsv = () => {
    exportAuditLogsToCsv(filteredLogs);
    logAction({
      action: 'exportar reporte',
      module: 'Reportes',
      entityType: 'AuditLog',
      recordId: `EXP-CSV-${Date.now()}`,
      description: `Exportación de bitácora de auditoría a formato CSV (${filteredLogs.length} registros)`,
      previousValue: null,
      newValue: `CSV con ${filteredLogs.length} eventos filtrados`,
      metadata: { format: 'CSV', count: filteredLogs.length },
    });
  };

  // Handle Export to JSON
  const handleExportJson = () => {
    exportAuditLogsToJson(filteredLogs);
    logAction({
      action: 'exportar reporte',
      module: 'Reportes',
      entityType: 'AuditLog',
      recordId: `EXP-JSON-${Date.now()}`,
      description: `Exportación de bitácora de auditoría a formato JSON SQL-Ready (${filteredLogs.length} registros)`,
      previousValue: null,
      newValue: `JSON con ${filteredLogs.length} eventos estructurados`,
      metadata: { format: 'JSON', count: filteredLogs.length },
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedModule('all');
    setSelectedAction('all');
    setSelectedRole('all');
    setSelectedUser('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Badge styles based on action type
  const getActionBadge = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('crear') || act.includes('entrada') || act.includes('activar')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    if (act.includes('editar') || act.includes('ajustar') || act.includes('cambiar rol') || act.includes('cambiar estado')) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    if (act.includes('cancelar') || act.includes('salida') || act.includes('desactivar') || act.includes('inactivar')) {
      return 'bg-rose-50 text-rose-800 border-rose-200';
    }
    if (act.includes('pago') || act.includes('contraseña')) {
      return 'bg-blue-50 text-blue-800 border-blue-200';
    }
    return 'bg-gray-50 text-gray-700 border-gray-200';
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
      {/* Header and Controls */}
      <div className="bg-white rounded-2xl p-6 border border-[#F2D6DE]/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#681B2B]/10 text-[#681B2B]">
                <History className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-[#2C1E23]">
                Bitácora Global de Auditoría
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#7D6871] mt-1">
              Registro inmutable y unificado de eventos del sistema EMILA. Compatible con la tabla <code className="bg-[#FBECEF] text-[#681B2B] px-1.5 py-0.5 rounded font-mono text-xs">AuditLog</code> en Flask/SQL.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-audit-sql-info"
              onClick={() => setShowSqlSchemaHelp(!showSqlSchemaHelp)}
              className="px-3 py-2 text-xs font-semibold text-[#681B2B] bg-[#FBECEF] hover:bg-[#F2D6DE] rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{showSqlSchemaHelp ? 'Ocultar esquema SQL' : 'Ver esquema SQL/Flask'}</span>
            </button>

            <button
              id="btn-audit-export-csv"
              onClick={handleExportCsv}
              className="px-3.5 py-2 text-xs font-semibold text-[#2C1E23] bg-white border border-[#F2D6DE] hover:bg-[#FBECEF] rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Exportar CSV</span>
            </button>

            <button
              id="btn-audit-export-json"
              onClick={handleExportJson}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-[#681B2B] hover:bg-[#521522] rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <FileCode className="w-4 h-4" />
              <span>Exportar JSON (SQL)</span>
            </button>
          </div>
        </div>

        {/* Database Mapping Info Banner */}
        {showSqlSchemaHelp && (
          <div className="mt-5 p-4 rounded-xl bg-[#FAF6F7] border border-[#F2D6DE] text-xs text-[#2C1E23] space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#681B2B]">
              <Database className="w-4 h-4" />
              <span>Estructura para migración directa a Flask / SQLAlchemy / PostgreSQL:</span>
            </div>
            <p className="text-[#5A484F] leading-relaxed">
              Todos los eventos registrados por la función central <code className="bg-white px-1.5 py-0.5 rounded border border-[#F2D6DE] text-[#681B2B] font-mono">logAction(...)</code> se serializan uniformemente respetando la arquitectura de datos relacional:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
              <div className="bg-white p-2.5 rounded-lg border border-[#F2D6DE]">
                <strong className="text-[#681B2B]">id</strong>: VARCHAR(64) PRIMARY KEY
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-[#F2D6DE]">
                <strong className="text-[#681B2B]">timestamp</strong>: TIMESTAMP WITH TIME ZONE
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-[#F2D6DE]">
                <strong className="text-[#681B2B]">user_id / user_name</strong>: VARCHAR(100)
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-[#F2D6DE]">
                <strong className="text-[#681B2B]">user_role</strong>: VARCHAR(50)
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-[#F2D6DE]">
                <strong className="text-[#681B2B]">action</strong>: VARCHAR(100) INDEXED
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-[#F2D6DE]">
                <strong className="text-[#681B2B]">module</strong>: VARCHAR(50) INDEXED
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-[#F2D6DE]">
                <strong className="text-[#681B2B]">entity_type</strong>: VARCHAR(50)
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-[#F2D6DE]">
                <strong className="text-[#681B2B]">record_id</strong>: VARCHAR(100) INDEXED
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-[#F2D6DE]">
                <strong className="text-[#681B2B]">previous_value / new_value</strong>: TEXT / JSON
              </div>
            </div>
          </div>
        )}

        {/* Quick Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="bg-[#FBECEF]/40 p-3.5 rounded-xl border border-[#F2D6DE]/70">
            <div className="text-[11px] font-semibold text-[#7D6871] uppercase tracking-wide">Total Eventos</div>
            <div className="text-xl font-bold text-[#2C1E23] mt-0.5">{stats.total}</div>
          </div>
          <div className="bg-[#FBECEF]/40 p-3.5 rounded-xl border border-[#F2D6DE]/70">
            <div className="text-[11px] font-semibold text-[#7D6871] uppercase tracking-wide">Módulo Pedidos</div>
            <div className="text-xl font-bold text-[#681B2B] mt-0.5">{stats.ordersCount}</div>
          </div>
          <div className="bg-[#FBECEF]/40 p-3.5 rounded-xl border border-[#F2D6DE]/70">
            <div className="text-[11px] font-semibold text-[#7D6871] uppercase tracking-wide">Inventario / Stock</div>
            <div className="text-xl font-bold text-teal-700 mt-0.5">{stats.inventoryCount}</div>
          </div>
          <div className="bg-[#FBECEF]/40 p-3.5 rounded-xl border border-[#F2D6DE]/70">
            <div className="text-[11px] font-semibold text-[#7D6871] uppercase tracking-wide">Usuarios y Roles</div>
            <div className="text-xl font-bold text-blue-700 mt-0.5">{stats.usersCount}</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-5 border border-[#F2D6DE]/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#2C1E23] uppercase tracking-wide">
            <Filter className="w-3.5 h-3.5 text-[#681B2B]" />
            <span>Filtros avanzados de auditoría</span>
          </div>
          {(searchTerm || selectedModule !== 'all' || selectedAction !== 'all' || selectedRole !== 'all' || selectedUser !== 'all' || startDate || endDate) && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-[#681B2B] hover:text-[#521522] flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restablecer filtros</span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#7D6871] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="input-audit-search"
            type="text"
            placeholder="Buscar por identificador (#PED-0001, @usuario, flor), acción, descripción, valor anterior/nuevo..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-[#FAF6F7] border border-[#F2D6DE] rounded-xl text-[#2C1E23] placeholder-[#7D6871]/70 focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20 focus:border-[#681B2B] transition-all"
          />
        </div>

        {/* Multi-Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-1 text-xs">
          {/* Module Filter */}
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

          {/* Action Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-[#7D6871] mb-1">Acción</label>
            <select
              id="select-audit-action"
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-white border border-[#F2D6DE] rounded-xl text-[#2C1E23] focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20"
            >
              <option value="all">Todas las acciones</option>
              {availableActions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-[#7D6871] mb-1">Rol</label>
            <select
              id="select-audit-role"
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-white border border-[#F2D6DE] rounded-xl text-[#2C1E23] focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20"
            >
              <option value="all">Todos los roles</option>
              <option value="Administrador">Administrador</option>
              <option value="Vendedor">Vendedor</option>
              <option value="Florista / Operativo">Florista / Operativo</option>
            </select>
          </div>

          {/* User Filter */}
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

          {/* Date Range */}
          <div>
            <label className="block text-[11px] font-semibold text-[#7D6871] mb-1">Fecha</label>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2 py-1.5 text-xs bg-white border border-[#F2D6DE] rounded-xl text-[#2C1E23] focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20"
                title="Fecha desde"
              />
              <span className="text-[#7D6871]">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2 py-1.5 text-xs bg-white border border-[#F2D6DE] rounded-xl text-[#2C1E23] focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20"
                title="Fecha hasta"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-[#F2D6DE]/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#F2D6DE] flex items-center justify-between bg-[#FAF6F7]/50">
          <div className="text-xs font-semibold text-[#7D6871]">
            Mostrando <strong className="text-[#2C1E23]">{filteredLogs.length}</strong> eventos registrados
          </div>
          {filteredLogs.length > 0 && (
            <div className="text-xs text-[#7D6871]">
              Página {currentPage} de {totalPages}
            </div>
          )}
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
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#2C1E23]">
              <thead className="bg-[#FAF6F7] text-[11px] font-bold text-[#7D6871] uppercase tracking-wider border-b border-[#F2D6DE]">
                <tr>
                  <th className="px-4 py-3">Fecha y Hora</th>
                  <th className="px-4 py-3">Usuario y Rol</th>
                  <th className="px-4 py-3">Módulo</th>
                  <th className="px-4 py-3">Acción</th>
                  <th className="px-4 py-3">Registro / ID</th>
                  <th className="px-4 py-3">Descripción</th>
                  <th className="px-4 py-3">Valores</th>
                  <th className="px-4 py-3 text-right">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2D6DE]/60">
                {paginatedLogs.map((log) => {
                  const mod = getModuleBadge(log.module);
                  const ModIcon = mod.icon;
                  const hasValues = log.previousValue !== null || log.newValue !== null;

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-[#FBECEF]/20 transition-colors group cursor-pointer"
                      onClick={() => setInspectingLog(log)}
                    >
                      {/* Timestamp */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-[#5A484F] font-mono text-[11px]">
                        {log.timestamp}
                      </td>

                      {/* User & Role */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-[#2C1E23]">{log.userName}</div>
                        <div className="text-[10px] text-[#7D6871]">{log.userRole}</div>
                      </td>

                      {/* Module */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${mod.bg}`}
                        >
                          <ModIcon className="w-3 h-3" />
                          {log.module}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getActionBadge(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* Record ID */}
                      <td className="px-4 py-3.5 whitespace-nowrap font-mono text-xs font-semibold text-[#681B2B]">
                        {log.recordId}
                      </td>

                      {/* Description */}
                      <td className="px-4 py-3.5 max-w-xs truncate text-[#5A484F]" title={log.description}>
                        {log.description}
                      </td>

                      {/* Previous vs New indicator */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {hasValues ? (
                          <div className="flex items-center gap-1.5 text-[11px]">
                            {log.previousValue ? (
                              <span className="max-w-[75px] truncate text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                {log.previousValue}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic text-[10px]">[inicial]</span>
                            )}
                            <ArrowRight className="w-3 h-3 text-[#7D6871] shrink-0" />
                            {log.newValue ? (
                              <span className="max-w-[85px] truncate text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-medium">
                                {log.newValue}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic text-[10px]">[vacío]</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-[11px] italic">Sin cambio de valor</span>
                        )}
                      </td>

                      {/* Details button */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectingLog(log);
                          }}
                          className="p-1.5 text-[#7D6871] hover:text-[#681B2B] hover:bg-[#FBECEF] rounded-lg transition-colors"
                          title="Inspeccionar evento completo"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#F2D6DE] flex items-center justify-between bg-white text-xs">
            <div className="text-[#7D6871]">
              Página <strong className="text-[#2C1E23]">{currentPage}</strong> de{' '}
              <strong className="text-[#2C1E23]">{totalPages}</strong>
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-[#F2D6DE] rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FBECEF] transition-colors"
              >
                Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))
                .map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg font-semibold transition-colors ${
                      currentPage === pageNum
                        ? 'bg-[#681B2B] text-white'
                        : 'hover:bg-[#FBECEF] text-[#2C1E23]'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 border border-[#F2D6DE] rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FBECEF] transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Event Modal */}
      {inspectingLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in"
          onClick={() => setInspectingLog(null)}
        >
          <div
            className="bg-white w-full max-w-2xl rounded-2xl border border-[#F2D6DE] shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-[#F2D6DE] flex items-center justify-between bg-[#FAF6F7]">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-[#681B2B]/10 text-[#681B2B]">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-[#2C1E23] flex items-center gap-2">
                    <span>Detalle del Evento de Auditoría</span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getActionBadge(
                        inspectingLog.action
                      )}`}
                    >
                      {inspectingLog.action}
                    </span>
                  </h3>
                  <div className="text-xs text-[#7D6871] font-mono mt-0.5">
                    UUID: {inspectingLog.id}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setInspectingLog(null)}
                className="p-2 text-[#7D6871] hover:text-[#2C1E23] hover:bg-[#F2D6DE]/60 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#2C1E23]">
              {/* Primary Attributes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#FAF6F7] border border-[#F2D6DE]">
                <div>
                  <div className="text-[10px] font-bold text-[#7D6871] uppercase">Fecha y Hora</div>
                  <div className="font-mono font-medium text-[#2C1E23] mt-0.5">
                    {inspectingLog.timestamp}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#7D6871] uppercase">Usuario Responsable</div>
                  <div className="font-semibold text-[#2C1E23] mt-0.5">
                    {inspectingLog.userName}
                  </div>
                  <div className="text-[10px] text-[#7D6871]">ID: {inspectingLog.userId}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#7D6871] uppercase">Rol en Sesión</div>
                  <div className="font-medium text-[#681B2B] mt-0.5">{inspectingLog.userRole}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#7D6871] uppercase">Módulo</div>
                  <div className="font-semibold text-[#2C1E23] mt-0.5">{inspectingLog.module}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#7D6871] uppercase">Tipo de Entidad</div>
                  <div className="font-mono text-[#2C1E23] mt-0.5">{inspectingLog.entityType}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#7D6871] uppercase">Identificador Registro</div>
                  <div className="font-mono font-bold text-[#681B2B] mt-0.5">
                    {inspectingLog.recordId}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-[#7D6871] uppercase mb-1">
                  Descripción breve del cambio
                </label>
                <div className="p-3 bg-white rounded-xl border border-[#F2D6DE] text-sm text-[#2C1E23] leading-relaxed">
                  {inspectingLog.description}
                </div>
              </div>

              {/* Previous Value vs New Value Comparison */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-[#7D6871] uppercase">
                  Trazabilidad de Valores (Anterior ➔ Nuevo)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Previous */}
                  <div className="p-3.5 rounded-xl bg-rose-50/40 border border-rose-200">
                    <div className="text-[10px] font-bold text-rose-800 uppercase flex items-center gap-1.5 mb-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      Valor Anterior (Previo)
                    </div>
                    {inspectingLog.previousValue ? (
                      <pre className="text-[11px] font-mono text-rose-950 whitespace-pre-wrap break-words bg-white p-2.5 rounded-lg border border-rose-200">
                        {inspectingLog.previousValue}
                      </pre>
                    ) : (
                      <div className="text-rose-600/70 italic text-[11px]">
                        No aplica (Creación de registro inicial o no registrado)
                      </div>
                    )}
                  </div>

                  {/* New */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-200">
                    <div className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1.5 mb-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Valor Nuevo (Resultado)
                    </div>
                    {inspectingLog.newValue ? (
                      <pre className="text-[11px] font-mono text-emerald-950 whitespace-pre-wrap break-words bg-white p-2.5 rounded-lg border border-emerald-200">
                        {inspectingLog.newValue}
                      </pre>
                    ) : (
                      <div className="text-emerald-600/70 italic text-[11px]">
                        No aplica o valor eliminado
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Metadata / SQL JSON column */}
              {inspectingLog.metadata && Object.keys(inspectingLog.metadata).length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-[#7D6871] uppercase mb-1">
                    Metadatos adicionales (columna metadata_json)
                  </label>
                  <pre className="p-3 bg-[#FAF6F7] rounded-xl border border-[#F2D6DE] font-mono text-[11px] text-[#2C1E23] overflow-x-auto">
                    {JSON.stringify(inspectingLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {/* Flask / SQL INSERT equivalent preview */}
              <div>
                <label className="block text-[11px] font-bold text-[#7D6871] uppercase mb-1">
                  Sentencia SQL / Modelo Flask equivalente
                </label>
                <div className="p-3 bg-[#2C1E23] text-emerald-300 font-mono text-[11px] rounded-xl overflow-x-auto">
                  {`INSERT INTO audit_logs (id, timestamp, user_id, user_name, user_role, action, module, entity_type, record_id, description, previous_value, new_value)
VALUES ('${inspectingLog.id}', '${inspectingLog.timestamp}', '${inspectingLog.userId}', '${inspectingLog.userName}', '${inspectingLog.userRole}', '${inspectingLog.action}', '${inspectingLog.module}', '${inspectingLog.entityType}', '${inspectingLog.recordId}', '${inspectingLog.description.replace(/'/g, "''")}', ${inspectingLog.previousValue ? `'${inspectingLog.previousValue.replace(/'/g, "''")}'` : 'NULL'}, ${inspectingLog.newValue ? `'${inspectingLog.newValue.replace(/'/g, "''")}'` : 'NULL'});`}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#F2D6DE] bg-white flex justify-end">
              <button
                onClick={() => setInspectingLog(null)}
                className="px-4 py-2 text-xs font-semibold text-[#2C1E23] bg-[#FAF6F7] hover:bg-[#F2D6DE] rounded-xl transition-colors"
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
