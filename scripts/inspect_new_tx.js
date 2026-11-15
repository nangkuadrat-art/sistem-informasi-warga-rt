const xlsx = require('xlsx');
const wb = xlsx.readFile('C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14_check.xlsx');

for (const sheetName of ['KAS SEPTEMBER 2026', 'KAS OKTOBER 2026']) {
  const sheet = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
  console.log(`\n=== TRANSACTIONS ${sheetName} ===`);
  for (let i = 0; i <= 22; i++) {
    if (sheet[i] && sheet[i].length > 0) {
      console.log(`Row ${i + 1}:`, sheet[i]);
    }
  }
}
