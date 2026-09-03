import React from 'react';
import { Calendar, Clock } from 'lucide-react';

export type DateFormatStyle =
  | 'short' // 14/10/2025
  | 'medium' // 14 oct 2025
  | 'full' // 14 de octubre de 2025
  | 'weekday' // Lunes, 14 de oct
  | 'relative'; // Hoy, Mañana, Ayer

export interface DateFormatOptions {
  format?: DateFormatStyle;
  showTime?: boolean;
  time?: string;
  relativeBadge?: boolean;
}

const SPANISH_MONTHS_SHORT = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
];

const SPANISH_MONTHS_FULL = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const SPANISH_WEEKDAYS = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

/**
 * Format date string (YYYY-MM-DD or ISO) into formatted Spanish date.
 */
export function formatDate(
  dateInput: string | Date | null | undefined,
  options: DateFormatOptions = {}
): string {
  if (!dateInput) return '--';

  let dateObj: Date;
  if (typeof dateInput === 'string') {
    // Handle YYYY-MM-DD safely without timezone shifts
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      const [year, month, day] = dateInput.split('-').map(Number);
      dateObj = new Date(year, month - 1, day);
    } else {
      dateObj = new Date(dateInput);
    }
  } else {
    dateObj = dateInput;
  }

  if (isNaN(dateObj.getTime())) return String(dateInput);

  const day = dateObj.getDate();
  const monthIdx = dateObj.getMonth();
  const year = dateObj.getFullYear();
  const weekday = SPANISH_WEEKDAYS[dateObj.getDay()];

  const { format = 'medium', showTime = false, time } = options;

  let formattedDate = '';
  switch (format) {
    case 'short':
      formattedDate = `${String(day).padStart(2, '0')}/${String(monthIdx + 1).padStart(2, '0')}/${year}`;
      break;
    case 'full':
      formattedDate = `${day} de ${SPANISH_MONTHS_FULL[monthIdx]} de ${year}`;
      break;
    case 'weekday':
      formattedDate = `${weekday}, ${day} de ${SPANISH_MONTHS_SHORT[monthIdx]}`;
      break;
    case 'relative': {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      const targetStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      if (targetStr === todayStr) return 'Hoy';
      if (targetStr === tomorrowStr) return 'Mañana';
      if (targetStr === yesterdayStr) return 'Ayer';
      formattedDate = `${day} de ${SPANISH_MONTHS_SHORT[monthIdx]}`;
      break;
    }
    case 'medium':
    default:
      formattedDate = `${day} de ${SPANISH_MONTHS_SHORT[monthIdx]}, ${year}`;
      break;
  }

  if (showTime && time) {
    formattedDate += ` ${time}`;
  }

  return formattedDate;
}

export interface DateFormatterProps {
  date: string | Date | null | undefined;
  time?: string;
  format?: DateFormatStyle;
  showIcon?: boolean;
  showRelativeBadge?: boolean;
  className?: string;
  id?: string;
}

/**
 * Standardized EMILA DateFormatter component.
 * Renders uniform date layouts with optional time or relative badges.
 */
export const DateFormatter: React.FC<DateFormatterProps> = ({
  date,
  time,
  format = 'medium',
  showIcon = false,
  showRelativeBadge = false,
  className = '',
  id,
}) => {
  if (!date) return <span className={`text-[#7D6871] ${className}`}>--</span>;

  const dateText = formatDate(date, { format: format as DateFormatStyle });

  // Determine if today or tomorrow for badge
  let relativeBadgeText: string | null = null;
  let relativeBadgeColor = '';

  if (showRelativeBadge && typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

    if (date === todayStr) {
      relativeBadgeText = 'Hoy';
      relativeBadgeColor = 'bg-[#DBEAFE] text-[#2563EB] border-[#BFDBFE]';
    } else if (date === tomorrowStr) {
      relativeBadgeText = 'Mañana';
      relativeBadgeColor = 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]';
    } else if (date < todayStr) {
      relativeBadgeText = 'Vencido';
      relativeBadgeColor = 'bg-rose-100 text-rose-700 border-rose-200';
    }
  }

  return (
    <span id={id} className={`inline-flex items-center gap-1.5 font-medium ${className}`}>
      {showIcon && <Calendar className="w-3.5 h-3.5 text-[#7D6871] shrink-0" />}
      <span className="tabular-nums">{dateText}</span>

      {time && (
        <span className="inline-flex items-center gap-1 text-[#7D6871] text-[11px] ml-0.5">
          <Clock className="w-3 h-3 text-[#7D6871] shrink-0" />
          <span>{time}</span>
        </span>
      )}

      {relativeBadgeText && (
        <span
          className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${relativeBadgeColor} leading-tight`}
        >
          {relativeBadgeText}
        </span>
      )}
    </span>
  );
};
