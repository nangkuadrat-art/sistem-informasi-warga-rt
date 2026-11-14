const xlsx = require('xlsx');

function excelSerialToDate(serial) {
  if (!serial || typeof serial !== 'number') return null;
  const utc_days = Math.floor(serial - 25569);
  const date = new Date(utc_days * 86400 * 1000);
  return date.toISOString().split('T')[0];
}

const excelPath = 'C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14.xlsx';
const wb = xlsx.readFile(excelPath);

const akunSheet = xlsx.utils.sheet_to_json(wb.Sheets['AKUN'], { header: 1 });
const kasSheet = xlsx.utils.sheet_to_json(wb.Sheets['KAS OKTOBER 2026'], { header: 1 });
const rekapSheet = xlsx.utils.sheet_to_json(wb.Sheets['REKAP ANGGOTA KELUARGA'], { header: 1 });

// Parse units from AKUN & KAS OKTOBER 2026
const units = [];
for (let i = 6; i < akunSheet.length; i++) {
  const r = akunSheet[i];
  if (!r || !r[0]) continue;
  const no = Number(r[0]);
  const rawAlamat = String(r[1]).trim(); // e.g. "Blok UT/1"
  const kk = r[2] ? String(r[2]).trim() : '-';
  const username = r[3] && r[3] !== '-' ? String(r[3]).trim().toLowerCase() : null;
  const pengurusRole = r[4] ? String(r[4]).trim() : null;
  const statusAkun = r[6] ? String(r[6]).trim() : 'Non-Aktif';

  // Find billing in KAS OKTOBER 2026 (rows 25 to 80)
  // Row 25 is No 1, Row 26 is No 2, etc.
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

  // Extract blok and nomor
  // "Blok UT/1" -> blok: "UT", nomor: "1"
  const m = rawAlamat.match(/Blok\s*([A-Za-z]+)\/(\d+)/i);
  const blok = m ? m[1].toUpperCase() : '';
  const noRumah = m ? m[2] : '';

  units.push({
    id: `unit-${no}`,
    no_unit: no,
    alamat: rawAlamat,
    blok_rumah: blok,
    nomor_rumah: noRumah,
    nama_kepala_keluarga: kk,
    username,
    role: pengurusRole ? (pengurusRole.toLowerCase().includes('superadmin') ? 'superadmin' : pengurusRole.toLowerCase().includes('ketua') ? 'ketua_rt' : pengurusRole.toLowerCase().includes('bendahara') ? 'bendahara' : pengurusRole.toLowerCase().includes('keamanan') ? 'keamanan' : 'warga') : (statusAkun === 'Aktif' ? 'warga' : 'non_aktif'),
    role_label: pengurusRole || (statusAkun === 'Aktif' ? 'Warga' : 'Non-Aktif'),
    status_rumah: statusAkun === 'Aktif' ? 'pemilik' : 'kosong',
    status_keluarga: statusAkun === 'Aktif' ? 'aktif' : 'nonaktif',
    alamat_lengkap: `Perum BPTW Tritih Lor ${rawAlamat}`,
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

console.log('Total units parsed:', units.length);

// Parse members
let matchedMembers = 0;
let unmatched = [];

for (let i = 5; i < rekapSheet.length; i++) {
  const r = rekapSheet[i];
  if (!r || !r[0]) continue;
  const no = r[0];
  const blok = String(r[1] || '').trim().toUpperCase();
  const noRumah = String(r[2] || '').trim();
  const keluarga = String(r[3] || '').trim();
  const nama = String(r[4] || '').trim();
  const hubungan = String(r[5] || '').trim();
  const jk = String(r[6] || '').trim().toLowerCase().startsWith('l') ? 'L' : 'P';
  const tempatLahir = r[7] ? String(r[7]).trim() : '';
  const tglLahir = excelSerialToDate(r[8]);
  const usiaText = r[9] ? String(r[9]).trim() : '';
  const kategori = r[10] ? String(r[10]).trim() : '';
  const statusNikah = r[11] ? String(r[11]).trim() : '';
  const noHp = r[12] ? String(r[12]).trim() : '';

  // Find corresponding unit
  const targetUnit = units.find(u => u.blok_rumah === blok && String(u.nomor_rumah) === noRumah);
  if (targetUnit) {
    matchedMembers++;
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
  } else {
    unmatched.push({ no, blok, noRumah, nama });
  }
}

console.log(`Matched members: ${matchedMembers}`);
console.log('Unmatched count:', unmatched.length, unmatched);

// For units that have 0 warga but have a Kepala Keluarga in AKUN
let kkAdded = 0;
units.forEach(u => {
  if (u.warga.length === 0 && u.status_keluarga === 'aktif' && u.nama_kepala_keluarga !== '-') {
    u.warga.push({
      id: `w-kk-${u.no_unit}`,
      no_urut: 900 + u.no_unit,
      nama_lengkap: u.nama_kepala_keluarga,
      hubungan_keluarga: 'Kepala Keluarga',
      jenis_kelamin: 'L',
      tempat_lahir: 'Cilacap',
      tanggal_lahir: '1980-01-01',
      usia_text: '46 th',
      kategori_usia: 'Dewasa',
      status_pernikahan: 'Menikah',
      nomor_telepon: '',
      status_warga: 'aktif'
    });
    kkAdded++;
  }
});
console.log(`Head of households auto-added for active units without detailed census: ${kkAdded}`);
console.log('Total residents across all units:', units.reduce((acc, u) => acc + u.warga.length, 0));
