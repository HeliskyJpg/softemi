export type UserRole = 'Administrador' | 'Colaborador';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  active: boolean;
  email?: string;
  password?: string; // Optional internal auth token only, never exposed in UI
}

export type SystemUser = User;

export type OrderStatus = 'Pendiente' | 'En preparación' | 'Listo' | 'Entregado' | 'Cancelado';

export type OrderChannel = 'WhatsApp' | 'Instagram' | 'Llamada' | 'Otro';

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

export type ActiveView = 
  | 'dashboard'
  | 'orders'
  | 'order-new'
  | 'order-detail'
  | 'order-edit'
  | 'components'
  | 'clients'
  | 'client-detail'
  | 'users'
  | 'profile'
  | 'calendar'
  | 'reports';

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
}

export interface NavigationHistoryEntry {
  view: ActiveView;
  orderId?: string | null;
  clientId?: string | null;
}
