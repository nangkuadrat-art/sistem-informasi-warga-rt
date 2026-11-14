'use client';

import React, { useState } from 'react';
import { formatRupiah } from '@/lib/utils/currency';
import ModalBayarTagihan from './ModalBayarTagihan';
import ModalEditTagihan from './ModalEditTagihan';
import { bayarTagihanAction, resetTagihanUnitAction } from '@/app/(dashboard)/admin/closing/actions';
import {
  Search,
  CheckCircle2,
  Settings,
  Banknote,
  RotateCcw,
  SlidersHorizontal,
  PiggyBank,
  ShieldAlert,
} from 'lucide-react';

interface Props {
  periodeId: string;
  isClosed: boolean;
  periodeBulan: number;
  tagihanList: any[];
}

export default function TabelClosingClient({
  periodeId,
  isClosed,
  periodeBulan,
  tagihanList,
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedTagihanBayar, setSelectedTagihanBayar] = useState<any | null>(null);
  const [selectedTagihanEdit, setSelectedTagihanEdit] = useState<any | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filter logic
  const filtered = (tagihanList || []).filter((t) => {
    const isKosong = t.status_bayar === 'kosong' || t.status_label === 'KOSONG';
    const isLunas = t.status_bayar === 'lunas' || t.status_label === 'LUNAS';
    const hasDenda = Number(t.denda_ronda || 0) > 0 || Number(t.denda_kerja_bakti || 0) > 0;
    const hasTunggakan = Number(t.tunggakan_bulan_lalu || 0) > 0;
    const hasTitipan = Number(t.titipan_bulan_lalu || 0) > 0 || Number(t.titipan_depan || 0) > 0;

    let matchStatus = true;
    if (filterStatus === 'lunas') matchStatus = isLunas;
    else if (filterStatus === 'belum_lunas') matchStatus = !isLunas && !isKosong;
    else if (filterStatus === 'kosong') matchStatus = isKosong;
    else if (filterStatus === 'denda') matchStatus = hasDenda;
    else if (filterStatus === 'tunggakan') matchStatus = hasTunggakan;
    else if (filterStatus === 'titipan') matchStatus = hasTitipan;

    const term = searchTerm.toLowerCase();
    const matchSearch =
      (t.nama_warga || '').toLowerCase().includes(term) ||
      (t.alamat || '').toLowerCase().includes(term) ||
      (t.blok_rumah || '').toLowerCase().includes(term) ||
      String(t.nomor_rumah || '').includes(term) ||
      String(t.no_unit || '').includes(term);

    return matchStatus && matchSearch;
  });

  // Calculate totals for currently filtered items
  const grandTotalTunggakan = filtered.reduce((acc, curr) => acc + Number(curr.tunggakan_bulan_lalu || 0), 0);
  const grandTotalTitipanLalu = filtered.reduce((acc, curr) => acc + Number(curr.titipan_bulan_lalu || 0), 0);
  const grandTotalIuran = filtered.reduce((acc, curr) => acc + Number(curr.iuran_pokok || 0), 0);
  const grandTotalDendaRonda = filtered.reduce((acc, curr) => acc + Number(curr.denda_ronda || 0), 0);
  const grandTotalDendaKB = filtered.reduce((acc, curr) => acc + Number(curr.denda_kerja_bakti || 0), 0);
  const grandTotalTagihan = filtered.reduce((acc, curr) => acc + Number(curr.total_tagihan || 0), 0);
  const grandTotalTerbayar = filtered.reduce((acc, curr) => acc + Number(curr.total_terbayar || 0), 0);
  const grandTotalKurangLebih = filtered.reduce((acc, curr) => acc + Number(curr.kurang_lebih || 0), 0);
  const grandTotalDonatur = filtered.reduce((acc, curr) => acc + Number(curr.donatur || 0), 0);
  const grandTotalTitipanDepan = filtered.reduce((acc, curr) => acc + Number(curr.titipan_depan || 0), 0);

  // Quick 1-click full payment
  const handleQuickLunas = async (t: any) => {
    const sisa = Math.max(0, Number(t.total_tagihan || 0) - Number(t.total_terbayar || 0));
    if (sisa <= 0) return;
    setActionLoadingId(t.id);
    const formData = new FormData();
    formData.append('nominal_bayar', String(sisa));
    formData.append('metode_bayar', 'TUNAI');
    formData.append('auto_kas', 'true');
    await bayarTagihanAction(periodeId, t.id, formData);
    setActionLoadingId(null);
  };

  // Quick Reset payment
  const handleReset = async (t: any) => {
    if (confirm(`Reset status pembayaran ${t.nama_warga} (${t.alamat}) kembali ke Rp 0?`)) {
      setActionLoadingId(t.id);
      await resetTagihanUnitAction(periodeId, t.id);
      setActionLoadingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* FILTER & SEARCH BAR */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* PILLS */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({tagihanList.length})
          </button>

          <button
            onClick={() => setFilterStatus('belum_lunas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterStatus === 'belum_lunas'
                ? 'bg-red-600 text-white'
                : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            Belum Lunas
          </button>

          <button
            onClick={() => setFilterStatus('lunas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterStatus === 'lunas'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Lunas
          </button>

          <button
            onClick={() => setFilterStatus('tunggakan')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterStatus === 'tunggakan'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            Ada Tunggakan
          </button>

          <button
            onClick={() => setFilterStatus('denda')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterStatus === 'denda'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Ada Denda
          </button>

          <button
            onClick={() => setFilterStatus('titipan')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterStatus === 'titipan'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            Titipan/Deposit
          </button>

          <button
            onClick={() => setFilterStatus('kosong')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterStatus === 'kosong'
                ? 'bg-slate-500 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            Kosong
          </button>
        </div>

        {/* SEARCH */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari warga / blok..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 15 COLUMNS TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-slate-50/80 text-slate-600 text-xs font-semibold border-b">
              <th className="py-3 px-2.5 w-10 text-center">No</th>
              <th className="py-3 px-3">Rumah / KK</th>
              <th className="py-3 px-2.5 text-right bg-blue-50/40 text-blue-900 border-x border-slate-100">
                Tunggakan Lalu
              </th>
              <th className="py-3 px-2.5 text-right bg-indigo-50/40 text-indigo-900 border-r border-slate-100">
                Titipan Lalu
              </th>
              <th className="py-3 px-2.5 text-right">Iuran Pokok</th>
              <th className="py-3 px-2.5 text-right text-rose-700 bg-rose-50/30">
                Denda Ronda
              </th>
              <th className="py-3 px-2.5 text-right text-amber-700 bg-amber-50/30">
                Denda KB
              </th>
              <th className="py-3 px-3 text-right font-bold text-slate-900 bg-slate-100/70">
                Total Tagihan
              </th>
              <th className="py-3 px-3 text-right text-emerald-700 bg-emerald-50/40 font-semibold">
                Pembayaran
              </th>
              <th className="py-3 px-2.5 text-center bg-slate-50">
                Kurang / Lebih
              </th>
              <th className="py-3 px-2.5 text-right text-purple-700 bg-purple-50/30">
                Donatur Kas
              </th>
              <th className="py-3 px-2.5 text-right text-teal-700 bg-teal-50/30">
                Titipan Depan
              </th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-3">Keterangan</th>
              <th className="py-3 px-3 text-center">Aksi CRUD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered && filtered.length > 0 ? (
              filtered.map((t, idx) => {
                const isKosong = t.status_bayar === 'kosong' || t.status_label === 'KOSONG';
                const isLunas = t.status_bayar === 'lunas' || t.status_label === 'LUNAS';
                const tunggakanLalu = Number(t.tunggakan_bulan_lalu || 0);
                const titipanLalu = Number(t.titipan_bulan_lalu || 0);
                const kurangLebih = Number(t.kurang_lebih || 0);
                const dendaRonda = Number(t.denda_ronda || 0);
                const dendaKB = Number(t.denda_kerja_bakti || 0);
                const donatur = Number(t.donatur || 0);
                const titipanDepan = Number(t.titipan_depan || 0);
                const sisa = Math.max(0, Number(t.total_tagihan || 0) - Number(t.total_terbayar || 0));

                return (
                  <tr
                    key={t.id || `row-${idx}`}
                    className={`hover:bg-slate-50/70 transition ${
                      isKosong ? 'opacity-40 bg-slate-50/30' : ''
                    }`}
                  >
                    <td className="py-2.5 px-2.5 text-xs text-slate-400 font-mono text-center">
                      {t.no_unit || idx + 1}
                    </td>

                    <td className="py-2.5 px-3">
                      <p className="font-semibold text-slate-800 text-xs">
                        {t.nama_warga === '-' ? 'Unit Kosong' : t.nama_warga}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {t.alamat ? t.alamat : `Blok ${t.blok_rumah}/${t.nomor_rumah}`}
                      </p>
                    </td>

                    {/* TUNGGAKAN LALU */}
                    <td className="py-2.5 px-2.5 text-right font-mono text-xs font-medium text-blue-700 bg-blue-50/20 border-x border-slate-100">
                      {tunggakanLalu > 0 ? formatRupiah(tunggakanLalu) : <span className="text-slate-300">Rp 0</span>}
                    </td>

                    {/* TITIPAN LALU */}
                    <td className="py-2.5 px-2.5 text-right font-mono text-xs font-medium text-indigo-700 bg-indigo-50/20 border-r border-slate-100">
                      {titipanLalu > 0 ? (
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                          +{formatRupiah(titipanLalu)}
                        </span>
                      ) : (
                        <span className="text-slate-300">Rp 0</span>
                      )}
                    </td>

                    {/* IURAN POKOK */}
                    <td className="py-2.5 px-2.5 text-right text-slate-600 font-mono text-xs">
                      {formatRupiah(t.iuran_pokok || 0)}
                    </td>

                    {/* DENDA RONDA */}
                    <td className="py-2.5 px-2.5 text-right font-mono text-xs text-rose-600 bg-rose-50/20">
                      {dendaRonda > 0 ? <span className="font-semibold">{formatRupiah(dendaRonda)}</span> : <span className="text-slate-300">Rp 0</span>}
                    </td>

                    {/* DENDA KB */}
                    <td className="py-2.5 px-2.5 text-right font-mono text-xs text-amber-600 bg-amber-50/20">
                      {dendaKB > 0 ? <span className="font-semibold">{formatRupiah(dendaKB)}</span> : <span className="text-slate-300">Rp 0</span>}
                    </td>

                    {/* TOTAL TAGIHAN */}
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono text-xs bg-slate-100/50">
                      {formatRupiah(t.total_tagihan || 0)}
                    </td>

                    {/* REALISASI BAYAR */}
                    <td className="py-2.5 px-3 text-right text-emerald-700 font-mono text-xs font-semibold bg-emerald-50/20">
                      {formatRupiah(t.total_terbayar || 0)}
                    </td>

                    {/* KURANG / LEBIH */}
                    <td className="py-2.5 px-2.5 font-mono text-xs text-center bg-slate-50/50">
                      {kurangLebih < 0 ? (
                        <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          {formatRupiah(kurangLebih)}
                        </span>
                      ) : kurangLebih > 0 ? (
                        <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          +{formatRupiah(kurangLebih)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">Rp 0</span>
                      )}
                    </td>

                    {/* DONATUR KAS */}
                    <td className="py-2.5 px-2.5 text-right font-mono text-xs text-purple-700 bg-purple-50/20">
                      {donatur > 0 ? (
                        <span className="font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                          +{formatRupiah(donatur)}
                        </span>
                      ) : (
                        <span className="text-slate-300">Rp 0</span>
                      )}
                    </td>

                    {/* TITIPAN DEPAN */}
                    <td className="py-2.5 px-2.5 text-right font-mono text-xs text-teal-700 bg-teal-50/20">
                      {titipanDepan > 0 ? (
                        <span className="font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                          +{formatRupiah(titipanDepan)}
                        </span>
                      ) : (
                        <span className="text-slate-300">Rp 0</span>
                      )}
                    </td>

                    {/* STATUS */}
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          t.status_label === 'LUNAS' || isLunas
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isKosong
                            ? 'bg-slate-100 text-slate-500 border border-slate-200'
                            : t.status_label === 'BELUM LUNAS' || kurangLebih < 0
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {t.status_label || (isLunas ? 'LUNAS' : isKosong ? 'KOSONG' : 'BELUM LUNAS')}
                      </span>
                    </td>

                    {/* KETERANGAN */}
                    <td className="py-2.5 px-3 text-slate-500 text-xs truncate max-w-[180px]" title={t.keterangan || '-'}>
                      {t.keterangan || '-'}
                    </td>

                    {/* AKSI CRUD */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Tombol Bayar / Cicil */}
                        {!isKosong && (
                          <button
                            onClick={() => setSelectedTagihanBayar(t)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-xs font-semibold transition border border-emerald-200 flex items-center gap-1"
                            title="Catat Pembayaran Iuran"
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            <span>Bayar</span>
                          </button>
                        )}

                        {/* Tombol 1-Click Lunas */}
                        {!isLunas && !isKosong && sisa > 0 && (
                          <button
                            onClick={() => handleQuickLunas(t)}
                            disabled={actionLoadingId === t.id}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-lg text-xs font-semibold transition shadow-sm flex items-center gap-1"
                            title="Tandai Langsung Lunas"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Lunas</span>
                          </button>
                        )}

                        {/* Tombol Edit Rincian Tagihan */}
                        <button
                          onClick={() => setSelectedTagihanEdit(t)}
                          className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition"
                          title="Edit Komponen Tagihan"
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>

                        {/* Tombol Reset Pembayaran jika sudah ada pembayaran */}
                        {t.total_terbayar > 0 && (
                          <button
                            onClick={() => handleReset(t)}
                            disabled={actionLoadingId === t.id}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Reset Pembayaran"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={15} className="py-12 text-center text-slate-400 text-xs">
                  Tidak ada data yang sesuai filter atau pencarian.
                </td>
              </tr>
            )}
          </tbody>

          {/* TOTAL FOOTER (REKAPITULASI RESMI SINKRON ROW 81) */}
          {filtered && filtered.length > 0 && (
            <tfoot>
              <tr className="bg-slate-100/90 text-slate-900 text-xs font-bold border-t-2 border-slate-300">
                <td colSpan={2} className="py-3 px-3 text-center uppercase tracking-wider text-[11px]">
                  TOTAL REKAPITULASI ({filtered.length} UNIT)
                </td>
                <td className="py-3 px-2.5 text-right font-mono text-blue-800 border-x border-slate-200">
                  {formatRupiah(grandTotalTunggakan)}
                </td>
                <td className="py-3 px-2.5 text-right font-mono text-indigo-800 border-r border-slate-200">
                  {formatRupiah(grandTotalTitipanLalu)}
                </td>
                <td className="py-3 px-2.5 text-right font-mono text-slate-800">
                  {formatRupiah(grandTotalIuran)}
                </td>
                <td className="py-3 px-2.5 text-right font-mono text-rose-700">
                  {formatRupiah(grandTotalDendaRonda)}
                </td>
                <td className="py-3 px-2.5 text-right font-mono text-amber-700">
                  {formatRupiah(grandTotalDendaKB)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-900 bg-slate-200/60 font-black">
                  {formatRupiah(grandTotalTagihan)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-emerald-800 font-black">
                  {formatRupiah(grandTotalTerbayar)}
                </td>
                <td className="py-3 px-2.5 text-center font-mono text-red-700 font-black">
                  {formatRupiah(grandTotalKurangLebih)}
                </td>
                <td className="py-3 px-2.5 text-right font-mono text-purple-800 font-black">
                  {grandTotalDonatur > 0 ? formatRupiah(grandTotalDonatur) : 'Rp 0'}
                </td>
                <td className="py-3 px-2.5 text-right font-mono text-teal-800 font-black">
                  {formatRupiah(grandTotalTitipanDepan)}
                </td>
                <td className="py-3 px-3 text-center">
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    KLOP
                  </span>
                </td>
                <td colSpan={2} className="py-3 px-3 text-xs font-semibold text-slate-600">
                  {periodeBulan === 9 ? 'Closing Sep Terverifikasi' : 'Closing Okt Terverifikasi'}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* MODAL BAYAR */}
      {selectedTagihanBayar && (
        <ModalBayarTagihan
          periodeId={periodeId}
          tagihan={selectedTagihanBayar}
          isOpen={!!selectedTagihanBayar}
          onClose={() => setSelectedTagihanBayar(null)}
        />
      )}

      {/* MODAL EDIT TAGIHAN */}
      {selectedTagihanEdit && (
        <ModalEditTagihan
          periodeId={periodeId}
          tagihan={selectedTagihanEdit}
          isOpen={!!selectedTagihanEdit}
          onClose={() => setSelectedTagihanEdit(null)}
        />
      )}
    </div>
  );
}
