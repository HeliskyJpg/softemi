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
} from 'lucide-react';
import { ComponentCategory, ComponentItem } from '../../types';

export const ComponentsView: React.FC = () => {
  const {
    components,
    currentUser,
    addComponent,
    updateComponent,
    adjustComponentStock,
    toggleComponentActive,
    stockAdjustmentLogs,
    addToast,
  } = useApp();

  const isAdmin = currentUser?.role === 'Administrador';

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Todas');
  const [activeTab, setActiveTab] = useState<'catalog' | 'logs'>('catalog');

  // New/Edit Component Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingComponent, setEditingComponent] = useState<ComponentItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<ComponentCategory>('Flores');
  const [formPrice, setFormPrice] = useState<number>(15.0);
  const [formMinStock, setFormMinStock] = useState<number>(10);
  const [formDescription, setFormDescription] = useState('');
  const [formActive, setFormActive] = useState(true);

  // Separate Stock Adjustment Modal (Strictly required to be a distinct action)
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockComponent, setStockComponent] = useState<ComponentItem | null>(null);
  const [newStockValue, setNewStockValue] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState('Ingreso de mercadería / conteo físico');

  // Categories list
  const categories: ComponentCategory[] = [
    'Flores',
    'Empaques',
    'Accesorios',
    'Chocolates y Dulces',
    'Globos y Decoración',
  ];

  // Filtered components
  const filteredComponents = useMemo(() => {
    return components.filter((comp) => {
      const matchesSearch =
        comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (comp.description && comp.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter === 'Todas' || comp.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [components, searchTerm, categoryFilter]);

  // Open Edit Modal
  const handleOpenEdit = (comp: ComponentItem) => {
    setEditingComponent(comp);
    setFormName(comp.name);
    setFormCategory(comp.category);
    setFormPrice(comp.price);
    setFormMinStock(comp.minStockAlert);
    setFormDescription(comp.description || '');
    setFormActive(comp.active);
    setShowEditModal(true);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingComponent(null);
    setFormName('');
    setFormCategory('Flores');
    setFormPrice(15.0);
    setFormMinStock(10);
    setFormDescription('');
    setFormActive(true);
    setShowEditModal(true);
  };

  // Save Component
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

    if (editingComponent) {
      updateComponent(editingComponent.id, {
        name: formName.trim(),
        category: formCategory,
        price: Number(formPrice),
        minStockAlert: Number(formMinStock),
        description: formDescription.trim(),
        active: formActive,
      });
    } else {
      addComponent({
        name: formName.trim(),
        category: formCategory,
        price: Number(formPrice),
        stock: 20, // default initial stock
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
    setNewStockValue(comp.stock);
    setAdjustmentReason('Ingreso de nuevo lote de flores / insumos');
    setShowStockModal(true);
  };

  // Confirm Stock Adjustment
  const handleConfirmStockAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockComponent) return;
    if (newStockValue < 0) {
      addToast('La existencia no puede ser negativa.', 'error');
      return;
    }

    adjustComponentStock(stockComponent.id, Number(newStockValue), adjustmentReason);
    setShowStockModal(false);
  };

  return (
    <div id="components-view-container" className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#3A2D33] tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-[#65733D]" />
            Catálogo de Componentes e Insumos
          </h1>
          <p className="text-xs sm:text-sm text-[#6D5C64] mt-0.5">
            Gestión de flores, bases, empaques y control de stock disponible en taller.
          </p>
        </div>

        {isAdmin && (
          <button
            id="btn-new-component"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#8E315E] hover:bg-[#7A294F] text-white font-bold text-sm shadow-sm transition-all cursor-pointer hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            + Nuevo Componente
          </button>
        )}
      </div>

      {/* Tabs: Catálogo / Historial de Ajustes */}
      <div className="flex items-center gap-2 border-b border-[#FBDAE3] pb-1 text-xs">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'catalog'
              ? 'bg-[#8E315E] text-white shadow-xs'
              : 'text-[#6D5C64] hover:text-[#3A2D33] hover:bg-white'
          }`}
        >
          Catálogo & Stock ({components.length})
        </button>
        {isAdmin && (
          <button
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
        )}
      </div>

      {activeTab === 'catalog' ? (
        <>
          {/* Search and Filters */}
          <div className="bg-white rounded-2xl p-4 border border-[#FBDAE3] shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative sm:col-span-2">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6D5C64]">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  id="input-components-search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar componente por nombre o descripción..."
                  className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-[#FBDAE3] bg-[#FFF7FA]/50 focus:bg-white text-[#3A2D33] placeholder-[#6D5C64]/60 focus:outline-none focus:ring-2 focus:ring-[#8E315E]/30"
                />
              </div>

              <div>
                <select
                  id="select-components-category-filter"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#FBDAE3] bg-white text-[#3A2D33] focus:outline-none focus:ring-2 focus:ring-[#8E315E]/30 font-medium cursor-pointer"
                >
                  <option value="Todas">Categoría: Todas</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-[#FBDAE3] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table id="table-components" className="w-full text-left text-xs">
                <thead className="bg-[#FFF7FA] border-b border-[#FBDAE3] text-[#6D5C64] uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">Nombre del Componente</th>
                    <th className="py-3.5 px-4 font-bold">Categoría</th>
                    <th className="py-3.5 px-4 font-bold text-right">Precio Unitario</th>
                    <th className="py-3.5 px-4 font-bold text-center">Existencia</th>
                    <th className="py-3.5 px-4 font-bold text-center">Disponibilidad</th>
                    <th className="py-3.5 px-4 font-bold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredComponents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-[#6D5C64]">
                        No se encontraron componentes con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredComponents.map((comp) => {
                      const isLowStock = comp.stock <= comp.minStockAlert && comp.stock > 0;
                      const isOutOfStock = comp.stock <= 0;

                      return (
                        <tr
                          key={comp.id}
                          id={`row-component-${comp.id}`}
                          className="hover:bg-[#FFF7FA]/80 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#3A2D33]">{comp.name}</div>
                            {comp.description && (
                              <div className="text-[11px] text-[#6D5C64] truncate max-w-sm">
                                {comp.description}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-full bg-gray-100 text-[#3A2D33] font-medium text-[11px]">
                              {comp.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-[#8E315E]">
                            Q {comp.price.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`text-xs font-extrabold px-2.5 py-1 rounded-xl ${
                                isOutOfStock
                                  ? 'bg-red-100 text-[#9B2C2C]'
                                  : isLowStock
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-[#EBF1DE] text-[#4F5B2F]'
                              }`}
                            >
                              {comp.stock} unids.
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {isOutOfStock ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-[#9B2C2C]">
                                <XCircle className="w-3.5 h-3.5" />
                                Agotado
                              </span>
                            ) : isLowStock ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Bajo stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EBF1DE] text-[#4F5B2F]">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Disponible
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {isAdmin ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  id={`btn-edit-comp-${comp.id}`}
                                  onClick={() => handleOpenEdit(comp)}
                                  className="px-2.5 py-1.5 rounded-lg border border-[#FBDAE3] bg-[#FFF7FA] hover:bg-[#8E315E] hover:text-white text-[#8E315E] font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Editar información del componente"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  Editar
                                </button>
                                <button
                                  id={`btn-adjust-stock-${comp.id}`}
                                  onClick={() => handleOpenStockAdjust(comp)}
                                  className="px-2.5 py-1.5 rounded-lg bg-[#65733D] hover:bg-[#546032] text-white font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                                  title="Ajustar existencia manualmente"
                                >
                                  <SlidersHorizontal className="w-3.5 h-3.5" />
                                  Ajustar Stock
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-[#6D5C64] italic">Solo consulta</span>
                            )}
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
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#3A2D33]">Registro de Ajustes Manuales de Stock</h3>
            <span className="text-xs text-[#6D5C64]">Auditoría administrativa</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FFF7FA] text-[#6D5C64] uppercase text-[10px] tracking-wider border-b border-[#FBDAE3]">
                <tr>
                  <th className="py-2.5 px-3">Fecha y Hora</th>
                  <th className="py-2.5 px-3">Componente</th>
                  <th className="py-2.5 px-3 text-center">Stock Previo</th>
                  <th className="py-2.5 px-3 text-center">Nuevo Stock</th>
                  <th className="py-2.5 px-3 text-center">Diferencia</th>
                  <th className="py-2.5 px-3">Motivo</th>
                  <th className="py-2.5 px-3">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stockAdjustmentLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#6D5C64]">
                      No hay registros de ajustes manuales aún.
                    </td>
                  </tr>
                ) : (
                  stockAdjustmentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#FFF7FA]/50">
                      <td className="py-2.5 px-3 text-[#6D5C64] font-medium">{log.timestamp}</td>
                      <td className="py-2.5 px-3 font-bold text-[#3A2D33]">{log.componentName}</td>
                      <td className="py-2.5 px-3 text-center font-medium text-[#6D5C64]">
                        {log.previousStock}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-[#8E315E]">
                        {log.newStock}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            log.difference > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {log.difference > 0 ? `+${log.difference}` : log.difference}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#3A2D33]">{log.reason}</td>
                      <td className="py-2.5 px-3 text-[#6D5C64] font-medium">{log.user}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: EDITAR / CREAR COMPONENTE */}
      {/* ============================================================ */}
      {showEditModal && (
        <div
          id="modal-edit-component"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#FBDAE3] relative animate-in fade-in">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-[#6D5C64] hover:text-[#3A2D33] p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-[#3A2D33] mb-1">
              {editingComponent ? 'Editar Componente' : 'Nuevo Componente'}
            </h3>
            <p className="text-xs text-[#6D5C64] mb-4">
              Defina el nombre, categoría y precio unitario del insumo.
            </p>

            <form onSubmit={handleSaveComponent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#3A2D33] mb-1">
                  Nombre del Insumo <span className="text-red-500">*</span>
                </label>
                <input
                  id="input-comp-name"
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej. Rosas Rosadas de Exportación"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#FBDAE3] focus:ring-2 focus:ring-[#8E315E]/30 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#3A2D33] mb-1">Categoría</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ComponentCategory)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#FBDAE3] focus:ring-2 focus:ring-[#8E315E]/30 outline-none bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3A2D33] mb-1">
                    Precio Unit. (Q) <span className="text-red-500">*</span>
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
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3A2D33] mb-1">
                  Alerta Mínima de Stock
                </label>
                <input
                  type="number"
                  min={1}
                  value={formMinStock}
                  onChange={(e) => setFormMinStock(parseInt(e.target.value) || 5)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#FBDAE3] focus:ring-2 focus:ring-[#8E315E]/30 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3A2D33] mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detalles de presentación, proveedor o cuidado..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#FBDAE3] focus:ring-2 focus:ring-[#8E315E]/30 outline-none resize-none"
                />
              </div>

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
                  Guardar Componente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: AJUSTAR EXISTENCIA (STOCK ADJUSTMENT) */}
      {/* ============================================================ */}
      {showStockModal && stockComponent && (
        <div
          id="modal-adjust-stock"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#FBDAE3] relative animate-in fade-in">
            <button
              onClick={() => setShowStockModal(false)}
              className="absolute top-4 right-4 text-[#6D5C64] hover:text-[#3A2D33] p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-[#3A2D33] mb-1">
              Ajustar Existencia de "{stockComponent.name}"
            </h3>
            <p className="text-xs text-[#6D5C64] mb-4">
              Actualización manual de stock por conteo físico o entrada de inventario.
            </p>

            <form onSubmit={handleConfirmStockAdjust} className="space-y-4">
              <div className="p-3 bg-[#FFF7FA] rounded-xl border border-[#FBDAE3] flex items-center justify-between text-xs">
                <span className="text-[#6D5C64]">Existencia actual:</span>
                <span className="text-base font-extrabold text-[#8E315E]">
                  {stockComponent.stock} unidades
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3A2D33] mb-1">
                  Nueva Cantidad en Existencia <span className="text-red-500">*</span>
                </label>
                <input
                  id="input-new-stock-value"
                  type="number"
                  min={0}
                  required
                  value={newStockValue}
                  onChange={(e) => setNewStockValue(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 text-base font-extrabold text-center rounded-xl border border-[#FBDAE3] focus:ring-2 focus:ring-[#65733D]/30 outline-none text-[#65733D]"
                />
                <p className="text-[11px] text-[#6D5C64] mt-1 text-center">
                  Diferencia:{' '}
                  <strong className={newStockValue - stockComponent.stock >= 0 ? 'text-[#65733D]' : 'text-red-600'}>
                    {newStockValue - stockComponent.stock >= 0
                      ? `+${newStockValue - stockComponent.stock}`
                      : `${newStockValue - stockComponent.stock}`}{' '}
                    unidades
                  </strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3A2D33] mb-1">
                  Motivo del Ajuste <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Ej. Conteo físico semanal, merma por deshoje, lote nuevo de flores..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#FBDAE3] focus:ring-2 focus:ring-[#65733D]/30 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
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
                  Confirmar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
