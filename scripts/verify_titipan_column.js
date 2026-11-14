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
  console.log('Testing /admin/closing with Titipan/Deposit column...');
  const resOkt = await check('http://localhost:3000/admin/closing?periode=periode-okt-2026');
  console.log('Oktober 2026 Status:', resOkt.status);
  console.log('Contains "Tunggakan Lalu":', resOkt.data.includes('Tunggakan Lalu'));
  console.log('Contains "Titipan Lalu / Deposit":', resOkt.data.includes('Titipan Lalu / Deposit'));
  console.log('Contains "Denda Ronda":', resOkt.data.includes('Denda Ronda'));
  console.log('Contains "Denda Kerja Bakti":', resOkt.data.includes('Denda Kerja Bakti'));
  console.log('Contains "+Rp 13.000" (Hadi Satriyo Deposit):', resOkt.data.includes('13.000'));
  console.log('Contains "+Rp 590.000" (Eva Dwijayadi Deposit):', resOkt.data.includes('590.000'));

  const resSep = await check('http://localhost:3000/admin/closing?periode=periode-sep-2026');
  console.log('\nSeptember 2026 Status:', resSep.status);
  console.log('Contains "Titipan Lalu / Deposit":', resSep.data.includes('Titipan Lalu / Deposit'));
}

run();
