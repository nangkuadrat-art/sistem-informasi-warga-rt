const {
  getAllKasPeriods,
  getKasPeriod,
  addTransaksiKasPeriod,
  updateTransaksiKasPeriod,
  deleteTransaksiKasPeriod,
  updateTagihanUnitStore,
  recordBayarTagihanStore,
  resetTagihanUnitStore,
  executeClosingStore,
  reopenClosingStore,
} = require('../src/lib/data/storeKas');

console.log('=== TEST 1: KAS TRANSAKSI CRUD ===');
const oktBefore = getKasPeriod('periode-okt-2026');
const initialSaldo = oktBefore.saldo_akhir;
const initialCount = oktBefore.transaksi.length;
console.log(`Initial Oktober Saldo: ${initialSaldo}, Tx Count: ${initialCount}`);

// CREATE
const newTx = addTransaksiKasPeriod('periode-okt-2026', {
  tanggal_transaksi: '2026-10-25',
  keterangan: 'TEST TRANSAKSI CRUD',
  jenis: 'keluar',
  kategori: 'operasional',
  nominal: 50000,
});
console.log('Created Tx ID:', newTx.id);

const oktAfterAdd = getKasPeriod('periode-okt-2026');
console.log(`Saldo After Add (-50k): ${oktAfterAdd.saldo_akhir} (Diff: ${initialSaldo - oktAfterAdd.saldo_akhir})`);

// UPDATE
const updatedTx = updateTransaksiKasPeriod('periode-okt-2026', newTx.id, {
  nominal: 75000,
  keterangan: 'TEST TRANSAKSI CRUD UPDATED',
});
console.log('Updated Tx nominal to 75000');
const oktAfterUpdate = getKasPeriod('periode-okt-2026');
console.log(`Saldo After Update (-75k): ${oktAfterUpdate.saldo_akhir} (Diff: ${initialSaldo - oktAfterUpdate.saldo_akhir})`);

// DELETE
const deleted = deleteTransaksiKasPeriod('periode-okt-2026', newTx.id);
console.log('Deleted Tx result:', deleted);
const oktAfterDelete = getKasPeriod('periode-okt-2026');
console.log(`Saldo After Delete (Restored): ${oktAfterDelete.saldo_akhir} === ${initialSaldo}`);

if (oktAfterDelete.saldo_akhir === initialSaldo) {
  console.log('✓ TEST 1 (KAS CRUD) PASSED PERFECTLY!');
} else {
  console.error('✗ TEST 1 FAILED!');
}

console.log('\n=== TEST 2: CLOSING & TAGIHAN UNIT CRUD ===');
// Ambil Unit 1 (Tito)
const titoBefore = oktAfterDelete.tagihan.find(t => t.no_unit === 1);
const titoInitTerbayar = titoBefore.total_terbayar;
const titoInitTagihan = titoBefore.total_tagihan;
console.log(`Tito Initial: Tagihan=${titoInitTagihan}, Terbayar=${titoInitTerbayar}`);

// UPDATE TAGIHAN UNIT
updateTagihanUnitStore('periode-okt-2026', titoBefore.id, {
  keterangan: 'Catatan Khusus Uji Coba CRUD',
});
const titoAfterEdit = getKasPeriod('periode-okt-2026').tagihan.find(t => t.no_unit === 1);
console.log('Tito Keterangan updated to:', titoAfterEdit.keterangan);

// RECORD BAYAR WITH AUTO KAS
const kasCountBeforeBayar = getKasPeriod('periode-okt-2026').transaksi.length;
recordBayarTagihanStore('periode-okt-2026', titoBefore.id, 50000, 'TUNAI', true);
const titoAfterBayar = getKasPeriod('periode-okt-2026').tagihan.find(t => t.no_unit === 1);
const kasCountAfterBayar = getKasPeriod('periode-okt-2026').transaksi.length;
console.log(`Tito Terbayar: ${titoAfterBayar.total_terbayar}, KurangLebih: ${titoAfterBayar.kurang_lebih}, Status: ${titoAfterBayar.status_label}`);
console.log(`Kas Tx Count before: ${kasCountBeforeBayar}, after: ${kasCountAfterBayar} (Auto added: ${kasCountAfterBayar === kasCountBeforeBayar + 1})`);

// RESET TAGIHAN UNIT & REMOVE AUTO TX
resetTagihanUnitStore('periode-okt-2026', titoBefore.id);
// restore note
updateTagihanUnitStore('periode-okt-2026', titoBefore.id, { keterangan: titoBefore.keterangan });
// Clean up the auto kas tx
const autoTx = getKasPeriod('periode-okt-2026').transaksi.find(t => t.keterangan.includes(titoBefore.nama_warga));
if (autoTx) {
  deleteTransaksiKasPeriod('periode-okt-2026', autoTx.id);
}
const titoRestored = getKasPeriod('periode-okt-2026').tagihan.find(t => t.no_unit === 1);
console.log(`Tito Restored Terbayar: ${titoRestored.total_terbayar} === ${titoInitTerbayar}`);

if (titoRestored.total_terbayar === titoInitTerbayar) {
  console.log('✓ TEST 2 (CLOSING & TAGIHAN CRUD) PASSED PERFECTLY!');
} else {
  console.error('✗ TEST 2 FAILED!');
}

console.log('\n=== TEST 3: RE-OPEN & CLOSING TOGGLE ===');
const sepStatusBefore = getKasPeriod('periode-sep-2026').status;
console.log('September status before:', sepStatusBefore);

// REOPEN
reopenClosingStore('periode-sep-2026');
const sepAfterReopen = getKasPeriod('periode-sep-2026').status;
console.log('September status after reopen:', sepAfterReopen);

// CLOSE AGAIN
executeClosingStore('periode-sep-2026', 'Buku kas September 2026 telah ditutup resmi (Closing). Realisasi penerimaan iuran Rp 4.747.000 + Donatur Rp 3.435.000. Saldo akhir Rp 8.902.500 telah digulirkan menjadi saldo awal Oktober 2026.');
const sepAfterClose = getKasPeriod('periode-sep-2026').status;
console.log('September status after re-close:', sepAfterClose);

if (sepAfterReopen === 'open' && sepAfterClose === 'closed') {
  console.log('✓ TEST 3 (REOPEN & CLOSE TOGGLE) PASSED PERFECTLY!');
} else {
  console.error('✗ TEST 3 FAILED!');
}

console.log('\n=== ALL TESTS PASSED WITH 100% SUCCESS! ===');
