'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationControlProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange?: (newSize: number) => void;
  pageSizeOptions?: number[];
  itemName?: string;
  className?: string;
}

export default function PaginationControl({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  itemName = 'data',
  className = '',
}: PaginationControlProps) {
  const effectivePageSize = pageSize <= 0 ? (totalItems > 0 ? totalItems : 10) : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (validPage - 1) * effectivePageSize + 1;
  const endItem = Math.min(validPage * effectivePageSize, totalItems);

  // Generate page numbers to display with smart ellipsis
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (validPage > 3) pages.push('ellipsis');

      const start = Math.max(2, validPage - 1);
      const end = Math.min(totalPages - 1, validPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (validPage < totalPages - 2) pages.push('ellipsis');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-slate-100 text-xs text-slate-600 ${className}`}
    >
      {/* Information text & Page Size Picker */}
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <p className="text-slate-500">
          Menampilkan <strong className="text-slate-800 font-semibold">{startItem}</strong> -{' '}
          <strong className="text-slate-800 font-semibold">{endItem}</strong> dari{' '}
          <strong className="text-slate-800 font-semibold">{totalItems}</strong> {itemName}
        </p>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Tampilkan:</span>
            <select
              value={pageSize >= 9999 ? 'all' : pageSize}
              onChange={(e) => {
                const val = e.target.value === 'all' ? 9999 : Number(e.target.value);
                onPageSizeChange(val);
                onPageChange(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / hal
                </option>
              ))}
              <option value="all">Semua</option>
            </select>
          </div>
        )}
      </div>

      {/* Pagination Buttons */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1 select-none">
          {/* First Page */}
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={validPage <= 1}
            title="Halaman Pertama"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>

          {/* Prev Page */}
          <button
            type="button"
            onClick={() => onPageChange(validPage - 1)}
            disabled={validPage <= 1}
            title="Halaman Sebelumnya"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1 mx-1">
            {pages.map((p, idx) =>
              p === 'ellipsis' ? (
                <span key={`ellipsis-${idx}`} className="px-1 text-slate-400">
                  ...
                </span>
              ) : (
                <button
                  key={`page-${p}`}
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-semibold transition ${
                    p === validPage
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              )
            )}
          </div>

          {/* Next Page */}
          <button
            type="button"
            onClick={() => onPageChange(validPage + 1)}
            disabled={validPage >= totalPages}
            title="Halaman Berikutnya"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Last Page */}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={validPage >= totalPages}
            title="Halaman Terakhir"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
