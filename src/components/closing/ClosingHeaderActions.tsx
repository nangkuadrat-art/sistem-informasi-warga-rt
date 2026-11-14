'use client';

import React, { useState } from 'react';
import { submitClosingBulanan, reopenClosingBulanan } from '@/app/(dashboard)/admin/closing/actions';
import { broadcastAllTagihanWA } from '@/app/(dashboard)/admin/closing/broadcastActions';
import {
  CalendarCheck,
  MessageSquareText,
  Lock,
  Unlock,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';

interface Props {
  periodeId: string;
  isClosed: boolean;
  periodeNama: string;
}

export default function ClosingHeaderActions({
  periodeId,
  isClosed,
  periodeNama,
}: Props) {
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [customCatatan, setCustomCatatan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [waSending, setWaSending] = useState(false);

  const handleClosingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await submitClosingBulanan(periodeId, customCatatan);
    setIsLoading(false);
    setIsClosingModalOpen(false);
  };

  const handleReopenSubmit = async () => {
    setIsLoading(true);
    await reopenClosingBulanan(periodeId);
    setIsLoading(false);
    setIsReopenModalOpen(false);
  };

  const handleBroadcastWA = async () => {
    setWaSending(true);
    await broadcastAllTagihanWA(periodeId);
    setWaSending(false);
    alert('Permintaan kirim tagihan WhatsApp telah diproses via Fonnte Gateway!');
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full lg:w-auto">
        {!isClosed ? (
          <>
            <button
              onClick={() => setIsClosingModalOpen(true)}
              className="w-full sm:w-auto bg-white text-slate-900 hover:bg-slate-100 font-bold px-5 py-2.5 rounded-xl shadow-md text-xs sm:text-sm transition flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <CalendarCheck className="w-4 h-4 text-amber-600" />
              Tutup Buku & Rollover
            </button>

            <button
              onClick={handleBroadcastWA}
              disabled={waSending}
              className="w-full sm:w-auto bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {waSending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-300" />
              ) : (
                <MessageSquareText className="w-3.5 h-3.5 text-emerald-300" />
              )}
              Kirim Tagihan WA
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs bg-black/20 text-white px-3 py-2 rounded-xl flex items-center gap-1.5 border border-white/10">
              <Lock className="w-3.5 h-3.5 text-amber-300" /> Buku Telah Ditutup
            </span>

            <button
              onClick={() => setIsReopenModalOpen(true)}
              className="bg-white/20 hover:bg-white/30 text-white font-semibold px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 whitespace-nowrap border border-white/20"
              title="Buka kembali untuk koreksi transaksi/tagihan"
            >
              <Unlock className="w-3.5 h-3.5 text-amber-300" /> Buka Kembali Buku
            </button>
          </div>
        )}
      </div>

      {/* MODAL TUTUP BUKU / CLOSING */}
      {isClosingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 text-slate-800">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Konfirmasi Closing Bulanan</h3>
                  <p className="text-xs text-slate-400">Periode: {periodeNama}</p>
                </div>
              </div>
              <button
                onClick={() => setIsClosingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 text-xs text-slate-600 space-y-2 bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200/80 leading-relaxed">
              <p className="font-bold text-amber-900 flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-amber-600" /> Alur Rollover Otomatis:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-700">
                <li>Saldo akhir kas akan digulirkan menjadi <strong>Saldo Awal</strong> bulan berikutnya.</li>
                <li>Warga yang kurang bayar akan dialokasikan menjadi <strong>Tunggakan Lalu</strong>.</li>
                <li>Warga yang memiliki kelebihan/deposit akan dialokasikan menjadi <strong>Titipan Lalu</strong>.</li>
                <li>Status periode akan terkunci (dapat dibuka kembali kapan saja jika perlu koreksi).</li>
              </ul>
            </div>

            <form onSubmit={handleClosingSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Closing / Berita Acara (Opsional)
                </label>
                <textarea
                  value={customCatatan}
                  onChange={(e) => setCustomCatatan(e.target.value)}
                  placeholder="Contoh: Tutup buku kas resmi telah disetujui dalam rapat pengurus..."
                  rows={3}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsClosingModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md transition flex items-center gap-1.5"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Memproses...
                    </>
                  ) : (
                    'Ya, Tutup Buku Sekarang'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BUKA KEMBALI BUKU KAS (RE-OPEN) */}
      {isReopenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 text-slate-800">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Unlock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Buka Kembali Buku Kas</h3>
                  <p className="text-xs text-slate-400">Periode: {periodeNama}</p>
                </div>
              </div>
              <button
                onClick={() => setIsReopenModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="my-4 text-xs text-slate-600 leading-relaxed bg-blue-50/50 p-3.5 rounded-2xl border border-blue-200">
              Membuka kembali buku kas akan mengaktifkan kembali form mutasi kas dan rincian pembayaran warga untuk periode <strong>{periodeNama}</strong> sehingga Anda dapat melakukan koreksi data, penambahan transaksi, atau revisi iuran.
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsReopenModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={handleReopenSubmit}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md transition flex items-center gap-1.5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Membuka...
                  </>
                ) : (
                  'Buka Kembali Buku'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
