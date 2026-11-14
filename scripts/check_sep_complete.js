const xlsx = require('xlsx');

const excelPath = 'C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14.xlsx';
const wb = xlsx.readFile(excelPath);
const sepSheet = xlsx.utils.sheet_to_json(wb.Sheets['KAS SEPTEMBER 2026'], { header: 1 });

console.log('--- SEPTEMBER REKAP VERIFICATION ---');
for (let i = 25; i <= 80; i++) {
  const r = sepSheet[i];
  if (!r || !r[0]) continue;
  const no = r[0];
  const alamat = r[1];
  const nama = r[2];
  const iuran = Number(r[3]) || 0;
  const dendaRonda = Number(r[4]) || 0;
  const dendaKB = Number(r[5]) || 0;
  const totalDenda = Number(r[6]) || 0;
  const titipanLalu = Number(r[7]) || 0;
  const totalTagihan = Number(r[8]) || 0;
  const bayar = Number(r[9]) || 0;
  const kurangLebih = Number(r[10]) || 0;
  const donatur = Number(r[11]) || 0;
  const titipanDepan = Number(r[12]) || 0;
  const status = r[13];
  const ket = r[14];

  // Tunggakan lalu dari Agustus:
  // totalTagihan = iuran + totalDenda - titipanLalu + tunggakanLalu
  // => tunggakanLalu = totalTagihan - (iuran + totalDenda - titipanLalu)
  const tagihanBulanIni = iuran + totalDenda - titipanLalu;
  const tunggakanLalu = totalTagihan > tagihanBulanIni ? totalTagihan - tagihanBulanIni : 0;

  if (totalTagihan > 0 || bayar > 0 || donatur > 0 || titipanLalu > 0) {
    console.log(`Unit ${no} (${alamat} - ${nama}): Iuran=${iuran}, DendaRonda=${dendaRonda}, DendaKB=${dendaKB}, TitipanLalu=${titipanLalu}, TunggakanLalu=${tunggakanLalu}, TotalTagihan=${totalTagihan}, Bayar=${bayar}, KurangLebih=${kurangLebih}, Donatur=${donatur}, TitipanDepan=${titipanDepan}, Ket=${ket}`);
  }
}
