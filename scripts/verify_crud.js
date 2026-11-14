const http = require('http');

function checkUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, length: data.length, data });
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('Testing /admin/warga (grid view)...');
  const resGrid = await checkUrl('http://localhost:3000/admin/warga');
  console.log('Grid View Status:', resGrid.status, 'Length:', resGrid.length);
  console.log('Grid View contains "Pengolahan Data Warga":', resGrid.data.includes('Pengolahan Data Warga'));
  console.log('Grid View contains "ModalEditKeluarga":', resGrid.data.includes('Edit'));

  console.log('\nTesting /admin/warga?view=table (table view)...');
  const resTable = await checkUrl('http://localhost:3000/admin/warga?view=table');
  console.log('Table View Status:', resTable.status, 'Length:', resTable.length);
  console.log('Table View contains "<table":', resTable.data.includes('<table'));
  console.log('Table View contains "Aksi CRUD":', resTable.data.includes('Aksi CRUD'));
}

run();
