import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  const getToastConfig = (type: string) => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-white border-emerald-200 border-l-4 border-l-emerald-600 shadow-emerald-950/10',
          iconBox: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
          titleColor: 'text-emerald-950',
          textColor: 'text-[#2C1E23]',
          icon: <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />,
          defaultTitle: 'Operación exitosa',
        };
      case 'error':
        return {
          container: 'bg-white border-rose-200 border-l-4 border-l-rose-600 shadow-rose-950/10',
          iconBox: 'bg-rose-100 text-rose-800 border border-rose-200',
          titleColor: 'text-rose-950',
          textColor: 'text-[#2C1E23]',
          icon: <AlertCircle className="w-5 h-5 stroke-[2.2]" />,
          defaultTitle: 'Error del sistema',
        };
      case 'warning':
        return {
          container: 'bg-white border-amber-200 border-l-4 border-l-amber-500 shadow-amber-950/10',
          iconBox: 'bg-amber-100 text-amber-800 border border-amber-200',
          titleColor: 'text-amber-950',
          textColor: 'text-[#2C1E23]',
          icon: <AlertTriangle className="w-5 h-5 stroke-[2.2]" />,
          defaultTitle: 'Advertencia',
        };
      default:
        return {
          container: 'bg-white border-[#F2D6DE] border-l-4 border-l-[#681B2B] shadow-[#681B2B]/10',
          iconBox: 'bg-[#FBECEF] text-[#681B2B] border border-[#F2D6DE]',
          titleColor: 'text-[#681B2B]',
          textColor: 'text-[#2C1E23]',
          icon: <Info className="w-5 h-5 stroke-[2.2]" />,
          defaultTitle: 'Información',
        };
    }
  };

  return (
    <div
      id="toast-notifications-container"
      aria-live="polite"
      className="fixed top-3.5 sm:top-5 inset-x-3 sm:inset-x-auto sm:right-5 z-[9999] flex flex-col gap-3 max-w-none sm:max-w-md w-auto sm:w-full pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const config = getToastConfig(toast.type);
          const isError = toast.type === 'error';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.92 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              id={`toast-${toast.id}`}
              role={isError ? 'alert' : 'status'}
              aria-live={isError ? 'assertive' : 'polite'}
              className={`pointer-events-auto flex items-start gap-3.5 p-4 rounded-2xl shadow-xl border border-t border-r border-b ${config.container} backdrop-blur-md`}
            >
              {/* Icon badge */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${config.iconBox}`}
              >
                {config.icon}
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0 pr-1">
                <h4
                  className={`font-bold text-xs sm:text-sm mb-0.5 leading-snug tracking-tight ${config.titleColor}`}
                >
                  {toast.title || config.defaultTitle}
                </h4>
                <p className={`text-xs sm:text-[13px] leading-relaxed font-medium ${config.textColor}`}>
                  {toast.message}
                </p>
              </div>

              {/* Close Button */}
              <button
                id={`btn-close-toast-${toast.id}`}
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-[#7D6871] hover:text-[#2C1E23] p-1.5 rounded-xl hover:bg-gray-100/80 transition-colors shrink-0 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center -mr-1 -mt-1"
                aria-label="Cerrar notificación"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
