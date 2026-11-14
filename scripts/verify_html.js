const http = require('http');

http.get('http://localhost:3000/admin/warga', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    console.log('Content length:', data.length);
    console.log('Contains 56 Unit:', data.includes('56 Unit'));
    console.log('Contains 132 Jiwa:', data.includes('132 Jiwa'));
    console.log('Contains Yuli Ardinurman:', data.includes('Yuli Ardinurman'));
    console.log('Contains Tito:', data.includes('TITO'));
    console.log('Contains Nanang Dedi:', data.includes('Nanang Dedi Arianto'));
    console.log('Contains Database Supabase Sedang Dihubungkan:', data.includes('Database Supabase Sedang Dihubungkan'));
    console.log('Contains No KK:', data.includes('No KK'));
    console.log('Contains NIK:', data.includes('NIK'));
  });
});
