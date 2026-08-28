export type UserRole = 'Administrador' | 'Colaborador';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  active: boolean;
  password?: string;
  email?: string;
}

export type SystemUser = User;

export type OrderStatus = 'Pendiente' | 'En preparación' | 'Listo' | 'Entregado' | 'Cancelado';

export type OrderChannel = 'WhatsApp' | 'Instagram' | 'Llamada' | 'Otro';

export type ComponentCategory = 'Flores' | 'Empaques' | 'Accesorios' | 'Chocolates y Dulces' | 'Globos y Decoración';

export interface ComponentItem {
  id: string;
  name: string;
  category: ComponentCategory;
  price: number; // in Quetzales (Q)
  stock: number;
  minStockAlert: number;
  description?: string;
  active: boolean;
}

export interface OrderItemDetail {
  componentId: string;
  componentName: string;
  category: ComponentCategory;
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
  previousStock: number;
  newStock: number;
  difference: number;
  reason: string;
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
