import { formatRupiah, NAMA_BULAN } from '@/lib/utils/currency';
import { getAllKasPeriods, getKasPeriod } from '@/lib/data/storeKas';
import ClosingHeaderActions from '@/components/closing/ClosingHeaderActions';
import TabelClosingClient from '@/components/closing/TabelClosingClient';
import {
  CalendarCheck,
  Database,
  Lock,
  Calendar,
  ShieldAlert,
  PiggyBank,
  Coins,
  FileSpreadsheet,
} from 'lucide-react';

interface Props {
  searchParams: Promise<{ periode?: string }>;
}

export default async function AdminClosingPage({ searchParams }: Props) {
  const { periode: selectedPeriodId } = await searchParams;
  const allPeriods = getAllKasPeriods();
  const currentPeriod = getKasPeriod(selectedPeriodId);

  if (!currentPeriod) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-600 font-medium">Data periode closing kas belum tersedia.</p>
      </div>
    );
  }

  const isClosed = currentPeriod.status === 'closed';
  const tagihanList: any[] = currentPeriod.tagihan || [];

  const grandTotalTagihan = tagihanList.reduce((acc, curr) => acc + Number(curr.total_tagihan || 0), 0);
  const grandTotalTerbayar = tagihanList.reduce((acc, curr) => acc + Number(curr.total_terbayar || 0), 0);
  const grandTotalIuran = tagihanList.reduce((acc, curr) => acc + Number(curr.iuran_pokok || 0), 0);
  const grandTotalDendaRonda = tagihanList.reduce((acc, curr) => acc + Number(curr.denda_ronda || 0), 0);
  const grandTotalDendaKB = tagihanList.reduce((acc, curr) => acc + Number(curr.denda_kerja_bakti || 0), 0);
  const grandTotalDenda = grandTotalDendaRonda + grandTotalDendaKB;

  // Tunggakan lalu & Titipan lalu
  const grandTotalTunggakanLalu = tagihanList.reduce(
    (acc, curr) => acc + Number(curr.tunggakan_bulan_lalu || 0),
    0
  );
  const grandTotalTitipanLalu = tagihanList.reduce(
    (acc, curr) =>
      acc + Number(curr.titipan_bulan_lalu !== undefined ? curr.titipan_bulan_lalu : (curr.titipan_lalu || 0)),
    0
  );

  // Kurang / Lebih, Donatur, Titipan Depan
  const grandTotalKurangLebih = tagihanList.reduce(
    (acc, curr) => acc + Number(curr.kurang_lebih || 0),
    0
  );
  const grandTotalDonatur = tagihanList.reduce(
    (acc, curr) => acc + Number(curr.donatur || 0),
    0
  );
  const grandTotalTitipanDepan = tagihanList.reduce(
    (acc, curr) => acc + Number(curr.titipan_depan || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Closing Bulanan & Rekapitulasi Tagihan Warga
            </h2>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                isClosed
                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {isClosed ? (
                <Lock className="w-3 h-3 text-slate-500" />
              ) : (
                <CalendarCheck className="w-3 h-3 text-amber-600" />
              )}
              {currentPeriod.nama} ({isClosed ? 'Closing Resmi Ditutup' : 'Bulan Aktif Berjalan'})
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <FileSpreadsheet className="w-3 h-3" />
              Sistem CRUD Terintegrasi & Sinkron Kas
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Audit penutupan kas, rollover akumulasi tunggakan/titipan warga ke bulan berikutnya, serta manajemen CRUD tagihan unit.
          </p>
        </div>
      </div>

      {/* SELECTOR PERIODE CLOSING */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-600 px-2 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-amber-600" />
            Pilih Periode:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {allPeriods.map((p) => {
              const isSelected = p.id === currentPeriod.id;
              return (
                <a
                  key={p.id}
                  href={`/admin/closing?periode=${p.id}`}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-sm'
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
                        ? 'bg-amber-700/60 text-amber-100'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {p.status === 'closed' ? 'Arsip Closing' : 'Berjalan'}
                  </span>
                </a>
              );
            })}
          </div>
        </div>

        <span className="text-xs text-slate-400 self-end sm:self-center">
          Keterhubungan: <strong>September ➔ Oktober 2026</strong>
        </span>
      </div>

      {/* KARTU KETERHUBUNGAN CLOSING BERGULIR (EXPLAINER PANEL) */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white rounded-3xl p-6 shadow-lg shadow-amber-600/20">
        <div className="flex items-start justify-between flex-col lg:flex-row gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 bg-white/20 rounded-lg">
                {isClosed ? 'Arsip Closing Terverifikasi' : 'Bulan Aktif Berjalan'}
              </span>
              <span className="text-xs font-semibold text-amber-200">
                Bulan {NAMA_BULAN[currentPeriod.bulan]} {currentPeriod.tahun}
              </span>
            </div>

            <h3 className="text-2xl font-black">
              {isClosed
                ? `Penutupan Kas September 2026 (Saldo Bergulir Rp 8.902.500)`
                : `Pencatatan Kas Oktober 2026 (Saldo Berjalan Rp 9.933.500)`}
            </h3>

            <p className="text-amber-100 text-xs leading-relaxed">
              {isClosed ? (
                <>
                  Buku kas September 2026 telah ditutup resmi (Closing). Total penerimaan kas adalah{' '}
                  <strong>Rp 8.182.000</strong> (Iuran Warga <strong>Rp 4.747.000</strong> + Donatur Kas{' '}
                  <strong>Rp 3.435.000</strong>). Total pengeluaran operasional <strong>Rp 4.814.000</strong>.
                  Sisa saldo akhir <strong>Rp 8.902.500</strong>, sisa tunggakan bergulir <strong>Rp 2.792.000</strong>, 
                  dan saldo deposit warga <strong>Rp 603.000</strong> (Hadi Satriyo Rp 13k, Eva Dwijayadi Rp 590k) otomatis dialokasikan menjadi saldo awal dan komponen tagihan bulan Oktober 2026.
                </>
              ) : (
                <>
                  Periode Oktober 2026 menerima saldo awal <strong>Rp 8.902.500</strong> dari closing
                  September 2026. Total tagihan tercatat <strong>{formatRupiah(grandTotalTagihan)}</strong> dengan 
                  realisasi kas masuk <strong>{formatRupiah(grandTotalTerbayar)}</strong>. Menutup buku bulan ini
                  akan mengunci kas Oktober dan menggulirkan saldo akhir <strong>Rp 9.933.500</strong> ke November 2026.
                </>
              )}
            </p>
          </div>

          {/* ACTION BUTTONS (CLOSING, RE-OPEN, & WA BROADCAST) */}
          <ClosingHeaderActions
            periodeId={currentPeriod.id}
            isClosed={isClosed}
            periodeNama={currentPeriod.nama}
          />
        </div>
      </div>

      {/* METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Target Total Tagihan</p>
          <p className="text-lg sm:text-xl font-bold text-slate-800 mt-1">{formatRupiah(grandTotalTagihan)}</p>
          <span className="text-[10px] text-slate-400">
            Iuran + Denda + Tunggakan - Titipan
          </span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-semibold text-emerald-600 uppercase">Realisasi Penerimaan</p>
          <p className="text-lg sm:text-xl font-bold text-emerald-600 mt-1">{formatRupiah(grandTotalTerbayar)}</p>
          <span className="text-[10px] text-emerald-600/70">
            {currentPeriod.bulan === 9 ? 'Iuran warga terbayar' : 'Kas masuk Oktober'}
          </span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between gap-1 flex-wrap">
            <p className="text-[11px] font-semibold text-blue-600 uppercase">Tunggakan Lalu</p>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
              Titipan: {formatRupiah(grandTotalTitipanLalu)}
            </span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-blue-700 mt-1">{formatRupiah(grandTotalTunggakanLalu)}</p>
          <span className="text-[10px] text-blue-600/70">
            Saldo akumulasi belum lunas
          </span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-amber-600 uppercase">Denda Ronda & KB</p>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-amber-700 mt-1">{formatRupiah(grandTotalDenda)}</p>
          <span className="text-[10px] text-amber-700/80 flex items-center gap-1 mt-0.5 flex-wrap">
            Ronda: <strong>{formatRupiah(grandTotalDendaRonda)}</strong> • KB: <strong>{formatRupiah(grandTotalDendaKB)}</strong>
          </span>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-purple-600 uppercase">
              {currentPeriod.bulan === 9 ? 'Donatur & Titipan' : 'Titipan Bergulir'}
            </p>
            <Coins className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl font-bold text-purple-700 mt-1">
            {currentPeriod.bulan === 9 ? formatRupiah(grandTotalDonatur) : formatRupiah(grandTotalTitipanDepan)}
          </p>
          <span className="text-[10px] text-purple-600/80">
            {currentPeriod.bulan === 9
              ? `Donatur: ${formatRupiah(grandTotalDonatur)} • Depan: ${formatRupiah(grandTotalTitipanDepan)}`
              : `Deposit Bergulir: ${formatRupiah(grandTotalTitipanDepan)}`}
          </span>
        </div>
      </div>

      {/* RINCIAN TAGIHAN 56 UNIT CLIENT (FULL CRUD) */}
      <TabelClosingClient
        periodeId={currentPeriod.id}
        isClosed={isClosed}
        periodeBulan={currentPeriod.bulan}
        tagihanList={tagihanList}
      />
    </div>
  );
}
