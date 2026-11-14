const http = require('http');

http.get('http://localhost:3000/admin/closing', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('--- ADMIN CLOSING ---');
    console.log('Status code:', res.statusCode);
    console.log('Contains 5.134.000 (Total Target):', data.includes('5.134.000'));
    console.log('Contains 1.875.000 (Realisasi Kas):', data.includes('1.875.000'));
    console.log('Contains 56 Unit:', data.includes('56 Unit'));
  });
});

http.get('http://localhost:3000/warga/dashboard', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('--- WARGA DASHBOARD ---');
    console.log('Status code:', res.statusCode);
    console.log('Contains 9.933.500 (Saldo Kas Terbuka):', data.includes('9.933.500'));
    console.log('Contains RT.03 RW.14:', data.includes('RT.03 RW.14'));
  });
});
