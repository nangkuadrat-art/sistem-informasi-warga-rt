const xlsx = require('xlsx');

const excelPath = 'C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14.xlsx';
const wb = xlsx.readFile(excelPath);
const oktSheet = xlsx.utils.sheet_to_json(wb.Sheets['KAS OKTOBER 2026'], { header: 1 });

let sumTunggakan = 0;
let sumTitipan = 0;
let sumIuran = 0;
let sumRonda = 0;
let sumKB = 0;
let sumDenda = 0;
let sumTagihan = 0;
let sumBayar = 0;
let sumKurangLebih = 0;
let sumDonatur = 0;
let sumTitipanDepan = 0;

for (let i = 25; i <= 80; i++) {
  const r = oktSheet[i];
  if (!r || !r[0]) continue;
  const no = Number(r[0]);
  const alamat = String(r[1]).trim();
  const nama = String(r[2]).trim();
  const iuran = Number(r[3]) || 0;
  const ronda = Number(r[4]) || 0;
  const kb = Number(r[5]) || 0;
  const totalDenda = Number(r[6]) || 0;
  const titipanLalu = Number(r[7]) || 0;
  const totalTagihan = Number(r[8]) || 0;
  const bayar = Number(r[9]) || 0;
  const kurangLebih = Number(r[10]) || 0;
  const donatur = Number(r[11]) || 0;
  const titipanDepan = Number(r[12]) || 0;

  let tunggakanLalu = 0;
  if (titipanLalu > 0) {
    tunggakanLalu = 0;
  } else if (totalTagihan > (iuran + totalDenda)) {
    tunggakanLalu = totalTagihan - (iuran + totalDenda);
  }

  sumTunggakan += tunggakanLalu;
  sumTitipan += titipanLalu;
  sumIuran += iuran;
  sumRonda += ronda;
  sumKB += kb;
  sumDenda += totalDenda;
  sumTagihan += totalTagihan;
  sumBayar += bayar;
  sumKurangLebih += kurangLebih;
  sumDonatur += donatur;
  sumTitipanDepan += titipanDepan;

  if (tunggakanLalu > 0 || titipanLalu > 0) {
    console.log(`Unit ${no} (${alamat} - ${nama}): TunggakanLalu=${tunggakanLalu}, TitipanLalu=${titipanLalu}, Tagihan=${totalTagihan}, Bayar=${bayar}, KurangLebih=${kurangLebih}`);
  }
}

console.log('====================================');
console.log('REKAP OKT CALCULATED TOTALS:');
console.log('Iuran Pokok        :', sumIuran, '(Sheet Row 81: 1960000)');
console.log('Denda Ronda        :', sumRonda, '(Sheet Row 81: 0)');
console.log('Denda Kerja Bakti  :', sumKB, '(Sheet Row 81: 450000)');
console.log('Total Denda        :', sumDenda, '(Sheet Row 81: 450000)');
console.log('Titipan Lalu       :', sumTitipan, '(Sheet Row 81: 603000)');
console.log('Tunggakan Lalu     :', sumTunggakan);
console.log('Total Tagihan      :', sumTagihan, '(Sheet Row 81: 5134000)');
console.log('Pembayaran/Bayar   :', sumBayar, '(Sheet Row 81: 1875000)');
console.log('Kurang / Lebih     :', sumKurangLebih, '(Sheet Row 81: -2764000)');
console.log('Donatur Kas        :', sumDonatur, '(Sheet Row 81: 0)');
console.log('Titipan Depan      :', sumTitipanDepan, '(Sheet Row 81: 590000)');
