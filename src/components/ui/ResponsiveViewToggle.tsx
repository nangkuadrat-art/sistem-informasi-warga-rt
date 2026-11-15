'use client';

import React from 'react';
import { Monitor, Smartphone, LayoutGrid, Table as TableIcon } from 'lucide-react';

export type ResponsiveViewMode = 'auto' | 'cards' | 'table';

interface Props {
  mode: ResponsiveViewMode;
  onChange: (mode: ResponsiveViewMode) => void;
}

/**
 * Toggle mode tampilan fleksibel (Otomatis Responsif / Kartu Simpel / Tabel Lengkap).
 * Default 'auto' otomatis memakai Kartu pada layar Smartphone (<768px) dan Tabel pada PC Desktop (>=768px).
 */
export default function ResponsiveViewToggle({ mode, onChange }: Props) {
  return (
    <div
      className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shrink-0"
      role="group"
      aria-label="Pilih mode tampilan data"
    >
      <button
        type="button"
        onClick={() => onChange('auto')}
        title="Otomatis: Kartu di HP & Tabel di PC"
        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition ${
          mode === 'auto'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Monitor className="w-3.5 h-3.5 hidden sm:inline text-blue-600" />
        <Smartphone className="w-3.5 h-3.5 sm:hidden text-blue-600" />
        <span>Auto</span>
      </button>

      <button
        type="button"
        onClick={() => onChange('cards')}
        title="Mode Kartu Simpel (Nyaman di Smartphone)"
        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition ${
          mode === 'cards'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        <span>Kartu</span>
      </button>

      <button
        type="button"
        onClick={() => onChange('table')}
        title="Mode Tabel Penuh (Nyaman di PC Desktop)"
        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition ${
          mode === 'table'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <TableIcon className="w-3.5 h-3.5" />
        <span>Tabel</span>
      </button>
    </div>
  );
}
