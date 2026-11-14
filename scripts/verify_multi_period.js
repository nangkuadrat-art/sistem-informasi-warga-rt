const http = require('http');

function check(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function run() {
  console.log('Testing Kas September 2026...');
  const kasSep = await check('http://localhost:3000/admin/kas?periode=periode-sep-2026');
  console.log('Kas Sep Status:', kasSep.status);
  console.log('Kas Sep contains "5.534.500" (Saldo Awal):', kasSep.data.includes('5.534.500'));
  console.log('Kas Sep contains "8.182.000" (Pemasukan):', kasSep.data.includes('8.182.000'));
  console.log('Kas Sep contains "4.814.000" (Pengeluaran):', kasSep.data.includes('4.814.000'));
  console.log('Kas Sep contains "8.902.500" (Saldo Akhir):', kasSep.data.includes('8.902.500'));
  console.log('Kas Sep contains "Dansos RW":', kasSep.data.includes('Dansos RW'));

  console.log('\nTesting Kas Oktober 2026...');
  const kasOkt = await check('http://localhost:3000/admin/kas?periode=periode-okt-2026');
  console.log('Kas Okt Status:', kasOkt.status);
  console.log('Kas Okt contains "8.902.500" (Saldo Awal Bergulir):', kasOkt.data.includes('8.902.500'));
  console.log('Kas Okt contains "1.875.000" (Pemasukan):', kasOkt.data.includes('1.875.000'));
  console.log('Kas Okt contains "844.000" (Pengeluaran):', kasOkt.data.includes('844.000'));
  console.log('Kas Okt contains "9.933.500" (Saldo Akhir):', kasOkt.data.includes('9.933.500'));

  console.log('\nTesting Closing September 2026...');
  const closeSep = await check('http://localhost:3000/admin/closing?periode=periode-sep-2026');
  console.log('Close Sep Status:', closeSep.status);
  console.log('Close Sep contains "7.526.000" (Total Tagihan):', closeSep.data.includes('7.526.000'));
  console.log('Close Sep contains "4.747.000" (Realisasi):', closeSep.data.includes('4.747.000'));

  console.log('\nTesting Closing Oktober 2026...');
  const closeOkt = await check('http://localhost:3000/admin/closing?periode=periode-okt-2026');
  console.log('Close Okt Status:', closeOkt.status);
  console.log('Close Okt contains "5.134.000" (Total Tagihan):', closeOkt.data.includes('5.134.000'));
  console.log('Close Okt contains "1.875.000" (Realisasi):', closeOkt.data.includes('1.875.000'));
}

run();
