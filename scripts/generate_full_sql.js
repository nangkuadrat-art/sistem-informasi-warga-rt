const fs = require('fs');
const xlsx = require('xlsx');

function excelSerialToDate(serial) {
  if (!serial || typeof serial !== 'number') return '1985-01-01';
  const utc_days = Math.floor(serial - 25569);
  const date = new Date(utc_days * 86400 * 1000);
  return date.toISOString().split('T')[0];
}

function escapeSql(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "''");
}

const excelPath = 'C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14.xlsx';
const wb = xlsx.readFile(excelPath);

const akunSheet = xlsx.utils.sheet_to_json(wb.Sheets['AKUN'], { header: 1 });
const rekapSheet = xlsx.utils.sheet_to_json(wb.Sheets['REKAP ANGGOTA KELUARGA'], { header: 1 });
const sepSheet = xlsx.utils.sheet_to_json(wb.Sheets['KAS SEPTEMBER 2026'], { header: 1 });
const oktSheet = xlsx.utils.sheet_to_json(wb.Sheets['KAS OKTOBER 2026'], { header: 1 });

const units = [];
for (let i = 6; i < akunSheet.length; i++) {
  const r = akunSheet[i];
  if (!r || !r[0]) continue;
  const no = Number(r[0]);
  const rawAlamat = String(r[1]).trim();
  const kk = r[2] ? String(r[2]).trim() : '-';
  const username = r[3] && r[3] !== '-' ? String(r[3]).trim().toLowerCase() : null;
  const pengurusRole = r[4] ? String(r[4]).trim() : null;
  const statusAkun = r[6] ? String(r[6]).trim() : 'Non-Aktif';

  const m = rawAlamat.match(/Blok\s*([A-Za-z]+)\/(\d+)/i);
  const blok = m ? m[1].toUpperCase() : '';
  const noRumah = m ? m[2] : '';

  units.push({
    no,
    uuid: `00000000-0000-0000-0000-${String(no).padStart(12, '0')}`,
    rawAlamat,
    blok,
    noRumah,
    kk,
    username,
    pengurusRole,
    statusAkun,
    statusRumah: statusAkun === 'Aktif' ? 'pemilik' : 'kosong',
    statusKeluarga: statusAkun === 'Aktif' ? 'aktif' : 'pindah',
    members: []
  });
}

// Parse members
for (let i = 5; i < rekapSheet.length; i++) {
  const r = rekapSheet[i];
  if (!r || !r[0]) continue;
  const no = r[0];
  const blok = String(r[1] || '').trim().toUpperCase();
  const noRumah = String(r[2] || '').trim();
  const nama = String(r[4] || '').trim();
  const hubungan = String(r[5] || '').trim();
  const jk = String(r[6] || '').trim().toLowerCase().startsWith('l') ? 'L' : 'P';
  const tempatLahir = r[7] ? String(r[7]).trim() : 'Cilacap';
  const tglLahir = excelSerialToDate(r[8]);
  const noHp = r[12] ? String(r[12]).trim() : '';

  const targetUnit = units.find(u => u.blok === blok && String(u.noRumah) === noRumah);
  if (targetUnit) {
    targetUnit.members.push({
      no,
      uuid: `11111111-1111-1111-1111-${String(no).padStart(12, '0')}`,
      nama,
      hubungan,
      jk,
      tempatLahir,
      tglLahir,
      noHp
    });
  }
}

// Add KK if no member
let extMemberNo = 500;
units.forEach(u => {
  if (u.members.length === 0 && u.statusAkun === 'Aktif' && u.kk !== '-') {
    extMemberNo++;
    u.members.push({
      no: extMemberNo,
      uuid: `11111111-1111-1111-1111-${String(extMemberNo).padStart(12, '0')}`,
      nama: u.kk,
      hubungan: 'Kepala Keluarga',
      jk: 'L',
      tempatLahir: 'Cilacap',
      tglLahir: '1982-05-15',
      noHp: ''
    });
  }
});

let sql = `-- ============================================================================
-- SKEMA LENGKAP & SEED DATA RT 03 / RW 14 PERUM BPTW TRITIH LOR, KEC. JERUKLEGI, CILACAP
-- Multi-Period Rolling Kas System: September 2026 (Closed) & Oktober 2026 (Open)
-- 15 Kolom Lengkap Sesuai Google Spreadsheet Resmi Pengurus RT
-- Struktur: 56 Unit Rumah, 132 Jiwa Warga, Mutasi Kas & Tagihan Bergulir Antar-Bulan
-- NOTE: NIK & No KK Ditiadakan Sesuai Permintaan Privasi Warga
-- ============================================================================

-- 1. DROP EXISTING TABLES (JIKA RESET)
DROP TABLE IF EXISTS absensi_kerja_bakti CASCADE;
DROP TABLE IF EXISTS jadwal_kerja_bakti CASCADE;
DROP TABLE IF EXISTS absensi_ronda CASCADE;
DROP TABLE IF EXISTS jadwal_ronda CASCADE;
DROP TABLE IF EXISTS log_denda CASCADE;
DROP TABLE IF EXISTS tagihan_bulanan CASCADE;
DROP TABLE IF EXISTS transaksi_kas CASCADE;
DROP TABLE IF EXISTS periode_buku CASCADE;
DROP TABLE IF EXISTS warga CASCADE;
DROP TABLE IF EXISTS keluarga CASCADE;
DROP TABLE IF EXISTS pengaturan_rt CASCADE;

-- 2. ENUMS
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_user') THEN
        CREATE TYPE role_user AS ENUM ('superadmin', 'ketua_rt', 'bendahara', 'keamanan', 'warga');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_tempat_tinggal') THEN
        CREATE TYPE status_tempat_tinggal AS ENUM ('pemilik', 'kontrak', 'kost', 'kosong');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_keaktifan_warga') THEN
        CREATE TYPE status_keaktifan_warga AS ENUM ('aktif', 'pindah', 'meninggal');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_periode_kas') THEN
        CREATE TYPE status_periode_kas AS ENUM ('open', 'closed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'jenis_transaksi_kas') THEN
        CREATE TYPE jenis_transaksi_kas AS ENUM ('masuk', 'keluar');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kategori_transaksi') THEN
        CREATE TYPE kategori_transaksi AS ENUM ('saldo_awal', 'iuran_warga', 'donasi', 'operasional', 'keamanan', 'konsumsi', 'sosial', 'kebersihan', 'pembangunan', 'perbaikan', 'apresiasi_pengurus', 'lainnya');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_bayar_tagihan') THEN
        CREATE TYPE status_bayar_tagihan AS ENUM ('belum_bayar', 'sebagian', 'lunas');
    END IF;
END $$;

-- 3. MASTER PENGATURAN RT
CREATE TABLE pengaturan_rt (
    id SERIAL PRIMARY KEY,
    nama_rt_rw VARCHAR(100) NOT NULL DEFAULT 'RT 03 / RW 14 Tritih Lor',
    nominal_iuran_pokok DECIMAL(12,2) NOT NULL DEFAULT 50000.00,
    nominal_denda_ronda DECIMAL(12,2) NOT NULL DEFAULT 20000.00,
    nominal_denda_kerja_bakti DECIMAL(12,2) NOT NULL DEFAULT 25000.00,
    pos_ronda_latitude DECIMAL(10,8) DEFAULT -7.674312,
    pos_ronda_longitude DECIMAL(11,8) DEFAULT 109.043511,
    radius_toleransi_meter INT DEFAULT 60,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. KELUARGA (56 UNIT RUMAH)
CREATE TABLE keluarga (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    no_unit INT UNIQUE NOT NULL,
    nama_kepala_keluarga VARCHAR(150) NOT NULL,
    blok_rumah VARCHAR(10) NOT NULL,
    nomor_rumah VARCHAR(10) NOT NULL,
    alamat_lengkap TEXT NOT NULL,
    status_rumah status_tempat_tinggal NOT NULL DEFAULT 'pemilik',
    status_keluarga status_keaktifan_warga NOT NULL DEFAULT 'aktif',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. WARGA JIWA (132 WARGA)
CREATE TABLE warga (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keluarga_id UUID REFERENCES keluarga(id) ON DELETE CASCADE,
    nama_lengkap VARCHAR(150) NOT NULL,
    jenis_kelamin VARCHAR(1) NOT NULL CHECK (jenis_kelamin IN ('L', 'P')),
    tanggal_lahir DATE NOT NULL,
    tempat_lahir VARCHAR(100),
    hubungan_keluarga VARCHAR(50) NOT NULL,
    no_hp VARCHAR(20),
    status_warga status_keaktifan_warga NOT NULL DEFAULT 'aktif',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. PERIODE BUKU
CREATE TABLE periode_buku (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bulan INT NOT NULL CHECK (bulan BETWEEN 1 AND 12),
    tahun INT NOT NULL CHECK (tahun >= 2024),
    saldo_awal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    saldo_akhir DECIMAL(12,2),
    status status_periode_kas NOT NULL DEFAULT 'open',
    closed_at TIMESTAMP WITH TIME ZONE,
    catatan_closing TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(bulan, tahun)
);

-- 7. TRANSAKSI KAS
CREATE TABLE transaksi_kas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    periode_id UUID NOT NULL REFERENCES periode_buku(id) ON DELETE RESTRICT,
    kategori kategori_transaksi NOT NULL,
    jenis jenis_transaksi_kas NOT NULL,
    nominal DECIMAL(12,2) NOT NULL CHECK (nominal >= 0),
    keterangan TEXT NOT NULL,
    bukti_struk_url TEXT,
    tanggal_transaksi DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TAGIHAN BULANAN (15 KOLOM SPREADSHEET LENGKAP)
CREATE TABLE tagihan_bulanan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    periode_id UUID NOT NULL REFERENCES periode_buku(id) ON DELETE RESTRICT,
    keluarga_id UUID NOT NULL REFERENCES keluarga(id) ON DELETE RESTRICT,
    tunggakan_bulan_lalu DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    titipan_bulan_lalu DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    iuran_pokok DECIMAL(12,2) NOT NULL DEFAULT 50000.00,
    denda_ronda DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    denda_kerja_bakti DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_denda DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_tagihan DECIMAL(12,2) NOT NULL,
    total_terbayar DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    kurang_lebih DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    donatur DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    titipan_depan DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status_bayar status_bayar_tagihan NOT NULL DEFAULT 'belum_bayar',
    status_label VARCHAR(50),
    keterangan TEXT,
    tanggal_bayar TIMESTAMP WITH TIME ZONE,
    metode_bayar VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(periode_id, keluarga_id)
);

-- SEED DATA 1: PENGATURAN RT
INSERT INTO pengaturan_rt (nama_rt_rw, nominal_iuran_pokok, nominal_denda_ronda, nominal_denda_kerja_bakti, pos_ronda_latitude, pos_ronda_longitude, radius_toleransi_meter)
VALUES ('RT 03 / RW 14 Perumahan BPTW Tritih Lor', 50000.00, 20000.00, 25000.00, -7.674312, 109.043511, 60);

-- SEED DATA 2: PERIODE BUKU (SEPTEMBER & OKTOBER 2026)
INSERT INTO periode_buku (id, bulan, tahun, saldo_awal, saldo_akhir, status, closed_at, catatan_closing)
VALUES 
('a0000000-0000-0000-0000-000000000926', 9, 2026, 5534500.00, 8902500.00, 'closed', '2026-09-30 23:59:59+07', 'Tutup buku September 2026. Saldo akhir Rp 8.902.500 digulirkan ke Oktober 2026.'),
('a0000000-0000-0000-0000-000000001026', 10, 2026, 8902500.00, 9933500.00, 'open', NULL, 'Periode aktif berjalan. Saldo awal bergulir dari September 2026.');

-- SEED DATA 3: 56 UNIT RUMAH
`;

units.forEach(u => {
  sql += `INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('${u.uuid}', ${u.no}, '${escapeSql(u.kk)}', '${escapeSql(u.blok)}', '${escapeSql(u.noRumah)}', 'Perum BPTW Tritih Lor ${escapeSql(u.rawAlamat)}, Jeruklegi, Cilacap', '${u.statusRumah}', '${u.statusKeluarga}');\n`;
});

sql += `\n-- SEED DATA 4: 132 WARGA JIWA\n`;
units.forEach(u => {
  u.members.forEach(m => {
    sql += `INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('${m.uuid}', '${u.uuid}', '${escapeSql(m.nama)}', '${m.jk}', '${m.tglLahir}', '${escapeSql(m.tempatLahir)}', '${escapeSql(m.hubungan)}', '${m.noHp}', 'aktif');\n`;
  });
});

sql += `\n-- SEED DATA 5: TRANSAKSI KAS SEPTEMBER 2026 (CLOSING SALDO: 8.902.500)\n`;
const sepTxList = [
  { id: 'b0000000-0000-0000-0000-000000090001', kat: 'saldo_awal', jenis: 'masuk', nom: 5534500, ket: 'Sisa Saldo Kas Bulan Sebelumnya (Agustus 2026)', tgl: '2026-09-01' },
  { id: 'b0000000-0000-0000-0000-000000090002', kat: 'iuran_warga', jenis: 'masuk', nom: 4747000, ket: 'Total Masukan Bersih Iuran Warga Bulan Ini', tgl: '2026-09-30' },
  { id: 'b0000000-0000-0000-0000-000000090003', kat: 'donasi', jenis: 'masuk', nom: 3435000, ket: 'Donatur Kas RT (Sumbangan Warga/Kegiatan)', tgl: '2026-09-30' },
  { id: 'b0000000-0000-0000-0000-000000090004', kat: 'apresiasi_pengurus', jenis: 'keluar', nom: 400000, ket: 'Dana Apresiasi Pengurus RT', tgl: '2026-09-30' },
  { id: 'b0000000-0000-0000-0000-000000090005', kat: 'sosial', jenis: 'keluar', nom: 1776000, ket: 'Dansos RW (6 Bulan: April s.d. September 2026)', tgl: '2026-09-30' },
  { id: 'b0000000-0000-0000-0000-000000090006', kat: 'konsumsi', jenis: 'keluar', nom: 120000, ket: 'Uang Snack Rapat RT (Bp. Bambang)', tgl: '2026-09-30' },
  { id: 'b0000000-0000-0000-0000-000000090007', kat: 'sosial', jenis: 'keluar', nom: 150000, ket: 'Ajangsana Anak Pak Dwi Utama (Sakit)', tgl: '2026-09-30' },
  { id: 'b0000000-0000-0000-0000-000000090008', kat: 'konsumsi', jenis: 'keluar', nom: 168000, ket: 'Akomodasi Konsumsi Kerja Bakti Warga 2026', tgl: '2026-09-30' },
  { id: 'b0000000-0000-0000-0000-000000090009', kat: 'kebersihan', jenis: 'keluar', nom: 200000, ket: 'Pembayaran Pengangkutan Sampah Pos ke Mas Bekti', tgl: '2026-09-30' },
  { id: 'b0000000-0000-0000-0000-000000090010', kat: 'pembangunan', jenis: 'keluar', nom: 1000000, ket: 'Iuran Pembangunan Balai RW 14', tgl: '2026-09-30' },
  { id: 'b0000000-0000-0000-0000-000000090011', kat: 'perbaikan', jenis: 'keluar', nom: 700000, ket: 'Perbaikan Penerangan Jalan Umum (PJU) Blok G', tgl: '2026-09-30' },
  { id: 'b0000000-0000-0000-0000-000000090012', kat: 'konsumsi', jenis: 'keluar', nom: 300000, ket: 'Biaya Konsumsi Gotong Royong Balai RW', tgl: '2026-09-30' },
];

sepTxList.forEach(t => {
  sql += `INSERT INTO transaksi_kas (id, periode_id, kategori, jenis, nominal, keterangan, tanggal_transaksi)
VALUES ('${t.id}', 'a0000000-0000-0000-0000-000000000926', '${t.kat}', '${t.jenis}', ${t.nom}.00, '${escapeSql(t.ket)}', '${t.tgl}');\n`;
});

sql += `\n-- SEED DATA 6: TRANSAKSI KAS OKTOBER 2026 (SALDO AWAL BERGULIR DARI SEPTEMBER: 8.902.500)\n`;
const oktTxList = [
  { id: 'b0000000-0000-0000-0000-000000100001', kat: 'saldo_awal', jenis: 'masuk', nom: 8902500, ket: 'Sisa Saldo Kas Bulan Sebelumnya (September 2026)', tgl: '2026-10-01' },
  { id: 'b0000000-0000-0000-0000-000000100002', kat: 'iuran_warga', jenis: 'masuk', nom: 1875000, ket: 'Total Masukan Bersih Iuran Warga Bulan Ini', tgl: '2026-10-31' },
  { id: 'b0000000-0000-0000-0000-000000100003', kat: 'operasional', jenis: 'keluar', nom: 400000, ket: 'Dana Apresiasi Pengurus RT', tgl: '2026-10-31' },
  { id: 'b0000000-0000-0000-0000-000000100004', kat: 'keamanan', jenis: 'keluar', nom: 203000, ket: 'Biaya Operasional Listrik Pos Ronda', tgl: '2026-10-31' },
  { id: 'b0000000-0000-0000-0000-000000100005', kat: 'keamanan', jenis: 'keluar', nom: 86000, ket: 'Tagihan Air Bersih PDAM Pos Ronda', tgl: '2026-10-31' },
  { id: 'b0000000-0000-0000-0000-000000100006', kat: 'konsumsi', jenis: 'keluar', nom: 120000, ket: 'Uang Snack Rapat RT (Bp. Hardi)', tgl: '2026-10-31' },
  { id: 'b0000000-0000-0000-0000-000000100007', kat: 'keamanan', jenis: 'keluar', nom: 35000, ket: 'Pembelian Obat Nyamuk Baigon untuk Pos Ronda', tgl: '2026-10-31' }
];

oktTxList.forEach(t => {
  sql += `INSERT INTO transaksi_kas (id, periode_id, kategori, jenis, nominal, keterangan, tanggal_transaksi)
VALUES ('${t.id}', 'a0000000-0000-0000-0000-000000001026', '${t.kat}', '${t.jenis}', ${t.nom}.00, '${escapeSql(t.ket)}', '${t.tgl}');\n`;
});

sql += `\n-- SEED DATA 7: TAGIHAN BULANAN SEPTEMBER 2026 (15 KOLOM SPREADSHEET LENGKAP)\n`;
for (let i = 25; i <= 80; i++) {
  const r = sepSheet[i];
  if (!r || !r[0]) continue;
  const no = Number(r[0]);
  const iuran = Number(r[3]) || 0;
  const dendaRonda = Number(r[4]) || 0;
  const dendaKB = Number(r[5]) || 0;
  const totalDenda = Number(r[6]) || 0;
  const titipanLalu = Number(r[7]) || 0;
  const tagihan = Number(r[8]) || 0;
  const bayar = Number(r[9]) || 0;
  const kurangLebih = Number(r[10]) || 0;
  const donatur = Number(r[11]) || 0;
  const titipanDepan = Number(r[12]) || 0;
  const statusStr = r[13] ? String(r[13]).trim() : '';
  const ket = r[14] ? String(r[14]).trim() : '';

  let tunggakanLalu = 0;
  if (titipanLalu > 0) tunggakanLalu = 0;
  else if (tagihan > (iuran + totalDenda)) tunggakanLalu = tagihan - (iuran + totalDenda);

  const statusBayar = tagihan === 0 ? 'belum_bayar' : (bayar >= tagihan ? 'lunas' : (bayar > 0 ? 'sebagian' : 'belum_bayar'));
  const unitUuid = `00000000-0000-0000-0000-${String(no).padStart(12, '0')}`;
  const tagihanUuid = `c0000000-0000-0000-0926-${String(no).padStart(12, '0')}`;

  sql += `INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('${tagihanUuid}', 'a0000000-0000-0000-0000-000000000926', '${unitUuid}', ${tunggakanLalu}.00, ${titipanLalu}.00, ${iuran}.00, ${dendaRonda}.00, ${dendaKB}.00, ${totalDenda}.00, ${tagihan}.00, ${bayar}.00, ${kurangLebih}.00, ${donatur}.00, ${titipanDepan}.00, '${statusBayar}', '${escapeSql(statusStr)}', '${escapeSql(ket)}');\n`;
}

sql += `\n-- SEED DATA 8: TAGIHAN BULANAN OKTOBER 2026 (15 KOLOM SPREADSHEET LENGKAP BERGULIR)\n`;
for (let i = 25; i <= 80; i++) {
  const r = oktSheet[i];
  if (!r || !r[0]) continue;
  const no = Number(r[0]);
  const iuran = Number(r[3]) || 0;
  const dendaRonda = Number(r[4]) || 0;
  const dendaKB = Number(r[5]) || 0;
  const totalDenda = Number(r[6]) || 0;
  const titipanLalu = Number(r[7]) || 0;
  const tagihan = Number(r[8]) || 0;
  const bayar = Number(r[9]) || 0;
  const kurangLebih = Number(r[10]) || 0;
  const donatur = Number(r[11]) || 0;
  const titipanDepan = Number(r[12]) || 0;
  const statusStr = r[13] ? String(r[13]).trim() : '';
  const ket = r[14] ? String(r[14]).trim() : '';

  let tunggakanLalu = 0;
  if (titipanLalu > 0) tunggakanLalu = 0;
  else if (tagihan > (iuran + totalDenda)) tunggakanLalu = tagihan - (iuran + totalDenda);

  const statusBayar = tagihan === 0 ? 'belum_bayar' : (bayar >= tagihan ? 'lunas' : (bayar > 0 ? 'sebagian' : 'belum_bayar'));
  const unitUuid = `00000000-0000-0000-0000-${String(no).padStart(12, '0')}`;
  const tagihanUuid = `c0000000-0000-0000-1026-${String(no).padStart(12, '0')}`;

  sql += `INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('${tagihanUuid}', 'a0000000-0000-0000-0000-000000001026', '${unitUuid}', ${tunggakanLalu}.00, ${titipanLalu}.00, ${iuran}.00, ${dendaRonda}.00, ${dendaKB}.00, ${totalDenda}.00, ${tagihan}.00, ${bayar}.00, ${kurangLebih}.00, ${donatur}.00, ${titipanDepan}.00, '${statusBayar}', '${escapeSql(statusStr)}', '${escapeSql(ket)}');\n`;
}

sql += `\n-- 9. ARSIP SURAT MENYURAT RT
CREATE TABLE IF NOT EXISTS surat_keluar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_surat VARCHAR(100) UNIQUE NOT NULL,
    jenis VARCHAR(50) NOT NULL,
    perihal VARCHAR(255) NOT NULL,
    lampiran VARCHAR(50) DEFAULT '-',
    tanggal_surat DATE NOT NULL DEFAULT CURRENT_DATE,
    tujuan_nama VARCHAR(150) NOT NULL,
    tujuan_alamat TEXT,
    acara_hari_tanggal VARCHAR(100),
    acara_waktu VARCHAR(100),
    acara_tempat VARCHAR(255),
    agenda TEXT,
    catatan_khusus TEXT,
    pemohon_nama VARCHAR(150),
    pemohon_tempat_lahir VARCHAR(100),
    pemohon_tanggal_lahir DATE,
    pemohon_usia VARCHAR(20),
    pemohon_kategori_usia VARCHAR(50),
    pemohon_jenis_kelamin VARCHAR(1),
    pemohon_agama VARCHAR(30),
    pemohon_pekerjaan VARCHAR(100),
    pemohon_alamat TEXT,
    keperluan_surat TEXT,
    keterangan_tambahan TEXT,
    berlaku_hingga VARCHAR(100),
    peringatan_tingkat VARCHAR(20),
    peringatan_pelanggaran TEXT,
    peringatan_uraian TEXT,
    peringatan_tenggat VARCHAR(100),
    peringatan_sanksi TEXT,
    penandatangan_nama VARCHAR(150) NOT NULL DEFAULT 'Yuli Ardinurman',
    penandatangan_jabatan VARCHAR(100) NOT NULL DEFAULT 'Ketua RT.03 / RW.14',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SEED DATA SURAT RESMI
INSERT INTO surat_keluar (nomor_surat, jenis, perihal, tanggal_surat, tujuan_nama, tujuan_alamat, acara_hari_tanggal, acara_waktu, acara_tempat, agenda, catatan_khusus)
VALUES 
('012/UND-RAPAT/RT03-RW14/XI/2026', 'undangan_rapat', 'Undangan Rapat Rutin Warga & Pertanggungjawaban Kas RT', '2026-11-15', 'Bapak/Ibu Seluruh Warga RT.03 / RW.14', 'Perumahan BPTW Tritih Lor, Cilacap', 'Minggu, 22 November 2026', '19.30 WIB (Ba’da Isya) s.d. Selesai', 'Rumah Ketua RT (Bp. Yuli Ardinurman) Blok I/3', '1. Laporan Kas Sep-Okt 2026\n2. Evaluasi Pos Kamling\n3. Gotong Royong Saluran Got', 'Dimohon hadir tepat waktu.'),
('008/UND-KB/RT03-RW14/XI/2026', 'undangan_kerja_bakti', 'Undangan Kerja Bakti Pembersihan Saluran Air & Fasum', '2026-11-18', 'Seluruh Warga RT.03 / RW.14 (1 Orang per KK)', 'Perumahan BPTW Tritih Lor, Cilacap', 'Minggu, 29 November 2026', '07.00 WIB s.d. 10.30 WIB', 'Pos Ronda RT.03 RW.14', '1. Pembersihan saluran air got Blok UT s.d L\n2. Penebangan ranting pohon liar\n3. Perapian Pos Ronda', 'Membawa alat kerja pribadi.');
`;

fs.writeFileSync('C:/Users/HP/.gemini/antigravity/scratch/sistem-informasi-warga-rt/supabase/schema_lengkap.sql', sql, 'utf-8');
console.log('Successfully generated full multi-period schema_lengkap.sql with 15 spreadsheet columns!');
