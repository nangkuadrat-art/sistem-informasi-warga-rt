import fs from 'fs';
import { getDbFilePath, getDefaultJson } from './dbPathHelper';
import { getDbUnits } from './store';
import crypto from 'crypto';

export interface PesertaRondaItem {
  id: string;
  jadwal_id: string;
  warga_id: string;
  warga?: {
    nama_lengkap: string;
    keluarga_id?: string;
  };
}

export interface PresensiRondaItem {
  id: string;
  jadwal_id: string;
  warga_id: string;
  jarak_meter: number;
  status: 'hadir' | 'izin' | 'alfa';
  waktu_presensi: string;
  warga?: {
    nama_lengkap: string;
  };
}

export interface JadwalRondaRecord {
  id: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  catatan?: string;
  is_processed_denda: boolean;
  peserta_ronda: PesertaRondaItem[];
  presensi_ronda: PresensiRondaItem[];
}

export interface PresensiKerjaBaktiItem {
  id: string;
  jadwal_id: string;
  keluarga_id: string;
  keluarga?: {
    nama_kepala_keluarga: string;
    blok_rumah: string;
    nomor_rumah: string;
  };
}

export interface JadwalKerjaBaktiRecord {
  id: string;
  judul: string;
  lokasi: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  qr_token: string;
  is_processed_denda: boolean;
  presensi_kerja_bakti: PresensiKerjaBaktiItem[];
}

const DB_RONDA_PATH = getDbFilePath('db_jadwal_ronda.json');
const DB_KB_PATH = getDbFilePath('db_jadwal_kerja_bakti.json');

// ==========================================
// 1. JADWAL RONDA STORE
// ==========================================
export function getAllJadwalRonda(): JadwalRondaRecord[] {
  try {
    if (fs.existsSync(DB_RONDA_PATH)) {
      const raw = fs.readFileSync(DB_RONDA_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
      }
    }
  } catch (e) {
    console.error('Error reading db_jadwal_ronda.json:', e);
  }
  const fallback = getDefaultJson('db_jadwal_ronda.json');
  return Array.isArray(fallback) ? [...fallback] : [];
}

export function saveAllJadwalRonda(data: JadwalRondaRecord[]): void {
  try {
    fs.writeFileSync(DB_RONDA_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving db_jadwal_ronda.json:', e);
  }
}

export function createJadwalRondaStore(input: {
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  catatan?: string;
  warga_ids: string[];
}): JadwalRondaRecord {
  const current = getAllJadwalRonda();
  const allUnits = getDbUnits();
  const id = `ronda-${input.tanggal}-${Date.now().toString().slice(-4)}`;

  // Mapping nama warga & keluarga
  const wargaMap = new Map<string, { nama_lengkap: string; keluarga_id?: string }>();
  allUnits.forEach((u) => {
    (u.warga || []).forEach((w) => {
      wargaMap.set(w.id, {
        nama_lengkap: `${w.nama_lengkap} (Blok ${u.blok_rumah}/${u.nomor_rumah})`,
        keluarga_id: u.id,
      });
    });
  });

  const peserta_ronda: PesertaRondaItem[] = input.warga_ids.map((wId, idx) => ({
    id: `pr-${Date.now()}-${idx}`,
    jadwal_id: id,
    warga_id: wId,
    warga: wargaMap.get(wId) || { nama_lengkap: 'Warga RT' },
  }));

  const newJadwal: JadwalRondaRecord = {
    id,
    tanggal: input.tanggal,
    jam_mulai: input.jam_mulai,
    jam_selesai: input.jam_selesai,
    catatan: input.catatan || '',
    is_processed_denda: false,
    peserta_ronda,
    presensi_ronda: [],
  };

  current.unshift(newJadwal);
  saveAllJadwalRonda(current);
  return newJadwal;
}

export function prosesAutoDendaRondaStore(jadwalId: string): { success: boolean; totalAlfa: number; error?: string } {
  const current = getAllJadwalRonda();
  const target = current.find((j) => j.id === jadwalId);
  if (!target) return { success: false, totalAlfa: 0, error: 'Jadwal tidak ditemukan' };
  if (target.is_processed_denda) return { success: false, totalAlfa: 0, error: 'Denda sudah diproses' };

  const hadirWargaIds = new Set(
    target.presensi_ronda.filter((p) => p.status === 'hadir' || p.status === 'izin').map((p) => p.warga_id)
  );

  let alfaCount = 0;
  target.peserta_ronda.forEach((p) => {
    if (!hadirWargaIds.has(p.warga_id)) {
      alfaCount++;
    }
  });

  target.is_processed_denda = true;
  saveAllJadwalRonda(current);
  return { success: true, totalAlfa: alfaCount };
}

// ==========================================
// 2. DAFTAR WARGA UNTUK PICKER RONDA
// ==========================================
export function getListWargaForRonda(): Array<{ id: string; nama_lengkap: string; hubungan_keluarga?: string }> {
  const units = getDbUnits();
  const result: Array<{ id: string; nama_lengkap: string; hubungan_keluarga?: string }> = [];

  units.forEach((u) => {
    (u.warga || []).forEach((w) => {
      result.push({
        id: w.id,
        nama_lengkap: `${w.nama_lengkap} (${u.blok_rumah}/${u.nomor_rumah})`,
        hubungan_keluarga: w.hubungan_keluarga,
      });
    });
  });

  return result.sort((a, b) => a.nama_lengkap.localeCompare(b.nama_lengkap, 'id'));
}

// ==========================================
// 3. JADWAL KERJA BAKTI STORE
// ==========================================
export function getAllJadwalKerjaBakti(): JadwalKerjaBaktiRecord[] {
  try {
    if (fs.existsSync(DB_KB_PATH)) {
      const raw = fs.readFileSync(DB_KB_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
      }
    }
  } catch (e) {
    console.error('Error reading db_jadwal_kerja_bakti.json:', e);
  }
  const fallback = getDefaultJson('db_jadwal_kerja_bakti.json');
  return Array.isArray(fallback) ? [...fallback] : [];
}

export function saveAllJadwalKerjaBakti(data: JadwalKerjaBaktiRecord[]): void {
  try {
    fs.writeFileSync(DB_KB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving db_jadwal_kerja_bakti.json:', e);
  }
}

export function createJadwalKerjaBaktiStore(input: {
  judul: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  lokasi: string;
}): JadwalKerjaBaktiRecord {
  const current = getAllJadwalKerjaBakti();
  const id = `kb-${input.tanggal}-${Date.now().toString().slice(-4)}`;
  const qr_token = 'KB-' + crypto.randomBytes(8).toString('hex').toUpperCase();

  const newKegiatan: JadwalKerjaBaktiRecord = {
    id,
    judul: input.judul,
    tanggal: input.tanggal,
    jam_mulai: input.jam_mulai,
    jam_selesai: input.jam_selesai,
    lokasi: input.lokasi,
    qr_token,
    is_processed_denda: false,
    presensi_kerja_bakti: [],
  };

  current.unshift(newKegiatan);
  saveAllJadwalKerjaBakti(current);
  return newKegiatan;
}

export function submitPresensiKBByQRStore(input: {
  qrToken: string;
  keluarga_id: string;
  nama_kepala: string;
  blok_rumah: string;
  nomor_rumah: string;
}): { success: boolean; error?: string } {
  const current = getAllJadwalKerjaBakti();
  const target = current.find((k) => k.qr_token === input.qrToken);
  if (!target) return { success: false, error: 'QR Code kegiatan tidak valid atau sudah kadaluarsa.' };

  const already = target.presensi_kerja_bakti.some((p) => p.keluarga_id === input.keluarga_id);
  if (already) return { success: false, error: 'Keluarga Anda sudah tercatat hadir pada kegiatan ini.' };

  target.presensi_kerja_bakti.push({
    id: `pkb-${Date.now()}`,
    jadwal_id: target.id,
    keluarga_id: input.keluarga_id,
    keluarga: {
      nama_kepala_keluarga: input.nama_kepala,
      blok_rumah: input.blok_rumah,
      nomor_rumah: input.nomor_rumah,
    },
  });

  saveAllJadwalKerjaBakti(current);
  return { success: true };
}
