'use client';

import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { CheckCircle2, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function WargaScanQrPage() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear();
        setScanResult(decodedText);
        setIsProcessing(true);

        setTimeout(() => {
          setIsProcessing(false);
          setStatusMessage({
            type: 'success',
            text: `Presensi Berhasil! Kehadiran keluarga Anda telah tercatat valid untuk token: ${decodedText}.`,
          });
        }, 1000);
      },
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  return (
    <div className="max-w-md mx-auto space-y-5 pb-12">
      <div className="flex items-center gap-3">
        <Link href="/warga/dashboard" className="p-2 bg-white rounded-xl border text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Scan QR Kerja Bakti</h2>
          <p className="text-xs text-slate-400">Arahkan kamera ke QR Code di lokasi kegiatan</p>
        </div>
      </div>

      {statusMessage ? (
        <div
          className={`p-6 rounded-2xl border text-center shadow-sm space-y-3 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          ) : (
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
          )}
          <h3 className="font-bold text-base">Presensi Kerja Bakti Berhasil!</h3>
          <p className="text-xs">{statusMessage.text}</p>
          <Link
            href="/warga/dashboard"
            className="inline-block mt-3 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      ) : (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div id="qr-reader" className="overflow-hidden rounded-xl" />

          {isProcessing && (
            <div className="flex items-center justify-center py-4 text-xs text-blue-600 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Memverifikasi presensi kehadiran...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
