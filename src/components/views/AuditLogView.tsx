import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  History,
  Search,
  Filter,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  Eye,
  X,
  RotateCcw,
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
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Info,
} from 'lucide-react';
import { AuditLogEntry, AuditModule, AuditOperationType } from '../../types';
import {
  exportAuditLogsToCsv,
  exportAuditLogsToJson,
  formatAuditHumanDate,
  resolveOperationType,
} from '../../services/auditService';

interface UserNegativeSummary {
  count: number;
  items: Set<string>;
  user: string;
  role: string;
}

export const AuditLogView: React.FC = () => {
  const { auditLogs, logAction, users } = useApp();

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedOperationType, setSelectedOperationType] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | '7days' | '30days' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [onlyNegativeAdjustments, setOnlyNegativeAdjustments] = useState(false);

  // Selected Log for Inspector Modal
  const [inspectingLog, setInspectingLog] = useState<AuditLogEntry | null>(null);
  const [showSqlSchemaHelp, setShowSqlSchemaHelp] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
    // Prioritize users from context, plus any user recorded in logs
    users.forEach((u) => map.set(u.name, u.name));
    auditLogs.forEach((l) => map.set(l.userName, l.userName));
    return Array.from(map.values()).sort();
  }, [users, auditLogs]);

  const availableOperationTypes = [
    'Salidas y Mermas',
    'Creaciones',
    'Modificaciones',
    'Cambios de estado',
    'Pagos y Abonos',
    'Seguridad y Usuarios',
    'Reportes y Exportaciones',
  ];

  // Pattern Detection: Identify repetitive or unusual behaviors (e.g. multiple negative adjustments/mermas by the same user)
  // Without complex fraud algorithms, purely visual detection and aggregations
  const userNegativeCounts = useMemo(() => {
    const counts: Record<string, UserNegativeSummary> = {};
    auditLogs.forEach((log) => {
      const act = (log.action || '').toLowerCase();
      const desc = (log.description || '').toLowerCase();
      const isNegative =
        act.includes('merma') ||
        act.includes('salida') ||
        desc.includes('merma') ||
        desc.includes('salida de') ||
        (act.includes('ajust') && (desc.includes('negativ') || desc.includes('-')));

      if (isNegative) {
        if (!counts[log.userName]) {
          counts[log.userName] = {
            count: 0,
            items: new Set(),
            user: log.userName,
            role: log.userRole,
          };
        }
        counts[log.userName].count += 1;
        if (log.recordId) {
          counts[log.userName].items.add(log.recordId);
        }
      }
    });
    return counts;
  }, [auditLogs]);

  // Detected repetitive patterns (users with 2 or more negative adjustments or mermas)
  const repetitiveNegativeUsers = useMemo(() => {
    return (Object.values(userNegativeCounts) as UserNegativeSummary[]).filter((item) => item.count >= 2);
  }, [userNegativeCounts]);

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

  // Helper to determine if a log is a negative stock adjustment / merma
  const isNegativeLog = (log: AuditLogEntry) => {
    const act = (log.action || '').toLowerCase();
    const desc = (log.description || '').toLowerCase();
    return (
      act.includes('merma') ||
      act.includes('salida') ||
      desc.includes('merma') ||
      desc.includes('salida de') ||
      (act.includes('ajust') && (desc.includes('negativ') || desc.includes('-')))
    );
  };

  // Filtering
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      // Negative only shortcut
      if (onlyNegativeAdjustments && !isNegativeLog(log)) {
        return false;
      }

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

      // Operation Type
      if (selectedOperationType !== 'all') {
        const opType = log.operationType || resolveOperationType(log.action, log.module);
        if (opType !== selectedOperationType) {
          return false;
        }
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
    selectedAction,
    selectedOperationType,
    selectedUser,
    startDate,
    endDate,
    onlyNegativeAdjustments,
  ]);

  // Stats
  const totalNegativeLogs = useMemo(() => {
    return auditLogs.filter(isNegativeLog).length;
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
      description: `Licda. Elena Soto exportó la bitácora de auditoría a formato CSV (${filteredLogs.length} registros).`,
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
      description: `Licda. Elena Soto exportó la bitácora de auditoría a formato JSON SQL-Ready (${filteredLogs.length} registros).`,
      previousValue: null,
      newValue: `JSON con ${filteredLogs.length} eventos estructurados`,
      metadata: { format: 'JSON', count: filteredLogs.length },
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedModule('all');
    setSelectedAction('all');
    setSelectedOperationType('all');
    setSelectedUser('all');
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
    setOnlyNegativeAdjustments(false);
    setCurrentPage(1);
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
      {/* Header and Controls */}
      <div className="bg-white rounded-2xl p-6 border border-[#F2D6DE]/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
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
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-audit-sql-info"
              onClick={() => setShowSqlSchemaHelp(!showSqlSchemaHelp)}
              className="px-3 py-2 text-xs font-semibold text-[#681B2B] bg-[#FBECEF] hover:bg-[#F2D6DE] rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{showSqlSchemaHelp ? 'Ocultar esquema SQL' : 'Esquema SQL/Flask'}</span>
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

        {/* Repetitive / Unusual Pattern Visual Alert Banner */}
        {repetitiveNegativeUsers.length > 0 && (
          <div className="mt-5 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-amber-950">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                    <span>Comportamiento inusual o repetitivo detectado</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-200/80 font-semibold text-amber-950">
                      Supervisión visual
                    </span>
                  </h4>
                  <button
                    onClick={() => {
                      setOnlyNegativeAdjustments(!onlyNegativeAdjustments);
                      setCurrentPage(1);
                    }}
                    className={`text-xs font-semibold px-3 py-1 rounded-xl transition-colors ${
                      onlyNegativeAdjustments
                        ? 'bg-amber-800 text-white'
                        : 'bg-white border border-amber-300 text-amber-900 hover:bg-amber-100'
                    }`}
                  >
                    {onlyNegativeAdjustments ? 'Mostrando solo mermas y salidas' : 'Filtrar solo mermas y salidas'}
                  </button>
                </div>
                <p className="text-xs text-amber-900/90 leading-relaxed">
                  Se registraron múltiples ajustes negativos o salidas de inventario por el mismo colaborador en el historial reciente:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {repetitiveNegativeUsers.map((item) => (
                    <div
                      key={item.user}
                      className="bg-white/90 p-3 rounded-xl border border-amber-200 flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div>
                        <div className="font-semibold text-xs text-[#2C1E23]">{item.user}</div>
                        <div className="text-[11px] text-amber-800">
                          {item.count} salidas por merma registradas ({Array.from(item.items).slice(0, 2).join(', ')}
                          {item.items.size > 2 ? ` y ${item.items.size - 2} más` : ''})
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedUser(item.user);
                          setOnlyNegativeAdjustments(true);
                          setCurrentPage(1);
                        }}
                        className="text-[11px] font-bold text-[#681B2B] hover:text-[#521522] bg-[#FBECEF] px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap"
                      >
                        Inspeccionar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-5 border border-[#F2D6DE]/80 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#2C1E23] uppercase tracking-wide">
            <Filter className="w-3.5 h-3.5 text-[#681B2B]" />
            <span>Filtros de auditoría</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Toggle for Mermas */}
            <button
              onClick={() => {
                setOnlyNegativeAdjustments(!onlyNegativeAdjustments);
                setCurrentPage(1);
              }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                onlyNegativeAdjustments
                  ? 'bg-amber-600 border-amber-700 text-white shadow-2xs'
                  : 'bg-[#FAF6F7] border-[#F2D6DE] text-[#2C1E23] hover:bg-[#FBECEF]'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Mermas y salidas ({totalNegativeLogs})</span>
            </button>

            {(searchTerm ||
              selectedModule !== 'all' ||
              selectedAction !== 'all' ||
              selectedOperationType !== 'all' ||
              selectedUser !== 'all' ||
              startDate ||
              endDate ||
              onlyNegativeAdjustments ||
              datePreset !== 'all') && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-semibold text-[#681B2B] hover:text-[#521522] flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-[#FBECEF] transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restablecer</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#7D6871] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="input-audit-search"
            type="text"
            placeholder="Buscar por detalle legible, usuario, acción, código (#PED-0017) o flor..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-[#FAF6F7] border border-[#F2D6DE] rounded-xl text-[#2C1E23] placeholder-[#7D6871]/70 focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20 focus:border-[#681B2B] transition-all"
          />
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-1 text-xs">
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

          {/* 4. Acción */}
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

          {/* 5. Tipo de Operación */}
          <div>
            <label className="block text-[11px] font-semibold text-[#7D6871] mb-1">Tipo de Operación</label>
            <select
              id="select-audit-operation-type"
              value={selectedOperationType}
              onChange={(e) => {
                setSelectedOperationType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-white border border-[#F2D6DE] rounded-xl text-[#2C1E23] focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20"
            >
              <option value="all">Todos los tipos</option>
              {availableOperationTypes.map((op) => (
                <option key={op} value={op}>
                  {op}
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
            {onlyNegativeAdjustments && (
              <span className="ml-2 text-[11px] px-2 py-0.5 bg-amber-100 text-amber-900 font-semibold rounded-full">
                Filtro activo: Mermas y salidas
              </span>
            )}
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
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#2C1E23]">
              {/* Columns explicitly requested:
                  Fecha y hora | Usuario | Acción | Módulo | Registro | Detalle */}
              <thead className="bg-[#FAF6F7] text-[11px] font-bold text-[#7D6871] uppercase tracking-wider border-b border-[#F2D6DE]">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">Fecha y hora</th>
                  <th className="px-4 py-3 whitespace-nowrap">Usuario</th>
                  <th className="px-4 py-3 whitespace-nowrap">Acción</th>
                  <th className="px-4 py-3 whitespace-nowrap">Módulo</th>
                  <th className="px-4 py-3 whitespace-nowrap">Registro</th>
                  <th className="px-4 py-3">Detalle</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">Consulta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2D6DE]/60">
                {paginatedLogs.map((log) => {
                  const mod = getModuleBadge(log.module);
                  const ModIcon = mod.icon;
                  const dateInfo = formatAuditHumanDate(log.timestamp);
                  const isNegative = isNegativeLog(log);
                  const userCount = userNegativeCounts[log.userName]?.count || 0;
                  const hasRepetitiveWarning = isNegative && userCount >= 2;

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setInspectingLog(log)}
                      className={`transition-colors group cursor-pointer ${
                        hasRepetitiveWarning
                          ? 'bg-amber-50/40 hover:bg-amber-100/50 border-l-4 border-l-amber-500'
                          : 'hover:bg-[#FBECEF]/20'
                      }`}
                    >
                      {/* 1. Fecha y hora */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-medium text-[#2C1E23]">{dateInfo.relative}</div>
                        <div className="text-[10px] text-[#7D6871] font-mono">{log.timestamp.split('T')[0]}</div>
                      </td>

                      {/* 2. Usuario */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-[#2C1E23] flex items-center gap-1.5">
                          <span>{log.userName}</span>
                          {hasRepetitiveWarning && (
                            <span
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200/90 text-amber-950"
                              title={`Usuario con ${userCount} salidas por merma registradas`}
                            >
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-700" />
                              {userCount} salidas
                            </span>
                          )}
                        </div>
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

                      {/* 6. Detalle (Microcopy Humana) */}
                      <td className="px-4 py-3.5 text-[#2C1E23]">
                        <div className="font-medium leading-relaxed">{log.description}</div>
                        {(log.previousValue || log.newValue) && (
                          <div className="text-[10px] text-[#7D6871] mt-0.5 flex items-center gap-1">
                            <Info className="w-3 h-3 text-[#681B2B]" />
                            <span>Registra valores anteriores y nuevos comparables</span>
                          </div>
                        )}
                      </td>

                      {/* Action to open event */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectingLog(log);
                          }}
                          className="px-2.5 py-1.5 text-xs font-semibold text-[#681B2B] bg-[#FBECEF] hover:bg-[#F2D6DE] rounded-xl transition-colors inline-flex items-center gap-1 shadow-2xs"
                          title="Abrir evento para consultar cambios"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver cambios</span>
                        </button>
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

      {/* Inspect Event Modal - Allows inspecting previous and new values */}
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
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-[#681B2B]/10 text-[#681B2B]">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-[#2C1E23] flex items-center gap-2">
                    <span>Detalle del Evento</span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getActionBadge(
                        inspectingLog.action
                      )}`}
                    >
                      {inspectingLog.action}
                    </span>
                  </h3>
                  <div className="text-xs text-[#7D6871] mt-0.5">
                    {formatAuditHumanDate(inspectingLog.timestamp).full}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setInspectingLog(null)}
                className="p-2 text-[#7D6871] hover:text-[#2C1E23] hover:bg-[#F2D6DE]/60 rounded-xl transition-colors"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#2C1E23]">
              {/* Human Microcopy Highlight Card */}
              <div className="p-4 rounded-xl bg-[#FBECEF]/60 border border-[#F2D6DE] space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#681B2B]">
                  Descripción del Movimiento
                </div>
                <div className="text-sm font-semibold text-[#2C1E23] leading-relaxed">
                  {inspectingLog.description}
                </div>
              </div>

              {/* Repetitive Pattern Alert (if applicable to this user/action) */}
              {isNegativeLog(inspectingLog) && userNegativeCounts[inspectingLog.userName]?.count >= 2 && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <div className="text-xs leading-relaxed">
                    <strong>Observación visual:</strong> {inspectingLog.userName} acumula{' '}
                    <strong>{userNegativeCounts[inspectingLog.userName].count} salidas por merma</strong> en el historial.
                  </div>
                </div>
              )}

              {/* Primary Event Meta */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#FAF6F7] border border-[#F2D6DE]">
                <div>
                  <div className="text-[10px] font-bold text-[#7D6871] uppercase">Usuario Responsable</div>
                  <div className="font-semibold text-[#2C1E23] mt-0.5">{inspectingLog.userName}</div>
                  <div className="text-[10px] text-[#7D6871]">{inspectingLog.userRole}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#7D6871] uppercase">Módulo</div>
                  <div className="font-semibold text-[#2C1E23] mt-0.5">{inspectingLog.module}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#7D6871] uppercase">Registro / Código</div>
                  <div className="font-mono font-bold text-[#681B2B] mt-0.5">{inspectingLog.recordId}</div>
                </div>
              </div>

              {/* Previous Value vs New Value Comparison */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#7D6871] uppercase">
                    Consulta de Cambios (Valor Anterior ➔ Valor Nuevo)
                  </label>
                  {(inspectingLog.previousValue || inspectingLog.newValue) && (
                    <span className="text-[10px] text-[#7D6871]">Comparativa directa</span>
                  )}
                </div>

                {inspectingLog.previousValue || inspectingLog.newValue ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Previous Value */}
                    <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                      <div className="text-[10px] font-bold text-[#7D6871] uppercase flex items-center gap-1.5 mb-1.5">
                        <span className="w-2 h-2 rounded-full bg-stone-400"></span>
                        Valor Anterior (Antes del cambio)
                      </div>
                      {inspectingLog.previousValue ? (
                        <pre className="text-[11px] font-mono text-[#2C1E23] whitespace-pre-wrap break-words bg-white p-2.5 rounded-lg border border-stone-200">
                          {inspectingLog.previousValue}
                        </pre>
                      ) : (
                        <div className="text-stone-500 italic text-[11px] py-1">
                          No existía un valor anterior (Registro inicial o creación).
                        </div>
                      )}
                    </div>

                    {/* New Value */}
                    <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200">
                      <div className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1.5 mb-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Valor Nuevo (Resultado aplicado)
                      </div>
                      {inspectingLog.newValue ? (
                        <pre className="text-[11px] font-mono text-emerald-950 whitespace-pre-wrap break-words bg-white p-2.5 rounded-lg border border-emerald-200 font-medium">
                          {inspectingLog.newValue}
                        </pre>
                      ) : (
                        <div className="text-emerald-700 italic text-[11px] py-1">
                          Registro eliminado o sin valor resultante.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-stone-600 text-xs text-center">
                    Este evento no contiene variaciones estructuradas de campos anteriores o nuevos.
                  </div>
                )}
              </div>

              {/* Technical / SQL Reference Section */}
              <div className="pt-2 border-t border-[#F2D6DE]/60 space-y-2">
                <div className="text-[10px] font-bold text-[#7D6871] uppercase">
                  Identificador y compatibilidad SQL (Flask audit_logs)
                </div>
                <div className="p-3 bg-[#2C1E23] text-emerald-300 font-mono text-[10px] rounded-xl overflow-x-auto leading-relaxed">
                  {`INSERT INTO audit_logs (id, timestamp, user_name, user_role, action, module, record_id, description)
VALUES ('${inspectingLog.id}', '${inspectingLog.timestamp}', '${inspectingLog.userName}', '${inspectingLog.userRole}', '${inspectingLog.action}', '${inspectingLog.module}', '${inspectingLog.recordId}', '${inspectingLog.description.replace(/'/g, "''")}');`}
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
