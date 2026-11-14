const xlsx = require('xlsx');

const oldWb = xlsx.readFile('C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14.xlsx');
const newWb = xlsx.readFile('C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14_latest.xlsx');

['AKUN', 'REKAP ANGGOTA KELUARGA', 'INDUK DATA', 'IURAN BULANAN', 'KRITERIA RONDA', 'KRITERIA KERJA BAKTI'].forEach(sheetName => {
  const oldSheet = xlsx.utils.sheet_to_json(oldWb.Sheets[sheetName] || {}, { header: 1 });
  const newSheet = xlsx.utils.sheet_to_json(newWb.Sheets[sheetName] || {}, { header: 1 });

  let diffCount = 0;
  const maxLen = Math.max(oldSheet.length, newSheet.length);
  for (let i = 0; i < maxLen; i++) {
    const oldRow = JSON.stringify(oldSheet[i] || []);
    const newRow = JSON.stringify(newSheet[i] || []);
    if (oldRow !== newRow) {
      diffCount++;
      console.log(`[${sheetName}] Row ${i}:`);
      console.log(' OLD:', oldRow);
      console.log(' NEW:', newRow);
    }
  }
  if (diffCount === 0) {
    console.log(`[${sheetName}] No changes.`);
  }
});
