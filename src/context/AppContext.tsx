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
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_CLIENTS,
  INITIAL_COMPONENTS,
  INITIAL_ORDERS,
  INITIAL_CATEGORIES,
  INITIAL_UNITS,
  INITIAL_STOCK_LOGS,
} from '../data/seedData';

interface AppContextType {
  // Auth & User
  currentUser: User | null;
  users: User[];
  login: (username: string, password?: string) => boolean;
  logout: () => void;
  switchUserRole: (role: 'Administrador' | 'Colaborador') => void;
  updateUserProfile: (name: string) => void;
  addUser: (userData: Omit<User, 'id'>) => void;
  updateUser: (id: string, userData: Partial<User>) => void;
  toggleUserActive: (id: string) => void;

  // Navigation
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;
  navigateToOrderDetail: (orderId: string) => void;
  navigateToOrderEdit: (orderId: string) => void;

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
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const [units, setUnits] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.UNITS);
      return saved ? JSON.parse(saved) : INITIAL_UNITS;
    } catch {
      return INITIAL_UNITS;
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

  // Navigation State
  const [activeView, setActiveView] = useState<ActiveView>('components');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Toast System State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync to LocalStorage on state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
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

  // Auth Methods
  const login = (username: string, password?: string): boolean => {
    const found = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!found) {
      addToast('Usuario no encontrado en el sistema.', 'error', 'Error de credenciales');
      return false;
    }
    if (!found.active) {
      addToast('Este usuario se encuentra inactivo. Contacte a la administración.', 'error', 'Acceso denegado');
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
    addToast(`¡Bienvenido/a ${found.name}!`, 'success', 'Sesión iniciada');
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
      addToast(`Cambiado al perfil simulado: ${target.name} (${role})`, 'info', 'Rol actualizado');
    }
  };

  const updateUserProfile = (name: string) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, name: name.trim() };
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    addToast('Perfil actualizado correctamente.', 'success');
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: 'usr-' + Date.now(),
    };
    setUsers((prev) => [...prev, newUser]);
    addToast(`Usuario ${newUser.name} registrado con éxito.`, 'success');
  };

  const updateUser = (id: string, userData: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...userData };
          if (currentUser?.id === id) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
    addToast('Usuario actualizado correctamente.', 'success');
  };

  const toggleUserActive = (id: string) => {
    const userToToggle = users.find((u) => u.id === id);
    if (!userToToggle) return;
    if (userToToggle.id === currentUser?.id) {
      addToast('No puede desactivar el usuario con el que tiene sesión activa.', 'warning');
      return;
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, active: !u.active } : u))
    );
    const newStatus = !userToToggle.active ? 'activado' : 'desactivado';
    addToast(`Usuario ${userToToggle.name} ${newStatus} correctamente.`, 'info');
  };

  // Navigation Helpers
  const navigateToOrderDetail = (orderId: string) => {
    setSelectedOrderId(orderId);
    setActiveView('order-detail');
  };

  const navigateToOrderEdit = (orderId: string) => {
    setSelectedOrderId(orderId);
    setActiveView('order-edit');
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
    addToast(`Cliente ${newClient.name} registrado correctamente.`, 'success');
    return newClient;
  };

  const updateClient = (id: string, clientData: Partial<Client>) => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...clientData } : c))
    );
    addToast('Datos del cliente actualizados.', 'success');
  };

  // Category Management
  const addCategory = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setCategories((prev) => [...prev, trimmed]);
      addToast(`Categoría "${trimmed}" agregada con éxito.`, 'success');
    }
  };

  // Units of Measure Management
  const addUnit = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!units.some((u) => u.toLowerCase() === trimmed.toLowerCase())) {
      setUnits((prev) => [...prev, trimmed]);
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
    if (item.category && !categories.some((c) => c.toLowerCase() === item.category.toLowerCase())) {
      setCategories((prev) => [...prev, item.category]);
    }

    // Ensure unit exists
    if (item.unit && !units.some((u) => u.toLowerCase() === item.unit.toLowerCase())) {
      setUnits((prev) => [...prev, item.unit]);
    }

    addToast('Componente creado correctamente.', 'success');
  };

  const updateComponent = (
    id: string,
    itemData: Partial<Omit<ComponentItem, 'id' | 'physicalStock' | 'reservedStock'>>
  ) => {
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
    if (itemData.category && !categories.some((c) => c.toLowerCase() === itemData.category!.toLowerCase())) {
      setCategories((prev) => [...prev, itemData.category!]);
    }

    // Ensure unit exists in list if updated
    if (itemData.unit && !units.some((u) => u.toLowerCase() === itemData.unit!.toLowerCase())) {
      setUnits((prev) => [...prev, itemData.unit!]);
    }

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

    addToast('Ajuste de stock aplicado correctamente.', 'success');
    return { success: true };
  };

  const toggleComponentActive = (id: string) => {
    const comp = components.find((c) => c.id === id);
    if (!comp) return;

    const nextState = !comp.active;
    setComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: nextState } : c))
    );

    if (nextState) {
      addToast(`Componente "${comp.name}" activado correctamente.`, 'success');
    } else {
      addToast('Componente desactivado correctamente.', 'info');
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

    addToast(`Pedido ${code} guardado correctamente y componentes reservados.`, 'success', '¡Éxito!');
    setSelectedOrderId(orderId);
    setActiveView('order-detail');

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
    addToast(`Pedido ${existingOrder.code} actualizado y reserva ajustada correctamente.`, 'success', 'Actualización exitosa');
    setSelectedOrderId(id);
    setActiveView('order-detail');

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

    addToast('Pedido cancelado y stock reservado liberado correctamente.', 'info', 'Pedido cancelado');
    return true;
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
    setSelectedOrderId(null);
    setActiveView('components');
    addToast('Datos del prototipo reiniciados a valores iniciales de prueba.', 'info', 'Reinicio completo');
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
        addUser,
        updateUser,
        toggleUserActive,

        activeView,
        setActiveView,
        selectedOrderId,
        setSelectedOrderId,
        navigateToOrderDetail,
        navigateToOrderEdit,

        orders,
        createOrder,
        updateOrder,
        changeOrderStatus,
        cancelOrder,

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

