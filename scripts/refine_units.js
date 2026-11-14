const fs = require('fs');
const path = require('path');

const dbWargaPath = path.join(__dirname, '../src/lib/data/db_warga.json');
const units = JSON.parse(fs.readFileSync(dbWargaPath, 'utf-8'));

const u13 = units.find(u => u.no_unit === 13 || (u.blok_rumah === 'UT' && u.nomor_rumah === '25'));
if (u13) {
  u13.nama_kepala_keluarga = 'YONGKI';
  u13.username = 'yongki';
  u13.role = 'warga';
  u13.role_label = 'Warga';
  u13.status_rumah = 'tetap';
  u13.status_keluarga = 'aktif';
  u13.iuran_pokok = 30000;
  u13.total_tagihan = 30000;
  u13.status_bayar = 'belum_bayar';
}

const u33 = units.find(u => u.no_unit === 33 || (u.blok_rumah === 'I' && u.nomor_rumah === '2'));
if (u33) {
  u33.nama_kepala_keluarga = '-';
  u33.username = null;
  u33.role = 'non_aktif';
  u33.role_label = 'Non-Aktif';
  u33.status_rumah = 'kosong';
  u33.status_keluarga = 'nonaktif';
  u33.iuran_pokok = 0;
  u33.denda_ronda = 0;
  u33.denda_kerja_bakti = 0;
  u33.total_denda = 0;
  u33.tunggakan_bulan_lalu = 0;
  u33.total_tagihan = 0;
  u33.total_terbayar = 0;
  u33.status_bayar = 'kosong';
  u33.warga = [];
}

fs.writeFileSync(dbWargaPath, JSON.stringify(units, null, 2), 'utf-8');
console.log('Successfully refined Unit 13 and Unit 33 in db_warga.json');
