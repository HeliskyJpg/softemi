import React from 'react';

interface EmilaLogoProps {
  className?: string;
  size?: number | string;
  showSubtitle?: boolean;
  variant?: 'circle' | 'transparent' | 'icon-only';
}

/**
 * Official EMILA Floristería Logo Component
 * Faithfully vectorizes the official pink circular badge with stylized EMILA typography & FLORISTERÍA subtitle.
 */
export const EmilaLogo: React.FC<EmilaLogoProps> = ({
  className = '',
  size = 48,
  showSubtitle = true,
  variant = 'circle',
}) => {
  const dimension = typeof size === 'number' ? `${size}px` : size;

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: dimension, height: dimension }}
      title="EMILA Floristería"
    >
      <svg
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs"
      >
        {/* Pink circular background if variant is 'circle' */}
        {variant === 'circle' && (
          <circle cx="250" cy="250" r="236" fill="#F7A4D0" />
        )}

        {/* EMILA Stylized Wordmark */}
        <g fill={variant === 'circle' ? '#FFFFFF' : '#681B2B'}>
          {/* E - Ribbon wave glyph */}
          <path
            d="M 148 184 
               C 122 184, 98 194, 98 214 
               C 98 228, 114 238, 140 242 
               C 152 244, 156 248, 156 254 
               C 156 262, 144 268, 126 268 
               C 112 268, 102 262, 98 256
               L 96 268 
               C 104 278, 120 286, 142 286 
               C 168 286, 178 270, 178 254 
               C 178 238, 160 230, 134 226 
               C 120 224, 118 220, 118 214 
               C 118 206, 128 200, 144 200 
               C 156 200, 166 204, 172 210
               L 174 196 
               C 166 188, 156 184, 148 184 Z"
            fillRule="evenodd"
          />
          {/* Lower flourish wave of E */}
          <path
            d="M 96 236 
               C 112 240, 136 244, 148 248 
               C 160 252, 164 258, 164 264 
               C 164 274, 150 284, 132 284 
               C 114 284, 98 274, 96 258 
               L 96 236 Z"
            opacity="0.95"
          />

          {/* M - Calligraphic flared arches */}
          <path
            d="M 194 186 
               C 186 186, 178 192, 174 200 
               L 164 270 
               L 182 270 
               L 188 222 
               C 192 208, 202 198, 214 198 
               C 226 198, 234 208, 236 224 
               L 242 270 
               L 260 270 
               L 254 222 
               C 252 206, 260 198, 272 198 
               C 284 198, 292 208, 294 224 
               L 300 270 
               L 316 270 
               L 310 216 
               C 306 196, 292 186, 274 186 
               C 260 186, 250 194, 244 206 
               C 238 194, 226 186, 212 186 
               C 204 186, 198 188, 194 186 Z"
          />

          {/* I - Bold vertical stem */}
          <path
            d="M 326 186 
               L 344 186 
               L 344 270 
               L 326 270 Z"
          />

          {/* L - High contrast upright with foot */}
          <path
            d="M 356 186 
               L 374 186 
               L 374 254 
               L 416 254 
               C 420 254, 424 258, 426 268 
               L 356 268 Z"
          />

          {/* A - Flared architectural typography with crossbar */}
          <path
            d="M 462 186 
               L 436 270 
               L 454 270 
               L 460 248 
               L 480 248 
               L 486 270 
               L 504 270 
               L 478 186 
               L 462 186 Z 
               M 470 214 
               L 476 236 
               L 464 236 
               L 470 214 Z"
            transform="translate(-40, 0)"
          />
        </g>

        {/* FLORISTERÍA Subtitle */}
        {showSubtitle && (
          <text
            x="250"
            y="312"
            textAnchor="middle"
            fill={variant === 'circle' ? '#FFFFFF' : '#681B2B'}
            fontFamily="'Montserrat', 'Century Gothic', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontSize="30"
            fontWeight="500"
            letterSpacing="18"
            opacity="0.98"
          >
            FLORISTERÍA
          </text>
        )}
      </svg>
    </div>
  );
};
