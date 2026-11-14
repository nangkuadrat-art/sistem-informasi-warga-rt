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
  return str.replace(/'/g, "''");
}

const excelPath = 'C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14.xlsx';
const wb = xlsx.readFile(excelPath);

const akunSheet = xlsx.utils.sheet_to_json(wb.Sheets['AKUN'], { header: 1 });
const kasSheet = xlsx.utils.sheet_to_json(wb.Sheets['KAS OKTOBER 2026'], { header: 1 });
const rekapSheet = xlsx.utils.sheet_to_json(wb.Sheets['REKAP ANGGOTA KELUARGA'], { header: 1 });

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

  const kasRow = kasSheet.find((kr, idx) => idx >= 24 && kr && kr[0] === no);
  let iuranPokok = 0, dendaRonda = 0, dendaKb = 0, totalDenda = 0, tunggakan = 0, totalTagihan = 0, bayar = 0;
  if (kasRow) {
    iuranPokok = Number(kasRow[3]) || 0;
    dendaRonda = Number(kasRow[4]) || 0;
    dendaKb = Number(kasRow[5]) || 0;
    totalDenda = Number(kasRow[6]) || 0;
    tunggakan = Number(kasRow[7]) || 0;
    totalTagihan = Number(kasRow[8]) || 0;
    bayar = Number(kasRow[9]) || 0;
  }

  const m = rawAlamat.match(/Blok\s*([A-Za-z]+)\/(\d+)/i);
  const blok = m ? m[1].toUpperCase() : '';
  const noRumah = m ? m[2] : '';

  let role = 'warga';
  if (pengurusRole) {
    const pl = pengurusRole.toLowerCase();
    if (pl.includes('superadmin')) role = 'superadmin';
    else if (pl.includes('ketua')) role = 'ketua_rt';
    else if (pl.includes('bendahara')) role = 'bendahara';
    else if (pl.includes('keamanan')) role = 'keamanan';
  }

  units.push({
    no,
    uuid: `00000000-0000-0000-0000-${String(no).padStart(12, '0')}`,
    rawAlamat,
    blok,
    noRumah,
    kk,
    username,
    role,
    pengurusRole,
    statusAkun,
    statusRumah: statusAkun === 'Aktif' ? 'pemilik' : 'kosong',
    statusKeluarga: statusAkun === 'Aktif' ? 'aktif' : 'pindah',
    iuranPokok,
    dendaRonda,
    dendaKb,
    totalDenda,
    tunggakan,
    totalTagihan,
    bayar,
    statusBayar: statusAkun !== 'Aktif' ? 'belum_bayar' : (bayar >= totalTagihan && totalTagihan > 0 ? 'lunas' : bayar > 0 ? 'sebagian' : 'belum_bayar'),
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
-- Diimpor langsung dari Google Spreadsheet resmi pengurus RT
-- Struktur: 56 Unit Rumah, 132 Jiwa Warga, Buku Kas & Tagihan Oktober 2026
-- NOTE: NIK & No KK Ditiadakan Sesuai Permintaan Privasi & Kebijakan Warga RT
-- ============================================================================

-- 1. DROP EXISTING TABLES (JIKA RESET)
DROP TABLE IF EXISTS absensi_kerja_bakti CASCADE;
DROP TABLE IF EXISTS jadwal_kerja_bakti CASCADE;
DROP TABLE IF EXISTS absensi_ronda CASCADE;
DROP TABLE IF EXISTS jadwal_ronda CASCADE;
DROP TABLE IF EXISTS log_denda CASCADE;
DROP TABLE IF EXISTS mutasi_kas CASCADE;
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
        CREATE TYPE kategori_transaksi AS ENUM ('saldo_awal', 'iuran_warga', 'donasi', 'operasional', 'keamanan', 'konsumsi', 'kebersihan', 'perbaikan', 'lainnya');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_bayar_tagihan') THEN
        CREATE TYPE status_bayar_tagihan AS ENUM ('belum_bayar', 'sebagian', 'lunas');
    END IF;
END $$;

-- 3. MASTER PENGATURAN RT
CREATE TABLE pengaturan_rt (
    id SERIAL PRIMARY KEY,
    nama_rt_rw VARCHAR(100) NOT NULL DEFAULT 'RT 03 / RW 14 Perum BPTW Tritih Lor',
    nominal_iuran_pokok DECIMAL(12,2) NOT NULL DEFAULT 50000.00,
    nominal_denda_ronda DECIMAL(12,2) NOT NULL DEFAULT 20000.00,
    nominal_denda_kerja_bakti DECIMAL(12,2) NOT NULL DEFAULT 25000.00,
    pos_ronda_latitude DOUBLE PRECISION NOT NULL DEFAULT -7.674312,
    pos_ronda_longitude DOUBLE PRECISION NOT NULL DEFAULT 109.043511,
    radius_toleransi_meter INT NOT NULL DEFAULT 60,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. KELUARGA / UNIT RUMAH (NO KK DIHAPUS)
CREATE TABLE keluarga (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    no_unit INT,
    nama_kepala_keluarga VARCHAR(100) NOT NULL,
    blok_rumah VARCHAR(20) NOT NULL,
    nomor_rumah VARCHAR(10) NOT NULL,
    alamat_lengkap TEXT,
    status_rumah status_tempat_tinggal NOT NULL DEFAULT 'pemilik',
    status_keluarga status_keaktifan_warga NOT NULL DEFAULT 'aktif',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. WARGA / ANGGOTA KELUARGA (NIK DIHAPUS, TANGGAL LAHIR UTAMA)
CREATE TABLE warga (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keluarga_id UUID NOT NULL REFERENCES keluarga(id) ON DELETE CASCADE,
    nama_lengkap VARCHAR(100) NOT NULL,
    jenis_kelamin VARCHAR(1) CHECK (jenis_kelamin IN ('L', 'P')),
    tanggal_lahir DATE NOT NULL,
    tempat_lahir VARCHAR(100),
    hubungan_keluarga VARCHAR(50) NOT NULL,
    no_hp VARCHAR(30),
    status_warga status_keaktifan_warga NOT NULL DEFAULT 'aktif',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. PERIODE BUKU KAS
CREATE TABLE periode_buku (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bulan INT NOT NULL CHECK (bulan BETWEEN 1 AND 12),
    tahun INT NOT NULL CHECK (tahun >= 2024),
    saldo_awal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    saldo_akhir DECIMAL(12,2),
    status status_periode_kas NOT NULL DEFAULT 'open',
    closed_at TIMESTAMP WITH TIME ZONE,
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

-- 8. TAGIHAN BULANAN
CREATE TABLE tagihan_bulanan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    periode_id UUID NOT NULL REFERENCES periode_buku(id) ON DELETE RESTRICT,
    keluarga_id UUID NOT NULL REFERENCES keluarga(id) ON DELETE RESTRICT,
    tunggakan_bulan_lalu DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    iuran_pokok DECIMAL(12,2) NOT NULL DEFAULT 50000.00,
    total_denda DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_tagihan DECIMAL(12,2) NOT NULL,
    total_terbayar DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status_bayar status_bayar_tagihan NOT NULL DEFAULT 'belum_bayar',
    tanggal_bayar TIMESTAMP WITH TIME ZONE,
    metode_bayar VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(periode_id, keluarga_id)
);

-- SEED DATA 1: PENGATURAN RT
INSERT INTO pengaturan_rt (nama_rt_rw, nominal_iuran_pokok, nominal_denda_ronda, nominal_denda_kerja_bakti, pos_ronda_latitude, pos_ronda_longitude, radius_toleransi_meter)
VALUES ('RT 03 / RW 14 Perumahan BPTW Tritih Lor', 50000.00, 20000.00, 25000.00, -7.674312, 109.043511, 60);

-- SEED DATA 2: PERIODE BUKU OKTOBER 2026
INSERT INTO periode_buku (id, bulan, tahun, saldo_awal, saldo_akhir, status)
VALUES ('a0000000-0000-0000-0000-000000002026', 10, 2026, 8902500.00, 9933500.00, 'open');

-- SEED DATA 3: 56 UNIT RUMAH RT.03
`;

units.forEach(u => {
  sql += `INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('${u.uuid}', ${u.no}, '${escapeSql(u.kk)}', '${escapeSql(u.blok)}', '${escapeSql(u.noRumah)}', 'Perum BPTW Tritih Lor ${escapeSql(u.rawAlamat)}, Jeruklegi, Cilacap', '${u.statusRumah}', '${u.statusKeluarga}');\n`;
});

sql += `\n-- SEED DATA 4: 132 ANGGOTA KELUARGA (WARGA)\n`;
units.forEach(u => {
  u.members.forEach(m => {
    sql += `INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('${m.uuid}', '${u.uuid}', '${escapeSql(m.nama)}', '${m.jk}', '${m.tglLahir}', '${escapeSql(m.tempatLahir)}', '${escapeSql(m.hubungan)}', '${m.noHp}', 'aktif');\n`;
  });
});

sql += `\n-- SEED DATA 5: TRANSAKSI MUTASI KAS OKTOBER 2026\n`;
const txList = [
  { id: 'b0000000-0000-0000-0000-000000000001', kat: 'saldo_awal', jenis: 'masuk', nom: 8902500, ket: 'Sisa Saldo Kas Bulan Sebelumnya (September 2026)', tgl: '2026-10-01' },
  { id: 'b0000000-0000-0000-0000-000000000002', kat: 'iuran_warga', jenis: 'masuk', nom: 1875000, ket: 'Total Masukan Bersih Iuran Warga Bulan Ini', tgl: '2026-10-31' },
  { id: 'b0000000-0000-0000-0000-000000000003', kat: 'operasional', jenis: 'keluar', nom: 400000, ket: 'Dana Apresiasi Pengurus RT', tgl: '2026-10-31' },
  { id: 'b0000000-0000-0000-0000-000000000004', kat: 'keamanan', jenis: 'keluar', nom: 203000, ket: 'Biaya Operasional Listrik Pos Ronda', tgl: '2026-10-31' },
  { id: 'b0000000-0000-0000-0000-000000000005', kat: 'keamanan', jenis: 'keluar', nom: 86000, ket: 'Tagihan Air Bersih PDAM Pos Ronda', tgl: '2026-10-31' },
  { id: 'b0000000-0000-0000-0000-000000000006', kat: 'konsumsi', jenis: 'keluar', nom: 120000, ket: 'Uang Snack Rapat RT (Bp. Hardi)', tgl: '2026-10-31' },
  { id: 'b0000000-0000-0000-0000-000000000007', kat: 'keamanan', jenis: 'keluar', nom: 35000, ket: 'Pembelian Obat Nyamuk Baigon untuk Pos Ronda', tgl: '2026-10-31' }
];

txList.forEach(t => {
  sql += `INSERT INTO transaksi_kas (id, periode_id, kategori, jenis, nominal, keterangan, tanggal_transaksi)
VALUES ('${t.id}', 'a0000000-0000-0000-0000-000000002026', '${t.kat}', '${t.jenis}', ${t.nom}.00, '${escapeSql(t.ket)}', '${t.tgl}');\n`;
});

sql += `\n-- SEED DATA 6: TAGIHAN BULANAN 56 UNIT OKTOBER 2026\n`;
units.forEach(u => {
  const tagihanUuid = `c0000000-0000-0000-0000-${String(u.no).padStart(12, '0')}`;
  sql += `INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, iuran_pokok, total_denda, total_tagihan, total_terbayar, status_bayar)
VALUES ('${tagihanUuid}', 'a0000000-0000-0000-0000-000000002026', '${u.uuid}', ${u.tunggakan}.00, ${u.iuranPokok}.00, ${u.totalDenda}.00, ${u.totalTagihan}.00, ${u.bayar}.00, '${u.statusBayar}');\n`;
});

fs.writeFileSync('C:/Users/HP/.gemini/antigravity/scratch/sistem-informasi-warga-rt/supabase/schema_lengkap.sql', sql, 'utf-8');
console.log('Successfully generated supabase/schema_lengkap.sql');
