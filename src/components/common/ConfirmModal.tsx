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
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-[#9B2C2C] shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
        );
      case 'success':
        return (
          <div className="w-12 h-12 rounded-full bg-[#EBF1DE] flex items-center justify-center text-[#65733D] shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 rounded-full bg-[#FBDAE3] flex items-center justify-center text-[#8E315E] shrink-0">
            <Info className="w-6 h-6" />
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
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          id="modal-confirm-content"
          className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#FBDAE3]/50 relative overflow-hidden"
        >
          <button
            id="btn-modal-close-icon"
            onClick={onClose}
            disabled={isLoading}
            className="absolute top-4 right-4 text-[#6D5C64] hover:text-[#3A2D33] p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            {getIcon()}
            <div className="flex-1">
              <h3 id="modal-confirm-title" className="text-lg font-bold text-[#3A2D33] mb-1.5">
                {title}
              </h3>
              <p id="modal-confirm-description" className="text-sm text-[#6D5C64] leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              id="btn-modal-cancel"
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-[#6D5C64] hover:text-[#3A2D33] hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
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
              className={`px-5 py-2 text-sm font-semibold rounded-xl shadow-sm transition-all focus:ring-2 cursor-pointer flex items-center gap-2 ${getConfirmBtnStyle()}`}
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
