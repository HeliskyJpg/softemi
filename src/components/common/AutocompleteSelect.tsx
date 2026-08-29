import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { FormFieldError } from './FormFieldError';

export interface AutocompleteOption {
  value: string;
  label: string;
  description?: string;
  group?: string;
}

export interface AutocompleteSelectProps {
  id?: string;
  label?: string;
  options: Array<AutocompleteOption | string>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  helperText?: string;
  searchable?: boolean;
  className?: string;
  allowClear?: boolean;
}

export const AutocompleteSelect: React.FC<AutocompleteSelectProps> = ({
  id,
  label,
  options,
  value,
  onChange,
  placeholder = 'Seleccionar una opción...',
  required = false,
  disabled = false,
  error = false,
  errorMessage,
  helperText,
  searchable = true,
  className = '',
  allowClear = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  // Normalize options to AutocompleteOption format
  const normalizedOptions = useMemo<AutocompleteOption[]>(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  // Selected item object
  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => opt.value === value) || null;
  }, [normalizedOptions, value]);

  // Filtered options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) {
      return normalizedOptions;
    }
    const term = searchTerm.toLowerCase().trim();
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(term) ||
        (opt.description && opt.description.toLowerCase().includes(term)) ||
        (opt.group && opt.group.toLowerCase().includes(term))
    );
  }, [normalizedOptions, searchTerm]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sync scroll to highlighted option
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listboxRef.current) {
      const items = listboxRef.current.querySelectorAll('li');
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      setIsOpen(true);
      setSearchTerm('');
      // Set highlight to current selected index if found
      const idx = filteredOptions.findIndex((opt) => opt.value === value);
      setHighlightedIndex(idx >= 0 ? idx : 0);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
        const idx = filteredOptions.findIndex((opt) => opt.value === value);
        setHighlightedIndex(idx >= 0 ? idx : 0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[highlightedIndex].value);
        } else if (filteredOptions.length === 1) {
          handleSelect(filteredOptions[0].value);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        break;
      case 'Tab':
        setIsOpen(false);
        setSearchTerm('');
        break;
    }
  };

  const hasError = error || !!errorMessage;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-bold text-[#2C1E23] mb-1 tracking-tight"
        >
          {label} {required && <span className="text-red-500 font-normal">*</span>}
        </label>
      )}

      {/* Control Box */}
      <div
        id={id ? `${id}-container` : undefined}
        onClick={handleToggle}
        className={`relative flex items-center justify-between w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border bg-white cursor-pointer transition-all duration-150 select-none ${
          disabled
            ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
            : hasError
            ? 'border-red-400 ring-2 ring-red-100 focus-within:border-red-500'
            : isOpen
            ? 'border-[#681B2B] ring-2 ring-[#681B2B]/15 shadow-xs'
            : 'border-[#F2D6DE] hover:border-[#D9A3B5]'
        }`}
      >
        <div className="flex-1 truncate pr-2 flex items-center gap-2">
          {isOpen && searchable ? (
            <div className="flex items-center gap-1.5 w-full">
              <Search className="w-3.5 h-3.5 text-[#7D6871] shrink-0" />
              <input
                ref={inputRef}
                id={id}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                placeholder={selectedOption ? selectedOption.label : placeholder}
                className="w-full bg-transparent border-none outline-none p-0 text-xs sm:text-sm text-[#2C1E23] placeholder-[#7D6871]/60 font-medium"
              />
            </div>
          ) : (
            <span
              className={`block truncate font-medium ${
                selectedOption ? 'text-[#2C1E23]' : 'text-[#7D6871]/70'
              }`}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-[#7D6871]">
          {allowClear && selectedOption && !disabled && !isOpen && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-0.5 hover:text-[#2C1E23] rounded-md hover:bg-gray-100 transition-colors"
              title="Borrar selección"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? 'transform rotate-180 text-[#681B2B]' : ''
            }`}
          />
        </div>
      </div>

      {/* Floating Dropdown Listbox */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-xl border border-[#F2D6DE] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-60 flex flex-col">
          <ul
            ref={listboxRef}
            role="listbox"
            tabIndex={-1}
            className="overflow-y-auto py-1 max-h-56 divide-y divide-gray-50 focus:outline-none"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3.5 py-3 text-xs text-[#7D6871] text-center italic">
                No se encontraron opciones para "{searchTerm}"
              </li>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = option.value === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={`opt-${option.value}-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(option.value);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-3.5 py-2.5 text-xs sm:text-sm cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#FBECEF] text-[#681B2B] font-bold'
                        : isHighlighted
                        ? 'bg-[#FBECEF]/40 text-[#2C1E23]'
                        : 'text-[#2C1E23] hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="truncate">{option.label}</span>
                      {option.description && (
                        <span className="text-[11px] text-[#7D6871] font-normal truncate mt-0.5">
                          {option.description}
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-[#681B2B] shrink-0" />
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {/* Error or Helper Message */}
      {hasError ? (
        <FormFieldError id={id ? `error-${id}` : undefined} error={errorMessage || 'Campo requerido'} />
      ) : helperText ? (
        <p className="text-[11px] text-[#7D6871] mt-1">{helperText}</p>
      ) : null}
    </div>
  );
};
