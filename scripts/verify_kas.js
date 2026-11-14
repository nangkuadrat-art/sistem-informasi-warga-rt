const http = require('http');

http.get('http://localhost:3000/admin/kas', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    console.log('Contains 8.902.500 (Saldo Awal):', data.includes('8.902.500'));
    console.log('Contains 1.875.000 (Pemasukan):', data.includes('1.875.000'));
    console.log('Contains 844.000 (Pengeluaran):', data.includes('844.000'));
    console.log('Contains 9.933.500 (Saldo Akhir):', data.includes('9.933.500'));
    console.log('Contains Listrik Pos Ronda:', data.includes('Biaya Operasional Listrik Pos Ronda'));
    console.log('Contains Dana Apresiasi Pengurus RT:', data.includes('Dana Apresiasi Pengurus RT'));
  });
});
