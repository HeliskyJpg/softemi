import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  itemName?: string;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  itemName = 'elementos',
  className = '',
}) => {
  if (totalItems === 0) return null;

  const startItem = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-[#F2D6DE]/60 text-xs text-[#7D6871] ${className}`}
    >
      {/* Item summary */}
      <div className="text-center sm:text-left font-medium">
        Mostrando <strong className="text-[#2C1E23] font-bold">{startItem}</strong> a{' '}
        <strong className="text-[#2C1E23] font-bold">{endItem}</strong> de{' '}
        <strong className="text-[#2C1E23] font-bold">{totalItems}</strong> {itemName}
      </div>

      {/* Navigation Buttons and Page Numbers */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* Previous Button */}
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-[#F2D6DE]/80 bg-white text-[#2C1E23] hover:bg-[#FBECEF] disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Página anterior"
            aria-label="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page Numbers for Desktop/Tablet */}
          <div className="hidden sm:flex items-center gap-1">
            {getPageNumbers().map((page, index) => {
              if (page === '...') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-2 py-1 text-[#7D6871] select-none"
                  >
                    ...
                  </span>
                );
              }

              const pageNum = page as number;
              const isActive = pageNum === currentPage;

              return (
                <button
                  key={`page-${pageNum}`}
                  onClick={() => onPageChange(pageNum)}
                  className={`min-w-7 h-7 px-2 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#681B2B] text-white shadow-2xs font-bold'
                      : 'border border-[#F2D6DE]/60 bg-white text-[#2C1E23] hover:bg-[#FBECEF]'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Mobile Current Page Indicator */}
          <span className="sm:hidden px-2 text-xs font-semibold text-[#2C1E23]">
            {currentPage} / {totalPages}
          </span>

          {/* Next Button */}
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-[#F2D6DE]/80 bg-white text-[#2C1E23] hover:bg-[#FBECEF] disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Página siguiente"
            aria-label="Página siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
