'use client';

import { exportKasToExcel, exportKasToPDF, PeriodeInfo, TransaksiItem } from '@/lib/utils/exportKas';
import { FileSpreadsheet, FileText } from 'lucide-react';

interface Props {
  transaksiList: TransaksiItem[];
  periode: PeriodeInfo;
  namaRt: string;
}

export default function ExportKasButtons({ transaksiList, periode, namaRt }: Props) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => exportKasToExcel(transaksiList, periode, namaRt)}
        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold transition"
      >
        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
        Unduh Excel
      </button>

      <button
        onClick={() => exportKasToPDF(transaksiList, periode, namaRt)}
        className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold transition"
      >
        <FileText className="w-4 h-4 text-red-600" />
        Cetak PDF
      </button>
    </div>
  );
}
