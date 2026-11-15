const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'src', 'lib', 'data', 'db_kas_periods.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

function allocatePayment(t) {
  const rem = Number(t.total_terbayar || 0);
  const netTagihan = Number(t.total_tagihan || 0);
  const excess = Math.max(0, rem - netTagihan);
  let billRem = rem - excess;

  const tunggakanDue = Number(t.tunggakan_bulan_lalu || 0);
  const pokokRaw = Number(t.iuran_pokok || 0);
  const rondaDue = Number(t.denda_ronda || 0);
  const kbDue = Number(t.denda_kerja_bakti || 0);

  const totalGrossDue = tunggakanDue + pokokRaw + rondaDue + kbDue;
  const discountFromTitipan = Math.max(0, totalGrossDue - netTagihan);

  const tunggakanPaid = Math.min(billRem, tunggakanDue);
  billRem -= tunggakanPaid;

  const pokokEffectiveDue = Math.max(0, pokokRaw - discountFromTitipan);
  const pokokPaid = Math.min(billRem, pokokEffectiveDue);
  billRem -= pokokPaid;

  const rondaPaid = Math.min(billRem, rondaDue);
  billRem -= rondaPaid;

  const kbPaid = Math.min(billRem, kbDue);
  billRem -= kbPaid;

  const titipanPaid = excess + billRem;

  return {
    tunggakanPaid,
    pokokPaid,
    rondaPaid,
    kbPaid,
    titipanPaid,
    donatur: Number(t.donatur || 0),
  };
}

function buildBreakdownTransaksi(period) {
  const monthCode = period.bulan === 9 ? 'sep' : period.bulan === 10 ? 'okt' : `${period.bulan}`;
  const defaultEndDate = `${period.tahun}-${String(period.bulan).padStart(2, '0')}-${period.bulan === 9 ? '30' : '31'}`;

  const saldoAwalTx = (period.transaksi || []).filter((tx) => tx.kategori === 'saldo_awal');
  const keluarTx = (period.transaksi || []).filter((tx) => tx.jenis === 'keluar');

  const incomeTx = [];

  for (const t of period.tagihan || []) {
    const a = allocatePayment(t);
    const tgl = t.tanggal_pembayaran || defaultEndDate;
    const labelUnit = `${t.nama_warga} (${t.alamat})`;

    // 1. Donasi / Donatur Kas
    if (a.donatur > 0) {
      incomeTx.push({
        id: `tx-${monthCode}-don-${t.no_unit}`,
        tanggal_transaksi: tgl,
        keterangan: `Donasi Kas RT: ${labelUnit}`,
        jenis: 'masuk',
        kategori: 'donasi',
        sub_kategori: 'donasi',
        nominal: a.donatur,
        rincian: { donasi: a.donatur },
      });
    }

    // 2. Iuran Warga (Iuran Pokok + Pelunasan/Angsuran Tunggakan)
    const iuranTotal = a.pokokPaid + a.tunggakanPaid;
    if (iuranTotal > 0) {
      let detail = 'Iuran Pokok';
      let subKat = 'iuran_pokok';
      if (a.pokokPaid > 0 && a.tunggakanPaid > 0) {
        detail = 'Iuran Pokok & Pelunasan Tunggakan';
        subKat = 'iuran_dan_tunggakan';
      } else if (a.tunggakanPaid > 0) {
        detail = 'Angsuran / Pelunasan Tunggakan';
        subKat = 'tunggakan';
      }
      incomeTx.push({
        id: `tx-${monthCode}-iuran-${t.no_unit}`,
        tanggal_transaksi: tgl,
        keterangan: `Iuran Warga (${detail}): ${labelUnit}`,
        jenis: 'masuk',
        kategori: 'iuran_warga',
        sub_kategori: subKat,
        nominal: iuranTotal,
        rincian: {
          iuran_pokok: a.pokokPaid,
          tunggakan: a.tunggakanPaid,
        },
      });
    }

    // 3. Masukan Lainnya (Denda Ronda, Denda Kerja Bakti, Titipan / Lebih Bayar)
    const dendaTotal = a.rondaPaid + a.kbPaid;
    if (dendaTotal > 0) {
      const parts = [];
      if (a.rondaPaid > 0) parts.push('Denda Ronda');
      if (a.kbPaid > 0) parts.push('Denda Kerja Bakti');
      incomeTx.push({
        id: `tx-${monthCode}-denda-${t.no_unit}`,
        tanggal_transaksi: tgl,
        keterangan: `Masukan Lainnya (${parts.join(' & ')}): ${labelUnit}`,
        jenis: 'masuk',
        kategori: 'masukan_lainnya',
        sub_kategori: 'denda_ronda_kb',
        nominal: dendaTotal,
        rincian: {
          denda_ronda: a.rondaPaid,
          denda_kb: a.kbPaid,
        },
      });
    }

    if (a.titipanPaid > 0) {
      incomeTx.push({
        id: `tx-${monthCode}-titipan-${t.no_unit}`,
        tanggal_transaksi: tgl,
        keterangan: `Masukan Lainnya (Titipan Deposit Lebih Bayar): ${labelUnit}`,
        jenis: 'masuk',
        kategori: 'masukan_lainnya',
        sub_kategori: 'titipan_deposit',
        nominal: a.titipanPaid,
        rincian: {
          titipan: a.titipanPaid,
        },
      });
    }
  }

  // Urutkan pemasukan berdasarkan tanggal kronologis, lalu donasi -> iuran -> masukan lainnya
  const prio = { donasi: 1, iuran_warga: 2, masukan_lainnya: 3 };
  incomeTx.sort((x, y) => {
    const cmpDate = x.tanggal_transaksi.localeCompare(y.tanggal_transaksi);
    if (cmpDate !== 0) return cmpDate;
    return (prio[x.kategori] || 9) - (prio[y.kategori] || 9);
  });

  period.transaksi = [...saldoAwalTx, ...incomeTx, ...keluarTx];

  const totalMasuk = period.transaksi
    .filter((tx) => tx.jenis === 'masuk' && tx.kategori !== 'saldo_awal')
    .reduce((s, tx) => s + Number(tx.nominal || 0), 0);
  const totalKeluar = period.transaksi
    .filter((tx) => tx.jenis === 'keluar')
    .reduce((s, tx) => s + Number(tx.nominal || 0), 0);

  return {
    id: period.id,
    prevTotalMasuk: period.total_masuk,
    newTotalMasuk: totalMasuk,
    prevTotalKeluar: period.total_keluar,
    newTotalKeluar: totalKeluar,
    prevSaldoAkhir: period.saldo_akhir,
    newSaldoAkhir: Number(period.saldo_awal) + totalMasuk - totalKeluar,
    countTx: period.transaksi.length,
    countsByCat: {
      donasi: incomeTx.filter((x) => x.kategori === 'donasi').length,
      iuran_warga: incomeTx.filter((x) => x.kategori === 'iuran_warga').length,
      masukan_lainnya: incomeTx.filter((x) => x.kategori === 'masukan_lainnya').length,
      keluar: keluarTx.length,
    },
    totalsByCat: {
      donasi: incomeTx.filter((x) => x.kategori === 'donasi').reduce((s, x) => s + x.nominal, 0),
      iuran_warga: incomeTx.filter((x) => x.kategori === 'iuran_warga').reduce((s, x) => s + x.nominal, 0),
      masukan_lainnya: incomeTx.filter((x) => x.kategori === 'masukan_lainnya').reduce((s, x) => s + x.nominal, 0),
    },
  };
}

const results = [];
for (const p of db.periods) {
  results.push(buildBreakdownTransaksi(p));
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log(JSON.stringify(results, null, 2));
