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
  } = useApp();

  const isAdmin = currentUser?.role === 'Administrador';

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'catalog' | 'logs'>('catalog');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Todas');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'low_stock' | 'out_of_stock' | 'inactive'>('all');

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

  // Stock Adjustment Modal State (Independent Action)
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockComponent, setStockComponent] = useState<ComponentItem | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'Entrada' | 'Salida'>('Entrada');
  const [adjustmentQty, setAdjustmentQty] = useState<number>(10);
  const [adjustmentReason, setAdjustmentReason] = useState<string>(PRESET_ADJUSTMENT_REASONS[0]);
  const [adjustmentObservation, setAdjustmentObservation] = useState<string>('');

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
    setAdjustmentQty(10);
    setAdjustmentReason(PRESET_ADJUSTMENT_REASONS[0]);
    setAdjustmentObservation('');
    setShowStockModal(true);
  };

  // Confirm Stock Adjustment Submit
  const handleConfirmStockAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockComponent) return;
    if (adjustmentQty <= 0) {
      addToast('La cantidad a ajustar debe ser mayor a 0.', 'error');
      return;
    }

    const available = getAvailableStock(stockComponent);
    if (adjustmentType === 'Salida' && adjustmentQty > available) {
      addToast(
        `No es posible descontar ${adjustmentQty} ${stockComponent.unit}. Solo hay ${available} disponibles (existen ${stockComponent.reservedStock} reservadas para pedidos).`,
        'error',
        'Ajuste rechazado'
      );
      return;
    }

    const res = adjustComponentStock(stockComponent.id, {
      type: adjustmentType,
      quantity: Number(adjustmentQty),
      reason: adjustmentReason,
      observation: adjustmentObservation.trim(),
    });

    if (res.success) {
      setShowStockModal(false);
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
          <h1 className="text-2xl font-bold text-[#3A2D33] tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FBDAE3] flex items-center justify-center text-[#8E315E]">
              <Layers className="w-5 h-5" />
            </div>
            Componentes y Stock de Taller
          </h1>
          <p className="text-xs sm:text-sm text-[#6D5C64] mt-1">
            Control de insumos, flores y cálculo automático de existencias disponibles y reservadas.
          </p>
        </div>

        {isAdmin && (
          <button
            id="btn-new-component"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#8E315E] hover:bg-[#7A294F] text-white font-bold text-sm shadow-sm transition-all cursor-pointer hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            + Nuevo componente
          </button>
        )}
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-[#FBDAE3] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#6D5C64] font-medium">
            <span>Insumos Activos</span>
            <Package className="w-4 h-4 text-[#8E315E]" />
          </div>
          <div className="text-2xl font-extrabold text-[#3A2D33] mt-1.5">
            {summaryMetrics.active}{' '}
            <span className="text-xs font-normal text-[#6D5C64]">/ {summaryMetrics.total} total</span>
          </div>
          <p className="text-[11px] text-[#6D5C64] mt-0.5">Catálogo registrado en taller</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#EBF1DE] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#4F5B2F] font-medium">
            <span>Stock Físico Total</span>
            <Boxes className="w-4 h-4 text-[#65733D]" />
          </div>
          <div className="text-2xl font-extrabold text-[#4F5B2F] mt-1.5">
            {summaryMetrics.totalPhysical}{' '}
            <span className="text-xs font-normal text-[#6D5C64]">unids.</span>
          </div>
          <p className="text-[11px] text-[#6D5C64] mt-0.5">
            {summaryMetrics.totalReserved} unids. reservadas en pedidos
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-amber-800 font-medium">
            <span>Bajo Stock (Alerta)</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-800 mt-1.5">
            {summaryMetrics.lowStock}
          </div>
          <p className="text-[11px] text-[#6D5C64] mt-0.5">Disponibilidad ≤ stock mínimo</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-red-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-red-800 font-medium">
            <span>Insumos Agotados</span>
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-extrabold text-[#9B2C2C] mt-1.5">
            {summaryMetrics.outOfStock}
          </div>
          <p className="text-[11px] text-[#6D5C64] mt-0.5">Disponibilidad igual a 0</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-[#FBDAE3] pb-1">
        <div className="flex items-center gap-2 text-xs">
          <button
            id="tab-catalog"
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'catalog'
                ? 'bg-[#8E315E] text-white shadow-xs'
                : 'text-[#6D5C64] hover:text-[#3A2D33] hover:bg-white'
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
                ? 'bg-[#8E315E] text-white shadow-xs'
                : 'text-[#6D5C64] hover:text-[#3A2D33] hover:bg-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Historial de Ajustes ({stockAdjustmentLogs.length})
          </button>
        </div>

        <div className="text-xs text-[#6D5C64] hidden sm:block">
          <span className="font-semibold text-[#8E315E]">Regla operativa:</span> Disponible = Físico − Reservado
        </div>
      </div>

      {activeTab === 'catalog' ? (
        <>
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl p-4 border border-[#FBDAE3] shadow-xs space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative md:col-span-2">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6D5C64]">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  id="input-components-search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre, descripción o categoría..."
                  className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-[#FBDAE3] bg-[#FFF7FA]/40 focus:bg-white text-[#3A2D33] placeholder-[#6D5C64]/60 focus:outline-none focus:ring-2 focus:ring-[#8E315E]/30"
                />
              </div>

              {/* Category Filter */}
              <div>
                <select
                  id="select-components-category-filter"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#FBDAE3] bg-white text-[#3A2D33] focus:outline-none focus:ring-2 focus:ring-[#8E315E]/30 font-medium cursor-pointer"
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
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#FBDAE3] bg-white text-[#3A2D33] focus:outline-none focus:ring-2 focus:ring-[#8E315E]/30 font-medium cursor-pointer"
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
          <div className="bg-white rounded-2xl border border-[#FBDAE3] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table id="table-components" className="w-full text-left text-xs">
                <thead className="bg-[#FFF7FA] border-b border-[#FBDAE3] text-[#6D5C64] uppercase text-[10px] tracking-wider">
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
                <tbody className="divide-y divide-gray-100">
                  {filteredComponents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#6D5C64]">
                        <Layers className="w-8 h-8 mx-auto mb-2 text-[#FBDAE3]" />
                        <p className="font-semibold text-sm text-[#3A2D33]">
                          No se encontraron componentes
                        </p>
                        <p className="text-xs text-[#6D5C64] mt-1">
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
                          className={`hover:bg-[#FFF7FA]/80 transition-colors ${
                            !comp.active ? 'bg-gray-50/70 opacity-75' : ''
                          }`}
                        >
                          {/* Name & Description */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#3A2D33] text-sm">{comp.name}</span>
                              {!comp.active && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                                  Inactivo
                                </span>
                              )}
                            </div>
                            {comp.description && (
                              <div className="text-[11px] text-[#6D5C64] truncate max-w-xs mt-0.5">
                                {comp.description}
                              </div>
                            )}
                          </td>

                          {/* Category */}
                          <td className="py-3 px-3">
                            <span className="px-2.5 py-1 rounded-full bg-gray-100 text-[#3A2D33] font-medium text-[11px] whitespace-nowrap">
                              {comp.category}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="py-3 px-3 text-right font-bold text-[#8E315E] whitespace-nowrap">
                            Q {comp.price.toFixed(2)}{' '}
                            <span className="text-[10px] font-normal text-[#6D5C64]">
                              /{comp.unit || 'ud'}
                            </span>
                          </td>

                          {/* Physical Stock */}
                          <td className="py-3 px-3 text-center">
                            <span className="text-xs font-bold text-[#3A2D33] px-2 py-1 bg-gray-100 rounded-lg">
                              {comp.physicalStock} {comp.unit}
                            </span>
                          </td>

                          {/* Reserved Stock */}
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`text-xs font-bold px-2 py-1 rounded-lg ${
                                comp.reservedStock > 0
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                  : 'text-[#6D5C64] bg-gray-50'
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
                                  ? 'bg-red-100 text-[#9B2C2C] border border-red-200'
                                  : isLowStock
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                  : 'bg-[#EBF1DE] text-[#4F5B2F] border border-[#D5E2BA]'
                              }`}
                            >
                              {available} {comp.unit}
                            </span>
                          </td>

                          {/* Availability Badge */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {!comp.active ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                                Desactivado
                              </span>
                            ) : isOutOfStock ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-[#9B2C2C]">
                                <XCircle className="w-3 h-3" />
                                Agotado
                              </span>
                            ) : isLowStock ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                                <AlertTriangle className="w-3 h-3" />
                                Bajo stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF1DE] text-[#4F5B2F]">
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
                                className="px-2.5 py-1.5 rounded-lg border border-[#FBDAE3] bg-white hover:bg-[#8E315E] hover:text-white text-[#8E315E] font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="Editar datos del componente (nombre, precio, etc.)"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                Editar
                              </button>

                              {/* Adjust Stock Button */}
                              <button
                                id={`btn-adjust-stock-${comp.id}`}
                                onClick={() => handleOpenStockAdjust(comp)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#65733D] hover:bg-[#546032] text-white font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
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
                                      ? 'border-gray-200 text-[#6D5C64] hover:bg-red-50 hover:text-red-600 hover:border-red-200'
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
        <div className="bg-white rounded-2xl border border-[#FBDAE3] shadow-xs overflow-hidden p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#3A2D33] flex items-center gap-2">
                <History className="w-4 h-4 text-[#8E315E]" />
                Registro de Movimientos y Ajustes de Stock
              </h3>
              <p className="text-xs text-[#6D5C64]">
                Auditoría histórica de entradas, salidas y motivos de ajuste manual.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-[#FFF7FA] text-[#8E315E] rounded-full border border-[#FBDAE3]">
              {stockAdjustmentLogs.length} movimientos registrados
            </span>
          </div>

          <div className="overflow-x-auto border border-[#FBDAE3] rounded-xl">
            <table id="table-stock-logs" className="w-full text-left text-xs">
              <thead className="bg-[#FFF7FA] text-[#6D5C64] uppercase text-[10px] tracking-wider border-b border-[#FBDAE3]">
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
              <tbody className="divide-y divide-gray-100">
                {stockAdjustmentLogs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-[#6D5C64]">
                      No hay registros de ajustes de stock aún.
                    </td>
                  </tr>
                ) : (
                  stockAdjustmentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#FFF7FA]/50 transition-colors">
                      <td className="py-2.5 px-3 text-[#6D5C64] font-medium whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[#3A2D33]">
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
                      <td className="py-2.5 px-3 text-center font-extrabold text-[#3A2D33]">
                        {log.type === 'Entrada' ? `+${log.quantity}` : `-${log.quantity}`}
                      </td>
                      <td className="py-2.5 px-3 text-center font-medium text-[#6D5C64]">
                        {log.previousPhysicalStock}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-[#8E315E]">
                        {log.newPhysicalStock}
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-amber-700">
                        {log.reservedStock}
                      </td>
                      <td className="py-2.5 px-3 text-[#3A2D33]">
                        <div className="font-semibold">{log.reason}</div>
                        {log.observation && (
                          <div className="text-[11px] text-[#6D5C64] italic">{log.observation}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[#6D5C64] font-medium whitespace-nowrap">
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
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#FBDAE3] relative animate-in fade-in max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-[#6D5C64] hover:text-[#3A2D33] p-1.5 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-[#3A2D33] mb-1">
              {editingComponent ? 'Editar Componente' : 'Nuevo Componente'}
            </h3>
            <p className="text-xs text-[#6D5C64] mb-4">
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
                <label className="block text-xs font-bold text-[#3A2D33] mb-1">
                  Nombre del Insumo / Flor <span className="text-red-500">*</span>
                </label>
                <input
                  id="input-comp-name"
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej. Rosas Rosadas de Exportación"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#FBDAE3] focus:ring-2 focus:ring-[#8E315E]/30 outline-none"
                />
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category Combobox */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#3A2D33]">
                      Categoría <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewCat(!isAddingNewCat)}
                      className="text-[11px] font-bold text-[#8E315E] hover:underline cursor-pointer"
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
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#FBDAE3] focus:ring-2 focus:ring-[#8E315E]/30 outline-none bg-white font-medium"
                    />
                  ) : (
                    <select
                      id="select-comp-category"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#FBDAE3] focus:ring-2 focus:ring-[#8E315E]/30 outline-none bg-white font-medium"
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
                    <label className="block text-xs font-bold text-[#3A2D33]">
                      Unidad de Medida <span className="text-red-500">*</span>
                    </label>
                    <button
                      id="btn-toggle-new-unit"
                      type="button"
                      onClick={() => setIsAddingNewUnit(!isAddingNewUnit)}
                      className="text-[11px] font-bold text-[#8E315E] hover:underline cursor-pointer"
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
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#FBDAE3] focus:ring-2 focus:ring-[#8E315E]/30 outline-none bg-white font-medium"
                    />
                  ) : (
                    <select
                      id="select-comp-unit"
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#FBDAE3] focus:ring-2 focus:ring-[#8E315E]/30 outline-none bg-white font-medium"
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
                  <label className="block text-xs font-bold text-[#3A2D33] mb-1">
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
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#FBDAE3] focus:ring-2 focus:ring-[#8E315E]/30 outline-none font-bold text-[#8E315E]"
                  />
                </div>

                {/* Min Stock Alert */}
                <div>
                  <label className="block text-xs font-bold text-[#3A2D33] mb-1">
                    Stock Mínimo para Alerta
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#FBDAE3] focus:ring-2 focus:ring-[#8E315E]/30 outline-none"
                  />
                </div>
              </div>

              {/* Initial Physical Stock (ONLY when creating) */}
              {!editingComponent && (
                <div className="p-3 bg-[#FFF7FA] rounded-xl border border-[#FBDAE3]">
                  <label className="block text-xs font-bold text-[#3A2D33] mb-1">
                    Stock Físico Inicial en Taller <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-comp-initial-stock"
                    type="number"
                    min={0}
                    required
                    value={formInitialPhysicalStock}
                    onChange={(e) => setFormInitialPhysicalStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#FBDAE3] focus:ring-2 focus:ring-[#8E315E]/30 outline-none font-bold text-[#65733D] bg-white"
                  />
                  <p className="text-[11px] text-[#6D5C64] mt-1">
                    Cantidad física disponible inmediatamente para pedidos.
                  </p>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-[#3A2D33] mb-1">
                  Descripción / Observaciones
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detalles sobre presentación, color, proveedor o cuidado..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#FBDAE3] focus:ring-2 focus:ring-[#8E315E]/30 outline-none resize-none"
                />
              </div>

              {/* State (Active / Inactive) */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="checkbox-comp-active"
                  type="checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="w-4 h-4 text-[#8E315E] rounded border-gray-300 focus:ring-[#8E315E]"
                />
                <label htmlFor="checkbox-comp-active" className="text-xs font-bold text-[#3A2D33] cursor-pointer">
                  Componente activo (disponible para armar pedidos)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs font-medium text-[#6D5C64] hover:bg-gray-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  id="btn-save-component"
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#8E315E] hover:bg-[#7A294F] text-white rounded-xl shadow-xs cursor-pointer"
                >
                  {editingComponent ? 'Guardar Cambios' : 'Crear Componente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: AJUSTAR STOCK (INDEPENDENT ACTION) */}
      {/* ============================================================ */}
      {showStockModal && stockComponent && (
        <div
          id="modal-adjust-stock"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#FBDAE3] relative animate-in fade-in">
            <button
              onClick={() => setShowStockModal(false)}
              className="absolute top-4 right-4 text-[#6D5C64] hover:text-[#3A2D33] p-1.5 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-xl bg-[#EBF1DE] text-[#65733D]">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#3A2D33]">Ajustar Stock de Insumo</h3>
                <p className="text-xs text-[#6D5C64]">{stockComponent.name} ({stockComponent.category})</p>
              </div>
            </div>

            {/* Current Stock Indicators */}
            <div className="grid grid-cols-3 gap-2 my-4 text-center text-xs">
              <div className="p-2 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-[#6D5C64] block text-[10px] font-medium">Físico Actual</span>
                <span className="text-sm font-extrabold text-[#3A2D33]">
                  {stockComponent.physicalStock} {stockComponent.unit}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-amber-800 block text-[10px] font-medium">Reservado</span>
                <span className="text-sm font-extrabold text-amber-800">
                  {stockComponent.reservedStock} {stockComponent.unit}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-[#EBF1DE] border border-[#D5E2BA]">
                <span className="text-[#4F5B2F] block text-[10px] font-medium">Disponible</span>
                <span className="text-sm font-extrabold text-[#4F5B2F]">
                  {getAvailableStock(stockComponent)} {stockComponent.unit}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmStockAdjust} className="space-y-4">
              {/* Type: Entrada vs Salida */}
              <div>
                <label className="block text-xs font-bold text-[#3A2D33] mb-1.5">
                  Tipo de Movimiento <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('Entrada')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      adjustmentType === 'Entrada'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-[#6D5C64] border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    Entrada (+)
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustmentType('Salida')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      adjustmentType === 'Salida'
                        ? 'bg-[#9B2C2C] text-white border-[#9B2C2C] shadow-xs'
                        : 'bg-white text-[#6D5C64] border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    Salida (−)
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold text-[#3A2D33] mb-1">
                  Cantidad a {adjustmentType === 'Entrada' ? 'Ingresar' : 'Retirar'} ({stockComponent.unit}) <span className="text-red-500">*</span>
                </label>
                <input
                  id="input-adjustment-quantity"
                  type="number"
                  min={1}
                  required
                  value={adjustmentQty}
                  onChange={(e) => setAdjustmentQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 text-base font-extrabold text-center rounded-xl border border-[#FBDAE3] focus:ring-2 focus:ring-[#8E315E]/30 outline-none text-[#3A2D33]"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-[#3A2D33] mb-1">
                  Motivo del Ajuste <span className="text-red-500">*</span>
                </label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#FBDAE3] focus:ring-2 focus:ring-[#8E315E]/30 outline-none bg-white font-medium"
                >
                  {PRESET_ADJUSTMENT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Additional Observation */}
              <div>
                <label className="block text-xs font-bold text-[#3A2D33] mb-1">
                  Detalle / Nota adicional (Opcional)
                </label>
                <input
                  type="text"
                  value={adjustmentObservation}
                  onChange={(e) => setAdjustmentObservation(e.target.value)}
                  placeholder="Ej. Factura #412, lote de Rosas rojas premium..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#FBDAE3] focus:ring-2 focus:ring-[#8E315E]/30 outline-none"
                />
              </div>

              {/* Live Preview Card */}
              {(() => {
                const currentPhysical = stockComponent.physicalStock;
                const reserved = stockComponent.reservedStock;
                const newPhysical =
                  adjustmentType === 'Entrada'
                    ? currentPhysical + (adjustmentQty || 0)
                    : currentPhysical - (adjustmentQty || 0);
                const newAvailable = Math.max(0, newPhysical - reserved);
                const isInvalidSalida = adjustmentType === 'Salida' && (adjustmentQty || 0) > getAvailableStock(stockComponent);

                return (
                  <div
                    className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                      isInvalidSalida
                        ? 'bg-red-50 border-red-200 text-red-900'
                        : 'bg-[#FFF7FA] border-[#FBDAE3]'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>Resultado proyectado:</span>
                      <span className={isInvalidSalida ? 'text-red-700' : 'text-[#8E315E]'}>
                        Físico: {newPhysical} | Disponible: {newAvailable} {stockComponent.unit}
                      </span>
                    </div>
                    {isInvalidSalida && (
                      <p className="text-[11px] text-red-700 font-semibold">
                        ⚠️ Error: No se pueden retirar {adjustmentQty} {stockComponent.unit} porque existen {reserved} unidades reservadas para pedidos.
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="px-4 py-2 text-xs font-medium text-[#6D5C64] hover:bg-gray-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  id="btn-confirm-stock-adjust"
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#65733D] hover:bg-[#546032] text-white rounded-xl shadow-xs cursor-pointer"
                >
                  Confirmar y Guardar Ajuste
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
