import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'primary' | 'success';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return (
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700 shrink-0">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        );
      case 'success':
        return (
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 shrink-0">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#FBECEF] border border-[#F2D6DE] flex items-center justify-center text-[#681B2B] shrink-0">
            <Info className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        );
    }
  };

  const getConfirmBtnStyle = () => {
    switch (type) {
      case 'danger':
        return 'bg-rose-700 hover:bg-rose-800 text-white shadow-rose-900/10 focus:ring-rose-300';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-900/10 focus:ring-amber-300';
      case 'success':
        return 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-900/10 focus:ring-emerald-300';
      default:
        return 'bg-[#681B2B] hover:bg-[#541421] text-white shadow-[#681B2B]/10 focus:ring-[#681B2B]/30';
    }
  };

  return (
    <AnimatePresence>
      <div
        id="modal-confirm-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-confirm-title"
        aria-describedby="modal-confirm-description"
        className="fixed inset-0 z-[9990] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.16 }}
          id="modal-confirm-content"
          className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-[#F2D6DE] relative overflow-hidden flex flex-col my-auto max-h-[90dvh]"
        >
          {/* Header row with icon, title, and close button */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#F2D6DE]/60 shrink-0">
            <div className="flex items-start gap-3 min-w-0 flex-1 pr-1">
              {getIcon()}
              <div className="min-w-0 flex-1 pt-0.5">
                <h3
                  id="modal-confirm-title"
                  className="text-base sm:text-lg font-bold text-[#2C1E23] leading-snug break-words tracking-tight"
                >
                  {title}
                </h3>
              </div>
            </div>
            <button
              id="btn-modal-close-icon"
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="text-[#7D6871] hover:text-[#2C1E23] p-1.5 rounded-xl hover:bg-gray-100 transition-colors shrink-0 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center -mr-1 -mt-1"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body content with internal scroll if message is long */}
          <div className="py-3.5 sm:py-4 overflow-y-auto flex-1 text-xs sm:text-sm text-[#524148] leading-relaxed break-words font-medium">
            <div id="modal-confirm-description">{message}</div>
          </div>

          {/* Action buttons: stacked on mobile, inline on desktop */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-2.5 pt-3 border-t border-[#F2D6DE]/60 shrink-0">
            <button
              id="btn-modal-cancel"
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-semibold text-[#7D6871] hover:text-[#2C1E23] hover:bg-gray-100 rounded-xl transition-colors cursor-pointer min-h-[42px] sm:min-h-[36px] flex items-center justify-center"
            >
              {cancelText}
            </button>
            <button
              id="btn-modal-confirm"
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`w-full sm:w-auto px-5 py-2.5 sm:py-2 text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all focus:ring-2 cursor-pointer flex items-center justify-center gap-2 min-h-[42px] sm:min-h-[36px] ${getConfirmBtnStyle()}`}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
