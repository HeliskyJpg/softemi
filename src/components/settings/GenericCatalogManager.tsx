import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Layers,
  ArrowUpDown,
  History,
  ShieldAlert,
} from 'lucide-react';
import { CatalogItem, CatalogKey } from '../../types';
import {
  CATALOG_DEFINITIONS,
  CatalogDefinition,
} from '../../config/catalogsConfig';
import {
  Modal,
  ConfirmDialog,
  FormField,
  FormRow,
  Input,
  FormFieldError,
  TextArea,
  SystemAlert,
  EmptyState,
  Pagination,
} from '../common';

interface GenericCatalogManagerProps {
  catalogKey: CatalogKey;
}

export const GenericCatalogManager: React.FC<GenericCatalogManagerProps> = ({
  catalogKey,
}) => {
  const {
    getCatalogItems,
    addCatalogItem,
    updateCatalogItem,
    toggleCatalogItemActive,
    deleteCatalogItem,
    isCatalogItemInUse,
    addToast,
  } = useApp();

  const definition: CatalogDefinition =
    CATALOG_DEFINITIONS[catalogKey] || CATALOG_DEFINITIONS.order_channels;
  const IconComponent = definition.icon;

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal (Create / Edit) state - Single unified generic form
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formOrderIndex, setFormOrderIndex] = useState(1);
  const [formErrors, setFormErrors] = useState<{ name?: string; general?: string }>({});

  // Protected Deletion state
  const [itemToDelete, setItemToDelete] = useState<CatalogItem | null>(null);
  const [deleteBlockedInfo, setDeleteBlockedInfo] = useState<{
    item: CatalogItem;
    details: string;
  } | null>(null);

  // Get raw items from app context
  const allItems = getCatalogItems(catalogKey, false);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = [...allItems];

    // Status filter
    if (statusFilter === 'active') {
      result = result.filter((item) => item.active);
    } else if (statusFilter === 'inactive') {
      result = result.filter((item) => !item.active);
    }

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q))
      );
    }

    // Sort by orderIndex first, then by name
    return result.sort((a, b) => {
      const orderA = a.orderIndex ?? 999;
      const orderB = b.orderIndex ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name, 'es');
    });
  }, [allItems, statusFilter, searchTerm]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItems, currentPage]);

  // Adjust page if out of bounds
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormDescription('');
    setFormActive(true);
    setFormOrderIndex(allItems.length + 1);
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: CatalogItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormDescription(item.description || '');
    setFormActive(item.active);
    setFormOrderIndex(item.orderIndex ?? 1);
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Submit Generic Form (Create or Edit)
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formName.trim();

    if (!trimmedName) {
      setFormErrors({ name: 'El nombre del elemento es obligatorio.' });
      return;
    }

    // Duplicate check
    const duplicate = allItems.find(
      (it) =>
        it.id !== editingItem?.id &&
        it.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (duplicate) {
      setFormErrors({
        name: `Ya existe un registro con el nombre "${trimmedName}" en este catálogo.`,
      });
      return;
    }

    if (editingItem) {
      // Edit existing
      const res = updateCatalogItem(catalogKey, editingItem.id, {
        name: trimmedName,
        description: formDescription.trim(),
        active: formActive,
        orderIndex: Number(formOrderIndex) || 1,
      });

      if (res.success) {
        addToast(
          `Se actualizó "${trimmedName}" en ${definition.title.toLowerCase()}.`,
          'success',
          'Catálogo actualizado'
        );
        setIsFormModalOpen(false);
      } else {
        setFormErrors({ general: res.error || 'Error al actualizar el registro.' });
      }
    } else {
      // Create new
      const res = addCatalogItem(catalogKey, {
        name: trimmedName,
        description: formDescription.trim(),
        active: formActive,
        orderIndex: Number(formOrderIndex) || 1,
      });

      if (res.success) {
        addToast(
          `Se agregó "${trimmedName}" a ${definition.title.toLowerCase()}.`,
          'success',
          'Elemento creado'
        );
        setIsFormModalOpen(false);
      } else {
        setFormErrors({ general: res.error || 'Error al guardar el nuevo registro.' });
      }
    }
  };

  // Toggle Active Status
  const handleToggleActive = (item: CatalogItem) => {
    const res = toggleCatalogItemActive(catalogKey, item.id);
    if (res.success) {
      const nextStatus = !item.active;
      addToast(
        `"${item.name}" ahora está ${nextStatus ? 'ACTIVO' : 'INACTIVO'}. ${
          !nextStatus
            ? 'Permanecerá visible en registros históricos pero no para nuevas operaciones.'
            : 'Disponible para nuevas operaciones.'
        }`,
        nextStatus ? 'success' : 'warning',
        nextStatus ? 'Elemento activado' : 'Elemento desactivado'
      );
    } else {
      addToast(res.error || 'Error al cambiar estado', 'error');
    }
  };

  // Attempt Delete
  const handleAttemptDelete = (item: CatalogItem) => {
    // Usage check
    const usage = isCatalogItemInUse(catalogKey, item.name, item.id);

    if (usage.inUse) {
      // Prevent physical delete
      setDeleteBlockedInfo({
        item,
        details: usage.details,
      });
    } else {
      // Not in use, allow deletion
      setItemToDelete(item);
    }
  };

  // Confirm Physical Delete (When safe and not in use)
  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const res = deleteCatalogItem(catalogKey, itemToDelete.id);
    if (res.success) {
      addToast(
        `Se eliminó "${itemToDelete.name}" de ${definition.title.toLowerCase()}.`,
        'success',
        'Eliminado correctamente'
      );
    } else {
      addToast(res.error || 'No fue posible eliminar el registro.', 'error');
    }
    setItemToDelete(null);
  };

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div
        id={`catalog-header-${catalogKey}`}
        className="bg-white rounded-2xl p-5 sm:p-6 border border-[#F2D6DE]/70 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#681B2B]/10 border border-[#681B2B]/20 flex items-center justify-center text-[#681B2B] shrink-0">
            <IconComponent className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-extrabold text-[#2C1E23] tracking-tight">
                {definition.title}
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FBECEF] text-[#681B2B] border border-[#F2D6DE]">
                {allItems.length} {allItems.length === 1 ? 'registro' : 'registros'}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {allItems.filter((it) => it.active).length} activos
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#7D6871] mt-1 leading-relaxed">
              {definition.description}
            </p>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          id={`btn-new-${catalogKey}-item`}
          onClick={handleOpenCreateModal}
          type="button"
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#681B2B] hover:bg-[#541421] text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nuevo {definition.singularTitle.toLowerCase()}</span>
        </button>
      </div>

      {/* Search & Status Filter Toolbar */}
      <div
        id="catalog-search-toolbar"
        className="bg-white rounded-2xl p-4 border border-[#F2D6DE]/60 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3"
      >
        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D6871] pointer-events-none" />
          <input
            id="input-search-catalog"
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={`Buscar en ${definition.title.toLowerCase()}...`}
            className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#F2D6DE] bg-white text-[#2C1E23] placeholder-[#7D6871]/70 focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20"
          />
        </div>

        {/* Status filter buttons */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              statusFilter === 'all'
                ? 'bg-[#681B2B] text-white shadow-xs'
                : 'bg-gray-100 text-[#7D6871] hover:bg-gray-200'
            }`}
          >
            Todos ({allItems.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('active');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              statusFilter === 'active'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            Activos ({allItems.filter((it) => it.active).length})
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('inactive');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              statusFilter === 'inactive'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            Inactivos ({allItems.filter((it) => !it.active).length})
          </button>
        </div>
      </div>

      {/* Catalog Items Table / List */}
      <div
        id="catalog-items-container"
        className="bg-white rounded-2xl border border-[#F2D6DE]/70 shadow-xs overflow-hidden"
      >
        {filteredItems.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={Search}
              title={`No se encontraron ${definition.title.toLowerCase()}`}
              description={
                searchTerm
                  ? `No hay registros que coincidan con la búsqueda "${searchTerm}".`
                  : 'No hay elementos registrados con el filtro seleccionado.'
              }
              actionLabel={`Crear ${definition.singularTitle.toLowerCase()}`}
              onAction={handleOpenCreateModal}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#F2D6DE]/60 bg-[#FBECEF]/30 text-[#2C1E23] font-bold">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Valor / Nombre</th>
                  <th className="py-3 px-4 hidden md:table-cell">Descripción / Observación</th>
                  <th className="py-3 px-4 w-28 text-center">Estado</th>
                  <th className="py-3 px-4 w-44 hidden sm:table-cell">Uso en el sistema</th>
                  <th className="py-3 px-4 w-36 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2D6DE]/40 text-[#2C1E23]">
                {paginatedItems.map((item, index) => {
                  const usage = isCatalogItemInUse(catalogKey, item.name, item.id);
                  const displayIndex = (currentPage - 1) * itemsPerPage + index + 1;

                  return (
                    <tr
                      key={item.id}
                      id={`catalog-row-${item.id}`}
                      className={`hover:bg-[#FBECEF]/20 transition-colors ${
                        !item.active ? 'bg-gray-50/70 text-gray-500' : ''
                      }`}
                    >
                      {/* Index / Order */}
                      <td className="py-3 px-4 text-center font-semibold text-[#7D6871]">
                        {item.orderIndex ?? displayIndex}
                      </td>

                      {/* Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold text-xs sm:text-sm ${
                              item.active ? 'text-[#2C1E23]' : 'text-gray-500 line-through'
                            }`}
                          >
                            {item.name}
                          </span>
                          {!item.active && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                              Inactivo
                            </span>
                          )}
                        </div>
                        {/* Mobile description snippet */}
                        {item.description && (
                          <p className="text-[11px] text-[#7D6871] md:hidden mt-0.5 line-clamp-1">
                            {item.description}
                          </p>
                        )}
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 hidden md:table-cell text-xs text-[#7D6871]">
                        {item.description ? (
                          <span className="line-clamp-2">{item.description}</span>
                        ) : (
                          <span className="italic text-gray-400">Sin descripción</span>
                        )}
                      </td>

                      {/* Active Status Badge & Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          id={`btn-toggle-active-${item.id}`}
                          onClick={() => handleToggleActive(item)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                            item.active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                          }`}
                          title={
                            item.active
                              ? 'Click para desactivar (permanecerá en registros históricos)'
                              : 'Click para volver a activar en nuevas operaciones'
                          }
                        >
                          {item.active ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Activo</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-amber-600" />
                              <span>Inactivo</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Historical usage check info */}
                      <td className="py-3 px-4 hidden sm:table-cell text-xs">
                        {usage.inUse ? (
                          <span
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#681B2B] bg-[#FBECEF]/60 px-2 py-1 rounded-lg border border-[#F2D6DE]/60"
                            title={`Protegido: ${usage.details}`}
                          >
                            <History className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate max-w-[140px]">{usage.details}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400 font-medium italic">
                            Sin registros históricos
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            id={`btn-edit-${item.id}`}
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 rounded-lg text-[#7D6871] hover:text-[#2C1E23] hover:bg-gray-100 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                            title={`Editar ${item.name}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            id={`btn-delete-${item.id}`}
                            onClick={() => handleAttemptDelete(item)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center ${
                              usage.inUse
                                ? 'text-gray-400 hover:text-amber-700 hover:bg-amber-50'
                                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title={
                              usage.inUse
                                ? 'En uso en registros históricos (no se puede eliminar físicamente)'
                                : `Eliminar ${item.name}`
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filteredItems.length > itemsPerPage && (
          <div className="p-4 border-t border-[#F2D6DE]/60 flex items-center justify-between">
            <span className="text-xs text-[#7D6871] font-medium">
              Mostrando {paginatedItems.length} de {filteredItems.length} registros
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </div>
        )}
      </div>

      {/* Information Banner about Deactivated Values */}
      <div className="p-3.5 rounded-xl bg-[#FBECEF]/40 border border-[#F2D6DE] text-xs text-[#7D6871] flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#681B2B] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-[#2C1E23] font-bold">Regla de integridad histórica:</strong> Los valores
          desactivados se mantienen visibles en pedidos, insumos y movimientos históricos para preservar la
          trazabilidad exacta de la floristería. Únicamente se ocultan para la creación de nuevas operaciones.
        </div>
      </div>

      {/* ============================================================ */}
      {/* GENERIC MODAL: CREATE / EDIT (ONE SHARED FORM)                */}
      {/* ============================================================ */}
      <Modal
        id={`modal-${catalogKey}-form`}
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={
          editingItem
            ? `Editar ${definition.singularTitle}`
            : `Nuevo ${definition.singularTitle}`
        }
        subtitle={
          editingItem
            ? `Modifique las características del valor en ${definition.title.toLowerCase()}.`
            : `Ingrese los datos para incorporar un nuevo valor al catálogo de ${definition.title.toLowerCase()}.`
        }
        size="md"
        footer={
          <>
            <button
              type="button"
              id="btn-cancel-catalog-form"
              onClick={() => setIsFormModalOpen(false)}
              className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-medium text-[#7D6871] hover:bg-gray-100 rounded-xl cursor-pointer min-h-[42px] sm:min-h-[36px] flex items-center justify-center"
            >
              Cancelar
            </button>
            <button
              id="btn-save-catalog-item"
              form="form-generic-catalog"
              type="submit"
              className="w-full sm:w-auto px-5 py-2 text-xs sm:text-sm font-bold bg-[#681B2B] hover:bg-[#541421] text-white rounded-xl shadow-xs cursor-pointer min-h-[42px] sm:min-h-[36px] flex items-center justify-center"
            >
              {editingItem ? 'Guardar Cambios' : 'Crear Registro'}
            </button>
          </>
        }
      >
        <form
          id="form-generic-catalog"
          onSubmit={handleFormSubmit}
          className="space-y-4"
        >
          {formErrors.general && (
            <SystemAlert
              type="error"
              title="Error al guardar"
              message={formErrors.general}
              className="mb-2"
            />
          )}

          {/* Name Field */}
          <FormField
            id="input-catalog-item-name"
            label={definition.nameLabel || 'Nombre / Valor'}
            required
            error={formErrors.name}
          >
            <Input
              id="input-catalog-item-name"
              type="text"
              required
              value={formName}
              onChange={(e) => {
                setFormName(e.target.value);
                if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder={definition.namePlaceholder || 'Ingrese el nombre...'}
              hasError={!!formErrors.name}
            />
          </FormField>

          {/* Description Field */}
          <TextArea
            id="textarea-catalog-item-desc"
            label="Descripción u observaciones"
            optional
            rows={3}
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            placeholder={
              definition.descriptionPlaceholder ||
              'Añada detalles u orientaciones para el equipo...'
            }
          />

          {/* Order index & Active toggle */}
          <FormRow columns={2}>
            <FormField
              id="input-catalog-order-index"
              label="Orden de visualización"
              optional
            >
              <Input
                id="input-catalog-order-index"
                type="number"
                min={1}
                max={999}
                value={formOrderIndex}
                onChange={(e) => setFormOrderIndex(Number(e.target.value) || 1)}
                className="font-medium"
              />
            </FormField>

            <div>
              <label className="block text-xs font-bold text-[#2C1E23] mb-1.5">
                Estado del elemento
              </label>
              <label
                htmlFor="checkbox-catalog-active"
                className="flex items-center gap-3 p-2.5 rounded-xl border border-[#F2D6DE] bg-[#FBECEF]/20 cursor-pointer hover:bg-[#FBECEF]/40 transition-colors"
              >
                <input
                  id="checkbox-catalog-active"
                  type="checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="w-4 h-4 text-[#681B2B] focus:ring-[#681B2B] rounded border-[#F2D6DE] cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-bold text-[#2C1E23] block">
                    {formActive ? 'Activo (Visible)' : 'Inactivo (Oculto)'}
                  </span>
                  <span className="text-[11px] text-[#7D6871]">
                    {formActive
                      ? 'Aparece en selectores de nuevas operaciones'
                      : 'No aparece para nuevas operaciones'}
                  </span>
                </div>
              </label>
            </div>
          </FormRow>
        </form>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL 1: PHYSICAL DELETION BLOCKED (HISTORICAL USE DETECTED) */}
      {/* ============================================================ */}
      <Modal
        id="modal-delete-blocked-notice"
        isOpen={Boolean(deleteBlockedInfo)}
        onClose={() => setDeleteBlockedInfo(null)}
        title="Eliminación física no permitida"
        subtitle="Protección de integridad y trazabilidad histórica"
        size="md"
        footer={
          <>
            <button
              type="button"
              id="btn-close-delete-blocked"
              onClick={() => setDeleteBlockedInfo(null)}
              className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-semibold text-[#7D6871] hover:bg-gray-100 rounded-xl cursor-pointer min-h-[42px] sm:min-h-[36px] flex items-center justify-center"
            >
              Cerrar
            </button>
            {deleteBlockedInfo && deleteBlockedInfo.item.active && (
              <button
                type="button"
                id="btn-deactivate-instead"
                onClick={() => {
                  if (deleteBlockedInfo) {
                    handleToggleActive(deleteBlockedInfo.item);
                    setDeleteBlockedInfo(null);
                  }
                }}
                className="w-full sm:w-auto px-5 py-2 text-xs sm:text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs cursor-pointer min-h-[42px] sm:min-h-[36px] flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Desactivar en su lugar</span>
              </button>
            )}
          </>
        }
      >
        {deleteBlockedInfo && (
          <div className="space-y-4 text-xs text-[#2C1E23]">
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-amber-900 text-sm">
                  El valor "{deleteBlockedInfo.item.name}" ya ha sido utilizado
                </p>
                <p className="text-amber-800 leading-relaxed">
                  Este registro está vinculado con {deleteBlockedInfo.details}. Si se eliminara
                  físicamente, se rompería la integridad de la base de datos y los reportes de
                  pedidos previos.
                </p>
              </div>
            </div>

            <div className="bg-[#FBECEF]/40 p-3.5 rounded-xl border border-[#F2D6DE] space-y-2">
              <span className="font-bold text-[#681B2B] block text-xs">
                ¿Qué debe hacer para retirarlo de nuevas operaciones?
              </span>
              <p className="text-[#7D6871] leading-relaxed">
                Recomendamos cambiar su estado a <strong className="text-[#2C1E23]">Inactivo</strong>. De
                este modo:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[#7D6871] pl-1">
                <li>Permanecerá intacto y legible en todos los pedidos e históricos pasados.</li>
                <li>Ya no aparecerá como opción disponible en la creación de nuevos pedidos o insumos.</li>
              </ul>
            </div>
          </div>
        )}
      </Modal>

      {/* ============================================================ */}
      {/* CONFIRM DIALOG: DELETE UNUSED ITEM                            */}
      {/* ============================================================ */}
      <ConfirmDialog
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={`¿Eliminar "${itemToDelete?.name}"?`}
        message={`Este elemento no tiene registros históricos asociados. ¿Confirma que desea eliminarlo permanentemente del catálogo de ${definition.title.toLowerCase()}?`}
        confirmLabel="Eliminar definitivamente"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </div>
  );
};
