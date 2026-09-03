import React from 'react';
import { ConfirmModal, ConfirmModalProps } from './ConfirmModal';

export type ConfirmDialogProps = ConfirmModalProps;

/**
 * ConfirmDialog component for EMILA.
 * Alias and standardized wrapper for confirmation popups.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = (props) => {
  return <ConfirmModal {...props} />;
};

export { ConfirmModal };
