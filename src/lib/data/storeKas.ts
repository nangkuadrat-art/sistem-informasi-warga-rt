import fs from 'fs';
import path from 'path';
import { getDbFilePath, getDefaultJson } from './dbPathHelper';
import { KasTransaksiRincian } from './kasCategories';

const PERIODS_DB_PATH = getDbFilePath('db_kas_periods.json');

export interface KasTransaksiItem {
  id: string;
  tanggal_transaksi: string;
  keterangan: string;
  jenis: 'masuk' | 'keluar';
  kategori: string;
  sub_kategori?: string;
  nominal: number;
  rincian?: KasTransaksiRincian;
}

export interface KasPeriodItem {
  id: string;
  bulan: number;
  tahun: number;
  nama: string;
  status: 'open' | 'closed';
  closed_at?: string;
  saldo_awal: number;
  total_masuk: number;
  total_keluar: number;
  saldo_akhir: number;
  catatan_closing: string;
  transaksi: KasTransaksiItem[];
  tagihan: any[];
}

export interface KasPeriodsData {
  periods: KasPeriodItem[];
}

function loadPeriodsData(): KasPeriodsData {
  try {
    if (fs.existsSync(PERIODS_DB_PATH)) {
      const data = fs.readFileSync(PERIODS_DB_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && Array.isArray(parsed.periods) && parsed.periods.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading db_kas_periods.json:', e);
  }
  return (getDefaultJson('db_kas_periods.json') as KasPeriodsData) || { periods: [] };
}

function savePeriodsData(data: KasPeriodsData): void {
  try {
    fs.writeFileSync(PERIODS_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving db_kas_periods.json:', e);
  }
}

// Recalculate totals and propagate rolling balances if chained
function recalculatePeriodBalances(period: KasPeriodItem, allPeriods?: KasPeriodItem[]): void {
  const totalMasuk = (period.transaksi || [])
    .filter((t) => t.jenis === 'masuk' && t.kategori !== 'saldo_awal')
    .reduce((acc, curr) => acc + Number(curr.nominal || 0), 0);

  const totalKeluar = (period.transaksi || [])
    .filter((t) => t.jenis === 'keluar')
    .reduce((acc, curr) => acc + Number(curr.nominal || 0), 0);

  period.total_masuk = totalMasuk;
  period.total_keluar = totalKeluar;
  period.saldo_akhir = Number(period.saldo_awal || 0) + totalMasuk - totalKeluar;

  // Propagate to next period if this period is closed and next exists
  if (allPeriods && allPeriods.length > 0) {
    const periodIdx = allPeriods.findIndex((p) => p.id === period.id);
    if (periodIdx !== -1 && periodIdx < allPeriods.length - 1) {
      const nextPeriod = allPeriods[periodIdx + 1];
      nextPeriod.saldo_awal = period.saldo_akhir;

      // Update next period's initial transaction if exists
      const initialTx = nextPeriod.transaksi?.find((t) => t.kategori === 'saldo_awal');
      if (initialTx) {
        initialTx.nominal = period.saldo_akhir;
      }
      recalculatePeriodBalances(nextPeriod, allPeriods);
    }
  }
}

export function getAllKasPeriods(): KasPeriodItem[] {
  const data = loadPeriodsData();
  return data.periods;
}

export function getKasPeriod(periodId?: string): KasPeriodItem {
  const periods = getAllKasPeriods();
  if (periodId) {
    const found = periods.find((p) => p.id === periodId);
    if (found) return found;
  }
  // Default ke open atau yang terbaru
  const openPeriod = periods.find((p) => p.status === 'open');
  if (openPeriod) return openPeriod;
  return periods[periods.length - 1];
}

// -------------------------------------------------------------
// CRUD KAS TRANSAKSI
// -------------------------------------------------------------

export function addTransaksiKasPeriod(
  periodId: string,
  input: {
    tanggal_transaksi: string;
    keterangan: string;
    jenis: 'masuk' | 'keluar';
    kategori: string;
    nominal: number;
  }
): KasTransaksiItem {
  const data = loadPeriodsData();
  const period = data.periods.find((p) => p.id === periodId) || data.periods.find((p) => p.status === 'open');

  if (!period) {
    throw new Error('Periode buku kas tidak ditemukan');
  }

  const newItem: KasTransaksiItem = {
    id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    tanggal_transaksi: input.tanggal_transaksi,
    keterangan: input.keterangan,
    jenis: input.jenis,
    kategori: input.kategori,
    nominal: Number(input.nominal) || 0,
  };

  if (!period.transaksi) period.transaksi = [];
  period.transaksi.unshift(newItem);

  recalculatePeriodBalances(period, data.periods);
  savePeriodsData(data);
  return newItem;
}

export function updateTransaksiKasPeriod(
  periodId: string,
  txId: string,
  input: {
    tanggal_transaksi?: string;
    keterangan?: string;
    jenis?: 'masuk' | 'keluar';
    kategori?: string;
    nominal?: number;
  }
): KasTransaksiItem | null {
  const data = loadPeriodsData();
  const period = data.periods.find((p) => p.id === periodId);
  if (!period || !period.transaksi) return null;

  const tx = period.transaksi.find((t) => t.id === txId);
  if (!tx) return null;

  if (input.tanggal_transaksi !== undefined) tx.tanggal_transaksi = input.tanggal_transaksi;
  if (input.keterangan !== undefined) tx.keterangan = input.keterangan;
  if (input.jenis !== undefined) tx.jenis = input.jenis;
  if (input.kategori !== undefined) tx.kategori = input.kategori;
  if (input.nominal !== undefined) tx.nominal = Number(input.nominal) || 0;

  recalculatePeriodBalances(period, data.periods);
  savePeriodsData(data);
  return tx;
}

export function deleteTransaksiKasPeriod(periodId: string, txId: string): boolean {
  const data = loadPeriodsData();
  const period = data.periods.find((p) => p.id === periodId);
  if (!period || !period.transaksi) return false;

  const idx = period.transaksi.findIndex((t) => t.id === txId);
  if (idx === -1) return false;

  period.transaksi.splice(idx, 1);
  recalculatePeriodBalances(period, data.periods);
  savePeriodsData(data);
  return true;
}

// -------------------------------------------------------------
// CRUD CLOSING BULANAN & TAGIHAN WARGA
// -------------------------------------------------------------

export function updateTagihanUnitStore(
  periodId: string,
  tagihanId: string,
  input: {
    iuran_pokok?: number;
    denda_ronda?: number;
    denda_kerja_bakti?: number;
    tunggakan_bulan_lalu?: number;
    titipan_bulan_lalu?: number;
    donatur?: number;
    titipan_depan?: number;
    total_terbayar?: number;
    keterangan?: string;
  }
): any | null {
  const data = loadPeriodsData();
  const period = data.periods.find((p) => p.id === periodId);
  if (!period || !period.tagihan) return null;

  const item = period.tagihan.find((t) => t.id === tagihanId);
  if (!item) return null;

  if (input.iuran_pokok !== undefined) item.iuran_pokok = Number(input.iuran_pokok) || 0;
  if (input.denda_ronda !== undefined) item.denda_ronda = Number(input.denda_ronda) || 0;
  if (input.denda_kerja_bakti !== undefined) item.denda_kerja_bakti = Number(input.denda_kerja_bakti) || 0;
  if (input.tunggakan_bulan_lalu !== undefined) item.tunggakan_bulan_lalu = Number(input.tunggakan_bulan_lalu) || 0;
  if (input.titipan_bulan_lalu !== undefined) item.titipan_bulan_lalu = Number(input.titipan_bulan_lalu) || 0;
  if (input.donatur !== undefined) item.donatur = Number(input.donatur) || 0;
  if (input.titipan_depan !== undefined) item.titipan_depan = Number(input.titipan_depan) || 0;
  if (input.total_terbayar !== undefined) item.total_terbayar = Number(input.total_terbayar) || 0;
  if (input.keterangan !== undefined) item.keterangan = input.keterangan;

  // Recalculate item totals
  item.total_denda = Number(item.denda_ronda || 0) + Number(item.denda_kerja_bakti || 0);
  item.total_tagihan =
    Number(item.iuran_pokok || 0) +
    Number(item.total_denda || 0) +
    Number(item.tunggakan_bulan_lalu || 0) -
    Number(item.titipan_bulan_lalu || 0);

  if (item.total_tagihan < 0) item.total_tagihan = 0;

  item.kurang_lebih = Number(item.total_terbayar || 0) - Number(item.total_tagihan || 0);

  if (item.total_tagihan === 0) {
    item.status_bayar = 'kosong';
    item.status_label = 'KOSONG';
  } else if (item.total_terbayar >= item.total_tagihan) {
    item.status_bayar = 'lunas';
    item.status_label = 'LUNAS';
  } else if (item.total_terbayar > 0) {
    item.status_bayar = 'sebagian';
    item.status_label = 'BELUM LUNAS';
  } else {
    item.status_bayar = 'belum_bayar';
    item.status_label = 'BELUM LUNAS';
  }

  savePeriodsData(data);
  return item;
}

export function recordBayarTagihanStore(
  periodId: string,
  tagihanId: string,
  nominalBayar: number,
  metode: string = 'TUNAI',
  autoAddKas: boolean = true
): { success: boolean; item?: any } {
  const data = loadPeriodsData();
  const period = data.periods.find((p) => p.id === periodId);
  if (!period || !period.tagihan) return { success: false };

  const item = period.tagihan.find((t) => t.id === tagihanId);
  if (!item) return { success: false };

  const prevPaid = Number(item.total_terbayar || 0);
  const bayarBaru = prevPaid + Number(nominalBayar);
  item.total_terbayar = bayarBaru;
  item.kurang_lebih = bayarBaru - Number(item.total_tagihan || 0);

  if (item.total_tagihan === 0) {
    item.status_bayar = 'kosong';
    item.status_label = 'KOSONG';
  } else if (bayarBaru >= Number(item.total_tagihan || 0)) {
    item.status_bayar = 'lunas';
    item.status_label = 'LUNAS';
  } else if (bayarBaru > 0) {
    item.status_bayar = 'sebagian';
    item.status_label = 'BELUM LUNAS';
  } else {
    item.status_bayar = 'belum_bayar';
    item.status_label = 'BELUM LUNAS';
  }

  // Otomatis catat transaksi kas masuk terbreakdown (Iuran Warga vs Masukan Lainnya/Denda)
  if (autoAddKas && nominalBayar > 0) {
    if (!period.transaksi) period.transaksi = [];
    const today = new Date().toISOString().split('T')[0];
    const tunggakanDue = Number(item.tunggakan_bulan_lalu || 0);
    const pokokDue = Math.max(0, Number(item.iuran_pokok || 0) - Number(item.titipan_bulan_lalu || 0));
    const rondaDue = Number(item.denda_ronda || 0);
    const kbDue = Number(item.denda_kerja_bakti || 0);

    // Hitung porsi baru dari (bayarBaru - prevPaid) setelah dikurangi porsi yang sudah dibayar sebelumnya
    const allocCumulative = (total: number) => {
      let r = total;
      const t = Math.min(r, tunggakanDue); r -= t;
      const p = Math.min(r, pokokDue); r -= p;
      const dr = Math.min(r, rondaDue); r -= dr;
      const dk = Math.min(r, kbDue); r -= dk;
      return { t, p, dr, dk, ex: r };
    };
    const before = allocCumulative(prevPaid);
    const after = allocCumulative(bayarBaru);

    const addT = after.t - before.t;
    const addP = after.p - before.p;
    const addDr = after.dr - before.dr;
    const addDk = after.dk - before.dk;
    const addEx = after.ex - before.ex;

    const iuranNominal = addT + addP;
    const lainnyaNominal = addDr + addDk + addEx;
    const baseTs = Date.now();

    if (lainnyaNominal > 0) {
      const parts: string[] = [];
      if (addDr > 0) parts.push(`Denda Ronda Rp ${addDr.toLocaleString('id-ID')}`);
      if (addDk > 0) parts.push(`Denda KB Rp ${addDk.toLocaleString('id-ID')}`);
      if (addEx > 0) parts.push(`Titipan Lebih Bayar Rp ${addEx.toLocaleString('id-ID')}`);
      period.transaksi.unshift({
        id: `tx-bayar-lain-${baseTs}`,
        tanggal_transaksi: today,
        keterangan: `Denda/Lainnya (${metode}): ${item.nama_warga} (${item.alamat}) — ${parts.join(', ')}`,
        jenis: 'masuk',
        kategori: 'masukan_lainnya',
        sub_kategori: addDr + addDk > 0 ? 'denda_ronda_kb' : 'titipan_deposit',
        nominal: lainnyaNominal,
        rincian: { denda_ronda: addDr, denda_kb: addDk, titipan: addEx },
      });
    }

    if (iuranNominal > 0 || lainnyaNominal === 0) {
      const finalIuran = iuranNominal > 0 ? iuranNominal : nominalBayar;
      period.transaksi.unshift({
        id: `tx-bayar-iuran-${baseTs}`,
        tanggal_transaksi: today,
        keterangan: `Iuran Warga (${metode}): ${item.nama_warga} (${item.alamat})`,
        jenis: 'masuk',
        kategori: 'iuran_warga',
        sub_kategori: addT > 0 && addP > 0 ? 'iuran_dan_tunggakan' : addT > 0 ? 'tunggakan' : 'iuran_pokok',
        nominal: finalIuran,
        rincian: { iuran_pokok: addP || finalIuran, tunggakan: addT },
      });
    }

    recalculatePeriodBalances(period, data.periods);
  }

  savePeriodsData(data);
  return { success: true, item };
}

export function resetTagihanUnitStore(periodId: string, tagihanId: string): boolean {
  const data = loadPeriodsData();
  const period = data.periods.find((p) => p.id === periodId);
  if (!period || !period.tagihan) return false;

  const item = period.tagihan.find((t) => t.id === tagihanId);
  if (!item) return false;

  item.total_terbayar = 0;
  item.kurang_lebih = -Number(item.total_tagihan || 0);
  item.status_bayar = Number(item.total_tagihan || 0) > 0 ? 'belum_bayar' : 'kosong';
  item.status_label = Number(item.total_tagihan || 0) > 0 ? 'BELUM LUNAS' : 'KOSONG';

  savePeriodsData(data);
  return true;
}

export function executeClosingStore(periodId: string, customCatatan?: string) {
  const data = loadPeriodsData();
  const period = data.periods.find((p) => p.id === periodId);
  if (!period) return { success: false, error: 'Periode tidak ditemukan' };

  period.status = 'closed';
  period.closed_at = new Date().toISOString();
  period.catatan_closing =
    customCatatan ||
    `Tutup buku ${period.nama} dilaksanakan resmi pada ${new Date().toLocaleDateString('id-ID')}. Saldo akhir Rp ${period.saldo_akhir.toLocaleString('id-ID')} digulirkan ke bulan berikutnya.`;

  // Rollover ke periode bulan berikutnya
  const nextMonth = period.bulan === 12 ? 1 : period.bulan + 1;
  const nextYear = period.bulan === 12 ? period.tahun + 1 : period.tahun;
  const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const monthCodes = ['', 'jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agu', 'sep', 'okt', 'nov', 'des'];
  const nextName = `${monthNames[nextMonth]} ${nextYear}`;
  const nextId = `periode-${monthCodes[nextMonth]}-${nextYear}`;

  // Cari berdasarkan bulan dan tahun agar tidak pernah menduplikasi periode
  let nextPeriod = data.periods.find((p) => (p.bulan === nextMonth && p.tahun === nextYear) || p.id === nextId);

  // Buat tagihan bergulir
  const nextTagihan = (period.tagihan || []).map((t: any) => {
    // Sisa tunggakan jika kurang bayar
    const sisaTunggakan = t.kurang_lebih < 0 ? Math.abs(t.kurang_lebih) : 0;
    // Titipan bergulir jika ada kelebihan / deposit
    const titipanBergulir = t.titipan_depan > 0 ? t.titipan_depan : 0;
    const iuranPokok = t.nama_warga === '-' ? 0 : (t.iuran_pokok || 50000);
    const totalTagihan = Math.max(0, iuranPokok + sisaTunggakan - titipanBergulir);

    return {
      id: `tagihan-${nextId}-${t.no_unit}`,
      no_unit: t.no_unit,
      blok_rumah: t.blok_rumah,
      nomor_rumah: t.nomor_rumah,
      alamat: t.alamat,
      nama_warga: t.nama_warga,
      iuran_pokok: iuranPokok,
      denda_ronda: 0,
      denda_kerja_bakti: 0,
      total_denda: 0,
      tunggakan_bulan_lalu: sisaTunggakan,
      titipan_bulan_lalu: titipanBergulir,
      total_tagihan: totalTagihan,
      total_terbayar: 0,
      kurang_lebih: -totalTagihan,
      donatur: 0,
      titipan_depan: 0,
      status_bayar: totalTagihan > 0 ? 'belum_bayar' : 'kosong',
      status_label: totalTagihan > 0 ? 'BELUM LUNAS' : 'KOSONG',
      keterangan: sisaTunggakan > 0 ? `Tunggakan bergulir Rp ${sisaTunggakan.toLocaleString('id-ID')}` : (titipanBergulir > 0 ? `Deposit bergulir Rp ${titipanBergulir.toLocaleString('id-ID')}` : '-')
    };
  });

  if (!nextPeriod) {
    nextPeriod = {
      id: nextId,
      bulan: nextMonth,
      tahun: nextYear,
      nama: nextName,
      status: 'open',
      saldo_awal: period.saldo_akhir,
      total_masuk: 0,
      total_keluar: 0,
      saldo_akhir: period.saldo_akhir,
      catatan_closing: `Periode aktif ${nextName}. Saldo awal Rp ${period.saldo_akhir.toLocaleString('id-ID')} bergulir otomatis dari closing ${period.nama}.`,
      transaksi: [
        {
          id: `tx-${nextId}-1`,
          tanggal_transaksi: `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`,
          keterangan: `Sisa Saldo Kas Bulan Sebelumnya (${period.nama})`,
          jenis: 'masuk',
          kategori: 'saldo_awal',
          nominal: period.saldo_akhir,
        },
      ],
      tagihan: nextTagihan,
    };
    data.periods.push(nextPeriod);
  } else {
    nextPeriod.saldo_awal = period.saldo_akhir;
    const initTx = nextPeriod.transaksi?.find((t) => t.kategori === 'saldo_awal');
    if (initTx) initTx.nominal = period.saldo_akhir;
    recalculatePeriodBalances(nextPeriod, data.periods);
  }

  savePeriodsData(data);
  return { success: true };
}

export function reopenClosingStore(periodId: string): boolean {
  const data = loadPeriodsData();
  const period = data.periods.find((p) => p.id === periodId);
  if (!period) return false;

  period.status = 'open';
  period.closed_at = undefined;
  period.catatan_closing = `Buku kas ${period.nama} dibuka kembali untuk pembaruan/revisi transaksi & tagihan warga.`;

  savePeriodsData(data);
  return true;
}

// -------------------------------------------------------------
// FUNGSI KOMPATIBILITAS
// -------------------------------------------------------------

export function getDbKas(): KasTransaksiItem[] {
  const active = getKasPeriod('periode-okt-2026');
  return active?.transaksi || [];
}

export function addTransaksiKasStore(input: {
  tanggal_transaksi: string;
  keterangan: string;
  jenis: 'masuk' | 'keluar';
  kategori: string;
  nominal: number;
}): KasTransaksiItem {
  return addTransaksiKasPeriod('periode-okt-2026', input);
}
