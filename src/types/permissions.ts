import { UserRole } from '../types';

/**
 * Códigos estables de permisos granulares del sistema EMILA.
 * Estos códigos son inmutables y corresponden 1:1 con las verificaciones
 * tanto en frontend (UI/Navegación) como en backend (Flask / Endpoints / Servicios).
 */
export type PermissionCode =
  | 'orders.view'
  | 'orders.create'
  | 'orders.edit'
  | 'orders.change_status'
  | 'payments.register'
  | 'clients.view'
  | 'clients.edit'
  | 'stock.view'
  | 'stock.adjust'
  | 'reports.view'
  | 'reports.export'
  | 'users.view'
  | 'users.manage'
  | 'settings.manage'
  | 'audit.view'
  | 'calendar.view';

export type PermissionModule =
  | 'Pedidos'
  | 'Clientes'
  | 'Inventario'
  | 'Reportes'
  | 'Usuarios'
  | 'Configuración'
  | 'Auditoría'
  | 'Agenda';

export interface PermissionDefinition {
  code: PermissionCode;
  name: string;
  module: PermissionModule;
  description: string;
  riskLevel?: 'básico' | 'operativo' | 'sensible' | 'administrativo';
}

/**
 * Estado de ajuste específico por usuario:
 * - 'inherited': No tiene override, toma el valor asignado por el Rol
 * - 'granted': Concedido explícitamente (override = true)
 * - 'denied': Denegado explícitamente (override = false)
 */
export type PermissionOverrideState = 'inherited' | 'granted' | 'denied';

export interface EffectivePermissionInfo {
  code: PermissionCode;
  definition: PermissionDefinition;
  effective: boolean;
  source: 'role' | 'override';
  overrideState: PermissionOverrideState;
  roleDefault: boolean;
}

/**
 * Modelo relacional para persistencia / mapeo directo a Flask (SQLAlchemy):
 *
 * Tablas:
 * 1. Role: id, name, description
 * 2. Permission: id, code, name, module, description
 * 3. RolePermission: id, role_id, permission_id, granted
 * 4. UserPermission: id, user_id, permission_id, granted (override)
 */
export interface RoleModel {
  id: string;
  name: UserRole;
  description: string;
}

export interface PermissionModel {
  id: string;
  code: PermissionCode;
  name: string;
  module: string;
  description: string;
}

export interface RolePermissionModel {
  id: string;
  role_id: string;
  permission_id: string;
  granted: boolean;
}

export interface UserPermissionModel {
  id: string;
  user_id: string;
  permission_id: string;
  granted: boolean; // true = explicitly granted, false = explicitly denied
}
