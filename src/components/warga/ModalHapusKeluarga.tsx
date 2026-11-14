'use client';

import { useState } from 'react';
import { deleteKeluarga } from '@/app/(dashboard)/admin/warga/actions';
import { Trash2, AlertTriangle, Loader2, X } from 'lucide-react';

interface ModalHapusKeluargaProps {
  keluarga: {
    id: string;
    nama_kepala_keluarga: string;
    blok_rumah: string;
    nomor_rumah: string;
    warga?: any[];
  };
}

export default function ModalHapusKeluarga({ keluarga }: ModalHapusKeluargaProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleDelete() {
    setIsLoading(true);
    setErrorMsg(null);

    const result = await deleteKeluarga(keluarga.id);
    if (result.success) {
      setIsOpen(false);
    } else {
      setErrorMsg(result.error || 'Gagal menghapus unit');
    }
    setIsLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
        title="Hapus Rumah Tangga"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3">
              <h3 className="text-base font-bold text-slate-800">
                Hapus Data Rumah Tangga?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Anda akan menghapus data rumah tangga{' '}
                <strong className="text-slate-800">
                  Blok {keluarga.blok_rumah} No. {keluarga.nomor_rumah} (
                  {keluarga.nama_kepala_keluarga})
                </strong>
                {keluarga.warga && keluarga.warga.length > 0 && (
                  <span>
                    {' '}beserta seluruh <strong>{keluarga.warga.length} data anggota keluarga</strong> di dalamnya
                  </span>
                )}
                . Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            {errorMsg && (
              <div className="mt-3 p-2.5 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200">
                {errorMsg}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-red-500/20"
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
