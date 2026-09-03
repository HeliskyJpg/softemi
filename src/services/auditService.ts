import { AuditLogEntry, AuditOperationType, LogActionParams, User } from '../types';

/**
 * Resolves an operational category from action and module names.
 */
export function resolveOperationType(action: string, module?: string): AuditOperationType {
  const act = (action || '').toLowerCase();
  if (
    act.includes('merma') ||
    act.includes('salida') ||
    act.includes('cancelar') ||
    act.includes('desactivar') ||
    act.includes('inactivar') ||
    act.includes('eliminar')
  ) {
    return 'Salidas y Mermas';
  }
  if (
    act.includes('crear') ||
    act.includes('entrada') ||
    act.includes('alta') ||
    act.includes('nuevo')
  ) {
    return 'Creaciones';
  }
  if (
    act.includes('estado') ||
    act.includes('listo') ||
    act.includes('entregado') ||
    act.includes('preparar')
  ) {
    return 'Cambios de estado';
  }
  if (
    act.includes('pago') ||
    act.includes('abono') ||
    act.includes('anticipo') ||
    act.includes('liquidar') ||
    act.includes('cobro')
  ) {
    return 'Pagos y Abonos';
  }
  if (
    act.includes('rol') ||
    act.includes('contraseña') ||
    act.includes('usuario') ||
    act.includes('seguridad')
  ) {
    return 'Seguridad y Usuarios';
  }
  if (
    act.includes('reporte') ||
    act.includes('exportar')
  ) {
    return 'Reportes y Exportaciones';
  }
  return 'Modificaciones';
}

/**
 * Formats ISO timestamp into warm human-readable representations.
 */
export function formatAuditHumanDate(isoString: string): { relative: string; date: string; time: string; full: string } {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      return { relative: isoString, date: isoString, time: '', full: isoString };
    }
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    
    const timeStr = d.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = d.toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' });
    
    let relative = dateStr;
    if (isToday) {
      relative = `Hoy, ${timeStr}`;
    } else if (isYesterday) {
      relative = `Ayer, ${timeStr}`;
    } else {
      relative = `${dateStr}, ${timeStr}`;
    }

    return {
      relative,
      date: dateStr,
      time: timeStr,
      full: `${dateStr} a las ${timeStr}`,
    };
  } catch {
    return { relative: isoString, date: isoString, time: '', full: isoString };
  }
}

/**
 * Serializes any data type into a clean string representation suitable for
 * storage in a SQL database TEXT/VARCHAR column (or display in UI).
 */
export function serializeAuditValue(val: unknown): string | null {
  if (val === undefined || val === null) {
    return null;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof val === 'number' || typeof val === 'boolean') {
    return String(val);
  }
  if (val instanceof Date) {
    return val.toISOString();
  }
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
  return String(val);
}

/**
 * Formats a serialized audit value into a user-friendly display string.
 */
export function formatAuditDisplayValue(val: string | null): string {
  if (val === null || val === undefined || val === '') {
    return '—';
  }
  // If it's a JSON object or array, try formatting nicely
  if ((val.startsWith('{') && val.endsWith('}')) || (val.startsWith('[') && val.endsWith(']'))) {
    try {
      const parsed = JSON.parse(val);
      if (typeof parsed === 'object' && parsed !== null) {
        return Object.entries(parsed)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
      }
    } catch {
      // Return raw string if JSON parse fails
    }
  }
  return val;
}

/**
 * Creates an AuditLogEntry adhering strictly to the EMILA Audit Schema.
 * Designed to map directly to a Flask/SQLAlchemy `audit_logs` table.
 */
export function createAuditLogEntry(
  params: LogActionParams,
  currentUser?: User | null
): AuditLogEntry {
  const user = params.user || currentUser || {
    id: 'system',
    name: 'Sistema EMILA',
    username: 'sistema',
    role: 'Administrador' as const,
  };

  const id = `aud-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const timestamp = new Date().toISOString();

  return {
    id,
    timestamp,
    userId: user.id || 'usr-system',
    userName: user.name || user.username || 'Usuario Sistema',
    userRole: user.role || 'Colaborador',
    action: params.action.trim(),
    module: params.module,
    entityType: params.entityType,
    recordId: String(params.recordId || '').trim(),
    description: params.description.trim(),
    operationType: params.operationType || resolveOperationType(params.action, params.module),
    previousValue: serializeAuditValue(params.previousValue),
    newValue: serializeAuditValue(params.newValue),
    metadata: params.metadata,
  };
}

/**
 * Filters audit logs by query, module, action, user, and date range.
 */
export interface AuditFilterOptions {
  searchTerm?: string;
  module?: string;
  action?: string;
  user?: string;
  startDate?: string;
  endDate?: string;
}

export function filterAuditLogs(
  logs: AuditLogEntry[],
  filters: AuditFilterOptions
): AuditLogEntry[] {
  return logs.filter((log) => {
    // Search term in recordId, description, user, action
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase().trim();
      const matchSearch =
        log.recordId.toLowerCase().includes(term) ||
        log.description.toLowerCase().includes(term) ||
        log.userName.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term) ||
        log.entityType.toLowerCase().includes(term);

      if (!matchSearch) return false;
    }

    // Module filter
    if (filters.module && filters.module !== 'Todos') {
      if (log.module !== filters.module) return false;
    }

    // Action filter
    if (filters.action && filters.action !== 'Todas') {
      if (log.action.toLowerCase() !== filters.action.toLowerCase()) return false;
    }

    // User filter
    if (filters.user && filters.user !== 'Todos') {
      if (log.userName !== filters.user && log.userId !== filters.user) return false;
    }

    // Date range filter
    const logDate = log.timestamp.split('T')[0];
    if (filters.startDate && logDate < filters.startDate) {
      return false;
    }
    if (filters.endDate && logDate > filters.endDate) {
      return false;
    }

    return true;
  });
}

/**
 * Converts audit logs to CSV string format for easy download/export.
 */
export function exportAuditLogsToCSV(logs: AuditLogEntry[]): string {
  const headers = [
    'ID',
    'Fecha y Hora (ISO)',
    'Fecha Local',
    'Usuario',
    'Rol',
    'Modulo',
    'Tipo Entidad',
    'ID Registro',
    'Accion',
    'Descripcion',
    'Valor Anterior',
    'Valor Nuevo',
  ];

  const escapeCSV = (val: unknown): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = logs.map((l) => {
    const localDate = new Date(l.timestamp).toLocaleString('es-GT', {
      timeZone: 'America/Guatemala',
    });
    return [
      escapeCSV(l.id),
      escapeCSV(l.timestamp),
      escapeCSV(localDate),
      escapeCSV(l.userName),
      escapeCSV(l.userRole),
      escapeCSV(l.module),
      escapeCSV(l.entityType),
      escapeCSV(l.recordId),
      escapeCSV(l.action),
      escapeCSV(l.description),
      escapeCSV(l.previousValue ?? ''),
      escapeCSV(l.newValue ?? ''),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Triggers a browser download of CSV text data.
 */
export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Triggers a browser download of JSON text data.
 */
export function downloadJSON(filename: string, data: unknown): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convenience helper to export and trigger CSV download
 */
export function exportAuditLogsToCsv(logs: AuditLogEntry[], filename?: string): void {
  const content = exportAuditLogsToCSV(logs);
  const name = filename || `bitacora_emila_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(name, content);
}

/**
 * Convenience helper to export and trigger JSON download
 */
export function exportAuditLogsToJson(logs: AuditLogEntry[], filename?: string): void {
  const name = filename || `bitacora_emila_${new Date().toISOString().split('T')[0]}.json`;
  downloadJSON(name, logs);
}

