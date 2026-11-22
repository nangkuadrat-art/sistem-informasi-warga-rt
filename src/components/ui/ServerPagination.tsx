import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface ServerPaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  baseUrl: string;
  queryParams: Record<string, string | undefined>;
  itemName?: string;
  pageSizeOptions?: number[];
  className?: string;
}

export default function ServerPagination({
  currentPage,
  totalItems,
  pageSize,
  baseUrl,
  queryParams,
  itemName = 'data',
  pageSizeOptions = [10, 20, 50],
  className = '',
}: ServerPaginationProps) {
  const effectivePageSize = pageSize <= 0 ? (totalItems > 0 ? totalItems : 10) : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (validPage - 1) * effectivePageSize + 1;
  const endItem = Math.min(validPage * effectivePageSize, totalItems);

  const buildUrl = (targetPage: number, targetSize?: number) => {
    const params = new URLSearchParams();
    Object.entries(queryParams).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && k !== 'page' && k !== 'limit') {
        params.set(k, v);
      }
    });

    if (targetPage > 1) {
      params.set('page', String(targetPage));
    }
    const size = targetSize !== undefined ? targetSize : pageSize;
    if (size !== 10) {
      params.set('limit', String(size));
    }

    const qs = params.toString();
    return qs ? `${baseUrl}?${qs}` : baseUrl;
  };

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
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border border-slate-200/80 rounded-2xl shadow-xs text-xs text-slate-600 ${className}`}
    >
      {/* Information text & Page Size options */}
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <p className="text-slate-500">
          Menampilkan <strong className="text-slate-800 font-semibold">{startItem}</strong> -{' '}
          <strong className="text-slate-800 font-semibold">{endItem}</strong> dari{' '}
          <strong className="text-slate-800 font-semibold">{totalItems}</strong> {itemName}
        </p>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400">Limit:</span>
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            {pageSizeOptions.map((opt) => (
              <Link
                key={opt}
                href={buildUrl(1, opt)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  pageSize === opt
                    ? 'bg-white text-blue-600 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt}
              </Link>
            ))}
            <Link
              href={buildUrl(1, 9999)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                pageSize >= 9999
                  ? 'bg-white text-blue-600 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua
            </Link>
          </div>
        </div>
      </div>

      {/* Pagination Links */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1 select-none">
          {/* First Page */}
          {validPage > 1 ? (
            <Link
              href={buildUrl(1)}
              title="Halaman Pertama"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <span className="p-1.5 rounded-lg border border-slate-200 text-slate-300 cursor-not-allowed">
              <ChevronsLeft className="w-3.5 h-3.5" />
            </span>
          )}

          {/* Prev Page */}
          {validPage > 1 ? (
            <Link
              href={buildUrl(validPage - 1)}
              title="Halaman Sebelumnya"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <span className="p-1.5 rounded-lg border border-slate-200 text-slate-300 cursor-not-allowed">
              <ChevronLeft className="w-3.5 h-3.5" />
            </span>
          )}

          {/* Page Numbers */}
          <div className="flex items-center gap-1 mx-1">
            {pages.map((p, idx) =>
              p === 'ellipsis' ? (
                <span key={`ellipsis-${idx}`} className="px-1 text-slate-400">
                  ...
                </span>
              ) : p === validPage ? (
                <span
                  key={`page-${p}`}
                  className="min-w-[28px] h-7 px-2 rounded-lg text-xs font-bold bg-blue-600 text-white flex items-center justify-center shadow-xs"
                >
                  {p}
                </span>
              ) : (
                <Link
                  key={`page-${p}`}
                  href={buildUrl(p)}
                  className="min-w-[28px] h-7 px-2 rounded-lg text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center transition"
                >
                  {p}
                </Link>
              )
            )}
          </div>

          {/* Next Page */}
          {validPage < totalPages ? (
            <Link
              href={buildUrl(validPage + 1)}
              title="Halaman Berikutnya"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <span className="p-1.5 rounded-lg border border-slate-200 text-slate-300 cursor-not-allowed">
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          )}

          {/* Last Page */}
          {validPage < totalPages ? (
            <Link
              href={buildUrl(totalPages)}
              title="Halaman Terakhir"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <span className="p-1.5 rounded-lg border border-slate-200 text-slate-300 cursor-not-allowed">
              <ChevronsRight className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
