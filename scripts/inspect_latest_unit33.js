const xlsx = require('xlsx');

const latestPath = 'C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14_latest.xlsx';
const wb = xlsx.readFile(latestPath);

console.log('=== LATEST SHEET NAMES ===', wb.SheetNames);

wb.SheetNames.forEach(sheetName => {
  const sheet = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
  console.log(`\n--- SHEET: ${sheetName} ---`);
  sheet.forEach((row, idx) => {
    if (!row) return;
    const str = JSON.stringify(row);
    if (str.includes('I 2') || str.includes('I/2') || str.includes('I-2') || row[0] === 33) {
      console.log(`[Row ${idx}]`, str);
    }
  });
});
