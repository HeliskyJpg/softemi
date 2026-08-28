import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-[#65733D] shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-[#9B2C2C] shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-[#8E315E] shrink-0" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-[#65733D] bg-white';
      case 'error':
        return 'border-[#9B2C2C] bg-white';
      case 'warning':
        return 'border-amber-400 bg-white';
      default:
        return 'border-[#8E315E] bg-white';
    }
  };

  return (
    <div
      id="toast-notifications-container"
      className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            id={`toast-${toast.id}`}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border-l-4 ${getBorderColor(
              toast.type
            )} shadow-black/10 border-t border-r border-b border-gray-100`}
          >
            {getIcon(toast.type)}
            <div className="flex-1 text-sm">
              {toast.title && (
                <h4 className="font-semibold text-[#3A2D33] text-sm mb-0.5">{toast.title}</h4>
              )}
              <p className="text-[#6D5C64] leading-snug">{toast.message}</p>
            </div>
            <button
              id={`btn-close-toast-${toast.id}`}
              onClick={() => removeToast(toast.id)}
              className="text-[#6D5C64] hover:text-[#3A2D33] p-1 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
