import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  PlayCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const DemoScenarioBar: React.FC = () => {
  const {
    currentUser,
    resetToInitialSeedData,
    setActiveView,
    navigateToOrderDetail,
    orders,
    addToast,
  } = useApp();

  const [isExpanded, setIsExpanded] = useState(false);

  if (!currentUser) return null;

  const handleTestCreateOrder = () => {
    setActiveView('order-new');
    addToast(
      'Paso 1: Seleccione el cliente, complete datos y agregue componentes.',
      'info',
      'Guía de Demostración'
    );
  };

  const handleTestStatusFlow = () => {
    const pendingOrder = orders.find((o) => o.status === 'Pendiente') || orders[0];
    if (pendingOrder) {
      navigateToOrderDetail(pendingOrder.id);
      addToast(
        `Abriendo pedido ${pendingOrder.code}. Haga clic en "Cambiar Estado" para avanzar el flujo.`,
        'info',
        'Guía de Demostración'
      );
    }
  };

  const handleTestStockRestore = () => {
    const activeOrder =
      orders.find((o) => o.status !== 'Cancelado' && o.status !== 'Entregado') || orders[0];
    if (activeOrder) {
      navigateToOrderDetail(activeOrder.id);
      addToast(
        `Abriendo ${activeOrder.code}. Pruebe "Cancelar Pedido" para verificar la devolución automática de stock.`,
        'info',
        'Guía de Demostración'
      );
    }
  };

  const handleTestStockCatalog = () => {
    setActiveView('components');
    addToast(
      'Consulte la existencia de flores y componentes. Si es Admin, puede hacer "Ajustar Stock".',
      'info',
      'Guía de Demostración'
    );
  };

  const handleTestUsersRoles = () => {
    setActiveView('users');
    addToast(
      'Módulo de usuarios y roles: edición de información, cambio de rol y control de acceso.',
      'info',
      'Guía de Demostración'
    );
  };

  return (
    <aside
      id="demo-scenario-bar"
      aria-label="Casos de prueba para validación"
      className="bg-[#681B2B] text-white/90 text-xs select-none"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-1.5 flex items-center justify-between gap-3">
        {/* Left Indicator */}
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#F5B5C8]" />
          <span className="text-[11px] font-medium text-white/80 hidden sm:inline">
            Entorno de validación de pedidos y stock
          </span>
        </div>

        {/* Action Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
          >
            {isExpanded ? 'Ocultar casos de prueba' : 'Casos de prueba'}
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            onClick={resetToInitialSeedData}
            className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            title="Restablecer datos simulados"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden md:inline">Restablecer</span>
          </button>
        </div>
      </div>

      {/* Expanded Quick Demo Links */}
      {isExpanded && (
        <div className="border-t border-white/10 bg-[#541421] px-4 sm:px-8 py-2.5">
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 text-xs">
            <button
              onClick={handleTestCreateOrder}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-left transition-colors flex items-start gap-2 cursor-pointer"
            >
              <PlayCircle className="w-3.5 h-3.5 shrink-0 text-[#F5B5C8] mt-0.5" />
              <div>
                <strong className="block text-white text-[11px]">1. Crear Pedido</strong>
                <span className="text-[10px] text-white/70">
                  Valida clientes y stock.
                </span>
              </div>
            </button>

            <button
              onClick={handleTestStatusFlow}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-left transition-colors flex items-start gap-2 cursor-pointer"
            >
              <PlayCircle className="w-3.5 h-3.5 shrink-0 text-[#F5B5C8] mt-0.5" />
              <div>
                <strong className="block text-white text-[11px]">2. Ciclo de Estados</strong>
                <span className="text-[10px] text-white/70">
                  Pendiente → Listo → Entregado.
                </span>
              </div>
            </button>

            <button
              onClick={handleTestStockRestore}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-left transition-colors flex items-start gap-2 cursor-pointer"
            >
              <PlayCircle className="w-3.5 h-3.5 shrink-0 text-[#F5B5C8] mt-0.5" />
              <div>
                <strong className="block text-white text-[11px]">3. Cancelación</strong>
                <span className="text-[10px] text-white/70">
                  Devolución automática al stock.
                </span>
              </div>
            </button>

            <button
              onClick={handleTestStockCatalog}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-left transition-colors flex items-start gap-2 cursor-pointer"
            >
              <PlayCircle className="w-3.5 h-3.5 shrink-0 text-[#F5B5C8] mt-0.5" />
              <div>
                <strong className="block text-white text-[11px]">4. Insumos</strong>
                <span className="text-[10px] text-white/70">
                  Auditoría de inventario.
                </span>
              </div>
            </button>

            <button
              onClick={handleTestUsersRoles}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-left transition-colors flex items-start gap-2 cursor-pointer"
            >
              <PlayCircle className="w-3.5 h-3.5 shrink-0 text-[#F5B5C8] mt-0.5" />
              <div>
                <strong className="block text-white text-[11px]">5. Usuarios</strong>
                <span className="text-[10px] text-white/70">
                  Cuentas y roles.
                </span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveView('settings');
                addToast(
                  'Catálogos maestros administrables con componente CRUD genérico unificado.',
                  'info',
                  'Configuraciones'
                );
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-left transition-colors flex items-start gap-2 cursor-pointer"
            >
              <PlayCircle className="w-3.5 h-3.5 shrink-0 text-[#F5B5C8] mt-0.5" />
              <div>
                <strong className="block text-white text-[11px]">6. Configuraciones</strong>
                <span className="text-[10px] text-white/70">
                  Catálogos administrables.
                </span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveView('users');
                addToast(
                  'Haga clic en el botón "Restablecer" de cualquier usuario para iniciar el flujo de reseteo con clave temporal.',
                  'info',
                  'Tarea 7 — Restablecer Clave'
                );
              }}
              className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-left transition-colors flex items-start gap-2 cursor-pointer border border-amber-400/30"
            >
              <PlayCircle className="w-3.5 h-3.5 shrink-0 text-amber-300 mt-0.5" />
              <div>
                <strong className="block text-amber-200 text-[11px]">7. Restablecer Clave</strong>
                <span className="text-[10px] text-amber-100/80">
                  Clave temporal y cambio forzado.
                </span>
              </div>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

