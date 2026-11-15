'use client';

import React, { useState } from 'react';
import { formatRupiah } from '@/lib/utils/currency';
import ModalBayarTagihan from './ModalBayarTagihan';
import ModalEditTagihan from './ModalEditTagihan';
import ResponsiveViewToggle, { ResponsiveViewMode } from '@/components/ui/ResponsiveViewToggle';
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
  const [viewMode, setViewMode] = useState<ResponsiveViewMode>('auto');

  const cardsClass =
    viewMode === 'auto' ? 'block md:hidden' : viewMode === 'cards' ? 'block' : 'hidden';
  const tableClass =
    viewMode === 'auto' ? 'hidden md:block' : viewMode === 'table' ? 'block' : 'hidden';

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
      <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* PILLS */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto">
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

        {/* SEARCH & VIEW MODE */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari warga / blok..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <ResponsiveViewToggle mode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {/* MOBILE / CARD VIEW (SIMPEL & RAMAH SENTUHAN) */}
      <div className={`${cardsClass} p-3 sm:p-4 space-y-3 bg-slate-50/40`}>
        {filtered && filtered.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((t, idx) => {
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
                  <div
                    key={t.id || `card-${idx}`}
                    className={`bg-white rounded-2xl border p-3.5 shadow-xs space-y-3 ${
                      isKosong ? 'border-slate-200/70 opacity-65' : 'border-slate-200/90'
                    }`}
                  >
                    {/* Header Card */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-900 text-white">
                            #{t.no_unit || idx + 1} • {t.alamat ? t.alamat : `Blok ${t.blok_rumah}/${t.nomor_rumah}`}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mt-1 truncate">
                          {t.nama_warga === '-' ? 'Unit Kosong' : t.nama_warga}
                        </h4>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase shrink-0 ${
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
                    </div>

                    {/* Angka Utama */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Tagihan</p>
                        <p className="text-xs font-mono font-bold text-slate-900 mt-0.5">
                          {formatRupiah(t.total_tagihan || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-emerald-600 font-semibold uppercase">Bayar</p>
                        <p className="text-xs font-mono font-bold text-emerald-700 mt-0.5">
                          {formatRupiah(t.total_terbayar || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-semibold uppercase">Selisih</p>
                        <p
                          className={`text-xs font-mono font-bold mt-0.5 ${
                            kurangLebih < 0
                              ? 'text-red-600'
                              : kurangLebih > 0
                              ? 'text-blue-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {kurangLebih > 0 ? `+${formatRupiah(kurangLebih)}` : formatRupiah(kurangLebih)}
                        </p>
                      </div>
                    </div>

                    {/* Komponen Tagihan & Titipan (Hanya yang bernilai > 0) */}
                    {(Number(t.iuran_pokok || 0) > 0 ||
                      tunggakanLalu > 0 ||
                      titipanLalu > 0 ||
                      dendaRonda > 0 ||
                      dendaKB > 0 ||
                      titipanDepan > 0 ||
                      donatur > 0) && (
                      <div className="flex flex-wrap gap-1.5 text-[11px]">
                        {Number(t.iuran_pokok || 0) > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium">
                            Iuran: {formatRupiah(t.iuran_pokok)}
                          </span>
                        )}
                        {tunggakanLalu > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                            Tunggakan Lalu: {formatRupiah(tunggakanLalu)}
                          </span>
                        )}
                        {titipanLalu > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                            Titipan Lalu: +{formatRupiah(titipanLalu)}
                          </span>
                        )}
                        {dendaRonda > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                            Denda Ronda: {formatRupiah(dendaRonda)}
                          </span>
                        )}
                        {dendaKB > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                            Denda KB: {formatRupiah(dendaKB)}
                          </span>
                        )}
                        {titipanDepan > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 font-bold">
                            Titipan Depan: +{formatRupiah(titipanDepan)}
                          </span>
                        )}
                        {donatur > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                            Donatur: +{formatRupiah(donatur)}
                          </span>
                        )}
                      </div>
                    )}

                    {t.keterangan && t.keterangan !== '-' && (
                      <p className="text-[11px] text-slate-500 bg-slate-50/70 px-2.5 py-1.5 rounded-lg">
                        Ket: {t.keterangan}
                      </p>
                    )}

                    {/* Tombol Aksi Ramah Sentuhan */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {!isKosong && (
                          <button
                            onClick={() => setSelectedTagihanBayar(t)}
                            className="bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-bold transition border border-emerald-200 flex items-center gap-1.5"
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            <span>Bayar</span>
                          </button>
                        )}
                        {!isLunas && !isKosong && sisa > 0 && (
                          <button
                            onClick={() => handleQuickLunas(t)}
                            disabled={actionLoadingId === t.id}
                            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Lunas</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedTagihanEdit(t)}
                          className="p-2 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-xl transition border border-slate-200/80"
                          title="Edit Komponen Tagihan"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        {t.total_terbayar > 0 && (
                          <button
                            onClick={() => handleReset(t)}
                            disabled={actionLoadingId === t.id}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition border border-slate-200/80"
                            title="Reset Pembayaran"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RINGKASAN TOTAL MODE KARTU */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Total Rekapitulasi ({filtered.length} Unit)
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                  {periodeBulan === 9 ? 'Closing Sep' : 'Closing Okt'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400">Total Tagihan</p>
                  <p className="font-mono font-bold text-white">{formatRupiah(grandTotalTagihan)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-emerald-300">Pembayaran Masuk</p>
                  <p className="font-mono font-bold text-emerald-400">{formatRupiah(grandTotalTerbayar)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-rose-300">Kurang / Lebih</p>
                  <p className="font-mono font-bold text-rose-400">{formatRupiah(grandTotalKurangLebih)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-amber-300">Denda (Ronda + KB)</p>
                  <p className="font-mono font-bold text-amber-300">
                    {formatRupiah(grandTotalDendaRonda + grandTotalDendaKB)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-indigo-300">Titipan Lalu</p>
                  <p className="font-mono font-bold text-indigo-300">{formatRupiah(grandTotalTitipanLalu)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-teal-300">Titipan Depan</p>
                  <p className="font-mono font-bold text-teal-300">{formatRupiah(grandTotalTitipanDepan)}</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="py-10 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
            Tidak ada data yang sesuai filter atau pencarian.
          </div>
        )}
      </div>

      {/* 15 COLUMNS TABLE (DESKTOP / MODE TABEL) */}
      <div className={`${tableClass} overflow-x-auto`}>
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
