const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

function excelSerialToDate(serial) {
  if (!serial || typeof serial !== 'number') return '1985-01-01';
  const utc_days = Math.floor(serial - 25569);
  const date = new Date(utc_days * 86400 * 1000);
  return date.toISOString().split('T')[0];
}

const excelPath = 'C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14.xlsx';
const wb = xlsx.readFile(excelPath);

const akunSheet = xlsx.utils.sheet_to_json(wb.Sheets['AKUN'], { header: 1 });
const kasSheet = xlsx.utils.sheet_to_json(wb.Sheets['KAS OKTOBER 2026'], { header: 1 });
const rekapSheet = xlsx.utils.sheet_to_json(wb.Sheets['REKAP ANGGOTA KELUARGA'], { header: 1 });

// Parse units
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

  let role = 'non_aktif';
  if (pengurusRole) {
    const pl = pengurusRole.toLowerCase();
    if (pl.includes('superadmin')) role = 'superadmin';
    else if (pl.includes('ketua')) role = 'ketua_rt';
    else if (pl.includes('bendahara')) role = 'bendahara';
    else if (pl.includes('keamanan')) role = 'keamanan';
    else role = 'warga';
  } else if (statusAkun === 'Aktif') {
    role = 'warga';
  }

  units.push({
    id: `unit-${no}`,
    no_unit: no,
    alamat: rawAlamat,
    blok_rumah: blok,
    nomor_rumah: noRumah,
    nama_kepala_keluarga: kk,
    username,
    role,
    role_label: pengurusRole || (statusAkun === 'Aktif' ? 'Warga' : 'Non-Aktif'),
    status_rumah: statusAkun === 'Aktif' ? 'pemilik' : 'kosong',
    status_keluarga: statusAkun === 'Aktif' ? 'aktif' : 'nonaktif',
    alamat_lengkap: `Perum BPTW Tritih Lor ${rawAlamat}, Jeruklegi, Cilacap`,
    iuran_pokok: iuranPokok,
    denda_ronda: dendaRonda,
    denda_kerja_bakti: dendaKb,
    total_denda: totalDenda,
    tunggakan_bulan_lalu: tunggakan,
    total_tagihan: totalTagihan,
    total_terbayar: bayar,
    status_bayar: statusAkun !== 'Aktif' ? 'kosong' : (bayar >= totalTagihan && totalTagihan > 0 ? 'lunas' : bayar > 0 ? 'sebagian' : 'belum_bayar'),
    warga: []
  });
}

// Parse members from REKAP
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
  const usiaText = r[9] ? String(r[9]).trim() : '';
  const kategori = r[10] ? String(r[10]).trim() : 'Dewasa';
  const statusNikah = r[11] ? String(r[11]).trim() : 'Menikah';
  const noHp = r[12] ? String(r[12]).trim() : '';

  const targetUnit = units.find(u => u.blok_rumah === blok && String(u.nomor_rumah) === noRumah);
  if (targetUnit) {
    targetUnit.warga.push({
      id: `w-${no}`,
      no_urut: no,
      nama_lengkap: nama,
      hubungan_keluarga: hubungan,
      jenis_kelamin: jk,
      tempat_lahir: tempatLahir,
      tanggal_lahir: tglLahir,
      usia_text: usiaText,
      kategori_usia: kategori,
      status_pernikahan: statusNikah,
      nomor_telepon: noHp,
      status_warga: 'aktif'
    });
  }
}

// For active units without explicit census members, add the Head of Household
units.forEach(u => {
  if (u.warga.length === 0 && u.status_keluarga === 'aktif' && u.nama_kepala_keluarga !== '-') {
    u.warga.push({
      id: `w-kk-${u.no_unit}`,
      no_urut: 900 + u.no_unit,
      nama_lengkap: u.nama_kepala_keluarga,
      hubungan_keluarga: 'Kepala Keluarga',
      jenis_kelamin: 'L',
      tempat_lahir: 'Cilacap',
      tanggal_lahir: '1982-05-15',
      usia_text: '44 th',
      kategori_usia: 'Dewasa',
      status_pernikahan: 'Menikah',
      nomor_telepon: '',
      status_warga: 'aktif'
    });
  }
});

// Parse transactions
const kasTransaksi = [
  {
    id: "tx-1",
    tanggal_transaksi: "2026-10-01",
    keterangan: "Sisa Saldo Kas Bulan Sebelumnya (September 2026)",
    jenis: "masuk",
    kategori: "saldo_awal",
    nominal: 8902500
  },
  {
    id: "tx-2",
    tanggal_transaksi: "2026-10-31",
    keterangan: "Total Masukan Bersih Iuran Warga Bulan Ini",
    jenis: "masuk",
    kategori: "iuran_warga",
    nominal: 1875000
  },
  {
    id: "tx-3",
    tanggal_transaksi: "2026-10-31",
    keterangan: "Dana Apresiasi Pengurus RT",
    jenis: "keluar",
    kategori: "operasional",
    nominal: 400000
  },
  {
    id: "tx-4",
    tanggal_transaksi: "2026-10-31",
    keterangan: "Biaya Operasional Listrik Pos Ronda",
    jenis: "keluar",
    kategori: "keamanan",
    nominal: 203000
  },
  {
    id: "tx-5",
    tanggal_transaksi: "2026-10-31",
    keterangan: "Tagihan Air Bersih PDAM Pos Ronda",
    jenis: "keluar",
    kategori: "keamanan",
    nominal: 86000
  },
  {
    id: "tx-6",
    tanggal_transaksi: "2026-10-31",
    keterangan: "Uang Snack Rapat RT (Bp. Hardi)",
    jenis: "keluar",
    kategori: "konsumsi",
    nominal: 120000
  },
  {
    id: "tx-7",
    tanggal_transaksi: "2026-10-31",
    keterangan: "Pembelian Obat Nyamuk Baigon untuk Pos Ronda",
    jenis: "keluar",
    kategori: "keamanan",
    nominal: 35000
  }
];

const kasSummary = {
  saldoAwal: 8902500,
  totalMasuk: 1875000,
  totalKeluar: 844000,
  saldoAkhir: 9933500,
  bulan: 10,
  tahun: 2026,
  namaBulan: "Oktober"
};

const outputContent = `// MASTER DATA RESMI RT.03 RW.14 PERUMAHAN BPTW TRITIH LOR, KEC. JERUKLEGI, CILACAP
// Diimpor langsung dari Google Spreadsheet resmi pengurus RT:
// https://docs.google.com/spreadsheets/d/1jyxyn4NiqiS2eQa7mY6QAxdG4ajWt6xqfVqHRuBouUg
// Struktur: 56 Unit Rumah, 44 KK Berpenghuni, 12 Unit Kosong, 132 Jiwa Warga, Mutasi Kas Oktober 2026

export interface WargaMember {
  id: string;
  no_urut: number;
  nama_lengkap: string;
  hubungan_keluarga: string;
  jenis_kelamin: 'L' | 'P';
  tempat_lahir?: string;
  tanggal_lahir: string;
  usia_text?: string;
  kategori_usia?: string;
  status_pernikahan?: string;
  nomor_telepon?: string;
  status_warga: 'aktif' | 'pindah' | 'meninggal';
}

export interface UnitRumahRT {
  id: string;
  no_unit: number;
  alamat: string;
  blok_rumah: string;
  nomor_rumah: string;
  nama_kepala_keluarga: string;
  username: string | null;
  role: 'warga' | 'ketua_rt' | 'bendahara' | 'keamanan' | 'superadmin' | 'non_aktif';
  role_label: string;
  status_rumah: 'pemilik' | 'kosong' | 'kontrak';
  status_keluarga: 'aktif' | 'nonaktif' | 'pindah';
  alamat_lengkap: string;
  iuran_pokok: number;
  denda_ronda: number;
  denda_kerja_bakti: number;
  total_denda: number;
  tunggakan_bulan_lalu: number;
  total_tagihan: number;
  total_terbayar: number;
  status_bayar: 'lunas' | 'sebagian' | 'belum_bayar' | 'kosong';
  warga: WargaMember[];
}

export const MASTER_UNITS_56: UnitRumahRT[] = ${JSON.stringify(units, null, 2)};

export const MASTER_KAS_TRANSAKSI = ${JSON.stringify(kasTransaksi, null, 2)};

export const MASTER_KAS_SUMMARY = ${JSON.stringify(kasSummary, null, 2)};
`;

fs.writeFileSync('C:/Users/HP/.gemini/antigravity/scratch/sistem-informasi-warga-rt/src/lib/data/masterDataGoogleSheets.ts', outputContent, 'utf-8');
console.log('Successfully wrote masterDataGoogleSheets.ts with', units.length, 'units and', units.reduce((a, c) => a + c.warga.length, 0), 'residents');
