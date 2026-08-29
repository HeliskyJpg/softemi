import React, { useState, useEffect, useRef } from 'react';

export interface QuantityInputProps {
  id?: string;
  value: number;
  onChange: (newQuantity: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
  error?: string | null;
  onErrorChange?: (error: string | null) => void;
  placeholder?: string;
  showErrorText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'center' | 'right';
  unit?: string;
  ariaLabel?: string;
}

/**
 * Reusable QuantityInput component:
 * - Removes native spin buttons/arrows on all platforms (desktop & mobile).
 * - Enforces positive integers (blocks negative, decimals, letters, special characters).
 * - Opens standard numeric keyboard on mobile devices (inputMode="numeric").
 * - Allows field to be temporarily empty while the user edits (e.g. deleting "2" to type "3").
 * - Validates on blur / submit ("Ingrese una cantidad mayor a 0.").
 */
export const QuantityInput: React.FC<QuantityInputProps> = ({
  id,
  value,
  onChange,
  max,
  disabled = false,
  className = '',
  error: externalError,
  onErrorChange,
  placeholder = '1',
  showErrorText = false,
  size = 'md',
  align = 'center',
  unit,
  ariaLabel,
}) => {
  // Store raw text for uninterrupted typing/clearing
  const [textValue, setTextValue] = useState<string>(
    value === 0 ? '' : String(value ?? '')
  );
  const [internalError, setInternalError] = useState<string | null>(null);
  const isFocusedRef = useRef(false);

  // Sync with value prop only when the input is not currently focused by the user
  useEffect(() => {
    if (!isFocusedRef.current) {
      setTextValue(value === 0 ? '' : String(value ?? ''));
    }
  }, [value]);

  const updateError = (msg: string | null) => {
    setInternalError(msg);
    if (onErrorChange) {
      onErrorChange(msg);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Block negative signs, decimals, symbols, scientific notation
    if (['-', '+', '.', ',', 'e', 'E'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Strip any non-digit character (e.g. copy/paste protection)
    const sanitized = raw.replace(/[^0-9]/g, '');
    setTextValue(sanitized);

    if (sanitized === '') {
      // Allow temporary empty string without forcing 1!
      onChange(0);
      if (internalError) {
        updateError(null);
      }
      return;
    }

    const parsed = parseInt(sanitized, 10);
    if (isNaN(parsed)) {
      onChange(0);
      return;
    }

    // Check stock warning if exceeding max
    if (max !== undefined && parsed > max) {
      updateError(`Máximo disponible: ${max}${unit ? ` ${unit}` : ''}`);
    } else {
      updateError(null);
    }

    onChange(parsed);
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    const trimmed = textValue.trim();

    if (trimmed === '' || parseInt(trimmed, 10) <= 0) {
      const errorMsg = 'Ingrese una cantidad mayor a 0.';
      updateError(errorMsg);
      onChange(0);
    } else {
      const parsed = parseInt(trimmed, 10);
      if (max !== undefined && parsed > max) {
        const errorMsg = `Disponibilidad máxima: ${max}${unit ? ` ${unit}` : ''}`;
        updateError(errorMsg);
        onChange(parsed);
      } else {
        updateError(null);
        onChange(parsed);
        // Normalize leading zeros, e.g. "05" -> "5"
        setTextValue(String(parsed));
      }
    }
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
  };

  const activeError = externalError || internalError;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-xs sm:text-sm',
    lg: 'px-3.5 py-2.5 text-sm sm:text-base',
  }[size];

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align];

  return (
    <div className="flex flex-col relative w-full">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        aria-label={ariaLabel || 'Cantidad'}
        disabled={disabled}
        placeholder={placeholder}
        value={textValue}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`rounded-xl border font-bold text-[#2C1E23] bg-white outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${sizeClasses} ${alignClasses} ${
          activeError
            ? 'border-red-400 ring-2 ring-red-100 text-red-900 bg-red-50/30'
            : 'border-[#F2D6DE] focus:border-[#681B2B] focus:ring-2 focus:ring-[#681B2B]/15'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''} ${className}`}
      />
      {showErrorText && activeError && (
        <span className="text-[11px] text-red-600 font-semibold mt-1 block leading-tight">
          {activeError}
        </span>
      )}
    </div>
  );
};
