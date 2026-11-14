const fs = require('fs');
const xlsx = require('xlsx');

// 1. Update data_rt03_rw14.xlsx with latest downloaded
const latestPath = 'C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14_latest.xlsx';
const currentPath = 'C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14.xlsx';
fs.copyFileSync(latestPath, currentPath);
console.log('Copied latest spreadsheet to data_rt03_rw14.xlsx');

const wb = xlsx.readFile(currentPath);
const sepSheet = xlsx.utils.sheet_to_json(wb.Sheets['KAS SEPTEMBER 2026'], { header: 1 });
const oktSheet = xlsx.utils.sheet_to_json(wb.Sheets['KAS OKTOBER 2026'], { header: 1 });

// Check header of Row 24 in both sheets
console.log('Sep Row 24 Header:', sepSheet[24]);
console.log('Okt Row 24 Header:', oktSheet[24]);

// Col 0: No
// Col 1: Alamat
// Col 2: Nama Warga
// Col 3: Iuran Bulanan
// Col 4: Denda Ronda
// Col 5: Denda Kerja Bakti
// Col 6: Total Denda
// Col 7: Tunggakan lalu
// Col 8: Titipan Lalu
// Col 9: Total Tagihan
// Col 10: Pembayaran
// Col 11: Kurang / Lebih
// Col 12: Donatur Kas
// Col 13: Titipan Depan
// Col 14: Status
// Col 15: Keterangan

function parseTagihanFromSheet(sheet, periodPrefix) {
  const list = [];
  for (let i = 25; i <= 80; i++) {
    const r = sheet[i];
    if (!r || !r[0]) continue;
    const no = Number(r[0]);
    const alamat = String(r[1]).trim();
    const nama = String(r[2]).trim();
    const iuran = Number(r[3]) || 0;
    const dendaRonda = Number(r[4]) || 0;
    const dendaKB = Number(r[5]) || 0;
    const totalDenda = Number(r[6]) || 0;
    const tunggakanLalu = Number(r[7]) || 0;
    const titipanLalu = Number(r[8]) || 0;
    const totalTagihan = Number(r[9]) || 0;
    const bayar = Number(r[10]) || 0;
    const kurangLebih = Number(r[11]) || 0;
    const donatur = Number(r[12]) || 0;
    const titipanDepan = Number(r[13]) || 0;
    const statusStr = r[14] ? String(r[14]).trim() : '';
    const ket = r[15] ? String(r[15]).trim() : '';

    const m = alamat.match(/([A-Za-z]+)\s*(\d+)/i);
    const blok = m ? m[1].toUpperCase() : '';
    const noRumah = m ? m[2] : '';

    let statusBayar = 'belum_bayar';
    if (statusStr === 'KOSONG' || totalTagihan === 0) statusBayar = 'kosong';
    else if (statusStr === 'LUNAS' || bayar >= totalTagihan) statusBayar = 'lunas';
    else if (bayar > 0) statusBayar = 'sebagian';

    list.push({
      id: `tagihan-${periodPrefix}-${no}`,
      no_unit: no,
      blok_rumah: blok,
      nomor_rumah: noRumah,
      alamat: `Blok ${blok}/${noRumah}`,
      nama_warga: nama,
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
      keterangan: ket
    });
  }
  return list;
}

const sepTagihan = parseTagihanFromSheet(sepSheet, 'sep');
const oktTagihan = parseTagihanFromSheet(oktSheet, 'okt');

console.log('Parsed September tagihan count:', sepTagihan.length);
console.log('Unit 33 September:', sepTagihan.find(t => t.no_unit === 33));
console.log('Parsed October tagihan count:', oktTagihan.length);
console.log('Unit 33 October:', oktTagihan.find(t => t.no_unit === 33));

// Cek total sum
function printSums(tagihanList, label) {
  let sIuran = 0, sRonda = 0, sKB = 0, sDenda = 0, sTunggakan = 0, sTitipan = 0, sTagihan = 0, sBayar = 0, sKurangLebih = 0, sDonatur = 0, sTitipanDepan = 0;
  tagihanList.forEach(t => {
    sIuran += t.iuran_pokok;
    sRonda += t.denda_ronda;
    sKB += t.denda_kerja_bakti;
    sDenda += t.total_denda;
    sTunggakan += t.tunggakan_bulan_lalu;
    sTitipan += t.titipan_bulan_lalu;
    sTagihan += t.total_tagihan;
    sBayar += t.total_terbayar;
    sKurangLebih += t.kurang_lebih;
    sDonatur += t.donatur;
    sTitipanDepan += t.titipan_depan;
  });
  console.log(`\n=== SUM TOTALS [${label}] ===`);
  console.log('Iuran       :', sIuran);
  console.log('Denda Ronda :', sRonda);
  console.log('Denda KB    :', sKB);
  console.log('Total Denda :', sDenda);
  console.log('Tunggakan   :', sTunggakan);
  console.log('Titipan     :', sTitipan);
  console.log('Tagihan     :', sTagihan);
  console.log('Bayar       :', sBayar);
  console.log('KurangLebih :', sKurangLebih);
  console.log('Donatur     :', sDonatur);
  console.log('TitipanDepan:', sTitipanDepan);
}

printSums(sepTagihan, 'SEPTEMBER');
printSums(oktTagihan, 'OKTOBER');
