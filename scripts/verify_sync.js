const path = require('path');
const p = require(path.join(__dirname, '../src/lib/data/db_kas_periods.json'));
const w = require(path.join(__dirname, '../src/lib/data/db_warga.json'));

const u33w = w.find(x => x.no_unit === 33 || (x.blok_rumah === 'I' && x.nomor_rumah === '2'));
console.log('Warga 33 in db_warga:', {
  no_unit: u33w?.no_unit,
  blok: u33w?.blok_rumah,
  nomor: u33w?.nomor_rumah,
  nama: u33w?.nama_kepala_keluarga,
  status_rumah: u33w?.status_rumah,
  iuran_pokok: u33w?.iuran_pokok,
  total_tagihan: u33w?.total_tagihan
});

const u13w = w.find(x => x.no_unit === 13 || (x.blok_rumah === 'UT' && x.nomor_rumah === '25'));
console.log('Warga 13 in db_warga:', {
  no_unit: u13w?.no_unit,
  nama: u13w?.nama_kepala_keluarga,
  status_rumah: u13w?.status_rumah
});

const sep = p.periods.find(x => x.id === 'periode-sep-2026');
const okt = p.periods.find(x => x.id === 'periode-okt-2026');

console.log('Sep 33:', sep.tagihan.find(x => x.no_unit === 33));
console.log('Okt 33:', okt.tagihan.find(x => x.no_unit === 33));
console.log('Sep 13:', sep.tagihan.find(x => x.no_unit === 13));
console.log('Okt 13:', okt.tagihan.find(x => x.no_unit === 13));

// Check sums
const sumSepIuran = sep.tagihan.reduce((acc, c) => acc + (c.iuran_pokok || 0), 0);
const sumSepTunggakan = sep.tagihan.reduce((acc, c) => acc + (c.tunggakan_bulan_lalu || 0), 0);
const sumSepTotal = sep.tagihan.reduce((acc, c) => acc + (c.total_tagihan || 0), 0);
const sumSepBayar = sep.tagihan.reduce((acc, c) => acc + (c.total_terbayar || 0), 0);

console.log('Sep Sums:', {
  sumSepIuran,
  sumSepTunggakan,
  sumSepTotal,
  sumSepBayar
});

const sumOktIuran = okt.tagihan.reduce((acc, c) => acc + (c.iuran_pokok || 0), 0);
const sumOktTunggakan = okt.tagihan.reduce((acc, c) => acc + (c.tunggakan_bulan_lalu || 0), 0);
const sumOktTotal = okt.tagihan.reduce((acc, c) => acc + (c.total_tagihan || 0), 0);
const sumOktBayar = okt.tagihan.reduce((acc, c) => acc + (c.total_terbayar || 0), 0);

console.log('Okt Sums:', {
  sumOktIuran,
  sumOktTunggakan,
  sumOktTotal,
  sumOktBayar
});
