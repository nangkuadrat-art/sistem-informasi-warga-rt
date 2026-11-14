const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const excelPath = 'C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14.xlsx';
const workbook = xlsx.readFile(excelPath);
console.log('Sheets in workbook:', workbook.SheetNames);

const rekapSheet = workbook.Sheets['REKAP ANGGOTA KELUARGA'];
const rekapData = xlsx.utils.sheet_to_json(rekapSheet, { header: 1 });
console.log('REKAP header row:', JSON.stringify(rekapData[0]));
console.log('Total rows in REKAP:', rekapData.length);
console.log('Sample rows:');
for (let i = 1; i <= 5; i++) {
  console.log(`Row ${i}:`, JSON.stringify(rekapData[i]));
}
