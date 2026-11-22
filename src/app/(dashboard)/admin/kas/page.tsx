import { createClient } from '@/lib/supabase/server';
import { formatRupiah, NAMA_BULAN } from '@/lib/utils/currency';
import { getAllKasPeriods, getKasPeriod } from '@/lib/data/storeKas';
import { summarizePemasukanBreakdown } from '@/lib/data/kasCategories';
import { getAllDepositRequests } from '@/lib/data/storeDeposit';
import { getCurrentSession } from '@/lib/auth/serverSession';
import ModalTambahTransaksi from '@/components/kas/ModalTambahTransaksi';
import ExportKasButtons from '@/components/kas/ExportKasButtons';
import TabelTransaksiClient from '@/components/kas/TabelTransaksiClient';
import DepositApprovalPanel from '@/components/kas/DepositApprovalPanel';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  CheckCircle2,
  Lock,
  Calendar,
  Layers,
  ArrowRight,
  Database,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  searchParams: Promise<{ periode?: string }>;
}

export default async function AdminKasPage({ searchParams }: Props) {
  const { periode: selectedPeriodId } = await searchParams;
  const session = await getCurrentSession();
  const canApproveDeposit =
    !!session?.permissions?.kas_manage ||
    !!session?.permissions?.closing_manage ||
    session?.role === 'bendahara' ||
    session?.role === 'superadmin';
  const allDepositRequests = getAllDepositRequests();
  const allPeriods = getAllKasPeriods();
  const currentPeriod = getKasPeriod(selectedPeriodId);

  const isClosed = currentPeriod.status === 'closed';
  const listTransaksi = currentPeriod.transaksi || [];

  const totalMasuk =
    listTransaksi
      ?.filter((t) => t.jenis === 'masuk' && t.kategori !== 'saldo_awal')
      .reduce((acc, curr) => acc + Number(curr.nominal), 0) || currentPeriod.total_masuk;

  const totalKeluar =
    listTransaksi
      ?.filter((t) => t.jenis === 'keluar')
      .reduce((acc, curr) => acc + Number(curr.nominal), 0) || currentPeriod.total_keluar;

  const saldoAwal = Number(currentPeriod.saldo_awal);
  const saldoBerjalan = saldoAwal + totalMasuk - totalKeluar;
  const breakdown = summarizePemasukanBreakdown(listTransaksi);
  const pct = (part: number) =>
    breakdown.totalPemasukan > 0
      ? Math.round((part / breakdown.totalPemasukan) * 100)
      : 0;

  const periodeInfo = {
    bulan: currentPeriod.bulan,
    tahun: currentPeriod.tahun,
    saldoAwal,
    totalMasuk,
    totalKeluar,
    saldoAkhir: saldoBerjalan,
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Buku Kas Umum RT
            </h2>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                isClosed
                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {isClosed ? <Lock className="w-3 h-3 text-slate-500" /> : <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
              {currentPeriod.nama} ({isClosed ? 'Closed / Tutup Buku' : 'Open / Periode Aktif'})
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
              <Database className="w-3 h-3" />
              Sistem Kas Bergulir Otomatis
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Pencatatan mutasi kas masuk, pengeluaran operasional, dan saldo bergulir RT.03 RW.14 Tritih Lor.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <ExportKasButtons
            transaksiList={listTransaksi}
            periode={periodeInfo}
            namaRt="RT.03 / RW.14 Tritih Lor"
          />
          {!isClosed && <ModalTambahTransaksi periodeId={currentPeriod.id} />}
        </div>
      </div>

      {/* TABS SELECTOR PERIODE KAS (SEPTEMBER 2026 vs OKTOBER 2026) */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-600 px-2 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-600" />
            Pilih Periode Kas:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {allPeriods.map((p) => {
              const isSelected = p.id === currentPeriod.id;
              return (
                <a
                  key={p.id}
                  href={`/admin/kas?periode=${p.id}`}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p.status === 'closed' ? (
                    <Lock className="w-3 h-3" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                  {p.nama}
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                      isSelected
                        ? 'bg-blue-700/60 text-blue-100'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {p.status === 'closed' ? 'Tutup Buku' : 'Aktif'}
                  </span>
                </a>
              );
            })}
          </div>
        </div>

        <span className="text-xs text-slate-400 self-end sm:self-center">
          Koneksi data: <strong>September ➔ Oktober 2026</strong>
        </span>
      </div>

      {/* BANNER ALUR KAS BERGULIR (INTER-MONTH FINANCIAL AUDIT TRAIL) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 shadow-md">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
            Jalur Keterhubungan Kas Bergulir (Audit Trail Saldo Kas RT)
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* Node 1: Sisa Kas Agustus */}
          <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Penutupan Agustus 2026
              </span>
              <p className="text-base font-bold text-white mt-1">Rp 5.534.500</p>
            </div>
            <span className="text-[10px] text-slate-300 mt-2">
              Digulirkan jadi Saldo Awal September
            </span>
          </div>

          {/* Node 2: Closing September 2026 */}
          <div
            className={`p-3.5 rounded-2xl border flex flex-col justify-between transition ${
              currentPeriod.id === 'periode-sep-2026'
                ? 'bg-indigo-600/40 border-indigo-400 shadow-md ring-2 ring-indigo-400/30'
                : 'bg-white/10 border-white/10'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
                  Closing September 2026
                </span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                  LOCKED
                </span>
              </div>
              <p className="text-base font-bold text-emerald-400 mt-1">Rp 8.902.500</p>
            </div>
            <span className="text-[10px] text-slate-300 mt-2 flex items-center gap-1">
              Masuk: Rp 8.182k • Keluar: Rp 4.814k
            </span>
          </div>

          {/* Node 3: Saldo Oktober 2026 */}
          <div
            className={`p-3.5 rounded-2xl border flex flex-col justify-between transition ${
              currentPeriod.id === 'periode-okt-2026'
                ? 'bg-blue-600/40 border-blue-400 shadow-md ring-2 ring-blue-400/30'
                : 'bg-white/10 border-white/10'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-blue-300 tracking-wider">
                  Kas Berjalan Oktober 2026
                </span>
                <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono">
                  OPEN
                </span>
              </div>
              <p className="text-base font-bold text-cyan-300 mt-1">Rp 9.933.500</p>
            </div>
            <span className="text-[10px] text-slate-300 mt-2">
              Saldo Awal Bergulir: <strong>Rp 8.902.500</strong>
            </span>
          </div>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Saldo Awal
          </p>
          <p className="text-xl font-bold text-slate-800 mt-2">{formatRupiah(saldoAwal)}</p>
          <span className="text-[11px] text-slate-400">
            {currentPeriod.bulan === 9
              ? 'Dari closing Agustus 2026'
              : 'Bergulir dari closing September 2026'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              Total Pemasukan
            </p>
            <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-emerald-600 mt-2">
            +{formatRupiah(totalMasuk)}
          </p>
          <span className="text-[11px] text-slate-400">
            Iuran {formatRupiah(breakdown.iuranWarga.total)} • Donasi {formatRupiah(breakdown.donasi.total)} • Lainnya {formatRupiah(breakdown.masukanLainnya.total)}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">
              Total Pengeluaran
            </p>
            <ArrowUpRight className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-xl font-bold text-red-600 mt-2">
            -{formatRupiah(totalKeluar)}
          </p>
          <span className="text-[11px] text-slate-400">
            {currentPeriod.bulan === 9
              ? 'Dansos RW, PJU, Balai RW, Apresiasi'
              : 'Operasional pos, listrik, air, dll'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm bg-gradient-to-br from-white to-blue-50/50">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              {isClosed ? 'Saldo Akhir Closing' : 'Saldo Berjalan Kas'}
            </p>
            <Wallet className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">
            {formatRupiah(saldoBerjalan)}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {isClosed ? 'Terkunci & Valid (Closed)' : 'Klop Sesuai Rekap Sheet'}
          </span>
        </div>
      </div>

      {/* CATATAN CLOSING KHUSUS */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
        <Calendar className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-bold">Keterangan Periode {currentPeriod.nama}: </span>
          <span>{currentPeriod.catatan_closing}</span>
        </div>
      </div>

      {/* BREAKDOWN MUTASI PEMASUKAN: IURAN WARGA, DONASI, MASUKAN LAINNYA */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Identifikasi & Breakdown Mutasi Pemasukan ({currentPeriod.nama})
            </h3>
            <p className="text-xs text-slate-500">
              Klasifikasi seluruh pemasukan kas bulan berjalan selain Saldo Awal (Total:{' '}
              <strong className="text-emerald-700 font-mono">
                {formatRupiah(breakdown.totalPemasukan)}
              </strong>
              ).
            </p>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-center">
            {breakdown.iuranWarga.count + breakdown.donasi.count + breakdown.masukanLainnya.count} Mutasi Pemasukan Teridentifikasi
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 1. Iuran Warga */}
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                1. Iuran Warga ({breakdown.iuranWarga.count} tx)
              </span>
              <span className="text-[11px] font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                {pct(breakdown.iuranWarga.total)}%
              </span>
            </div>
            <p className="text-lg font-black text-emerald-700 font-mono">
              +{formatRupiah(breakdown.iuranWarga.total)}
            </p>
            <div className="text-[11px] text-slate-600 space-y-0.5 pt-1 border-t border-emerald-200/60">
              <div className="flex justify-between">
                <span>• Iuran Pokok Bulanan:</span>
                <span className="font-mono font-semibold">{formatRupiah(breakdown.iuranWarga.iuranPokok)}</span>
              </div>
              <div className="flex justify-between">
                <span>• Pelunasan Tunggakan:</span>
                <span className="font-mono font-semibold">{formatRupiah(breakdown.iuranWarga.tunggakan)}</span>
              </div>
            </div>
          </div>

          {/* 2. Donasi */}
          <div className="rounded-2xl border border-violet-200/80 bg-violet-50/40 p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-violet-700">
                2. Donasi / Donatur ({breakdown.donasi.count} tx)
              </span>
              <span className="text-[11px] font-mono font-bold text-violet-700 bg-white px-2 py-0.5 rounded-full border border-violet-200">
                {pct(breakdown.donasi.total)}%
              </span>
            </div>
            <p className="text-lg font-black text-violet-700 font-mono">
              +{formatRupiah(breakdown.donasi.total)}
            </p>
            <div className="text-[11px] text-slate-600 pt-1 border-t border-violet-200/60">
              {breakdown.donasi.total > 0
                ? 'Sumbangan Donatur Kas RT / Kegiatan Warga'
                : 'Belum ada donasi tercatat di periode ini (dapat ditambah via Catat Transaksi).'}
            </div>
          </div>

          {/* 3. Masukan Lainnya */}
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                3. Masukan Lainnya ({breakdown.masukanLainnya.count} tx)
              </span>
              <span className="text-[11px] font-mono font-bold text-amber-800 bg-white px-2 py-0.5 rounded-full border border-amber-200">
                {pct(breakdown.masukanLainnya.total)}%
              </span>
            </div>
            <p className="text-lg font-black text-amber-700 font-mono">
              +{formatRupiah(breakdown.masukanLainnya.total)}
            </p>
            <div className="text-[11px] text-slate-600 space-y-0.5 pt-1 border-t border-amber-200/60">
              <div className="flex justify-between">
                <span>• Denda Ronda:</span>
                <span className="font-mono font-semibold">{formatRupiah(breakdown.masukanLainnya.dendaRonda)}</span>
              </div>
              <div className="flex justify-between">
                <span>• Denda Kerja Bakti:</span>
                <span className="font-mono font-semibold">{formatRupiah(breakdown.masukanLainnya.dendaKb)}</span>
              </div>
              <div className="flex justify-between">
                <span>• Titipan / Lain-lain:</span>
                <span className="font-mono font-semibold">
                  {formatRupiah(breakdown.masukanLainnya.titipan + breakdown.masukanLainnya.lainnyaNonDenda)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL PENGGUNAAN & PERSETUJUAN DEPOSIT WARGA */}
      <DepositApprovalPanel requests={allDepositRequests} canApprove={canApproveDeposit} />

      {/* TABEL MUTASI TRANSAKSI CLIENT (FULL CRUD) */}
      <TabelTransaksiClient
        periodeId={currentPeriod.id}
        isClosed={isClosed}
        transaksiList={listTransaksi}
      />
    </div>
  );
}
