const path = require('path');
const xlsx = require('xlsx');
const wb = xlsx.readFile('C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14.xlsx');

for (const name of wb.SheetNames) {
  const sheet = xlsx.utils.sheet_to_json(wb.Sheets[name], { header: 1 });
  console.log(`=== Sheet: ${name} ===`);
  for (let i = 0; i < Math.min(sheet.length, 90); i++) {
    const row = sheet[i];
    if (row && (row[0] === 13 || row[0] === 33 || row[1] === 'UT 25' || row[1] === 'I 2')) {
      console.log(`Row ${i + 1}:`, row);
    }
  }
}
