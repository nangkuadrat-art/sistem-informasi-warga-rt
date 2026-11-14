const xlsx = require('xlsx');

const excelPath = 'C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14.xlsx';
const wb = xlsx.readFile(excelPath);

console.log('Sheet Names:', wb.SheetNames);

wb.SheetNames.forEach(sheetName => {
  const sheet = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
  console.log(`\n=== SHEET: ${sheetName} ===`);
  sheet.forEach((row, idx) => {
    if (!row) return;
    const rowStr = JSON.stringify(row);
    if (rowStr.includes('I 2') || rowStr.includes('I/2') || rowStr.includes('I-2') || row[0] === 33) {
      console.log(`[Row ${idx}]`, rowStr);
    }
  });
});
