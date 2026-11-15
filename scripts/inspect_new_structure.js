const xlsx = require('xlsx');
const wb = xlsx.readFile('C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14_check.xlsx');

for (const sheetName of ['KAS SEPTEMBER 2026', 'KAS OKTOBER 2026']) {
  const sheet = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
  console.log(`\n==================== ${sheetName} ====================`);
  for (let i = 18; i <= 26; i++) {
    if (sheet[i] && sheet[i].length > 0) {
      console.log(`Row ${i + 1}:`, sheet[i]);
    }
  }
  console.log('Sample Unit 1 (Row 26):', sheet[25]);
  console.log('Sample Unit 4 (Row 29 - INDRAWAN):', sheet[28]);
  console.log('Total Row (Row 82):', sheet[81]);
}
