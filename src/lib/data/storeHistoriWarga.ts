import fs from 'fs';
import { getDbFilePath, getDefaultJson } from './dbPathHelper';
import { getAllKasPeriods } from './storeKas';

export interface RondaMingguItem {
  minggu: string;
  status: string;
}

export interface RondaHistoriBulan {
  periode_id: string;
  periode_nama: string;
  status: string;
  hadir_count: number | null;
  total_sesi: number | null;
  mingguan: RondaMingguItem[];
  denda: number;
  catatan: string;
}

export interface KerjaBaktiHistoriBulan {
  periode_id: string;
  periode_nama: string;
  status: string;
  denda: number;
  catatan: string;
}

export interface WargaHistoriUnit {
  no_unit: number;
  alamat: string;
  nama_warga: string;
  ronda: {
    kriteria: string;
    denda_full: number;
    denda_per_absen: number;
    target_minimal_hadir: number;
    histori: RondaHistoriBulan[];
  };
  kerja_bakti: {
    kriteria: string;
    denda_per_absen: number;
    histori: KerjaBaktiHistoriBulan[];
  };
}

export interface IuranHistoriBulan {
  periode_id: string;
  periode_nama: string;
  bulan: number;
  tahun: number;
  periode_status: 'open' | 'closed';
  no_unit: number;
  alamat: string;
  nama_warga: string;
  dansos_rt: number;
  dansos_rw: number;
  pembangunan: number;
  snack: number;
  jimpitan: number;
  iuran_pokok: number;
  denda_ronda: number;
  denda_kerja_bakti: number;
  total_denda: number;
  tunggakan_bulan_lalu: number;
  titipan_bulan_lalu: number;
  total_tagihan: number;
  total_terbayar: number;
  tanggal_pembayaran: string | null;
  kurang_lebih: number;
  donatur: number;
  titipan_depan: number;
  status_bayar: string;
  status_label: string;
  keterangan: string;
}

const DB_WARGA_HISTORI_PATH = getDbFilePath('db_warga_histori.json');

export function getAllWargaHistori(): WargaHistoriUnit[] {
  try {
    if (fs.existsSync(DB_WARGA_HISTORI_PATH)) {
      const raw = fs.readFileSync(DB_WARGA_HISTORI_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading db_warga_histori.json:', e);
  }
  return (getDefaultJson('db_warga_histori.json') as WargaHistoriUnit[]) || [];
}

export function getLembarHistoriByUnit(noUnit?: number | null, fallbackNama?: string | null) {
  const periods = getAllKasPeriods();
  const sortedPeriods = [...periods].sort(
    (a, b) => b.tahun * 100 + b.bulan - (a.tahun * 100 + a.bulan)
  );

  const allHistori = getAllWargaHistori();

  // Cari histori unit berdasarkan no_unit, atau nama, atau default ke unit pertama yang berpenghuni
  let unitMeta = allHistori.find((u) => noUnit && Number(u.no_unit) === Number(noUnit));
  if (!unitMeta && fallbackNama) {
    const clean = fallbackNama.trim().toLowerCase();
    unitMeta = allHistori.find((u) => u.nama_warga.toLowerCase() === clean);
  }
  if (!unitMeta) {
    unitMeta = allHistori.find((u) => u.nama_warga !== '-') || allHistori[0];
  }

  const resolvedUnitNo = unitMeta?.no_unit || 1;

  // Gabungkan histori iuran dari seluruh periode kas
  const iuranHistori: IuranHistoriBulan[] = [];
  for (const p of sortedPeriods) {
    const item = p.tagihan?.find((t: any) => Number(t.no_unit) === Number(resolvedUnitNo));
    if (!item) continue;
    iuranHistori.push({
      periode_id: p.id,
      periode_nama: p.nama,
      bulan: p.bulan,
      tahun: p.tahun,
      periode_status: p.status,
      no_unit: item.no_unit,
      alamat: item.alamat,
      nama_warga: item.nama_warga,
      dansos_rt: Number(item.dansos_rt || 0),
      dansos_rw: Number(item.dansos_rw || 0),
      pembangunan: Number(item.pembangunan || 0),
      snack: Number(item.snack || 0),
      jimpitan: Number(item.jimpitan || 0),
      iuran_pokok: Number(item.iuran_pokok || 0),
      denda_ronda: Number(item.denda_ronda || 0),
      denda_kerja_bakti: Number(item.denda_kerja_bakti || 0),
      total_denda: Number(item.total_denda || 0),
      tunggakan_bulan_lalu: Number(item.tunggakan_bulan_lalu || 0),
      titipan_bulan_lalu: Number(item.titipan_bulan_lalu || 0),
      total_tagihan: Number(item.total_tagihan || 0),
      total_terbayar: Number(item.total_terbayar || 0),
      tanggal_pembayaran: item.tanggal_pembayaran || null,
      kurang_lebih: Number(item.kurang_lebih || 0),
      donatur: Number(item.donatur || 0),
      titipan_depan: Number(item.titipan_depan || 0),
      status_bayar: item.status_bayar || 'belum_bayar',
      status_label: item.status_label || 'BELUM LUNAS',
      keterangan: item.keterangan || '-',
    });
  }

  return {
    unitMeta,
    iuranHistori,
    rondaInfo: unitMeta.ronda,
    kerjaBaktiInfo: unitMeta.kerja_bakti,
    allUnitsSelector: allHistori.map((u) => ({
      no_unit: u.no_unit,
      alamat: u.alamat,
      nama_warga: u.nama_warga,
    })),
  };
}
