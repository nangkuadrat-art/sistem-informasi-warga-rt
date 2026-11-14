const xlsx = require('xlsx');

const excelPath = 'C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14.xlsx';
const wb = xlsx.readFile(excelPath);

console.log('=== SEARCHING FOR ALL OCCURRENCES OF "I" and 2 ===');

wb.SheetNames.forEach(sheetName => {
  const sheet = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
  sheet.forEach((row, idx) => {
    if (!row) return;
    for (let c = 0; c < row.length; c++) {
      const val = String(row[c]);
      if (val === '6285647761514' || val === '85647761514' || (row[1] === 'I' && (row[2] === 2 || row[2] === '2'))) {
        console.log(`Sheet "${sheetName}" [Row ${idx}]:`, JSON.stringify(row));
        break;
      }
    }
  });
});
