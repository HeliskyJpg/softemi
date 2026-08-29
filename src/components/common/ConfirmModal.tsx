import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
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
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-100 flex items-center justify-center text-[#9B2C2C] shrink-0">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        );
      case 'success':
        return (
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#EBF1DE] flex items-center justify-center text-[#65733D] shrink-0">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#FBDAE3] flex items-center justify-center text-[#8E315E] shrink-0">
            <Info className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        );
    }
  };

  const getConfirmBtnStyle = () => {
    switch (type) {
      case 'danger':
        return 'bg-[#9B2C2C] hover:bg-[#822424] text-white focus:ring-red-300';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-300';
      case 'success':
        return 'bg-[#65733D] hover:bg-[#546032] text-white focus:ring-[#65733D]/30';
      default:
        return 'bg-[#8E315E] hover:bg-[#7A294F] text-white focus:ring-[#8E315E]/30';
    }
  };

  return (
    <AnimatePresence>
      <div
        id="modal-confirm-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          id="modal-confirm-content"
          className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-[#FBDAE3]/60 relative overflow-hidden flex flex-col my-auto max-h-[90dvh]"
        >
          {/* Header row with icon, title, and close button */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100/80 shrink-0">
            <div className="flex items-start gap-3 min-w-0 flex-1 pr-1">
              {getIcon()}
              <div className="min-w-0 flex-1 pt-0.5">
                <h3 id="modal-confirm-title" className="text-base sm:text-lg font-bold text-[#3A2D33] leading-snug break-words">
                  {title}
                </h3>
              </div>
            </div>
            <button
              id="btn-modal-close-icon"
              onClick={onClose}
              disabled={isLoading}
              className="text-[#6D5C64] hover:text-[#3A2D33] p-1.5 rounded-lg hover:bg-gray-100 transition-colors shrink-0 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center -mr-1 -mt-1"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body content with internal scroll if message is long */}
          <div className="py-3.5 sm:py-4 overflow-y-auto flex-1 text-xs sm:text-sm text-[#6D5C64] leading-relaxed break-words">
            <p id="modal-confirm-description">
              {message}
            </p>
          </div>

          {/* Action buttons: stacked on mobile, inline on desktop */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 pt-3 border-t border-gray-100 shrink-0">
            <button
              id="btn-modal-cancel"
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-medium text-[#6D5C64] hover:text-[#3A2D33] hover:bg-gray-100 rounded-xl transition-colors cursor-pointer min-h-[42px] sm:min-h-[36px] flex items-center justify-center"
            >
              {cancelText}
            </button>
            <button
              id="btn-modal-confirm"
              type="button"
              onClick={() => {
                onConfirm();
              }}
              disabled={isLoading}
              className={`w-full sm:w-auto px-5 py-2.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all focus:ring-2 cursor-pointer flex items-center justify-center gap-2 min-h-[42px] sm:min-h-[36px] ${getConfirmBtnStyle()}`}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Procesando...
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
