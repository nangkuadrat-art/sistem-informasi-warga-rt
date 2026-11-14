const xlsx = require('xlsx');

const oldWb = xlsx.readFile('C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14.xlsx');
const newWb = xlsx.readFile('C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14_latest.xlsx');

console.log('=== DIFFING SPREADSHEETS ===');

newWb.SheetNames.forEach(sheetName => {
  const oldSheet = xlsx.utils.sheet_to_json(oldWb.Sheets[sheetName] || {}, { header: 1 });
  const newSheet = xlsx.utils.sheet_to_json(newWb.Sheets[sheetName] || {}, { header: 1 });

  const maxLen = Math.max(oldSheet.length, newSheet.length);
  for (let i = 0; i < maxLen; i++) {
    const oldRow = JSON.stringify(oldSheet[i] || []);
    const newRow = JSON.stringify(newSheet[i] || []);
    if (oldRow !== newRow) {
      console.log(`\nSheet [${sheetName}] Row ${i} changed:`);
      console.log('OLD:', oldRow);
      console.log('NEW:', newRow);
    }
  }
});
