const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/lib/data/db_kas_periods.json', 'utf-8'));

data.periods.forEach(p => {
  console.log(`\n=== PERIODE ${p.nama} ===`);
  const tagihan = p.tagihan || [];
  let totTunggakan = 0;
  let totTitipan = 0;

  tagihan.forEach(t => {
    const tunggakan = Number(t.tunggakan_bulan_lalu || 0);
    const titipan = Number(t.titipan_bulan_lalu !== undefined ? t.titipan_bulan_lalu : (t.titipan_lalu || 0));
    totTunggakan += tunggakan;
    totTitipan += titipan;

    if (tunggakan > 0 || titipan > 0) {
      console.log(`Unit ${t.no_unit} (${t.nama_warga}): Tunggakan=${tunggakan}, Titipan=${titipan}`);
    }
  });

  console.log(`Total Tunggakan: ${totTunggakan}`);
  console.log(`Total Titipan: ${totTitipan}`);
});
