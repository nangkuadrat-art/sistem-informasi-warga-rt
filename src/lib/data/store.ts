import fs from 'fs';
import path from 'path';
import { MASTER_UNITS_56, UnitRumahRT, WargaMember } from './masterDataGoogleSheets';
import { hitungUsia } from '../utils/age';
import { getDbFilePath } from './dbPathHelper';

const DB_PATH = getDbFilePath('db_warga.json');

// Inisialisasi file JSON jika belum ada
export function getDbUnits(): UnitRumahRT[] {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(MASTER_UNITS_56, null, 2), 'utf-8');
      return MASTER_UNITS_56;
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      fs.writeFileSync(DB_PATH, JSON.stringify(MASTER_UNITS_56, null, 2), 'utf-8');
      return MASTER_UNITS_56;
    }
    return parsed;
  } catch (e) {
    console.error('Error reading db_warga.json, fallback to MASTER_UNITS_56:', e);
    return MASTER_UNITS_56;
  }
}

export function saveDbUnits(units: UnitRumahRT[]): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(units, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing db_warga.json:', e);
  }
}

// 1. CREATE KELUARGA / UNIT RUMAH
export function createKeluargaStore(input: {
  nama_kepala_keluarga: string;
  blok_rumah: string;
  nomor_rumah: string;
  status_rumah: 'pemilik' | 'kontrak' | 'kost' | 'kosong';
  tanggal_lahir?: string;
  jenis_kelamin?: 'L' | 'P';
  no_hp?: string;
  alamat_lengkap?: string;
}): UnitRumahRT {
  const units = getDbUnits();
  const maxNo = units.reduce((max, u) => Math.max(max, u.no_unit || 0), 0);
  const nextNo = maxNo + 1;
  const unitId = `unit-${Date.now()}`;
  const blok = input.blok_rumah.trim().toUpperCase();
  const noRumah = input.nomor_rumah.trim();
  const alamat = `Blok ${blok}/${noRumah}`;
  const alamatLengkap = input.alamat_lengkap || `Perum BPTW Tritih Lor ${alamat}, Jeruklegi, Cilacap`;

  const headMember: WargaMember = {
    id: `w-${Date.now()}`,
    no_urut: 1,
    nama_lengkap: input.nama_kepala_keluarga.trim(),
    hubungan_keluarga: 'Kepala Keluarga',
    jenis_kelamin: input.jenis_kelamin || 'L',
    tanggal_lahir: input.tanggal_lahir || '1985-01-01',
    usia_text: input.tanggal_lahir ? `${hitungUsia(input.tanggal_lahir).usia} th` : '40 th',
    kategori_usia: input.tanggal_lahir ? hitungUsia(input.tanggal_lahir).kategori : 'Dewasa',
    status_pernikahan: 'Menikah',
    nomor_telepon: input.no_hp || '',
    status_warga: 'aktif',
  };

  const newUnit: UnitRumahRT = {
    id: unitId,
    no_unit: nextNo,
    alamat,
    blok_rumah: blok,
    nomor_rumah: noRumah,
    nama_kepala_keluarga: input.nama_kepala_keluarga.trim(),
    username: input.nama_kepala_keluarga.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10),
    role: 'warga',
    role_label: 'Warga',
    status_rumah: input.status_rumah,
    status_keluarga: 'aktif',
    alamat_lengkap: alamatLengkap,
    iuran_pokok: 50000,
    denda_ronda: 0,
    denda_kerja_bakti: 0,
    total_denda: 0,
    tunggakan_bulan_lalu: 0,
    total_tagihan: 50000,
    total_terbayar: 0,
    status_bayar: 'belum_bayar',
    warga: [headMember],
  };

  units.unshift(newUnit); // letakkan paling atas agar mudah terlihat
  saveDbUnits(units);
  return newUnit;
}

// 2. UPDATE KELUARGA / UNIT RUMAH
export function updateKeluargaStore(
  id: string,
  input: {
    nama_kepala_keluarga?: string;
    blok_rumah?: string;
    nomor_rumah?: string;
    status_rumah?: 'pemilik' | 'kontrak' | 'kost' | 'kosong';
    status_keluarga?: 'aktif' | 'nonaktif' | 'pindah';
    alamat_lengkap?: string;
    role_label?: string;
  }
): UnitRumahRT | null {
  const units = getDbUnits();
  const unit = units.find((u) => u.id === id);
  if (!unit) return null;

  if (input.nama_kepala_keluarga !== undefined) {
    unit.nama_kepala_keluarga = input.nama_kepala_keluarga.trim();
    // Jika ada anggota kepala keluarga, sinkronkan namanya
    const kepala = unit.warga.find((w) => w.hubungan_keluarga === 'Kepala Keluarga');
    if (kepala && input.nama_kepala_keluarga !== '-') {
      kepala.nama_lengkap = input.nama_kepala_keluarga.trim();
    }
  }

  if (input.blok_rumah !== undefined) {
    unit.blok_rumah = input.blok_rumah.trim().toUpperCase();
  }

  if (input.nomor_rumah !== undefined) {
    unit.nomor_rumah = input.nomor_rumah.trim();
  }

  if (input.blok_rumah || input.nomor_rumah) {
    unit.alamat = `Blok ${unit.blok_rumah}/${unit.nomor_rumah}`;
    unit.alamat_lengkap = `Perum BPTW Tritih Lor ${unit.alamat}, Jeruklegi, Cilacap`;
  }

  if (input.status_rumah !== undefined) {
    unit.status_rumah = input.status_rumah;
    if (input.status_rumah === 'kosong') {
      unit.status_keluarga = 'nonaktif';
      unit.nama_kepala_keluarga = '-';
      unit.status_bayar = 'kosong';
    }
  }

  if (input.status_keluarga !== undefined) {
    unit.status_keluarga = input.status_keluarga;
  }

  if (input.role_label !== undefined) {
    unit.role_label = input.role_label;
  }

  if (input.alamat_lengkap !== undefined) {
    unit.alamat_lengkap = input.alamat_lengkap;
  }

  saveDbUnits(units);
  return unit;
}

// 3. DELETE KELUARGA / UNIT RUMAH
export function deleteKeluargaStore(id: string): boolean {
  const units = getDbUnits();
  const filtered = units.filter((u) => u.id !== id);
  if (filtered.length === units.length) return false;
  saveDbUnits(filtered);
  return true;
}

// 4. ADD ANGGOTA KELUARGA
export function addAnggotaStore(
  keluargaId: string,
  input: {
    nama_lengkap: string;
    hubungan_keluarga: string;
    jenis_kelamin: 'L' | 'P';
    tanggal_lahir: string;
    tempat_lahir?: string;
    status_pernikahan?: string;
    nomor_telepon?: string;
  }
): WargaMember | null {
  const units = getDbUnits();
  const unit = units.find((u) => u.id === keluargaId);
  if (!unit) return null;

  const infoUsia = hitungUsia(input.tanggal_lahir);
  const nextNo = (unit.warga?.length || 0) + 1;

  const newMember: WargaMember = {
    id: `w-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    no_urut: nextNo,
    nama_lengkap: input.nama_lengkap.trim(),
    hubungan_keluarga: input.hubungan_keluarga,
    jenis_kelamin: input.jenis_kelamin,
    tempat_lahir: input.tempat_lahir || 'Cilacap',
    tanggal_lahir: input.tanggal_lahir,
    usia_text: `${infoUsia.usia} th`,
    kategori_usia: infoUsia.kategori,
    status_pernikahan: input.status_pernikahan || 'Belum Menikah',
    nomor_telepon: input.nomor_telepon || '',
    status_warga: 'aktif',
  };

  if (!unit.warga) unit.warga = [];
  unit.warga.push(newMember);

  // Jika hubungan_keluarga adalah Kepala Keluarga, update unit.nama_kepala_keluarga
  if (input.hubungan_keluarga === 'Kepala Keluarga') {
    unit.nama_kepala_keluarga = newMember.nama_lengkap;
  }

  saveDbUnits(units);
  return newMember;
}

// 5. UPDATE ANGGOTA KELUARGA
export function updateAnggotaStore(
  keluargaId: string,
  anggotaId: string,
  input: {
    nama_lengkap?: string;
    hubungan_keluarga?: string;
    jenis_kelamin?: 'L' | 'P';
    tanggal_lahir?: string;
    tempat_lahir?: string;
    status_pernikahan?: string;
    nomor_telepon?: string;
    status_warga?: 'aktif' | 'pindah' | 'meninggal';
  }
): WargaMember | null {
  const units = getDbUnits();
  const unit = units.find((u) => u.id === keluargaId);
  if (!unit) return null;

  const member = unit.warga.find((w) => w.id === anggotaId);
  if (!member) return null;

  if (input.nama_lengkap !== undefined) {
    member.nama_lengkap = input.nama_lengkap.trim();
    if (member.hubungan_keluarga === 'Kepala Keluarga') {
      unit.nama_kepala_keluarga = member.nama_lengkap;
    }
  }

  if (input.hubungan_keluarga !== undefined) {
    member.hubungan_keluarga = input.hubungan_keluarga;
    if (input.hubungan_keluarga === 'Kepala Keluarga') {
      unit.nama_kepala_keluarga = member.nama_lengkap;
    }
  }

  if (input.jenis_kelamin !== undefined) {
    member.jenis_kelamin = input.jenis_kelamin;
  }

  if (input.tanggal_lahir !== undefined) {
    member.tanggal_lahir = input.tanggal_lahir;
    const infoUsia = hitungUsia(input.tanggal_lahir);
    member.usia_text = `${infoUsia.usia} th`;
    member.kategori_usia = infoUsia.kategori;
  }

  if (input.tempat_lahir !== undefined) {
    member.tempat_lahir = input.tempat_lahir;
  }

  if (input.status_pernikahan !== undefined) {
    member.status_pernikahan = input.status_pernikahan;
  }

  if (input.nomor_telepon !== undefined) {
    member.nomor_telepon = input.nomor_telepon;
  }

  if (input.status_warga !== undefined) {
    member.status_warga = input.status_warga;
  }

  saveDbUnits(units);
  return member;
}

// 6. DELETE ANGGOTA KELUARGA
export function deleteAnggotaStore(keluargaId: string, anggotaId: string): boolean {
  const units = getDbUnits();
  const unit = units.find((u) => u.id === keluargaId);
  if (!unit) return false;

  const initialCount = unit.warga.length;
  unit.warga = unit.warga.filter((w) => w.id !== anggotaId);
  if (unit.warga.length === initialCount) return false;

  // Jika anggota yang dihapus adalah kepala keluarga dan masih ada anggota lain
  if (unit.warga.length > 0 && !unit.warga.some((w) => w.hubungan_keluarga === 'Kepala Keluarga')) {
    unit.warga[0].hubungan_keluarga = 'Kepala Keluarga';
    unit.nama_kepala_keluarga = unit.warga[0].nama_lengkap;
  } else if (unit.warga.length === 0) {
    unit.nama_kepala_keluarga = '-';
  }

  saveDbUnits(units);
  return true;
}

// 7. RESET KE MASTER DATA GOOGLE SHEETS
export function resetDbUnits(): void {
  saveDbUnits(MASTER_UNITS_56);
}
