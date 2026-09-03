import React from 'react';
import { OrderStatus } from '../../types';

export type BadgeVariant =
  | 'order'
  | 'stock'
  | 'user'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

export interface StatusBadgeProps {
  status: OrderStatus | 'Activo' | 'Inactivo' | 'Normal' | 'Bajo stock' | 'Agotado' | string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  id?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  size = 'md',
  className = '',
  id,
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] leading-tight',
    md: 'px-2.5 py-1 text-xs font-semibold leading-tight',
    lg: 'px-3 py-1.5 text-sm font-semibold leading-tight',
  };

  const getStyle = () => {
    // If explicit variant is provided
    if (variant === 'success') return 'bg-[#DCFCE7] text-[#059669] border-[#A7F3D0]';
    if (variant === 'warning') return 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]';
    if (variant === 'danger') return 'bg-[#FEE2E2] text-[#DC2626] border-[#FECDD3]';
    if (variant === 'info') return 'bg-[#DBEAFE] text-[#2563EB] border-[#BFDBFE]';
    if (variant === 'neutral') return 'bg-gray-100 text-[#4B5563] border-gray-200';

    // By status value
    switch (status) {
      // Order Statuses
      case 'Pendiente':
        return 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]';
      case 'En preparación':
        return 'bg-[#DBEAFE] text-[#2563EB] border-[#BFDBFE]';
      case 'Listo':
        return 'bg-[#DCFCE7] text-[#16A34A] border-[#A7F3D0]';
      case 'Entregado':
        return 'bg-[#D1FAE5] text-[#059669] border-[#A7F3D0]';
      case 'Cancelado':
        return 'bg-[#FEE2E2] text-[#DC2626] border-[#FECDD3]';

      // User & Entity Statuses
      case 'Activo':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Inactivo':
        return 'bg-gray-100 text-gray-500 border-gray-200';

      // Stock Statuses
      case 'Normal':
      case 'En stock':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Bajo stock':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Agotado':
        return 'bg-rose-50 text-rose-700 border-rose-200';

      default:
        return 'bg-gray-100 text-[#4B5563] border-gray-200';
    }
  };

  const safeId =
    id ||
    `badge-status-${String(status || '')
      .toLowerCase()
      .replace(/\s+/g, '-')}`;

  return (
    <span
      id={safeId}
      className={`inline-flex items-center justify-center rounded-full border whitespace-nowrap select-none font-medium tracking-tight ${sizeClasses[size]} ${getStyle()} ${className}`}
    >
      {status}
    </span>
  );
};


