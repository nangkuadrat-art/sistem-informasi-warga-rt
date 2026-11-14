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
  console.log('Testing /admin/closing (Oktober 2026)...');
  const resOkt = await check('http://localhost:3000/admin/closing?periode=periode-okt-2026');
  console.log('Status:', resOkt.status);
  console.log('Contains "Tunggakan Lalu":', resOkt.data.includes('Tunggakan Lalu'));
  console.log('Contains "Denda Ronda":', resOkt.data.includes('Denda Ronda'));
  console.log('Contains "Denda Kerja Bakti":', resOkt.data.includes('Denda Kerja Bakti'));
  console.log('Contains "Total Rekapitulasi (56 Unit)":', resOkt.data.includes('Total Rekapitulasi (56 Unit)'));

  console.log('\nTesting /admin/closing (September 2026)...');
  const resSep = await check('http://localhost:3000/admin/closing?periode=periode-sep-2026');
  console.log('Status:', resSep.status);
  console.log('Contains "Tunggakan Lalu":', resSep.data.includes('Tunggakan Lalu'));
  console.log('Contains "Denda Ronda":', resSep.data.includes('Denda Ronda'));
  console.log('Contains "Denda Kerja Bakti":', resSep.data.includes('Denda Kerja Bakti'));
}

run();
