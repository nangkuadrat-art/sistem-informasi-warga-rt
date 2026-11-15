import { formatRupiah, NAMA_BULAN } from '@/lib/utils/currency';
import { getCurrentSession } from '@/lib/auth/serverSession';
import { getKasPeriod } from '@/lib/data/storeKas';
import { getLembarHistoriByUnit } from '@/lib/data/storeHistoriWarga';
import PortalWargaHistoriClient from '@/components/warga/PortalWargaHistoriClient';
import Link from 'next/link';
import { ShieldCheck, Hammer, Receipt, Building2, UserCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ unit?: string; tab?: string }>;
}

export default async function WargaDashboardPage({ searchParams }: Props) {
  const { unit: unitQuery, tab: tabQuery } = await searchParams;
  const session = await getCurrentSession();
  const activePeriod = getKasPeriod('periode-okt-2026');

  const isPengurus = session?.kategori === 'pengurus';
  const requestedUnitNo = isPengurus && unitQuery ? Number(unitQuery) : session?.no_unit;

  const { unitMeta, iuranHistori, allUnitsSelector } = getLembarHistoriByUnit(
    requestedUnitNo,
    session?.nama
  );

  const saldoKasSaatIni = Number(activePeriod?.saldo_akhir || 9933500);
  const periodeBulan = activePeriod?.bulan || 10;
  const periodeTahun = activePeriod?.tahun || 2026;

  const latestTagihan = iuranHistori[0] || null;
  const namaDisplay =
    unitMeta.nama_warga && unitMeta.nama_warga !== '-'
      ? unitMeta.nama_warga
      : session?.nama || 'Warga RT.03';
  const alamatDisplay = unitMeta.alamat || session?.alamat || 'Perum BPTW Tritih Lor';
  const roleDisplay = session?.role_label || 'Warga Aktif';

  const iuranPokok = Number(latestTagihan?.iuran_pokok ?? 50000);
  const tunggakanLalu = Number(latestTagihan?.tunggakan_bulan_lalu ?? 0);
  const titipanLalu = Number(latestTagihan?.titipan_bulan_lalu ?? 0);
  const totalDenda = Number(latestTagihan?.total_denda ?? 0);
  const totalTagihan = Number(latestTagihan?.total_tagihan ?? 50000);
  const totalTerbayar = Number(latestTagihan?.total_terbayar ?? 0);
  const titipanDepan = Number(latestTagihan?.titipan_depan ?? 0);
  const statusLabel =
    latestTagihan?.status_label ||
    (totalTerbayar >= totalTagihan && totalTagihan > 0 ? 'LUNAS' : 'BELUM LUNAS');
  const isLunas = statusLabel === 'LUNAS' || latestTagihan?.status_bayar === 'lunas';

  return (
    <div className="max-w-lg lg:max-w-5xl mx-auto space-y-6 pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-5 space-y-4">
          {/* CARD PROFIL & KAS RT TERBUKA */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-3xl shadow-lg space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400 font-bold shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-400 truncate">
                    Unit #{unitMeta.no_unit} • {alamatDisplay}
                  </p>
                  <h2 className="text-sm font-bold text-white truncate">{namaDisplay}</h2>
                </div>
              </div>
              <span className="text-[11px] font-medium px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl flex items-center gap-1 shrink-0">
                <UserCheck className="w-3.5 h-3.5" /> {roleDisplay}
              </span>
            </div>

            {/* Transparansi Kas Terbuka */}
            <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] text-slate-400">Total Saldo Kas RT Terbuka:</p>
                <p className="text-xl font-black text-emerald-400">{formatRupiah(saldoKasSaatIni)}</p>
              </div>
              <span className="text-[10px] text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 shrink-0">
                {NAMA_BULAN[periodeBulan]} {periodeTahun}
              </span>
            </div>
          </div>

          {/* QUICK ACTIONS PRESENSI */}
          <div className="grid grid-cols-2 gap-3 print:hidden">
            <Link
              href="/warga/presensi-ronda"
              className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:border-blue-500 hover:shadow-md active:scale-[0.98] transition flex flex-col items-center text-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-105 transition">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-800 mt-2">Presensi Ronda</span>
              <span className="text-[10px] text-slate-400">Selfie Kamera & GPS</span>
            </Link>

            <Link
              href="/warga/presensi-kb"
              className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:border-emerald-500 hover:shadow-md active:scale-[0.98] transition flex flex-col items-center text-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition">
                <Hammer className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-800 mt-2">Kerja Bakti</span>
              <span className="text-[10px] text-slate-400">Scan QR Code Pengurus</span>
            </Link>
          </div>
        </div>

        {/* STATUS TAGIHAN BULANAN KELUARGA */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm sm:text-base font-bold text-slate-800">
                Ringkasan Iuran {NAMA_BULAN[periodeBulan]} {periodeTahun}
              </h3>
            </div>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                isLunas
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {statusLabel}
            </span>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Iuran Pokok RT:</span>
              <span className="font-semibold text-slate-700 font-mono">
                {formatRupiah(iuranPokok)}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Tunggakan Bulan Lalu:</span>
              <span className="font-semibold text-slate-700 font-mono">
                {formatRupiah(tunggakanLalu)}
              </span>
            </div>
            {titipanLalu > 0 && (
              <div className="flex justify-between text-indigo-600">
                <span>Potongan Titipan Lalu:</span>
                <span className="font-semibold font-mono">-{formatRupiah(titipanLalu)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>Denda Absen (Ronda/KB):</span>
              <span className="font-semibold text-slate-700 font-mono">
                {formatRupiah(totalDenda)}
              </span>
            </div>
            <div className="pt-3 border-t flex justify-between items-center text-sm sm:text-base">
              <span className="font-bold text-slate-800">Total Tagihan:</span>
              <span className="font-black text-blue-600 text-base sm:text-lg font-mono">
                {formatRupiah(totalTagihan)}
              </span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span className="font-medium">Sudah Dibayarkan:</span>
              <span className="font-bold font-mono">{formatRupiah(totalTerbayar)}</span>
            </div>
            {titipanDepan > 0 && (
              <div className="flex justify-between text-teal-700 bg-teal-50 px-3 py-2 rounded-xl border border-teal-100">
                <span className="font-semibold">Saldo Titipan Depan (Bergulir):</span>
                <span className="font-bold font-mono">+{formatRupiah(titipanDepan)}</span>
              </div>
            )}
            <p className="text-[11px] sm:text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
              Pembayaran iuran dapat diserahkan langsung secara tunai kepada Bendahara RT (Bp. Nanang Dedi) atau via transfer bank.
            </p>
          </div>
        </div>
      </div>

      {/* 3 LEMBAR INFORMASI HISTORI WARGA (IURAN, RONDA, KERJA BAKTI) */}
      <PortalWargaHistoriClient
        unitMeta={unitMeta}
        iuranHistori={iuranHistori}
        canSwitchUnit={isPengurus}
        allUnitsSelector={allUnitsSelector}
        initialTab={tabQuery}
      />
    </div>
  );
}
