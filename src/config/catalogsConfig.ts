import React from 'react';
import {
  MessageSquare,
  Tag,
  Ruler,
  RotateCcw,
  CreditCard,
  Truck,
} from 'lucide-react';
import {
  CatalogItem,
  CatalogKey,
  Order,
  ComponentItem,
  StockAdjustmentLog,
  AutocompleteOption,
} from '../types';

export interface CatalogSelectOptionsParams {
  currentValue?: string;
  isNew?: boolean;
  includeDescription?: boolean;
  inactiveLabelSuffix?: string;
}

/**
 * Builds standard AutocompleteOption[] from a catalog item list, strictly enforcing:
 * 1. Active-only options for new records (isNew: true)
 * 2. Historical deactivated items preserved when editing existing records (isNew: false)
 * 3. Consistent ordering by orderIndex and name
 * 4. Graceful retention of legacy historical values not in catalog
 */
export function buildCatalogSelectOptions(
  items: CatalogItem[] | undefined,
  params?: CatalogSelectOptionsParams
): AutocompleteOption[] {
  if (!items || !Array.isArray(items)) return [];

  const currentValue = params?.currentValue?.trim() || '';
  const isNew = params?.isNew ?? false;
  const inactiveSuffix = params?.inactiveLabelSuffix ?? ' (Inactivo)';

  const result: AutocompleteOption[] = [];
  let currentValueFoundInActive = false;
  let currentValueFoundInInactive = false;

  // Sort by orderIndex first, then by name
  const sorted = [...items].sort((a, b) => {
    if ((a.orderIndex ?? 0) !== (b.orderIndex ?? 0)) {
      return (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
    }
    return a.name.localeCompare(b.name);
  });

  for (const item of sorted) {
    const matchesCurrent =
      Boolean(currentValue) && item.name.trim().toLowerCase() === currentValue.toLowerCase();

    if (item.active) {
      if (matchesCurrent) {
        currentValueFoundInActive = true;
      }
      result.push({
        value: item.name,
        label: item.name,
        description: params?.includeDescription ? item.description : undefined,
      });
    } else if (!isNew && matchesCurrent) {
      // Historical deactivated item matches the existing record's value: preserve it
      currentValueFoundInInactive = true;
      result.push({
        value: item.name,
        label: `${item.name}${inactiveSuffix}`,
        description: params?.includeDescription
          ? (item.description ? `${item.description} - Desactivado en catálogo` : 'Desactivado en catálogo')
          : 'Desactivado en catálogo',
      });
    }
  }

  // Edge case: if editing an existing record and currentValue is not in catalog at all,
  // retain it so the form never blanks out or corrupts historical data
  if (!isNew && currentValue && !currentValueFoundInActive && !currentValueFoundInInactive) {
    result.push({
      value: currentValue,
      label: `${currentValue}${inactiveSuffix}`,
      description: 'Registro histórico conservado',
    });
  }

  return result;
}

export interface CatalogUsageCheckContext {
  orders: Order[];
  components: ComponentItem[];
  stockLogs: StockAdjustmentLog[];
}

export interface CatalogUsageResult {
  inUse: boolean;
  count: number;
  details: string;
}

export interface CatalogDefinition {
  key: CatalogKey;
  title: string;
  singularTitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  nameLabel?: string;
  namePlaceholder?: string;
  descriptionPlaceholder?: string;
  badgeColor?: string;
  defaultItems: Array<Omit<CatalogItem, 'createdAt' | 'updatedAt'>>;
  checkInUse?: (
    item: CatalogItem,
    context: CatalogUsageCheckContext
  ) => CatalogUsageResult;
}

export const CATALOG_DEFINITIONS: Record<CatalogKey, CatalogDefinition> = {
  order_channels: {
    key: 'order_channels',
    title: 'Canales de recepción',
    singularTitle: 'Canal de recepción',
    description:
      'Medios y plataformas a través de los cuales los clientes solicitan pedidos y cotizaciones a EMILA.',
    icon: MessageSquare,
    nameLabel: 'Nombre del canal',
    namePlaceholder: 'Ej. WhatsApp, Instagram, Llamada telefónica...',
    descriptionPlaceholder: 'Breve explicación sobre el uso de este canal de ventas...',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    defaultItems: [
      {
        id: 'cat-ch-1',
        name: 'WhatsApp',
        description: 'Mensajería instantánea directa para atención al cliente y pedidos rápidos.',
        active: true,
        orderIndex: 1,
      },
      {
        id: 'cat-ch-2',
        name: 'Instagram',
        description: 'Mensajes directos por catálogo visual en redes sociales.',
        active: true,
        orderIndex: 2,
      },
      {
        id: 'cat-ch-3',
        name: 'Llamada',
        description: 'Recepción telefónica directa de requerimientos florales.',
        active: true,
        orderIndex: 3,
      },
      {
        id: 'cat-ch-4',
        name: 'En tienda / Mostrador',
        description: 'Clientes que visitan y solicitan su encargo presencialmente en el taller.',
        active: true,
        orderIndex: 4,
      },
      {
        id: 'cat-ch-5',
        name: 'Otro',
        description: 'Canales eventuales, referidos o recomendaciones personales.',
        active: true,
        orderIndex: 5,
      },
    ],
    checkInUse: (item, { orders }) => {
      const target = item.name.trim().toLowerCase();
      const matches = orders.filter((o) => (o.channel || '').trim().toLowerCase() === target);
      return {
        inUse: matches.length > 0,
        count: matches.length,
        details:
          matches.length === 1
            ? 'utilizado en 1 pedido histórico'
            : `utilizado en ${matches.length} pedidos históricos`,
      };
    },
  },

  component_categories: {
    key: 'component_categories',
    title: 'Categorías de componentes',
    singularTitle: 'Categoría de componente',
    description:
      'Familias y clasificaciones de materias primas e insumos utilizados en el taller floral.',
    icon: Tag,
    nameLabel: 'Nombre de la categoría',
    namePlaceholder: 'Ej. Flores, Follajes, Empaques, Bases...',
    descriptionPlaceholder: 'Descripción de los tipos de insumos comprendidos en esta categoría...',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    defaultItems: [
      {
        id: 'cat-cat-1',
        name: 'Flores',
        description: 'Flores frescas de corte (rosas, girasoles, lilies, claveles, etc.).',
        active: true,
        orderIndex: 1,
      },
      {
        id: 'cat-cat-2',
        name: 'Follajes',
        description: 'Hojas, eucalipto, ruscus y elementos botánicos de relleno verde.',
        active: true,
        orderIndex: 2,
      },
      {
        id: 'cat-cat-3',
        name: 'Empaques',
        description: 'Cajas rígidas, papel coreano, celofán y envoltorios de protección.',
        active: true,
        orderIndex: 3,
      },
      {
        id: 'cat-cat-4',
        name: 'Decoración',
        description: 'Elementos decorativos, picks temáticos y mariposas.',
        active: true,
        orderIndex: 4,
      },
      {
        id: 'cat-cat-5',
        name: 'Dulces y chocolates',
        description: 'Bombones gourmet, chocolates finos y dulces de acompañamiento.',
        active: true,
        orderIndex: 5,
      },
      {
        id: 'cat-cat-6',
        name: 'Globos',
        description: 'Globos metalizados y de látex para diversas ocasiones festivas.',
        active: true,
        orderIndex: 6,
      },
      {
        id: 'cat-cat-7',
        name: 'Tarjetas',
        description: 'Tarjetas personalizadas, dedicatorias caligrafiadas y sobres de regalo.',
        active: true,
        orderIndex: 7,
      },
      {
        id: 'cat-cat-8',
        name: 'Accesorios',
        description: 'Listones de satín, cintas, alfileres con perlas y lazos de tela.',
        active: true,
        orderIndex: 8,
      },
      {
        id: 'cat-cat-9',
        name: 'Bases y Floreros',
        description: 'Floreros de cristal, cerámica, canastas y bases artesanales.',
        active: true,
        orderIndex: 9,
      },
    ],
    checkInUse: (item, { components, orders }) => {
      const target = item.name.trim().toLowerCase();
      const compMatches = components.filter(
        (c) => (c.category || '').trim().toLowerCase() === target
      );
      const orderMatches = orders.reduce((acc, order) => {
        const matchingItems = order.items.filter(
          (it) => (it.category || '').trim().toLowerCase() === target
        );
        return acc + matchingItems.length;
      }, 0);

      const total = compMatches.length + orderMatches;
      return {
        inUse: total > 0,
        count: total,
        details: `${compMatches.length} insumo(s) y ${orderMatches} línea(s) en pedidos históricos`,
      };
    },
  },

  component_units: {
    key: 'component_units',
    title: 'Unidades de medida',
    singularTitle: 'Unidad de medida',
    description:
      'Unidades métricas y de fraccionamiento utilizadas para costeo y control de stock de insumos.',
    icon: Ruler,
    nameLabel: 'Nombre de la unidad',
    namePlaceholder: 'Ej. Unidad, Tallos, Paquete, Docena, Metros...',
    descriptionPlaceholder: 'Abreviatura o uso habitual en el control del taller...',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    defaultItems: [
      { id: 'cat-un-1', name: 'Unidad', description: 'Pieza individual u objeto unitario.', active: true, orderIndex: 1 },
      { id: 'cat-un-2', name: 'Tallos', description: 'Vara o tallo floral de corte individual.', active: true, orderIndex: 2 },
      { id: 'cat-un-3', name: 'Paquete', description: 'Atado o presentación agrupada de insumos.', active: true, orderIndex: 3 },
      { id: 'cat-un-4', name: 'Docena', description: 'Conjunto de 12 unidades.', active: true, orderIndex: 4 },
      { id: 'cat-un-5', name: 'Metros', description: 'Medición lineal para listones, encajes y cintas.', active: true, orderIndex: 5 },
      { id: 'cat-un-6', name: 'Pliegos', description: 'Hojas extendidas de papel decorativo o coreano.', active: true, orderIndex: 6 },
      { id: 'cat-un-7', name: 'Cajas', description: 'Envase o contenedor de insumos por bulto.', active: true, orderIndex: 7 },
      { id: 'cat-un-8', name: 'Bolsas', description: 'Bolsa sellada de elementos pequeños.', active: true, orderIndex: 8 },
      { id: 'cat-un-9', name: 'Ramos', description: 'Ramilletes prearmados en vivero o distribuidor.', active: true, orderIndex: 9 },
      { id: 'cat-un-10', name: 'Rollos', description: 'Bobina continua de listón o cinta.', active: true, orderIndex: 10 },
      { id: 'cat-un-11', name: 'Pieza', description: 'Artículo decorativo o elemento singular.', active: true, orderIndex: 11 },
      { id: 'cat-un-12', name: 'Set', description: 'Kit o conjunto compuesto de varios componentes.', active: true, orderIndex: 12 },
    ],
    checkInUse: (item, { components }) => {
      const target = item.name.trim().toLowerCase();
      const matches = components.filter((c) => (c.unit || '').trim().toLowerCase() === target);
      return {
        inUse: matches.length > 0,
        count: matches.length,
        details: `${matches.length} insumo(s) del catálogo utilizan esta unidad de medida`,
      };
    },
  },

  stock_adjustment_reasons: {
    key: 'stock_adjustment_reasons',
    title: 'Motivos de ajuste de stock',
    singularTitle: 'Motivo de ajuste',
    description:
      'Causales estandarizadas para justificar entradas, mermas o correcciones de existencias en el inventario.',
    icon: RotateCcw,
    nameLabel: 'Nombre del motivo',
    namePlaceholder: 'Ej. Merma natural, Conteo físico, Reabastecimiento...',
    descriptionPlaceholder: 'Criterio operativo en el que se aplica este motivo de ajuste...',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    defaultItems: [
      {
        id: 'cat-mot-1',
        name: 'Reabastecimiento / Compra de insumos',
        description: 'Ingreso al inventario por compra de lote o pedido a proveedor.',
        active: true,
        orderIndex: 1,
      },
      {
        id: 'cat-mot-2',
        name: 'Conteo físico / Cuadre de inventario',
        description: 'Corrección de saldo físico tras auditoría o conteo directo en taller.',
        active: true,
        orderIndex: 2,
      },
      {
        id: 'cat-mot-3',
        name: 'Merma natural / Flor marchita',
        description: 'Baja inevitable por ciclo biológico, deshidratación o marchitamiento floral.',
        active: true,
        orderIndex: 3,
      },
      {
        id: 'cat-mot-4',
        name: 'Daño, rotura o empaque defectuoso',
        description: 'Insumos estropeados por manipulación en mesa, accidentes o tara de fábrica.',
        active: true,
        orderIndex: 4,
      },
      {
        id: 'cat-mot-5',
        name: 'Devolución o reintegración al taller',
        description: 'Sobrantes de montajes o pedidos cancelados reingresados a existencia física.',
        active: true,
        orderIndex: 5,
      },
      {
        id: 'cat-mot-6',
        name: 'Muestra o fotografía de catálogo',
        description: 'Uso de insumos para vitrina, muestras comerciales o tomas promocionales.',
        active: true,
        orderIndex: 6,
      },
      {
        id: 'cat-mot-7',
        name: 'Otro motivo particular',
        description: 'Ajustes no categorizados con detalle obligatorio en observaciones.',
        active: true,
        orderIndex: 7,
      },
    ],
    checkInUse: (item, { stockLogs }) => {
      const target = item.name.trim().toLowerCase();
      const matches = stockLogs.filter((l) => (l.reason || '').trim().toLowerCase() === target);
      return {
        inUse: matches.length > 0,
        count: matches.length,
        details: `${matches.length} movimiento(s) de ajuste en la bitácora de inventario`,
      };
    },
  },

  payment_methods: {
    key: 'payment_methods',
    title: 'Formas de pago',
    singularTitle: 'Forma de pago',
    description:
      'Métodos autorizados para el cobro de anticipos, abonos y liquidaciones de pedidos.',
    icon: CreditCard,
    nameLabel: 'Nombre de la forma de pago',
    namePlaceholder: 'Ej. Efectivo, Transferencia bancaria, Tarjeta...',
    descriptionPlaceholder: 'Instrucciones o detalles de conciliación del pago...',
    badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
    defaultItems: [
      {
        id: 'cat-pay-1',
        name: 'Efectivo',
        description: 'Moneda de curso legal (Quetzales) recibida en caja o contra entrega.',
        active: true,
        orderIndex: 1,
      },
      {
        id: 'cat-pay-2',
        name: 'Transferencia bancaria',
        description: 'Transferencia ACH o bancaria a cuentas institucionales de EMILA.',
        active: true,
        orderIndex: 2,
      },
      {
        id: 'cat-pay-3',
        name: 'Tarjeta de débito / crédito',
        description: 'Cobro a través de terminal POS física en taller.',
        active: true,
        orderIndex: 3,
      },
      {
        id: 'cat-pay-4',
        name: 'Depósito monetario',
        description: 'Depósito en agencia bancaria verificado por boleta de recepción.',
        active: true,
        orderIndex: 4,
      },
      {
        id: 'cat-pay-5',
        name: 'Enlace de pago (Link)',
        description: 'Pago virtual seguro generado para envío por WhatsApp o correo.',
        active: true,
        orderIndex: 5,
      },
    ],
    checkInUse: (item, { orders }) => {
      const target = item.name.trim().toLowerCase();
      const matches = orders.filter((o) =>
        o.history.some((h) => (h.details || '').toLowerCase().includes(target))
      );
      return {
        inUse: matches.length > 0,
        count: matches.length,
        details: `${matches.length} pedido(s) con registros históricos asociados a este método`,
      };
    },
  },

  delivery_types: {
    key: 'delivery_types',
    title: 'Tipos de entrega',
    singularTitle: 'Tipo de entrega',
    description:
      'Modalidades de logística y despacho para la entrega de arreglos florales y regalos.',
    icon: Truck,
    nameLabel: 'Nombre de la modalidad',
    namePlaceholder: 'Ej. Envío a domicilio, Recoger en taller...',
    descriptionPlaceholder: 'Condiciones generales de logística y entrega...',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    defaultItems: [
      {
        id: 'cat-del-1',
        name: 'Envío a domicilio',
        description: 'Despacho con repartidor de confianza hasta la dirección solicitada.',
        active: true,
        orderIndex: 1,
      },
      {
        id: 'cat-del-2',
        name: 'Recoger en taller',
        description: 'El cliente o su comisionado retira el pedido directamente en mesa de salida.',
        active: true,
        orderIndex: 2,
      },
      {
        id: 'cat-del-3',
        name: 'Entrega prioritaria / Express',
        description: 'Despacho con franja horaria estricta y protocolo de máxima urgencia.',
        active: true,
        orderIndex: 3,
      },
    ],
    checkInUse: (item, { orders }) => {
      const target = item.name.trim().toLowerCase();
      const matches = orders.filter((o) =>
        (o.observations || '').toLowerCase().includes(target)
      );
      return {
        inUse: matches.length > 0,
        count: matches.length,
        details: `${matches.length} pedido(s) con referencias en observaciones`,
      };
    },
  },
};

export const CATALOG_KEYS_ORDERED: CatalogKey[] = [
  'order_channels',
  'component_categories',
  'component_units',
  'stock_adjustment_reasons',
  'payment_methods',
  'delivery_types',
];
