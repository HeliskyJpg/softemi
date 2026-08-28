import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  PlayCircle,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Shield,
  Layers,
  ShoppingBag,
} from 'lucide-react';

export const DemoScenarioBar: React.FC = () => {
  const {
    currentUser,
    switchUserRole,
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

  return (
    <div
      id="demo-scenario-bar"
      className="bg-gradient-to-r from-[#8E315E] via-[#7A294F] to-[#65733D] text-white shadow-md border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3 text-xs">
        {/* Left Indicator */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-white/15 text-white">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold hidden sm:inline">Guía de Validación Docente:</span>
          <span className="text-white/90 text-[11px]">
            Prototipo funcional navegable para validar alcance de pedidos
          </span>
        </div>

        {/* Action Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
          >
            {isExpanded ? 'Ocultar Casos de Prueba' : 'Ver Casos de Prueba'}
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={resetToInitialSeedData}
            className="px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/40 text-white/90 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            title="Restablecer datos simulados a su estado inicial"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden md:inline">Restablecer datos</span>
          </button>
        </div>
      </div>

      {/* Expanded Quick Demo Links */}
      {isExpanded && (
        <div className="border-t border-white/15 bg-black/20 px-4 py-3">
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
            <button
              onClick={handleTestCreateOrder}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-left transition-colors flex items-start gap-2 cursor-pointer"
            >
              <PlayCircle className="w-4 h-4 shrink-0 text-[#FAB2D7] mt-0.5" />
              <div>
                <strong className="block text-white">1. Crear Pedido Personalizado</strong>
                <span className="text-[10px] text-white/80">
                  Valida clientes, cálculo de saldo y descuento de stock.
                </span>
              </div>
            </button>

            <button
              onClick={handleTestStatusFlow}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-left transition-colors flex items-start gap-2 cursor-pointer"
            >
              <PlayCircle className="w-4 h-4 shrink-0 text-[#EBF1DE] mt-0.5" />
              <div>
                <strong className="block text-white">2. Ciclo de Estados</strong>
                <span className="text-[10px] text-white/80">
                  Pendiente → En preparación → Listo → Entregado.
                </span>
              </div>
            </button>

            <button
              onClick={handleTestStockRestore}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-left transition-colors flex items-start gap-2 cursor-pointer"
            >
              <PlayCircle className="w-4 h-4 shrink-0 text-amber-300 mt-0.5" />
              <div>
                <strong className="block text-white">3. Cancelación & Devolución</strong>
                <span className="text-[10px] text-white/80">
                  Restaura las flores e insumos al inventario.
                </span>
              </div>
            </button>

            <button
              onClick={handleTestStockCatalog}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-left transition-colors flex items-start gap-2 cursor-pointer"
            >
              <PlayCircle className="w-4 h-4 shrink-0 text-emerald-300 mt-0.5" />
              <div>
                <strong className="block text-white">4. Catálogo & Ajuste Stock</strong>
                <span className="text-[10px] text-white/80">
                  Control de stock con auditoría de ajustes.
                </span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
