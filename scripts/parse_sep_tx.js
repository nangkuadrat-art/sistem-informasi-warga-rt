const xlsx = require('xlsx');

const excelPath = 'C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14.xlsx';
const wb = xlsx.readFile(excelPath);
const sepSheet = xlsx.utils.sheet_to_json(wb.Sheets['KAS SEPTEMBER 2026'], { header: 1 });

const sepTx = [];
for (let i = 5; i <= 19; i++) {
  const r = sepSheet[i];
  if (!r || !r[0]) continue;
  const no = r[0];
  const serialDate = r[1];
  const uraian = r[2];
  const debit = Number(r[3]) || 0;
  const kredit = Number(r[4]) || 0;
  const saldo = Number(r[5]) || 0;

  if (debit === 0 && kredit === 0 && !uraian.toLowerCase().includes('saldo')) {
    continue; // skip rows with 0
  }

  let jenis = debit > 0 ? 'masuk' : 'keluar';
  let kategori = 'operasional';
  const uLower = uraian.toLowerCase();
  if (uLower.includes('saldo')) kategori = 'saldo_awal';
  else if (uLower.includes('iuran')) kategori = 'iuran_warga';
  else if (uLower.includes('donatur')) kategori = 'donasi';
  else if (uLower.includes('dansos rw')) kategori = 'dansos_rw';
  else if (uLower.includes('snack') || uLower.includes('konsumsi')) kategori = 'konsumsi';
  else if (uLower.includes('ajangsana')) kategori = 'sosial';
  else if (uLower.includes('sampah')) kategori = 'kebersihan';
  else if (uLower.includes('penerangan') || uLower.includes('pju') || uLower.includes('pembangunan')) kategori = 'pembangunan';
  else if (uLower.includes('apresiasi')) kategori = 'apresiasi_pengurus';

  const tgl = serialDate === 46266 ? '2026-09-01' : '2026-09-30';

  sepTx.push({
    id: `tx-sep-${no}`,
    tanggal_transaksi: tgl,
    keterangan: uraian,
    jenis,
    kategori,
    nominal: debit > 0 ? debit : kredit,
    saldo_berjalan: saldo
  });
}

console.log('September Transactions parsed:', sepTx.length);
console.log(JSON.stringify(sepTx, null, 2));
