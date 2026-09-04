import { PermissionCode, PermissionDefinition, EffectivePermissionInfo, PermissionOverrideState } from './types/permissions';

export type UserRole = 'Administrador' | 'Colaborador';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  active: boolean;
  email?: string;
  password?: string; // Optional internal auth token only, never exposed in UI
  mustChangePassword?: boolean; // If true, requires mandatory password change on first login
  createdAt?: string;
  permissions?: Partial<Record<PermissionCode, boolean>>; // Custom overrides: true = granted, false = denied, undefined = inherited from role
}

export interface CreateUserParams {
  name: string;
  username: string;
  email?: string;
  role: UserRole;
  tempPassword?: string;
  mustChangePassword?: boolean;
  permissions?: Partial<Record<PermissionCode, boolean>>;
}

export type {
  PermissionCode,
  PermissionDefinition,
  EffectivePermissionInfo,
  PermissionOverrideState,
};

export type SystemUser = User;

export type OrderStatus = 'Pendiente' | 'En preparación' | 'Listo' | 'Entregado' | 'Cancelado';

export type OrderChannel = 'WhatsApp' | 'Instagram' | 'Llamada' | 'Otro' | string;

export interface AutocompleteOption {
  value: string;
  label: string;
  description?: string;
  group?: string;
  disabled?: boolean;
}

export type ComponentUnit = 'Unidad' | 'Docena' | 'Paquete' | 'Metro' | 'Rollo' | string;

export type ComponentCategory =
  | 'Flores'
  | 'Follajes'
  | 'Empaques'
  | 'Decoración'
  | 'Dulces y chocolates'
  | 'Globos'
  | 'Tarjetas'
  | 'Accesorios'
  | string;

export interface ComponentItem {
  id: string;
  name: string;
  category: string;
  unit: ComponentUnit;
  price: number; // in Quetzales (Q)
  physicalStock: number; // Stock físico real
  reservedStock: number; // Stock reservado en pedidos activos
  minStockAlert: number; // Stock mínimo
  description?: string;
  active: boolean;
}

export interface OrderItemDetail {
  componentId: string;
  componentName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  notes?: string;
  createdAt: string;
  totalOrders?: number;
  lastOrderDate?: string;
}

export interface OrderHistoryEntry {
  id: string;
  timestamp: string; // ISO date string or formatted
  user: string;
  action: string;
  details?: string;
  badgeType?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

export interface Order {
  id: string;
  code: string; // e.g. "PED-0012"
  clientId: string;
  clientName: string;
  clientPhone: string;
  channel: OrderChannel;
  description: string;
  observations?: string;
  deliveryDate: string; // YYYY-MM-DD
  deliveryTime: string; // HH:mm
  items: OrderItemDetail[];
  subtotal: number;
  total: number;
  advancePayment: number; // Anticipo
  balance: number; // Saldo
  status: OrderStatus;
  createdAt: string;
  createdBy: string;
  history: OrderHistoryEntry[];
}

export interface StockAdjustmentLog {
  id: string;
  componentId: string;
  componentName: string;
  type: 'Entrada' | 'Salida';
  quantity: number;
  previousPhysicalStock: number;
  newPhysicalStock: number;
  reservedStock: number;
  reason: string;
  observation?: string;
  user: string;
  timestamp: string;
}

export type AuditModule =
  | 'Pedidos'
  | 'Clientes'
  | 'Componentes'
  | 'Inventario'
  | 'Usuarios'
  | 'Reportes'
  | 'Configuraciones'
  | 'Perfil'
  | string;

export type AuditOperationType =
  | 'Salidas y Mermas'
  | 'Creaciones'
  | 'Modificaciones'
  | 'Cambios de estado'
  | 'Pagos y Abonos'
  | 'Seguridad y Usuarios'
  | 'Reportes y Exportaciones'
  | string;

export interface AuditLogEntry {
  id: string;                      // Unique ID (compatible with UUID primary key in SQL)
  timestamp: string;               // ISO 8601 string (e.g. 2026-09-03T15:30:00.000Z)
  userId: string;                  // Identifier of user (user_id in SQL)
  userName: string;                // Name or username of user (user_name in SQL)
  userRole: UserRole;              // Role at the moment of action (user_role in SQL)
  action: string;                  // Normalized action name (e.g. "crear pedido")
  module: AuditModule;             // System module (module in SQL)
  entityType: string;              // Entity type (e.g. "Order", "Client", "ComponentItem", "User")
  recordId: string;                // Target entity ID or code (record_id in SQL)
  description: string;             // Concise human-readable description
  operationType?: AuditOperationType; // Operational classification for filtering
  previousValue: string | null;    // Serialized/formatted previous value when applicable
  newValue: string | null;         // Serialized/formatted new value when applicable
  metadata?: Record<string, unknown>; // Optional additional JSON payload
}

export interface LogActionParams {
  action: string;
  module: AuditModule;
  entityType: string;
  recordId: string;
  description: string;
  operationType?: AuditOperationType;
  previousValue?: unknown;
  newValue?: unknown;
  metadata?: Record<string, unknown>;
  user?: {
    id: string;
    name: string;
    username?: string;
    role: UserRole;
  } | null;
}

export type ActiveView = 
  | 'dashboard'
  | 'orders'
  | 'order-new'
  | 'order-detail'
  | 'order-edit'
  | 'order-receipt'
  | 'components'
  | 'clients'
  | 'client-detail'
  | 'users'
  | 'profile'
  | 'calendar'
  | 'reports'
  | 'settings'
  | 'audit';

export interface CatalogItem {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  orderIndex?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type CatalogKey =
  | 'order_channels'
  | 'component_categories'
  | 'component_units'
  | 'stock_adjustment_reasons'
  | 'payment_methods'
  | 'delivery_types';

export interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: number;
}

export interface OrdersViewState {
  searchTerm: string;
  statusFilter: string;
  dateFilter: string;
  sortField: 'deliveryDate' | 'code' | 'total';
  sortDirection: 'asc' | 'desc';
  currentPage: number;
}

export interface CalendarViewState {
  selectedMonth: number;
  selectedYear: number;
  selectedDateFilter: string;
}

export interface ComponentsViewState {
  activeTab: 'catalog' | 'logs';
  searchTerm: string;
  categoryFilter: string;
  statusFilter: 'all' | 'available' | 'low_stock' | 'out_of_stock' | 'inactive';
}

export interface ClientsViewState {
  searchTerm: string;
  currentPage?: number;
}

export interface NavigationHistoryEntry {
  view: ActiveView;
  orderId?: string | null;
  clientId?: string | null;
}
