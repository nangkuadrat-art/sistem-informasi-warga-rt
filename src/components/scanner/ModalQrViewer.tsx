'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { QrCode, X } from 'lucide-react';

interface Props {
  qrToken: string;
  judul: string;
}

export default function ModalQrViewer({ qrToken, judul }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (qrToken) {
      QRCode.toDataURL(qrToken, { width: 320, margin: 2 }, (err, url) => {
        if (!err) setQrDataUrl(url);
      });
    }
  }, [qrToken]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition"
      >
        <QrCode className="w-3.5 h-3.5 text-blue-400" />
        Tampilkan QR Presensi
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-slate-800 text-sm">QR Presensi Lokasi</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <p className="text-xs font-semibold text-blue-600">{judul}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Scan kode ini dengan menu presensi di HP warga
              </p>
            </div>

            <div className="flex justify-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
              {qrDataUrl && (
                <img src={qrDataUrl} alt="QR Code Presensi" className="w-64 h-64 rounded-xl" />
              )}
            </div>

            <p className="text-[10px] text-slate-400 font-mono">Token: {qrToken}</p>
          </div>
        </div>
      )}
    </>
  );
}
