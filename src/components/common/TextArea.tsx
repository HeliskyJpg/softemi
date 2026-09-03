import React from 'react';
import { FormFieldError } from './FormFieldError';

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  id?: string;
  label?: React.ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  maxLength?: number;
  showCounter?: boolean;
  error?: string | null;
  helperText?: string;
  required?: boolean;
  className?: string;
  rows?: number;
  resize?: 'none' | 'vertical' | 'both';
}

/**
 * Standardized EMILA TextArea with Character Counter.
 * Ensures consistent padding, typography, border states, and live counter.
 * Easily translates to `{% macro textarea(...) %}` in Flask / Jinja.
 */
export const TextArea: React.FC<TextAreaProps> = ({
  id,
  label,
  value,
  onChange,
  maxLength,
  showCounter = true,
  error,
  helperText,
  required = false,
  className = '',
  rows = 3,
  resize = 'none',
  placeholder = 'Escriba aquí...',
  disabled = false,
  ...rest
}) => {
  const currentLength = value ? value.length : 0;
  const isNearLimit = maxLength && currentLength >= maxLength * 0.85;
  const isAtLimit = maxLength && currentLength >= maxLength;

  const resizeClass =
    resize === 'none'
      ? 'resize-none'
      : resize === 'vertical'
      ? 'resize-y'
      : 'resize';

  return (
    <div className="w-full space-y-1.5">
      {/* Label and Counter Header */}
      {(label || (showCounter && maxLength)) && (
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
            </label>
          )}

          {showCounter && maxLength && (
            <span
              id={id ? `${id}-counter` : undefined}
              className={`text-[11px] font-medium tracking-tight ml-auto ${
                isAtLimit
                  ? 'text-rose-600 font-bold'
                  : isNearLimit
                  ? 'text-amber-600 font-semibold'
                  : 'text-[#7D6871]'
              }`}
            >
              {currentLength} / {maxLength}
            </span>
          )}
        </div>
      )}

      {/* Textarea Element */}
      <div className="relative">
        <textarea
          id={id}
          rows={rows}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#2C1E23] bg-white transition-all duration-150 outline-none font-medium leading-relaxed ${resizeClass} ${
            disabled
              ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
              : error
              ? 'border-rose-400 bg-rose-50/20 ring-2 ring-rose-100 focus:border-rose-500'
              : 'border-[#F2D6DE] hover:border-[#D9A3B5] focus:border-[#681B2B] focus:ring-2 focus:ring-[#681B2B]/15'
          } ${className}`}
          {...rest}
        />
      </div>

      {/* Error or Helper */}
      {error && <FormFieldError id={id ? `error-${id}` : undefined} error={error} />}
      {!error && helperText && (
        <p className="text-[11px] text-[#7D6871] leading-relaxed mt-1">
          {helperText}
        </p>
      )}
    </div>
  );
};
