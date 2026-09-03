import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  Client,
  ComponentItem,
  Order,
  OrderStatus,
  OrderChannel,
  OrderItemDetail,
  ActiveView,
  ToastMessage,
  StockAdjustmentLog,
  OrderHistoryEntry,
  OrdersViewState,
  CalendarViewState,
  ComponentsViewState,
  ClientsViewState,
  NavigationHistoryEntry,
  CatalogItem,
  CatalogKey,
  AutocompleteOption,
  AuditLogEntry,
  LogActionParams,
} from '../types';
import {
  CATALOG_DEFINITIONS,
  CATALOG_KEYS_ORDERED,
  buildCatalogSelectOptions,
  CatalogSelectOptionsParams,
} from '../config/catalogsConfig';
import {
  INITIAL_USERS,
  INITIAL_CLIENTS,
  INITIAL_COMPONENTS,
  INITIAL_ORDERS,
  INITIAL_CATEGORIES,
  INITIAL_UNITS,
  INITIAL_STOCK_LOGS,
  INITIAL_AUDIT_LOGS,
} from '../data/seedData';
import { createAuditLogEntry } from '../services/auditService';

interface AppContextType {
  // Auth & User
  currentUser: User | null;
  users: User[];
  login: (username: string, password?: string) => boolean;
  logout: () => void;
  switchUserRole: (role: 'Administrador' | 'Colaborador') => void;
  updateUserProfile: (name: string, email?: string) => void;
  updateUser: (id: string, userData: Partial<User>) => void;
  toggleUserActive: (id: string) => void;
  resetUserPassword: (id: string, tempPassword?: string) => { success: boolean; tempPassword?: string; error?: string };

  // Audit / Bitácora Global
  auditLogs: AuditLogEntry[];
  logAction: (params: LogActionParams) => AuditLogEntry;

  // Navigation
  activeView: ActiveView;
  setActiveView: (view: ActiveView, options?: { clearHistory?: boolean; origin?: ActiveView }) => void;
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  navigationHistory: NavigationHistoryEntry[];
  navigateToView: (
    view: ActiveView,
    options?: { orderId?: string | null; clientId?: string | null; origin?: ActiveView; clearHistory?: boolean }
  ) => void;
  navigateToOrderDetail: (orderId: string, origin?: ActiveView) => void;
  navigateToClientDetail: (clientId: string, origin?: ActiveView) => void;
  navigateToOrderEdit: (orderId: string, origin?: ActiveView) => void;
  navigateToOrderNew: (
    origin?: ActiveView,
    initialData?: { initialDeliveryDate?: string; initialClientId?: string | null }
  ) => void;
  goBack: (fallbackView?: ActiveView) => void;
  canGoBack: boolean;

  newOrderInitialData: { deliveryDate?: string; clientId?: string | null } | null;
  setNewOrderInitialData: React.Dispatch<
    React.SetStateAction<{ deliveryDate?: string; clientId?: string | null } | null>
  >;

  // View States Preservation
  ordersViewState: OrdersViewState;
  setOrdersViewState: React.Dispatch<React.SetStateAction<OrdersViewState>>;
  calendarViewState: CalendarViewState;
  setCalendarViewState: React.Dispatch<React.SetStateAction<CalendarViewState>>;
  componentsViewState: ComponentsViewState;
  setComponentsViewState: React.Dispatch<React.SetStateAction<ComponentsViewState>>;
  clientsViewState: ClientsViewState;
  setClientsViewState: React.Dispatch<React.SetStateAction<ClientsViewState>>;

  // Orders
  orders: Order[];
  createOrder: (orderData: {
    clientId: string;
    channel: OrderChannel;
    description: string;
    observations?: string;
    deliveryDate: string;
    deliveryTime: string;
    items: OrderItemDetail[];
    advancePayment: number;
  }) => { success: boolean; orderId?: string; error?: string };
  updateOrder: (
    id: string,
    orderData: {
      clientId: string;
      channel: OrderChannel;
      description: string;
      observations?: string;
      deliveryDate: string;
      deliveryTime: string;
      items: OrderItemDetail[];
      advancePayment: number;
    }
  ) => { success: boolean; error?: string };
  changeOrderStatus: (id: string, newStatus: OrderStatus, note?: string) => boolean;
  cancelOrder: (id: string, reason?: string) => boolean;
  registerOrderPayment: (
    orderId: string,
    amount: number,
    options?: {
      note?: string;
      markAsDeliveredIfSettled?: boolean;
      deliveryNote?: string;
    }
  ) => {
    success: boolean;
    error?: string;
    newPaid?: number;
    newBalance?: number;
    markedAsDelivered?: boolean;
  };

  // Components & Inventory
  components: ComponentItem[];
  categories: string[];
  addCategory: (name: string) => void;
  units: string[];
  addUnit: (name: string) => void;
  addComponent: (item: Omit<ComponentItem, 'id' | 'reservedStock'>) => void;
  updateComponent: (id: string, itemData: Partial<Omit<ComponentItem, 'id' | 'physicalStock' | 'reservedStock'>>) => void;
  adjustComponentStock: (
    id: string,
    adjustment: {
      type: 'Entrada' | 'Salida';
      quantity: number;
      reason: string;
      observation?: string;
    }
  ) => { success: boolean; error?: string };
  toggleComponentActive: (id: string) => void;
  stockAdjustmentLogs: StockAdjustmentLog[];

  // Clients
  clients: Client[];
  addClient: (clientData: Omit<Client, 'id' | 'createdAt' | 'totalOrders' | 'lastOrderDate'>) => Client;
  updateClient: (id: string, clientData: Partial<Client>) => void;

  // Feedback & Toasts
  toasts: ToastMessage[];
  addToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info', title?: string) => void;
  removeToast: (id: string) => void;

  // Catalogs Management
  catalogs: Record<CatalogKey, CatalogItem[]>;
  getCatalogItems: (key: CatalogKey, onlyActive?: boolean) => CatalogItem[];
  getCatalogSelectOptions: (
    key: CatalogKey,
    params?: CatalogSelectOptionsParams
  ) => AutocompleteOption[];
  addCatalogItem: (
    key: CatalogKey,
    item: Omit<CatalogItem, 'id' | 'createdAt' | 'updatedAt'>
  ) => { success: boolean; item?: CatalogItem; error?: string };
  updateCatalogItem: (
    key: CatalogKey,
    id: string,
    itemData: Partial<CatalogItem>
  ) => { success: boolean; error?: string };
  toggleCatalogItemActive: (
    key: CatalogKey,
    id: string
  ) => { success: boolean; error?: string };
  deleteCatalogItem: (
    key: CatalogKey,
    id: string
  ) => { success: boolean; error?: string; inUse?: boolean };
  isCatalogItemInUse: (
    key: CatalogKey,
    name: string,
    id: string
  ) => { inUse: boolean; count: number; details: string };

  // Demo Control
  resetDemoData: () => void;
  resetToInitialSeedData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'emila_users_v2',
  CURRENT_USER: 'emila_current_user_v2',
  CLIENTS: 'emila_clients_v2',
  COMPONENTS: 'emila_components_v2',
  CATEGORIES: 'emila_categories_v2',
  UNITS: 'emila_units_v2',
  ORDERS: 'emila_orders_v2',
  STOCK_LOGS: 'emila_stock_logs_v2',
  CATALOGS: 'emila_catalogs_v2',
  AUDIT_LOGS: 'emila_audit_logs_v2',
};

const deduplicateStrings = (arr: unknown[]): string[] => {
  if (!Array.isArray(arr)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of arr) {
    if (typeof item === 'string' && item.trim()) {
      const trimmed = item.trim();
      const lower = trimmed.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        result.push(trimmed);
      }
    }
  }
  return result;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load initial state from LocalStorage or Fallback to seed
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return saved ? JSON.parse(saved) : INITIAL_USERS[0]; // default to Elena Soto (Admin) to showcase full CRUD
    } catch {
      return INITIAL_USERS[0];
    }
  });

  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
      return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
    } catch {
      return INITIAL_CLIENTS;
    }
  });

  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      const parsed = saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
      const clean = deduplicateStrings(Array.isArray(parsed) ? parsed : INITIAL_CATEGORIES);
      return clean.length > 0 ? clean : deduplicateStrings(INITIAL_CATEGORIES);
    } catch {
      return deduplicateStrings(INITIAL_CATEGORIES);
    }
  });

  const [units, setUnits] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.UNITS);
      const parsed = saved ? JSON.parse(saved) : INITIAL_UNITS;
      const clean = deduplicateStrings(Array.isArray(parsed) ? parsed : INITIAL_UNITS);
      return clean.length > 0 ? clean : deduplicateStrings(INITIAL_UNITS);
    } catch {
      return deduplicateStrings(INITIAL_UNITS);
    }
  });

  const [components, setComponents] = useState<ComponentItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COMPONENTS);
      return saved ? JSON.parse(saved) : INITIAL_COMPONENTS;
    } catch {
      return INITIAL_COMPONENTS;
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [stockAdjustmentLogs, setStockAdjustmentLogs] = useState<StockAdjustmentLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STOCK_LOGS);
      return saved ? JSON.parse(saved) : INITIAL_STOCK_LOGS;
    } catch {
      return INITIAL_STOCK_LOGS;
    }
  });

  // Global Reusable Audit Logs State (Bitácora central)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  // Helper to build initial catalogs from definitions
  const getInitialCatalogs = (): Record<CatalogKey, CatalogItem[]> => {
    const initial: Partial<Record<CatalogKey, CatalogItem[]>> = {};
    const now = new Date().toISOString();
    for (const key of CATALOG_KEYS_ORDERED) {
      const def = CATALOG_DEFINITIONS[key];
      initial[key] = (def?.defaultItems || []).map((it, idx) => ({
        ...it,
        orderIndex: it.orderIndex ?? idx + 1,
        createdAt: now,
        updatedAt: now,
      }));
    }
    return initial as Record<CatalogKey, CatalogItem[]>;
  };

  // Administrable Master Catalogs State
  const [catalogs, setCatalogs] = useState<Record<CatalogKey, CatalogItem[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATALOGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged: Partial<Record<CatalogKey, CatalogItem[]>> = { ...parsed };
        const now = new Date().toISOString();
        for (const key of CATALOG_KEYS_ORDERED) {
          if (!merged[key] || !Array.isArray(merged[key]) || merged[key]!.length === 0) {
            merged[key] = (CATALOG_DEFINITIONS[key]?.defaultItems || []).map((it, idx) => ({
              ...it,
              orderIndex: it.orderIndex ?? idx + 1,
              createdAt: now,
              updatedAt: now,
            }));
          }
        }
        return merged as Record<CatalogKey, CatalogItem[]>;
      }
      return getInitialCatalogs();
    } catch {
      return getInitialCatalogs();
    }
  });

  // Navigation & History State
  const [activeView, setActiveViewRaw] = useState<ActiveView>('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<NavigationHistoryEntry[]>([]);
  const [newOrderInitialData, setNewOrderInitialData] = useState<{
    deliveryDate?: string;
    clientId?: string | null;
  } | null>(null);

  // Persistent View States across tab/view switches & returns
  const [ordersViewState, setOrdersViewState] = useState<OrdersViewState>({
    searchTerm: '',
    statusFilter: 'Todos',
    dateFilter: 'todos',
    sortField: 'deliveryDate',
    sortDirection: 'asc',
    currentPage: 1,
  });

  const [calendarViewState, setCalendarViewState] = useState<CalendarViewState>({
    selectedMonth: new Date().getMonth(),
    selectedYear: new Date().getFullYear(),
    selectedDateFilter: '',
  });

  const [componentsViewState, setComponentsViewState] = useState<ComponentsViewState>({
    activeTab: 'catalog',
    searchTerm: '',
    categoryFilter: 'Todas',
    statusFilter: 'all',
  });

  const [clientsViewState, setClientsViewState] = useState<ClientsViewState>({
    searchTerm: '',
  });

  // Navigation Methods
  const setActiveView = (
    view: ActiveView,
    options?: { clearHistory?: boolean; origin?: ActiveView }
  ) => {
    // RBAC guard: 'users' view is strictly reserved for Administrators
    if (view === 'users' && currentUser?.role !== 'Administrador') {
      addToast('Acceso restringido: Se requieren permisos de Administrador para gestionar usuarios.', 'warning', 'No autorizado');
      setActiveViewRaw('dashboard');
      return;
    }

    if (options?.clearHistory) {
      setNavigationHistory([]);
    } else if (
      options?.origin ||
      (activeView !== view &&
        view !== 'order-detail' &&
        view !== 'order-edit' &&
        view !== 'order-new' &&
        view !== 'client-detail')
    ) {
      // Direct menu navigation switches base module
      setNavigationHistory([]);
    }
    setActiveViewRaw(view);
  };

  const navigateToView = (
    view: ActiveView,
    options?: { orderId?: string | null; clientId?: string | null; origin?: ActiveView; clearHistory?: boolean }
  ) => {
    // RBAC guard: 'users' view is strictly reserved for Administrators
    if (view === 'users' && currentUser?.role !== 'Administrador') {
      addToast('Acceso restringido: Se requieren permisos de Administrador para gestionar usuarios.', 'warning', 'No autorizado');
      setActiveViewRaw('dashboard');
      return;
    }

    if (options?.clearHistory) {
      setNavigationHistory([]);
    } else {
      const sourceView = options?.origin || activeView;
      setNavigationHistory((prev) => [
        ...prev,
        { view: sourceView, orderId: selectedOrderId, clientId: selectedClientId },
      ]);
    }
    setSelectedOrderId(options?.orderId ?? null);
    setSelectedClientId(options?.clientId ?? null);
    setActiveViewRaw(view);
  };

  const navigateToOrderDetail = (orderId: string, origin?: ActiveView) => {
    const sourceView = origin || activeView;
    setNavigationHistory((prev) => [
      ...prev,
      { view: sourceView, orderId: selectedOrderId, clientId: selectedClientId },
    ]);
    setSelectedOrderId(orderId);
    setActiveViewRaw('order-detail');
  };

  const navigateToClientDetail = (clientId: string, origin?: ActiveView) => {
    const sourceView = origin || activeView;
    setNavigationHistory((prev) => [
      ...prev,
      { view: sourceView, orderId: selectedOrderId, clientId: selectedClientId },
    ]);
    setSelectedClientId(clientId);
    setActiveViewRaw('client-detail');
  };

  const navigateToOrderEdit = (orderId: string, origin?: ActiveView) => {
    const sourceView = origin || activeView;
    setNavigationHistory((prev) => [
      ...prev,
      { view: sourceView, orderId: selectedOrderId, clientId: selectedClientId },
    ]);
    setSelectedOrderId(orderId);
    setActiveViewRaw('order-edit');
  };

  const navigateToOrderNew = (
    origin?: ActiveView,
    initialData?: { initialDeliveryDate?: string; initialClientId?: string | null }
  ) => {
    const sourceView = origin || activeView;
    setNavigationHistory((prev) => [
      ...prev,
      { view: sourceView, orderId: selectedOrderId, clientId: selectedClientId },
    ]);
    setSelectedOrderId(null);
    if (initialData?.initialDeliveryDate || initialData?.initialClientId) {
      setNewOrderInitialData({
        deliveryDate: initialData.initialDeliveryDate,
        clientId: initialData.initialClientId,
      });
    } else {
      setNewOrderInitialData(null);
    }
    setActiveViewRaw('order-new');
  };

  const goBack = (fallbackView: ActiveView = 'orders') => {
    if (navigationHistory.length > 0) {
      const historyCopy = [...navigationHistory];
      let prev = historyCopy.pop();
      // Avoid looping if popped entry is identical to current active view
      while (prev && prev.view === activeView && historyCopy.length > 0) {
        prev = historyCopy.pop();
      }

      if (prev && prev.view !== activeView) {
        setNavigationHistory(historyCopy);
        setSelectedOrderId(prev.orderId ?? null);
        setSelectedClientId(prev.clientId ?? null);
        setActiveViewRaw(prev.view);
        return;
      }
    }

    // Fallback when no history exists
    setNavigationHistory([]);
    setSelectedOrderId(null);
    setSelectedClientId(null);
    setActiveViewRaw(fallbackView);
  };

  const canGoBack = navigationHistory.length > 0;

  // Toast System State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync to LocalStorage on state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  // Keep currentUser synchronized with the users store & enforce deactivation immediately
  useEffect(() => {
    if (currentUser) {
      const live = users.find((u) => u.id === currentUser.id);
      if (live) {
        if (!live.active) {
          setCurrentUser(null);
          addToast('Tu sesión ha finalizado porque tu cuenta fue desactivada.', 'warning', 'Acceso denegado');
        } else if (
          live.role !== currentUser.role ||
          live.name !== currentUser.name ||
          live.username !== currentUser.username ||
          live.email !== currentUser.email
        ) {
          setCurrentUser(live);
        }
      }
    }
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(units));
  }, [units]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMPONENTS, JSON.stringify(components));
  }, [components]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STOCK_LOGS, JSON.stringify(stockAdjustmentLogs));
  }, [stockAdjustmentLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATALOGS, JSON.stringify(catalogs));
  }, [catalogs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
    } catch (err) {
      console.error('Error saving audit logs to localStorage:', err);
    }
  }, [auditLogs]);

  // Toast Helper
  const addToast = (
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'success',
    title?: string
  ) => {
    const newToast: ToastMessage = {
      id: 'toast-' + Math.random().toString(36).substring(2, 9),
      message,
      type,
      title,
      timestamp: Date.now(),
    };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(newToast.id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper date formatter
  const getFormattedNow = () => {
    const now = new Date();
    const d = now.toISOString().split('T')[0];
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    return `${d} ${hours}:${mins}`;
  };

  // Central Global Audit Logging Function (Bitácora EMILA)
  const logAction = (params: LogActionParams): AuditLogEntry => {
    const entry = createAuditLogEntry(params, currentUser);
    setAuditLogs((prev) => [entry, ...prev]);
    return entry;
  };

  // Auth Methods
  const login = (username: string, password?: string): boolean => {
    const found = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!found) {
      addToast('Usuario no encontrado en el sistema.', 'error', 'Error de credenciales');
      return false;
    }
    if (!found.active) {
      addToast(`La cuenta de ${found.name} está inactiva. Ya no tiene acceso al sistema.`, 'error', 'Acceso denegado');
      return false;
    }

    if (password) {
      if (found.username === 'admin' && password !== 'admin123') {
        addToast('Contraseña incorrecta para el usuario admin.', 'error', 'Error de autenticación');
        return false;
      }
      if (found.username === 'empleado' && password !== 'demo123') {
        addToast('Contraseña incorrecta para el usuario colaborador.', 'error', 'Error de autenticación');
        return false;
      }
    }

    setCurrentUser(found);
    addToast(`¡Bienvenido/a, ${found.name}!`, 'success', 'Sesión iniciada');
    setActiveView('dashboard');
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    addToast('Has cerrado sesión correctamente.', 'info');
  };

  const switchUserRole = (role: 'Administrador' | 'Colaborador') => {
    const target = users.find((u) => u.role === role && u.active);
    if (target) {
      setCurrentUser(target);
      addToast(`Sesión cambiada a: ${target.name} (${role})`, 'info', 'Rol actualizado');
    } else {
      addToast(`No hay ningún usuario activo disponible con el rol ${role}.`, 'warning');
    }
  };

  const updateUserProfile = (name: string, email?: string) => {
    if (!currentUser) return;
    const previous = { name: currentUser.name, email: currentUser.email || '' };
    const updatedUser: User = {
      ...currentUser,
      name: name.trim(),
      ...(email !== undefined ? { email: email.trim() } : {}),
    };
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));

    logAction({
      action: 'editar perfil',
      module: 'Perfil',
      entityType: 'User',
      recordId: currentUser.username,
      description: `Actualización de datos de perfil personal para ${name.trim()}`,
      previousValue: JSON.stringify(previous),
      newValue: JSON.stringify({ name: name.trim(), email: email?.trim() || '' }),
    });

    addToast('Perfil actualizado correctamente.', 'success');
  };

  const updateUser = (id: string, userData: Partial<User>) => {
    if (currentUser?.role !== 'Administrador') {
      addToast('Acceso denegado: Solo los administradores pueden modificar usuarios.', 'error', 'No autorizado');
      return;
    }

    const targetUser = users.find((u) => u.id === id);
    if (!targetUser) return;

    // Regla: No permitir que el administrador actual se desactive a sí mismo
    if (userData.active === false && id === currentUser?.id) {
      addToast('No puede desactivar su propia cuenta de administrador.', 'warning', 'Acción no permitida');
      return;
    }

    // Regla: No dejar el sistema sin un administrador activo al desactivar
    if (userData.active === false && targetUser.role === 'Administrador' && targetUser.active) {
      const otherActiveAdmins = users.filter((u) => u.id !== id && u.role === 'Administrador' && u.active);
      if (otherActiveAdmins.length === 0) {
        addToast('No se puede desactivar al único Administrador activo del sistema.', 'warning', 'Acción no permitida');
        return;
      }
    }

    // Regla: No dejar el sistema sin un administrador activo al cambiar de rol
    if (
      userData.role &&
      userData.role !== 'Administrador' &&
      targetUser.role === 'Administrador' &&
      targetUser.active
    ) {
      const otherActiveAdmins = users.filter((u) => u.id !== id && u.role === 'Administrador' && u.active);
      if (otherActiveAdmins.length === 0) {
        addToast('No puede quitar el rol de Administrador al único administrador activo del sistema.', 'warning', 'Acción no permitida');
        return;
      }
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          // Whitelist allowed editable fields only (nunca exponer ni precargar contraseñas)
          const updated: User = {
            ...u,
            ...(userData.name !== undefined ? { name: userData.name.trim() } : {}),
            ...(userData.username !== undefined ? { username: userData.username.trim().toLowerCase().replace(/\s+/g, '') } : {}),
            ...(userData.email !== undefined ? { email: userData.email.trim() } : {}),
            ...(userData.role !== undefined ? { role: userData.role } : {}),
            ...(userData.active !== undefined ? { active: userData.active } : {}),
          };
          if (currentUser?.id === id) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );

    // Audit Logging
    let actionName = 'editar usuario';
    if (userData.role && userData.role !== targetUser.role) {
      actionName = 'cambiar rol';
    } else if (userData.active !== undefined && userData.active !== targetUser.active) {
      actionName = userData.active ? 'activar usuario' : 'inactivar usuario';
    }

    logAction({
      action: actionName,
      module: 'Usuarios',
      entityType: 'User',
      recordId: targetUser.username,
      description: `${actionName.toUpperCase()}: Usuario @${targetUser.username} (${targetUser.name})`,
      previousValue: JSON.stringify({
        nombre: targetUser.name,
        usuario: targetUser.username,
        rol: targetUser.role,
        activo: targetUser.active,
      }),
      newValue: JSON.stringify({
        nombre: userData.name ?? targetUser.name,
        usuario: userData.username ?? targetUser.username,
        rol: userData.role ?? targetUser.role,
        activo: userData.active ?? targetUser.active,
      }),
      metadata: { targetUserId: targetUser.id },
    });

    addToast('Usuario actualizado correctamente.', 'success');
  };

  const toggleUserActive = (id: string) => {
    if (currentUser?.role !== 'Administrador') {
      addToast('Acceso denegado: Solo los administradores pueden cambiar el estado de usuarios.', 'error', 'No autorizado');
      return;
    }

    const userToToggle = users.find((u) => u.id === id);
    if (!userToToggle) return;

    // Regla: No permitir que el administrador actual se desactive a sí mismo
    if (userToToggle.id === currentUser?.id) {
      addToast('No puede desactivar el usuario con el que tiene sesión activa.', 'warning', 'Acción no permitida');
      return;
    }

    // Regla: No dejar el sistema sin un administrador activo
    if (userToToggle.active && userToToggle.role === 'Administrador') {
      const activeAdmins = users.filter((u) => u.role === 'Administrador' && u.active);
      if (activeAdmins.length <= 1) {
        addToast('No puede desactivar al único Administrador activo del sistema.', 'warning', 'Acción no permitida');
        return;
      }
    }

    const nextActive = !userToToggle.active;
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, active: nextActive } : u))
    );

    const actionName = nextActive ? 'activar usuario' : 'inactivar usuario';
    logAction({
      action: actionName,
      module: 'Usuarios',
      entityType: 'User',
      recordId: userToToggle.username,
      description: `${actionName.toUpperCase()}: Cuenta @${userToToggle.username} (${userToToggle.name}) pasó a ${nextActive ? 'Activo' : 'Inactivo'}`,
      previousValue: userToToggle.active ? 'Activo' : 'Inactivo',
      newValue: nextActive ? 'Activo' : 'Inactivo',
      metadata: { targetUserId: userToToggle.id },
    });

    const newStatus = nextActive ? 'activado' : 'desactivado';
    addToast(`Usuario "${userToToggle.name}" ${newStatus} correctamente.`, 'info');
  };

  const resetUserPassword = (
    id: string,
    tempPassword?: string
  ): { success: boolean; tempPassword?: string; error?: string } => {
    if (currentUser?.role !== 'Administrador') {
      const errorMsg = 'Acceso denegado: Solo los administradores pueden restablecer contraseñas.';
      addToast(errorMsg, 'error', 'No autorizado');
      return { success: false, error: errorMsg };
    }

    const targetUser = users.find((u) => u.id === id);
    if (!targetUser) {
      return { success: false, error: 'Usuario no encontrado.' };
    }

    const generated = tempPassword?.trim() || `Emila${Math.floor(1000 + Math.random() * 9000)}!`;

    logAction({
      action: 'restablecer contraseña',
      module: 'Usuarios',
      entityType: 'User',
      recordId: targetUser.username,
      description: `Restablecimiento de credenciales para @${targetUser.username} (${targetUser.name})`,
      previousValue: 'Contraseña previa',
      newValue: `Contraseña provisional asignada (${generated})`,
      metadata: { targetUserId: targetUser.id, targetUserName: targetUser.name },
    });

    addToast(`Contraseña temporal asignada para @${targetUser.username}: ${generated}`, 'success', 'Contraseña restablecida');
    return { success: true, tempPassword: generated };
  };

  // Clients
  const addClient = (
    clientData: Omit<Client, 'id' | 'createdAt' | 'totalOrders' | 'lastOrderDate'>
  ): Client => {
    const newClient: Client = {
      ...clientData,
      id: 'cli-' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
      totalOrders: 0,
    };
    setClients((prev) => [newClient, ...prev]);

    logAction({
      action: 'crear cliente',
      module: 'Clientes',
      entityType: 'Client',
      recordId: newClient.name,
      description: `Registro de nuevo cliente: ${newClient.name} (Tel: ${newClient.phone})`,
      previousValue: null,
      newValue: JSON.stringify({
        nombre: newClient.name,
        telefono: newClient.phone,
        notas: newClient.notes || '',
      }),
      metadata: { clientId: newClient.id },
    });

    addToast(`Cliente "${newClient.name}" registrado correctamente.`, 'success');
    return newClient;
  };

  const updateClient = (id: string, clientData: Partial<Client>) => {
    const currentClient = clients.find((c) => c.id === id);
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...clientData } : c))
    );

    logAction({
      action: 'editar cliente',
      module: 'Clientes',
      entityType: 'Client',
      recordId: currentClient ? currentClient.name : id,
      description: `Actualización de información del cliente: ${currentClient ? currentClient.name : id}`,
      previousValue: currentClient
        ? JSON.stringify({
            nombre: currentClient.name,
            telefono: currentClient.phone,
            notas: currentClient.notes || '',
          })
        : null,
      newValue: JSON.stringify(clientData),
      metadata: { clientId: id },
    });

    addToast('Datos del cliente actualizados correctamente.', 'success');
  };

  // Category Management
  const addCategory = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCategories((prev) => {
      if (prev.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      return [...prev, trimmed];
    });
    // Ensure entry exists in master catalog
    setCatalogs((prev) => {
      const currentList = prev.component_categories || [];
      if (currentList.some((it) => it.name.trim().toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      const now = new Date().toISOString();
      const newItem: CatalogItem = {
        id: `cat-component_categories-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: trimmed,
        description: 'Categoría agregada desde gestión de componentes',
        active: true,
        orderIndex: currentList.length + 1,
        createdAt: now,
        updatedAt: now,
      };
      return {
        ...prev,
        component_categories: [...currentList, newItem],
      };
    });
    // Only show toast if it wasn't already in list
    if (!categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      addToast(`Categoría "${trimmed}" agregada con éxito.`, 'success');
    }
  };

  // Units of Measure Management
  const addUnit = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setUnits((prev) => {
      if (prev.some((u) => u.toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      return [...prev, trimmed];
    });
    // Ensure entry exists in master catalog
    setCatalogs((prev) => {
      const currentList = prev.component_units || [];
      if (currentList.some((it) => it.name.trim().toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      const now = new Date().toISOString();
      const newItem: CatalogItem = {
        id: `cat-component_units-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: trimmed,
        description: 'Unidad agregada desde gestión de componentes',
        active: true,
        orderIndex: currentList.length + 1,
        createdAt: now,
        updatedAt: now,
      };
      return {
        ...prev,
        component_units: [...currentList, newItem],
      };
    });
    // Only show toast if it wasn't already in list
    if (!units.some((u) => u.toLowerCase() === trimmed.toLowerCase())) {
      addToast(`Unidad de medida "${trimmed}" agregada con éxito.`, 'success');
    }
  };

  // Components & Inventory Management
  const addComponent = (item: Omit<ComponentItem, 'id' | 'reservedStock'>) => {
    const newItem: ComponentItem = {
      ...item,
      id: 'cmp-' + Date.now(),
      reservedStock: 0,
    };
    setComponents((prev) => [newItem, ...prev]);

    // Ensure category exists
    if (item.category && item.category.trim()) {
      addCategory(item.category.trim());
    }

    // Ensure unit exists
    if (item.unit && item.unit.trim()) {
      addUnit(item.unit.trim());
    }

    logAction({
      action: 'crear componente',
      module: 'Componentes',
      entityType: 'ComponentItem',
      recordId: newItem.name,
      description: `Creación de nuevo componente "${newItem.name}" en categoría ${newItem.category} a Q ${newItem.price.toFixed(2)}`,
      previousValue: null,
      newValue: JSON.stringify({
        nombre: newItem.name,
        categoria: newItem.category,
        unidad: newItem.unit,
        precio: newItem.price,
        stockFisico: newItem.physicalStock,
        alertaMinimo: newItem.minStockAlert,
      }),
      metadata: { componentId: newItem.id },
    });

    addToast('Componente registrado correctamente en el catálogo.', 'success');
  };

  const updateComponent = (
    id: string,
    itemData: Partial<Omit<ComponentItem, 'id' | 'physicalStock' | 'reservedStock'>>
  ) => {
    const currentComp = components.find((c) => c.id === id);
    setComponents((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            name: itemData.name !== undefined ? itemData.name : c.name,
            category: itemData.category !== undefined ? itemData.category : c.category,
            unit: itemData.unit !== undefined ? itemData.unit : c.unit,
            price: itemData.price !== undefined ? itemData.price : c.price,
            minStockAlert: itemData.minStockAlert !== undefined ? itemData.minStockAlert : c.minStockAlert,
            description: itemData.description !== undefined ? itemData.description : c.description,
            active: itemData.active !== undefined ? itemData.active : c.active,
          };
        }
        return c;
      })
    );

    // Ensure category exists in list if updated
    if (itemData.category && itemData.category.trim()) {
      addCategory(itemData.category.trim());
    }

    // Ensure unit exists in list if updated
    if (itemData.unit && itemData.unit.trim()) {
      addUnit(itemData.unit.trim());
    }

    logAction({
      action: 'editar componente',
      module: 'Componentes',
      entityType: 'ComponentItem',
      recordId: currentComp ? currentComp.name : id,
      description: `Actualización del componente "${currentComp ? currentComp.name : id}"`,
      previousValue: currentComp
        ? JSON.stringify({
            nombre: currentComp.name,
            categoria: currentComp.category,
            precio: currentComp.price,
            alertaMinimo: currentComp.minStockAlert,
            unidad: currentComp.unit,
          })
        : null,
      newValue: JSON.stringify(itemData),
      metadata: { componentId: id },
    });

    addToast('Componente actualizado correctamente.', 'success');
  };

  const adjustComponentStock = (
    id: string,
    adjustment: {
      type: 'Entrada' | 'Salida';
      quantity: number;
      reason: string;
      observation?: string;
    }
  ): { success: boolean; error?: string } => {
    if (currentUser?.role !== 'Administrador') {
      const errorMsg = 'Acceso denegado: Solo los administradores pueden realizar ajustes manuales de stock.';
      addToast(errorMsg, 'error', 'No autorizado');
      return { success: false, error: errorMsg };
    }

    const comp = components.find((c) => c.id === id);
    if (!comp) {
      return { success: false, error: 'Componente no encontrado.' };
    }

    if (adjustment.quantity <= 0) {
      addToast('La cantidad debe ser mayor a 0.', 'error');
      return { success: false, error: 'La cantidad debe ser mayor a 0.' };
    }

    const previousPhysicalStock = comp.physicalStock;
    let newPhysicalStock = previousPhysicalStock;

    if (adjustment.type === 'Entrada') {
      newPhysicalStock = previousPhysicalStock + adjustment.quantity;
    } else if (adjustment.type === 'Salida') {
      // Validate that physicalStock does not drop below reservedStock
      const availableStock = comp.physicalStock - comp.reservedStock;
      if (adjustment.quantity > availableStock) {
        const errorMsg = `No es posible realizar el ajuste. Existen ${comp.reservedStock} unidades reservadas para pedidos (Disponible para salida: ${availableStock}).`;
        addToast(errorMsg, 'error', 'Ajuste no permitido');
        return { success: false, error: errorMsg };
      }
      newPhysicalStock = previousPhysicalStock - adjustment.quantity;
    }

    // Update state
    setComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, physicalStock: newPhysicalStock } : c))
    );

    // Create Audit Log
    const newLog: StockAdjustmentLog = {
      id: 'log-' + Date.now(),
      componentId: comp.id,
      componentName: comp.name,
      type: adjustment.type,
      quantity: adjustment.quantity,
      previousPhysicalStock,
      newPhysicalStock,
      reservedStock: comp.reservedStock,
      reason: adjustment.reason.trim() || 'Ajuste de inventario',
      observation: adjustment.observation?.trim() || '',
      user: currentUser?.name || 'Administrador',
      timestamp: getFormattedNow(),
    };

    setStockAdjustmentLogs((prev) => [newLog, ...prev]);

    // Global Reusable Bitácora Logging
    const lowerReason = adjustment.reason.toLowerCase();
    const isMerma =
      adjustment.type === 'Salida' &&
      (lowerReason.includes('merma') ||
        lowerReason.includes('daño') ||
        lowerReason.includes('desperdicio') ||
        lowerReason.includes('marchit') ||
        lowerReason.includes('vencid'));

    const actionName = isMerma
      ? 'salida por merma'
      : adjustment.type === 'Entrada'
      ? 'entrada de stock'
      : 'ajustar stock';

    const userDisplayName = currentUser?.name || 'El usuario';
    const humanDescription = isMerma
      ? `${userDisplayName} registró una salida de ${adjustment.quantity} unidades por merma.`
      : adjustment.type === 'Entrada'
      ? `${userDisplayName} registró una entrada de ${adjustment.quantity} unidades de "${comp.name}".`
      : `${userDisplayName} registró un ajuste de stock de ${adjustment.quantity} unidades en "${comp.name}".`;

    logAction({
      action: actionName,
      module: 'Inventario',
      entityType: 'ComponentItem',
      recordId: comp.name,
      description: humanDescription,
      previousValue: JSON.stringify({ stockFisico: previousPhysicalStock, stockReservado: comp.reservedStock }),
      newValue: JSON.stringify({
        stockFisico: newPhysicalStock,
        stockReservado: comp.reservedStock,
        tipo: adjustment.type,
        cantidad: adjustment.quantity,
      }),
      metadata: {
        componentId: comp.id,
        tipo: adjustment.type,
        motivo: adjustment.reason,
        observacion: adjustment.observation,
      },
    });

    addToast('Ajuste de inventario aplicado correctamente.', 'success');
    return { success: true };
  };

  const toggleComponentActive = (id: string) => {
    const comp = components.find((c) => c.id === id);
    if (!comp) return;

    const nextState = !comp.active;
    setComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: nextState } : c))
    );

    const actionName = nextState ? 'activar componente' : 'desactivar componente';
    logAction({
      action: actionName,
      module: 'Componentes',
      entityType: 'ComponentItem',
      recordId: comp.name,
      description: `Componente "${comp.name}" ${nextState ? 'activado' : 'desactivado'} en catálogo`,
      previousValue: comp.active ? 'Activo' : 'Inactivo',
      newValue: nextState ? 'Activo' : 'Inactivo',
      metadata: { componentId: comp.id },
    });

    if (nextState) {
      addToast(`Componente "${comp.name}" activado correctamente.`, 'success');
    } else {
      addToast(`Componente "${comp.name}" desactivado correctamente.`, 'info');
    }
  };

  // Orders Management & Stock Reservation Rules
  const createOrder = (orderData: {
    clientId: string;
    channel: OrderChannel;
    description: string;
    observations?: string;
    deliveryDate: string;
    deliveryTime: string;
    items: OrderItemDetail[];
    advancePayment: number;
  }): { success: boolean; orderId?: string; error?: string } => {
    const client = clients.find((c) => c.id === orderData.clientId);
    if (!client) {
      return { success: false, error: 'Debe seleccionar un cliente válido.' };
    }

    if (!orderData.items || orderData.items.length === 0) {
      return { success: false, error: 'Debe agregar al menos un componente al pedido.' };
    }

    // 1. Check stock availability: quantity <= (physicalStock - reservedStock)
    for (const item of orderData.items) {
      const comp = components.find((c) => c.id === item.componentId);
      if (!comp) {
        return { success: false, error: `El componente "${item.componentName}" no existe.` };
      }
      if (item.quantity <= 0) {
        return { success: false, error: `La cantidad de "${item.componentName}" debe ser mayor a 0.` };
      }
      const available = comp.physicalStock - comp.reservedStock;
      if (item.quantity > available) {
        return {
          success: false,
          error: `Stock insuficiente para "${comp.name}". Disponible: ${available}, Solicitado: ${item.quantity}.`,
        };
      }
    }

    // 2. Compute totals
    const subtotal = orderData.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const total = subtotal;
    const advance = Math.max(0, Math.min(orderData.advancePayment || 0, total));
    const balance = total - advance;

    // 3. Generate next order code PED-XXXX
    const nextNum = orders.length + 12;
    const code = `PED-${String(nextNum).padStart(4, '0')}`;
    const orderId = 'ord-' + Date.now();

    // 4. Reserve stock: Increase reservedStock by quantity (DO NOT modify physicalStock)
    setComponents((prev) =>
      prev.map((c) => {
        const usedItem = orderData.items.find((it) => it.componentId === c.id);
        if (usedItem) {
          return { ...c, reservedStock: c.reservedStock + usedItem.quantity };
        }
        return c;
      })
    );

    // 5. Create History Entry
    const initialHistory: OrderHistoryEntry[] = [
      {
        id: 'hist-' + Date.now(),
        timestamp: getFormattedNow(),
        user: currentUser?.name || 'Usuario',
        action: 'Pedido creado',
        details: `Canal: ${orderData.channel}. Anticipo registrado: Q${advance.toFixed(2)}. Insumos reservados en stock.`,
        badgeType: 'primary',
      },
    ];

    const newOrder: Order = {
      id: orderId,
      code,
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone,
      channel: orderData.channel,
      description: orderData.description,
      observations: orderData.observations || '',
      deliveryDate: orderData.deliveryDate,
      deliveryTime: orderData.deliveryTime,
      items: orderData.items,
      subtotal,
      total,
      advancePayment: advance,
      balance,
      status: 'Pendiente',
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: currentUser?.name || 'Sistema',
      history: initialHistory,
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Update client statistics
    setClients((prev) =>
      prev.map((c) =>
        c.id === client.id
          ? {
              ...c,
              totalOrders: (c.totalOrders || 0) + 1,
              lastOrderDate: orderData.deliveryDate,
            }
          : c
      )
    );

    logAction({
      action: 'crear pedido',
      module: 'Pedidos',
      entityType: 'Order',
      recordId: code,
      description: `Creación del pedido ${code} para ${client.name} por Q ${total.toFixed(2)} (Anticipo: Q ${advance.toFixed(2)})`,
      previousValue: null,
      newValue: JSON.stringify({
        codigo: code,
        cliente: client.name,
        total,
        anticipo: advance,
        saldo: balance,
        canal: orderData.channel,
        fechaEntrega: orderData.deliveryDate,
        cantidadItems: orderData.items.length,
      }),
      metadata: { orderId, clientId: client.id, channel: orderData.channel },
    });

    addToast(`Pedido ${code} guardado correctamente y componentes reservados.`, 'success', '¡Éxito!');
    setSelectedOrderId(orderId);
    setActiveViewRaw('order-detail');

    return { success: true, orderId };
  };

  const updateOrder = (
    id: string,
    orderData: {
      clientId: string;
      channel: OrderChannel;
      description: string;
      observations?: string;
      deliveryDate: string;
      deliveryTime: string;
      items: OrderItemDetail[];
      advancePayment: number;
    }
  ): { success: boolean; error?: string } => {
    const existingOrder = orders.find((o) => o.id === id);
    if (!existingOrder) {
      return { success: false, error: 'El pedido no fue encontrado.' };
    }

    if (existingOrder.status === 'Cancelado') {
      return { success: false, error: 'Un pedido cancelado no puede ser modificado.' };
    }

    if (existingOrder.status === 'Entregado') {
      return { success: false, error: 'Un pedido entregado no puede ser modificado.' };
    }

    const client = clients.find((c) => c.id === orderData.clientId);
    if (!client) {
      return { success: false, error: 'Debe seleccionar un cliente válido.' };
    }

    if (!orderData.items || orderData.items.length === 0) {
      return { success: false, error: 'Debe tener al menos un componente en el pedido.' };
    }

    // Check availability for any delta increase:
    // delta = newQty - oldQty
    for (const newItem of orderData.items) {
      const comp = components.find((c) => c.id === newItem.componentId);
      if (!comp) {
        return { success: false, error: `Componente ${newItem.componentName} no existe.` };
      }
      const oldItem = existingOrder.items.find((it) => it.componentId === newItem.componentId);
      const oldQty = oldItem ? oldItem.quantity : 0;
      const delta = newItem.quantity - oldQty;

      const available = comp.physicalStock - comp.reservedStock;
      if (delta > 0 && available < delta) {
        return {
          success: false,
          error: `No hay suficiente stock disponible para aumentar la cantidad de "${comp.name}". Disponible: ${available}, Requerido adicional: ${delta}.`,
        };
      }
    }

    // Apply reservedStock deltas (adjust only difference)
    setComponents((prev) => {
      return prev.map((comp) => {
        const oldItem = existingOrder.items.find((it) => it.componentId === comp.id);
        const newItem = orderData.items.find((it) => it.componentId === comp.id);

        const oldQty = oldItem ? oldItem.quantity : 0;
        const newQty = newItem ? newItem.quantity : 0;
        const delta = newQty - oldQty;

        if (delta !== 0) {
          return {
            ...comp,
            reservedStock: Math.max(0, comp.reservedStock + delta),
          };
        }
        return comp;
      });
    });

    const subtotal = orderData.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const total = subtotal;
    const advance = Math.max(0, Math.min(orderData.advancePayment || 0, total));
    const balance = total - advance;

    const newHistoryEntry: OrderHistoryEntry = {
      id: 'hist-' + Date.now(),
      timestamp: getFormattedNow(),
      user: currentUser?.name || 'Usuario',
      action: 'Pedido modificado',
      details: `Insumos actualizados. Total: Q${total.toFixed(2)}, Saldo: Q${balance.toFixed(2)}.`,
      badgeType: 'warning',
    };

    const updatedOrder: Order = {
      ...existingOrder,
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone,
      channel: orderData.channel,
      description: orderData.description,
      observations: orderData.observations || '',
      deliveryDate: orderData.deliveryDate,
      deliveryTime: orderData.deliveryTime,
      items: orderData.items,
      subtotal,
      total,
      advancePayment: advance,
      balance,
      history: [...existingOrder.history, newHistoryEntry],
    };

    setOrders((prev) => prev.map((o) => (o.id === id ? updatedOrder : o)));

    logAction({
      action: 'editar pedido',
      module: 'Pedidos',
      entityType: 'Order',
      recordId: existingOrder.code,
      description: `Modificación de insumos y datos del pedido ${existingOrder.code}`,
      previousValue: JSON.stringify({
        total: existingOrder.total,
        anticipo: existingOrder.advancePayment,
        saldo: existingOrder.balance,
        fechaEntrega: existingOrder.deliveryDate,
        itemsCount: existingOrder.items.length,
      }),
      newValue: JSON.stringify({
        total,
        anticipo: advance,
        saldo: balance,
        fechaEntrega: orderData.deliveryDate,
        itemsCount: orderData.items.length,
      }),
      metadata: { orderId: id },
    });

    addToast(`Pedido ${existingOrder.code} actualizado y reserva ajustada correctamente.`, 'success', 'Actualización exitosa');
    setSelectedOrderId(id);
    
    // Pop the 'order-detail' entry if it was pushed when clicking edit, so back from detail returns to the origin view
    setNavigationHistory((prev) => {
      const copy = [...prev];
      if (copy.length > 0 && copy[copy.length - 1].view === 'order-detail') {
        copy.pop();
      }
      return copy;
    });
    setActiveViewRaw('order-detail');

    return { success: true };
  };

  const changeOrderStatus = (id: string, newStatus: OrderStatus, note?: string): boolean => {
    const order = orders.find((o) => o.id === id);
    if (!order) return false;

    if (order.status === newStatus) {
      addToast(`El pedido ya se encuentra en estado "${newStatus}".`, 'info');
      return true;
    }

    if (order.status === 'Cancelado') {
      addToast('No se puede cambiar el estado de un pedido ya cancelado.', 'error');
      return false;
    }

    if (order.status === 'Entregado') {
      addToast('El pedido ya fue entregado y liquidado de inventario.', 'info');
      return false;
    }

    // Special case: Cancelled order -> release reservation
    if (newStatus === 'Cancelado') {
      return cancelOrder(id, note || 'Cancelado desde cambio de estado');
    }

    // Special case: Delivered order -> Physical deduction & release reservation
    if (newStatus === 'Entregado') {
      setComponents((prev) =>
        prev.map((comp) => {
          const item = order.items.find((it) => it.componentId === comp.id);
          if (item) {
            return {
              ...comp,
              physicalStock: Math.max(0, comp.physicalStock - item.quantity),
              reservedStock: Math.max(0, comp.reservedStock - item.quantity),
            };
          }
          return comp;
        })
      );
    }

    // Determine badge type
    let badgeType: 'primary' | 'success' | 'warning' | 'info' | 'danger' = 'info';
    if (newStatus === 'Listo') badgeType = 'success';
    if (newStatus === 'Entregado') badgeType = 'success';
    if (newStatus === 'En preparación') badgeType = 'info';

    const historyEntry: OrderHistoryEntry = {
      id: 'hist-' + Date.now(),
      timestamp: getFormattedNow(),
      user: currentUser?.name || 'Usuario',
      action: `Estado cambiado a ${newStatus}`,
      details: note
        ? note.trim()
        : newStatus === 'Entregado'
        ? 'Pedido entregado al cliente. Salida física de componentes aplicada.'
        : `El pedido avanzó al estado "${newStatus}".`,
      badgeType,
    };

    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status: newStatus,
              history: [...o.history, historyEntry],
            }
          : o
      )
    );

    logAction({
      action: 'cambiar estado',
      module: 'Pedidos',
      entityType: 'Order',
      recordId: order.code,
      description: `Cambio de estado del pedido ${order.code}: "${order.status}" ➔ "${newStatus}"${note ? ` (Nota: ${note})` : ''}`,
      previousValue: order.status,
      newValue: newStatus,
      metadata: { orderId: order.id, note },
    });

    addToast(
      newStatus === 'Entregado'
        ? `Pedido ${order.code} marcado como Entregado. Stock físico actualizado en taller.`
        : `Estado del pedido ${order.code} cambiado a "${newStatus}".`,
      'success'
    );
    return true;
  };

  const cancelOrder = (id: string, reason: string = 'Cancelación solicitada'): boolean => {
    const order = orders.find((o) => o.id === id);
    if (!order) return false;

    if (order.status === 'Cancelado') {
      addToast('El pedido ya está cancelado.', 'warning');
      return true;
    }

    // Release reserved stock (physicalStock does not change)
    setComponents((prev) =>
      prev.map((comp) => {
        const item = order.items.find((it) => it.componentId === comp.id);
        if (item) {
          return {
            ...comp,
            reservedStock: Math.max(0, comp.reservedStock - item.quantity),
          };
        }
        return comp;
      })
    );

    const historyEntry: OrderHistoryEntry = {
      id: 'hist-' + Date.now(),
      timestamp: getFormattedNow(),
      user: currentUser?.name || 'Usuario',
      action: 'Pedido cancelado',
      details: `Motivo: ${reason}. Insumos liberados de reserva y vueltos a poner disponibles.`,
      badgeType: 'danger',
    };

    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status: 'Cancelado',
              history: [...o.history, historyEntry],
            }
          : o
      )
    );

    logAction({
      action: 'cancelar pedido',
      module: 'Pedidos',
      entityType: 'Order',
      recordId: order.code,
      description: `Cancelación del pedido ${order.code}. Motivo: ${reason}. Insumos liberados de reserva.`,
      previousValue: order.status,
      newValue: 'Cancelado',
      metadata: { orderId: order.id, motivo: reason },
    });

    addToast(`Pedido ${order.code} cancelado y reserva de insumos liberada.`, 'info', 'Pedido cancelado');
    return true;
  };

  const registerOrderPayment = (
    orderId: string,
    amount: number,
    options?: {
      note?: string;
      markAsDeliveredIfSettled?: boolean;
      deliveryNote?: string;
    }
  ): {
    success: boolean;
    error?: string;
    newPaid?: number;
    newBalance?: number;
    markedAsDelivered?: boolean;
  } => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      addToast('Pedido no encontrado.', 'error');
      return { success: false, error: 'Pedido no encontrado.' };
    }

    if (order.status === 'Cancelado') {
      addToast('No se pueden registrar pagos a un pedido cancelado.', 'error');
      return { success: false, error: 'No se pueden registrar pagos a un pedido cancelado.' };
    }

    if (amount <= 0) {
      addToast('El monto del pago debe ser mayor a 0.', 'error');
      return { success: false, error: 'El monto debe ser mayor a 0.' };
    }

    // Round values to 2 decimal places
    const cleanAmount = Math.round(amount * 100) / 100;
    const currentBalance = Math.round(order.balance * 100) / 100;

    if (cleanAmount > currentBalance + 0.001) {
      const errorMsg = `El monto a pagar (Q ${cleanAmount.toFixed(2)}) no puede ser mayor al saldo pendiente (Q ${currentBalance.toFixed(2)}).`;
      addToast(errorMsg, 'error', 'Monto Excedido');
      return { success: false, error: errorMsg };
    }

    const effectiveAmount = Math.min(cleanAmount, currentBalance);
    const newPaid = Math.round((order.advancePayment + effectiveAmount) * 100) / 100;
    const newBalance = Math.max(0, Math.round((order.total - newPaid) * 100) / 100);

    const shouldDeliver =
      options?.markAsDeliveredIfSettled === true &&
      newBalance === 0 &&
      order.status !== 'Entregado';

    const historyEntries: OrderHistoryEntry[] = [
      {
        id: 'hist-' + Date.now(),
        timestamp: getFormattedNow(),
        user: currentUser?.name || 'Usuario',
        action: newBalance === 0 ? 'Pago completo liquidado' : 'Abono / Pago registrado',
        details: `Monto recibido: Q ${effectiveAmount.toFixed(2)}. Total pagado: Q ${newPaid.toFixed(2)}. Saldo restante: Q ${newBalance.toFixed(2)}.${options?.note ? ` Detalle: ${options.note}` : ''}`,
        badgeType: 'success',
      },
    ];

    if (shouldDeliver) {
      // Deduct physical inventory as the order is now fully settled and delivered
      setComponents((prev) =>
        prev.map((comp) => {
          const item = order.items.find((it) => it.componentId === comp.id);
          if (item) {
            return {
              ...comp,
              physicalStock: Math.max(0, comp.physicalStock - item.quantity),
              reservedStock: Math.max(0, comp.reservedStock - item.quantity),
            };
          }
          return comp;
        })
      );

      historyEntries.push({
        id: 'hist-' + (Date.now() + 1),
        timestamp: getFormattedNow(),
        user: currentUser?.name || 'Usuario',
        action: 'Estado cambiado a Entregado',
        details: options?.deliveryNote
          ? options.deliveryNote.trim()
          : 'Pedido liquidado y entregado al cliente.',
        badgeType: 'success',
      });
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              advancePayment: newPaid,
              balance: newBalance,
              status: shouldDeliver ? 'Entregado' : o.status,
              history: [...o.history, ...historyEntries],
            }
          : o
      )
    );

    logAction({
      action: 'registrar pago',
      module: 'Pedidos',
      entityType: 'Order',
      recordId: order.code,
      description: `Abono de Q ${effectiveAmount.toFixed(2)} registrado al pedido ${order.code}. Saldo: Q ${newBalance.toFixed(2)}${shouldDeliver ? ' (Entregado)' : ''}`,
      previousValue: JSON.stringify({ anticipo: order.advancePayment, saldo: order.balance, estado: order.status }),
      newValue: JSON.stringify({ anticipo: newPaid, saldo: newBalance, estado: shouldDeliver ? 'Entregado' : order.status }),
      metadata: {
        orderId: order.id,
        montoAbonado: effectiveAmount,
        liquidado: newBalance === 0,
        marcadoEntregado: shouldDeliver,
        nota: options?.note,
      },
    });

    if (shouldDeliver) {
      addToast(
        `Pago de Q ${effectiveAmount.toFixed(2)} registrado y pedido ${order.code} marcado como Entregado.`,
        'success',
        '¡Entrega y Pago Completados!'
      );
    } else if (newBalance === 0) {
      addToast(
        `Pago de Q ${effectiveAmount.toFixed(2)} registrado. El pedido ${order.code} ha sido liquidado al 100%.`,
        'success',
        'Saldo Liquidado'
      );
    } else {
      addToast(
        `Abono de Q ${effectiveAmount.toFixed(2)} registrado. Saldo pendiente restante: Q ${newBalance.toFixed(2)}.`,
        'info',
        'Abono Registrado'
      );
    }

    return {
      success: true,
      newPaid,
      newBalance,
      markedAsDelivered: shouldDeliver,
    };
  };

  // Catalog Functions
  const getCatalogItems = (key: CatalogKey, onlyActive: boolean = false): CatalogItem[] => {
    const list = catalogs[key] || [];
    if (onlyActive) {
      return list.filter((item) => item.active);
    }
    return list;
  };

  const getCatalogSelectOptions = (
    key: CatalogKey,
    params?: CatalogSelectOptionsParams
  ): AutocompleteOption[] => {
    return buildCatalogSelectOptions(catalogs[key], params);
  };

  const isCatalogItemInUse = (
    key: CatalogKey,
    name: string,
    id: string
  ): { inUse: boolean; count: number; details: string } => {
    const def = CATALOG_DEFINITIONS[key];
    const item = (catalogs[key] || []).find((it) => it.id === id) || {
      id,
      name,
      active: true,
    };
    if (def && typeof def.checkInUse === 'function') {
      return def.checkInUse(item as CatalogItem, {
        orders,
        components,
        stockLogs: stockAdjustmentLogs,
      });
    }
    return { inUse: false, count: 0, details: '' };
  };

  const addCatalogItem = (
    key: CatalogKey,
    itemData: Omit<CatalogItem, 'id' | 'createdAt' | 'updatedAt'>
  ): { success: boolean; item?: CatalogItem; error?: string } => {
    const trimmedName = itemData.name.trim();
    if (!trimmedName) {
      return { success: false, error: 'El nombre es requerido.' };
    }
    const currentList = catalogs[key] || [];
    if (currentList.some((it) => it.name.trim().toLowerCase() === trimmedName.toLowerCase())) {
      return { success: false, error: `Ya existe un registro con el nombre "${trimmedName}".` };
    }

    const now = new Date().toISOString();
    const newItem: CatalogItem = {
      ...itemData,
      name: trimmedName,
      id: `cat-${key}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };

    setCatalogs((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), newItem],
    }));

    // Keep legacy categories or units in sync if applicable
    if (key === 'component_categories') {
      setCategories((prev) => (prev.includes(trimmedName) ? prev : [...prev, trimmedName]));
    } else if (key === 'component_units') {
      setUnits((prev) => (prev.includes(trimmedName) ? prev : [...prev, trimmedName]));
    }

    logAction({
      action: 'crear catálogo',
      module: 'Catálogos',
      entityType: key,
      recordId: newItem.id,
      description: `Creación de elemento de catálogo "${newItem.name}" en ${key}`,
      previousValue: null,
      newValue: JSON.stringify(newItem),
      metadata: { catalogKey: key, name: newItem.name },
    });

    return { success: true, item: newItem };
  };

  const updateCatalogItem = (
    key: CatalogKey,
    id: string,
    itemData: Partial<CatalogItem>
  ): { success: boolean; error?: string } => {
    const currentList = catalogs[key] || [];
    const target = currentList.find((it) => it.id === id);
    if (!target) {
      return { success: false, error: 'Elemento no encontrado.' };
    }

    if (itemData.name) {
      const trimmedName = itemData.name.trim();
      const duplicate = currentList.find(
        (it) => it.id !== id && it.name.trim().toLowerCase() === trimmedName.toLowerCase()
      );
      if (duplicate) {
        return { success: false, error: `Ya existe un elemento llamado "${trimmedName}".` };
      }
    }

    const now = new Date().toISOString();
    setCatalogs((prev) => ({
      ...prev,
      [key]: (prev[key] || []).map((it) =>
        it.id === id
          ? {
              ...it,
              ...itemData,
              ...(itemData.name ? { name: itemData.name.trim() } : {}),
              updatedAt: now,
            }
          : it
      ),
    }));

    // Keep legacy categories / units in sync if renamed
    if (itemData.name && key === 'component_categories') {
      const oldName = target.name;
      const newName = itemData.name.trim();
      setCategories((prev) => prev.map((c) => (c === oldName ? newName : c)));
    } else if (itemData.name && key === 'component_units') {
      const oldName = target.name;
      const newName = itemData.name.trim();
      setUnits((prev) => prev.map((u) => (u === oldName ? newName : u)));
    }

    logAction({
      action: 'editar catálogo',
      module: 'Catálogos',
      entityType: key,
      recordId: id,
      description: `Actualización de elemento de catálogo "${target.name}" en ${key}`,
      previousValue: JSON.stringify(target),
      newValue: JSON.stringify({ ...target, ...itemData }),
      metadata: { catalogKey: key, id },
    });

    return { success: true };
  };

  const toggleCatalogItemActive = (
    key: CatalogKey,
    id: string
  ): { success: boolean; error?: string } => {
    const currentList = catalogs[key] || [];
    const target = currentList.find((it) => it.id === id);
    if (!target) {
      return { success: false, error: 'Elemento no encontrado.' };
    }

    const now = new Date().toISOString();
    const nextState = !target.active;
    setCatalogs((prev) => ({
      ...prev,
      [key]: (prev[key] || []).map((it) =>
        it.id === id ? { ...it, active: nextState, updatedAt: now } : it
      ),
    }));

    logAction({
      action: nextState ? 'activar catálogo' : 'desactivar catálogo',
      module: 'Catálogos',
      entityType: key,
      recordId: id,
      description: `${nextState ? 'Activación' : 'Desactivación'} de elemento "${target.name}" en ${key}`,
      previousValue: `Estado: ${target.active ? 'Activo' : 'Inactivo'}`,
      newValue: `Estado: ${nextState ? 'Activo' : 'Inactivo'}`,
      metadata: { catalogKey: key, id, active: nextState },
    });

    return { success: true };
  };

  const deleteCatalogItem = (
    key: CatalogKey,
    id: string
  ): { success: boolean; error?: string; inUse?: boolean } => {
    const currentList = catalogs[key] || [];
    const target = currentList.find((it) => it.id === id);
    if (!target) {
      return { success: false, error: 'Elemento no encontrado.' };
    }

    // Protection rule: Check if used historically
    const usage = isCatalogItemInUse(key, target.name, target.id);
    if (usage.inUse) {
      return {
        success: false,
        inUse: true,
        error: `No se puede eliminar físicamente "${target.name}" porque está registrado en registros históricos (${usage.details}). Por favor desactívelo en su lugar.`,
      };
    }

    setCatalogs((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((it) => it.id !== id),
    }));

    logAction({
      action: 'eliminar catálogo',
      module: 'Catálogos',
      entityType: key,
      recordId: id,
      description: `Eliminación de elemento de catálogo "${target.name}" en ${key}`,
      previousValue: JSON.stringify(target),
      newValue: null,
      metadata: { catalogKey: key, id, name: target.name },
    });

    return { success: true };
  };

  const resetDemoData = () => {
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]); // Elena Soto Admin
    setClients(INITIAL_CLIENTS);
    setCategories(INITIAL_CATEGORIES);
    setUnits(INITIAL_UNITS);
    setComponents(INITIAL_COMPONENTS);
    setOrders(INITIAL_ORDERS);
    setStockAdjustmentLogs(INITIAL_STOCK_LOGS);
    setCatalogs(getInitialCatalogs());
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setSelectedOrderId(null);
    setActiveView('components');
    addToast('Datos del sistema restablecidos a los valores iniciales.', 'info', 'Reinicio completo');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        login,
        logout,
        switchUserRole,
        updateUserProfile,
        updateUser,
        toggleUserActive,
        resetUserPassword,

        activeView,
        setActiveView,
        selectedOrderId,
        setSelectedOrderId,
        selectedClientId,
        setSelectedClientId,
        navigationHistory,
        navigateToView,
        navigateToOrderDetail,
        navigateToClientDetail,
        navigateToOrderEdit,
        navigateToOrderNew,
        goBack,
        canGoBack,

        newOrderInitialData,
        setNewOrderInitialData,

        ordersViewState,
        setOrdersViewState,
        calendarViewState,
        setCalendarViewState,
        componentsViewState,
        setComponentsViewState,
        clientsViewState,
        setClientsViewState,

        orders,
        createOrder,
        updateOrder,
        changeOrderStatus,
        cancelOrder,
        registerOrderPayment,

        components,
        categories,
        addCategory,
        units,
        addUnit,
        addComponent,
        updateComponent,
        adjustComponentStock,
        toggleComponentActive,
        stockAdjustmentLogs,

        clients,
        addClient,
        updateClient,

        toasts,
        addToast,
        removeToast,

        // Catalogs Management
        catalogs,
        getCatalogItems,
        getCatalogSelectOptions,
        addCatalogItem,
        updateCatalogItem,
        toggleCatalogItemActive,
        deleteCatalogItem,
        isCatalogItemInUse,

        // Central Audit Log / Bitácora
        auditLogs,
        logAction,

        resetDemoData,
        resetToInitialSeedData: resetDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

