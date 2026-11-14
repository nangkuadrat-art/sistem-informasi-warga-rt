const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.cwd(), 'src/lib/data/db_kas_periods.json');
const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

console.log('Periods before cleanup:', data.periods.map(p => ({ id: p.id, nama: p.nama, status: p.status })));

// Hapus periode-10-2026 (duplikat yang terbuat saat uji coba executeClosing)
data.periods = data.periods.filter(p => p.id !== 'periode-10-2026');

// Pastikan hanya ada 1 September dan 1 Oktober
console.log('Periods after cleanup:', data.periods.map(p => ({ id: p.id, nama: p.nama, status: p.status })));

fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
console.log('Cleaned up duplicate successfully!');
