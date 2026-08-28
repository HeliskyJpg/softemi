import React from 'react';
import { OrderStatus } from '../../types';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-[11px]',
    md: 'px-3 py-1 text-xs font-medium',
    lg: 'px-3.5 py-1.5 text-sm font-medium',
  };

  const getStyle = () => {
    switch (status) {
      case 'Pendiente':
        return 'bg-[#FEF3C7] text-[#B45309]';
      case 'En preparación':
        return 'bg-[#DBEAFE] text-[#2563EB]';
      case 'Listo':
        return 'bg-[#DCFCE7] text-[#16A34A]';
      case 'Entregado':
        return 'bg-[#D1FAE5] text-[#059669]';
      case 'Cancelado':
        return 'bg-[#FEE2E2] text-[#DC2626]';
      default:
        return 'bg-[#F3F4F6] text-[#4B5563]';
    }
  };

  return (
    <span
      id={`badge-status-${status.toLowerCase().replace(/\s+/g, '-')}`}
      className={`inline-flex items-center justify-center rounded-full ${sizeClasses[size]} ${getStyle()} font-medium transition-all`}
    >
      {status}
    </span>
  );
};

