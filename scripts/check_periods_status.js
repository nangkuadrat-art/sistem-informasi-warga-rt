const fs = require('fs');
const d = JSON.parse(fs.readFileSync('src/lib/data/db_kas_periods.json', 'utf-8'));
d.periods.forEach(p => console.log(p.id, p.status, p.nama));
