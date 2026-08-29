import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Trash2, Layers, AlertTriangle, X, Plus, Check } from 'lucide-react';
import { ComponentItem, Order, OrderItemDetail } from '../../types';
import { QuantityInput } from '../common/QuantityInput';
import { SystemAlert } from '../common/SystemAlert';

export interface OrderComponentsEditorProps {
  items: OrderItemDetail[];
  components: ComponentItem[];
  existingOrder?: Order | null;
  onAddItem: (component: ComponentItem) => void;
  onUpdateQuantity: (componentId: string, newQuantity: number) => void;
  onRemoveItem: (componentId: string) => void;
  error?: string;
}

/**
 * Calculates effective available stock for a component,
 * taking into account previously allocated quantity if editing an existing order.
 */
export function getComponentEffectiveStock(
  comp: ComponentItem,
  existingOrder?: Order | null
): number {
  const baseAvailable = comp.physicalStock - comp.reservedStock;
  const originalAllocated = existingOrder
    ? existingOrder.items.find((x) => x.componentId === comp.id)?.quantity || 0
    : 0;
  return Math.max(0, baseAvailable + originalAllocated);
}

export const OrderComponentsEditor: React.FC<OrderComponentsEditorProps> = ({
  items,
  components,
  existingOrder,
  onAddItem,
  onUpdateQuantity,
  onRemoveItem,
  error,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  // Filter active components based on search query
  const filteredComponents = useMemo(() => {
    const activeComps = components.filter((c) => c.active);
    if (!searchTerm.trim()) {
      return activeComps;
    }
    const query = searchTerm.toLowerCase().trim();
    return activeComps.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.category.toLowerCase().includes(query) ||
        (c.description && c.description.toLowerCase().includes(query))
    );
  }, [components, searchTerm]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isDropdownOpen && highlightedIndex >= 0 && listboxRef.current) {
      const optionElements = listboxRef.current.querySelectorAll('li');
      if (optionElements[highlightedIndex]) {
        optionElements[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isDropdownOpen]);

  const handleSelectComponent = (comp: ComponentItem) => {
    const effectiveStock = getComponentEffectiveStock(comp, existingOrder);
    if (effectiveStock <= 0) {
      return;
    }

    onAddItem(comp);
    setSearchTerm('');
    setIsDropdownOpen(false);
    setHighlightedIndex(-1);

    // Keep focus on search input for quick subsequent additions
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        e.preventDefault();
        setIsDropdownOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredComponents.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredComponents.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredComponents.length) {
          handleSelectComponent(filteredComponents[highlightedIndex]);
        } else if (filteredComponents.length === 1) {
          handleSelectComponent(filteredComponents[0]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsDropdownOpen(false);
        break;
      case 'Tab':
        setIsDropdownOpen(false);
        break;
    }
  };

  return (
    <div
      id="section-order-components"
      className="bg-white rounded-2xl p-4 sm:p-6 border border-[#F2D6DE]/60 shadow-xs space-y-4"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#F2D6DE]/40 pb-3">
        <div>
          <h2 className="text-sm font-bold text-[#2C1E23] uppercase tracking-wider flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#681B2B] text-white flex items-center justify-center text-xs font-bold shrink-0">
              3
            </span>
            <span>Selección de Componentes y Flores</span>
          </h2>
          <p className="text-xs text-[#7D6871] mt-0.5">
            Busque flores, bases o insumos para agregarlos al arreglo al instante.
          </p>
        </div>

        {items.length > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-[#FBECEF] text-[#681B2B] font-bold text-xs self-start sm:self-auto">
            {items.length} {items.length === 1 ? 'insumo agregado' : 'insumos agregados'}
          </span>
        )}
      </div>

      {/* Direct Autocomplete Search Box */}
      <div ref={containerRef} className="relative w-full">
        <label
          htmlFor="input-component-autocomplete"
          className="block text-xs font-bold text-[#2C1E23] mb-1.5"
        >
          Agregar Insumo o Flor al Arreglo
        </label>

        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7D6871]">
            <Search className="w-4 h-4" />
          </div>

          <input
            ref={inputRef}
            id="input-component-autocomplete"
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsDropdownOpen(true);
              setHighlightedIndex(0);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar por nombre o categoría (ej. Rosa, Girasol, Caja, Listón)..."
            className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] bg-white font-medium text-[#2C1E23] placeholder-[#7D6871]/60 focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20 focus:border-[#681B2B] transition-all"
            autoComplete="off"
          />

          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                inputRef.current?.focus();
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#7D6871] hover:text-[#2C1E23] cursor-pointer"
              title="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown List */}
        {isDropdownOpen && (
          <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white rounded-xl border border-[#F2D6DE] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-72 flex flex-col">
            <div className="p-2 bg-[#FBECEF]/30 border-b border-[#F2D6DE]/60 text-[11px] text-[#7D6871] flex items-center justify-between font-medium">
              <span>Haga clic o presione Enter para agregar de inmediato:</span>
              <span className="font-bold text-[#681B2B]">
                {filteredComponents.length} {filteredComponents.length === 1 ? 'disponible' : 'disponibles'}
              </span>
            </div>

            <ul
              ref={listboxRef}
              role="listbox"
              tabIndex={-1}
              className="overflow-y-auto divide-y divide-[#F2D6DE]/30 py-1 focus:outline-none"
            >
              {filteredComponents.length === 0 ? (
                <li className="px-4 py-4 text-xs text-[#7D6871] text-center italic">
                  No se encontraron componentes activos para "{searchTerm}".
                </li>
              ) : (
                filteredComponents.map((comp, index) => {
                  const effectiveStock = getComponentEffectiveStock(comp, existingOrder);
                  const isOutOfStock = effectiveStock <= 0;
                  const alreadyInOrder = items.find((it) => it.componentId === comp.id);
                  const isHighlighted = index === highlightedIndex;

                  return (
                    <li
                      key={comp.id}
                      role="option"
                      aria-selected={isHighlighted}
                      onClick={() => !isOutOfStock && handleSelectComponent(comp)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`px-3.5 py-2.5 text-xs sm:text-sm transition-colors flex items-center justify-between gap-3 ${
                        isOutOfStock
                          ? 'opacity-50 bg-gray-50 cursor-not-allowed'
                          : isHighlighted
                          ? 'bg-[#FBECEF]/60 text-[#681B2B] cursor-pointer'
                          : 'hover:bg-[#FBECEF]/25 cursor-pointer text-[#2C1E23]'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold truncate text-[#2C1E23]">
                            {comp.name}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-[#7D6871] shrink-0">
                            {comp.category}
                          </span>
                          {alreadyInOrder && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FBECEF] text-[#681B2B] shrink-0 flex items-center gap-0.5">
                              <Check className="w-3 h-3" />
                              En pedido ({alreadyInOrder.quantity})
                            </span>
                          )}
                        </div>
                        {comp.description && (
                          <p className="text-[11px] text-[#7D6871] truncate mt-0.5">
                            {comp.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-right">
                        <div>
                          <div className="font-bold text-[#059669] text-xs sm:text-sm">
                            Q {comp.price.toFixed(2)}
                          </div>
                          <div className="text-[10px] text-[#7D6871]">
                            por {comp.unit || 'unidad'}
                          </div>
                        </div>

                        <div>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isOutOfStock
                                ? 'bg-red-100 text-red-800'
                                : effectiveStock < 5
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-[#ECFDF5] text-[#047857]'
                            }`}
                          >
                            {isOutOfStock
                              ? 'Sin stock'
                              : `${effectiveStock} ${comp.unit || 'unid.'} disp.`}
                          </span>
                        </div>

                        {!isOutOfStock && (
                          <div className="p-1 rounded-lg bg-[#681B2B]/10 text-[#681B2B] hover:bg-[#681B2B] hover:text-white transition-colors">
                            <Plus className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Global Section Error message */}
      {error && (
        <SystemAlert
          id="alert-order-components-error"
          type="error"
          message={error}
        />
      )}

      {/* Components Items List */}
      {items.length === 0 ? (
        /* Empty State */
        <div className="py-8 px-4 text-center rounded-xl border border-dashed border-[#F2D6DE] bg-[#FBECEF]/15 text-[#7D6871]">
          <Layers className="w-8 h-8 mx-auto mb-2 text-[#D9A3B5]" />
          <p className="font-bold text-sm text-[#2C1E23]">
            No hay componentes agregados aún
          </p>
          <p className="text-xs text-[#7D6871] mt-1 max-w-sm mx-auto">
            Utilice el buscador superior para seleccionar rosas, follaje, bases o complementos.
          </p>
        </div>
      ) : (
        <>
          {/* ============================================================ */}
          {/* DESKTOP TABLE VIEW (Visible on tablet & desktop >= md) */}
          {/* ============================================================ */}
          <div className="hidden md:block overflow-hidden border border-[#F2D6DE]/60 rounded-xl">
            <table id="table-order-items" className="w-full text-left text-xs">
              <thead className="bg-[#FBECEF]/40 text-[#8C7A82] uppercase text-[10px] tracking-wider border-b border-[#F2D6DE]/60">
                <tr>
                  <th className="py-2.5 px-3.5 font-semibold">Componente</th>
                  <th className="py-2.5 px-3.5 font-semibold text-center">Disponibilidad</th>
                  <th className="py-2.5 px-3.5 font-semibold text-right">Precio</th>
                  <th className="py-2.5 px-3.5 font-semibold text-center w-32">Cantidad</th>
                  <th className="py-2.5 px-3.5 font-semibold text-right">Subtotal</th>
                  <th className="py-2.5 px-3 font-semibold text-center w-12">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2D6DE]/30 bg-white">
                {items.map((it) => {
                  const comp = components.find((c) => c.id === it.componentId);
                  const effectiveStock = comp ? getComponentEffectiveStock(comp, existingOrder) : 0;

                  return (
                    <tr
                      key={it.componentId}
                      id={`item-row-${it.componentId}`}
                      className="hover:bg-[#FBECEF]/20 transition-colors"
                    >
                      {/* Nombre */}
                      <td className="py-3 px-3.5 font-semibold text-[#2C1E23]">
                        <div className="flex items-center gap-2">
                          <span>{it.componentName}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-normal bg-gray-100 text-[#7D6871]">
                            {it.category}
                          </span>
                        </div>
                      </td>

                      {/* Disponibilidad */}
                      <td className="py-3 px-3.5 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            effectiveStock <= 0
                              ? 'bg-red-100 text-red-800'
                              : effectiveStock < 5
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-[#ECFDF5] text-[#047857]'
                          }`}
                        >
                          {effectiveStock} {comp?.unit || 'unids.'} disp.
                        </span>
                      </td>

                      {/* Precio */}
                      <td className="py-3 px-3.5 text-right font-medium text-[#2C1E23]">
                        Q {it.unitPrice.toFixed(2)}
                      </td>

                      {/* Cantidad */}
                      <td className="py-3 px-3.5 text-center w-32">
                        <div className="w-24 mx-auto">
                          <QuantityInput
                            id={`input-item-qty-${it.componentId}`}
                            value={it.quantity}
                            max={effectiveStock}
                            unit={comp?.unit}
                            onChange={(newQty) =>
                              onUpdateQuantity(it.componentId, newQty)
                            }
                            size="sm"
                            align="center"
                            showErrorText
                          />
                        </div>
                      </td>

                      {/* Subtotal */}
                      <td className="py-3 px-3.5 text-right font-bold text-[#681B2B] text-sm">
                        Q {it.subtotal.toFixed(2)}
                      </td>

                      {/* Acción (Eliminar) */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onRemoveItem(it.componentId)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Eliminar componente"
                          aria-label={`Eliminar ${it.componentName}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ============================================================ */}
          {/* MOBILE VERTICAL CARDS (Visible on mobile < md) */}
          {/* ============================================================ */}
          <div className="md:hidden space-y-2.5">
            {items.map((it) => {
              const comp = components.find((c) => c.id === it.componentId);
              const effectiveStock = comp ? getComponentEffectiveStock(comp, existingOrder) : 0;

              return (
                <div
                  key={`mobile-${it.componentId}`}
                  id={`item-card-${it.componentId}`}
                  className="p-3.5 rounded-xl border border-[#F2D6DE] bg-white shadow-xs space-y-3"
                >
                  {/* Card Header: Name + Category + Delete */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm text-[#2C1E23] leading-snug break-words">
                        {it.componentName}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-[#7D6871]">
                          {it.category}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            effectiveStock <= 0
                              ? 'bg-red-100 text-red-800'
                              : effectiveStock < 5
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-[#ECFDF5] text-[#047857]'
                          }`}
                        >
                          {effectiveStock} {comp?.unit || 'unid.'} disp.
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(it.componentId)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center -mr-1 -mt-1 cursor-pointer"
                      title="Eliminar componente"
                      aria-label={`Eliminar ${it.componentName}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Card Footer: Precio, Cantidad & Subtotal */}
                  <div className="pt-2 border-t border-[#F2D6DE]/40 flex items-center justify-between gap-3">
                    {/* Cantidad Input */}
                    <div className="flex items-center gap-2">
                      <div className="text-xs">
                        <span className="text-[10px] uppercase font-semibold text-[#7D6871] block">
                          Cant.
                        </span>
                        <div className="w-24">
                          <QuantityInput
                            id={`mobile-input-item-qty-${it.componentId}`}
                            value={it.quantity}
                            max={effectiveStock}
                            unit={comp?.unit}
                            onChange={(newQty) =>
                              onUpdateQuantity(it.componentId, newQty)
                            }
                            size="sm"
                            align="center"
                            showErrorText
                          />
                        </div>
                      </div>
                    </div>

                    {/* Unit Price & Subtotal */}
                    <div className="text-right">
                      <span className="text-[10px] text-[#7D6871] block font-medium">
                        Q {it.unitPrice.toFixed(2)} c/u
                      </span>
                      <span className="text-sm font-extrabold text-[#681B2B] block leading-tight">
                        Q {it.subtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
