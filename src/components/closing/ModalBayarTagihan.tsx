'use client';

import React, { useState } from 'react';
import { formatRupiah } from '@/lib/utils/currency';
import { bayarTagihanAction } from '@/app/(dashboard)/admin/closing/actions';
import { Banknote, X, Loader2, CheckCircle2 } from 'lucide-react';

interface Props {
  periodeId: string;
  tagihan: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function ModalBayarTagihan({
  periodeId,
  tagihan,
  isOpen,
  onClose,
}: Props) {
  const [nominal, setNominal] = useState<number>(() => {
    const sisa = Math.max(0, Number(tagihan.total_tagihan || 0) - Number(tagihan.total_terbayar || 0));
    return sisa;
  });
  const [metode, setMetode] = useState('TUNAI');
  const [autoKas, setAutoKas] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalTagihan = Number(tagihan.total_tagihan || 0);
  const totalTerbayar = Number(tagihan.total_terbayar || 0);
  const sisaTagihan = Math.max(0, totalTagihan - totalTerbayar);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('nominal_bayar', String(nominal));
    formData.append('metode_bayar', metode);
    formData.append('auto_kas', autoKas ? 'true' : 'false');

    const res = await bayarTagihanAction(periodeId, tagihan.id, formData);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'Gagal memproses pembayaran');
    }
    setIsLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-slate-100">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Catat Pembayaran Warga</h3>
              <p className="text-xs text-slate-400">
                {tagihan.nama_warga} ({tagihan.alamat})
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

        {/* INFO TAGIHAN RINGKAS */}
        <div className="my-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Total Tagihan:</span>
            <span className="font-bold text-slate-900">{formatRupiah(totalTagihan)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Sudah Terbayar:</span>
            <span className="font-medium text-emerald-600">{formatRupiah(totalTerbayar)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1.5 text-sm">
            <span className="font-bold text-slate-700">Sisa Tagihan:</span>
            <span className="font-black text-red-600">{formatRupiah(sisaTagihan)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-600">
                Nominal Bayar (Rupiah)
              </label>
              <button
                type="button"
                onClick={() => setNominal(sisaTagihan)}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
              >
                Bayar Lunas ({formatRupiah(sisaTagihan)})
              </button>
            </div>
            <input
              type="number"
              value={nominal}
              onChange={(e) => setNominal(Number(e.target.value))}
              min="1000"
              required
              className="w-full px-3 py-2 border rounded-xl text-sm font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Metode Pembayaran
            </label>
            <select
              value={metode}
              onChange={(e) => setMetode(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="TUNAI">Tunai / Cash ke Pengurus</option>
              <option value="TRANSFER">Transfer Rekening Kas RT</option>
              <option value="QRIS">QRIS / E-Wallet</option>
            </select>
          </div>

          <div className="flex items-center gap-2 p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 text-xs text-slate-700">
            <input
              type="checkbox"
              id="autoKas"
              checked={autoKas}
              onChange={(e) => setAutoKas(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <label htmlFor="autoKas" className="cursor-pointer">
              <strong>Sinkron ke Buku Kas:</strong> Otomatis catat pemasukan kas iuran warga pada buku kas periode ini.
            </label>
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
              disabled={isLoading || nominal <= 0}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Memproses...
                </>
              ) : (
                'Simpan Pembayaran'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
