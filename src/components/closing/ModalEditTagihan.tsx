'use client';

import React, { useState } from 'react';
import { formatRupiah } from '@/lib/utils/currency';
import { updateTagihanWargaAction } from '@/app/(dashboard)/admin/closing/actions';
import { Settings, X, Loader2, Save } from 'lucide-react';

interface Props {
  periodeId: string;
  tagihan: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function ModalEditTagihan({
  periodeId,
  tagihan,
  isOpen,
  onClose,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // States for live calculation
  const [iuran, setIuran] = useState<number>(Number(tagihan.iuran_pokok || 0));
  const [ronda, setRonda] = useState<number>(Number(tagihan.denda_ronda || 0));
  const [kb, setKb] = useState<number>(Number(tagihan.denda_kerja_bakti || 0));
  const [tunggakan, setTunggakan] = useState<number>(Number(tagihan.tunggakan_bulan_lalu || 0));
  const [titipanLalu, setTitipanLalu] = useState<number>(Number(tagihan.titipan_bulan_lalu || 0));
  const [bayar, setBayar] = useState<number>(Number(tagihan.total_terbayar || 0));
  const [donatur, setDonatur] = useState<number>(Number(tagihan.donatur || 0));
  const [titipanDepan, setTitipanDepan] = useState<number>(Number(tagihan.titipan_depan || 0));
  const [ket, setKet] = useState<string>(tagihan.keterangan || '');

  if (!isOpen) return null;

  const totalDendaCalc = ronda + kb;
  const totalTagihanCalc = Math.max(0, iuran + totalDendaCalc + tunggakan - titipanLalu);
  const kurangLebihCalc = bayar - totalTagihanCalc;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('iuran_pokok', String(iuran));
    formData.append('denda_ronda', String(ronda));
    formData.append('denda_kerja_bakti', String(kb));
    formData.append('tunggakan_bulan_lalu', String(tunggakan));
    formData.append('titipan_bulan_lalu', String(titipanLalu));
    formData.append('donatur', String(donatur));
    formData.append('titipan_depan', String(titipanDepan));
    formData.append('total_terbayar', String(bayar));
    formData.append('keterangan', ket);

    const res = await updateTagihanWargaAction(periodeId, tagihan.id, formData);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'Gagal menyimpan perubahan tagihan');
    }
    setIsLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl p-6 shadow-2xl border border-slate-100 my-6">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Edit Komponen Tagihan & Status Unit
              </h3>
              <p className="text-xs text-slate-400">
                Unit {tagihan.no_unit}: {tagihan.nama_warga} ({tagihan.alamat})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200">
            {errorMsg}
          </div>
        )}

        {/* LIVE CALCULATION SUMMARY BANNER */}
        <div className="my-4 p-3.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Total Tagihan:</span>
            <p className="text-base font-black text-amber-400">{formatRupiah(totalTagihanCalc)}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Total Bayar:</span>
            <p className="text-base font-black text-emerald-400">{formatRupiah(bayar)}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Kurang / Lebih:</span>
            <p
              className={`text-base font-black ${
                kurangLebihCalc < 0
                  ? 'text-red-400'
                  : kurangLebihCalc > 0
                  ? 'text-cyan-400'
                  : 'text-slate-300'
              }`}
            >
              {formatRupiah(kurangLebihCalc)}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* IURAN POKOK */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Iuran Pokok Bulanan (Rp)
              </label>
              <input
                type="number"
                value={iuran}
                onChange={(e) => setIuran(Number(e.target.value))}
                min="0"
                className="w-full px-3 py-2 border rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* TUNGAHAN LALU */}
            <div>
              <label className="block text-xs font-semibold text-blue-700 mb-1">
                Tunggakan Bulan Lalu (Rp)
              </label>
              <input
                type="number"
                value={tunggakan}
                onChange={(e) => setTunggakan(Number(e.target.value))}
                min="0"
                className="w-full px-3 py-2 border border-blue-200 bg-blue-50/30 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* DENDA RONDA */}
            <div>
              <label className="block text-xs font-semibold text-rose-700 mb-1">
                Denda Ronda (Rp)
              </label>
              <input
                type="number"
                value={ronda}
                onChange={(e) => setRonda(Number(e.target.value))}
                min="0"
                className="w-full px-3 py-2 border border-rose-200 bg-rose-50/30 rounded-xl font-mono text-xs focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>

            {/* DENDA KERJA BAKTI */}
            <div>
              <label className="block text-xs font-semibold text-amber-700 mb-1">
                Denda Kerja Bakti (Rp)
              </label>
              <input
                type="number"
                value={kb}
                onChange={(e) => setKb(Number(e.target.value))}
                min="0"
                className="w-full px-3 py-2 border border-amber-200 bg-amber-50/30 rounded-xl font-mono text-xs focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            {/* TITIPAN LALU / DEPOSIT */}
            <div>
              <label className="block text-xs font-semibold text-indigo-700 mb-1">
                Titipan Lalu / Deposit (Pengurang) (Rp)
              </label>
              <input
                type="number"
                value={titipanLalu}
                onChange={(e) => setTitipanLalu(Number(e.target.value))}
                min="0"
                className="w-full px-3 py-2 border border-indigo-200 bg-indigo-50/30 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* TOTAL TERBAYAR */}
            <div>
              <label className="block text-xs font-semibold text-emerald-700 mb-1">
                Total Terbayar (Realisasi Kas) (Rp)
              </label>
              <input
                type="number"
                value={bayar}
                onChange={(e) => setBayar(Number(e.target.value))}
                min="0"
                className="w-full px-3 py-2 border border-emerald-200 bg-emerald-50/30 rounded-xl font-mono text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* DONATUR KAS */}
            <div>
              <label className="block text-xs font-semibold text-purple-700 mb-1">
                Donatur Kas RT (Rp)
              </label>
              <input
                type="number"
                value={donatur}
                onChange={(e) => setDonatur(Number(e.target.value))}
                min="0"
                placeholder="0"
                className="w-full px-3 py-2 border border-purple-200 bg-purple-50/30 rounded-xl font-mono text-xs focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            {/* TITIPAN DEPAN (ROLLOVER KE DEPAN) */}
            <div>
              <label className="block text-xs font-semibold text-teal-700 mb-1">
                Titipan Depan (Deposit Bergulir) (Rp)
              </label>
              <input
                type="number"
                value={titipanDepan}
                onChange={(e) => setTitipanDepan(Number(e.target.value))}
                min="0"
                placeholder="0"
                className="w-full px-3 py-2 border border-teal-200 bg-teal-50/30 rounded-xl font-mono text-xs focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          {/* KETERANGAN KHUSUS */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Keterangan / Catatan Audit
            </label>
            <input
              type="text"
              value={ket}
              onChange={(e) => setKet(e.target.value)}
              placeholder="Contoh: Sisa tagihan Rp 65.000 / Pelunasan rapel / Titipan bergulir"
              className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" /> Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
