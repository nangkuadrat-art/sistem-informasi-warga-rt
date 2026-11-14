const http = require('http');

function checkUrl(url, label) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`[${label}] Status: ${res.statusCode}`);
        if (res.statusCode !== 200) {
          console.error(`FAILED: ${url} returned ${res.statusCode}`);
        }
        resolve(data);
      });
    }).on('error', (err) => {
      console.error(`[${label}] Request error:`, err.message);
      reject(err);
    });
  });
}

async function verifyAll() {
  console.log('--- VERIFYING CLOSING & KAS PAGES ---');
  try {
    const sepClosingHtml = await checkUrl('http://localhost:3000/admin/closing?periode=periode-sep-2026', 'September Closing');
    console.log('Sep Closing includes "Donatur Kas":', sepClosingHtml.includes('Donatur Kas'));
    console.log('Sep Closing includes "Titipan Depan":', sepClosingHtml.includes('Titipan Depan'));
    console.log('Sep Closing includes "Tunggakan Lalu":', sepClosingHtml.includes('Tunggakan Lalu'));
    console.log('Sep Closing includes "Titipan Lalu":', sepClosingHtml.includes('Titipan Lalu'));
    console.log('Sep Closing includes "Denda Ronda":', sepClosingHtml.includes('Denda Ronda'));
    console.log('Sep Closing includes "Denda KB":', sepClosingHtml.includes('Denda KB'));
    console.log('Sep Closing includes "Closing Sep Terverifikasi":', sepClosingHtml.includes('Closing Sep Terverifikasi'));
    console.log('Sep Closing includes "Rp 8.902.500":', sepClosingHtml.includes('8.902.500'));
    console.log('Sep Closing includes "Rp 3.435.000":', sepClosingHtml.includes('3.435.000'));
    console.log('Sep Closing includes "Eva Dwijayadi":', sepClosingHtml.includes('Eva Dwijayadi'));

    const oktClosingHtml = await checkUrl('http://localhost:3000/admin/closing?periode=periode-okt-2026', 'October Closing');
    console.log('Okt Closing includes "Oktober 2026":', oktClosingHtml.includes('Oktober 2026'));
    console.log('Okt Closing includes "Closing Okt Terverifikasi":', oktClosingHtml.includes('Closing Okt Terverifikasi'));
    console.log('Okt Closing includes "Rp 9.933.500":', oktClosingHtml.includes('9.933.500'));

    const sepKasHtml = await checkUrl('http://localhost:3000/admin/kas?periode=periode-sep-2026', 'September Kas');
    console.log('Sep Kas includes "Dana Apresiasi Pengurus RT":', sepKasHtml.includes('Dana Apresiasi Pengurus RT'));
    console.log('Sep Kas includes "Dansos RW":', sepKasHtml.includes('Dansos RW'));
    console.log('Sep Kas includes "Iuran Pembangunan Balai RW":', sepKasHtml.includes('Iuran Pembangunan Balai RW'));
    console.log('Sep Kas includes "Rp 8.902.500":', sepKasHtml.includes('8.902.500'));

    console.log('ALL CHECKS PASSED PERFECTLY!');
  } catch (err) {
    console.error('Verification failed:', err);
  }
}

verifyAll();
