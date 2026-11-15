'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  CheckCircle2,
  XCircle,
  Clock,
  Banknote,
  Building2,
  History,
  HeartHandshake,
  Receipt,
  AlertCircle,
} from 'lucide-react';
import type { DepositUsageRecord } from '@/lib/data/storeDeposit';
import { processDepositWithdrawalAction } from '@/app/(dashboard)/admin/kas/actions';

function formatRupiah(nominal: number) {
  return `Rp ${Math.abs(Math.round(nominal)).toLocaleString('id-ID')}`;
}

function formatTanggal(iso: string) {
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function DepositApprovalPanel({
  requests,
  canApprove,
}: {
  requests: DepositUsageRecord[];
  canApprove: boolean;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const pendingList = requests.filter(
    (r) => r.jenis === 'tarik_tunai' && r.status === 'pending'
  );
  const historyList = requests.filter(
    (r) => !(r.jenis === 'tarik_tunai' && r.status === 'pending')
  );

  const handleApprove = async (req: DepositUsageRecord) => {
    setProcessingId(req.id);
    setFeedback(null);
    try {
      const res = await processDepositWithdrawalAction(req.id, 'approve');
      if (!res.success) {
        setFeedback({ type: 'error', text: res.error || 'Gagal menyetujui pencairan.' });
      } else {
        setFeedback({
          type: 'success',
          text: `Pencairan deposit ${formatRupiah(req.nominal)} untuk ${req.nama_warga} (${req.alamat}) telah disetujui dan dicatat di Buku Kas.`,
        });
        router.refresh();
      }
    } catch {
      setFeedback({ type: 'error', text: 'Terjadi kesalahan saat memproses persetujuan.' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSubmit = async (req: DepositUsageRecord) => {
    setProcessingId(req.id);
    setFeedback(null);
    try {
      const res = await processDepositWithdrawalAction(
        req.id,
        'reject',
        rejectReason.trim() || undefined
      );
      if (!res.success) {
        setFeedback({ type: 'error', text: res.error || 'Gagal menolak pengajuan.' });
      } else {
        setFeedback({
          type: 'success',
          text: `Pengajuan tarik tunai ${req.nama_warga} (${req.alamat}) ditolak.`,
        });
        setRejectingId(null);
        setRejectReason('');
        router.refresh();
      }
    } catch {
      setFeedback({ type: 'error', text: 'Terjadi kesalahan saat menolak pengajuan.' });
    } finally {
      setProcessingId(null);
    }
  };

  const renderJenisBadge = (jenis: DepositUsageRecord['jenis']) => {
    if (jenis === 'bayar_iuran') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
          <Receipt className="w-3 h-3" /> Bayar Iuran
        </span>
      );
    }
    if (jenis === 'donasi') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
          <HeartHandshake className="w-3 h-3" /> Donasi
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
        <Banknote className="w-3 h-3" /> Tarik Tunai
      </span>
    );
  };

  const renderStatusBadge = (status: DepositUsageRecord['status']) => {
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <Clock className="w-3 h-3" /> Menunggu Persetujuan
        </span>
      );
    }
    if (status === 'approved' || status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="w-3 h-3" /> {status === 'approved' ? 'Disetujui & Cair' : 'Selesai'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
        <XCircle className="w-3 h-3" /> Ditolak
      </span>
    );
  };

  return (
    <section
      id="persetujuan-deposit"
      className={`rounded-2xl border shadow-sm overflow-hidden ${
        pendingList.length > 0
          ? 'bg-amber-50/40 border-amber-300'
          : 'bg-white border-slate-200'
      }`}
    >
      <div
        className={`px-4 py-3.5 sm:px-5 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
          pendingList.length > 0
            ? 'bg-amber-100/60 border-amber-200'
            : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              pendingList.length > 0
                ? 'bg-amber-500 text-white'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Penggunaan &amp; Persetujuan Pencairan Deposit Warga
              </h2>
              {pendingList.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-600 text-white animate-pulse">
                  {pendingList.length} Menunggu Bendahara
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Pengajuan tarik tunai deposit warga wajib diverifikasi Bendahara sebelum mengurangi saldo Kas RT.
            </p>
          </div>
        </div>

        <div className="inline-flex rounded-xl bg-white p-1 border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Antrean ({pendingList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Riwayat ({historyList.length})
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`mx-4 sm:mx-5 mt-4 p-3 rounded-xl border text-xs font-medium flex items-start gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="p-4 sm:p-5">
        {activeTab === 'pending' ? (
          pendingList.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">
              Tidak ada pengajuan tarik tunai deposit yang menunggu persetujuan Bendahara saat ini.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingList.map((req) => {
                const isBusy = processingId === req.id;
                const isRejecting = rejectingId === req.id;
                return (
                  <div
                    key={req.id}
                    className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900">
                          {req.nama_warga}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">
                          Unit {req.no_unit} &bull; {req.alamat}
                        </span>
                        {renderStatusBadge(req.status)}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span className="font-bold text-amber-700 text-sm">
                          Nominal: {formatRupiah(req.nominal)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          {req.metode_pencairan === 'TRANSFER' ? (
                            <Building2 className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                          Metode: <strong>{req.metode_pencairan || 'TUNAI'}</strong>
                        </span>
                        {req.info_rekening && (
                          <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-medium">
                            Rek: {req.info_rekening}
                          </span>
                        )}
                        <span className="text-slate-400">
                          Diajukan: {formatTanggal(req.created_at)}
                        </span>
                      </div>

                      {req.catatan && (
                        <p className="text-xs text-slate-600 italic">
                          &ldquo;{req.catatan}&rdquo;
                        </p>
                      )}

                      {isRejecting && (
                        <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Alasan penolakan (opsional)..."
                            className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleRejectSubmit(req)}
                              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50"
                            >
                              {isBusy ? 'Memproses...' : 'Konfirmasi Tolak'}
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => {
                                setRejectingId(null);
                                setRejectReason('');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {canApprove ? (
                      !isRejecting && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleApprove(req)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm disabled:opacity-50 transition"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {isBusy ? 'Memproses...' : 'Setujui & Cairkan'}
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => {
                              setRejectingId(req.id);
                              setRejectReason('');
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold disabled:opacity-50 transition"
                          >
                            <XCircle className="w-4 h-4" />
                            Tolak
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg shrink-0">
                        Hanya Bendahara yang dapat menyetujui
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : historyList.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            Belum ada riwayat penggunaan deposit warga.
          </div>
        ) : (
          <div className="space-y-2.5">
            {historyList.map((req) => (
              <div
                key={req.id}
                className="bg-slate-50/70 rounded-xl border border-slate-200 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{req.nama_warga}</span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Unit {req.no_unit} ({req.alamat})
                    </span>
                    {renderJenisBadge(req.jenis)}
                    {renderStatusBadge(req.status)}
                  </div>
                  <p className="text-xs text-slate-600">
                    {req.target_keterangan || req.catatan || 'Penggunaan deposit warga'}
                    {req.alasan_penolakan ? ` — Alasan: ${req.alasan_penolakan}` : ''}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {formatTanggal(req.processed_at || req.created_at)}
                    {req.processed_by ? ` • Oleh ${req.processed_by}` : ''}
                  </p>
                </div>
                <div className="text-sm font-extrabold text-slate-900 shrink-0">
                  {formatRupiah(req.nominal)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
