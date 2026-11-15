const fs = require('fs');
const xlsx = require('xlsx');

const newPath = 'C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14_live.xlsx';
const wb = xlsx.readFile(newPath);

function parseNewSheet(sheet, periodPrefix) {
  const list = [];
  for (let i = 25; i <= 80; i++) {
    const r = sheet[i];
    if (!r || !r[0]) continue;
    const no = Number(r[0]);
    const alamat = String(r[1] || '').trim();
    const nama = String(r[2] || '').trim();
    const dansosRt = Number(r[3]) || 0;
    const dansosRw = Number(r[4]) || 0;
    const pembangunan = Number(r[5]) || 0;
    const snack = Number(r[6]) || 0;
    const jimpitan = Number(r[7]) || 0;
    const iuran = Number(r[8]) || 0;
    const dendaRonda = Number(r[9]) || 0;
    const dendaKB = Number(r[10]) || 0;
    const totalDenda = Number(r[11]) || 0;
    const tunggakanLalu = Number(r[12]) || 0;
    const titipanLalu = Number(r[13]) || 0;
    const totalTagihan = Number(r[14]) || 0;
    const bayar = Number(r[15]) || 0;
    // r[16] is tanggal_pembayaran
    const kurangLebih = Number(r[17]) || 0;
    const donatur = Number(r[18]) || 0;
    const titipanDepan = Number(r[19]) || 0;
    const statusStr = r[20] ? String(r[20]).trim() : '';
    const ket = r[21] ? String(r[21]).trim() : '';

    const m = alamat.match(/([A-Za-z]+)\s*(\d+)/i);
    const blok = m ? m[1].toUpperCase() : '';
    const noRumah = m ? m[2] : '';

    let statusBayar = 'belum_bayar';
    if (statusStr === 'KOSONG' || (totalTagihan === 0 && iuran === 0 && nama === '-')) {
      statusBayar = 'kosong';
    } else if (statusStr === 'LUNAS' || (totalTagihan > 0 && bayar >= totalTagihan)) {
      statusBayar = 'lunas';
    } else if (bayar > 0) {
      statusBayar = 'sebagian';
    }

    list.push({
      id: `tagihan-${periodPrefix}-${no}`,
      no_unit: no,
      blok_rumah: blok,
      nomor_rumah: noRumah,
      alamat: `Blok ${blok}/${noRumah}`,
      nama_warga: nama,
      dansos_rt: dansosRt,
      dansos_rw: dansosRw,
      pembangunan: pembangunan,
      snack: snack,
      jimpitan: jimpitan,
      iuran_pokok: iuran,
      denda_ronda: dendaRonda,
      denda_kerja_bakti: dendaKB,
      total_denda: totalDenda,
      tunggakan_bulan_lalu: tunggakanLalu,
      titipan_bulan_lalu: titipanLalu,
      total_tagihan: totalTagihan,
      total_terbayar: bayar,
      kurang_lebih: kurangLebih,
      donatur: donatur,
      titipan_depan: titipanDepan,
      status_bayar: statusBayar,
      status_label: statusStr,
      keterangan: ket,
    });
  }
  return list;
}

const sepSheet = xlsx.utils.sheet_to_json(wb.Sheets['KAS SEPTEMBER 2026'], { header: 1 });
const oktSheet = xlsx.utils.sheet_to_json(wb.Sheets['KAS OKTOBER 2026'], { header: 1 });

const sepTagihan = parseNewSheet(sepSheet, 'periode-sep-2026');
const oktTagihan = parseNewSheet(oktSheet, 'periode-okt-2026');

const sumField = (arr, field) => arr.reduce((a, b) => a + (Number(b[field]) || 0), 0);

console.log('SEP SUMMARY CHECK (Parsed vs Row 82):');
console.log({
  count: sepTagihan.length,
  iuran_pokok: sumField(sepTagihan, 'iuran_pokok'),
  denda_ronda: sumField(sepTagihan, 'denda_ronda'),
  denda_kerja_bakti: sumField(sepTagihan, 'denda_kerja_bakti'),
  total_denda: sumField(sepTagihan, 'total_denda'),
  tunggakan_bulan_lalu: sumField(sepTagihan, 'tunggakan_bulan_lalu'),
  titipan_bulan_lalu: sumField(sepTagihan, 'titipan_bulan_lalu'),
  total_tagihan: sumField(sepTagihan, 'total_tagihan'),
  total_terbayar: sumField(sepTagihan, 'total_terbayar'),
});

console.log('OKT SUMMARY CHECK (Parsed vs Row 82):');
console.log({
  count: oktTagihan.length,
  iuran_pokok: sumField(oktTagihan, 'iuran_pokok'),
  denda_ronda: sumField(oktTagihan, 'denda_ronda'),
  denda_kerja_bakti: sumField(oktTagihan, 'denda_kerja_bakti'),
  total_denda: sumField(oktTagihan, 'total_denda'),
  tunggakan_bulan_lalu: sumField(oktTagihan, 'tunggakan_bulan_lalu'),
  titipan_bulan_lalu: sumField(oktTagihan, 'titipan_bulan_lalu'),
  total_tagihan: sumField(oktTagihan, 'total_tagihan'),
  total_terbayar: sumField(oktTagihan, 'total_terbayar'),
  kurang_lebih: sumField(oktTagihan, 'kurang_lebih'),
  donatur: sumField(oktTagihan, 'donatur'),
  titipan_depan: sumField(oktTagihan, 'titipan_depan'),
});

// Update db_kas_periods.json
const dbKasPath = 'C:/Users/HP/.gemini/antigravity/scratch/sistem-informasi-warga-rt/src/lib/data/db_kas_periods.json';
const dbKas = JSON.parse(fs.readFileSync(dbKasPath, 'utf-8'));

const pSep = dbKas.periods.find((p) => p.id === 'periode-sep-2026');
if (pSep) {
  pSep.tagihan = sepTagihan;
}

const pOkt = dbKas.periods.find((p) => p.id === 'periode-okt-2026');
if (pOkt) {
  pOkt.tagihan = oktTagihan;
}

fs.writeFileSync(dbKasPath, JSON.stringify(dbKas, null, 2), 'utf-8');
console.log('Updated db_kas_periods.json with latest Denda Ronda Oktober & breakdown columns!');

// Replace local reference xlsx
fs.copyFileSync(newPath, 'C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14.xlsx');
console.log('Updated local data_rt03_rw14.xlsx');

// Sync db_warga.json with latest October tagihan info
const dbWargaPath = 'C:/Users/HP/.gemini/antigravity/scratch/sistem-informasi-warga-rt/src/lib/data/db_warga.json';
const dbWarga = JSON.parse(fs.readFileSync(dbWargaPath, 'utf-8'));
oktTagihan.forEach((t) => {
  const unit = dbWarga.find((w) => w.no_unit === t.no_unit);
  if (unit) {
    if (t.nama_warga && t.nama_warga !== '-') {
      unit.nama_kepala_keluarga = t.nama_warga;
    }
    unit.iuran_pokok = t.iuran_pokok;
    unit.denda_ronda = t.denda_ronda;
    unit.denda_kerja_bakti = t.denda_kerja_bakti;
    unit.total_denda = t.total_denda;
    unit.tunggakan_bulan_lalu = t.tunggakan_bulan_lalu;
    unit.total_tagihan = t.total_tagihan;
    unit.total_terbayar = t.total_terbayar;
    unit.status_bayar = t.status_bayar;
  }
});
fs.writeFileSync(dbWargaPath, JSON.stringify(dbWarga, null, 2), 'utf-8');
console.log('Synchronized db_warga.json with latest October data!');
