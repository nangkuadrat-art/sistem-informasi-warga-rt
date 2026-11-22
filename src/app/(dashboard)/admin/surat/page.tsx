import { getAllSurat } from '@/lib/data/storeSurat';
import { getDbUnits } from '@/lib/data/store';
import ModalBuatSurat from '@/components/surat/ModalBuatSurat';
import SuratListClient from '@/components/surat/SuratListClient';
import {
  Mail,
  Calendar,
  Hammer,
  FileText,
  AlertTriangle,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminSuratPage() {
  const suratList = getAllSurat();
  const units = getDbUnits();

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Pelayanan Surat Menyurat RT
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-teal-600" />
              Kop Resmi RT.03 / RW.14
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-blue-600" />
              Tritih Lor, Jeruklegi, Cilacap
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Penerbitan surat undangan rapat, kerja bakti, pengantar administrasi warga (bebas NIK/KK), dan surat peringatan tata tertib lingkungan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ModalBuatSurat units={units} defaultJenis="undangan_rapat" />
        </div>
      </div>

      {/* QUICK LAUNCH BANNER 4 JENIS SURAT */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-5 rounded-3xl shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300 px-2 py-0.5 bg-teal-900/60 rounded">
              Penerbitan Surat Cepat
            </span>
            <h3 className="text-lg font-bold text-white">
              Format Baku & Cetak A4 Standar Rukun Tetangga
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Dilengkapi nomor surat otomatis, penandatanganan Ketua RT (Yuli Ardinurman), integrasi cetak A4 bersih, dan generator teks WhatsApp instan untuk dibagikan ke grup warga.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
            <div className="bg-white/10 p-2.5 rounded-2xl border border-white/10 text-center">
              <Calendar className="w-4 h-4 text-blue-400 mx-auto mb-1" />
              <p className="text-xs font-bold text-white">Undangan Rapat</p>
              <p className="text-[10px] text-slate-300">Musyawarah Warga</p>
            </div>

            <div className="bg-white/10 p-2.5 rounded-2xl border border-white/10 text-center">
              <Hammer className="w-4 h-4 text-orange-400 mx-auto mb-1" />
              <p className="text-xs font-bold text-white">Kerja Bakti</p>
              <p className="text-[10px] text-slate-300">Gotong Royong</p>
            </div>

            <div className="bg-white/10 p-2.5 rounded-2xl border border-white/10 text-center">
              <FileText className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <p className="text-xs font-bold text-white">Surat Pengantar</p>
              <p className="text-[10px] text-slate-300">KTP/SKCK/Kelurahan</p>
            </div>

            <div className="bg-white/10 p-2.5 rounded-2xl border border-white/10 text-center">
              <AlertTriangle className="w-4 h-4 text-red-400 mx-auto mb-1" />
              <p className="text-xs font-bold text-white">Peringatan (SP)</p>
              <p className="text-[10px] text-slate-300">Tunggakan & Ronda</p>
            </div>
          </div>
        </div>
      </div>

      {/* SURAT LIST CLIENT WITH SEARCH, FILTERS, VIEW MODAL & ACTIONS */}
      <SuratListClient suratList={suratList} units={units} />
    </div>
  );
}
