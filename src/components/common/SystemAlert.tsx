import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type SystemAlertType = 'success' | 'error' | 'warning' | 'info';

export interface SystemAlertProps {
  id?: string;
  type?: SystemAlertType;
  title?: string;
  message: React.ReactNode;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const SystemAlert: React.FC<SystemAlertProps> = ({
  id,
  type = 'info',
  title,
  message,
  onClose,
  action,
  className = '',
}) => {
  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-emerald-50/90 border-emerald-200 text-emerald-950 border-l-4 border-l-emerald-600',
          iconBox: 'bg-emerald-100 text-emerald-800 border border-emerald-200/80',
          title: 'text-emerald-900',
          icon: <CheckCircle2 className="w-4 h-4" />,
          actionBtn: 'bg-emerald-700 hover:bg-emerald-800 text-white',
          closeBtn: 'text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900',
        };
      case 'error':
        return {
          container: 'bg-rose-50/90 border-rose-200 text-rose-950 border-l-4 border-l-rose-600',
          iconBox: 'bg-rose-100 text-rose-800 border border-rose-200/80',
          title: 'text-rose-900',
          icon: <AlertCircle className="w-4 h-4" />,
          actionBtn: 'bg-rose-700 hover:bg-rose-800 text-white',
          closeBtn: 'text-rose-700 hover:bg-rose-100 hover:text-rose-900',
        };
      case 'warning':
        return {
          container: 'bg-amber-50/90 border-amber-200 text-amber-950 border-l-4 border-l-amber-500',
          iconBox: 'bg-amber-100 text-amber-800 border border-amber-200/80',
          title: 'text-amber-900',
          icon: <AlertTriangle className="w-4 h-4" />,
          actionBtn: 'bg-amber-700 hover:bg-amber-800 text-white',
          closeBtn: 'text-amber-700 hover:bg-amber-100 hover:text-amber-900',
        };
      default:
        return {
          container: 'bg-[#FBECEF]/80 border-[#F2D6DE] text-[#2C1E23] border-l-4 border-l-[#681B2B]',
          iconBox: 'bg-[#FBECEF] text-[#681B2B] border border-[#F2D6DE]',
          title: 'text-[#681B2B]',
          icon: <Info className="w-4 h-4" />,
          actionBtn: 'bg-[#681B2B] hover:bg-[#541421] text-white',
          closeBtn: 'text-[#7D6871] hover:bg-[#FBECEF] hover:text-[#681B2B]',
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      id={id}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={`p-3.5 sm:p-4 rounded-xl border shadow-xs flex items-start gap-3 text-xs sm:text-sm ${styles.container} ${className}`}
    >
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${styles.iconBox}`}>
        {styles.icon}
      </div>

      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={`font-bold text-xs sm:text-sm mb-0.5 leading-snug ${styles.title}`}>
            {title}
          </h4>
        )}
        <div className="text-xs leading-relaxed font-medium break-words">
          {message}
        </div>

        {action && (
          <div className="mt-2.5">
            <button
              type="button"
              onClick={action.onClick}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs ${styles.actionBtn}`}
            >
              {action.label}
            </button>
          </div>
        )}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className={`p-1.5 rounded-lg transition-colors shrink-0 cursor-pointer -mr-1 -mt-1 ${styles.closeBtn}`}
          aria-label="Cerrar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
