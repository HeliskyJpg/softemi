import React from 'react';
import { OrderStatus } from '../../types';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  };

  const getStyle = () => {
    switch (status) {
      case 'Pendiente':
        return 'bg-amber-100 text-amber-900 border border-amber-300';
      case 'En preparación':
        return 'bg-[#FBDAE3] text-[#8E315E] border border-[#FAB2D7]';
      case 'Listo':
        return 'bg-[#EBF1DE] text-[#4F5B2F] border border-[#65733D]/30';
      case 'Entregado':
        return 'bg-emerald-100 text-emerald-900 border border-emerald-300';
      case 'Cancelado':
        return 'bg-red-100 text-[#9B2C2C] border border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  const getDotColor = () => {
    switch (status) {
      case 'Pendiente':
        return 'bg-amber-500';
      case 'En preparación':
        return 'bg-[#8E315E] animate-pulse';
      case 'Listo':
        return 'bg-[#65733D]';
      case 'Entregado':
        return 'bg-emerald-600';
      case 'Cancelado':
        return 'bg-[#9B2C2C]';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <span
      id={`badge-status-${status.toLowerCase().replace(/\s+/g, '-')}`}
      className={`inline-flex items-center gap-1.5 rounded-full ${sizeClasses[size]} ${getStyle()} transition-all`}
    >
      <span className={`w-2 h-2 rounded-full ${getDotColor()}`} />
      {status}
    </span>
  );
};
