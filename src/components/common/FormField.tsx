import React from 'react';
import { FormFieldError } from './FormFieldError';
import { FieldMaxWidth, FormMaxWidth, tokens } from '../../tokens';

export type FormFieldWidth = FormMaxWidth | FieldMaxWidth | 'none';

export interface FormFieldProps {
  id?: string;
  label?: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  error?: string | null;
  helperText?: string;
  action?: React.ReactNode;
  counter?: {
    current: number;
    max: number;
  };
  maxWidth?: FormFieldWidth;
  className?: string;
  children: React.ReactNode;
}

/**
 * Standardized EMILA FormField wrapper.
 * Unifies labels, required markers, error messages, and width constraints
 * to avoid excessively stretched inputs on desktop.
 * Ready for translation to `{% macro form_field(...) %}` in Flask / Jinja.
 */
export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  required = false,
  optional = false,
  error,
  helperText,
  action,
  counter,
  maxWidth = 'none',
  className = '',
  children,
}) => {
  let maxWidthClass = 'w-full';

  if (maxWidth !== 'none') {
    if (maxWidth in tokens.fieldMaxWidths) {
      maxWidthClass = tokens.fieldMaxWidths[maxWidth as FieldMaxWidth];
    } else if (maxWidth in tokens.formMaxWidths) {
      maxWidthClass = tokens.formMaxWidths[maxWidth as FormMaxWidth];
    }
  }

  return (
    <div className={`space-y-1.5 ${maxWidthClass} ${className}`}>
      {/* Label and Action Header */}
      {(label || action || counter) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <label
              htmlFor={id}
              className="block text-xs font-bold text-[#2C1E23] tracking-tight"
            >
              {label}
              {required && (
                <span className="text-rose-500 ml-1 font-semibold" title="Campo obligatorio">
                  *
                </span>
              )}
              {optional && (
                <span className="text-[11px] font-normal text-[#7D6871] ml-1.5">
                  (opcional)
                </span>
              )}
            </label>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {counter && (
              <span
                className={`text-[11px] font-medium tracking-tight ${
                  counter.current > counter.max
                    ? 'text-rose-600 font-bold'
                    : counter.current >= counter.max * 0.9
                    ? 'text-amber-600'
                    : 'text-[#7D6871]'
                }`}
              >
                {counter.current} / {counter.max}
              </span>
            )}
            {action && <div className="shrink-0">{action}</div>}
          </div>
        </div>
      )}

      {/* Input / Control Slot */}
      <div className="relative">{children}</div>

      {/* Error Message */}
      {error && <FormFieldError id={id ? `error-${id}` : undefined} error={error} />}

      {/* Helper text (only shown when no error is active) */}
      {!error && helperText && (
        <p className="text-[11px] text-[#7D6871] leading-relaxed mt-1">
          {helperText}
        </p>
      )}
    </div>
  );
};
