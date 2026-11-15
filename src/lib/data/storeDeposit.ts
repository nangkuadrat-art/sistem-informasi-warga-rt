import fs from 'fs';
import { getDbFilePath, getDefaultJson } from './dbPathHelper';
import {
  getKasPeriod,
  applyDepositToIuranStore,
  applyDepositToDonasiStore,
  applyDepositTarikTunaiApprovedStore,
} from './storeKas';

const DEPOSIT_DB_PATH = getDbFilePath('db_deposit_requests.json');

export type DepositUsageType = 'bayar_iuran' | 'donasi' | 'tarik_tunai';
export type DepositRequestStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface DepositUsageRecord {
  id: string;
  periode_id: string;
  no_unit: number;
  alamat: string;
  nama_warga: string;
  username_pemohon: string;
  jenis: DepositUsageType;
  nominal: number;
  catatan: string;
  metode_pencairan?: 'TUNAI' | 'TRANSFER';
  info_rekening?: string;
  status: DepositRequestStatus;
  target_keterangan?: string;
  created_at: string;
  processed_at?: string;
  processed_by?: string;
  alasan_penolakan?: string;
}

export interface DepositRequestsDb {
  requests: DepositUsageRecord[];
}

export interface UnitDepositSummary {
  periodeId: string;
  periodeNama: string;
  noUnit: number;
  alamat: string;
  namaWarga: string;
  iuranPokokUnit: number;
  totalTagihanUnit: number;
  sisaTagihanUnit: number;
  titipanDepanBruto: number;
  alokasiIuranDimuka: number;
  pendingTarikTunai: number;
  saldoDepositTersedia: number;
  /** True khusus jika titipan/deposit nilainya > total tagihannya */
  isEligibleGunakanDeposit: boolean;
  riwayatUnit: DepositUsageRecord[];
}

function loadDepositDb(): DepositRequestsDb {
  try {
    if (fs.existsSync(DEPOSIT_DB_PATH)) {
      const raw = fs.readFileSync(DEPOSIT_DB_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.requests)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading db_deposit_requests.json:', e);
  }
  return (getDefaultJson('db_deposit_requests.json') as DepositRequestsDb) || { requests: [] };
}

function saveDepositDb(data: DepositRequestsDb): void {
  try {
    fs.writeFileSync(DEPOSIT_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving db_deposit_requests.json:', e);
  }
}

export function getAllDepositRequests(): DepositUsageRecord[] {
  const db = loadDepositDb();
  return [...db.requests].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getPendingDepositRequests(): DepositUsageRecord[] {
  return getAllDepositRequests().filter((r) => r.status === 'pending' && r.jenis === 'tarik_tunai');
}

export function getPendingDepositRequestsCount(): number {
  return getPendingDepositRequests().length;
}

export function getUnitDepositSummary(noUnit: number, periodeId?: string): UnitDepositSummary | null {
  const period = getKasPeriod(periodeId);
  if (!period || !period.tagihan) return null;

  const tagihanItem = period.tagihan.find((t) => Number(t.no_unit) === Number(noUnit));
  if (!tagihanItem) return null;

  const allRequests = getAllDepositRequests();
  const riwayatUnit = allRequests.filter((r) => Number(r.no_unit) === Number(noUnit));

  const titipanDepanBruto = Number(tagihanItem.titipan_depan || 0);
  const titipanLalu = Number(
    tagihanItem.titipan_bulan_lalu !== undefined
      ? tagihanItem.titipan_bulan_lalu
      : tagihanItem.titipan_lalu || 0
  );
  const totalTagihanUnit = Number(tagihanItem.total_tagihan || 0);
  const sisaTagihanUnit = Math.max(
    0,
    totalTagihanUnit - Number(tagihanItem.total_terbayar || 0)
  );
  const alokasiIuranDimuka = Number(tagihanItem.alokasi_iuran_dimuka || 0);
  const pendingTarikTunai = riwayatUnit
    .filter((r) => r.status === 'pending' && r.jenis === 'tarik_tunai')
    .reduce((acc, r) => acc + Number(r.nominal || 0), 0);

  // Saldo deposit bebas yang dapat dipakai saat ini (tidak termasuk yang sudah dikunci untuk iuran dimuka atau sedang pending tarik tunai)
  const effectiveBase =
    titipanDepanBruto > 0
      ? titipanDepanBruto
      : Math.max(0, titipanLalu - totalTagihanUnit);

  const saldoDepositTersedia = Math.max(
    0,
    effectiveBase - alokasiIuranDimuka - pendingTarikTunai
  );

  // Aturan khusus: tombol Gunakan Deposit muncul jika warga memiliki titipan/deposit yang nilainya > tagihannya
  const isEligibleGunakanDeposit =
    effectiveBase > 0 &&
    (effectiveBase > totalTagihanUnit || titipanLalu > totalTagihanUnit);

  return {
    periodeId: period.id,
    periodeNama: period.nama,
    noUnit: Number(tagihanItem.no_unit),
    alamat: tagihanItem.alamat,
    namaWarga: tagihanItem.nama_warga,
    iuranPokokUnit: Number(tagihanItem.iuran_pokok || 50000),
    totalTagihanUnit,
    sisaTagihanUnit,
    titipanDepanBruto: effectiveBase,
    alokasiIuranDimuka,
    pendingTarikTunai,
    saldoDepositTersedia,
    isEligibleGunakanDeposit,
    riwayatUnit,
  };
}

export function submitDepositUsageStore(input: {
  periodeId: string;
  noUnit: number;
  usernamePemohon: string;
  jenis: DepositUsageType;
  nominal: number;
  catatan: string;
  metodePencairan?: 'TUNAI' | 'TRANSFER';
  infoRekening?: string;
}): { success: boolean; record?: DepositUsageRecord; message?: string; error?: string } {
  const summary = getUnitDepositSummary(input.noUnit, input.periodeId);
  if (!summary) {
    return { success: false, error: 'Data unit tidak ditemukan.' };
  }

  if (!summary.isEligibleGunakanDeposit && summary.saldoDepositTersedia <= 0) {
    return { success: false, error: 'Unit ini tidak memiliki saldo deposit yang dapat digunakan.' };
  }

  const nominal = Math.round(Number(input.nominal || 0));
  if (!Number.isFinite(nominal) || nominal <= 0) {
    return { success: false, error: 'Nominal penggunaan deposit harus lebih dari Rp 0.' };
  }

  if (nominal > summary.saldoDepositTersedia) {
    return {
      success: false,
      error: `Nominal melebihi saldo deposit tersedia (maks Rp ${summary.saldoDepositTersedia.toLocaleString('id-ID')}).`,
    };
  }

  const nowIso = new Date().toISOString();
  const id = `dep-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const cleanCatatan = (input.catatan || '').trim();

  if (input.jenis === 'bayar_iuran') {
    const res = applyDepositToIuranStore(summary.periodeId, summary.noUnit, nominal, cleanCatatan);
    if (!res.success) {
      return { success: false, error: res.error || 'Gagal mengalokasikan deposit untuk iuran.' };
    }
    const targetKeterangan =
      res.mode === 'tagihan_aktif'
        ? `Pembayaran tagihan periode ${summary.periodeNama}`
        : `Alokasi pra-bayar iuran bulan mendatang (dari ${summary.periodeNama})`;

    const record: DepositUsageRecord = {
      id,
      periode_id: summary.periodeId,
      no_unit: summary.noUnit,
      alamat: summary.alamat,
      nama_warga: summary.namaWarga,
      username_pemohon: input.usernamePemohon,
      jenis: 'bayar_iuran',
      nominal,
      catatan: cleanCatatan || targetKeterangan,
      status: 'completed',
      target_keterangan: targetKeterangan,
      created_at: nowIso,
      processed_at: nowIso,
      processed_by: 'Sistem Otomatis Portal Warga',
    };
    const db = loadDepositDb();
    db.requests.unshift(record);
    saveDepositDb(db);
    return {
      success: true,
      record,
      message: `Alokasi deposit Rp ${nominal.toLocaleString('id-ID')} untuk Bayar Iuran berhasil dicatat.`,
    };
  }

  if (input.jenis === 'donasi') {
    const res = applyDepositToDonasiStore(summary.periodeId, summary.noUnit, nominal, cleanCatatan);
    if (!res.success) {
      return { success: false, error: res.error || 'Gagal memproses donasi dari deposit.' };
    }
    const record: DepositUsageRecord = {
      id,
      periode_id: summary.periodeId,
      no_unit: summary.noUnit,
      alamat: summary.alamat,
      nama_warga: summary.namaWarga,
      username_pemohon: input.usernamePemohon,
      jenis: 'donasi',
      nominal,
      catatan: cleanCatatan || 'Donasi Kas RT dari saldo deposit warga',
      status: 'completed',
      target_keterangan: `Donatur Kas RT (${summary.periodeNama})`,
      created_at: nowIso,
      processed_at: nowIso,
      processed_by: 'Sistem Otomatis Portal Warga',
    };
    const db = loadDepositDb();
    db.requests.unshift(record);
    saveDepositDb(db);
    return {
      success: true,
      record,
      message: `Terima kasih! Donasi Rp ${nominal.toLocaleString('id-ID')} dari saldo deposit telah dicatat.`,
    };
  }

  // 3. Tarik Tunai -> Status PENDING menunggu persetujuan Bendahara
  const metode = input.metodePencairan || 'TUNAI';
  const infoRek = (input.infoRekening || '').trim();
  const record: DepositUsageRecord = {
    id,
    periode_id: summary.periodeId,
    no_unit: summary.noUnit,
    alamat: summary.alamat,
    nama_warga: summary.namaWarga,
    username_pemohon: input.usernamePemohon,
    jenis: 'tarik_tunai',
    nominal,
    catatan: cleanCatatan || `Permohonan tarik tunai deposit via ${metode}`,
    metode_pencairan: metode,
    info_rekening: infoRek || undefined,
    status: 'pending',
    target_keterangan: `Menunggu persetujuan Bendahara (${metode})`,
    created_at: nowIso,
  };
  const db = loadDepositDb();
  db.requests.unshift(record);
  saveDepositDb(db);

  return {
    success: true,
    record,
    message: `Pengajuan Tarik Tunai Rp ${nominal.toLocaleString('id-ID')} telah dikirim ke Bendahara RT dan menunggu persetujuan.`,
  };
}

export function processDepositWithdrawalStore(
  requestId: string,
  action: 'approve' | 'reject',
  bendaharaNama: string,
  alasanPenolakan?: string
): { success: boolean; record?: DepositUsageRecord; error?: string } {
  const db = loadDepositDb();
  const req = db.requests.find((r) => r.id === requestId);
  if (!req) return { success: false, error: 'Pengajuan tarik tunai tidak ditemukan.' };
  if (req.status !== 'pending') {
    return { success: false, error: `Pengajuan sudah berstatus "${req.status}".` };
  }

  const nowIso = new Date().toISOString();

  if (action === 'approve') {
    const res = applyDepositTarikTunaiApprovedStore(
      req.periode_id,
      req.no_unit,
      req.nominal,
      req.metode_pencairan || 'TUNAI',
      req.info_rekening
    );
    if (!res.success) {
      return { success: false, error: res.error || 'Gagal mencairkan deposit.' };
    }
    req.status = 'approved';
    req.processed_at = nowIso;
    req.processed_by = bendaharaNama;
    saveDepositDb(db);
    return { success: true, record: req };
  }

  req.status = 'rejected';
  req.processed_at = nowIso;
  req.processed_by = bendaharaNama;
  req.alasan_penolakan = (alasanPenolakan || 'Ditolak oleh Bendahara').trim();
  saveDepositDb(db);
  return { success: true, record: req };
}
