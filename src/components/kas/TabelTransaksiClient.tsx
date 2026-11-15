'use client';

import React, { useState } from 'react';
import { KasTransaksiItem } from '@/lib/data/storeKas';
import { formatRupiah } from '@/lib/utils/currency';
import ModalEditTransaksi from './ModalEditTransaksi';
import ResponsiveViewToggle, { ResponsiveViewMode } from '@/components/ui/ResponsiveViewToggle';
import { deleteTransaksiKas } from '@/app/(dashboard)/admin/kas/actions';
import {
  Search,
  Filter,
  Pencil,
  Trash2,
  Lock,
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
} from 'lucide-react';

interface Props {
  periodeId: string;
  isClosed: boolean;
  transaksiList: KasTransaksiItem[];
}

export default function TabelTransaksiClient({
  periodeId,
  isClosed,
  transaksiList,
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJenis, setFilterJenis] = useState<'all' | 'masuk' | 'keluar'>('all');
  const [selectedTx, setSelectedTx] = useState<KasTransaksiItem | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ResponsiveViewMode>('auto');

  const cardsClass =
    viewMode === 'auto' ? 'block md:hidden' : viewMode === 'cards' ? 'block' : 'hidden';
  const tableClass =
    viewMode === 'auto' ? 'hidden md:block' : viewMode === 'table' ? 'block' : 'hidden';

  const filtered = (transaksiList || []).filter((t) => {
    const matchesJenis = filterJenis === 'all' || t.jenis === filterJenis;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      t.keterangan.toLowerCase().includes(term) ||
      t.kategori.toLowerCase().includes(term) ||
      t.tanggal_transaksi.includes(term);
    return matchesJenis && matchesSearch;
  });

  const handleDelete = async (txId: string, desc: string) => {
    if (confirm(`Yakin ingin menghapus transaksi:\n"${desc}"?`)) {
      setDeletingId(txId);
      await deleteTransaksiKas(periodeId, txId);
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* SEARCH & FILTER BAR */}
      <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto">
          <button
            onClick={() => setFilterJenis('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterJenis === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({transaksiList.length})
          </button>
          <button
            onClick={() => setFilterJenis('masuk')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 whitespace-nowrap ${
              filterJenis === 'masuk'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" /> Pemasukan
          </button>
          <button
            onClick={() => setFilterJenis('keluar')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 whitespace-nowrap ${
              filterJenis === 'keluar'
                ? 'bg-red-600 text-white'
                : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" /> Pengeluaran
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari uraian transaksi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <ResponsiveViewToggle mode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {/* MOBILE / CARD VIEW */}
      <div className={`${cardsClass} p-3 sm:p-4 space-y-2.5 bg-slate-50/40`}>
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {filtered.map((t, idx) => {
              const isMasuk = t.jenis === 'masuk';
              const isSaldoAwal = t.kategori === 'saldo_awal';
              return (
                <div
                  key={t.id || `tx-card-${idx}`}
                  className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col justify-between gap-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {t.tanggal_transaksi}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase bg-slate-100 text-slate-600">
                          {t.kategori?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800 text-sm mt-1.5 leading-snug">
                        {t.keterangan}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p
                        className={`font-mono text-sm font-black ${
                          isMasuk ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {isMasuk ? `+${formatRupiah(t.nominal)}` : `-${formatRupiah(t.nominal)}`}
                      </p>
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        {isMasuk ? 'Debit (Masuk)' : 'Kredit (Keluar)'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400">No. #{idx + 1}</span>
                    {!isSaldoAwal ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedTx(t);
                            setIsEditOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(t.id, t.keterangan)}
                          disabled={deletingId === t.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono italic">
                        Saldo Awal Otomatis
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-10 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
            Tidak ada transaksi yang cocok dengan pencarian.
          </div>
        )}
      </div>

      {/* TABLE (DESKTOP / MODE TABEL) */}
      <div className={`${tableClass} overflow-x-auto`}>
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 text-xs font-semibold border-b">
              <th className="py-3 px-3 w-12 text-center">No</th>
              <th className="py-3 px-3">Tanggal</th>
              <th className="py-3 px-3">Uraian Transaksi Kas</th>
              <th className="py-3 px-3">Kategori</th>
              <th className="py-3 px-3 text-right">Pemasukan (Debit)</th>
              <th className="py-3 px-3 text-right">Pengeluaran (Kredit)</th>
              <th className="py-3 px-3 text-center w-24">Aksi CRUD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length > 0 ? (
              filtered.map((t, idx) => {
                const isMasuk = t.jenis === 'masuk';
                const isSaldoAwal = t.kategori === 'saldo_awal';

                return (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-2.5 px-3 text-xs font-mono text-slate-400 text-center">
                      {idx + 1}
                    </td>

                    <td className="py-2.5 px-3 text-xs font-medium text-slate-600 font-mono whitespace-nowrap">
                      {t.tanggal_transaksi}
                    </td>

                    <td className="py-2.5 px-3">
                      <p className="font-semibold text-slate-800 text-xs sm:text-sm">
                        {t.keterangan}
                      </p>
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase bg-slate-100 text-slate-600">
                        {t.kategori?.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono text-xs sm:text-sm font-semibold text-emerald-600 whitespace-nowrap">
                      {isMasuk ? formatRupiah(t.nominal) : '-'}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono text-xs sm:text-sm font-semibold text-red-600 whitespace-nowrap">
                      {!isMasuk ? formatRupiah(t.nominal) : '-'}
                    </td>

                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {!isSaldoAwal ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedTx(t);
                              setIsEditOpen(true);
                            }}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Transaksi"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(t.id, t.keterangan)}
                            disabled={deletingId === t.id}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono italic">
                          Saldo Awal
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                  Tidak ada transaksi yang cocok dengan pencarian.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL */}
      {selectedTx && (
        <ModalEditTransaksi
          periodeId={periodeId}
          transaksi={selectedTx}
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setSelectedTx(null);
          }}
        />
      )}
    </div>
  );
}
