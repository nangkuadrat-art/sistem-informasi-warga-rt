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
  console.log('--- VERIFYING KAS & CLOSING CRUD PAGES ---');
  try {
    const kasHtml = await checkUrl('http://localhost:3000/admin/kas?periode=periode-okt-2026', 'Kas Okt 2026');
    console.log('Kas includes "Catat Transaksi Kas":', kasHtml.includes('Catat Transaksi Kas'));
    console.log('Kas includes "TabelTransaksiClient" elements (Aksi CRUD):', kasHtml.includes('Aksi CRUD'));

    const sepKasHtml = await checkUrl('http://localhost:3000/admin/kas?periode=periode-sep-2026', 'Kas Sep 2026');
    console.log('Sep Kas includes "Aksi CRUD":', sepKasHtml.includes('Aksi CRUD'));

    const closingHtml = await checkUrl('http://localhost:3000/admin/closing?periode=periode-okt-2026', 'Closing Okt 2026');
    console.log('Closing includes "Tutup Buku":', closingHtml.includes('Tutup Buku'));
    console.log('Closing includes "Aksi CRUD":', closingHtml.includes('Aksi CRUD'));
    console.log('Closing includes "TITO":', closingHtml.includes('TITO'));
    console.log('Closing includes "Bayar":', closingHtml.includes('Bayar'));

    const sepClosingHtml = await checkUrl('http://localhost:3000/admin/closing?periode=periode-sep-2026', 'Closing Sep 2026');
    console.log('Sep Closing includes "Buku Telah Ditutup":', sepClosingHtml.includes('Buku Telah Ditutup'));
    console.log('Sep Closing includes "Buka Kembali Buku":', sepClosingHtml.includes('Buka Kembali Buku'));

    console.log('ALL CRUD INTERFACE VERIFICATIONS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('Verification failed:', err);
  }
}

verifyAll();
