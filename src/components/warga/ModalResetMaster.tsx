'use client';

import { useState } from 'react';
import { resetToGoogleSheetsMaster } from '@/app/(dashboard)/admin/warga/actions';
import { RotateCcw, AlertCircle, Loader2, X } from 'lucide-react';

export default function ModalResetMaster() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleReset() {
    setIsLoading(true);
    setErrorMsg(null);

    const result = await resetToGoogleSheetsMaster();
    if (result.success) {
      setIsOpen(false);
    } else {
      setErrorMsg(result.error || 'Gagal mereset data');
    }
    setIsLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2.5 rounded-xl font-medium transition flex items-center gap-1.5"
        title="Kembalikan data ke versi default Google Spreadsheet"
      >
        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
        <span className="hidden md:inline">Reset Master Sheet</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
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
                Kembalikan ke Master Google Sheets?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Tindakan ini akan mengembalikan data seluruh <strong>56 unit rumah dan 132 jiwa warga</strong> sesuai dengan file Google Spreadsheet resmi RT. Perubahan manual yang belum disimpan ke database eksternal akan di-reset.
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
                onClick={handleReset}
                disabled={isLoading}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-amber-500/20"
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Ya, Reset Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
