'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatRupiah } from '@/lib/utils/currency';
import {
  IuranHistoriBulan,
  WargaHistoriUnit,
} from '@/lib/data/storeHistoriWarga';
import {
  Receipt,
  ShieldCheck,
  Hammer,
  Printer,
  Calendar,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Layers,
  Building2,
} from 'lucide-react';

type ActiveLembar = 'semua' | 'iuran' | 'ronda' | 'kerja_bakti';

interface UnitOption {
  no_unit: number;
  alamat: string;
  nama_warga: string;
}

interface Props {
  unitMeta: WargaHistoriUnit;
  iuranHistori: IuranHistoriBulan[];
  canSwitchUnit: boolean;
  allUnitsSelector: UnitOption[];
  initialTab?: string;
}

function formatTanggalIndoShort(isoOrStr: string | null): string {
  if (!isoOrStr) return 'Belum ada tanggal';
  const d = new Date(isoOrStr);
  if (isNaN(d.getTime())) return isoOrStr;
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function PortalWargaHistoriClient({
  unitMeta,
  iuranHistori,
  canSwitchUnit,
  allUnitsSelector,
  initialTab,
}: Props) {
  const router = useRouter();
  const validInitial: ActiveLembar =
    initialTab === 'iuran' || initialTab === 'ronda' || initialTab === 'kerja_bakti'
      ? initialTab
      : 'semua';

  const [activeTab, setActiveTab] = useState<ActiveLembar>(validInitial);

  const showIuran = activeTab === 'semua' || activeTab === 'iuran';
  const showRonda = activeTab === 'semua' || activeTab === 'ronda';
  const showKB = activeTab === 'semua' || activeTab === 'kerja_bakti';

  const totalTerbayarAll = iuranHistori.reduce((acc, i) => acc + i.total_terbayar, 0);
  const totalDendaRondaAll = unitMeta.ronda.histori.reduce((acc, h) => acc + h.denda, 0);
  const totalDendaKbAll = unitMeta.kerja_bakti.histori.reduce((acc, h) => acc + h.denda, 0);
  const latestIuran = iuranHistori[0] || null;

  return (
    <div className="space-y-5">
      {/* TOOLBAR NAVIGASI LEMBAR INFORMASI + UNIT SWITCHER (PENGURUS) */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('semua')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'semua'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Semua Lembar
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('iuran')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'iuran'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              Histori Iuran Bulanan
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ronda')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'ronda'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Presensi Ronda
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('kerja_bakti')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'kerja_bakti'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <Hammer className="w-3.5 h-3.5" />
              Presensi Kerja Bakti
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {canSwitchUnit && (
              <select
                aria-label="Pilih Unit Warga"
                value={unitMeta.no_unit}
                onChange={(e) => router.push(`/warga/dashboard?unit=${e.target.value}`)}
                className="flex-1 md:flex-initial px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
              >
                {allUnitsSelector.map((u) => (
                  <option key={u.no_unit} value={u.no_unit}>
                    #{u.no_unit} {u.alamat} — {u.nama_warga === '-' ? 'Kosong' : u.nama_warga}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Lembar</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LEMBAR 1: HISTORI PEMBAYARAN IURAN BULANAN
         ============================================================ */}
      {showIuran && (
        <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          {/* Header Lembar */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-50/80 via-white to-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-sm shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                  Lembar Informasi 1 • Keuangan Warga
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Histori Pembayaran Iuran Bulanan
                </h3>
                <p className="text-xs text-slate-500">
                  Unit #{unitMeta.no_unit} • {unitMeta.alamat} •{' '}
                  <strong className="text-slate-700">
                    {unitMeta.nama_warga === '-' ? 'Unit Kosong' : unitMeta.nama_warga}
                  </strong>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:flex items-center gap-2.5 text-xs">
              <div className="bg-white px-3 py-2 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Total Sudah Dibayar</span>
                <span className="font-mono font-bold text-emerald-700">
                  {formatRupiah(totalTerbayarAll)}
                </span>
              </div>
              {latestIuran && (
                <div className="bg-white px-3 py-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">
                    {latestIuran.titipan_depan > 0 ? 'Titipan Bergulir' : 'Posisi Tagihan Terakhir'}
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      latestIuran.titipan_depan > 0
                        ? 'text-teal-700'
                        : latestIuran.kurang_lebih < 0
                        ? 'text-rose-600'
                        : 'text-emerald-700'
                    }`}
                  >
                    {latestIuran.titipan_depan > 0
                      ? `+${formatRupiah(latestIuran.titipan_depan)}`
                      : formatRupiah(latestIuran.kurang_lebih)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* TAMPILAN MOBILE: KARTU HISTORI PER BULAN */}
          <div className="md:hidden p-3.5 space-y-3 bg-slate-50/40">
            {iuranHistori.map((item) => {
              const isLunas = item.status_label === 'LUNAS' || item.status_bayar === 'lunas';
              const isKosong = item.status_label === 'KOSONG' || item.status_bayar === 'kosong';
              return (
                <div
                  key={`mob-iuran-${item.periode_id}`}
                  className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <h4 className="font-bold text-slate-900 text-sm">{item.periode_nama}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Tgl Bayar: {formatTanggalIndoShort(item.tanggal_pembayaran)}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border ${
                        isLunas
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isKosong
                          ? 'bg-slate-100 text-slate-500 border-slate-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {item.status_label}
                    </span>
                  </div>

                  {/* Ringkasan Angka Utama */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Tagihan</p>
                      <p className="text-xs font-mono font-bold text-slate-900">
                        {formatRupiah(item.total_tagihan)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-emerald-600 uppercase font-semibold">Dibayar</p>
                      <p className="text-xs font-mono font-bold text-emerald-700">
                        {formatRupiah(item.total_terbayar)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Selisih</p>
                      <p
                        className={`text-xs font-mono font-bold ${
                          item.kurang_lebih < 0
                            ? 'text-rose-600'
                            : item.kurang_lebih > 0
                            ? 'text-blue-600'
                            : 'text-slate-600'
                        }`}
                      >
                        {item.kurang_lebih > 0
                          ? `+${formatRupiah(item.kurang_lebih)}`
                          : formatRupiah(item.kurang_lebih)}
                      </p>
                    </div>
                  </div>

                  {/* Rincian Item Iuran */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-600 pt-1">
                    <div className="flex justify-between">
                      <span>Iuran Pokok:</span>
                      <span className="font-mono font-semibold">{formatRupiah(item.iuran_pokok)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tunggakan Lalu:</span>
                      <span className="font-mono font-semibold text-blue-700">
                        {formatRupiah(item.tunggakan_bulan_lalu)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Denda Ronda:</span>
                      <span className="font-mono font-semibold text-rose-600">
                        {formatRupiah(item.denda_ronda)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Denda Kerja Bakti:</span>
                      <span className="font-mono font-semibold text-amber-600">
                        {formatRupiah(item.denda_kerja_bakti)}
                      </span>
                    </div>
                    {item.titipan_bulan_lalu > 0 && (
                      <div className="flex justify-between col-span-2 text-indigo-700">
                        <span>Titipan Bulan Lalu:</span>
                        <span className="font-mono font-bold">+{formatRupiah(item.titipan_bulan_lalu)}</span>
                      </div>
                    )}
                    {item.titipan_depan > 0 && (
                      <div className="flex justify-between col-span-2 text-teal-700 bg-teal-50 px-2 py-1 rounded-lg">
                        <span className="font-semibold">Titipan Depan (Bergulir):</span>
                        <span className="font-mono font-bold">+{formatRupiah(item.titipan_depan)}</span>
                      </div>
                    )}
                  </div>

                  {item.keterangan && item.keterangan !== '-' && (
                    <p className="text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg">
                      Catatan: {item.keterangan}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* TAMPILAN DESKTOP: TABEL RINCIAN HISTORI IURAN */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="py-3 px-4">Periode</th>
                  <th className="py-3 px-3">Tgl Bayar</th>
                  <th className="py-3 px-3 text-right">Iuran Pokok</th>
                  <th className="py-3 px-3 text-right">Tunggakan Lalu</th>
                  <th className="py-3 px-3 text-right">Titipan Lalu</th>
                  <th className="py-3 px-3 text-right">Denda Ronda</th>
                  <th className="py-3 px-3 text-right">Denda KB</th>
                  <th className="py-3 px-3 text-right bg-slate-100/70 text-slate-800">Total Tagihan</th>
                  <th className="py-3 px-3 text-right text-emerald-700">Pembayaran</th>
                  <th className="py-3 px-3 text-right">Kurang / Lebih</th>
                  <th className="py-3 px-3 text-right text-teal-700">Titipan Depan</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {iuranHistori.map((item) => {
                  const isLunas = item.status_label === 'LUNAS' || item.status_bayar === 'lunas';
                  const isKosong = item.status_label === 'KOSONG' || item.status_bayar === 'kosong';
                  return (
                    <tr key={`desk-iuran-${item.periode_id}`} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {item.periode_nama}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">
                        {item.tanggal_pembayaran ? formatTanggalIndoShort(item.tanggal_pembayaran) : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {formatRupiah(item.iuran_pokok)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-blue-700">
                        {item.tunggakan_bulan_lalu > 0 ? formatRupiah(item.tunggakan_bulan_lalu) : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-indigo-700">
                        {item.titipan_bulan_lalu > 0 ? `+${formatRupiah(item.titipan_bulan_lalu)}` : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-rose-600">
                        {item.denda_ronda > 0 ? formatRupiah(item.denda_ronda) : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-amber-600">
                        {item.denda_kerja_bakti > 0 ? formatRupiah(item.denda_kerja_bakti) : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 bg-slate-50">
                        {formatRupiah(item.total_tagihan)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                        {formatRupiah(item.total_terbayar)}
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-mono font-bold ${
                          item.kurang_lebih < 0
                            ? 'text-rose-600'
                            : item.kurang_lebih > 0
                            ? 'text-blue-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {item.kurang_lebih > 0
                          ? `+${formatRupiah(item.kurang_lebih)}`
                          : formatRupiah(item.kurang_lebih)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-teal-700">
                        {item.titipan_depan > 0 ? `+${formatRupiah(item.titipan_depan)}` : '-'}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                            isLunas
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isKosong
                              ? 'bg-slate-100 text-slate-500 border-slate-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {item.status_label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate" title={item.keterangan}>
                        {item.keterangan}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Rincian Alokasi Iuran Pokok (jika ada) */}
          {latestIuran && latestIuran.iuran_pokok > 0 && (
            <div className="px-4 sm:px-5 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
              <span className="font-bold text-slate-700">Komposisi Iuran Bulanan:</span>
              <span>Dansos RT: {formatRupiah(latestIuran.dansos_rt)}</span>
              <span>Dansos RW: {formatRupiah(latestIuran.dansos_rw)}</span>
              <span>Pembangunan: {formatRupiah(latestIuran.pembangunan)}</span>
              <span>Snack: {formatRupiah(latestIuran.snack)}</span>
              <span>Jimpitan: {formatRupiah(latestIuran.jimpitan)}</span>
            </div>
          )}
        </section>
      )}

      {/* ============================================================
          LEMBAR 2: HISTORI PRESENSI RONDA MALAM
         ============================================================ */}
      {showRonda && (
        <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-50/80 via-white to-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-sm shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                  Lembar Informasi 2 • Keamanan Lingkungan
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Histori Presensi Ronda Malam
                </h3>
                <p className="text-xs text-slate-500">
                  Kategori: <strong className="text-indigo-700">{unitMeta.ronda.kriteria}</strong>
                  {unitMeta.ronda.denda_per_absen > 0
                    ? ` • Denda/absen ${formatRupiah(unitMeta.ronda.denda_per_absen)} (Maks. ${formatRupiah(unitMeta.ronda.denda_full)}/bln)`
                    : ' • Bebas Kewajiban Ronda'}
                </p>
              </div>
            </div>

            <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs self-start sm:self-center">
              <span className="text-[10px] text-slate-400 block">Akumulasi Denda (Sep–Okt)</span>
              <span
                className={`font-mono font-bold ${
                  totalDendaRondaAll > 0 ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                {formatRupiah(totalDendaRondaAll)}
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-3">
            {unitMeta.ronda.histori.map((r) => {
              const noDenda = r.denda === 0;
              return (
                <div
                  key={`ronda-${r.periode_id}`}
                  className="rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 bg-slate-50/40 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900">{r.periode_nama}</span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          noDenda
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      {r.hadir_count !== null && r.total_sesi !== null && (
                        <span className="font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                          Kehadiran: <strong className="text-slate-900">{r.hadir_count}/{r.total_sesi}</strong>
                        </span>
                      )}
                      <span
                        className={`font-mono font-bold px-2.5 py-1 rounded-lg border ${
                          r.denda > 0
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        Denda: {formatRupiah(r.denda)}
                      </span>
                    </div>
                  </div>

                  {/* Detail Kehadiran Mingguan (M1 s.d M5) jika ada */}
                  {r.mingguan && r.mingguan.length > 0 && (
                    <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                      {r.mingguan.map((m) => {
                        const isHadir = m.status.toLowerCase() === 'hadir';
                        return (
                          <div
                            key={`${r.periode_id}-${m.minggu}`}
                            className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center gap-0.5 ${
                              isHadir
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-white border-slate-200 text-slate-500'
                            }`}
                          >
                            <span className="text-[10px] font-bold">{m.minggu}</span>
                            {isHadir ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-400" />
                            )}
                            <span className="text-[10px] font-semibold">
                              {isHadir ? 'Hadir' : 'Absen'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <p className="text-xs text-slate-600">{r.catatan}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ============================================================
          LEMBAR 3: HISTORI PRESENSI KERJA BAKTI
         ============================================================ */}
      {showKB && (
        <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50/80 via-white to-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-sm shrink-0">
                <Hammer className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  Lembar Informasi 3 • Gotong Royong
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Histori Presensi Kerja Bakti
                </h3>
                <p className="text-xs text-slate-500">
                  Kategori: <strong className="text-emerald-700">{unitMeta.kerja_bakti.kriteria}</strong>
                  {unitMeta.kerja_bakti.denda_per_absen > 0
                    ? ` • Denda tidak hadir: ${formatRupiah(unitMeta.kerja_bakti.denda_per_absen)}`
                    : ' • Bebas Denda Kerja Bakti'}
                </p>
              </div>
            </div>

            <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs self-start sm:self-center">
              <span className="text-[10px] text-slate-400 block">Akumulasi Denda (Sep–Okt)</span>
              <span
                className={`font-mono font-bold ${
                  totalDendaKbAll > 0 ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                {formatRupiah(totalDendaKbAll)}
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            {unitMeta.kerja_bakti.histori.map((kb) => {
              const isHadir = kb.status.toLowerCase().includes('hadir') && kb.denda === 0;
              const isBebas = kb.denda === 0 && !isHadir;
              return (
                <div
                  key={`kb-${kb.periode_id}`}
                  className="rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 bg-slate-50/40 flex flex-col justify-between gap-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-sm font-bold text-slate-900">{kb.periode_nama}</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        {isHadir ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : isBebas ? (
                          <MinusCircle className="w-4 h-4 text-slate-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span
                          className={`text-xs font-bold ${
                            isHadir
                              ? 'text-emerald-700'
                              : isBebas
                              ? 'text-slate-600'
                              : 'text-rose-700'
                          }`}
                        >
                          {kb.status}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border shrink-0 ${
                        kb.denda > 0
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      Denda: {formatRupiah(kb.denda)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">{kb.catatan}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Footer Catatan Resmi */}
      <div className="text-[11px] text-slate-400 flex items-center justify-between flex-wrap gap-2 px-1">
        <span className="inline-flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" />
          Lembar Informasi Resmi Warga RT.03 RW.14 Perum BPTW Tritih Lor
        </span>
        <span>Data tersinkron dengan Pembukuan Kas & Rekapitulasi Pengurus RT</span>
      </div>
    </div>
  );
}
