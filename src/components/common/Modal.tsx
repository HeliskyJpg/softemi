import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  size?: ModalSize;
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  id?: string;
  className?: string;
}

/**
 * Standardized EMILA Responsive Modal.
 * Adapts smoothly between mobile viewports and desktop dialogs.
 * Direct equivalent of a Jinja `{% macro modal(...) %}` with overlay and slot targets.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  size = 'md',
  children,
  footer,
  closeOnOverlayClick = true,
  showCloseButton = true,
  id,
  className = '',
}) => {
  // ESC key dismiss listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses: Record<ModalSize, string> = {
    sm: 'max-w-sm', // ~384px
    md: 'max-w-md', // ~448px
    lg: 'max-w-2xl', // ~672px
    xl: 'max-w-4xl', // ~896px
    full: 'max-w-5xl', // ~1024px
  };

  const selectedSizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <AnimatePresence>
      <div
        id={id ? `${id}-overlay` : 'emila-modal-overlay'}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? (id ? `${id}-title` : 'modal-title') : undefined}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto"
        onClick={(e) => {
          if (closeOnOverlayClick && e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          id={id ? `${id}-content` : 'emila-modal-content'}
          className={`bg-white rounded-2xl w-full ${selectedSizeClass} shadow-2xl border border-[#F2D6DE] relative overflow-hidden flex flex-col my-auto max-h-[90dvh] ${className}`}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between gap-3 p-4 sm:p-6 pb-3 sm:pb-4 border-b border-[#F2D6DE]/60 shrink-0">
              <div className="min-w-0 flex-1 pr-2">
                {title && (
                  <h3
                    id={id ? `${id}-title` : 'modal-title'}
                    className="text-base sm:text-lg font-bold text-[#2C1E23] leading-snug break-words tracking-tight"
                  >
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <div className="text-xs text-[#7D6871] mt-0.5 leading-relaxed break-words">
                    {subtitle}
                  </div>
                )}
              </div>

              {showCloseButton && (
                <button
                  type="button"
                  id={id ? `${id}-close-btn` : 'modal-close-btn'}
                  onClick={onClose}
                  className="text-[#7D6871] hover:text-[#2C1E23] p-1.5 rounded-xl hover:bg-[#FBECEF]/60 transition-colors cursor-pointer shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center -mr-1 -mt-1"
                  aria-label="Cerrar modal"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="p-4 sm:p-6 pt-3 sm:pt-4 border-t border-[#F2D6DE]/60 bg-[#FBECEF]/20 shrink-0 flex flex-col sm:flex-row items-center justify-end gap-2.5">
              {footer}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
