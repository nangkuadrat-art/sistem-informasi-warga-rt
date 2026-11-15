export type PemasukanGroup = 'iuran_warga' | 'donasi' | 'masukan_lainnya';

export interface KasTransaksiRincian {
  iuran_pokok?: number;
  tunggakan?: number;
  denda_ronda?: number;
  denda_kb?: number;
  titipan?: number;
  donasi?: number;
  lainnya?: number;
}

export interface KasItemLike {
  jenis: 'masuk' | 'keluar';
  kategori: string;
  nominal: number;
  sub_kategori?: string;
  rincian?: KasTransaksiRincian;
}

export interface PemasukanBreakdownSummary {
  totalPemasukan: number;
  iuranWarga: {
    total: number;
    count: number;
    iuranPokok: number;
    tunggakan: number;
  };
  donasi: {
    total: number;
    count: number;
  };
  masukanLainnya: {
    total: number;
    count: number;
    dendaRonda: number;
    dendaKb: number;
    titipan: number;
    lainnyaNonDenda: number;
  };
}

export const PEMASUKAN_CATEGORIES = [
  { value: 'iuran_warga', label: 'Iuran Warga (Pokok & Tunggakan)' },
  { value: 'donasi', label: 'Donasi / Sumbangan Kas RT' },
  { value: 'masukan_lainnya', label: 'Masukan Lainnya (Denda, Titipan, Jasa/Lain-lain)' },
] as const;

export const PENGELUARAN_CATEGORIES = [
  { value: 'operasional', label: 'Operasional Rutin' },
  { value: 'keamanan', label: 'Keamanan & Pos Ronda' },
  { value: 'kebersihan', label: 'Kebersihan & Sampah' },
  { value: 'konsumsi', label: 'Konsumsi & Rapat' },
  { value: 'sosial', label: 'Sosial & Dansos RW' },
  { value: 'pembangunan', label: 'Pembangunan Balai RW' },
  { value: 'perbaikan', label: 'Perbaikan PJU / Fasilitas' },
  { value: 'apresiasi_pengurus', label: 'Apresiasi Pengurus RT' },
  { value: 'lainnya', label: 'Pengeluaran Lainnya' },
] as const;

/**
 * Mengelompokkan setiap mutasi pemasukan (selain Saldo Awal) ke dalam 3 kategori utama:
 * 1) iuran_warga, 2) donasi, 3) masukan_lainnya.
 */
export function classifyPemasukanGroup(item: Pick<KasItemLike, 'jenis' | 'kategori'>): PemasukanGroup | null {
  if (item.jenis !== 'masuk' || item.kategori === 'saldo_awal') return null;
  const kat = (item.kategori || '').toLowerCase().trim();
  if (kat === 'donasi' || kat === 'donatur') return 'donasi';
  if (kat === 'iuran_warga') return 'iuran_warga';
  return 'masukan_lainnya';
}

/** Menghitung ringkasan rincian mutasi pemasukan berdasarkan kelompok & komponennya. */
export function summarizePemasukanBreakdown(list: KasItemLike[]): PemasukanBreakdownSummary {
  const res: PemasukanBreakdownSummary = {
    totalPemasukan: 0,
    iuranWarga: { total: 0, count: 0, iuranPokok: 0, tunggakan: 0 },
    donasi: { total: 0, count: 0 },
    masukanLainnya: { total: 0, count: 0, dendaRonda: 0, dendaKb: 0, titipan: 0, lainnyaNonDenda: 0 },
  };

  for (const tx of list || []) {
    const group = classifyPemasukanGroup(tx);
    if (!group) continue;

    const nominal = Number(tx.nominal || 0);
    res.totalPemasukan += nominal;

    if (group === 'iuran_warga') {
      res.iuranWarga.total += nominal;
      res.iuranWarga.count += 1;
      if (tx.rincian) {
        res.iuranWarga.iuranPokok += Number(tx.rincian.iuran_pokok || 0);
        res.iuranWarga.tunggakan += Number(tx.rincian.tunggakan || 0);
      } else {
        res.iuranWarga.iuranPokok += nominal;
      }
    } else if (group === 'donasi') {
      res.donasi.total += nominal;
      res.donasi.count += 1;
    } else {
      res.masukanLainnya.total += nominal;
      res.masukanLainnya.count += 1;
      if (tx.rincian) {
        const dr = Number(tx.rincian.denda_ronda || 0);
        const dk = Number(tx.rincian.denda_kb || 0);
        const tp = Number(tx.rincian.titipan || 0);
        const ln = Number(tx.rincian.lainnya || 0);
        res.masukanLainnya.dendaRonda += dr;
        res.masukanLainnya.dendaKb += dk;
        res.masukanLainnya.titipan += tp;
        const accounted = dr + dk + tp + ln;
        res.masukanLainnya.lainnyaNonDenda += ln + Math.max(0, nominal - accounted);
      } else {
        res.masukanLainnya.lainnyaNonDenda += nominal;
      }
    }
  }

  return res;
}

export function getKategoriBadgeMeta(jenis: 'masuk' | 'keluar', kategori: string) {
  const kat = (kategori || '').toLowerCase().trim();
  if (kat === 'saldo_awal') {
    return {
      label: 'SALDO AWAL',
      className: 'bg-slate-100 text-slate-600 border border-slate-200',
    };
  }
  if (jenis === 'masuk') {
    const group = classifyPemasukanGroup({ jenis, kategori });
    if (group === 'iuran_warga') {
      return {
        label: 'IURAN WARGA',
        className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      };
    }
    if (group === 'donasi') {
      return {
        label: 'DONASI',
        className: 'bg-violet-50 text-violet-700 border border-violet-200',
      };
    }
    return {
      label: 'MASUKAN LAINNYA',
      className: 'bg-amber-50 text-amber-700 border border-amber-200',
    };
  }
  return {
    label: (kategori || 'operasional').replace(/_/g, ' ').toUpperCase(),
    className: 'bg-rose-50 text-rose-700 border border-rose-200/70',
  };
}
