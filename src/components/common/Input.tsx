import React from 'react';
import { InputSize, tokens } from '../../tokens';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  inputSize?: InputSize;
  hasError?: boolean;
  prefixElement?: React.ReactNode;
  suffixElement?: React.ReactNode;
}

/**
 * Standardized EMILA Input Component.
 * Enforces uniform heights (42px default / 34px compact), typography, padding,
 * and responsive 100% width on mobile without overflow.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      inputSize = 'md',
      hasError = false,
      prefixElement,
      suffixElement,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeConfig = tokens.inputs[inputSize] || tokens.inputs.md;

    return (
      <div className="relative w-full min-w-0">
        {prefixElement && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7D6871] z-10">
            {prefixElement}
          </div>
        )}
        <input
          ref={ref}
          disabled={disabled}
          className={`w-full ${sizeConfig.height} ${sizeConfig.text} ${sizeConfig.padding} ${sizeConfig.radius} border transition-all outline-none font-medium text-[#2C1E23] placeholder-[#7D6871]/50 ${
            prefixElement ? 'pl-8 sm:pl-9' : ''
          } ${suffixElement ? 'pr-8 sm:pr-9' : ''} ${
            hasError
              ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-200'
              : 'border-[#F2D6DE] bg-white focus:border-[#681B2B] focus:ring-2 focus:ring-[#681B2B]/15'
          } ${
            disabled ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed' : ''
          } ${className}`}
          {...props}
        />
        {suffixElement && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center z-10">
            {suffixElement}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
