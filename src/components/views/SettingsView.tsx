import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Settings,
  Layers,
  Search,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  ArrowLeft,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { CatalogKey } from '../../types';
import {
  CATALOG_DEFINITIONS,
  CATALOG_KEYS_ORDERED,
  CatalogDefinition,
} from '../../config/catalogsConfig';
import { GenericCatalogManager } from '../settings/GenericCatalogManager';

export const SettingsView: React.FC = () => {
  const { currentUser, getCatalogItems, hasPermission } = useApp();
  const [selectedKey, setSelectedKey] = useState<CatalogKey>('order_channels');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [mobileShowList, setMobileShowList] = useState(false);

  // Security guard - requires settings.manage permission
  if (!currentUser || !hasPermission('settings.manage')) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-[#F2D6DE] text-center max-w-md mx-auto my-12 shadow-xs">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-[#2C1E23]">Acceso Restringido</h2>
        <p className="text-xs text-[#7D6871] mt-1.5 leading-relaxed">
          La sección de Configuraciones y Catálogos Maestros requiere el permiso de{' '}
          <strong>Administración de configuraciones (settings.manage)</strong>.
        </p>
      </div>
    );
  }

  // Filter available catalogs in sidebar
  const filteredCatalogKeys = CATALOG_KEYS_ORDERED.filter((key) => {
    const def = CATALOG_DEFINITIONS[key];
    if (!catalogSearch.trim()) return true;
    const q = catalogSearch.toLowerCase().trim();
    return (
      def.title.toLowerCase().includes(q) ||
      def.description.toLowerCase().includes(q)
    );
  });

  const activeCatalogDef: CatalogDefinition =
    CATALOG_DEFINITIONS[selectedKey] || CATALOG_DEFINITIONS.order_channels;

  return (
    <div id="settings-view-root" className="space-y-6">
      {/* Page Title & Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#7D6871] font-semibold mb-1">
            <span className="text-[#681B2B]">Administración</span>
            <span>/</span>
            <span className="text-[#2C1E23]">Configuraciones</span>
            <span>/</span>
            <span className="text-[#681B2B]">{activeCatalogDef.title}</span>
          </div>
          <h1 className="text-2xl font-black text-[#2C1E23] tracking-tight flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-[#681B2B]" />
            Configuraciones del Sistema
          </h1>
          <p className="text-xs sm:text-sm text-[#7D6871] mt-0.5 font-medium">
            Administración centralizada de catálogos maestros y valores dinámicos para pedidos e insumos.
          </p>
        </div>

        {/* Mobile toggle list / detail button */}
        <div className="sm:hidden flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileShowList(!mobileShowList)}
            className="w-full py-2 px-3 rounded-xl bg-white border border-[#F2D6DE] text-xs font-bold text-[#681B2B] flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
            <span>{mobileShowList ? 'Ver catálogo seleccionado' : 'Ver todos los catálogos'}</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Catalogs Directory Sidebar */}
        <div
          id="catalogs-directory-sidebar"
          className={`lg:col-span-4 space-y-4 ${
            mobileShowList ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="bg-white rounded-2xl p-4 border border-[#F2D6DE]/70 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#9C858F] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#681B2B]" />
                Catálogos Disponibles
              </span>
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-[#FBECEF] text-[#681B2B] border border-[#F2D6DE]">
                {CATALOG_KEYS_ORDERED.length}
              </span>
            </div>

            {/* Fast search in catalogs list */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7D6871] pointer-events-none" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Filtrar catálogos..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#F2D6DE] bg-white text-[#2C1E23] placeholder-[#7D6871]/60 focus:outline-none focus:ring-1 focus:ring-[#681B2B]/20"
              />
            </div>

            {/* Catalog Items Navigation List */}
            <nav className="space-y-1.5 pt-1">
              {filteredCatalogKeys.map((key) => {
                const def = CATALOG_DEFINITIONS[key];
                const Icon = def.icon;
                const isSelected = selectedKey === key;
                const items = getCatalogItems(key, false);
                const activeCount = items.filter((it) => it.active).length;

                return (
                  <button
                    key={key}
                    id={`catalog-nav-item-${key}`}
                    type="button"
                    onClick={() => {
                      setSelectedKey(key);
                      setMobileShowList(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group cursor-pointer border ${
                      isSelected
                        ? 'bg-[#681B2B] text-white border-[#681B2B] shadow-xs'
                        : 'bg-white hover:bg-[#FBECEF]/40 border-transparent hover:border-[#F2D6DE]/60 text-[#2C1E23]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-[#FBECEF] text-[#681B2B] group-hover:bg-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-bold truncate ${
                            isSelected ? 'text-white' : 'text-[#2C1E23]'
                          }`}
                        >
                          {def.title}
                        </p>
                        <p
                          className={`text-[10px] truncate mt-0.5 ${
                            isSelected ? 'text-white/80' : 'text-[#7D6871]'
                          }`}
                        >
                          {activeCount} activo{activeCount !== 1 ? 's' : ''} de {items.length}
                        </p>
                      </div>
                    </div>

                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isSelected
                          ? 'text-white translate-x-0.5'
                          : 'text-[#9C858F] group-hover:text-[#681B2B]'
                      }`}
                    />
                  </button>
                );
              })}

              {filteredCatalogKeys.length === 0 && (
                <div className="text-center py-6 text-xs text-[#7D6871]">
                  No se encontraron catálogos con "{catalogSearch}".
                </div>
              )}
            </nav>
          </div>

          {/* Quick Info Tip */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#F2D6DE]/60 shadow-xs space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#681B2B]">
              <Sparkles className="w-4 h-4" />
              <span>Arquitectura Modular</span>
            </div>
            <p className="text-[#7D6871] leading-relaxed text-[11px]">
              Cada catálogo utiliza el mismo motor CRUD genérico de EMILA. Cualquier modificación se
              refleja de inmediato en los selectores y formularios de pedidos e inventario.
            </p>
          </div>
        </div>

        {/* Right Column: Reusable Generic Catalog Manager */}
        <div
          id="catalog-manager-main-pane"
          className={`lg:col-span-8 ${
            mobileShowList ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Reusable Generic CRUD Manager */}
          <GenericCatalogManager catalogKey={selectedKey} />
        </div>
      </div>
    </div>
  );
};
