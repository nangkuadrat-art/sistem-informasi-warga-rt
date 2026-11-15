const fs = require('fs');
const path = require('path');

const dbKas = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/lib/data/db_kas_periods.json'), 'utf-8'));
const okt = dbKas.periods.find(p => p.id === 'periode-okt-2026');

console.log('Units with Denda Ronda in Oktober 2026:');
okt.tagihan.filter(t => t.denda_ronda > 0).forEach(t => {
  console.log(`Unit ${t.no_unit} (${t.alamat}) - ${t.nama_warga}: Iuran=${t.iuran_pokok}, DendaRonda=${t.denda_ronda}, DendaKB=${t.denda_kerja_bakti}, TotalTagihan=${t.total_tagihan}`);
});
