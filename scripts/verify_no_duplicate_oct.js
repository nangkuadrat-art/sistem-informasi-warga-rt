const http = require('http');

http.get('http://localhost:3000/admin/closing', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Count occurrences of "Oktober 2026"
    const matches = data.match(/Oktober 2026/g);
    console.log('Occurrences of "Oktober 2026" in HTML:', matches ? matches.length : 0);
    // Count how many buttons in selector:
    const sepBtn = data.includes('/admin/closing?periode=periode-sep-2026');
    const oktBtn = data.includes('/admin/closing?periode=periode-okt-2026');
    const duplicateOktBtn = data.includes('/admin/closing?periode=periode-10-2026');
    console.log('September tab present:', sepBtn);
    console.log('Oktober (periode-okt-2026) tab present:', oktBtn);
    console.log('Duplicate Oktober (periode-10-2026) tab present:', duplicateOktBtn);
  });
}).on('error', (err) => console.error(err));
