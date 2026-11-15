'use client';

import React, { useState, useEffect } from 'react';
import { KasTransaksiItem } from '@/lib/data/storeKas';
import { PEMASUKAN_CATEGORIES, PENGELUARAN_CATEGORIES } from '@/lib/data/kasCategories';
import { updateTransaksiKas } from '@/app/(dashboard)/admin/kas/actions';
import { Pencil, X, Loader2 } from 'lucide-react';

interface Props {
  periodeId: string;
  transaksi: KasTransaksiItem;
  isOpen: boolean;
  onClose: () => void;
}

export default function ModalEditTransaksi({ periodeId, transaksi, isOpen, onClose }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [jenis, setJenis] = useState<'masuk' | 'keluar'>(transaksi.jenis);
  const [kategori, setKategori] = useState<string>(transaksi.kategori);

  useEffect(() => {
    setJenis(transaksi.jenis);
    setKategori(transaksi.kategori);
  }, [transaksi]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    formData.append('periode_id', periodeId);
    formData.append('tx_id', transaksi.id);

    const res = await updateTransaksiKas(formData);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'Gagal memperbarui transaksi');
    }
    setIsLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-100">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Edit Mutasi Transaksi Kas</h3>
              <p className="text-xs text-slate-400">ID: {transaksi.id}</p>
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Jenis Transaksi
              </label>
              <select
                name="jenis"
                value={jenis}
                onChange={(e) => {
                  const val = e.target.value as 'masuk' | 'keluar';
                  setJenis(val);
                  setKategori(val === 'masuk' ? 'iuran_warga' : 'operasional');
                }}
                required
                className="w-full px-3 py-2 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="masuk">Pemasukan (+ Debit)</option>
                <option value="keluar">Pengeluaran (- Kredit)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {jenis === 'masuk' ? 'Sumber / Kategori Pemasukan' : 'Kategori Pengeluaran'}
              </label>
              <select
                name="kategori"
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {(jenis === 'masuk' ? PEMASUKAN_CATEGORIES : PENGELUARAN_CATEGORIES).map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
                {kategori === 'saldo_awal' && <option value="saldo_awal">Saldo Awal</option>}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Nominal (Rupiah)
            </label>
            <input
              type="number"
              name="nominal"
              defaultValue={transaksi.nominal}
              min="0"
              required
              className="w-full px-3 py-2 border rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Tanggal Transaksi
            </label>
            <input
              type="date"
              name="tanggal_transaksi"
              defaultValue={transaksi.tanggal_transaksi}
              required
              className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Uraian / Keterangan Transaksi
            </label>
            <textarea
              name="keterangan"
              defaultValue={transaksi.keterangan}
              required
              rows={3}
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
                'Simpan Perubahan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
