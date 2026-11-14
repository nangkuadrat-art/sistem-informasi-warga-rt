const xlsx = require('xlsx');

const excelPath = 'C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14.xlsx';
const wb = xlsx.readFile(excelPath);

const sepSheet = xlsx.utils.sheet_to_json(wb.Sheets['KAS SEPTEMBER 2026'], { header: 1 });
const oktSheet = xlsx.utils.sheet_to_json(wb.Sheets['KAS OKTOBER 2026'], { header: 1 });

console.log('Comparing September vs October Tagihan & Tunggakan:');

const comparison = [];
for (let i = 25; i <= 80; i++) {
  const sep = sepSheet[i];
  const okt = oktSheet[i];
  if (!sep || !okt) continue;

  const no = sep[0];
  const alamat = sep[1];
  const nama = sep[2];

  // Sep columns: No(0), Alamat(1), Nama(2), Iuran(3), DendaRonda(4), DendaKB(5), TotDenda(6), TitipanLalu(7), TotTagihan(8), Bayar(9), KurangLebih(10), Donatur(11)
  const sepTagihan = sep[8] || 0;
  const sepBayar = sep[9] || 0;
  const sepKurangLebih = sep[10] || 0;

  // Okt columns: No(0), Alamat(1), Nama(2), Iuran(3), DendaRonda(4), DendaKB(5), TotDenda(6), TitipanLalu(7), TotTagihan(8), Bayar(9)
  const oktIuran = okt[3] || 0;
  const oktDenda = okt[6] || 0;
  const oktTitipan = okt[7] || 0;
  const oktTagihan = okt[8] || 0;
  const oktBayar = okt[9] || 0;

  if (sepKurangLebih !== 0 || oktTitipan !== 0 || oktTagihan !== (oktIuran + oktDenda)) {
    comparison.push({
      no,
      alamat,
      nama,
      sepTagihan,
      sepBayar,
      sepKurangLebih,
      oktTitipan,
      oktIuran,
      oktDenda,
      oktTagihan,
      oktBayar,
    });
  }
}

console.log(`Units with rollover arrears/deposits (${comparison.length}):`);
comparison.forEach(c => {
  console.log(`Unit ${c.no} (${c.alamat} - ${c.nama}): SepKurang/Lebih=${c.sepKurangLebih} -> OktTitipan=${c.oktTitipan}, OktTagihan=${c.oktTagihan} (Iuran ${c.oktIuran} + Denda ${c.oktDenda})`);
});
