import React from 'react';

export interface FormRowProps {
  id?: string;
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  type?: 'default' | 'datetime' | 'price-stock' | 'compact';
  className?: string;
}

/**
 * Reusable FormRow Layout Component for EMILA Floristería.
 * 
 * Enforces:
 * - Mobile: Single column (100% width, no horizontal overflow).
 * - Desktop: Multi-column distribution for related/short fields.
 * - Uniform heights, labels, and error spacing.
 * - Ready for 1:1 translation to `{% macro form_row(...) %}` in Flask / Jinja.
 */
export const FormRow: React.FC<FormRowProps> = ({
  id,
  children,
  columns = 2,
  type = 'default',
  className = '',
}) => {
  let layoutClass = 'emila-form-row-2';

  if (type === 'datetime') {
    layoutClass = 'emila-form-row-datetime';
  } else if (type === 'price-stock') {
    layoutClass = 'emila-form-row-price-stock';
  } else if (columns === 3) {
    layoutClass = 'emila-form-row-3';
  } else if (columns === 1) {
    layoutClass = 'grid grid-cols-1 gap-4 w-full min-w-0';
  }

  return (
    <div id={id} className={`${layoutClass} ${className}`}>
      {children}
    </div>
  );
};
