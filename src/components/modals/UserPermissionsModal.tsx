import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import {
  PermissionCode,
  PermissionModule,
  PermissionOverrideState,
} from '../../types/permissions';
import {
  PERMISSION_DEFINITIONS,
  ROLE_DEFAULT_PERMISSIONS,
  getPermissionsGroupedByModule,
  FLASK_SQLALCHEMY_SCHEMA_CODE,
} from '../../services/permissionsService';
import { Modal } from '../common/Modal';
import {
  Shield,
  Key,
  Check,
  X,
  RotateCcw,
  Sparkles,
  Search,
  Code2,
  Copy,
  ChevronDown,
  ChevronUp,
  AlertCircle,
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

export const UserPermissionsModal: React.FC<UserPermissionsModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  onSave,
}) => {
  const [overrides, setOverrides] = useState<Partial<Record<PermissionCode, boolean>>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('all');
  const [showFlaskCode, setShowFlaskCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Sync state with selected user
  useEffect(() => {
    if (targetUser) {
      setOverrides(targetUser.permissions ? { ...targetUser.permissions } : {});
      setSearchTerm('');
      setSelectedModuleFilter('all');
      setShowFlaskCode(false);
    }
  }, [targetUser, isOpen]);

  if (!targetUser) return null;

  const roleDefaults = ROLE_DEFAULT_PERMISSIONS[targetUser.role] || {};

  // Compute effective permission for a code
  const getPermissionState = (code: PermissionCode): {
    overrideState: PermissionOverrideState;
    effective: boolean;
    roleDefault: boolean;
    isOverridden: boolean;
  } => {
    const roleDefault = roleDefaults[code] ?? false;
    if (Object.prototype.hasOwnProperty.call(overrides, code)) {
      const val = overrides[code];
      if (val === true) {
        return { overrideState: 'granted', effective: true, roleDefault, isOverridden: true };
      } else if (val === false) {
        return { overrideState: 'denied', effective: false, roleDefault, isOverridden: true };
      }
    }
    return { overrideState: 'inherited', effective: roleDefault, roleDefault, isOverridden: false };
  };

  const handleSetOverride = (code: PermissionCode, state: PermissionOverrideState) => {
    setOverrides((prev) => {
      const next = { ...prev };
      if (state === 'inherited') {
        delete next[code];
      } else if (state === 'granted') {
        next[code] = true;
      } else if (state === 'denied') {
        next[code] = false;
      }
      return next;
    });
  };

  // Presets
  const handleResetToRoleDefaults = () => {
    setOverrides({});
  };

  const handleGrantAll = () => {
    const allGranted: Partial<Record<PermissionCode, boolean>> = {};
    PERMISSION_DEFINITIONS.forEach((def) => {
      allGranted[def.code] = true;
    });
    setOverrides(allGranted);
  };

  const handleReadOnlyPreset = () => {
    const readOnly: Partial<Record<PermissionCode, boolean>> = {
      'orders.view': true,
      'orders.create': false,
      'orders.edit': false,
      'orders.change_status': false,
      'payments.register': false,
      'clients.view': true,
      'clients.edit': false,
      'stock.view': true,
      'stock.adjust': false,
      'calendar.view': true,
      'reports.view': true,
      'reports.export': false,
      'users.view': false,
      'users.manage': false,
      'settings.manage': false,
      'audit.view': false,
    };
    setOverrides(readOnly);
  };

  const handleSave = () => {
    onSave(targetUser.id, overrides);
    onClose();
  };

  const handleCopyFlaskCode = () => {
    navigator.clipboard.writeText(FLASK_SQLALCHEMY_SCHEMA_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Grouped definitions
  const grouped = getPermissionsGroupedByModule();
  const moduleKeys = Object.keys(grouped) as PermissionModule[];

  // Statistics
  const totalPermissions = PERMISSION_DEFINITIONS.length;
  const activeGrantedCount = PERMISSION_DEFINITIONS.filter(
    (def) => getPermissionState(def.code).effective
  ).length;
  const totalOverridesCount = Object.keys(overrides).length;

  // Filter definitions
  const filterMatches = (def: (typeof PERMISSION_DEFINITIONS)[0]) => {
    if (selectedModuleFilter !== 'all' && def.module !== selectedModuleFilter) {
      return false;
    }
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      def.code.toLowerCase().includes(term) ||
      def.name.toLowerCase().includes(term) ||
      def.description.toLowerCase().includes(term) ||
      def.module.toLowerCase().includes(term)
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
      title="Gestión de Permisos Granulares"
      subtitle={`Usuario: ${targetUser.name} (@${targetUser.username}) — Rol base: ${targetUser.role}`}
      size="xl"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2 text-xs text-[#7D6871]">
            <span className="font-bold text-[#2C1E23]">{activeGrantedCount}</span> de{' '}
            <span>{totalPermissions} permitidos</span>
            {totalOverridesCount > 0 ? (
              <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-full text-[11px]">
                {totalOverridesCount} {totalOverridesCount === 1 ? 'ajuste específico' : 'ajustes específicos'}
              </span>
            ) : (
              <span className="bg-stone-100 text-[#7D6871] font-medium px-2 py-0.5 rounded-full text-[11px]">
                Heredando 100% del rol
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              id="btn-cancel-user-permissions"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#7D6871] hover:text-[#2C1E23] rounded-xl hover:bg-stone-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              id="btn-save-user-permissions"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-[#681B2B] hover:bg-[#531422] rounded-xl cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Guardar Permisos Granulares
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* User Summary Header Card */}
        <div className="bg-[#FAF6F4] p-3.5 rounded-2xl border border-[#F2D6DE] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#681B2B] text-white font-bold flex items-center justify-center text-sm shadow-2xs shrink-0">
              {targetUser.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-[#2C1E23]">{targetUser.name}</h4>
                <span className="text-xs text-[#7D6871] font-mono">@{targetUser.username}</span>
              </div>
              <p className="text-[11px] text-[#7D6871]">
                Rol base: <strong className="text-[#681B2B]">{targetUser.role}</strong> &bull;{' '}
                {targetUser.active ? (
                  <span className="text-emerald-700 font-bold">Activo</span>
                ) : (
                  <span className="text-rose-700 font-bold">Inactivo</span>
                )}
              </p>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              id="btn-preset-reset-role"
              onClick={handleResetToRoleDefaults}
              className="px-2.5 py-1 text-[11px] font-semibold text-[#5C3B45] bg-white hover:bg-stone-50 border border-[#F2D6DE] rounded-lg cursor-pointer flex items-center gap-1 transition-colors"
              title="Eliminar todos los ajustes y heredar los valores del rol"
            >
              <RotateCcw className="w-3 h-3 text-[#7D6871]" />
              Valores del rol
            </button>
            <button
              type="button"
              id="btn-preset-grant-all"
              onClick={handleGrantAll}
              className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer flex items-center gap-1 transition-colors"
              title="Conceder todos los permisos a este usuario"
            >
              <Sparkles className="w-3 h-3 text-emerald-600" />
              Conceder todos
            </button>
            <button
              type="button"
              id="btn-preset-read-only"
              onClick={handleReadOnlyPreset}
              className="px-2.5 py-1 text-[11px] font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer flex items-center gap-1 transition-colors"
              title="Asignar permisos de solo consulta (sin modificación)"
            >
              <Shield className="w-3 h-3 text-blue-600" />
              Solo consulta
            </button>
          </div>
        </div>

        {/* Informative Rule Note */}
        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-[#5C3B45] flex items-start gap-2.5 leading-relaxed">
          <Key className="w-4 h-4 text-[#681B2B] shrink-0 mt-0.5" />
          <div>
            <strong>Regla de resolución RBAC granular:</strong> El rol base define los permisos por
            defecto (tabla <em>RolePermission</em>). Los ajustes aquí definidos corresponden a{' '}
            <em>UserPermission</em> y tienen prioridad absoluta sobre el rol (pudiendo conceder
            accesos adicionales o revocar funciones no deseadas).
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#7D6871] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar permiso por código o nombre..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#F2D6DE] text-xs text-[#2C1E23] placeholder-[#7D6871]/60 focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
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

        {/* Permissions Grouped Matrix */}
        <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
          {moduleKeys.map((mod) => {
            const moduleDefs = grouped[mod].filter(filterMatches);
            if (moduleDefs.length === 0) return null;

            return (
              <div key={mod} className="border border-[#F2D6DE]/70 rounded-2xl overflow-hidden bg-white shadow-2xs">
                {/* Module Group Header */}
                <div className="bg-[#FBECEF]/40 px-4 py-2.5 border-b border-[#F2D6DE]/60 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#2C1E23]">
                    {getModuleIcon(mod)}
                    <span>Módulo de {mod}</span>
                    <span className="text-[10px] bg-white border border-[#F2D6DE] text-[#7D6871] px-1.5 py-0.2 rounded-full font-medium">
                      {moduleDefs.length} {moduleDefs.length === 1 ? 'permiso' : 'permisos'}
                    </span>
                  </div>
                </div>

                {/* Permissions Rows in this Module */}
                <div className="divide-y divide-[#F2D6DE]/30">
                  {moduleDefs.map((def) => {
                    const state = getPermissionState(def.code);

                    return (
                      <div
                        key={def.code}
                        id={`perm-row-${def.code.replace('.', '-')}`}
                        className={`p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                          state.isOverridden
                            ? state.effective
                              ? 'bg-emerald-50/40'
                              : 'bg-rose-50/40'
                            : 'hover:bg-[#FAF6F4]/50'
                        }`}
                      >
                        {/* Left: Code, Name, Description */}
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-[#2C1E23]">{def.name}</span>
                            <span className="font-mono text-[10px] font-bold bg-[#FAF6F4] text-[#681B2B] border border-[#F2D6DE] px-2 py-0.2 rounded-md select-all">
                              {def.code}
                            </span>
                            {def.riskLevel && (
                              <span
                                className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded ${
                                  def.riskLevel === 'administrativo'
                                    ? 'bg-rose-100 text-rose-800'
                                    : def.riskLevel === 'sensible'
                                    ? 'bg-amber-100 text-amber-800'
                                    : def.riskLevel === 'operativo'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {def.riskLevel}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#7D6871] leading-relaxed">
                            {def.description}
                          </p>
                        </div>

                        {/* Right: State Selector & Effective Status Badge */}
                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          {/* Segmented 3-state control */}
                          <div className="inline-flex rounded-xl bg-gray-100 p-0.5 border border-gray-200 text-xs">
                            <button
                              type="button"
                              id={`btn-override-inherit-${def.code.replace('.', '-')}`}
                              onClick={() => handleSetOverride(def.code, 'inherited')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                                state.overrideState === 'inherited'
                                  ? 'bg-white text-[#2C1E23] shadow-2xs font-bold'
                                  : 'text-[#7D6871] hover:text-[#2C1E23]'
                              }`}
                              title={`Heredar del rol: ${state.roleDefault ? 'Permitido' : 'Denegado'}`}
                            >
                              Heredar ({state.roleDefault ? 'Sí' : 'No'})
                            </button>

                            <button
                              type="button"
                              id={`btn-override-grant-${def.code.replace('.', '-')}`}
                              onClick={() => handleSetOverride(def.code, 'granted')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
                                state.overrideState === 'granted'
                                  ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                                  : 'text-[#7D6871] hover:text-emerald-700'
                              }`}
                              title="Conceder explícitamente a este usuario"
                            >
                              <Check className="w-3 h-3" />
                              Conceder
                            </button>

                            <button
                              type="button"
                              id={`btn-override-deny-${def.code.replace('.', '-')}`}
                              onClick={() => handleSetOverride(def.code, 'denied')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
                                state.overrideState === 'denied'
                                  ? 'bg-rose-600 text-white shadow-2xs font-bold'
                                  : 'text-[#7D6871] hover:text-rose-700'
                              }`}
                              title="Denegar explícitamente a este usuario"
                            >
                              <X className="w-3 h-3" />
                              Denegar
                            </button>
                          </div>

                          {/* Effective result badge */}
                          <div className="w-24 text-right">
                            {state.effective ? (
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  state.isOverridden
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                }`}
                              >
                                <Check className="w-2.5 h-2.5" />
                                {state.isOverridden ? 'Permitido (esp)' : 'Permitido'}
                              </span>
                            ) : (
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  state.isOverridden
                                    ? 'bg-rose-100 text-rose-900 border-rose-300'
                                    : 'bg-gray-100 text-gray-700 border-gray-200'
                                }`}
                              >
                                <X className="w-2.5 h-2.5" />
                                {state.isOverridden ? 'Denegado (esp)' : 'Denegado'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Expandable Flask / SQLAlchemy Architecture Mapping Card */}
        <div className="border border-[#F2D6DE] rounded-2xl overflow-hidden bg-stone-900 text-stone-100">
          <button
            type="button"
            onClick={() => setShowFlaskCode(!showFlaskCode)}
            className="w-full px-4 py-2.5 bg-stone-950 flex items-center justify-between text-xs font-semibold text-stone-300 hover:text-white cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-400" />
              Arquitectura Flask / SQLAlchemy (Mapeo a tablas Role, Permission, RolePermission, UserPermission)
            </span>
            {showFlaskCode ? (
              <ChevronUp className="w-4 h-4 text-stone-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-stone-400" />
            )}
          </button>

          {showFlaskCode && (
            <div className="p-4 space-y-3 font-mono text-[11px] border-t border-stone-800">
              <div className="flex items-center justify-between text-xs text-stone-400 pb-2 border-b border-stone-800">
                <span>Modelos relacionales y decorador @require_permission:</span>
                <button
                  type="button"
                  onClick={handleCopyFlaskCode}
                  className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-emerald-400 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  {copiedCode ? '¡Copiado!' : 'Copiar código Flask'}
                </button>
              </div>

              <pre className="max-h-56 overflow-y-auto p-3 bg-black/60 rounded-xl text-stone-300 text-[10px] leading-relaxed border border-stone-800">
                {FLASK_SQLALCHEMY_SCHEMA_CODE}
              </pre>

              <p className="text-[10px] text-stone-400 font-sans">
                📌 En Flask, la tabla <strong>UserPermission</strong> almacena los overrides específicos
                de cada usuario, mientras que <strong>RolePermission</strong> almacena los valores por
                defecto para los roles <em>Administrador</em> y <em>Colaborador</em>.
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
