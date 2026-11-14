const { getAllKasPeriods } = require('./src/lib/data/storeKas');

const periods = getAllKasPeriods();
periods.forEach(p => {
  console.log(`\n--- PERIODE ${p.nama} (${p.status}) ---`);
  const tagihan = p.tagihan || [];
  const totIuran = tagihan.reduce((acc, c) => acc + (c.iuran_pokok || 0), 0);
  const totRonda = tagihan.reduce((acc, c) => acc + (c.denda_ronda || 0), 0);
  const totKB = tagihan.reduce((acc, c) => acc + (c.denda_kerja_bakti || 0), 0);
  const totTagihan = tagihan.reduce((acc, c) => acc + (c.total_tagihan || 0), 0);
  const totBayar = tagihan.reduce((acc, c) => acc + (c.total_terbayar || 0), 0);
  const totTunggakan = tagihan.reduce((acc, c) => acc + (c.tunggakan_bulan_lalu || c.titipan_lalu || 0), 0);

  console.log(`Rows: ${tagihan.length}`);
  console.log(`Tot Iuran: ${totIuran}`);
  console.log(`Tot Denda Ronda: ${totRonda}`);
  console.log(`Tot Denda KB: ${totKB}`);
  console.log(`Tot Tunggakan/Titipan Lalu: ${totTunggakan}`);
  console.log(`Tot Tagihan: ${totTagihan}`);
  console.log(`Tot Bayar: ${totBayar}`);
});
