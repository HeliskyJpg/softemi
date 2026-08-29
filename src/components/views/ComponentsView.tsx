import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Layers,
  Search,
  Plus,
  Edit2,
  SlidersHorizontal,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  History,
  Sparkles,
  Package,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Tag,
  Boxes,
  Power,
  Info,
  Filter,
  Check,
} from 'lucide-react';
import { ComponentCategory, ComponentItem, ComponentUnit } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';
import { AutocompleteSelect } from '../common/AutocompleteSelect';
import {
  ArrowDownLeft,
} from 'lucide-react';

export const formatUnitCount = (count: number, unit?: string): string => {
  const normalized = (unit || 'unidad').trim();
  const lower = normalized.toLowerCase();

  if (lower === 'unidad' || lower === 'unidades') {
    return count === 1 ? '1 unidad' : `${count} unidades`;
  }
  if (lower === 'tallo' || lower === 'tallos') {
    return count === 1 ? '1 tallo' : `${count} tallos`;
  }
  if (lower === 'rollo' || lower === 'rollos') {
    return count === 1 ? '1 rollo' : `${count} rollos`;
  }
  if (lower === 'paquete' || lower === 'paquetes') {
    return count === 1 ? '1 paquete' : `${count} paquetes`;
  }
  if (lower === 'docena' || lower === 'docenas') {
    return count === 1 ? '1 docena' : `${count} docenas`;
  }
  if (lower === 'metro' || lower === 'metros') {
    return count === 1 ? '1 metro' : `${count} metros`;
  }
  return count === 1 ? `1 ${normalized}` : `${count} ${normalized}`;
};

const PRESET_ADJUSTMENT_REASONS = [
  'Reabastecimiento / Compra de insumos',
  'Conteo físico / Cuadre de inventario',
  'Merma natural / Flor marchita',
  'Daño, rotura o empaque defectuoso',
  'Devolución o reintegración al taller',
  'Otro motivo particular',
];

export const ComponentsView: React.FC = () => {
  const {
    components,
    categories,
    addCategory,
    units,
    addUnit,
    currentUser,
    addComponent,
    updateComponent,
    adjustComponentStock,
    toggleComponentActive,
    stockAdjustmentLogs,
    addToast,
    componentsViewState,
    setComponentsViewState,
  } = useApp();

  const isAdmin = currentUser?.role === 'Administrador';

  const { activeTab, searchTerm, categoryFilter, statusFilter } = componentsViewState;

  const setActiveTab = (tab: 'catalog' | 'logs') => {
    setComponentsViewState((prev) => ({ ...prev, activeTab: tab }));
  };

  const setSearchTerm = (term: string) => {
    setComponentsViewState((prev) => ({ ...prev, searchTerm: term }));
  };

  const setCategoryFilter = (cat: string) => {
    setComponentsViewState((prev) => ({ ...prev, categoryFilter: cat }));
  };

  const setStatusFilter = (status: 'all' | 'available' | 'low_stock' | 'out_of_stock' | 'inactive') => {
    setComponentsViewState((prev) => ({ ...prev, statusFilter: status }));
  };

  // New/Edit Component Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingComponent, setEditingComponent] = useState<ComponentItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<string>('Flores');
  const [newCustomCategory, setNewCustomCategory] = useState('');
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [formUnit, setFormUnit] = useState<string>('Tallos');
  const [newCustomUnit, setNewCustomUnit] = useState('');
  const [isAddingNewUnit, setIsAddingNewUnit] = useState(false);
  const [formPrice, setFormPrice] = useState<number>(15.0);
  const [formInitialPhysicalStock, setFormInitialPhysicalStock] = useState<number>(20);
  const [formMinStock, setFormMinStock] = useState<number>(10);
  const [formDescription, setFormDescription] = useState('');
  const [formActive, setFormActive] = useState(true);

  // Stock Adjustment Modal State (Refined UI / UX)
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockComponent, setStockComponent] = useState<ComponentItem | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'Entrada' | 'Salida'>('Entrada');
  const [adjustmentQtyStr, setAdjustmentQtyStr] = useState<string>('10');
  const [adjustmentReason, setAdjustmentReason] = useState<string>(PRESET_ADJUSTMENT_REASONS[0]);
  const [adjustmentObservation, setAdjustmentObservation] = useState<string>('');
  const [stockModalErrors, setStockModalErrors] = useState<{
    quantity?: string;
    reason?: string;
    observation?: string;
    general?: string;
  }>({});

  // Deactivate/Activate Confirm Modal State
  const [showConfirmToggleModal, setShowConfirmToggleModal] = useState(false);
  const [componentToToggle, setComponentToToggle] = useState<ComponentItem | null>(null);

  // Helper for stock calculations
  const getAvailableStock = (comp: ComponentItem) => {
    return Math.max(0, comp.physicalStock - comp.reservedStock);
  };

  // Filtered components list
  const filteredComponents = useMemo(() => {
    return components.filter((comp) => {
      const matchesSearch =
        comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (comp.description && comp.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        comp.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = categoryFilter === 'Todas' || comp.category === categoryFilter;

      const available = getAvailableStock(comp);
      let matchesStatus = true;
      if (statusFilter === 'inactive') {
        matchesStatus = !comp.active;
      } else if (statusFilter === 'out_of_stock') {
        matchesStatus = comp.active && available <= 0;
      } else if (statusFilter === 'low_stock') {
        matchesStatus = comp.active && available > 0 && available <= comp.minStockAlert;
      } else if (statusFilter === 'available') {
        matchesStatus = comp.active && available > comp.minStockAlert;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [components, searchTerm, categoryFilter, statusFilter]);

  // Catalog Summary Metrics
  const summaryMetrics = useMemo(() => {
    const activeComps = components.filter((c) => c.active);
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalPhysical = 0;
    let totalReserved = 0;

    activeComps.forEach((c) => {
      const avail = getAvailableStock(c);
      if (avail <= 0) outOfStockCount++;
      else if (avail <= c.minStockAlert) lowStockCount++;
      totalPhysical += c.physicalStock;
      totalReserved += c.reservedStock;
    });

    return {
      total: components.length,
      active: activeComps.length,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
      totalPhysical,
      totalReserved,
      totalAvailable: Math.max(0, totalPhysical - totalReserved),
    };
  }, [components]);

  // Unique categories and units to ensure no duplicate keys in UI
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    const res: string[] = [];
    categories.forEach((c) => {
      const trimmed = c.trim();
      const lower = trimmed.toLowerCase();
      if (trimmed && !set.has(lower)) {
        set.add(lower);
        res.push(trimmed);
      }
    });
    return res;
  }, [categories]);

  const uniqueUnits = useMemo(() => {
    const set = new Set<string>();
    const res: string[] = [];
    units.forEach((u) => {
      const trimmed = u.trim();
      const lower = trimmed.toLowerCase();
      if (trimmed && !set.has(lower)) {
        set.add(lower);
        res.push(trimmed);
      }
    });
    return res;
  }, [units]);

  // Open Create Component Modal
  const handleOpenCreate = () => {
    setEditingComponent(null);
    setFormName('');
    setFormCategory(uniqueCategories[0] || 'Flores');
    setFormUnit(uniqueUnits[0] || 'Tallos');
    setFormPrice(15.0);
    setFormInitialPhysicalStock(25);
    setFormMinStock(10);
    setFormDescription('');
    setFormActive(true);
    setIsAddingNewCat(false);
    setNewCustomCategory('');
    setIsAddingNewUnit(false);
    setNewCustomUnit('');
    setShowEditModal(true);
  };

  // Open Edit Component Modal (Strictly NO physical stock field)
  const handleOpenEdit = (comp: ComponentItem) => {
    setEditingComponent(comp);
    setFormName(comp.name);
    setFormCategory(comp.category);
    setFormUnit(comp.unit || units[0] || 'Tallos');
    setFormPrice(comp.price);
    setFormMinStock(comp.minStockAlert);
    setFormDescription(comp.description || '');
    setFormActive(comp.active);
    setIsAddingNewCat(false);
    setNewCustomCategory('');
    setIsAddingNewUnit(false);
    setNewCustomUnit('');
    setShowEditModal(true);
  };

  // Save Component Submit
  const handleSaveComponent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      addToast('El nombre del componente es obligatorio.', 'error');
      return;
    }
    if (formPrice < 0) {
      addToast('El precio unitario no puede ser negativo.', 'error');
      return;
    }
    if (formMinStock < 0) {
      addToast('El stock mínimo de alerta no puede ser negativo.', 'error');
      return;
    }

    let finalCategory = formCategory;
    if (isAddingNewCat && newCustomCategory.trim()) {
      finalCategory = newCustomCategory.trim();
      addCategory(finalCategory);
    }

    let finalUnit = formUnit;
    if (isAddingNewUnit && newCustomUnit.trim()) {
      finalUnit = newCustomUnit.trim();
      addUnit(finalUnit);
    }

    if (editingComponent) {
      // STRICT RULE: Do not modify physicalStock or reservedStock here
      updateComponent(editingComponent.id, {
        name: formName.trim(),
        category: finalCategory,
        unit: finalUnit,
        price: Number(formPrice),
        minStockAlert: Number(formMinStock),
        description: formDescription.trim(),
        active: formActive,
      });
    } else {
      if (formInitialPhysicalStock < 0) {
        addToast('El stock físico inicial no puede ser negativo.', 'error');
        return;
      }
      addComponent({
        name: formName.trim(),
        category: finalCategory,
        unit: finalUnit,
        price: Number(formPrice),
        physicalStock: Number(formInitialPhysicalStock),
        minStockAlert: Number(formMinStock),
        description: formDescription.trim(),
        active: formActive,
      });
    }

    setShowEditModal(false);
  };

  // Open Stock Adjustment Modal
  const handleOpenStockAdjust = (comp: ComponentItem) => {
    setStockComponent(comp);
    setAdjustmentType('Entrada');
    setAdjustmentQtyStr('10');
    setAdjustmentReason(PRESET_ADJUSTMENT_REASONS[0]);
    setAdjustmentObservation('');
    setStockModalErrors({});
    setShowStockModal(true);
  };

  // Confirm Stock Adjustment Submit
  const handleConfirmStockAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockComponent) return;

    const errors: { quantity?: string; reason?: string; observation?: string; general?: string } = {};

    const qty = parseInt(adjustmentQtyStr, 10);
    if (!adjustmentQtyStr.trim() || isNaN(qty) || qty <= 0) {
      errors.quantity = 'Ingrese una cantidad válida mayor a 0.';
    } else if (adjustmentType === 'Salida') {
      const available = getAvailableStock(stockComponent);
      if (qty > available) {
        const availableText = formatUnitCount(available, stockComponent.unit);
        const reservedText =
          stockComponent.reservedStock > 0
            ? ` (${formatUnitCount(stockComponent.reservedStock, stockComponent.unit)} están reservadas en pedidos).`
            : '.';
        errors.quantity = `No puede retirar más de ${availableText} disponibles${reservedText}`;
      }
    }

    if (!adjustmentReason.trim()) {
      errors.reason = 'Seleccione un motivo.';
    }

    if (adjustmentObservation.length > 250) {
      errors.observation = 'El detalle no puede superar los 250 caracteres.';
    }

    if (Object.keys(errors).length > 0) {
      setStockModalErrors(errors);
      return;
    }

    setStockModalErrors({});

    const res = adjustComponentStock(stockComponent.id, {
      type: adjustmentType,
      quantity: qty,
      reason: adjustmentReason.trim(),
      observation: adjustmentObservation.trim(),
    });

    if (res.success) {
      setShowStockModal(false);
    } else {
      setStockModalErrors({ general: res.error || 'No fue posible guardar el ajuste. Intente nuevamente.' });
    }
  };

  // Prompt Toggle Active (Soft Delete)
  const handlePromptToggleActive = (comp: ComponentItem) => {
    setComponentToToggle(comp);
    setShowConfirmToggleModal(true);
  };

  // Confirm Toggle Active
  const handleConfirmToggleActive = () => {
    if (componentToToggle) {
      toggleComponentActive(componentToToggle.id);
      setShowConfirmToggleModal(false);
      setComponentToToggle(null);
    }
  };

  return (
    <div id="components-view-container" className="space-y-6 pb-16">
      {/* Header with Title and Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2C1E23] tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FBECEF] flex items-center justify-center text-[#681B2B]">
              <Layers className="w-4 h-4" />
            </div>
            Componentes y Stock de Taller
          </h1>
          <p className="text-xs sm:text-sm text-[#7D6871] mt-0.5">
            Control de insumos, flores y cálculo automático de existencias disponibles y reservadas.
          </p>
        </div>

        {isAdmin && (
          <button
            id="btn-new-component"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#681B2B] hover:bg-[#541421] text-white font-bold text-sm shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nuevo componente
          </button>
        )}
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-[#F2D6DE]/60 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#7D6871] font-medium">
            <span>Insumos Activos</span>
            <Package className="w-4 h-4 text-[#681B2B]" />
          </div>
          <div className="text-2xl font-extrabold text-[#2C1E23] mt-1.5">
            {summaryMetrics.active}{' '}
            <span className="text-xs font-normal text-[#7D6871]">/ {summaryMetrics.total} total</span>
          </div>
          <p className="text-[11px] text-[#7D6871] mt-0.5">Catálogo registrado en taller</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#F2D6DE]/60 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#7D6871] font-medium">
            <span>Stock Físico Total</span>
            <Boxes className="w-4 h-4 text-[#681B2B]" />
          </div>
          <div className="text-2xl font-extrabold text-[#2C1E23] mt-1.5">
            {summaryMetrics.totalPhysical}{' '}
            <span className="text-xs font-normal text-[#7D6871]">unids.</span>
          </div>
          <p className="text-[11px] text-[#7D6871] mt-0.5">
            {summaryMetrics.totalReserved} unids. reservadas en pedidos
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#F2D6DE]/60 shadow-xs">
          <div className="flex items-center justify-between text-xs text-amber-800 font-medium">
            <span>Bajo Stock (Alerta)</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-800 mt-1.5">
            {summaryMetrics.lowStock}
          </div>
          <p className="text-[11px] text-[#7D6871] mt-0.5">Disponibilidad ≤ stock mínimo</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#F2D6DE]/60 shadow-xs">
          <div className="flex items-center justify-between text-xs text-red-800 font-medium">
            <span>Insumos Agotados</span>
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-extrabold text-[#DC2626] mt-1.5">
            {summaryMetrics.outOfStock}
          </div>
          <p className="text-[11px] text-[#7D6871] mt-0.5">Disponibilidad igual a 0</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-[#F2D6DE]/60 pb-1">
        <div className="flex items-center gap-2 text-xs">
          <button
            id="tab-catalog"
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'catalog'
                ? 'bg-[#681B2B] text-white shadow-xs'
                : 'text-[#7D6871] hover:text-[#2C1E23] hover:bg-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Catálogo y Existencias ({components.length})
          </button>

          <button
            id="tab-logs"
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'bg-[#681B2B] text-white shadow-xs'
                : 'text-[#7D6871] hover:text-[#2C1E23] hover:bg-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Historial de Ajustes ({stockAdjustmentLogs.length})
          </button>
        </div>

        <div className="text-xs text-[#7D6871] hidden sm:block">
          <span className="font-semibold text-[#681B2B]">Regla operativa:</span> Disponible = Físico − Reservado
        </div>
      </div>

      {activeTab === 'catalog' ? (
        <>
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl p-4 border border-[#F2D6DE]/60 shadow-xs space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative md:col-span-2">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7D6871]">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  id="input-components-search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre, descripción o categoría..."
                  className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] bg-[#FBECEF]/20 focus:bg-white text-[#2C1E23] placeholder-[#7D6871]/60 focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20"
                />
              </div>

              {/* Category Filter */}
              <div>
                <select
                  id="select-components-category-filter"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] bg-white text-[#2C1E23] focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20 font-medium cursor-pointer"
                >
                  <option value="Todas">Categoría: Todas</option>
                  {uniqueCategories.map((cat) => (
                    <option key={`filter-cat-${cat}`} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  id="select-components-status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] bg-white text-[#2C1E23] focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20 font-medium cursor-pointer"
                >
                  <option value="all">Estado: Todos</option>
                  <option value="available">Disponibles</option>
                  <option value="low_stock">Bajo Stock</option>
                  <option value="out_of_stock">Agotados</option>
                  <option value="inactive">Inactivos / Desactivados</option>
                </select>
              </div>
            </div>
          </div>

          {/* Components Table */}
          <div className="bg-white rounded-2xl border border-[#F2D6DE]/60 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table id="table-components" className="w-full text-left text-xs">
                <thead className="bg-[#FBECEF]/40 border-b border-[#F2D6DE]/60 text-[#8C7A82] uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-bold">Componente / Insumo</th>
                    <th className="py-3 px-3 font-bold">Categoría</th>
                    <th className="py-3 px-3 font-bold text-right">Precio Unit.</th>
                    <th className="py-3 px-3 font-bold text-center">Físico</th>
                    <th className="py-3 px-3 font-bold text-center">Reservado</th>
                    <th className="py-3 px-3 font-bold text-center">Disponible</th>
                    <th className="py-3 px-3 font-bold text-center">Estado</th>
                    <th className="py-3 px-4 font-bold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2D6DE]/30">
                  {filteredComponents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#7D6871]">
                        <Layers className="w-8 h-8 mx-auto mb-2 text-[#F2D6DE]" />
                        <p className="font-semibold text-sm text-[#2C1E23]">
                          No se encontraron componentes
                        </p>
                        <p className="text-xs text-[#7D6871] mt-1">
                          Pruebe ajustando los filtros de búsqueda o registre un nuevo insumo.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredComponents.map((comp) => {
                      const available = getAvailableStock(comp);
                      const isOutOfStock = available <= 0;
                      const isLowStock = available > 0 && available <= comp.minStockAlert;

                      return (
                        <tr
                          key={comp.id}
                          id={`row-component-${comp.id}`}
                          className={`hover:bg-[#FBECEF]/20 transition-colors ${
                            !comp.active ? 'bg-gray-50/70 opacity-75' : ''
                          }`}
                        >
                          {/* Name & Description */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#2C1E23] text-sm">{comp.name}</span>
                              {!comp.active && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                                  Inactivo
                                </span>
                              )}
                            </div>
                            {comp.description && (
                              <div className="text-[11px] text-[#7D6871] truncate max-w-xs mt-0.5">
                                {comp.description}
                              </div>
                            )}
                          </td>

                          {/* Category */}
                          <td className="py-3 px-3">
                            <span className="px-2.5 py-1 rounded-full bg-gray-100 text-[#2C1E23] font-medium text-[11px] whitespace-nowrap">
                              {comp.category}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="py-3 px-3 text-right font-bold text-[#681B2B] whitespace-nowrap">
                            Q {comp.price.toFixed(2)}{' '}
                            <span className="text-[10px] font-normal text-[#7D6871]">
                              /{comp.unit || 'ud'}
                            </span>
                          </td>

                          {/* Physical Stock */}
                          <td className="py-3 px-3 text-center">
                            <span className="text-xs font-bold text-[#2C1E23] px-2 py-1 bg-gray-100 rounded-lg">
                              {comp.physicalStock} {comp.unit}
                            </span>
                          </td>

                          {/* Reserved Stock */}
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`text-xs font-bold px-2 py-1 rounded-lg ${
                                comp.reservedStock > 0
                                  ? 'bg-amber-50 text-amber-900 border border-amber-200'
                                  : 'text-[#7D6871] bg-gray-50'
                              }`}
                              title="Comprometido en pedidos confirmados"
                            >
                              {comp.reservedStock}
                            </span>
                          </td>

                          {/* Available Stock (Calculated) */}
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`text-xs font-extrabold px-2.5 py-1 rounded-xl ${
                                isOutOfStock
                                  ? 'bg-red-50 text-[#DC2626] border border-red-200'
                                  : isLowStock
                                  ? 'bg-amber-50 text-amber-900 border border-amber-200'
                                  : 'bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]'
                              }`}
                            >
                              {available} {comp.unit}
                            </span>
                          </td>

                          {/* Availability Badge */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {!comp.active ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                                Desactivado
                              </span>
                            ) : isOutOfStock ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-[#DC2626]">
                                <XCircle className="w-3 h-3" />
                                Agotado
                              </span>
                            ) : isLowStock ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-900">
                                <AlertTriangle className="w-3 h-3" />
                                Bajo stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#047857]">
                                <CheckCircle2 className="w-3 h-3" />
                                Disponible
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit Button */}
                              <button
                                id={`btn-edit-comp-${comp.id}`}
                                onClick={() => handleOpenEdit(comp)}
                                className="px-2.5 py-1.5 rounded-lg border border-[#F2D6DE] bg-white hover:bg-[#681B2B] hover:text-white text-[#681B2B] font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="Editar datos del componente (nombre, precio, etc.)"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                Editar
                              </button>

                              {/* Adjust Stock Button */}
                              <button
                                id={`btn-adjust-stock-${comp.id}`}
                                onClick={() => handleOpenStockAdjust(comp)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#681B2B] hover:bg-[#541421] text-white font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                                title="Registrar entrada o salida de inventario"
                              >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                Ajustar stock
                              </button>

                              {/* Toggle Active / Deactivate Button (Admin only) */}
                              {isAdmin && (
                                <button
                                  id={`btn-toggle-active-${comp.id}`}
                                  onClick={() => handlePromptToggleActive(comp)}
                                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                    comp.active
                                      ? 'border-gray-200 text-[#7D6871] hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                                      : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  }`}
                                  title={comp.active ? 'Desactivar componente' : 'Reactivar componente'}
                                >
                                  <Power className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Stock Adjustment Audit Logs Tab */
        <div className="bg-white rounded-2xl border border-[#F2D6DE]/60 shadow-xs overflow-hidden p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#F2D6DE]/40 pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#2C1E23] flex items-center gap-2">
                <History className="w-4 h-4 text-[#681B2B]" />
                Registro de Movimientos y Ajustes de Stock
              </h3>
              <p className="text-xs text-[#7D6871]">
                Auditoría histórica de entradas, salidas y motivos de ajuste manual.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-[#FBECEF] text-[#681B2B] rounded-full border border-[#F2D6DE]">
              {stockAdjustmentLogs.length} movimientos registrados
            </span>
          </div>

          <div className="overflow-x-auto border border-[#F2D6DE]/60 rounded-xl">
            <table id="table-stock-logs" className="w-full text-left text-xs">
              <thead className="bg-[#FBECEF]/40 text-[#8C7A82] uppercase text-[10px] tracking-wider border-b border-[#F2D6DE]/60">
                <tr>
                  <th className="py-2.5 px-3">Fecha y Hora</th>
                  <th className="py-2.5 px-3">Componente</th>
                  <th className="py-2.5 px-3 text-center">Tipo</th>
                  <th className="py-2.5 px-3 text-center">Cantidad</th>
                  <th className="py-2.5 px-3 text-center">Físico Previo</th>
                  <th className="py-2.5 px-3 text-center">Físico Nuevo</th>
                  <th className="py-2.5 px-3 text-center">Reservado</th>
                  <th className="py-2.5 px-3">Motivo / Detalle</th>
                  <th className="py-2.5 px-3">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2D6DE]/30">
                {stockAdjustmentLogs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-[#7D6871]">
                      No hay registros de ajustes de stock aún.
                    </td>
                  </tr>
                ) : (
                  stockAdjustmentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#FBECEF]/20 transition-colors">
                      <td className="py-2.5 px-3 text-[#7D6871] font-medium whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[#2C1E23]">
                        {log.componentName}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-[10px] ${
                            log.type === 'Entrada'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {log.type === 'Entrada' ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {log.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-extrabold text-[#2C1E23]">
                        {log.type === 'Entrada' ? `+${log.quantity}` : `-${log.quantity}`}
                      </td>
                      <td className="py-2.5 px-3 text-center font-medium text-[#7D6871]">
                        {log.previousPhysicalStock}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-[#681B2B]">
                        {log.newPhysicalStock}
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-amber-700">
                        {log.reservedStock}
                      </td>
                      <td className="py-2.5 px-3 text-[#2C1E23]">
                        <div className="font-semibold">{log.reason}</div>
                        {log.observation && (
                          <div className="text-[11px] text-[#7D6871] italic">{log.observation}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[#7D6871] font-medium whitespace-nowrap">
                        {log.user}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: NUEVO / EDITAR COMPONENTE */}
      {/* ============================================================ */}
      {showEditModal && (
        <div
          id="modal-component-form"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#F2D6DE] relative animate-in fade-in max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-[#7D6871] hover:text-[#2C1E23] p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-[#2C1E23] mb-1">
              {editingComponent ? 'Editar Componente' : 'Nuevo Componente'}
            </h3>
            <p className="text-xs text-[#7D6871] mb-4">
              {editingComponent
                ? 'Actualice las características generales del insumo. El stock físico se edita exclusivamente con Ajustar stock.'
                : 'Defina los datos del insumo y su existencia inicial para el taller.'}
            </p>

            {editingComponent && (
              <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                <div>
                  <span className="font-bold">Regla de inventario:</span> El stock físico actual es de{' '}
                  <strong>{editingComponent.physicalStock} {editingComponent.unit}</strong> ({editingComponent.reservedStock} reservadas). Para cambiar la existencia física use el botón <strong>"Ajustar stock"</strong>.
                </div>
              </div>
            )}

            <form onSubmit={handleSaveComponent} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-[#2C1E23] mb-1">
                  Nombre del Insumo / Flor <span className="text-red-500">*</span>
                </label>
                <input
                  id="input-comp-name"
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej. Rosas Rosadas de Exportación"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20 outline-none"
                />
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category Combobox */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#2C1E23]">
                      Categoría <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewCat(!isAddingNewCat)}
                      className="text-[11px] font-bold text-[#681B2B] hover:underline cursor-pointer"
                    >
                      {isAddingNewCat ? 'Seleccionar existente' : '+ Nueva categoría'}
                    </button>
                  </div>

                  {isAddingNewCat ? (
                    <input
                      type="text"
                      required
                      value={newCustomCategory}
                      onChange={(e) => setNewCustomCategory(e.target.value)}
                      placeholder="Escriba nueva categoría..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20 outline-none bg-white font-medium"
                    />
                  ) : (
                    <select
                      id="select-comp-category"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20 outline-none bg-white font-medium cursor-pointer"
                    >
                      {uniqueCategories.map((c) => (
                        <option key={`modal-cat-${c}`} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Measurement Unit */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#2C1E23]">
                      Unidad de Medida <span className="text-red-500">*</span>
                    </label>
                    <button
                      id="btn-toggle-new-unit"
                      type="button"
                      onClick={() => setIsAddingNewUnit(!isAddingNewUnit)}
                      className="text-[11px] font-bold text-[#681B2B] hover:underline cursor-pointer"
                    >
                      {isAddingNewUnit ? 'Seleccionar existente' : '+ Nueva unidad'}
                    </button>
                  </div>

                  {isAddingNewUnit ? (
                    <input
                      id="input-custom-unit"
                      type="text"
                      required
                      value={newCustomUnit}
                      onChange={(e) => setNewCustomUnit(e.target.value)}
                      placeholder="Ej. Docena, Paquete de 25, Kilos..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20 outline-none bg-white font-medium"
                    />
                  ) : (
                    <select
                      id="select-comp-unit"
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20 outline-none bg-white font-medium cursor-pointer"
                    >
                      {uniqueUnits.map((u) => (
                        <option key={`modal-unit-${u}`} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Price & Min Stock & Initial Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Unit Price */}
                <div>
                  <label className="block text-xs font-bold text-[#2C1E23] mb-1">
                    Precio Unitario (Q) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-comp-price"
                    type="number"
                    min={0}
                    step="any"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20 outline-none font-bold text-[#681B2B]"
                  />
                </div>

                {/* Min Stock Alert */}
                <div>
                  <label className="block text-xs font-bold text-[#2C1E23] mb-1">
                    Stock Mínimo para Alerta
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20 outline-none"
                  />
                </div>
              </div>

              {/* Initial Physical Stock (ONLY when creating) */}
              {!editingComponent && (
                <div className="p-3 bg-[#FBECEF]/30 rounded-xl border border-[#F2D6DE]">
                  <label className="block text-xs font-bold text-[#2C1E23] mb-1">
                    Stock Físico Inicial en Taller <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-comp-initial-stock"
                    type="number"
                    min={0}
                    required
                    value={formInitialPhysicalStock}
                    onChange={(e) => setFormInitialPhysicalStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20 outline-none font-bold text-[#059669] bg-white"
                  />
                  <p className="text-[11px] text-[#7D6871] mt-1">
                    Cantidad física disponible inmediatamente para pedidos.
                  </p>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-[#2C1E23] mb-1">
                  Descripción / Observaciones
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detalles sobre presentación, color, proveedor o cuidado..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#F2D6DE] focus:ring-2 focus:ring-[#681B2B]/20 outline-none resize-none"
                />
              </div>

              {/* State (Active / Inactive) */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="checkbox-comp-active"
                  type="checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="w-4 h-4 text-[#681B2B] rounded border-gray-300 focus:ring-[#681B2B]"
                />
                <label htmlFor="checkbox-comp-active" className="text-xs font-bold text-[#2C1E23] cursor-pointer">
                  Componente activo (disponible para armar pedidos)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-[#F2D6DE]/40">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs font-medium text-[#7D6871] hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-save-component"
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#681B2B] hover:bg-[#541421] text-white rounded-xl shadow-xs cursor-pointer"
                >
                  {editingComponent ? 'Guardar Cambios' : 'Crear Componente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: AJUSTAR STOCK (REFINED MODAL) */}
      {/* ============================================================ */}
      {showStockModal && stockComponent && (
        <div
          id="modal-adjust-stock"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#F2D6DE] relative animate-in fade-in max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              id="btn-close-adjust-stock-modal"
              onClick={() => setShowStockModal(false)}
              className="absolute top-4 right-4 text-[#7D6871] hover:text-[#2C1E23] p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              title="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="pr-8 mb-3.5">
              <h3 className="text-lg font-bold text-[#2C1E23] tracking-tight">
                Ajustar stock
              </h3>
              <p className="text-xs text-[#7D6871] mt-0.5 font-medium truncate">
                {stockComponent.name} · {stockComponent.category}
              </p>
            </div>

            {/* Stock Actual Context Row (Compact without independent cards) */}
            <div className="bg-[#FBECEF]/40 border border-[#F2D6DE]/70 rounded-xl px-3.5 py-2.5 text-xs flex flex-wrap items-center justify-between gap-y-1 mb-4">
              <span className="text-[#7D6871] font-semibold text-xs">Stock actual</span>
              <div className="flex items-center gap-2 sm:gap-2.5 font-medium text-xs text-[#2C1E23]">
                <span>
                  Total <strong className="font-bold text-[#2C1E23]">{stockComponent.physicalStock}</strong>
                </span>
                <span className="text-[#D9A3B5] font-bold">·</span>
                <span>
                  Reservado <strong className="font-bold text-amber-800">{stockComponent.reservedStock}</strong>
                </span>
                <span className="text-[#D9A3B5] font-bold">·</span>
                <span>
                  Disponible <strong className="font-bold text-emerald-800">{getAvailableStock(stockComponent)}</strong>
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmStockAdjust} className="space-y-4">
              {/* 1. Tipo de Movimiento */}
              <div>
                <label className="block text-xs font-bold text-[#2C1E23] mb-1.5">
                  Tipo de movimiento <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Entrada */}
                  <button
                    type="button"
                    id="btn-type-entrada"
                    onClick={() => {
                      setAdjustmentType('Entrada');
                      setStockModalErrors((prev) => ({ ...prev, quantity: undefined }));
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      adjustmentType === 'Entrada'
                        ? 'bg-emerald-50/70 border-emerald-600 ring-1 ring-emerald-600/30 shadow-2xs'
                        : 'bg-white border-[#F2D6DE] hover:border-[#D9A3B5] hover:bg-[#FBECEF]/20'
                    }`}
                  >
                    <div className="min-w-0 pr-1.5">
                      <span
                        className={`block text-xs sm:text-sm font-bold ${
                          adjustmentType === 'Entrada' ? 'text-emerald-950' : 'text-[#2C1E23]'
                        }`}
                      >
                        Entrada
                      </span>
                      <span className="block text-[11px] text-[#7D6871] mt-0.5 font-normal">
                        Aumenta existencias
                      </span>
                    </div>
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        adjustmentType === 'Entrada'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 text-[#7D6871]'
                      }`}
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                    </div>
                  </button>

                  {/* Salida */}
                  <button
                    type="button"
                    id="btn-type-salida"
                    onClick={() => {
                      setAdjustmentType('Salida');
                      setStockModalErrors((prev) => ({ ...prev, quantity: undefined }));
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      adjustmentType === 'Salida'
                        ? 'bg-red-50/70 border-red-500 ring-1 ring-red-500/30 shadow-2xs'
                        : 'bg-white border-[#F2D6DE] hover:border-[#D9A3B5] hover:bg-[#FBECEF]/20'
                    }`}
                  >
                    <div className="min-w-0 pr-1.5">
                      <span
                        className={`block text-xs sm:text-sm font-bold ${
                          adjustmentType === 'Salida' ? 'text-red-950' : 'text-[#2C1E23]'
                        }`}
                      >
                        Salida
                      </span>
                      <span className="block text-[11px] text-[#7D6871] mt-0.5 font-normal">
                        Reduce existencias
                      </span>
                    </div>
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        adjustmentType === 'Salida'
                          ? 'bg-[#DC2626] text-white'
                          : 'bg-gray-100 text-[#7D6871]'
                      }`}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. Cantidad */}
              <div>
                <label
                  htmlFor="input-adjustment-quantity"
                  className="block text-xs font-bold text-[#2C1E23] mb-1"
                >
                  Cantidad ({stockComponent.unit || 'unidades'}) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="input-adjustment-quantity"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={adjustmentQtyStr}
                    onKeyDown={(e) => {
                      if (['-', '+', '.', ',', 'e', 'E'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const sanitized = e.target.value.replace(/[^0-9]/g, '');
                      setAdjustmentQtyStr(sanitized);
                      if (stockModalErrors.quantity) {
                        setStockModalErrors((prev) => ({ ...prev, quantity: undefined }));
                      }
                    }}
                    placeholder="Ej. 10"
                    className={`w-full px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl border bg-white outline-none transition-all ${
                      stockModalErrors.quantity
                        ? 'border-red-400 ring-2 ring-red-100 text-red-950'
                        : 'border-[#F2D6DE] focus:border-[#681B2B] focus:ring-2 focus:ring-[#681B2B]/15 text-[#2C1E23]'
                    }`}
                  />
                </div>
                {stockModalErrors.quantity && (
                  <p className="text-[11px] text-red-600 font-semibold mt-1.5 flex items-center gap-1">
                    {stockModalErrors.quantity}
                  </p>
                )}
              </div>

              {/* 3. Motivo del Ajuste (Autocomplete) */}
              <div>
                <AutocompleteSelect
                  id="select-adjustment-reason"
                  label="Motivo del ajuste"
                  required
                  options={PRESET_ADJUSTMENT_REASONS}
                  value={adjustmentReason}
                  onChange={(val) => {
                    setAdjustmentReason(val);
                    if (stockModalErrors.reason) {
                      setStockModalErrors((prev) => ({ ...prev, reason: undefined }));
                    }
                  }}
                  error={!!stockModalErrors.reason}
                  errorMessage={stockModalErrors.reason}
                  placeholder="Seleccione o busque un motivo..."
                />
              </div>

              {/* 4. Detalle adicional (Textarea + Character Counter) */}
              <div>
                <label
                  htmlFor="textarea-adjustment-observation"
                  className="block text-xs font-bold text-[#2C1E23] mb-1"
                >
                  Detalle adicional (opcional)
                </label>
                <textarea
                  id="textarea-adjustment-observation"
                  rows={3}
                  maxLength={250}
                  value={adjustmentObservation}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAdjustmentObservation(val);
                    if (val.length <= 250 && stockModalErrors.observation) {
                      setStockModalErrors((prev) => ({ ...prev, observation: undefined }));
                    }
                  }}
                  placeholder="Explicación del ajuste, referencia, observaciones o incidencias..."
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-white outline-none transition-all resize-none ${
                    stockModalErrors.observation
                      ? 'border-red-400 ring-2 ring-red-100'
                      : 'border-[#F2D6DE] focus:border-[#681B2B] focus:ring-2 focus:ring-[#681B2B]/15'
                  }`}
                />
                <div className="flex items-center justify-between mt-1 text-[11px]">
                  {stockModalErrors.observation ? (
                    <span className="text-red-600 font-semibold">
                      {stockModalErrors.observation}
                    </span>
                  ) : (
                    <span />
                  )}
                  <span
                    className={`ml-auto font-medium transition-colors ${
                      adjustmentObservation.length >= 250
                        ? 'text-red-600 font-bold'
                        : adjustmentObservation.length >= 230
                        ? 'text-amber-700 font-semibold'
                        : 'text-[#7D6871]'
                    }`}
                  >
                    {adjustmentObservation.length} / 250 caracteres
                  </span>
                </div>
              </div>

              {/* 5. Compact Result Preview (Clean without large cards) */}
              {(() => {
                const qty = parseInt(adjustmentQtyStr, 10);
                const available = getAvailableStock(stockComponent);
                const isValidNumber = !isNaN(qty) && qty > 0;
                const isExceedingSalida =
                  adjustmentType === 'Salida' && isValidNumber && qty > available;

                if (!isValidNumber || isExceedingSalida) {
                  return null;
                }

                const newPhysical =
                  adjustmentType === 'Entrada'
                    ? stockComponent.physicalStock + qty
                    : stockComponent.physicalStock - qty;
                const newAvailable = Math.max(0, newPhysical - stockComponent.reservedStock);

                return (
                  <div className="px-3.5 py-2.5 rounded-xl bg-gray-50/90 border border-gray-200/80 flex items-center justify-between text-xs text-[#2C1E23]">
                    <span className="text-[#7D6871] font-medium">
                      Resultado después del ajuste
                    </span>
                    <div className="flex items-center gap-2.5 text-xs font-semibold">
                      <span>
                        Total <strong className="font-bold text-[#681B2B]">{newPhysical}</strong>
                      </span>
                      <span className="text-gray-300 font-bold">·</span>
                      <span>
                        Disponible{' '}
                        <strong className="font-bold text-emerald-800">{newAvailable}</strong>
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* General error message if any */}
              {stockModalErrors.general && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-700 font-medium">
                  {stockModalErrors.general}
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F2D6DE]/40">
                <button
                  type="button"
                  id="btn-cancel-stock-adjust"
                  onClick={() => setShowStockModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#7D6871] hover:text-[#2C1E23] hover:bg-gray-100 rounded-xl cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  id="btn-confirm-stock-adjust"
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#681B2B] hover:bg-[#541421] text-white rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  Guardar ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: CONFIRMAR ACTIVAR / DESACTIVAR */}
      {/* ============================================================ */}
      <ConfirmModal
        isOpen={showConfirmToggleModal}
        onClose={() => setShowConfirmToggleModal(false)}
        onConfirm={handleConfirmToggleActive}
        title={componentToToggle?.active ? 'Desactivar Componente' : 'Activar Componente'}
        message={
          componentToToggle?.active
            ? `¿Desea desactivar "${componentToToggle.name}"? Ya no estará disponible para nuevos pedidos personalizados, pero se conservará en el historial de pedidos existentes.`
            : `¿Desea reactivar "${componentToToggle?.name}" para que pueda ser utilizado en nuevos pedidos?`
        }
        confirmText={componentToToggle?.active ? 'Desactivar' : 'Activar'}
        type={componentToToggle?.active ? 'warning' : 'success'}
      />
    </div>
  );
};
