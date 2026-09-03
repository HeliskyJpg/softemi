import React from 'react';

export interface MoneyFormatOptions {
  currency?: string;
  decimals?: number;
  showCurrency?: boolean;
}

/**
 * Format a numeric amount into a standardized currency string (default: Quetzales Q).
 * Example: formatMoney(1250) => "Q 1,250.00"
 */
export function formatMoney(
  amount: number | null | undefined,
  options: MoneyFormatOptions = {}
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return options.showCurrency !== false ? `${options.currency || 'Q'} 0.00` : '0.00';
  }

  const { currency = 'Q', decimals = 2, showCurrency = true } = options;

  const formattedNum = Number(amount).toLocaleString('es-GT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return showCurrency ? `${currency} ${formattedNum}` : formattedNum;
}

export interface MoneyFormatterProps {
  value: number | null | undefined;
  currency?: string;
  decimals?: number;
  showCurrency?: boolean;
  colorScheme?: 'neutral' | 'positive' | 'negative' | 'auto';
  className?: string;
  id?: string;
}

/**
 * Standardized EMILA MoneyFormatter component.
 * Renders consistent currency typography throughout tables, cards, and summaries.
 */
export const MoneyFormatter: React.FC<MoneyFormatterProps> = ({
  value = 0,
  currency = 'Q',
  decimals = 2,
  showCurrency = true,
  colorScheme = 'neutral',
  className = '',
  id,
}) => {
  const num = Number(value || 0);
  const formatted = formatMoney(num, { currency, decimals, showCurrency });

  let colorClass = 'text-[#2C1E23]';
  if (colorScheme === 'positive') {
    colorClass = 'text-emerald-700';
  } else if (colorScheme === 'negative') {
    colorClass = 'text-rose-600';
  } else if (colorScheme === 'auto') {
    if (num > 0) colorClass = 'text-[#2C1E23]';
    else if (num < 0) colorClass = 'text-rose-600';
    else colorClass = 'text-[#7D6871]';
  }

  return (
    <span
      id={id}
      className={`font-semibold tabular-nums tracking-tight ${colorClass} ${className}`}
    >
      {formatted}
    </span>
  );
};
