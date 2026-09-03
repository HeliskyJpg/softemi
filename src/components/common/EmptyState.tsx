import React from 'react';
import { LucideIcon, PackageOpen } from 'lucide-react';

export interface EmptyStateProps {
  id?: string;
  icon?: LucideIcon;
  title: string;
  description?: string | React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Standardized EMILA EmptyState component.
 * Displays when lists, search results, or tables return zero records.
 * Portable to Jinja macro `{% macro empty_state(...) %}`.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  id,
  icon: Icon = PackageOpen,
  title,
  description,
  action,
  secondaryAction,
  className = '',
  size = 'md',
}) => {
  const iconSizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
  };

  const iconInnerClasses = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-8 h-8',
  };

  const paddingClasses = {
    sm: 'py-6 px-4',
    md: 'py-10 px-6',
    lg: 'py-16 px-8',
  };

  return (
    <div
      id={id || 'emila-empty-state'}
      className={`flex flex-col items-center justify-center text-center mx-auto ${paddingClasses[size]} ${className}`}
    >
      {/* Icon Badge */}
      <div
        className={`${iconSizeClasses[size]} rounded-2xl bg-[#FBECEF] border border-[#F2D6DE] flex items-center justify-center text-[#681B2B] mb-3.5 shadow-2xs`}
      >
        <Icon className={`${iconInnerClasses[size]} stroke-[1.8]`} />
      </div>

      {/* Title */}
      <h3 className="text-sm sm:text-base font-bold text-[#2C1E23] tracking-tight mb-1">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <div className="text-xs sm:text-[13px] text-[#7D6871] max-w-sm leading-relaxed mb-4">
          {description}
        </div>
      )}

      {/* Action Buttons */}
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-1">
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs ${
                action.variant === 'secondary'
                  ? 'bg-white border border-[#F2D6DE] text-[#2C1E23] hover:bg-[#FBECEF]/50'
                  : 'bg-[#681B2B] hover:bg-[#541421] text-white shadow-[#681B2B]/10'
              }`}
            >
              {action.icon && React.createElement(action.icon, { className: 'w-3.5 h-3.5' })}
              <span>{action.label}</span>
            </button>
          )}

          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#7D6871] hover:text-[#2C1E23] hover:bg-gray-100 transition-colors cursor-pointer"
            >
              {secondaryAction.icon &&
                React.createElement(secondaryAction.icon, { className: 'w-3.5 h-3.5' })}
              <span>{secondaryAction.label}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
