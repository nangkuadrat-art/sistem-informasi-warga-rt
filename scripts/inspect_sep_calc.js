const xlsx = require('xlsx');

const excelPath = 'C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14.xlsx';
const wb = xlsx.readFile(excelPath);
const sepSheet = xlsx.utils.sheet_to_json(wb.Sheets['KAS SEPTEMBER 2026'], { header: 1 });

console.log('Unit | Alamat | Nama | Iuran | Ronda | KB | TitipanLalu | Tagihan | Bayar | KurangLebih | Donatur | TitipanDepan | Tagihan - (Iuran+Denda-Titipan)');
let sumTunggakanCalc = 0;
for (let i = 25; i <= 80; i++) {
  const r = sepSheet[i];
  if (!r || !r[0]) continue;
  const no = r[0];
  const alamat = r[1];
  const nama = r[2];
  const iuran = Number(r[3]) || 0;
  const ronda = Number(r[4]) || 0;
  const kb = Number(r[5]) || 0;
  const totalDenda = Number(r[6]) || 0;
  const titipanLalu = Number(r[7]) || 0;
  const tagihan = Number(r[8]) || 0;
  const bayar = Number(r[9]) || 0;
  const kurangLebih = Number(r[10]) || 0;
  const donatur = Number(r[11]) || 0;
  const titipanDepan = Number(r[12]) || 0;

  const tagihanIni = iuran + totalDenda - titipanLalu;
  const diff = tagihan - tagihanIni;
  if (diff !== 0 || titipanLalu > 0 || tagihan > 0 || donatur > 0) {
    console.log(`${no} | ${alamat} | ${nama} | ${iuran} | ${ronda} | ${kb} | ${titipanLalu} | ${tagihan} | ${bayar} | ${kurangLebih} | ${donatur} | ${titipanDepan} | diff=${diff}`);
  }
  if (diff > 0) sumTunggakanCalc += diff;
}
console.log('Total diff (Tunggakan Lalu calculated):', sumTunggakanCalc);
