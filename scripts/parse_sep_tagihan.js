const xlsx = require('xlsx');

const excelPath = 'C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14.xlsx';
const wb = xlsx.readFile(excelPath);
const sepSheet = xlsx.utils.sheet_to_json(wb.Sheets['KAS SEPTEMBER 2026'], { header: 1 });

const sepTagihanList = [];
for (let i = 25; i <= 80; i++) {
  const r = sepSheet[i];
  if (!r || !r[0]) continue;
  const no = Number(r[0]);
  const alamat = String(r[1]).trim();
  const nama = String(r[2]).trim();
  const iuran = Number(r[3]) || 0;
  const dendaRonda = Number(r[4]) || 0;
  const dendaKb = Number(r[5]) || 0;
  const totalDenda = Number(r[6]) || 0;
  const titipanLalu = Number(r[7]) || 0;
  const totalTagihan = Number(r[8]) || 0;
  const bayar = Number(r[9]) || 0;
  const kurangLebih = Number(r[10]) || 0;
  const donatur = Number(r[11]) || 0;

  const m = alamat.match(/([A-Za-z]+)\s*(\d+)/i);
  const blok = m ? m[1].toUpperCase() : '';
  const noRumah = m ? m[2] : '';

  let statusBayar = 'belum_bayar';
  if (totalTagihan === 0) statusBayar = 'kosong';
  else if (bayar >= totalTagihan) statusBayar = 'lunas';
  else if (bayar > 0) statusBayar = 'sebagian';

  sepTagihanList.push({
    id: `tagihan-sep-${no}`,
    no_unit: no,
    blok_rumah: blok,
    nomor_rumah: noRumah,
    alamat: `Blok ${blok}/${noRumah}`,
    nama_warga: nama,
    iuran_pokok: iuran,
    denda_ronda: dendaRonda,
    denda_kerja_bakti: dendaKb,
    total_denda: totalDenda,
    titipan_lalu: titipanLalu,
    total_tagihan: totalTagihan,
    total_terbayar: bayar,
    kurang_lebih: kurangLebih,
    donatur: donatur,
    status_bayar: statusBayar
  });
}

console.log('September tagihan rows:', sepTagihanList.length);
console.log('Sample 3 rows:', JSON.stringify(sepTagihanList.slice(0, 3), null, 2));
const totalTagihanSep = sepTagihanList.reduce((acc, c) => acc + c.total_tagihan, 0);
const totalBayarSep = sepTagihanList.reduce((acc, c) => acc + c.total_terbayar, 0);
const totalKurangLebihSep = sepTagihanList.reduce((acc, c) => acc + c.kurang_lebih, 0);
const totalDonaturSep = sepTagihanList.reduce((acc, c) => acc + c.donatur, 0);
console.log({ totalTagihanSep, totalBayarSep, totalKurangLebihSep, totalDonaturSep });
