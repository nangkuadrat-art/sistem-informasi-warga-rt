const http = require('http');

http.get('http://localhost:3000/admin/surat', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('GET /admin/surat status:', res.statusCode);
    console.log('Includes "Pelayanan Surat Menyurat RT":', data.includes('Pelayanan Surat Menyurat RT'));
    console.log('Includes "Undangan Rapat":', data.includes('Undangan Rapat'));
    console.log('Includes "Kerja Bakti":', data.includes('Kerja Bakti'));
    console.log('Includes "Surat Pengantar":', data.includes('Surat Pengantar'));
    console.log('Includes "Surat Peringatan":', data.includes('Surat Peringatan'));
    console.log('Includes "012/UND-RAPAT/RT03-RW14/XI/2026":', data.includes('012/UND-RAPAT/RT03-RW14/XI/2026'));
    console.log('Includes "008/UND-KB/RT03-RW14/XI/2026":', data.includes('008/UND-KB/RT03-RW14/XI/2026'));
    console.log('Includes "024/SKP/RT03-RW14/XI/2026":', data.includes('024/SKP/RT03-RW14/XI/2026'));
    console.log('Includes "005/SP-1/RT03-RW14/XI/2026":', data.includes('005/SP-1/RT03-RW14/XI/2026'));
  });
}).on('error', (err) => {
  console.error('Request error:', err.message);
});
