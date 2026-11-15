'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatRupiah } from '@/lib/utils/currency';
import {
  DepositUsageType,
  UnitDepositSummary,
} from '@/lib/data/storeDeposit';
import { submitDepositUsageAction } from '@/app/(dashboard)/warga/dashboard/depositActions';
import {
  Wallet,
  Receipt,
  HeartHandshake,
  Banknote,
  X,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface Props {
  summary: UnitDepositSummary;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Menunggu Persetujuan Bendahara',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  approved: {
    label: 'Disetujui & Dicairkan',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  completed: {
    label: 'Selesai Diproses',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  rejected: {
    label: 'Ditolak Bendahara',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
  },
};

const JENIS_LABEL: Record<DepositUsageType, string> = {
  bayar_iuran: 'Bayar Iuran',
  donasi: 'Donasi Kas RT',
  tarik_tunai: 'Tarik Tunai',
};

export default function WargaDepositActionClient({ summary }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedJenis, setSelectedJenis] = useState<DepositUsageType>('bayar_iuran');
  const [nominal, setNominal] = useState<string>(
    String(Math.min(summary.iuranPokokUnit || 50000, summary.saldoDepositTersedia))
  );
  const [metodePencairan, setMetodePencairan] = useState<'TUNAI' | 'TRANSFER'>('TUNAI');
  const [infoRekening, setInfoRekening] = useState('');
  const [catatan, setCatatan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const openModal = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setSelectedJenis('bayar_iuran');
    const defaultNom =
      summary.sisaTagihanUnit > 0
        ? Math.min(summary.sisaTagihanUnit, summary.saldoDepositTersedia)
        : Math.min(summary.iuranPokokUnit || 50000, summary.saldoDepositTersedia);
    setNominal(String(defaultNom));
    setCatatan('');
    setInfoRekening('');
    setMetodePencairan('TUNAI');
    setIsOpen(true);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const fd = new FormData();
    fd.append('periode_id', summary.periodeId);
    fd.append('no_unit', String(summary.noUnit));
    fd.append('jenis', selectedJenis);
    fd.append('nominal', nominal);
    fd.append('catatan', catatan);
    if (selectedJenis === 'tarik_tunai') {
      fd.append('metode_pencairan', metodePencairan);
      fd.append('info_rekening', infoRekening);
    }

    const res = await submitDepositUsageAction(fd);
    setIsSubmitting(false);

    if (res.success) {
      setIsOpen(false);
      setSuccessMsg(res.message || 'Penggunaan deposit berhasil diproses.');
      router.refresh();
    } else {
      setErrorMsg(res.error || 'Gagal memproses deposit.');
    }
  }

  const maxNominal = summary.saldoDepositTersedia;
  const presets =
    selectedJenis === 'bayar_iuran'
      ? [
          {
            label: `1 Bulan (${formatRupiah(summary.iuranPokokUnit)})`,
            val: summary.iuranPokokUnit,
          },
          {
            label: `2 Bulan (${formatRupiah(summary.iuranPokokUnit * 2)})`,
            val: summary.iuranPokokUnit * 2,
          },
          {
            label: `Semua (${formatRupiah(maxNominal)})`,
            val: maxNominal,
          },
        ].filter((p) => p.val > 0 && p.val <= maxNominal)
      : [
          { label: 'Rp 50.000', val: 50000 },
          { label: 'Rp 100.000', val: 100000 },
          { label: 'Rp 250.000', val: 250000 },
          { label: `Semua (${formatRupiah(maxNominal)})`, val: maxNominal },
        ].filter((p) => p.val > 0 && p.val <= maxNominal);

  return (
    <div className="space-y-3">
      {/* FEEDBACK SUKSES */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2.5 rounded-2xl text-xs flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="font-medium leading-relaxed">{successMsg}</p>
        </div>
      )}

      {/* KOTAK SALDO DEPOSIT & TOMBOL GUNAKAN DEPOSIT */}
      {summary.titipanDepanBruto > 0 && (
        <div className="bg-gradient-to-br from-teal-50 via-emerald-50/70 to-white px-4 py-3.5 rounded-2xl border border-teal-200 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-teal-700" />
                <span className="text-xs font-bold text-teal-900">
                  Saldo Titipan / Deposit Bergulir
                </span>
              </div>
              <p className="text-lg font-black text-teal-700 font-mono">
                +{formatRupiah(summary.saldoDepositTersedia)}
              </p>
              {(summary.pendingTarikTunai > 0 || summary.alokasiIuranDimuka > 0) && (
                <p className="text-[11px] text-teal-700/80">
                  Total tercatat {formatRupiah(summary.titipanDepanBruto)}
                  {summary.alokasiIuranDimuka > 0
                    ? ` • Dialokasikan Iuran ${formatRupiah(summary.alokasiIuranDimuka)}`
                    : ''}
                  {summary.pendingTarikTunai > 0
                    ? ` • Pending Tarik Tunai ${formatRupiah(summary.pendingTarikTunai)}`
                    : ''}
                </p>
              )}
            </div>

            {summary.isEligibleGunakanDeposit && summary.saldoDepositTersedia > 0 && (
              <button
                type="button"
                onClick={openModal}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-bold text-xs shadow-sm shadow-teal-600/20 transition whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gunakan Deposit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {summary.isEligibleGunakanDeposit && summary.saldoDepositTersedia > 0 && (
            <p className="text-[11px] text-teal-800/80 leading-relaxed">
              Karena saldo deposit Anda lebih besar dari tagihan ({formatRupiah(summary.totalTagihanUnit)}), Anda dapat menggunakannya untuk <strong>Bayar Iuran</strong>, <strong>Donasi</strong>, atau <strong>Tarik Tunai</strong>.
            </p>
          )}
        </div>
      )}

      {/* RIWAYAT PENGGUNAAN / PENGAJUAN DEPOSIT UNIT INI */}
      {summary.riwayatUnit.length > 0 && (
        <div className="bg-slate-50/90 rounded-2xl border border-slate-200/80 p-3.5 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Riwayat Penggunaan & Pengajuan Deposit
          </p>
          <div className="space-y-2">
            {summary.riwayatUnit.slice(0, 5).map((r) => {
              const badge = STATUS_BADGE[r.status] || STATUS_BADGE.completed;
              return (
                <div
                  key={r.id}
                  className="bg-white p-2.5 rounded-xl border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-800">
                        {JENIS_LABEL[r.jenis]}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${badge.className}`}
                      >
                        {r.status === 'pending' && <Clock className="w-3 h-3" />}
                        {r.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                        {r.status === 'rejected' && <XCircle className="w-3 h-3" />}
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {r.catatan}
                      {r.info_rekening ? ` • Tujuan: ${r.info_rekening}` : ''}
                    </p>
                    {r.alasan_penolakan && (
                      <p className="text-[11px] text-rose-600 mt-0.5">
                        Alasan penolakan: {r.alasan_penolakan}
                      </p>
                    )}
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <p className="font-mono font-bold text-slate-900">
                      {formatRupiah(r.nominal)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(r.created_at).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL POPUP PILIHAN PENGGUNAAN DEPOSIT */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-slate-100">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-teal-50 text-teal-700 rounded-2xl">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Gunakan Saldo Deposit</h3>
                  <p className="text-xs text-slate-500">
                    Unit #{summary.noUnit} ({summary.alamat}) • Tersedia:{' '}
                    <strong className="text-teal-700 font-mono">
                      {formatRupiah(maxNominal)}
                    </strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Tutup popup deposit"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-3 p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* 3 PILIHAN PENGGUNAAN DEPOSIT */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Pilih Tujuan Penggunaan Deposit:
                </label>

                <div className="grid grid-cols-1 gap-2.5">
                  {/* 1. Bayar Iuran */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedJenis('bayar_iuran');
                      setNominal(
                        String(Math.min(summary.iuranPokokUnit || 50000, maxNominal))
                      );
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition flex items-start gap-3 ${
                      selectedJenis === 'bayar_iuran'
                        ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        selectedJenis === 'bayar_iuran'
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-50 text-blue-600'
                      }`}
                    >
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900">
                        1. Bayar Iuran
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        {summary.sisaTagihanUnit > 0
                          ? `Lunasi sisa tagihan periode ini (${formatRupiah(summary.sisaTagihanUnit)}) secara instan.`
                          : `Tagihan ${summary.periodeNama} sudah lunas — alokasikan untuk pra-bayar iuran bulan mendatang.`}
                      </p>
                    </div>
                  </button>

                  {/* 2. Donasi */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedJenis('donasi');
                      setNominal(String(Math.min(50000, maxNominal)));
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition flex items-start gap-3 ${
                      selectedJenis === 'donasi'
                        ? 'border-violet-600 bg-violet-50/70 ring-2 ring-violet-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        selectedJenis === 'donasi'
                          ? 'bg-violet-600 text-white'
                          : 'bg-violet-50 text-violet-600'
                      }`}
                    >
                      <HeartHandshake className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900">
                        2. Donasi
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Hibahkan sebagian atau seluruh deposit sebagai Donasi Kas RT.03 (langsung tercatat atas nama Anda).
                      </p>
                    </div>
                  </button>

                  {/* 3. Tarik Tunai */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedJenis('tarik_tunai');
                      setNominal(String(maxNominal));
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition flex items-start gap-3 ${
                      selectedJenis === 'tarik_tunai'
                        ? 'border-amber-600 bg-amber-50/70 ring-2 ring-amber-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        selectedJenis === 'tarik_tunai'
                          ? 'bg-amber-600 text-white'
                          : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs sm:text-sm font-bold text-slate-900">
                          3. Tarik Tunai
                        </p>
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                          Persetujuan Bendahara
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Ajukan pengembalian dana deposit ke warga (tunai/transfer). Notifikasi persetujuan otomatis dikirim ke akun Bendahara.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* NOMINAL + QUICK PRESETS */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Nominal Penggunaan Deposit (Maks {formatRupiah(maxNominal)})
                </label>
                <input
                  type="number"
                  min={1000}
                  max={maxNominal}
                  step={500}
                  required
                  value={nominal}
                  onChange={(e) => setNominal(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {presets.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {presets.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setNominal(String(p.val))}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* KHUSUS TARIK TUNAI: METODE PENCAIRAN */}
              {selectedJenis === 'tarik_tunai' && (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-amber-900 mb-1.5">
                      Metode Pencairan Dana:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setMetodePencairan('TUNAI')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                          metodePencairan === 'TUNAI'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        Tunai via Bendahara
                      </button>
                      <button
                        type="button"
                        onClick={() => setMetodePencairan('TRANSFER')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                          metodePencairan === 'TRANSFER'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        Transfer Bank / E-Wallet
                      </button>
                    </div>
                  </div>

                  {metodePencairan === 'TRANSFER' && (
                    <div>
                      <label className="block text-xs font-semibold text-amber-900 mb-1">
                        Nama Bank / No. Rekening / E-Wallet Tujuan
                      </label>
                      <input
                        type="text"
                        required
                        value={infoRekening}
                        onChange={(e) => setInfoRekening(e.target.value)}
                        placeholder="Contoh: BCA 1234567890 a.n. Eva Dwijayadi"
                        className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* CATATAN */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan / Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder={
                    selectedJenis === 'bayar_iuran'
                      ? 'Contoh: Alokasi iuran bulan Nov-Des 2026'
                      : selectedJenis === 'donasi'
                      ? 'Contoh: Donasi kegiatan operasional RT'
                      : 'Contoh: Keperluan pencairan sisa titipan'
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition inline-flex items-center gap-1.5 disabled:opacity-50 ${
                    selectedJenis === 'tarik_tunai'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : selectedJenis === 'donasi'
                      ? 'bg-violet-600 hover:bg-violet-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : selectedJenis === 'tarik_tunai' ? (
                    <span>Kirim Pengajuan ke Bendahara</span>
                  ) : selectedJenis === 'donasi' ? (
                    <span>Konfirmasi Donasi</span>
                  ) : (
                    <span>Gunakan untuk Bayar Iuran</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
