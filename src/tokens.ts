/**
 * EMILA Design System Tokens
 * 
 * Global variables, dimensions, colors, and layout rules.
 * Designed to be 100% portable to Flask + Jinja templates and global CSS.
 */

export const tokens = {
  // Brand & Semantic Colors
  colors: {
    primary: {
      DEFAULT: '#681B2B',
      hover: '#541421',
      active: '#3F0E18',
      light: '#FBECEF',
      border: '#F2D6DE',
      borderMedium: '#E8C4CE',
    },
    neutral: {
      bgMain: '#FBECEF',
      surface: '#FFFFFF',
      surfaceAlt: '#FDF8F9',
      textMain: '#2C1E23',
      textMuted: '#7D6871',
      textSubtle: '#9E8691',
      borderSoft: '#F2D6DE',
      borderMedium: '#E8C4CE',
      borderStrong: '#D5A7B4',
    },
    semantic: {
      success: {
        text: '#059669',
        textDark: '#065F46',
        bg: '#DCFCE7',
        bgSubtle: '#F0FDF4',
        border: '#A7F3D0',
      },
      warning: {
        text: '#D97706',
        textDark: '#92400E',
        bg: '#FEF3C7',
        bgSubtle: '#FFFBEB',
        border: '#FDE68A',
      },
      danger: {
        text: '#DC2626',
        textDark: '#991B1B',
        bg: '#FEE2E2',
        bgSubtle: '#FEF2F2',
        border: '#FECDD3',
      },
      info: {
        text: '#2563EB',
        textDark: '#1E40AF',
        bg: '#DBEAFE',
        bgSubtle: '#EFF6FF',
        border: '#BFDBFE',
      },
    },
  },

  // Consistent Spacings
  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem', // 8px
    md: '0.75rem', // 12px
    lg: '1rem', // 16px
    xl: '1.5rem', // 24px
    '2xl': '2rem', // 32px
    '3xl': '3rem', // 48px
  },

  // Border Radius hierarchy (capped to prevent competing curves)
  borderRadius: {
    xs: '0.25rem', // 4px
    sm: '0.375rem', // 6px
    md: '0.5rem', // 8px
    lg: '0.75rem', // 12px
    xl: '1rem', // 16px
    '2xl': '1.25rem', // 20px
    full: '9999px',
  },

  // Input heights, padding, and text sizing (Strict Uniformity)
  inputs: {
    sm: {
      height: '34px',
      text: 'text-xs',
      padding: 'px-2.5 py-1.5',
      radius: 'rounded-lg',
    },
    md: {
      height: '42px',
      text: 'text-sm',
      padding: 'px-3.5 py-2.5',
      radius: 'rounded-xl',
    },
    lg: {
      height: '48px',
      text: 'text-base',
      padding: 'px-4 py-3',
      radius: 'rounded-xl',
    },
  },

  // Maximum Form Container Widths (Preventing overly stretched fields on desktop)
  formMaxWidths: {
    xs: 'max-w-xs', // 320px - small inline inputs / codes
    sm: 'max-w-sm', // 384px - compact filters / prompt modal
    md: 'max-w-md', // 448px - standard entity creation modals
    lg: 'max-w-2xl', // 672px - medium forms / order sections
    xl: 'max-w-4xl', // 896px - multi-column detailed form
    full: 'max-w-5xl', // 1024px - main application page layout
  },

  // Responsive Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },

  // Typography definitions
  typography: {
    fontSans: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    weights: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    scale: {
      caption: 'text-[11px] leading-tight',
      bodySmall: 'text-xs leading-normal',
      body: 'text-sm leading-relaxed',
      subheading: 'text-base font-semibold leading-snug',
      heading: 'text-lg font-bold leading-tight',
      title: 'text-xl sm:text-2xl font-bold leading-tight',
    },
  },
} as const;

export type InputSize = keyof typeof tokens.inputs;
export type FormMaxWidth = keyof typeof tokens.formMaxWidths;
