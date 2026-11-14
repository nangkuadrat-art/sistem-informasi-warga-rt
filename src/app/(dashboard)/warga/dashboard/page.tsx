import { createClient } from '@/lib/supabase/server';
import { formatRupiah, NAMA_BULAN } from '@/lib/utils/currency';
import { MASTER_KAS_SUMMARY, MASTER_UNITS_56 } from '@/lib/data/masterDataGoogleSheets';
import Link from 'next/link';
import { ShieldCheck, Hammer, Receipt, Building2, UserCheck, Calendar } from 'lucide-react';

export default async function WargaDashboardPage() {
  let saldoKasSaatIni = MASTER_KAS_SUMMARY.saldoAkhir; // Rp 9.933.500
  let periodeAktif: any = { bulan: MASTER_KAS_SUMMARY.bulan, tahun: MASTER_KAS_SUMMARY.tahun };
  
  // Sample tagihan warga contoh (misal Bp. Hardi Supangat / Bp. Tito)
  let tagihanKeluarga: any = {
    nama_kepala: 'Warga RT.03',
    alamat: 'Perum BPTW Tritih Lor',
    iuran_pokok: 50000,
    tunggakan_bulan_lalu: 0,
    total_denda: 0,
    total_tagihan: 50000,
    total_terbayar: 0,
    status_bayar: 'belum_bayar',
  };

  try {
    const supabase = await createClient();
    const { data: p } = await supabase
      .from('periode_buku')
      .select('*')
      .eq('status', 'open')
      .order('tahun', { ascending: false })
      .order('bulan', { ascending: false })
      .limit(1)
      .single();

    if (p) {
      periodeAktif = p;
      const { data: tx } = await supabase
        .from('transaksi_kas')
        .select('jenis, nominal')
        .eq('periode_id', p.id);

      const masuk = tx?.filter((t) => t.jenis === 'masuk').reduce((acc, c) => acc + Number(c.nominal), 0) || 0;
      const keluar = tx?.filter((t) => t.jenis === 'keluar').reduce((acc, c) => acc + Number(c.nominal), 0) || 0;
      saldoKasSaatIni = Number(p.saldo_awal) + masuk - keluar;
    }
  } catch (e) {
    // Graceful fallback
  }

  return (
    <div className="max-w-md mx-auto space-y-5 pb-16">
      {/* CARD PROFIL & KAS RT TERBUKA */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-3xl shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400 font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Portal Layanan Warga</p>
              <h2 className="text-sm font-bold text-white">RT.03 RW.14 Tritih Lor</h2>
            </div>
          </div>
          <span className="text-[11px] font-medium px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" /> Warga Aktif
          </span>
        </div>

        {/* Transparansi Kas Terbuka */}
        <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400">Total Saldo Kas RT Terbuka:</p>
            <p className="text-xl font-black text-emerald-400">{formatRupiah(saldoKasSaatIni)}</p>
          </div>
          <span className="text-[10px] text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
            {NAMA_BULAN[periodeAktif.bulan]} {periodeAktif.tahun}
          </span>
        </div>
      </div>

      {/* QUICK ACTIONS PRESENSI */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/warga/presensi-ronda"
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:border-blue-500 hover:shadow-md transition flex flex-col items-center text-center group"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-105 transition">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-slate-800 mt-2">Presensi Ronda</span>
          <span className="text-[10px] text-slate-400">Selfie Kamera & GPS</span>
        </Link>

        <Link
          href="/warga/presensi-kb"
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:border-emerald-500 hover:shadow-md transition flex flex-col items-center text-center group"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition">
            <Hammer className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-slate-800 mt-2">Kerja Bakti</span>
          <span className="text-[10px] text-slate-400">Scan QR Code Pengurus</span>
        </Link>
      </div>

      {/* STATUS TAGIHAN BULANAN KELUARGA */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">Iuran Warga Bulan Ini</h3>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-amber-50 text-amber-700 border border-amber-200">
            {tagihanKeluarga.status_bayar.replace('_', ' ')}
          </span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>Iuran Pokok RT:</span>
            <span className="font-semibold text-slate-700">
              {formatRupiah(tagihanKeluarga.iuran_pokok)}
            </span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Tunggakan Bulan Lalu:</span>
            <span className="font-semibold text-slate-700">
              {formatRupiah(tagihanKeluarga.tunggakan_bulan_lalu)}
            </span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Denda Absen (Ronda/KB):</span>
            <span className="font-semibold text-slate-700">
              {formatRupiah(tagihanKeluarga.total_denda)}
            </span>
          </div>
          <div className="pt-2 border-t flex justify-between items-center text-sm">
            <span className="font-bold text-slate-800">Total Tagihan:</span>
            <span className="font-black text-blue-600 text-base">
              {formatRupiah(tagihanKeluarga.total_tagihan)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            Pembayaran iuran dapat diserahkan langsung secara tunai kepada Bendahara RT (Bp. Nanang Dedi) atau via transfer bank.
          </p>
        </div>
      </div>
    </div>
  );
}
