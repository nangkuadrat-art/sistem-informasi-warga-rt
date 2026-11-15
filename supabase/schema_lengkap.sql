-- ============================================================================
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
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000001', 1, 'TITO', 'UT', '1', 'Perum BPTW Tritih Lor Blok UT/1, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000002', 2, '-', 'UT', '3', 'Perum BPTW Tritih Lor Blok UT/3, Jeruklegi, Cilacap', 'kosong', 'pindah');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000003', 3, 'Hardi Supangat', 'UT', '5', 'Perum BPTW Tritih Lor Blok UT/5, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000004', 4, 'INDRAWAN', 'UT', '7', 'Perum BPTW Tritih Lor Blok UT/7, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000005', 5, 'Sudarmadi', 'UT', '9', 'Perum BPTW Tritih Lor Blok UT/9, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000006', 6, '-', 'UT', '11', 'Perum BPTW Tritih Lor Blok UT/11, Jeruklegi, Cilacap', 'kosong', 'pindah');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000007', 7, 'NDARI', 'UT', '13', 'Perum BPTW Tritih Lor Blok UT/13, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000008', 8, 'IFAH', 'UT', '15', 'Perum BPTW Tritih Lor Blok UT/15, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000009', 9, 'Muhammad Faris Noveandri', 'UT', '17', 'Perum BPTW Tritih Lor Blok UT/17, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000010', 10, 'Antonius Bambang Sugiharto', 'UT', '19', 'Perum BPTW Tritih Lor Blok UT/19, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000011', 11, 'Dwi Kurnianto', 'UT', '21', 'Perum BPTW Tritih Lor Blok UT/21, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000012', 12, 'Agus', 'UT', '23', 'Perum BPTW Tritih Lor Blok UT/23, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000013', 13, '-', 'UT', '25', 'Perum BPTW Tritih Lor Blok UT/25, Jeruklegi, Cilacap', 'kosong', 'pindah');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000014', 14, 'HANI', 'E', '1', 'Perum BPTW Tritih Lor Blok E/1, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000015', 15, '-', 'E', '2', 'Perum BPTW Tritih Lor Blok E/2, Jeruklegi, Cilacap', 'kosong', 'pindah');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000016', 16, 'AMAL', 'E', '3', 'Perum BPTW Tritih Lor Blok E/3, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000017', 17, 'ANGGA', 'E', '4', 'Perum BPTW Tritih Lor Blok E/4, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000018', 18, 'Hadi Satriyo', 'E', '5', 'Perum BPTW Tritih Lor Blok E/5, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000019', 19, '-', 'E', '6', 'Perum BPTW Tritih Lor Blok E/6, Jeruklegi, Cilacap', 'kosong', 'pindah');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000020', 20, 'BE Santoso Nugroho', 'G', '1', 'Perum BPTW Tritih Lor Blok G/1, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000021', 21, 'Rachmat', 'G', '2', 'Perum BPTW Tritih Lor Blok G/2, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000022', 22, 'Joko Sulistiono', 'G', '3', 'Perum BPTW Tritih Lor Blok G/3, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000023', 23, 'Muhamad Arif Kuniyawan', 'G', '4', 'Perum BPTW Tritih Lor Blok G/4, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000024', 24, 'Luthfi Ramadhan', 'G', '5', 'Perum BPTW Tritih Lor Blok G/5, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000025', 25, 'Deny Dwi Wasana', 'G', '6', 'Perum BPTW Tritih Lor Blok G/6, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000026', 26, 'Binar Surya Fajar Putra Dewayahna', 'G', '7', 'Perum BPTW Tritih Lor Blok G/7, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000027', 27, '-', 'G', '8', 'Perum BPTW Tritih Lor Blok G/8, Jeruklegi, Cilacap', 'kosong', 'pindah');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000028', 28, 'Toto Citramurti', 'G', '9', 'Perum BPTW Tritih Lor Blok G/9, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000029', 29, 'Kusoy', 'G', '10', 'Perum BPTW Tritih Lor Blok G/10, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000030', 30, '-', 'G', '11', 'Perum BPTW Tritih Lor Blok G/11, Jeruklegi, Cilacap', 'kosong', 'pindah');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000031', 31, 'Muhamad Fajri Kurniawan', 'G', '12', 'Perum BPTW Tritih Lor Blok G/12, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000032', 32, 'ARDY', 'I', '1', 'Perum BPTW Tritih Lor Blok I/1, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000033', 33, '-', 'I', '2', 'Perum BPTW Tritih Lor Blok I/2, Jeruklegi, Cilacap', 'kosong', 'pindah');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000034', 34, 'Yuli Ardinurman', 'I', '3', 'Perum BPTW Tritih Lor Blok I/3, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000035', 35, 'Lukman Harun', 'I', '4', 'Perum BPTW Tritih Lor Blok I/4, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000036', 36, 'Bayu Aji Girawan', 'I', '5', 'Perum BPTW Tritih Lor Blok I/5, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000037', 37, 'Dimas Danu Sohiban', 'I', '6', 'Perum BPTW Tritih Lor Blok I/6, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000038', 38, 'Nanang Dedi Arianto', 'I', '7', 'Perum BPTW Tritih Lor Blok I/7, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000039', 39, 'Sofyan Ariwibowo Sidik', 'I', '8', 'Perum BPTW Tritih Lor Blok I/8, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000040', 40, 'Nuryanto', 'I', '9', 'Perum BPTW Tritih Lor Blok I/9, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000041', 41, 'Muammar Agung Riyand Cha''baia', 'I', '10', 'Perum BPTW Tritih Lor Blok I/10, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000042', 42, 'Ganesha Brahma Umbara', 'I', '11', 'Perum BPTW Tritih Lor Blok I/11, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000043', 43, '-', 'K', '1', 'Perum BPTW Tritih Lor Blok K/1, Jeruklegi, Cilacap', 'kosong', 'pindah');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000044', 44, 'Fob Budhiyono, S.H.', 'K', '2', 'Perum BPTW Tritih Lor Blok K/2, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000045', 45, 'Belman Sihombing', 'K', '3', 'Perum BPTW Tritih Lor Blok K/3, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000046', 46, 'Deni', 'K', '4', 'Perum BPTW Tritih Lor Blok K/4, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000047', 47, 'Andri', 'K', '5', 'Perum BPTW Tritih Lor Blok K/5, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000048', 48, 'Dwi. M', 'K', '6', 'Perum BPTW Tritih Lor Blok K/6, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000049', 49, 'Anwar Sanusi', 'K', '7', 'Perum BPTW Tritih Lor Blok K/7, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000050', 50, '-', 'K', '8', 'Perum BPTW Tritih Lor Blok K/8, Jeruklegi, Cilacap', 'kosong', 'pindah');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000051', 51, 'Yogi Ariyanto', 'K', '9', 'Perum BPTW Tritih Lor Blok K/9, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000052', 52, 'Eva Dwijayadi', 'K', '10', 'Perum BPTW Tritih Lor Blok K/10, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000053', 53, 'Rodif Rusyidanu Suwandi', 'L', '1', 'Perum BPTW Tritih Lor Blok L/1, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000054', 54, 'Deddy Judo Prayogo', 'L', '2', 'Perum BPTW Tritih Lor Blok L/2, Jeruklegi, Cilacap', 'pemilik', 'aktif');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000055', 55, '-', 'L', '3', 'Perum BPTW Tritih Lor Blok L/3, Jeruklegi, Cilacap', 'kosong', 'pindah');
INSERT INTO keluarga (id, no_unit, nama_kepala_keluarga, blok_rumah, nomor_rumah, alamat_lengkap, status_rumah, status_keluarga)
VALUES ('00000000-0000-0000-0000-000000000056', 56, '-', 'L', '4', 'Perum BPTW Tritih Lor Blok L/4, Jeruklegi, Cilacap', 'kosong', 'pindah');

-- SEED DATA 4: 132 WARGA JIWA
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000110', '00000000-0000-0000-0000-000000000001', 'Tito', 'L', '1992-11-11', 'Cilacap', 'Kepala Keluarga', '6287733447443', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000111', '00000000-0000-0000-0000-000000000003', 'Hardi Supangat', 'L', '1961-02-17', 'Cilacap', 'Kepala Keluarga', '6282322775172', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000112', '00000000-0000-0000-0000-000000000003', 'Maryani', 'P', '1964-10-02', 'Palembang', 'Istri', '6282322775172', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000113', '00000000-0000-0000-0000-000000000003', 'Ranti Hardiyani', 'P', '1991-01-12', 'Cilacap', 'Anak', '6282322775172', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000114', '00000000-0000-0000-0000-000000000003', 'Gina Okta Mulia', 'P', '1999-10-28', 'Cilacap', 'Anak', '6282322775172', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000501', '00000000-0000-0000-0000-000000000004', 'INDRAWAN', 'L', '1982-05-15', 'Cilacap', 'Kepala Keluarga', '', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000115', '00000000-0000-0000-0000-000000000005', 'Sudarmadi', 'L', '1958-05-02', 'Kebumen', 'Kepala Keluarga', '6281327473448', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000116', '00000000-0000-0000-0000-000000000005', 'Suminah', 'P', '1968-10-21', 'Cilacap', 'Istri', '6281327473448', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000117', '00000000-0000-0000-0000-000000000005', 'Teguh Riyanto', 'L', '1999-08-15', 'Cilacap', 'Anak', '6281327473448', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000118', '00000000-0000-0000-0000-000000000007', 'Ndari', 'P', '1992-11-11', 'Cilacap', 'Kepala Keluarga', '625866449655', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000119', '00000000-0000-0000-0000-000000000008', 'Ifah', 'P', '1992-11-11', 'Cilacap', 'Kepala Keluarga', '6282329259364', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000120', '00000000-0000-0000-0000-000000000009', 'Muhammad Faris Noveandri', 'L', '1992-11-11', 'Cilacap', 'Kepala Keluarga', '6281226539131', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000121', '00000000-0000-0000-0000-000000000009', 'Dinda Sabila Rosada', 'P', '1994-05-03', 'Tegal', 'Istri', '6281226539131', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000122', '00000000-0000-0000-0000-000000000009', 'Azalea Zahrany Farisa', 'P', '2022-01-03', 'Cilacap', 'Anak', '6281226539131', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000123', '00000000-0000-0000-0000-000000000010', 'Antonius Bambang Sugiharto', 'L', '1954-03-18', 'Cilacap', 'Kepala Keluarga', '6281383745764', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000124', '00000000-0000-0000-0000-000000000010', 'Olga Yuliantini', 'P', '1960-07-11', 'Jakarta', 'Istri', '6281383745764', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000125', '00000000-0000-0000-0000-000000000011', 'Dwi Kurnianto', 'L', '1988-02-26', 'Cilacap', 'Kepala Keluarga', '6285647845292', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000126', '00000000-0000-0000-0000-000000000011', 'Siti Rachmawati', 'P', '1990-05-28', 'Cilacap', 'Istri', '6285647845292', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000127', '00000000-0000-0000-0000-000000000011', 'Rafisky Halim Abiya', 'L', '2015-09-24', 'Cilacap', 'Anak', '6285647845292', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000128', '00000000-0000-0000-0000-000000000011', 'Shazia Qairina Ramadhani', 'P', '2018-05-22', 'Cilacap', 'Anak', '6285647845292', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000502', '00000000-0000-0000-0000-000000000012', 'Agus', 'L', '1982-05-15', 'Cilacap', 'Kepala Keluarga', '', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000001', '00000000-0000-0000-0000-000000000014', 'Hani', 'P', '1992-11-11', 'Cilacap', 'Kepala Keluarga', '', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000002', '00000000-0000-0000-0000-000000000016', 'Amal', 'L', '1992-11-11', 'Cilacap', 'Kepala Keluarga', '6281275716698', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000003', '00000000-0000-0000-0000-000000000017', 'Priyangga', 'L', '1992-11-11', 'Cilacap', 'Kepala Keluarga', '6282213349902', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000004', '00000000-0000-0000-0000-000000000018', 'Hadi Satriyo', 'L', '1984-03-08', 'Banyumas', 'Kepala Keluarga', '62867007336', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000005', '00000000-0000-0000-0000-000000000018', 'Herlina Susanti', 'P', '1987-12-09', 'Cilacap', 'Istri', '62867007336', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000006', '00000000-0000-0000-0000-000000000018', 'Janeeta Putri Afiqah', 'P', '2012-04-28', 'Cilacap', 'Anak', '62867007336', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000007', '00000000-0000-0000-0000-000000000018', 'Rahmania Putri Alika', 'P', '2018-04-13', 'Cilacap', 'Anak', '62867007336', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000008', '00000000-0000-0000-0000-000000000020', 'BE Santoso Nugroho', 'L', '1976-05-24', 'Cilacap', 'Kepala Keluarga', '6285869450438', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000009', '00000000-0000-0000-0000-000000000020', 'Eka Noviana', 'P', '1976-11-07', 'Tegal', 'Istri', '6285869450438', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000010', '00000000-0000-0000-0000-000000000020', 'Kevin Ariel Nugroho Putra', 'L', '2006-02-01', 'Cilacap', 'Anak', '6285869450438', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000011', '00000000-0000-0000-0000-000000000020', 'Yeti Suniati', 'P', '1945-09-05', 'Garut', 'Orang Tua / Mertua', '6285869450438', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000012', '00000000-0000-0000-0000-000000000021', 'Rachmat', 'L', '1955-06-05', 'Banyumas', 'Kepala Keluarga', '6281227211182', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000013', '00000000-0000-0000-0000-000000000021', 'Sugiarti', 'P', '1970-11-10', 'Cilacap', 'Istri', '6281227211182', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000014', '00000000-0000-0000-0000-000000000021', 'Sekar Anggayuh Laras', 'P', '1997-01-29', 'Bogor', 'Anak', '6281227211182', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000015', '00000000-0000-0000-0000-000000000021', 'Tirta Fitri Puspa Harsari', 'P', '2002-12-05', 'Jakarta', 'Anak', '6281227211182', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000016', '00000000-0000-0000-0000-000000000022', 'Joko Sulistiono', 'L', '1968-10-07', 'Cilacap', 'Kepala Keluarga', '6282138935399', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000017', '00000000-0000-0000-0000-000000000022', 'Siti Nurjanah', 'P', '1978-03-15', 'Cilacap', 'Istri', '6282138935399', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000018', '00000000-0000-0000-0000-000000000022', 'Andartio Bangkit Samudro', 'L', '1999-05-20', 'Cilacap', 'Anak', '6282138935399', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000019', '00000000-0000-0000-0000-000000000022', 'Balqis Andira Noer Griselda', 'P', '2006-08-14', 'Cilacap', 'Anak', '6282138935399', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000020', '00000000-0000-0000-0000-000000000023', 'Muhamad Arif Kuniyawan', 'L', '1982-11-17', 'Kebumen', 'Kepala Keluarga', '6282353052767', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000021', '00000000-0000-0000-0000-000000000023', 'Megawaty', 'P', '1983-07-24', 'Tangerang', 'Istri', '6282353052767', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000022', '00000000-0000-0000-0000-000000000023', 'Ainayya Dhia Batrisya', 'P', '2012-03-27', 'Kebumen', 'Anak', '6282353052767', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000023', '00000000-0000-0000-0000-000000000023', 'Muhammad Aghna Paramayoga', 'L', '2016-03-28', 'Cilacap', 'Anak', '6282353052767', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000024', '00000000-0000-0000-0000-000000000023', 'Jennaira Cendikia Rahagi', 'P', '2020-09-01', 'Cilacap', 'Anak', '6282353052767', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000025', '00000000-0000-0000-0000-000000000024', 'Luthfi Ramadhan', 'L', '1998-01-02', 'Purworejo', 'Kepala Keluarga', '6285878897207', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000026', '00000000-0000-0000-0000-000000000024', 'Assissyah Nofa Tri Utami', 'P', '1999-11-09', 'Cilacap', 'Istri', '6285878897207', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000027', '00000000-0000-0000-0000-000000000024', 'Almira Rizqina Syarifa', 'P', '2025-07-10', 'Cilacap', 'Anak', '6285878897207', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000028', '00000000-0000-0000-0000-000000000025', 'Deny Dwi Wasana', 'L', '1986-01-24', 'Cilacap', 'Kepala Keluarga', '6281903426226', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000029', '00000000-0000-0000-0000-000000000025', 'Ester Oktaningsih', 'P', '1985-10-01', 'Cilacap', 'Istri', '6281903426226', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000030', '00000000-0000-0000-0000-000000000025', 'Sabrina Cahya Ningsih', 'P', '2012-09-24', 'Cilacap', 'Anak', '6281903426226', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000031', '00000000-0000-0000-0000-000000000025', 'Sahvira Dwi Ardani', 'P', '2017-02-06', 'Cilacap', 'Anak', '6281903426226', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000032', '00000000-0000-0000-0000-000000000026', 'Binar Surya Fajar Putra Dewayahna', 'L', '1995-09-11', 'Kebumen', 'Kepala Keluarga', '6287715427232', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000033', '00000000-0000-0000-0000-000000000026', 'Rizky Puspitaningtyas', 'P', '1996-11-28', 'Kebumen', 'Istri', '6287715427232', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000034', '00000000-0000-0000-0000-000000000026', 'Aqila Zalfa Thahirah', 'P', '2022-01-01', 'Kebumen', 'Anak', '6287715427232', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000035', '00000000-0000-0000-0000-000000000028', 'Toto Citramurti', 'L', '1988-10-19', 'Cilacap', 'Kepala Keluarga', '6285250975727', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000036', '00000000-0000-0000-0000-000000000028', 'Rakhmi Fatimah', 'P', '1988-06-10', 'Cilacap', 'Istri', '6285250975727', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000037', '00000000-0000-0000-0000-000000000028', 'Khosyi Nafisah', 'P', '2015-03-24', 'Cilacap', 'Anak', '6285250975727', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000038', '00000000-0000-0000-0000-000000000028', 'Aurum Mafaza', 'P', '2018-11-27', 'Kutai Timur', 'Anak', '6285250975727', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000039', '00000000-0000-0000-0000-000000000029', 'Kusoy', 'L', '1984-03-14', 'Ciamis', 'Kepala Keluarga', '6281294672008', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000040', '00000000-0000-0000-0000-000000000029', 'Nining Widianingrum', 'P', '1985-10-11', 'Cilacap', 'Istri', '6281294672008', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000041', '00000000-0000-0000-0000-000000000029', 'Aulia Alfarisqy', 'P', '2008-11-30', 'Cilacap', 'Anak', '6281294672008', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000042', '00000000-0000-0000-0000-000000000029', 'Aura Latisha Aquina', 'P', '2015-01-16', 'Cilacap', 'Anak', '6281294672008', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000043', '00000000-0000-0000-0000-000000000031', 'Muhamad Fajri Kurniawan', 'L', '1982-09-23', 'Cilacap', 'Kepala Keluarga', '6282121236255', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000044', '00000000-0000-0000-0000-000000000031', 'Lida Ayuningrum', 'P', '1993-04-25', 'Cilacap', 'Istri', '6282121236255', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000045', '00000000-0000-0000-0000-000000000031', 'Leandra Amelia Khasiffa', 'P', '2013-08-27', 'Cilacap', 'Anak', '6282121236255', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000046', '00000000-0000-0000-0000-000000000032', 'Ardy', 'L', '1992-11-11', 'Klaten', 'Kepala Keluarga', '628975015649', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000047', '00000000-0000-0000-0000-000000000034', 'Yuli Ardinurman', 'L', '1972-07-22', 'Jakarta', 'Kepala Keluarga', '6289682124112', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000048', '00000000-0000-0000-0000-000000000034', 'Murifah', 'P', '1971-04-13', 'Pekalongan', 'Istri', '6289682124112', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000049', '00000000-0000-0000-0000-000000000034', 'Nanda Sofie Octaviani', 'P', '2002-10-14', 'Pekalongan', 'Anak', '6289682124112', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000050', '00000000-0000-0000-0000-000000000035', 'Lukman Harun', 'L', '1987-02-17', 'Surabaya', 'Kepala Keluarga', '6281393289171', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000051', '00000000-0000-0000-0000-000000000035', 'Mar''atus Sholikhah', 'P', '1987-09-08', 'Cilacap', 'Istri', '6281393289171', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000052', '00000000-0000-0000-0000-000000000035', 'Aisyah Zahratul Aini', 'P', '2008-02-08', 'Cilacap', 'Anak', '6281393289171', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000053', '00000000-0000-0000-0000-000000000036', 'Bayu Aji Girawan', 'L', '1979-03-25', 'Cilacap', 'Kepala Keluarga', '6285643136059', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000054', '00000000-0000-0000-0000-000000000036', 'Fadliah Zainuddin', 'P', '1984-05-03', 'Ujung Pandang', 'Istri', '6285643136059', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000055', '00000000-0000-0000-0000-000000000036', 'Pedang Jagat Girawan', 'L', '2013-02-16', 'Cilacap', 'Anak', '6285643136059', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000056', '00000000-0000-0000-0000-000000000036', 'Annora Binar Kamania Girawan', 'P', '2017-09-21', 'Cilacap', 'Anak', '6285643136059', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000057', '00000000-0000-0000-0000-000000000037', 'Dimas Danu Sohiban', 'L', '1991-08-14', 'Cilacap', 'Kepala Keluarga', '6285600238781', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000058', '00000000-0000-0000-0000-000000000037', 'Ita Tresnawati Putri', 'P', '1997-01-22', 'Cilacap', 'Istri', '6285600238781', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000059', '00000000-0000-0000-0000-000000000037', 'Mikhaeel Hafizh Anwar', 'L', '2022-12-20', 'Banjar', 'Anak', '6285600238781', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000060', '00000000-0000-0000-0000-000000000037', 'Micheela Rubbina', 'P', '2025-03-27', 'Cilacap', 'Anak', '6285600238781', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000061', '00000000-0000-0000-0000-000000000038', 'Nanang Dedi Arianto', 'L', '1974-05-14', 'Cilacap', 'Kepala Keluarga', '6281327213027', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000062', '00000000-0000-0000-0000-000000000038', 'Tri Yana', 'P', '1982-05-31', 'Cilacap', 'Istri', '6281327213027', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000063', '00000000-0000-0000-0000-000000000038', 'Nafana Mega Nur Ariyanti', 'P', '2004-01-20', 'Cilacap', 'Anak', '6281327213027', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000064', '00000000-0000-0000-0000-000000000038', 'Calya Elvaretta Ariyanti', 'P', '2009-05-25', 'Cilacap', 'Anak', '6281327213027', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000065', '00000000-0000-0000-0000-000000000039', 'Sofyan Ariwibowo Sidik', 'L', '1991-09-26', 'Cilacap', 'Kepala Keluarga', '6281323541991', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000066', '00000000-0000-0000-0000-000000000039', 'Novia Wasiyanti', 'P', '1989-11-03', 'Cilacap', 'Istri', '6281323541991', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000067', '00000000-0000-0000-0000-000000000039', 'Farzana Kara Wibowo', 'P', '2016-10-08', 'Cilacap', 'Anak', '6281323541991', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000503', '00000000-0000-0000-0000-000000000040', 'Nuryanto', 'L', '1982-05-15', 'Cilacap', 'Kepala Keluarga', '', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000068', '00000000-0000-0000-0000-000000000041', 'Muammar Agung Riyand Cha''baia', 'L', '1991-08-30', 'Cilacap', 'Kepala Keluarga', '6282154714457', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000069', '00000000-0000-0000-0000-000000000041', 'Iin Mualifach', 'P', '1994-11-24', 'Cilacap', 'Istri', '6282154714457', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000070', '00000000-0000-0000-0000-000000000041', 'Tanzeela Elkhaira Yashbi', 'P', '2019-07-15', 'Cilacap', 'Anak', '6282154714457', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000071', '00000000-0000-0000-0000-000000000041', 'Taseefa Daneen Labiqa', 'P', '2022-12-11', 'Cilacap', 'Anak', '6282154714457', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000072', '00000000-0000-0000-0000-000000000042', 'Ganesha Brahma Umbara', 'L', '1986-02-22', 'Cilacap', 'Kepala Keluarga', '628562505396', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000073', '00000000-0000-0000-0000-000000000042', 'Nurul Setyasih', 'P', '1987-05-29', 'Boyolali', 'Istri', '628562505396', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000074', '00000000-0000-0000-0000-000000000042', 'Danish Aidan Ahza Syahm', 'L', '2013-08-31', 'Boyolali', 'Anak', '628562505396', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000075', '00000000-0000-0000-0000-000000000042', 'Almahyra Daniaa Ganesha', 'P', '2020-05-26', 'Cilacap', 'Anak', '628562505396', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000076', '00000000-0000-0000-0000-000000000044', 'Fob Budhiyono, S.H.', 'L', '1970-02-16', 'Kendal', 'Kepala Keluarga', '6282335708424', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000077', '00000000-0000-0000-0000-000000000044', 'Sri Hartanitawaty', 'P', '1976-09-17', 'Dompu', 'Istri', '6282335708424', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000078', '00000000-0000-0000-0000-000000000044', 'Arum Salsadila', 'P', '2000-04-23', 'Dompu', 'Anak', '6282335708424', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000079', '00000000-0000-0000-0000-000000000044', 'Alda Nabila Jovita', 'P', '2006-01-30', 'Mataram', 'Anak', '6282335708424', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000080', '00000000-0000-0000-0000-000000000045', 'Belman Sihombing', 'L', '1980-04-13', 'Pangaribuan', 'Kepala Keluarga', '6285701787593', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000081', '00000000-0000-0000-0000-000000000045', 'Eva Yunita Wulandari, S.E.', 'P', '1982-06-28', 'Cilacap', 'Istri', '6285701787593', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000082', '00000000-0000-0000-0000-000000000045', 'Aurellius Febian Sihombing', 'L', '2008-02-03', 'Cilacap', 'Anak', '6285701787593', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000083', '00000000-0000-0000-0000-000000000045', 'Alexander Tristan Sihombing', 'L', '2012-04-12', 'Cilacap', 'Anak', '6285701787593', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000084', '00000000-0000-0000-0000-000000000045', 'Gabriel Matthew Sihombing', 'L', '2013-11-18', 'Cilacap', 'Anak', '6285701787593', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000085', '00000000-0000-0000-0000-000000000046', 'Deny Sukmana', 'L', '1988-12-16', 'Cilacap', 'Kepala Keluarga', '6281247870646', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000086', '00000000-0000-0000-0000-000000000046', 'Tseany Shoviani', 'P', '1989-11-22', 'Cilacap', 'Istri', '6281247870646', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000504', '00000000-0000-0000-0000-000000000047', 'Andri', 'L', '1982-05-15', 'Cilacap', 'Kepala Keluarga', '', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000087', '00000000-0000-0000-0000-000000000048', 'Dwi Murdiantoro', 'L', '1974-12-18', 'Cirebon', 'Kepala Keluarga', '6281542614484', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000088', '00000000-0000-0000-0000-000000000048', 'Ellyana', 'P', '1987-11-16', 'Cilacap', 'Istri', '6281542614484', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000089', '00000000-0000-0000-0000-000000000048', 'Davin Rais Dwi Ramdhani', 'L', '2008-09-16', 'Cilacap', 'Anak', '6281542614484', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000090', '00000000-0000-0000-0000-000000000048', 'Dhafitha Nizza Nur Azizah', 'P', '2014-09-18', 'Cilacap', 'Anak', '6281542614484', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000091', '00000000-0000-0000-0000-000000000049', 'Anwar Sanusi', 'L', '1972-08-04', 'Cilacap', 'Kepala Keluarga', '6282322491093', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000092', '00000000-0000-0000-0000-000000000049', 'Sumaroh', 'P', '1969-08-21', 'Cilacap', 'Istri', '6282322491093', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000093', '00000000-0000-0000-0000-000000000049', 'Relynda Amany Yasarah', 'P', '2004-01-24', 'Cilacap', 'Anak', '6282322491093', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000094', '00000000-0000-0000-0000-000000000049', 'Jakiman Hadi Suwito', 'L', '1944-08-11', 'Cilacap', 'Orang Tua / Mertua', '6282322491093', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000095', '00000000-0000-0000-0000-000000000049', 'Altum', 'P', '1953-08-18', 'Cilacap', 'Orang Tua / Mertua', '6282322491093', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000096', '00000000-0000-0000-0000-000000000051', 'Yogi Ariyanto', 'L', '1983-12-16', 'Purbalingga', 'Kepala Keluarga', '6285693292182', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000097', '00000000-0000-0000-0000-000000000051', 'Eka Wahyuningsih', 'P', '1982-11-19', 'Banyumas', 'Istri', '6285693292182', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000098', '00000000-0000-0000-0000-000000000051', 'Satya Mufthy Darojat', 'L', '2012-05-14', 'Tangerang', 'Anak', '6285693292182', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000099', '00000000-0000-0000-0000-000000000051', 'Anindya Rizky Ramadhani', 'P', '2016-06-25', 'Cilacap', 'Anak', '6285693292182', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000100', '00000000-0000-0000-0000-000000000051', 'Haykal Azril Habibie', 'L', '2020-10-27', 'Cilacap', 'Anak', '6285693292182', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000101', '00000000-0000-0000-0000-000000000052', 'Eva Dwijayadi', 'L', '1989-12-22', 'Cilacap', 'Kepala Keluarga', '6285647761514', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000102', '00000000-0000-0000-0000-000000000052', 'Supriyatin', 'P', '1990-05-08', 'Banyumas', 'Istri', '6285647761514', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000103', '00000000-0000-0000-0000-000000000052', 'Dzaki Prima Difanza', 'L', '2013-06-24', 'Cilacap', 'Anak', '6285647761514', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000104', '00000000-0000-0000-0000-000000000052', 'Hilya Prima Azzahra', 'P', '2019-11-05', 'Cilacap', 'Anak', '6285647761514', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000105', '00000000-0000-0000-0000-000000000053', 'Rodif Rusyidanu Suwandi', 'L', '1993-07-10', 'Banyuwangi', 'Kepala Keluarga', '62811288336', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000106', '00000000-0000-0000-0000-000000000053', 'Lia Khoirunnisa', 'P', '1996-04-26', 'Kebumen', 'Istri', '62811288336', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000107', '00000000-0000-0000-0000-000000000053', 'Muhammad Agam Errusydan', 'L', '2021-04-27', 'Kebumen', 'Anak', '62811288336', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000108', '00000000-0000-0000-0000-000000000054', 'Deddy Judo Prayogo', 'L', '1991-08-22', 'Kebumen', 'Kepala Keluarga', '628125523663', 'aktif');
INSERT INTO warga (id, keluarga_id, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, hubungan_keluarga, no_hp, status_warga)
VALUES ('11111111-1111-1111-1111-000000000109', '00000000-0000-0000-0000-000000000054', 'Marthyana Indyaswari, S.Pd.', 'P', '1994-03-08', 'Cilacap', 'Istri', '628125523663', 'aktif');

-- SEED DATA 5: TRANSAKSI KAS SEPTEMBER 2026 (CLOSING SALDO: 8.902.500)
INSERT INTO transaksi_kas (id, periode_id, kategori, jenis, nominal, keterangan, tanggal_transaksi)
VALUES ('b0000000-0000-0000-0000-000000090001', 'a0000000-0000-0000-0000-000000000926', 'saldo_awal', 'masuk', 5534500.00, 'Sisa Saldo Kas Bulan Sebelumnya (Agustus 2026)', '2026-09-01');
INSERT INTO transaksi_kas (id, periode_id, kategori, jenis, nominal, keterangan, tanggal_transaksi)
VALUES ('b0000000-0000-0000-0000-000000090002', 'a0000000-0000-0000-0000-000000000926', 'iuran_warga', 'masuk', 4747000.00, 'Total Masukan Bersih Iuran Warga Bulan Ini', '2026-09-30');
INSERT INTO transaksi_kas (id, periode_id, kategori, jenis, nominal, keterangan, tanggal_transaksi)
VALUES ('b0000000-0000-0000-0000-000000090003', 'a0000000-0000-0000-0000-000000000926', 'donasi', 'masuk', 3435000.00, 'Donatur Kas RT (Sumbangan Warga/Kegiatan)', '2026-09-30');
INSERT INTO transaksi_kas (id, periode_id, kategori, jenis, nominal, keterangan, tanggal_transaksi)
VALUES ('b0000000-0000-0000-0000-000000090004', 'a0000000-0000-0000-0000-000000000926', 'apresiasi_pengurus', 'keluar', 400000.00, 'Dana Apresiasi Pengurus RT', '2026-09-30');
INSERT INTO transaksi_kas (id, periode_id, kategori, jenis, nominal, keterangan, tanggal_transaksi)
VALUES ('b0000000-0000-0000-0000-000000090005', 'a0000000-0000-0000-0000-000000000926', 'sosial', 'keluar', 1776000.00, 'Dansos RW (6 Bulan: April s.d. September 2026)', '2026-09-30');
INSERT INTO transaksi_kas (id, periode_id, kategori, jenis, nominal, keterangan, tanggal_transaksi)
VALUES ('b0000000-0000-0000-0000-000000090006', 'a0000000-0000-0000-0000-000000000926', 'konsumsi', 'keluar', 120000.00, 'Uang Snack Rapat RT (Bp. Bambang)', '2026-09-30');
INSERT INTO transaksi_kas (id, periode_id, kategori, jenis, nominal, keterangan, tanggal_transaksi)
VALUES ('b0000000-0000-0000-0000-000000090007', 'a0000000-0000-0000-0000-000000000926', 'sosial', 'keluar', 150000.00, 'Ajangsana Anak Pak Dwi Utama (Sakit)', '2026-09-30');
INSERT INTO transaksi_kas (id, periode_id, kategori, jenis, nominal, keterangan, tanggal_transaksi)
VALUES ('b0000000-0000-0000-0000-000000090008', 'a0000000-0000-0000-0000-000000000926', 'konsumsi', 'keluar', 168000.00, 'Akomodasi Konsumsi Kerja Bakti Warga 2026', '2026-09-30');
INSERT INTO transaksi_kas (id, periode_id, kategori, jenis, nominal, keterangan, tanggal_transaksi)
VALUES ('b0000000-0000-0000-0000-000000090009', 'a0000000-0000-0000-0000-000000000926', 'kebersihan', 'keluar', 200000.00, 'Pembayaran Pengangkutan Sampah Pos ke Mas Bekti', '2026-09-30');
INSERT INTO transaksi_kas (id, periode_id, kategori, jenis, nominal, keterangan, tanggal_transaksi)
VALUES ('b0000000-0000-0000-0000-000000090010', 'a0000000-0000-0000-0000-000000000926', 'pembangunan', 'keluar', 1000000.00, 'Iuran Pembangunan Balai RW 14', '2026-09-30');
INSERT INTO transaksi_kas (id, periode_id, kategori, jenis, nominal, keterangan, tanggal_transaksi)
VALUES ('b0000000-0000-0000-0000-000000090011', 'a0000000-0000-0000-0000-000000000926', 'perbaikan', 'keluar', 700000.00, 'Perbaikan Penerangan Jalan Umum (PJU) Blok G', '2026-09-30');
INSERT INTO transaksi_kas (id, periode_id, kategori, jenis, nominal, keterangan, tanggal_transaksi)
VALUES ('b0000000-0000-0000-0000-000000090012', 'a0000000-0000-0000-0000-000000000926', 'konsumsi', 'keluar', 300000.00, 'Biaya Konsumsi Gotong Royong Balai RW', '2026-09-30');

-- SEED DATA 6: TRANSAKSI KAS OKTOBER 2026 (SALDO AWAL BERGULIR DARI SEPTEMBER: 8.902.500)
INSERT INTO transaksi_kas (id, periode_id, kategori, jenis, nominal, keterangan, tanggal_transaksi)
VALUES ('b0000000-0000-0000-0000-000000100001', 'a0000000-0000-0000-0000-000000001026', 'saldo_awal', 'masuk', 8902500.00, 'Sisa Saldo Kas Bulan Sebelumnya (September 2026)', '2026-10-01');
INSERT INTO transaksi_kas (id, periode_id, kategori, jenis, nominal, keterangan, tanggal_transaksi)
VALUES ('b0000000-0000-0000-0000-000000100002', 'a0000000-0000-0000-0000-000000001026', 'iuran_warga', 'masuk', 1875000.00, 'Total Masukan Bersih Iuran Warga Bulan Ini', '2026-10-31');
INSERT INTO transaksi_kas (id, periode_id, kategori, jenis, nominal, keterangan, tanggal_transaksi)
VALUES ('b0000000-0000-0000-0000-000000100003', 'a0000000-0000-0000-0000-000000001026', 'operasional', 'keluar', 400000.00, 'Dana Apresiasi Pengurus RT', '2026-10-31');
INSERT INTO transaksi_kas (id, periode_id, kategori, jenis, nominal, keterangan, tanggal_transaksi)
VALUES ('b0000000-0000-0000-0000-000000100004', 'a0000000-0000-0000-0000-000000001026', 'keamanan', 'keluar', 203000.00, 'Biaya Operasional Listrik Pos Ronda', '2026-10-31');
INSERT INTO transaksi_kas (id, periode_id, kategori, jenis, nominal, keterangan, tanggal_transaksi)
VALUES ('b0000000-0000-0000-0000-000000100005', 'a0000000-0000-0000-0000-000000001026', 'keamanan', 'keluar', 86000.00, 'Tagihan Air Bersih PDAM Pos Ronda', '2026-10-31');
INSERT INTO transaksi_kas (id, periode_id, kategori, jenis, nominal, keterangan, tanggal_transaksi)
VALUES ('b0000000-0000-0000-0000-000000100006', 'a0000000-0000-0000-0000-000000001026', 'konsumsi', 'keluar', 120000.00, 'Uang Snack Rapat RT (Bp. Hardi)', '2026-10-31');
INSERT INTO transaksi_kas (id, periode_id, kategori, jenis, nominal, keterangan, tanggal_transaksi)
VALUES ('b0000000-0000-0000-0000-000000100007', 'a0000000-0000-0000-0000-000000001026', 'keamanan', 'keluar', 35000.00, 'Pembelian Obat Nyamuk Baigon untuk Pos Ronda', '2026-10-31');

-- SEED DATA 7: TAGIHAN BULANAN SEPTEMBER 2026 (22 KOLOM SPREADSHEET LENGKAP)
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000001', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000001', 175000.00, 0.00, 50000.00, 15000.00, 0.00, 15000.00, 240000.00, 175000.00, -65000.00, 0.00, 0.00, 'sebagian', 'KURANG BAYAR', 'Sisa tagihan Rp 65.000');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000002', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000002', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'belum_bayar', 'KOSONG', 'Unit Kosong');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000003', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000003', 473000.00, 0.00, 30000.00, 0.00, 0.00, 0.00, 503000.00, 0.00, -503000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Tunggakan lama');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000004', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000004', 0.00, 0.00, 50000.00, 50000.00, 25000.00, 75000.00, 125000.00, 125000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Lunas tepat waktu');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000005', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000005', 50000.00, 0.00, 30000.00, 0.00, 0.00, 0.00, 80000.00, 80000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Lunas tepat waktu');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000006', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000006', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'belum_bayar', 'KOSONG', 'Unit Kosong');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000007', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000007', 0.00, 0.00, 32000.00, 0.00, 0.00, 0.00, 32000.00, 0.00, -32000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Belum bayar');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000008', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000008', 590000.00, 0.00, 50000.00, 25000.00, 25000.00, 50000.00, 690000.00, 690000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Pelunasan rapel tagihan');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000009', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000009', 55000.00, 0.00, 50000.00, 10000.00, 25000.00, 35000.00, 140000.00, 0.00, -140000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Tunggakan iuran & denda');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000010', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000010', 0.00, 0.00, 30000.00, 0.00, 0.00, 0.00, 30000.00, 30000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Lunas tepat waktu');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000011', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000011', 685000.00, 0.00, 50000.00, 50000.00, 25000.00, 75000.00, 810000.00, 810000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Pelunasan total tagihan');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000012', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000012', 225000.00, 0.00, 50000.00, 50000.00, 25000.00, 75000.00, 350000.00, 0.00, -350000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Tunggakan berjalan');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000013', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000013', 0.00, 0.00, 30000.00, 0.00, 0.00, 0.00, 30000.00, 0.00, -30000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Belum bayar');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000014', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000014', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'belum_bayar', 'KOSONG', 'Unit Kosong');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000015', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000015', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'belum_bayar', 'KOSONG', 'Unit Kosong');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000016', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000016', 0.00, 0.00, 50000.00, 0.00, 0.00, 0.00, 50000.00, 0.00, -50000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Belum bayar');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000017', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000017', 0.00, 0.00, 50000.00, 0.00, 25000.00, 25000.00, 75000.00, 75000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Lunas iuran + denda');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000018', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000018', 0.00, 13000.00, 50000.00, 0.00, 0.00, 0.00, 37000.00, 50000.00, 13000.00, 0.00, 13000.00, 'lunas', 'LUNAS', 'Titipan bergulir Rp 13.000');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000019', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000019', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'belum_bayar', 'KOSONG', 'Unit Kosong');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000020', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000020', 0.00, 0.00, 50000.00, 0.00, 0.00, 0.00, 50000.00, 50000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Lunas tepat waktu');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000021', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000021', 40000.00, 0.00, 30000.00, 0.00, 0.00, 0.00, 70000.00, 60000.00, -10000.00, 0.00, 0.00, 'sebagian', 'KURANG BAYAR', 'Sisa tagihan Rp 10.000');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000022', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000022', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'belum_bayar', 'KOSONG', 'Unit Kosong');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000023', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000023', 0.00, 0.00, 50000.00, 10000.00, 0.00, 10000.00, 60000.00, 60000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Lunas iuran + ronda');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000024', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000024', 0.00, 0.00, 50000.00, 0.00, 0.00, 0.00, 50000.00, 50000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Lunas tepat waktu');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000025', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000025', 100000.00, 0.00, 50000.00, 0.00, 0.00, 0.00, 150000.00, 0.00, -150000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Tunggakan berjalan');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000026', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000026', 0.00, 0.00, 50000.00, 0.00, 0.00, 0.00, 50000.00, 50000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Lunas tepat waktu');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000027', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000027', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'belum_bayar', 'KOSONG', 'Unit Kosong');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000028', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000028', 140000.00, 0.00, 50000.00, 15000.00, 25000.00, 40000.00, 230000.00, 230000.00, 0.00, 3410000.00, 0.00, 'lunas', 'LUNAS', 'Lunas + Donatur Kas Rp 3.410.000');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000029', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000029', 0.00, 0.00, 50000.00, 0.00, 25000.00, 25000.00, 75000.00, 75000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Lunas iuran + denda KB');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000030', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000030', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'belum_bayar', 'KOSONG', 'Unit Kosong');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000031', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000031', 200000.00, 0.00, 50000.00, 25000.00, 25000.00, 50000.00, 300000.00, 300000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Pelunasan tagihan rapel');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000032', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000032', 0.00, 0.00, 50000.00, 5000.00, 0.00, 5000.00, 55000.00, 55000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Lunas iuran + ronda');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000033', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000033', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'belum_bayar', 'KOSONG', 'Unit Kosong');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000034', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000034', 0.00, 0.00, 50000.00, 0.00, 25000.00, 25000.00, 75000.00, 75000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Lunas iuran + denda KB');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000035', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000035', 200000.00, 0.00, 50000.00, 0.00, 25000.00, 25000.00, 275000.00, 0.00, -275000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Tunggakan berjalan');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000036', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000036', 50000.00, 0.00, 50000.00, 50000.00, 25000.00, 75000.00, 175000.00, 175000.00, 0.00, 25000.00, 0.00, 'lunas', 'LUNAS', 'Lunas + Donatur Kas Rp 25.000');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000037', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000037', 0.00, 0.00, 50000.00, 0.00, 0.00, 0.00, 50000.00, 50000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Lunas tepat waktu');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000038', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000038', 0.00, 0.00, 50000.00, 5000.00, 25000.00, 30000.00, 80000.00, 80000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Lunas tepat waktu');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000039', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000039', 0.00, 0.00, 50000.00, 25000.00, 25000.00, 50000.00, 100000.00, 100000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Lunas tepat waktu');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000040', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000040', 357000.00, 0.00, 32000.00, 0.00, 0.00, 0.00, 389000.00, 389000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Pelunasan tagihan rapel');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000041', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000041', 65000.00, 0.00, 50000.00, 25000.00, 25000.00, 50000.00, 165000.00, 165000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Lunas tepat waktu');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000042', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000042', 100000.00, 0.00, 50000.00, 50000.00, 25000.00, 75000.00, 225000.00, 0.00, -225000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Tunggakan berjalan');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000043', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000043', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'belum_bayar', 'KOSONG', 'Unit Kosong');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000044', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000044', 100000.00, 0.00, 50000.00, 0.00, 25000.00, 25000.00, 175000.00, 175000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Lunas tepat waktu');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000045', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000045', 0.00, 0.00, 50000.00, 0.00, 0.00, 0.00, 50000.00, 0.00, -50000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Belum bayar');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000046', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000046', 64000.00, 0.00, 32000.00, 0.00, 0.00, 0.00, 96000.00, 96000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Lunas tepat waktu');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000047', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000047', 160000.00, 0.00, 32000.00, 0.00, 0.00, 0.00, 192000.00, 0.00, -192000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Tunggakan berjalan');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000048', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000048', 130000.00, 0.00, 32000.00, 0.00, 0.00, 0.00, 162000.00, 162000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Lunas tepat waktu');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000049', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000049', 0.00, 0.00, 50000.00, 25000.00, 25000.00, 50000.00, 100000.00, 100000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Lunas tepat waktu');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000050', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000050', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'belum_bayar', 'KOSONG', 'Unit Kosong');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000051', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000051', 0.00, 0.00, 50000.00, 0.00, 0.00, 0.00, 50000.00, 0.00, -50000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Belum bayar');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000052', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000052', 0.00, 650000.00, 50000.00, 10000.00, 0.00, 10000.00, 60000.00, 60000.00, 590000.00, 0.00, 590000.00, 'lunas', 'LUNAS', 'Titipan bergulir Rp 590.000');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000053', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000053', 515000.00, 0.00, 50000.00, 25000.00, 25000.00, 50000.00, 615000.00, 0.00, -615000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Tunggakan berjalan');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000054', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000054', 155000.00, 0.00, 50000.00, 5000.00, 0.00, 5000.00, 210000.00, 155000.00, -55000.00, 0.00, 0.00, 'sebagian', 'KURANG BAYAR', 'Sisa tagihan Rp 55.000');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000055', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000055', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'belum_bayar', 'KOSONG', 'Unit Kosong');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-0926-000000000056', 'a0000000-0000-0000-0000-000000000926', '00000000-0000-0000-0000-000000000056', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'belum_bayar', 'KOSONG', 'Unit Kosong');

-- SEED DATA 8: TAGIHAN BULANAN OKTOBER 2026 (22 KOLOM SPREADSHEET LENGKAP BERGULIR)
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000001', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000001', 65000.00, 0.00, 50000.00, 15000.00, 0.00, 15000.00, 130000.00, 0.00, -130000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Tunggakan bergulir');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000002', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000002', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'belum_bayar', 'KOSONG', 'Unit Kosong');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000003', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000003', 503000.00, 0.00, 30000.00, 0.00, 0.00, 0.00, 533000.00, 100000.00, -433000.00, 0.00, 0.00, 'sebagian', 'KURANG BAYAR', 'Angsuran tunggakan');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000004', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000004', 0.00, 0.00, 50000.00, 15000.00, 25000.00, 40000.00, 90000.00, 0.00, -90000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Belum bayar');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000005', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000005', 0.00, 0.00, 30000.00, 0.00, 0.00, 0.00, 30000.00, 30000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Lunas tepat waktu');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000006', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000006', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'belum_bayar', 'KOSONG', 'Unit Kosong');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000007', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000007', 32000.00, 0.00, 32000.00, 0.00, 0.00, 0.00, 64000.00, 0.00, -64000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Tunggakan bergulir');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000008', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000008', 0.00, 0.00, 50000.00, 25000.00, 25000.00, 50000.00, 100000.00, 0.00, -100000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Belum bayar');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000009', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000009', 140000.00, 0.00, 50000.00, 10000.00, 25000.00, 35000.00, 225000.00, 0.00, -225000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Tunggakan bergulir');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000010', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000010', 0.00, 0.00, 30000.00, 0.00, 0.00, 0.00, 30000.00, 0.00, -30000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Belum bayar');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000011', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000011', 0.00, 0.00, 50000.00, 50000.00, 25000.00, 75000.00, 125000.00, 125000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Lunas tepat waktu');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000012', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000012', 350000.00, 0.00, 32000.00, 0.00, 0.00, 0.00, 382000.00, 0.00, -382000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Tunggakan bergulir');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000013', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000013', 30000.00, 0.00, 30000.00, 0.00, 0.00, 0.00, 60000.00, 0.00, -60000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Tunggakan bergulir');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000014', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000014', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'belum_bayar', 'KOSONG', 'Unit Kosong');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000015', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000015', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'belum_bayar', 'KOSONG', 'Unit Kosong');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000016', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000016', 50000.00, 0.00, 50000.00, 50000.00, 25000.00, 75000.00, 175000.00, 175000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Pelunasan tagihan rapel');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000017', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000017', 0.00, 0.00, 50000.00, 0.00, 25000.00, 25000.00, 75000.00, 75000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Lunas tepat waktu');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000018', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000018', 0.00, 13000.00, 50000.00, 0.00, 0.00, 0.00, 37000.00, 0.00, -37000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Belum bayar (Potong titipan)');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000019', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000019', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'belum_bayar', 'KOSONG', 'Unit Kosong');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000020', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000020', 0.00, 0.00, 50000.00, 0.00, 0.00, 0.00, 50000.00, 50000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Lunas tepat waktu');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000021', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000021', 10000.00, 0.00, 30000.00, 0.00, 0.00, 0.00, 40000.00, 40000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Lunas tepat waktu');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000022', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000022', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'belum_bayar', 'KOSONG', 'Unit Kosong');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000023', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000023', 0.00, 0.00, 50000.00, 5000.00, 0.00, 5000.00, 55000.00, 55000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Lunas tepat waktu');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000024', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000024', 0.00, 0.00, 50000.00, 0.00, 0.00, 0.00, 50000.00, 50000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Lunas tepat waktu');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000025', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000025', 150000.00, 0.00, 50000.00, 15000.00, 0.00, 15000.00, 215000.00, 100000.00, -115000.00, 0.00, 0.00, 'sebagian', 'KURANG BAYAR', 'Angsuran tagihan');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000026', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000026', 0.00, 0.00, 50000.00, 5000.00, 0.00, 5000.00, 55000.00, 55000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Lunas tepat waktu');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000027', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000027', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'belum_bayar', 'KOSONG', 'Unit Kosong');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000028', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000028', 0.00, 0.00, 50000.00, 15000.00, 25000.00, 40000.00, 90000.00, 0.00, -90000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Belum bayar');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000029', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000029', 0.00, 0.00, 50000.00, 0.00, 0.00, 0.00, 50000.00, 50000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Lunas tepat waktu');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000030', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000030', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'belum_bayar', 'KOSONG', 'Unit Kosong');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000031', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000031', 0.00, 0.00, 50000.00, 25000.00, 25000.00, 50000.00, 100000.00, 100000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Lunas tepat waktu');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000032', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000032', 0.00, 0.00, 50000.00, 10000.00, 0.00, 10000.00, 60000.00, 0.00, -60000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Belum bayar');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000033', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000033', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'belum_bayar', 'KOSONG', 'Unit Kosong');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000034', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000034', 0.00, 0.00, 50000.00, 10000.00, 25000.00, 35000.00, 85000.00, 70000.00, -15000.00, 0.00, 0.00, 'sebagian', 'KURANG BAYAR', 'Sisa tagihan Rp 15.000');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000035', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000035', 275000.00, 0.00, 50000.00, 10000.00, 0.00, 10000.00, 335000.00, 0.00, -335000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Tunggakan bergulir');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000036', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000036', 0.00, 0.00, 50000.00, 50000.00, 25000.00, 75000.00, 125000.00, 0.00, -125000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Belum bayar');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000037', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000037', 0.00, 0.00, 50000.00, 5000.00, 0.00, 5000.00, 55000.00, 55000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Lunas tepat waktu');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000038', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000038', 0.00, 0.00, 50000.00, 5000.00, 0.00, 5000.00, 55000.00, 55000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Lunas tepat waktu');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000039', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000039', 0.00, 0.00, 50000.00, 25000.00, 25000.00, 50000.00, 100000.00, 100000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Lunas tepat waktu');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000040', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000040', 0.00, 0.00, 32000.00, 0.00, 0.00, 0.00, 32000.00, 0.00, -32000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Belum bayar');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000041', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000041', 0.00, 0.00, 50000.00, 25000.00, 0.00, 25000.00, 75000.00, 0.00, -75000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Belum bayar');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000042', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000042', 225000.00, 0.00, 50000.00, 50000.00, 25000.00, 75000.00, 350000.00, 350000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Pelunasan tagihan rapel');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000043', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000043', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'belum_bayar', 'KOSONG', 'Unit Kosong');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000044', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000044', 0.00, 0.00, 50000.00, 0.00, 0.00, 0.00, 50000.00, 50000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Lunas tepat waktu');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000045', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000045', 50000.00, 0.00, 50000.00, 5000.00, 25000.00, 30000.00, 130000.00, 0.00, -130000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Tunggakan bergulir');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000046', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000046', 0.00, 0.00, 32000.00, 0.00, 0.00, 0.00, 32000.00, 0.00, -32000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Belum bayar');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000047', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000047', 192000.00, 0.00, 32000.00, 0.00, 0.00, 0.00, 224000.00, 0.00, -224000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Tunggakan bergulir');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000048', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000048', 0.00, 0.00, 32000.00, 0.00, 0.00, 0.00, 32000.00, 0.00, -32000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Belum bayar');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000049', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000049', 0.00, 0.00, 50000.00, 25000.00, 25000.00, 50000.00, 100000.00, 0.00, -100000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Belum bayar');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000050', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000050', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'belum_bayar', 'KOSONG', 'Unit Kosong');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000051', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000051', 50000.00, 0.00, 50000.00, 5000.00, 0.00, 5000.00, 105000.00, 105000.00, 0.00, 0.00, 0.00, 'lunas', 'LUNAS', 'Pelunasan tagihan rapel');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000052', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000052', 0.00, 590000.00, 50000.00, 10000.00, 25000.00, 35000.00, 85000.00, 85000.00, 0.00, 0.00, 590000.00, 'lunas', 'LUNAS', 'Lunas (Titipan Bergulir Rp 590.000)');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000053', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000053', 615000.00, 0.00, 50000.00, 25000.00, 25000.00, 50000.00, 715000.00, 0.00, -715000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Tunggakan bergulir');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000054', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000054', 0.00, 0.00, 50000.00, 15000.00, 25000.00, 40000.00, 90000.00, 0.00, -90000.00, 0.00, 0.00, 'belum_bayar', 'BELUM LUNAS', 'Belum bayar');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000055', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000055', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'belum_bayar', 'KOSONG', 'Unit Kosong');
INSERT INTO tagihan_bulanan (id, periode_id, keluarga_id, tunggakan_bulan_lalu, titipan_bulan_lalu, iuran_pokok, denda_ronda, denda_kerja_bakti, total_denda, total_tagihan, total_terbayar, kurang_lebih, donatur, titipan_depan, status_bayar, status_label, keterangan)
VALUES ('c0000000-0000-0000-1026-000000000056', 'a0000000-0000-0000-0000-000000001026', '00000000-0000-0000-0000-000000000056', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'belum_bayar', 'KOSONG', 'Unit Kosong');

-- 9. ARSIP SURAT MENYURAT RT
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
('012/UND-RAPAT/RT03-RW14/XI/2026', 'undangan_rapat', 'Undangan Rapat Rutin Warga & Pertanggungjawaban Kas RT', '2026-11-15', 'Bapak/Ibu Seluruh Warga RT.03 / RW.14', 'Perumahan BPTW Tritih Lor, Cilacap', 'Minggu, 22 November 2026', '19.30 WIB (Ba’da Isya) s.d. Selesai', 'Rumah Ketua RT (Bp. Yuli Ardinurman) Blok I/3', '1. Laporan Kas Sep-Okt 2026
2. Evaluasi Pos Kamling
3. Gotong Royong Saluran Got', 'Dimohon hadir tepat waktu.'),
('008/UND-KB/RT03-RW14/XI/2026', 'undangan_kerja_bakti', 'Undangan Kerja Bakti Pembersihan Saluran Air & Fasum', '2026-11-18', 'Seluruh Warga RT.03 / RW.14 (1 Orang per KK)', 'Perumahan BPTW Tritih Lor, Cilacap', 'Minggu, 29 November 2026', '07.00 WIB s.d. 10.30 WIB', 'Pos Ronda RT.03 RW.14', '1. Pembersihan saluran air got Blok UT s.d L
2. Penebangan ranting pohon liar
3. Perapian Pos Ronda', 'Membawa alat kerja pribadi.');
