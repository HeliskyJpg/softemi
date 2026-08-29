import React from 'react';
import { AlertCircle } from 'lucide-react';

export interface FormFieldErrorProps {
  id?: string;
  error?: string | null;
  className?: string;
}

export const FormFieldError: React.FC<FormFieldErrorProps> = ({
  id,
  error,
  className = '',
}) => {
  if (!error) return null;

  return (
    <p
      id={id}
      role="alert"
      className={`text-xs font-semibold text-rose-600 mt-1.5 flex items-center gap-1.5 leading-tight animate-in fade-in duration-150 ${className}`}
    >
      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
      <span>{error}</span>
    </p>
  );
};
