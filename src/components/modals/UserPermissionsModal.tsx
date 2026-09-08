import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { PermissionCode, PermissionModule } from '../../types/permissions';
import {
  PERMISSION_DEFINITIONS,
  ROLE_DEFAULT_PERMISSIONS,
  getPermissionsGroupedByModule,
} from '../../services/permissionsService';
import { Modal } from '../common/Modal';
import {
  Check,
  X,
  Search,
  FileText,
  Users as UsersIcon,
  Package,
  CalendarDays,
  BarChart3,
  UserCheck,
  Settings,
  History,
} from 'lucide-react';

interface UserPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: User | null;
  onSave: (userId: string, newPermissions: Partial<Record<PermissionCode, boolean>>) => void;
}

/**
 * Aclaraciones breves para permisos que requieren contexto operativo específico.
 * Se omiten en permisos cuyo nombre ya es autoexplicativo ("Ver pedidos", "Crear pedidos", etc.).
 */
const PERMISSION_BRIEF_CLARIFICATIONS: Partial<Record<PermissionCode, string>> = {
  'orders.change_status': 'Avanzar pedidos (preparación, listo, entregado) o cancelaciones.',
  'payments.register': 'Registrar anticipos, abonos parciales y liquidación de saldos.',
  'stock.adjust': 'Registrar entradas directas y salidas por merma o marchitez.',
  'reports.export': 'Descarga de reportes en archivos CSV o Excel.',
  'users.manage': 'Crear cuentas, cambiar roles, asignar permisos y restablecer contraseñas.',
  'settings.manage': 'Modificar catálogos del taller (canales, categorías) y políticas.',
  'audit.view': 'Consultar el registro inmutable de eventos y cambios del sistema.',
};

export const UserPermissionsModal: React.FC<UserPermissionsModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  onSave,
}) => {
  const [overrides, setOverrides] = useState<Partial<Record<PermissionCode, boolean>>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('all');

  // Sincronizar estado cuando se abre la modal con el usuario seleccionado
  useEffect(() => {
    if (targetUser && isOpen) {
      setOverrides(targetUser.permissions ? { ...targetUser.permissions } : {});
      setSearchTerm('');
      setSelectedModuleFilter('all');
    }
  }, [targetUser, isOpen]);

  if (!targetUser) return null;

  const roleDefaults = ROLE_DEFAULT_PERMISSIONS[targetUser.role] || {};

  /**
   * Obtiene el acceso efectivo actual del permiso (prioridad: excepción individual > rol base).
   */
  const getEffectivePermission = (code: PermissionCode): boolean => {
    if (Object.prototype.hasOwnProperty.call(overrides, code)) {
      return Boolean(overrides[code]);
    }
    return Boolean(roleDefaults[code]);
  };

  /**
   * Modifica el permiso de forma explícita.
   * Si el nuevo estado coincide con el rol por defecto, se elimina la excepción
   * para conservar la herencia limpia del rol.
   */
  const handleTogglePermission = (code: PermissionCode, grant: boolean) => {
    const roleDefault = Boolean(roleDefaults[code]);
    setOverrides((prev) => {
      const next = { ...prev };
      if (grant === roleDefault) {
        delete next[code];
      } else {
        next[code] = grant;
      }
      return next;
    });
  };

  /**
   * Guarda únicamente las excepciones explícitas configuradas por el administrador.
   */
  const handleSave = () => {
    onSave(targetUser.id, overrides);
    onClose();
  };

  // Agrupación por módulo
  const grouped = getPermissionsGroupedByModule();
  const moduleKeys = Object.keys(grouped) as PermissionModule[];

  // Conteo de permisos activos
  const totalPermissions = PERMISSION_DEFINITIONS.length;
  const activeGrantedCount = PERMISSION_DEFINITIONS.filter((def) =>
    getEffectivePermission(def.code)
  ).length;

  // Filtrado por texto y módulo
  const filterMatches = (def: (typeof PERMISSION_DEFINITIONS)[0]) => {
    if (selectedModuleFilter !== 'all' && def.module !== selectedModuleFilter) {
      return false;
    }
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const clarification = PERMISSION_BRIEF_CLARIFICATIONS[def.code]?.toLowerCase() || '';
    return (
      def.name.toLowerCase().includes(term) ||
      def.module.toLowerCase().includes(term) ||
      clarification.includes(term)
    );
  };

  const getModuleIcon = (module: PermissionModule) => {
    switch (module) {
      case 'Pedidos':
        return <FileText className="w-3.5 h-3.5 text-[#681B2B]" />;
      case 'Clientes':
        return <UsersIcon className="w-3.5 h-3.5 text-blue-700" />;
      case 'Inventario':
        return <Package className="w-3.5 h-3.5 text-emerald-700" />;
      case 'Agenda':
        return <CalendarDays className="w-3.5 h-3.5 text-amber-700" />;
      case 'Reportes':
        return <BarChart3 className="w-3.5 h-3.5 text-purple-700" />;
      case 'Usuarios':
        return <UserCheck className="w-3.5 h-3.5 text-pink-700" />;
      case 'Configuración':
        return <Settings className="w-3.5 h-3.5 text-stone-700" />;
      case 'Auditoría':
        return <History className="w-3.5 h-3.5 text-rose-700" />;
    }
  };

  return (
    <Modal
      id="modal-user-permissions"
      isOpen={isOpen}
      onClose={onClose}
      title="Permisos del usuario"
      size="permissions"
      footer={
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 w-full">
          <div className="text-xs text-[#7D6871]">
            <span className="font-bold text-[#2C1E23]">{activeGrantedCount}</span> de{' '}
            <span>{totalPermissions} permitidos</span>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              id="btn-cancel-user-permissions"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-semibold text-[#7D6871] hover:text-[#2C1E23] rounded-xl hover:bg-stone-100 cursor-pointer min-h-[40px] sm:min-h-[36px] flex items-center justify-center transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              id="btn-save-user-permissions"
              onClick={handleSave}
              className="w-full sm:w-auto px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[#681B2B] hover:bg-[#531422] rounded-xl cursor-pointer shadow-xs flex items-center justify-center gap-1.5 min-h-[40px] sm:min-h-[36px] transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Guardar cambios
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Cabecera de usuario y rol */}
        <div className="bg-[#FAF6F4] p-3.5 rounded-2xl border border-[#F2D6DE] flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#681B2B] text-white font-bold flex items-center justify-center text-sm shadow-2xs shrink-0">
            {targetUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-[#2C1E23]">{targetUser.name}</h4>
              <span className="text-xs text-[#7D6871] font-mono">@{targetUser.username}</span>
            </div>
            <p className="text-xs text-[#7D6871] mt-0.5">
              Rol: <strong className="text-[#681B2B] font-semibold">{targetUser.role}</strong>
            </p>
          </div>
        </div>

        {/* Barra de búsqueda y filtro por módulo */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#7D6871] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="input-search-permission"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar permiso"
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#F2D6DE] text-xs text-[#2C1E23] placeholder-[#7D6871]/60 focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              id="select-module-filter"
              value={selectedModuleFilter}
              onChange={(e) => setSelectedModuleFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#F2D6DE] text-xs font-semibold text-[#2C1E23] bg-white focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20"
            >
              <option value="all">Todos los módulos</option>
              {moduleKeys.map((mod) => (
                <option key={mod} value={mod}>
                  {mod}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista de permisos agrupados por módulo */}
        <div className="space-y-4">
          {moduleKeys.map((mod) => {
            const moduleDefs = grouped[mod].filter(filterMatches);
            if (moduleDefs.length === 0) return null;

            return (
              <div
                key={mod}
                className="border border-[#F2D6DE]/70 rounded-2xl overflow-hidden bg-white shadow-2xs"
              >
                {/* Cabecera del módulo */}
                <div className="bg-[#FBECEF]/40 px-4 py-2.5 border-b border-[#F2D6DE]/60 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#2C1E23]">
                    {getModuleIcon(mod)}
                    <span>Módulo de {mod}</span>
                    <span className="text-[10px] bg-white border border-[#F2D6DE] text-[#7D6871] px-1.5 py-0.2 rounded-full font-medium">
                      {moduleDefs.length} {moduleDefs.length === 1 ? 'permiso' : 'permisos'}
                    </span>
                  </div>
                </div>

                {/* Filas de permisos */}
                <div className="divide-y divide-[#F2D6DE]/30">
                  {moduleDefs.map((def) => {
                    const isGranted = getEffectivePermission(def.code);
                    const clarification = PERMISSION_BRIEF_CLARIFICATIONS[def.code];

                    return (
                      <div
                        key={def.code}
                        id={`perm-row-${def.code.replace('.', '-')}`}
                        className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:bg-[#FAF6F4]/50"
                      >
                        {/* Información del permiso: Nombre y aclaración breve si es necesaria */}
                        <div className="min-w-0 flex-1">
                          <span className="text-xs sm:text-sm font-bold text-[#2C1E23]">
                            {def.name}
                          </span>
                          {clarification && (
                            <p className="text-[11px] text-[#7D6871] leading-relaxed mt-0.5">
                              {clarification}
                            </p>
                          )}
                        </div>

                        {/* Opciones Conceder / Denegar accesibles y de selección visible */}
                        <div className="inline-flex rounded-xl bg-stone-100 p-0.5 border border-stone-200 text-xs shrink-0 self-start sm:self-center">
                          <button
                            type="button"
                            id={`btn-grant-${def.code.replace('.', '-')}`}
                            onClick={() => handleTogglePermission(def.code, true)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                              isGranted
                                ? 'bg-[#681B2B] text-white shadow-xs font-bold'
                                : 'text-[#7D6871] hover:text-[#2C1E23] hover:bg-white/60'
                            }`}
                            title={`Conceder "${def.name}"`}
                          >
                            <Check
                              className={`w-3.5 h-3.5 ${isGranted ? 'text-white' : 'text-[#7D6871]'}`}
                            />
                            <span>Conceder</span>
                          </button>

                          <button
                            type="button"
                            id={`btn-deny-${def.code.replace('.', '-')}`}
                            onClick={() => handleTogglePermission(def.code, false)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                              !isGranted
                                ? 'bg-[#2C1E23] text-white shadow-xs font-bold'
                                : 'text-[#7D6871] hover:text-[#2C1E23] hover:bg-white/60'
                            }`}
                            title={`Denegar "${def.name}"`}
                          >
                            <X
                              className={`w-3.5 h-3.5 ${!isGranted ? 'text-white' : 'text-[#7D6871]'}`}
                            />
                            <span>Denegar</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
