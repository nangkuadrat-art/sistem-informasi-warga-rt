'use client';

import React, { useState } from 'react';
import { createTransaksiKas } from '@/app/(dashboard)/admin/kas/actions';
import { PEMASUKAN_CATEGORIES, PENGELUARAN_CATEGORIES } from '@/lib/data/kasCategories';
import { PlusCircle, X, Loader2 } from 'lucide-react';

interface Props {
  periodeId: string;
}

export default function ModalTambahTransaksi({ periodeId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [jenis, setJenis] = useState<'masuk' | 'keluar'>('keluar');
  const [kategori, setKategori] = useState<string>('operasional');

  const handleJenisChange = (val: 'masuk' | 'keluar') => {
    setJenis(val);
    setKategori(val === 'masuk' ? 'iuran_warga' : 'operasional');
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    formData.append('periode_id', periodeId);

    const res = await createTransaksiKas(formData);
    if (res.success) {
      setIsOpen(false);
    } else {
      setErrorMsg(res.error || 'Gagal menyimpan transaksi');
    }
    setIsLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition shadow-sm shadow-emerald-500/20 whitespace-nowrap"
      >
        <PlusCircle className="w-4 h-4" />
        Catat Transaksi Kas
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Catat Transaksi Kas Baru</h3>
                  <p className="text-xs text-slate-400">Periode: {periodeId}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
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
                    onChange={(e) => handleJenisChange(e.target.value as 'masuk' | 'keluar')}
                    required
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="keluar">Pengeluaran (- Kredit)</option>
                    <option value="masuk">Pemasukan (+ Debit)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {jenis === 'masuk' ? 'Sumber / Kategori Pemasukan' : 'Kategori Pengeluaran'}
                  </label>
                  <select
                    name="kategori"
                    required
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {(jenis === 'masuk' ? PEMASUKAN_CATEGORIES : PENGELUARAN_CATEGORIES).map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
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
                  min="500"
                  required
                  placeholder="Contoh: 150000"
                  className="w-full px-3 py-2 border rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Tanggal Transaksi
                </label>
                <input
                  type="date"
                  name="tanggal_transaksi"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Uraian / Keterangan Transaksi
                </label>
                <textarea
                  name="keterangan"
                  required
                  rows={3}
                  placeholder="Contoh: Pembelian token listrik pos ronda / Pembayaran sampah Mas Bekti"
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    'Simpan Transaksi'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
