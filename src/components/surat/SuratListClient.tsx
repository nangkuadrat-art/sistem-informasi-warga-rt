'use client';

import React, { useState } from 'react';
import { SuratData, JenisSurat } from '@/lib/data/storeSurat';
import { UnitRumahRT } from '@/lib/data/masterDataGoogleSheets';
import ModalBuatSurat from './ModalBuatSurat';
import ModalViewSurat from './ModalViewSurat';
import {
  Mail,
  Search,
  Calendar,
  Hammer,
  FileText,
  AlertTriangle,
  Printer,
  Share2,
  Trash2,
  Eye,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { deleteSuratAction } from '@/app/(dashboard)/admin/surat/actions';

interface Props {
  suratList: SuratData[];
  units: UnitRumahRT[];
}

export default function SuratListClient({ suratList, units }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [activeSurat, setActiveSurat] = useState<SuratData | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  // Filtered Surat
  const filteredList = suratList.filter((s) => {
    const matchesFilter = selectedFilter === 'all' || s.jenis === selectedFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      s.nomor_surat.toLowerCase().includes(term) ||
      s.perihal.toLowerCase().includes(term) ||
      s.tujuan_nama.toLowerCase().includes(term) ||
      (s.pemohon_nama && s.pemohon_nama.toLowerCase().includes(term));
    return matchesFilter && matchesSearch;
  });

  const countAll = suratList.length;
  const countRapat = suratList.filter((s) => s.jenis === 'undangan_rapat').length;
  const countKB = suratList.filter((s) => s.jenis === 'undangan_kerja_bakti').length;
  const countPengantar = suratList.filter((s) => s.jenis === 'surat_pengantar').length;
  const countPeringatan = suratList.filter((s) => s.jenis === 'surat_peringatan').length;

  const handleOpenView = (s: SuratData) => {
    setActiveSurat(s);
    setIsViewOpen(true);
  };

  const handleDelete = async (id: string, nomor: string) => {
    if (confirm(`Hapus surat ${nomor}?`)) {
      await deleteSuratAction(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* STATS KARTU 4 JENIS SURAT */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setSelectedFilter('undangan_rapat')}
          className={`cursor-pointer p-4 rounded-2xl border transition ${
            selectedFilter === 'undangan_rapat'
              ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400/30'
              : 'bg-white border-slate-200/80 hover:border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
              Undangan Rapat
            </span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{countRapat}</p>
          <span className="text-[10px] text-slate-400">Musyawarah & Evaluasi</span>
        </div>

        <div
          onClick={() => setSelectedFilter('undangan_kerja_bakti')}
          className={`cursor-pointer p-4 rounded-2xl border transition ${
            selectedFilter === 'undangan_kerja_bakti'
              ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-400/30'
              : 'bg-white border-slate-200/80 hover:border-orange-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-700">
              Kerja Bakti
            </span>
            <Hammer className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{countKB}</p>
          <span className="text-[10px] text-slate-400">Gotong Royong & Fasum</span>
        </div>

        <div
          onClick={() => setSelectedFilter('surat_pengantar')}
          className={`cursor-pointer p-4 rounded-2xl border transition ${
            selectedFilter === 'surat_pengantar'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/30'
              : 'bg-white border-slate-200/80 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Surat Pengantar
            </span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{countPengantar}</p>
          <span className="text-[10px] text-slate-400">Administrasi Warga (Privasi)</span>
        </div>

        <div
          onClick={() => setSelectedFilter('surat_peringatan')}
          className={`cursor-pointer p-4 rounded-2xl border transition ${
            selectedFilter === 'surat_peringatan'
              ? 'bg-red-50 border-red-300 ring-2 ring-red-400/30'
              : 'bg-white border-slate-200/80 hover:border-red-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-700">
              Surat Peringatan
            </span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{countPeringatan}</p>
          <span className="text-[10px] text-slate-400">Tunggakan & Ketertiban</span>
        </div>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* FILTER BUTTONS */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Surat ({countAll})
          </button>

          <button
            onClick={() => setSelectedFilter('undangan_rapat')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedFilter === 'undangan_rapat'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Rapat ({countRapat})
          </button>

          <button
            onClick={() => setSelectedFilter('undangan_kerja_bakti')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedFilter === 'undangan_kerja_bakti'
                ? 'bg-orange-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Kerja Bakti ({countKB})
          </button>

          <button
            onClick={() => setSelectedFilter('surat_pengantar')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedFilter === 'surat_pengantar'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pengantar ({countPengantar})
          </button>

          <button
            onClick={() => setSelectedFilter('surat_peringatan')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedFilter === 'surat_peringatan'
                ? 'bg-red-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Peringatan ({countPeringatan})
          </button>
        </div>

        {/* SEARCH INPUT */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor, perihal, atau nama..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* DAFTAR ARSIP SURAT */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-800 text-base">Arsip Surat Resmi RT.03</h3>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {filteredList.length} Surat Ditemukan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 text-xs font-semibold border-b">
                <th className="py-3 px-3 w-10 text-center">No</th>
                <th className="py-3 px-3">Nomor & Tanggal</th>
                <th className="py-3 px-3">Jenis Surat</th>
                <th className="py-3 px-3">Perihal / Hal</th>
                <th className="py-3 px-3">Tujuan / Pemohon</th>
                <th className="py-3 px-3 text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length > 0 ? (
                filteredList.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 text-center font-mono text-xs text-slate-400">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-3">
                      <p className="font-mono font-bold text-slate-900 text-xs">
                        {s.nomor_surat}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {s.tanggal_surat}
                      </p>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase inline-flex items-center gap-1 ${
                          s.jenis === 'undangan_rapat'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : s.jenis === 'undangan_kerja_bakti'
                            ? 'bg-orange-50 text-orange-700 border border-orange-200'
                            : s.jenis === 'surat_pengantar'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {s.jenis === 'undangan_rapat' && <Calendar className="w-3 h-3" />}
                        {s.jenis === 'undangan_kerja_bakti' && <Hammer className="w-3 h-3" />}
                        {s.jenis === 'surat_pengantar' && <FileText className="w-3 h-3" />}
                        {s.jenis === 'surat_peringatan' && <AlertTriangle className="w-3 h-3" />}
                        {s.jenis.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-3 max-w-[260px]">
                      <p className="font-semibold text-slate-800 line-clamp-1">{s.perihal}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        {s.agenda || s.keperluan_surat || s.peringatan_pelanggaran || '-'}
                      </p>
                    </td>

                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-800 text-xs">
                        {s.jenis === 'surat_pengantar' && s.pemohon_nama ? s.pemohon_nama : s.tujuan_nama}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                        {s.tujuan_alamat || s.pemohon_alamat || '-'}
                      </p>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenView(s)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded-lg text-xs transition flex items-center gap-1 border border-blue-200"
                          title="Lihat & Cetak Surat"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat / Cetak</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveSurat(s);
                            setIsViewOpen(true);
                          }}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 p-1 rounded-lg text-xs transition border border-emerald-200"
                          title="Bagikan WA"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(s.id, s.nomor_surat)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    Tidak ada surat yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL VIEW & PRINT */}
      {activeSurat && (
        <ModalViewSurat
          surat={activeSurat}
          isOpen={isViewOpen}
          onClose={() => {
            setIsViewOpen(false);
            setActiveSurat(null);
          }}
        />
      )}
    </div>
  );
}
